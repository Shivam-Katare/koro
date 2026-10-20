import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Shop, ShopMember } from "@/lib/supabase/types";
import type { LoginInput, SignUpInput, OnboardingInput } from "@/lib/validations/auth";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  activeShop: Shop | null;
  memberships: ShopMember[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (
    data: LoginInput
  ) => Promise<{ success: boolean; hasShop?: boolean; error?: string }>;
  signUpWithOwner: (
    data: SignUpInput
  ) => Promise<{ success: boolean; needsConfirmation?: boolean; error?: string }>;
  createShopWithOwner: (
    data: OnboardingInput
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  activeShop: null,
  memberships: [],
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let activeUser = session?.user ?? null;
      if (!activeUser) {
        const { data: userData } = await supabase.auth.getUser();
        activeUser = userData?.user ?? null;
      }

      if (activeUser) {
        set({ user: activeUser });
        await get().refreshUserData();
      } else {
        set({
          user: null,
          profile: null,
          activeShop: null,
          memberships: [],
          isLoading: false,
          isInitialized: true,
        });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          set({ user: session.user });
          await get().refreshUserData();
        } else {
          set({
            user: null,
            profile: null,
            activeShop: null,
            memberships: [],
            isLoading: false,
            isInitialized: true,
          });
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initialize auth";
      console.error("[AuthStore] Init error:", message);
      set({ isLoading: false, isInitialized: true });
    }
  },

  refreshUserData: async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        set({
          user: null,
          profile: null,
          activeShop: null,
          memberships: [],
          isLoading: false,
          isInitialized: true,
        });
        return;
      }

      // Fetch profile or upsert from auth user metadata if not created yet
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      let currentProfile = (profile as unknown as Profile) ?? null;
      if (!currentProfile) {
        const meta = user.user_metadata || {};
        const fullName =
          meta.full_name ||
          meta.name ||
          user.email?.split("@")[0] ||
          "Shop Owner";
        const avatarUrl = meta.avatar_url || meta.picture || null;
        const { data: newProfile } = await (supabase
          .from("profiles") as any)
          .upsert({
            id: user.id,
            full_name: fullName,
            email: user.email || "",
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .select("*")
          .maybeSingle();
        currentProfile = (newProfile as unknown as Profile) ?? null;
      }

      // Fetch memberships with shop details
      const { data: memberships } = await supabase
        .from("shop_members")
        .select("*")
        .eq("user_id", user.id);

      let activeShop: Shop | null = null;
      const memberList = (memberships as unknown as ShopMember[]) ?? [];
      if (memberList.length > 0 && memberList[0].shop_id) {
        const { data: shop } = await supabase
          .from("shops")
          .select("*")
          .eq("id", memberList[0].shop_id)
          .maybeSingle();
        activeShop = (shop as unknown as Shop) ?? null;
      }

      set({
        user,
        profile: currentProfile,
        activeShop,
        memberships: memberList,
        isLoading: false,
        isInitialized: true,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load user data";
      console.error("[AuthStore] Refresh error:", message);
      set({ isLoading: false, isInitialized: true });
    }
  },

  signInWithEmail: async ({ email, password }) => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const userFriendlyMsg =
          error.message === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : error.message;
        toast.error(userFriendlyMsg);
        set({ isLoading: false });
        return { success: false, error: userFriendlyMsg };
      }

      set({ user: data.user });
      await get().refreshUserData();
      const hasShop = (get().memberships?.length || 0) > 0;
      toast.success("Welcome back!");
      return { success: true, hasShop };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      toast.error(message);
      set({ isLoading: false });
      return { success: false, error: message };
    }
  },

  createShopWithOwner: async (input) => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      let user = get().user;

      // If user is not yet hydrated in memory (e.g. fresh OAuth redirect), fetch from session
      if (!user) {
        const { data: authData } = await supabase.auth.getUser();
        user = authData?.user ?? null;
        if (user) {
          set({ user });
        }
      }

      if (!user) {
        toast.error("Please sign in first");
        set({ isLoading: false });
        return { success: false, error: "Not authenticated" };
      }

      const fullName =
        input.fullName?.trim() ||
        get().profile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Shop Owner";

      const { data: _res, error } = await (supabase as any).rpc(
        "create_shop_with_owner",
        {
          p_name: input.shopName.trim(),
          p_category: input.category,
          p_whatsapp_number: input.whatsappNumber?.trim() || "",
          p_full_name: fullName,
        }
      );

      if (error) {
        toast.error(error.message);
        set({ isLoading: false });
        return { success: false, error: error.message };
      }

      await get().refreshUserData();
      toast.success("Shop registered successfully!");
      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create shop";
      toast.error(message);
      set({ isLoading: false });
      return { success: false, error: message };
    }
  },

  signUpWithOwner: async (input) => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.fullName,
            shop_name: input.shopName,
            category: input.category,
            whatsapp_number: input.whatsappNumber,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        set({ isLoading: false });
        return { success: false, error: error.message };
      }

      if (data.session) {
        set({ user: data.user });
        await get().refreshUserData();
        toast.success("Shop registered successfully!");
        return { success: true };
      }

      // If email confirmation is required
      toast.success("Registration started! Please verify your email to log in.");
      set({ isLoading: false });
      return { success: true, needsConfirmation: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-up failed";
      toast.error(message);
      set({ isLoading: false });
      return { success: false, error: message };
    }
  },

  signInWithGoogle: async () => {
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      toast.error(message);
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      set({
        user: null,
        profile: null,
        activeShop: null,
        memberships: [],
        isLoading: false,
      });
      toast.success("Signed out successfully.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign out failed";
      toast.error(message);
      set({ isLoading: false });
    }
  },
}));
