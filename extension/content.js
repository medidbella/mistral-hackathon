
(function() {
  'use strict';

  // Hide all page content immediately
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

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
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

    // Apply overlay styles
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    `;

    document.body.appendChild(overlay);
    addOverlayStyles();
    attachEventListeners();
  }

  function addOverlayStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      #mindful-access-overlay * {
        box-sizing: border-box;
      }
      
      .mindful-container {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 40px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
      }
      
      .mindful-icon {
        font-size: 64px;
        margin-bottom: 20px;
      }
      
      .mindful-title {
        color: #fff;
        font-size: 32px;
        margin: 0 0 10px 0;
        font-weight: 700;
      }
      
      .mindful-subtitle {
        color: #e94560;
        font-size: 18px;
        margin: 0 0 10px 0;
      }
      
      .mindful-description {
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        line-height: 1.6;
        margin: 0 0 25px 0;
      }
      
      .mindful-form {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      #mindful-excuse {
        width: 100%;
        padding: 15px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        font-size: 16px;
        resize: none;
        transition: border-color 0.3s;
      }
      
      #mindful-excuse:focus {
        outline: none;
        border-color: #e94560;
      }
      
      #mindful-excuse::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      
      #mindful-submit {
        padding: 15px 30px;
        background: linear-gradient(135deg, #e94560, #0f3460);
        border: none;
        border-radius: 12px;
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      #mindful-submit:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(233, 69, 96, 0.3);
      }
      
      #mindful-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      
      .mindful-response {
        margin-top: 20px;
        padding: 20px;
        border-radius: 12px;
        text-align: left;
      }
      
      .mindful-response.success {
        background: rgba(46, 213, 115, 0.2);
        border: 1px solid rgba(46, 213, 115, 0.5);
      }
      
      .mindful-response.denied {
        background: rgba(233, 69, 96, 0.2);
        border: 1px solid rgba(233, 69, 96, 0.5);
      }
      
      .mindful-response p {
        color: #fff;
        margin: 0;
        line-height: 1.6;
      }
      
      .mindful-response .duration {
        margin-top: 10px;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
      }
      
      .hidden {
        display: none !important;
      }
      
      .mindful-loading {
        margin-top: 20px;
        color: rgba(255, 255, 255, 0.7);
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.2);
        border-top-color: #e94560;
        border-radius: 50%;
        margin: 0 auto 10px;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
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

  function allowAccess(durationMinutes) {
    // Remove the hiding styles
    const hideStyle = document.getElementById('mindful-access-hide');
    if (hideStyle) hideStyle.remove();

    // Remove the overlay
    const overlay = document.getElementById('mindful-access-overlay');
    if (overlay) overlay.remove();

    // Store the access grant with expiry
    const expiryTime = Date.now() + (durationMinutes * 60 * 1000);
    chrome.storage.local.set({
      [`access_${window.location.hostname}`]: expiryTime
    });
  }

  // Check if user already has valid access
  async function checkExistingAccess() {
    try {
      const result = await chrome.storage.local.get(`access_${window.location.hostname}`);
      const expiryTime = result[`access_${window.location.hostname}`];
      
      if (expiryTime && Date.now() < expiryTime) {
        // User still has valid access
        allowAccess(0); // Don't add more time
        return true;
      }
    } catch (error) {
      console.error('Error checking access:', error);
    }
    return false;
  }

  // Check existing access on load
  checkExistingAccess();
})();
