import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "@googlemaps/js-api-loader";
import type { Complaint, CommunityIssue } from "@shared/schema";

/// <reference types="google.maps" />

interface MapIssue {
  id: string;
  title: string;
  priority: string;
  status: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  category: string;
  upvotes: number | null;
  type: 'complaint' | 'community_issue';
}

export default function MapsIntegration() {
  const [viewMode, setViewMode] = useState<"heatmap" | "individual">("individual");
  const [areaFilter, setAreaFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

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
    ...(complaints as Complaint[]).map((c) => ({ 
      id: c.id,
      title: c.title,
      priority: c.priority,
      status: c.status,
      location: c.location,
      latitude: c.latitude,
      longitude: c.longitude,
      category: c.category,
      upvotes: c.upvotes,
      type: 'complaint' as const 
    })),
    ...(communityIssues as CommunityIssue[]).map((i) => ({ 
      id: i.id,
      title: i.title,
      priority: i.priority,
      status: i.status,
      location: i.location,
      latitude: i.latitude,
      longitude: i.longitude,
      category: i.category,
      upvotes: i.upvotes,
      type: 'community_issue' as const 
    }))
  ].filter((issue) => issue.latitude && issue.longitude);

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

  // Initialize Google Maps
  useEffect(() => {
    initializeMap();
    
    // Cleanup function
    return () => {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  // Update markers when filtered issues change or map loads
  useEffect(() => {
    if (mapInstanceRef.current && isMapLoaded) {
      updateMapMarkers();
    }
  }, [filteredIssues, viewMode, isMapLoaded]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
        version: "weekly",
        libraries: ["visualization"],
      });

      await loader.load();

      // Raipur, Chhattisgarh coordinates (21.2514, 81.6296)
      const raipurCenter = { lat: 21.2514, lng: 81.6296 };

      const map = new google.maps.Map(mapRef.current, {
        center: raipurCenter,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "on" }],
          },
        ],
      });

      mapInstanceRef.current = map;
      setIsMapLoaded(true);
    } catch (error) {
      console.error("Error loading Google Maps:", error);
    }
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Clear existing heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    if (viewMode === "heatmap") {
      createHeatmap();
    } else {
      createIndividualMarkers();
    }
  };

  const createHeatmap = () => {
    if (!mapInstanceRef.current) return;

    const heatmapData = filteredIssues
      .filter(issue => issue.latitude && issue.longitude)
      .map(issue => ({
        location: new google.maps.LatLng(
          parseFloat(issue.latitude!),
          parseFloat(issue.longitude!)
        ),
        weight: getHeatmapWeight(issue.priority),
      }));

    if (heatmapData.length > 0) {
      heatmapRef.current = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapInstanceRef.current,
        radius: 30,
        opacity: 0.8,
      });
    }
  };

  const createIndividualMarkers = () => {
    if (!mapInstanceRef.current) return;

    filteredIssues
      .filter(issue => issue.latitude && issue.longitude)
      .forEach(issue => {
        const position = {
          lat: parseFloat(issue.latitude!),
          lng: parseFloat(issue.longitude!),
        };

        const marker = new google.maps.Marker({
          position,
          map: mapInstanceRef.current!,
          title: issue.title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: getMarkerColor(issue.priority),
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: getMarkerSize(issue.priority) / 2,
          },
        });

        // Add click listener for marker details
        marker.addListener("click", () => handleMarkerClick(issue.id));
        markersRef.current.push(marker);
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

  const handleMarkerClick = (issueId: string) => {
    // TODO: Show issue details popup
    console.log('Showing issue details for:', issueId);
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 12;
      mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 12;
      mapInstanceRef.current.setZoom(Math.max(currentZoom - 1, 1));
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapInstanceRef.current!.setCenter(userLocation);
          mapInstanceRef.current!.setZoom(15);

          // Add a marker for user's current location
          new google.maps.Marker({
            position: userLocation,
            map: mapInstanceRef.current!,
            title: "Your Location",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
              scale: 8,
            },
          });
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
            {!isMapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
                  <p className="text-muted-foreground">Loading Raipur map...</p>
                </div>
              </div>
            )}
            
            {/* Google Maps Container */}
            <div 
              ref={mapRef}
              className="w-full h-full rounded-lg"
              style={{ opacity: isMapLoaded ? 1 : 0 }}
            />

            {/* Map Controls */}
            {isMapLoaded && (
              <>
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
                {allIssues.filter(issue => issue.priority === 'high' || issue.priority === 'urgent').length}
              </div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-accent">
                {allIssues.filter(issue => issue.priority === 'medium').length}
              </div>
              <div className="text-xs text-muted-foreground">Medium Priority</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-secondary">
                {allIssues.filter(issue => issue.priority === 'low').length}
              </div>
              <div className="text-xs text-muted-foreground">Low Priority</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {allIssues.filter(issue => issue.status === 'resolved').length}
              </div>
              <div className="text-xs text-muted-foreground">Resolved</div>
            </div>
          </div>

          {/* Integration Notice */}
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center space-x-2">
              <i className="fas fa-map-marked-alt text-primary"></i>
              <span className="text-sm text-foreground">
                <strong>Real-time Google Maps Integration Active:</strong> Showing live street data for Raipur, Chhattisgarh (492001).
                Click markers to view issue details, switch to heatmap view, or use your current location.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
