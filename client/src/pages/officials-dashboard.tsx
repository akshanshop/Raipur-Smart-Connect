import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ClipboardList, Clock, CheckCircle2, AlertTriangle, 
  MapPin, Plus, Filter, Search, Calendar,
  TrendingUp, Target, Zap, BarChart3, Play, 
  FileText, User, Building2, LogOut, Bell, MoreVertical, X
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistance, isPast, differenceInHours, isWithinInterval, startOfWeek, startOfMonth } from "date-fns";
import OfficialsNotificationPanel from "@/components/officials-notification-panel";

interface OfficialJob {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  location: string;
  latitude: string;
  longitude: string;
  assignedOfficialId: string | null;
  status: string;
  estimatedHours: number;
  actualHours: number | null;
  deadline: string | null;
  completedAt: string | null;
  relatedComplaintId: string | null;
  communityId: string | null;
  mediaUrls: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface Official {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
}

interface Community {
  id: string;
  name: string;
  category: string;
}

const jobFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().min(1, "Priority is required"),
  location: z.string().min(3, "Location is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  estimatedHours: z.coerce.number().min(0.5, "Must be at least 0.5 hours").default(1),
  deadline: z.string().optional(),
  assignedOfficialId: z.string().optional(),
  relatedComplaintId: z.string().optional(),
  communityId: z.string().optional(),
});

type JobFormData = z.infer<typeof jobFormSchema>;

const completeJobSchema = z.object({
  actualHours: z.coerce.number().min(0.1, "Must be at least 0.1 hours"),
});

type CompleteJobData = z.infer<typeof completeJobSchema>;

