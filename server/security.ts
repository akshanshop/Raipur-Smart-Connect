import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Track request counts and suspicious activities
interface RateLimitEntry {
  count: number;
  firstRequest: number;
  warnings: number;
  blocked: boolean;
  blockedUntil?: number;
}

interface SuspiciousActivity {
  userId: string;
  ip: string;
  action: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const ipBlocklist = new Set<string>();
const suspiciousActivities: SuspiciousActivity[] = [];

// Configuration
const RATE_LIMIT_CONFIG = {
  complaints: { maxRequests: 5, windowMs: 60000 }, // 5 complaints per minute
  comments: { maxRequests: 10, windowMs: 60000 }, // 10 comments per minute
  chat: { maxRequests: 20, windowMs: 60000 }, // 20 chat messages per minute
  general: { maxRequests: 50, windowMs: 60000 }, // 50 general requests per minute
  upvotes: { maxRequests: 30, windowMs: 60000 }, // 30 upvotes per minute
};

const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD = 3; // Block after 3 warnings

// Get client identifier (user ID or IP)
function getClientIdentifier(req: any): string {
  const userId = req.user?.claims?.sub || req.user?.id;
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  return userId ? `user:${userId}` : `ip:${ip}`;
}

// Get user IP address
function getClientIP(req: any): string {
  return req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitMap.entries()).forEach(([key, entry]) => {
    if (now - entry.firstRequest > 300000) { // 5 minutes
      rateLimitMap.delete(key);
    }
  });
  
  // Keep only last 1000 suspicious activities
  if (suspiciousActivities.length > 1000) {
    suspiciousActivities.splice(0, suspiciousActivities.length - 1000);
  }
}, 60000);

// Send warning notification to user
async function sendWarning(
  userId: string | null,
  ip: string,
  reason: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): Promise<void> {
  if (!userId) return;

  const warningMessages = {
    low: '⚠️ Warning: Unusual activity detected on your account. Please ensure you are following community guidelines.',
    medium: '⚠️ Security Alert: Multiple suspicious requests detected. Continued violations may result in temporary suspension.',
    high: '🚨 Final Warning: Your account has been flagged for spam/abuse. Next violation will result in a 30-minute block.',
    critical: '🔒 Account Blocked: Your account has been temporarily blocked for 30 minutes due to spam/abuse detection.'
  };

  const titles = {
    low: 'Activity Warning',
    medium: 'Security Alert',
    high: 'Final Warning',
    critical: 'Account Blocked'
  };

  await storage.createNotification({
    userId,
    title: titles[severity],
    message: `${warningMessages[severity]}\n\nReason: ${reason}\nIP Address: ${ip}\nTimestamp: ${new Date().toLocaleString()}`,
    type: 'alert',
    relatedId: null
  });

  console.log(`[SECURITY] Warning sent to user ${userId} (${severity}): ${reason}`);
}

// Log suspicious activity
function logSuspiciousActivity(
  userId: string | null,
  ip: string,
  action: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): void {
  suspiciousActivities.push({
    userId: userId || 'anonymous',
    ip,
    action,
    timestamp: Date.now(),
    severity
  });

  console.log(`[SECURITY] ${severity.toUpperCase()} - ${action} by ${userId || ip}`);
}

