import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SpamAnalysisResult {
  isSpam: boolean;
  confidence: number;
  reason: string;
  category: 'legitimate' | 'spam' | 'fake' | 'irrelevant' | 'abusive';
}

export async function detectSpam(
  title: string,
  description: string,
  category: string,
  location: string
): Promise<SpamAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an AI spam detection system for a civic complaint management platform. 
Your job is to analyze complaints and determine if they are:
1. Legitimate civic complaints (infrastructure, public services, safety issues)
2. Spam (promotional content, advertisements, scams)
3. Fake reports (fabricated issues, false information)
4. Irrelevant (not related to civic issues)
5. Abusive (harassment, hate speech, offensive content)

Analyze the following fields and provide a JSON response with:
- isSpam (boolean): true if the complaint should be rejected
- confidence (number 0-1): how confident you are in this assessment
- reason (string): brief explanation for the decision
- category (string): one of 'legitimate', 'spam', 'fake', 'irrelevant', 'abusive'

Context: This is a civic complaint system for city issues like potholes, streetlights, sanitation, etc.`,
        },
        {
          role: "user",
          content: `Analyze this complaint:

Title: ${title}
Description: ${description}
Category: ${category}
Location: ${location}

Is this a legitimate civic complaint or should it be flagged? Respond with JSON only.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const result = JSON.parse(content) as SpamAnalysisResult;

    // Ensure confidence is between 0 and 1
    result.confidence = Math.max(0, Math.min(1, result.confidence || 0));

    console.log(`Spam detection result for "${title}": ${result.isSpam ? 'SPAM' : 'LEGITIMATE'} (${result.confidence} confidence)`);

    return result;
  } catch (error) {
    console.error("Spam detection error:", error);
    // In case of error, default to allowing the complaint
    return {
      isSpam: false,
      confidence: 0,
      reason: "Error during spam detection, allowing complaint by default",
      category: 'legitimate'
    };
  }
}

export async function detectCommunityIssueSpam(
  title: string,
  description: string,
  category: string
): Promise<SpamAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an AI spam detection system for a civic community issue platform. 
Analyze community posts and determine if they are legitimate community issues or spam/fake content.

Provide a JSON response with:
- isSpam (boolean): true if the post should be rejected
- confidence (number 0-1): confidence in this assessment
- reason (string): brief explanation
- category (string): 'legitimate', 'spam', 'fake', 'irrelevant', or 'abusive'`,
        },
        {
          role: "user",
          content: `Analyze this community issue:

Title: ${title}
Description: ${description}
Category: ${category}

Respond with JSON only.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const result = JSON.parse(content) as SpamAnalysisResult;
    result.confidence = Math.max(0, Math.min(1, result.confidence || 0));

    console.log(`Community spam detection result for "${title}": ${result.isSpam ? 'SPAM' : 'LEGITIMATE'} (${result.confidence} confidence)`);

    return result;
  } catch (error) {
    console.error("Community issue spam detection error:", error);
    return {
      isSpam: false,
      confidence: 0,
      reason: "Error during spam detection, allowing post by default",
      category: 'legitimate'
    };
  }
}
