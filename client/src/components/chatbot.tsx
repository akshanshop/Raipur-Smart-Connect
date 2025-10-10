import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  createdAt: string;
  isUser?: boolean;
}

interface ChatbotResponse {
  message: string;
  type: 'info' | 'action' | 'error';
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

export default function Chatbot() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: chatHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/chat/history"],
    retry: false,
  });

  useEffect(() => {
    if (chatHistory) {
      const formattedMessages: ChatMessage[] = [];
      chatHistory.forEach((chat: any) => {
        formattedMessages.push({
          id: chat.id + '-user',
          message: chat.message,
          response: '',
          createdAt: chat.createdAt,
          isUser: true,
        });
        if (chat.response) {
          formattedMessages.push({
            id: chat.id + '-bot',
            message: chat.response,
            response: '',
            createdAt: chat.createdAt,
            isUser: false,
          });
        }
      });
      setMessages(formattedMessages.reverse());
    }
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; language: string }) => {
      const response = await apiRequest("POST", "/api/chat", data);
      return response.json();
    },
    onSuccess: (response: ChatbotResponse) => {
      const botMessage: ChatMessage = {
        id: Date.now().toString() + '-bot',
        message: response.message,
        response: '',
        createdAt: new Date().toISOString(),
        isUser: false,
      };
      setMessages(prev => [...prev, botMessage]);
      setMessage("");
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
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      message: message,
      response: '',
      createdAt: new Date().toISOString(),
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    
    chatMutation.mutate({
      message: message,
      language: "en" // TODO: Get from language selector
    });
  };

  const handleQuickQuery = (query: string) => {
    const quickQueries: Record<string, { question: string; answer: string }> = {
      'bus-schedule': {
        question: 'What are the bus schedules for today?',
        answer: 'Bus schedules run from 6:00 AM to 10:00 PM daily. Routes 1-5 operate every 15 minutes during peak hours (7-9 AM, 5-7 PM) and every 30 minutes otherwise. Route 6-10 run every 20 minutes throughout the day. You can check real-time updates on our website or mobile app.'
      },
      'tax-deadline': {
        question: 'When are my tax payments due?',
        answer: 'Property tax payments are due quarterly: March 31, June 30, September 30, and December 31. Late payments incur a 2% penalty per month. You can pay online, at city hall, or through authorized banks. Set up auto-pay to never miss a deadline!'
      },
      'water-supply': {
        question: 'Is there any water supply disruption in my area?',
        answer: 'Water supply is currently normal in all areas. Scheduled maintenance occurs on Sundays 2-4 AM. In case of disruptions, we send SMS alerts and post updates on our website. You can also call our 24/7 helpline at 1-800-WATER for real-time information.'
      },
      'complaint-status': {
        question: 'How can I check my complaint status?',
        answer: 'Check your complaint status by: 1) Visiting the Complaints section and entering your complaint ID, 2) Using the mobile app and going to "My Complaints", or 3) Calling our helpline with your complaint number. You\'ll receive updates via email and SMS at each stage.'
      },
      'parking-permit': {
        question: 'How do I apply for a parking permit?',
        answer: 'Apply for a parking permit online through the Permits section. You\'ll need: vehicle registration, proof of residence, and driver\'s license. Processing takes 3-5 business days. Fees are $50/month for residents and $100/month for commercial. Permits are valid for 1 year.'
      },
      'garbage-collection': {
        question: 'What is the garbage collection schedule?',
        answer: 'Garbage collection schedule: General waste (Monday & Thursday), Recyclables (Tuesday), Organic waste (Wednesday & Friday). Collection time is 6-10 AM. Please place bins on curb by 6 AM. Bulk items need advance booking via our app or helpline.'
      },
      'birth-certificate': {
        question: 'How do I get a birth certificate?',
        answer: 'Birth certificates can be obtained from the Civil Registry office or online. Required documents: parents\' ID, hospital birth record, and application form. Fees: $25 for standard processing (7 days) or $50 for express (2 days). Bring originals and copies of all documents.'
      },
      'building-permit': {
        question: 'What do I need for a building permit?',
        answer: 'Building permit requirements: 1) Approved architectural plans, 2) Land ownership documents, 3) NOC from neighbors, 4) Environmental clearance (for large projects), 5) Application fee based on project size. Submit online or at the Building Department. Processing takes 2-4 weeks.'
      },
      'public-wifi': {
        question: 'Where can I access free public WiFi?',
        answer: 'Free public WiFi is available at: All public parks, City Hall, Public libraries, Bus terminals, and designated WiFi zones in commercial areas. Network name: "CityFreeWiFi". No password required. Usage limit: 2 hours per session. For unlimited access, register on our portal.'
      },
      'emergency-contact': {
        question: 'What are the emergency contact numbers?',
        answer: 'Emergency contacts: Police - 911, Fire - 911, Ambulance - 911, Non-emergency police - (555) 123-4567, Water supply issues - 1-800-WATER, Power outage - 1-800-POWER, City Helpline - 311. Save these numbers in your phone for quick access!'
      }
    };

    const queryData = quickQueries[query];
    if (!queryData) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      message: queryData.question,
      response: '',
      createdAt: new Date().toISOString(),
      isUser: true,
    };

    // Add bot response
    const botMessage: ChatMessage = {
      id: Date.now().toString() + '-bot',
      message: queryData.answer,
      response: '',
      createdAt: new Date().toISOString(),
      isUser: false,
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card id="chatbot" className="floating-card glass-modern card-squircle-lg animate-fade-in-up delay-100">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gradient flex items-center">
            <i className="fas fa-robot mr-3 animate-float"></i>
            AI Assistant
          </h3>
          <span className="bg-secondary text-secondary-foreground text-xs px-3 py-1 squircle-full pulse-glow">
            Online
          </span>
        </div>
        
        {/* Chat Messages */}
        <div className="h-64 overflow-y-auto mb-4 space-y-3 bg-gradient-to-b from-muted/30 to-muted/50 squircle-lg p-3 pattern-overlay" data-testid="chat-messages">
          {messages.length === 0 && (
            <div className="flex items-start space-x-2">
              <div className="bg-primary text-primary-foreground squircle-full w-8 h-8 flex items-center justify-center text-sm glow-on-hover">
                <i className="fas fa-robot"></i>
              </div>
              <div className="bg-card squircle-lg p-3 max-w-xs shadow-sm floating-card">
                <p className="text-sm">
                  Hello! I'm your civic assistant. I can help you with water bills, tax deadlines, bus schedules, and more. How can I assist you today?
                </p>
              </div>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start space-x-2 ${msg.isUser ? 'justify-end' : ''}`}>
              {!msg.isUser && (
                <div className="bg-primary text-primary-foreground squircle-full w-8 h-8 flex items-center justify-center text-sm glow-on-hover">
                  <i className="fas fa-robot"></i>
                </div>
              )}
              <div className={`squircle-lg p-3 max-w-xs shadow-sm floating-card transition-all duration-300 ${
                msg.isUser 
                  ? 'bg-primary text-primary-foreground glow-on-hover' 
                  : 'bg-card'
              }`}>
                <p className="text-sm">{msg.message}</p>
              </div>
              {msg.isUser && (
                <div className="bg-muted-foreground text-background squircle-full w-8 h-8 flex items-center justify-center text-sm glow-on-hover">
                  <i className="fas fa-user"></i>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Quick Suggestions */}
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-2">Quick questions:</div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuery('bus-schedule')}
              data-testid="button-quick-bus"
            >
              Bus Schedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuery('tax-deadline')}
              data-testid="button-quick-tax"
            >
              Tax Deadline
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuery('water-supply')}
              data-testid="button-quick-water"
            >
              Water Supply
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuery('complaint-status')}
              data-testid="button-quick-status"
            >
              Complaint Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuery('parking-permit')}
              data-testid="button-quick-parking"
            >
              Parking Permit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuery('garbage-collection')}
              data-testid="button-quick-garbage"
            >
              Garbage Collection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuery('birth-certificate')}
              data-testid="button-quick-birth"
            >
              Birth Certificate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuery('building-permit')}
              data-testid="button-quick-building"
            >
              Building Permit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuery('public-wifi')}
              data-testid="button-quick-wifi"
            >
              Public WiFi
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuery('emergency-contact')}
              data-testid="button-quick-emergency"
            >
              Emergency Contacts
            </Button>
          </div>
        </div>
        
        {/* Chat Input */}
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Type your question here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={chatMutation.isPending}
            data-testid="input-chat-message"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={chatMutation.isPending || !message.trim()}
            data-testid="button-send-message"
          >
            {chatMutation.isPending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
