import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#0A0C14] text-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy for Agentic Browser</h1>
        <p className="text-gray-400 mb-8 text-center">Last Updated: April 10, 2025</p>

        <div className="text-white max-w-none space-y-6">
          <p className="text-gray-300 leading-relaxed">
            Thank you for using Agentic Browser (the "Extension"). This Privacy Policy outlines how we collect, use, and protect your data in connection with your use of the Extension. Agentic Browser is designed with a privacy-first philosophy—prioritizing your control and minimizing data collection.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">Summary</h2>
          <p className="text-gray-300 leading-relaxed">
            Agentic Browser does not collect or store your browsing data, AI interactions, or personal usage information. All AI actions happen locally within your browser or via secure relay (only when using our credit system). We only store minimal data necessary to support authentication and payments. Your privacy is central to how we build and operate Agentic Browser.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">1. Data Handling and Privacy by Design</h2>
          <p className="text-gray-300 leading-relaxed">Agentic Browser is built to protect your data from the ground up:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li><strong>Local Processing:</strong> All AI-driven automation and content analysis occur entirely within your Chrome browser. We do not transmit, analyze, or store your browsing activity, web content, or commands on our servers.</li>
            <li><strong>Direct AI Integration:</strong> When using your own API keys (BYOK), your browser connects directly to third-party AI providers (e.g., OpenAI, Anthropic, Gemini). We do not intermediate, log, or store API requests or responses in this mode.</li>
            <li><strong>Optional Credit System:</strong> If you opt to use our built-in credit system, We simply provide you with an API key to interact with AI directly, we do not log or retain the content of your interactions.</li>
            <li><strong>No Personal Data Storage:</strong> We do not store personal data, browsing history, AI commands, or API responses on our servers.</li>
            <li><strong>Local Key Storage:</strong> BYOK API keys are stored locally within your browser's secure storage. We never transmit or access your keys besides from the keys that we provide you with.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">2. Authentication and Payment Information</h2>
          <p className="text-gray-300 leading-relaxed">For users utilizing authentication or our credit-based system:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li><strong>Minimal Auth Data:</strong> We store only what's necessary to enable login or credit functionality—typically a hashed or anonymized ID linked to your email address.</li>
            <li><strong>Payment Security:</strong> We do not store or process credit card or financial details. All payments are handled securely via our payment processor (e.g., Stripe, Coinnect), governed by their respective privacy policies.</li>
            <li><strong>Credit Tracking:</strong> Credit balances are tied to a unique user ID and stored in a secure and minimal manner, without retaining sensitive personal data beyond what's necessary for account access.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">3. Information You Control</h2>
          <p className="text-gray-300 leading-relaxed">You maintain complete control over your usage:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li><strong>API Keys (BYOK):</strong> If you provide your own API keys, they are securely stored and used only within your local browser.</li>
            <li><strong>Commands & Inputs:</strong> All commands and inputs are processed locally. We cannot see, access, or retrieve any of this information.</li>
            <li><strong>AI Output:</strong> All AI responses are rendered locally or received directly from the AI provider. We do not intercept or store this communication.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">4. Third-Party Services</h2>
          <p className="text-gray-300 leading-relaxed">
            Agentic Browser may interact with AI services provided by companies like OpenAI, Anthropic, Openrouter, and Google. Your use of these services is governed by their respective Privacy Policies and Terms of Service. We encourage you to review these policies, as Agentic Browser does not control their data handling practices.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">5. Chrome Extension Permissions</h2>
          <p className="text-gray-300 leading-relaxed">To function properly, Agentic Browser requires certain Chrome permissions. These are strictly limited to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li><strong>Accessing and Modifying Webpage Content:</strong> Enables AI interaction with visible webpage data (e.g., summarizing, translating, extracting).</li>
            <li><strong>Clipboard Access:</strong> Used only to support features like copying AI responses or pasting content for analysis.</li>
            <li><strong>Local Storage:</strong> Required for saving your BYOK credentials and extension settings.</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">We do not use these permissions to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Track your browsing behavior</li>
            <li>Capture keystrokes or sensitive data</li>
            <li>Transmit data to our servers for analytics or profiling</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">All extension functionality is sandboxed and limited to its intended purpose.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">6. Data Storage Location</h2>
          <p className="text-gray-300 leading-relaxed">
            All extension data is stored locally within your Chrome browser's storage environment. If chrome.storage.sync is enabled, settings may sync across devices via your Google account, subject to Google's data handling practices.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">7. Updates to This Privacy Policy</h2>
          <p className="text-gray-300 leading-relaxed">
            We may revise this Privacy Policy periodically. When we do, updates will be reflected on the Chrome Web Store listing and, if possible, within the Extension interface. Your continued use of Agentic Browser after such updates constitutes your acceptance of the revised terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4 text-white">8. Contact Us</h2>
          <p className="text-gray-300 leading-relaxed">
            If you have any questions or concerns about this Privacy Policy or the privacy practices of Agentic Browser, please contact us at:
          </p>
          <p className="mt-2 text-gray-300">
            📧 <a href="mailto:agenticbrowser@gmail.com" className="text-[#66B3FF] hover:underline">agenticbrowser@gmail.com</a>
          </p>

          <p className="mt-8 text-gray-300 leading-relaxed">
            By using Agentic Browser, you agree to the terms of this Privacy Policy. Your privacy is paramount, and we remain committed to building tools that empower users without compromising their trust.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
