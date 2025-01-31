import { Database } from "@/integrations/supabase/types";

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type Customer = Database['public']['Tables']['customers']['Row'];

export type CustomerWithProfile = Customer & {
  profile: Profile | null;
};