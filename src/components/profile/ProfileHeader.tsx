import { Link } from 'react-router-dom';
import { Edit3, Mic } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FollowButton } from './FollowButton';
import { useFollowCounts } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types';

interface ProfileHeaderProps {
  profile: Profile;
  postsCount?: number;
  onToast?: (type: 'success' | 'error', title: string) => void;
}

export function ProfileHeader({ profile, postsCount = 0, onToast }: ProfileHeaderProps) {
  const { user } = useAuth();
  const { data: counts } = useFollowCounts(profile.id);
  const isOwner = user?.id === profile.id;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      {/* Avatar e ações */}
      <div className="flex items-start justify-between gap-4">
        <Avatar
          src={profile.avatar_url}
          name={profile.full_name || profile.username}
          size="xl"
        />

        <div className="flex gap-2 flex-wrap">
          {isOwner ? (
            <Link to="/editar-perfil">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Edit3 size={15} />
                Editar perfil
              </Button>
            </Link>
          ) : (
            <FollowButton targetUserId={profile.id} onToast={onToast} />
          )}
        </div>
      </div>

      {/* Info */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {profile.full_name || profile.username}
        </h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        {profile.bio && (
          <p className="text-sm text-foreground mt-2 leading-relaxed">{profile.bio}</p>
        )}
      </div>

      {/* Estatísticas */}
      <div className="flex gap-6 pt-2 border-t border-border">
        <div className="flex items-center gap-2 text-sm">
          <Mic size={16} className="text-[#25D366]" />
          <span className="font-bold text-foreground">{postsCount}</span>
          <span className="text-muted-foreground">posts</span>
        </div>
        <div className="text-sm">
          <span className="font-bold text-foreground">{counts?.followers ?? 0}</span>
          <span className="text-muted-foreground ml-1">seguidores</span>
        </div>
        <div className="text-sm">
          <span className="font-bold text-foreground">{counts?.following ?? 0}</span>
          <span className="text-muted-foreground ml-1">seguindo</span>
        </div>
      </div>
    </div>
  );
}
