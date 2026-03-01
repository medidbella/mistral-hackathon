
const BACKEND_BASE_URL = 'http://localhost:3000';

// Generate a unique user ID
function generateUserId() {
  return crypto.randomUUID();
}

// Get or create user ID
async function getUserId() {
  const result = await chrome.storage.local.get('userId');
  
  if (result.userId)
    return result.userId;

  const newUserId = generateUserId();
  await chrome.storage.local.set({ userId: newUserId });
  return newUserId;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_ACCESS') {
    handleAccessRequest(message.payload)
      .then(sendResponse)
      .catch(error => {
        console.error('Error handling access request:', error);
        sendResponse({
          allowed: false,
          message: 'An error occurred while processing your request. Please try again.',
          duration: 0
        });
      });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

// Handle access request - send to backend
async function handleAccessRequest(payload) {
  const userId = await getUserId();
  
  const requestBody = {
    userUuid: userId,
    site: payload.site,
    url: payload.url,
    excuse: payload.excuse,
    timestamp: new Date().toISOString()
  };

  console.log('Sending access request:', requestBody);

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/request-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response:', data);

    return {
      allowed: data.allowed,
      message: data.message,
      duration: data.duration || 0
    };
  } catch (error) {
    console.error('Failed to fetch from backend:', error);
    throw error;
  }
}

// Clean up expired access entries periodically
chrome.alarms.create('cleanupExpiredAccess', { periodInMinutes: 5 });

// Badge countdown — updates every minute
chrome.alarms.create('badgeCountdown', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanupExpiredAccess') {
    cleanupExpiredAccess();
  }
  if (alarm.name === 'badgeCountdown') {
    updateBadgeCountdown();
  }
});

async function cleanupExpiredAccess() {
  const storage = await chrome.storage.local.get(null);
  const now = Date.now();
  const keysToRemove = [];

  for (const [key, value] of Object.entries(storage)) {
    if (key.startsWith('access_') && typeof value === 'number' && value < now) {
      keysToRemove.push(key);
    }
  }

  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
    console.log('Cleaned up expired access entries:', keysToRemove);
  }
}

// Initialize user ID on extension install
chrome.runtime.onInstalled.addListener(async () => {
  const userId = await getUserId();
  console.log('Mindful Access extension installed. User ID:', userId);
});

// ── Badge Countdown ──────────────────────────────────────────────────

let badgeInterval = null;

async function updateBadgeCountdown() {
  const storage = await chrome.storage.local.get(null);
  const now = Date.now();

  // Find the active access token with the most remaining time
  let maxRemainingMs = 0;

  for (const [key, value] of Object.entries(storage)) {
    if (key.startsWith('access_') && typeof value === 'number') {
      const remaining = value - now;
      if (remaining > maxRemainingMs) {
        maxRemainingMs = remaining;
      }
    }
  }

  if (maxRemainingMs > 0) {
    const totalSeconds = Math.ceil(maxRemainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Show MM:SS when under 1 minute, otherwise Xm
    let text;
    if (minutes < 1) {
      text = `${seconds}s`;
    } else {
      text = `${minutes}m`;
    }

    // Color shifts: green → orange → red as time drops
    let color;
    if (minutes >= 5) {
      color = '#2ed573'; // green — plenty of time
    } else if (minutes >= 2) {
      color = '#ffa502'; // orange — getting low
    } else {
      color = '#e94560'; // red — critical
    }

    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color });

    // Keep the per-second interval alive while access is active
    ensureBadgeInterval();
  } else {
    await chrome.action.setBadgeText({ text: '' });
    stopBadgeInterval();
  }
}

function ensureBadgeInterval() {
  if (badgeInterval) return;
  badgeInterval = setInterval(() => {
    updateBadgeCountdown();
  }, 1000);
}

function stopBadgeInterval() {
  if (badgeInterval) {
    clearInterval(badgeInterval);
    badgeInterval = null;
  }
}

// Also update badge immediately when storage changes (e.g., new access granted)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    const hasAccessChange = Object.keys(changes).some(key => key.startsWith('access_'));
    if (hasAccessChange) {
      updateBadgeCountdown();
    }
  }
});

// Run once on startup to set the badge if there's an active session
updateBadgeCountdown();
