
const BACKEND_BASE_URL = 'http://localhost:3000';

// Generate a unique user ID
function generateUserId() {
  return 'user_' + crypto.randomUUID();
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

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanupExpiredAccess') {
    cleanupExpiredAccess();
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
