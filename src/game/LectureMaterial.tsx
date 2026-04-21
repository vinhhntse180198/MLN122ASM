import { Button } from "@/components/ui/button";
import type { ZoneId } from "./types";

const detailClass =
  "mb-2 rounded-lg border border-border bg-card px-3 py-2 [&_summary]:cursor-pointer [&_summary]:font-semibold [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-sm [&_li]:text-muted-foreground";

/** Khối lý thuyết ngắn — gắn với từng khu trong game. */
export function ZoneTheorySnippet({ zone }: { zone: ZoneId }) {
  return (
    <details className={detailClass}>
      <summary className="text-sm">📖 Móc bài giảng (Chương 2–3)</summary>
      {zone === "factory" && (
        <ul>
          <li>
            <b>Người sản xuất:</b> dùng đầu vào để SXKD, mục tiêu lợi nhuận; phải lựa chọn hàng hoá, số lượng, cách kết hợp yếu tố.
          </li>
          <li>
            <b>T – H – T′:</b> tư bản nhằm ΔT &gt; 0; ΔT là giá trị thặng dư. Nguồn gốc m tìm ở sản xuất (sức lao động tạo giá trị mới lớn hơn).
          </li>
          <li>
            <b>G = c + (v + m):</b> trong game, nguyên liệu + máy gợi ý phần <b>c</b>; lương gợi ý <b>v</b>; chênh lệch giá trị/sp ≈ <b>m</b>.
          </li>
          <li>
            Ba nút 🔴🔵🟡 tương ứng <b>m tuyệt đối</b>, <b>m tương đối</b>, <b>m siêu ngạch</b> (Mục 3 — Chương 3).
          </li>
        </ul>
      )}
      {zone === "broker" && (
        <ul>
          <li>
            <b>Chủ thể trung gian:</b> cầu nối SX – tiêu dùng; tăng cơ hội thực hiện giá trị hàng hoá, thị trường linh hoạt hơn.
          </li>
          <li>Xuất hiện do phân công lao động xã hội — tách SX và trao đổi.</li>
          <li>
            Cần loại trừ trung gian phi đạo đức (lừa đảo…). Trong game, trung gian <b>ăn chênh</b> nhưng giúp bán nhanh toàn bộ kho.
          </li>
        </ul>
      )}
      {zone === "shop" && (
        <ul>
          <li>
            <b>Người tiêu dùng:</b> mua HH-DV để thỏa nhu cầu; <b>sức mua</b> quyết định phát triển bền vững của người SX.
          </li>
          <li>Nhu cầu đa dạng thúc đẩy SX; người tiêu dùng <b>định hướng</b> SX trong KTTT.</li>
          <li>
            <b>Thực hiện giá trị thặng dư bằng tiền:</b> hàng phải bán được — game mô phỏng khách có thể từ chối nếu giá cao.
          </li>
        </ul>
      )}
      {zone === "state" && (
        <ul>
          <li>
            <b>Chức năng 1 — Tạo lập môi trường:</b> thuận lợi kinh doanh, bớt rào cản kìm hãm sáng tạo.
          </li>
          <li>
            <b>Chức năng 2 — Khắc phục khuyết tật thị trường:</b> thuế, chính sách… (trong game: nộp thuế, thanh tra).
          </li>
          <li>
            <b>Kết luận giáo trình:</b> không có mô hình KTTT “thuần tuý” — đều cần vai trò kinh tế của nhà nước.
          </li>
        </ul>
      )}
    </details>
  );
}

