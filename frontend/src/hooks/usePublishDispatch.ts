import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishDispatch } from '../api/wire';
import type { CreateWirePayload, WireDispatch, WireListResponse } from '../types/wire';

export function usePublishDispatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWirePayload) => publishDispatch(payload),

    // Optimistic update
    onMutate: async (newPayload: CreateWirePayload) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['dispatches'] });

      // Snapshot previous cache state
      const previousData = queryClient.getQueriesData<WireListResponse>({
        queryKey: ['dispatches'],
      });

      const optimisticItem: WireDispatch = {
        id: -Date.now(),
        uuid: 'optimistic-' + Math.random().toString(36).substring(2, 9),
        type: 'wire_dispatch',
        title: newPayload.title,
        lead: newPayload.lead || '',
        body: newPayload.body || '',
        urgency_level: newPayload.urgency_level,
        category: newPayload.category ? { id: 0, name: newPayload.category } : null,
        author_signature: newPayload.author_signature || '(PAP) desk',
        embargo_until: newPayload.embargo_until || null,
        created: new Date().toISOString(),
        changed: new Date().toISOString(),
        is_flash: newPayload.urgency_level === 'FLASH',
        isOptimistic: true,
      };

      // Optimistically update all matching queries
      queryClient.setQueriesData<WireListResponse>(
        { queryKey: ['dispatches'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            meta: {
              ...old.meta,
              count: old.meta.count + 1,
            },
            data: [optimisticItem, ...old.data],
          };
        }
      );

      return { previousData };
    },

    onError: (_err, _newPayload, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      // Refetch and sync with server
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
    },
  });
}
