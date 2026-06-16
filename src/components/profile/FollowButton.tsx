import { UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useFollow, useIsFollowing } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';

interface FollowButtonProps {
  targetUserId: string;
  onToast?: (type: 'success' | 'error', title: string) => void;
}

export function FollowButton({ targetUserId, onToast }: FollowButtonProps) {
  const { user } = useAuth();
  const followMutation = useFollow();
  const { data: isFollowing, isLoading } = useIsFollowing(user?.id, targetUserId);

  if (!user || user.id === targetUserId) return null;

  const handleClick = async () => {
    if (!user) return;
    try {
      await followMutation.mutateAsync({
        followerId: user.id,
        followingId: targetUserId,
        isFollowing: isFollowing ?? false,
      });
      onToast?.('success', isFollowing ? 'Deixou de seguir' : 'Seguindo!');
    } catch {
      onToast?.('error', 'Erro ao atualizar seguimento');
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" isLoading>
        &nbsp;
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'primary'}
      size="sm"
      onClick={handleClick}
      isLoading={followMutation.isPending}
      className="gap-1.5"
    >
      {isFollowing ? (
        <>
          <UserMinus size={15} />
          Seguindo
        </>
      ) : (
        <>
          <UserPlus size={15} />
          Seguir
        </>
      )}
    </Button>
  );
}
