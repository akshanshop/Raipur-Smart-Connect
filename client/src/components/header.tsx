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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gradient">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-squircle-sm flex items-center justify-center mr-2 sm:mr-3 magnetic-button">
                    <i className="fas fa-city text-white text-sm sm:text-base md:text-lg"></i>
                  </div>
                  <span className="hidden sm:inline">Raipur Smart Connect</span>
                  <span className="sm:hidden">RSC</span>
                </div>
              </h1>
            </div>
            <nav className="hidden md:flex">
              <div className="flex items-center space-x-3 lg:space-x-4 bg-card/30 backdrop-blur-sm rounded-squircle-lg px-4 lg:px-6 py-2.5 lg:py-3 border border-border/30">
                <a 
                  href="/" 
                  className="text-sm lg:text-base text-foreground hover:text-primary font-medium transition-colors"
                  data-testid="link-dashboard"
                >
                  Dashboard
                </a>
                <a 
                  href="/complaints" 
                  className="text-sm lg:text-base text-foreground hover:text-primary font-medium transition-colors"
                  data-testid="link-complaints"
                >
                  Complaints
                </a>
                <a 
                  href="/community" 
                  className="text-sm lg:text-base text-foreground hover:text-primary font-medium transition-colors"
                  data-testid="link-community"
                >
                  Community
                </a>
              </div>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2.5 rounded-squircle-xs text-foreground hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
          
          <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-4">
            {/* Language Selector */}
            <select 
              className="bg-input border border-border rounded-squircle-xs px-2 sm:px-3 md:px-4 py-2.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring glow-on-hover transition-all duration-300 min-h-[44px]"
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
            <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 bg-card/30 backdrop-blur-sm rounded-squircle-lg px-2 sm:px-3 md:px-4 py-2 sm:py-2 border border-border/30 min-h-[44px]">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="User Profile" 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-squircle-xs object-cover ring-2 ring-primary/20"
                  data-testid="img-user-avatar"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-squircle-xs bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <i className="fas fa-user text-primary text-sm sm:text-base md:text-lg"></i>
                </div>
              )}
              <span className="text-xs sm:text-sm font-medium hidden md:inline text-foreground max-w-[100px] lg:max-w-[150px] truncate" data-testid="text-user-name">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout"
                className="rounded-squircle-xs hover:bg-destructive/10 hover:text-destructive transition-all duration-300 px-2 sm:px-3 py-2.5 sm:py-2 text-xs sm:text-sm min-h-[44px]"
                title="Sign out of your account"
              >
                <i className="fas fa-sign-out-alt sm:mr-2"></i>
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-sm">
            <div className="px-4 py-6 space-y-4">
              <div className="bg-card/30 backdrop-blur-sm rounded-squircle-lg p-4 border border-border/30 space-y-2">
                <a 
                  href="/" 
                  className="block text-foreground hover:text-primary font-medium transition-colors py-3 min-h-[44px] flex items-center"
                  data-testid="mobile-link-dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-tachometer-alt mr-3"></i>
                  Dashboard
                </a>
                <a 
                  href="/complaints" 
                  className="block text-foreground hover:text-primary font-medium transition-colors py-3 min-h-[44px] flex items-center"
                  data-testid="mobile-link-complaints"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-file-alt mr-3"></i>
                  Complaints
                </a>
                <a 
                  href="/community" 
                  className="block text-foreground hover:text-primary font-medium transition-colors py-3 min-h-[44px] flex items-center"
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
                  className="w-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 rounded-squircle-md min-h-[44px]"
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
