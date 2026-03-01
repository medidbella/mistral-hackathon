import { type AccessRequestBody } from "./server.js";
import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({
    apiKey: process.env.API_KEY || '',
});

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

export async function requestAccessFromAi(finalPrompt: string, userReason: string): Promise<AIresponse>
{
    try {
        const result = await mistral.chat.complete({
            model: 'mistral-small-latest',
            responseFormat: { type: 'json_object' },
            temperature: 0.2,
            maxTokens: 100,
            messages: [
                { role: 'system', content: finalPrompt },
                { role: 'user', content: `User's reason: "${userReason}"` },
            ],
        });

        const content = result.choices?.[0]?.message?.content;
        if (!content || typeof content !== 'string') {
            throw new Error('AI returned an empty or invalid response');
        }
        console.log('AI response received successfully');
        return JSON.parse(content) as AIresponse;
    } catch (error:any) {
        if ('statusCode' in error) {
            console.error(`Mistral API error (${error.statusCode}): ${error.message}`);
            console.error('Response body:', error.body);
        } else if (error instanceof Error) {
            console.error('Error requesting access from AI:', error.message);
        } else {
            console.error('Unexpected error requesting access from AI:', error);
        }
        throw error;
    }
}
