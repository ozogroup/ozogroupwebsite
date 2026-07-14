export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _bak_20260622_commission_settings: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string | null
          level_1_percentage: number | null
          level_2_percentage: number | null
          level_3_percentage: number | null
          level_4_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string | null
          level_1_percentage?: number | null
          level_2_percentage?: number | null
          level_3_percentage?: number | null
          level_4_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string | null
          level_1_percentage?: number | null
          level_2_percentage?: number | null
          level_3_percentage?: number | null
          level_4_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _bak_20260622_site_content: {
        Row: {
          content_key: string | null
          content_value: Json | null
          created_at: string | null
          deleted_at: string | null
          display_order: number | null
          id: string | null
          is_active: boolean | null
          key_name: string | null
          page: string | null
          section: string | null
          updated_at: string | null
          value: string | null
          value_type: string | null
        }
        Insert: {
          content_key?: string | null
          content_value?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          display_order?: number | null
          id?: string | null
          is_active?: boolean | null
          key_name?: string | null
          page?: string | null
          section?: string | null
          updated_at?: string | null
          value?: string | null
          value_type?: string | null
        }
        Update: {
          content_key?: string | null
          content_value?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          display_order?: number | null
          id?: string | null
          is_active?: boolean | null
          key_name?: string | null
          page?: string | null
          section?: string | null
          updated_at?: string | null
          value?: string | null
          value_type?: string | null
        }
        Relationships: []
      }
      _bak_20260622_treatments: {
        Row: {
          active: boolean | null
          after_image_url: string | null
          available_cities: Json | null
          badge: string | null
          before_image_url: string | null
          benefits: Json | null
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          deleted_at: string | null
          description: string | null
          display_order: number | null
          duration: string | null
          faqs: Json | null
          featured: boolean | null
          gallery: Json | null
          icon: string | null
          id: string | null
          image: string | null
          image_alt: string | null
          image_url: string | null
          is_active: boolean | null
          kit_name: string | null
          long_description: string | null
          meta_keywords: string | null
          note: string | null
          overview: string | null
          price: number | null
          price_label: string | null
          process: Json | null
          process_steps: Json | null
          recovery_time: string | null
          requires_slots: boolean | null
          safety: string | null
          seo_description: string | null
          seo_title: string | null
          sessions: string | null
          short_description: string | null
          slots_per_day: number | null
          slug: string | null
          subtitle: string | null
          tagline: string | null
          title: string | null
          tone: string | null
          treatment_type: string | null
          type: Database["public"]["Enums"]["treatment_type"] | null
          unit: string | null
          updated_at: string | null
          who_for: string | null
        }
        Insert: {
          active?: boolean | null
          after_image_url?: string | null
          available_cities?: Json | null
          badge?: string | null
          before_image_url?: string | null
          benefits?: Json | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          faqs?: Json | null
          featured?: boolean | null
          gallery?: Json | null
          icon?: string | null
          id?: string | null
          image?: string | null
          image_alt?: string | null
          image_url?: string | null
          is_active?: boolean | null
          kit_name?: string | null
          long_description?: string | null
          meta_keywords?: string | null
          note?: string | null
          overview?: string | null
          price?: number | null
          price_label?: string | null
          process?: Json | null
          process_steps?: Json | null
          recovery_time?: string | null
          requires_slots?: boolean | null
          safety?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sessions?: string | null
          short_description?: string | null
          slots_per_day?: number | null
          slug?: string | null
          subtitle?: string | null
          tagline?: string | null
          title?: string | null
          tone?: string | null
          treatment_type?: string | null
          type?: Database["public"]["Enums"]["treatment_type"] | null
          unit?: string | null
          updated_at?: string | null
          who_for?: string | null
        }
        Update: {
          active?: boolean | null
          after_image_url?: string | null
          available_cities?: Json | null
          badge?: string | null
          before_image_url?: string | null
          benefits?: Json | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          faqs?: Json | null
          featured?: boolean | null
          gallery?: Json | null
          icon?: string | null
          id?: string | null
          image?: string | null
          image_alt?: string | null
          image_url?: string | null
          is_active?: boolean | null
          kit_name?: string | null
          long_description?: string | null
          meta_keywords?: string | null
          note?: string | null
          overview?: string | null
          price?: number | null
          price_label?: string | null
          process?: Json | null
          process_steps?: Json | null
          recovery_time?: string | null
          requires_slots?: boolean | null
          safety?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sessions?: string | null
          short_description?: string | null
          slots_per_day?: number | null
          slug?: string | null
          subtitle?: string | null
          tagline?: string | null
          title?: string | null
          tone?: string | null
          treatment_type?: string | null
          type?: Database["public"]["Enums"]["treatment_type"] | null
          unit?: string | null
          updated_at?: string | null
          who_for?: string | null
        }
        Relationships: []
      }
      _kia_launch_backup_20260714_bookings: {
        Row: {
          address: string | null
          admin_notes: string | null
          booking_slot_id: string | null
          booking_status: Database["public"]["Enums"]["booking_status"] | null
          booking_type: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          city: string | null
          courier_name: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          deleted_at: string | null
          discount_snapshot: number | null
          final_amount: number | null
          id: string | null
          is_active: boolean | null
          notes: string | null
          partner_code: string | null
          payment_amount: number | null
          payment_gateway: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pin_code: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          referral_code: string | null
          referred_by: string | null
          refund_status: string | null
          shipping_status: Database["public"]["Enums"]["shipping_status"] | null
          tracking_id: string | null
          treatment_id: string | null
          treatment_name: string | null
          treatment_name_snapshot: string | null
          treatment_price: number | null
          unit_price_snapshot: number | null
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          booking_slot_id?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          booking_type?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          city?: string | null
          courier_name?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          deleted_at?: string | null
          discount_snapshot?: number | null
          final_amount?: number | null
          id?: string | null
          is_active?: boolean | null
          notes?: string | null
          partner_code?: string | null
          payment_amount?: number | null
          payment_gateway?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pin_code?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          refund_status?: string | null
          shipping_status?:
            | Database["public"]["Enums"]["shipping_status"]
            | null
          tracking_id?: string | null
          treatment_id?: string | null
          treatment_name?: string | null
          treatment_name_snapshot?: string | null
          treatment_price?: number | null
          unit_price_snapshot?: number | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          booking_slot_id?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          booking_type?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          city?: string | null
          courier_name?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          deleted_at?: string | null
          discount_snapshot?: number | null
          final_amount?: number | null
          id?: string | null
          is_active?: boolean | null
          notes?: string | null
          partner_code?: string | null
          payment_amount?: number | null
          payment_gateway?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pin_code?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          refund_status?: string | null
          shipping_status?:
            | Database["public"]["Enums"]["shipping_status"]
            | null
          tracking_id?: string | null
          treatment_id?: string | null
          treatment_name?: string | null
          treatment_name_snapshot?: string | null
          treatment_price?: number | null
          unit_price_snapshot?: number | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      _kia_launch_backup_20260714_commissions: {
        Row: {
          amount: number | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          is_active: boolean | null
          level: number | null
          paid_at: string | null
          partner_id: string | null
          payout_id: string | null
          percentage: number | null
          reversal_reason: string | null
          reversed: boolean | null
          reversed_at: string | null
          source_amount: number | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["source_type"] | null
          status: Database["public"]["Enums"]["commission_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          is_active?: boolean | null
          level?: number | null
          paid_at?: string | null
          partner_id?: string | null
          payout_id?: string | null
          percentage?: number | null
          reversal_reason?: string | null
          reversed?: boolean | null
          reversed_at?: string | null
          source_amount?: number | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["source_type"] | null
          status?: Database["public"]["Enums"]["commission_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          is_active?: boolean | null
          level?: number | null
          paid_at?: string | null
          partner_id?: string | null
          payout_id?: string | null
          percentage?: number | null
          reversal_reason?: string | null
          reversed?: boolean | null
          reversed_at?: string | null
          source_amount?: number | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["source_type"] | null
          status?: Database["public"]["Enums"]["commission_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _kia_launch_backup_20260714_contact_settings: {
        Row: {
          address: string | null
          business_hours: string | null
          created_at: string | null
          email: string | null
          facebook_url: string | null
          id: string | null
          instagram_url: string | null
          linkedin_url: string | null
          phone: string | null
          twitter_url: string | null
          updated_at: string | null
          whatsapp: string | null
          whatsapp_number: string | null
          whatsapp_url: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          business_hours?: string | null
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          phone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          whatsapp_number?: string | null
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          business_hours?: string | null
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          phone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          whatsapp_number?: string | null
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      _kia_launch_backup_20260714_memberships: {
        Row: {
          address: string | null
          admin_notes: string | null
          amount: number | null
          city: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          membership_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          mobile: string | null
          notes: string | null
          partner_id: string | null
          payment_amount: number | null
          payment_gateway: string | null
          payment_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pin_code: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          referral_code: string | null
          sponsor_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          amount?: number | null
          city?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          mobile?: string | null
          notes?: string | null
          partner_id?: string | null
          payment_amount?: number | null
          payment_gateway?: string | null
          payment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pin_code?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          referral_code?: string | null
          sponsor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          amount?: number | null
          city?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          mobile?: string | null
          notes?: string | null
          partner_id?: string | null
          payment_amount?: number | null
          payment_gateway?: string | null
          payment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pin_code?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          referral_code?: string | null
          sponsor_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _kia_launch_backup_20260714_partner_sales: {
        Row: {
          booking_id: string | null
          booking_status: string | null
          commission_amount: number | null
          commission_level: number | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string | null
          partner_code: string | null
          partner_id: string | null
          treatment_name: string | null
          treatment_price: number | null
        }
        Insert: {
          booking_id?: string | null
          booking_status?: string | null
          commission_amount?: number | null
          commission_level?: number | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string | null
          partner_code?: string | null
          partner_id?: string | null
          treatment_name?: string | null
          treatment_price?: number | null
        }
        Update: {
          booking_id?: string | null
          booking_status?: string | null
          commission_amount?: number | null
          commission_level?: number | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string | null
          partner_code?: string | null
          partner_id?: string | null
          treatment_name?: string | null
          treatment_price?: number | null
        }
        Relationships: []
      }
      _kia_launch_backup_20260714_partners: {
        Row: {
          aadhaar_last4: string | null
          address: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_verified: boolean | null
          city: string | null
          created_at: string | null
          deleted_at: string | null
          fraud_notes: string | null
          id: string | null
          is_active: boolean | null
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at: string | null
          last_login_ip: string | null
          membership_expires_at: string | null
          membership_purchased_at: string | null
          membership_started_at: string | null
          paid_earnings: number | null
          pan_number: string | null
          partner_code: string | null
          payout_hold_reason: string | null
          pin_code: string | null
          referral_link: string | null
          sponsor_id: string | null
          status: Database["public"]["Enums"]["partner_status"] | null
          suspicious_flag: boolean | null
          total_earnings: number | null
          updated_at: string | null
          upi_id: string | null
          wallet_balance: number | null
        }
        Insert: {
          aadhaar_last4?: string | null
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_verified?: boolean | null
          city?: string | null
          created_at?: string | null
          deleted_at?: string | null
          fraud_notes?: string | null
          id?: string | null
          is_active?: boolean | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at?: string | null
          last_login_ip?: string | null
          membership_expires_at?: string | null
          membership_purchased_at?: string | null
          membership_started_at?: string | null
          paid_earnings?: number | null
          pan_number?: string | null
          partner_code?: string | null
          payout_hold_reason?: string | null
          pin_code?: string | null
          referral_link?: string | null
          sponsor_id?: string | null
          status?: Database["public"]["Enums"]["partner_status"] | null
          suspicious_flag?: boolean | null
          total_earnings?: number | null
          updated_at?: string | null
          upi_id?: string | null
          wallet_balance?: number | null
        }
        Update: {
          aadhaar_last4?: string | null
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_verified?: boolean | null
          city?: string | null
          created_at?: string | null
          deleted_at?: string | null
          fraud_notes?: string | null
          id?: string | null
          is_active?: boolean | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at?: string | null
          last_login_ip?: string | null
          membership_expires_at?: string | null
          membership_purchased_at?: string | null
          membership_started_at?: string | null
          paid_earnings?: number | null
          pan_number?: string | null
          partner_code?: string | null
          payout_hold_reason?: string | null
          pin_code?: string | null
          referral_link?: string | null
          sponsor_id?: string | null
          status?: Database["public"]["Enums"]["partner_status"] | null
          suspicious_flag?: boolean | null
          total_earnings?: number | null
          updated_at?: string | null
          upi_id?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      _kia_launch_backup_20260714_payments: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string | null
          order_id: string | null
          payment_id: string | null
          refund_amount: number | null
          refund_reference: string | null
          refund_status: string | null
          refunded_at: string | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["source_type"] | null
          status: Database["public"]["Enums"]["razorpay_status"] | null
          webhook_data: Json | null
          webhook_received: boolean | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          order_id?: string | null
          payment_id?: string | null
          refund_amount?: number | null
          refund_reference?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["source_type"] | null
          status?: Database["public"]["Enums"]["razorpay_status"] | null
          webhook_data?: Json | null
          webhook_received?: boolean | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          order_id?: string | null
          payment_id?: string | null
          refund_amount?: number | null
          refund_reference?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["source_type"] | null
          status?: Database["public"]["Enums"]["razorpay_status"] | null
          webhook_data?: Json | null
          webhook_received?: boolean | null
        }
        Relationships: []
      }
      _kia_launch_backup_20260714_payouts: {
        Row: {
          admin_notes: string | null
          amount: number | null
          approved_at: string | null
          available_balance: number | null
          created_at: string | null
          deduction_amount: number | null
          deduction_rate: number | null
          deleted_at: string | null
          gross_amount: number | null
          id: string | null
          is_active: boolean | null
          net_amount: number | null
          paid_at: string | null
          partner_id: string | null
          payment_details: string | null
          payment_method: string | null
          payment_proof: string | null
          processed_at: string | null
          rejected_at: string | null
          status: Database["public"]["Enums"]["payout_status"] | null
          transaction_note: string | null
          transaction_reference: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount?: number | null
          approved_at?: string | null
          available_balance?: number | null
          created_at?: string | null
          deduction_amount?: number | null
          deduction_rate?: number | null
          deleted_at?: string | null
          gross_amount?: number | null
          id?: string | null
          is_active?: boolean | null
          net_amount?: number | null
          paid_at?: string | null
          partner_id?: string | null
          payment_details?: string | null
          payment_method?: string | null
          payment_proof?: string | null
          processed_at?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          transaction_note?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number | null
          approved_at?: string | null
          available_balance?: number | null
          created_at?: string | null
          deduction_amount?: number | null
          deduction_rate?: number | null
          deleted_at?: string | null
          gross_amount?: number | null
          id?: string | null
          is_active?: boolean | null
          net_amount?: number | null
          paid_at?: string | null
          partner_id?: string | null
          payment_details?: string | null
          payment_method?: string | null
          payment_proof?: string | null
          processed_at?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          transaction_note?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _kia_launch_backup_20260714_profiles: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string | null
          membership_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          partner_code: string | null
          phone: string | null
          phone_verified: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          sponsor_code: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          partner_code?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          sponsor_code?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          partner_code?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          sponsor_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _kia_launch_backup_20260714_referral_links: {
        Row: {
          created_at: string | null
          id: string | null
          partner_code: string | null
          partner_id: string | null
          referral_link: string | null
          total_clicks: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          partner_code?: string | null
          partner_id?: string | null
          referral_link?: string | null
          total_clicks?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          partner_code?: string | null
          partner_id?: string | null
          referral_link?: string | null
          total_clicks?: number | null
        }
        Relationships: []
      }
      _kia_launch_backup_20260714_referral_tree: {
        Row: {
          ancestor_id: string | null
          created_at: string | null
          descendant_id: string | null
          id: string | null
          level: number | null
          locked: boolean | null
        }
        Insert: {
          ancestor_id?: string | null
          created_at?: string | null
          descendant_id?: string | null
          id?: string | null
          level?: number | null
          locked?: boolean | null
        }
        Update: {
          ancestor_id?: string | null
          created_at?: string | null
          descendant_id?: string | null
          id?: string | null
          level?: number | null
          locked?: boolean | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_bookings: {
        Row: {
          address: string | null
          admin_notes: string | null
          booking_slot_id: string | null
          booking_status: Database["public"]["Enums"]["booking_status"] | null
          booking_type: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          city: string | null
          courier_name: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          deleted_at: string | null
          discount_snapshot: number | null
          final_amount: number | null
          id: string | null
          is_active: boolean | null
          notes: string | null
          partner_code: string | null
          payment_amount: number | null
          payment_gateway: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pin_code: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          referral_code: string | null
          referred_by: string | null
          refund_status: string | null
          shipping_status: Database["public"]["Enums"]["shipping_status"] | null
          tracking_id: string | null
          treatment_id: string | null
          treatment_name: string | null
          treatment_name_snapshot: string | null
          treatment_price: number | null
          unit_price_snapshot: number | null
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          booking_slot_id?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          booking_type?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          city?: string | null
          courier_name?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          deleted_at?: string | null
          discount_snapshot?: number | null
          final_amount?: number | null
          id?: string | null
          is_active?: boolean | null
          notes?: string | null
          partner_code?: string | null
          payment_amount?: number | null
          payment_gateway?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pin_code?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          refund_status?: string | null
          shipping_status?:
            | Database["public"]["Enums"]["shipping_status"]
            | null
          tracking_id?: string | null
          treatment_id?: string | null
          treatment_name?: string | null
          treatment_name_snapshot?: string | null
          treatment_price?: number | null
          unit_price_snapshot?: number | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          booking_slot_id?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          booking_type?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          city?: string | null
          courier_name?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          deleted_at?: string | null
          discount_snapshot?: number | null
          final_amount?: number | null
          id?: string | null
          is_active?: boolean | null
          notes?: string | null
          partner_code?: string | null
          payment_amount?: number | null
          payment_gateway?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pin_code?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          refund_status?: string | null
          shipping_status?:
            | Database["public"]["Enums"]["shipping_status"]
            | null
          tracking_id?: string | null
          treatment_id?: string | null
          treatment_name?: string | null
          treatment_name_snapshot?: string | null
          treatment_price?: number | null
          unit_price_snapshot?: number | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_commissions: {
        Row: {
          amount: number | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          is_active: boolean | null
          level: number | null
          paid_at: string | null
          partner_id: string | null
          payout_id: string | null
          percentage: number | null
          reversal_reason: string | null
          reversed: boolean | null
          reversed_at: string | null
          source_amount: number | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["source_type"] | null
          status: Database["public"]["Enums"]["commission_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          is_active?: boolean | null
          level?: number | null
          paid_at?: string | null
          partner_id?: string | null
          payout_id?: string | null
          percentage?: number | null
          reversal_reason?: string | null
          reversed?: boolean | null
          reversed_at?: string | null
          source_amount?: number | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["source_type"] | null
          status?: Database["public"]["Enums"]["commission_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          is_active?: boolean | null
          level?: number | null
          paid_at?: string | null
          partner_id?: string | null
          payout_id?: string | null
          percentage?: number | null
          reversal_reason?: string | null
          reversed?: boolean | null
          reversed_at?: string | null
          source_amount?: number | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["source_type"] | null
          status?: Database["public"]["Enums"]["commission_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_franchise_leads: {
        Row: {
          admin_notes: string | null
          city: string | null
          created_at: string | null
          current_business: string | null
          full_name: string | null
          id: string | null
          investment_budget: string | null
          message: string | null
          mobile: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string | null
          current_business?: string | null
          full_name?: string | null
          id?: string | null
          investment_budget?: string | null
          message?: string | null
          mobile?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string | null
          current_business?: string | null
          full_name?: string | null
          id?: string | null
          investment_budget?: string | null
          message?: string | null
          mobile?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_memberships: {
        Row: {
          address: string | null
          admin_notes: string | null
          amount: number | null
          city: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          membership_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          mobile: string | null
          notes: string | null
          partner_id: string | null
          payment_amount: number | null
          payment_gateway: string | null
          payment_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pin_code: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          referral_code: string | null
          sponsor_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          amount?: number | null
          city?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          mobile?: string | null
          notes?: string | null
          partner_id?: string | null
          payment_amount?: number | null
          payment_gateway?: string | null
          payment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pin_code?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          referral_code?: string | null
          sponsor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          amount?: number | null
          city?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          mobile?: string | null
          notes?: string | null
          partner_id?: string | null
          payment_amount?: number | null
          payment_gateway?: string | null
          payment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pin_code?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          referral_code?: string | null
          sponsor_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_partner_sales: {
        Row: {
          booking_id: string | null
          booking_status: string | null
          commission_amount: number | null
          commission_level: number | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string | null
          partner_code: string | null
          partner_id: string | null
          treatment_name: string | null
          treatment_price: number | null
        }
        Insert: {
          booking_id?: string | null
          booking_status?: string | null
          commission_amount?: number | null
          commission_level?: number | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string | null
          partner_code?: string | null
          partner_id?: string | null
          treatment_name?: string | null
          treatment_price?: number | null
        }
        Update: {
          booking_id?: string | null
          booking_status?: string | null
          commission_amount?: number | null
          commission_level?: number | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string | null
          partner_code?: string | null
          partner_id?: string | null
          treatment_name?: string | null
          treatment_price?: number | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_partners: {
        Row: {
          aadhaar_last4: string | null
          address: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_verified: boolean | null
          city: string | null
          created_at: string | null
          deleted_at: string | null
          fraud_notes: string | null
          id: string | null
          is_active: boolean | null
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at: string | null
          last_login_ip: string | null
          membership_expires_at: string | null
          membership_purchased_at: string | null
          membership_started_at: string | null
          paid_earnings: number | null
          pan_number: string | null
          partner_code: string | null
          payout_hold_reason: string | null
          pin_code: string | null
          referral_link: string | null
          sponsor_id: string | null
          status: Database["public"]["Enums"]["partner_status"] | null
          suspicious_flag: boolean | null
          total_earnings: number | null
          updated_at: string | null
          upi_id: string | null
          wallet_balance: number | null
        }
        Insert: {
          aadhaar_last4?: string | null
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_verified?: boolean | null
          city?: string | null
          created_at?: string | null
          deleted_at?: string | null
          fraud_notes?: string | null
          id?: string | null
          is_active?: boolean | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at?: string | null
          last_login_ip?: string | null
          membership_expires_at?: string | null
          membership_purchased_at?: string | null
          membership_started_at?: string | null
          paid_earnings?: number | null
          pan_number?: string | null
          partner_code?: string | null
          payout_hold_reason?: string | null
          pin_code?: string | null
          referral_link?: string | null
          sponsor_id?: string | null
          status?: Database["public"]["Enums"]["partner_status"] | null
          suspicious_flag?: boolean | null
          total_earnings?: number | null
          updated_at?: string | null
          upi_id?: string | null
          wallet_balance?: number | null
        }
        Update: {
          aadhaar_last4?: string | null
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_verified?: boolean | null
          city?: string | null
          created_at?: string | null
          deleted_at?: string | null
          fraud_notes?: string | null
          id?: string | null
          is_active?: boolean | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at?: string | null
          last_login_ip?: string | null
          membership_expires_at?: string | null
          membership_purchased_at?: string | null
          membership_started_at?: string | null
          paid_earnings?: number | null
          pan_number?: string | null
          partner_code?: string | null
          payout_hold_reason?: string | null
          pin_code?: string | null
          referral_link?: string | null
          sponsor_id?: string | null
          status?: Database["public"]["Enums"]["partner_status"] | null
          suspicious_flag?: boolean | null
          total_earnings?: number | null
          updated_at?: string | null
          upi_id?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_payments: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string | null
          order_id: string | null
          payment_id: string | null
          refund_amount: number | null
          refund_reference: string | null
          refund_status: string | null
          refunded_at: string | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["source_type"] | null
          status: Database["public"]["Enums"]["razorpay_status"] | null
          webhook_data: Json | null
          webhook_received: boolean | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          order_id?: string | null
          payment_id?: string | null
          refund_amount?: number | null
          refund_reference?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["source_type"] | null
          status?: Database["public"]["Enums"]["razorpay_status"] | null
          webhook_data?: Json | null
          webhook_received?: boolean | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          order_id?: string | null
          payment_id?: string | null
          refund_amount?: number | null
          refund_reference?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["source_type"] | null
          status?: Database["public"]["Enums"]["razorpay_status"] | null
          webhook_data?: Json | null
          webhook_received?: boolean | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_payouts: {
        Row: {
          admin_notes: string | null
          amount: number | null
          approved_at: string | null
          available_balance: number | null
          created_at: string | null
          deduction_amount: number | null
          deduction_rate: number | null
          deleted_at: string | null
          gross_amount: number | null
          id: string | null
          is_active: boolean | null
          net_amount: number | null
          paid_at: string | null
          partner_id: string | null
          payment_details: string | null
          payment_method: string | null
          payment_proof: string | null
          processed_at: string | null
          rejected_at: string | null
          status: Database["public"]["Enums"]["payout_status"] | null
          transaction_note: string | null
          transaction_reference: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount?: number | null
          approved_at?: string | null
          available_balance?: number | null
          created_at?: string | null
          deduction_amount?: number | null
          deduction_rate?: number | null
          deleted_at?: string | null
          gross_amount?: number | null
          id?: string | null
          is_active?: boolean | null
          net_amount?: number | null
          paid_at?: string | null
          partner_id?: string | null
          payment_details?: string | null
          payment_method?: string | null
          payment_proof?: string | null
          processed_at?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          transaction_note?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number | null
          approved_at?: string | null
          available_balance?: number | null
          created_at?: string | null
          deduction_amount?: number | null
          deduction_rate?: number | null
          deleted_at?: string | null
          gross_amount?: number | null
          id?: string | null
          is_active?: boolean | null
          net_amount?: number | null
          paid_at?: string | null
          partner_id?: string | null
          payment_details?: string | null
          payment_method?: string | null
          payment_proof?: string | null
          processed_at?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          transaction_note?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_profiles: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string | null
          membership_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          partner_code: string | null
          phone: string | null
          phone_verified: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          sponsor_code: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          partner_code?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          sponsor_code?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          partner_code?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          sponsor_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_referral_clicks: {
        Row: {
          city: string | null
          clicked_at: string | null
          converted_to_membership: boolean | null
          device_type: string | null
          id: string | null
          ip_address: string | null
          partner_id: string | null
          referral_code: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          clicked_at?: string | null
          converted_to_membership?: boolean | null
          device_type?: string | null
          id?: string | null
          ip_address?: string | null
          partner_id?: string | null
          referral_code?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          clicked_at?: string | null
          converted_to_membership?: boolean | null
          device_type?: string | null
          id?: string | null
          ip_address?: string | null
          partner_id?: string | null
          referral_code?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_referral_links: {
        Row: {
          created_at: string | null
          id: string | null
          partner_code: string | null
          partner_id: string | null
          referral_link: string | null
          total_clicks: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          partner_code?: string | null
          partner_id?: string | null
          referral_link?: string | null
          total_clicks?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          partner_code?: string | null
          partner_id?: string | null
          referral_link?: string | null
          total_clicks?: number | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_referral_tree: {
        Row: {
          ancestor_id: string | null
          created_at: string | null
          descendant_id: string | null
          id: string | null
          level: number | null
          locked: boolean | null
        }
        Insert: {
          ancestor_id?: string | null
          created_at?: string | null
          descendant_id?: string | null
          id?: string | null
          level?: number | null
          locked?: boolean | null
        }
        Update: {
          ancestor_id?: string | null
          created_at?: string | null
          descendant_id?: string | null
          id?: string | null
          level?: number | null
          locked?: boolean | null
        }
        Relationships: []
      }
      _kia_reset_backup_20260710_wallet_transactions: {
        Row: {
          amount: number | null
          balance_after: number | null
          balance_before: number | null
          created_at: string | null
          created_by: string | null
          id: string | null
          notes: string | null
          partner_id: string | null
          reference_id: string | null
          reference_type: Database["public"]["Enums"]["reference_type"] | null
          transaction_type:
            | Database["public"]["Enums"]["wallet_transaction_type"]
            | null
        }
        Insert: {
          amount?: number | null
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          notes?: string | null
          partner_id?: string | null
          reference_id?: string | null
          reference_type?: Database["public"]["Enums"]["reference_type"] | null
          transaction_type?:
            | Database["public"]["Enums"]["wallet_transaction_type"]
            | null
        }
        Update: {
          amount?: number | null
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          notes?: string | null
          partner_id?: string | null
          reference_id?: string | null
          reference_type?: Database["public"]["Enums"]["reference_type"] | null
          transaction_type?:
            | Database["public"]["Enums"]["wallet_transaction_type"]
            | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"]
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role: Database["public"]["Enums"]["user_role"]
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"]
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          department: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          department?: string | null
          id: string
          is_active?: boolean | null
          permissions?: Json | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_slots: {
        Row: {
          booked_slots: number | null
          city: string
          created_at: string | null
          id: string
          max_slots: number
          slot_date: string
          slot_time: string
          status: Database["public"]["Enums"]["slot_status"]
          treatment_id: string
          updated_at: string | null
        }
        Insert: {
          booked_slots?: number | null
          city: string
          created_at?: string | null
          id?: string
          max_slots: number
          slot_date: string
          slot_time: string
          status?: Database["public"]["Enums"]["slot_status"]
          treatment_id: string
          updated_at?: string | null
        }
        Update: {
          booked_slots?: number | null
          city?: string
          created_at?: string | null
          id?: string
          max_slots?: number
          slot_date?: string
          slot_time?: string
          status?: Database["public"]["Enums"]["slot_status"]
          treatment_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_slots_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string
          admin_notes: string | null
          booking_id: string | null
          booking_slot_id: string | null
          booking_status: Database["public"]["Enums"]["booking_status"]
          booking_type: string
          cancellation_reason: string | null
          cancelled_by: string | null
          city: string
          courier_name: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          deleted_at: string | null
          discount_snapshot: number | null
          final_amount: number | null
          id: string
          is_active: boolean | null
          notes: string | null
          partner_code: string | null
          payment_amount: number | null
          payment_gateway: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pin_code: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          referral_code: string | null
          referred_by: string | null
          refund_status: string | null
          shipping_status: Database["public"]["Enums"]["shipping_status"] | null
          tracking_id: string | null
          treatment_id: string
          treatment_name: string | null
          treatment_name_snapshot: string | null
          treatment_order_id: string | null
          treatment_price: number | null
          unit_price_snapshot: number | null
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          booking_id?: string | null
          booking_slot_id?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"]
          booking_type: string
          cancellation_reason?: string | null
          cancelled_by?: string | null
          city: string
          courier_name?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          deleted_at?: string | null
          discount_snapshot?: number | null
          final_amount?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          partner_code?: string | null
          payment_amount?: number | null
          payment_gateway?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pin_code: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          refund_status?: string | null
          shipping_status?:
            | Database["public"]["Enums"]["shipping_status"]
            | null
          tracking_id?: string | null
          treatment_id: string
          treatment_name?: string | null
          treatment_name_snapshot?: string | null
          treatment_order_id?: string | null
          treatment_price?: number | null
          unit_price_snapshot?: number | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          booking_id?: string | null
          booking_slot_id?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"]
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_by?: string | null
          city?: string
          courier_name?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          deleted_at?: string | null
          discount_snapshot?: number | null
          final_amount?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          partner_code?: string | null
          payment_amount?: number | null
          payment_gateway?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pin_code?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          refund_status?: string | null
          shipping_status?:
            | Database["public"]["Enums"]["shipping_status"]
            | null
          tracking_id?: string | null
          treatment_id?: string
          treatment_name?: string | null
          treatment_name_snapshot?: string | null
          treatment_order_id?: string | null
          treatment_price?: number | null
          unit_price_snapshot?: number | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_booking_slot_id_fkey"
            columns: ["booking_slot_id"]
            isOneToOne: false
            referencedRelation: "booking_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_settings: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          level_1_percentage: number
          level_2_percentage: number
          level_3_percentage: number
          level_4_percentage: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          level_1_percentage?: number
          level_2_percentage?: number
          level_3_percentage?: number
          level_4_percentage?: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          level_1_percentage?: number
          level_2_percentage?: number
          level_3_percentage?: number
          level_4_percentage?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          created_at: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          level: number
          paid_at: string | null
          partner_id: string
          payout_id: string | null
          percentage: number
          referral_transaction_id: string | null
          reversal_reason: string | null
          reversed: boolean | null
          reversed_at: string | null
          source_amount: number
          source_id: string
          source_type: Database["public"]["Enums"]["source_type"]
          status: Database["public"]["Enums"]["commission_status"]
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          level: number
          paid_at?: string | null
          partner_id: string
          payout_id?: string | null
          percentage: number
          referral_transaction_id?: string | null
          reversal_reason?: string | null
          reversed?: boolean | null
          reversed_at?: string | null
          source_amount: number
          source_id: string
          source_type: Database["public"]["Enums"]["source_type"]
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          paid_at?: string | null
          partner_id?: string
          payout_id?: string | null
          percentage?: number
          referral_transaction_id?: string | null
          reversal_reason?: string | null
          reversed?: boolean | null
          reversed_at?: string | null
          source_amount?: number
          source_id?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_settings: {
        Row: {
          address: string | null
          business_hours: string | null
          created_at: string | null
          email: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          phone: string | null
          twitter_url: string | null
          updated_at: string | null
          whatsapp: string | null
          whatsapp_number: string | null
          whatsapp_url: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          business_hours?: string | null
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          whatsapp_number?: string | null
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          business_hours?: string | null
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          phone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          whatsapp_number?: string | null
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      daily_partner_stats: {
        Row: {
          created_at: string | null
          daily_earnings: number | null
          direct_team_count: number | null
          id: string
          paid_earnings: number | null
          partner_id: string
          pending_earnings: number | null
          stat_date: string
          total_earnings: number | null
          total_team_count: number | null
        }
        Insert: {
          created_at?: string | null
          daily_earnings?: number | null
          direct_team_count?: number | null
          id?: string
          paid_earnings?: number | null
          partner_id: string
          pending_earnings?: number | null
          stat_date: string
          total_earnings?: number | null
          total_team_count?: number | null
        }
        Update: {
          created_at?: string | null
          daily_earnings?: number | null
          direct_team_count?: number | null
          id?: string
          paid_earnings?: number | null
          partner_id?: string
          pending_earnings?: number | null
          stat_date?: string
          total_earnings?: number | null
          total_team_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_partner_stats_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          active: boolean | null
          answer: string
          category: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          answer: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          answer?: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      franchise_leads: {
        Row: {
          admin_notes: string | null
          city: string
          created_at: string | null
          current_business: string | null
          full_name: string
          id: string
          investment_budget: string | null
          message: string | null
          mobile: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          city: string
          created_at?: string | null
          current_business?: string | null
          full_name: string
          id?: string
          investment_budget?: string | null
          message?: string | null
          mobile: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          city?: string
          created_at?: string | null
          current_business?: string | null
          full_name?: string
          id?: string
          investment_budget?: string | null
          message?: string | null
          mobile?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kia_reset_row_counts_audit: {
        Row: {
          phase: string
          recorded_at: string | null
          row_count: number
          run_label: string
          table_name: string
        }
        Insert: {
          phase: string
          recorded_at?: string | null
          row_count: number
          run_label: string
          table_name: string
        }
        Update: {
          phase?: string
          recorded_at?: string | null
          row_count?: number
          run_label?: string
          table_name?: string
        }
        Relationships: []
      }
      media_library: {
        Row: {
          created_at: string | null
          file_name: string | null
          folder: string | null
          height: number | null
          id: string
          mime_type: string | null
          path: string
          size_bytes: number | null
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          path: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          path?: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_library_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          address: string
          admin_notes: string | null
          amount: number
          city: string
          created_at: string | null
          deleted_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          membership_id: string | null
          membership_status: Database["public"]["Enums"]["membership_status"]
          mobile: string
          notes: string | null
          partner_id: string | null
          payment_amount: number | null
          payment_gateway: string | null
          payment_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pin_code: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          referral_code: string | null
          sponsor_id: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          amount: number
          city: string
          created_at?: string | null
          deleted_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          membership_id?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          mobile: string
          notes?: string | null
          partner_id?: string | null
          payment_amount?: number | null
          payment_gateway?: string | null
          payment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pin_code: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          referral_code?: string | null
          sponsor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          amount?: number
          city?: string
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          membership_id?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          mobile?: string
          notes?: string | null
          partner_id?: string | null
          payment_amount?: number | null
          payment_gateway?: string | null
          payment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pin_code?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          referral_code?: string | null
          sponsor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read_status: boolean | null
          related_entity_id: string | null
          related_entity_type: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read_status?: boolean | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read_status?: boolean | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_logs: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          otp_type: Database["public"]["Enums"]["otp_type"]
          profile_id: string | null
          sent_to: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          otp_type: Database["public"]["Enums"]["otp_type"]
          profile_id?: string | null
          sent_to: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_type?: Database["public"]["Enums"]["otp_type"]
          profile_id?: string | null
          sent_to?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_sales: {
        Row: {
          booking_id: string | null
          booking_status: string | null
          commission_amount: number | null
          commission_level: number | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          partner_code: string | null
          partner_id: string | null
          treatment_name: string | null
          treatment_price: number | null
        }
        Insert: {
          booking_id?: string | null
          booking_status?: string | null
          commission_amount?: number | null
          commission_level?: number | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          partner_code?: string | null
          partner_id?: string | null
          treatment_name?: string | null
          treatment_price?: number | null
        }
        Update: {
          booking_id?: string | null
          booking_status?: string | null
          commission_amount?: number | null
          commission_level?: number | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          partner_code?: string | null
          partner_id?: string | null
          treatment_name?: string | null
          treatment_price?: number | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          aadhaar_last4: string | null
          address: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_verified: boolean | null
          city: string | null
          created_at: string | null
          deleted_at: string | null
          fraud_notes: string | null
          id: string
          is_active: boolean | null
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at: string | null
          last_login_ip: string | null
          membership_expires_at: string | null
          membership_purchased_at: string | null
          membership_started_at: string | null
          paid_earnings: number | null
          pan_number: string | null
          partner_code: string | null
          payout_hold_reason: string | null
          pin_code: string | null
          referral_link: string | null
          sponsor_id: string | null
          status: Database["public"]["Enums"]["partner_status"]
          suspicious_flag: boolean | null
          total_earnings: number | null
          updated_at: string | null
          upi_id: string | null
          wallet_balance: number | null
        }
        Insert: {
          aadhaar_last4?: string | null
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_verified?: boolean | null
          city?: string | null
          created_at?: string | null
          deleted_at?: string | null
          fraud_notes?: string | null
          id: string
          is_active?: boolean | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at?: string | null
          last_login_ip?: string | null
          membership_expires_at?: string | null
          membership_purchased_at?: string | null
          membership_started_at?: string | null
          paid_earnings?: number | null
          pan_number?: string | null
          partner_code?: string | null
          payout_hold_reason?: string | null
          pin_code?: string | null
          referral_link?: string | null
          sponsor_id?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          suspicious_flag?: boolean | null
          total_earnings?: number | null
          updated_at?: string | null
          upi_id?: string | null
          wallet_balance?: number | null
        }
        Update: {
          aadhaar_last4?: string | null
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_verified?: boolean | null
          city?: string | null
          created_at?: string | null
          deleted_at?: string | null
          fraud_notes?: string | null
          id?: string
          is_active?: boolean | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_login_at?: string | null
          last_login_ip?: string | null
          membership_expires_at?: string | null
          membership_purchased_at?: string | null
          membership_started_at?: string | null
          paid_earnings?: number | null
          pan_number?: string | null
          partner_code?: string | null
          payout_hold_reason?: string | null
          pin_code?: string | null
          referral_link?: string | null
          sponsor_id?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          suspicious_flag?: boolean | null
          total_earnings?: number | null
          updated_at?: string | null
          upi_id?: string | null
          wallet_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          order_id: string
          payment_id: string | null
          refund_amount: number | null
          refund_reference: string | null
          refund_status: string | null
          refunded_at: string | null
          source_id: string
          source_type: Database["public"]["Enums"]["source_type"]
          status: Database["public"]["Enums"]["razorpay_status"]
          webhook_data: Json | null
          webhook_received: boolean | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          order_id: string
          payment_id?: string | null
          refund_amount?: number | null
          refund_reference?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          source_id: string
          source_type: Database["public"]["Enums"]["source_type"]
          status?: Database["public"]["Enums"]["razorpay_status"]
          webhook_data?: Json | null
          webhook_received?: boolean | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          order_id?: string
          payment_id?: string | null
          refund_amount?: number | null
          refund_reference?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          source_id?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          status?: Database["public"]["Enums"]["razorpay_status"]
          webhook_data?: Json | null
          webhook_received?: boolean | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          admin_notes: string | null
          amount: number
          approved_at: string | null
          available_balance: number
          created_at: string | null
          deduction_amount: number | null
          deduction_rate: number | null
          deleted_at: string | null
          gross_amount: number | null
          id: string
          is_active: boolean | null
          net_amount: number | null
          paid_at: string | null
          partner_id: string
          payment_details: string
          payment_method: string
          payment_proof: string | null
          processed_at: string | null
          rejected_at: string | null
          status: Database["public"]["Enums"]["payout_status"]
          transaction_note: string | null
          transaction_reference: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          approved_at?: string | null
          available_balance: number
          created_at?: string | null
          deduction_amount?: number | null
          deduction_rate?: number | null
          deleted_at?: string | null
          gross_amount?: number | null
          id?: string
          is_active?: boolean | null
          net_amount?: number | null
          paid_at?: string | null
          partner_id: string
          payment_details: string
          payment_method: string
          payment_proof?: string | null
          processed_at?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          transaction_note?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          available_balance?: number
          created_at?: string | null
          deduction_amount?: number | null
          deduction_rate?: number | null
          deleted_at?: string | null
          gross_amount?: number | null
          id?: string
          is_active?: boolean | null
          net_amount?: number | null
          paid_at?: string | null
          partner_id?: string
          payment_details?: string
          payment_method?: string
          payment_proof?: string | null
          processed_at?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          transaction_note?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          id: string
          membership_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          partner_code: string | null
          phone: string | null
          phone_verified: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          sponsor_code: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          partner_code?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          sponsor_code?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          partner_code?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          sponsor_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          city: string | null
          clicked_at: string | null
          converted_to_membership: boolean | null
          device_type: string | null
          id: string
          ip_address: string | null
          partner_id: string
          referral_code: string
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          clicked_at?: string | null
          converted_to_membership?: boolean | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          partner_id: string
          referral_code: string
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          clicked_at?: string | null
          converted_to_membership?: boolean | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          partner_id?: string
          referral_code?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_links: {
        Row: {
          created_at: string | null
          id: string
          partner_code: string
          partner_id: string | null
          referral_link: string
          total_clicks: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          partner_code: string
          partner_id?: string | null
          referral_link: string
          total_clicks?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          partner_code?: string
          partner_id?: string | null
          referral_link?: string
          total_clicks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_links_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_tree: {
        Row: {
          ancestor_id: string
          created_at: string | null
          descendant_id: string
          id: string
          level: number
          locked: boolean | null
          referral_transaction_id: string | null
        }
        Insert: {
          ancestor_id: string
          created_at?: string | null
          descendant_id: string
          id?: string
          level: number
          locked?: boolean | null
          referral_transaction_id?: string | null
        }
        Update: {
          ancestor_id?: string
          created_at?: string | null
          descendant_id?: string
          id?: string
          level?: number
          locked?: boolean | null
          referral_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_tree_ancestor_id_fkey"
            columns: ["ancestor_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_tree_descendant_id_fkey"
            columns: ["descendant_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_orders: {
        Row: {
          booking_id: string | null
          courier_name: string | null
          created_at: string | null
          estimated_delivery: string | null
          id: string
          shiprocket_data: Json | null
          shiprocket_order_id: string | null
          status: Database["public"]["Enums"]["shipping_status"] | null
          tracking_id: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          courier_name?: string | null
          created_at?: string | null
          estimated_delivery?: string | null
          id?: string
          shiprocket_data?: Json | null
          shiprocket_order_id?: string | null
          status?: Database["public"]["Enums"]["shipping_status"] | null
          tracking_id?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          courier_name?: string | null
          created_at?: string | null
          estimated_delivery?: string | null
          id?: string
          shiprocket_data?: Json | null
          shiprocket_order_id?: string | null
          status?: Database["public"]["Enums"]["shipping_status"] | null
          tracking_id?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_orders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          content_key: string | null
          content_value: Json | null
          created_at: string | null
          deleted_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          key_name: string | null
          page: string | null
          section: string
          updated_at: string | null
          value: string | null
          value_type: string | null
        }
        Insert: {
          content_key?: string | null
          content_value?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          key_name?: string | null
          page?: string | null
          section: string
          updated_at?: string | null
          value?: string | null
          value_type?: string | null
        }
        Update: {
          content_key?: string | null
          content_value?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          key_name?: string | null
          page?: string | null
          section?: string
          updated_at?: string | null
          value?: string | null
          value_type?: string | null
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          admin_response: string | null
          created_at: string | null
          id: string
          message: string
          partner_id: string | null
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string | null
          id?: string
          message: string
          partner_id?: string | null
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string | null
          id?: string
          message?: string
          partner_id?: string | null
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          bookings_enabled: boolean | null
          commissions_enabled: boolean | null
          created_at: string | null
          hero_points: Json | null
          id: string
          maintenance_mode: boolean | null
          membership_enabled: boolean | null
          membership_features: Json | null
          membership_price: number | null
          payouts_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          bookings_enabled?: boolean | null
          commissions_enabled?: boolean | null
          created_at?: string | null
          hero_points?: Json | null
          id?: string
          maintenance_mode?: boolean | null
          membership_enabled?: boolean | null
          membership_features?: Json | null
          membership_price?: number | null
          payouts_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          bookings_enabled?: boolean | null
          commissions_enabled?: boolean | null
          created_at?: string | null
          hero_points?: Json | null
          id?: string
          maintenance_mode?: boolean | null
          membership_enabled?: boolean | null
          membership_features?: Json | null
          membership_price?: number | null
          payouts_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          active: boolean | null
          city: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          message: string | null
          name: string
          quote: string | null
          rating: number | null
          role: string | null
          treatment: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          name: string
          quote?: string | null
          rating?: number | null
          role?: string | null
          treatment?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          name?: string
          quote?: string | null
          rating?: number | null
          role?: string | null
          treatment?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      treatment_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          is_primary: boolean | null
          public_url: string | null
          sort_order: number | null
          storage_path: string | null
          treatment_id: string
          updated_at: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          public_url?: string | null
          sort_order?: number | null
          storage_path?: string | null
          treatment_id: string
          updated_at?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          public_url?: string | null
          sort_order?: number | null
          storage_path?: string | null
          treatment_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_images_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          active: boolean | null
          after_image_url: string | null
          available_cities: Json | null
          badge: string | null
          before_image_url: string | null
          benefits: Json | null
          category: string | null
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          deleted_at: string | null
          description: string | null
          display_order: number | null
          duration: string | null
          faqs: Json | null
          featured: boolean | null
          gallery: Json | null
          icon: string | null
          id: string
          image: string | null
          image_alt: string | null
          image_url: string | null
          included_products: Json | null
          is_active: boolean | null
          kit_name: string | null
          long_description: string | null
          meta_keywords: string | null
          note: string | null
          overview: string | null
          price: number
          price_label: string | null
          process: Json | null
          process_steps: Json | null
          recovery_time: string | null
          requires_slots: boolean | null
          safety: string | null
          seo_description: string | null
          seo_title: string | null
          sessions: string | null
          short_description: string | null
          slots_per_day: number | null
          slug: string
          sort_order: number | null
          subtitle: string | null
          tagline: string | null
          title: string
          tone: string | null
          treatment_type: string | null
          type: Database["public"]["Enums"]["treatment_type"]
          unit: string | null
          updated_at: string | null
          who_for: string | null
        }
        Insert: {
          active?: boolean | null
          after_image_url?: string | null
          available_cities?: Json | null
          badge?: string | null
          before_image_url?: string | null
          benefits?: Json | null
          category?: string | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          faqs?: Json | null
          featured?: boolean | null
          gallery?: Json | null
          icon?: string | null
          id?: string
          image?: string | null
          image_alt?: string | null
          image_url?: string | null
          included_products?: Json | null
          is_active?: boolean | null
          kit_name?: string | null
          long_description?: string | null
          meta_keywords?: string | null
          note?: string | null
          overview?: string | null
          price: number
          price_label?: string | null
          process?: Json | null
          process_steps?: Json | null
          recovery_time?: string | null
          requires_slots?: boolean | null
          safety?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sessions?: string | null
          short_description?: string | null
          slots_per_day?: number | null
          slug: string
          sort_order?: number | null
          subtitle?: string | null
          tagline?: string | null
          title: string
          tone?: string | null
          treatment_type?: string | null
          type: Database["public"]["Enums"]["treatment_type"]
          unit?: string | null
          updated_at?: string | null
          who_for?: string | null
        }
        Update: {
          active?: boolean | null
          after_image_url?: string | null
          available_cities?: Json | null
          badge?: string | null
          before_image_url?: string | null
          benefits?: Json | null
          category?: string | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          faqs?: Json | null
          featured?: boolean | null
          gallery?: Json | null
          icon?: string | null
          id?: string
          image?: string | null
          image_alt?: string | null
          image_url?: string | null
          included_products?: Json | null
          is_active?: boolean | null
          kit_name?: string | null
          long_description?: string | null
          meta_keywords?: string | null
          note?: string | null
          overview?: string | null
          price?: number
          price_label?: string | null
          process?: Json | null
          process_steps?: Json | null
          recovery_time?: string | null
          requires_slots?: boolean | null
          safety?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sessions?: string | null
          short_description?: string | null
          slots_per_day?: number | null
          slug?: string
          sort_order?: number | null
          subtitle?: string | null
          tagline?: string | null
          title?: string
          tone?: string | null
          treatment_type?: string | null
          type?: Database["public"]["Enums"]["treatment_type"]
          unit?: string | null
          updated_at?: string | null
          who_for?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          partner_id: string
          reference_id: string | null
          reference_type: Database["public"]["Enums"]["reference_type"]
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          partner_id: string
          reference_id?: string | null
          reference_type: Database["public"]["Enums"]["reference_type"]
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          partner_id?: string
          reference_id?: string | null
          reference_type?: Database["public"]["Enums"]["reference_type"]
          transaction_type?: Database["public"]["Enums"]["wallet_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          provider: Database["public"]["Enums"]["webhook_provider"]
          signature: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean | null
          provider: Database["public"]["Enums"]["webhook_provider"]
          signature?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          provider?: Database["public"]["Enums"]["webhook_provider"]
          signature?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_admin_booking_sales: {
        Row: {
          paid_booking_sales: number | null
          paid_bookings_count: number | null
          total_bookings: number | null
        }
        Relationships: []
      }
      v_admin_commission_by_level: {
        Row: {
          approved_amount: number | null
          level: number | null
          paid_amount: number | null
          pending_amount: number | null
          total_amount: number | null
        }
        Relationships: []
      }
      v_admin_payout_summary: {
        Row: {
          paid_payouts: number | null
          pending_payouts: number | null
        }
        Relationships: []
      }
      v_admin_wallet_summary: {
        Row: {
          total_earnings: number | null
          total_paid_earnings: number | null
          total_wallet_balance: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_active_commission_percentages: {
        Args: never
        Returns: {
          level_1: number
          level_2: number
          level_3: number
          level_4: number
        }[]
      }
      kia_approve_paid_membership: {
        Args: { membership_uuid: string }
        Returns: {
          approved_at: string
          city: string
          email: string
          full_name: string
          partner_code: string
          partner_id: string
          phone: string
          referral_link: string
        }[]
      }
      kia_is_admin: { Args: { check_user_id?: string }; Returns: boolean }
      kia_lookup_referrer: {
        Args: { raw_code: string }
        Returns: {
          partner_code: string
          partner_name: string
          valid: boolean
        }[]
      }
      kia_generate_booking_commissions: {
        Args: { booking_uuid: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          level: number
          partner_id: string
          percentage: number
          source_id: string
          status: Database["public"]["Enums"]["commission_status"]
        }[]
      }
      kia_next_booking_id: { Args: never; Returns: string }
      kia_next_membership_id: { Args: never; Returns: string }
      kia_next_partner_code: { Args: never; Returns: string }
      kia_next_referral_transaction_id: { Args: never; Returns: string }
      kia_next_treatment_order_id: { Args: never; Returns: string }
      process_partner_payout: {
        Args: {
          new_status_input: string
          payout_id_input: string
          transaction_note_input?: string
          transaction_reference_input?: string
        }
        Returns: Json
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      commission_status: "pending" | "approved" | "paid" | "rejected"
      kyc_status: "not_submitted" | "pending" | "verified" | "rejected"
      membership_status:
        | "pending_payment"
        | "paid"
        | "under_review"
        | "approved"
        | "rejected"
        | "active"
        | "expired"
      notification_type:
        | "membership_approved"
        | "membership_rejected"
        | "new_referral"
        | "commission_generated"
        | "commission_approved"
        | "payout_requested"
        | "payout_paid"
        | "new_booking"
        | "booking_confirmed"
        | "shipping_updated"
      otp_type:
        | "phone_verification"
        | "email_verification"
        | "password_reset"
        | "login_2fa"
      partner_status:
        | "active"
        | "inactive"
        | "pending"
        | "suspended"
        | "approved"
      payment_status:
        | "pending_payment"
        | "paid"
        | "failed"
        | "unpaid"
        | "pending"
        | "refunded"
      payout_status: "requested" | "processing" | "paid" | "rejected"
      razorpay_status:
        | "created"
        | "authorized"
        | "captured"
        | "refunded"
        | "failed"
      reference_type: "commission" | "payout" | "manual_adjustment"
      shipping_status:
        | "pending"
        | "created"
        | "shipped"
        | "delivered"
        | "cancelled"
      slot_status: "available" | "full" | "cancelled"
      source_type: "membership" | "booking"
      support_status: "open" | "in_progress" | "resolved" | "closed"
      treatment_type: "home_kit" | "clinic" | "campaign"
      user_role:
        | "super_admin"
        | "admin"
        | "staff"
        | "content_manager"
        | "partner"
        | "customer"
      wallet_transaction_type:
        | "commission_credit"
        | "payout_debit"
        | "adjustment_credit"
        | "adjustment_debit"
      webhook_provider: "razorpay" | "shiprocket"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      commission_status: ["pending", "approved", "paid", "rejected"],
      kyc_status: ["not_submitted", "pending", "verified", "rejected"],
      membership_status: [
        "pending_payment",
        "paid",
        "under_review",
        "approved",
        "rejected",
        "active",
        "expired",
      ],
      notification_type: [
        "membership_approved",
        "membership_rejected",
        "new_referral",
        "commission_generated",
        "commission_approved",
        "payout_requested",
        "payout_paid",
        "new_booking",
        "booking_confirmed",
        "shipping_updated",
      ],
      otp_type: [
        "phone_verification",
        "email_verification",
        "password_reset",
        "login_2fa",
      ],
      partner_status: [
        "active",
        "inactive",
        "pending",
        "suspended",
        "approved",
      ],
      payment_status: [
        "pending_payment",
        "paid",
        "failed",
        "unpaid",
        "pending",
        "refunded",
      ],
      payout_status: ["requested", "processing", "paid", "rejected"],
      razorpay_status: [
        "created",
        "authorized",
        "captured",
        "refunded",
        "failed",
      ],
      reference_type: ["commission", "payout", "manual_adjustment"],
      shipping_status: [
        "pending",
        "created",
        "shipped",
        "delivered",
        "cancelled",
      ],
      slot_status: ["available", "full", "cancelled"],
      source_type: ["membership", "booking"],
      support_status: ["open", "in_progress", "resolved", "closed"],
      treatment_type: ["home_kit", "clinic", "campaign"],
      user_role: [
        "super_admin",
        "admin",
        "staff",
        "content_manager",
        "partner",
        "customer",
      ],
      wallet_transaction_type: [
        "commission_credit",
        "payout_debit",
        "adjustment_credit",
        "adjustment_debit",
      ],
      webhook_provider: ["razorpay", "shiprocket"],
    },
  },
} as const
