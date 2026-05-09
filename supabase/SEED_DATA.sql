-- ============================================================================
-- OZO / IA Skin Care - Seed Current Website Data into Supabase
-- ============================================================================
-- This script seeds the hardcoded website data from lib/site.ts into Supabase
-- Run this in Supabase SQL Editor to populate tables
-- ============================================================================

-- ============================================================================
-- SEED TREATMENTS
-- ============================================================================

-- Clear existing treatments
DELETE FROM treatments;

INSERT INTO treatments (
  title, slug, subtitle, description, overview, price, price_label, unit, 
  tagline, treatment_type, image, image_alt, duration, sessions, 
  badge, icon, tone, active, featured, requires_slots, 
  benefits, process, who_for, safety, faqs, available_cities, 
  cta_text, created_at, updated_at
) VALUES
(
  'Korean Glass Treatment',
  'korean-glass-skin',
  'Premium Clinical Glow Experience',
  'Korean-inspired clinical glow treatment delivered through guided city campaigns, treatment sessions, and premium skincare protocols.',
  'Inspired by the iconic Korean K-Beauty protocol, this premium clinical treatment is organized through beauty events, skin camps, and city-based treatment campaigns. This multi-step treatment hydrates from within, refines pores, and locks in a luminous, mirror-like dewy finish — the signature "glass skin" look loved worldwide.',
  25000,
  '₹25,000',
  'per session',
  'Premium Clinical Glow Experience',
  'campaign',
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=80',
  'Korean Glass Skin treatment — luminous dewy radiant skin with glass-like finish',
  '75–90 min',
  'Event-based sessions',
  'Premium',
  'sparkle',
  'primary',
  true,
  true,
  true,
  ARRAY['Deep hydration glow', 'Smooth radiant skin', 'Glass skin finish', 'Brightening support', 'Skin texture refinement', 'Luxury clinical care'],
  ARRAY[
    jsonb_build_object('step', 'Event Registration', 'detail', 'Register for upcoming glass skin treatment events in your city.'),
    jsonb_build_object('step', 'Expert Consultation', 'detail', 'One-on-one consultation with Korean skincare specialists.'),
    jsonb_build_object('step', 'Premium Treatment', 'detail', 'Multi-step clinical protocol with premium Korean-import products.'),
    jsonb_build_object('step', 'Glass Skin Results', 'detail', 'Experience instant luminous dewy finish and visible transformation.'),
    jsonb_build_object('step', 'Aftercare Support', 'detail', 'Post-treatment guidance and home-care recommendations.')
  ],
  ARRAY['Dry, dull, or tired-looking skin', 'Anyone wanting that K-Beauty dewy glow', 'Pre-event glow boost', 'Mature skin needing hydration & bounce'],
  'Doctor-supervised, hypoallergenic, and patch-tested. All Korean-import grade products are dermatologically certified. Organized in premium clinical settings.',
  ARRAY[
    jsonb_build_object('q', 'How do I book this treatment?', 'a', 'This treatment is organized through city-based campaigns and beauty events. Register your interest and we''ll notify you when sessions are available in your city.'),
    jsonb_build_object('q', 'Which cities currently offer this treatment?', 'a', 'We organize glass skin treatment campaigns in major cities. Check our website or WhatsApp for upcoming events in your area.'),
    jsonb_build_object('q', 'How long do results last?', 'a', 'The instant dewy finish lasts ~7–10 days. With recommended sessions and proper aftercare, you can sustain the effect for longer.')
  ],
  ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Ahmedabad'],
  'Book Consultation',
  NOW(),
  NOW()
),
(
  'Skin Lightening Treatment',
  'skin-lightening',
  'Home Kit Treatment Program',
  'Professional skin brightening and pigmentation care program with a premium home-care kit delivered to your doorstep.',
  'Our Skin Lightening Treatment is a comprehensive home-based skincare program that delivers professional-grade brightening results through a premium treatment kit delivered directly to your home. This clinically formulated protocol targets melanin clusters, post-acne marks, and dull patches — restoring an even, radiant complexion with safe, dermat-approved actives.',
  18000,
  '₹18,000',
  'one-time',
  'Home Kit Treatment Program',
  'home_kit',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80',
  'Premium skincare home treatment kit with clinical-grade products',
  '4–6 weeks',
  'Complete home program',
  'Home Program',
  'droplet',
  'accent',
  true,
  true,
  false,
  ARRAY['Reduces pigmentation & dark spots', 'Improves uneven skin tone', 'Enhances natural glow', 'Safe for Indian skin types', 'Guided skincare support', 'Long-lasting visible radiance'],
  ARRAY[
    jsonb_build_object('step', 'Kit Delivery', 'detail', 'Premium home care kit delivered to your doorstep with all required products.'),
    jsonb_build_object('step', 'Video Consultation', 'detail', 'Expert video consultation to guide you through the treatment protocol.'),
    jsonb_build_object('step', 'Daily Routine', 'detail', 'Follow the guided skincare routine with premium clinical-grade actives.'),
    jsonb_build_object('step', 'Progress Tracking', 'detail', 'Weekly check-ins to monitor progress and adjust protocol as needed.'),
    jsonb_build_object('step', 'Ongoing Support', 'detail', 'Continuous online/offline consultation support throughout the program.')
  ],
  ARRAY['Uneven skin tone & dullness', 'Post-acne marks & pigmentation', 'Tan, sun damage, or dark patches', 'Anyone seeking a brighter, balanced complexion'],
  'Doctor-supervised, patch-tested, and tailored for Indian skin. Uses certified clinical-grade products with zero harsh bleaching agents. Premium home care kit delivered with detailed instructions.',
  ARRAY[
    jsonb_build_object('q', 'What is included in the home treatment kit?', 'a', 'The kit includes all premium clinical-grade products needed for the complete treatment program, along with detailed instructions and access to video consultations.'),
    jsonb_build_object('q', 'How long does the program last?', 'a', 'The standard program is designed for 4-6 weeks, with visible improvements typically seen within the first 2 weeks.'),
    jsonb_build_object('q', 'Is there any downtime?', 'a', 'No downtime. This is a gentle home-based treatment designed for daily use without disrupting your routine.')
  ],
  ARRAY['All India'],
  'Book Home Kit Program',
  NOW(),
  NOW()
),
(
  'Basic Skin Treatment',
  'basic-skin-treatment',
  'Essential Skin Health Foundation',
  'Build a strong foundation for healthy, glowing skin with our essential treatment that cleanses, nourishes, and protects.',
  'The Basic Skin Treatment is designed as the cornerstone of any skincare routine. This fundamental protocol deeply cleanses pores, replenishes essential nutrients, and strengthens your skin''s natural barrier — establishing the perfect base for lasting skin health and radiance.',
  12000,
  '₹12,000',
  'per session',
  'Essential Skin Health Foundation',
  'clinic',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=80',
  'Basic Skin Treatment — clean, healthy, glowing skin foundation',
  '45–60 min',
  'Recommended 4–6 sessions',
  'Essential',
  'droplet',
  'primary',
  true,
  false,
  false,
  ARRAY['Cleansing', 'Hydration', 'Skin refresh', 'Glow maintenance', 'Beginner-friendly skincare support'],
  ARRAY[
    jsonb_build_object('step', 'Skin Analysis', 'detail', 'Professional assessment of your skin type and condition.'),
    jsonb_build_object('step', 'Deep Cleansing', 'detail', 'Thorough pore cleansing to remove impurities and excess oil.'),
    jsonb_build_object('step', 'Exfoliation', 'detail', 'Gentle removal of dead skin cells for smoother texture.'),
    jsonb_build_object('step', 'Nourishing Mask', 'detail', 'Nutrient-rich mask to replenish and revitalize skin.'),
    jsonb_build_object('step', 'Protection', 'detail', 'Moisturizer and SPF to protect and maintain results.')
  ],
  ARRAY['Beginners to professional skincare', 'Maintenance between advanced treatments', 'General skin health improvement', 'Preventative skincare', 'All skin types'],
  'Gentle yet effective protocol suitable for all skin types. Doctor-supervised with patch-tested, clinical-grade products.',
  ARRAY[
    jsonb_build_object('q', 'Is this suitable for first-time skincare clients?', 'a', 'Absolutely. This is our foundational treatment, perfect for anyone new to professional skincare or building a routine.'),
    jsonb_build_object('q', 'How often should I get this treatment?', 'a', 'For maintenance, we recommend every 4–6 weeks. Your therapist will create a personalized schedule based on your skin needs.'),
    jsonb_build_object('q', 'Can I combine this with other treatments?', 'a', 'Yes, this treatment pairs well with more advanced protocols. Your skincare expert will recommend the best combination for your goals.')
  ],
  ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Ahmedabad'],
  'Book Now',
  NOW(),
  NOW()
),
(
  'Japanese Skin Treatment',
  'japanese-skin-treatment',
  'Refined Purity & Timeless Beauty',
  'Embrace the Japanese philosophy of skin purification — gentle yet powerful techniques for refined, porcelain-like skin with lasting clarity.',
  'Rooted in the Japanese tradition of meticulous skincare, this treatment focuses on purification, refinement, and harmony. Using time-honored techniques combined with modern clinical science, it delivers porcelain-smooth skin with exceptional clarity and a refined, elegant finish.',
  22000,
  '₹22,000',
  'per session',
  'Refined Purity & Timeless Beauty',
  'clinic',
  'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1400&q=80',
  'Japanese Skin Treatment — refined porcelain-smooth skin with clarity',
  '60–75 min',
  'Recommended 4–6 sessions',
  'Refined',
  'sparkle',
  'light',
  true,
  false,
  false,
  ARRAY['Minimalist skin ritual', 'Texture refinement', 'Calm skin', 'Natural radiance', 'Balanced hydration'],
  ARRAY[
    jsonb_build_object('step', 'Ritual Cleanse', 'detail', 'Traditional Japanese cleansing technique for deep purification.'),
    jsonb_build_object('step', 'Refining Exfoliation', 'detail', 'Gentle enzyme exfoliation for smooth, refined texture.'),
    jsonb_build_object('step', 'Essence Infusion', 'detail', 'Lightweight essence layers for deep hydration and balance.'),
    jsonb_build_object('step', 'Clay Mask', 'detail', 'Purifying clay mask to detoxify and refine pores.'),
    jsonb_build_object('step', 'Harmony Finish', 'detail', 'Balancing moisturizer and protective SPF for lasting clarity.')
  ],
  ARRAY['Enlarged or visible pores', 'Rough or uneven texture', 'Oily or combination skin', 'Those seeking refined elegance', 'Sensitive or reactive skin'],
  'Doctor-supervised with gentle, purifying ingredients. All products are dermatologically tested and suitable for sensitive skin types.',
  ARRAY[
    jsonb_build_object('q', 'How is this different from the Korean Glass Treatment?', 'a', 'While Korean Glass focuses on dewy hydration, Japanese treatment emphasizes purification, pore refinement, and achieving a smooth, porcelain-like finish.'),
    jsonb_build_object('q', 'Is this suitable for sensitive skin?', 'a', 'Yes, the Japanese approach is known for being gentle yet effective. We customize the intensity based on your skin sensitivity.'),
    jsonb_build_object('q', 'When will I see results?', 'a', 'Immediate refinement is visible after one session. For lasting porcelain-smooth skin, we recommend 4–6 sessions spaced 2–3 weeks apart.')
  ],
  ARRAY['Mumbai', 'Delhi', 'Bangalore'],
  'Book Consultation',
  NOW(),
  NOW()
),
(
  'Advanced Skin Treatment',
  'advanced-skin-treatment',
  'Clinical-Grade Skin Transformation',
  'Target complex skin concerns with our most powerful clinical protocol — advanced actives, intensive repair, and visible transformation.',
  'The Advanced Skin Treatment represents the pinnacle of our clinical expertise. This intensive protocol combines high-potency actives, cutting-edge delivery systems, and doctor-supervised precision to address complex skin concerns including deep pigmentation, advanced aging, and significant texture irregularities.',
  35000,
  '₹35,000',
  'per session',
  'Clinical-Grade Skin Transformation',
  'clinic',
  'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1400&q=80',
  'Advanced Skin Treatment — clinical-grade skin transformation with visible results',
  '90–120 min',
  'Recommended 4–6 sessions',
  'Advanced',
  'award',
  'primaryDark',
  true,
  true,
  true,
  ARRAY['Anti-aging', 'Skin repair', 'Deep hydration', 'Pigmentation control', 'Collagen boost', 'Barrier strengthening'],
  ARRAY[
    jsonb_build_object('step', 'Advanced Assessment', 'detail', 'Comprehensive skin analysis with imaging technology.'),
    jsonb_build_object('step', 'Professional Peel', 'detail', 'Clinical-grade peel for deep exfoliation and renewal.'),
    jsonb_build_object('step', 'Active Infusion', 'detail', 'High-potency serums with advanced delivery systems.'),
    jsonb_build_object('step', 'Intensive Mask', 'detail', 'Professional-grade treatment mask for targeted repair.'),
    jsonb_build_object('step', 'Barrier Restoration', 'detail', 'Barrier-repair complex and protective aftercare protocol.')
  ],
  ARRAY['Deep or stubborn pigmentation', 'Advanced signs of aging', 'Severe texture irregularities', 'Significant skin damage', 'Those seeking dramatic results'],
  'Doctor-supervised with clinical-grade, high-potency actives. Requires pre-treatment assessment and strict aftercare compliance. Not suitable for pregnant or nursing clients.',
  ARRAY[
    jsonb_build_object('q', 'Is there downtime after this treatment?', 'a', 'Yes, expect 3–5 days of mild redness and peeling as skin renews. This is normal and part of the transformation process.'),
    jsonb_build_object('q', 'How many sessions are needed?', 'a', 'Most clients see significant improvement in 2–3 sessions. A full course of 4–6 sessions is recommended for complete transformation.'),
    jsonb_build_object('q', 'Am I a candidate for this treatment?', 'a', 'A pre-treatment consultation is required. Our doctor will assess your skin, medical history, and goals to determine suitability.')
  ],
  ARRAY['Mumbai', 'Delhi'],
  'Book Consultation',
  NOW(),
  NOW()
);

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
  'Korean Glass Skin',
  'My skin has never looked this smooth. The team is professional and the results showed from the second session itself.',
  5,
  true,
  NOW(),
  NOW()
),
(
  'Riya M.',
  'Surat',
  'Skin Lightening',
  'Pigmentation on my cheeks has visibly reduced. I feel confident going makeup-free now. Highly recommend IA Skin Care.',
  5,
  true,
  NOW(),
  NOW()
),
(
  'Aarti K.',
  'Vadodara',
  'Korean Glass Skin',
  'Premium experience from consultation to aftercare. Clean clinic, genuine advice, no upselling. Loved the glow!',
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
