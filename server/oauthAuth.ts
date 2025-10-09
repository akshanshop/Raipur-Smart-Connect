import passport from "passport";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Import OAuth strategies using ES module imports
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";

/*
 * OAUTH ENVIRONMENT VARIABLES SETUP
 * 
 * To enable Google OAuth authentication, set these environment variables:
 * - GOOGLE_CLIENT_ID: Your Google OAuth 2.0 Client ID
 * - GOOGLE_CLIENT_SECRET: Your Google OAuth 2.0 Client Secret
 * 
 * To enable GitHub OAuth authentication, set these environment variables:
 * - GITHUB_CLIENT_ID: Your GitHub OAuth App Client ID  
 * - GITHUB_CLIENT_SECRET: Your GitHub OAuth App Client Secret
 * 
 * REQUIRED for all authentication:
 * - SESSION_SECRET: A secure random string for session encryption
 * - DATABASE_URL: PostgreSQL connection string for session storage
 * 
 * OAuth Callback URLs to configure in your provider settings:
 * - Google: https://your-domain.repl.co/api/auth/google/callback
 * - GitHub: https://your-domain.repl.co/api/auth/github/callback
 * 
 * Setup Instructions:
 * 1. Google: Create OAuth 2.0 credentials at https://console.developers.google.com/
 * 2. GitHub: Create OAuth App at https://github.com/settings/applications/new
 * 3. Add the callback URLs above to your OAuth app configurations
 * 4. Set the environment variables in Replit's Secrets tab
 */

export function getOAuthSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use database session store if available, otherwise fall back to memory store
  let sessionStore;
  if (process.env.DATABASE_URL && process.env.SESSION_SECRET) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  } else {
    console.warn("Using memory store for OAuth sessions - sessions will not persist across restarts");
    sessionStore = new session.MemoryStore();
  }
  
  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupOAuth(app: Express) {
  // Only setup OAuth if required environment variables are present
  const hasOAuthCredentials = (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) || 
                              (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  
  if (!hasOAuthCredentials) {
    console.log("OAuth credentials not found, skipping OAuth setup");
    setupOAuthRoutes(app); // Still setup fallback routes
    return;
  }

  app.set("trust proxy", 1);
  app.use(getOAuthSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy - only if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use("google-oauth", new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      passReqToCallback: true
    }, async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const role = req.session?.oauthRole as string | undefined;
        const user = await handleOAuthUser(profile, 'google', role);
        delete req.session.oauthRole;
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // GitHub OAuth Strategy - only if credentials are provided
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use("github-oauth", new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
      passReqToCallback: true
    }, async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const role = req.session?.oauthRole as string | undefined;
        const user = await handleOAuthUser(profile, 'github', role);
        delete req.session.oauthRole;
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // OAuth Routes
  setupOAuthRoutes(app);
}

async function handleOAuthUser(profile: any, provider: string, role?: string) {
  const email = profile.emails?.[0]?.value || `${profile.id}@${provider}.oauth`;
  const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || '';
  const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';
  const profileImageUrl = profile.photos?.[0]?.value || '';

  // Try to find existing user by OAuth provider and ID
  let user = await storage.getUserByOAuth(provider, profile.id);
  
  if (!user) {
    // Try to find user by email
    user = await storage.getUserByEmail(email);
    if (user) {
      // Update existing user with OAuth info and role if provided
      await storage.updateUser(user.id, {
        oauthProvider: provider,
        oauthId: profile.id,
        profileImageUrl: profileImageUrl || user.profileImageUrl,
        ...(role && { role }),
      });
      // Re-fetch to get updated user
      user = await storage.getUserByOAuth(provider, profile.id);
    } else {
      // Create new user
      await storage.upsertUser({
        email,
        firstName,
        lastName,
        profileImageUrl,
        oauthProvider: provider,
        oauthId: profile.id,
        role: role || 'citizen',
      });
      user = await storage.getUserByOAuth(provider, profile.id);
    }
  } else if (role && user.role !== role) {
    // Update role if it changed
    await storage.updateUser(user.id, { role });
    // Re-fetch to get updated user
    user = await storage.getUserByOAuth(provider, profile.id);
  }

  return user;
}

function setupOAuthRoutes(app: Express) {
  // Google OAuth - only setup routes if strategy is configured
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get('/api/auth/google', (req, res, next) => {
      const role = req.query.role as string;
      if (role && (role === 'citizen' || role === 'official')) {
        (req.session as any).oauthRole = role;
      }
      passport.authenticate('google-oauth', { scope: ['profile', 'email'] })(req, res, next);
    });
    app.get('/api/auth/google/callback', 
      passport.authenticate('google-oauth', { failureRedirect: '/login?error=google_failed' }),
      (req, res) => res.redirect('/')
    );
  } else {
    // Fallback route if Google OAuth is not configured
    app.get('/api/auth/google', (req, res) => {
      res.status(501).json({ 
        message: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables." 
      });
    });
  }

  // GitHub OAuth - only setup routes if strategy is configured
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    app.get('/api/auth/github', (req, res, next) => {
      const role = req.query.role as string;
      if (role && (role === 'citizen' || role === 'official')) {
        (req.session as any).oauthRole = role;
      }
      passport.authenticate('github-oauth', { scope: ['user:email'] })(req, res, next);
    });
    app.get('/api/auth/github/callback', 
      passport.authenticate('github-oauth', { failureRedirect: '/login?error=github_failed' }),
      (req, res) => res.redirect('/')
    );
  } else {
    // Fallback route if GitHub OAuth is not configured
    app.get('/api/auth/github', (req, res) => {
      res.status(501).json({ 
        message: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables." 
      });
    });
  }

  // Logout route for OAuth users
  app.get('/api/auth/oauth/logout', (req, res) => {
    // Check if OAuth is available before trying to logout
    if (typeof req.logout === 'function') {
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ message: 'Logout failed' });
        }
        res.redirect('/');
      });
    } else {
      // OAuth not configured, return success anyway
      res.redirect('/');
    }
  });
}

export const isOAuthAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};