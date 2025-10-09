import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function Header() {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.isRead).length : 0;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "complaint_update": return "fa-file-alt";
      case "community_activity": return "fa-users";
      case "city_alert": return "fa-exclamation-triangle";
      default: return "fa-bell";
    }
  };

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
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className="relative p-3 text-muted-foreground hover:text-foreground transition-all duration-300 rounded-squircle-xs magnetic-button bg-card/50 backdrop-blur-sm"
                  data-testid="button-notifications"
                >
                  <i className="fas fa-bell text-lg"></i>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-6 w-6 flex items-center justify-center pulse-glow font-semibold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <i className="fas fa-bell-slash text-4xl mb-3 opacity-50"></i>
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {(notifications as any[]).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                            !notification.isRead ? "bg-primary/5" : ""
                          }`}
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsReadMutation.mutate(notification.id);
                            }
                          }}
                          data-testid={`notification-${notification.id}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-squircle-xs ${
                              notification.type === "city_alert" ? "bg-destructive/10 text-destructive" :
                              notification.type === "complaint_update" ? "bg-primary/10 text-primary" :
                              "bg-secondary/10 text-secondary"
                            }`}>
                              <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {notification.title}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            
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
                href="#chatbot" 
                className="block text-foreground hover:text-primary font-medium transition-colors py-2"
                data-testid="mobile-link-chatbot"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-robot mr-3"></i>
                Ask AI
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
              <a 
                href="#maps" 
                className="block text-foreground hover:text-primary font-medium transition-colors py-2"
                data-testid="mobile-link-maps"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-map mr-3"></i>
                Maps
              </a>
              
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
