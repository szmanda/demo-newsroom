import type { ProblemDetails } from '../types/wire';

export class ApiError extends Error {
  public status: number;
  public problem?: ProblemDetails;

  constructor(message: string, status: number, problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

const DEFAULT_API_KEY = 'secret-pap-editorial-key';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = localStorage.getItem('pap_editorial_api_key') || DEFAULT_API_KEY;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('X-Newsroom-Api-Key')) {
    headers.set('X-Newsroom-Api-Key', apiKey);
  }

  const url = endpoint.startsWith('http') ? endpoint : endpoint;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let problem: ProblemDetails | undefined;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('json')) {
        problem = await response.json();
      }
    } catch {
      // Non-JSON error body
    }

    const errorMessage =
      problem?.detail || problem?.title || `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status, problem);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
