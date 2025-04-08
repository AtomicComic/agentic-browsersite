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
  checkAuthState();
  
  // Set up event listeners
  loginButton.addEventListener('click', openLoginWindow);
  logoutButton.addEventListener('click', logout);
  buyCreditsButton.addEventListener('click', openPricingPage);
  dashboardButton.addEventListener('click', openDashboardPage);
  sendButton.addEventListener('click', sendPrompt);
  
  // Allow pressing Enter to send prompt
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendPrompt();
    }
  });
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
function showLoggedInView(userInfo, credits) {
  loggedOutView.classList.add('hidden');
  loggedInView.classList.remove('hidden');
  
  // Display user email
  userEmail.textContent = userInfo.email || 'User';
  
  // Display credits if available
  if (credits) {
    creditsDisplay.classList.remove('hidden');
    creditsCount.textContent = credits;
  }
}

// Show the logged-out view
function showLoggedOutView() {
  loggedInView.classList.add('hidden');
  loggedOutView.classList.remove('hidden');
  creditsDisplay.classList.add('hidden');
  
  // Clear chat messages
  chatMessages.innerHTML = '<p class="text-gray-400 italic">Ask a question to get started...</p>';
}

// Open login window
function openLoginWindow() {
  const width = 500;
  const height = 600;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  
  const loginUrl = `${API_BASE_URL}/login?source=extension`;
  
  chrome.windows.create({
    url: loginUrl,
    type: 'popup',
    width: width,
    height: height,
    left: left,
    top: top
  });
  
  // Listen for messages from the login window
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTH_SUCCESS') {
      const { apiKey, userInfo, credits } = message.data;
      
      // Store the API key and user info
      chrome.storage.local.set({
        openRouterApiKey: apiKey,
        userInfo: userInfo,
        credits: credits
      }, () => {
        // Update UI
        showLoggedInView(userInfo, credits);
      });
    }
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
  chrome.tabs.create({
    url: `${API_BASE_URL}/dashboard`
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
