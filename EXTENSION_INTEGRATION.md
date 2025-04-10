# Agentic Browser Chrome Extension Integration Guide

This guide explains how to integrate the Agentic Browser payment system into a Chrome extension, including authentication flow, API key retrieval, and credit tracking with OpenRouter.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Retrieving the OpenRouter API Key](#retrieving-the-openrouter-api-key)
4. [Tracking Available Credits](#tracking-available-credits)
5. [Implementation Examples](#implementation-examples)
6. [Troubleshooting](#troubleshooting)

## Overview

The Agentic Browser Chrome extension uses a web-based authentication system where users log in through the main website. After successful authentication, the OpenRouter API key is securely passed to the extension, allowing it to make API calls to AI services while tracking credit usage. This approach provides a seamless user experience and ensures secure handling of API keys.

## Authentication Flow

### 1. Opening the Login Page

When a user needs to authenticate, open a popup window to the Agentic Browser login page with the `source=extension` parameter and your extension ID:

```javascript
function openLoginWindow() {
  const width = 500;
  const height = 600;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;

  // Get the extension ID to pass to the login page
  const extensionId = chrome.runtime.id;

  chrome.windows.create({
    url: `https://agentic-browser.com/login?source=extension&extensionId=${extensionId}`,
    type: 'popup',
    width,
    height,
    left,
    top
  });
}
```

### 2. Handling Authentication in the Website

On the website side, both the Login and Dashboard components automatically handle the authentication flow when they detect the `source=extension` parameter. This works for both new logins and already-logged-in users:

1. They check for the `source=extension` parameter in the URL
2. They retrieve the extension ID from the URL parameters
3. If the user is already logged in or after successful login, they:
   - Fetch the user's OpenRouter API key, user info, credits, and subscription data
   - Send this data back to the extension using `chrome.runtime.sendMessage`
   - Display a success message and close the window
4. If the user is not logged in, the Login component shows the login form

This approach ensures that users can authenticate from the extension whether they navigate to the login page or directly to the dashboard.

Here's the key part of the implementation:

```javascript
// In your Login component
// Check if login is from Chrome extension
const isFromExtension = React.useMemo(() => {
  return window.location.search.includes('source=extension');
}, [window.location.search]);

// Get the extension ID from the URL if available
const extensionId = React.useMemo(() => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('extensionId');
}, [window.location.search]);

// Function to send auth data to extension
const sendAuthDataToExtension = async () => {
  try {
    // Get the user's OpenRouter API key
    const apiKey = await getUserOpenRouterKey();
    if (!apiKey) {
      console.error('Failed to retrieve API key');
      return false;
    }

    // Get user info
    const userInfo = {
      email: currentUser?.email,
      uid: currentUser?.uid,
      displayName: currentUser?.displayName
    };

    // Get credits and subscription info
    const credits = userData?.credits || 0;
    const subscription = userData?.subscription || {
      status: 'inactive',
      plan: null,
      expiresAt: null
    };

    // Send data to extension using chrome.runtime.sendMessage
    if (extensionId) {
      // @ts-ignore - Chrome API not in TypeScript defs
      chrome.runtime.sendMessage(
        extensionId,
        {
          type: 'OPENROUTER_API_KEY',
          payload: {
            key: apiKey,
            userInfo,
            credits,
            subscription
          }
        }
      );

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error sending auth data to extension:', error);
    return false;
  }
};

// In useEffect to handle both new logins and already logged-in users
React.useEffect(() => {
  if (!loading && currentUser) {
    // If login is from extension, send auth data and close window
    if (isFromExtension && extensionId) {
      sendAuthDataToExtension().then(success => {
        if (success) {
          // Show success message briefly before closing
          toast({
            title: "Authentication Successful",
            description: "You can now close this window and return to the extension."
          });

          // Close the window after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          // If sending auth data failed, redirect to dashboard
          navigate('/dashboard');
        }
      });
    } else {
      // Normal login flow - redirect to dashboard
      navigate('/dashboard');
    }
  }
}, [currentUser, loading, navigate, isFromExtension, extensionId, sendAuthDataToExtension]);
```

### 3. Receiving the API Key in the Extension

In your extension's background script, listen for external messages from the website:

```javascript
// Listen for messages from the website
chrome.runtime.onMessageExternal.addListener((message, sender) => {
  if (message.type === 'OPENROUTER_API_KEY') {
    const { key, userInfo, credits, subscription } = message.payload;

    // Store auth data
    chrome.storage.local.set({
      openRouterApiKey: key,
      userInfo,
      credits,
      subscription,
      lastUpdated: Date.now()
    }).then(() => {
      // Notify popup if open
      chrome.runtime.sendMessage({
        type: 'AUTH_SUCCESS',
        data: { apiKey: key, userInfo, credits, subscription }
      });
    });
  }
});
```

## Retrieving the OpenRouter API Key

Once the authentication flow is complete, the OpenRouter API key is stored in the extension's local storage. To retrieve it:

```javascript
async function getOpenRouterApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['openRouterApiKey'], (result) => {
      resolve(result.openRouterApiKey || null);
    });
  });
}
```

## Tracking Available Credits

### Checking Credits with OpenRouter API

To check the rate limit or credits left on an API key, make a GET request to the OpenRouter API. This is useful for displaying up-to-date credit information to users and ensuring they don't run out of credits unexpectedly:

```javascript
async function checkCreditsRemaining(apiKey) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      credits: {
        used: data.data.usage,
        limit: data.data.limit,
        remaining: data.data.limit !== null ? data.data.limit - data.data.usage : null
      },
      isFreeTier: data.data.is_free_tier,
      rateLimit: data.data.rate_limit
    };
  } catch (error) {
    console.error('Error checking credits:', error);
    throw error;
  }
}
```

### Updating Credits Display in UI

After checking credits, update your UI to display the remaining credits:

```javascript
async function updateCreditsDisplay() {
  const apiKey = await getOpenRouterApiKey();

  if (!apiKey) {
    return;
  }

  try {
    const creditInfo = await checkCreditsRemaining(apiKey);

    // Update UI
    document.getElementById('credits-remaining').textContent =
      creditInfo.credits.remaining !== null
        ? creditInfo.credits.remaining
        : 'Unlimited';

    // Store updated credit info
    chrome.storage.local.set({
      credits: creditInfo.credits.remaining,
      lastCreditCheck: Date.now()
    });
  } catch (error) {
    console.error('Failed to update credits:', error);
  }
}
```

### Refreshing Credits Periodically

It's a good practice to refresh credit information periodically:

```javascript
// Check if credits need to be refreshed
function shouldRefreshCredits(lastCheckTime) {
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  return !lastCheckTime || (Date.now() - lastCheckTime > REFRESH_INTERVAL);
}

