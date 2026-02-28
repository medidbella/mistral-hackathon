import fastify from "fastify";
import sqlite from "better-sqlite3";
import {initializeDatabaseTable, storeApproval, getUserStatus} from "./db.js"
const db = new sqlite('data.db')

db.pragma('journal_mode = WAL');

const server = fastify();

initializeDatabaseTable(db)

server.listen({ port: 3000 }, (err, addr) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${addr}`);
});

