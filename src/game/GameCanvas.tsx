import { useEffect, useRef } from "react";
import type { ZoneId } from "./types";
import { SHOP_VISITOR_WALK_IN_MS, SHOP_VISITOR_WALK_OUT_MS, type ShopVisitorAnim } from "./shopSale";
import {
  type BrokerLogisticsAnim,
  BROKER_AT_FACTORY_MS,
  BROKER_LEG_TO_BROKER_MS,
  BROKER_LEG_TO_FACTORY_MS,
  BROKER_LEG_TO_SHOP_MS,
} from "./brokerLogistics";
import { type StateAuditAnim, STATE_AUDIT_TO_FACTORY_MS, STATE_AUDIT_TO_STATE_MS } from "./stateInspection";

const TILE = 40;
const MAP_W = 24;
const MAP_H = 16;

export interface Zone {
  id: ZoneId;
  name: string;
  emoji: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  desc: string;
}

export const ZONES: Zone[] = [
  { id: "factory", name: "Nhà máy", emoji: "🏭", color: "--zone-factory", x: 1, y: 1, w: 7, h: 6, desc: "Sản xuất điện thoại" },
  { id: "broker", name: "Trung gian", emoji: "🚚", color: "--zone-broker", x: 16, y: 1, w: 7, h: 6, desc: "Kho phân phối sỉ" },
  { id: "shop", name: "Cửa hàng", emoji: "🏪", color: "--zone-shop", x: 1, y: 9, w: 7, h: 6, desc: "Bán lẻ cho khách" },
  { id: "state", name: "Nhà nước", emoji: "🏛️", color: "--zone-state", x: 16, y: 9, w: 7, h: 6, desc: "Cơ quan điều tiết" },
];

export interface ShopMoneyFlash {
  id: number;
  amount: number;
  startMs: number;
}

interface Props {
  onZoneEnter: (zone: ZoneId | null) => void;
  onInteract: (zone: ZoneId) => void;
  /** Khi true: không di chuyển / không bấm E (báo cáo hoặc hết giờ phiên). */
  paused?: boolean;
  /** Khách vãng lai: vào / đứng quầy (có thể đợi hàng) / ra. */
  shopVisitorAnim?: ShopVisitorAnim | null;
  /** Hiệu ứng +tiền trên bản đồ sau khi bán lẻ thành công. */
  shopMoneyFlash?: ShopMoneyFlash | null;
  /** Sau bán sỉ: xe TG → NM lấy hàng → về TG → CH → nhãn đã bán. */
  brokerLogisticsAnim?: BrokerLogisticsAnim | null;
  /** Thanh tra: CA + cán bộ 🏛️ → 🏭 → 🏛️. */
  stateAuditAnim?: StateAuditAnim | null;
}

// Animated NPCs per zone with patrol behavior
interface NPC {
  baseX: number;
  baseY: number;
  range: number;
  speed: number;
  emoji: string;
  axis: "x" | "y";
  phase: number;
  /** Nhãn tiếng Việt hiển thị phía trên nhân vật */
  label?: string;
}