// When opening the extension popup
document.addEventListener('DOMContentLoaded', async () => {
  const storage = await chrome.storage.local.get(['lastCreditCheck']);

  if (shouldRefreshCredits(storage.lastCreditCheck)) {
    updateCreditsDisplay();
  }
});
```

## Implementation Examples

### Making API Calls with the OpenRouter API Key

Once you have the OpenRouter API key stored in your extension, you can use it to make API calls to OpenRouter's endpoints. Here's an example of how to call the chat completions endpoint:

```javascript
const url = 'https://openrouter.ai/api/v1/chat/completions';
const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: '{"model":"openai/gpt-3.5-turbo"}'
};
try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error);
}
Try it
200
Successful

{
  "id": "gen-12345",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "The meaning of life is a complex and subjective question..."
      }
    }
  ]
}
```

### Handling Payment and Subscription

When users need to purchase more credits or manage their subscription, provide convenient links to the Agentic Browser website:

```javascript
function openPricingPage() {
  chrome.tabs.create({
    url: 'https://agentic-browser.com/pricing'
  });
}

function openDashboardPage() {
  chrome.tabs.create({
    url: 'https://agentic-browser.com/dashboard'
  });
}
```

## Troubleshooting

### API Key Issues

If the OpenRouter API key is not working or users are experiencing authentication issues:

1. Check if the user is properly authenticated
2. Verify the key is correctly stored in chrome.storage.local
3. Check the browser console for any error messages during the authentication process
4. Try refreshing the key by re-authenticating the user

```javascript
function refreshAuthentication() {
  // Clear stored auth data
  chrome.storage.local.remove(['openRouterApiKey', 'userInfo', 'credits'], () => {
    // Prompt user to log in again
    openLoginWindow();
  });
}
```

### Credit Tracking Issues

If credit tracking is not working correctly:

1. Check the response from the OpenRouter API using the browser's network inspector
2. Verify that the credits are being properly updated in storage
3. Ensure the UI is correctly displaying the stored credit information
4. Check for any rate limiting or API access issues

```javascript
// Debug function to check stored data
function debugStoredData() {
  chrome.storage.local.get(null, (data) => {
    console.log('All stored data:', data);
  });
}
```

### Extension Permissions

Make sure your extension has the necessary permissions in the manifest.json file:

```json
{
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://openrouter.ai/*"
  ],
  "externally_connectable": {
    "matches": ["https://agentic-browser.com/*", "http://localhost:*/*"]
  }
}
```

The `externally_connectable` field is particularly important as it allows the website to communicate with your extension.

---

For more information, visit the [Agentic Browser website](https://agentic-browser.com) or contact support.
