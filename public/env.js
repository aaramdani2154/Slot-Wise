/**
 * Runtime Environment Configuration for SlotWise
 * Loaded by index.html in client-side browser environments.
 * Sensitive keys are stored safely in localStorage or local private overrides.
 */
window.__ENV__ = window.__ENV__ || {
  SUPABASE_URL: "https://hkesnwooqxpoeiyprufu.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_xGcXsul7pi2SRCZmxrdJWA_rp21D7Zx",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_xGcXsul7pi2SRCZmxrdJWA_rp21D7Zx",
  GEMINI_API_KEY: (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('slotwise_gemini_api_key')) ? window.localStorage.getItem('slotwise_gemini_api_key') : ""
};
