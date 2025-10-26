<script>
  // Support Page
  let name = '';
  let email = '';
  let subject = '';
  let message = '';
  let submitted = false;

  async function handleSubmit() {
    // In a real app, this would send to your support email/ticketing system
    console.log('Support request:', { name, email, subject, message });
    submitted = true;

    // Reset form after 3 seconds
    setTimeout(() => {
      submitted = false;
      name = '';
      email = '';
      subject = '';
      message = '';
    }, 3000);
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
  <div class="container mx-auto px-6 py-16 max-w-4xl">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
        User Support
      </h1>
      <p class="text-gray-400 text-lg">We're here to help you succeed</p>
    </div>

    <div class="grid md:grid-cols-2 gap-8">
      <!-- Contact Form -->
      <div class="glass-card p-8">
        <h2 class="text-2xl font-bold mb-6">Contact Support</h2>

        {#if submitted}
          <div class="bg-green-500/20 border border-green-500 text-green-400 p-4 rounded-lg mb-6">
            ✅ Your message has been sent! We'll get back to you soon.
          </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              bind:value={name}
              required
              class="w-full px-4 py-3 bg-black/50 border border-orange-500/20 rounded-lg text-white focus:outline-none focus:border-orange-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              bind:value={email}
              required
              class="w-full px-4 py-3 bg-black/50 border border-orange-500/20 rounded-lg text-white focus:outline-none focus:border-orange-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Subject</label>
            <select
              bind:value={subject}
              required
              class="w-full px-4 py-3 bg-black/50 border border-orange-500/20 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Select a topic</option>
              <option value="facebook">Facebook OAuth / Ad Connection</option>
              <option value="mt5">MT5 Scraping Issues</option>
              <option value="commissions">Commission Calculations</option>
              <option value="billing">Billing & Payments</option>
              <option value="technical">Technical Support</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Message</label>
            <textarea
              bind:value={message}
              required
              rows="5"
              class="w-full px-4 py-3 bg-black/50 border border-orange-500/20 rounded-lg text-white focus:outline-none focus:border-orange-500"
              placeholder="Describe your issue or question..."
            />
          </div>

          <button
            type="submit"
            class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-all"
          >
            Send Message
          </button>
        </form>
      </div>

      <!-- Resources & FAQs -->
      <div class="space-y-6">
        <!-- Quick Help -->
        <div class="glass-card p-6">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            📚 Quick Help
          </h3>
          <div class="space-y-3 text-sm">
            <a href="#faq-facebook" class="block text-orange-400 hover:text-orange-300">
              → How to connect Facebook Ads
            </a>
            <a href="#faq-mt5" class="block text-orange-400 hover:text-orange-300">
              → Setting up MT5 scraping
            </a>
            <a href="#faq-commissions" class="block text-orange-400 hover:text-orange-300">
              → Understanding commissions
            </a>
            <a href="#faq-leads" class="block text-orange-400 hover:text-orange-300">
              → Managing leads
            </a>
          </div>
        </div>

        <!-- Contact Methods -->
        <div class="glass-card p-6">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            📞 Other Ways to Reach Us
          </h3>
          <div class="space-y-4 text-sm">
            <div>
              <p class="text-gray-400 mb-1">Email</p>
              <a href="mailto:support@clientflow.com" class="text-orange-400 hover:text-orange-300">
                support@clientflow.com
              </a>
            </div>
            <div>
              <p class="text-gray-400 mb-1">Response Time</p>
              <p class="text-white">Within 24 hours</p>
            </div>
            <div>
              <p class="text-gray-400 mb-1">Business Hours</p>
              <p class="text-white">Mon-Fri: 9am-5pm EST</p>
            </div>
          </div>
        </div>

        <!-- Documentation -->
        <div class="glass-card p-6">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            📖 Documentation
          </h3>
          <div class="space-y-3 text-sm">
            <a href="/docs/getting-started" class="block text-orange-400 hover:text-orange-300">
              → Getting Started Guide
            </a>
            <a href="/docs/facebook-ads" class="block text-orange-400 hover:text-orange-300">
              → Facebook Ads Integration
            </a>
            <a href="/docs/mt5-integration" class="block text-orange-400 hover:text-orange-300">
              → MT5 Integration Guide
            </a>
            <a href="/docs/api" class="block text-orange-400 hover:text-orange-300">
              → API Documentation
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- FAQs -->
    <div class="mt-12 glass-card p-8">
      <h2 class="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

      <div class="space-y-6">
        <div id="faq-facebook">
          <h3 class="text-lg font-semibold text-orange-400 mb-2">
            Why can't I connect my Facebook account?
          </h3>
          <p class="text-gray-300">
            Make sure you've configured the Facebook App OAuth redirect URIs correctly.
            See the FACEBOOK-OAUTH-FIX.md file in the project root for detailed setup instructions.
          </p>
        </div>

        <div id="faq-mt5">
          <h3 class="text-lg font-semibold text-orange-400 mb-2">
            How does MT5 scraping work?
          </h3>
          <p class="text-gray-300">
            Our system uses Playwright to securely connect to MT5 WebTrader using investor (read-only) credentials.
            We extract account balance, equity, and trade volume data to verify qualifying leads.
          </p>
        </div>

        <div id="faq-commissions">
          <h3 class="text-lg font-semibold text-orange-400 mb-2">
            How are IB commissions calculated?
          </h3>
          <p class="text-gray-300">
            Commissions are based on: 1) CPA from qualified trader deposits, 2) Ad spend incentives when monthly thresholds are met.
            View detailed calculations in your dashboard under Settings → Commission Config.
          </p>
        </div>

        <div id="faq-leads">
          <h3 class="text-lg font-semibold text-orange-400 mb-2">
            What's the difference between trader leads and IB leads?
          </h3>
          <p class="text-gray-300">
            Trader leads are end-users you refer who open trading accounts. IB leads are other affiliates you recruit to your network.
            Both types earn you commissions but are tracked separately.
          </p>
        </div>
      </div>
    </div>

    <!-- Back Button -->
    <div class="text-center mt-12">
      <a
        href="/dashboard"
        class="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all"
      >
        Back to Dashboard
      </a>
    </div>
  </div>
</div>

<style>
  .glass-card {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 87, 34, 0.2);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }
</style>
