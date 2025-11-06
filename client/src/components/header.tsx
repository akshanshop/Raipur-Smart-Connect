import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import CitizenNotificationPanel from "@/components/citizen-notification-panel";

export default function Header() {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-border/50 cool-shadow rounded-b-squircle-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gradient">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary rounded-squircle-sm flex items-center justify-center mr-3 magnetic-button">
                    <i className="fas fa-city text-white text-lg"></i>
                  </div>
                  Raipur Smart Connect
                </div>
              </h1>
            </div>
            <nav className="hidden md:flex">
              <div className="flex items-center space-x-4 bg-card/30 backdrop-blur-sm rounded-squircle-lg px-6 py-3 border border-border/30">
                <a 
                  href="/" 
                  className="text-foreground hover:text-primary font-medium transition-colors"
                  data-testid="link-dashboard"
                >
                  Dashboard
                </a>
                <a 
                  href="/complaints" 
                  className="text-foreground hover:text-primary font-medium transition-colors"
                  data-testid="link-complaints"
                >
                  Complaints
                </a>
                <a 
                  href="/community" 
                  className="text-foreground hover:text-primary font-medium transition-colors"
                  data-testid="link-community"
                >
                  Community
                </a>
              </div>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-squircle-xs text-foreground hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <select 
              className="bg-input border border-border rounded-squircle-xs px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring glow-on-hover transition-all duration-300"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              data-testid="select-language"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
            </select>
            
            {/* Notifications */}
            <CitizenNotificationPanel />
            
            {/* User Profile */}
            <div className="flex items-center space-x-3 bg-card/30 backdrop-blur-sm rounded-squircle-lg px-4 py-2 border border-border/30">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="User Profile" 
                  className="w-10 h-10 rounded-squircle-xs object-cover ring-2 ring-primary/20"
                  data-testid="img-user-avatar"
                />
              ) : (
                <div className="w-10 h-10 rounded-squircle-xs bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <i className="fas fa-user text-primary text-lg"></i>
                </div>
              )}
              <span className="text-sm font-medium hidden sm:inline text-foreground" data-testid="text-user-name">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout"
                className="rounded-squircle-xs hover:bg-destructive/10 hover:text-destructive transition-all duration-300 px-3 py-2"
                title="Sign out of your account"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-sm">
            <div className="px-4 py-6 space-y-4">
              <div className="bg-card/30 backdrop-blur-sm rounded-squircle-lg p-4 border border-border/30 space-y-3">
                <a 
                  href="/" 
                  className="block text-foreground hover:text-primary font-medium transition-colors py-2"
                  data-testid="mobile-link-dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-tachometer-alt mr-3"></i>
                  Dashboard
                </a>
                <a 
                  href="/complaints" 
                  className="block text-foreground hover:text-primary font-medium transition-colors py-2"
                  data-testid="mobile-link-complaints"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-file-alt mr-3"></i>
                  Complaints
                </a>
                <a 
                  href="/community" 
                  className="block text-foreground hover:text-primary font-medium transition-colors py-2"
                  data-testid="mobile-link-community"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-users mr-3"></i>
                  Community
                </a>
              </div>
              
              {/* Mobile Logout Button */}
              <div className="pt-4 border-t border-border/50">
                <Button
                  onClick={() => window.location.href = '/api/logout'}
                  className="w-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 rounded-squircle-md"
                  data-testid="mobile-button-logout"
                >
                  <i className="fas fa-sign-out-alt mr-3"></i>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
