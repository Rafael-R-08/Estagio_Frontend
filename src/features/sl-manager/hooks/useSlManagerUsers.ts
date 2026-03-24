import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

// Note: Re-using User and TrainingStats from types
import type { User } from '../../../types';

interface SlManagerUserItem extends User {
  completedTrainingsCount: number;
  certificatesCount: number;
}

export function useSlManagerUsers() {
  return useQuery({
    queryKey: ['sl-manager', 'users'],
    queryFn: async () => {
      const { data } = await api.get<SlManagerUserItem[]>('/sl-manager/users');
      return data;
    },
  });
}
