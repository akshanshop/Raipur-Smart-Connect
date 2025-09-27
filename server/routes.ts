import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Chat routes
  app.post('/api/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/chat/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getUserChatHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Complaint routes
  app.post('/api/complaints', isAuthenticated, upload.array('media'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/complaints', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.patch('/api/complaints/:id/status', isAuthenticated, async (req, res) => {
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
  app.post('/api/community-issues', isAuthenticated, upload.array('media'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post('/api/upvote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/upvote/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post('/api/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Dashboard stats routes
  app.get('/api/stats/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  // Serve uploaded files
  app.use('/uploads', require('express').static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
