/**
 * Supabase database type definitions.
 *
 * Placeholder until tables are created. After creating tables in Supabase,
 * regenerate this file with:
 *   npx supabase gen types typescript --project-id <id> --schema public > lib/supabase/types.ts
 *
 * Future tables (planned, not yet created):
 *  - admins        (admin auth profiles)
 *  - partners      (partner / membership holders)
 *  - bookings      (treatment bookings)
 *  - memberships   (membership purchases & status)
 *  - referrals     (referral records & payouts)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