const NPCS: NPC[] = [
  // Factory workers
  { baseX: 2.5, baseY: 2.5, range: 1.5, speed: 0.4, emoji: "👷", axis: "x", phase: 0, label: "Công nhân" },
  { baseX: 5.5, baseY: 2.5, range: 1.2, speed: 0.5, emoji: "👷‍♀️", axis: "x", phase: 1.5, label: "Công nhân" },
  { baseX: 3.5, baseY: 5.5, range: 1, speed: 0.3, emoji: "🧑‍🏭", axis: "y", phase: 0.7, label: "Công nhân" },
  { baseX: 6.5, baseY: 5.5, range: 1, speed: 0.4, emoji: "🧑‍🏭", axis: "y", phase: 2.1, label: "Công nhân" },
  // Broker - trucks & loaders
  { baseX: 17.5, baseY: 2, range: 2, speed: 0.6, emoji: "🚚", axis: "x", phase: 0, label: "Vận chuyển" },
  { baseX: 21, baseY: 5.5, range: 1.5, speed: 0.4, emoji: "📦", axis: "x", phase: 1, label: "Hàng hóa" },
  { baseX: 19, baseY: 4, range: 0.8, speed: 0.3, emoji: "🧑‍💼", axis: "y", phase: 0.5, label: "Trung gian" },
  // Shop - customers
  { baseX: 2.5, baseY: 10.5, range: 1.5, speed: 0.4, emoji: "🧍", axis: "x", phase: 0, label: "Khách hàng" },
  { baseX: 5.5, baseY: 10.5, range: 1.2, speed: 0.5, emoji: "🧍‍♀️", axis: "x", phase: 1.8, label: "Khách hàng" },
  { baseX: 3, baseY: 13.5, range: 2, speed: 0.6, emoji: "🛒", axis: "x", phase: 0.3, label: "Giỏ hàng" },
  { baseX: 6.5, baseY: 13, range: 1, speed: 0.3, emoji: "👨‍💼", axis: "y", phase: 1, label: "Nhân viên" },
  // State - guards & officials
  { baseX: 17, baseY: 10.5, range: 1, speed: 0.3, emoji: "👮", axis: "x", phase: 0, label: "Công an" },
  { baseX: 21.5, baseY: 10.5, range: 1, speed: 0.3, emoji: "👮‍♀️", axis: "x", phase: 1.5, label: "Công an" },
  { baseX: 19, baseY: 13, range: 1.5, speed: 0.4, emoji: "🧑‍⚖️", axis: "x", phase: 0.7, label: "Cán bộ" },
];

// Decorative fixed props
const PROPS: Array<{ x: number; y: number; e: string; size?: number }> = [
  // Trees & decoration on roads
  { x: 11, y: 0.5, e: "🌳" }, { x: 12.5, y: 0.5, e: "🌳" }, { x: 14, y: 0.5, e: "🌳" },
  { x: 11, y: 15.2, e: "🌲" }, { x: 13, y: 15.2, e: "🌲" }, { x: 15, y: 15.2, e: "🌲" },
  { x: 0.2, y: 7.8, e: "🌳" }, { x: 23.2, y: 7.8, e: "🌳" },
  { x: 9, y: 7.5, e: "🚦" }, { x: 14, y: 7.5, e: "🚦" },
  { x: 11.5, y: 4, e: "🅿️", size: 22 },
  // Inside factory: machines
  { x: 4, y: 3.5, e: "⚙️", size: 22 }, { x: 5, y: 4.5, e: "🔧", size: 20 },
  // Inside broker: boxes
  { x: 18, y: 5, e: "📦", size: 20 }, { x: 22, y: 2.5, e: "📦", size: 20 },
  // Inside shop: products
  { x: 4, y: 11, e: "📱", size: 22 }, { x: 5, y: 11, e: "📱", size: 22 },
  { x: 4, y: 12, e: "💵", size: 20 },
  // Inside state: flag
  { x: 22, y: 9.5, e: "🚩", size: 24 }, { x: 17, y: 14, e: "📜", size: 22 },
];

