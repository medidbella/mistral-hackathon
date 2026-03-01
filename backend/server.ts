import fastify from "fastify";
import type {FastifyReply, FastifyRequest} from "fastify";
import sqlite from "better-sqlite3";
import { readFileSync } from "node:fs";
import {
    initializeDatabaseTable, storeApproval,
    getUserStatus, type UserStatusResult
} from "./db.js"
import { getSystemPrompt, type AIresponse } from "./ai.js";

const server = fastify();

const db = new sqlite('data.db')

initializeDatabaseTable(db)

db.pragma('journal_mode = WAL');

const accessRequestSchema = {
    body: {
        type: "object",
        required: ["userUuid", "site", "url", "excuse", "timestamp"],
        Properties: {
            userUuid: {type: "string", minLength: 1},
            site: {type: "string", minLength: 1},
            url: {type: "string", minLength: 2},
            excuse: {type: "string", minlength: 1},
            timestamp: {type: "string", minlength: 1}
        }
    },
	additionalProperties: false
}


server.listen({ port: 3000 }, (err, addr) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${addr}`);
});

export async function extensionEndpointHandler(req:FastifyRequest, res:FastifyReply)
{
    const {userUuid, site, url, excuse, timestamp} = req.body as
		{userUuid:string, site:string, url:string, excuse:string, timestamp:string}
    const userData: UserStatusResult = getUserStatus(db, userUuid)
    console.log("Received access request:", {userUuid, site, url, excuse, timestamp})
    console.log("User data:", userData)
    // to do: pass user data and request details to ai and get response
    const finalPrompt = getSystemPrompt(userData.approvals_today, userData.total_duration)
    console.log(`Final prompt for ${userUuid}:`, finalPrompt);
}

server.post("/api/request-access", {schema: accessRequestSchema}, extensionEndpointHandler)