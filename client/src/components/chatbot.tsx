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

  const { data: chatHistory } = useQuery({
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
    const quickQueries: Record<string, string> = {
      'bus-schedule': 'What are the bus schedules for today?',
      'tax-deadline': 'When are my tax payments due?',
      'water-supply': 'Is there any water supply disruption in my area?',
      'complaint-status': 'How can I check my complaint status?'
    };

    const queryText = quickQueries[query] || query;
    setMessage(queryText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card id="chatbot">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            <i className="fas fa-robot text-primary mr-2"></i>
            AI Assistant
          </h3>
          <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
            Online
          </span>
        </div>
        
        {/* Chat Messages */}
        <div className="h-64 overflow-y-auto mb-4 space-y-3 bg-muted rounded-lg p-3" data-testid="chat-messages">
          {messages.length === 0 && (
            <div className="flex items-start space-x-2">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">
                <i className="fas fa-robot"></i>
              </div>
              <div className="bg-card rounded-lg p-3 max-w-xs shadow-sm">
                <p className="text-sm">
                  Hello! I'm your civic assistant. I can help you with water bills, tax deadlines, bus schedules, and more. How can I assist you today?
                </p>
              </div>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start space-x-2 ${msg.isUser ? 'justify-end' : ''}`}>
              {!msg.isUser && (
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  <i className="fas fa-robot"></i>
                </div>
              )}
              <div className={`rounded-lg p-3 max-w-xs shadow-sm ${
                msg.isUser 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card'
              }`}>
                <p className="text-sm">{msg.message}</p>
              </div>
              {msg.isUser && (
                <div className="bg-muted-foreground text-background rounded-full w-8 h-8 flex items-center justify-center text-sm">
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
