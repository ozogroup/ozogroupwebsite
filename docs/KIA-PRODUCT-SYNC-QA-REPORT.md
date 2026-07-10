# KIA Product Sync QA Report

Date: 2026-07-10

## Scope

This report covers Admin Treatment Management, local image uploads, live website treatment sync, booking price snapshots, and cache invalidation.

## Fixes Completed

- Removed the Admin Treatment form dependency on image URL inputs.
- Removed browser-native `type="url"` validation from the reusable image uploader.
- Replaced direct browser treatment updates with a server action that requires admin access.
- Added local multiple-image selection and drag/drop for treatment images.
- Added selected image previews before upload.
- Added existing saved image display.
- Added add-more-images behavior without losing existing images.
- Added individual image removal.
- Added image ordering controls.
- Added primary image selection.
- Added alt text editing for every image.
- Added upload file validation for JPG, JPEG, PNG, and WEBP.
- Added 8 MB max image-size validation.
- Preserved existing images when the admin edits only price/text fields.
- Delayed storage deletion until after database image rows are successfully updated.
- Added treatment cache invalidation for home, treatment listing, treatment detail, admin, and partner paths.
- Added booking price snapshot fields in migration and booking creation logic.

## Database Changes

Migration:

- `supabase/MIGRATION_TREATMENT_IMAGES_STORAGE_2026_07_10.sql`

Adds or confirms:

- `treatment_images.id`
- `treatment_images.treatment_id`
- `treatment_images.storage_path`
- `treatment_images.public_url`
- `treatment_images.image_url`
- `treatment_images.alt_text`
- `treatment_images.is_primary`
- `treatment_images.sort_order`
- `treatment_images.created_at`
- `treatment_images.updated_at`

Also adds:

- `bookings.treatment_name_snapshot`
- `bookings.unit_price_snapshot`
- `bookings.discount_snapshot`
- `bookings.final_amount`

The migration backfills existing `treatments.image` and `treatments.gallery` into `treatment_images`, then keeps legacy `treatments.image/gallery` synced for older readers.

## Storage Policy Changes

The migration ensures the `media` bucket exists and is public-readable. It creates admin-only insert, update, and delete storage policies for authenticated admin/super-admin profiles.

The application upload path remains server-side and never exposes the service-role key in browser code.

## Live Sync

Treatment reads now prefer `treatment_images` from Supabase and fall back to legacy `treatments.image/gallery` only when image rows do not exist.

Updated paths are revalidated after save:

- `/`
- `/treatments`
- `/treatments/[slug]`
- `/admin/treatments`
- `/admin/dashboard`
- `/partner/dashboard`
- `/partner/new-membership`

## Price History Rule

New bookings now snapshot:

- treatment ID
- treatment name
- unit price
- discount
- final amount

Existing booking values are not recalculated from the current treatment master price.

## Validation Result

- URL validation scan: clean.
- TypeScript check: passed.
- Lint: passed with warnings only.
- Production build: passed with warnings only.

Remaining warnings are existing React hook dependency warnings in admin CRUD pages and image optimization warnings in partner display components.

## Reset Status

The product sync code is complete. The treatment image/storage migration has been applied on the live Supabase project. The operational reset has also been completed by the project owner.

Post-reset preservation verified:

- Treatments/products: preserved
- Treatment images: preserved
- Website content: preserved
- FAQs: preserved
- Testimonials: preserved
- Contact settings: preserved
- Commission settings: preserved
- System settings: preserved

Admin treatment edit flow:

- URL validation blocker removed.
- No image URL input is present in the treatment form.
- Local multi-image upload UI is implemented.
- Live website reads treatment image rows from Supabase and falls back to legacy treatment image/gallery values only when needed.
- Cache invalidation is wired through the treatment save server action.
