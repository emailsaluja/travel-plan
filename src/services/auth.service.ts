import { supabase } from '../lib/supabase';
import { AuthError } from '@supabase/supabase-js';

export class AuthService {
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        data: null,
        error: {
          message: error?.message || 'An error occurred during sign in'
        } as AuthError
      };
    }
  }

  static async signUp(email: string, password: string, fullName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error?.message || 'An error occurred during sign up'
        } as AuthError
      };
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error: any) {
      return {
        error: {
          message: error?.message || 'An error occurred during sign out'
        } as AuthError
      };
    }
  }

  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        return { user: null, error };
      }
      return { user, error: null };
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: error?.message || 'An error occurred while getting user'
        } as AuthError
      };
    }
  }

  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        return { session: null, error };
      }
      return { session, error: null };
    } catch (error: any) {
      return {
        session: null,
        error: {
          message: error?.message || 'An error occurred while getting session'
        } as AuthError
      };
    }
  }

  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: error?.message || 'An error occurred while resetting password'
        } as AuthError
      };
    }
  }
} 