/** Toàn bộ nội dung bạn gửi — đọc trong modal, không làm gián đoạn phiên chơi. */
export function LectureModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lecture-title"
    >
      <div
        className="bg-card text-card-foreground max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-primary/30 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="lecture-title" className="text-xl font-bold text-primary">
              Nội dung bài giảng
            </h2>
            <p className="text-sm text-muted-foreground">Kinh tế chính trị Mác – Lênin · Chương 2–3 (tóm theo giáo trình bạn cung cấp)</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="shrink-0">
            Đóng
          </Button>
        </div>

        <details className={detailClass} open>
          <summary>PHẦN 1 — Chương 2 · Mục III. Vai trò chủ thể tham gia thị trường</summary>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">1. Người sản xuất</p>
              <p>
                SX và cung HH-DV ra thị trường (nhà SX, nhà đầu tư, KD…). Dùng đầu vào để SXKD, thu lợi nhuận; mục tiêu lợi
                nhuận tối đa trong nguồn lực hạn chế; lựa chọn HH, số lượng, kết hợp yếu tố. Trách nhiệm xã hội: không cung
                HH-DV gây tổn hại SK và lợi ích con người.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">2. Người tiêu dùng</p>
              <p>
                Mua HH-DV để thỏa nhu cầu. Sức mua quyết định phát triển bền vững của người SX; nhu cầu đa dạng là động lực
                SX; định hướng SX trong KTTT; trách nhiệm với phát triển bền vững. <i>Lưu ý:</i> phân chia SX / tiêu dùng chỉ
                tương đối — DN vừa mua vừa bán.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">3. Chủ thể trung gian</p>
              <p>
                Cầu nối SX – tiêu dùng; do phân công lao động XH. Vai trò: tăng cơ hội thực hiện giá trị HH, kết nối SX–TD,
                thị trường sống động. Loại hình: thương nhân, môi giới CK, BĐS, KH-CN… Loại trừ trung gian phi đạo đức, bất hợp
                pháp.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">4. Nhà nước</p>
              <p>
                Quản lý KT và khắc phục khuyết tật thị trường. <b>(1)</b> Tạo lập môi trường kinh doanh thuận lợi, bỏ rào cản
                kìm hãm sáng tạo. <b>(2)</b> Khắc phục khuyết tật bằng công cụ KT (thuế, lãi suất, chính sách…).{" "}
                <b>Kết luận:</b> không có KTTT thuần tuý — đều cần vai trò KT của NN.
              </p>
            </div>
          </div>
        </details>

        <details className={detailClass}>
          <summary>PHẦN 2 — Chương 3 Buổi 1 · Giá trị thặng dư (Mục 1 — phần đầu)</summary>
          <ul>
            <li>
              <b>Công thức chung tư bản:</b> HH đơn giản: <b>H – T – H</b> (mục đích giá trị sử dụng). TBCN: <b>T – H – T′</b> (mục
              đích giá trị lớn hơn). <b>T′ = T + ΔT</b> (ΔT &gt; 0 là giá trị thặng dư).
            </li>
            <li>Tư bản là giá trị mang lại GTTD; tiền chỉ thành tư bản khi dùng để sinh ra GTTD.</li>
            <li>Mâu thuẫn: lưu thông thường không tạo thêm giá trị trên phạm vi XH; nguồn GTTD ở ngoài lưu thông nhưng gắn với lưu thông.</li>
            <li>
              <b>Hàng hoá sức lao động:</b> khi sử dụng, giá trị không chỉ bảo tồn mà tạo giá trị mới lớn hơn. Điều kiện: tự do
              về thân thể để bán SLĐ; không đủ TLSX → phải bán SLĐ. Giá trị SLĐ gồm: tư liệu sinh hoạt tái tạo SLĐ; phí đào tạo;
              nuôi con.
            </li>
            <li>
              <b>Quá trình SX GTTD:</b> thống nhất tạo ra và làm tăng giá trị. Thời gian lao động tất yếu bù giá trị SLĐ; thời
              gian LĐ thặng dư tạo GTTD cho nhà tư bản. <i>Ví dụ sợi (8h):</i> ứng 121 USD, thu 136 USD → <b>m = 15 USD</b> (4h
              thặng dư). GTTD là phần giá trị mới dôi ngoài giá trị SLĐ — lao động không công của CN cho nhà tư bản.
            </li>
            <li>
              <b>c</b> (tư bản bất biến): TLSX, giá trị bảo toàn chuyển vào SP, không tạo m nhưng là điều kiện. <b>v</b> (tư bản
              khả biến): mua SLĐ, qua LĐ trừu tượng của CN mà tăng — <b>G = c + (v + m)</b>.
            </li>
          </ul>
        </details>

        <details className={detailClass}>
          <summary>PHẦN 3 — Chương 3 Buổi 2 · Tiền công, tuần hoàn/chu chuyển tư bản, bản chất m</summary>
          <ul>
            <li>
              <b>Tiền công:</b> giá cả HH SLĐ; bản chất: nguồn từ hao phí SLĐ người LĐ tự trả qua “sổ sách” người mua SLĐ.
            </li>
            <li>
              Thực hiện GTTD bằng tiền: HH phải <b>bán được</b> — thị trường chấp nhận; không bán được → nguy cơ phá sản.
            </li>
            <li>
              <b>Tuần hoàn tư bản:</b> Tư bản tiền tệ → SX → HH — công thức <b>T – H (SLĐ/TLSX) … SX … H′ – T′</b>. GTTD tạo
              trong SX, không phải mua rẻ bán đắt.
            </li>
            <li>
              <b>Chu chuyển tư bản:</b> tuần hoàn xét theo thời gian định kỳ. Thời gian chu chuyển = SX + lưu thông. Tốc độ{" "}
              <b>n = CH/ch</b>. Tư bản cố định / lưu động (hao mòn dần vs chuyển một lần).
            </li>
            <li>
              <b>Bản chất GTTD:</b> hao phí SLĐ trong thống nhất tạo ra và làm tăng giá trị; quan hệ giai cấp; làm giàu trên
              thuê mướn LĐ. Thước đo: <b>m′ = (m/v)×100%</b> hoặc <b>(t′/t)×100%</b>; khối lượng <b>M = m′ × V</b>.
            </li>
          </ul>
        </details>

        <details className={detailClass}>
          <summary>PHẦN 4 — Chương 3 Buổi 3 · Các phương pháp SX GTTD</summary>
          <ul>
            <li>
              <b>m tuyệt đối:</b> kéo dài ngày LĐ vượt thời gian LĐ tất yếu (NSLĐ, giá trị SLĐ, tất yếu không đổi). Giới hạn
              sinh lý + đấu tranh giảm giờ làm.
            </li>
            <li>
              <b>m tương đối:</b> rút ngắn LĐ tất yếu → kéo dài LĐ thặng dư (độ dài ngày không đổi hoặc rút). Cách: tăng NSLĐ
              ngành TLSH & TLSX.
            </li>
            <li>
              <b>m siêu ngạch:</b> xí nghiệp cải tiến, NSLĐ cao hơn XH → giá trị cá biệt &lt; giá trị XH → thu thêm GTTD; động
              lực cải tiến; biến tướng của m tương đối. Lịch sử: 3 cuộc CM (tổ chức–QL; SLĐ; tư liệu LĐ / đại CN). Hiện nay:
              KH-CN & toàn cầu hoá.
            </li>
          </ul>
        </details>

        <p className="mt-4 text-xs text-muted-foreground">
          Bạn có thể mở lại mục này bất cứ lúc nào bằng nút <b>«📚 Bài giảng»</b> trên màn hình chính. Nội dung chỉ nhằm hỗ trợ
          học tập, diễn giải theo tài liệu bạn gửi.
        </p>
      </div>
    </div>
  );
}
