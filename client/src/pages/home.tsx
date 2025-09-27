import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Chatbot from "@/components/chatbot";
import ComplaintForm from "@/components/complaint-form";
import CommunityFeed from "@/components/community-feed";
import MapsIntegration from "@/components/maps-integration";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: cityStats } = useQuery({
    queryKey: ["/api/stats/city"],
    retry: false,
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/stats/user"],
    retry: false,
  });

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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">Welcome to Raipur Smart Connect</h2>
              <p className="text-lg opacity-90 mb-6">Your unified platform for civic engagement and community problem-solving</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold" data-testid="text-active-issues">
                    {cityStats?.totalComplaints - cityStats?.resolvedComplaints || 0}
                  </div>
                  <div className="text-sm opacity-90">Active Issues</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold" data-testid="text-resolved-issues">
                    {cityStats?.resolvedComplaints || 0}
                  </div>
                  <div className="text-sm opacity-90">Resolved</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold" data-testid="text-community-score">
                    {userStats?.contributionScore || 0}
                  </div>
                  <div className="text-sm opacity-90">Community Score</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold" data-testid="text-response-time">
                    {cityStats?.averageResponseTime || "N/A"}
                  </div>
                  <div className="text-sm opacity-90">Avg Response</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Chatbot & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <Chatbot />
            
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-between"
                    onClick={() => window.scrollTo({ top: document.querySelector('#complaint-form')?.offsetTop, behavior: 'smooth' })}
                    data-testid="button-new-complaint"
                  >
                    <span className="flex items-center">
                      <i className="fas fa-plus-circle mr-3"></i>
                      Register New Complaint
                    </span>
                    <i className="fas fa-arrow-right"></i>
                  </Button>
                  
                  <Button 
                    variant="secondary"
                    className="w-full flex items-center justify-between"
                    onClick={() => window.location.href = '/complaints'}
                    data-testid="button-check-status"
                  >
                    <span className="flex items-center">
                      <i className="fas fa-search mr-3"></i>
                      Check Complaint Status
                    </span>
                    <i className="fas fa-arrow-right"></i>
                  </Button>
                  
                  <Button 
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 flex items-center justify-between"
                    data-testid="button-emergency"
                  >
                    <span className="flex items-center">
                      <i className="fas fa-exclamation-triangle mr-3"></i>
                      Emergency Alert
                    </span>
                    <i className="fas fa-arrow-right"></i>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Center Column: Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <div id="complaint-form">
              <ComplaintForm />
            </div>
            <CommunityFeed />
          </div>
        </div>

        {/* Maps Integration */}
        <div className="mt-8">
          <MapsIntegration />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Raipur Smart Connect</h4>
              <p className="text-sm text-muted-foreground">Empowering citizens through technology for a better Raipur.</p>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-3">Quick Links</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Register Complaint</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Check Status</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community Issues</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Emergency Contacts</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-3">Services</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Water Supply</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Garbage Collection</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Road Maintenance</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Street Lighting</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-3">Contact</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><i className="fas fa-phone mr-2"></i>+91 771 234 5678</li>
                <li><i className="fas fa-envelope mr-2"></i>help@raipurconnect.gov.in</li>
                <li><i className="fas fa-map-marker-alt mr-2"></i>Nagar Nigam Bhawan, Raipur</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-6 pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Raipur Smart Connect. All rights reserved. | 
              <a href="#" className="hover:text-foreground transition-colors ml-1">Privacy Policy</a> | 
              <a href="#" className="hover:text-foreground transition-colors ml-1">Terms of Service</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
