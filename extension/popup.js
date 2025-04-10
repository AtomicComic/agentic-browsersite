// Extension configuration
const API_BASE_URL = 'https://agenticbrowser.com'; // Replace with your actual website URL

// DOM elements
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const buyCreditsButton = document.getElementById('buy-credits-button');
const dashboardButton = document.getElementById('dashboard-button');
const promptInput = document.getElementById('prompt-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');
const userEmail = document.getElementById('user-email');
const creditsDisplay = document.getElementById('credits-display');
const creditsCount = document.getElementById('credits-count');
const loggedOutView = document.getElementById('logged-out-view');
const loggedInView = document.getElementById('logged-in-view');

// Check authentication state on popup open
document.addEventListener('DOMContentLoaded', async () => {
  const storage = await chrome.storage.local.get(['openRouterApiKey', 'userInfo', 'lastUpdated']);

  if (!storage.openRouterApiKey || !storage.userInfo) {
    showLoggedOutView();
    return;
  }

  // If data is older than 5 minutes, refresh it
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  if (!storage.lastUpdated || Date.now() - storage.lastUpdated > REFRESH_INTERVAL) {
    const isValid = await checkAuthAndFetchData();
    if (!isValid) {
      showLoggedOutView();
      return;
    }
  }

  // Get latest storage data
  const latestStorage = await chrome.storage.local.get(['userInfo', 'credits', 'subscription']);
  showLoggedInView(latestStorage.userInfo, latestStorage.credits, latestStorage.subscription);
});

// Check if user is authenticated and update UI accordingly
function checkAuthState() {
  chrome.storage.local.get(['openRouterApiKey', 'userInfo', 'credits'], (result) => {
    if (result.openRouterApiKey && result.userInfo) {
      // User is logged in
      showLoggedInView(result.userInfo, result.credits);
    } else {
      // User is logged out
      showLoggedOutView();
    }
  });
}

// Show the logged-in view with user info
function showLoggedInView(userInfo, credits, subscription) {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('logged-in-view').style.display = 'block';

  // Update UI with user info
  document.getElementById('user-email').textContent = userInfo.email;
  document.getElementById('credits').textContent = credits;

  // Show subscription status if active
  if (subscription?.status === 'active') {
    document.getElementById('subscription-status').textContent =
      `Active ${subscription.plan} subscription`;
  }
}

// Show the logged-out view
function showLoggedOutView() {
  document.getElementById('login-view').style.display = 'block';
  document.getElementById('logged-in-view').style.display = 'none';
}

// Open login window
function openLoginWindow() {
  const width = 500;
  const height = 600;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;

  // Get the extension ID to pass to the login page
  const extensionId = chrome.runtime.id;

  chrome.windows.create({
    url: `https://agenticbrowser.com/login?source=extension&extensionId=${extensionId}`,
    type: 'popup',
    width,
    height,
    left,
    top
  });
}

// Logout function
function logout() {
  // Clear stored auth data
  chrome.storage.local.remove(['openRouterApiKey', 'userInfo', 'credits'], () => {
    showLoggedOutView();
  });
}

// Open pricing page
function openPricingPage() {
  chrome.tabs.create({
    url: `${API_BASE_URL}/pricing`
  });
}

// Open dashboard page
function openDashboardPage() {
  // Get the extension ID to pass to the dashboard page
  const extensionId = chrome.runtime.id;

  chrome.tabs.create({
    url: `${API_BASE_URL}/dashboard?source=extension&extensionId=${extensionId}`
  });
}

// Send prompt to OpenRouter
async function sendPrompt() {
  const promptText = promptInput.value.trim();

  if (!promptText) {
    return;
  }

  // Clear input
  promptInput.value = '';

  // Add user message to chat
  addMessageToChat('user', promptText);

  // Show loading indicator
  const loadingId = addLoadingIndicator();

  // Get API key from storage
  chrome.storage.local.get(['openRouterApiKey'], async (result) => {
    if (!result.openRouterApiKey) {
      removeLoadingIndicator(loadingId);
      addMessageToChat('error', 'You need to sign in to use this feature.');
      return;
    }

    try {
      const response = await callOpenRouter(promptText, result.openRouterApiKey);
      removeLoadingIndicator(loadingId);

      // Add AI response to chat
      const aiResponse = response.choices[0].message.content;
      addMessageToChat('ai', aiResponse);

      // Update credits display if available
      if (response.usage && response.usage.total_tokens) {
        // Update credits display - this is approximate, you may want to fetch the actual credits from your backend
        chrome.storage.local.get(['credits'], (result) => {
          if (result.credits) {
            const updatedCredits = Math.max(0, result.credits - 1); // Simple approximation
            chrome.storage.local.set({ credits: updatedCredits });
            creditsCount.textContent = updatedCredits;
          }
        });
      }
    } catch (error) {
      removeLoadingIndicator(loadingId);
      addMessageToChat('error', `Error: ${error.message || 'Failed to get a response'}`);
    }
  });
}

// Call OpenRouter API
async function callOpenRouter(prompt, apiKey) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': API_BASE_URL,
      'X-Title': 'Agentic Browser'
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-opus", // You can use a default model or let users choose
      messages: [{ role: "user", content: prompt }]
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  return await response.json();
}

// Add message to chat
function addMessageToChat(role, content) {
  // Remove the placeholder text if it exists
  if (chatMessages.querySelector('.text-gray-400.italic')) {
    chatMessages.innerHTML = '';
  }

  const messageElement = document.createElement('div');
  messageElement.className = 'mb-3';

  if (role === 'user') {
    messageElement.innerHTML = `
      <div class="flex justify-end">
        <div class="bg-blue-600 p-2 rounded-lg max-w-[85%] break-words">
          <p>${escapeHtml(content)}</p>
        </div>
      </div>
    `;
  } else if (role === 'ai') {
    messageElement.innerHTML = `
      <div class="flex justify-start">
        <div class="bg-gray-700 p-2 rounded-lg max-w-[85%] break-words">
          <p>${escapeHtml(content)}</p>
        </div>
      </div>
    `;
  } else if (role === 'error') {
    messageElement.innerHTML = `
      <div class="flex justify-center">
        <div class="bg-red-600 p-2 rounded-lg max-w-[85%] text-center">
          <p>${escapeHtml(content)}</p>
        </div>
      </div>
    `;
  }

  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add loading indicator
function addLoadingIndicator() {
  const id = 'loading-' + Date.now();
  const loadingElement = document.createElement('div');
  loadingElement.id = id;
  loadingElement.className = 'flex justify-start mb-3';
  loadingElement.innerHTML = `
    <div class="bg-gray-700 p-2 rounded-lg">
      <div class="flex space-x-1">
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
      </div>
    </div>
  `;

  chatMessages.appendChild(loadingElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return id;
}

// Remove loading indicator
function removeLoadingIndicator(id) {
  const loadingElement = document.getElementById(id);
  if (loadingElement) {
    loadingElement.remove();
  }
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
