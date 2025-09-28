import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  type?: 'user' | 'bot' | 'service';
}

interface ServiceResponse {
  message: string;
  type: 'info' | 'success' | 'error';
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

const civicServices = [
  {
    id: 'bill-inquiry',
    name: 'Bill Inquiry',
    description: 'Check your utility bills',
    icon: '💧',
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  {
    id: 'bus-schedule',
    name: 'Bus Schedule',
    description: 'Real-time bus information',
    icon: '🚌',
    color: 'bg-green-100 text-green-700 border-green-200'
  },
  {
    id: 'document-status',
    name: 'Document Status',
    description: 'Check application status',
    icon: '📄',
    color: 'bg-orange-100 text-orange-700 border-orange-200'
  },
  {
    id: 'emergency-contacts',
    name: 'Emergency Services',
    description: 'Important contact numbers',
    icon: '🚨',
    color: 'bg-red-100 text-red-700 border-red-200'
  }
];

export default function EnhancedChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: chatHistory = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/history"],
    retry: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, language }: { message: string; language?: string }) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, language }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
    },
  });

  const sendServiceRequestMutation = useMutation({
    mutationFn: async ({ service, parameters }: { service: string; parameters: any }) => {
      const response = await fetch('/api/chat/civic-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service, parameters }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, chatHistory]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (selectedService) {
      await sendServiceRequestMutation.mutateAsync({
        service: selectedService,
        parameters: { message: inputMessage, language: 'en' }
      });
      setSelectedService(null);
    } else {
      await sendMessageMutation.mutateAsync({
        message: inputMessage,
        language: 'en'
      });
    }

    setInputMessage('');
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setInputMessage(`I need help with ${civicServices.find(s => s.id === serviceId)?.name}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 squircle-container shadow-lg hover:bg-blue-700 transition-all duration-300 z-50"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs squircle-16 px-1.5 py-0.5">
              AI
            </div>
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-white squircle-container shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 squircle-t-container">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Raipur Smart Assistant</h3>
                <p className="text-xs text-blue-100">🇮🇳 Civic AI Helper</p>
              </div>
              <div className="w-2 h-2 bg-green-400 squircle-16"></div>
            </div>
          </div>

          {/* Civic Services Quick Actions */}
          <div className="p-3 bg-gray-50 border-b">
            <p className="text-xs text-gray-600 mb-2">Quick Services:</p>
            <div className="grid grid-cols-2 gap-2">
              {civicServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service.id)}
                  className={`p-2 squircle-16 text-xs border transition-all hover:shadow-sm ${
                    selectedService === service.id 
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : service.color
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{service.icon}</span>
                    <span className="font-medium">{service.name}</span>
                  </div>
                </button>
              ))}
            </div>
            {selectedService && (
              <div className="mt-2 p-2 bg-blue-50 squircle-16 border border-blue-200">
                <p className="text-xs text-blue-700">
                  Selected: {civicServices.find(s => s.id === selectedService)?.description}
                </p>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {isLoading && (
              <div className="text-center text-gray-500 text-sm">Loading chat history...</div>
            )}
            
            {chatHistory.length === 0 && !isLoading && (
              <div className="text-center text-gray-500 text-sm">
                <p>👋 Welcome to Raipur Smart Connect!</p>
                <p className="mt-1">Ask me about civic services, file complaints, or get help with city information.</p>
              </div>
            )}

            {chatHistory.map((msg, index) => (
              <div key={index} className="space-y-2">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white p-2 squircle-16 max-w-xs text-sm">
                    {msg.message}
                  </div>
                </div>
                
                {/* Bot Response */}
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 p-2 squircle-16 max-w-xs text-sm">
                    {msg.response}
                  </div>
                </div>
              </div>
            ))}

            {(sendMessageMutation.isPending || sendServiceRequestMutation.isPending) && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-2 squircle-16 max-w-xs text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 squircle-16 animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 squircle-16 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 squircle-16 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedService ? "Ask about this service..." : "Ask me anything about civic services..."}
                className="flex-1 p-2 border border-gray-300 squircle-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sendMessageMutation.isPending || sendServiceRequestMutation.isPending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || sendMessageMutation.isPending || sendServiceRequestMutation.isPending}
                className="bg-blue-600 text-white p-2 squircle-16 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            
            {selectedService && (
              <button
                onClick={() => setSelectedService(null)}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700"
              >
                ✕ Clear service selection
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}