import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'complaint_update' | 'status_change' | 'community_activity' | 'system_alert' | 'emergency';
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  actions?: Array<{
    label: string;
    action: string;
    variant?: 'default' | 'secondary' | 'destructive';
  }>;
  relatedId?: string;
}

export default function RealTimeNotifications() {
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ["/api/notifications/enhanced"],
    queryFn: async () => {
      // Enhanced mock data - in real app this would fetch from API
      return [
        {
          id: "1",
          title: "Complaint Status Updated",
          message: "Your water supply complaint #WSC-2024-001 has been assigned to the maintenance team.",
          type: "complaint_update",
          isRead: false,
          priority: "medium",
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          actions: [
            { label: "View Details", action: "view_complaint", variant: "default" },
            { label: "Contact Team", action: "contact_team", variant: "secondary" }
          ],
          relatedId: "WSC-2024-001"
        },
        {
          id: "2",
          title: "Emergency Alert",
          message: "Water supply will be disrupted in Sector 21 from 2 PM to 6 PM today for emergency repairs.",
          type: "emergency",
          isRead: false,
          priority: "urgent",
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          actions: [
            { label: "More Info", action: "emergency_details", variant: "default" },
            { label: "Set Reminder", action: "set_reminder", variant: "secondary" }
          ]
        },
        {
          id: "3",
          title: "Community Support",
          message: "Your road repair issue in Pandri has received 5 new upvotes from the community.",
          type: "community_activity",
          isRead: true,
          priority: "low",
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          actions: [
            { label: "View Issue", action: "view_issue", variant: "default" },
            { label: "Thank Community", action: "thank_community", variant: "secondary" }
          ]
        },
        {
          id: "4",
          title: "System Maintenance",
          message: "The complaint system will undergo maintenance tonight from 11 PM to 2 AM.",
          type: "system_alert",
          isRead: false,
          priority: "medium",
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          actions: [
            { label: "Schedule Alert", action: "schedule_alert", variant: "secondary" }
          ]
        }
      ];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/enhanced"] });
    }
  });

  const executeActionMutation = useMutation({
    mutationFn: async ({ action, notificationId }: { action: string, notificationId: string }) => {
      // Mock API call for executing notification actions
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, action };
    },
    onSuccess: (data) => {
      toast({
        title: "Action Completed",
        description: `Successfully executed: ${data.action.replace('_', ' ')}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/enhanced"] });
    }
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleAction = (action: string, notificationId: string) => {
    executeActionMutation.mutate({ action, notificationId });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'complaint_update': return 'fas fa-file-alt';
      case 'status_change': return 'fas fa-exchange-alt';
      case 'community_activity': return 'fas fa-users';
      case 'system_alert': return 'fas fa-cog';
      case 'emergency': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-bell';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'complaint_update': return 'bg-blue-500';
      case 'status_change': return 'bg-purple-500';
      case 'community_activity': return 'bg-green-500';
      case 'system_alert': return 'bg-orange-500';
      case 'emergency': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.isRead;
    if (filter === "urgent") return notification.priority === "urgent";
    return notification.type === filter;
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  return (
    <Card className="floating-card glass-modern card-squircle-lg animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-xl text-gradient flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-bell mr-3 animate-float"></i>
            Real-time Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-destructive text-destructive-foreground pulse-glow">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => refetch()}
            className="modern-button"
          >
            <i className="fas fa-sync-alt"></i>
          </Button>
        </CardTitle>
        
        {/* Filter Tabs */}
        <div className="flex space-x-2 mt-4">
          {[
            { key: "all", label: "All", count: notifications.length },
            { key: "unread", label: "Unread", count: unreadCount },
            { key: "urgent", label: "Urgent", count: notifications.filter((n: Notification) => n.priority === "urgent").length },
            { key: "emergency", label: "Emergency", count: notifications.filter((n: Notification) => n.type === "emergency").length }
          ].map(tab => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab.key)}
              className="modern-button btn-squircle"
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="ml-1 squircle-full">
                  {tab.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-bell-slash text-4xl text-muted-foreground mb-2"></i>
              <p className="text-muted-foreground">No notifications found</p>
            </div>
          ) : (
            filteredNotifications.map((notification: Notification) => (
              <div 
                key={notification.id}
                className={`p-4 squircle-lg magnetic-button transition-all duration-300 ${
                  notification.isRead 
                    ? 'bg-muted/30 hover:bg-muted/50' 
                    : 'bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 glow-on-hover'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Notification Icon & Priority Indicator */}
                  <div className="relative">
                    <div className={`icon-squircle-sm ${getTypeColor(notification.type)} text-white flex items-center justify-center`}>
                      <i className={getNotificationIcon(notification.type)}></i>
                    </div>
                    <div className={`absolute -top-1 -right-1 w-3 h-3 squircle-full ${getPriorityColor(notification.priority)}`}></div>
                  </div>
                  
                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs squircle-full ${getPriorityColor(notification.priority)} text-white`}>
                          {notification.priority}
                        </Badge>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary squircle-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {notification.actions?.map((action, index) => (
                          <Button
                            key={index}
                            variant={action.variant || "outline"}
                            size="sm"
                            onClick={() => handleAction(action.action, notification.id)}
                            className="modern-button btn-squircle text-xs"
                            disabled={executeActionMutation.isPending}
                          >
                            {action.label}
                          </Button>
                        ))}
                        
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="modern-button btn-squircle"
                            disabled={markAsReadMutation.isPending}
                          >
                            <i className="fas fa-check text-xs"></i>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Bulk Actions */}
        {unreadCount > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50 flex justify-between">
            <Button 
              variant="outline"
              size="sm"
              className="modern-button btn-squircle"
            >
              <i className="fas fa-check-double mr-2"></i>
              Mark All Read
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className="modern-button btn-squircle"
            >
              <i className="fas fa-cog mr-2"></i>
              Notification Settings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}