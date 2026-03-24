import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

// Re-using TrainingRecord type
import type { TrainingRecord } from '../../../types';

export function useSlManagerUserProgress(userId: string) {
  return useQuery({
    queryKey: ['sl-manager', 'users', userId, 'progress'],
    queryFn: async () => {
      const { data } = await api.get<TrainingRecord[]>(`/sl-manager/users/${userId}/progress`);
      return data;
    },
    enabled: !!userId,
  });
}
