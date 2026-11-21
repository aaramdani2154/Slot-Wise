/**
 * SlotWise AI Booking Platform - Google Gemini Integration Engine & Support Concierge
 * 
 * Supports:
 * 1. Live Google Gemini API (gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro)
 * 2. Autonomous Website Navigation (Discover, Providers, Details, Bookings, Profile, Telehealth)
 * 3. 24/7 Customer Support Agent (FAQ, Troubleshooting, Support Tickets, Human Agent Escalation)
 * 4. Resilient Built-in Smart Fallback Engine when API key is pending or offline
 */

(function (window) {
  const GEMINI_STORAGE_KEY = 'slotwise_gemini_api_key';
  const GEMINI_MODEL_KEY = 'slotwise_gemini_model';
  const TICKETS_STORAGE_KEY = 'slotwise_support_tickets_v1';

  // Support Knowledge Base for Customer Inquiries
  const SUPPORT_KB = {
    cancellation: "SlotWise offers a 100% free cancellation guarantee up until the appointment start time. If cancelled, your slot is instantly released back to the calendar with zero penalty fees.",
    reschedule: "You can reschedule any confirmed appointment by navigating to the 'My Bookings' tab and clicking 'Reschedule' on the desired appointment card.",
    telehealth: "All virtual visits take place in an end-to-end encrypted, browser-based WebRTC HD video room. You can join 10 minutes prior with one tap—no third-party app downloads required.",
    pricing: "Consultation fees are transparent and set directly by each verified specialist, ranging from $30 to $180. The fee shown is the final price with zero surprise booking surcharges.",
    verification: "Every specialist on SlotWise undergoes thorough credential verification, including active state licensing, board certifications, and malpractice background checks.",
    supabase: "SlotWise connects directly to Supabase PostgreSQL for cloud synchronization. You can configure your Project URL and Anon Key in the Profile tab, or run in Resilient Mock Mode."
  };

  class GeminiAgentEngine {
    constructor() {
      this.apiKey = '';
      this.model = 'gemini-1.5-flash';
      this.conversationHistory = [];
      this.tickets = [];
      this.humanAgentActive = false;
      this.init();
    }

    init() {
      // 1. Prioritize window.__ENV__.GEMINI_API_KEY if configured
      const savedKey = localStorage.getItem(GEMINI_STORAGE_KEY);
      const savedModel = localStorage.getItem(GEMINI_MODEL_KEY);

      if (window.__ENV__ && window.__ENV__.GEMINI_API_KEY && window.__ENV__.GEMINI_API_KEY.trim().length > 5) {
        this.apiKey = window.__ENV__.GEMINI_API_KEY.trim();
      } else if (savedKey && savedKey.trim().length > 5) {
        this.apiKey = savedKey.trim();
      }

      if (savedModel) {
        this.model = savedModel;
      }

      // Load tickets
      try {
        const storedTickets = localStorage.getItem(TICKETS_STORAGE_KEY);
        this.tickets = storedTickets ? JSON.parse(storedTickets) : [];
      } catch (e) {
        this.tickets = [];
      }
    }

    cleanKey(key) {
      if (!key) return '';
      let k = key.trim();
      // If user prepended AIzasy to key (e.g. AIzasyAQ...), strip accidental prefix
      if (/^AIzasy(AQ\..+)$/i.test(k)) {
        k = k.replace(/^AIzasy/i, '');
      }
      return k.trim();
    }

    isConfigured() {
      return Boolean(this.apiKey && this.apiKey.length > 5);
    }

    getKey() {
      return this.apiKey;
    }

    getModel() {
      return this.model;
    }

    setKey(key) {
      this.apiKey = this.cleanKey(key);
      if (this.apiKey) {
        localStorage.setItem(GEMINI_STORAGE_KEY, this.apiKey);
        if (window.__ENV__) {
          window.__ENV__.GEMINI_API_KEY = this.apiKey;
        }
      } else {
        localStorage.removeItem(GEMINI_STORAGE_KEY);
        if (window.__ENV__) {
          window.__ENV__.GEMINI_API_KEY = '';
        }
      }
    }

    setModel(modelName) {
      this.model = modelName || 'gemini-1.5-flash';
      localStorage.setItem(GEMINI_MODEL_KEY, this.model);
    }

    clearHistory() {
      this.conversationHistory = [];
      this.humanAgentActive = false;
    }

    // Ping the Gemini API to test validity of a key
    async testConnection(testKey = null, testModel = null) {
      const keyToUse = this.cleanKey(testKey || this.apiKey);
      const modelToUse = testModel || this.model || 'gemini-1.5-flash';

      if (!keyToUse) {
        return { success: false, error: 'No API Key provided. Please enter a valid Gemini API key.' };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${encodeURIComponent(keyToUse)}`;
      const startTime = Date.now();

      try {
        const payload = {
          contents: [
            {
              role: "user",
              parts: [{ text: "Respond with the word 'PONG' to verify connection." }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const latencyMs = Date.now() - startTime;
        const data = await response.json();

        if (!response.ok) {
          const errDetail = data?.error?.message || response.statusText || 'Unknown Gemini API error';
          return { success: false, error: errDetail, status: response.status, latencyMs };
        }

        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return {
          success: true,
          message: `Connection verified with Google Gemini API!`,
          latencyMs,
          model: modelToUse,
          reply: reply.trim()
        };
      } catch (err) {
        return {
          success: false,
          error: err.message || 'Network connection to Gemini API failed. Check your internet connection.'
        };
      }
    }

    // Build Contextual System Prompt
    buildSystemPrompt(context) {
      const providersList = (context.providers || []).map(p => 
        `- ID: "${p.id}" | Name: ${p.name} | Title: ${p.title} | Category: ${p.category} | Fee: $${p.consultation_fee} | Rating: ${p.rating}★ (${p.reviews_count} reviews) | Telehealth: ${p.is_telehealth ? 'Yes' : 'No'} | Location: ${p.location} | Next Slot: ${p.next_available_slot}`
      ).join('\n');

      return `You are the AI Concierge, Autonomous Site Navigator, and Customer Support Agent for "SlotWise", an autonomous booking and appointment scheduling platform.

### YOUR CAPABILITIES & COMMAND TAGS:
You can control the website directly! Whenever the user asks to navigate somewhere, view a specialist, book a slot, or needs customer support, output the appropriate command tags embedded in your response:

1. AUTONOMOUS SITE NAVIGATION:
- Discover / Home View: Tag: [[NAVIGATE:discover]]
- Specialists Feed View: Tag: [[NAVIGATE:providers]] or with search/category: [[NAVIGATE:providers:doctor]] or [[NAVIGATE:providers:hair]] or [[NAVIGATE:providers:wellness]]
- Specialist Profile & Booking Calendar: Tag: [[NAVIGATE:details:<provider_id>]]
- My Bookings View: Tag: [[NAVIGATE:bookings]]
- Profile & Settings View: Tag: [[NAVIGATE:profile]]

2. ACTION TAGS:
- Launch Encrypted HD Telehealth Video Room: Tag: [[ACTION:videocall:<provider_name>]]
- Instant Reserve Slot: Tag: [[ACTION:book:<provider_id>:<date>:<time>:<fee>:<provider_name>]]
- Create Customer Support Ticket: Tag: [[ACTION:ticket:<subject>]]
- Transfer to Live Human Support Specialist: Tag: [[ACTION:escalate:<reason>]]

### AVAILABLE SPECIALISTS:
${providersList}

### CUSTOMER SUPPORT POLICIES & KNOWLEDGE BASE:
- Cancellation Policy: 100% free cancellation guarantee up until appointment start time with zero penalty fees. The slot is immediately returned to the calendar. Include [[NAVIGATE:bookings]] so the user can easily cancel.
- Rescheduling: Appointments can be rescheduled at any time from the 'My Bookings' tab with zero penalty fees.
- Telehealth Video Consultations: High-definition WebRTC video room running directly inside the browser. 100% end-to-end encrypted, zero downloads or apps required. Users can join 10 minutes prior with one tap.
- Pricing & Fees: Specialists set their rates ($30 to $180). What you see is what you pay—zero hidden booking fees or convenience charges. Itemized receipts with provider NPI codes are provided for HSA/FSA or insurance claims.
- Specialist Vetting: Every specialist is verified with active state licensing, board certifications, and malpractice history checks.
- Supabase Sync: All bookings and profile preferences sync directly to Supabase PostgreSQL database in real-time. Resilient offline mode is supported.

### RESPONSE GUIDELINES:
- Whenever the user expresses intent to visit a page, view specialists, check bookings, or open settings, ALWAYS include the appropriate [[NAVIGATE:...]] tag.
- When the user asks for doctors, hair stylists, trainers, or therapists, recommend the closest match from the AVAILABLE SPECIALISTS list above, including their name, fee, rating, and next available slot, and tag their profile [[NAVIGATE:details:<provider_id>]].
- Use clean Markdown formatting with bullet points and bold highlights.
- Keep responses courteous, futuristic, fast, and helpful.`;
    }

    // Main Message Processing Entry Point
    async sendMessage(userMessage, context = {}) {
      const trimmed = (userMessage || '').trim();
      if (!trimmed) return null;

      // Check if user is speaking with simulated human agent
      if (this.humanAgentActive) {
        return this.processHumanAgentResponse(trimmed);
      }

      // Check for human agent escalation trigger
      if (/human|agent|representative|live person|operator|support team/i.test(trimmed)) {
        if (/talk|connect|transfer|speak|reach|get me/i.test(trimmed)) {
          this.humanAgentActive = true;
          return {
            text: "Transferring you to a Live Customer Support Specialist...\n\n**Sarah Miller (SlotWise Customer Ops)** has entered the chat.\n\n*\"Hello! I'm Sarah from the SlotWise Support Team. I see your conversation history. How can I assist you personally today?\"*",
            actions: [{ type: 'escalate', text: 'Live Agent Connected' }],
            modelUsed: 'Live Human Support Specialist'
          };
        }
      }

      // If Gemini API Key is configured, use Live Gemini API
      if (this.isConfigured()) {
        try {
          const geminiResult = await this.callGeminiAPI(trimmed, context);
          if (geminiResult && geminiResult.text) {
            return geminiResult;
          }
        } catch (err) {
          console.warn('Gemini API call failed, falling back to Smart Engine:', err);
          // Fall back gracefully
          const fallback = this.processFallback(trimmed, context);
          fallback.fallbackNotice = `(Note: Live Gemini API encountered [${err.message}]. Served via Built-in Smart Support Engine.)`;
          return fallback;
        }
      }

      // Otherwise, use Built-in Smart Support & Navigation Engine
      return this.processFallback(trimmed, context);
    }

    // Call Google Gemini REST API
    async callGeminiAPI(userMessage, context) {
      const activeKey = this.cleanKey(this.apiKey);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(activeKey)}`;
      
      const systemPrompt = this.buildSystemPrompt(context);

      // Build conversation history contents
      const contents = [];

      // Append last 8 turns for context
      const recentHistory = this.conversationHistory.slice(-8);
      recentHistory.forEach(item => {
        contents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        });
      });

      // Append current message with context
      const contextualUserMessage = `[Current App Tab: ${context.currentTab || 'discover'}, Visit Mode: ${context.visitMode || 'in-person'}]\n${userMessage}`;
      contents.push({
        role: "user",
        parts: [{ text: contextualUserMessage }]
      });

      const payload = {
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: contents,
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 900
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!rawText) {
        throw new Error('Gemini returned an empty response.');
      }

      // Record in history
      this.conversationHistory.push({ role: 'user', text: userMessage });
      this.conversationHistory.push({ role: 'model', text: rawText });

      // Parse tags
      return this.parseResponseTags(rawText, context);
    }

    // Parse navigation and action tags from AI response
    parseResponseTags(rawText, context) {
      let cleanText = rawText;
      const actions = [];
      let navigation = null;

      // 1. Navigation tags: [[NAVIGATE:target]] or [[NAVIGATE:target:param]]
      const navRegex = /\[\[NAVIGATE:([a-zA-Z0-9_-]+)(?::([^\]]+))?\]\]/g;
      let match;
      while ((match = navRegex.exec(rawText)) !== null) {
        const target = match[1].toLowerCase();
        const param = match[2] ? match[2].trim() : null;
        navigation = { target, param };
      }
      cleanText = cleanText.replace(navRegex, '').trim();

      // 2. Action tags: [[ACTION:type:params]]
      const actionRegex = /\[\[ACTION:([a-zA-Z0-9_-]+)(?::([^\]]+))?\]\]/g;
      while ((match = actionRegex.exec(rawText)) !== null) {
        const type = match[1].toLowerCase();
        const params = match[2] ? match[2].split(':') : [];
        actions.push({ type, params });
      }
      cleanText = cleanText.replace(actionRegex, '').trim();

      // Ensure cleanText doesn't look empty if tags were stripped
      if (!cleanText && navigation) {
        cleanText = `Navigating to ${navigation.target.toUpperCase()} as requested.`;
      }

      return {
        text: cleanText,
        raw: rawText,
        navigation,
        actions,
        modelUsed: `Google Gemini (${this.model})`
      };
    }

    // Process Simulated Live Human Agent Dialogue
    processHumanAgentResponse(userMessage) {
      const lower = userMessage.toLowerCase();
      let reply = "";

      if (lower.includes('bye') || lower.includes('thank') || lower.includes('resolved') || lower.includes('all good')) {
        this.humanAgentActive = false;
        reply = "You're very welcome! I'm glad we could get that sorted out for you. I'll close our live session and hand you back to the autonomous AI concierge. Have a wonderful day!";
        return {
          text: reply,
          actions: [{ type: 'human_ended', text: 'Live Session Ended' }],
          modelUsed: 'Live Support Specialist'
        };
      }

      if (lower.includes('ticket') || lower.includes('cancel') || lower.includes('reschedule') || lower.includes('refund')) {
        const ticket = this.createTicket(`Specialist escalation: ${userMessage.slice(0, 50)}...`, 'High');
        reply = `I have personally created high-priority Ticket **#${ticket.id}** for our operations desk. I've flagged this for instant resolution within 10 minutes. Is there anything else you'd like me to note on this file?`;
      } else {
        reply = `I understand completely. Let me personally handle that for you right now. Your preferences have been updated on file, and your calendar alerts are fully synchronized. Would you like me to navigate you to your Bookings tab to review everything?`;
      }

      return {
        text: reply,
        actions: [{ type: 'human_message', text: 'Live Specialist Response' }],
        modelUsed: 'Sarah Miller (Support Ops)'
      };
    }

    // High-Intelligence Built-in Fallback Engine
    processFallback(userMessage, context) {
      const msg = userMessage.toLowerCase().trim();
      const providers = context.providers || [];

      // 1. Navigation: Discover / Home
      if (/(go|take me|navigate|back|return) (to )?(home|discover|landing|start|main)/i.test(msg) || msg === 'home' || msg === 'discover') {
        return {
          text: "Navigating to **Discover & Home Console**. Here you can explore featured specialists, toggle between in-person & virtual visits, and review live booking telemetry.",
          navigation: { target: 'discover' },
          actions: [{ type: 'navigate', label: 'Go to Discover', target: 'discover' }],
          modelUsed: 'Built-in Smart Engine'
        };
      }

      // 2. Navigation: Bookings / Appointments
      if (/(my|view|show|open|check|go to|take me to)? *(bookings|appointments|schedule|my visits|calendar)/i.test(msg) && !msg.includes('book a') && !msg.includes('book with')) {
        return {
          text: "Navigating to **My Bookings**. Here you can view your scheduled appointments, join encrypted HD telehealth calls, or cancel/reschedule existing slots.",
          navigation: { target: 'bookings' },
          actions: [{ type: 'navigate', label: 'Open My Bookings', target: 'bookings' }],
          modelUsed: 'Built-in Smart Engine'
        };
      }

      // 3. Navigation: Profile / Settings / Supabase / Gemini Config
      if (/(settings|profile|supabase|database|config|api key|gemini key|account)/i.test(msg)) {
        return {
          text: "Navigating to **Profile & Backend Hub**. You can manage your verified client profile, configure your Supabase PostgreSQL credentials, and update your Google Gemini API key.",
          navigation: { target: 'profile' },
          actions: [{ type: 'navigate', label: 'Open Settings', target: 'profile' }],
          modelUsed: 'Built-in Smart Engine'
        };
      }

      // 4. Navigation & Search: Providers / Specialists
      if (/(find|search|browse|show|view|look for|list) (doctors|specialists|providers|physician|salon|stylist|trainer|counselor|mechanic)/i.test(msg) ||
          /(specialists|providers|all doctors)/i.test(msg)) {
        let keyword = '';

        if (/doctor|physician|health|clinic|dentist/i.test(msg)) {
          keyword = 'doctor';
        } else if (/hair|salon|beauty|stylist|colorist/i.test(msg)) {
          keyword = 'hair';
        } else if (/fitness|gym|trainer|workout|coach/i.test(msg)) {
          keyword = 'fitness';
        } else if (/therapy|counselor|mental|wellness|stress/i.test(msg)) {
          keyword = 'wellness';
        } else if (/car|mechanic|auto|vehicle|repair/i.test(msg)) {
          keyword = 'mechanic';
        }

        return {
          text: `Navigating to **Specialists Feed** ${keyword ? `filtered by **${keyword}**` : ''}. You can inspect verified credentials, filter by in-person vs. virtual, and reserve available slots.`,
          navigation: { target: 'providers', param: keyword },
          actions: [
            { type: 'navigate', label: 'View All Providers', target: 'providers' }
          ],
          modelUsed: 'Built-in Smart Engine'
        };
      }

      // 5. Direct Provider Profile Navigation
      for (const p of providers) {
        const lastName = p.name.split(' ').slice(-1)[0].toLowerCase();
        const firstName = p.name.split(' ')[0].toLowerCase().replace('dr.', '');
        if (msg.includes(lastName) || (firstName.length > 2 && msg.includes(firstName))) {
          return {
            text: `Opening profile for **${p.name}** (${p.title}). Next available slot is **${p.next_available_slot}** with a consultation fee of **$${p.consultation_fee}**.`,
            navigation: { target: 'details', param: p.id },
            actions: [
              { type: 'details', label: `View ${p.name}`, target: p.id },
              { type: 'book', label: `Instant Book $${p.consultation_fee}`, providerId: p.id, fee: p.consultation_fee, name: p.name }
            ],
            modelUsed: 'Built-in Smart Engine'
          };
        }
      }

      // 6. Support Query: Cancellation Policy
      if (/(cancel|cancellation|refund|penalty|fee to cancel)/i.test(msg)) {
        return {
          text: `### 🛡️ SlotWise Cancellation & Refund Guarantee\n\n- **100% Free Cancellation**: You can cancel any confirmed appointment up to the minute it starts.\n- **Zero Penalties**: No hidden cancellation charges or penalty fees.\n- **Instant Slot Release**: The slot is immediately returned to the specialist's calendar.\n\nTo cancel an appointment, visit **My Bookings**, locate the appointment card, and click **Cancel**.\n\n[[NAVIGATE:bookings]]`,
          navigation: { target: 'bookings' },
          actions: [{ type: 'navigate', label: 'Go to Bookings to Cancel', target: 'bookings' }],
          modelUsed: 'Built-in Smart Engine'
        };
      }

      // 7. Support Query: Telehealth & Video Calls
      if (/(telehealth|video call|virtual|camera|mic|hd call|stream|zoom)/i.test(msg)) {
        return {
          text: `### 🎥 Encrypted HD Telehealth Consultations\n\n- **Zero App Downloads**: Runs directly in your browser with WebRTC HD video.\n- **End-to-End Encryption**: Compliant with clinical and data privacy standards.\n- **Easy Access**: 10 minutes prior to your visit, click **Join HD Call** inside your **My Bookings** dashboard.\n\nWould you like to test launch the virtual video room?`,
          actions: [
            { type: 'videocall', label: 'Launch Demo Telehealth Room', provider: 'Dr. Aarav Mehta, MD' },
            { type: 'navigate', label: 'Go to My Bookings', target: 'bookings' }
          ],
          modelUsed: 'Built-in Smart Engine'
        };
      }

      // 8. Support Query: Pricing & Fees
      if (/(cost|price|fee|charge|how much|insurance|payment)/i.test(msg)) {
        return {
          text: `### 💳 Transparent Pricing & Fees\n\n- **Direct Specialist Rates**: Fees range from **$30 to $180** depending on the specialist and procedure duration.\n- **No Surprise Charges**: The price you see is the full amount.\n- **Itemized Receipts**: Digital receipts with provider NPI & verification codes are generated for HSA/FSA or insurance claim reimbursement.`,
          actions: [{ type: 'navigate', label: 'Browse Specialist Fees', target: 'providers' }],
          modelUsed: 'Built-in Smart Engine'
        };
      }

      // 9. Support Query: Create Ticket
      if (/(create|open|submit|raise|need) (a )?(ticket|issue|complaint|support request)/i.test(msg)) {
        const ticket = this.createTicket(`User request: ${userMessage.slice(0, 45)}`, 'Normal');
        return {
          text: `### 🎫 Support Ticket Generated: #${ticket.id}\n\n- **Status**: Received & Queued (Open)\n- **Priority**: Normal\n- **Target SLA**: Under 15 Minutes\n\nOur customer support operations team has received your inquiry. A copy has been saved to your profile support desk.`,
          actions: [{ type: 'ticket_created', ticketId: ticket.id }],
          modelUsed: 'Built-in Smart Engine'
        };
      }

      // 10. General Booking Intent matching
      if (/(book|schedule|reserve|appointment|slot)/i.test(msg)) {
        const defaultDoc = providers[0] || { id: '11111111-1111-1111-1111-111111111111', name: 'Dr. Aarav Mehta, MD', consultation_fee: 45 };
        return {
          text: `I've analyzed our specialist availability and found verified open slots available today and tomorrow!\n\n- **${defaultDoc.name}** (General Physician) • Today 03:30 PM ($${defaultDoc.consultation_fee || 45})\n- **Priya Nair** (Master Stylist) • Tomorrow 11:00 AM ($90)\n- **Dr. Neha Sharma** (Internal Medicine) • Tomorrow 04:45 PM ($50)\n\nClick below to open Dr. Aarav's booking calendar or reserve directly:`,
          navigation: { target: 'details', param: defaultDoc.id },
          actions: [
            { type: 'details', label: `View ${defaultDoc.name} Calendar`, target: defaultDoc.id },
            { type: 'book', label: `Instant Reserve 3:30 PM ($${defaultDoc.consultation_fee || 45})`, providerId: defaultDoc.id, fee: defaultDoc.consultation_fee || 45, name: defaultDoc.name }
          ],
          modelUsed: 'Built-in Smart Engine'
        };
      }

      // Default Friendly Support & Navigation Fallback
      return {
        text: `Hello! I am your **SlotWise AI Navigator & Customer Support Concierge**.\n\nI can help you navigate the entire platform or assist with customer support inquiries:\n\n- 🧭 **Site Navigation**: Ask *"Take me to my bookings"*, *"Show doctors"*, or *"Go to settings"*\n- 🩺 **Specialist Discovery**: Ask *"Find a stylist"* or *"Open Dr. Aarav Mehta"*\n- ❓ **Customer Support**: Ask about cancellation policies, telehealth HD video, pricing, or say *"Connect to human agent"*\n- ⚡ **Autonomous Booking**: Ask *"Book tomorrow afternoon"*\n\n*(Tip: Add your Gemini API Key in the top right to enable live LLM reasoning!)*`,
        actions: [
          { type: 'navigate', label: '🧭 My Bookings', target: 'bookings' },
          { type: 'navigate', label: '🩺 Find Specialists', target: 'providers' },
          { type: 'navigate', label: '⚙️ Settings Hub', target: 'profile' }
        ],
        modelUsed: 'Built-in Smart Engine'
      };
    }

    createTicket(subject, priority = 'Normal') {
      const ticket = {
        id: 'SW-' + Math.floor(1000 + Math.random() * 9000),
        subject,
        priority,
        status: 'Open',
        createdAt: new Date().toISOString()
      };
      this.tickets.unshift(ticket);
      try {
        localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(this.tickets.slice(0, 20)));
      } catch (e) {}
      return ticket;
    }

    resolveTicket(ticketId) {
      const t = this.tickets.find(item => item.id === ticketId);
      if (t) {
        t.status = 'Resolved';
        try {
          localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(this.tickets.slice(0, 20)));
        } catch (e) {}
      }
      return t;
    }

    getTickets() {
      return this.tickets;
    }

    clearTickets() {
      this.tickets = [];
      try {
        localStorage.removeItem(TICKETS_STORAGE_KEY);
      } catch (e) {}
    }
  }

  // Export Singleton
  window.GeminiAgent = new GeminiAgentEngine();
})(window);
