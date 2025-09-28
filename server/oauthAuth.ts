import passport from "passport";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Import OAuth strategies using ES module imports
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
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
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const user = await handleOAuthUser(profile, 'google');
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback"
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const user = await handleOAuthUser(profile, 'github');
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

async function handleOAuthUser(profile: any, provider: string) {
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
      // Update existing user with OAuth info
      await storage.updateUser(user.id, {
        oauthProvider: provider,
        oauthId: profile.id,
        profileImageUrl: profileImageUrl || user.profileImageUrl,
      });
    } else {
      // Create new user
      await storage.upsertUser({
        email,
        firstName,
        lastName,
        profileImageUrl,
        oauthProvider: provider,
        oauthId: profile.id,
      });
      user = await storage.getUserByOAuth(provider, profile.id);
    }
  }

  return user;
}

function setupOAuthRoutes(app: Express) {
  // Google OAuth
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login?error=google_failed' }),
    (req, res) => res.redirect('/')
  );

  // GitHub OAuth
  app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
  app.get('/api/auth/github/callback', 
    passport.authenticate('github', { failureRedirect: '/login?error=github_failed' }),
    (req, res) => res.redirect('/')
  );


  // Logout route
  app.get('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.redirect('/');
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};