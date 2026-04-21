export type ZoneId = "factory" | "broker" | "shop" | "state";

export interface GameStats {
  money: number;
  inventory: number; // số điện thoại đang có
  produced: number;
  soldDirect: number;
  soldBroker: number;
  workers: number;
  wagePerUnit: number; // lương/sp
  materialPerUnit: number; // nguyên liệu/sp
  pricePerUnit: number; // giá bán
  surplusTotal: number; // tổng giá trị thặng dư đã tạo
  brokerLossTotal: number;
  taxPaid: number;
  /** Lần cuối bấm «Nộp thuế» (Date.now), 0 = chưa từng nộp — dùng cho thanh tra. */
  lastPayTaxAt: number;
  events: string[];
  // 3 cách tạo giá trị thặng dư
  overtime: boolean; // tuyệt đối
  hasMachine: boolean; // tương đối
  hasTech: boolean; // siêu ngạch
  workerMood: number; // 0-100
}

export const INITIAL_STATS: GameStats = {
  money: 300,
  inventory: 0,
  produced: 0,
  soldDirect: 0,
  soldBroker: 0,
  workers: 2,
  wagePerUnit: 50,
  materialPerUnit: 50,
  pricePerUnit: 200,
  surplusTotal: 0,
  brokerLossTotal: 0,
  taxPaid: 0,
  lastPayTaxAt: 0,
  events: [],
  overtime: false,
  hasMachine: false,
  hasTech: false,
  workerMood: 80,
};
