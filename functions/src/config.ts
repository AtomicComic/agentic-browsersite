import * as dotenv from 'dotenv';
import { defineSecret } from 'firebase-functions/params';

// Define secrets (values injected by Secret Manager at runtime)
export const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
export const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
export const openRouterProvisioningKey = defineSecret('OPENROUTER_PROVISIONING_KEY');

// Load environment variables ONLY for local development/emulator
// In production, these are set via deployment configuration or secrets
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  dotenv.config({ path: '.env.local' }); // Load .env.local first
  dotenv.config({ path: '.env' });      // Load .env
  console.log('EMULATOR: Loaded environment variables from .env files');
}

const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

// Environment configuration - reliant on process.env being set correctly
// No fallback values here for production safety. Missing env vars will cause errors.
export const config = {
  stripe: {
    // Price IDs MUST be set in your environment variables (.env files for local, deployment config for production)
    // Example .env entry: STRIPE_PRICE_MONTHLY_BASIC=price_xxxxxxxxxxxxxx
    priceIds: {
      'monthly-basic': process.env.STRIPE_PRICE_MONTHLY_BASIC!,
      'monthly-premium': process.env.STRIPE_PRICE_MONTHLY_PREMIUM!,
      'monthly-pro': process.env.STRIPE_PRICE_MONTHLY_PRO!,
      'credits-1500': process.env.STRIPE_PRICE_CREDITS_1500!,
      'credits-6000': process.env.STRIPE_PRICE_CREDITS_6000!,
      'credits-15000': process.env.STRIPE_PRICE_CREDITS_15000!,
    },
  },
  project: {
    // Example .env entry: VITE_FIREBASE_PROJECT_ID=your-project-id
    id: process.env.VITE_FIREBASE_PROJECT_ID || 'agenticbrowser-622ab', // Keep potential fallback for project ID if needed elsewhere
  },
  isEmulator,
};

// Validate that critical Price IDs are loaded, otherwise throw an error early
// This helps catch configuration issues during deployment or startup.
for (const key in config.stripe.priceIds) {
    if (!config.stripe.priceIds[key as keyof typeof config.stripe.priceIds]) {
        throw new Error(`CRITICAL CONFIG ERROR: Missing Stripe Price ID environment variable for key: ${key}. Check your .env files or deployment configuration.`);
    }
}