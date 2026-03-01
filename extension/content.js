
(function() {
  'use strict';

  if (window !== window.top) {
    return;
  }

  if (!window.location.href.startsWith('http')) {
    return;
  }

  // Check if user already has valid access BEFORE hiding content
  const storageKey = `access_${window.location.hostname}`;

  chrome.storage.local.get(storageKey).then((result) => {
    const expiryTime = result[storageKey];

    if (expiryTime && Date.now() < expiryTime) {
      // User still has valid access — don't block, just set expiry timer
      const remainingMs = expiryTime - Date.now();
      console.log(`Existing access found. ${Math.round(remainingMs / 1000 / 60)} minutes remaining.`);
      startAccessTimer(remainingMs);
      return; // Don't hide anything
    }

    // No valid access — block the page
    blockPage();
  }).catch(() => {
    // On error, block to be safe
    blockPage();
  });

  function blockPage() {
    const style = document.createElement('style');
    style.id = 'mindful-access-hide';
    style.textContent = `
      body > *:not(#mindful-access-overlay) {
        display: none !important;
      }
      body {
        overflow: hidden !important;
      }
    `;
    document.documentElement.appendChild(style);

    // Pause any media that might be playing
    pauseAllMedia();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  function init() {
    createOverlay();
  }

  function createOverlay() {
    // Check if overlay already exists
    if (document.getElementById('mindful-access-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'mindful-access-overlay';
    overlay.innerHTML = `
      <div class="mindful-container">
        <div class="mindful-icon">🛡️</div>
        <h1 class="mindful-title">Hold on!</h1>
        <p class="mindful-subtitle">You're trying to access <strong>${window.location.hostname}</strong></p>
        <p class="mindful-description">To continue, you need to convince our AI that you have a good reason to access this site right now.</p>
        
        <div class="mindful-form">
          <textarea 
            id="mindful-excuse" 
            placeholder="Why do you need to access this site? Be specific and honest..."
            rows="4"
          ></textarea>
          <button id="mindful-submit" type="button">Request Access</button>
        </div>
        
        <div id="mindful-response" class="mindful-response hidden"></div>
        <div id="mindful-loading" class="mindful-loading hidden">
          <div class="spinner"></div>
          <p>AI is evaluating your request...</p>
        </div>
      </div>
    `;

    // Add styles first, then append overlay
    addOverlayStyles();
    document.body.appendChild(overlay);
    attachEventListeners();
  }

  function addOverlayStyles() {
    // Don't add styles twice
    if (document.getElementById('mindful-access-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'mindful-access-styles';
    styleEl.textContent = `
      #mindful-access-overlay {
        all: initial !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif !important;
      }
      
      #mindful-access-overlay *,
      #mindful-access-overlay *::before,
      #mindful-access-overlay *::after {
        box-sizing: border-box !important;
      }
      
      #mindful-access-overlay .mindful-container {
        background: rgba(255, 255, 255, 0.05) !important;
        backdrop-filter: blur(10px) !important;
        border-radius: 20px !important;
        padding: 40px !important;
        max-width: 500px !important;
        width: 90% !important;
        text-align: center !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3) !important;
      }
      
      #mindful-access-overlay .mindful-icon {
        font-size: 64px !important;
        margin: 0 0 20px 0 !important;
        display: block !important;
        line-height: 1.2 !important;
      }
      
      #mindful-access-overlay .mindful-title {
        color: #fff !important;
        font-size: 32px !important;
        margin: 0 0 10px 0 !important;
        padding: 0 !important;
        font-weight: 700 !important;
        display: block !important;
      }
      
      #mindful-access-overlay .mindful-subtitle {
        color: #e94560 !important;
        font-size: 18px !important;
        margin: 0 0 10px 0 !important;
        padding: 0 !important;
        display: block !important;
      }
      
      #mindful-access-overlay .mindful-description {
        color: rgba(255, 255, 255, 0.7) !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
        margin: 0 0 25px 0 !important;
        padding: 0 !important;
        display: block !important;
      }
      
      #mindful-access-overlay .mindful-form {
        display: flex !important;
        flex-direction: column !important;
        gap: 15px !important;
      }
      
      #mindful-access-overlay #mindful-excuse {
        width: 100% !important;
        padding: 15px !important;
        border: 2px solid rgba(255, 255, 255, 0.2) !important;
        border-radius: 12px !important;
        background: rgba(255, 255, 255, 0.1) !important;
        color: #fff !important;
        font-size: 16px !important;
        font-family: inherit !important;
        resize: none !important;
        transition: border-color 0.3s !important;
        min-height: 100px !important;
        margin: 0 !important;
      }
      
      #mindful-access-overlay #mindful-excuse:focus {
        outline: none !important;
        border-color: #e94560 !important;
      }
      
      #mindful-access-overlay #mindful-excuse::placeholder {
        color: rgba(255, 255, 255, 0.5) !important;
      }
      
      #mindful-access-overlay #mindful-submit {
        padding: 15px 30px !important;
        margin: 0 !important;
        background: linear-gradient(135deg, #e94560, #0f3460) !important;
        border: none !important;
        border-radius: 12px !important;
        color: #fff !important;
        font-size: 16px !important;
        font-weight: 600 !important;
        font-family: inherit !important;
        cursor: pointer !important;
        transition: transform 0.2s, box-shadow 0.2s !important;
      }
      
      #mindful-access-overlay #mindful-submit:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 10px 30px rgba(233, 69, 96, 0.3) !important;
      }
      
      #mindful-access-overlay #mindful-submit:disabled {
        opacity: 0.6 !important;
        cursor: not-allowed !important;
        transform: none !important;
      }
      
      #mindful-access-overlay .mindful-response {
        margin: 20px 0 0 0 !important;
        padding: 20px !important;
        border-radius: 12px !important;
        text-align: left !important;
      }
      
      #mindful-access-overlay .mindful-response.success {
        background: rgba(46, 213, 115, 0.2) !important;
        border: 1px solid rgba(46, 213, 115, 0.5) !important;
      }
      
      #mindful-access-overlay .mindful-response.denied {
        background: rgba(233, 69, 96, 0.2) !important;
        border: 1px solid rgba(233, 69, 96, 0.5) !important;
      }
      
      #mindful-access-overlay .mindful-response p {
        color: #fff !important;
        margin: 0 !important;
        line-height: 1.6 !important;
        padding: 5px 0 !important;
      }
      
      #mindful-access-overlay .mindful-response .duration {
        margin-top: 10px !important;
        font-size: 14px !important;
        color: rgba(255, 255, 255, 0.7) !important;
      }
      
      #mindful-access-overlay .hidden {
        display: none !important;
      }
      
      #mindful-access-overlay .mindful-loading {
        margin: 20px 0 0 0 !important;
        padding: 0 !important;
        color: rgba(255, 255, 255, 0.7) !important;
        text-align: center !important;
      }
      
      #mindful-access-overlay .mindful-loading p {
        color: rgba(255, 255, 255, 0.7) !important;
        margin: 0 !important;
      }
      
      #mindful-access-overlay .spinner {
        width: 40px !important;
        height: 40px !important;
        border: 3px solid rgba(255, 255, 255, 0.2) !important;
        border-top-color: #e94560 !important;
        border-radius: 50% !important;
        margin: 0 auto 10px auto !important;
        padding: 0 !important;
        animation: mindful-spin 1s linear infinite !important;
      }
      
      @keyframes mindful-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleEl);
  }

  function attachEventListeners() {
    const submitBtn = document.getElementById('mindful-submit');
    const excuseInput = document.getElementById('mindful-excuse');

    submitBtn.addEventListener('click', handleSubmit);
    
    // Allow submit with Ctrl+Enter
    excuseInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit();
      }
    });
  }

  async function handleSubmit() {
    const excuseInput = document.getElementById('mindful-excuse');
    const submitBtn = document.getElementById('mindful-submit');
    const responseDiv = document.getElementById('mindful-response');
    const loadingDiv = document.getElementById('mindful-loading');
    
    const excuse = excuseInput.value.trim();
    
    if (!excuse) {
      excuseInput.style.borderColor = '#e94560';
      excuseInput.placeholder = 'Please enter a reason...';
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    loadingDiv.classList.remove('hidden');
    responseDiv.classList.add('hidden');

    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        type: 'REQUEST_ACCESS',
        payload: {
          excuse: excuse,
          site: window.location.hostname,
          url: window.location.href
        }
      });

      loadingDiv.classList.add('hidden');

      if (response.allowed) {
        // Access granted
        responseDiv.className = 'mindful-response success';
        responseDiv.innerHTML = `
          <p>✅ <strong>Access Granted!</strong></p>
          <p>${response.message}</p>
          <p class="duration">⏱️ You have ${response.duration} minutes. Use them wisely!</p>
        `;
        responseDiv.classList.remove('hidden');

        // Remove overlay and show page after a short delay
        setTimeout(() => {
          allowAccess(response.duration);
        }, 2000);
      } else {
        // Access denied
        responseDiv.className = 'mindful-response denied';
        responseDiv.innerHTML = `
          <p>❌ <strong>Access Denied</strong></p>
          <p>${response.message}</p>
        `;
        responseDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        excuseInput.value = '';
      }
    } catch (error) {
      console.error('Error requesting access:', error);
      loadingDiv.classList.add('hidden');
      responseDiv.className = 'mindful-response denied';
      responseDiv.innerHTML = `
        <p>❌ <strong>Error</strong></p>
        <p>Could not connect to the server. Please make sure the backend is running.</p>
      `;
      responseDiv.classList.remove('hidden');
      submitBtn.disabled = false;
    }
  }

  // Track the active access timer
  let accessTimer = null;

  function allowAccess(durationMinutes) {
    // Remove the hiding styles
    const hideStyle = document.getElementById('mindful-access-hide');
    if (hideStyle) hideStyle.remove();

    // Remove the overlay
    const overlay = document.getElementById('mindful-access-overlay');
    if (overlay) overlay.remove();

    // Clear any existing timer
    if (accessTimer) {
      clearTimeout(accessTimer);
      accessTimer = null;
    }

    // Only set timer and storage if duration > 0 (new access grant)
    if (durationMinutes > 0) {
      const expiryTime = Date.now() + (durationMinutes * 60 * 1000);
      chrome.storage.local.set({
        [`access_${window.location.hostname}`]: expiryTime
      });

      // Set timer to revoke access when time expires
      startAccessTimer(durationMinutes * 60 * 1000);
    }
  }

  function startAccessTimer(milliseconds) {
    // Clear any existing timer
    if (accessTimer) {
      clearTimeout(accessTimer);
    }

    console.log(`Access timer set for ${Math.round(milliseconds / 1000 / 60)} minutes`);

    accessTimer = setTimeout(() => {
      console.log('Access time expired! Blocking page...');
      revokeAccess();
    }, milliseconds);
  }

  function revokeAccess() {
    // Clear the stored access
    chrome.storage.local.remove(`access_${window.location.hostname}`);

    // Pause any media that might be playing
    pauseAllMedia();

    // Re-add the hiding styles
    const existingStyle = document.getElementById('mindful-access-hide');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'mindful-access-hide';
      style.textContent = `
        body > *:not(#mindful-access-overlay) {
          display: none !important;
        }
        body {
          overflow: hidden !important;
        }
      `;
      document.documentElement.appendChild(style);
    }

    // Re-create the overlay
    createOverlay();
  }

  // Pause all video and audio elements on the page
  function pauseAllMedia() {
    document.querySelectorAll('video, audio').forEach(media => {
      try {
        media.pause();
        media.muted = true;
      } catch (e) {
        // Ignore errors from cross-origin iframes
      }
    });
  }

  // Check existing access on load is handled at the top of the script
})();
