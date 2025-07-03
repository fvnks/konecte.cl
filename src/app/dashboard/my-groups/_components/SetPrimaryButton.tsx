'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { setPrimaryGroupAction } from '@/actions/groupActions';
import { Star } from 'lucide-react';

interface SetPrimaryButtonProps {
  groupId: string;
  isPrimary: boolean;
}

export default function SetPrimaryButton({ groupId, isPrimary }: SetPrimaryButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await setPrimaryGroupAction(groupId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  if (isPrimary) {
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <Star className="h-3 w-3" />
        <span>Principal</span>
      </Badge>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? 'Cargando...' : 'Elegir como principal'}
    </Button>
  );
} 