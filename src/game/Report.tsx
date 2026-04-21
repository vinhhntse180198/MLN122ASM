import { useState } from "react";
import { Button } from "@/components/ui/button";
import { INITIAL_STATS, type GameStats } from "./types";

export type SessionEndReason = "time" | "manual" | "bankrupt" | null;

interface Props {
  stats: GameStats;
  onClose: () => void;
  /** Lý do mở báo cáo — hiển thị ở bước tổng kết. */
  sessionEndReason?: SessionEndReason;
}

/** Gợi ý học tập — không phải “thắng/thua” kiểu esport. */
function evaluateSessionHint(s: GameStats): string {
  if (s.money < 80) {
    return (
      "Tiền mặt rất thấp — gần như hết vốn vận hành. Trong thực tế gần với nguy cơ phá sản / đóng cửa; " +
      "trong game bạn vẫn có thể cố bán hàng; ở bước sau dùng «Chơi lại» để thử chiến lược khác."
    );
  }
  if (s.money >= INITIAL_STATS.money + 150 && s.workerMood >= 48) {
    return (
      "Dòng tiền còn dư khá và tinh thần công nhân chưa sụp — phiên “thuận” về mặt tài chính ngắn hạn. " +
      "Nhớ: con số lợi nhuận không xóa tranh chấp giai cấp trong bài học lý thuyết."
    );
  }
  if (s.money < INITIAL_STATS.money - 70 || s.workerMood < 38) {
    return (
      "Áp lực tài chính hoặc tinh thần lao động đang căng — phù hợp để bàn về khủng hoảng, cường độ lao động và điều tiết nhà nước."
    );
  }
  return "Cân bằng vừa phải giữa tích lũy và điều kiện làm việc — dùng các mục trên để thuyết trình / thảo luận sâu hơn.";
}

