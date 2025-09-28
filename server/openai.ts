import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export interface ChatbotResponse {
  message: string;
  type: 'info' | 'action' | 'error';
  actions?: {
    label: string;
    action: string;
    data?: any;
  }[];
}

export async function processChatMessage(
  message: string,
  language: string = 'en',
  userId: string
): Promise<ChatbotResponse> {
  if (!openai) {
    const fallbackMessage = language === 'hi' 
      ? "माफ करें, AI सहायक उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।"
      : language === 'mr'
      ? "माफ करा, AI सहाय्यक उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा."
      : "AI assistant is not available. Please try again later.";
    
    return {
      message: fallbackMessage,
      type: 'error'
    };
  }
  
  try {
    const systemPrompt = `You are a helpful civic assistant for Raipur Smart Connect, a digital platform for civic engagement. 

Your role is to help citizens with:
- Water bill queries and payments
- Tax deadline information
- Bus schedules and public transport
- Complaint status tracking
- General civic information for Raipur city

Language: Respond in ${language === 'hi' ? 'Hindi (हिंदी)' : language === 'mr' ? 'Marathi (मराठी)' : 'English'}

Response Format: Provide a JSON response with:
- message: Your helpful response
- type: "info" for information, "action" for actionable items, "error" for issues
- actions: Array of suggested actions with label, action, and optional data

For queries about:
- Water bills: Suggest checking account or payment options
- Tax deadlines: Provide relevant dates and payment links
- Bus schedules: Give route information
- Complaint status: Ask for ticket number
- New complaints: Guide to complaint form

Keep responses concise, helpful, and localized for Raipur city services.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      message: result.message || "I'm here to help with your civic queries!",
      type: result.type || 'info',
      actions: result.actions || []
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Fallback response based on language
    const fallbackMessage = language === 'hi' 
      ? "माफ करें, मैं अभी आपकी सहायता नहीं कर सकता। कृपया बाद में पुनः प्रयास करें।"
      : language === 'mr'
      ? "माफ करा, मी सध्या आपली मदत करू शकत नाही. कृपया नंतर पुन्हा प्रयत्न करा."
      : "Sorry, I'm unable to assist right now. Please try again later.";
    
    return {
      message: fallbackMessage,
      type: 'error'
    };
  }
}

export async function generateComplaintSummary(
  description: string,
  category: string,
  location: string
): Promise<string> {
  if (!openai) {
    return `${category} Issue - ${location}`;
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Generate a concise title for a civic complaint based on the description, category, and location. Keep it under 60 characters and make it descriptive."
        },
        {
          role: "user",
          content: `Category: ${category}\nLocation: ${location}\nDescription: ${description}`
        }
      ],
    });

    return response.choices[0].message.content || "Civic Issue Report";
  } catch (error) {
    console.error("Error generating complaint summary:", error);
    return `${category} Issue - ${location}`;
  }
}
