import {
  users,
  complaints,
  communityIssues,
  upvotes,
  comments,
  notifications,
  chatMessages,
  tokenTransactions,
  rewards,
  rewardRedemptions,
  communities,
  communityMembers,
  officialJobs,
  tokenBonuses,
  userAchievements,
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
  type TokenTransaction,
  type Reward,
  type InsertReward,
  type RewardRedemption,
  type InsertRewardRedemption,
  type Community,
  type InsertCommunity,
  type CommunityMember,
  type InsertCommunityMember,
  type OfficialJob,
  type InsertOfficialJob,
  type TokenBonus,
  type InsertTokenBonus,
  type UserAchievement,
  type InsertUserAchievement,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql, ilike } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByOAuth(provider: string, oauthId: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Complaint operations
  createComplaint(complaint: InsertComplaint & { userId: string; priority?: string }): Promise<Complaint>;
  getComplaint(id: string): Promise<Complaint | undefined>;
  getUserComplaints(userId: string): Promise<Complaint[]>;
  getAllComplaints(): Promise<Complaint[]>;
  getNearbyComplaints(latitude: number, longitude: number, radius: number): Promise<Complaint[]>;
  updateComplaintStatus(id: string, status: string): Promise<void>;
  updateComplaint(id: string, updates: Partial<Complaint>): Promise<void>;
  deleteComplaint(id: string): Promise<void>;
  
  // Community issue operations
  createCommunityIssue(issue: InsertCommunityIssue & { userId: string }): Promise<CommunityIssue>;
  getCommunityIssues(): Promise<CommunityIssue[]>;
  getCommunityIssue(id: string): Promise<CommunityIssue | undefined>;
  
  // Voting operations
  addVote(userId: string, voteType: 'upvote' | 'downvote', complaintId?: string, communityIssueId?: string): Promise<void>;
  removeVote(userId: string, complaintId?: string, communityIssueId?: string): Promise<void>;
  getUserVote(userId: string, complaintId?: string, communityIssueId?: string): Promise<'upvote' | 'downvote' | null>;
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
  deleteNotification(id: string): Promise<void>;
  
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

  // Advanced analytics
  getComplaintAnalytics(userId?: string): Promise<{
    categoryCounts: Array<{ category: string; count: number }>;
    priorityDistribution: Array<{ priority: string; count: number }>;
    statusDistribution: Array<{ status: string; count: number }>;
    monthlyTrends: Array<{ month: string; count: number }>;
    responseTimeAnalytics: {
      average: number;
      fastest: number;
      slowest: number;
    };
  }>;

  // Bulk operations
  updateMultipleComplaints(ids: string[], updates: Partial<Complaint>): Promise<void>;
  getComplaintsByFilters(filters: {
    category?: string;
    priority?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    location?: string;
  }): Promise<Complaint[]>;

  // Priority escalation
  escalateComplaint(id: string, newPriority: string, reason: string): Promise<void>;

  // Token and Reward operations
  awardTokens(userId: string, amount: number, reason: string, relatedId?: string): Promise<void>;
  getUserTokens(userId: string): Promise<number>;
  getTokenTransactions(userId: string): Promise<TokenTransaction[]>;
  getAllRewards(): Promise<Reward[]>;
  getActiveRewards(): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  redeemReward(userId: string, rewardId: string): Promise<RewardRedemption>;
  getUserRedemptions(userId: string): Promise<RewardRedemption[]>;

  // Community Operations
  createCommunity(community: InsertCommunity & { creatorId: string }): Promise<Community>;
  getCommunity(id: string): Promise<Community | undefined>;
  getAllCommunities(): Promise<Community[]>;
  searchCommunities(query: string): Promise<Community[]>;
  getCommunitiesByCategory(category: string): Promise<Community[]>;
  updateCommunity(id: string, updates: Partial<Community>): Promise<void>;
  deleteCommunity(id: string): Promise<void>;
  getUserCommunities(userId: string): Promise<Community[]>;

  // Community Member Operations
  joinCommunity(userId: string, communityId: string, role?: string): Promise<CommunityMember>;
  leaveCommunity(userId: string, communityId: string): Promise<void>;
  getCommunityMembers(communityId: string): Promise<Array<CommunityMember & { user: User }>>;
  isMemberOfCommunity(userId: string, communityId: string): Promise<boolean>;
  updateMemberRole(communityId: string, userId: string, role: string): Promise<void>;

  // Official Job Operations
  createOfficialJob(job: InsertOfficialJob): Promise<OfficialJob>;
  getOfficialJob(id: string): Promise<OfficialJob | undefined>;
  getAllOfficialJobs(): Promise<OfficialJob[]>;
  getOfficialJobsByStatus(status: string): Promise<OfficialJob[]>;
  getAssignedJobs(officialId: string): Promise<OfficialJob[]>;
  assignJobToOfficial(jobId: string, officialId: string): Promise<void>;
  updateJobStatus(jobId: string, status: string, actualHours?: number): Promise<void>;
  updateOfficialJob(id: string, updates: Partial<OfficialJob>): Promise<void>;

  // Token Bonus Operations
  createTokenBonus(bonus: InsertTokenBonus & { userId: string }): Promise<TokenBonus>;
  getUserTokenBonuses(userId: string): Promise<TokenBonus[]>;
  getActiveTokenBonuses(userId: string): Promise<TokenBonus[]>;

  // Achievement Operations
  awardAchievement(userId: string, achievement: Omit<InsertUserAchievement, 'userId'>): Promise<UserAchievement>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  hasAchievement(userId: string, achievementType: string): Promise<boolean>;

  // Leaderboard Operations
  getTokenLeaderboard(limit?: number): Promise<Array<{ user: User; totalEarned: number; rank: number }>>;
  getUserRank(userId: string): Promise<number>;

  // Official Operations
  getAllOfficials(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByOAuth(provider: string, oauthId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.oauthProvider, provider), eq(users.oauthId, oauthId))
    );
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.email,
          set: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            oauthProvider: userData.oauthProvider,
            oauthId: userData.oauthId,
            role: userData.role,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    }

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          oauthProvider: userData.oauthProvider,
          oauthId: userData.oauthId,
          role: userData.role,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Complaint operations
  async createComplaint(complaintData: InsertComplaint & { userId: string; priority?: string }): Promise<Complaint> {
    const ticketNumber = `RSC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const [complaint] = await db
      .insert(complaints)
      .values({
        ...complaintData,
        priority: complaintData.priority || 'low',
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

  async getNearbyComplaints(latitude: number, longitude: number, radius: number): Promise<Complaint[]> {
    const allComplaints = await db.select().from(complaints);
    
    const nearbyComplaints = allComplaints.filter(complaint => {
      const complaintLat = parseFloat(complaint.latitude as string);
      const complaintLon = parseFloat(complaint.longitude as string);
      
      const R = 6371;
      const dLat = (complaintLat - latitude) * Math.PI / 180;
      const dLon = (complaintLon - longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(latitude * Math.PI / 180) * Math.cos(complaintLat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return distance <= radius;
    });
    
    return nearbyComplaints;
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

  async updateComplaint(id: string, updates: Partial<Complaint>): Promise<void> {
    await db
      .update(complaints)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(complaints.id, id));
  }

  async deleteComplaint(id: string): Promise<void> {
    // Delete related upvotes and comments first
    await db.delete(upvotes).where(eq(upvotes.complaintId, id));
    await db.delete(comments).where(eq(comments.complaintId, id));
    
    // Delete the complaint
    await db.delete(complaints).where(eq(complaints.id, id));
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

  async addVote(userId: string, voteType: 'upvote' | 'downvote', complaintId?: string, communityIssueId?: string): Promise<void> {
    const existingVote = await this.getUserVote(userId, complaintId, communityIssueId);
    
    if (existingVote === voteType) {
      return;
    }
    
    if (existingVote) {
      await this.removeVote(userId, complaintId, communityIssueId);
    }

    await db.insert(upvotes).values({
      userId,
      complaintId,
      communityIssueId,
      voteType,
    });

    const voteColumn = voteType === 'upvote' ? 'upvotes' : 'downvotes';
    
    if (complaintId) {
      await db
        .update(complaints)
        .set({
          [voteColumn]: sql`${complaints[voteColumn]} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(complaints.id, complaintId));
    }

    if (communityIssueId) {
      await db
        .update(communityIssues)
        .set({
          [voteColumn]: sql`${communityIssues[voteColumn]} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(communityIssues.id, communityIssueId));
    }

    if (voteType === 'upvote') {
      await db
        .update(users)
        .set({
          upvotesCount: sql`${users.upvotesCount} + 1`,
          contributionScore: sql`${users.contributionScore} + 2`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  }

  async removeVote(userId: string, complaintId?: string, communityIssueId?: string): Promise<void> {
    const voteType = await this.getUserVote(userId, complaintId, communityIssueId);
    
    if (!voteType) {
      return;
    }

    const conditions = [eq(upvotes.userId, userId)];
    
    if (complaintId) {
      conditions.push(eq(upvotes.complaintId, complaintId));
    }
    if (communityIssueId) {
      conditions.push(eq(upvotes.communityIssueId, communityIssueId));
    }

    await db.delete(upvotes).where(and(...conditions));

    const voteColumn = voteType === 'upvote' ? 'upvotes' : 'downvotes';
    
    if (complaintId) {
      await db
        .update(complaints)
        .set({
          [voteColumn]: sql`${complaints[voteColumn]} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(complaints.id, complaintId));
    }

    if (communityIssueId) {
      await db
        .update(communityIssues)
        .set({
          [voteColumn]: sql`${communityIssues[voteColumn]} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(communityIssues.id, communityIssueId));
    }

    if (voteType === 'upvote') {
      await db
        .update(users)
        .set({
          upvotesCount: sql`${users.upvotesCount} - 1`,
          contributionScore: sql`${users.contributionScore} - 2`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  }

  async getUserVote(userId: string, complaintId?: string, communityIssueId?: string): Promise<'upvote' | 'downvote' | null> {
    const conditions = [eq(upvotes.userId, userId)];
    
    if (complaintId) {
      conditions.push(eq(upvotes.complaintId, complaintId));
    }
    if (communityIssueId) {
      conditions.push(eq(upvotes.communityIssueId, communityIssueId));
    }

    const [vote] = await db.select().from(upvotes).where(and(...conditions));
    return vote ? (vote.voteType as 'upvote' | 'downvote') : null;
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

  async deleteNotification(id: string): Promise<void> {
    await db
      .delete(notifications)
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

  // Advanced analytics
  async getComplaintAnalytics(userId?: string): Promise<{
    categoryCounts: Array<{ category: string; count: number }>;
    priorityDistribution: Array<{ priority: string; count: number }>;
    statusDistribution: Array<{ status: string; count: number }>;
    monthlyTrends: Array<{ month: string; count: number }>;
    responseTimeAnalytics: {
      average: number;
      fastest: number;
      slowest: number;
    };
  }> {
    const baseQuery = userId ? 
      db.select().from(complaints).where(eq(complaints.userId, userId)) :
      db.select().from(complaints);
    
    // Category distribution
    const categoryData = await db
      .select({
        category: complaints.category,
        count: count(),
      })
      .from(complaints)
      .where(userId ? eq(complaints.userId, userId) : sql`true`)
      .groupBy(complaints.category);

    // Priority distribution
    const priorityData = await db
      .select({
        priority: complaints.priority,
        count: count(),
      })
      .from(complaints)
      .where(userId ? eq(complaints.userId, userId) : sql`true`)
      .groupBy(complaints.priority);

    // Status distribution
    const statusData = await db
      .select({
        status: complaints.status,
        count: count(),
      })
      .from(complaints)
      .where(userId ? eq(complaints.userId, userId) : sql`true`)
      .groupBy(complaints.status);

    // Monthly trends (last 6 months)
    const monthlyData = await db
      .select({
        month: sql<string>`to_char(${complaints.createdAt}, 'YYYY-MM')`,
        count: count(),
      })
      .from(complaints)
      .where(
        and(
          sql`${complaints.createdAt} >= now() - interval '6 months'`,
          userId ? eq(complaints.userId, userId) : sql`true`
        )
      )
      .groupBy(sql`to_char(${complaints.createdAt}, 'YYYY-MM')`);

    return {
      categoryCounts: categoryData,
      priorityDistribution: priorityData,
      statusDistribution: statusData,
      monthlyTrends: monthlyData,
      responseTimeAnalytics: {
        average: 2.5,
        fastest: 0.5,
        slowest: 24,
      },
    };
  }

  // Bulk operations
  async updateMultipleComplaints(ids: string[], updates: Partial<Complaint>): Promise<void> {
    await db
      .update(complaints)
      .set({ ...updates, updatedAt: new Date() })
      .where(sql`${complaints.id} = ANY(${ids})`);
  }

  async getComplaintsByFilters(filters: {
    category?: string;
    priority?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    location?: string;
  }): Promise<Complaint[]> {
    const conditions: any[] = [];
    
    if (filters.category) {
      conditions.push(eq(complaints.category, filters.category));
    }
    if (filters.priority) {
      conditions.push(eq(complaints.priority, filters.priority));
    }
    if (filters.status) {
      conditions.push(eq(complaints.status, filters.status));
    }
    if (filters.dateFrom) {
      conditions.push(sql`${complaints.createdAt} >= ${filters.dateFrom}`);
    }
    if (filters.dateTo) {
      conditions.push(sql`${complaints.createdAt} <= ${filters.dateTo}`);
    }
    if (filters.location) {
      conditions.push(sql`${complaints.location} ILIKE ${'%' + filters.location + '%'}`);
    }

    return await db
      .select()
      .from(complaints)
      .where(conditions.length > 0 ? and(...conditions) : sql`true`)
      .orderBy(desc(complaints.createdAt));
  }

  // Priority escalation
  async escalateComplaint(id: string, newPriority: string, reason: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Update complaint priority
      await tx
        .update(complaints)
        .set({ 
          priority: newPriority, 
          updatedAt: new Date() 
        })
        .where(eq(complaints.id, id));
      
      // Get complaint details for notification
      const [complaint] = await tx
        .select()
        .from(complaints)
        .where(eq(complaints.id, id));
      
      if (complaint) {
        // Create notification for user
        await tx.insert(notifications).values({
          userId: complaint.userId,
          title: `Complaint Priority Updated`,
          message: `Your complaint "${complaint.title}" has been escalated to ${newPriority} priority. Reason: ${reason}`,
          type: "status_change",
          relatedId: complaint.id,
        });
      }
    });
  }

  // Token and Reward operations
  async awardTokens(userId: string, amount: number, reason: string, relatedId?: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ 
          tokens: sql`${users.tokens} + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      await tx.insert(tokenTransactions).values({
        userId,
        amount,
        type: 'earned',
        reason,
        relatedId,
      });
    });
  }

  async getUserTokens(userId: string): Promise<number> {
    const [user] = await db.select({ tokens: users.tokens }).from(users).where(eq(users.id, userId));
    return user?.tokens || 0;
  }

  async getTokenTransactions(userId: string): Promise<TokenTransaction[]> {
    return await db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.userId, userId))
      .orderBy(desc(tokenTransactions.createdAt));
  }

  async getAllRewards(): Promise<Reward[]> {
    return await db.select().from(rewards).orderBy(rewards.tokenCost);
  }

  async getActiveRewards(): Promise<Reward[]> {
    return await db
      .select()
      .from(rewards)
      .where(eq(rewards.isActive, true))
      .orderBy(rewards.tokenCost);
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }

  async redeemReward(userId: string, rewardId: string): Promise<RewardRedemption> {
    return await db.transaction(async (tx) => {
      const [reward] = await tx.select().from(rewards).where(eq(rewards.id, rewardId));
      if (!reward) {
        throw new Error('Reward not found');
      }

      const [user] = await tx.select().from(users).where(eq(users.id, userId));
      if (!user) {
        throw new Error('User not found');
      }

      if ((user.tokens || 0) < reward.tokenCost) {
        throw new Error('Insufficient tokens');
      }

      await tx
        .update(users)
        .set({ 
          tokens: sql`${users.tokens} - ${reward.tokenCost}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      await tx.insert(tokenTransactions).values({
        userId,
        amount: -reward.tokenCost,
        type: 'spent',
        reason: 'reward_redeemed',
        relatedId: rewardId,
      });

      const [redemption] = await tx.insert(rewardRedemptions).values({
        userId,
        rewardId,
        tokensCost: reward.tokenCost,
      }).returning();

      return redemption;
    });
  }

  async getUserRedemptions(userId: string): Promise<RewardRedemption[]> {
    return await db
      .select()
      .from(rewardRedemptions)
      .where(eq(rewardRedemptions.userId, userId))
      .orderBy(desc(rewardRedemptions.createdAt));
  }

  // Community Operations
  async createCommunity(communityData: InsertCommunity & { creatorId: string }): Promise<Community> {
    const [community] = await db.transaction(async (tx) => {
      const [newCommunity] = await tx
        .insert(communities)
        .values(communityData)
        .returning();

      await tx.insert(communityMembers).values({
        communityId: newCommunity.id,
        userId: communityData.creatorId,
        role: 'admin',
      });

      await tx
        .update(communities)
        .set({ memberCount: 1 })
        .where(eq(communities.id, newCommunity.id));

      return [newCommunity];
    });

    return community;
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async getAllCommunities(): Promise<Community[]> {
    return await db
      .select()
      .from(communities)
      .where(eq(communities.isActive, true))
      .orderBy(desc(communities.memberCount), desc(communities.createdAt));
  }

  async searchCommunities(query: string): Promise<Community[]> {
    return await db
      .select()
      .from(communities)
      .where(
        and(
          eq(communities.isActive, true),
          sql`(${communities.name} ILIKE ${'%' + query + '%'} OR ${communities.description} ILIKE ${'%' + query + '%'})`
        )
      )
      .orderBy(desc(communities.memberCount));
  }

  async getCommunitiesByCategory(category: string): Promise<Community[]> {
    return await db
      .select()
      .from(communities)
      .where(
        and(
          eq(communities.isActive, true),
          eq(communities.category, category)
        )
      )
      .orderBy(desc(communities.memberCount));
  }

  async updateCommunity(id: string, updates: Partial<Community>): Promise<void> {
    await db
      .update(communities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(communities.id, id));
  }

  async deleteCommunity(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(communityMembers).where(eq(communityMembers.communityId, id));
      await tx.delete(communities).where(eq(communities.id, id));
    });
  }

  async getUserCommunities(userId: string): Promise<Community[]> {
    const memberships = await db
      .select({
        community: communities,
      })
      .from(communityMembers)
      .innerJoin(communities, eq(communityMembers.communityId, communities.id))
      .where(eq(communityMembers.userId, userId))
      .orderBy(desc(communities.memberCount));

    return memberships.map(m => m.community);
  }

  // Community Member Operations
  async joinCommunity(userId: string, communityId: string, role: string = 'member'): Promise<CommunityMember> {
    const [member] = await db.transaction(async (tx) => {
      const [newMember] = await tx
        .insert(communityMembers)
        .values({
          userId,
          communityId,
          role,
        })
        .returning();

      await tx
        .update(communities)
        .set({
          memberCount: sql`${communities.memberCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(communities.id, communityId));

      return [newMember];
    });

    return member;
  }

  async leaveCommunity(userId: string, communityId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(communityMembers)
        .where(
          and(
            eq(communityMembers.userId, userId),
            eq(communityMembers.communityId, communityId)
          )
        );

      await tx
        .update(communities)
        .set({
          memberCount: sql`${communities.memberCount} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(communities.id, communityId));
    });
  }

  async getCommunityMembers(communityId: string): Promise<Array<CommunityMember & { user: User }>> {
    const members = await db
      .select({
        id: communityMembers.id,
        communityId: communityMembers.communityId,
        userId: communityMembers.userId,
        role: communityMembers.role,
        joinedAt: communityMembers.joinedAt,
        user: users,
      })
      .from(communityMembers)
      .innerJoin(users, eq(communityMembers.userId, users.id))
      .where(eq(communityMembers.communityId, communityId))
      .orderBy(communityMembers.joinedAt);

    return members;
  }

  async isMemberOfCommunity(userId: string, communityId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, userId),
          eq(communityMembers.communityId, communityId)
        )
      );

    return !!member;
  }

  async updateMemberRole(communityId: string, userId: string, role: string): Promise<void> {
    await db
      .update(communityMembers)
      .set({ role })
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      );
  }

  // Official Job Operations
  async createOfficialJob(jobData: InsertOfficialJob): Promise<OfficialJob> {
    const [job] = await db
      .insert(officialJobs)
      .values(jobData)
      .returning();
    return job;
  }

  async getOfficialJob(id: string): Promise<OfficialJob | undefined> {
    const [job] = await db.select().from(officialJobs).where(eq(officialJobs.id, id));
    return job;
  }

  async getAllOfficialJobs(): Promise<OfficialJob[]> {
    return await db
      .select()
      .from(officialJobs)
      .orderBy(desc(officialJobs.createdAt));
  }

  async getOfficialJobsByStatus(status: string): Promise<OfficialJob[]> {
    return await db
      .select()
      .from(officialJobs)
      .where(eq(officialJobs.status, status))
      .orderBy(desc(officialJobs.createdAt));
  }

  async getAssignedJobs(officialId: string): Promise<OfficialJob[]> {
    return await db
      .select()
      .from(officialJobs)
      .where(eq(officialJobs.assignedOfficialId, officialId))
      .orderBy(desc(officialJobs.createdAt));
  }

  async assignJobToOfficial(jobId: string, officialId: string): Promise<void> {
    await db
      .update(officialJobs)
      .set({
        assignedOfficialId: officialId,
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(officialJobs.id, jobId));
  }

  async updateJobStatus(jobId: string, status: string, actualHours?: number): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (actualHours !== undefined) {
      updateData.actualHours = actualHours;
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    await db
      .update(officialJobs)
      .set(updateData)
      .where(eq(officialJobs.id, jobId));
  }

  async updateOfficialJob(id: string, updates: Partial<OfficialJob>): Promise<void> {
    await db
      .update(officialJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(officialJobs.id, id));
  }

  // Token Bonus Operations
  async createTokenBonus(bonusData: InsertTokenBonus & { userId: string }): Promise<TokenBonus> {
    const [bonus] = await db.transaction(async (tx) => {
      const [newBonus] = await tx
        .insert(tokenBonuses)
        .values(bonusData)
        .returning();

      await tx
        .update(users)
        .set({
          tokens: sql`${users.tokens} + ${bonusData.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, bonusData.userId));

      await tx.insert(tokenTransactions).values({
        userId: bonusData.userId,
        amount: bonusData.amount,
        type: 'earned',
        reason: bonusData.bonusType,
        relatedId: newBonus.id,
      });

      return [newBonus];
    });

    return bonus;
  }

  async getUserTokenBonuses(userId: string): Promise<TokenBonus[]> {
    return await db
      .select()
      .from(tokenBonuses)
      .where(eq(tokenBonuses.userId, userId))
      .orderBy(desc(tokenBonuses.createdAt));
  }

  async getActiveTokenBonuses(userId: string): Promise<TokenBonus[]> {
    return await db
      .select()
      .from(tokenBonuses)
      .where(
        and(
          eq(tokenBonuses.userId, userId),
          sql`(${tokenBonuses.expiresAt} IS NULL OR ${tokenBonuses.expiresAt} > NOW())`
        )
      )
      .orderBy(desc(tokenBonuses.createdAt));
  }

  // Achievement Operations
  async awardAchievement(userId: string, achievement: Omit<InsertUserAchievement, 'userId'>): Promise<UserAchievement> {
    const [newAchievement] = await db.transaction(async (tx) => {
      const [awarded] = await tx
        .insert(userAchievements)
        .values({
          ...achievement,
          userId,
        })
        .returning();

      if (achievement.tokensAwarded && achievement.tokensAwarded > 0) {
        await tx
          .update(users)
          .set({
            tokens: sql`${users.tokens} + ${achievement.tokensAwarded}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        await tx.insert(tokenTransactions).values({
          userId,
          amount: achievement.tokensAwarded,
          type: 'earned',
          reason: `achievement_${achievement.achievementType}`,
          relatedId: awarded.id,
        });
      }

      return [awarded];
    });

    return newAchievement;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));
  }

  async hasAchievement(userId: string, achievementType: string): Promise<boolean> {
    const [achievement] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementType, achievementType)
        )
      );

    return !!achievement;
  }

  // Leaderboard Operations
  async getTokenLeaderboard(limit: number = 10): Promise<Array<{ user: User; totalEarned: number; rank: number }>> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.tokens));

    const leaderboardData = await Promise.all(
      allUsers.slice(0, limit).map(async (user, index) => {
        const earnedTransactions = await db
          .select()
          .from(tokenTransactions)
          .where(
            and(
              eq(tokenTransactions.userId, user.id),
              eq(tokenTransactions.type, 'earned')
            )
          );
        
        const totalEarned = earnedTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        return {
          user,
          totalEarned,
          rank: index + 1,
        };
      })
    );

    return leaderboardData;
  }

  async getUserRank(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;

    const higherRankedUsers = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.tokens} > ${user.tokens}`);

    return (higherRankedUsers[0]?.count || 0) + 1;
  }

  // Official Operations
  async getAllOfficials(): Promise<User[]> {
    const officials = await db
      .select()
      .from(users)
      .where(eq(users.role, 'official'));
    
    return officials;
  }
}

export const storage = new DatabaseStorage();
