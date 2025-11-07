import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { 
  Coins, Gift, Award, TrendingUp, History, Trophy, Target, 
  Zap, MessageSquare, ThumbsUp, FileText, Users, Crown,
  Search, Filter, CheckCircle2, Lock, Star, Flame
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  tokens: number;
  profileImageUrl?: string;
}

interface TokenData {
  tokens: number;
}

interface TokenTransaction {
  id: string;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
}

interface TokenBonus {
  id: string;
  bonusType: string;
  amount: number;
  description: string;
  expiresAt?: string;
  createdAt: string;
}

interface Achievement {
  id: string;
  achievementType: string;
  title: string;
  description: string;
  iconUrl?: string;
  tokensAwarded: number;
  earnedAt: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  tokenCost: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface RewardRedemption {
  id: string;
  rewardId: string;
  tokensCost: number;
  status: string;
  createdAt: string;
}

interface LeaderboardEntry {
  user: User;
  totalEarned: number;
  rank: number;
}

const categoryIcons: Record<string, string> = {
  badge: "🏆",
  discount: "💰",
  feature: "⭐",
  merchandise: "🎁",
};

const categoryColors: Record<string, string> = {
  badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  discount: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  feature: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  merchandise: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const allAchievements = [
  { type: "first_complaint", title: "First Complaint", description: "File your first complaint", tokens: 10, icon: FileText },
  { type: "community_creator", title: "Community Creator", description: "Create a community", tokens: 50, icon: Users },
  { type: "top_contributor", title: "Top Contributor", description: "Earn 500 contribution points", tokens: 100, icon: Trophy },
  { type: "civic_champion", title: "Civic Champion", description: "Resolve 50 complaints", tokens: 200, icon: Crown },
  { type: "super_voter", title: "Super Voter", description: "Cast 100 votes", tokens: 30, icon: ThumbsUp },
  { type: "problem_solver", title: "Problem Solver", description: "Get 10 complaints resolved", tokens: 50, icon: CheckCircle2 },
];

const earnOpportunities = [
  { title: "File a Complaint", tokens: 10, icon: FileText, link: "/complaints", color: "text-orange-500" },
  { title: "Post Community Issue", tokens: 5, icon: MessageSquare, link: "/communities", color: "text-blue-500" },
  { title: "Create a Community", tokens: 20, icon: Users, link: "/communities", color: "text-purple-500" },
  { title: "Get Upvotes", tokens: 2, icon: ThumbsUp, link: "/dashboard", color: "text-green-500", suffix: "each" },
  { title: "Comment on Issues", tokens: 1, icon: MessageSquare, link: "/communities", color: "text-indigo-500" },
  { title: "Daily Login Streak", tokens: 5, icon: Flame, link: "/dashboard", color: "text-red-500", suffix: "per day" },
];

export default function Rewards() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: tokenData, isLoading: tokensLoading } = useQuery<TokenData>({
    queryKey: ["/api/tokens"],
    retry: false,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<TokenTransaction[]>({
    queryKey: ["/api/tokens/transactions"],
    retry: false,
  });

  const { data: bonuses = [], isLoading: bonusesLoading } = useQuery<TokenBonus[]>({
    queryKey: ["/api/token-bonuses"],
    retry: false,
  });

  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
    retry: false,
  });

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
    retry: false,
  });

  const { data: redemptions = [], isLoading: redemptionsLoading } = useQuery<RewardRedemption[]>({
    queryKey: ["/api/rewards/redemptions"],
    retry: false,
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    retry: false,
  });

  const { data: userRankData } = useQuery<{ rank: number }>({
    queryKey: ["/api/leaderboard/rank"],
    retry: false,
  });

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      return await apiRequest("POST", "/api/rewards/redeem", { rewardId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tokens/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards/redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "🎉 Reward Redeemed!",
        description: "Your reward has been successfully redeemed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Redemption Failed",
        description: error.message || "Failed to redeem reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  const userTokens = user?.tokens || tokenData?.tokens || 0;
  const totalEarned = transactions.filter(t => t.type === 'earned').reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = Math.abs(transactions.filter(t => t.type === 'spent').reduce((sum, t) => sum + t.amount, 0));

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      complaint_filed: "Complaint Filed",
      issue_posted: "Community Issue Posted",
      reward_redeemed: "Reward Redeemed",
      community_created: "Community Created",
      upvote_received: "Upvote Received",
      comment_added: "Comment Added",
    };
    return labels[reason] || reason;
  };

  const earnedAchievementTypes = new Set(achievements.map(a => a.achievementType));

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reward.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || reward.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const recentTransactions = transactions.slice(0, 10);

  // Check if reward was recently added (within 7 days)
  const isNewReward = (createdAt: string) => {
    const daysSinceCreation = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 7;
  };

  // Get most redeemed rewards (popular)
  const rewardRedemptionCounts = redemptions.reduce((acc, r) => {
    acc[r.rewardId] = (acc[r.rewardId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const isPopularReward = (rewardId: string) => {
    return (rewardRedemptionCounts[rewardId] || 0) >= 3;
  };

  const hasRedeemedReward = (rewardId: string) => {
    return redemptions.some(r => r.rewardId === rewardId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2" data-testid="heading-rewards">
            🏆 Rewards Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Earn tokens by contributing to your community and redeem them for exciting rewards!
          </p>
        </div>

        {/* Token Dashboard */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white" data-testid="card-token-balance">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Coins className="h-6 w-6" />
                Your Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tokensLoading || userLoading ? (
                <Skeleton className="h-16 w-32 bg-orange-400" />
              ) : (
                <>
                  <div className="text-5xl font-bold animate-pulse" data-testid="text-token-count">{userTokens}</div>
                  <p className="text-orange-100 mt-2">Available to spend</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-earned-tokens">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <Skeleton className="h-12 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-total-earned">
                    {totalEarned}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">All-time earnings</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-spent-tokens">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Gift className="h-5 w-5 text-purple-500" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <Skeleton className="h-12 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-total-spent">
                    {totalSpent}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Tokens redeemed</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Bonuses */}
        {bonuses.length > 0 && (
          <Card className="mb-8 border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20" data-testid="card-active-bonuses">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Zap className="h-5 w-5 text-yellow-500" />
                Active Bonuses
              </CardTitle>
              <CardDescription>Your current token multipliers and bonuses</CardDescription>
            </CardHeader>
            <CardContent>
              {bonusesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {bonuses.map((bonus) => (
                    <div key={bonus.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm" data-testid={`bonus-${bonus.id}`}>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{bonus.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {bonus.expiresAt ? `Expires ${formatDistanceToNow(new Date(bonus.expiresAt), { addSuffix: true })}` : 'Permanent'}
                        </p>
                      </div>
                      <Badge className="bg-yellow-500 text-white">+{bonus.amount} 🪙</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ways to Earn Tokens */}
        <Card className="mb-8" data-testid="card-ways-to-earn">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Ways to Earn Tokens
            </CardTitle>
            <CardDescription>Complete these actions to earn more tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {earnOpportunities.map((opportunity, index) => {
                const Icon = opportunity.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg hover:shadow-md transition-shadow" data-testid={`earn-opportunity-${index}`}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-full bg-white dark:bg-gray-900 ${opportunity.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{opportunity.title}</p>
                        <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                          +{opportunity.tokens} tokens {opportunity.suffix || ''}
                        </p>
                      </div>
                    </div>
                    <Link href={opportunity.link}>
                      <Button size="sm" variant="outline" data-testid={`button-earn-${index}`}>
                        Earn Now
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="mb-8" data-testid="card-achievements">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Achievements
            </CardTitle>
            <CardDescription>Unlock achievements to earn bonus tokens</CardDescription>
          </CardHeader>
          <CardContent>
            {achievementsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allAchievements.map((achievement) => {
                  const isEarned = earnedAchievementTypes.has(achievement.type);
                  const Icon = achievement.icon;
                  const earnedAchievement = achievements.find(a => a.achievementType === achievement.type);

                  return (
                    <div 
                      key={achievement.type} 
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        isEarned 
                          ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-400 shadow-lg' 
                          : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60'
                      }`}
                      data-testid={`achievement-${achievement.type}`}
                    >
                      {isEarned && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      )}
                      {!isEarned && (
                        <div className="absolute -top-2 -right-2 bg-gray-400 text-white rounded-full p-1">
                          <Lock className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-full ${isEarned ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold ${isEarned ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {achievement.title}
                          </h3>
                          <p className={`text-sm ${isEarned ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={isEarned ? 'bg-purple-500' : 'bg-gray-400'}>
                              {achievement.tokens} tokens
                            </Badge>
                            {isEarned && earnedAchievement && (
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(earnedAchievement.earnedAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto" data-testid="tabs-main">
            <TabsTrigger value="rewards" data-testid="tab-rewards">
              <Gift className="h-4 w-4 mr-2" />
              Rewards Catalog
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Rewards Catalog */}
          <TabsContent value="rewards" className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search rewards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-rewards"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  data-testid="filter-all"
                >
                  All
                </Button>
                <Button
                  variant={selectedCategory === "badge" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("badge")}
                  data-testid="filter-badge"
                >
                  🏆 Badges
                </Button>
                <Button
                  variant={selectedCategory === "discount" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("discount")}
                  data-testid="filter-discount"
                >
                  💰 Discounts
                </Button>
                <Button
                  variant={selectedCategory === "feature" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("feature")}
                  data-testid="filter-feature"
                >
                  ⭐ Features
                </Button>
                <Button
                  variant={selectedCategory === "merchandise" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("merchandise")}
                  data-testid="filter-merchandise"
                >
                  🎁 Merch
                </Button>
              </div>
            </div>

            {rewardsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : filteredRewards.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Gift className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery ? "No rewards match your search" : "No rewards available at the moment."}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Check back later for exciting rewards!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRewards.map((reward) => {
                  const canAfford = userTokens >= reward.tokenCost;
                  const alreadyRedeemed = hasRedeemedReward(reward.id);
                  const isNew = isNewReward(reward.createdAt);
                  const isPopular = isPopularReward(reward.id);

                  return (
                    <Card key={reward.id} className="overflow-hidden hover:shadow-xl transition-all" data-testid={`card-reward-${reward.id}`}>
                      <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 relative">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg text-gray-900 dark:text-white" data-testid={`text-reward-name-${reward.id}`}>
                                {reward.name}
                              </CardTitle>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Badge className={`${categoryColors[reward.category] || 'bg-gray-100'}`}>
                                {categoryIcons[reward.category] || "🎁"} {reward.category}
                              </Badge>
                              {isNew && (
                                <Badge className="bg-blue-500 text-white">
                                  <Star className="h-3 w-3 mr-1" />
                                  New
                                </Badge>
                              )}
                              {isPopular && (
                                <Badge className="bg-pink-500 text-white">
                                  <Flame className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 min-h-[3rem]" data-testid={`text-reward-description-${reward.id}`}>
                          {reward.description}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Coins className="h-5 w-5 text-orange-500" />
                            <span className="text-2xl font-bold text-gray-900 dark:text-white" data-testid={`text-reward-cost-${reward.id}`}>
                              {reward.tokenCost}
                            </span>
                          </div>
                          {alreadyRedeemed ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Redeemed
                            </Badge>
                          ) : !canAfford ? (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              Insufficient Tokens
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Available
                            </Badge>
                          )}
                        </div>
                        <Button
                          onClick={() => redeemMutation.mutate(reward.id)}
                          disabled={!canAfford || alreadyRedeemed || redeemMutation.isPending}
                          className="w-full"
                          data-testid={`button-redeem-${reward.id}`}
                        >
                          {redeemMutation.isPending ? "Redeeming..." : alreadyRedeemed ? "Already Redeemed" : "Redeem Now"}
                        </Button>
                        {!canAfford && !alreadyRedeemed && (
                          <p className="text-sm text-red-500 mt-2 text-center" data-testid={`text-insufficient-tokens-${reward.id}`}>
                            Need {reward.tokenCost - userTokens} more tokens
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Token Transactions */}
              <Card data-testid="card-transaction-history">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription>Your latest token activities (last 10)</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : recentTransactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No transactions yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {recentTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          data-testid={`transaction-${transaction.id}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white" data-testid={`text-transaction-reason-${transaction.id}`}>
                              {getReasonLabel(transaction.reason)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className={`text-lg font-bold ${transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'}`} data-testid={`text-transaction-amount-${transaction.id}`}>
                            {transaction.type === 'earned' ? '+' : ''}{transaction.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Redemption History */}
              <Card data-testid="card-redemption-history">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Redemption History
                  </CardTitle>
                  <CardDescription>Your redeemed rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  {redemptionsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : redemptions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No redemptions yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {redemptions.map((redemption) => {
                        const reward = rewards.find(r => r.id === redemption.rewardId);
                        return (
                          <div
                            key={redemption.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            data-testid={`redemption-${redemption.id}`}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {reward?.name || 'Unknown Reward'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(redemption.createdAt), { addSuffix: true })}
                              </p>
                              <Badge 
                                variant={redemption.status === 'fulfilled' ? 'default' : redemption.status === 'pending' ? 'secondary' : 'destructive'} 
                                className="mt-1"
                              >
                                {redemption.status}
                              </Badge>
                            </div>
                            <div className="text-lg font-bold text-orange-600">
                              {redemption.tokensCost} 🪙
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <Card data-testid="card-leaderboard">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Token Leaderboard
                    </CardTitle>
                    <CardDescription>Top contributors ranked by total tokens earned</CardDescription>
                  </div>
                  {userRankData && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg px-4 py-2">
                      Your Rank: #{userRankData.rank}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No leaderboard data available yet</p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => {
                      const isCurrentUser = user?.id === entry.user.id;
                      const rankColors = ['bg-yellow-400', 'bg-gray-300', 'bg-orange-400'];
                      
                      return (
                        <div
                          key={entry.user.id}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                            isCurrentUser 
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-400' 
                              : 'bg-gray-50 dark:bg-gray-800'
                          }`}
                          data-testid={`leaderboard-entry-${index}`}
                        >
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                            index < 3 ? rankColors[index] : 'bg-gray-400'
                          }`}>
                            {index < 3 ? (
                              <Crown className="h-5 w-5" />
                            ) : (
                              entry.rank
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 dark:text-white">
                              {entry.user.firstName || entry.user.lastName 
                                ? `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim()
                                : entry.user.email.split('@')[0]
                              }
                              {isCurrentUser && <Badge className="ml-2 bg-purple-500">You</Badge>}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {entry.totalEarned} tokens earned
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-orange-600">
                              {entry.user.tokens}
                            </p>
                            <p className="text-sm text-gray-500">current</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
