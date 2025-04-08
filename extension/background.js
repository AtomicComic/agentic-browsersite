// Background script for handling events and communication

// Listen for messages from the website (for authentication)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // Make sure the message is coming from your website
  if (sender.url && (sender.url.startsWith('https://agenticbrowser.com') ||
                    sender.url.startsWith('http://localhost'))) {
    
    // Handle authentication success
    if (message.type === 'OPENROUTER_API_KEY') {
      const { key, userInfo, credits } = message.payload;
      
      // Store the API key and user info
      chrome.storage.local.set({
        openRouterApiKey: key,
        userInfo: userInfo,
        credits: credits
      }, () => {
        // Relay the authentication success to the popup if it's open
        chrome.runtime.sendMessage({
          type: 'AUTH_SUCCESS',
          data: {
            apiKey: key,
            userInfo: userInfo,
            credits: credits
          }
        });
        
        // Send response back to website
        sendResponse({ status: 'success' });
      });
      
      return true; // Required for async response
    }
  }
});

// Listen for when the extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open the onboarding page when the extension is first installed
    chrome.tabs.create({
      url: 'https://agenticbrowser.com/welcome'
    });
  }
});

// Set up context menu (optional feature)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'askAI',
    title: 'Ask AI about this',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'askAI' && info.selectionText) {
    // Check if user is authenticated
    chrome.storage.local.get(['openRouterApiKey'], (result) => {
      if (!result.openRouterApiKey) {
        // If not authenticated, open the popup to prompt login
        chrome.action.openPopup();
        return;
      }
      
      // Otherwise, process the selected text
      const selectedText = info.selectionText;
      
      // Option 1: Open popup with the text pre-filled
      chrome.storage.local.set({ pendingPrompt: selectedText }, () => {
        chrome.action.openPopup();
      });
      
      // Option 2: Or directly process in the background (uncomment if preferred)
      /*
      callOpenRouter(
        `Help me understand the following text: ${selectedText}`,
        result.openRouterApiKey
      )
      .then(response => {
        // Show the response in a notification or inject into page
        chrome.tabs.sendMessage(tab.id, {
          type: 'AI_RESPONSE',
          data: response.choices[0].message.content
        });
      })
      .catch(error => {
        console.error('Error calling OpenRouter:', error);
      });
      */
    });
  }
});

// Helper function to call OpenRouter API (if using option 2 above)
async function callOpenRouter(prompt, apiKey) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://agenticbrowser.com',
      'X-Title': 'Agentic Browser'
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-opus",
      messages: [{ role: "user", content: prompt }]
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return await response.json();
}
