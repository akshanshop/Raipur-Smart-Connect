import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import CommunityFeed from "@/components/community-feed";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertCommunityIssueSchema, insertCommunitySchema, type Community } from "@shared/schema";
import { z } from "zod";
import { Users, Plus, Building2, MapPin, Clock, Shield, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CityStats {
  totalComplaints: number;
  resolvedComplaints: number;
  highPriorityCount?: number;
  mediumPriorityCount?: number;
  lowPriorityCount?: number;
}

interface CommunityWithCreator extends Community {
  creatorName: string;
}

interface CommunityMembership extends Community {
  role: string;
  joinedAt: string;
}

const communityIssueFormSchema = insertCommunityIssueSchema.extend({
  title: z.string().min(1, "Title is required"),
});

type CommunityIssueFormData = z.infer<typeof communityIssueFormSchema>;

const communityFormSchema = insertCommunitySchema.extend({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type CommunityFormData = z.infer<typeof communityFormSchema>;

export default function Community() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const { data: cityStats } = useQuery<CityStats>({
    queryKey: ["/api/stats/city"],
    retry: false,
  });

  // Fetch user's communities
  const { data: userCommunities } = useQuery<CommunityMembership[]>({
    queryKey: ["/api/communities/user", user?.id],
    enabled: !!user?.id,
  });

  // Fetch all communities for discover tab
  const { data: allCommunities, isLoading: isLoadingAllCommunities } = useQuery<CommunityWithCreator[]>({
    queryKey: ["/api/communities"],
  });

  // Filter and compute
  const createdCommunities = userCommunities?.filter(c => c.creatorId === user?.id) || [];
  const joinedCommunities = userCommunities || [];
  const totalMembers = createdCommunities.reduce((sum, c) => sum + (c.memberCount || 0), 0);

  // Filter communities for discover tab
  const filteredCommunities = allCommunities?.filter(c => {
    const matchesSearch = searchQuery
      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  // Check if user is member
  const isMember = (communityId: string) => {
    return joinedCommunities.some(c => c.id === communityId);
  };

  const communityForm = useForm<CommunityFormData>({
    resolver: zodResolver(communityFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      location: undefined,
      latitude: undefined,
      longitude: undefined,
      isPrivate: false,
      rules: undefined,
      isActive: true,
    },
  });

  const form = useForm<CommunityIssueFormData>({
    resolver: zodResolver(communityIssueFormSchema),
    defaultValues: {
      category: "",
      priority: "medium",
      title: "",
      description: "",
      location: "",
      latitude: "",
      longitude: "",
      status: "open",
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: CommunityIssueFormData & { files: File[] }) => {
      const formData = new FormData();
      
      // Append issue data
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'files' && value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Append files
      data.files.forEach((file) => {
        formData.append('media', file);
      });

      const response = await fetch('/api/community-issues', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Community issue has been posted successfully!",
      });
      form.reset();
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/community-issues"] });
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
        description: "Failed to post community issue. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      return apiRequest('POST', `/api/communities/${communityId}/join`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You've joined the community!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
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
        description: "Failed to join community. Please try again.",
        variant: "destructive",
      });
    },
  });

  const leaveCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      return apiRequest('POST', `/api/communities/${communityId}/leave`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You've left the community.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
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
        description: "Failed to leave community. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: CommunityFormData) => {
      const response = await apiRequest('POST', '/api/communities', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Community Created Successfully!",
        description: "You earned 20 tokens! Check your notifications for achievements.",
      });
      communityForm.reset();
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/user", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
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
        description: "Failed to create community. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-request GPS location on component mount
  useEffect(() => {
    if (isAuthenticated) {
      getCurrentLocation();
    }
  }, [isAuthenticated]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus('pending');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude.toString());
          form.setValue("longitude", position.coords.longitude.toString());
          setLocationStatus('success');
          toast({
            title: "Location captured",
            description: "Your current location has been added to the issue.",
          });
        },
        (error) => {
          setLocationStatus('error');
          toast({
            title: "Location permission required",
            description: "Please allow location access to post an issue. This ensures accurate issue reporting.",
            variant: "destructive",
          });
        }
      );
    } else {
      setLocationStatus('error');
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by this browser. Please use a modern browser.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: CommunityIssueFormData) => {
    // Hard block submission without valid GPS location
    if (locationStatus !== 'success') {
      toast({
        title: "GPS Location Required",
        description: "Please allow location access to post your issue. This ensures accurate issue reporting.",
        variant: "destructive",
      });
      return;
    }

    createIssueMutation.mutate({
      ...data,
      files: selectedFiles,
    });
  };

  const onSubmitCommunity = (data: CommunityFormData) => {
    createCommunityMutation.mutate(data);
  };

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
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
            <i className="fas fa-users text-primary mr-2 sm:mr-3"></i>
            Community Collaboration
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Work together to solve city-wide problems</p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-destructive">
                {cityStats?.highPriorityCount || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">High Priority Issues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-accent">
                {cityStats?.mediumPriorityCount || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Medium Priority Issues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-secondary">
                {cityStats?.lowPriorityCount || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Low Priority Issues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {cityStats?.resolvedComplaints || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Issues Resolved</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="browse" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="browse" data-testid="tab-browse-issues" className="min-h-[44px] text-sm sm:text-base py-2 sm:py-2.5">
              <i className="fas fa-list mr-1.5 sm:mr-2"></i>
              Browse Issues
            </TabsTrigger>
            <TabsTrigger value="post" data-testid="tab-post-issue" className="min-h-[44px] text-sm sm:text-base py-2 sm:py-2.5">
              <i className="fas fa-plus mr-1.5 sm:mr-2"></i>
              Post New Issue
            </TabsTrigger>
            <TabsTrigger value="my-communities" data-testid="tab-my-communities" className="min-h-[44px] text-sm sm:text-base py-2 sm:py-2.5">
              <Users className="w-4 h-4 mr-1.5 sm:mr-2" />
              My Communities
            </TabsTrigger>
            <TabsTrigger value="discover" data-testid="tab-discover-communities" className="min-h-[44px] text-sm sm:text-base py-2 sm:py-2.5">
              <Building2 className="w-4 h-4 mr-1.5 sm:mr-2" />
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <CommunityFeed />
            
            {/* Community Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-info-circle text-primary mr-2"></i>
                  Community Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">How to Help</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Upvote issues that affect you too</li>
                      <li>• Add constructive comments and suggestions</li>
                      <li>• Share additional photos or evidence</li>
                      <li>• Collaborate on community solutions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Posting Guidelines</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Be specific about location and details</li>
                      <li>• Include photos when possible</li>
                      <li>• Check if similar issues already exist</li>
                      <li>• Keep posts civil and constructive</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="post" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post New Community Issue</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-issue-category">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="water-supply">Water Supply</SelectItem>
                                <SelectItem value="garbage-collection">Garbage Collection</SelectItem>
                                <SelectItem value="road-maintenance">Road Maintenance</SelectItem>
                                <SelectItem value="street-lighting">Street Lighting</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-issue-priority">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Brief, descriptive title of the issue" 
                              {...field} 
                              data-testid="input-issue-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the issue in detail. Include when it started, how it affects the community, and any proposed solutions..." 
                              className="h-32" 
                              {...field} 
                              data-testid="textarea-issue-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Location Input */}
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Address</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Input 
                                placeholder="Enter specific address or landmark" 
                                {...field} 
                                data-testid="input-issue-location"
                              />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="secondary"
                              onClick={getCurrentLocation}
                              data-testid="button-get-current-location"
                            >
                              <i className={`fas fa-location-arrow ${locationStatus === 'pending' ? 'fa-spin' : ''}`}></i>
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* GPS Status Indicator */}
                    <div className={`p-3 rounded-lg ${
                      locationStatus === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 
                      locationStatus === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 
                      'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    }`} data-testid="issue-location-status">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <i className={`fas ${
                            locationStatus === 'success' ? 'fa-check-circle' : 
                            locationStatus === 'error' ? 'fa-exclamation-circle' : 
                            'fa-spinner fa-spin'
                          }`}></i>
                          <span className="text-sm font-medium">
                            {locationStatus === 'success' ? `GPS location captured: ${form.watch('latitude')?.substring(0, 8)}, ${form.watch('longitude')?.substring(0, 8)}` : 
                             locationStatus === 'error' ? 'GPS location required - Please allow location access' : 
                             'Requesting GPS location...'}
                          </span>
                        </div>
                        {locationStatus === 'error' && (
                          <Button 
                            type="button" 
                            size="sm"
                            onClick={getCurrentLocation}
                            data-testid="button-retry-issue-location"
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Photos/Videos</label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*,video/*" 
                          className="hidden" 
                          id="issueFileUpload"
                          onChange={handleFileSelect}
                          data-testid="input-issue-file-upload"
                        />
                        <label htmlFor="issueFileUpload" className="cursor-pointer">
                          <i className="fas fa-cloud-upload-alt text-3xl text-muted-foreground mb-2 block"></i>
                          <p className="text-muted-foreground">Click to upload photos or videos</p>
                          <p className="text-xs text-muted-foreground mt-1">Help others understand the issue with visual evidence</p>
                        </label>
                      </div>
                      
                      {/* File Preview Area */}
                      {selectedFiles.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="relative bg-muted rounded-lg p-2">
                              <div className="text-xs text-center text-muted-foreground truncate">
                                {file.name}
                              </div>
                              <button 
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                data-testid={`button-remove-issue-file-${index}`}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        type="submit" 
                        disabled={createIssueMutation.isPending}
                        data-testid="button-submit-issue"
                      >
                        {createIssueMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Posting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-share mr-2"></i>
                            Post to Community
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          form.reset();
                          setSelectedFiles([]);
                        }}
                        data-testid="button-reset-form"
                      >
                        <i className="fas fa-undo mr-2"></i>
                        Reset Form
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-communities" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold">My Communities</h2>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                data-testid="button-create-community"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Community
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Communities I Created
                </CardTitle>
                <CardDescription>
                  Communities you've founded and manage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {createdCommunities.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't created any communities yet
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(true)}
                      data-testid="button-create-first-community"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Community
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {createdCommunities.map((community) => (
                      <Card key={community.id} data-testid={`card-created-community-${community.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-base line-clamp-1">
                                {community.name}
                              </CardTitle>
                              <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {community.category}
                                </Badge>
                                {community.isPrivate && (
                                  <Badge variant="outline" className="text-xs">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Private
                                  </Badge>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {community.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span data-testid={`text-created-member-count-${community.id}`}>
                                {community.memberCount || 0} members
                              </span>
                            </div>
                            {community.createdAt && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatDistanceToNow(new Date(community.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Communities I Joined
                </CardTitle>
                <CardDescription>
                  All communities you're a member of
                </CardDescription>
              </CardHeader>
              <CardContent>
                {joinedCommunities.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      You haven't joined any communities yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {joinedCommunities.map((community) => (
                      <Card key={community.id} data-testid={`card-joined-community-${community.id}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-base line-clamp-1">
                                {community.name}
                              </CardTitle>
                              <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {community.category}
                                </Badge>
                                {community.role && (
                                  <Badge variant="outline" className="text-xs">
                                    {community.role}
                                  </Badge>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {community.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span data-testid={`text-joined-member-count-${community.id}`}>
                                {community.memberCount || 0} members
                              </span>
                            </div>
                          </div>
                          {community.creatorId !== user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => leaveCommunityMutation.mutate(community.id)}
                              disabled={leaveCommunityMutation.isPending}
                              data-testid={`button-leave-community-${community.id}`}
                            >
                              Leave Community
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discover" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search & Filter Communities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search communities by name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-communities"
                      className="pl-9"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="neighborhood">Neighborhood</SelectItem>
                      <SelectItem value="interest">Interest</SelectItem>
                      <SelectItem value="district">District</SelectItem>
                      <SelectItem value="hobby">Hobby</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {isLoadingAllCommunities ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCommunities.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold mb-2">No communities found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search or create a new community
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    data-testid="button-create-community-empty"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Community
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommunities.map((community) => {
                  const isUserMember = isMember(community.id);
                  return (
                    <Card key={community.id} data-testid={`card-discover-community-${community.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-base line-clamp-1">
                              {community.name}
                            </CardTitle>
                            <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {community.category}
                              </Badge>
                              {community.isPrivate && (
                                <Badge variant="outline" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Private
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {community.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span data-testid={`text-discover-member-count-${community.id}`}>
                              {community.memberCount || 0} members
                            </span>
                          </div>
                          {community.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="line-clamp-1">{community.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created by {community.creatorName || 'Unknown'}
                        </div>
                        {isUserMember ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => leaveCommunityMutation.mutate(community.id)}
                            disabled={leaveCommunityMutation.isPending}
                            data-testid={`button-leave-${community.id}`}
                          >
                            Leave Community
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => joinCommunityMutation.mutate(community.id)}
                            disabled={joinCommunityMutation.isPending}
                            data-testid={`button-join-${community.id}`}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Join Community
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-community">
            <DialogHeader>
              <DialogTitle>Create New Community</DialogTitle>
              <DialogDescription>
                Start a new community and earn 20 tokens! Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <Form {...communityForm}>
              <form onSubmit={communityForm.handleSubmit(onSubmitCommunity)} className="space-y-4">
                <FormField
                  control={communityForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Community Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Green Valley Neighborhood Watch"
                          {...field}
                          data-testid="input-community-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={communityForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the purpose and goals of your community..."
                          className="h-24"
                          {...field}
                          data-testid="textarea-community-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={communityForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-community-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="neighborhood">Neighborhood</SelectItem>
                          <SelectItem value="interest">Interest</SelectItem>
                          <SelectItem value="district">District</SelectItem>
                          <SelectItem value="hobby">Hobby</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={communityForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Downtown, West District"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-community-location"
                        />
                      </FormControl>
                      <FormDescription>
                        Specify a location if your community is location-based
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={communityForm.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-is-private"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Private Community
                        </FormLabel>
                        <FormDescription>
                          Private communities require approval to join
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create-community"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCommunityMutation.isPending}
                    data-testid="button-submit-create-community"
                  >
                    {createCommunityMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Community
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
