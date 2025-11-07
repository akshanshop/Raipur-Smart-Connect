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

// Fallback knowledge base for when AI is unavailable
const fallbackResponses = {
  en: {
    greeting: [
      "Hello! I'm your Raipur Smart Connect assistant. I can help you with civic services, complaints, bills, and more. What can I assist you with today?",
      "Welcome to Raipur Smart Connect! I'm here to help you with city services, tracking complaints, checking bills, and answering your questions.",
      "Hi there! I'm your civic assistant for Raipur. Feel free to ask me about water bills, bus schedules, tax deadlines, or filing complaints!"
    ],
    water: [
      "For water bill inquiries, you can check your account online through the Water Services portal. Bills are generated monthly and due by the 15th of each month. You can pay online, at authorized banks, or at the municipal office. Average consumption in Raipur is 150-200 liters per day per person.",
      "Water supply in Raipur operates 24/7 in most areas. If you're experiencing disruptions, please report them through our complaint system. You can also check your water bill status online using your consumer number. Payment options include online banking, UPI, and cash at collection centers.",
      "To manage your water services: Check bills online with your consumer ID, pay through our website or app, report leaks or supply issues via the complaint form, or contact the Water Department at 1-800-WATER. Regular maintenance is scheduled on Sundays from 2-4 AM."
    ],
    bus: [
      "Raipur city buses operate from 6:00 AM to 10:00 PM daily. Main routes cover all major areas with buses every 15-30 minutes during peak hours. You can track real-time bus locations on our mobile app. Monthly passes are available at ₹500 for students and ₹800 for general public.",
      "Public transport information: Routes 1-5 serve central areas, Routes 6-10 cover suburbs. Peak hours are 7-9 AM and 5-7 PM with increased frequency. Download our app for live bus tracking, route planning, and digital tickets. Senior citizens and students get 50% discount on monthly passes.",
      "Bus schedule: Service starts at 6 AM and ends at 10 PM. Express routes available during rush hours. You can purchase tickets on board, through the app, or at bus stands. AC buses run on major routes with a premium fare. Check our website for detailed route maps and timings."
    ],
    tax: [
      "Property tax deadlines in Raipur: Quarterly payments due March 31, June 30, September 30, and December 31. Pay online to get a 5% early payment discount if paid before the due date. Late payments incur 2% monthly penalty. You can check your tax amount using your property ID on our portal.",
      "Tax payment information: Property tax can be paid online, at municipal offices, or through authorized banks. Annual tax is calculated based on property size and location. Set up auto-debit to never miss a deadline and get additional discounts. For tax certificates and assessments, visit the Revenue Department.",
      "Important tax dates: Annual property tax can be paid in 4 quarterly installments. First-quarter payment gets you 10% discount on total amount. You can view your tax history, download receipts, and make payments through our online portal 24/7. For queries, call the tax helpline during office hours."
    ],
    complaint: [
      "To file a complaint: Go to the Register Complaint section, select the appropriate category (roads, water, garbage, etc.), provide location and description, upload photos if available. You'll receive a unique ticket number to track status. Most complaints are resolved within 3-7 days.",
      "Complaint tracking: Enter your ticket number on the Complaints page to see current status, assigned department, and resolution timeline. You'll get SMS and email updates at each stage. For urgent issues, mark priority as 'High'. You can also add comments or additional photos after filing.",
      "Our complaint system handles: Road damage, water supply issues, garbage collection, street lights, drainage problems, and more. Average resolution time is 5 days. You can track progress in real-time, communicate with officials, and rate the service after resolution. Emergency complaints get immediate attention."
    ],
    emergency: [
      "Emergency contacts: Police - 100, Fire - 101, Ambulance - 102, Women Helpline - 1091, Child Helpline - 1098, Disaster Management - 108. For non-emergency municipal issues, call 311. Keep these numbers saved in your phone for quick access.",
      "In case of emergency: Dial 100 for police, 101 for fire, 102 for medical emergencies. Our Emergency Response Center operates 24/7. For civic emergencies like major water leaks, power outages, or road hazards, use the 'Emergency Alert' feature in our app for immediate response.",
      "Important helpline numbers: Medical emergency - 102, Fire services - 101, Police assistance - 100, Disaster helpline - 108, Municipal services - 311. For urgent civic issues, you can also file a high-priority complaint through our portal which alerts authorities immediately."
    ],
    general: [
      "Raipur Smart Connect offers: Online complaint registration, bill payments (water, tax, electricity), bus schedule tracking, civic service requests, real-time updates, and AI-powered assistance. All services are available 24/7 through our website and mobile app.",
      "Available services: File and track complaints, check and pay bills, view bus schedules, apply for certificates and permits, access emergency contacts, participate in community forums, and get instant answers to civic queries. Download our app for the best experience!",
      "How can I help you today? I can assist with: Checking water or tax bills, providing bus schedules and routes, guiding you through complaint filing, sharing emergency contacts, explaining civic procedures, or answering questions about Raipur city services. Just ask!"
    ],
    document: [
      "Document services: Birth certificates, death certificates, marriage certificates, property documents, and tax certificates can be obtained from the Civil Registry or online. Required: Valid ID proof, application form, and relevant supporting documents. Processing time: 3-7 days for regular, 1-2 days for express service.",
      "To apply for certificates: Visit our Documents section, select certificate type, fill the online form, upload required documents (ID proof, address proof, etc.), pay the application fee, and submit. You'll receive a tracking number. Collect the certificate from the designated office or opt for home delivery.",
      "Available documents: Birth/Death certificates, Marriage registration, Property documents, Tax receipts, No Objection Certificates (NOC), and Trade licenses. Apply online to save time. Most documents are ready within a week. Express processing available for urgent needs with additional fees."
    ],
    default: [
      "I'm here to assist you with Raipur city services! I can help with: water bills and supply, property taxes, bus schedules, filing complaints, emergency contacts, civic documents, and general city information. What would you like to know?",
      "As your civic assistant, I can provide information about: municipal services, bill payments, public transport, complaint tracking, emergency services, document applications, and city facilities. How may I help you today?",
      "Welcome! I can answer questions about: water and electricity services, tax payments and deadlines, bus routes and schedules, filing and tracking complaints, obtaining certificates, emergency procedures, and other civic services in Raipur. What do you need help with?"
    ]
  },
  hi: {
    greeting: [
      "नमस्ते! मैं आपका रायपुर स्मार्ट कनेक्ट सहायक हूं। मैं नागरिक सेवाओं, शिकायतों, बिलों आदि में आपकी मदद कर सकता हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?",
      "रायपुर स्मार्ट कनेक्ट में आपका स्वागत है! मैं शहर की सेवाओं, शिकायत ट्रैकिंग, बिल जांच और आपके सवालों में मदद के लिए यहां हूं।"
    ],
    water: [
      "पानी बिल पूछताछ के लिए, आप वाटर सर्विसेज पोर्टल के माध्यम से अपना खाता ऑनलाइन चेक कर सकते हैं। बिल मासिक रूप से जनरेट होते हैं और प्रत्येक महीने की 15 तारीख तक देय होते हैं।",
      "रायपुर में अधिकांश क्षेत्रों में 24/7 जल आपूर्ति संचालित होती है। यदि आप व्यवधान का अनुभव कर रहे हैं, तो कृपया हमारी शिकायत प्रणाली के माध्यम से रिपोर्ट करें।"
    ],
    bus: [
      "रायपुर शहर की बसें दैनिक रूप से सुबह 6:00 बजे से रात 10:00 बजे तक चलती हैं। मुख्य मार्ग सभी प्रमुख क्षेत्रों को कवर करते हैं।",
      "सार्वजनिक परिवहन जानकारी: मार्ग 1-5 केंद्रीय क्षेत्रों की सेवा करते हैं, मार्ग 6-10 उपनगरों को कवर करते हैं।"
    ],
    tax: [
      "रायपुर में संपत्ति कर की समय सीमा: तिमाही भुगतान 31 मार्च, 30 जून, 30 सितंबर और 31 दिसंबर को देय हैं।",
      "कर भुगतान जानकारी: संपत्ति कर ऑनलाइन, नगरपालिका कार्यालयों या अधिकृत बैंकों के माध्यम से भुगतान किया जा सकता है।"
    ],
    complaint: [
      "शिकायत दर्ज करने के लिए: शिकायत पंजीकरण अनुभाग पर जाएं, उपयुक्त श्रेणी चुनें, स्थान और विवरण प्रदान करें।",
      "शिकायत ट्रैकिंग: वर्तमान स्थिति देखने के लिए शिकायत पृष्ठ पर अपना टिकट नंबर दर्ज करें।"
    ],
    emergency: [
      "आपातकालीन संपर्क: पुलिस - 100, फायर - 101, एम्बुलेंस - 102, महिला हेल्पलाइन - 1091।",
      "आपातकाल की स्थिति में: पुलिस के लिए 100, आग के लिए 101, चिकित्सा आपातकाल के लिए 102 डायल करें।"
    ],
    general: [
      "रायपुर स्मार्ट कनेक्ट प्रदान करता है: ऑनलाइन शिकायत पंजीकरण, बिल भुगतान, बस शेड्यूल ट्रैकिंग और एआई-संचालित सहायता।",
      "उपलब्ध सेवाएं: शिकायतें दर्ज करें और ट्रैक करें, बिल चेक करें और भुगतान करें, बस शेड्यूल देखें।"
    ],
    default: [
      "मैं रायपुर शहर सेवाओं में आपकी सहायता के लिए यहां हूं! मैं मदद कर सकता हूं: पानी बिल, संपत्ति कर, बस शेड्यूल, शिकायतें दर्ज करना।",
      "आपके नागरिक सहायक के रूप में, मैं जानकारी प्रदान कर सकता हूं: नगरपालिका सेवाएं, बिल भुगतान, सार्वजनिक परिवहन।"
    ]
  }
};

