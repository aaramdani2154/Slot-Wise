/**
 * SlotWise AI Booking Platform - Supabase Integration Engine
 * Provides dual-mode operation:
 * 1. Live Supabase Cloud (PostgreSQL + Realtime + RLS)
 * 2. Resilient In-Memory & LocalStorage Mock Database (Active by default until keys are supplied)
 */

(function (window) {
  const STORAGE_KEY = 'slotwise_supabase_config';
  const LOCAL_DB_KEY = 'slotwise_local_db_v2';

  // Initial Seed Data for Local Fallback / Instant Run
  const DEFAULT_PROVIDERS = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Dr. Aarav Mehta, MD',
      title: 'General Physician & Preventative Care',
      category: 'general_health',
      bio: 'Board-certified in Internal Medicine with 11+ years of experience across acute primary care, preventative lifestyle medicine, and cardiometabolic wellness. Alumnus of Johns Hopkins Medicine and active advisor for clinical digital health workflows.',
      certifications: ['ABIM Certified', 'Telehealth Accredited', 'English', 'Hindi'],
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg7c10i3qLcso6l1OHSG3ZCFxiJFTMLDotGgH39tGcfzs34NSkonLUGPpn_HmKK7a4O9XcNc5IsUTO1GNpd6fJE56Npgvz-zVwWnXivyADcvf6w-b2NnbxCexGBrOyJZRKxye8Y0-5HFZ6yhrk1WICSApoQAEuXERWQmavMr4mtHdXDdER3qROb_twC85tx5sxAc6SFw7a4yZa-U9jXhc8SEwjJgjo3i4Ae3zJcUE',
      card_photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNUkkJaWTrhWaaYnltySuRp4AZDfUt_04gPGLOnuiGNpaEsDWJB9KQWiBeHFaYjhpNmTWBo1a11qcTndEoMi7oQle8EJ_PC6c-nytzz4NAeFp1Hq93TatRqPC-qjbzwSUpcc2Mc_qStnUdk9BmS8AlEv2jESoh9U1yRipLRIiGrUOg9q1aFm9qO72z5BGHmbW7_kLHxO6UDiwTBkhx62KFu6z9cQ9VlOHKedadwfY',
      rating: 4.9,
      reviews_count: 142,
      consultation_fee: 45.00,
      duration_minutes: 20,
      location: 'Downtown Medical Arts Center, Suite 402',
      is_telehealth: true,
      is_in_person: true,
      verified: true,
      next_available_slot: 'Today 3:30 PM',
      services: [
        { name: 'Routine Health Checkup', duration: 20, fee: 45.00 },
        { name: 'Prescription Renewal', duration: 15, fee: 30.00 },
        { name: 'Lab Results Review', duration: 20, fee: 40.00 }
      ]
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Priya Nair',
      title: 'Master Hair Stylist & Colorist',
      category: 'beauty',
      bio: 'Award-winning hair designer specializing in organic balayage, dimensional coloring, precision cuts, and scalp wellness ceremonies. 10 years crafting aesthetic styles in Soho.',
      certifications: ['L’Oréal Master Colorist', 'Trichology Certified', 'Eco-Salon Partner'],
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBprtOciv_O6dCiZRr8MM1dDIsjZG0p6fR8Js4EqfSwu27xDiNadVTj0W6bDiii8nPEtYXq_iqHDicqZlM_GmJPrMujDe6kT6lwdzs-JKiRG4tVyFn3ITGRbUDm9I66t31AICtKGLeJIxvxmkr5A0rIRzRVCzPhze2giim3J9Ir_sMjNJ0bW6H-YXyIptCKildiRvHajr3uc9YdPWEiLc9p-RQbaiEW6db9j7eHjcg',
      card_photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBprtOciv_O6dCiZRr8MM1dDIsjZG0p6fR8Js4EqfSwu27xDiNadVTj0W6bDiii8nPEtYXq_iqHDicqZlM_GmJPrMujDe6kT6lwdzs-JKiRG4tVyFn3ITGRbUDm9I66t31AICtKGLeJIxvxmkr5A0rIRzRVCzPhze2giim3J9Ir_sMjNJ0bW6H-YXyIptCKildiRvHajr3uc9YdPWEiLc9p-RQbaiEW6db9j7eHjcg',
      rating: 4.8,
      reviews_count: 89,
      consultation_fee: 90.00,
      duration_minutes: 45,
      location: 'The Prism Hair Lounge, Soho',
      is_telehealth: false,
      is_in_person: true,
      verified: true,
      next_available_slot: 'Tomorrow 11:00 AM',
      services: [
        { name: 'Precision Styling & Cut', duration: 45, fee: 90.00 },
        { name: 'Balayage & Color Gloss', duration: 90, fee: 180.00 },
        { name: 'Scalp Detox & Moisture Infusion', duration: 30, fee: 65.00 }
      ]
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Rohan Verma',
      title: 'High Performance Fitness Coach',
      category: 'fitness',
      bio: 'Certified Strength & Conditioning Specialist (CSCS) working with elite athletes and executives on metabolic conditioning, postural correction, and bio-optimized periodization.',
      certifications: ['NSCA-CSCS', 'Precision Nutrition L2', 'FMS Certified'],
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnjRb2sAje2NncLEYBuWA_-xf8ozToglkScAEn4fXwQSpChbLGdQawfZIRgl2Qpo8_ZMDoX231KOewCBkwdpuicJ8SUq1XSqJXQ2dibv1nJpcvo3yXopdeYUCgUqiIMBOtvo7RJou4Fgr53kR6zJP31EFJsomyLSPt3UuxRd6BwY6VQ_iEMg33hPTqwph5T3bhjCJsEujVxE5BgTtoNx1OaxOcCpzNRZEBWfuof9Y',
      card_photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnjRb2sAje2NncLEYBuWA_-xf8ozToglkScAEn4fXwQSpChbLGdQawfZIRgl2Qpo8_ZMDoX231KOewCBkwdpuicJ8SUq1XSqJXQ2dibv1nJpcvo3yXopdeYUCgUqiIMBOtvo7RJou4Fgr53kR6zJP31EFJsomyLSPt3UuxRd6BwY6VQ_iEMg33hPTqwph5T3bhjCJsEujVxE5BgTtoNx1OaxOcCpzNRZEBWfuof9Y',
      rating: 5.0,
      reviews_count: 215,
      consultation_fee: 80.00,
      duration_minutes: 60,
      location: 'Apex Performance Lab, Downtown & Virtual',
      is_telehealth: true,
      is_in_person: true,
      verified: true,
      next_available_slot: 'Today 5:00 PM',
      services: [
        { name: '1-on-1 Biomechanical Assessment', duration: 60, fee: 80.00 },
        { name: 'Metabolic Conditioning Plan', duration: 45, fee: 65.00 },
        { name: 'Postural Spine Rehab & Mobility', duration: 45, fee: 70.00 }
      ]
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Sara Khan',
      title: 'Mental Wellness Counselor',
      category: 'wellness',
      bio: 'Licensed counselor focusing on cognitive behavioral therapy, burnout recovery, stress regulation, and holistic mindfulness. Safe, confidential encrypted virtual consultations.',
      certifications: ['LPC Licensed', 'CBT Practitioner', 'Mindfulness Teacher'],
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwby2Ya8wdOV1Iwt1TUsFwpjFBgiNhYRbxUfz1HCZCFG2QiZZc6zLBl60eCWz-olQqD_6gQlJDwHP2c3jaHyHxmweiayoAtUjQJoK7h9cvL7sFNhraf-Gbfyhgj9PHpHckhWGIjkinfcRqLxOaVDtdSkl_3Qi3BglcUbEkt9-KrLaN_6iZRZAq7TjPtIxNSri9pKi2AIQyYKel4RdqXM8GZS_6eD8Io8Gh6OscgHM',
      card_photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwby2Ya8wdOV1Iwt1TUsFwpjFBgiNhYRbxUfz1HCZCFG2QiZZc6zLBl60eCWz-olQqD_6gQlJDwHP2c3jaHyHxmweiayoAtUjQJoK7h9cvL7sFNhraf-Gbfyhgj9PHpHckhWGIjkinfcRqLxOaVDtdSkl_3Qi3BglcUbEkt9-KrLaN_6iZRZAq7TjPtIxNSri9pKi2AIQyYKel4RdqXM8GZS_6eD8Io8Gh6OscgHM',
      rating: 4.9,
      reviews_count: 98,
      consultation_fee: 110.00,
      duration_minutes: 50,
      location: 'Encrypted HD Virtual Consult Suite',
      is_telehealth: true,
      is_in_person: false,
      verified: true,
      next_available_slot: 'Friday 2:00 PM',
      services: [
        { name: 'Cognitive Stress Consultation', duration: 50, fee: 110.00 },
        { name: 'Executive Burnout Recovery', duration: 50, fee: 125.00 },
        { name: 'Mindfulness & Sleep Reset', duration: 40, fee: 95.00 }
      ]
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Kabir Singh',
      title: 'Certified Master Mechanic',
      category: 'automotive',
      bio: 'Master ASE-certified technician with diagnostic telemetry expertise across hybrid, EV, and high-performance European combustion platforms. Transparent digital inspections.',
      certifications: ['ASE Master Tech', 'EV High-Voltage Certified', 'Bosch Specialist'],
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG-pUh-7LhjGtzIvsOSY_EqJsnD0-Ipmv3gopSDjST_KmkqPWgH_dAFGD2i9RXMMeD5qwfwgsCywbI0o4_E4kqF2PszkAKFDJsSfO0TVAemqtKhcXhYF_T06MxXiVNkK5NdUj5TcDBm07RHHcu2vuXNhEhDjFH3Un7bIv__ApVDfXZPJmqgKSsZ7JGZ1zGlorSFX-PoHr9xg3W0mkeI2OAxcByjq1pjWlPsNzaRZ0',
      card_photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG-pUh-7LhjGtzIvsOSY_EqJsnD0-Ipmv3gopSDjST_KmkqPWgH_dAFGD2i9RXMMeD5qwfwgsCywbI0o4_E4kqF2PszkAKFDJsSfO0TVAemqtKhcXhYF_T06MxXiVNkK5NdUj5TcDBm07RHHcu2vuXNhEhDjFH3Un7bIv__ApVDfXZPJmqgKSsZ7JGZ1zGlorSFX-PoHr9xg3W0mkeI2OAxcByjq1pjWlPsNzaRZ0',
      rating: 4.7,
      reviews_count: 76,
      consultation_fee: 55.00,
      duration_minutes: 30,
      location: 'Precision Auto Bay 4, Industrial Area',
      is_telehealth: false,
      is_in_person: true,
      verified: true,
      next_available_slot: 'Tomorrow 9:00 AM',
      services: [
        { name: 'Computer OBD-II Telemetry Diagnostic', duration: 30, fee: 55.00 },
        { name: 'Performance Brake & Suspension Inspection', duration: 45, fee: 75.00 },
        { name: 'Full Vehicle Multipoint Health Scan', duration: 60, fee: 110.00 }
      ]
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      name: 'Dr. Neha Sharma, MD',
      title: 'Internal Medicine & Cardiometabolic Specialist',
      category: 'general_health',
      bio: 'Specialist in cardiovascular wellness, endocrinology, and holistic primary health consultations with personalized preventative biometric screenings.',
      certifications: ['Board Certified', 'Cardio Fellow', 'Telehealth Certified'],
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJscX8QUag3ZDavRul3Eevzp5B5wASxM5fy74QuclAXZbN5caj4Zgt1C41Ndv7Iv_mx0BAyUYEYWbdVwyHrhpBr5AGzheGwEorLs2qt0L5PfFoTyLY0zf5Ibj-iu_HevY-Yek1hfO_9fBVDCbM1eZ0K5kGRY65iJ_XyDY0zv5LfVQkaQMGTRN5v8H2gRPd6bnBTcR71x5AX-D2R3xiytpjx4NRxVPYM5TY2sXc1JA',
      card_photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJscX8QUag3ZDavRul3Eevzp5B5wASxM5fy74QuclAXZbN5caj4Zgt1C41Ndv7Iv_mx0BAyUYEYWbdVwyHrhpBr5AGzheGwEorLs2qt0L5PfFoTyLY0zf5Ibj-iu_HevY-Yek1hfO_9fBVDCbM1eZ0K5kGRY65iJ_XyDY0zv5LfVQkaQMGTRN5v8H2gRPd6bnBTcR71x5AX-D2R3xiytpjx4NRxVPYM5TY2sXc1JA',
      rating: 4.8,
      reviews_count: 94,
      consultation_fee: 50.00,
      duration_minutes: 30,
      location: 'Metro Health Pavillion, East Wing & Virtual',
      is_telehealth: true,
      is_in_person: true,
      verified: true,
      next_available_slot: 'Tomorrow 4:45 PM',
      services: [
        { name: 'Cardiometabolic Risk Audit', duration: 30, fee: 50.00 },
        { name: 'Preventative Wellness Roadmap', duration: 45, fee: 75.00 },
        { name: 'Remote Telehealth Check-in', duration: 20, fee: 40.00 }
      ]
    }
  ];

  // Generate Slots for the next 7 days for each provider
  function generateDefaultSlots() {
    const slots = [];
    const times = [
      { time: '09:30 AM', period: 'morning', booked: false, ai: false },
      { time: '10:15 AM', period: 'morning', booked: true, ai: false },
      { time: '11:00 AM', period: 'morning', booked: false, ai: false },
      { time: '02:00 PM', period: 'afternoon', booked: false, ai: false },
      { time: '03:30 PM', period: 'afternoon', booked: false, ai: true },
      { time: '04:15 PM', period: 'afternoon', booked: true, ai: false },
      { time: '05:30 PM', period: 'evening', booked: false, ai: false },
      { time: '06:15 PM', period: 'evening', booked: false, ai: false }
    ];

    DEFAULT_PROVIDERS.forEach(provider => {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const d = new Date();
        d.setDate(d.getDate() + dayOffset);
        const dateStr = d.toISOString().split('T')[0];

        times.forEach((t, idx) => {
          // Semi-randomize availability for other days
          const isAvailable = (dayOffset === 0 && t.time === '03:30 PM') ? true : !t.booked && (dayOffset % 2 === 0 ? idx % 2 === 0 : true);
          slots.push({
            id: `slot_${provider.id.slice(0, 8)}_${dateStr}_${idx}`,
            provider_id: provider.id,
            slot_date: dateStr,
            start_time: t.time,
            time_period: t.period,
            is_available: isAvailable,
            is_ai_recommended: (dayOffset <= 1 && t.time === '03:30 PM')
          });
        });
      }
    });

    return slots;
  }

  // Initial Bookings
  const DEFAULT_APPOINTMENTS = [
    {
      id: 'apt_demo_01',
      provider_id: '11111111-1111-1111-1111-111111111111',
      provider_name: 'Dr. Aarav Mehta, MD',
      provider_title: 'General Physician & Preventative Care',
      provider_avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg7c10i3qLcso6l1OHSG3ZCFxiJFTMLDotGgH39tGcfzs34NSkonLUGPpn_HmKK7a4O9XcNc5IsUTO1GNpd6fJE56Npgvz-zVwWnXivyADcvf6w-b2NnbxCexGBrOyJZRKxye8Y0-5HFZ6yhrk1WICSApoQAEuXERWQmavMr4mtHdXDdER3qROb_twC85tx5sxAc6SFw7a4yZa-U9jXhc8SEwjJgjo3i4Ae3zJcUE',
      user_name: 'Demo User',
      user_email: 'demo.user@slotwise.ai',
      service_name: 'Routine Health Checkup',
      appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      appointment_time: '03:30 PM',
      fee: 45.00,
      status: 'confirmed',
      is_virtual: false,
      meeting_link: null,
      notes: 'Annual biometric health screen & routine blood check.'
    },
    {
      id: 'apt_demo_02',
      provider_id: '44444444-4444-4444-4444-444444444444',
      provider_name: 'Sara Khan',
      provider_title: 'Mental Wellness Counselor',
      provider_avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwby2Ya8wdOV1Iwt1TUsFwpjFBgiNhYRbxUfz1HCZCFG2QiZZc6zLBl60eCWz-olQqD_6gQlJDwHP2c3jaHyHxmweiayoAtUjQJoK7h9cvL7sFNhraf-Gbfyhgj9PHpHckhWGIjkinfcRqLxOaVDtdSkl_3Qi3BglcUbEkt9-KrLaN_6iZRZAq7TjPtIxNSri9pKi2AIQyYKel4RdqXM8GZS_6eD8Io8Gh6OscgHM',
      user_name: 'Demo User',
      user_email: 'demo.user@slotwise.ai',
      service_name: 'Cognitive Stress Consultation',
      appointment_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      appointment_time: '02:00 PM',
      fee: 110.00,
      status: 'confirmed',
      is_virtual: true,
      meeting_link: 'https://meet.slotwise.ai/room/mind-sec-941',
      notes: 'Virtual consult on work-life stress regulation & sleep cycles.'
    }
  ];

  class SlotWiseDatabaseService {
    constructor() {
      this.supabaseClient = null;
      this.mode = 'mock'; // 'supabase' or 'mock'
      this.config = this.loadConfig();
      this.localDb = this.loadLocalDb();
      this.listeners = [];

      this.initClient();
    }

    loadConfig() {
      // Default credentials from runtime environment (env.js / window.__ENV__) or defaults
      const defaultUrl = (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.SUPABASE_URL)
        ? window.__ENV__.SUPABASE_URL
        : 'https://hkesnwooqxpoeiyprufu.supabase.co';
      const defaultKey = (typeof window !== 'undefined' && window.__ENV__ && (window.__ENV__.SUPABASE_ANON_KEY || window.__ENV__.SUPABASE_PUBLISHABLE_KEY))
        ? (window.__ENV__.SUPABASE_ANON_KEY || window.__ENV__.SUPABASE_PUBLISHABLE_KEY)
        : 'sb_publishable_xGcXsul7pi2SRCZmxrdJWA_rp21D7Zx';

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.url && parsed.anonKey) {
            return parsed;
          }
        }
        return { url: defaultUrl, anonKey: defaultKey };
      } catch (e) {
        return { url: defaultUrl, anonKey: defaultKey };
      }
    }

    normalizeUrl(url) {
      if (!url) return '';
      let clean = url.trim();
      // Remove trailing dots, slashes, or whitespace
      clean = clean.replace(/[\.\/\s]+$/, '');
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      // If user pasted only the 20-char project ID e.g. "https://cxuetieuizevuajojh"
      try {
        const parsed = new URL(clean);
        if (!parsed.hostname.includes('.')) {
          clean = `https://${parsed.hostname}.supabase.co`;
        }
      } catch (e) {
        if (!clean.includes('.supabase.co')) {
          clean = clean + '.supabase.co';
        }
      }
      return clean.replace(/\/+$/, '');
    }

    saveConfig(url, anonKey) {
      this.config = {
        url: this.normalizeUrl(url),
        anonKey: (anonKey || '').trim()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      return this.initClient();
    }

    loadLocalDb() {
      try {
        const raw = localStorage.getItem(LOCAL_DB_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}

      const initial = {
        providers: DEFAULT_PROVIDERS,
        slots: generateDefaultSlots(),
        appointments: DEFAULT_APPOINTMENTS,
        chat: []
      };
      this.persistLocalDb(initial);
      return initial;
    }

    persistLocalDb(db) {
      this.localDb = db;
      try {
        localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
      } catch (e) {}
    }

    async initClient() {
      if (this.config.url && this.config.anonKey && window.supabase) {
        try {
          this.supabaseClient = window.supabase.createClient(this.config.url, this.config.anonKey);

          // Test with a quick query against the providers table
          const { data, error } = await this.supabaseClient.from('providers').select('id').limit(1);

          if (!error) {
            this.mode = 'supabase';
            console.log('⚡ SlotWise: Successfully connected to live Supabase backend at', this.config.url);
            this.notifyChange('connection', { mode: 'supabase', url: this.config.url });
            return {
              success: true,
              mode: 'supabase',
              url: this.config.url
            };
          } else {
            console.warn('⚠️ SlotWise: Supabase test query error:', error);
            const isTableMissing = error.code === '42P01' || (error.message && error.message.toLowerCase().includes('relation') && error.message.toLowerCase().includes('does not exist'));
            const isAuthError = error.code === 'PGRST301' || error.message?.includes('JWT') || error.code === '401' || error.code === '403';

            this.mode = 'mock';
            this.notifyChange('connection', {
              mode: 'mock',
              error: error.message,
              code: error.code,
              isTableMissing,
              isAuthError
            });

            return {
              success: false,
              mode: 'mock',
              error: error.message,
              code: error.code,
              isTableMissing,
              isAuthError,
              url: this.config.url
            };
          }
        } catch (err) {
          console.warn('⚠️ SlotWise: Supabase client initialization exception:', err);
          this.mode = 'mock';
          this.notifyChange('connection', { mode: 'mock', error: err.message, isNetworkError: true });
          return {
            success: false,
            mode: 'mock',
            error: err.message || 'Network / connection error',
            isNetworkError: true,
            url: this.config.url
          };
        }
      }

      this.mode = 'mock';
      this.notifyChange('connection', { mode: 'mock' });
      return { success: true, mode: 'mock', reason: 'Using resilient mock database' };
    }

    onStateChange(fn) {
      this.listeners.push(fn);
    }

    notifyChange(eventType, payload) {
      this.listeners.forEach(fn => {
        try { fn(eventType, payload); } catch (e) {}
      });
    }

    // --- DATA METHODS ---

    async getProviders(category = 'all', searchQuery = '') {
      let list = [];
      if (this.mode === 'supabase') {
        try {
          let query = this.supabaseClient.from('providers').select('*, services(*)');
          if (category && category !== 'all') {
            query = query.eq('category', category);
          }
          if (searchQuery) {
            query = query.or(`name.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
          }
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            list = data;
          } else {
            list = this.filterLocalProviders(category, searchQuery);
          }
        } catch (e) {
          list = this.filterLocalProviders(category, searchQuery);
        }
      } else {
        list = this.filterLocalProviders(category, searchQuery);
      }
      return list;
    }

    filterLocalProviders(category, searchQuery) {
      let result = [...this.localDb.providers];
      if (category && category !== 'all') {
        result = result.filter(p => p.category === category);
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
        );
      }
      return result;
    }

    async getProviderById(id) {
      if (this.mode === 'supabase') {
        try {
          const { data, error } = await this.supabaseClient
            .from('providers')
            .select('*, services(*)')
            .eq('id', id)
            .single();
          if (!error && data) return data;
        } catch (e) {}
      }
      return this.localDb.providers.find(p => p.id === id) || this.localDb.providers[0];
    }

    async getSlotsForDate(providerId, dateStr) {
      if (this.mode === 'supabase') {
        try {
          const { data, error } = await this.supabaseClient
            .from('slots')
            .select('*')
            .eq('provider_id', providerId)
            .eq('slot_date', dateStr)
            .order('start_time', { ascending: true });
          if (!error && data && data.length > 0) return data;
        } catch (e) {}
      }

      // Fallback local lookup
      const matches = this.localDb.slots.filter(s => s.provider_id === providerId && s.slot_date === dateStr);
      if (matches.length > 0) return matches;

      // Dynamically generate slots for this date if none exists
      const fallbackTimes = [
        { time: '09:30 AM', period: 'morning', booked: false },
        { time: '10:15 AM', period: 'morning', booked: true },
        { time: '11:00 AM', period: 'morning', booked: false },
        { time: '02:00 PM', period: 'afternoon', booked: false },
        { time: '03:30 PM', period: 'afternoon', booked: false, ai: true },
        { time: '04:15 PM', period: 'afternoon', booked: true },
        { time: '05:30 PM', period: 'evening', booked: false },
        { time: '06:15 PM', period: 'evening', booked: false }
      ];

      return fallbackTimes.map((t, idx) => ({
        id: `slot_${providerId.slice(0, 8)}_${dateStr}_${idx}`,
        provider_id: providerId,
        slot_date: dateStr,
        start_time: t.time,
        time_period: t.period,
        is_available: !t.booked,
        is_ai_recommended: !!t.ai
      }));
    }

    async getAppointments() {
      if (this.mode === 'supabase') {
        try {
          const { data, error } = await this.supabaseClient
            .from('appointments')
            .select('*, providers(name, title, avatar_url, location)')
            .order('appointment_date', { ascending: true });
          if (!error && data && data.length > 0) {
            return data.map(apt => ({
              ...apt,
              provider_name: apt.providers ? apt.providers.name : apt.user_name,
              provider_title: apt.providers ? apt.providers.title : 'Specialist',
              provider_avatar: apt.providers ? apt.providers.avatar_url : DEFAULT_PROVIDERS[0].avatar_url
            }));
          }
        } catch (e) {}
      }
      return this.localDb.appointments;
    }

    async bookAppointment({
      providerId,
      slotId,
      userName = 'Demo User',
      userEmail = 'demo.user@slotwise.ai',
      serviceName,
      date,
      time,
      fee,
      isVirtual = false,
      notes = ''
    }) {
      const provider = await this.getProviderById(providerId);
      const meetingLink = isVirtual ? `https://meet.slotwise.ai/room/sec-${Math.random().toString(36).substring(2, 8)}` : null;

      // 1. If Supabase is connected, attempt RPC or table insert
      if (this.mode === 'supabase') {
        try {
          const { data, error } = await this.supabaseClient.from('appointments').insert([
            {
              provider_id: providerId,
              slot_id: slotId && slotId.startsWith('slot_') ? null : slotId,
              user_name: userName,
              user_email: userEmail,
              service_name: serviceName,
              appointment_date: date,
              appointment_time: time,
              fee: fee,
              status: 'confirmed',
              is_virtual: isVirtual,
              meeting_link: meetingLink,
              notes: notes
            }
          ]).select().single();

          if (!error && data) {
            // Also mark slot unavailable if real slot
            if (slotId && !slotId.startsWith('slot_')) {
              await this.supabaseClient.from('slots').update({ is_available: false }).eq('id', slotId);
            }
            this.notifyChange('appointment_created', data);
            return { success: true, appointment: data };
          }
        } catch (err) {
          console.warn('Supabase booking error, falling back to local DB:', err);
        }
      }

      // 2. Local DB persistence
      const newAppointment = {
        id: 'apt_' + Date.now(),
        provider_id: providerId,
        provider_name: provider.name,
        provider_title: provider.title,
        provider_avatar: provider.avatar_url,
        user_name: userName,
        user_email: userEmail,
        service_name: serviceName,
        appointment_date: date,
        appointment_time: time,
        fee: fee,
        status: 'confirmed',
        is_virtual: isVirtual,
        meeting_link: meetingLink,
        notes: notes || 'Booked via SlotWise AI Engine'
      };

      // Mark slot as booked in localDb
      const slot = this.localDb.slots.find(s => s.id === slotId || (s.provider_id === providerId && s.slot_date === date && s.start_time === time));
      if (slot) slot.is_available = false;

      this.localDb.appointments.unshift(newAppointment);
      this.persistLocalDb(this.localDb);

      this.notifyChange('appointment_created', newAppointment);
      return { success: true, appointment: newAppointment };
    }

    async cancelAppointment(appointmentId) {
      if (this.mode === 'supabase') {
        try {
          const { error } = await this.supabaseClient
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', appointmentId);
          if (!error) {
            this.notifyChange('appointment_cancelled', { id: appointmentId });
            return { success: true };
          }
        } catch (e) {}
      }

      const apt = this.localDb.appointments.find(a => a.id === appointmentId);
      if (apt) {
        apt.status = 'cancelled';
        this.persistLocalDb(this.localDb);
        this.notifyChange('appointment_cancelled', { id: appointmentId });
      }
      return { success: true };
    }

    async seedSupabaseWithInitialData() {
      if (!this.supabaseClient) {
        return { success: false, error: 'Supabase client is not connected' };
      }

      try {
        // Upsert Providers
        for (const p of DEFAULT_PROVIDERS) {
          await this.supabaseClient.from('providers').upsert({
            id: p.id,
            name: p.name,
            title: p.title,
            category: p.category,
            bio: p.bio,
            certifications: p.certifications,
            avatar_url: p.avatar_url,
            rating: p.rating,
            reviews_count: p.reviews_count,
            consultation_fee: p.consultation_fee,
            duration_minutes: p.duration_minutes,
            location: p.location,
            is_telehealth: p.is_telehealth,
            is_in_person: p.is_in_person,
            next_available_slot: p.next_available_slot
          });

          // Insert services
          if (p.services) {
            for (const s of p.services) {
              await this.supabaseClient.from('services').insert({
                provider_id: p.id,
                name: s.name,
                duration_minutes: s.duration,
                price: s.fee
              });
            }
          }
        }

        return { success: true, message: 'Successfully seeded 6 Providers & Services into your Supabase database!' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }

  // Export Singleton
  window.SlotWiseDB = new SlotWiseDatabaseService();
})(window);
