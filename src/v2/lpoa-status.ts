/** Aligns with PRD LPOA status model (backend source of truth in production). */
export type LpoaStatus = 'LPOA_NOT_SIGNED' | 'LPOA_ACTIVE' | 'LPOA_REVOKED';

export interface LpoaStatusSnapshot {
  status: LpoaStatus;
  /** When status became ACTIVE (ISO string). */
  signedAtIso?: string;
  /** When member revoked (ISO string). */
  revokedAtIso?: string;
}
