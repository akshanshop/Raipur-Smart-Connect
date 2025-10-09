import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Complaint, CommunityIssue } from "@shared/schema";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// Fix for default marker icons in Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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

export default function MapsIntegration() {
  const [viewMode, setViewMode] = useState<"heatmap" | "individual" | "density">("individual");
  const [areaFilter, setAreaFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.2514, 81.6296]);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef<L.Map | null>(null);

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
    return matchesPriority;
  });

  const getMarkerColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f97316';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const getDensityColor = (count: number) => {
    if (count < 3) return '#eab308'; // yellow
    if (count >= 3 && count <= 7) return '#f97316'; // orange
    return '#ef4444'; // red (>7)
  };

  const createCustomIcon = (priority: string) => {
    const color = getMarkerColor(priority);
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

  const heatmapPoints: Array<[number, number, number]> = filteredIssues
    .filter(issue => issue.latitude && issue.longitude)
    .map(issue => [
      parseFloat(issue.latitude!),
      parseFloat(issue.longitude!),
      getHeatmapWeight(issue.priority)
    ]);

  // Group issues by location for density view
  const locationGroups = filteredIssues.reduce((acc, issue) => {
    const key = `${issue.latitude},${issue.longitude}`;
    if (!acc[key]) {
      acc[key] = {
        lat: parseFloat(issue.latitude!),
        lng: parseFloat(issue.longitude!),
        issues: [],
        count: 0
      };
    }
    acc[key].issues.push(issue);
    acc[key].count++;
    return acc;
  }, {} as Record<string, { lat: number; lng: number; issues: MapIssue[]; count: number }>);

  const handleZoomIn = () => {
    setMapZoom(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setMapZoom(prev => Math.max(prev - 1, 1));
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMapZoom(15);
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
                Heatmap
              </Button>
              <Button
                variant={viewMode === "individual" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("individual")}
                data-testid="button-individual-view"
              >
                <i className="fas fa-map-pin mr-2"></i>
                Individual
              </Button>
              <Button
                variant={viewMode === "density" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("density")}
                data-testid="button-density-view"
              >
                <i className="fas fa-layer-group mr-2"></i>
                By Count
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
              
              {viewMode === "heatmap" ? (
                <HeatmapLayer points={heatmapPoints} />
              ) : viewMode === "density" ? (
                Object.values(locationGroups).map((group, index) => (
                  <Marker
                    key={`group-${index}`}
                    position={[group.lat, group.lng]}
                    icon={createDensityIcon(group.count)}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-sm">{group.count} Reports at this location</h3>
                        <p className="text-xs text-muted-foreground mt-1">{group.issues[0].location}</p>
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
                filteredIssues.map((issue) => (
                  <Marker
                    key={issue.id}
                    position={[parseFloat(issue.latitude!), parseFloat(issue.longitude!)]}
                    icon={createCustomIcon(issue.priority)}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-sm">{issue.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{issue.location}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="text-xs">{issue.priority}</Badge>
                          <Badge className="text-xs">{issue.status}</Badge>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))
              )}
            </MapContainer>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 space-y-2 z-[1000]">
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
            <div className="absolute bottom-4 left-4 bg-card rounded-lg p-3 shadow-md z-[1000]">
              {viewMode === "density" ? (
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
                </>
              )}
            </div>

            {/* Current View Info */}
            <div className="absolute top-4 left-4 bg-card rounded-lg p-2 shadow-md z-[1000]">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {viewMode === "heatmap" ? "Heatmap View" : viewMode === "density" ? "Density View" : "Individual Markers"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {viewMode === "density" ? `${Object.keys(locationGroups).length} locations` : `${filteredIssues.length} issues`} shown
                </span>
              </div>
            </div>
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
                <strong>OpenStreetMap Integration:</strong> Showing live street data for Raipur, Chhattisgarh (492001).
                Click markers to view issue details, switch to heatmap view, or use your current location.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
