-- ====================================================================
-- SlotWise AI Booking Platform - Supabase PostgreSQL Schema & Seed Data
-- Architecture: Cyber Obsidian Kinetic
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP TABLES (for clean re-run)
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS slots CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. PROFILES TABLE (App Users / Patients)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    full_name TEXT NOT NULL DEFAULT 'Demo User',
    email TEXT DEFAULT 'demo.user@slotwise.ai',
    phone TEXT DEFAULT '+1 (555) 019-2834',
    avatar_url TEXT DEFAULT 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuY0Ce_R5dzMZxLQf_Zkz1HLIaR_cPZKERW93_jLCV5QQVyOuQDCjFBtddKEmaDMGtHRvxsEUNcD0xHsn6vr1FnJZzHRuaElLybBoryj4VKpRwoNpemb69oLPx1Jyo-6g4uTgg5v0vY1JIfyT6CUUkQWknyN0L6_KT6xV4bh-jzjttQMkaZMZP2SWCGU2uWVuLhaesYcREfisPitX3VTmXjdXQJ8fATmCoEBfrN6M',
    preferred_mode TEXT DEFAULT 'in-person', -- 'in-person' or 'virtual'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROVIDERS TABLE
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'general_health', 'wellness', 'beauty', 'fitness', 'automotive'
    bio TEXT,
    certifications TEXT[],
    avatar_url TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 4.9,
    reviews_count INT DEFAULT 100,
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 45.00,
    duration_minutes INT DEFAULT 20,
    location TEXT DEFAULT 'Downtown Medical Arts Center',
    is_telehealth BOOLEAN DEFAULT TRUE,
    is_in_person BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT TRUE,
    next_available_slot TEXT DEFAULT 'Today 3:30 PM',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SERVICES TABLE
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 20,
    price NUMERIC(10, 2),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SLOTS TABLE
CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TEXT NOT NULL, -- e.g., '09:30 AM', '03:30 PM'
    time_period TEXT NOT NULL, -- 'morning', 'afternoon', 'evening'
    is_available BOOLEAN DEFAULT TRUE,
    is_ai_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. APPOINTMENTS TABLE
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT,
    service_name TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    fee NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'completed', 'cancelled'
    is_virtual BOOLEAN DEFAULT FALSE,
    meeting_link TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CHAT MESSAGES TABLE (AI Assistant history)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT DEFAULT 'default_session',
    sender TEXT NOT NULL, -- 'user' or 'ai'
    message TEXT NOT NULL,
    parsed_intent JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Anonymous & authenticated users can read providers, services, and slots
CREATE POLICY "Public Read Providers" ON providers FOR SELECT USING (true);
CREATE POLICY "Public Read Services" ON services FOR SELECT USING (true);
CREATE POLICY "Public Read Slots" ON slots FOR SELECT USING (true);
CREATE POLICY "Public Update Slots" ON slots FOR UPDATE USING (true) WITH CHECK (true);

-- Anonymous & authenticated users can read/insert/update appointments
CREATE POLICY "Public Read Appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Public Insert Appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Appointments" ON appointments FOR UPDATE USING (true) WITH CHECK (true);

-- Anonymous & authenticated users can read/insert profiles & chat
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public Insert Profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Profiles" ON profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Chat" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Public Insert Chat" ON chat_messages FOR INSERT WITH CHECK (true);

