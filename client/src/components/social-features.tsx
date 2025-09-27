import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  joinedDate: string;
  stats: {
    complaints: number;
    resolved: number;
    upvotes: number;
    followers: number;
    following: number;
  };
  badges: string[];
  isFollowing?: boolean;
}

interface Post {
  id: string;
  user: UserProfile;
  content: string;
  images?: string[];
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  tags: string[];
  type: 'complaint' | 'update' | 'discussion' | 'achievement';
}

export default function SocialFeatures() {
  const [activeTab, setActiveTab] = useState("feed");
  const [newPost, setNewPost] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: socialFeed = [], isLoading } = useQuery({
    queryKey: ["/api/social/feed"],
    queryFn: async (): Promise<Post[]> => {
      // Mock social feed data
      return [
        {
          id: "1",
          user: {
            id: "user1",
            name: "Priya Sharma",
            avatar: "/api/placeholder/40/40",
            bio: "Active citizen, community advocate",
            location: "Raipur, Chhattisgarh",
            joinedDate: "2023-01-15",
            stats: { complaints: 12, resolved: 8, upvotes: 45, followers: 23, following: 18 },
            badges: ["Top Contributor", "Community Helper"],
            isFollowing: false
          },
          content: "Great news! The pothole issue on VIP Road has been resolved within 48 hours of reporting. Thank you @RaipurMC for the quick response! 🎉",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          likes: 15,
          comments: 3,
          shares: 2,
          isLiked: false,
          tags: ["resolved", "roads", "appreciation"],
          type: "update"
        },
        {
          id: "2",
          user: {
            id: "user2", 
            name: "Raj Patel",
            avatar: "/api/placeholder/40/40",
            bio: "Environmental enthusiast",
            location: "Civil Lines, Raipur",
            joinedDate: "2023-03-20",
            stats: { complaints: 8, resolved: 5, upvotes: 32, followers: 16, following: 24 },
            badges: ["Eco Warrior"],
            isFollowing: true
          },
          content: "Water logging issue in Sector 21 needs immediate attention. This has been going on for 3 days now. The entire street is flooded! #WaterLogging #Emergency",
          images: ["/api/placeholder/300/200"],
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          likes: 8,
          comments: 5,
          shares: 4,
          isLiked: true,
          tags: ["waterlogging", "emergency", "sector21"],
          type: "complaint"
        },
        {
          id: "3",
          user: {
            id: "user3",
            name: "Municipal Team",
            avatar: "/api/placeholder/40/40",
            bio: "Official Raipur Municipal Corporation",
            location: "Raipur, Chhattisgarh",
            joinedDate: "2022-06-01",
            stats: { complaints: 0, resolved: 456, upvotes: 234, followers: 1203, following: 0 },
            badges: ["Official", "Verified"],
            isFollowing: true
          },
          content: "Weekly update: We've successfully resolved 67 complaints this week. Major achievements include fixing 12 streetlights and completing 3 road repairs. Keep reporting issues!",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          likes: 42,
          comments: 8,
          shares: 12,
          isLiked: false,
          tags: ["update", "achievements", "weekly"],
          type: "achievement"
        }
      ];
    }
  });

  const { data: suggestedUsers = [] } = useQuery({
    queryKey: ["/api/social/suggested"],
    queryFn: async (): Promise<UserProfile[]> => {
      return [
        {
          id: "suggested1",
          name: "Anita Verma",
          avatar: "/api/placeholder/40/40",
          bio: "Community leader, works on education issues",
          location: "Pandri, Raipur",
          joinedDate: "2023-02-10",
          stats: { complaints: 15, resolved: 12, upvotes: 67, followers: 34, following: 22 },
          badges: ["Education Advocate", "Community Leader"],
          isFollowing: false
        },
        {
          id: "suggested2",
          name: "Vikash Singh",
          avatar: "/api/placeholder/40/40",
          bio: "Tech professional, focuses on digital governance",
          location: "Telibandha, Raipur", 
          joinedDate: "2023-04-05",
          stats: { complaints: 6, resolved: 4, upvotes: 28, followers: 19, following: 31 },
          badges: ["Tech Contributor"],
          isFollowing: false
        }
      ];
    }
  });

  const followMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string, action: 'follow' | 'unfollow' }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, action };
    },
    onSuccess: (data) => {
      toast({
        title: data.action === 'follow' ? "Following" : "Unfollowed",
        description: `Successfully ${data.action === 'follow' ? 'followed' : 'unfollowed'} user.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social"] });
    }
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: string, action: 'like' | 'unlike' }) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, action };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/feed"] });
    }
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Post Created",
        description: "Your post has been shared with the community.",
      });
      setNewPost("");
      queryClient.invalidateQueries({ queryKey: ["/api/social/feed"] });
    }
  });

  const handleFollow = (userId: string, isFollowing: boolean) => {
    followMutation.mutate({ userId, action: isFollowing ? 'unfollow' : 'follow' });
  };

  const handleLike = (postId: string, isLiked: boolean) => {
    likeMutation.mutate({ postId, action: isLiked ? 'unlike' : 'like' });
  };

  const handleCreatePost = () => {
    if (newPost.trim()) {
      createPostMutation.mutate(newPost);
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'complaint': return 'fas fa-exclamation-circle text-red-500';
      case 'update': return 'fas fa-info-circle text-blue-500';
      case 'discussion': return 'fas fa-comments text-purple-500';
      case 'achievement': return 'fas fa-trophy text-yellow-500';
      default: return 'fas fa-post text-gray-500';
    }
  };

  return (
    <Card className="floating-card glass-modern card-squircle-lg animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-xl text-gradient flex items-center">
          <i className="fas fa-users mr-3 animate-float"></i>
          Community Social Hub
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 squircle-lg">
            <TabsTrigger value="feed" className="squircle-md">Social Feed</TabsTrigger>
            <TabsTrigger value="people" className="squircle-md">People</TabsTrigger>
            <TabsTrigger value="create" className="squircle-md">Create Post</TabsTrigger>
          </TabsList>

          {/* Social Feed */}
          <TabsContent value="feed" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-2"></i>
                <p className="text-muted-foreground">Loading social feed...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {socialFeed.map((post) => (
                  <div key={post.id} className="p-4 bg-gradient-to-r from-muted/30 to-muted/20 squircle-lg floating-card">
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={post.user.avatar} />
                          <AvatarFallback>{post.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-foreground">{post.user.name}</span>
                            {post.user.badges.includes("Official") && (
                              <Badge className="squircle-full bg-blue-500 text-white text-xs">
                                <i className="fas fa-check mr-1"></i>Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</span>
                            <i className={getPostTypeIcon(post.type)}></i>
                          </div>
                        </div>
                      </div>
                      
                      {post.user.id !== "current_user" && (
                        <Button
                          variant={post.user.isFollowing ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleFollow(post.user.id, post.user.isFollowing || false)}
                          className="modern-button btn-squircle"
                          disabled={followMutation.isPending}
                        >
                          {post.user.isFollowing ? "Following" : "Follow"}
                        </Button>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="mb-3">
                      <p className="text-foreground mb-2">{post.content}</p>
                      
                      {post.images && post.images.length > 0 && (
                        <div className="flex space-x-2 mb-2">
                          {post.images.map((image, index) => (
                            <img 
                              key={index}
                              src={image} 
                              alt={`Post image ${index + 1}`}
                              className="w-24 h-16 object-cover squircle-md floating-card"
                            />
                          ))}
                        </div>
                      )}
                      
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {post.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="squircle-md text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id, post.isLiked || false)}
                          className={`modern-button btn-squircle ${post.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                          disabled={likeMutation.isPending}
                        >
                          <i className={`fas fa-heart mr-1 ${post.isLiked ? 'text-red-500' : ''}`}></i>
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="modern-button btn-squircle text-muted-foreground">
                          <i className="fas fa-comment mr-1"></i>
                          {post.comments}
                        </Button>
                        <Button variant="ghost" size="sm" className="modern-button btn-squircle text-muted-foreground">
                          <i className="fas fa-share mr-1"></i>
                          {post.shares}
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm" className="modern-button btn-squircle">
                        <i className="fas fa-bookmark"></i>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* People Tab */}
          <TabsContent value="people" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gradient mb-3">Suggested People</h3>
              <div className="space-y-3">
                {suggestedUsers.map((user) => (
                  <div key={user.id} className="p-3 bg-gradient-to-r from-muted/30 to-muted/20 squircle-lg floating-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.bio}</div>
                          <div className="text-xs text-muted-foreground">{user.location}</div>
                          <div className="flex space-x-2 mt-1">
                            {user.badges.map(badge => (
                              <Badge key={badge} variant="secondary" className="squircle-md text-xs">
                                {badge}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                          <div>
                            <div className="font-medium text-foreground">{user.stats.complaints}</div>
                            <div>Issues</div>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{user.stats.resolved}</div>
                            <div>Resolved</div>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{user.stats.followers}</div>
                            <div>Followers</div>
                          </div>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleFollow(user.id, user.isFollowing || false)}
                          className="modern-button btn-squircle"
                          disabled={followMutation.isPending}
                        >
                          Follow
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Create Post Tab */}
          <TabsContent value="create" className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-muted/30 to-muted/20 squircle-lg">
              <h3 className="text-lg font-semibold text-gradient mb-3">Share with Community</h3>
              <div className="space-y-4">
                <Textarea
                  placeholder="What's happening in your neighborhood? Share updates, report issues, or start a discussion..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="h-24 squircle-md"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="modern-button btn-squircle">
                      <i className="fas fa-image mr-2"></i>
                      Photo
                    </Button>
                    <Button variant="outline" size="sm" className="modern-button btn-squircle">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      Location
                    </Button>
                    <Button variant="outline" size="sm" className="modern-button btn-squircle">
                      <i className="fas fa-hashtag mr-2"></i>
                      Tags
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPost.trim() || createPostMutation.isPending}
                    className="modern-button btn-squircle"
                  >
                    {createPostMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Posting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Share Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}