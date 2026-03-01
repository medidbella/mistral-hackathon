import sqlite from 'better-sqlite3';

// Types
export interface UserStats {
    user_uuid: string;
    approvals_today: number;
    total_duration: number; // minutes
    last_upload: string;    // (YYYY-MM-DD)
}

export interface UserStatusResult {
    approvals_today: number;
    total_duration: number; // minutes
}

export function initializeDatabaseTable(db: sqlite.Database): void
{
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_stats (
        user_uuid TEXT PRIMARY KEY,
        approvals_today INTEGER DEFAULT 0,
        total_duration INTEGER DEFAULT 0,
        last_upload TEXT
      )
    `);
}

export function storeApproval(db: sqlite.Database, currentDate: string, approvalDuration: number,  userUuid: string)
{
    const existingUser = db.prepare(
        `SELECT * FROM user_stats WHERE user_uuid = ?`
    ).get(userUuid) as UserStats | undefined;
    if (!existingUser) {
        // New user - insert new entry
        db.prepare(`
            INSERT INTO user_stats (user_uuid, approvals_today, total_duration, last_upload)
            VALUES (?, 1, ?, ?)
        `).run(userUuid, approvalDuration, currentDate);
    } else {
        // User exists - check if same day
        const lastUploadDate = existingUser.last_upload;
        
        if (lastUploadDate === currentDate) {
            // Same day - increment values
            db.prepare(`
                UPDATE user_stats 
                SET approvals_today = approvals_today + 1,
                    total_duration = total_duration + ?,
                    last_upload = ?
                WHERE user_uuid = ?
            `).run(approvalDuration, currentDate, userUuid);
        } else {
            // Different day - reset and set to new values
            db.prepare(`
                UPDATE user_stats 
                SET approvals_today = 1,
                    total_duration = ?,
                    last_upload = ?
                WHERE user_uuid = ?
            `).run(approvalDuration, currentDate, userUuid);
        }
    }
}

export function getUserStatus(db: sqlite.Database, userUuid: string): UserStatusResult {
    const user = db.prepare(
        `SELECT approvals_today, total_duration, last_upload FROM user_stats WHERE user_uuid = ?`
    ).get(userUuid) as Pick<UserStats, 'approvals_today' | 'total_duration' | 'last_upload'> | undefined;

    if (!user) {
        return {
            approvals_today: 0,
            total_duration: 0
        };
    }

    const today = new Date().toISOString().split('T')[0];
    
    if (user.last_upload !== today) {
        return {
            approvals_today: 0,
            total_duration: 0
        };
    }

    return {
        approvals_today: user.approvals_today,
        total_duration: user.total_duration
    };
}