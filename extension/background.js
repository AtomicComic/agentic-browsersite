// Background script for handling events and communication

// Listen for messages from the website
chrome.runtime.onMessageExternal.addListener((message, sender) => {
  console.log('Received external message:', message, 'from:', sender);
  if (message.type === 'OPENROUTER_API_KEY') {
    const { key, userInfo, credits, subscription } = message.payload;

    console.log('Received auth data:', { key: '***', userInfo, credits, subscription });

    if (!key) {
      console.error('No API key provided in auth message');
      return;
    }

    // Store auth data
    chrome.storage.local.set({
      openRouterApiKey: key,
      userInfo: userInfo || { email: 'user@example.com' },
      credits: credits || 0,
      subscription: subscription || { status: 'inactive' },
      lastUpdated: Date.now()
    }).then(() => {
      // Notify popup if open
      chrome.runtime.sendMessage({
        type: 'AUTH_SUCCESS',
        data: {
          apiKey: key,
          userInfo,
          credits,
          subscription
        }
      });
      console.log('Auth data stored and popup notified');
    }).catch(error => {
      console.error('Error storing auth data:', error);
    });
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

// Helper function to call OpenRouter API
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

// Add function to check auth and fetch data
async function checkAuthAndFetchData() {
  const storage = await chrome.storage.local.get(['openRouterApiKey', 'userInfo', 'lastUpdated']);

  if (!storage.openRouterApiKey || !storage.userInfo) {
    return false;
  }

  try {
    // Fetch latest user data from your API
    const response = await fetch('https://agenticbrowser.com/api/user-data', {
      headers: {
        'Authorization': `Bearer ${storage.openRouterApiKey}`,
      }
    });

    if (!response.ok) {
      await chrome.storage.local.remove(['openRouterApiKey', 'userInfo', 'credits']);
      return false;
    }

    const userData = await response.json();

    // Update storage with latest data
    await chrome.storage.local.set({
      credits: userData.credits,
      subscription: userData.subscription,
      lastUpdated: Date.now()
    });

    return true;
  } catch (error) {
    console.error('Error checking auth:', error);
    return false;
  }
}
