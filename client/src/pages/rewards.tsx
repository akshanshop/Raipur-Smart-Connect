import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Coins, Gift, Award, TrendingUp, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface Reward {
  id: string;
  name: string;
  description: string;
  tokenCost: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
}

interface RewardRedemption {
  id: string;
  rewardId: string;
  tokensCost: number;
  status: string;
  createdAt: string;
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

export default function Rewards() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: tokenData } = useQuery<TokenData>({
    queryKey: ["/api/tokens"],
    retry: false,
  });

  const { data: transactions = [] } = useQuery<TokenTransaction[]>({
    queryKey: ["/api/tokens/transactions"],
    retry: false,
  });

  const { data: rewards = [] } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
    retry: false,
  });

  const { data: redemptions = [] } = useQuery<RewardRedemption[]>({
    queryKey: ["/api/rewards/redemptions"],
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
      toast({
        title: "Reward Redeemed!",
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

  const userTokens = tokenData?.tokens || 0;

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      complaint_filed: "Complaint Filed",
      issue_posted: "Community Issue Posted",
      reward_redeemed: "Reward Redeemed",
    };
    return labels[reason] || reason;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2" data-testid="heading-rewards">
            Rewards Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Earn tokens by reporting issues and redeem them for exciting rewards!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white" data-testid="card-token-balance">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Coins className="h-6 w-6" />
                Your Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold" data-testid="text-token-count">{userTokens}</div>
              <p className="text-orange-100 mt-2">Available to spend</p>
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
              <div className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-total-earned">
                {transactions.filter(t => t.type === 'earned').reduce((sum, t) => sum + t.amount, 0)}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Tokens earned</p>
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
              <div className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-total-spent">
                {Math.abs(transactions.filter(t => t.type === 'spent').reduce((sum, t) => sum + t.amount, 0))}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Tokens spent</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="rewards" data-testid="tab-rewards">Available Rewards</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-4">
            {rewards.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Gift className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No rewards available at the moment.</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Check back later for exciting rewards!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward) => (
                  <Card key={reward.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-reward-${reward.id}`}>
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-900 dark:text-white" data-testid={`text-reward-name-${reward.id}`}>
                            {reward.name}
                          </CardTitle>
                          <Badge className={`mt-2 ${categoryColors[reward.category] || 'bg-gray-100'}`}>
                            {categoryIcons[reward.category] || "🎁"} {reward.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4" data-testid={`text-reward-description-${reward.id}`}>
                        {reward.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="h-5 w-5 text-orange-500" />
                          <span className="text-2xl font-bold text-gray-900 dark:text-white" data-testid={`text-reward-cost-${reward.id}`}>
                            {reward.tokenCost}
                          </span>
                        </div>
                        <Button
                          onClick={() => redeemMutation.mutate(reward.id)}
                          disabled={userTokens < reward.tokenCost || redeemMutation.isPending}
                          data-testid={`button-redeem-${reward.id}`}
                        >
                          {redeemMutation.isPending ? "Redeeming..." : "Redeem"}
                        </Button>
                      </div>
                      {userTokens < reward.tokenCost && (
                        <p className="text-sm text-red-500 mt-2" data-testid={`text-insufficient-tokens-${reward.id}`}>
                          Need {reward.tokenCost - userTokens} more tokens
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Token Transactions
                  </CardTitle>
                  <CardDescription>Your token earning and spending history</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No transactions yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {transactions.map((transaction) => (
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Redemption History
                  </CardTitle>
                  <CardDescription>Your redeemed rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  {redemptions.length === 0 ? (
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
                              <Badge variant={redemption.status === 'fulfilled' ? 'default' : 'secondary'} className="mt-1">
                                {redemption.status}
                              </Badge>
                            </div>
                            <div className="text-lg font-bold text-orange-600">
                              {redemption.tokensCost} tokens
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
        </Tabs>
      </main>
    </div>
  );
}