-- 10. ATOMIC SLOT BOOKING RPC FUNCTION
CREATE OR REPLACE FUNCTION book_appointment_slot(
    p_slot_id UUID,
    p_user_name TEXT,
    p_user_email TEXT,
    p_service_name TEXT,
    p_is_virtual BOOLEAN DEFAULT FALSE,
    p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slot RECORD;
    v_provider RECORD;
    v_appointment_id UUID;
    v_meeting_url TEXT := NULL;
BEGIN
    -- Check slot existence and availability
    SELECT * INTO v_slot FROM slots WHERE id = p_slot_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Slot not found');
    END IF;

    IF NOT v_slot.is_available THEN
        RETURN jsonb_build_object('success', false, 'error', 'Slot is already booked');
    END IF;

    -- Fetch provider
    SELECT * INTO v_provider FROM providers WHERE id = v_slot.provider_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Provider not found');
    END IF;

    -- Generate simulated encrypted HD video link if virtual
    IF p_is_virtual THEN
        v_meeting_url := 'https://meet.slotwise.ai/room/' || substring(encode(gen_random_bytes(6), 'hex') from 1 for 8);
    END IF;

    -- Mark slot booked
    UPDATE slots SET is_available = FALSE WHERE id = p_slot_id;

    -- Create appointment
    INSERT INTO appointments (
        provider_id,
        slot_id,
        user_name,
        user_email,
        service_name,
        appointment_date,
        appointment_time,
        fee,
        status,
        is_virtual,
        meeting_link,
        notes
    ) VALUES (
        v_provider.id,
        v_slot.id,
        p_user_name,
        p_user_email,
        p_service_name,
        v_slot.slot_date,
        v_slot.start_time,
        v_provider.consultation_fee,
        'confirmed',
        p_is_virtual,
        v_meeting_url,
        p_notes
    ) RETURNING id INTO v_appointment_id;

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'provider_name', v_provider.name,
        'date', v_slot.slot_date,
        'time', v_slot.start_time,
        'fee', v_provider.consultation_fee,
        'meeting_link', v_meeting_url
    );
END;
$$;

-- 11. SEED DATA INSERTION
-- Insert Default Profile
INSERT INTO profiles (full_name, email, phone)
VALUES ('Demo User', 'alex.mercer@slotwise.ai', '+1 (555) 432-8765');

