import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import * as nodemailer from 'nodemailer';

// Email HTML template
const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your Agentic Browser Extension Is Ready!</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            background: #ffffff;
            margin: 20px auto;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h1 {
            color: #333;
            font-size: 24px;
        }
        p {
            font-size: 16px;
            color: #555;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 20px;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            margin-top: 20px;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            font-size: 14px;
            color: #777;
            margin-top: 20px;
        }
        .footer a {
            color: #007bff;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Your Agentic Browser Extension Is Ready!</h1>
        <p>Hi there, thanks for checking out Agentic Browser, we're thrilled to have you on board.</p>

        <p><strong>🤖 Agentic Browser</strong>, automate tasks and give AI control of your browser as you browse.</p>
        <a href="https://chromewebstore.google.com/detail/agentic-browser/jhdchfkgagokfbbhmomopcidkjnlieoc" class="button">Install Agentic Browser</a>

        <p>Not sure how to get started or confused about setup? We've got you covered, check out our <a href="https://www.instagram.com/agenticbrowser">help center</a> or reply to this email and we'll assist you.</p>

        <p>If you're enjoying Agentic Browser, would you consider leaving a quick review? It helps more than you know:</p>
        <p>📝 <a href="https://chromewebstore.google.com/detail/agentic-browser/jhdchfkgagokfbbhmomopcidkjnlieoc/reviews">Review Agentic Browser</a></p>

        <div class="footer">
            <p>Stay curious, <br>The Agentic Browser Team</p>
            <p>🌐 <a href="https://www.agentic-browser.com">agentic-browser.com</a></p>
            <p>💬 <a href="mailto:agenticbrowser@gmail.com">agenticbrowser@gmail.com</a></p>
        </div>
    </div>
</body>
</html>`;

// Configure email transport
const createTransport = () => {
  // For production, use environment variables
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'agenticbrowser@gmail.com',
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Subscribes a user to the newsletter and sends them an email
 * 
 * @param email - The email address to subscribe
 * @returns Promise with success status and message
 */
export async function subscribeToNewsletterHandler(email: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Store the email in Firestore
    const subscribersRef = admin.firestore().collection('newsletter_subscribers');
    
    // Check if email already exists
    const existingSubscriber = await subscribersRef
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!existingSubscriber.empty) {
      logger.info('Email already subscribed', { email });
      
      // Send the email again anyway
      await sendWelcomeEmail(email);
      
      return { 
        success: true, 
        message: 'You are already subscribed. We have sent the installation instructions again.' 
      };
    }
    
    // Add new subscriber
    await subscribersRef.add({
      email,
      subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'website'
    });
    
    logger.info('New subscriber added', { email });
    
    // Send welcome email
    await sendWelcomeEmail(email);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error subscribing to newsletter', { error: errorMessage, email });
    throw error;
  }
}

/**
 * Sends a welcome email with installation instructions
 * 
 * @param email - The recipient's email address
 */
async function sendWelcomeEmail(email: string): Promise<void> {
  try {
    const transporter = createTransport();
    
    const mailOptions = {
      from: '"Agentic Browser" <agenticbrowser@gmail.com>',
      to: email,
      subject: '🚀 Your Agentic Browser Extension Is Ready!',
      html: EMAIL_TEMPLATE
    };
    
    await transporter.sendMail(mailOptions);
    logger.info('Welcome email sent successfully', { email });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending welcome email', { error: errorMessage, email });
    throw error;
  }
}