export function buildReport(s: GameStats): string {
  const totalRevenue = s.soldDirect * s.pricePerUnit + s.soldBroker * s.pricePerUnit * 0.8;
  const hint = evaluateSessionHint(s);
  return `📊 BÁO CÁO TRÒ CHƠI – MARKET LIFE
Sản phẩm: 📱 Điện thoại (Smartphone)

══════════════════════════════════
1. QUÁ TRÌNH SẢN XUẤT
══════════════════════════════════
• Số sản phẩm đã sản xuất: ${s.produced}
• Lương trả công nhân/sp: ${s.wagePerUnit}
• Nguyên liệu/sp: ${s.materialPerUnit}
• Tổng giá trị thặng dư đã tạo: ${s.surplusTotal.toFixed(0)}đ
• Bật tăng giờ làm (m=tuyệt đối): ${s.overtime ? "Có" : "Không"}
• Mua máy móc (m=tương đối): ${s.hasMachine ? "Có" : "Không"}
• Áp dụng công nghệ mới (m=siêu ngạch): ${s.hasTech ? "Có" : "Không"}

→ Nhận xét: Công nhân là người tạo ra giá trị thực sự của hàng hóa.
  Phần lao động công nhân KHÔNG được trả công chính là nguồn gốc
  của giá trị thặng dư mà nhà tư bản chiếm đoạt.

══════════════════════════════════
2. QUÁ TRÌNH PHÂN PHỐI
══════════════════════════════════
• Bán trực tiếp: ${s.soldDirect} sp
• Bán qua trung gian: ${s.soldBroker} sp
• Lợi nhuận mất cho trung gian: ${s.brokerLossTotal.toFixed(0)}đ

→ Nhận xét: Trung gian giúp lưu thông hàng hóa nhanh chóng,
  nhưng làm giảm lợi nhuận của nhà sản xuất.

══════════════════════════════════
3. QUÁ TRÌNH TIÊU DÙNG
══════════════════════════════════
• Tổng doanh thu: ${totalRevenue.toFixed(0)}đ
• Giá bán cuối: ${s.pricePerUnit}đ

→ Nhận xét: Người tiêu dùng quyết định thị trường có tồn tại hay không.
  Hàng hóa phải có cả giá trị sử dụng và giá trị phù hợp khả năng chi trả.

══════════════════════════════════
4. VAI TRÒ NHÀ NƯỚC
══════════════════════════════════
• Thuế đã nộp: ${s.taxPaid.toFixed(0)}đ
• Nguyên liệu / sp cuối phiên: ${s.materialPerUnit}đ (có thể tăng dần do sự kiện mô phỏng lạm phát / áp lực giá)
• Sự kiện đã xảy ra:
${s.events.map((e) => "  - " + e).join("\n") || "  (chưa có)"}

→ Nhận xét: Nhà nước điều tiết thị trường, bảo vệ người tiêu dùng
  và kiểm soát hoạt động của doanh nghiệp; đồng thời trong game
  có cảnh báo áp lực vĩ mô lên chi phí đầu vào (gợi lạm phát).

══════════════════════════════════
🧠 KẾT LUẬN
══════════════════════════════════
Game đã mô phỏng đầy đủ chu trình:
   SẢN XUẤT → PHÂN PHỐI → TIÊU DÙNG → NHÀ NƯỚC ĐIỀU TIẾT
Trong đó GIÁ TRỊ THẶNG DƯ sinh ra từ lao động công nhân,
là nguồn gốc lợi nhuận của nhà sản xuất.

Số dư cuối: ${s.money.toFixed(0)}đ
Tinh thần công nhân: ${s.workerMood}/100

══════════════════════════════════
5. KHI NÀO KẾT THÚC & “THẮNG / THUA”
══════════════════════════════════
• Mỗi phiên chơi có giới hạn 5 phút: hết giờ hệ thống tự mở báo cáo này
  (sự kiện «Hết giờ phiên chơi» được ghi ở mục 4 nếu kết thúc do thời gian).
• Phá sản tự động: nếu tồn kho = 0 và tiền mặt < chi phí SX tối thiểu 1 sp
  (nguyên liệu + lương), phiên kết thúc ngay — coi như «thua» vận hành (hết vốn, không còn hàng bán).
• Bạn vẫn có thể kết thúc sớm: vào khu 🏛️ Nhà nước → chọn
  «Kết thúc phiên & xem báo cáo» (phím E khi đứng trong khu).
• Không có màn hình thắng/thua kiểu đối kháng. Số tiền cuối, GTTD,
  tồn kho, thuế, sự kiện… là dữ liệu để tự rút kinh nghiệm / thuyết trình.
• Đánh giá gợi ý (chỉ mang tính học tập, dựa trên số dư & tinh thần CN):
  → ${hint}

══════════════════════════════════
6. LIÊN HỆ LÝ LUẬN (Chương 2–3 — tóm tắt)
══════════════════════════════════
• Bốn khu trong game tương ứng bốn nhóm chủ thể: người SX (🏭), trung gian
  (🚚), người tiêu dùng (🏪), nhà nước (🏛️ điều tiết + thuế + thanh tra).
• Vòng tư bản: T – H – T′; GTTD (m) tạo ra trong SX nhờ hao phí sức lao động;
  công thức giá trị hàng hóa: G = c + (v + m).
• Tiền công là giá cả hàng hóa sức lao động; thực hiện m bằng tiền cần
  hàng bán được — game nhấn mạnh giá và khâu tiêu dùng.
• Ba nút cơ chế tại 🏭: m tuyệt đối (kéo dài ngày LĐ), m tương đối (tăng NSLĐ),
  m siêu ngạch (cải tiến vượt mức xã hội) — đúng Mục 3 giáo trình.
• Nhà nước: tạo lập môi trường + khắc phục khuyết tật thị trường; không có
  kinh tế thị trường “thuần tuý” không qua điều tiết NN.
• Mở «📚 Bài giảng» trên màn hình chính để đọc đầy đủ nội dung bạn đã nhập.
`;
}

function endReasonBanner(reason: SessionEndReason): { title: string; body: string; variant: "destructive" | "default" | "muted" } | null {
  if (reason === "bankrupt") {
    return {
      title: "💸 Phá sản — coi như «thua» phiên",
      body: "Tiền mặt không đủ để sản xuất thêm 1 sản phẩm và bạn không còn hàng trong kho để bán. Trong thực tế gần với ngừng vận hành / phá sản; game tự kết thúc phiên để bạn xem tổng kết.",
      variant: "destructive",
    };
  }
  if (reason === "time") {
    return {
      title: "⏱ Hết thời gian phiên",
      body: "Đủ 5 phút — báo cáo mở theo luật chơi.",
      variant: "muted",
    };
  }
  if (reason === "manual") {
    return {
      title: "📊 Kết thúc do bạn chọn",
      body: "Bạn đã chọn «Kết thúc phiên» tại khu nhà nước (🏛️).",
      variant: "default",
    };
  }
  return null;
}

