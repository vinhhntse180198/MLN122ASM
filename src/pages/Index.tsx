import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import GameCanvas from "@/game/GameCanvas";
import { LectureModal } from "@/game/LectureMaterial";
import ZonePanel from "@/game/ZonePanel";
import Report, { type SessionEndReason } from "@/game/Report";
import { INITIAL_STATS, type GameStats, type ZoneId } from "@/game/types";
import {
  rollDirectSale,
  type ShopVisitorAnim,
  SHOP_VISITOR_WALK_IN_MS,
  SHOP_VISITOR_WALK_OUT_MS,
} from "@/game/shopSale";
import {
  type BrokerLogisticsAnim,
  BROKER_AT_FACTORY_MS,
  BROKER_LEG_TO_BROKER_MS,
  BROKER_LEG_TO_FACTORY_MS,
  BROKER_LEG_TO_SHOP_MS,
  BROKER_SOLD_BADGE_MS,
} from "@/game/brokerLogistics";
import {
  type StateAuditAnim,
  STATE_AUDIT_PAUSE_MS,
  STATE_AUDIT_TO_FACTORY_MS,
  STATE_AUDIT_TO_STATE_MS,
} from "@/game/stateInspection";
import { cn } from "@/lib/utils";

/** Mỗi phiên chơi: 5 phút, hết giờ tự mở báo cáo. */
const SESSION_DURATION_SEC = 5 * 60;

/** Nghỉ giữa hai lượt khách (sau khi khách đã đi ra khỏi cửa hàng). */
const SHOP_GAP_MIN_MS = 5000;
const SHOP_GAP_MAX_MS = 10_000;

function randomShopGapMs(): number {
  return SHOP_GAP_MIN_MS + Math.floor(Math.random() * (SHOP_GAP_MAX_MS - SHOP_GAP_MIN_MS + 1));
}

const SHOP_COUNTER_WAIT_MS = 5000;
const SHOP_MAX_WAIT_NO_STOCK_MS = 12_000;
/** Khoảng nghỉ giữa hai lần đoàn thanh tra xuất phát (ngẫu nhiên 30–45 giây). */
const STATE_AUDIT_INTERVAL_MIN_MS = 30_000;
const STATE_AUDIT_INTERVAL_MAX_MS = 45_000;

function randomStateAuditGapMs(): number {
  return (
    STATE_AUDIT_INTERVAL_MIN_MS +
    Math.random() * (STATE_AUDIT_INTERVAL_MAX_MS - STATE_AUDIT_INTERVAL_MIN_MS)
  );
}

/** Chu kỳ sự kiện lạm phát (lệch pha với thanh tra). */
const INFLATION_EVENT_MIN_MS = 50_000;
const INFLATION_EVENT_MAX_MS = 85_000;
const MATERIAL_PER_UNIT_CAP = 90;

function randomInflationGapMs(): number {
  return INFLATION_EVENT_MIN_MS + Math.random() * (INFLATION_EVENT_MAX_MS - INFLATION_EVENT_MIN_MS);
}

