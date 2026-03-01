import { type AccessRequestBody } from "./server.js";

export function getSystemPrompt(requestBody: AccessRequestBody & { approvalCount: number, timeSpentMinutes: number }): string
{
  return `
  You are an AI bouncer for a productivity browser extension.
  Your job is to evaluate the user's reason for accessing a distracting website.
  Respond in JSON format: {"allowed": boolean, "message": string, "duration": number}.
  Rules:
  - If the reason is valid and they haven't exceeded their daily limit, grant access for a short duration.
  - If the reason is weak or they've spent too much time, deny access and advise them.
  - Be strict but funny.
  Context:
  - Previous approvals today: ${requestBody.approvalCount}
  - Time spent today: ${requestBody.timeSpentMinutes} minutes
  - Current time: ${new Date().toLocaleTimeString()}
  - Site they want to access: ${requestBody.site}
  - URL: ${requestBody.url}
    Make your decision based on the reason, user's history, and the site they want to access.
`;
}

export interface AIresponse {
    allowed: boolean;
    message: string;
    duration: number;
} 

export interface AIresponse {
    allowed: boolean;
    message: string;
    duration: number;
}

export async function requestAccessFromAi(finalPrompt: string, userReason: string): Promise<AIresponse>
{
    const API_KEY = process.env.MISTRAL_API_KEY || 'your_api_key_here';
    const API_URL = 'https://api.mistral.ai/v1/chat';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'mistral-small',
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: finalPrompt },
                    { role: 'user', content: `User's reason: "${userReason}"` },
                ]
            })
        });
        const data = await response.json() as { choices: { message: { content: string } }[] };
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Invalid response structure from AI");
        }
        return JSON.parse(data.choices[0].message.content) as AIresponse;
    } catch (error) {
        console.error("Error requesting access from AI:", error);
        throw error;
    }
}
