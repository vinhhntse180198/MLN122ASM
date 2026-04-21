import type { GameStats } from "./types";

/** Animation khách vãng lai (đồng bộ Index ↔ GameCanvas). */
export type ShopVisitorStage = "walking_in" | "at_counter" | "walking_out";

export interface ShopVisitorAnim {
  stage: ShopVisitorStage;
  stageSinceMs: number;
  /** Đang đợi có hàng (tồn kho = 0). */
  waitingForStock: boolean;
}

export const SHOP_VISITOR_WALK_IN_MS = 2400;
export const SHOP_VISITOR_WALK_OUT_MS = 2400;

/** Xác suất khách mua 1 sp (cùng quy tắc với ZonePanel). */
export function directSaleChance(pricePerUnit: number): number {
  let chance = 0.9;
  if (pricePerUnit > 250) chance = 0.2;
  else if (pricePerUnit > 200) chance = 0.6;
  return chance;
}

export type DirectSaleRoll =
  | { success: true; earned: number; next: GameStats }
  | { success: false; next: GameStats };

/** Thử bán đúng 1 sp bán lẻ (không đổi state nếu không đủ hàng). */
export function rollDirectSale(s: GameStats): DirectSaleRoll {
  if (s.inventory < 1) {
    return { success: false, next: s };
  }
  const chance = directSaleChance(s.pricePerUnit);
  if (Math.random() >= chance) {
    return { success: false, next: s };
  }
  const earned = s.pricePerUnit;
  return {
    success: true,
    earned,
    next: {
      ...s,
      money: s.money + earned,
      inventory: s.inventory - 1,
      soldDirect: s.soldDirect + 1,
    },
  };
}
