export type UrgencyLevel = 'FLASH' | 'URGENT' | 'ROUTINE';

export interface WireCategory {
  id: number;
  name: string;
}

export interface WireDispatch {
  id: number;
  uuid: string;
  type: 'wire_dispatch';
  title: string;
  lead: string;
  body: string;
  urgency_level: UrgencyLevel;
  category: WireCategory | null;
  author_signature: string;
  embargo_until: string | null;
  created: string;
  changed: string;
  is_flash: boolean;
  // Client-side optimistic flag
  isOptimistic?: boolean;
}

export interface WireListMeta {
  count: number;
  offset: number;
  limit: number;
  generated_at: string;
}

export interface WireListResponse {
  meta: WireListMeta;
  data: WireDispatch[];
}

export interface WireItemResponse {
  data: WireDispatch;
}

export interface CreateWirePayload {
  title: string;
  lead?: string;
  body?: string;
  urgency_level: UrgencyLevel;
  category?: string;
  author_signature?: string;
  embargo_until?: string | null;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
}
