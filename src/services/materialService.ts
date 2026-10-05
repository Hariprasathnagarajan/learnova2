import { apiClient } from './api/client';
import { ENDPOINTS } from './api/endpoints';
import type { Material } from '../types/course.types';

export interface MaterialAccessResponse {
  canAccess: boolean;
  reason?: string;
  material: Material;
  /** Short-lived signed token. Expires server-side; do not cache. */
  viewerToken: string;
  /** Endpoint that streams the bytes - already token-scoped, never a file path. */
  streamUrl: string;
  expiresInSeconds: number;
  /** Per-viewer stamp rendered over the content for leak attribution. */
  securityWatermark: string;
}

export const materialService = {
  async getMaterial(materialId: string): Promise<Material> {
    const { data } = await apiClient.get<Material>(`/materials/${materialId}/`);
    return data;
  },

  async requestAccess(materialId: string): Promise<MaterialAccessResponse> {
    const { data } = await apiClient.post<MaterialAccessResponse>(
      ENDPOINTS.materials.requestAccess(materialId),
    );
    return data;
  },

  /**
   * Absolute URL for the protected bytes. The server re-verifies the token and
   * re-checks enrolment on every request, so a revoked learner loses access
   * immediately even if they still hold a previously issued viewer token.
   */
  streamUrl(materialId: string, token: string, baseUrl: string): string {
    return `${baseUrl}${ENDPOINTS.materials.stream(materialId, token)}`;
  },
};