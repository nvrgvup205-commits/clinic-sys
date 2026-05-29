-- ═══════════════════════════════════════════════════════════════════════════
-- نظام حُلول Hulool - ترقية قاعدة البيانات (آمن - يضيف الناقص فقط)
-- ═══════════════════════════════════════════════════════════════════════════
-- تعليمات:
-- 1. افتح Supabase → SQL Editor
-- 2. انسخ كل هذا الكود والصقه
-- 3. اضغط Run
-- 4. لو ظهرت رسالة Success يعني تمام، لو فيه خطأ راسلني
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. إضافة عمود is_active لجدول admin_users (لو مش موجود)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. إضافة أعمدة بدء وانتهاء الكشف في جدول المواعيد
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_started_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_completed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS paid_by UUID DEFAULT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. جدول طلبات الدفع (payment_requests) - من الدكتور للاستقبال
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    service_id UUID REFERENCES clinic_services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    requested_by UUID NOT NULL,
    paid_by UUID DEFAULT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. جدول جلسات الدوام (work_sessions) - لكل الموظفين والأطباء
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS work_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL CHECK (user_type IN ('admin_user', 'doctor')),
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clock_out TIMESTAMPTZ DEFAULT NULL,
    total_minutes INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'break', 'closed')),
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. جدول الفواتير (invoices) - لو مش موجود
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    invoice_no TEXT NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    receptionist_id UUID DEFAULT NULL,
    receptionist_name TEXT DEFAULT NULL,
    services JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) DEFAULT 0,
    discount NUMERIC(10,2) DEFAULT 0,
    tax NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    paid_amount NUMERIC(10,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'insurance')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    insurance_company TEXT DEFAULT NULL,
    insurance_approval_no TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. جدول المدفوعات (payments) - لو مش موجود
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'insurance')),
    received_by UUID DEFAULT NULL,
    received_by_name TEXT DEFAULT NULL,
    payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('completed', 'refunded', 'partial_refund')),
    refund_amount NUMERIC(10,2) DEFAULT 0,
    refund_reason TEXT DEFAULT NULL,
    refunded_by UUID DEFAULT NULL,
    refunded_at TIMESTAMPTZ DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. دالة توليد رقم الفاتورة التلقائي
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION generate_invoice_no(p_clinic_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_count INTEGER;
    v_year TEXT;
    v_invoice_no TEXT;
BEGIN
    v_year := TO_CHAR(NOW(), 'YY');
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM invoices
    WHERE clinic_id = p_clinic_id
    AND created_at >= DATE_TRUNC('year', NOW());
    
    v_invoice_no := 'INV-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
    
    RETURN v_invoice_no;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. أعمدة إضافية للعيادات (تفعيل الموديولات)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS reception_enabled BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS accounting_enabled BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS doctor_portal_enabled BOOLEAN DEFAULT true;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. Indexes للأداء (مهم جداً لـ 100 عيادة)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments(clinic_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_status ON appointments(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_paid_at ON appointments(paid_at);

CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id);

CREATE INDEX IF NOT EXISTS idx_doctors_clinic ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_username ON doctors(username);

CREATE INDEX IF NOT EXISTS idx_medical_records_clinic ON medical_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment ON medical_records(appointment_id);

CREATE INDEX IF NOT EXISTS idx_payment_requests_clinic ON payment_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_doctor ON payment_requests(doctor_id);

CREATE INDEX IF NOT EXISTS idx_work_sessions_clinic ON work_sessions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_user ON work_sessions(user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_status ON work_sessions(clinic_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_clinic ON invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);

CREATE INDEX IF NOT EXISTS idx_payments_clinic ON payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);

CREATE INDEX IF NOT EXISTS idx_expenses_clinic ON expenses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(clinic_id, date);

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. تفعيل Realtime على الجداول المهمة
-- ═══════════════════════════════════════════════════════════════════════════
-- ملاحظة: لو ظهر خطأ "already exists" تجاهله، يعني الجدول مفعّل من قبل

ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE work_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE medical_records;
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. RLS Policies (صلاحيات - مفتوحة للتجربة، شدّدها للإنتاج)
-- ═══════════════════════════════════════════════════════════════════════════

-- payment_requests
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all payment_requests" ON payment_requests;
CREATE POLICY "Allow all payment_requests" ON payment_requests FOR ALL USING (true) WITH CHECK (true);

-- work_sessions
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all work_sessions" ON work_sessions;
CREATE POLICY "Allow all work_sessions" ON work_sessions FOR ALL USING (true) WITH CHECK (true);

-- invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all invoices" ON invoices;
CREATE POLICY "Allow all invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all payments" ON payments;
CREATE POLICY "Allow all payments" ON payments FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- تم بنجاح! 
-- ═══════════════════════════════════════════════════════════════════════════
