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
          id: string
          is_active: boolean | null
          notes: string | null
          payment_amount: number | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pin_code: string
          referral_code: string | null
          referred_by: string | null
          refund_status: string | null
          shipping_status: Database["public"]["Enums"]["shipping_status"] | null
          tracking_id: string | null
          treatment_id: string
          updated_at: string | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
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
          id?: string
          is_active?: boolean | null
          notes?: string | null
          payment_amount?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pin_code: string
          referral_code?: string | null
          referred_by?: string | null
          refund_status?: string | null
          shipping_status?:
            | Database["public"]["Enums"]["shipping_status"]
            | null
          tracking_id?: string | null
          treatment_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
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
          id?: string
          is_active?: boolean | null
          notes?: string | null
          payment_amount?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pin_code?: string
          referral_code?: string | null
          referred_by?: string | null
          refund_status?: string | null
          shipping_status?:
            | Database["public"]["Enums"]["shipping_status"]
            | null
          tracking_id?: string | null
          treatment_id?: string
          updated_at?: string | null
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
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string | null
          whatsapp_number: string | null
          whatsapp_url: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
          whatsapp_url?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
          whatsapp_url?: string | null
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
          membership_status: Database["public"]["Enums"]["membership_status"]
          mobile: string
          notes: string | null
          partner_id: string | null
          payment_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pin_code: string
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
          membership_status?: Database["public"]["Enums"]["membership_status"]
          mobile: string
          notes?: string | null
          partner_id?: string | null
          payment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pin_code: string
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
          membership_status?: Database["public"]["Enums"]["membership_status"]
          mobile?: string
          notes?: string | null
          partner_id?: string | null
          payment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pin_code?: string
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
          membership_purchased_at: string | null
          paid_earnings: number | null
          pan_number: string | null
          partner_code: string
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
          membership_purchased_at?: string | null
          paid_earnings?: number | null
          pan_number?: string | null
          partner_code: string
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
          membership_purchased_at?: string | null
          paid_earnings?: number | null
          pan_number?: string | null
          partner_code?: string
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
          available_balance: number
          created_at: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          partner_id: string
          payment_details: string
          payment_method: string
          payment_proof: string | null
          processed_at: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          available_balance: number
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          partner_id: string
          payment_details: string
          payment_method: string
          payment_proof?: string | null
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          available_balance?: number
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          partner_id?: string
          payment_details?: string
          payment_method?: string
          payment_proof?: string | null
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
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
          created_at: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          id: string
          phone: string | null
          phone_verified: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          phone?: string | null
          phone_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
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
        }
        Insert: {
          ancestor_id: string
          created_at?: string | null
          descendant_id: string
          id?: string
          level: number
          locked?: boolean | null
        }
        Update: {
          ancestor_id?: string
          created_at?: string | null
          descendant_id?: string
          id?: string
          level?: number
          locked?: boolean | null
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
          content_key: string
          content_value: Json
          created_at: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          page: string
          section: string
          updated_at: string | null
        }
        Insert: {
          content_key: string
          content_value: Json
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          page: string
          section: string
          updated_at?: string | null
        }
        Update: {
          content_key?: string
          content_value?: Json
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          page?: string
          section?: string
          updated_at?: string | null
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
          id: string
          maintenance_mode: boolean | null
          membership_enabled: boolean | null
          payouts_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          bookings_enabled?: boolean | null
          commissions_enabled?: boolean | null
          created_at?: string | null
          id?: string
          maintenance_mode?: boolean | null
          membership_enabled?: boolean | null
          payouts_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          bookings_enabled?: boolean | null
          commissions_enabled?: boolean | null
          created_at?: string | null
          id?: string
          maintenance_mode?: boolean | null
          membership_enabled?: boolean | null
          payouts_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      treatments: {
        Row: {
          active: boolean | null
          available_cities: Json | null
          badge: string | null
          benefits: Json | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          duration: string | null
          faqs: Json | null
          id: string
          image: string | null
          image_alt: string | null
          is_active: boolean | null
          price: number
          price_label: string | null
          process_steps: Json | null
          requires_slots: boolean | null
          safety: string | null
          sessions: string | null
          slug: string
          subtitle: string | null
          tagline: string | null
          title: string
          tone: string | null
          type: Database["public"]["Enums"]["treatment_type"]
          unit: string | null
          updated_at: string | null
          who_for: string | null
        }
        Insert: {
          active?: boolean | null
          available_cities?: Json | null
          badge?: string | null
          benefits?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          faqs?: Json | null
          id?: string
          image?: string | null
          image_alt?: string | null
          is_active?: boolean | null
          price: number
          price_label?: string | null
          process_steps?: Json | null
          requires_slots?: boolean | null
          safety?: string | null
          sessions?: string | null
          slug: string
          subtitle?: string | null
          tagline?: string | null
          title: string
          tone?: string | null
          type: Database["public"]["Enums"]["treatment_type"]
          unit?: string | null
          updated_at?: string | null
          who_for?: string | null
        }
        Update: {
          active?: boolean | null
          available_cities?: Json | null
          badge?: string | null
          benefits?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          faqs?: Json | null
          id?: string
          image?: string | null
          image_alt?: string | null
          is_active?: boolean | null
          price?: number
          price_label?: string | null
          process_steps?: Json | null
          requires_slots?: boolean | null
          safety?: string | null
          sessions?: string | null
          slug?: string
          subtitle?: string | null
          tagline?: string | null
          title?: string
          tone?: string | null
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
      partner_status: "active" | "inactive" | "pending" | "suspended"
      payment_status: "pending_payment" | "paid" | "failed"
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
      partner_status: ["active", "inactive", "pending", "suspended"],
      payment_status: ["pending_payment", "paid", "failed"],
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

