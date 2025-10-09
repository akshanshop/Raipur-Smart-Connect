import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Bell, X } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function OfficialsNotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [], isLoading, isError } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "complaint_update": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "community_activity": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "city_alert": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-3 text-muted-foreground hover:text-foreground transition-all duration-300 rounded-lg magnetic-button bg-card/50 backdrop-blur-sm hover:bg-card/80"
        data-testid="button-officials-notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center pulse-glow font-semibold animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop with fade animation */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Notification Panel - Slides in from right */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-background border-l border-border shadow-2xl z-50 transform transition-transform duration-500 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        data-testid="panel-officials-notifications"
      >
        {/* Panel Header */}
        <div className={`sticky top-0 z-10 from-primary/10 via-primary/5 to-transparent backdrop-blur-md border-b border-border/50 p-6 transition-all duration-500 bg-[#c0cbcd] text-[#261a0d] ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
              data-testid="button-close-notifications"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Panel Content */}
        <ScrollArea className={`h-[calc(100vh-120px)] transition-all duration-700 delay-100 ${
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
        }`}>
          <div className="p-6 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="p-6 bg-primary/10 rounded-full animate-pulse">
                  <Bell className="h-12 w-12 text-primary animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Loading notifications...</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we fetch your updates
                  </p>
                </div>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="p-6 bg-destructive/10 rounded-full">
                  <i className="fas fa-exclamation-triangle text-4xl text-destructive"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Failed to load notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    There was an error fetching your notifications. Please try again.
                  </p>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="p-6 bg-muted/30 rounded-full">
                  <Bell className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">No notifications yet</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll see notifications here when there are updates
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`group p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                    !notification.isRead
                      ? "border-primary/20 shadow-md animate-fade-in-up opacity-100 bg-[#d8a21a]"
                      : "bg-card/50 border-border/50 hover:bg-card/80"
                  } ${isOpen ? `animate-fade-in-up opacity-100` : "opacity-0"}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Notification Icon */}
                    <div className={`flex-shrink-0 p-3 rounded-lg border ${getNotificationColor(notification.type)} transition-all duration-300 group-hover:scale-110`}>
                      <i className={`fas ${getNotificationIcon(notification.type)} text-lg`}></i>
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-semibold text-foreground leading-tight">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="flex-shrink-0 w-3 h-3 bg-primary rounded-full animate-pulse ml-2"></div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">
                          <i className="far fa-clock mr-1"></i>
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>

                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            disabled={markAsReadMutation.isPending}
                            className="rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300 text-xs"
                            data-testid={`button-mark-read-${notification.id}`}
                          >
                            <i className="fas fa-check mr-1"></i>
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Panel Footer */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className={`sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border/50 p-4 transition-all duration-700 delay-200 ${
            isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}>
            <Button
              variant="outline"
              className="w-full rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              onClick={() => {
                notifications.forEach((n) => {
                  if (!n.isRead) {
                    markAsReadMutation.mutate(n.id);
                  }
                });
              }}
              disabled={markAsReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <i className="fas fa-check-double mr-2"></i>
              Mark all as read
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
