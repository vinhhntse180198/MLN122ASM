import { Button } from "@/components/ui/button";
import { ZoneTheorySnippet } from "@/game/LectureMaterial";
import type { GameStats, ZoneId } from "./types";

interface Props {
  zone: ZoneId;
  stats: GameStats;
  onAction: (action: string) => void;
  onClose: () => void;
}

export default function ZonePanel({ zone, stats, onAction, onClose }: Props) {
  const wage = stats.wagePerUnit;
  const matCost = stats.materialPerUnit * (stats.hasTech ? 0.7 : 1);
  const value = stats.pricePerUnit * (stats.hasMachine ? 1.2 : 1);
  const surplus = value - wage - matCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card text-card-foreground rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border-2"
        style={{ borderColor: `hsl(var(--zone-${zone}))` }}
        onClick={(e) => e.stopPropagation()}
      >
        {zone === "factory" && (
          <>
            <div className="flex items-start gap-3 mb-3">
              <div className="text-5xl">🏭</div>
              <div>
                <h2 className="text-2xl font-bold">Nhà máy sản xuất</h2>
                <p className="text-sm text-muted-foreground">
                  Bạn là <b>chủ tư bản</b>. Thuê <b>công nhân (👷)</b> + mua nguyên liệu để sản xuất 📱.
                  Phần chênh lệch giữa giá trị sản phẩm và chi phí = <b>giá trị thặng dư (m)</b> bạn chiếm hữu.
                </p>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 mb-4 font-mono text-sm space-y-1">
              <div>👷 Lương công nhân / sp: <b>{wage}đ</b></div>
              <div>🔩 Nguyên liệu / sp: <b>{matCost.toFixed(0)}đ</b> {stats.hasTech && <span className="text-info">(công nghệ −30%)</span>}</div>
              <div>💎 Giá trị tạo ra / sp: <b>{value.toFixed(0)}đ</b> {stats.hasMachine && <span className="text-info">(máy +20%)</span>}</div>
              <div className="text-primary text-base pt-2 border-t border-border">
                💰 Giá trị thặng dư <b>m = {surplus.toFixed(0)}đ/sp</b>
              </div>
              <div className="text-xs text-destructive pt-1">
                ⚠️ Đây chính là phần lao động công nhân KHÔNG được trả công.
              </div>
            </div>

            <h3 className="font-bold mb-2">📱 Sản xuất điện thoại</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button onClick={() => onAction("produce")} disabled={stats.money < matCost + wage}>
                Sản xuất 1 cái (−{(matCost + wage).toFixed(0)}đ)
              </Button>
              <Button onClick={() => onAction("produce5")} disabled={stats.money < (matCost + wage) * 5}>
                Sản xuất ×5 (−{((matCost + wage) * 5).toFixed(0)}đ)
              </Button>
            </div>

            <h3 className="font-bold mt-4 mb-2">⚙️ 3 cách tăng giá trị thặng dư</h3>
            <div className="space-y-2">
              <Button
                variant={stats.overtime ? "default" : "outline"}
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => onAction("toggleOvertime")}
              >
                <div>
                  <div>🔴 <b>Tuyệt đối</b> — Tăng giờ làm {stats.overtime ? "✓ ĐANG BẬT" : ""}</div>
                  <div className="text-xs opacity-75">Bóc lột thêm thời gian → công nhân 😡 mệt mỏi</div>
                </div>
              </Button>
              <Button
                variant={stats.hasMachine ? "default" : "outline"}
                className="w-full justify-start text-left h-auto py-2"
                disabled={stats.hasMachine || stats.money < 200}
                onClick={() => onAction("buyMachine")}
              >
                <div>
                  <div>🔵 <b>Tương đối</b> — Mua máy móc (−200đ) {stats.hasMachine ? "✓" : ""}</div>
                  <div className="text-xs opacity-75">Tăng năng suất → giá trị/sp +20%</div>
                </div>
              </Button>
              <Button
                variant={stats.hasTech ? "default" : "outline"}
                className="w-full justify-start text-left h-auto py-2"
                disabled={stats.hasTech || stats.money < 400}
                onClick={() => onAction("buyTech")}
              >
                <div>
                  <div>🟡 <b>Siêu ngạch</b> — Công nghệ mới (−400đ) {stats.hasTech ? "✓" : ""}</div>
                  <div className="text-xs opacity-75">Đi trước đối thủ → nguyên liệu −30%</div>
                </div>
              </Button>
            </div>
          </>
        )}

        {zone === "broker" && (
          <>
            <div className="flex items-start gap-3 mb-3">
              <div className="text-5xl">🚚</div>
              <div>
                <h2 className="text-2xl font-bold">Trung gian phân phối (Bán sỉ)</h2>
                <p className="text-sm text-muted-foreground">
                  Trung gian là <b>nhà buôn / đại lý</b>. Họ <b>mua sỉ toàn bộ kho</b> của bạn ngay lập tức,
                  rồi tự đem đi bán lại. Bạn thu tiền nhanh — nhưng phải <b>chia 20% lợi nhuận</b> cho họ.
                </p>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 mb-4 text-sm space-y-1">
              <div>📦 Tồn kho hiện có: <b>{stats.inventory}</b> điện thoại</div>
              <div>💵 Giá sỉ thu về: <b>{(stats.pricePerUnit * 0.8).toFixed(0)}đ/sp</b> <span className="text-destructive">(mất 20%)</span></div>
              <div className="pt-2 border-t border-border">
                Tổng nếu bán hết: <b className="text-primary">+{(stats.inventory * stats.pricePerUnit * 0.8).toFixed(0)}đ</b>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={stats.inventory < 1}
              onClick={() => onAction("sellBroker")}
            >
              🚚 Bán SỈ toàn bộ {stats.inventory} sp cho trung gian
            </Button>

            <div className="mt-4 p-3 bg-info/10 rounded-lg text-xs">
              <b>📌 Khâu PHÂN PHỐI:</b> Trung gian không sản xuất ra giá trị, nhưng giúp <b>lưu thông hàng hoá</b>
              nhanh hơn. Họ ăn chênh lệch — một phần giá trị thặng dư bị chia sẻ ở khâu này.
            </div>
          </>
        )}

        {zone === "shop" && (
          <>
            <div className="flex items-start gap-3 mb-3">
              <div className="text-5xl">🏪</div>
              <div>
                <h2 className="text-2xl font-bold">Cửa hàng (Bán lẻ trực tiếp)</h2>
                <p className="text-sm text-muted-foreground">
                  Bán <b>thẳng cho người tiêu dùng (🧍 khách)</b>. Lời cao hơn nhưng chậm — và{" "}
                  <b>khách có quyền từ chối</b> nếu giá quá cao. Bạn phải định giá hợp lý.
                </p>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 mb-4 text-sm space-y-1">
              <div>📦 Tồn kho: <b>{stats.inventory}</b></div>
              <div>🏷️ Giá niêm yết: <b className="text-primary text-lg">{stats.pricePerUnit}đ</b></div>
              <div className="text-xs pt-1">
                {stats.pricePerUnit < 180 && "👍 Giá rẻ — khách rất thích, dễ bán"}
                {stats.pricePerUnit >= 180 && stats.pricePerUnit <= 250 && "🙂 Giá hợp lý — khách cân nhắc"}
                {stats.pricePerUnit > 250 && "😡 Giá quá cao — nhiều khách bỏ đi"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 items-center">
              <Button variant="outline" onClick={() => onAction("priceDown")}>− Giảm 10đ</Button>
              <div className="text-center font-bold py-2 bg-muted rounded">{stats.pricePerUnit}đ</div>
              <Button variant="outline" onClick={() => onAction("priceUp")}>+ Tăng 10đ</Button>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={stats.inventory < 1}
              onClick={() => onAction("sellDirect")}
            >
              🛒 Mời 1 khách vào mua (lượt thử)
            </Button>

            <div className="mt-4 p-3 bg-success/10 rounded-lg text-xs">
              <b>📌 Khâu TIÊU DÙNG:</b> Người tiêu dùng quyết định hàng có "thực hiện được giá trị" hay không.
              Nếu không ai mua → giá trị thặng dư chỉ nằm trên giấy.
            </div>
          </>
        )}

        {zone === "state" && (
          <>
            <div className="flex items-start gap-3 mb-3">
              <div className="text-5xl">🏛️</div>
              <div>
                <h2 className="text-2xl font-bold">Cơ quan Nhà nước</h2>
                <p className="text-sm text-muted-foreground">
                  Nhà nước <b>điều tiết thị trường</b>: thu thuế để tái phân phối, kiểm tra điều kiện lao động (👮),
                  bảo vệ người tiêu dùng khỏi giá cắt cổ, và xử phạt vi phạm.
                </p>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 mb-4 text-sm space-y-1">
              <div>💸 Tổng thuế đã nộp: <b>{stats.taxPaid.toFixed(0)}đ</b></div>
              <div>🙂 Tinh thần công nhân: <b>{stats.workerMood}/100</b></div>
              <div>📋 Số sự kiện đã trải qua: <b>{stats.events.length}</b></div>
              <div className="pt-2 border-t border-border text-xs text-muted-foreground space-y-2">
                <p>
                  Cứ khoảng <b>30–45 giây</b> (ngẫu nhiên) có một <b>đoàn thanh tra</b> từ đây đến 🏭: nếu lâu không{" "}
                  <b>nộp thuế</b> hoặc đang <b>bật tăng giờ</b> khi họ kiểm tra, bạn có thể bị <b>phạt tiền</b> (xem thông báo
                  sau chuyến kiểm tra).
                </p>
                <p>
                  Định kỳ khác, game mô phỏng <b>áp lực lạm phát / giá đầu vào</b>: chi phí <b>nguyên liệu mỗi sp</b> có thể
                  tăng dần (thông báo toast + ghi vào nhật ký sự kiện) — gợi ý công cụ điều tiết vĩ mô (tiền tệ, giá…) trong
                  giáo trình.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Button className="w-full justify-start" onClick={() => onAction("payTax")}>
                💸 Nộp thuế thu nhập (10% tiền mặt hiện có)
              </Button>
              <p className="text-xs text-muted-foreground px-1">
                Mỗi lần bấm trừ <b>10% tiền mặt đang có</b> — bạn có thể <b>nộp nhiều lần</b> trong phiên (ví dụ sau khi kinh
                doanh có lãi, vào nộp lại để cập nhật “đã nộp gần đây” cho thanh tra).
              </p>
              <Button variant="outline" className="w-full justify-start" onClick={() => onAction("inspect")}>
                👮 Yêu cầu thanh tra lao động (+ tinh thần công nhân)
              </Button>
              <Button variant="destructive" className="w-full justify-start mt-3" onClick={() => onAction("endGame")}>
                📊 KẾT THÚC PHIÊN & XEM BÁO CÁO
              </Button>
            </div>

            <div className="mt-4 p-3 bg-destructive/10 rounded-lg text-xs">
              <b>📌 Vai trò NHÀ NƯỚC:</b> Không trực tiếp tạo ra giá trị thặng dư, nhưng <b>điều tiết</b> sự
              phân phối lại của nó qua thuế, luật lao động, kiểm soát giá. Đảm bảo thị trường vận hành công bằng.
            </div>
          </>
        )}

        <div className="mt-4">
          <ZoneTheorySnippet zone={zone} />
        </div>

        <Button variant="ghost" className="w-full mt-4" onClick={onClose}>
          ← Đóng (hoặc đi ra khỏi khu)
        </Button>
      </div>
    </div>
  );
}
