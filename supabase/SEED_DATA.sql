-- ============================================================================
-- OZO / IA Skin Care - Seed Current Website Data into Supabase
-- ============================================================================
-- This script seeds the hardcoded website data from lib/site.ts into Supabase
-- Run this in Supabase SQL Editor to populate tables
-- ============================================================================

-- ============================================================================
-- SEED TREATMENTS
-- ============================================================================

-- Keep the live catalog limited to the approved treatment/kit pricing.
UPDATE treatments
SET active = false,
    is_active = false,
    deleted_at = COALESCE(deleted_at, NOW()),
    updated_at = NOW()
WHERE slug NOT IN (
  'advance-kit',
  'japanese-kit',
  'korean-glass-kit',
  'basic-kit',
  'korean-glass-treatment'
);

INSERT INTO treatments (
  title, slug, kit_name, subtitle, description, overview, price, price_label, unit,
  tagline, type, treatment_type, image, image_alt, duration, sessions,
  badge, icon, tone, active, featured, requires_slots,
  benefits, process, who_for, safety, faqs, available_cities,
  cta_text, created_at, updated_at
) VALUES
(
  'Advance Kit', 'advance-kit', 'Advance Kit', 'Advanced Home Kit',
  'A premium advanced skincare kit designed for guided home-care transformation.',
  'A complete advanced home-care kit with premium clinical-grade products and support.',
  18000, '₹18,000', 'complete kit', 'Advanced Home Kit', 'home_kit', 'home-kit',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80',
  'Advance skincare kit', '4-6 weeks', 'Complete kit program', 'Premium Kit', 'award', 'primaryDark', true, true, false,
  to_jsonb(ARRAY['Advanced skin repair', 'Pigmentation support', 'Premium guided home care', 'Visible radiance']::text[]),
  '[]'::jsonb,
  to_jsonb(ARRAY['Advanced home-care clients', 'Pigmentation and repair focused users']::text[]),
  'Doctor-guided and patch-tested for responsible home use.', '[]'::jsonb, to_jsonb(ARRAY['All India']::text[]),
  'Book Advance Kit', NOW(), NOW()
),
(
  'Japanese Kit', 'japanese-kit', 'Japanese Kit', 'Japanese Ritual Kit',
  'A refined Japanese-inspired skincare kit for calm, clear, porcelain-like radiance.',
  'A luxury home-care kit inspired by Japanese skincare rituals and gentle refinement.',
  22000, '₹22,000', 'complete kit', 'Japanese Ritual Kit', 'home_kit', 'home-kit',
  'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1400&q=80',
  'Japanese skincare kit', '4-6 weeks', 'Complete kit program', 'Japanese Care', 'sparkle', 'light', true, false, false,
  to_jsonb(ARRAY['Texture refinement', 'Calm clear skin', 'Balanced glow', 'Gentle home ritual']::text[]),
  '[]'::jsonb,
  to_jsonb(ARRAY['Sensitive skin', 'Texture refinement', 'Refined glow seekers']::text[]),
  'Gentle, guided, and suitable for premium home-care routines.', '[]'::jsonb, to_jsonb(ARRAY['All India']::text[]),
  'Book Japanese Kit', NOW(), NOW()
),
(
  'Korean Glass Kit', 'korean-glass-kit', 'Korean Glass Kit', 'Glass Glow Home Kit',
  'A Korean glass-skin inspired home kit for hydrated, luminous, dewy skin.',
  'A complete Korean-inspired home-care kit for dewy hydration and everyday radiance.',
  15000, '₹15,000', 'complete kit', 'Glass Glow Home Kit', 'home_kit', 'home-kit',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80',
  'Korean glass skincare kit', '4-6 weeks', 'Complete kit program', 'Glass Kit', 'sparkle', 'accent', true, true, false,
  to_jsonb(ARRAY['Glass-skin glow', 'Hydration support', 'Dewy finish', 'K-beauty inspired care']::text[]),
  '[]'::jsonb,
  to_jsonb(ARRAY['Dull skin', 'Hydration seekers', 'K-beauty glow lovers']::text[]),
  'Patch-tested, guided home care for visible glow.', '[]'::jsonb, to_jsonb(ARRAY['All India']::text[]),
  'Book Korean Glass Kit', NOW(), NOW()
),
(
  'Basic Kit', 'basic-kit', 'Basic Kit', 'Essential Skin Kit',
  'An essential skincare kit for foundational cleansing, hydration, and glow maintenance.',
  'A premium starter kit for healthy skin routines and visible daily freshness.',
  14000, '₹14,000', 'complete kit', 'Essential Skin Kit', 'home_kit', 'home-kit',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80',
  'Basic skincare kit', '4-6 weeks', 'Complete kit program', 'Essential', 'droplet', 'primary', true, false, false,
  to_jsonb(ARRAY['Beginner friendly', 'Glow maintenance', 'Hydration and cleansing', 'All-skin support']::text[]),
  '[]'::jsonb,
  to_jsonb(ARRAY['First-time skincare clients', 'Maintenance care', 'All skin types']::text[]),
  'Gentle, simple, and designed for guided everyday use.', '[]'::jsonb, to_jsonb(ARRAY['All India']::text[]),
  'Book Basic Kit', NOW(), NOW()
),
(
  'Korean Glass Treatment', 'korean-glass-treatment', 'Korean Glass Treatment', 'Premium Clinical Glow Experience',
  'A premium Korean glass-skin clinical treatment for luminous, dewy, event-ready radiance.',
  'A doctor-supervised premium protocol focused on hydration, refinement, and the signature glass-skin finish.',
  25000, '₹25,000', 'per session', 'Premium Clinical Glow Experience', 'clinic', 'camp',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80',
  'Korean Glass Treatment', '75-90 min', 'Event-based sessions', 'Premium', 'sparkle', 'accent', true, true, true,
  to_jsonb(ARRAY['Deep hydration glow', 'Glass skin finish', 'Skin texture refinement', 'Premium clinical care']::text[]),
  '[]'::jsonb,
  to_jsonb(ARRAY['Pre-event glow seekers', 'Dry or dull skin', 'Premium clinical care clients']::text[]),
  'Doctor-supervised and delivered in premium clinical settings.', '[]'::jsonb, to_jsonb(ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Ahmedabad']::text[]),
  'Book Korean Glass Treatment', NOW(), NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  kit_name = EXCLUDED.kit_name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  overview = EXCLUDED.overview,
  price = EXCLUDED.price,
  price_label = EXCLUDED.price_label,
  unit = EXCLUDED.unit,
  tagline = EXCLUDED.tagline,
  type = EXCLUDED.type,
  treatment_type = EXCLUDED.treatment_type,
  image = EXCLUDED.image,
  image_alt = EXCLUDED.image_alt,
  duration = EXCLUDED.duration,
  sessions = EXCLUDED.sessions,
  badge = EXCLUDED.badge,
  icon = EXCLUDED.icon,
  tone = EXCLUDED.tone,
  active = TRUE,
  featured = EXCLUDED.featured,
  requires_slots = EXCLUDED.requires_slots,
  benefits = EXCLUDED.benefits,
  process = EXCLUDED.process,
  who_for = EXCLUDED.who_for,
  safety = EXCLUDED.safety,
  faqs = EXCLUDED.faqs,
  available_cities = EXCLUDED.available_cities,
  cta_text = EXCLUDED.cta_text,
  updated_at = NOW();
-- ============================================================================
-- SEED TESTIMONIALS
-- ============================================================================

-- Clear existing testimonials
DELETE FROM testimonials;

INSERT INTO testimonials (
  name, city, treatment, quote, rating, is_active, created_at, updated_at
) VALUES
(
  'Priya S.',
  'Ahmedabad',
  'Korean Glass Treatment',
  'My skin has never looked this smooth. The team is professional and the results showed from the second session itself.',
  5,
  true,
  NOW(),
  NOW()
),
(
  'Riya M.',
  'Surat',
  'Advance Kit',
  'Pigmentation support has been so much easier with the guided Advance Kit. Highly recommend IA Skin Care.',
  5,
  true,
  NOW(),
  NOW()
),
(
  'Aarti K.',
  'Vadodara',
  'Korean Glass Kit',
  'Premium experience from consultation to aftercare. Clean clinic, genuine advice, no upselling. Loved the glow!',
  5,
  true,
  NOW(),
  NOW()
),
(
  'Neha P.',
  'Mumbai',
  'Japanese Kit',
  'The Japanese Kit gave me a calm, refined routine I could actually follow. The texture improvement is incredible.',
  5,
  true,
  NOW(),
  NOW()
),
(
  'Sneha R.',
  'Delhi',
  'Korean Glass Treatment',
  'After years of trying everything, this premium treatment finally gave me a visible event-ready glow. Worth every rupee.',
  5,
  true,
  NOW(),
  NOW()
),
(
  'Divya S.',
  'Bangalore',
  'Basic Kit',
  'The Basic Kit was so convenient. Got a simple guided skincare routine without visiting the clinic.',
  5,
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- SEED FAQs
-- ============================================================================

-- Clear existing FAQs
DELETE FROM faqs;

INSERT INTO faqs (
  question, answer, category, display_order, is_active, created_at, updated_at
) VALUES
(
  'How do I book a consultation?',
  'Click any Book Now or Book Consultation button on this page to open our secure booking form. Our team confirms your slot on WhatsApp within a few hours.',
  'general',
  1,
  true,
  NOW(),
  NOW()
),
(
  'Are the treatments safe for Indian skin?',
  'Yes. All our protocols are doctor-supervised and tailored to Indian skin types using clinical-grade, certified products.',
  'safety',
  2,
  true,
  NOW(),
  NOW()
),
(
  'When will I see results?',
  'Most clients notice visible improvement after 2 sessions. For best results we recommend the full course suggested during your consultation.',
  'results',
  3,
  true,
  NOW(),
  NOW()
),
(
  'Can I pay online?',
  'Online payment via Razorpay / Cashfree is being integrated. For now, our team will share a secure payment link after your booking is confirmed.',
  'payment',
  4,
  true,
  NOW(),
  NOW()
),
(
  'What is the OZO Referral Membership?',
  'A ₹1,199 optional membership that unlocks commissions when you refer clients for IA Skin Care treatments. It is completely optional — you don''t need it to book a treatment.',
  'membership',
  5,
  true,
  NOW(),
  NOW()
),
(
  'Do I have to buy a membership to take a treatment?',
  'No. Treatments are open to everyone. Membership is only for people who want to earn commission by referring others.',
  'membership',
  6,
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- SEED CONTACT SETTINGS
-- ============================================================================

-- Clear existing contact settings
DELETE FROM contact_settings;

INSERT INTO contact_settings (
  phone, whatsapp, email, address, business_hours, 
  facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url,
  created_at, updated_at
) VALUES
(
  '+91 76986 17054',
  'https://wa.me/917698617054?text=Hello%20IA%20Skin%20Care%2C%20I%20want%20to%20book%20a%20skincare%20consultation.',
  'contact@ia-skincare.com',
  'OZO Group, IA Skin Care Division, Ahmedabad, Gujarat',
  'Mon - Sat: 10:00 AM - 7:00 PM',
  'https://www.facebook.com/ia-skincare',
  'https://www.instagram.com/ia_korean_gloh_tretment?igsh=bmZqOHc0bnU5OW95',
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- ============================================================================
-- SEED SITE CONTENT (Home Hero)
-- ============================================================================

-- Clear existing site content
DELETE FROM site_content;

INSERT INTO site_content (section, key_name, value, value_type, display_order, created_at, updated_at) VALUES
-- Home Hero
('home_hero', 'hero_title', 'Transform Your Skin with Korean Beauty Science', 'text', 1, NOW(), NOW()),
('home_hero', 'hero_subtitle', 'Premium clinical skincare treatments designed for visible, lasting results', 'text', 2, NOW(), NOW()),
('home_hero', 'hero_description', 'Experience doctor-supervised Korean and Japanese skincare protocols at OZO / IA Skin Care. From glass skin treatments to advanced clinical transformations, we deliver premium results with safety and care.', 'text', 3, NOW(), NOW()),
('home_hero', 'hero_image', 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80', 'image_url', 4, NOW(), NOW()),
('home_hero', 'primary_button_text', 'Book Free Consultation', 'text', 5, NOW(), NOW()),
('home_hero', 'primary_button_link', '/contact', 'text', 6, NOW(), NOW()),
('home_hero', 'secondary_button_text', 'View All Treatments', 'text', 7, NOW(), NOW()),
('home_hero', 'secondary_button_link', '/treatments', 'text', 8, NOW(), NOW()),

-- Home Sections
('home_treatment', 'treatment_heading', 'Our Premium Treatments', 'text', 9, NOW(), NOW()),
('home_treatment', 'treatment_description', 'Choose between premium home treatment programs or exclusive clinical experiences designed for visible, lasting results.', 'text', 10, NOW(), NOW()),

('home_membership', 'membership_heading', 'Referral Membership Program', 'text', 11, NOW(), NOW()),
('home_membership', 'membership_description', 'Earn commissions by referring clients. Join our partner network and build a sustainable income stream.', 'text', 12, NOW(), NOW()),

('home_referral', 'referral_heading', 'Grow with OZO', 'text', 13, NOW(), NOW()),
('home_referral', 'referral_description', 'Join our referral program and earn attractive commissions while helping others discover premium skincare.', 'text', 14, NOW(), NOW()),

-- About Page
('about', 'about_title', 'About OZO / IA Skin Care', 'text', 15, NOW(), NOW()),
('about', 'about_description', 'OZO Group brings you IA Skin Care — a premium skincare division dedicated to delivering doctor-supervised Korean and Japanese skincare treatments. Our mission is to make clinical-grade skincare accessible, safe, and effective for everyone.', 'text', 16, NOW(), NOW()),
('about', 'about_mission', 'To democratize premium skincare by making clinical-grade treatments accessible to everyone, delivered with safety, expertise, and genuine care.', 'text', 17, NOW(), NOW()),
('about', 'about_vision', 'To become India''s most trusted skincare destination, known for visible results, ethical practices, and customer-centric care.', 'text', 18, NOW(), NOW()),
('about', 'about_image', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80', 'image_url', 19, NOW(), NOW());

-- ============================================================================
-- SEED COMMISSION SETTINGS
-- ============================================================================

-- Clear existing commission settings
DELETE FROM commission_settings;

INSERT INTO commission_settings (
  level_1_percentage, level_2_percentage, level_3_percentage, level_4_percentage,
  is_active, created_at, updated_at
) VALUES
(
  6.0,
  3.0,
  1.7,
  1.2,
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- SEED SYSTEM SETTINGS
-- ============================================================================

-- Clear existing system settings
DELETE FROM system_settings;

INSERT INTO system_settings (
  maintenance_mode, payouts_enabled, commissions_enabled, bookings_enabled, membership_enabled,
  created_at, updated_at
) VALUES
(
  false,
  true,
  true,
  true,
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- SEED BOOKINGS
-- ============================================================================

-- Clear existing bookings
DELETE FROM bookings;

INSERT INTO bookings (
  name, email, phone, treatment_name, treatment_id, date, time, 
  total_amount, status, notes, created_at, updated_at
) VALUES
(
  'Anjali Patel',
  'anjali.patel@email.com',
  '+91 98765 43210',
  'Korean Glass Treatment',
  (SELECT id FROM treatments WHERE slug = 'korean-glass-treatment' LIMIT 1),
  '2026-05-20',
  '14:00',
  25000,
  'confirmed',
  'First-time client, interested in glass skin treatment',
  NOW(),
  NOW()
),
(
  'Meera Sharma',
  'meera.sharma@email.com',
  '+91 87654 32109',
  'Advance Kit',
  (SELECT id FROM treatments WHERE slug = 'advance-kit' LIMIT 1),
  '2026-05-22',
  '11:00',
  18000,
  'confirmed',
  'Has pigmentation concerns, wants home kit program',
  NOW(),
  NOW()
),
(
  'Priya Desai',
  'priya.desai@email.com',
  '+91 76543 21098',
  'Japanese Kit',
  (SELECT id FROM treatments WHERE slug = 'japanese-kit' LIMIT 1),
  '2026-05-25',
  '16:00',
  22000,
  'new',
  'Referred by existing partner, wants consultation first',
  NOW(),
  NOW()
);

-- ============================================================================
-- SEED PARTNERS
-- ============================================================================

-- Clear existing partners
DELETE FROM partners;

INSERT INTO partners (
  user_id, referral_code, full_name, email, phone, city, status,
  membership_status, total_referrals, total_earnings, created_at, updated_at
) VALUES
(
  'partner-user-1',
  'OZO1001',
  'Kavita Mehta',
  'kavita.mehta@email.com',
  '+91 99887 76655',
  'Mumbai',
  'active',
  'approved',
  5,
  75000,
  NOW(),
  NOW()
),
(
  'partner-user-2',
  'OZO1002',
  'Neha Joshi',
  'neha.joshi@email.com',
  '+91 88776 65544',
  'Ahmedabad',
  'active',
  'approved',
  3,
  45000,
  NOW(),
  NOW()
),
(
  'partner-user-3',
  'OZO1003',
  'Sunita Agarwal',
  'sunita.agarwal@email.com',
  '+91 77665 54433',
  'Bangalore',
  'active',
  'approved',
  8,
  120000,
  NOW(),
  NOW()
);

-- ============================================================================
-- SEED COMMISSIONS
-- ============================================================================

-- Clear existing commissions
DELETE FROM commissions;

INSERT INTO commissions (
  partner_id, booking_id, commission_amount, level, source, status,
  created_at, updated_at
) VALUES
(
  (SELECT id FROM partners WHERE referral_code = 'OZO1001' LIMIT 1),
  (SELECT id FROM bookings WHERE name = 'Anjali Patel' LIMIT 1),
  1500,
  1,
  'Treatment booking',
  'paid',
  NOW(),
  NOW()
),
(
  (SELECT id FROM partners WHERE referral_code = 'OZO1001' LIMIT 1),
  NULL,
  1080,
  2,
  'Level 2 referral',
  'paid',
  NOW(),
  NOW()
),
(
  (SELECT id FROM partners WHERE referral_code = 'OZO1002' LIMIT 1),
  (SELECT id FROM bookings WHERE name = 'Meera Sharma' LIMIT 1),
  1080,
  1,
  'Treatment booking',
  'paid',
  NOW(),
  NOW()
),
(
  (SELECT id FROM partners WHERE referral_code = 'OZO1003' LIMIT 1),
  NULL,
  1320,
  1,
  'Treatment booking',
  'paid',
  NOW(),
  NOW()
),
(
  (SELECT id FROM partners WHERE referral_code = 'OZO1003' LIMIT 1),
  NULL,
  612,
  2,
  'Level 2 referral',
  'paid',
  NOW(),
  NOW()
);

-- ============================================================================
-- SEED PAYOUTS
-- ============================================================================

-- Clear existing payouts
DELETE FROM payouts;

INSERT INTO payouts (
  partner_id, amount, method, payment_details, status, created_at, updated_at
) VALUES
(
  (SELECT id FROM partners WHERE referral_code = 'OZO1001' LIMIT 1),
  25000,
  'upi',
  'kavita@upi',
  'paid',
  NOW(),
  NOW()
),
(
  (SELECT id FROM partners WHERE referral_code = 'OZO1003' LIMIT 1),
  50000,
  'bank',
  'HDFC Bank, Account: 50100234567890, IFSC: HDFC0001234',
  'pending',
  NOW(),
  NOW()
);

-- ============================================================================
-- SEED MEMBERSHIP PLANS
-- ============================================================================

-- Clear existing membership plans
DELETE FROM membership_plans;

INSERT INTO membership_plans (
  name, price, price_label, duration, benefits, features, is_active, 
  created_at, updated_at
) VALUES
(
  'Basic Partner',
  1199,
  '₹1,199',
  '12 months',
  to_jsonb(ARRAY['6% commission on direct referrals', 'Access to partner dashboard', 'Referral link generation', 'WhatsApp sharing tools']::text[]),
  to_jsonb(ARRAY['Basic commission tracking', 'Monthly payout requests', 'Email support']::text[]),
  true,
  NOW(),
  NOW()
),
(
  'Premium Partner',
  2499,
  '₹2,499',
  '12 months',
  to_jsonb(ARRAY['6% commission on direct referrals', '3% on level 2 referrals', 'Priority support', 'Marketing materials', 'Training resources']::text[]),
  to_jsonb(ARRAY['Advanced commission tracking', 'Weekly payout requests', 'Phone support', 'Marketing kit access', 'Partner training webinars']::text[]),
  true,
  NOW(),
  NOW()
),
(
  'Elite Partner',
  4999,
  '₹4,999',
  '12 months',
  to_jsonb(ARRAY['6% commission on direct referrals', '3% on level 2 referrals', '1.7% on level 3 referrals', 'Dedicated account manager', 'Exclusive events', 'Revenue sharing bonus']::text[]),
  to_jsonb(ARRAY['Full commission tracking', 'Daily payout requests', '24/7 dedicated support', 'Exclusive partner events', 'Revenue sharing up to 20%', 'Custom marketing materials']::text[]),
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- SEED FAQ ADDITIONS
-- ============================================================================

INSERT INTO faqs (
  question, answer, category, display_order, is_active, created_at, updated_at
) VALUES
(
  'What payment methods do you accept?',
  'We accept UPI, bank transfer, and all major credit/debit cards. Secure payment links are shared after booking confirmation.',
  'payment',
  7,
  true,
  NOW(),
  NOW()
),
(
  'How long is a consultation?',
  'Consultations typically last 20-30 minutes. Our experts assess your skin, discuss goals, and recommend the best treatment plan.',
  'general',
  8,
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify seeded data
SELECT 'Treatments seeded:' as status, COUNT(*) as count FROM treatments;
SELECT 'Testimonials seeded:' as status, COUNT(*) as count FROM testimonials;
SELECT 'FAQs seeded:' as status, COUNT(*) as count FROM faqs;
SELECT 'Contact settings seeded:' as status, COUNT(*) as count FROM contact_settings;
SELECT 'Site content seeded:' as status, COUNT(*) as count FROM site_content;
SELECT 'Commission settings seeded:' as status, COUNT(*) as count FROM commission_settings;
SELECT 'System settings seeded:' as status, COUNT(*) as count FROM system_settings;
SELECT 'Bookings seeded:' as status, COUNT(*) as count FROM bookings;
SELECT 'Partners seeded:' as status, COUNT(*) as count FROM partners;
SELECT 'Commissions seeded:' as status, COUNT(*) as count FROM commissions;
SELECT 'Payouts seeded:' as status, COUNT(*) as count FROM payouts;
SELECT 'Membership plans seeded:' as status, COUNT(*) as count FROM membership_plans;
