-- ═══════════════════════════════════════════════════════════
-- 🇸🇦 تحديث قاعدة البيانات لنظام حلول (Hulool System Upgrade)
-- ═══════════════════════════════════════════════════════════
-- يرجى نسخ هذا الكود وتشغيله في محرّر SQL الخاص بـ Supabase (SQL Editor)
-- لتفعيل ميزات المرحلة الأولى (التأمين الصحي) والمرحلة الثالثة (أسعار الخدمات الكاملة)
-- والمرحلة الحادية عشر والمرحلة الثانية عشر (داشبورد الحسابات والمصروفات)
-- ═══════════════════════════════════════════════════════════

-- 1. تحديث جدول الخدمات الطبية (clinic_services) لإضافة أسعار التأمين والخصومات
ALTER TABLE clinic_services ADD COLUMN IF NOT EXISTS insurance_price NUMERIC DEFAULT 0;
ALTER TABLE clinic_services ADD COLUMN IF NOT EXISTS discount_pct NUMERIC DEFAULT 0;

-- 2. تحديث جدول المرضى (patients) لربطهم بشركات التأمين وبوليصة التأمين
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_company TEXT DEFAULT NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_policy_no TEXT DEFAULT NULL;

-- 3. تحديث جدول المواعيد (appointments) لدعم ميزات التأجيل والإلغاء مع السبب من الطبيب
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reschedule_reason TEXT DEFAULT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT DEFAULT NULL;

-- 4. إنشاء جدول المصروفات (expenses) لدعم نظام الحسابات والمصروفات (المرحلة 12)
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

-- إتاحة صلاحيات القراءة والكتابة للأعمدة والجداول الجديدة
-- تضمن هذه التعديلات عدم وجود أي أخطاء عند إرسال البيانات من الواجهة الأمامية.
