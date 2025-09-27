import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-border/50 cool-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gradient">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mr-3">
                    <i className="fas fa-city text-white"></i>
                  </div>
                  Raipur Smart Connect
                </div>
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a 
                href="/" 
                className="text-foreground hover:text-primary font-medium transition-colors"
                data-testid="link-dashboard"
              >
                Dashboard
              </a>
              <a 
                href="#chatbot" 
                className="text-foreground hover:text-primary font-medium transition-colors"
                data-testid="link-chatbot"
              >
                Ask AI
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
              <a 
                href="#maps" 
                className="text-foreground hover:text-primary font-medium transition-colors"
                data-testid="link-maps"
              >
                Maps
              </a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <select 
              className="bg-input border border-border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              data-testid="select-language"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
            </select>
            
            {/* Notifications */}
            <button 
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-notifications"
            >
              <i className="fas fa-bell text-lg"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-2">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="User Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                  data-testid="img-user-avatar"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <i className="fas fa-user text-muted-foreground"></i>
                </div>
              )}
              <span className="text-sm font-medium hidden sm:inline" data-testid="text-user-name">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout"
              >
                <i className="fas fa-sign-out-alt"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
