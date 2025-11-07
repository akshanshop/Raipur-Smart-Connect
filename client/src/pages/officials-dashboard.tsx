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
  FileText, User, Building2, LogOut, Bell, MoreVertical, X, AlertCircle, Map as MapIcon
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistance, isPast, differenceInHours, isWithinInterval, startOfWeek, startOfMonth } from "date-fns";
import OfficialsNotificationPanel from "@/components/officials-notification-panel";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  estimatedHours: string;
  actualHours: string | null;
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

interface Issue {
  id: string;
  ticketNumber: string;
  userId: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  location: string;
  latitude: string;
  longitude: string;
  status: string;
  mediaUrls: string[] | null;
  resolutionScreenshots: string[] | null;
  upvotes: number;
  downvotes: number;
  assignedTo: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string;
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
  const [mainTab, setMainTab] = useState("jobs");
  const [activeTab, setActiveTab] = useState("assigned");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<OfficialJob | null>(null);
  const [completingJob, setCompletingJob] = useState<OfficialJob | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issueSearchQuery, setIssueSearchQuery] = useState("");
  const [issueStatusFilter, setIssueStatusFilter] = useState("all");
  const [issuePriorityFilter, setIssuePriorityFilter] = useState("all");
  const [issueCategoryFilter, setIssueCategoryFilter] = useState("all");
  const [showMap, setShowMap] = useState(true);

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

  // Fetch all issues for officials
  const { data: allIssues = [], isLoading: issuesLoading } = useQuery<Issue[]>({
    queryKey: ["/api/officials/issues"],
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
      const total = completedWithTime.reduce((sum, j) => sum + (parseFloat(j.actualHours || "0")), 0);
      return Math.round(total / completedWithTime.length * 10) / 10;
    })(),
    efficiency: (() => {
      const completedWithBothTimes = assignedJobs.filter(j => 
        j.status === "completed" && j.actualHours && j.estimatedHours
      );
      if (completedWithBothTimes.length === 0) return 100;
      const totalEstimated = completedWithBothTimes.reduce((sum, j) => sum + parseFloat(j.estimatedHours), 0);
      const totalActual = completedWithBothTimes.reduce((sum, j) => sum + parseFloat(j.actualHours || "0"), 0);
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

  // Filter issues
  const filteredIssues = allIssues.filter((issue) => {
    const matchesSearch = issue.title.toLowerCase().includes(issueSearchQuery.toLowerCase()) ||
                         issue.description.toLowerCase().includes(issueSearchQuery.toLowerCase()) ||
                         issue.ticketNumber.toLowerCase().includes(issueSearchQuery.toLowerCase());
    const matchesStatus = issueStatusFilter === "all" || issue.status === issueStatusFilter;
    const matchesPriority = issuePriorityFilter === "all" || issue.priority === issuePriorityFilter;
    const matchesCategory = issueCategoryFilter === "all" || issue.category === issueCategoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  }).sort((a, b) => {
    // Sort by priority first
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    // Then by created date (newest first)
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

  const getMarkerColor = (status: string, priority: string) => {
    if (status === "resolved" || status === "closed") return "#22c55e"; // green
    
    switch (priority) {
      case "urgent": return "#ef4444"; // red
      case "high": return "#f97316"; // orange
      case "medium": return "#eab308"; // yellow
      case "low": return "#3b82f6"; // blue
      default: return "#6b7280"; // gray
    }
  };

  const createCustomIcon = (status: string, priority: string) => {
    const color = getMarkerColor(status, priority);
    const size = priority === 'urgent' || priority === 'high' ? 40 : priority === 'medium' ? 32 : 28;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <svg width="${size}" height="${size * 1.4}" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z" 
                fill="${color}" 
                stroke="white" 
                stroke-width="2"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
          <circle cx="12" cy="8" r="3" fill="white" opacity="0.9"/>
        </svg>
      `,
      iconSize: [size, size * 1.4],
      iconAnchor: [size / 2, size * 1.4],
      popupAnchor: [0, -size * 1.4],
    });
  };

  const renderIssueCard = (issue: Issue) => {
    return (
      <Card 
        key={issue.id} 
        className="hover:shadow-lg transition-all duration-200 border-l-4"
        style={{ borderLeftColor: `var(--${issue.priority})` }}
        data-testid={`card-issue-${issue.id}`}
      >
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-mono text-xs" data-testid={`badge-ticket-${issue.id}`}>
                  {issue.ticketNumber}
                </Badge>
              </div>
              <CardTitle className="text-lg truncate" data-testid={`text-issue-title-${issue.id}`}>
                {issue.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-1" data-testid={`text-issue-description-${issue.id}`}>
                {issue.description}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIssue(issue)}
              data-testid={`button-view-issue-${issue.id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className={getPriorityColor(issue.priority)} data-testid={`badge-issue-priority-${issue.id}`}>
              {issue.priority.toUpperCase()}
            </Badge>
            <Badge className={getStatusColor(issue.status)} data-testid={`badge-issue-status-${issue.id}`}>
              {issue.status.replace("_", " ").toUpperCase()}
            </Badge>
            <Badge variant="outline" data-testid={`badge-issue-category-${issue.id}`}>
              {issue.category}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground" data-testid={`text-issue-location-${issue.id}`}>
            <MapPin className="h-4 w-4 mr-2" />
            {issue.location}
          </div>

          {issue.userName && (
            <div className="flex items-center text-sm text-muted-foreground" data-testid={`text-issue-reporter-${issue.id}`}>
              <User className="h-4 w-4 mr-2" />
              Reported by: {issue.userName}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div data-testid={`text-issue-upvotes-${issue.id}`}>
              <div className="text-muted-foreground">Upvotes</div>
              <div className="font-semibold">{issue.upvotes}</div>
            </div>
            <div data-testid={`text-issue-created-${issue.id}`}>
              <div className="text-muted-foreground">Created</div>
              <div className="font-semibold">{formatDistance(new Date(issue.createdAt), new Date(), { addSuffix: true })}</div>
            </div>
          </div>

          {issue.latitude && issue.longitude && (
            <div className="text-xs text-muted-foreground" data-testid={`text-issue-coordinates-${issue.id}`}>
              Coordinates: {issue.latitude}, {issue.longitude}
            </div>
          )}

          {issue.mediaUrls && issue.mediaUrls.length > 0 && (
            <div className="flex gap-2 pt-2">
              <Badge variant="secondary" data-testid={`badge-issue-media-${issue.id}`}>
                <FileText className="h-3 w-3 mr-1" />
                {issue.mediaUrls.length} {issue.mediaUrls.length === 1 ? 'attachment' : 'attachments'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
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
                    (parseFloat(job.estimatedHours) || 1)) * 100
                  ))}%
                </span>
              </div>
              <Progress 
                value={Math.min(100, 
                  (differenceInHours(new Date(), new Date(job.createdAt)) / 
                  (parseFloat(job.estimatedHours) || 1)) * 100
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
                  Officials Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Manage jobs and track issues
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
        {/* Main Dashboard Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8" data-testid="tabs-main">
            <TabsTrigger value="jobs" data-testid="tab-job-management">
              <ClipboardList className="h-4 w-4 mr-2" />
              Job Management
            </TabsTrigger>
            <TabsTrigger value="issues" data-testid="tab-issues-management">
              <AlertCircle className="h-4 w-4 mr-2" />
              Issues Management
            </TabsTrigger>
          </TabsList>

          {/* Job Management Section */}
          <TabsContent value="jobs" className="space-y-8">
            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
      </TabsContent>

      {/* Issues Management Section */}
      <TabsContent value="issues" className="space-y-8">
        {/* Issues Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="card-issue-stat-total">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Total Issues</span>
              </div>
              <div className="text-2xl font-bold" data-testid="text-total-issues">{allIssues.length}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-issue-stat-open">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Open</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-open-issues">
                {allIssues.filter(i => i.status === "open").length}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-issue-stat-progress">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Play className="h-4 w-4" />
                <span className="text-sm">In Progress</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-inprogress-issues">
                {allIssues.filter(i => i.status === "in_progress").length}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-issue-stat-resolved">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Resolved</span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-resolved-issues">
                {allIssues.filter(i => i.status === "resolved" || i.status === "closed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    value={issueSearchQuery}
                    onChange={(e) => setIssueSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-issue-search"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={issueStatusFilter} onValueChange={setIssueStatusFilter}>
                  <SelectTrigger data-testid="select-issue-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={issuePriorityFilter} onValueChange={setIssuePriorityFilter}>
                  <SelectTrigger data-testid="select-issue-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={issueCategoryFilter} onValueChange={setIssueCategoryFilter}>
                  <SelectTrigger data-testid="select-issue-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="sanitation">Sanitation</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium invisible">Reset</label>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIssueSearchQuery("");
                    setIssueStatusFilter("all");
                    setIssuePriorityFilter("all");
                    setIssueCategoryFilter("all");
                  }}
                  data-testid="button-reset-issue-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map View */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                Issues Map
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMap(!showMap)}
                data-testid="button-toggle-map"
              >
                {showMap ? "Hide Map" : "Show Map"}
              </Button>
            </div>
          </CardHeader>
          {showMap && (
            <CardContent>
              <div className="h-[500px] rounded-lg overflow-hidden border border-border">
                <MapContainer
                  center={[21.2514, 81.6296]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  data-testid="map-container"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {filteredIssues
                    .filter(issue => issue.latitude && issue.longitude)
                    .map((issue) => (
                      <Marker
                        key={issue.id}
                        position={[parseFloat(issue.latitude), parseFloat(issue.longitude)]}
                        icon={createCustomIcon(issue.status, issue.priority)}
                      >
                        <Popup>
                          <div className="p-2 min-w-[250px]">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {issue.ticketNumber}
                              </Badge>
                              <Badge className={getPriorityColor(issue.priority)}>
                                {issue.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-sm mb-1">{issue.title}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {issue.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                              <MapPin className="h-3 w-3" />
                              <span className="line-clamp-1">{issue.location}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <Badge className={getStatusColor(issue.status)}>
                                {issue.status.replace("_", " ").toUpperCase()}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedIssue(issue)}
                                className="h-6 text-xs"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                Showing {filteredIssues.filter(i => i.latitude && i.longitude).length} issues on the map
              </div>
            </CardContent>
          )}
        </Card>

        {/* Issues List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              All Issues ({filteredIssues.length})
            </h2>
          </div>

          {issuesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredIssues.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No issues found</h3>
                <p className="text-muted-foreground">
                  {issueSearchQuery || issueStatusFilter !== "all" || issuePriorityFilter !== "all" || issueCategoryFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No issues have been reported yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredIssues.map(issue => renderIssueCard(issue))}
            </div>
          )}
        </div>
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
                          ? `${Math.round((parseFloat(selectedJob.estimatedHours) / parseFloat(selectedJob.actualHours)) * 100)}%`
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
                          {Math.round((parseFloat(selectedJob.actualHours) / parseFloat(selectedJob.estimatedHours)) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (parseFloat(selectedJob.actualHours) / parseFloat(selectedJob.estimatedHours)) * 100)}
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

      {/* Issue Details Modal */}
      <Dialog open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-issue-details">
          {selectedIssue && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span data-testid="text-modal-issue-title">{selectedIssue.title}</span>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(selectedIssue.priority)}>
                      {selectedIssue.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(selectedIssue.status)}>
                      {selectedIssue.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </DialogTitle>
                <DialogDescription className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      Ticket: {selectedIssue.ticketNumber}
                    </Badge>
                    <Badge variant="outline">
                      {selectedIssue.category}
                    </Badge>
                  </div>
                  <p data-testid="text-modal-issue-description">{selectedIssue.description}</p>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Location */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </h3>
                  <div className="text-sm" data-testid="text-modal-issue-location">
                    {selectedIssue.location}
                  </div>
                  {selectedIssue.latitude && selectedIssue.longitude && (
                    <div className="text-xs text-muted-foreground" data-testid="text-modal-issue-coordinates">
                      Coordinates: {selectedIssue.latitude}, {selectedIssue.longitude}
                    </div>
                  )}
                </div>

                {/* Reporter Info */}
                {selectedIssue.userName && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Reporter
                    </h3>
                    <div className="text-sm" data-testid="text-modal-issue-reporter">
                      {selectedIssue.userName}
                    </div>
                  </div>
                )}

                {/* Engagement Stats */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Engagement</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Upvotes</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-modal-issue-upvotes">
                        {selectedIssue.upvotes}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Downvotes</div>
                      <div className="text-lg font-bold text-red-600 dark:text-red-400" data-testid="text-modal-issue-downvotes">
                        {selectedIssue.downvotes}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media Attachments */}
                {selectedIssue.mediaUrls && selectedIssue.mediaUrls.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Media Attachments ({selectedIssue.mediaUrls.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedIssue.mediaUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          data-testid={`link-media-${idx}`}
                        >
                          View Attachment {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Screenshots */}
                {selectedIssue.resolutionScreenshots && selectedIssue.resolutionScreenshots.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Resolution Screenshots ({selectedIssue.resolutionScreenshots.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedIssue.resolutionScreenshots.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 dark:text-green-400 hover:underline"
                          data-testid={`link-resolution-${idx}`}
                        >
                          View Resolution {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div data-testid="text-modal-issue-created">
                      <span className="text-muted-foreground">Created: </span>
                      {format(new Date(selectedIssue.createdAt), "PPP 'at' p")}
                      <span className="text-muted-foreground ml-2">
                        ({formatDistance(new Date(selectedIssue.createdAt), new Date(), { addSuffix: true })})
                      </span>
                    </div>
                    {selectedIssue.resolvedAt && (
                      <div data-testid="text-modal-issue-resolved">
                        <span className="text-muted-foreground">Resolved: </span>
                        {format(new Date(selectedIssue.resolvedAt), "PPP 'at' p")}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedIssue(null)} data-testid="button-modal-issue-close">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
