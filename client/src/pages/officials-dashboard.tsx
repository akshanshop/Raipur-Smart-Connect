import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, CheckCircle, Clock, AlertTriangle, 
  MapPin, Trash2, Upload, Search, Filter, LogOut
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import OfficialsNotificationPanel from "@/components/officials-notification-panel";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

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

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

function HeatmapLayer({ points }: { points: Array<[number, number, number]> }) {
  const map = useMap();
  
  useEffect(() => {
    if (points.length === 0) return;
    
    // @ts-ignore - leaflet.heat types
    const heatLayer = L.heatLayer(points, {
      radius: 30,
      blur: 25,
      maxZoom: 17,
      max: 4,
      gradient: {
        0.0: '#22c55e',
        0.5: '#f97316', 
        0.75: '#ef4444',
        1.0: '#dc2626'
      }
    }).addTo(map);
    
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [points, map]);
  
  return null;
}

export default function OfficialsDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [mapViewMode, setMapViewMode] = useState<"heatmap" | "individual" | "density">("individual");
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.2514, 81.6296]);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef<L.Map | null>(null);

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

  const getMarkerColor = (status: string, priority: string) => {
    // Green for resolved issues
    if (status === 'resolved') {
      return '#22c55e'; // green
    }
    
    // Color based on priority for active issues
    switch (priority) {
      case 'urgent':
      case 'high':
        return '#ef4444'; // red (>7 reports in area)
      case 'medium':
        return '#f97316'; // orange (3-7 reports in area)
      case 'low':
        return '#eab308'; // yellow (<3 reports in area)
      default:
        return '#6b7280';
    }
  };

  const getDensityColor = (count: number) => {
    if (count < 3) return '#eab308'; // yellow
    if (count >= 3 && count <= 7) return '#f97316'; // orange
    return '#ef4444'; // red (>7)
  };

  const createCustomIcon = (status: string, priority: string) => {
    const color = getMarkerColor(status, priority);
    const size = priority === 'urgent' || priority === 'high' ? 32 : priority === 'medium' ? 24 : 20;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const createDensityIcon = (count: number) => {
    const color = getDensityColor(count);
    const size = Math.min(20 + (count * 3), 50); // Scale size based on count
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 12px;">${count}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const getHeatmapWeight = (priority: string): number => {
    switch (priority) {
      case 'urgent':
        return 4;
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 1;
    }
  };

  const heatmapPoints: Array<[number, number, number]> = heatmapData.map(point => [
    point.lat,
    point.lng,
    getHeatmapWeight(point.priority)
  ]);

  // Group issues by location for density view (proximity-based grouping)
  // Round coordinates to 3 decimal places (~100m precision) to group nearby issues
  const locationGroups = heatmapData.reduce((acc, point) => {
    const roundedLat = Math.round(point.lat * 1000) / 1000;
    const roundedLng = Math.round(point.lng * 1000) / 1000;
    const key = `${roundedLat},${roundedLng}`;
    
    if (!acc[key]) {
      acc[key] = {
        lat: roundedLat,
        lng: roundedLng,
        issues: [],
        count: 0
      };
    }
    acc[key].issues.push(point);
    acc[key].count++;
    return acc;
  }, {} as Record<string, { lat: number; lng: number; issues: HeatmapPoint[]; count: number }>);

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header with Logout */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border/50 cool-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center magnetic-button">
                <i className="fas fa-user-shield text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Officials Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage and resolve civic issues</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <OfficialsNotificationPanel />
              
              {/* User Profile */}
              <div className="flex items-center space-x-3 bg-card/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/30">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-lg object-cover ring-2 ring-primary/20"
                    data-testid="img-official-avatar"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <i className="fas fa-user text-primary text-lg"></i>
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground" data-testid="text-official-name">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'Official'}
                  </p>
                  <Badge className="bg-primary/20 text-primary border-primary/30">Official</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/api/logout'}
                  data-testid="button-official-logout"
                  className="rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Enhanced Hero Section */}
        <div className="relative rounded-3xl overflow-hidden hero-enhanced p-8 text-white pattern-overlay cool-shadow animate-fade-in-up">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2 flex items-center">
              <i className="fas fa-chart-line mr-3 animate-float"></i>
              Dashboard Overview
            </h2>
            <p className="text-lg opacity-95">
              Monitor and manage all civic issues efficiently
            </p>
          </div>
        </div>

        {/* Enhanced Stats Cards with Animations */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-stats-total" className="floating-card animate-fade-in-up delay-100 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient" data-testid="text-total-issues">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-solved" className="floating-card animate-fade-in-up delay-200 hover:border-green-500/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500" data-testid="text-solved-issues">{stats?.solved ?? 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-pending" className="floating-card animate-fade-in-up delay-300 hover:border-yellow-500/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500" data-testid="text-pending-issues">{stats?.pending ?? 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-urgent" className="floating-card animate-fade-in-up delay-400 hover:border-red-500/50 transition-all duration-300">
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

        {/* Enhanced Tabs for different views */}
        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="issues" data-testid="tab-issues" className="transition-all duration-300">
              <FileText className="h-4 w-4 mr-2" />
              Issues List
            </TabsTrigger>
            <TabsTrigger value="heatmap" data-testid="tab-heatmap" className="transition-all duration-300">
              <MapPin className="h-4 w-4 mr-2" />
              Data View
            </TabsTrigger>
            <TabsTrigger value="map" data-testid="tab-map" className="transition-all duration-300">
              <i className="fas fa-map mr-2"></i>
              Live Map
            </TabsTrigger>
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
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  Issues Data View
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {heatmapData.length} issues with location data
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {heatmapData.map((point) => (
                      <Card key={point.id} data-testid={`card-heatmap-${point.id}`} className="floating-card hover:border-primary/50 transition-all duration-300">
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

          {/* New Map Tab */}
          <TabsContent value="map">
            <Card className="floating-card animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center text-gradient">
                  <i className="fas fa-map-marked-alt mr-2"></i>
                  Live Issues Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Map Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={mapViewMode === "individual" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMapViewMode("individual")}
                        data-testid="button-map-individual-view"
                        className="modern-button"
                      >
                        <i className="fas fa-map-pin mr-2"></i>
                        Individual
                      </Button>
                      <Button
                        variant={mapViewMode === "heatmap" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMapViewMode("heatmap")}
                        data-testid="button-map-heatmap-view"
                        className="modern-button"
                      >
                        <i className="fas fa-fire mr-2"></i>
                        Heatmap
                      </Button>
                      <Button
                        variant={mapViewMode === "density" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMapViewMode("density")}
                        data-testid="button-map-density-view"
                        className="modern-button"
                      >
                        <i className="fas fa-layer-group mr-2"></i>
                        By Count
                      </Button>
                    </div>
                    <Badge variant="outline" className="pulse-glow">
                      {mapViewMode === "density" ? `${Object.keys(locationGroups).length} locations` : `${heatmapData.length} issues`} on map
                    </Badge>
                  </div>

                  {/* Map Container */}
                  <div className="h-96 bg-muted rounded-lg relative overflow-hidden" data-testid="officials-map-container">
                    <MapContainer
                      center={mapCenter}
                      zoom={mapZoom}
                      className="w-full h-full rounded-lg"
                      ref={mapRef}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      <MapController center={mapCenter} zoom={mapZoom} />
                      
                      {mapViewMode === "heatmap" ? (
                        <HeatmapLayer points={heatmapPoints} />
                      ) : mapViewMode === "density" ? (
                        Object.values(locationGroups).map((group, index) => (
                          <Marker
                            key={`group-${index}`}
                            position={[group.lat, group.lng]}
                            icon={createDensityIcon(group.count)}
                          >
                            <Popup>
                              <div className="p-2">
                                <h3 className="font-semibold text-sm">{group.count} Reports at this location</h3>
                                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                  {group.issues.map((issue) => (
                                    <div key={issue.id} className="text-xs border-b pb-1">
                                      <p className="font-medium">{issue.title}</p>
                                      <div className="flex gap-1 mt-1">
                                        <Badge className="text-xs">{issue.priority}</Badge>
                                        <Badge className="text-xs">{issue.status}</Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))
                      ) : (
                        heatmapData.map((point) => (
                          <Marker
                            key={point.id}
                            position={[point.lat, point.lng]}
                            icon={createCustomIcon(point.status, point.priority)}
                          >
                            <Popup>
                              <div className="p-2">
                                <h3 className="font-semibold text-sm">{point.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{point.category}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className="text-xs">{point.priority}</Badge>
                                  <Badge className="text-xs">{point.status}</Badge>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))
                      )}
                    </MapContainer>

                    {/* Map Legend */}
                    <div className="absolute bottom-4 left-4 bg-card rounded-lg p-3 shadow-md z-[1000]">
                      {mapViewMode === "density" ? (
                        <>
                          <h5 className="text-sm font-medium text-foreground mb-2">Report Density</h5>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <span className="text-xs text-muted-foreground">&lt;3 reports</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              <span className="text-xs text-muted-foreground">3-7 reports</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-xs text-muted-foreground">&gt;7 reports</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <h5 className="text-sm font-medium text-foreground mb-2">Issue Status</h5>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-xs text-muted-foreground">Resolved</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-xs text-muted-foreground">Urgent (&gt;7 reports)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              <span className="text-xs text-muted-foreground">Medium (3-7 reports)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <span className="text-xs text-muted-foreground">Low (&lt;3 reports)</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* View Mode Info */}
                    <div className="absolute top-4 left-4 bg-card rounded-lg p-2 shadow-md z-[1000]">
                      <Badge variant="outline">
                        {mapViewMode === "heatmap" ? "Heatmap View" : mapViewMode === "density" ? "Density View" : "Individual Markers"}
                      </Badge>
                    </div>
                  </div>

                  {/* Map Info */}
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-info-circle text-primary"></i>
                      <span className="text-sm text-foreground">
                        <strong>OpenStreetMap Integration:</strong> Showing live data for Raipur, Chhattisgarh. 
                        Toggle between Individual markers, Heatmap, and By Count views to analyze issue distribution and density.
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
