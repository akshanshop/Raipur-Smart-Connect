import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface MapIssue {
  id: string;
  title: string;
  priority: string;
  status: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  upvotes: number;
}

export default function MapsIntegration() {
  const [viewMode, setViewMode] = useState<"heatmap" | "individual">("individual");
  const [areaFilter, setAreaFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const { data: complaints = [] } = useQuery({
    queryKey: ["/api/complaints/all"],
    retry: false,
  });

  const { data: communityIssues = [] } = useQuery({
    queryKey: ["/api/community-issues"],
    retry: false,
  });

  const { data: cityStats } = useQuery({
    queryKey: ["/api/stats/city"],
    retry: false,
  });

  // Combine complaints and community issues for map display
  const allIssues: MapIssue[] = [
    ...complaints.map((c: any) => ({ ...c, type: 'complaint' })),
    ...communityIssues.map((i: any) => ({ ...i, type: 'community_issue' }))
  ].filter((issue: any) => issue.latitude && issue.longitude);

  const filteredIssues = allIssues.filter((issue: MapIssue) => {
    const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter;
    // Note: Area filtering would require actual geocoding or predefined areas
    return matchesPriority;
  });

  const getMarkerColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return '#ef4444'; // red
      case 'medium':
        return '#f97316'; // orange
      case 'low':
        return '#22c55e'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  const getMarkerSize = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 32;
      case 'medium':
        return 24;
      case 'low':
        return 20;
      default:
        return 16;
    }
  };

  // Simulate map initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapLoaded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleMarkerClick = (issueId: string) => {
    // TODO: Show issue details popup
    console.log('Showing issue details for:', issueId);
  };

  const handleZoomIn = () => {
    // TODO: Implement zoom functionality
    console.log('Zooming in...');
  };

  const handleZoomOut = () => {
    // TODO: Implement zoom functionality
    console.log('Zooming out...');
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // TODO: Center map on user location
          console.log('User location:', position.coords);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <section id="maps">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-map text-primary mr-2"></i>
            City Issues Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant={viewMode === "heatmap" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("heatmap")}
                data-testid="button-heatmap-view"
              >
                <i className="fas fa-fire mr-2"></i>
                Issue Heatmap
              </Button>
              <Button
                variant={viewMode === "individual" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("individual")}
                data-testid="button-individual-view"
              >
                <i className="fas fa-map-pin mr-2"></i>
                Individual Issues
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-32" data-testid="select-area-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="sector-21">Sector 21</SelectItem>
                  <SelectItem value="sector-15">Sector 15</SelectItem>
                  <SelectItem value="central-park">Central Park</SelectItem>
                  <SelectItem value="civil-lines">Civil Lines</SelectItem>
                  <SelectItem value="shankar-nagar">Shankar Nagar</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32" data-testid="select-map-priority-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issues</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Map Container */}
          <div className="h-96 bg-muted rounded-lg relative overflow-hidden" data-testid="map-container">
            {!isMapLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Simulated Map Background */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-70"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600')",
                  }}
                />
                
                {/* Map Overlay for Heatmap Mode */}
                {viewMode === "heatmap" && (
                  <div className="absolute inset-0">
                    {/* Heatmap visualization would go here */}
                    <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-red-500 rounded-full opacity-30 blur-xl" />
                    <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-orange-500 rounded-full opacity-25 blur-lg" />
                    <div className="absolute bottom-1/3 left-1/2 w-20 h-20 bg-yellow-500 rounded-full opacity-20 blur-md" />
                  </div>
                )}

                {/* Individual Issue Markers */}
                {viewMode === "individual" && (
                  <div className="absolute inset-0">
                    {filteredIssues.slice(0, 10).map((issue, index) => {
                      // Simulate marker positions
                      const positions = [
                        { top: '25%', left: '30%' },
                        { top: '40%', left: '60%' },
                        { top: '60%', left: '20%' },
                        { top: '30%', left: '70%' },
                        { top: '70%', left: '50%' },
                        { top: '20%', left: '80%' },
                        { top: '80%', left: '25%' },
                        { top: '45%', left: '85%' },
                        { top: '15%', left: '40%' },
                        { top: '75%', left: '75%' },
                      ];
                      const position = positions[index % positions.length];

                      return (
                        <div
                          key={issue.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
                          style={{ top: position.top, left: position.left }}
                          onClick={() => handleMarkerClick(issue.id)}
                          data-testid={`map-marker-${issue.id}`}
                        >
                          <div
                            className="rounded-full flex items-center justify-center shadow-lg text-white font-bold text-xs"
                            style={{
                              backgroundColor: getMarkerColor(issue.priority),
                              width: getMarkerSize(issue.priority),
                              height: getMarkerSize(issue.priority),
                            }}
                          >
                            {issue.priority === 'high' || issue.priority === 'urgent' ? (
                              <i className="fas fa-exclamation"></i>
                            ) : issue.priority === 'medium' ? (
                              <i className="fas fa-info"></i>
                            ) : (
                              <i className="fas fa-check"></i>
                            )}
                          </div>
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                            {issue.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Map Controls */}
                <div className="absolute top-4 right-4 space-y-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleZoomIn}
                    data-testid="button-zoom-in"
                  >
                    <i className="fas fa-plus"></i>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleZoomOut}
                    data-testid="button-zoom-out"
                  >
                    <i className="fas fa-minus"></i>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCurrentLocation}
                    data-testid="button-current-location"
                  >
                    <i className="fas fa-location-arrow"></i>
                  </Button>
                </div>

                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-card rounded-lg p-3 shadow-md">
                  <h5 className="text-sm font-medium text-foreground mb-2">Issue Priority</h5>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs text-muted-foreground">High Priority</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-xs text-muted-foreground">Medium Priority</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-muted-foreground">Low Priority</span>
                    </div>
                  </div>
                </div>

                {/* Current View Info */}
                <div className="absolute top-4 left-4 bg-card rounded-lg p-2 shadow-md">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {viewMode === "heatmap" ? "Heatmap View" : "Individual Markers"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {filteredIssues.length} issues shown
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Map Statistics */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-destructive" data-testid="text-map-high-priority">
                {cityStats?.highPriorityCount || 0}
              </div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-accent">
                {cityStats?.mediumPriorityCount || 0}
              </div>
              <div className="text-xs text-muted-foreground">Medium Priority</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-secondary">
                {cityStats?.lowPriorityCount || 0}
              </div>
              <div className="text-xs text-muted-foreground">Low Priority</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {cityStats?.resolvedComplaints || 0}
              </div>
              <div className="text-xs text-muted-foreground">Resolved</div>
            </div>
          </div>

          {/* Integration Notice */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <i className="fas fa-info-circle text-primary"></i>
              <span className="text-sm text-muted-foreground">
                This map will integrate with Google Maps API for real location data and interactive features.
                Current view shows simulated data for demonstration.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
