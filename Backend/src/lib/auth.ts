import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { HttpError } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';

export type Profile = {
  id: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = { id: string; email: string | undefined };

type ProfileRow = { id: string; full_name: string; created_at: string; updated_at: string };

export const PROFILE_COLUMNS = 'id, full_name, created_at, updated_at';

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email };
}

export function mapProfile(row: ProfileRow): Profile {
  return { id: row.id, fullName: row.full_name, createdAt: row.created_at, updatedAt: row.updated_at };
}

/** Devuelve el cliente y el usuario validado contra Supabase Auth, o lanza 401. */
export async function requireUser(): Promise<{ supabase: SupabaseClient; user: User }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new HttpError(401, 'No autenticado');
  return { supabase, user: data.user };
}

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}
