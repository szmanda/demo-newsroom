import { apiClient } from './client';
import type {
  CreateWirePayload,
  WireDispatch,
  WireItemResponse,
  WireListResponse,
} from '../types/wire';

export interface FetchDispatchesParams {
  urgency?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export async function fetchLatestDispatches(
  params: FetchDispatchesParams = {}
): Promise<WireListResponse> {
  const searchParams = new URLSearchParams();
  if (params.urgency && params.urgency !== 'ALL') {
    searchParams.set('urgency', params.urgency);
  }
  if (params.category && params.category !== 'ALL') {
    searchParams.set('category', params.category);
  }
  if (params.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params.offset) {
    searchParams.set('offset', params.offset.toString());
  }

  const queryString = searchParams.toString();
  const endpoint = `/api/v1/wire/latest${queryString ? `?${queryString}` : ''}`;
  return apiClient<WireListResponse>(endpoint);
}

export async function fetchDispatchById(id: number): Promise<WireDispatch> {
  const response = await apiClient<WireItemResponse>(`/api/v1/wire/${id}`);
  return response.data;
}

export async function publishDispatch(
  payload: CreateWirePayload
): Promise<WireDispatch> {
  const response = await apiClient<WireItemResponse>('/api/v1/wire/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
}