// Rate limiting middleware factory
export function rateLimit(type: keyof typeof RATE_LIMIT_CONFIG) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = getClientIdentifier(req);
    const ip = getClientIP(req);
    const now = Date.now();
    const config = RATE_LIMIT_CONFIG[type];

    // Check if IP is blocked
    if (ipBlocklist.has(ip)) {
      logSuspiciousActivity(
        (req as any).user?.claims?.sub || (req as any).user?.id || null,
        ip,
        `Blocked IP attempted ${type} request`,
        'critical'
      );
      return res.status(403).json({ 
        message: "Your IP has been blocked due to repeated violations. Contact support if you believe this is an error.",
        blocked: true
      });
    }

    let entry = rateLimitMap.get(identifier);

    if (!entry) {
      entry = { count: 1, firstRequest: now, warnings: 0, blocked: false };
      rateLimitMap.set(identifier, entry);
      return next();
    }

    // Check if user is currently blocked
    if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
      const remainingTime = Math.ceil((entry.blockedUntil - now) / 1000 / 60);
      return res.status(429).json({ 
        message: `You have been temporarily blocked. Please try again in ${remainingTime} minutes.`,
        blocked: true,
        remainingMinutes: remainingTime
      });
    }

    // Unblock if block duration has passed
    if (entry.blocked && entry.blockedUntil && now >= entry.blockedUntil) {
      entry.blocked = false;
      entry.blockedUntil = undefined;
      entry.count = 0;
      entry.firstRequest = now;
      entry.warnings = 0;
    }

    // Reset counter if window has passed
    if (now - entry.firstRequest > config.windowMs) {
      entry.count = 1;
      entry.firstRequest = now;
      return next();
    }

    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      entry.warnings++;
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id || null;

      // Determine severity based on violations
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let action = '';

      if (entry.warnings >= WARNING_THRESHOLD) {
        severity = 'critical';
        entry.blocked = true;
        entry.blockedUntil = now + BLOCK_DURATION_MS;
        action = `User blocked for ${type} spam (${entry.count} requests in ${config.windowMs/1000}s)`;
        
        // Block IP if too many violations
        ipBlocklist.add(ip);
        
        // Send critical warning
        if (userId) {
          await sendWarning(userId, ip, action, severity);
        }
      } else if (entry.warnings === WARNING_THRESHOLD - 1) {
        severity = 'high';
        action = `Final warning: ${type} rate limit exceeded (${entry.count} requests in ${config.windowMs/1000}s)`;
        if (userId) {
          await sendWarning(userId, ip, action, severity);
        }
      } else if (entry.warnings === 1) {
        severity = 'medium';
        action = `${type} rate limit exceeded (${entry.count} requests in ${config.windowMs/1000}s)`;
        if (userId) {
          await sendWarning(userId, ip, action, severity);
        }
      } else {
        severity = 'low';
        action = `${type} rate limit warning (${entry.count} requests in ${config.windowMs/1000}s)`;
      }

      logSuspiciousActivity(userId, ip, action, severity);

      return res.status(429).json({ 
        message: entry.blocked 
          ? `Too many requests. You have been blocked for 30 minutes.`
          : `Rate limit exceeded. Warning ${entry.warnings}/${WARNING_THRESHOLD}. Please slow down.`,
        warnings: entry.warnings,
        maxWarnings: WARNING_THRESHOLD,
        retryAfter: Math.ceil(config.windowMs / 1000),
        blocked: entry.blocked
      });
    }

    next();
  };
}

// Content validation for spam keywords and patterns
const SPAM_KEYWORDS = [
  'viagra', 'cialis', 'casino', 'lottery', 'winner', 'congratulations',
  'click here', 'free money', 'earn $$$', 'make money fast', 'bitcoin',
  'crypto investment', 'get rich', 'limited offer', 'act now',
  'weight loss', 'diet pills', 'male enhancement'
];

const SPAM_PATTERNS = [
  /https?:\/\/[^\s]+\.(xyz|tk|ml|ga|cf)/gi, // Suspicious TLDs
  /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, // Credit card patterns
  /(?:http.*){3,}/gi, // Multiple URLs
  /(.)\1{10,}/g, // Repeated characters (spam pattern)
];

