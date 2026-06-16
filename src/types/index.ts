// ====================================================
// VozZap - Interfaces TypeScript das entidades
// ====================================================

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  audio_url: string;
  duration_seconds: number;
  visibility: 'public' | 'private';
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  // Relacionamentos opcionais (joined)
  profiles?: Profile;
  is_liked?: boolean;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  // Relacionamento opcional
  author?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  // Relacionamentos opcionais
  sender?: Profile;
  receiver?: Profile;
}

export interface Conversation {
  partner: Profile;
  last_message: Message | null;
  unread_count: number;
}

// ====================================================
// Tipos auxiliares para formulários e estados
// ====================================================

export interface AuthFormData {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
}

export interface PostFormData {
  title: string;
  description: string;
  category: string;
  audio_url: string;
  audio_file?: File | null;
  duration_seconds: number;
  visibility: 'public' | 'private';
}

export interface ProfileFormData {
  username: string;
  full_name: string;
  bio: string;
  avatar_file?: File | null;
}

// ====================================================
// Tipos de resposta do Supabase
// ====================================================

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  nextPage: number;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}
