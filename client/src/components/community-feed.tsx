import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";

interface CommunityIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  location: string;
  status: string;
  upvotes: number;
  commentsCount: number;
  mediaUrls: string[];
  createdAt: string;
  userId: string;
}

export default function CommunityFeed() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("votes");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["/api/community-issues"],
    retry: false,
  });

  const { data: upvoteStatuses = {} } = useQuery({
    queryKey: ["/api/upvote/status", "community"],
    queryFn: async () => {
      // Get upvote status for all issues
      const statuses: Record<string, boolean> = {};
      for (const issue of issues) {
        try {
          const response = await fetch(`/api/upvote/status?communityIssueId=${issue.id}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            statuses[issue.id] = data.hasUpvoted;
          }
        } catch (error) {
          // Ignore individual errors
        }
      }
      return statuses;
    },
    enabled: issues.length > 0,
  });

  const upvoteMutation = useMutation({
    mutationFn: async (communityIssueId: string) => {
      const response = await apiRequest("POST", "/api/upvote", { communityIssueId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/upvote/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to process upvote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpvote = (issueId: string) => {
    upvoteMutation.mutate(issueId);
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'status-open';
      case 'in_progress':
        return 'status-progress';
      case 'resolved':
        return 'status-resolved';
      case 'closed':
        return 'status-closed';
      default:
        return 'status-open';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-accent text-accent-foreground';
      case 'low':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      'water-supply': 'bg-blue-500 text-white',
      'garbage-collection': 'bg-green-500 text-white',
      'road-maintenance': 'bg-yellow-500 text-white',
      'street-lighting': 'bg-purple-500 text-white',
      'drainage': 'bg-cyan-500 text-white',
      'parks-recreation': 'bg-emerald-500 text-white',
      'noise-pollution': 'bg-red-500 text-white',
      'other': 'bg-gray-500 text-white',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const filteredIssues = issues.filter((issue: CommunityIssue) => {
    if (categoryFilter !== "all" && issue.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const sortedIssues = [...filteredIssues].sort((a: CommunityIssue, b: CommunityIssue) => {
    switch (sortBy) {
      case 'votes':
        return b.upvotes - a.upvotes;
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
            <p className="text-muted-foreground">Loading community issues...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="community">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            <i className="fas fa-users text-primary mr-2"></i>
            Community Issues
          </h3>
          <div className="flex space-x-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40" data-testid="select-category-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="water-supply">Water Supply</SelectItem>
                <SelectItem value="garbage-collection">Garbage Collection</SelectItem>
                <SelectItem value="road-maintenance">Road Maintenance</SelectItem>
                <SelectItem value="street-lighting">Street Lighting</SelectItem>
                <SelectItem value="drainage">Drainage</SelectItem>
                <SelectItem value="parks-recreation">Parks & Recreation</SelectItem>
                <SelectItem value="noise-pollution">Noise Pollution</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32" data-testid="select-sort-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="votes">Most Voted</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="priority">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Issue Cards */}
        <div className="space-y-4">
          {sortedIssues.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-exclamation-circle text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">No community issues found.</p>
            </div>
          ) : (
            sortedIssues.map((issue: CommunityIssue) => (
              <div 
                key={issue.id} 
                className={`bg-muted rounded-lg p-4 ${getPriorityClass(issue.priority)}`}
                data-testid={`card-issue-${issue.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadgeColor(issue.priority)}`}>
                      {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)} Priority
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryBadgeColor(issue.category)}`}>
                      {issue.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                <h4 className="font-medium text-foreground mb-2" data-testid={`text-issue-title-${issue.id}`}>
                  {issue.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {issue.description}
                </p>
                
                {/* Media Preview */}
                {issue.mediaUrls && issue.mediaUrls.length > 0 && (
                  <div className="flex space-x-2 mb-3">
                    {issue.mediaUrls.slice(0, 3).map((url, index) => (
                      <img 
                        key={index}
                        src={url} 
                        alt={`Issue media ${index + 1}`}
                        className="w-16 h-12 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpvote(issue.id)}
                      disabled={upvoteMutation.isPending}
                      className={`flex items-center space-x-1 ${
                        upvoteStatuses[issue.id] ? 'text-primary' : 'text-muted-foreground'
                      } hover:text-primary transition-colors`}
                      data-testid={`button-upvote-${issue.id}`}
                    >
                      <i className={`fas fa-thumbs-up ${upvoteStatuses[issue.id] ? 'text-primary' : ''}`}></i>
                      <span className="text-sm font-medium">{issue.upvotes}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`button-comment-${issue.id}`}
                    >
                      <i className="fas fa-comment"></i>
                      <span className="text-sm">{issue.commentsCount}</span>
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      {issue.location}
                    </span>
                  </div>
                  <span className={`text-white text-xs px-2 py-1 rounded-full ${getStatusClass(issue.status)}`}>
                    {issue.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        
        {sortedIssues.length > 0 && (
          <div className="mt-4 text-center">
            <Button 
              variant="ghost"
              className="text-primary hover:text-primary/80 transition-colors"
              data-testid="button-load-more"
            >
              <i className="fas fa-chevron-down mr-2"></i>
              Load More Issues
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
