import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

// Import new feature components
import AdvancedSearch from "@/components/advanced-search";
import UserSettings from "@/components/user-settings";
import RealTimeNotifications from "@/components/real-time-notifications";
import DataAnalytics from "@/components/data-analytics";
import SocialFeatures from "@/components/social-features";
import ComplaintForm from "@/components/complaint-form";
import CommunityFeed from "@/components/community-feed";
import Chatbot from "@/components/chatbot";

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
  const [activeTab, setActiveTab] = useState("overview");
  const [searchFilters, setSearchFilters] = useState<any>(null);

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

  const { data: userStats = {} } = useQuery<any>({
    queryKey: ["/api/stats/user"],
    retry: false,
  });

  const { data: cityStats = {} } = useQuery<any>({
    queryKey: ["/api/stats/city"],
    retry: false,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const { data: recentComplaints = [] } = useQuery<Complaint[]>({
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
        {/* Enhanced Hero Header */}
        <div className="mb-8">
          <div className="relative rounded-3xl overflow-hidden hero-enhanced p-8 text-white pattern-overlay cool-shadow animate-fade-in-up">
            <div className="floating-particles">
              <div className="particle particle-1"></div>
              <div className="particle particle-2"></div>
              <div className="particle particle-3"></div>
              <div className="particle particle-4"></div>
              <div className="particle particle-5"></div>
              <div className="particle particle-6"></div>
            </div>
            <div className="morphing-bg"></div>
            <div className="morphing-bg-2"></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-3 animate-fade-in-up delay-100">
                <i className="fas fa-tachometer-alt mr-3 animate-float"></i>
                Personal Dashboard
              </h1>
              <p className="text-xl opacity-95 animate-fade-in-up delay-200">
                Welcome back, {user?.firstName || user?.email || 'User'}! Here's your civic engagement overview.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: User Stats & Achievement */}
          <div className="space-y-6">
            
            {/* Enhanced User Profile Card */}
            <Card className="floating-card glass-modern card-squircle animate-fade-in-left delay-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover glow-on-hover transition-all duration-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-on-hover transition-all duration-300">
                      <i className="fas fa-user text-2xl text-white"></i>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground text-gradient" data-testid="text-user-profile-name">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge className={contributionLevel.color + " mt-1 pulse-glow"}>
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

            {/* Enhanced Quick Stats */}
            <Card className="floating-card neon-border card-squircle animate-fade-in-left delay-400">
              <CardHeader>
                <CardTitle className="text-lg text-gradient flex items-center">
                  <i className="fas fa-chart-line mr-2 animate-float"></i>
                  My Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between magnetic-button p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="icon-squircle-sm bg-primary text-white">
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <span className="text-sm font-medium text-foreground">Complaints Filed</span>
                  </div>
                  <span className="font-bold text-xl text-gradient" data-testid="text-complaints-count">
                    {userStats?.activeComplaints + userStats?.resolvedComplaints || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between magnetic-button p-3 rounded-xl bg-gradient-to-r from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="icon-squircle-sm bg-secondary text-white">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <span className="text-sm font-medium text-foreground">Issues Resolved</span>
                  </div>
                  <span className="font-bold text-xl text-gradient" data-testid="text-resolved-count">
                    {userStats?.resolvedComplaints || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between magnetic-button p-3 rounded-xl bg-gradient-to-r from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="icon-squircle-sm bg-accent text-accent-foreground">
                      <i className="fas fa-thumbs-up"></i>
                    </div>
                    <span className="text-sm font-medium text-foreground">Upvotes Given</span>
                  </div>
                  <span className="font-bold text-xl text-gradient" data-testid="text-upvotes-count">
                    {userStats?.upvotesGiven || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between magnetic-button p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 hover:from-yellow-500/20 hover:to-yellow-500/10 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="icon-squircle-sm bg-yellow-500 text-white">
                      <i className="fas fa-clock"></i>
                    </div>
                    <span className="text-sm font-medium text-foreground">Active Issues</span>
                  </div>
                  <span className="font-bold text-xl text-gradient" data-testid="text-active-count">
                    {userStats?.activeComplaints || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced City Overview */}
            <Card className="floating-card glass-modern card-squircle animate-fade-in-left delay-500">
              <CardHeader>
                <CardTitle className="text-lg text-gradient flex items-center">
                  <i className="fas fa-city mr-2 animate-float"></i>
                  City Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center magnetic-button p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 hover:from-red-500/20 hover:to-red-500/10 transition-all duration-300">
                    <div className="text-2xl font-bold text-red-500 animate-scale-in" data-testid="text-city-high-priority">
                      {cityStats?.highPriorityCount || 0}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">High Priority</div>
                  </div>
                  <div className="text-center magnetic-button p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 transition-all duration-300">
                    <div className="text-2xl font-bold text-accent animate-scale-in delay-100">
                      {cityStats?.mediumPriorityCount || 0}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">Medium Priority</div>
                  </div>
                  <div className="text-center magnetic-button p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10 transition-all duration-300">
                    <div className="text-2xl font-bold text-secondary animate-scale-in delay-200">
                      {cityStats?.lowPriorityCount || 0}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">Low Priority</div>
                  </div>
                  <div className="text-center magnetic-button p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all duration-300">
                    <div className="text-2xl font-bold text-primary animate-scale-in delay-300">
                      {cityStats?.resolvedComplaints || 0}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">Resolved</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border/50 text-center">
                  <div className="text-sm text-muted-foreground font-medium">Average Response Time</div>
                  <div className="text-2xl font-bold text-gradient pulse-glow">
                    {cityStats?.averageResponseTime || "N/A"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center & Right Columns: Enhanced Feature Tabs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Enhanced Feature Navigation */}
            <Card className="floating-card glass-modern card-squircle-lg animate-fade-in-right delay-200">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-6 lg:grid-cols-8 squircle-lg mb-6">
                    <TabsTrigger value="overview" className="squircle-md text-xs">Overview</TabsTrigger>
                    <TabsTrigger value="search" className="squircle-md text-xs">Search</TabsTrigger>
                    <TabsTrigger value="notifications" className="squircle-md text-xs">Alerts</TabsTrigger>
                    <TabsTrigger value="analytics" className="squircle-md text-xs">Analytics</TabsTrigger>
                    <TabsTrigger value="social" className="squircle-md text-xs">Social</TabsTrigger>
                    <TabsTrigger value="settings" className="squircle-md text-xs">Settings</TabsTrigger>
                    <TabsTrigger value="complaint" className="squircle-md text-xs">File Issue</TabsTrigger>
                    <TabsTrigger value="community" className="squircle-md text-xs">Community</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab - Original Dashboard Content */}
                  <TabsContent value="overview" className="space-y-6">
            
                    {/* Enhanced Notifications */}
                    <Card className="floating-card glass-modern card-squircle animate-fade-in-right delay-300">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center text-gradient">
                  <i className="fas fa-bell mr-3 animate-float"></i>
                  Recent Notifications
                  {unreadNotifications.length > 0 && (
                    <Badge className="ml-3 bg-destructive text-destructive-foreground pulse-glow">
                      {unreadNotifications.length} new
                    </Badge>
                  )}
                </CardTitle>
                <Button variant="outline" size="sm" className="modern-button" data-testid="button-view-all-notifications">
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
                        className={`flex items-start space-x-3 p-4 rounded-xl transition-all duration-300 magnetic-button ${
                          notification.isRead ? 'bg-muted/30 hover:bg-muted/50' : 'bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 glow-on-hover'
                        }`}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className={`icon-squircle-sm flex items-center justify-center text-sm flex-shrink-0 glow-on-hover transition-all duration-300 ${
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

                    {/* Enhanced Recent Complaints */}
                    <Card className="floating-card glass-modern card-squircle animate-fade-in-right delay-400">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-gradient flex items-center">
                  <i className="fas fa-file-alt mr-3 animate-float"></i>
                  My Recent Complaints
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="modern-button"
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
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl magnetic-button hover:from-muted/70 hover:to-muted/50 transition-all duration-300"
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

                    {/* Enhanced Quick Actions */}
                    <Card className="floating-card neon-border card-squircle animate-fade-in-right delay-500">
              <CardHeader>
                <CardTitle className="text-lg text-gradient flex items-center">
                  <i className="fas fa-bolt mr-3 animate-float"></i>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="h-20 modern-button flex flex-col items-center justify-center space-y-2 bg-primary hover:bg-primary/90 btn-squircle-lg text-white font-semibold"
                    onClick={() => window.location.href = '/'}
                    data-testid="button-dashboard-new-complaint"
                  >
                    <i className="fas fa-plus-circle text-xl animate-scale-in"></i>
                    <span className="text-sm">New Complaint</span>
                  </Button>
                  
                  <Button 
                    variant="secondary"
                    className="h-20 modern-button flex flex-col items-center justify-center space-y-2 btn-squircle-lg font-semibold"
                    onClick={() => window.location.href = '/community'}
                    data-testid="button-dashboard-browse-community"
                  >
                    <i className="fas fa-users text-xl animate-scale-in delay-100"></i>
                    <span className="text-sm">Browse Community</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 modern-button flex flex-col items-center justify-center space-y-2 btn-squircle-lg font-semibold"
                    onClick={() => window.location.href = '#maps'}
                    data-testid="button-dashboard-view-map"
                  >
                    <i className="fas fa-map text-xl animate-scale-in delay-200"></i>
                    <span className="text-sm">View Issues Map</span>
                  </Button>
                </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Advanced Search Tab */}
                  <TabsContent value="search" className="space-y-6">
                    <AdvancedSearch 
                      onSearch={(filters) => {
                        setSearchFilters(filters);
                        toast({
                          title: "Search Applied",
                          description: "Filters have been applied to your search.",
                        });
                      }}
                      onClearFilters={() => {
                        setSearchFilters(null);
                        toast({
                          title: "Filters Cleared",
                          description: "All search filters have been cleared.",
                        });
                      }}
                    />
                  </TabsContent>

                  {/* Enhanced Notifications Tab */}
                  <TabsContent value="notifications" className="space-y-6">
                    <RealTimeNotifications />
                  </TabsContent>

                  {/* Data Analytics Tab */}
                  <TabsContent value="analytics" className="space-y-6">
                    <DataAnalytics />
                  </TabsContent>

                  {/* Social Features Tab */}
                  <TabsContent value="social" className="space-y-6">
                    <SocialFeatures />
                  </TabsContent>

                  {/* User Settings Tab */}
                  <TabsContent value="settings" className="space-y-6">
                    <UserSettings />
                  </TabsContent>

                  {/* Complaint Form Tab */}
                  <TabsContent value="complaint" className="space-y-6">
                    <ComplaintForm />
                    <div className="mt-6">
                      <Chatbot />
                    </div>
                  </TabsContent>

                  {/* Community Feed Tab */}
                  <TabsContent value="community" className="space-y-6">
                    <CommunityFeed />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
