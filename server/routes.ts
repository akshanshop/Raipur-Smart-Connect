import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupOAuth } from "./oauthAuth";
import { processChatMessage, generateComplaintSummary } from "./openai";
import { detectSpam, detectCommunityIssueSpam } from "./spamDetection";
import { insertComplaintSchema, insertCommunityIssueSchema, insertCommentSchema, insertChatMessageSchema } from "@shared/schema";
import { 
  rateLimit, 
  validateCommentContent, 
  detectDuplicateSubmission,
  getSecurityStats,
  getRecentActivities,
  unblockUser,
  unblockIP
} from "./security";
import { sendSMS } from "./services/messaging";
import { sendEmail } from "./services/email";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// OAuth authentication middleware
const isAuthenticatedFlexible = async (req: any, res: any, next: any) => {
  // Check if user is authenticated via OAuth
  if (typeof req.isAuthenticated === 'function' && req.isAuthenticated() && req.user?.id) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};

// Helper to get user ID from OAuth
const getUserId = (req: any): string => {
  if (req.user?.id) {
    return req.user.id;
  }
  throw new Error("No authenticated user found");
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup OAuth authentication (Google/GitHub)
  await setupOAuth(app);

  // Logout route - redirect to OAuth logout
  app.get('/api/logout', (req, res) => {
    res.redirect('/api/auth/oauth/logout');
  });

  // Auth routes - works with OAuth authentication
  app.get('/api/auth/user', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Chat routes
  app.post('/api/chat', isAuthenticatedFlexible, rateLimit('chat'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { message, language = 'en' } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await processChatMessage(message, language, userId);
      
      // Save the chat message
      await storage.saveChatMessage({
        userId,
        message,
        response: response.message,
        language
      });

      res.json(response);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get('/api/chat/history', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const history = await storage.getUserChatHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Complaint routes
  app.post('/api/complaints', isAuthenticatedFlexible, rateLimit('complaints'), detectDuplicateSubmission('complaint'), upload.array('media'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Extract email and phone number from request body (not part of complaint schema)
      // These will be used for notifications but won't update the user's profile
      const { email, phoneNumber, ...complaintFields } = req.body;
      const complaintData = insertComplaintSchema.parse(complaintFields);

      // Handle uploaded files
      const mediaUrls = req.files ? req.files.map((file: any) => `/uploads/${file.filename}`) : [];
      
      // Generate title if not provided
      let title = complaintData.title;
      if (!title && complaintData.description) {
        title = await generateComplaintSummary(
          complaintData.description,
          complaintData.category,
          complaintData.location
        );
      }

      // AI Spam Detection
      const spamAnalysis = await detectSpam(
        title || `${complaintData.category} Issue`,
        complaintData.description,
        complaintData.category,
        complaintData.location
      );

      // If spam detected with high confidence, reject and notify user
      if (spamAnalysis.isSpam && spamAnalysis.confidence > 0.7) {
        await storage.createNotification({
          userId,
          title: "⚠️ Complaint Rejected - Spam Detected",
          message: `Your complaint was automatically rejected by our AI system. Reason: ${spamAnalysis.reason}. Category: ${spamAnalysis.category}. If you believe this is an error, please contact support.`,
          type: "alert",
          relatedId: null
        });

        return res.status(400).json({ 
          message: "Complaint rejected due to spam detection",
          reason: spamAnalysis.reason,
          category: spamAnalysis.category
        });
      }

      // Calculate priority based on nearby reports (within ~0.5km radius)
      const nearbyComplaints = await storage.getNearbyComplaints(
        parseFloat(complaintData.latitude),
        parseFloat(complaintData.longitude),
        0.005 // ~0.5km radius in degrees
      );

      const nearbyCount = nearbyComplaints.length;
      let priority: string;
      
      if (nearbyCount < 3) {
        priority = 'low';
      } else if (nearbyCount >= 3 && nearbyCount <= 7) {
        priority = 'medium';
      } else {
        priority = 'urgent';
      }

      const complaint = await storage.createComplaint({
        ...complaintData,
        title: title || `${complaintData.category} Issue`,
        priority,
        userId,
        mediaUrls
      });

      // Award tokens for filing a complaint
      await storage.awardTokens(userId, 10, 'complaint_filed', complaint.id);

      // Create notification for user
      await storage.createNotification({
        userId,
        title: "Complaint Registered",
        message: `Your complaint has been registered with ticket number ${complaint.ticketNumber}. You earned 10 tokens!`,
        type: "complaint_update",
        relatedId: complaint.id
      });

      // Send SMS and Email notifications to the numbers provided in the form
      const user = await storage.getUser(userId);
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined;
      
      // Send SMS to the phone number entered in the form (if provided)
      if (phoneNumber) {
        await sendSMS(
          phoneNumber,
          'complaint_submitted',
          complaint.ticketNumber,
          complaint.title
        );
      }
      
      // Send Email to the email address entered in the form (if provided)
      if (email) {
        await sendEmail(
          email,
          'complaint_submitted',
          complaint.ticketNumber,
          complaint.title,
          userName
        );
      }

      res.json(complaint);
    } catch (error) {
      console.error("Error creating complaint:", error);
      res.status(500).json({ message: "Failed to create complaint" });
    }
  });

  app.get('/api/complaints', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const complaints = await storage.getUserComplaints(userId);
      res.json(complaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).json({ message: "Failed to fetch complaints" });
    }
  });

  app.get('/api/complaints/all', async (req, res) => {
    try {
      const complaints = await storage.getAllComplaints();
      
      // Get user data for each complaint
      const complaintsWithUserData = await Promise.all(
        complaints.map(async (complaint) => {
          const user = await storage.getUser(complaint.userId);
          return {
            ...complaint,
            userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Anonymous',
          };
        })
      );
      
      res.json(complaintsWithUserData);
    } catch (error) {
      console.error("Error fetching all complaints:", error);
      res.status(500).json({ message: "Failed to fetch complaints" });
    }
  });

  app.get('/api/complaints/:id', async (req, res) => {
    try {
      const complaint = await storage.getComplaint(req.params.id);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      res.json(complaint);
    } catch (error) {
      console.error("Error fetching complaint:", error);
      res.status(500).json({ message: "Failed to fetch complaint" });
    }
  });

  app.get('/api/complaints/nearby/:latitude/:longitude', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const latitude = parseFloat(req.params.latitude);
      const longitude = parseFloat(req.params.longitude);
      const radius = 7;

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      const nearbyComplaints = await storage.getNearbyComplaints(latitude, longitude, radius);
      
      const complaintsWithUserDataAndVotes = await Promise.all(
        nearbyComplaints.map(async (complaint) => {
          const user = await storage.getUser(complaint.userId);
          const userVote = await storage.getUserVote(userId, complaint.id, undefined);
          
          return {
            ...complaint,
            userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Anonymous',
            userVote,
          };
        })
      );
      
      res.json(complaintsWithUserDataAndVotes);
    } catch (error) {
      console.error("Error fetching nearby complaints:", error);
      res.status(500).json({ message: "Failed to fetch nearby complaints" });
    }
  });

  app.patch('/api/complaints/:id/status', isAuthenticatedFlexible, async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateComplaintStatus(req.params.id, status);
      
      const complaint = await storage.getComplaint(req.params.id);
      if (complaint) {
        await storage.createNotification({
          userId: complaint.userId,
          title: "Complaint Status Updated",
          message: `Your complaint ${complaint.ticketNumber} status has been updated to ${status}`,
          type: "status_change",
          relatedId: complaint.id
        });

        // Send SMS and Email notifications based on status
        const user = await storage.getUser(complaint.userId);
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined;
        
        if (user?.phoneNumber) {
          if (status === 'in_progress') {
            await sendSMS(
              user.phoneNumber,
              'complaint_in_progress',
              complaint.ticketNumber,
              complaint.title
            );
          } else if (status === 'resolved' || status === 'closed') {
            await sendSMS(
              user.phoneNumber,
              'complaint_resolved',
              complaint.ticketNumber,
              complaint.title
            );
          }
        }
        
        if (user?.email) {
          if (status === 'in_progress') {
            await sendEmail(
              user.email,
              'complaint_in_progress',
              complaint.ticketNumber,
              complaint.title,
              userName
            );
          } else if (status === 'resolved' || status === 'closed') {
            await sendEmail(
              user.email,
              'complaint_resolved',
              complaint.ticketNumber,
              complaint.title,
              userName
            );
          }
        }
      }

      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating complaint status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Community issue routes
  app.post('/api/community-issues', isAuthenticatedFlexible, rateLimit('complaints'), detectDuplicateSubmission('issue'), upload.array('media'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const issueData = insertCommunityIssueSchema.parse(req.body);

      const mediaUrls = req.files ? req.files.map((file: any) => `/uploads/${file.filename}`) : [];

      // AI Spam Detection for community issues
      const spamAnalysis = await detectCommunityIssueSpam(
        issueData.title,
        issueData.description,
        issueData.category
      );

      // If spam detected with high confidence, reject and notify user
      if (spamAnalysis.isSpam && spamAnalysis.confidence > 0.7) {
        await storage.createNotification({
          userId,
          title: "⚠️ Community Post Rejected - Spam Detected",
          message: `Your community post was automatically rejected by our AI system. Reason: ${spamAnalysis.reason}. Category: ${spamAnalysis.category}. If you believe this is an error, please contact support.`,
          type: "alert",
          relatedId: null
        });

        return res.status(400).json({ 
          message: "Community post rejected due to spam detection",
          reason: spamAnalysis.reason,
          category: spamAnalysis.category
        });
      }

      const issue = await storage.createCommunityIssue({
        ...issueData,
        userId,
        mediaUrls
      });

      // Award tokens for posting a community issue
      await storage.awardTokens(userId, 5, 'issue_posted', issue.id);

      // Create notification for user
      await storage.createNotification({
        userId,
        title: "Community Issue Posted",
        message: `Your community issue "${issue.title}" has been posted successfully. You earned 5 tokens!`,
        type: "complaint_update",
        relatedId: issue.id
      });

      res.json(issue);
    } catch (error) {
      console.error("Error creating community issue:", error);
      res.status(500).json({ message: "Failed to create community issue" });
    }
  });

  app.get('/api/community-issues', async (req, res) => {
    try {
      const issues = await storage.getCommunityIssues();
      
      // Get user data for each community issue
      const issuesWithUserData = await Promise.all(
        issues.map(async (issue) => {
          const user = await storage.getUser(issue.userId);
          return {
            ...issue,
            userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Anonymous',
          };
        })
      );
      
      res.json(issuesWithUserData);
    } catch (error) {
      console.error("Error fetching community issues:", error);
      res.status(500).json({ message: "Failed to fetch community issues" });
    }
  });

  // Upvote routes
  app.post('/api/upvote', isAuthenticatedFlexible, rateLimit('upvotes'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { complaintId, communityIssueId } = req.body;

      const hasUpvoted = await storage.hasUserUpvoted(userId, complaintId, communityIssueId);
      
      if (hasUpvoted) {
        await storage.removeUpvote(userId, complaintId, communityIssueId);
        res.json({ action: 'removed' });
      } else {
        await storage.addUpvote(userId, complaintId, communityIssueId);
        res.json({ action: 'added' });
      }
    } catch (error) {
      console.error("Error handling upvote:", error);
      res.status(500).json({ message: "Failed to process upvote" });
    }
  });

  app.get('/api/upvote/status', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { complaintId, communityIssueId } = req.query;

      const hasUpvoted = await storage.hasUserUpvoted(
        userId, 
        complaintId as string, 
        communityIssueId as string
      );
      
      res.json({ hasUpvoted });
    } catch (error) {
      console.error("Error checking upvote status:", error);
      res.status(500).json({ message: "Failed to check upvote status" });
    }
  });

  // New voting system routes (likes and dislikes)
  app.post('/api/vote', isAuthenticatedFlexible, rateLimit('upvotes'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { voteType, complaintId, communityIssueId } = req.body;

      if (!voteType || (voteType !== 'upvote' && voteType !== 'downvote')) {
        return res.status(400).json({ message: "Invalid vote type. Must be 'upvote' or 'downvote'" });
      }

      const currentVote = await storage.getUserVote(userId, complaintId, communityIssueId);
      
      if (currentVote === voteType) {
        await storage.removeVote(userId, complaintId, communityIssueId);
        res.json({ action: 'removed', voteType: null });
      } else {
        await storage.addVote(userId, voteType, complaintId, communityIssueId);
        res.json({ action: 'added', voteType });
      }
    } catch (error) {
      console.error("Error handling vote:", error);
      res.status(500).json({ message: "Failed to process vote" });
    }
  });

  app.get('/api/vote/status', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { complaintId, communityIssueId } = req.query;

      const voteType = await storage.getUserVote(
        userId, 
        complaintId as string, 
        communityIssueId as string
      );
      
      res.json({ voteType });
    } catch (error) {
      console.error("Error checking vote status:", error);
      res.status(500).json({ message: "Failed to check vote status" });
    }
  });

  // Comment routes
  app.post('/api/comments', isAuthenticatedFlexible, rateLimit('comments'), validateCommentContent, detectDuplicateSubmission('comment'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const commentData = insertCommentSchema.parse(req.body);

      const comment = await storage.addComment({
        ...commentData,
        userId
      });

      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/comments', async (req, res) => {
    try {
      const { complaintId, communityIssueId } = req.query;
      const comments = await storage.getComments(
        complaintId as string,
        communityIssueId as string
      );
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticatedFlexible, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticatedFlexible, async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Dashboard stats routes
  app.get('/api/stats/user', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get('/api/stats/city', async (req, res) => {
    try {
      const stats = await storage.getCityStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching city stats:", error);
      res.status(500).json({ message: "Failed to fetch city stats" });
    }
  });

  // Advanced analytics endpoints
  app.get('/api/analytics/complaints', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const includePersonal = req.query.personal === 'true';
      const analytics = await storage.getComplaintAnalytics(includePersonal ? userId : undefined);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching complaint analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Bulk operations endpoint
  app.post('/api/complaints/bulk-update', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const { ids, updates } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid complaint IDs" });
      }
      
      await storage.updateMultipleComplaints(ids, updates);
      
      res.json({ message: `Updated ${ids.length} complaints successfully` });
    } catch (error) {
      console.error("Error bulk updating complaints:", error);
      res.status(500).json({ message: "Failed to update complaints" });
    }
  });

  // Advanced filtering endpoint
  app.get('/api/complaints/search', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const filters = {
        category: req.query.category as string,
        priority: req.query.priority as string,
        status: req.query.status as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        location: req.query.location as string,
      };
      
      const complaints = await storage.getComplaintsByFilters(filters);
      res.json(complaints);
    } catch (error) {
      console.error("Error searching complaints:", error);
      res.status(500).json({ message: "Failed to search complaints" });
    }
  });

  // Priority escalation endpoint
  app.post('/api/complaints/:id/escalate', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const { priority, reason } = req.body;
      
      if (!priority || !reason) {
        return res.status(400).json({ message: "Priority and reason are required" });
      }
      
      await storage.escalateComplaint(req.params.id, priority, reason);
      res.json({ message: "Complaint escalated successfully" });
    } catch (error) {
      console.error("Error escalating complaint:", error);
      res.status(500).json({ message: "Failed to escalate complaint" });
    }
  });

  // Enhanced chatbot with more civic services
  app.post('/api/chat/civic-services', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { service, parameters } = req.body;
      
      let response;
      
      switch (service) {
        case 'bill-inquiry':
          response = {
            message: `Your current water bill is ₹${Math.floor(Math.random() * 1000) + 200}. Due date: ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
            type: 'info',
            actions: [{ label: 'Pay Now', action: 'payment', data: { amount: 450 } }]
          };
          break;
        case 'bus-schedule':
          response = {
            message: 'Next buses from your location: Bus #42 at 2:15 PM, Bus #18 at 2:30 PM, Bus #7 at 2:45 PM',
            type: 'info',
            actions: [{ label: 'Set Reminder', action: 'reminder', data: { time: '2:15 PM' } }]
          };
          break;
        case 'document-status':
          response = {
            message: 'Your birth certificate application is under review. Expected completion: 3-5 business days.',
            type: 'info'
          };
          break;
        default:
          response = await processChatMessage(parameters.message || 'Hello', parameters.language || 'en', userId);
      }
      
      await storage.saveChatMessage({
        userId,
        message: `Service: ${service}`,
        response: response.message,
        language: parameters.language || 'en'
      });
      
      res.json(response);
    } catch (error) {
      console.error("Civic services error:", error);
      res.status(500).json({ message: "Failed to process civic service request" });
    }
  });

  // Officials Dashboard API endpoints
  const isOfficial = async (req: any, res: any, next: any) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (user?.role === 'official') {
        return next();
      }
      return res.status(403).json({ message: "Access denied. Officials only." });
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Dashboard stats
  app.get('/api/officials/dashboard/stats', isAuthenticatedFlexible, isOfficial, async (req: any, res) => {
    try {
      const complaints = await storage.getAllComplaints();
      
      const stats = {
        total: complaints.length,
        solved: complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
        pending: complaints.filter(c => c.status === 'open').length,
        inProgress: complaints.filter(c => c.status === 'in_progress').length,
        byPriority: {
          urgent: complaints.filter(c => c.priority === 'urgent').length,
          high: complaints.filter(c => c.priority === 'high').length,
          medium: complaints.filter(c => c.priority === 'medium').length,
          low: complaints.filter(c => c.priority === 'low').length,
        },
        byCategory: complaints.reduce((acc: any, c) => {
          acc[c.category] = (acc[c.category] || 0) + 1;
          return acc;
        }, {}),
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Heatmap data
  app.get('/api/officials/dashboard/heatmap', isAuthenticatedFlexible, isOfficial, async (req: any, res) => {
    try {
      const complaints = await storage.getAllComplaints();
      
      const heatmapData = complaints
        .filter(c => c.latitude && c.longitude)
        .map(c => ({
          id: c.id,
          lat: parseFloat(c.latitude as string),
          lng: parseFloat(c.longitude as string),
          priority: c.priority,
          status: c.status,
          category: c.category,
          title: c.title,
        }));
      
      res.json(heatmapData);
    } catch (error) {
      console.error("Error fetching heatmap data:", error);
      res.status(500).json({ message: "Failed to fetch heatmap data" });
    }
  });

  // Get all issues for officials with enhanced data
  app.get('/api/officials/issues', isAuthenticatedFlexible, isOfficial, async (req: any, res) => {
    try {
      const complaints = await storage.getAllComplaints();
      
      // Get user data for each complaint
      const issuesWithUserData = await Promise.all(
        complaints.map(async (complaint) => {
          const user = await storage.getUser(complaint.userId);
          const complaintComments = await storage.getComments(complaint.id, undefined);
          
          return {
            ...complaint,
            userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown',
            userEmail: user?.email || 'N/A',
            commentsCount: complaintComments.length,
            upvotesCount: complaint.upvotes || 0,
          };
        })
      );
      
      res.json(issuesWithUserData);
    } catch (error) {
      console.error("Error fetching issues for officials:", error);
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  // Update issue status with resolution screenshots
  app.post('/api/officials/issues/:id/resolve', isAuthenticatedFlexible, isOfficial, upload.array('screenshots'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      // Handle uploaded resolution screenshots
      const screenshotUrls = req.files ? req.files.map((file: any) => `/uploads/${file.filename}`) : [];
      
      await storage.updateComplaint(id, {
        status: 'resolved',
        resolvedAt: new Date(),
        resolutionScreenshots: screenshotUrls,
      });
      
      // Create notification for the user
      const complaint = await storage.getComplaint(id);
      if (complaint) {
        await storage.createNotification({
          userId: complaint.userId,
          title: 'Issue Resolved',
          message: `Your complaint "${complaint.title}" has been resolved. ${notes || ''}`,
          type: 'complaint_update',
          relatedId: id,
        });

        // Send SMS notification to user
        try {
          const user = await storage.getUser(complaint.userId);
          if (user?.phoneNumber) {
            await sendSMS(
              user.phoneNumber,
              'complaint_resolved',
              complaint.ticketNumber,
              complaint.title
            );
          }
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
        }
      }
      
      res.json({ message: "Issue resolved successfully", screenshots: screenshotUrls });
    } catch (error) {
      console.error("Error resolving issue:", error);
      res.status(500).json({ message: "Failed to resolve issue" });
    }
  });

  // Delete issue
  app.delete('/api/officials/issues/:id', isAuthenticatedFlexible, isOfficial, async (req: any, res) => {
    try {
      await storage.deleteComplaint(req.params.id);
      res.json({ message: "Issue deleted successfully" });
    } catch (error) {
      console.error("Error deleting issue:", error);
      res.status(500).json({ message: "Failed to delete issue" });
    }
  });

  // Acknowledge/Assign complaint to official
  app.post('/api/officials/issues/:id/acknowledge', isAuthenticatedFlexible, isOfficial, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { id } = req.params;
      
      await storage.updateComplaint(id, {
        assignedTo: userId,
      });
      
      const complaint = await storage.getComplaint(id);
      if (complaint) {
        // Create notification
        await storage.createNotification({
          userId: complaint.userId,
          title: 'Complaint Acknowledged',
          message: `Nagar Nigam officials have acknowledged your complaint "${complaint.title}"`,
          type: 'complaint_update',
          relatedId: id,
        });

        // Send SMS notification
        const user = await storage.getUser(complaint.userId);
        if (user?.phoneNumber) {
          await sendSMS(
            user.phoneNumber,
            'complaint_acknowledged',
            complaint.ticketNumber,
            complaint.title
          );
        }
      }
      
      res.json({ message: "Complaint acknowledged successfully" });
    } catch (error) {
      console.error("Error acknowledging complaint:", error);
      res.status(500).json({ message: "Failed to acknowledge complaint" });
    }
  });

  // Security Management Endpoints (Officials Only)
  app.get('/api/officials/security/stats', isAuthenticatedFlexible, isOfficial, async (req: any, res) => {
    try {
      const stats = getSecurityStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching security stats:", error);
      res.status(500).json({ message: "Failed to fetch security stats" });
    }
  });

  app.get('/api/officials/security/activities', isAuthenticatedFlexible, isOfficial, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching security activities:", error);
      res.status(500).json({ message: "Failed to fetch security activities" });
    }
  });

  app.post('/api/officials/security/unblock-user', isAuthenticatedFlexible, isOfficial, async (req: any, res) => {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        return res.status(400).json({ message: "User identifier is required" });
      }
      const success = await unblockUser(identifier);
      res.json({ 
        message: success ? "User unblocked successfully" : "User not found or not blocked",
        success 
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  app.post('/api/officials/security/unblock-ip', isAuthenticatedFlexible, isOfficial, async (req: any, res) => {
    try {
      const { ip } = req.body;
      if (!ip) {
        return res.status(400).json({ message: "IP address is required" });
      }
      const success = await unblockIP(ip);
      res.json({ 
        message: success ? "IP unblocked successfully" : "IP not found in blocklist",
        success 
      });
    } catch (error) {
      console.error("Error unblocking IP:", error);
      res.status(500).json({ message: "Failed to unblock IP" });
    }
  });

  // Token and Reward Endpoints
  app.get('/api/tokens', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const tokens = await storage.getUserTokens(userId);
      res.json({ tokens });
    } catch (error) {
      console.error("Error fetching tokens:", error);
      res.status(500).json({ message: "Failed to fetch tokens" });
    }
  });

  app.get('/api/tokens/transactions', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const transactions = await storage.getTokenTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching token transactions:", error);
      res.status(500).json({ message: "Failed to fetch token transactions" });
    }
  });

  app.get('/api/rewards', async (req, res) => {
    try {
      const rewards = await storage.getActiveRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.post('/api/rewards/redeem', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { rewardId } = req.body;
      
      if (!rewardId) {
        return res.status(400).json({ message: "Reward ID is required" });
      }

      const redemption = await storage.redeemReward(userId, rewardId);
      res.json(redemption);
    } catch (error: any) {
      console.error("Error redeeming reward:", error);
      res.status(400).json({ message: error.message || "Failed to redeem reward" });
    }
  });

  app.get('/api/rewards/redemptions', isAuthenticatedFlexible, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const redemptions = await storage.getUserRedemptions(userId);
      res.json(redemptions);
    } catch (error) {
      console.error("Error fetching redemptions:", error);
      res.status(500).json({ message: "Failed to fetch redemptions" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
