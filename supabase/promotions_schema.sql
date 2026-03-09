-- ==============================================
-- TICKETSHIELD: Promotions Table
-- ==============================================

CREATE TABLE public.promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title_vi TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_vi TEXT NOT NULL,
    description_en TEXT NOT NULL,
    discount TEXT NOT NULL,
    gradient_code TEXT DEFAULT 'from-pink-600 to-purple-800',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Public Read Access for Active Promotions
CREATE POLICY "Public Read Active Promotions"
ON public.promotions FOR SELECT
USING (active = true);

-- Seed Data
INSERT INTO public.promotions (title_vi, title_en, description_vi, description_en, discount, gradient_code) VALUES
(
    'Vé Tết Nguyên Đán V-League',
    'Lunar New Year V-League Tickets',
    'Nhập mã TETCYBER để giảm ngay 20% khi mua vé các trận đấu vào dịp Tết.',
    'Enter code TETCYBER to get 20% off on all match tickets during Lunar New Year.',
    '-20%',
    'from-pink-600 to-purple-800'
),
(
    'Combo Gia Đình / Nhóm',
    'Family / Group Combo',
    'Mua từ 4 vé trở lên cho khán đài VIP, tự động nâng cấp bảo mật sinh trắc học miễn phí.',
    'Buy 4+ tickets for VIP stands and get a free biometric security upgrade.',
    'FREE UPGRADE',
    'from-cyan-600 to-blue-800'
),
(
    'Early Bird Đội Tuyển QG',
    'National Team Early Bird',
    'Mở bán sớm trước 30 ngày cho thành viên hạng Platinum. Mã PLATINUM30.',
    'Early access 30 days before for Platinum members. Code: PLATINUM30.',
    '-10%',
    'from-orange-500 to-red-700'
);