function formatSessionClock(totalSec: number): string {
  const s = Math.max(0, totalSec);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** Chi phí SX tối thiểu 1 sp (cùng công thức ZonePanel). */
function produceOneUnitCost(s: GameStats): number {
  const mat = s.materialPerUnit * (s.hasTech ? 0.7 : 1);
  return mat + s.wagePerUnit;
}

const Index = () => {
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [nearZone, setNearZone] = useState<ZoneId | null>(null);
  const [openZone, setOpenZone] = useState<ZoneId | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [sessionEndReason, setSessionEndReason] = useState<SessionEndReason>(null);
  const [showLecture, setShowLecture] = useState(false);
  /** Chưa bấm «Bắt đầu chơi» — đồng hồ phiên và sự kiện tự động chưa chạy. */
  const [gameStarted, setGameStarted] = useState(false);
  const [remainingSec, setRemainingSec] = useState(SESSION_DURATION_SEC);
  const timerEndedRef = useRef(false);
  /** Tránh kích hoạt phá sản hai lần (Strict Mode / cập nhật state). */
  const bankruptGuardRef = useRef(false);
  const [shopVisitorAnim, setShopVisitorAnim] = useState<ShopVisitorAnim | null>(null);
  const [shopMoneyFlash, setShopMoneyFlash] = useState<{
    id: number;
    amount: number;
    startMs: number;
  } | null>(null);
  const [brokerLogisticsAnim, setBrokerLogisticsAnim] = useState<BrokerLogisticsAnim | null>(null);
  const [stateAuditAnim, setStateAuditAnim] = useState<StateAuditAnim | null>(null);
  const shopPurchaseTimeoutsRef = useRef<number[]>([]);
  const brokerLogisticsTimeoutsRef = useRef<number[]>([]);
  const stateAuditTimeoutsRef = useRef<number[]>([]);
  /** Cập nhật mỗi render — KHÔNG đưa remainingSec vào deps của effect khách (mỗi giây sẽ hủy setTimeout). */
  const remainingSecRef = useRef(remainingSec);
  remainingSecRef.current = remainingSec;
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const showReportRef = useRef(showReport);
  showReportRef.current = showReport;
  const gameStartedRef = useRef(gameStarted);
  gameStartedRef.current = gameStarted;

  const clearBrokerLogistics = useCallback(() => {
    brokerLogisticsTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    brokerLogisticsTimeoutsRef.current = [];
    setBrokerLogisticsAnim(null);
  }, []);

  const startBrokerLogisticsSequence = useCallback(() => {
    clearBrokerLogistics();
    const push = (id: number) => brokerLogisticsTimeoutsRef.current.push(id);
    setBrokerLogisticsAnim({ phase: "pickup_to_factory", phaseEnteredMs: Date.now() });
    push(
      window.setTimeout(() => {
        setBrokerLogisticsAnim({ phase: "pickup_load", phaseEnteredMs: Date.now() });
        push(
          window.setTimeout(() => {
            setBrokerLogisticsAnim({ phase: "pickup_to_broker", phaseEnteredMs: Date.now() });
            push(
              window.setTimeout(() => {
                setBrokerLogisticsAnim({ phase: "delivery_to_shop", phaseEnteredMs: Date.now() });
                push(
                  window.setTimeout(() => {
                    setBrokerLogisticsAnim({ phase: "sold_retail_flash", phaseEnteredMs: Date.now() });
                    push(window.setTimeout(() => setBrokerLogisticsAnim(null), BROKER_SOLD_BADGE_MS));
                  }, BROKER_LEG_TO_SHOP_MS),
                );
              }, BROKER_LEG_TO_BROKER_MS),
            );
          }, BROKER_AT_FACTORY_MS),
        );
      }, BROKER_LEG_TO_FACTORY_MS),
    );
  }, [clearBrokerLogistics]);

  const clearStateAudit = useCallback(() => {
    stateAuditTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    stateAuditTimeoutsRef.current = [];
    setStateAuditAnim(null);
  }, []);

  const startStateAuditSequence = useCallback(() => {
    clearStateAudit();
    const push = (id: number) => stateAuditTimeoutsRef.current.push(id);
    setStateAuditAnim({ phase: "to_factory", phaseEnteredMs: Date.now() });
    push(
      window.setTimeout(() => {
        setStateAuditAnim({ phase: "audit", phaseEnteredMs: Date.now() });
        push(
          window.setTimeout(() => {
            setStateAuditAnim({ phase: "to_state", phaseEnteredMs: Date.now() });
            push(
              window.setTimeout(() => {
                setStateAuditAnim(null);
                const now = Date.now();
                setStats((s) => {
                  const ns = { ...s };
                  const lines: string[] = [];
                  const neverPaid = s.lastPayTaxAt === 0;
                  const lateTax = s.lastPayTaxAt > 0 && now - s.lastPayTaxAt > 120_000;
                  if ((neverPaid && s.money > 50) || lateTax) {
                    const fine = Math.min(130, Math.max(35, Math.round(s.money * 0.08)));
                    ns.money = Math.max(0, ns.money - fine);
                    ns.taxPaid += Math.round(fine * 0.3);
                    lines.push(`Phạt thuế (chưa nộp / quá hạn): -${fine}đ`);
                  }
                  if (s.overtime) {
                    const ot = 60;
                    ns.money = Math.max(0, ns.money - ot);
                    ns.overtime = false;
                    ns.workerMood = Math.min(100, ns.workerMood + 10);
                    lines.push(`Phạt tăng giờ trái luật: -${ot}đ (đã tắt tăng giờ)`);
                  }
                  if (lines.length === 0) {
                    lines.push("Không phạt thêm — điều kiện chấp nhận được");
                    ns.workerMood = Math.min(100, ns.workerMood + 6);
                  }
                  ns.events = [...ns.events, ...lines.map((l) => `🏛️ Thanh tra NM: ${l}`)];
                  queueMicrotask(() =>
                    toast({
                      title: "🏛️ Thanh tra nhà máy xong",
                      description: lines.join(" · "),
                    }),
                  );
                  return ns;
                });
              }, STATE_AUDIT_TO_STATE_MS),
            );
          }, STATE_AUDIT_PAUSE_MS),
        );
      }, STATE_AUDIT_TO_FACTORY_MS),
    );
  }, [clearStateAudit]);

  useEffect(() => {
    if (showReport) {
      clearBrokerLogistics();
      clearStateAudit();
    }
  }, [showReport, clearBrokerLogistics, clearStateAudit]);

  const sessionPaused = showReport || remainingSec <= 0 || !gameStarted;

  const produceCost = produceOneUnitCost(stats);
  const moneyBankruptRisk =
    gameStarted && !showReport && stats.inventory < 1 && stats.money < produceCost && stats.money >= 0;

  const handleInteract = useCallback((zone: ZoneId) => {
    if (sessionPaused) return;
    setOpenZone(zone);
  }, [sessionPaused]);

  // Đếm ngược 5 phút; hết giờ → ghi sự kiện, đóng panel, mở báo cáo (chỉ sau khi đã bấm bắt đầu)
  useEffect(() => {
    if (showReport || !gameStarted) return;
    const id = window.setInterval(() => {
      setRemainingSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [showReport, gameStarted]);

  useEffect(() => {
    if (remainingSec > 0) {
      timerEndedRef.current = false;
      return;
    }
    if (showReport) return;
    if (timerEndedRef.current) return;
    timerEndedRef.current = true;
    setSessionEndReason("time");
    setStats((s) => ({
      ...s,
      events: [...s.events, "⏱ Hết giờ phiên chơi (5 phút) — tự mở báo cáo"],
    }));
    setOpenZone(null);
    setShowReport(true);
    toast({ title: "⏱ Hết giờ phiên", description: "Đã đủ 5 phút. Đang mở báo cáo tổng kết." });
  }, [remainingSec, showReport]);

  // Phá sản: hết vốn SX và kho trống → kết thúc phiên (coi như «thua»)
  useEffect(() => {
    if (!gameStarted || showReport) return;
    if (remainingSecRef.current <= 0) return;
    if (bankruptGuardRef.current) return;

    const s = statsRef.current;
    if (s.events.some((e) => e.includes("Phá sản: không đủ vốn"))) return;

    const minProduce = produceOneUnitCost(s);
    if (s.inventory >= 1) return;
    if (s.money >= minProduce) return;

    bankruptGuardRef.current = true;
    setSessionEndReason("bankrupt");
    setStats((prev) => ({
      ...prev,
      events: [...prev.events, "💸 Phá sản: không đủ vốn SX 1 sp và hết hàng bán — kết thúc phiên."],
    }));
    setOpenZone(null);
    setShowReport(true);
    toast({
      title: "💸 Phá sản — phiên kết thúc",
      description: `Tiền còn ${s.money.toFixed(0)}đ, cần tối thiểu ~${minProduce.toFixed(0)}đ để SX 1 sp; kho trống.`,
    });
  }, [stats, gameStarted, showReport]);

  // Thanh tra định kỳ (~30–45s giữa hai chuyến): đoàn CA/cán bộ đi 🏭 → kết luận (phạt nếu chưa nộp thuế / tăng ca)
  useEffect(() => {
    if (showReport || !gameStarted) return;
    if (remainingSecRef.current <= 0) return;
    let cancelled = false;
    let tid: number;
    const schedule = () => {
      tid = window.setTimeout(() => {
        if (cancelled) return;
        if (showReportRef.current || !gameStartedRef.current || remainingSecRef.current <= 0) return;
        startStateAuditSequence();
        schedule();
      }, randomStateAuditGapMs());
    };
    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(tid);
    };
  }, [showReport, gameStarted, startStateAuditSequence]);

  // Lạm phát / áp lực giá vĩ mô: tăng dần chi phí nguyên liệu (mô phỏng công cụ điều tiết & áp lực thị trường)
  useEffect(() => {
    if (showReport || !gameStarted) return;
    if (remainingSecRef.current <= 0) return;
    let cancelled = false;
    let tid: number;
    const schedule = () => {
      tid = window.setTimeout(() => {
        if (cancelled) return;
        if (showReportRef.current || !gameStartedRef.current || remainingSecRef.current <= 0) return;
        setStats((s) => {
          if (s.materialPerUnit >= MATERIAL_PER_UNIT_CAP) return s;
          const delta = 2 + Math.floor(Math.random() * 3);
          const next = Math.min(MATERIAL_PER_UNIT_CAP, s.materialPerUnit + delta);
          const line = `Lạm phát: nguyên liệu +${next - s.materialPerUnit}đ/sp (còn ${next}đ/sp)`;
          queueMicrotask(() =>
            toast({
              title: "🏛️ Áp lực lạm phát / giá đầu vào",
              description: line,
            }),
          );
          return {
            ...s,
            materialPerUnit: next,
            events: [...s.events, `🏛️ ${line}`],
          };
        });
        schedule();
      }, randomInflationGapMs());
    };
    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(tid);
    };
  }, [showReport, gameStarted]);

  // Khách vãng lai: chỉ cảnh (không tự bán — bán lẻ chỉ khi bạn vào 🏪 và bấm trong panel)
  useEffect(() => {
    if (showReport || !gameStarted) return;
    if (remainingSecRef.current <= 0) return;
    let cancelled = false;
    shopPurchaseTimeoutsRef.current = [];
    const push = (tid: number) => {
      shopPurchaseTimeoutsRef.current.push(tid);
    };

    const beginWalkingOut = () => {
      if (cancelled) return;
      setShopVisitorAnim({
        stage: "walking_out",
        stageSinceMs: Date.now(),
        waitingForStock: false,
      });
      push(
        window.setTimeout(() => {
          if (cancelled) return;
          setShopVisitorAnim(null);
          push(
            window.setTimeout(() => {
              if (
                !cancelled &&
                !showReportRef.current &&
                gameStartedRef.current &&
                remainingSecRef.current > 0
              ) {
                beginWalkingIn();
              }
            }, randomShopGapMs()),
          );
        }, SHOP_VISITOR_WALK_OUT_MS),
      );
    };

    const beginAtCounter = () => {
      if (cancelled) return;
      const inv0 = statsRef.current.inventory;
      setShopVisitorAnim({
        stage: "at_counter",
        stageSinceMs: Date.now(),
        waitingForStock: inv0 < 1,
      });
      const waitMs = inv0 < 1 ? SHOP_MAX_WAIT_NO_STOCK_MS : SHOP_COUNTER_WAIT_MS;
      push(
        window.setTimeout(() => {
          if (cancelled) return;
          beginWalkingOut();
        }, waitMs),
      );
    };

    const beginWalkingIn = () => {
      if (cancelled) return;
      if (!gameStartedRef.current || remainingSecRef.current <= 0) return;
      setShopVisitorAnim({
        stage: "walking_in",
        stageSinceMs: Date.now(),
        waitingForStock: false,
      });
      push(
        window.setTimeout(() => {
          if (cancelled) return;
          beginAtCounter();
        }, SHOP_VISITOR_WALK_IN_MS),
      );
    };

    push(window.setTimeout(beginWalkingIn, randomShopGapMs()));

    return () => {
      cancelled = true;
      shopPurchaseTimeoutsRef.current.forEach((x) => window.clearTimeout(x));
      shopPurchaseTimeoutsRef.current = [];
      setShopVisitorAnim(null);
    };
  }, [showReport, gameStarted]);

  const doAction = (action: string) => {
    if (!gameStarted || showReport || remainingSec <= 0) return;
    setStats((s) => {
      const ns = { ...s };
      const matCost = s.materialPerUnit * (s.hasTech ? 0.7 : 1);
      const wage = s.wagePerUnit;
      const value = s.pricePerUnit * (s.hasMachine ? 1.2 : 1);
      const surplus = value - wage - matCost;

      switch (action) {
        case "produce":
        case "produce5": {
          const n = action === "produce5" ? 5 : 1;
          const cost = (matCost + wage) * n;
          if (s.money < cost) return s;
          ns.money -= cost;
          ns.inventory += n;
          ns.produced += n;
          ns.surplusTotal += surplus * n;
          ns.workerMood = Math.max(0, ns.workerMood - (s.overtime ? 3 : 1) * n);
          toast({ title: "📱 Đã sản xuất", description: `+${n} sp. Giá trị thặng dư: +${(surplus * n).toFixed(0)}đ` });
          break;
        }
        case "toggleOvertime":
          ns.overtime = !s.overtime;
          if (ns.overtime) ns.wagePerUnit = 50; // wage giữ nguyên, công sức tăng
          toast({ title: ns.overtime ? "🔴 Bật tăng giờ" : "Tắt tăng giờ", description: "Tuyệt đối: bóc lột thêm thời gian lao động" });
          break;
        case "buyMachine":
          if (s.money < 200 || s.hasMachine) return s;
          ns.money -= 200;
          ns.hasMachine = true;
          toast({ title: "🔵 Đã mua máy", description: "Tương đối: năng suất +20%" });
          break;
        case "buyTech":
          if (s.money < 400 || s.hasTech) return s;
          ns.money -= 400;
          ns.hasTech = true;
          toast({ title: "🟡 Công nghệ mới", description: "Siêu ngạch: nguyên liệu -30%" });
          break;
        case "sellBroker": {
          if (s.inventory < 1) return s;
          const revenue = s.inventory * s.pricePerUnit * 0.8;
          const loss = s.inventory * s.pricePerUnit * 0.2;
          ns.money += revenue;
          ns.soldBroker += s.inventory;
          ns.brokerLossTotal += loss;
          ns.inventory = 0;
          toast({ title: "🚚 Bán qua trung gian", description: `+${revenue.toFixed(0)}đ (mất ${loss.toFixed(0)}đ cho TG)` });
          queueMicrotask(() => startBrokerLogisticsSequence());
          break;
        }
        case "sellDirect": {
          const r = rollDirectSale(s);
          if (r.success) {
            toast({ title: "🛒 Khách mua!", description: `+${r.earned}đ` });
            queueMicrotask(() => {
              setShopMoneyFlash({ id: Date.now(), amount: r.earned, startMs: Date.now() });
            });
            return r.next;
          }
          if (s.inventory >= 1) {
            toast({ title: "😡 Khách bỏ đi", description: "Giá quá cao!" });
          }
          return r.next;
        }
        case "priceUp":
          ns.pricePerUnit = Math.min(400, s.pricePerUnit + 10);
          break;
        case "priceDown":
          ns.pricePerUnit = Math.max(100, s.pricePerUnit - 10);
          break;
        case "payTax": {
          const t = s.money * 0.1;
          ns.money -= t;
          ns.taxPaid += t;
          ns.lastPayTaxAt = Date.now();
          ns.events = [...s.events, `Nộp thuế ${t.toFixed(0)}đ`];
          toast({ title: "💸 Đã nộp thuế", description: `-${t.toFixed(0)}đ` });
          break;
        }
        case "inspect": {
          ns.events = [...s.events, "Kiểm tra đột xuất"];
          ns.workerMood = Math.min(100, s.workerMood + 15);
          toast({ title: "👮 Kiểm tra", description: "Công nhân được bảo vệ tốt hơn" });
          break;
        }
        case "endGame": {
          ns.events = [...ns.events, "📊 Kết thúc phiên do người chơi (🏛️)"];
          queueMicrotask(() => {
            setSessionEndReason("manual");
            setShowReport(true);
            setOpenZone(null);
          });
          break;
        }
      }
      return ns;
    });
  };

  const reset = () => {
    setStats(INITIAL_STATS);
    setShowReport(false);
    setSessionEndReason(null);
    setGameStarted(false);
    setRemainingSec(SESSION_DURATION_SEC);
    timerEndedRef.current = false;
    bankruptGuardRef.current = false;
    setShopVisitorAnim(null);
    setShopMoneyFlash(null);
    clearBrokerLogistics();
    clearStateAudit();
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center p-4">
      <header className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          🎮 Market Life — <span className="text-primary">Học Kinh Tế Chính Trị</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowLecture(true)} className="shrink-0">
            📚 Bài giảng
          </Button>
          <div className="text-sm text-muted-foreground hidden sm:block">
            <kbd className="px-2 py-0.5 bg-muted rounded">W A S D</kbd> · <kbd className="px-2 py-0.5 bg-muted rounded">E</kbd>
          </div>
        </div>
      </header>

      {/* HUD */}
      <div className="w-full max-w-5xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-3 text-sm">
        <Stat
          label="⏱ Phiên (5:00)"
          value={formatSessionClock(remainingSec)}
          warn={remainingSec > 0 && remainingSec <= 60}
          danger={remainingSec <= 0}
        />
        <Stat
          label="💰 Tiền"
          value={`${stats.money.toFixed(0)}đ`}
          warn={moneyBankruptRisk}
          danger={gameStarted && !showReport && stats.money <= 0}
        />
        <Stat label="📦 Tồn kho" value={stats.inventory} />
        <Stat label="📱 Đã SX" value={stats.produced} />
        <Stat label="💎 GTTD tổng" value={`${stats.surplusTotal.toFixed(0)}đ`} highlight />
        <Stat label="🙂 Công nhân" value={`${stats.workerMood}/100`} />
      </div>

      <GameCanvas
        onZoneEnter={setNearZone}
        onInteract={handleInteract}
        paused={sessionPaused}
        shopVisitorAnim={shopVisitorAnim}
        shopMoneyFlash={shopMoneyFlash}
        brokerLogisticsAnim={brokerLogisticsAnim}
        stateAuditAnim={stateAuditAnim}
      />

      <p className="mt-3 text-xs text-muted-foreground text-center max-w-2xl">
        📌 Đi vào 4 khu: 🏭 Sản xuất · 🚚 Trung gian · 🏪 Cửa hàng · 🏛️ Nhà nước. Bấm <b>E</b> để mở bảng tương tác.
        <b> Mỗi phiên 5 phút</b> — hết giờ sẽ <b>tự mở báo cáo</b>. Bạn vẫn có thể kết thúc sớm: vào 🏛️ chọn <b>Kết thúc phiên</b>.{" "}
        <b>Khách vãng lai</b> chỉ là cảnh quầy — <b>bán lẻ</b> chỉ khi bạn vào 🏪 và bấm trong bảng. <b>Đã SX</b> chỉ tăng khi sản xuất; bán chỉ trừ <b>tồn kho</b>. Cứ khoảng <b>30–45 giây</b> (ngẫu nhiên) có một <b>đoàn thanh tra</b> 🏛️→🏭 (nộp thuế đúng hạn, tránh tăng giờ trái luật).{" "}
        <b>Phá sản:</b> kho trống mà tiền không đủ SX thêm 1 sp → phiên kết thúc (tổng kết có nhãn phá sản).
        {nearZone && <span className="text-primary font-semibold"> · Đang ở: {nearZone}</span>}
      </p>

      {openZone && (
        <ZonePanel
          zone={openZone}
          stats={stats}
          onAction={doAction}
          onClose={() => setOpenZone(null)}
        />
      )}

      <LectureModal open={showLecture} onClose={() => setShowLecture(false)} />

      {!gameStarted && !showReport && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-background/85 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="start-screen-title"
        >
          <div className="w-full max-w-lg rounded-2xl border-2 border-primary/40 bg-card p-6 shadow-2xl text-center space-y-4">
            <h2 id="start-screen-title" className="text-2xl font-bold text-primary">
              Market Life
            </h2>
            <p className="text-sm text-muted-foreground">
              Mô phỏng chu trình <b>SX → phân phối → tiêu dùng → nhà nước điều tiết</b> và giá trị thặng dư. Mỗi phiên{" "}
              <b>5 phút</b> — bấm bên dưới để bắt đầu đếm giờ và các sự kiện tự động (thanh tra, khách qua cửa hàng…).
            </p>
            <p className="text-xs text-muted-foreground">
              Điều khiển: <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">W A S D</kbd> · Mở khu:{" "}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">E</kbd>
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button type="button" size="lg" className="min-w-[200px]" onClick={() => setGameStarted(true)}>
                ▶️ Bắt đầu chơi
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => setShowLecture(true)}>
                📚 Xem bài giảng
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReport && <Report stats={stats} onClose={reset} sessionEndReason={sessionEndReason} />}
    </main>
  );
};

function Stat({
  label,
  value,
  highlight,
  warn,
  danger,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  warn?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 border",
        highlight && "bg-primary text-primary-foreground border-primary",
        danger && "bg-destructive/15 text-destructive border-destructive/40 font-semibold",
        warn && !danger && !highlight && "bg-amber-500/15 text-amber-950 dark:text-amber-100 border-amber-500/40",
        !highlight && !warn && !danger && "bg-card border-border",
      )}
    >
      <div className="text-xs opacity-75">{label}</div>
      <div className="font-bold text-base">{value}</div>
    </div>
  );
}

export default Index;
