import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupOAuth } from "./oauthAuth";
import { processChatMessage, generateComplaintSummary } from "./openai";
import { insertComplaintSchema, insertCommunityIssueSchema, insertCommentSchema, insertChatMessageSchema } from "@shared/schema";

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

// Combined authentication middleware - supports both Replit Auth and OAuth
const isAuthenticatedFlexible = async (req: any, res: any, next: any) => {
  // Check if user is authenticated via Replit Auth (has claims)
  if (req.user?.claims?.sub) {
    return next();
  }
  
  // Check if user is authenticated via OAuth (only if Passport is available)
  if (typeof req.isAuthenticated === 'function' && req.isAuthenticated() && req.user?.id) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};

// Helper to get user ID from either auth system
const getUserId = (req: any): string => {
  if (req.user?.claims?.sub) {
    return req.user.claims.sub; // Replit Auth
  }
  if (req.user?.id) {
    return req.user.id; // OAuth
  }
  throw new Error("No authenticated user found");
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup both auth systems
  await setupAuth(app);      // Replit Auth
  await setupOAuth(app);     // OAuth (Google/GitHub)

  // Auth routes - works with both authentication systems
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
  app.post('/api/chat', isAuthenticatedFlexible, async (req: any, res) => {
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
  app.post('/api/complaints', isAuthenticatedFlexible, upload.array('media'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const complaintData = insertComplaintSchema.parse(req.body);

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

      const complaint = await storage.createComplaint({
        ...complaintData,
        title: title || `${complaintData.category} Issue`,
        userId,
        mediaUrls
      });

      // Create notification for user
      await storage.createNotification({
        userId,
        title: "Complaint Registered",
        message: `Your complaint has been registered with ticket number ${complaint.ticketNumber}`,
        type: "complaint_update",
        relatedId: complaint.id
      });

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
      res.json(complaints);
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
      }

      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating complaint status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Community issue routes
  app.post('/api/community-issues', isAuthenticatedFlexible, upload.array('media'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const issueData = insertCommunityIssueSchema.parse(req.body);

      const mediaUrls = req.files ? req.files.map((file: any) => `/uploads/${file.filename}`) : [];

      const issue = await storage.createCommunityIssue({
        ...issueData,
        userId,
        mediaUrls
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
      res.json(issues);
    } catch (error) {
      console.error("Error fetching community issues:", error);
      res.status(500).json({ message: "Failed to fetch community issues" });
    }
  });

  // Upvote routes
  app.post('/api/upvote', isAuthenticatedFlexible, async (req: any, res) => {
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

  // Comment routes
  app.post('/api/comments', isAuthenticatedFlexible, async (req: any, res) => {
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

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