// Intelligent response matcher
function getIntelligentFallbackResponse(message: string, language: string = 'en'): ChatbotResponse {
  const lowerMessage = message.toLowerCase();
  const responses = fallbackResponses[language as keyof typeof fallbackResponses] || fallbackResponses.en;
  
  // Keyword matching for different categories
  const categories = {
    greeting: ['hello', 'hi', 'hey', 'namaste', 'नमस्ते', 'नमस्कार', 'start', 'help'],
    water: ['water', 'पानी', 'bill', 'बिल', 'supply', 'पुरवठा', 'leak', 'drinking'],
    bus: ['bus', 'बस', 'transport', 'परिवहन', 'schedule', 'वेळापत्रक', 'route', 'ticket'],
    tax: ['tax', 'कर', 'property', 'मालमत्ता', 'payment', 'भुगतान', 'deadline', 'मुदत'],
    complaint: ['complaint', 'शिकायत', 'तक्रार', 'issue', 'problem', 'समस्या', 'report', 'track'],
    emergency: ['emergency', 'आपातकाल', 'urgent', 'तातडीचे', 'police', 'पोलिस', 'fire', 'ambulance'],
    document: ['certificate', 'प्रमाणपत्र', 'document', 'दस्तऐवज', 'birth', 'marriage', 'death', 'license']
  };
  
  // Find matching category
  let matchedCategory = 'default';
  let maxMatches = 0;
  
  for (const [category, keywords] of Object.entries(categories)) {
    const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      matchedCategory = category;
    }
  }
  
  // Get randomized response from matched category
  const categoryResponses = responses[matchedCategory as keyof typeof responses] || responses.default;
  const randomIndex = Math.floor(Math.random() * categoryResponses.length);
  const selectedResponse = categoryResponses[randomIndex];
  
  return {
    message: selectedResponse,
    type: 'info',
    actions: matchedCategory === 'complaint' ? [{
      label: language === 'hi' ? 'शिकायत दर्ज करें' : language === 'mr' ? 'तक्रार नोंदवा' : 'File Complaint',
      action: 'navigate',
      data: { url: '/#complaint-form' }
    }] : []
  };
}

export async function processChatMessage(
  message: string,
  language: string = 'en',
  userId: string
): Promise<ChatbotResponse> {
  if (!openai) {
    return getIntelligentFallbackResponse(message, language);
  }
  
  try {
    const systemPrompt = `You are a helpful civic assistant for Raipur Smart Connect, a digital platform for civic engagement. 

Your role is to help citizens with:
- Water bill queries and payments
- Tax deadline information
- Bus schedules and public transport
- Complaint status tracking
- General civic information for Raipur city

Language: Respond in ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}

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
    console.error("OpenAI API error, using intelligent fallback:", error);
    return getIntelligentFallbackResponse(message, language);
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
