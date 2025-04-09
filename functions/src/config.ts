// Firebase Functions v2 + Secret Manager
import { defineSecret } from 'firebase-functions/params';

// Define secrets via Firebase Secret Manager 
export const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
export const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
export const openRouterProvisioningKey = defineSecret('OPENROUTER_PROVISIONING_KEY');

// Configuration object for non-sensitive settings
export const config = {
  stripe: {
    priceIds: {
      'monthly-basic': process.env.STRIPE_PRICE_MONTHLY_BASIC || 'price_xxxx',
      'monthly-premium': process.env.STRIPE_PRICE_MONTHLY_PREMIUM || 'price_xxxx',
      'monthly-pro': process.env.STRIPE_PRICE_MONTHLY_PRO || 'price_xxxx',
      'credits-1500': process.env.STRIPE_PRICE_CREDITS_1500 || 'price_xxxx',
      'credits-6000': process.env.STRIPE_PRICE_CREDITS_6000 || 'price_xxxx',
      'credits-15000': process.env.STRIPE_PRICE_CREDITS_15000 || 'price_xxxx',
    },
  },
  project: {
    id: process.env.FIREBASE_PROJECT_ID || 'agenticbrowser-622ab',
  },
  // No sensitive values should be here - they should be accessed via secrets
};
