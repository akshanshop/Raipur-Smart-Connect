import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import CommunityFeed from "@/components/community-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertCommunityIssueSchema } from "@shared/schema";
import { z } from "zod";

interface CityStats {
  totalComplaints: number;
  resolvedComplaints: number;
  highPriorityCount?: number;
  mediumPriorityCount?: number;
  lowPriorityCount?: number;
}

const communityIssueFormSchema = insertCommunityIssueSchema.extend({
  title: z.string().min(1, "Title is required"),
});

type CommunityIssueFormData = z.infer<typeof communityIssueFormSchema>;

export default function Community() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'success' | 'error'>('pending');
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
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="browse" data-testid="tab-browse-issues" className="min-h-[44px] text-sm sm:text-base py-2 sm:py-2.5">
              <i className="fas fa-list mr-1.5 sm:mr-2"></i>
              Browse Issues
            </TabsTrigger>
            <TabsTrigger value="post" data-testid="tab-post-issue" className="min-h-[44px] text-sm sm:text-base py-2 sm:py-2.5">
              <i className="fas fa-plus mr-1.5 sm:mr-2"></i>
              Post New Issue
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
        </Tabs>
      </main>
    </div>
  );
}
