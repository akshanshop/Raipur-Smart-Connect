import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  phoneNumber: varchar("phone_number"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  oauthProvider: varchar("oauth_provider"), // google, github, twitter, facebook
  oauthId: varchar("oauth_id"), // provider-specific user ID
  role: varchar("role").default("citizen").notNull(), // citizen, official
  contributionScore: integer("contribution_score").default(0),
  complaintsCount: integer("complaints_count").default(0),
  upvotesCount: integer("upvotes_count").default(0),
  tokens: integer("tokens").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const complaints = pgTable("complaints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: varchar("ticket_number").unique().notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  category: varchar("category").notNull(),
  priority: varchar("priority").notNull(), // low, medium, high, urgent
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  status: varchar("status").default("open").notNull(), // open, in_progress, resolved, closed
  mediaUrls: text("media_urls").array(),
  resolutionScreenshots: text("resolution_screenshots").array(), // screenshots submitted by officials
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  assignedTo: varchar("assigned_to"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const communityIssues = pgTable("community_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  category: varchar("category").notNull(),
  priority: varchar("priority").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  status: varchar("status").default("open").notNull(),
  mediaUrls: text("media_urls").array(),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  commentsCount: integer("comments_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upvotes = pgTable("upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  complaintId: varchar("complaint_id").references(() => complaints.id),
  communityIssueId: varchar("community_issue_id").references(() => communityIssues.id),
  voteType: varchar("vote_type").notNull().default("upvote"), // upvote or downvote
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  complaintId: varchar("complaint_id").references(() => complaints.id),
  communityIssueId: varchar("community_issue_id").references(() => communityIssues.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // complaint_update, status_change, alert
  isRead: boolean("is_read").default(false),
  relatedId: varchar("related_id"), // complaint or issue ID
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  response: text("response"),
  language: varchar("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tokenTransactions = pgTable("token_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  type: varchar("type").notNull(), // earned, spent
  reason: varchar("reason").notNull(), // complaint_filed, issue_posted, reward_redeemed
  relatedId: varchar("related_id"), // complaint, issue, or reward ID
  createdAt: timestamp("created_at").defaultNow(),
});

export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  tokenCost: integer("token_cost").notNull(),
  category: varchar("category").notNull(), // badge, discount, feature, merchandise
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rewardRedemptions = pgTable("reward_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rewardId: varchar("reward_id").references(() => rewards.id).notNull(),
  tokensCost: integer("tokens_cost").notNull(),
  status: varchar("status").default("pending").notNull(), // pending, fulfilled, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // neighborhood, interest, district, etc.
  location: text("location"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  memberCount: integer("member_count").default(0),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  isPrivate: boolean("is_private").default(false),
  rules: text("rules"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const communityMembers = pgTable("community_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").references(() => communities.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").default("member").notNull(), // admin, moderator, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const officialJobs = pgTable("official_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // infrastructure, sanitation, safety, etc.
  priority: varchar("priority").notNull(), // low, medium, high, urgent
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  assignedOfficialId: varchar("assigned_official_id").references(() => users.id),
  status: varchar("status").default("pending").notNull(), // pending, in_progress, completed, cancelled
  estimatedHours: integer("estimated_hours").default(1),
  actualHours: integer("actual_hours"),
  deadline: timestamp("deadline"),
  completedAt: timestamp("completed_at"),
  relatedComplaintId: varchar("related_complaint_id").references(() => complaints.id),
  communityId: varchar("community_id").references(() => communities.id),
  mediaUrls: text("media_urls").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tokenBonuses = pgTable("token_bonuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bonusType: varchar("bonus_type").notNull(), // streak, milestone, community_leader, etc.
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementType: varchar("achievement_type").notNull(), // first_complaint, community_creator, top_contributor, etc.
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  iconUrl: varchar("icon_url"),
  tokensAwarded: integer("tokens_awarded").default(0),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const userSanctions = pgTable("user_sanctions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  triggerType: varchar("trigger_type").notNull(), // ai_high_confidence, heuristic_combo, moderator, user_report
  action: varchar("action").notNull(), // warning, temp_block, permanent_block
  reason: text("reason").notNull(),
  evidence: jsonb("evidence"), // JSON payload with AI result, heuristics, etc.
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"), // null for permanent blocks
  appealStatus: varchar("appeal_status").default("none"), // none, pending, approved, rejected
  appealMessage: text("appeal_message"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const moderationLogs = pgTable("moderation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // report_flagged, report_removed, user_warned, user_blocked, appeal_submitted, appeal_approved, appeal_rejected
  targetType: varchar("target_type"), // complaint, community_issue, comment
  targetId: varchar("target_id"), // ID of the flagged item
  performedBy: varchar("performed_by").references(() => users.id), // null for automated actions
  evidence: jsonb("evidence"), // AI scores, heuristics, moderator notes
  ipAddress: varchar("ip_address"),
  deviceFingerprint: varchar("device_fingerprint"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  complaints: many(complaints),
  communityIssues: many(communityIssues),
  upvotes: many(upvotes),
  comments: many(comments),
  notifications: many(notifications),
  chatMessages: many(chatMessages),
  tokenTransactions: many(tokenTransactions),
  rewardRedemptions: many(rewardRedemptions),
  communitiesCreated: many(communities),
  communityMemberships: many(communityMembers),
  assignedJobs: many(officialJobs),
  tokenBonuses: many(tokenBonuses),
  achievements: many(userAchievements),
  sanctions: many(userSanctions),
  moderationLogs: many(moderationLogs),
}));

export const complaintsRelations = relations(complaints, ({ one, many }) => ({
  user: one(users, {
    fields: [complaints.userId],
    references: [users.id],
  }),
  upvotes: many(upvotes),
  comments: many(comments),
}));

export const communityIssuesRelations = relations(communityIssues, ({ one, many }) => ({
  user: one(users, {
    fields: [communityIssues.userId],
    references: [users.id],
  }),
  upvotes: many(upvotes),
  comments: many(comments),
}));

export const upvotesRelations = relations(upvotes, ({ one }) => ({
  user: one(users, {
    fields: [upvotes.userId],
    references: [users.id],
  }),
  complaint: one(complaints, {
    fields: [upvotes.complaintId],
    references: [complaints.id],
  }),
  communityIssue: one(communityIssues, {
    fields: [upvotes.communityIssueId],
    references: [communityIssues.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  complaint: one(complaints, {
    fields: [comments.complaintId],
    references: [complaints.id],
  }),
  communityIssue: one(communityIssues, {
    fields: [comments.communityIssueId],
    references: [communityIssues.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const tokenTransactionsRelations = relations(tokenTransactions, ({ one }) => ({
  user: one(users, {
    fields: [tokenTransactions.userId],
    references: [users.id],
  }),
}));

export const rewardsRelations = relations(rewards, ({ many }) => ({
  redemptions: many(rewardRedemptions),
}));

export const rewardRedemptionsRelations = relations(rewardRedemptions, ({ one }) => ({
  user: one(users, {
    fields: [rewardRedemptions.userId],
    references: [users.id],
  }),
  reward: one(rewards, {
    fields: [rewardRedemptions.rewardId],
    references: [rewards.id],
  }),
}));

export const communitiesRelations = relations(communities, ({ one, many }) => ({
  creator: one(users, {
    fields: [communities.creatorId],
    references: [users.id],
  }),
  members: many(communityMembers),
  jobs: many(officialJobs),
}));

export const communityMembersRelations = relations(communityMembers, ({ one }) => ({
  community: one(communities, {
    fields: [communityMembers.communityId],
    references: [communities.id],
  }),
  user: one(users, {
    fields: [communityMembers.userId],
    references: [users.id],
  }),
}));

export const officialJobsRelations = relations(officialJobs, ({ one }) => ({
  assignedOfficial: one(users, {
    fields: [officialJobs.assignedOfficialId],
    references: [users.id],
  }),
  relatedComplaint: one(complaints, {
    fields: [officialJobs.relatedComplaintId],
    references: [complaints.id],
  }),
  community: one(communities, {
    fields: [officialJobs.communityId],
    references: [communities.id],
  }),
}));

export const tokenBonusesRelations = relations(tokenBonuses, ({ one }) => ({
  user: one(users, {
    fields: [tokenBonuses.userId],
    references: [users.id],
  }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
}));

export const userSanctionsRelations = relations(userSanctions, ({ one }) => ({
  user: one(users, {
    fields: [userSanctions.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [userSanctions.reviewedBy],
    references: [users.id],
  }),
}));

export const moderationLogsRelations = relations(moderationLogs, ({ one }) => ({
  user: one(users, {
    fields: [moderationLogs.userId],
    references: [users.id],
  }),
  performer: one(users, {
    fields: [moderationLogs.performedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  ticketNumber: true,
  userId: true,
  priority: true,
  upvotes: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  latitude: z.string().min(1, "GPS location is required. Please allow location access.")
    .refine((val) => !isNaN(parseFloat(val)) && Math.abs(parseFloat(val)) <= 90, 
      "Invalid latitude. Must be between -90 and 90"),
  longitude: z.string().min(1, "GPS location is required. Please allow location access.")
    .refine((val) => !isNaN(parseFloat(val)) && Math.abs(parseFloat(val)) <= 180, 
      "Invalid longitude. Must be between -180 and 180"),
});

export const insertCommunityIssueSchema = createInsertSchema(communityIssues).omit({
  id: true,
  userId: true,
  upvotes: true,
  commentsCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  latitude: z.string().min(1, "GPS location is required. Please allow location access.")
    .refine((val) => !isNaN(parseFloat(val)) && Math.abs(parseFloat(val)) <= 90, 
      "Invalid latitude. Must be between -90 and 90"),
  longitude: z.string().min(1, "GPS location is required. Please allow location access.")
    .refine((val) => !isNaN(parseFloat(val)) && Math.abs(parseFloat(val)) <= 180, 
      "Invalid longitude. Must be between -180 and 180"),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  userId: true,
  isRead: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  userId: true,
  response: true,
  createdAt: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
});

export const insertRewardRedemptionSchema = createInsertSchema(rewardRedemptions).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  creatorId: true,
  memberCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunityMemberSchema = createInsertSchema(communityMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertOfficialJobSchema = createInsertSchema(officialJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTokenBonusSchema = createInsertSchema(tokenBonuses).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  userId: true,
  earnedAt: true,
});

export const insertUserSanctionSchema = createInsertSchema(userSanctions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertModerationLogSchema = createInsertSchema(moderationLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaints.$inferSelect;
export type InsertCommunityIssue = z.infer<typeof insertCommunityIssueSchema>;
export type CommunityIssue = typeof communityIssues.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Upvote = typeof upvotes.$inferSelect;
export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertRewardRedemption = z.infer<typeof insertRewardRedemptionSchema>;
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type Community = typeof communities.$inferSelect;
export type InsertCommunityMember = z.infer<typeof insertCommunityMemberSchema>;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type InsertOfficialJob = z.infer<typeof insertOfficialJobSchema>;
export type OfficialJob = typeof officialJobs.$inferSelect;
export type InsertTokenBonus = z.infer<typeof insertTokenBonusSchema>;
export type TokenBonus = typeof tokenBonuses.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserSanction = z.infer<typeof insertUserSanctionSchema>;
export type UserSanction = typeof userSanctions.$inferSelect;
export type InsertModerationLog = z.infer<typeof insertModerationLogSchema>;
export type ModerationLog = typeof moderationLogs.$inferSelect;