export default function GameCanvas({
  onZoneEnter,
  onInteract,
  paused = false,
  shopVisitorAnim = null,
  shopMoneyFlash = null,
  brokerLogisticsAnim = null,
  stateAuditAnim = null,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef({ x: 11 * TILE, y: 7 * TILE, facing: "down" as "up"|"down"|"left"|"right", step: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const currentZoneRef = useRef<ZoneId | null>(null);
  const tRef = useRef(0);
  const shopVisitorAnimRef = useRef<ShopVisitorAnim | null>(null);
  const shopMoneyFlashRef = useRef<ShopMoneyFlash | null>(null);
  const brokerLogisticsAnimRef = useRef<BrokerLogisticsAnim | null>(null);
  const stateAuditAnimRef = useRef<StateAuditAnim | null>(null);
  shopVisitorAnimRef.current = shopVisitorAnim;
  shopMoneyFlashRef.current = shopMoneyFlash;
  brokerLogisticsAnimRef.current = brokerLogisticsAnim;
  stateAuditAnimRef.current = stateAuditAnim;

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (paused) return;
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === "e" && currentZoneRef.current) {
        onInteract(currentZoneRef.current);
      }
    };
    const handleUp = (e: KeyboardEvent) => {
      if (paused) return;
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, [onInteract, paused]);

  useEffect(() => {
    if (paused) keysRef.current = {};
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const cssVar = (name: string) => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return `hsl(${v})`;
    };
    const cssVarA = (name: string, a: number) => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return `hsl(${v} / ${a})`;
    };

    const NPC_EMOJI_PX = 30;
    const NPC_HALO_R = 22;

    /** Vẽ NPC nổi bật: nền tròn sáng, emoji lớn, nhãn có viền — tránh bị “nhạt” trên nền tòa nhà. */
    const drawNpc = (nx: number, ny: number, bob: number, npc: NPC) => {
      const y = ny + bob;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      ctx.fillStyle = "hsl(0 0% 0% / 0.42)";
      ctx.beginPath();
      ctx.ellipse(nx, ny + 15, 14, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (npc.label) {
        ctx.font =
          '600 12px ui-sans-serif, system-ui, "Segoe UI", "Noto Sans", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const padX = 8;
        const padY = 5;
        const tw = ctx.measureText(npc.label).width;
        const boxW = Math.max(tw + padX * 2, 52);
        const boxH = 20;
        const boxX = nx - boxW / 2;
        const boxY = y - NPC_HALO_R - boxH - 5;
        const cx = nx;
        const cy = boxY + boxH / 2;

        ctx.fillStyle = "hsl(48 100% 96%)";
        ctx.strokeStyle = "hsl(0 0% 12%)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        } else {
          ctx.rect(boxX, boxY, boxW, boxH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "hsl(0 0% 100%)";
        ctx.lineWidth = 4;
        ctx.strokeText(npc.label, cx, cy);
        ctx.fillStyle = "hsl(0 0% 6%)";
        ctx.lineWidth = 1;
        ctx.fillText(npc.label, cx, cy);
      }

      ctx.fillStyle = "hsl(0 0% 100% / 0.98)";
      ctx.strokeStyle = "hsl(0 0% 18% / 0.75)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(nx, y, NPC_HALO_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = `${NPC_EMOJI_PX}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(npc.emoji, nx, y);

      ctx.restore();
    };

    const drawBuilding = (z: Zone, base: string) => {
      const px = z.x * TILE;
      const py = z.y * TILE;
      const pw = z.w * TILE;
      const ph = z.h * TILE;

      // Floor inside zone (lighter version)
      ctx.fillStyle = cssVarA(z.color, 0.12);
      ctx.fillRect(px, py, pw, ph);

      // Building body
      const bw = pw - TILE * 1.5;
      const bh = ph - TILE * 2;
      const bx = px + (pw - bw) / 2;
      const by = py + TILE * 0.8;

      // Shadow
      ctx.fillStyle = "hsl(0 0% 0% / 0.18)";
      ctx.fillRect(bx + 6, by + 6, bw, bh);

      // Walls
      ctx.fillStyle = cssVarA(z.color, 0.85);
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = cssVar(z.color);
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, bw, bh);

      // Roof triangle
      ctx.fillStyle = cssVar(z.color);
      ctx.beginPath();
      ctx.moveTo(bx - 8, by);
      ctx.lineTo(bx + bw / 2, by - 28);
      ctx.lineTo(bx + bw + 8, by);
      ctx.closePath();
      ctx.fill();

      // Door
      const dw = 28, dh = 36;
      ctx.fillStyle = "hsl(30 40% 25%)";
      ctx.fillRect(bx + bw / 2 - dw / 2, by + bh - dh, dw, dh);
      ctx.fillStyle = "hsl(48 90% 60%)";
      ctx.fillRect(bx + bw / 2 + 8, by + bh - dh / 2 - 2, 4, 4);

      // Windows
      ctx.fillStyle = "hsl(200 80% 75%)";
      const winY = by + 14;
      for (let i = 0; i < 3; i++) {
        const wx = bx + 14 + i * (bw - 28) / 2.5;
        ctx.fillRect(wx, winY, 22, 18);
        ctx.strokeStyle = "hsl(0 0% 100% / 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(wx + 11, winY); ctx.lineTo(wx + 11, winY + 18);
        ctx.moveTo(wx, winY + 9); ctx.lineTo(wx + 22, winY + 9);
        ctx.stroke();
      }

      // Special chimney for factory
      if (z.id === "factory") {
        ctx.fillStyle = "hsl(0 0% 30%)";
        ctx.fillRect(bx + bw - 24, by - 22, 14, 28);
        // smoke
        ctx.fillStyle = `hsl(0 0% 70% / ${0.5 + Math.sin(tRef.current / 20) * 0.2})`;
        ctx.beginPath();
        ctx.arc(bx + bw - 17, by - 30 + Math.sin(tRef.current / 15) * 2, 9, 0, Math.PI * 2);
        ctx.arc(bx + bw - 8, by - 38, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      // Flag for state
      if (z.id === "state") {
        ctx.fillStyle = "hsl(0 0% 30%)";
        ctx.fillRect(bx + 10, by - 30, 3, 32);
        ctx.fillStyle = cssVar(z.color);
        ctx.beginPath();
        ctx.moveTo(bx + 13, by - 30);
        ctx.lineTo(bx + 32, by - 24);
        ctx.lineTo(bx + 13, by - 18);
        ctx.closePath();
        ctx.fill();
      }
      // Sign on broker
      if (z.id === "broker") {
        ctx.fillStyle = "hsl(48 96% 53%)";
        ctx.fillRect(bx + bw / 2 - 30, by - 12, 60, 14);
        ctx.fillStyle = "hsl(0 0% 10%)";
        ctx.font = "bold 10px ui-sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("KHO", bx + bw / 2, by - 2);
      }
      // Shop awning
      if (z.id === "shop") {
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i % 2 === 0 ? "hsl(0 80% 55%)" : "hsl(0 0% 100%)";
          ctx.fillRect(bx + i * (bw / 5), by - 8, bw / 5, 8);
        }
      }

      // Label above building
      ctx.fillStyle = "hsl(0 0% 100% / 0.95)";
      const labelW = 110;
      ctx.fillRect(px + pw / 2 - labelW / 2, py + 4, labelW, 22);
      ctx.strokeStyle = cssVar(z.color);
      ctx.lineWidth = 2;
      ctx.strokeRect(px + pw / 2 - labelW / 2, py + 4, labelW, 22);
      ctx.fillStyle = cssVar(z.color);
      ctx.font = "bold 13px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${z.emoji} ${z.name}`, px + pw / 2, py + 15);
    };

    const draw = () => {
      tRef.current += 1;
      const t = tRef.current;

      // Movement (dừng khi paused — hết giờ hoặc đang xem báo cáo)
      const speed = 3;
      const k = keysRef.current;
      let dx = 0, dy = 0;
      if (!paused) {
        if (k["w"] || k["arrowup"]) { dy -= speed; playerRef.current.facing = "up"; }
        if (k["s"] || k["arrowdown"]) { dy += speed; playerRef.current.facing = "down"; }
        if (k["a"] || k["arrowleft"]) { dx -= speed; playerRef.current.facing = "left"; }
        if (k["d"] || k["arrowright"]) { dx += speed; playerRef.current.facing = "right"; }
      }

      const p = playerRef.current;
      p.x = Math.max(8, Math.min(MAP_W * TILE - 32, p.x + dx));
      p.y = Math.max(8, Math.min(MAP_H * TILE - 32, p.y + dy));
      if (dx !== 0 || dy !== 0) p.step += 0.2;

      // Zone detection
      const px = p.x / TILE, py = p.y / TILE;
      let inside: ZoneId | null = null;
      for (const z of ZONES) {
        if (px >= z.x && px < z.x + z.w && py >= z.y && py < z.y + z.h) {
          inside = z.id;
          break;
        }
      }
      if (inside !== currentZoneRef.current) {
        currentZoneRef.current = inside;
        onZoneEnter(inside);
      }

      // === RENDER ===
      // Grass background
      const grass = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grass.addColorStop(0, "hsl(95 45% 70%)");
      grass.addColorStop(1, "hsl(95 40% 62%)");
      ctx.fillStyle = grass;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grass texture dots
      ctx.fillStyle = "hsl(95 50% 55% / 0.3)";
      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          const seed = (x * 31 + y * 17) % 7;
          if (seed === 0) ctx.fillRect(x * TILE + 8, y * TILE + 12, 3, 3);
          if (seed === 3) ctx.fillRect(x * TILE + 24, y * TILE + 28, 2, 2);
        }
      }

      // Roads (cross pattern)
      ctx.fillStyle = "hsl(40 15% 55%)";
      // Horizontal road
      ctx.fillRect(0, 7 * TILE, canvas.width, TILE * 2);
      // Vertical road
      ctx.fillRect(10 * TILE, 0, TILE * 4, canvas.height);
      // Road dashes
      ctx.fillStyle = "hsl(48 90% 75%)";
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.fillRect(x, 7 * TILE + TILE - 2, 16, 4);
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.fillRect(10 * TILE + TILE * 2 - 2, y, 4, 16);
      }

      // Plaza in center
      ctx.fillStyle = "hsl(40 25% 75%)";
      ctx.beginPath();
      ctx.arc(12 * TILE, 8 * TILE, TILE * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "hsl(40 20% 50%)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "hsl(280 60% 55%)";
      ctx.font = "26px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⛲", 12 * TILE, 8 * TILE);

      // Buildings
      for (const z of ZONES) drawBuilding(z, cssVar(z.color));

      // Decorative props
      for (const pr of PROPS) {
        ctx.font = `${pr.size ?? 24}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pr.e, pr.x * TILE, pr.y * TILE);
      }

      // Animated NPCs (nền sáng + nhãn rõ để không bị chìm vào nền tòa nhà)
      for (const npc of NPCS) {
        const offset = Math.sin(t / 30 * npc.speed + npc.phase) * npc.range;
        const nx = (npc.axis === "x" ? npc.baseX + offset : npc.baseX) * TILE;
        const ny = (npc.axis === "y" ? npc.baseY + offset : npc.baseY) * TILE;
        const bob = Math.sin(t / 6 + npc.phase * 3) * 1.5;
        drawNpc(nx, ny, bob, npc);
      }

      const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

      // Nhà máy — gợi cảm "đang làm việc" (hạt sáng nhấp nháy)
      if (!paused) {
        const sparkleT = t * 0.12;
        for (let i = 0; i < 5; i++) {
          const ax = (2.3 + (i % 3) * 1.9) * TILE + Math.sin(sparkleT * 0.9 + i * 0.8) * 10;
          const ay = (2.8 + Math.floor(i / 3) * 2.2) * TILE + Math.cos(sparkleT + i) * 6;
          const al = 0.22 + Math.sin(sparkleT + i * 1.4) * 0.2;
          ctx.globalAlpha = Math.max(0.08, Math.min(0.55, al));
          ctx.fillStyle = "hsl(52 100% 58%)";
          ctx.beginPath();
          ctx.arc(ax, ay, 2.5 + (i % 2), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Khách vãng lai: walking_in → at_counter (chờ / xem quầy) → walking_out — không tự bán
      const v = shopVisitorAnimRef.current;
      if (v) {
        const now = Date.now();
        const elapsed = now - v.stageSinceMs;
        let wx: number;
        let wy: number;
        if (v.stage === "walking_in") {
          const u = Math.min(1, elapsed / SHOP_VISITOR_WALK_IN_MS);
          wx = lerp(2.1, 4.35, u) * TILE;
          wy = lerp(14.9, 11.35, u) * TILE;
        } else if (v.stage === "at_counter") {
          wx = 4.35 * TILE;
          wy = 11.35 * TILE;
        } else {
          const u = Math.min(1, elapsed / SHOP_VISITOR_WALK_OUT_MS);
          wx = lerp(4.35, 2.1, u) * TILE;
          wy = lerp(11.35, 14.9, u) * TILE;
        }
        const bob = Math.sin(t / 5) * 1.2;
        const visitorEmoji = Math.floor(v.stageSinceMs / 700) % 2 === 0 ? "🧍" : "🧍‍♀️";
        ctx.font = '26px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "hsl(0 0% 100% / 0.92)";
        ctx.beginPath();
        ctx.arc(wx, wy + bob, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "hsl(0 0% 25% / 0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "hsl(0 0% 10%)";
        ctx.fillText(visitorEmoji, wx, wy + bob);
        ctx.font = "bold 9px ui-sans-serif, system-ui";
        const tag =
          v.stage === "at_counter" && v.waitingForStock ? "Đang đợi hàng…" : "Khách hàng";
        ctx.strokeStyle = "hsl(0 0% 100% / 0.9)";
        ctx.lineWidth = 3;
        ctx.strokeText(tag, wx, wy - 22 + bob);
        ctx.lineWidth = 1;
        ctx.fillStyle = "hsl(220 80% 28%)";
        ctx.fillText(tag, wx, wy - 22 + bob);
        if (v.stage === "at_counter" && v.waitingForStock) {
          ctx.font = "bold 8px ui-sans-serif, system-ui";
          ctx.strokeStyle = "hsl(0 0% 100% / 0.9)";
          ctx.lineWidth = 2;
          ctx.strokeText("Chờ có sản phẩm", wx, wy - 34 + bob);
          ctx.lineWidth = 1;
          ctx.fillStyle = "hsl(28 90% 32%)";
          ctx.fillText("Chờ có sản phẩm", wx, wy - 34 + bob);
        }
      }

      // Chuỗi vận chuyển sau bán sỉ (TG → NM lấy hàng → TG → CH → đã bán)
      const logA = brokerLogisticsAnimRef.current;
      if (logA) {
        const el = Date.now() - logA.phaseEnteredMs;
        const BR = { x: 19.35, y: 3.62 };
        const FC = { x: 4.55, y: 3.88 };
        const SH = { x: 4.45, y: 10.95 };
        let tx = BR.x * TILE;
        let ty = BR.y * TILE;
        let subLabel = "Vận chuyển";

        if (logA.phase === "pickup_to_factory") {
          const u = Math.min(1, el / BROKER_LEG_TO_FACTORY_MS);
          tx = lerp(BR.x, FC.x, u) * TILE;
          ty = lerp(BR.y, FC.y, u) * TILE;
          subLabel = "→ Nhà máy lấy hàng";
        } else if (logA.phase === "pickup_load") {
          tx = FC.x * TILE;
          ty = FC.y * TILE;
          subLabel = "📦 Lấy hàng…";
        } else if (logA.phase === "pickup_to_broker") {
          const u = Math.min(1, el / BROKER_LEG_TO_BROKER_MS);
          tx = lerp(FC.x, BR.x, u) * TILE;
          ty = lerp(FC.y, BR.y, u) * TILE;
          subLabel = "→ Về kho TG";
        } else if (logA.phase === "delivery_to_shop") {
          const u = Math.min(1, el / BROKER_LEG_TO_SHOP_MS);
          tx = lerp(BR.x, SH.x, u) * TILE;
          ty = lerp(BR.y, SH.y, u) * TILE;
          subLabel = "→ Cửa hàng";
        } else if (logA.phase === "sold_retail_flash") {
          tx = SH.x * TILE;
          ty = (SH.y - 0.35) * TILE;
          const pulse = 0.65 + Math.sin(el / 120) * 0.35;
          ctx.save();
          ctx.globalAlpha = pulse;
          ctx.font = "bold 12px ui-sans-serif, system-ui";
          ctx.textAlign = "center";
          const lines = ["✓ Đã phân phối", "Bán sỉ → CH"];
          lines.forEach((line, i) => {
            const ly = ty - 38 - i * 14;
            ctx.strokeStyle = "hsl(0 0% 100% / 0.95)";
            ctx.lineWidth = 4;
            ctx.strokeText(line, tx, ly);
            ctx.fillStyle = "hsl(142 72% 28%)";
            ctx.lineWidth = 1;
            ctx.fillText(line, tx, ly);
          });
          ctx.restore();
        }

        if (logA.phase !== "sold_retail_flash") {
          const bob = Math.sin(t / 4) * 1.5;
          ctx.font = '28px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "hsl(0 0% 100% / 0.95)";
          ctx.beginPath();
          ctx.arc(tx, ty + bob, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "hsl(280 50% 35% / 0.75)";
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.fillStyle = "hsl(0 0% 12%)";
          ctx.fillText("🚚", tx, ty + bob);
          ctx.font = "bold 8px ui-sans-serif, system-ui";
          ctx.strokeStyle = "hsl(0 0% 100% / 0.9)";
          ctx.lineWidth = 2;
          ctx.strokeText(subLabel, tx, ty - 24 + bob);
          ctx.lineWidth = 1;
          ctx.fillStyle = "hsl(280 45% 28%)";
          ctx.fillText(subLabel, tx, ty - 24 + bob);
        }
      }

      // Đoàn thanh tra nhà nước: 🏛️ → nhà máy → 🏛️
      const aud = stateAuditAnimRef.current;
      if (aud) {
        const elA = Date.now() - aud.phaseEnteredMs;
        const ST = { x: 19.45, y: 11.55 };
        const FC = { x: 4.55, y: 3.88 };
        const drawAuditPair = (cx: number, cy: number, subLabel: string) => {
          const bob = Math.sin(t / 4) * 1.5;
          const dx = 14;
          const pairs: [string, number][] = [
            ["👮", -dx],
            ["🧑‍⚖️", dx],
          ];
          for (const [em, ox] of pairs) {
            const ax = cx + ox;
            const ay = cy + bob;
            ctx.font = '24px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "hsl(0 0% 100% / 0.95)";
            ctx.beginPath();
            ctx.arc(ax, ay, 17, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "hsl(210 70% 35% / 0.75)";
            ctx.lineWidth = 2.2;
            ctx.stroke();
            ctx.fillStyle = "hsl(0 0% 12%)";
            ctx.fillText(em, ax, ay);
          }
          ctx.font = "bold 8px ui-sans-serif, system-ui";
          ctx.textAlign = "center";
          const mx = cx;
          const my = cy - 22 + bob;
          ctx.strokeStyle = "hsl(0 0% 100% / 0.9)";
          ctx.lineWidth = 2;
          ctx.strokeText(subLabel, mx, my);
          ctx.lineWidth = 1;
          ctx.fillStyle = "hsl(210 55% 28%)";
          ctx.fillText(subLabel, mx, my);
        };

        let cx = ST.x * TILE;
        let cy = ST.y * TILE;
        let label = "Xuất phát kiểm tra";
        if (aud.phase === "to_factory") {
          const u = Math.min(1, elA / STATE_AUDIT_TO_FACTORY_MS);
          cx = lerp(ST.x, FC.x, u) * TILE;
          cy = lerp(ST.y, FC.y, u) * TILE;
          label = "→ Nhà máy";
        } else if (aud.phase === "audit") {
          cx = FC.x * TILE;
          cy = FC.y * TILE;
          label = "Kiểm tra thuế & lao động…";
        } else {
          const u = Math.min(1, elA / STATE_AUDIT_TO_STATE_MS);
          cx = lerp(FC.x, ST.x, u) * TILE;
          cy = lerp(FC.y, ST.y, u) * TILE;
          label = "→ Về cơ quan";
        }
        drawAuditPair(cx, cy, label);
      }

      // Tiền bay lên khi bán lẻ thành công (từ panel 🏪)
      const flash = shopMoneyFlashRef.current;
      if (flash) {
        const age = Date.now() - flash.startMs;
        const dur = 2600;
        if (age < dur) {
          const u = age / dur;
          const alpha = 1 - u * u;
          const lift = u * 52;
          const fx = 4.25 * TILE;
          const fy = 10.75 * TILE - lift;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.font = "bold 18px ui-sans-serif, system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const txt = `+${Math.round(flash.amount)}đ`;
          ctx.strokeStyle = "hsl(0 0% 100% / 0.95)";
          ctx.lineWidth = 4;
          ctx.strokeText(txt, fx, fy);
          ctx.fillStyle = "hsl(142 76% 30%)";
          ctx.fillText(txt, fx, fy);
          ctx.restore();
        }
      }

      // Player (cute character with body + head)
      const stepBob = Math.sin(p.step) * 2;
      // shadow
      ctx.fillStyle = "hsl(0 0% 0% / 0.3)";
      ctx.beginPath();
      ctx.ellipse(p.x + 12, p.y + 28, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // body
      ctx.fillStyle = cssVar("--primary");
      ctx.fillRect(p.x + 4, p.y + 10 + stepBob, 16, 14);
      // head
      ctx.fillStyle = "hsl(30 60% 75%)";
      ctx.beginPath();
      ctx.arc(p.x + 12, p.y + 6 + stepBob, 8, 0, Math.PI * 2);
      ctx.fill();
      // hair
      ctx.fillStyle = "hsl(20 50% 25%)";
      ctx.fillRect(p.x + 4, p.y + stepBob, 16, 5);
      // eyes (face direction)
      ctx.fillStyle = "hsl(0 0% 10%)";
      const ex = p.facing === "left" ? -2 : p.facing === "right" ? 2 : 0;
      ctx.fillRect(p.x + 8 + ex, p.y + 6 + stepBob, 2, 2);
      ctx.fillRect(p.x + 14 + ex, p.y + 6 + stepBob, 2, 2);
      // legs
      const legPhase = Math.sin(p.step) > 0 ? 1 : -1;
      ctx.fillStyle = "hsl(220 40% 30%)";
      ctx.fillRect(p.x + 5, p.y + 24, 5, 6 + legPhase);
      ctx.fillRect(p.x + 14, p.y + 24, 5, 6 - legPhase);

      // Interaction prompt
      if (inside) {
        const z = ZONES.find((zz) => zz.id === inside)!;
        const text = `Bấm [E] – ${z.desc}`;
        ctx.font = "bold 13px ui-sans-serif, system-ui";
        const tw = ctx.measureText(text).width + 20;
        // floating bubble
        ctx.fillStyle = cssVar(z.color);
        ctx.fillRect(p.x + 12 - tw / 2, p.y - 36, tw, 24);
        ctx.fillStyle = "hsl(0 0% 100%)";
        ctx.fillRect(p.x + 12 - tw / 2 + 2, p.y - 34, tw - 4, 20);
        ctx.fillStyle = cssVar(z.color);
        ctx.textAlign = "center";
        ctx.fillText(text, p.x + 12, p.y - 24);
        // pointer
        ctx.beginPath();
        ctx.moveTo(p.x + 8, p.y - 12);
        ctx.lineTo(p.x + 12, p.y - 6);
        ctx.lineTo(p.x + 16, p.y - 12);
        ctx.closePath();
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [onZoneEnter, paused]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP_W * TILE}
      height={MAP_H * TILE}
      className="rounded-xl shadow-2xl border-4 border-primary/30 max-w-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
