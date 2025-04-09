# AgenticBrowser Deployment Guide

This guide provides step-by-step instructions for deploying the AgenticBrowser application with proper API key management using Google Secret Manager.

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project initialized: `firebase login` and `firebase use agenticbrowser-622ab`
- Node.js v22 installed

## Step 1: Setup Secret Manager

First, enable the Secret Manager API for your project:

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com --project=agenticbrowser-622ab
```

## Step 2: Store Your API Keys as Secrets

Use the Firebase CLI to create secrets for your API keys:

```bash
# Store Stripe Secret Key
firebase functions:secrets:set STRIPE_SECRET_KEY
# When prompted, paste

# Store Stripe Webhook Secret
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# When prompted, paste

# Store OpenRouter Provisioning Key
firebase functions:secrets:set OPENROUTER_PROVISIONING_KEY
# When prompted, paste
```

Each command will prompt you to enter the secret value. Enter the appropriate value from your .env.local file.

## Step 3: Install Dependencies and Build Functions

```bash
# Navigate to the functions directory
cd functions

# Install dependencies (including the new rimraf dependency)
npm install

# Clean build artifacts and rebuild
npm run build:clean
```

If you encounter TypeScript errors, they should now be resolved with our updated code that properly handles Secret Manager integration.

## Step 4: Deploy Functions

```bash
# Deploy only the functions
firebase deploy --only functions
```

This will deploy your Cloud Functions with Secret Manager integration.

## Step 5: Set Up Frontend Hosting

You have two options for hosting your frontend:

### Option 1: Traditional Firebase Hosting (Static)

```bash
# Build your frontend
cd ..  # Back to project root
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Option 2: Firebase App Hosting (Advanced)

If you prefer App Hosting with its advanced features like environment variables and server-side rendering:

1. First, set parameters for your Firebase configuration:

```bash
# Get your Firebase Web SDK configuration from the Firebase Console
# Then set these parameters
firebase hosting:params:set FIREBASE_API_KEY "your-firebase-api-key"
firebase hosting:params:set FIREBASE_AUTH_DOMAIN "agenticbrowser-622ab.firebaseapp.com"
firebase hosting:params:set FIREBASE_MESSAGING_SENDER_ID "your-messaging-sender-id"
firebase hosting:params:set FIREBASE_APP_ID "your-firebase-app-id"
```

2. Deploy using App Hosting:

```bash
# Deploy to Firebase App Hosting
firebase deploy --only apphosting
```

## Step 6: Verify Deployment

1. Check your Cloud Functions logs to ensure they're properly using the secrets:

```bash
firebase functions:log
```

2. Test your application by:
   - Creating a checkout session
   - Processing a webhook event
   - Retrieving a user key

## Troubleshooting

If you encounter any issues:

1. Check if the Secret Manager API is enabled:
```bash
gcloud services list --enabled --project=agenticbrowser-622ab | grep secretmanager
```

2. Verify your secrets are properly set:
```bash
firebase functions:secrets:list
```

3. Make sure your functions have permission to access secrets:
```bash
# This should be handled automatically, but you can check IAM permissions in the Google Cloud Console
```

4. If the build is failing, try a clean build:
```bash
cd functions
npm run build:clean
```

## Local Development

For local development with Firebase Emulators:

```bash
# Create local secrets configuration
firebase functions:secrets:get > .secret.local

# Ensure .secret.local is in your .gitignore
echo ".secret.local" >> .gitignore

# Start the emulator with secrets
firebase emulators:start
```

This setup provides a secure and maintainable way to manage sensitive API keys for your application while supporting both local development and production deployment.