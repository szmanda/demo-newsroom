import { useQuery } from '@tanstack/react-query';
import { fetchLatestDispatches, type FetchDispatchesParams } from '../api/wire';

export function useWireDispatches(
  params: FetchDispatchesParams = {},
  isLive: boolean = true
) {
  return useQuery({
    queryKey: ['dispatches', params.urgency, params.category, params.limit, params.offset],
    queryFn: () => fetchLatestDispatches(params),
    refetchInterval: isLive ? 4000 : false,
    refetchIntervalInBackground: false,
    staleTime: 2000,
  });
}
