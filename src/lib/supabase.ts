// ====================================================
// VozZap - Cliente Supabase configurado via .env
// ====================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[VozZap] Variáveis de ambiente do Supabase não configuradas. ' +
    'Copie .env.example para .env e preencha com suas credenciais.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// ====================================================
// Helpers de Storage
// ====================================================

export function getAvatarUrl(userId: string, filename: string): string {
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}/${filename}`);
  return data.publicUrl;
}

export function getAudioUrl(userId: string, postId: string, filename: string): string {
  const { data } = supabase.storage
    .from('audios')
    .getPublicUrl(`${userId}/${postId}/${filename}`);
  return data.publicUrl;
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('[VozZap] Erro ao fazer upload do avatar:', error);
    return null;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAudio(
  userId: string,
  postId: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${postId}.${ext}`;

  const { error } = await supabase.storage
    .from('audios')
    .upload(path, file, { upsert: true });

  if (error) {
    console.error('[VozZap] Erro ao fazer upload do áudio:', error);
    return null;
  }

  const { data } = supabase.storage.from('audios').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteAudio(
  userId: string,
  postId: string,
  filename: string
): Promise<boolean> {
  const { error } = await supabase.storage
    .from('audios')
    .remove([`${userId}/${postId}/${filename}`]);

  if (error) {
    console.error('[VozZap] Erro ao excluir áudio:', error);
    return false;
  }
  return true;
}
