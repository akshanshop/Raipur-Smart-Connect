import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface Complaint {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location: string;
  mediaUrls: string[];
  upvotes: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export default function Complaints() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const queryClient = useQueryClient();

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

  const { data: complaints = [], isLoading: complaintsLoading } = useQuery({
    queryKey: ["/api/complaints"],
    retry: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/complaints/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Complaint status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
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
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'status-open text-white';
      case 'in_progress':
        return 'status-progress text-white';
      case 'resolved':
        return 'status-resolved text-white';
      case 'closed':
        return 'status-closed text-white';
      default:
        return 'status-open text-white';
    }
  };

  const filteredComplaints = complaints.filter((complaint: Complaint) => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || complaint.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
            <i className="fas fa-file-alt text-primary mr-3"></i>
            My Complaints
          </h1>
          <p className="text-muted-foreground">Track and manage your civic complaints</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                <Input
                  placeholder="Search by title, ticket number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-complaints"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger data-testid="select-priority-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                  data-testid="button-new-complaint"
                >
                  <i className="fas fa-plus mr-2"></i>
                  New Complaint
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complaints List */}
        {complaintsLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
                <p className="text-muted-foreground">Loading your complaints...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredComplaints.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <i className="fas fa-inbox text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-medium text-foreground mb-2">No complaints found</h3>
                <p className="text-muted-foreground mb-4">
                  {complaints.length === 0 
                    ? "You haven't filed any complaints yet."
                    : "No complaints match your current filters."
                  }
                </p>
                <Button onClick={() => window.location.href = '/'} data-testid="button-create-first-complaint">
                  <i className="fas fa-plus mr-2"></i>
                  Create Your First Complaint
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint: Complaint) => (
              <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getPriorityBadgeColor(complaint.priority)}>
                          {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
                        </Badge>
                        <Badge variant="outline">
                          {complaint.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Ticket: {complaint.ticketNumber}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`text-complaint-title-${complaint.id}`}>
                        {complaint.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {complaint.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          {complaint.location}
                        </span>
                        <span>
                          <i className="fas fa-clock mr-1"></i>
                          {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                        </span>
                        {complaint.upvotes > 0 && (
                          <span>
                            <i className="fas fa-thumbs-up mr-1"></i>
                            {complaint.upvotes} upvotes
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={getStatusBadgeColor(complaint.status)}>
                        {complaint.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      {complaint.status === 'resolved' && complaint.resolvedAt && (
                        <span className="text-xs text-muted-foreground">
                          Resolved {formatDistanceToNow(new Date(complaint.resolvedAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Media Preview */}
                  {complaint.mediaUrls && complaint.mediaUrls.length > 0 && (
                    <div className="flex space-x-2 mb-4">
                      {complaint.mediaUrls.slice(0, 4).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Complaint media ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ))}
                      {complaint.mediaUrls.length > 4 && (
                        <div className="w-16 h-16 bg-muted rounded-lg border border-border flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            +{complaint.mediaUrls.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-view-details-${complaint.id}`}
                      >
                        <i className="fas fa-eye mr-2"></i>
                        View Details
                      </Button>
                      {complaint.status === 'open' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-edit-${complaint.id}`}
                        >
                          <i className="fas fa-edit mr-2"></i>
                          Edit
                        </Button>
                      )}
                    </div>
                    {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: complaint.id, status: 'resolved' })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-mark-resolved-${complaint.id}`}
                      >
                        <i className="fas fa-check mr-2"></i>
                        Mark as Resolved
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredComplaints.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {complaints.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {complaints.filter((c: Complaint) => c.status === 'open').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Open</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {complaints.filter((c: Complaint) => c.status === 'in_progress').length}
                  </div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {complaints.filter((c: Complaint) => c.status === 'resolved').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Resolved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {complaints.filter((c: Complaint) => c.status === 'closed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Closed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