-- Insert Providers
INSERT INTO providers (id, name, title, category, bio, certifications, avatar_url, rating, reviews_count, consultation_fee, duration_minutes, location, is_telehealth, is_in_person, next_available_slot)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Dr. Aarav Mehta, MD',
    'General Physician & Preventative Care',
    'general_health',
    'Board-certified in Internal Medicine with 11+ years of experience across acute primary care, preventative lifestyle medicine, and cardiometabolic wellness. Alumnus of Johns Hopkins Medicine.',
    ARRAY['ABIM Certified', 'Telehealth Accredited', 'English', 'Hindi'],
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDg7c10i3qLcso6l1OHSG3ZCFxiJFTMLDotGgH39tGcfzs34NSkonLUGPpn_HmKK7a4O9XcNc5IsUTO1GNpd6fJE56Npgvz-zVwWnXivyADcvf6w-b2NnbxCexGBrOyJZRKxye8Y0-5HFZ6yhrk1WICSApoQAEuXERWQmavMr4mtHdXDdER3qROb_twC85tx5sxAc6SFw7a4yZa-U9jXhc8SEwjJgjo3i4Ae3zJcUE',
    4.9,
    142,
    45.00,
    20,
    'Downtown Medical Arts, Suite 402',
    true,
    true,
    'Today 3:30 PM'
),
(
    '22222222-2222-2222-2222-222222222222',
    'Priya Nair',
    'Master Hair Stylist & Colorist',
    'beauty',
    'Award-winning hair designer specializing in organic balayage, dimensional coloring, precision cuts, and scalp wellness ceremonies. 10 years crafting aesthetic styles in Soho.',
    ARRAY['L’Oréal Master Colorist', 'Trichology Certified', 'Eco-Salon Partner'],
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBprtOciv_O6dCiZRr8MM1dDIsjZG0p6fR8Js4EqfSwu27xDiNadVTj0W6bDiii8nPEtYXq_iqHDicqZlM_GmJPrMujDe6kT6lwdzs-JKiRG4tVyFn3ITGRbUDm9I66t31AICtKGLeJIxvxmkr5A0rIRzRVCzPhze2giim3J9Ir_sMjNJ0bW6H-YXyIptCKildiRvHajr3uc9YdPWEiLc9p-RQbaiEW6db9j7eHjcg',
    4.8,
    89,
    90.00,
    45,
    'The Prism Hair Lounge, Soho',
    false,
    true,
    'Tomorrow 11:00 AM'
),
(
    '33333333-3333-3333-3333-333333333333',
    'Rohan Verma',
    'High Performance Fitness Coach',
    'fitness',
    'Certified Strength & Conditioning Specialist (CSCS) working with elite athletes and executives on metabolic conditioning, postural correction, and bio-optimized periodization.',
    ARRAY['NSCA-CSCS', 'Precision Nutrition L2', 'FMS Certified'],
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCnjRb2sAje2NncLEYBuWA_-xf8ozToglkScAEn4fXwQSpChbLGdQawfZIRgl2Qpo8_ZMDoX231KOewCBkwdpuicJ8SUq1XSqJXQ2dibv1nJpcvo3yXopdeYUCgUqiIMBOtvo7RJou4Fgr53kR6zJP31EFJsomyLSPt3UuxRd6BwY6VQ_iEMg33hPTqwph5T3bhjCJsEujVxE5BgTtoNx1OaxOcCpzNRZEBWfuof9Y',
    5.0,
    215,
    80.00,
    60,
    'Apex Performance Lab, Downtown & Virtual',
    true,
    true,
    'Today 5:00 PM'
),
(
    '44444444-4444-4444-4444-444444444444',
    'Sara Khan',
    'Mental Wellness Counselor',
    'wellness',
    'Licensed counselor focusing on cognitive behavioral therapy, burnout recovery, stress regulation, and holistic mindfulness. Safe, confidential encrypted virtual consultations.',
    ARRAY['LPC Licensed', 'CBT Practitioner', 'Mindfulness Teacher'],
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAwby2Ya8wdOV1Iwt1TUsFwpjFBgiNhYRbxUfz1HCZCFG2QiZZc6zLBl60eCWz-olQqD_6gQlJDwHP2c3jaHyHxmweiayoAtUjQJoK7h9cvL7sFNhraf-Gbfyhgj9PHpHckhWGIjkinfcRqLxOaVDtdSkl_3Qi3BglcUbEkt9-KrLaN_6iZRZAq7TjPtIxNSri9pKi2AIQyYKel4RdqXM8GZS_6eD8Io8Gh6OscgHM',
    4.9,
    98,
    110.00,
    50,
    'Encrypted HD Virtual Consult Suite',
    true,
    false,
    'Friday 2:00 PM'
),
(
    '55555555-5555-5555-5555-555555555555',
    'Kabir Singh',
    'Certified Master Mechanic',
    'automotive',
    'Master ASE-certified technician with diagnostic telemetry expertise across hybrid, EV, and high-performance European combustion platforms. Transparent digital inspections.',
    ARRAY['ASE Master Tech', 'EV High-Voltage Certified', 'Bosch Specialist'],
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDG-pUh-7LhjGtzIvsOSY_EqJsnD0-Ipmv3gopSDjST_KmkqPWgH_dAFGD2i9RXMMeD5qwfwgsCywbI0o4_E4kqF2PszkAKFDJsSfO0TVAemqtKhcXhYF_T06MxXiVNkK5NdUj5TcDBm07RHHcu2vuXNhEhDjFH3Un7bIv__ApVDfXZPJmqgKSsZ7JGZ1zGlorSFX-PoHr9xg3W0mkeI2OAxcByjq1pjWlPsNzaRZ0',
    4.7,
    76,
    55.00,
    30,
    'Precision Auto Bay 4, Westside',
    false,
    true,
    'Tomorrow 9:00 AM'
),
(
    '66666666-6666-6666-6666-666666666666',
    'Dr. Neha Sharma, MD',
    'Internal Medicine & Cardiometabolic Specialist',
    'general_health',
    'Specialist in cardiovascular wellness, endocrinology, and holistic primary health consultations with personalized preventative biometric screenings.',
    ARRAY['Board Certified', 'Cardio Fellow', 'Telehealth Certified'],
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBJscX8QUag3ZDavRul3Eevzp5B5wASxM5fy74QuclAXZbN5caj4Zgt1C41Ndv7Iv_mx0BAyUYEYWbdVwyHrhpBr5AGzheGwEorLs2qt0L5PfFoTyLY0zf5Ibj-iu_HevY-Yek1hfO_9fBVDCbM1eZ0K5kGRY65iJ_XyDY0zv5LfVQkaQMGTRN5v8H2gRPd6bnBTcR71x5AX-D2R3xiytpjx4NRxVPYM5TY2sXc1JA',
    4.8,
    94,
    50.00,
    30,
    'Metro Health Pavillion, East Wing',
    true,
    true,
    'Tomorrow 4:45 PM'
);

