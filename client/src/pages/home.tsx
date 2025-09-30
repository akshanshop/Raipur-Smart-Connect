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
        <section className="mb-12">
          <div className="relative rounded-3xl overflow-hidden hero-gradient p-12 text-white pattern-overlay cool-shadow bg-[#eebd2b]">
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h2 className="text-5xl font-bold mb-4 text-gradient">Welcome to Raipur Smart Connect</h2>
                <p className="text-xl opacity-95 mb-8 max-w-2xl mx-auto">Your unified platform for civic engagement and community problem-solving with AI-powered assistance</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    className="modern-button px-8 py-3 bg-white text-primary rounded-xl font-semibold hover:bg-opacity-90 transition-all"
                    onClick={() => {
                      const chatbot = document.querySelector('.lg\\:col-span-1') as HTMLElement;
                      if (chatbot) {
                        window.scrollTo({ top: chatbot.offsetTop - 100, behavior: 'smooth' });
                      }
                    }}
                    data-testid="button-ask-ai"
                  >
                    <i className="fas fa-robot mr-2"></i>
                    Ask AI Assistant
                  </button>
                  <button 
                    className="modern-button px-8 py-3 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-primary transition-all"
                    onClick={() => {
                      const element = document.querySelector('#complaint-form') as HTMLElement;
                      if (element) {
                        window.scrollTo({ top: element.offsetTop - 100, behavior: 'smooth' });
                      }
                    }}
                    data-testid="button-register-complaint"
                  >
                    <i className="fas fa-plus-circle mr-2"></i>
                    Register Complaint
                  </button>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="glass-effect rounded-2xl p-6 text-center floating-card">
                  <div className="text-4xl font-bold mb-2" data-testid="text-active-issues">
                    {cityStats?.totalComplaints - cityStats?.resolvedComplaints || 0}
                  </div>
                  <div className="text-sm opacity-90">Active Issues</div>
                  <div className="w-full h-1 bg-white bg-opacity-30 rounded mt-3">
                    <div className="h-full bg-white rounded w-3/4"></div>
                  </div>
                </div>
                <div className="glass-effect rounded-2xl p-6 text-center floating-card">
                  <div className="text-4xl font-bold mb-2 text-green-300" data-testid="text-resolved-issues">
                    {cityStats?.resolvedComplaints || 0}
                  </div>
                  <div className="text-sm opacity-90">Resolved</div>
                  <div className="w-full h-1 bg-white bg-opacity-30 rounded mt-3">
                    <div className="h-full bg-green-300 rounded w-4/5"></div>
                  </div>
                </div>
                <div className="glass-effect rounded-2xl p-6 text-center floating-card pulse-glow">
                  <div className="text-4xl font-bold mb-2 text-yellow-300" data-testid="text-community-score">
                    {userStats?.contributionScore || 0}
                  </div>
                  <div className="text-sm opacity-90">Community Score</div>
                  <div className="w-full h-1 bg-white bg-opacity-30 rounded mt-3">
                    <div className="h-full bg-yellow-300 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="glass-effect rounded-2xl p-6 text-center floating-card">
                  <div className="text-4xl font-bold mb-2 text-blue-300" data-testid="text-response-time">
                    {cityStats?.averageResponseTime || "N/A"}
                  </div>
                  <div className="text-sm opacity-90">Avg Response</div>
                  <div className="w-full h-1 bg-white bg-opacity-30 rounded mt-3">
                    <div className="h-full bg-blue-300 rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Chatbot & Quick Actions */}
          <div className="lg:col-span-1 space-y-8">
            <div className="floating-card">
              <Chatbot />
            </div>
            
            {/* Quick Actions */}
            <Card className="floating-card neon-border">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gradient mb-6 text-center">Quick Actions</h3>
                <div className="space-y-4">
                  <Button 
                    className="w-full h-16 modern-button bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-between rounded-[2rem] text-lg font-semibold"
                    onClick={() => {
                      const element = document.querySelector('#complaint-form') as HTMLElement;
                      if (element) {
                        window.scrollTo({ top: element.offsetTop, behavior: 'smooth' });
                      }
                    }}
                    data-testid="button-new-complaint"
                  >
                    <span className="flex items-center">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-[1.5rem] flex items-center justify-center mr-4">
                        <i className="fas fa-plus-circle text-xl"></i>
                      </div>
                      Register New Complaint
                    </span>
                    <i className="fas fa-arrow-right text-xl"></i>
                  </Button>
                  
                  <Button 
                    variant="secondary"
                    className="w-full h-16 modern-button flex items-center justify-between rounded-[2rem] text-lg font-semibold"
                    onClick={() => window.location.href = '/complaints'}
                    data-testid="button-check-status"
                  >
                    <span className="flex items-center">
                      <div className="w-12 h-12 bg-primary bg-opacity-20 rounded-[1.5rem] flex items-center justify-center mr-4">
                        <i className="fas fa-search text-xl text-primary"></i>
                      </div>
                      Check Complaint Status
                    </span>
                    <i className="fas fa-arrow-right text-xl"></i>
                  </Button>
                  
                  <Button 
                    className="w-full h-16 modern-button bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 flex items-center justify-between rounded-[2rem] text-lg font-semibold"
                    data-testid="button-emergency"
                  >
                    <span className="flex items-center">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-[1.5rem] flex items-center justify-center mr-4 pulse-glow">
                        <i className="fas fa-exclamation-triangle text-xl"></i>
                      </div>
                      Emergency Alert
                    </span>
                    <i className="fas fa-arrow-right text-xl"></i>
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
