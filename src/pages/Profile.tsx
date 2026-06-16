import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFollow } from '@/hooks/useFollow';
import { useToast } from '@/hooks/useToast';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PostCard } from '@/components/feed/PostCard';
import { supabase } from '@/lib/supabase';
import type { Profile, Post } from '@/types';
import { Mail, Edit2, Loader2, UserPlus, UserMinus, Mic } from 'lucide-react';

export function Profile() {
  const { username: paramUsername } = useParams();
  const { user, profile: authProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', full_name: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Determinar qual perfil exibir
  const targetUsername = paramUsername || authProfile?.username;
  const isOwnProfile = !paramUsername || authProfile?.username === paramUsername;

  // Hook de follow (apenas se for perfil de outro usuário)
  const followState = useFollow(profile?.id || '');

  useEffect(() => {
    fetchProfile();
  }, [targetUsername, paramUsername]);

  const fetchProfile = async () => {
    if (!targetUsername) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', targetUsername)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data as Profile);
        setEditForm({ bio: data.bio || '', full_name: data.full_name || '' });
        // Busca os posts do usuário após carregar o perfil
        await fetchUserPosts(data.id);
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      toast.addToast('error', 'Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = useCallback(async (userId: string) => {
    setIsLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`*, profiles (id, username, full_name, avatar_url)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data as Post[]) || []);
    } catch (err) {
      console.error('Erro ao buscar posts:', err);
      toast.addToast('error', 'Erro ao carregar áudios');
    } finally {
      setIsLoadingPosts(false);
    }
  }, [toast]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: editForm.bio,
          full_name: editForm.full_name,
        })
        .eq('id', profile.id);

      if (error) throw error;
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
      toast.addToast('success', 'Perfil atualizado!');
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      toast.addToast('error', 'Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFollow = async () => {
    try {
      await followState.toggleFollow();
      toast.addToast(
        'success',
        followState.isFollowing ? 'Deixou de seguir' : 'Seguindo!'
      );
    } catch (err) {
      console.error('Erro ao seguir:', err);
      toast.addToast('error', 'Erro ao atualizar seguimento');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-[#25D366]" size={32} />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <p className="text-muted-foreground mb-4">Perfil não encontrado</p>
          <Button onClick={() => navigate('/')}>Voltar para início</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        {/* Header do Perfil */}
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm mb-6">
          <div className="flex gap-6 mb-6">
            <Avatar url={profile.avatar_url} name={profile.full_name} size="lg" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{profile.full_name}</h1>
              <p className="text-lg text-muted-foreground">@{profile.username}</p>

              {isOwnProfile && !isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="mt-4 flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Editar Perfil
                </Button>
              )}

              {!isOwnProfile && (
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleFollow}
                    variant={followState.isFollowing ? 'outline' : 'primary'}
                    size="sm"
                    disabled={followState.isLoading}
                    className="flex items-center gap-2"
                  >
                    {followState.isFollowing ? (
                      <>
                        <UserMinus size={16} />
                        Deixar de seguir
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Seguir
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => navigate(`/mensagens/${profile.username}`)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Mail size={16} />
                    Mensagem
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {isEditing && isOwnProfile ? (
            <div className="space-y-4">
              <Input
                label="Nome completo"
                value={editForm.full_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
              />
              <Textarea
                label="Bio"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Fale sobre você..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="animate-spin" size={16} />}
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {profile.bio && (
                <p className="text-foreground mb-4">{profile.bio}</p>
              )}
            </>
          )}
        </div>

        {/* Áudios do usuário */}
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-6">Áudios</h2>
          
          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#25D366]" size={32} />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mic size={40} className="text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum áudio publicado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onToast={(type, title, desc) => {
                    if (type === 'success') toast.success(title, desc);
                    else toast.error(title, desc);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
