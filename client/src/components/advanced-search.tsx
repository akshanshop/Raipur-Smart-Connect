import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SearchFilters {
  query: string;
  category: string;
  priority: string;
  status: string;
  location: string;
  dateRange: Date[];
  urgencyLevel: number[];
  sortBy: string;
  tags: string[];
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

export default function AdvancedSearch({ onSearch, onClearFilters }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "all",
    priority: "all",
    status: "all",
    location: "",
    dateRange: [],
    urgencyLevel: [1],
    sortBy: "relevance",
    tags: []
  });

  const [activeTag, setActiveTag] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClearFilters = () => {
    setFilters({
      query: "",
      category: "all",
      priority: "all",
      status: "all",
      location: "",
      dateRange: [],
      urgencyLevel: [1],
      sortBy: "relevance",
      tags: []
    });
    onClearFilters();
  };

  const addTag = () => {
    if (activeTag && !filters.tags.includes(activeTag)) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, activeTag]
      }));
      setActiveTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <Card className="floating-card glass-modern card-squircle-lg animate-fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gradient flex items-center">
          <i className="fas fa-search mr-3 animate-float"></i>
          Advanced Search
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className="ml-auto modern-button"
          >
            <i className={`fas fa-filter mr-1 ${showFilters ? 'text-primary' : ''}`}></i>
            Filters
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Search Bar */}
        <div className="flex space-x-2">
          <Input 
            placeholder="Search complaints, issues, or keywords..."
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            className="flex-1 squircle-md"
          />
          <Button 
            onClick={handleSearch}
            className="modern-button btn-squircle px-6"
          >
            <i className="fas fa-search mr-2"></i>
            Search
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="space-y-4 p-4 bg-gradient-to-r from-muted/30 to-muted/20 squircle-lg animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="squircle-md">
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
              </div>

              {/* Priority Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Priority</label>
                <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="squircle-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="squircle-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location and Sort */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
                <Input 
                  placeholder="Enter area or landmark..."
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="squircle-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                  <SelectTrigger className="squircle-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date-newest">Newest First</SelectItem>
                    <SelectItem value="date-oldest">Oldest First</SelectItem>
                    <SelectItem value="priority-high">High Priority First</SelectItem>
                    <SelectItem value="upvotes">Most Upvoted</SelectItem>
                    <SelectItem value="comments">Most Commented</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Urgency Level Slider */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Minimum Urgency Level: {filters.urgencyLevel[0]}
              </label>
              <Slider
                value={filters.urgencyLevel}
                onValueChange={(value) => setFilters(prev => ({ ...prev, urgencyLevel: value }))}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Critical</span>
                <span>Emergency</span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Tags</label>
              <div className="flex space-x-2 mb-2">
                <Input 
                  placeholder="Add tag..."
                  value={activeTag}
                  onChange={(e) => setActiveTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 squircle-md"
                />
                <Button 
                  onClick={addTag}
                  variant="outline"
                  size="sm"
                  className="modern-button btn-squircle"
                >
                  <i className="fas fa-plus"></i>
                </Button>
              </div>
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.tags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="squircle-md cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <i className="fas fa-times ml-1 text-xs"></i>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2 border-t border-border/50">
              <Button 
                onClick={handleSearch}
                className="modern-button btn-squircle"
              >
                <i className="fas fa-search mr-2"></i>
                Apply Filters
              </Button>
              <Button 
                onClick={handleClearFilters}
                variant="outline"
                className="modern-button btn-squircle"
              >
                <i className="fas fa-times mr-2"></i>
                Clear All
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                className="modern-button btn-squircle ml-auto"
              >
                <i className="fas fa-save mr-2"></i>
                Save Search
              </Button>
            </div>
          </div>
        )}

        {/* Quick Search Suggestions */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Popular searches:</div>
          <div className="flex flex-wrap gap-2">
            {["water shortage", "road repair", "garbage pickup", "streetlight repair", "drainage blockage"].map(suggestion => (
              <Badge 
                key={suggestion}
                variant="outline" 
                className="squircle-md cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                onClick={() => setFilters(prev => ({ ...prev, query: suggestion }))}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}