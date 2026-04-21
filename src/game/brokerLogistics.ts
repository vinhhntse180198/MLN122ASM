/** Chuỗi animation sau khi bán sỉ cho trung gian: xe đi lấy hàng tại NM → về kho TG → chuyển tới CH → nhãn đã bán. */

export type BrokerLogisticsPhase =
  | "pickup_to_factory"
  | "pickup_load"
  | "pickup_to_broker"
  | "delivery_to_shop"
  | "sold_retail_flash";

export interface BrokerLogisticsAnim {
  phase: BrokerLogisticsPhase;
  phaseEnteredMs: number;
}

export const BROKER_LEG_TO_FACTORY_MS = 3200;
export const BROKER_AT_FACTORY_MS = 1200;
export const BROKER_LEG_TO_BROKER_MS = 3200;
export const BROKER_LEG_TO_SHOP_MS = 4200;
export const BROKER_SOLD_BADGE_MS = 2600;
