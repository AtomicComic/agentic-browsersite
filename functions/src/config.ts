import * as functions from 'firebase-functions';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env.local' });
dotenv.config({ path: '../.env' });

// Environment configuration
export const config = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret_key,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || functions.config().stripe?.webhook_secret,    priceIds: {
      'monthly-basic': process.env.STRIPE_PRICE_MONTHLY_BASIC || 'price_xxxx',
      'monthly-premium': process.env.STRIPE_PRICE_MONTHLY_PREMIUM || 'price_xxxx',
      'monthly-pro': process.env.STRIPE_PRICE_MONTHLY_PRO || 'price_xxxx',
      'credits-1500': process.env.STRIPE_PRICE_CREDITS_1500 || 'price_xxxx',
      'credits-6000': process.env.STRIPE_PRICE_CREDITS_6000 || 'price_xxxx',
      'credits-15000': process.env.STRIPE_PRICE_CREDITS_15000 || 'price_xxxx',
    }
  },
  project: {
    id: process.env.VITE_FIREBASE_PROJECT_ID || 'agenticbrowser-622ab'
  },
  openRouter: {
    provisioningKey: process.env.OPENROUTER_PROVISIONING_KEY
  },
  isEmulator: process.env.FUNCTIONS_EMULATOR === 'true'
};
