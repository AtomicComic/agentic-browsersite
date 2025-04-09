import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Request as FunctionsRequest } from 'firebase-functions/v2/https';

// Extend Express Request to include rawBody property
export interface Request extends ExpressRequest {
  rawBody?: string | Buffer;
}

// Type for Firebase Functions Request that can be used with our handler
export type WebhookRequest = Request | FunctionsRequest;

// Type for Response that works with both Express and Firebase Functions
export type WebhookResponse = ExpressResponse;
