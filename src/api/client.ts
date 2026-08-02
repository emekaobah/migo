import { mockApi } from './mock';
import type { MigoApi } from './types';

/**
 * The single swap point.
 *
 * When a real backend exists, `src/api/mock/` is deleted and an HTTP client is
 * assigned here. No screen imports the mock directly, so nothing else changes
 * (PLAN §10).
 */
export const api: MigoApi = mockApi;

export type { MigoApi };
