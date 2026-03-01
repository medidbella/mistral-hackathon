import fastify from "fastify";
import type {FastifyReply, FastifyRequest} from "fastify";
import sqlite from "better-sqlite3";
import {
    initializeDatabaseTable, storeApproval,
    getUserStatus, type UserStatusResult
} from "./db.js"
import {
    getSystemPrompt, requestAccessFromAi,
    type AIresponse
} from "./ai.js";

const server = fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname'
            }
        }
    }
});

const db = new sqlite('data.db')

initializeDatabaseTable(db)

db.pragma('journal_mode = WAL');

const accessRequestSchema = {
    body: {
        type: "object",
        required: ["userUuid", "site", "url", "excuse", "timestamp"],
        properties: {
            userUuid: {type: "string", minLength: 1},
            site: {type: "string", minLength: 1},
            url: {type: "string", minLength: 2},
            excuse: {type: "string", minLength: 1},
            timestamp: {type: "string", minLength: 1}
        }
    },
	additionalProperties: false
}

export interface AccessRequestBody {
    userUuid: string;
    site: string;
    url: string;
    excuse: string;
    timestamp: string;
}

server.listen({ port: 3000 }, (err, addr) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${addr}`);
});

export async function extensionEndpointHandler(req:FastifyRequest, res:FastifyReply) // not tested yet, might have some issues
{
    const {userUuid, site, url, excuse, timestamp} = req.body as AccessRequestBody
    const userData: UserStatusResult = getUserStatus(db, userUuid)
    console.log("Received access request:", {userUuid, site, url, excuse, timestamp})
    console.log("User data:", userData)
        const finalPrompt = getSystemPrompt({
        approvalCount: userData.approvals_today,
        timeSpentMinutes: userData.total_duration,
        ...req.body as AccessRequestBody
    });
    console.log(`Final prompt for ${userUuid}:`, finalPrompt);
    let aiResponse: AIresponse;
    try {
        aiResponse = await requestAccessFromAi(finalPrompt, excuse)
    }
    catch (error) {
        console.error("Error communicating with AI:", error)
        res.status(500).send({error: "AI communication failed"})
        return;
    }
    console.log(`AI response for ${userUuid}:`, aiResponse);
    if (aiResponse.allowed) {
        storeApproval(db, new Date().toISOString().split('T')[0]!, aiResponse.duration, userUuid)
    }
    res.send(aiResponse)
}

export function extensionEndpointHandlerMock(req:FastifyRequest, res:FastifyReply)
{
    const {userUuid, site, url, excuse, timestamp} = req.body as AccessRequestBody
    console.log("Received access request:", {userUuid, site, url, excuse, timestamp})
    const userData: UserStatusResult = getUserStatus(db, userUuid)
    console.log("User data:", userData)
    const mockResponse: AIresponse = Math.random() > 0.5 ? {
        allowed: true,
        message: "Access granted for 1 minutes. Remember to stay productive!",
        duration: 1
    }
    : {
    allowed: false,
        message: "that's not a valid excuse go back to work !",
        duration: 0
    }
    if (mockResponse.allowed) {
        storeApproval(db, new Date().toISOString().split('T')[0]!, mockResponse.duration, userUuid)
    }
    res.send(mockResponse)
}

server.post("/api/request-access", {schema: accessRequestSchema}, extensionEndpointHandlerMock)