export function validateContent(text: string): { isValid: boolean; reason?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, reason: 'Empty content' };
  }

  // Check for spam keywords
  const lowerText = text.toLowerCase();
  for (const keyword of SPAM_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return { isValid: false, reason: `Spam keyword detected: ${keyword}` };
    }
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return { isValid: false, reason: 'Suspicious pattern detected in content' };
    }
  }

  // Check for excessive capitalization (>50% caps)
  const capsCount = (text.match(/[A-Z]/g) || []).length;
  const lettersCount = (text.match(/[A-Za-z]/g) || []).length;
  if (lettersCount > 10 && capsCount / lettersCount > 0.5) {
    return { isValid: false, reason: 'Excessive capitalization detected' };
  }

  return { isValid: true };
}

// Comment spam detection middleware
export async function validateCommentContent(req: Request, res: Response, next: NextFunction) {
  const { content } = req.body;
  const userId = (req as any).user?.claims?.sub || (req as any).user?.id || null;
  const ip = getClientIP(req);

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  const validation = validateContent(content);
  
  if (!validation.isValid) {
    logSuspiciousActivity(userId, ip, `Spam comment blocked: ${validation.reason}`, 'medium');
    
    if (userId) {
      await sendWarning(
        userId,
        ip,
        `Your comment was blocked: ${validation.reason}`,
        'medium'
      );
    }

    return res.status(400).json({ 
      message: 'Your comment contains inappropriate content and has been blocked.',
      reason: validation.reason
    });
  }

  next();
}

// Detect duplicate submissions (same user submitting same content)
const recentSubmissions = new Map<string, { content: string; timestamp: number }[]>();

export function detectDuplicateSubmission(type: 'complaint' | 'comment' | 'issue') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.claims?.sub || (req as any).user?.id;
    if (!userId) return next();

    const content = req.body.description || req.body.content || req.body.message || '';
    const key = `${type}:${userId}`;
    const now = Date.now();

    let userSubmissions = recentSubmissions.get(key) || [];
    
    // Clean old submissions (older than 5 minutes)
    userSubmissions = userSubmissions.filter(s => now - s.timestamp < 300000);

    // Check for duplicate content
    const duplicate = userSubmissions.find(s => 
      s.content.toLowerCase().trim() === content.toLowerCase().trim()
    );

    if (duplicate) {
      const ip = getClientIP(req);
      logSuspiciousActivity(userId, ip, `Duplicate ${type} submission detected`, 'high');
      
      await sendWarning(
        userId,
        ip,
        `Duplicate ${type} detected. You have already submitted this content recently.`,
        'high'
      );

      return res.status(400).json({ 
        message: 'Duplicate submission detected. You have already submitted this content.',
        blocked: true
      });
    }

    // Add to recent submissions
    userSubmissions.push({ content, timestamp: now });
    recentSubmissions.set(key, userSubmissions);

    next();
  };
}

// Get security statistics
export function getSecurityStats() {
  const now = Date.now();
  const last24h = suspiciousActivities.filter(a => now - a.timestamp < 86400000);
  
  return {
    totalSuspiciousActivities: suspiciousActivities.length,
    last24Hours: {
      total: last24h.length,
      low: last24h.filter(a => a.severity === 'low').length,
      medium: last24h.filter(a => a.severity === 'medium').length,
      high: last24h.filter(a => a.severity === 'high').length,
      critical: last24h.filter(a => a.severity === 'critical').length,
    },
    blockedIPs: ipBlocklist.size,
    activeRateLimits: rateLimitMap.size,
    currentlyBlocked: Array.from(rateLimitMap.values()).filter(e => e.blocked).length
  };
}

// Admin endpoint to unblock users/IPs
export async function unblockUser(identifier: string): Promise<boolean> {
  const entry = rateLimitMap.get(identifier);
  if (entry) {
    entry.blocked = false;
    entry.blockedUntil = undefined;
    entry.warnings = 0;
    entry.count = 0;
    return true;
  }
  return false;
}

export async function unblockIP(ip: string): Promise<boolean> {
  return ipBlocklist.delete(ip);
}

// Get recent suspicious activities
export function getRecentActivities(limit: number = 50) {
  return suspiciousActivities
    .slice(-limit)
    .reverse()
    .map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp).toISOString()
    }));
}
