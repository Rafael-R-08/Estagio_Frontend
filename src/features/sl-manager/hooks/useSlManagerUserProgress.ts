import { useQuery } from '@tanstack/react-query';
import { slManagerApi } from '../../../services/api';

export function useSlManagerUserDetail(userId: string) {
  return useQuery({
    queryKey: ['sl-manager', 'users', userId, 'detail'],
    queryFn: () => slManagerApi.getUserDetail(userId).then((r) => r.data),
    enabled: !!userId,
  });
}

/** @deprecated Use useSlManagerUserDetail */
export function useSlManagerUserProgress(userId: string) {
  return useSlManagerUserDetail(userId);
}
