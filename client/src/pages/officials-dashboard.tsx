import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, CheckCircle, Clock, AlertTriangle, 
  MapPin, Trash2, Upload, Search, Filter
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface DashboardStats {
  total: number;
  solved: number;
  pending: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface IssueItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location: string;
  ticketNumber: string;
  userName: string;
  commentsCount: number;
  upvotesCount: number;
}

interface HeatmapPoint {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  lat: number;
  lng: number;
}

export default function OfficialsDashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/officials/dashboard/stats"],
  });

  // Fetch all issues
  const { data: issues = [], isLoading: issuesLoading } = useQuery<IssueItem[]>({
    queryKey: ["/api/officials/issues"],
  });

  // Fetch heatmap data
  const { data: heatmapData = [] } = useQuery<HeatmapPoint[]>({
    queryKey: ["/api/officials/dashboard/heatmap"],
  });

  // Delete issue mutation
  const deleteIssueMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/officials/issues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/officials/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/officials/dashboard/stats"] });
      toast({ title: "Issue deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete issue", variant: "destructive" });
    },
  });

  // Resolve issue mutation
  const resolveIssueMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await fetch(`/api/officials/issues/${id}/resolve`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to resolve issue");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/officials/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/officials/dashboard/stats"] });
      setSelectedIssue(null);
      toast({ title: "Issue resolved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to resolve issue", variant: "destructive" });
    },
  });

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "open": return "bg-yellow-500";
      case "closed": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const handleResolve = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedIssue) return;

    const formData = new FormData(e.currentTarget);
    resolveIssueMutation.mutate({ id: selectedIssue.id, formData });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Officials Dashboard</h1>
            <p className="text-muted-foreground">Manage and resolve civic issues</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-stats-total">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-issues">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-solved">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500" data-testid="text-solved-issues">{stats?.solved ?? 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-pending">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500" data-testid="text-pending-issues">{stats?.pending ?? 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-urgent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500" data-testid="text-urgent-issues">{stats?.byPriority?.urgent ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{stats?.byPriority?.urgent ?? 0}</div>
                <div className="text-sm text-muted-foreground">Urgent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{stats?.byPriority?.high ?? 0}</div>
                <div className="text-sm text-muted-foreground">High</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{stats?.byPriority?.medium ?? 0}</div>
                <div className="text-sm text-muted-foreground">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{stats?.byPriority?.low ?? 0}</div>
                <div className="text-sm text-muted-foreground">Low</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="issues" className="w-full">
          <TabsList>
            <TabsTrigger value="issues" data-testid="tab-issues">Issues</TabsTrigger>
            <TabsTrigger value="heatmap" data-testid="tab-heatmap">Heatmap</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-issues"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-priority-filter">
                      <SelectValue placeholder="Filter by priority" />
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
              </CardContent>
            </Card>

            {/* Issues List */}
            {issuesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map((issue) => (
                  <Card key={issue.id} data-testid={`card-issue-${issue.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold" data-testid={`text-issue-title-${issue.id}`}>{issue.title}</h3>
                            <Badge className={getPriorityColor(issue.priority)}>{issue.priority}</Badge>
                            <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{issue.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{issue.location}</span>
                            </div>
                            <span>•</span>
                            <span>Ticket: {issue.ticketNumber}</span>
                            <span>•</span>
                            <span>By: {issue.userName}</span>
                            <span>•</span>
                            <span>{issue.commentsCount} comments</span>
                            <span>•</span>
                            <span>{issue.upvotesCount} upvotes</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedIssue(issue)}
                                data-testid={`button-resolve-${issue.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Resolve Issue</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleResolve} className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Resolution Notes</label>
                                  <Input name="notes" placeholder="Enter resolution notes..." className="mt-1" />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Upload Resolution Screenshots</label>
                                  <Input type="file" name="screenshots" multiple accept="image/*" className="mt-1" />
                                </div>
                                <Button type="submit" disabled={resolveIssueMutation.isPending}>
                                  {resolveIssueMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Resolving...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4 mr-2" />
                                      Submit Resolution
                                    </>
                                  )}
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this issue?")) {
                                deleteIssueMutation.mutate(issue.id);
                              }
                            }}
                            data-testid={`button-delete-${issue.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredIssues.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No issues found
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="heatmap">
            <Card>
              <CardHeader>
                <CardTitle>Issues Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {heatmapData.length} issues with location data
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {heatmapData.map((point) => (
                      <Card key={point.id} data-testid={`card-heatmap-${point.id}`}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm">{point.title}</h4>
                              <Badge className={getPriorityColor(point.priority)}>{point.priority}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div>Category: {point.category}</div>
                              <div>Status: {point.status}</div>
                              <div>Location: {point.lat.toFixed(4)}, {point.lng.toFixed(4)}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {heatmapData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No location data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
