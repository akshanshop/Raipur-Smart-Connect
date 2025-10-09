import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Complaints from "@/pages/complaints";
import Community from "@/pages/community";
import Dashboard from "@/pages/dashboard";
import OfficialsDashboard from "@/pages/officials-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isOfficial = user?.role === 'official';

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={isOfficial ? OfficialsDashboard : Home} />
          <Route path="/complaints" component={Complaints} />
          <Route path="/community" component={Community} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/officials" component={OfficialsDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
