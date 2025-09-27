import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <i className="fas fa-city mr-4"></i>
            Raipur Smart Connect
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Your unified platform for civic engagement and community problem-solving
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-white text-primary hover:bg-gray-100"
            data-testid="button-login"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Get Started
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center text-white">
              <i className="fas fa-robot text-4xl mb-4 text-accent"></i>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Assistant</h3>
              <p className="opacity-90">
                Get instant help with water bills, tax deadlines, bus schedules, and more through our multilingual chatbot.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center text-white">
              <i className="fas fa-file-alt text-4xl mb-4 text-accent"></i>
              <h3 className="text-xl font-semibold mb-2">Smart Complaint System</h3>
              <p className="opacity-90">
                Register complaints with photos, GPS location, and track real-time status updates with unique ticket IDs.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center text-white">
              <i className="fas fa-users text-4xl mb-4 text-accent"></i>
              <h3 className="text-xl font-semibold mb-2">Community Collaboration</h3>
              <p className="opacity-90">
                Upvote community issues, collaborate on solutions, and help prioritize city-wide problems together.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center text-white">
          <h2 className="text-3xl font-bold mb-8">Empowering Citizens Through Technology</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent">24/7</div>
              <div className="text-sm opacity-90">AI Support</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent">Real-time</div>
              <div className="text-sm opacity-90">Tracking</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent">Multi-language</div>
              <div className="text-sm opacity-90">Support</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent">Community</div>
              <div className="text-sm opacity-90">Driven</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
