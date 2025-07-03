'use client';

import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface GroupBadgeProps {
  groupName?: string | null;
}

export default function GroupBadge({ groupName }: GroupBadgeProps) {
  if (!groupName) return null;

  console.log('GroupBadge rendering with groupName:', groupName);

  return (
    <Badge className="text-xs py-0.5 px-2 font-normal bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-0 whitespace-nowrap flex items-center gap-1">
      <Users className="h-3 w-3" />
      {groupName}
    </Badge>
  );
} 