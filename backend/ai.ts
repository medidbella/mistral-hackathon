import { type AccessRequestBody } from "./server.js";
import { Mistral } from "@mistralai/mistralai";
import { readFileSync } from "fs";

const mistral = new Mistral({
    apiKey: process.env.API_KEY || '',
});

const systemPromptTemplate = readFileSync('./system_prompt.txt', 'utf-8')


export function getSystemPrompt(requestBody: AccessRequestBody & { approvalCount: number, timeSpentMinutes: number }): string
{
  return systemPromptTemplate
    .replace('{{approvalCount}}', String(requestBody.approvalCount))
    .replace('{{timeSpentMinutes}}', String(requestBody.timeSpentMinutes))
    .replace('{{currentTime}}', new Date().toLocaleTimeString())
    .replace('{{site}}', requestBody.site)
    .replace('{{url}}', requestBody.url);
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