-- Insert Services for Dr. Aarav Mehta
INSERT INTO services (provider_id, name, duration_minutes, price, description)
VALUES
('11111111-1111-1111-1111-111111111111', 'Routine Health Checkup', 20, 45.00, 'Comprehensive annual or urgent health assessment and vitals check.'),
('11111111-1111-1111-1111-111111111111', 'Prescription Renewal', 15, 30.00, 'Review ongoing medication regime and issue electronic prescriptions.'),
('11111111-1111-1111-1111-111111111111', 'Lab Results Review', 20, 40.00, 'Detailed physician consultation on recent bloodwork and diagnostic panels.');

-- Insert Slots for Dr. Aarav Mehta (Current dates)
INSERT INTO slots (provider_id, slot_date, start_time, time_period, is_available, is_ai_recommended)
VALUES
('11111111-1111-1111-1111-111111111111', CURRENT_DATE, '09:30 AM', 'morning', true, false),
('11111111-1111-1111-1111-111111111111', CURRENT_DATE, '10:15 AM', 'morning', false, false),
('11111111-1111-1111-1111-111111111111', CURRENT_DATE, '11:00 AM', 'morning', true, false),
('11111111-1111-1111-1111-111111111111', CURRENT_DATE, '02:00 PM', 'afternoon', true, false),
('11111111-1111-1111-1111-111111111111', CURRENT_DATE, '03:30 PM', 'afternoon', true, true),
('11111111-1111-1111-1111-111111111111', CURRENT_DATE, '04:15 PM', 'afternoon', false, false),
('11111111-1111-1111-1111-111111111111', CURRENT_DATE, '05:30 PM', 'evening', true, false),
('11111111-1111-1111-1111-111111111111', CURRENT_DATE, '06:15 PM', 'evening', true, false),
-- Tomorrow slots
('11111111-1111-1111-1111-111111111111', CURRENT_DATE + 1, '10:00 AM', 'morning', true, false),
('11111111-1111-1111-1111-111111111111', CURRENT_DATE + 1, '03:30 PM', 'afternoon', true, true),
('11111111-1111-1111-1111-111111111111', CURRENT_DATE + 1, '04:45 PM', 'afternoon', true, false);

-- Insert Slots for Dr. Neha Sharma
INSERT INTO slots (provider_id, slot_date, start_time, time_period, is_available, is_ai_recommended)
VALUES
('66666666-6666-6666-6666-666666666666', CURRENT_DATE + 1, '04:45 PM', 'afternoon', true, true);

-- Insert Slots for Priya Nair
INSERT INTO slots (provider_id, slot_date, start_time, time_period, is_available, is_ai_recommended)
VALUES
('22222222-2222-2222-2222-222222222222', CURRENT_DATE + 1, '11:00 AM', 'morning', true, true),
('22222222-2222-2222-2222-222222222222', CURRENT_DATE + 1, '02:30 PM', 'afternoon', true, false);

-- Insert Initial Bookings (for Demo User)
INSERT INTO appointments (provider_id, user_name, user_email, service_name, appointment_date, appointment_time, fee, status, is_virtual, meeting_link, notes)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Demo User',
    'alex.mercer@slotwise.ai',
    'Routine Health Checkup',
    CURRENT_DATE + 1,
    '03:30 PM',
    45.00,
    'confirmed',
    false,
    NULL,
    'Annual wellness examination and biometric check.'
),
(
    '44444444-4444-4444-4444-444444444444',
    'Demo User',
    'alex.mercer@slotwise.ai',
    'Cognitive Stress Consultation',
    CURRENT_DATE + 3,
    '02:00 PM',
    110.00,
    'confirmed',
    true,
    'https://meet.slotwise.ai/room/mind-sec-941',
    'Virtual consult on work-life stress regulation.'
);

-- ====================================================================
-- End of SlotWise Supabase Schema
-- ====================================================================
