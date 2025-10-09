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
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  oauthProvider: varchar("oauth_provider"), // google, github, twitter, facebook
  oauthId: varchar("oauth_id"), // provider-specific user ID
  role: varchar("role").default("citizen").notNull(), // citizen, official
  contributionScore: integer("contribution_score").default(0),
  complaintsCount: integer("complaints_count").default(0),
  upvotesCount: integer("upvotes_count").default(0),
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
  commentsCount: integer("comments_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upvotes = pgTable("upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  complaintId: varchar("complaint_id").references(() => complaints.id),
  communityIssueId: varchar("community_issue_id").references(() => communityIssues.id),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  complaints: many(complaints),
  communityIssues: many(communityIssues),
  upvotes: many(upvotes),
  comments: many(comments),
  notifications: many(notifications),
  chatMessages: many(chatMessages),
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
