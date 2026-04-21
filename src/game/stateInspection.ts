/** Đoàn thanh tra (CA + cán bộ) từ 🏛️ tới 🏭 — kết thúc thì Index áp phạt theo thuế / tăng ca. */

export type StateAuditPhase = "to_factory" | "audit" | "to_state";

export interface StateAuditAnim {
  phase: StateAuditPhase;
  phaseEnteredMs: number;
}

export const STATE_AUDIT_TO_FACTORY_MS = 4000;
export const STATE_AUDIT_PAUSE_MS = 2400;
export const STATE_AUDIT_TO_STATE_MS = 4000;
