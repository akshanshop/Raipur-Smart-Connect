import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertCommunitySchema, type Community, type CommunityMember, type User } from "@shared/schema";
import { z } from "zod";
import { Search, MapPin, Users, Clock, Shield, Edit, Trash2, UserPlus, UserMinus, Crown, Award } from "lucide-react";

interface CommunityWithCreator extends Community {
  creatorName: string;
}

interface MemberWithUser extends CommunityMember {
  user: User;
}

const communityFormSchema = insertCommunitySchema.extend({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type CommunityFormData = z.infer<typeof communityFormSchema>;

export default function Communities() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityWithCreator | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
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

  // Fetch all communities
  const { data: allCommunities = [], isLoading: loadingCommunities } = useQuery<CommunityWithCreator[]>({
    queryKey: ["/api/communities"],
    enabled: isAuthenticated,
  });

  // Fetch user's communities
  const { data: userCommunities = [], isLoading: loadingUserCommunities } = useQuery<CommunityWithCreator[]>({
    queryKey: ["/api/communities/user", user?.id],
    enabled: isAuthenticated && !!user?.id,
  });

  // Fetch community members when a community is selected
  const { data: communityMembers = [], isLoading: loadingMembers } = useQuery<MemberWithUser[]>({
    queryKey: ["/api/communities", selectedCommunity?.id, "members"],
    enabled: !!selectedCommunity?.id && isDetailsOpen,
  });

  // Filter communities based on search and category
  const filteredCommunities = allCommunities.filter((community) => {
    const matchesSearch = searchQuery
      ? community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = categoryFilter === "all" || community.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Create community form
  const form = useForm<CommunityFormData>({
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

  // Check if user is member of a community
  const isMemberOfCommunity = (communityId: string) => {
    return userCommunities.some(c => c.id === communityId);
  };

  // Get user's role in a community
  const getUserRoleInCommunity = (communityId: string) => {
    const membership = communityMembers.find(m => m.userId === user?.id && m.communityId === communityId);
    return membership?.role || null;
  };

  // Create community mutation
  const createCommunityMutation = useMutation({
    mutationFn: async (data: CommunityFormData) => {
      const response = await apiRequest('POST', '/api/communities', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "🎉 Community Created!",
        description: "You earned 20 tokens! Check your notifications for achievements.",
      });
      form.reset();
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

  // Join community mutation
  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const response = await apiRequest('POST', `/api/communities/${communityId}/join`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have joined the community!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/user", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to join community.",
        variant: "destructive",
      });
    },
  });

  // Leave community mutation
  const leaveCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const response = await apiRequest('POST', `/api/communities/${communityId}/leave`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have left the community.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/user", user?.id] });
      setIsDetailsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to leave community.",
        variant: "destructive",
      });
    },
  });

  // Delete community mutation
  const deleteCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const response = await apiRequest('DELETE', `/api/communities/${communityId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Community deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/user", user?.id] });
      setIsDetailsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to delete community.",
        variant: "destructive",
      });
    },
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ communityId, userId, role }: { communityId: string; userId: string; role: string }) => {
      const response = await apiRequest('PATCH', `/api/communities/${communityId}/members/${userId}`, { role });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member role updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/communities", selectedCommunity?.id, "members"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to update member role.",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude.toString());
          form.setValue("longitude", position.coords.longitude.toString());
          toast({
            title: "Location captured",
            description: "Your current location has been added.",
          });
        },
        () => {
          toast({
            title: "Location error",
            description: "Could not get your location. Please enter it manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const onSubmit = (data: CommunityFormData) => {
    createCommunityMutation.mutate(data);
  };

  const handleCommunityClick = (community: CommunityWithCreator) => {
    setSelectedCommunity(community);
    setIsDetailsOpen(true);
    setIsEditMode(false);
  };

  const handleDeleteCommunity = () => {
    if (selectedCommunity && window.confirm("Are you sure you want to delete this community? This action cannot be undone.")) {
      deleteCommunityMutation.mutate(selectedCommunity.id);
    }
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
            <Users className="inline-block mr-2 sm:mr-3" />
            Communities
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Discover, join, and create communities in your city
          </p>
        </div>

        <Tabs defaultValue="discover" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="discover" data-testid="tab-discover-communities" className="min-h-[44px] text-sm sm:text-base py-2">
              <Search className="mr-1.5 sm:mr-2 h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="my-communities" data-testid="tab-my-communities" className="min-h-[44px] text-sm sm:text-base py-2">
              <Users className="mr-1.5 sm:mr-2 h-4 w-4" />
              My Communities
            </TabsTrigger>
            <TabsTrigger value="create" data-testid="tab-create-community" className="min-h-[44px] text-sm sm:text-base py-2">
              <UserPlus className="mr-1.5 sm:mr-2 h-4 w-4" />
              Create
            </TabsTrigger>
          </TabsList>

          {/* Discover Communities Tab */}
          <TabsContent value="discover" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search & Filter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Search communities by name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-communities"
                      className="w-full"
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

            {loadingCommunities ? (
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
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold mb-2">No communities found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or create a new community</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommunities.map((community) => {
                  const isMember = isMemberOfCommunity(community.id);
                  return (
                    <Card 
                      key={community.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleCommunityClick(community)}
                      data-testid={`card-community-${community.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-1">{community.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
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
                            <span data-testid={`text-member-count-${community.id}`}>
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
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>By {community.creatorName}</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        {isMember ? (
                          <Badge variant="default" className="w-full justify-center" data-testid={`badge-joined-${community.id}`}>
                            <Users className="h-3 w-3 mr-1" />
                            Joined
                          </Badge>
                        ) : (
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              joinCommunityMutation.mutate(community.id);
                            }}
                            disabled={joinCommunityMutation.isPending}
                            data-testid={`button-join-${community.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Join Community
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Communities Tab */}
          <TabsContent value="my-communities" className="space-y-4">
            {loadingUserCommunities ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : userCommunities.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold mb-2">No communities yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Join or create a community to get started</p>
                  <Button onClick={() => document.querySelector<HTMLButtonElement>('[value="discover"]')?.click()}>
                    Discover Communities
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userCommunities.map((community) => {
                  const isCreator = community.creatorId === user?.id;
                  return (
                    <Card key={community.id} data-testid={`card-my-community-${community.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {community.name}
                              {isCreator && (
                                <Badge variant="default" className="text-xs">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Creator
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              <Badge variant="secondary" className="text-xs mr-2">
                                {community.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {community.memberCount || 0} members
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {community.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCommunityClick(community)}
                            data-testid={`button-view-${community.id}`}
                          >
                            View Details
                          </Button>
                          {isCreator && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                handleCommunityClick(community);
                                setIsEditMode(true);
                              }}
                              data-testid={`button-manage-${community.id}`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => leaveCommunityMutation.mutate(community.id)}
                            disabled={isCreator || leaveCommunityMutation.isPending}
                            data-testid={`button-leave-${community.id}`}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            {isCreator ? "Cannot Leave (Creator)" : "Leave"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Create Community Tab */}
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create a New Community</CardTitle>
                <CardDescription>
                  Earn 20 tokens for creating a community! First-time creators unlock the Community Creator achievement for an additional 50 tokens.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Community Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Gandhi Nagar Residents" 
                              {...field} 
                              data-testid="input-community-name"
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
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what your community is about..." 
                              className="h-24" 
                              {...field} 
                              data-testid="textarea-community-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Sector 21, Raipur" 
                                {...field}
                                value={field.value ?? ""}
                                data-testid="input-community-location"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={getCurrentLocation}
                        data-testid="button-use-location"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Use My Location
                      </Button>
                      {form.watch("latitude") && form.watch("longitude") && (
                        <Badge variant="secondary" className="text-xs">
                          Location Set
                        </Badge>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="rules"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Community Rules (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Set guidelines for your community members..." 
                              className="h-20" 
                              {...field}
                              value={field.value ?? ""}
                              data-testid="textarea-community-rules"
                            />
                          </FormControl>
                          <FormDescription>
                            Help maintain a positive community environment
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isPrivate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-private-community"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Private Community
                            </FormLabel>
                            <FormDescription>
                              Members need approval to join
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createCommunityMutation.isPending}
                      data-testid="button-create-community"
                    >
                      {createCommunityMutation.isPending ? (
                        "Creating..."
                      ) : (
                        <>
                          <Award className="h-4 w-4 mr-2" />
                          Create Community & Earn 20 Tokens
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Community Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedCommunity && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedCommunity.name}
                    {selectedCommunity.isPrivate && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    <Badge variant="secondary" className="mr-2">
                      {selectedCommunity.category}
                    </Badge>
                    Created by {selectedCommunity.creatorName}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedCommunity.description}
                    </p>
                  </div>

                  {selectedCommunity.location && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedCommunity.location}
                      </p>
                    </div>
                  )}

                  {selectedCommunity.rules && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Community Rules</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedCommunity.rules}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Members ({selectedCommunity.memberCount || 0})
                    </h4>
                    {loadingMembers ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {communityMembers.map((member) => (
                          <div 
                            key={member.id} 
                            className="flex items-center justify-between p-2 rounded-lg border"
                            data-testid={`member-${member.userId}`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.user.profileImageUrl || undefined} />
                                <AvatarFallback>
                                  {member.user.firstName?.[0]}{member.user.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {member.user.firstName} {member.user.lastName}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    member.role === 'admin' ? 'default' : 
                                    member.role === 'moderator' ? 'secondary' : 'outline'
                                  } className="text-xs">
                                    {member.role}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Joined {new Date(member.joinedAt!).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {isEditMode && selectedCommunity.creatorId === user?.id && member.userId !== user?.id && (
                              <Select 
                                value={member.role || 'member'}
                                onValueChange={(role) => updateMemberRoleMutation.mutate({
                                  communityId: selectedCommunity.id,
                                  userId: member.userId,
                                  role
                                })}
                              >
                                <SelectTrigger className="w-32" data-testid={`select-role-${member.userId}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  {isMemberOfCommunity(selectedCommunity.id) ? (
                    <>
                      {selectedCommunity.creatorId === user?.id && (
                        <>
                          <Button 
                            variant="outline"
                            onClick={() => setIsEditMode(!isEditMode)}
                            data-testid="button-toggle-edit-mode"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {isEditMode ? 'View Mode' : 'Manage Members'}
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={handleDeleteCommunity}
                            disabled={deleteCommunityMutation.isPending}
                            data-testid="button-delete-community"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Community
                          </Button>
                        </>
                      )}
                      {selectedCommunity.creatorId !== user?.id && (
                        <Button 
                          variant="outline"
                          onClick={() => leaveCommunityMutation.mutate(selectedCommunity.id)}
                          disabled={leaveCommunityMutation.isPending}
                          data-testid="button-leave-community-modal"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Leave Community
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button 
                      onClick={() => joinCommunityMutation.mutate(selectedCommunity.id)}
                      disabled={joinCommunityMutation.isPending}
                      data-testid="button-join-community-modal"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Community
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
