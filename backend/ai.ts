
export function getSystemPrompt(approvalCount: number, timeSpentMinutes: number): string
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
  - Previous approvals today: ${approvalCount}
  - Time spent today: ${timeSpentMinutes} minutes
  - Current time: ${new Date().toLocaleTimeString()}
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

export async function requestAccessFromAi(finalPrompt: string): Promise<AIresponse>
{
    return {
        allowed: true,
        message: "Access approved based on user history and request details.",
        duration: 30 // minutes
    }
}