export default function OfficialsDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("assigned");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<OfficialJob | null>(null);
  const [completingJob, setCompletingJob] = useState<OfficialJob | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch all jobs
  const { data: allJobs = [], isLoading: jobsLoading } = useQuery<OfficialJob[]>({
    queryKey: ["/api/official-jobs"],
  });

  // Fetch assigned jobs
  const { data: assignedJobs = [], isLoading: assignedJobsLoading } = useQuery<OfficialJob[]>({
    queryKey: ["/api/official-jobs/assigned", user?.id],
    enabled: !!user?.id,
  });

  // Fetch officials list
  const { data: officials = [] } = useQuery<Official[]>({
    queryKey: ["/api/officials/list"],
  });

  // Fetch communities
  const { data: communities = [] } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  // Create job form
  const createJobForm = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      priority: "",
      location: "",
      latitude: "",
      longitude: "",
      estimatedHours: 1,
      deadline: "",
      assignedOfficialId: "",
      relatedComplaintId: "",
      communityId: "",
    },
  });

  // Complete job form
  const completeJobForm = useForm<CompleteJobData>({
    resolver: zodResolver(completeJobSchema),
    defaultValues: {
      actualHours: 0,
    },
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      return await apiRequest("POST", "/api/official-jobs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/official-jobs"] });
      toast({ title: "✓ Job created successfully" });
      createJobForm.reset();
      setActiveTab("all");
    },
    onError: () => {
      toast({ title: "Failed to create job", variant: "destructive" });
    },
  });

  // Start job mutation
  const startJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest("PATCH", `/api/official-jobs/${jobId}/status`, {
        status: "in_progress",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/official-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/official-jobs/assigned"] });
      toast({ title: "✓ Job started" });
    },
    onError: () => {
      toast({ title: "Failed to start job", variant: "destructive" });
    },
  });

  // Complete job mutation
  const completeJobMutation = useMutation({
    mutationFn: async ({ jobId, actualHours }: { jobId: string; actualHours: number }) => {
      return await apiRequest("PATCH", `/api/official-jobs/${jobId}/status`, {
        status: "completed",
        actualHours,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/official-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/official-jobs/assigned"] });
      toast({ title: "✓ Job completed successfully" });
      setCompletingJob(null);
      completeJobForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to complete job", variant: "destructive" });
    },
  });

  // Assign to me mutation
  const assignToMeMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest("PATCH", `/api/official-jobs/${jobId}/assign`, {
        officialId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/official-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/official-jobs/assigned"] });
      toast({ title: "✓ Job assigned to you" });
    },
    onError: () => {
      toast({ title: "Failed to assign job", variant: "destructive" });
    },
  });

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest("PATCH", `/api/official-jobs/${jobId}/status`, {
        status: "cancelled",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/official-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/official-jobs/assigned"] });
      toast({ title: "✓ Job cancelled" });
      setSelectedJob(null);
    },
    onError: () => {
      toast({ title: "Failed to cancel job", variant: "destructive" });
    },
  });

  // Use my location
  const useMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          createJobForm.setValue("latitude", position.coords.latitude.toString());
          createJobForm.setValue("longitude", position.coords.longitude.toString());
          toast({ title: "✓ Location captured" });
        },
        () => {
          toast({ title: "Failed to get location", variant: "destructive" });
        }
      );
    }
  };

  // Calculate stats
  const stats = {
    totalAssigned: assignedJobs.length,
    pending: assignedJobs.filter(j => j.status === "pending").length,
    inProgress: assignedJobs.filter(j => j.status === "in_progress").length,
    completed: assignedJobs.filter(j => j.status === "completed").length,
    completedThisWeek: assignedJobs.filter(j => 
      j.status === "completed" && 
      j.completedAt && 
      isWithinInterval(new Date(j.completedAt), { start: startOfWeek(new Date()), end: new Date() })
    ).length,
    completedThisMonth: assignedJobs.filter(j => 
      j.status === "completed" && 
      j.completedAt && 
      isWithinInterval(new Date(j.completedAt), { start: startOfMonth(new Date()), end: new Date() })
    ).length,
    overdue: assignedJobs.filter(j => 
      j.deadline && 
      isPast(new Date(j.deadline)) && 
      j.status !== "completed" && 
      j.status !== "cancelled"
    ).length,
    avgCompletionTime: (() => {
      const completedWithTime = assignedJobs.filter(j => 
        j.status === "completed" && j.actualHours
      );
      if (completedWithTime.length === 0) return 0;
      const total = completedWithTime.reduce((sum, j) => sum + (j.actualHours || 0), 0);
      return Math.round(total / completedWithTime.length * 10) / 10;
    })(),
    efficiency: (() => {
      const completedWithBothTimes = assignedJobs.filter(j => 
        j.status === "completed" && j.actualHours && j.estimatedHours
      );
      if (completedWithBothTimes.length === 0) return 100;
      const totalEstimated = completedWithBothTimes.reduce((sum, j) => sum + j.estimatedHours, 0);
      const totalActual = completedWithBothTimes.reduce((sum, j) => sum + (j.actualHours || 0), 0);
      return Math.round((totalEstimated / totalActual) * 100);
    })(),
  };

  // Filter jobs for "All Jobs" tab
  const filteredAllJobs = allJobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || job.priority === priorityFilter;
    const matchesCategory = categoryFilter === "all" || job.category === categoryFilter;
    const matchesAssigned = assignedFilter === "all" || 
                           (assignedFilter === "assigned" && job.assignedOfficialId) ||
                           (assignedFilter === "unassigned" && !job.assignedOfficialId);
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssigned;
  });

  // Filter jobs for "Assigned to Me" tab
  const filteredAssignedJobs = assignedJobs.filter((job) => {
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesStatus;
  }).sort((a, b) => {
    // Sort by priority first (urgent > high > medium > low)
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    // Then by deadline (closer deadline first)
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    
    // Finally by created date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500 hover:bg-red-600";
      case "high": return "bg-orange-500 hover:bg-orange-600";
      case "medium": return "bg-yellow-500 hover:bg-yellow-600";
      case "low": return "bg-green-500 hover:bg-green-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "pending": return "bg-yellow-500";
      case "cancelled": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getDeadlineWarning = (deadline: string | null, status: string) => {
    if (!deadline || status === "completed" || status === "cancelled") return null;
    
    const deadlineDate = new Date(deadline);
    if (isPast(deadlineDate)) {
      return { color: "text-red-600 dark:text-red-400", label: "OVERDUE", icon: AlertTriangle };
    }
    
    const hoursUntil = differenceInHours(deadlineDate, new Date());
    if (hoursUntil <= 24) {
      return { color: "text-orange-600 dark:text-orange-400", label: "DUE SOON", icon: Clock };
    }
    
    return null;
  };

  const formatTimeRemaining = (deadline: string | null) => {
    if (!deadline) return "No deadline";
    const deadlineDate = new Date(deadline);
    if (isPast(deadlineDate)) {
      return `Overdue by ${formatDistance(deadlineDate, new Date())}`;
    }
    return `${formatDistance(new Date(), deadlineDate)} left`;
  };

  const renderJobCard = (job: OfficialJob, showActions: boolean = true) => {
    const warning = getDeadlineWarning(job.deadline, job.status);
    const isAssigned = job.assignedOfficialId === user?.id;
    const canStart = isAssigned && job.status === "pending";
    const canComplete = isAssigned && job.status === "in_progress";
    
    return (
      <Card 
        key={job.id} 
        className="hover:shadow-lg transition-all duration-200 border-l-4"
        style={{ borderLeftColor: `var(--${job.priority})` }}
        data-testid={`card-job-${job.id}`}
      >
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate" data-testid={`text-job-title-${job.id}`}>
                {job.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-1" data-testid={`text-job-description-${job.id}`}>
                {job.description}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedJob(job)}
              data-testid={`button-view-details-${job.id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className={getPriorityColor(job.priority)} data-testid={`badge-priority-${job.id}`}>
              {job.priority.toUpperCase()}
            </Badge>
            <Badge className={getStatusColor(job.status)} data-testid={`badge-status-${job.id}`}>
              {job.status.replace("_", " ").toUpperCase()}
            </Badge>
            <Badge variant="outline" data-testid={`badge-category-${job.id}`}>
              {job.category}
            </Badge>
            {warning && (
              <Badge variant="outline" className={warning.color} data-testid={`badge-warning-${job.id}`}>
                <warning.icon className="h-3 w-3 mr-1" />
                {warning.label}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground" data-testid={`text-location-${job.id}`}>
            <MapPin className="h-4 w-4 mr-2" />
            {job.location}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div data-testid={`text-estimated-hours-${job.id}`}>
              <div className="text-muted-foreground">Estimated</div>
              <div className="font-semibold">{job.estimatedHours}h</div>
            </div>
            <div data-testid={`text-actual-hours-${job.id}`}>
              <div className="text-muted-foreground">Actual</div>
              <div className="font-semibold">{job.actualHours ? `${job.actualHours}h` : "-"}</div>
            </div>
          </div>

          {job.deadline && (
            <div className="text-sm" data-testid={`text-deadline-${job.id}`}>
              <div className="text-muted-foreground">Deadline</div>
              <div className="font-semibold flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(job.deadline), "PPp")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatTimeRemaining(job.deadline)}
              </div>
            </div>
          )}

          {job.status === "in_progress" && job.deadline && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Time Progress</span>
                <span data-testid={`text-time-progress-${job.id}`}>
                  {Math.min(100, Math.round(
                    (differenceInHours(new Date(), new Date(job.createdAt)) / 
                    (job.estimatedHours || 1)) * 100
                  ))}%
                </span>
              </div>
              <Progress 
                value={Math.min(100, 
                  (differenceInHours(new Date(), new Date(job.createdAt)) / 
                  (job.estimatedHours || 1)) * 100
                )}
                data-testid={`progress-time-${job.id}`}
              />
            </div>
          )}

          {(job.relatedComplaintId || job.communityId) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {job.relatedComplaintId && (
                <Badge variant="secondary" data-testid={`badge-complaint-${job.id}`}>
                  <FileText className="h-3 w-3 mr-1" />
                  Complaint: {job.relatedComplaintId.slice(0, 8)}
                </Badge>
              )}
              {job.communityId && (
                <Badge variant="secondary" data-testid={`badge-community-${job.id}`}>
                  <Building2 className="h-3 w-3 mr-1" />
                  Community: {job.communityId.slice(0, 8)}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {showActions && (
          <CardFooter className="flex gap-2">
            {!job.assignedOfficialId && (
              <Button
                onClick={() => assignToMeMutation.mutate(job.id)}
                disabled={assignToMeMutation.isPending}
                className="flex-1"
                data-testid={`button-assign-to-me-${job.id}`}
              >
                <User className="h-4 w-4 mr-2" />
                Assign to Me
              </Button>
            )}
            
            {canStart && (
              <Button
                onClick={() => startJobMutation.mutate(job.id)}
                disabled={startJobMutation.isPending}
                className="flex-1"
                data-testid={`button-start-job-${job.id}`}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Job
              </Button>
            )}

            {canComplete && (
              <Button
                onClick={() => setCompletingJob(job)}
                className="flex-1"
                data-testid={`button-complete-job-${job.id}`}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    );
  };

  const handleCreateJob = (data: JobFormData) => {
    createJobMutation.mutate(data);
  };

  const handleCompleteJob = (data: CompleteJobData) => {
    if (completingJob) {
      completeJobMutation.mutate({
        jobId: completingJob.id,
        actualHours: data.actualHours,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border/50 cool-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg flex items-center justify-center">
                <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-dashboard-title">
                  Job Management
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Track and manage official jobs
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <OfficialsNotificationPanel />
              
              <div className="flex items-center gap-2 bg-card/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/30">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-primary/20"
                    data-testid="img-profile"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium" data-testid="text-user-name">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">Official</p>
                </div>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card data-testid="card-stat-total">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ClipboardList className="h-4 w-4" />
                <span className="text-xs font-medium">Total Assigned</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-stat-total">{stats.totalAssigned}</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-completed-week">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">This Week</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-stat-completed-week">
                {stats.completedThisWeek}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-completed-month">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs font-medium">This Month</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-stat-completed-month">
                {stats.completedThisMonth}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-overdue">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">Overdue</span>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-stat-overdue">
                {stats.overdue}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-avg-time">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Avg. Time</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-stat-avg-time">{stats.avgCompletionTime}h</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-efficiency">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Efficiency</span>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-stat-efficiency">
                {stats.efficiency}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-job-management">
            <TabsTrigger value="assigned" data-testid="tab-assigned">
              Assigned to Me ({stats.totalAssigned})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              All Jobs ({allJobs.length})
            </TabsTrigger>
            <TabsTrigger value="create" data-testid="tab-create">
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </TabsTrigger>
          </TabsList>

          {/* Assigned to Me Tab */}
          <TabsContent value="assigned" className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground">
                Showing {filteredAssignedJobs.length} of {assignedJobs.length} jobs
              </div>
            </div>

            {assignedJobsLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAssignedJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No jobs assigned to you</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {statusFilter !== "all" 
                      ? "Try changing the filter" 
                      : "Check the 'All Jobs' tab to find jobs to work on"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2" data-testid="grid-assigned-jobs">
                {filteredAssignedJobs.map(job => renderJobCard(job, true))}
              </div>
            )}
          </TabsContent>

          {/* All Jobs Tab */}
          <TabsContent value="all" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-jobs"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-all-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40" data-testid="select-priority-filter">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44" data-testid="select-category-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="sanitation">Sanitation</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="w-44" data-testid="select-assigned-filter">
                  <SelectValue placeholder="Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>

              {(statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || assignedFilter !== "all" || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setCategoryFilter("all");
                    setAssignedFilter("all");
                    setSearchQuery("");
                  }}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}

              <div className="text-sm text-muted-foreground self-center ml-auto">
                Showing {filteredAllJobs.length} of {allJobs.length} jobs
              </div>
            </div>

            {jobsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAllJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No jobs found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your filters or search query
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="grid-all-jobs">
                {filteredAllJobs.map(job => renderJobCard(job, true))}
              </div>
            )}
          </TabsContent>

          {/* Create Job Tab */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-create-job-title">Create New Official Job</CardTitle>
                <CardDescription>
                  Fill out the form below to create a new job assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...createJobForm}>
                  <form onSubmit={createJobForm.handleSubmit(handleCreateJob)} className="space-y-4">
                    <FormField
                      control={createJobForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Fix broken streetlight on Main St" {...field} data-testid="input-job-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createJobForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide detailed information about the job..." 
                              rows={4}
                              {...field} 
                              data-testid="input-job-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={createJobForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-job-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                <SelectItem value="sanitation">Sanitation</SelectItem>
                                <SelectItem value="safety">Safety</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="emergency">Emergency</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createJobForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-job-priority">
                                  <SelectValue placeholder="Select priority" />
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
                      control={createJobForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Main Street, Sector 21" {...field} data-testid="input-job-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-3 gap-4">
                      <FormField
                        control={createJobForm.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input type="number" step="any" placeholder="21.2514" {...field} data-testid="input-job-latitude" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createJobForm.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input type="number" step="any" placeholder="81.6296" {...field} data-testid="input-job-longitude" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={useMyLocation}
                          className="w-full"
                          data-testid="button-use-location"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Use My Location
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={createJobForm.control}
                        name="estimatedHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Hours</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.5" 
                                min="0.5"
                                placeholder="1" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                                data-testid="input-job-estimated-hours"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createJobForm.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deadline</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                {...field} 
                                data-testid="input-job-deadline"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <FormField
                        control={createJobForm.control}
                        name="assignedOfficialId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assign To (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-job-assign">
                                  <SelectValue placeholder="Select official" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Unassigned</SelectItem>
                                {officials.map(official => (
                                  <SelectItem key={official.id} value={official.id}>
                                    {official.firstName} {official.lastName} ({official.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createJobForm.control}
                        name="relatedComplaintId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Related Complaint ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional" {...field} data-testid="input-job-complaint-id" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createJobForm.control}
                        name="communityId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Community (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-job-community">
                                  <SelectValue placeholder="Select community" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {communities.map(community => (
                                  <SelectItem key={community.id} value={community.id}>
                                    {community.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={createJobMutation.isPending}
                        className="flex-1"
                        data-testid="button-create-job"
                      >
                        {createJobMutation.isPending ? (
                          <>Creating...</>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Job
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => createJobForm.reset()}
                        data-testid="button-reset-form"
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Details Modal */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-job-details">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span data-testid="text-modal-job-title">{selectedJob.title}</span>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(selectedJob.priority)}>
                      {selectedJob.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(selectedJob.status)}>
                      {selectedJob.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </DialogTitle>
                <DialogDescription data-testid="text-modal-job-description">
                  {selectedJob.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Time Tracking */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Tracking
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Estimated</div>
                      <div className="text-lg font-bold" data-testid="text-modal-estimated">
                        {selectedJob.estimatedHours}h
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Actual</div>
                      <div className="text-lg font-bold" data-testid="text-modal-actual">
                        {selectedJob.actualHours ? `${selectedJob.actualHours}h` : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Efficiency</div>
                      <div className="text-lg font-bold" data-testid="text-modal-efficiency">
                        {selectedJob.actualHours 
                          ? `${Math.round((selectedJob.estimatedHours / selectedJob.actualHours) * 100)}%`
                          : "-"
                        }
                      </div>
                    </div>
                  </div>
                  
                  {selectedJob.actualHours && selectedJob.estimatedHours && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Time Usage</span>
                        <span data-testid="text-modal-time-usage">
                          {Math.round((selectedJob.actualHours / selectedJob.estimatedHours) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (selectedJob.actualHours / selectedJob.estimatedHours) * 100)}
                        data-testid="progress-modal-time"
                      />
                    </div>
                  )}
                </div>

                {/* Deadline Info */}
                {selectedJob.deadline && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Deadline
                    </h3>
                    <div className="text-sm">
                      <div data-testid="text-modal-deadline">
                        {format(new Date(selectedJob.deadline), "PPP 'at' p")}
                      </div>
                      <div className="text-muted-foreground mt-1" data-testid="text-modal-deadline-countdown">
                        {formatTimeRemaining(selectedJob.deadline)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </h3>
                  <div className="text-sm" data-testid="text-modal-location">
                    {selectedJob.location}
                  </div>
                  {selectedJob.latitude && selectedJob.longitude && (
                    <div className="text-xs text-muted-foreground" data-testid="text-modal-coordinates">
                      {selectedJob.latitude}, {selectedJob.longitude}
                    </div>
                  )}
                </div>

                {/* Related Information */}
                {(selectedJob.relatedComplaintId || selectedJob.communityId) && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Related Information</h3>
                    <div className="space-y-2 text-sm">
                      {selectedJob.relatedComplaintId && (
                        <div data-testid="text-modal-complaint">
                          <span className="text-muted-foreground">Complaint ID: </span>
                          {selectedJob.relatedComplaintId}
                        </div>
                      )}
                      {selectedJob.communityId && (
                        <div data-testid="text-modal-community">
                          <span className="text-muted-foreground">Community ID: </span>
                          {selectedJob.communityId}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div data-testid="text-modal-created">
                      <span className="text-muted-foreground">Created: </span>
                      {format(new Date(selectedJob.createdAt), "PPP 'at' p")}
                    </div>
                    {selectedJob.completedAt && (
                      <div data-testid="text-modal-completed">
                        <span className="text-muted-foreground">Completed: </span>
                        {format(new Date(selectedJob.completedAt), "PPP 'at' p")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                {selectedJob.status !== "completed" && selectedJob.status !== "cancelled" && (
                  <Button
                    variant="destructive"
                    onClick={() => cancelJobMutation.mutate(selectedJob.id)}
                    disabled={cancelJobMutation.isPending}
                    data-testid="button-modal-cancel-job"
                  >
                    Cancel Job
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedJob(null)} data-testid="button-modal-close">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Job Dialog */}
      <Dialog open={!!completingJob} onOpenChange={(open) => !open && setCompletingJob(null)}>
        <DialogContent data-testid="dialog-complete-job">
          <DialogHeader>
            <DialogTitle>Complete Job</DialogTitle>
            <DialogDescription>
              Enter the actual hours spent on this job
            </DialogDescription>
          </DialogHeader>

          {completingJob && (
            <Form {...completeJobForm}>
              <form onSubmit={completeJobForm.handleSubmit(handleCompleteJob)} className="space-y-4">
                <div className="text-sm">
                  <div className="font-medium mb-2" data-testid="text-complete-job-title">
                    {completingJob.title}
                  </div>
                  <div className="text-muted-foreground">
                    Estimated: {completingJob.estimatedHours} hours
                  </div>
                </div>

                <FormField
                  control={completeJobForm.control}
                  name="actualHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Hours Spent *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0.1"
                          placeholder="e.g., 2.5" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-actual-hours"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCompletingJob(null)}
                    data-testid="button-cancel-complete"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={completeJobMutation.isPending}
                    data-testid="button-submit-complete"
                  >
                    {completeJobMutation.isPending ? "Completing..." : "Complete Job"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
