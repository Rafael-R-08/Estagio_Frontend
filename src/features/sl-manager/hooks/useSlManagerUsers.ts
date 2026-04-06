import { useQuery } from '@tanstack/react-query';
import { slManagerApi } from '../../../services/api';

export function useSlManagerUsers() {
  return useQuery({
    queryKey: ['sl-manager', 'users'],
    queryFn: () => slManagerApi.getUsers().then((r) => r.data),
  });
}
