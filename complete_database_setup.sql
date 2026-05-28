-- ═══════════════════════════════════════════════════════════
-- 🇸🇦 نظام حُلول (Hulool) - الإعداد الكامل لقاعدة البيانات
-- ═══════════════════════════════════════════════════════════
-- قم بإنشاء استعلام جديد (New Query) في SQL Editor الخاص بـ Supabase
-- وقم بلصق الكود بالكامل ثم اضغط على Run لتجهيز النظام في دقيقة واحدة!
-- ═══════════════════════════════════════════════════════════

-- 1. جدول العيادات (clinics)
CREATE TABLE IF NOT EXISTS clinics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#0EA5E9',
    working_days TEXT[] DEFAULT ARRAY['sat', 'sun', 'mon', 'tue', 'wed', 'thu'],
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '21:00',
    subscription_status TEXT DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
    about TEXT,
    gallery TEXT[] DEFAULT '{}',
    social_links JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول مستخدمي الإدارة والأدمن (admin_users)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'clinic_admin' CHECK (role IN ('super_admin', 'clinic_admin', 'owner', 'accountant', 'receptionist')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول الأطباء (doctors)
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialization TEXT,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    username TEXT UNIQUE,
    password TEXT DEFAULT '123456',
    available_days TEXT[] DEFAULT ARRAY['sat', 'sun', 'mon', 'tue', 'wed'],
    time_per_slot INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول مواعيد عمل الأطباء (doctor_schedules)
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true
);

-- 5. جدول المرضى (patients)
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    national_id TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    blood_type TEXT,
    allergies TEXT,
    medical_notes TEXT,
    avatar_url TEXT,
    password TEXT DEFAULT '123456',
    insurance_company TEXT DEFAULT NULL,
    insurance_policy_no TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول المواعيد (appointments)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    type TEXT DEFAULT 'first_visit' CHECK (type IN ('first_visit', 'emergency', 'follow_up', 'consultation')),
    notes TEXT,
    reschedule_reason TEXT DEFAULT NULL,
    cancellation_reason TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. جدول الخدمات الطبية للعيادة (clinic_services)
CREATE TABLE IF NOT EXISTS clinic_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    insurance_price NUMERIC DEFAULT 0,
    discount_pct NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'SAR',
    duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. جدول السجلات الطبية والفواتير (medical_records)
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    diagnosis TEXT,
    treatment TEXT,
    prescription TEXT,
    next_visit_notes TEXT,
    private_notes TEXT,
    services_provided JSONB DEFAULT '[]'::jsonb,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
    xray_images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. جدول المصروفات التشغيلية (expenses)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('salaries', 'rent', 'supplies', 'maintenance', 'marketing', 'utilities', 'other')),
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved')),
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. جدول الشكاوى والاستفسارات (complaints)
CREATE TABLE IF NOT EXISTS complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
    response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 🎉 بيانات تجريبية جاهزة للبدء والتشغيل الفوري (Seed Data)
-- ═══════════════════════════════════════════════════════════

-- 1. إضافة عيادة تجريبية افتراضية
INSERT INTO clinics (id, name, slug, address, phone, whatsapp, email, about, is_active)
VALUES (
    'f89ac133-aee8-4501-97dd-c0826f4a319a', 
    'عيادات الثقة الطبية الشاملة', 
    'theqah', 
    'الرياض - حي الياسمين - طريق الملك عبدالعزيز', 
    '0500000001', 
    '966500000001', 
    'info@theqah.com', 
    'مركز طبي شامل لتقديم أفضل خدمات طب الأسنان والجلدية والأطفال بأحدث التقنيات وأعلى معايير الجودة العالمية.', 
    true
) ON CONFLICT (slug) DO NOTHING;

-- 2. إضافة مستخدم أدمن للعيادة (الدخول بـ: admin و كلمة المرور: 123456)
INSERT INTO admin_users (clinic_id, username, password, full_name, role)
VALUES (
    'f89ac133-aee8-4501-97dd-c0826f4a319a', 
    'admin', 
    '123456', 
    'د. عبدالملك الشمري', 
    'clinic_admin'
) ON CONFLICT DO NOTHING;

-- 3. إضافة دكتور تجريبي (الدخول بـ: doctor و كلمة المرور: 123456)
INSERT INTO doctors (id, clinic_id, name, specialization, phone, email, username, password, available_days)
VALUES (
    'a76bc080-b41d-4f85-9396-f0a9e086964a',
    'f89ac133-aee8-4501-97dd-c0826f4a319a',
    'د. رائد الحربي',
    'استشاري طب وجراحة الفم والأسنان',
    '0500000002',
    'raed@theqah.com',
    'doctor',
    '123456',
    ARRAY['sat', 'sun', 'mon', 'tue', 'wed', 'thu']
) ON CONFLICT (username) DO NOTHING;

-- 4. إضافة مريض تجريبي (الدخول بـ: 0555555555 و كلمة المرور: 123456)
INSERT INTO patients (id, clinic_id, name, phone, national_id, date_of_birth, gender, password, insurance_company, insurance_policy_no)
VALUES (
    'f788bb46-e164-45a9-ae77-0919eacbcde4',
    'f89ac133-aee8-4501-97dd-c0826f4a319a',
    'خالد بن عبدالله',
    '0555555555',
    '1098765432',
    '1995-08-15',
    'male',
    '123456',
    'بوبا العربية',
    'BUPA-998822'
) ON CONFLICT DO NOTHING;

-- 5. إضافة خدمات طبية افتراضية مع أسعار تأمين وخصومات
INSERT INTO clinic_services (clinic_id, name, description, price, insurance_price, discount_pct)
VALUES 
('f89ac133-aee8-4501-97dd-c0826f4a319a', 'كشف عام واستشارة', 'تشخيص شامل للأسنان مع تصوير أشعة رقمية مجانية كشف أول مرة', 150.0, 100.0, 10.0),
('f89ac133-aee8-4501-97dd-c0826f4a319a', 'تنظيف الأسنان وإزالة الجير', 'تنظيف وتلميع الأسنان باستخدام أحدث أجهزة الموجات فوق الصوتية', 250.0, 180.0, 15.0),
('f89ac133-aee8-4501-97dd-c0826f4a319a', 'حشو تجميلي ضوئي (كومبوزيت)', 'حشو الأسنان بمواد تجميلية مطابقة للون السن الطبيعي بصلابة عالية', 350.0, 280.0, 0.0),
('f89ac133-aee8-4501-97dd-c0826f4a319a', 'علاج عصب السن وجذوره (جلسة واحدة)', 'سحب العصب وتنظيف وحشو قنوات الجذور بأحدث الأجهزة الرقمية', 800.0, 600.0, 5.0)
ON CONFLICT DO NOTHING;
