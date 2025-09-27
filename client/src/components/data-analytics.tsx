import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface AnalyticsData {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  averageResolutionTime: string;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  monthlyTrends: Array<{
    month: string;
    complaints: number;
    resolved: number;
  }>;
  topIssues: Array<{
    title: string;
    count: number;
    status: string;
    priority: string;
  }>;
  userEngagement: {
    activeUsers: number;
    newUsers: number;
    communityPosts: number;
    upvotes: number;
  };
}

export default function DataAnalytics() {
  const [timeframe, setTimeframe] = useState("30days");
  const [view, setView] = useState("overview");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics", timeframe],
    queryFn: async (): Promise<AnalyticsData> => {
      // Mock analytics data - in real app this would fetch from API
      return {
        totalComplaints: 1247,
        resolvedComplaints: 892,
        pendingComplaints: 355,
        averageResolutionTime: "4.2 days",
        categoryBreakdown: [
          { category: "Water Supply", count: 324, percentage: 26, trend: "up" },
          { category: "Road Maintenance", count: 287, percentage: 23, trend: "down" },
          { category: "Garbage Collection", count: 156, percentage: 12.5, trend: "stable" },
          { category: "Street Lighting", count: 143, percentage: 11.5, trend: "up" },
          { category: "Drainage", count: 127, percentage: 10.2, trend: "stable" },
          { category: "Parks & Recreation", count: 98, percentage: 7.9, trend: "up" },
          { category: "Noise Pollution", count: 67, percentage: 5.4, trend: "down" },
          { category: "Other", count: 45, percentage: 3.6, trend: "stable" }
        ],
        monthlyTrends: [
          { month: "Jan", complaints: 89, resolved: 67 },
          { month: "Feb", complaints: 124, resolved: 98 },
          { month: "Mar", complaints: 156, resolved: 134 },
          { month: "Apr", complaints: 187, resolved: 167 },
          { month: "May", complaints: 203, resolved: 189 },
          { month: "Jun", complaints: 178, resolved: 156 }
        ],
        topIssues: [
          { title: "Water shortage in Sector 21", count: 45, status: "in_progress", priority: "high" },
          { title: "Pothole on Ring Road", count: 38, status: "open", priority: "medium" },
          { title: "Streetlight outage in Civil Lines", count: 29, status: "resolved", priority: "medium" },
          { title: "Garbage not collected for 3 days", count: 27, status: "in_progress", priority: "high" },
          { title: "Drainage overflow in Pandri", count: 23, status: "open", priority: "urgent" }
        ],
        userEngagement: {
          activeUsers: 3247,
          newUsers: 156,
          communityPosts: 89,
          upvotes: 1456
        }
      };
    }
  });

  const getResolutionRate = () => {
    if (!analytics) return 0;
    return Math.round((analytics.resolvedComplaints / analytics.totalComplaints) * 100);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'fas fa-arrow-up text-green-500';
      case 'down': return 'fas fa-arrow-down text-red-500';
      case 'stable': return 'fas fa-minus text-yellow-500';
      default: return 'fas fa-minus text-gray-500';
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

  if (isLoading) {
    return (
      <Card className="floating-card glass-modern card-squircle-lg">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="floating-card glass-modern card-squircle-lg animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-xl text-gradient flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-chart-bar mr-3 animate-float"></i>
            Data Analytics & Insights
          </div>
          <div className="flex space-x-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32 squircle-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Days</SelectItem>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="90days">90 Days</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={view} onValueChange={setView}>
              <SelectTrigger className="w-32 squircle-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="trends">Trends</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 squircle-lg magnetic-button hover:from-primary/20 hover:to-primary/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <i className="fas fa-file-alt text-primary text-xl"></i>
              <Badge className="squircle-full bg-primary text-primary-foreground">Total</Badge>
            </div>
            <div className="text-2xl font-bold text-gradient">{analytics?.totalComplaints}</div>
            <div className="text-sm text-muted-foreground">Complaints Filed</div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 squircle-lg magnetic-button hover:from-green-500/20 hover:to-green-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <i className="fas fa-check-circle text-green-500 text-xl"></i>
              <Badge className="squircle-full bg-green-500 text-white">{getResolutionRate()}%</Badge>
            </div>
            <div className="text-2xl font-bold text-green-500">{analytics?.resolvedComplaints}</div>
            <div className="text-sm text-muted-foreground">Resolved Issues</div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 squircle-lg magnetic-button hover:from-yellow-500/20 hover:to-yellow-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <i className="fas fa-clock text-yellow-500 text-xl"></i>
              <Badge className="squircle-full bg-yellow-500 text-white">Avg</Badge>
            </div>
            <div className="text-2xl font-bold text-yellow-500">{analytics?.pendingComplaints}</div>
            <div className="text-sm text-muted-foreground">Pending Issues</div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 squircle-lg magnetic-button hover:from-blue-500/20 hover:to-blue-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <i className="fas fa-stopwatch text-blue-500 text-xl"></i>
              <Badge className="squircle-full bg-blue-500 text-white">Time</Badge>
            </div>
            <div className="text-2xl font-bold text-blue-500">{analytics?.averageResolutionTime}</div>
            <div className="text-sm text-muted-foreground">Avg Resolution</div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gradient mb-4 flex items-center">
            <i className="fas fa-chart-pie mr-2 animate-float"></i>
            Category Breakdown
          </h3>
          <div className="space-y-3">
            {analytics?.categoryBreakdown.map((category, index) => (
              <div key={index} className="p-3 bg-gradient-to-r from-muted/30 to-muted/20 squircle-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-foreground">{category.category}</span>
                    <i className={getTrendIcon(category.trend)}></i>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{category.count} issues</span>
                    <Badge className="squircle-full">{category.percentage}%</Badge>
                  </div>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Top Issues */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gradient mb-4 flex items-center">
            <i className="fas fa-star mr-2 animate-float"></i>
            Top Issues
          </h3>
          <div className="space-y-2">
            {analytics?.topIssues.map((issue, index) => (
              <div key={index} className="p-3 bg-gradient-to-r from-muted/30 to-muted/20 squircle-lg magnetic-button hover:from-muted/50 hover:to-muted/40 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{issue.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {issue.count} reports • {issue.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`squircle-full ${getPriorityColor(issue.priority)} text-white`}>
                      {issue.priority}
                    </Badge>
                    <Button variant="outline" size="sm" className="modern-button btn-squircle">
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Engagement */}
        <div>
          <h3 className="text-lg font-semibold text-gradient mb-4 flex items-center">
            <i className="fas fa-users mr-2 animate-float"></i>
            Community Engagement
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gradient-to-r from-purple-500/10 to-purple-500/5 squircle-lg">
              <div className="text-xl font-bold text-purple-500">{analytics?.userEngagement.activeUsers}</div>
              <div className="text-xs text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 squircle-lg">
              <div className="text-xl font-bold text-emerald-500">{analytics?.userEngagement.newUsers}</div>
              <div className="text-xs text-muted-foreground">New Users</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 squircle-lg">
              <div className="text-xl font-bold text-cyan-500">{analytics?.userEngagement.communityPosts}</div>
              <div className="text-xs text-muted-foreground">Community Posts</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-r from-pink-500/10 to-pink-500/5 squircle-lg">
              <div className="text-xl font-bold text-pink-500">{analytics?.userEngagement.upvotes}</div>
              <div className="text-xs text-muted-foreground">Total Upvotes</div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-6 pt-4 border-t border-border/50 flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="modern-button btn-squircle">
              <i className="fas fa-download mr-2"></i>
              Export PDF
            </Button>
            <Button variant="outline" size="sm" className="modern-button btn-squircle">
              <i className="fas fa-file-excel mr-2"></i>
              Export Excel
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="modern-button btn-squircle">
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}