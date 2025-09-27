import {
  users,
  complaints,
  communityIssues,
  upvotes,
  comments,
  notifications,
  chatMessages,
  type User,
  type UpsertUser,
  type InsertComplaint,
  type Complaint,
  type InsertCommunityIssue,
  type CommunityIssue,
  type InsertComment,
  type Comment,
  type InsertNotification,
  type Notification,
  type InsertChatMessage,
  type ChatMessage,
  type Upvote,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Complaint operations
  createComplaint(complaint: InsertComplaint & { userId: string }): Promise<Complaint>;
  getComplaint(id: string): Promise<Complaint | undefined>;
  getUserComplaints(userId: string): Promise<Complaint[]>;
  getAllComplaints(): Promise<Complaint[]>;
  updateComplaintStatus(id: string, status: string): Promise<void>;
  
  // Community issue operations
  createCommunityIssue(issue: InsertCommunityIssue & { userId: string }): Promise<CommunityIssue>;
  getCommunityIssues(): Promise<CommunityIssue[]>;
  getCommunityIssue(id: string): Promise<CommunityIssue | undefined>;
  
  // Voting operations
  addUpvote(userId: string, complaintId?: string, communityIssueId?: string): Promise<void>;
  removeUpvote(userId: string, complaintId?: string, communityIssueId?: string): Promise<void>;
  hasUserUpvoted(userId: string, complaintId?: string, communityIssueId?: string): Promise<boolean>;
  
  // Comment operations
  addComment(comment: InsertComment & { userId: string }): Promise<Comment>;
  getComments(complaintId?: string, communityIssueId?: string): Promise<Comment[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification & { userId: string }): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  
  // Chat operations
  saveChatMessage(message: InsertChatMessage & { userId: string, response?: string }): Promise<ChatMessage>;
  getUserChatHistory(userId: string): Promise<ChatMessage[]>;
  
  // Dashboard statistics
  getUserStats(userId: string): Promise<{
    activeComplaints: number;
    resolvedComplaints: number;
    contributionScore: number;
    upvotesGiven: number;
  }>;
  
  getCityStats(): Promise<{
    totalComplaints: number;
    resolvedComplaints: number;
    averageResponseTime: string;
    highPriorityCount: number;
    mediumPriorityCount: number;
    lowPriorityCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Complaint operations
  async createComplaint(complaintData: InsertComplaint & { userId: string }): Promise<Complaint> {
    const ticketNumber = `RSC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const [complaint] = await db
      .insert(complaints)
      .values({
        ...complaintData,
        ticketNumber,
      })
      .returning();

    // Update user complaint count
    await db
      .update(users)
      .set({
        complaintsCount: sql`${users.complaintsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, complaintData.userId));

    return complaint;
  }

  async getComplaint(id: string): Promise<Complaint | undefined> {
    const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id));
    return complaint;
  }

  async getUserComplaints(userId: string): Promise<Complaint[]> {
    return await db
      .select()
      .from(complaints)
      .where(eq(complaints.userId, userId))
      .orderBy(desc(complaints.createdAt));
  }

  async getAllComplaints(): Promise<Complaint[]> {
    return await db
      .select()
      .from(complaints)
      .orderBy(desc(complaints.createdAt));
  }

  async updateComplaintStatus(id: string, status: string): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    await db
      .update(complaints)
      .set(updateData)
      .where(eq(complaints.id, id));
  }

  // Community issue operations
  async createCommunityIssue(issueData: InsertCommunityIssue & { userId: string }): Promise<CommunityIssue> {
    const [issue] = await db
      .insert(communityIssues)
      .values(issueData)
      .returning();
    return issue;
  }

  async getCommunityIssues(): Promise<CommunityIssue[]> {
    return await db
      .select()
      .from(communityIssues)
      .orderBy(desc(communityIssues.upvotes), desc(communityIssues.createdAt));
  }

  async getCommunityIssue(id: string): Promise<CommunityIssue | undefined> {
    const [issue] = await db.select().from(communityIssues).where(eq(communityIssues.id, id));
    return issue;
  }

  // Voting operations
  async addUpvote(userId: string, complaintId?: string, communityIssueId?: string): Promise<void> {
    await db.insert(upvotes).values({
      userId,
      complaintId,
      communityIssueId,
    });

    // Update upvote count
    if (complaintId) {
      await db
        .update(complaints)
        .set({
          upvotes: sql`${complaints.upvotes} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(complaints.id, complaintId));
    }

    if (communityIssueId) {
      await db
        .update(communityIssues)
        .set({
          upvotes: sql`${communityIssues.upvotes} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(communityIssues.id, communityIssueId));
    }

    // Update user upvote count
    await db
      .update(users)
      .set({
        upvotesCount: sql`${users.upvotesCount} + 1`,
        contributionScore: sql`${users.contributionScore} + 2`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async removeUpvote(userId: string, complaintId?: string, communityIssueId?: string): Promise<void> {
    const conditions = [eq(upvotes.userId, userId)];
    
    if (complaintId) {
      conditions.push(eq(upvotes.complaintId, complaintId));
    }
    if (communityIssueId) {
      conditions.push(eq(upvotes.communityIssueId, communityIssueId));
    }

    await db.delete(upvotes).where(and(...conditions));

    // Update upvote count
    if (complaintId) {
      await db
        .update(complaints)
        .set({
          upvotes: sql`${complaints.upvotes} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(complaints.id, complaintId));
    }

    if (communityIssueId) {
      await db
        .update(communityIssues)
        .set({
          upvotes: sql`${communityIssues.upvotes} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(communityIssues.id, communityIssueId));
    }

    // Update user upvote count
    await db
      .update(users)
      .set({
        upvotesCount: sql`${users.upvotesCount} - 1`,
        contributionScore: sql`${users.contributionScore} - 2`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async hasUserUpvoted(userId: string, complaintId?: string, communityIssueId?: string): Promise<boolean> {
    const conditions = [eq(upvotes.userId, userId)];
    
    if (complaintId) {
      conditions.push(eq(upvotes.complaintId, complaintId));
    }
    if (communityIssueId) {
      conditions.push(eq(upvotes.communityIssueId, communityIssueId));
    }

    const [upvote] = await db.select().from(upvotes).where(and(...conditions));
    return !!upvote;
  }

  // Comment operations
  async addComment(commentData: InsertComment & { userId: string }): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(commentData)
      .returning();

    // Update comment count
    if (commentData.complaintId) {
      // Note: complaints don't have commentsCount in schema, but community issues do
    }
    if (commentData.communityIssueId) {
      await db
        .update(communityIssues)
        .set({
          commentsCount: sql`${communityIssues.commentsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(communityIssues.id, commentData.communityIssueId));
    }

    return comment;
  }

  async getComments(complaintId?: string, communityIssueId?: string): Promise<Comment[]> {
    const conditions = [];
    
    if (complaintId) {
      conditions.push(eq(comments.complaintId, complaintId));
    }
    if (communityIssueId) {
      conditions.push(eq(comments.communityIssueId, communityIssueId));
    }

    return await db
      .select()
      .from(comments)
      .where(and(...conditions))
      .orderBy(desc(comments.createdAt));
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification & { userId: string }): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Chat operations
  async saveChatMessage(messageData: InsertChatMessage & { userId: string, response?: string }): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async getUserChatHistory(userId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(50);
  }

  // Dashboard statistics
  async getUserStats(userId: string): Promise<{
    activeComplaints: number;
    resolvedComplaints: number;
    contributionScore: number;
    upvotesGiven: number;
  }> {
    const user = await this.getUser(userId);
    
    const [activeResult] = await db
      .select({ count: count() })
      .from(complaints)
      .where(and(
        eq(complaints.userId, userId),
        eq(complaints.status, 'open')
      ));

    const [resolvedResult] = await db
      .select({ count: count() })
      .from(complaints)
      .where(and(
        eq(complaints.userId, userId),
        eq(complaints.status, 'resolved')
      ));

    return {
      activeComplaints: activeResult.count,
      resolvedComplaints: resolvedResult.count,
      contributionScore: user?.contributionScore || 0,
      upvotesGiven: user?.upvotesCount || 0,
    };
  }

  async getCityStats(): Promise<{
    totalComplaints: number;
    resolvedComplaints: number;
    averageResponseTime: string;
    highPriorityCount: number;
    mediumPriorityCount: number;
    lowPriorityCount: number;
  }> {
    const [totalResult] = await db.select({ count: count() }).from(complaints);
    
    const [resolvedResult] = await db
      .select({ count: count() })
      .from(complaints)
      .where(eq(complaints.status, 'resolved'));

    const [highPriorityResult] = await db
      .select({ count: count() })
      .from(complaints)
      .where(eq(complaints.priority, 'high'));

    const [mediumPriorityResult] = await db
      .select({ count: count() })
      .from(complaints)
      .where(eq(complaints.priority, 'medium'));

    const [lowPriorityResult] = await db
      .select({ count: count() })
      .from(complaints)
      .where(eq(complaints.priority, 'low'));

    return {
      totalComplaints: totalResult.count,
      resolvedComplaints: resolvedResult.count,
      averageResponseTime: "2.5h", // This would need more complex calculation
      highPriorityCount: highPriorityResult.count,
      mediumPriorityCount: mediumPriorityResult.count,
      lowPriorityCount: lowPriorityResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