function SessionSummaryView({ stats, sessionEndReason }: { stats: GameStats; sessionEndReason: SessionEndReason }) {
  const totalRevenue = stats.soldDirect * stats.pricePerUnit + stats.soldBroker * stats.pricePerUnit * 0.8;
  const hint = evaluateSessionHint(stats);
  const banner = endReasonBanner(sessionEndReason ?? null);

  const rows: { label: string; value: string; accent?: boolean }[] = [
    { label: "💰 Tiền mặt cuối phiên", value: `${stats.money.toFixed(0)}đ`, accent: true },
    { label: "📦 Tồn kho (chưa bán)", value: `${stats.inventory} sp` },
    { label: "📱 Đã sản xuất", value: `${stats.produced} sp` },
    { label: "💎 Tổng GTTD đã tạo", value: `${stats.surplusTotal.toFixed(0)}đ`, accent: true },
    { label: "🛒 Bán lẻ / 🚚 Bán sỉ", value: `${stats.soldDirect} / ${stats.soldBroker} sp` },
    { label: "💵 Doanh thu (ước)", value: `${totalRevenue.toFixed(0)}đ` },
    { label: "💸 Thuế đã nộp", value: `${stats.taxPaid.toFixed(0)}đ` },
    { label: "🙂 Tinh thần công nhân", value: `${stats.workerMood}/100` },
    { label: "🔩 Nguyên liệu / sp (cuối)", value: `${stats.materialPerUnit}đ` },
    { label: "🏷️ Giá bán niêm yết", value: `${stats.pricePerUnit}đ/sp` },
  ];

  return (
    <div className="space-y-5">
      {banner && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            banner.variant === "destructive"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : banner.variant === "muted"
                ? "border-border bg-muted/60 text-muted-foreground"
                : "border-primary/40 bg-primary/5 text-foreground"
          }`}
        >
          <div className="font-bold mb-1">{banner.title}</div>
          <div className="text-xs opacity-90 leading-relaxed">{banner.body}</div>
        </div>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed">
        Dưới đây là <b>tổng kết nhanh</b> một phiên Market Life (SX → phân phối → tiêu dùng → nhà nước). Bấm nút bên dưới
        để xem <b>báo cáo đầy đủ</b> và lúc đó mới có nút <b>Chơi lại</b>.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className={`rounded-lg border px-3 py-2.5 text-sm ${r.accent ? "border-primary/50 bg-primary/5" : "border-border bg-muted/40"}`}
          >
            <div className="text-xs text-muted-foreground mb-0.5">{r.label}</div>
            <div className={`font-semibold ${r.accent ? "text-primary" : ""}`}>{r.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
        <span className="font-semibold text-amber-950 dark:text-amber-100">Gợi ý thảo luận: </span>
        <span className="text-muted-foreground">{hint}</span>
      </div>
    </div>
  );
}

export default function Report({ stats, onClose, sessionEndReason = null }: Props) {
  const [phase, setPhase] = useState<"summary" | "detail">("summary");
  const text = buildReport(stats);

  const download = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bao-cao-market-life.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto border border-border">
        {phase === "summary" ? (
          <>
            <h2 className="text-2xl font-bold mb-1 text-primary">
              {sessionEndReason === "bankrupt" ? "📋 Tổng kết — Phá sản" : "📋 Tổng kết phiên"}
            </h2>
            <p className="text-xs text-muted-foreground mb-5">Market Life — Kinh tế chính trị</p>
            <SessionSummaryView stats={stats} sessionEndReason={sessionEndReason ?? null} />
            <Button type="button" size="lg" className="w-full mt-6" onClick={() => setPhase("detail")}>
              📊 Xem báo cáo đầy đủ
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold">📊 Báo cáo chi tiết</h2>
                <p className="text-xs text-muted-foreground mt-1">Đã qua bước tổng kết — có thể tải file hoặc chơi lại.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPhase("summary")}>
                ← Về tổng kết
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded-lg text-xs whitespace-pre-wrap font-mono max-h-[min(52vh,480px)] overflow-y-auto border border-border">
              {text}
            </pre>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button type="button" onClick={download} className="flex-1">
                ⬇️ Tải báo cáo (.txt)
              </Button>
              <Button type="button" variant="default" className="flex-1 sm:max-w-[200px]" onClick={onClose}>
                🔁 Chơi lại
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
