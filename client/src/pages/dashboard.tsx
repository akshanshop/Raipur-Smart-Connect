import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface Complaint {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: userStats } = useQuery({
    queryKey: ["/api/stats/user"],
    retry: false,
  });

  const { data: cityStats } = useQuery({
    queryKey: ["/api/stats/city"],
    retry: false,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const { data: recentComplaints = [] } = useQuery({
    queryKey: ["/api/complaints"],
    retry: false,
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500 text-white';
      case 'in_progress':
        return 'bg-blue-500 text-white';
      case 'resolved':
        return 'bg-green-500 text-white';
      case 'closed':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-accent text-accent-foreground';
      case 'low':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'complaint_update':
        return 'fas fa-file-alt';
      case 'status_change':
        return 'fas fa-exchange-alt';
      case 'alert':
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-bell';
    }
  };

  const unreadNotifications = notifications.filter((n: Notification) => !n.isRead);
  const recentNotifications = notifications.slice(0, 5);
  const myRecentComplaints = recentComplaints.slice(0, 5);

  // Calculate contribution level
  const contributionScore = userStats?.contributionScore || 0;
  const getContributionLevel = (score: number) => {
    if (score >= 500) return { level: "Champion", color: "text-yellow-500", progress: 100 };
    if (score >= 200) return { level: "Advocate", color: "text-blue-500", progress: (score / 500) * 100 };
    if (score >= 50) return { level: "Contributor", color: "text-green-500", progress: (score / 200) * 100 };
    return { level: "Beginner", color: "text-gray-500", progress: (score / 50) * 100 };
  };

  const contributionLevel = getContributionLevel(contributionScore);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            <i className="fas fa-tachometer-alt text-primary mr-3"></i>
            Personal Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || user?.email || 'User'}! Here's your civic engagement overview.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: User Stats & Achievement */}
          <div className="space-y-6">
            
            {/* User Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <i className="fas fa-user text-2xl text-muted-foreground"></i>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground" data-testid="text-user-profile-name">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge className={contributionLevel.color + " mt-1"}>
                      {contributionLevel.level}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Contribution Score</span>
                    <span className="font-medium text-foreground" data-testid="text-contribution-score">
                      {contributionScore}
                    </span>
                  </div>
                  <Progress value={contributionLevel.progress} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">
                    Next level at {contributionLevel.level === "Champion" ? "Max level!" : 
                      contributionLevel.level === "Advocate" ? "500 points" :
                      contributionLevel.level === "Contributor" ? "200 points" : "50 points"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-file-alt text-primary"></i>
                    <span className="text-sm text-muted-foreground">Complaints Filed</span>
                  </div>
                  <span className="font-semibold text-foreground" data-testid="text-complaints-count">
                    {userStats?.activeComplaints + userStats?.resolvedComplaints || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-check-circle text-secondary"></i>
                    <span className="text-sm text-muted-foreground">Issues Resolved</span>
                  </div>
                  <span className="font-semibold text-foreground" data-testid="text-resolved-count">
                    {userStats?.resolvedComplaints || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-thumbs-up text-accent"></i>
                    <span className="text-sm text-muted-foreground">Upvotes Given</span>
                  </div>
                  <span className="font-semibold text-foreground" data-testid="text-upvotes-count">
                    {userStats?.upvotesGiven || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-clock text-yellow-500"></i>
                    <span className="text-sm text-muted-foreground">Active Issues</span>
                  </div>
                  <span className="font-semibold text-foreground" data-testid="text-active-count">
                    {userStats?.activeComplaints || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* City Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">City Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-destructive" data-testid="text-city-high-priority">
                      {cityStats?.highPriorityCount || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">High Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-accent">
                      {cityStats?.mediumPriorityCount || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Medium Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-secondary">
                      {cityStats?.lowPriorityCount || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Low Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">
                      {cityStats?.resolvedComplaints || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Resolved</div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-border text-center">
                  <div className="text-sm text-muted-foreground">Average Response Time</div>
                  <div className="text-lg font-semibold text-foreground">
                    {cityStats?.averageResponseTime || "N/A"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center & Right Columns: Notifications & Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Notifications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-bell text-primary mr-2"></i>
                  Recent Notifications
                  {unreadNotifications.length > 0 && (
                    <Badge className="ml-2 bg-destructive text-destructive-foreground">
                      {unreadNotifications.length} new
                    </Badge>
                  )}
                </CardTitle>
                <Button variant="outline" size="sm" data-testid="button-view-all-notifications">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {recentNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-bell-slash text-4xl text-muted-foreground mb-2"></i>
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentNotifications.map((notification: Notification) => (
                      <div 
                        key={notification.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                          notification.isRead ? 'bg-muted/50' : 'bg-muted'
                        }`}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className={`rounded-full w-8 h-8 flex items-center justify-center text-xs flex-shrink-0 ${
                          notification.type === 'complaint_update' ? 'bg-secondary text-secondary-foreground' :
                          notification.type === 'status_change' ? 'bg-primary text-primary-foreground' :
                          'bg-accent text-accent-foreground'
                        }`}>
                          <i className={getNotificationIcon(notification.type)}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground truncate">
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Complaints */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">My Recent Complaints</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/complaints'}
                  data-testid="button-view-all-complaints"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {myRecentComplaints.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-inbox text-4xl text-muted-foreground mb-2"></i>
                    <p className="text-muted-foreground mb-4">No complaints filed yet</p>
                    <Button onClick={() => window.location.href = '/'} data-testid="button-file-first-complaint">
                      <i className="fas fa-plus mr-2"></i>
                      File Your First Complaint
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRecentComplaints.map((complaint: Complaint) => (
                      <div 
                        key={complaint.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        data-testid={`recent-complaint-${complaint.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={getPriorityBadgeColor(complaint.priority)}>
                              {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {complaint.ticketNumber}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">
                            {complaint.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge className={getStatusBadgeColor(complaint.status)}>
                          {complaint.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="h-16 flex flex-col items-center justify-center space-y-1"
                    onClick={() => window.location.href = '/'}
                    data-testid="button-dashboard-new-complaint"
                  >
                    <i className="fas fa-plus-circle text-lg"></i>
                    <span className="text-sm">New Complaint</span>
                  </Button>
                  
                  <Button 
                    variant="secondary"
                    className="h-16 flex flex-col items-center justify-center space-y-1"
                    onClick={() => window.location.href = '/community'}
                    data-testid="button-dashboard-browse-community"
                  >
                    <i className="fas fa-users text-lg"></i>
                    <span className="text-sm">Browse Community</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center space-y-1"
                    onClick={() => window.location.href = '#maps'}
                    data-testid="button-dashboard-view-map"
                  >
                    <i className="fas fa-map text-lg"></i>
                    <span className="text-sm">View Issues Map</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
