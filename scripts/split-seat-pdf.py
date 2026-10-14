"""
Tách PDF vé Thành Bưởi (mỗi trang = 1 ghế + QR) thành file riêng.
Tên file dùng nickname theo danh sách đoàn, không dùng họ tên trên PDF.

Dùng: py -3 scripts/split-seat-pdf.py [đường-dẫn-pdf] [thư-mục-ra]
"""
import re
import sys
from pathlib import Path
import pymupdf

# Tên file theo sơ đồ ghế đoàn (seats.js). Tên in trên PDF có thể sai / lệch chỗ.
ASSIGN_BY_TRIP = {
    "sg-dl": {  # chiều đi
        "1A": "Lệ", "3A": "Linh Đậu", "4A": "Bơ", "5A": "Timmie", "6A": "Vợ Timmie",
        "7A": "Bịp", "8A": "Tú", "9A": "Thuỳ", "11A": "Trí Quan",
        "12A": "Dori", "3B": "Luật", "4B": "Luna", "5B": "Quân", "6B": "Thy",
        "7B": "Thành", "9B": "Đăng",
    },
    "dl-sg": {  # chiều về
        "1A": "Lệ", "3A": "Linh Đậu", "4A": "Bơ", "5A": "Timmie", "6A": "Vợ Timmie",
        "7A": "Bịp", "8A": "Tú", "9A": "Thuỳ", "11A": "Trí Quan", "12A": "Dori",
        "4B": "Luna", "5B": "Quân", "6B": "Thy", "7B": "Thành", "9B": "Đăng",
    },
}


def detect_trip(src: Path, out_dir: Path) -> str:
    blob = f"{src.name} {out_dir.name}".casefold()
    if "dl-sg" in blob or "dl_sg" in blob:
        return "dl-sg"
    if "sg-dl" in blob or "sg_dl" in blob:
        return "sg-dl"
    return "sg-dl"


def nick_of(seat: str | None, trip: str, full_name: str | None) -> str:
    if seat and seat in ASSIGN_BY_TRIP.get(trip, {}):
        return ASSIGN_BY_TRIP[trip][seat]
    return full_name or "unknown"


def parse_page(page):
    text = page.get_text("text")
    seat = None
    name_parts = []
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    grabbing_name = False
    for ln in lines:
        if ln.startswith("Tên hành khách") or ln.startswith("Passenger:"):
            grabbing_name = True
            continue
        if grabbing_name:
            if (
                ln.startswith("Phòng")
                or ln.startswith("Số ghế")
                or ln.startswith("Seat:")
                or ln.startswith("Ngày")
                or ln.startswith("Số xe")
            ):
                grabbing_name = False
            elif re.fullmatch(r"\d{1,2}[AB]", ln.replace(" ", "")) or ln in ("/",):
                grabbing_name = False
            else:
                name_parts.append(ln)
                continue
        if "Seat:" in ln or ln.startswith("Phòng") or ln.startswith("Số ghế"):
            m = re.search(r"(\d{1,2}[AB])", ln.replace(" ", ""))
            if m:
                seat = m.group(1)
    if not seat:
        m = re.search(r"(\d{1,2}[AB])", text.replace(" ", ""))
        seat = m.group(1) if m else None
    name = " ".join(name_parts).replace("  ", " ").strip() or None
    return seat, name


def content_clip(page, pad=18):
    blocks = page.get_text("dict")["blocks"]
    xs0, ys0, xs1, ys1 = [], [], [], []
    for b in blocks:
        x0, y0, x1, y1 = b["bbox"]
        if y1 < 30 or y0 > 800:
            continue
        xs0.append(x0); ys0.append(y0); xs1.append(x1); ys1.append(y1)
    for img in page.get_images(full=True):
        for r in page.get_image_rects(img[0]):
            xs0.append(r.x0); ys0.append(r.y0); xs1.append(r.x1); ys1.append(r.y1)
    if not xs0:
        return page.rect
    return pymupdf.Rect(
        max(0, min(xs0) - pad),
        max(0, min(ys0) - pad),
        min(page.rect.x1, max(xs1) + pad),
        min(page.rect.y1, max(ys1) + pad),
    )


def safe_filename(nick: str) -> str:
    return re.sub(r"[^\w\-]+", "-", nick, flags=re.UNICODE).strip("-") or "unknown"


def main():
    downloads = Path(r"c:\Users\Luat Nguyen\Downloads")
    src = Path(sys.argv[1]) if len(sys.argv) >= 2 else next(downloads.glob("*0387741087*.pdf"))
    out_dir = Path(sys.argv[2]) if len(sys.argv) >= 3 else downloads / "ve-xe-tung-ghe"

    doc = pymupdf.open(src)
    out_dir.mkdir(exist_ok=True)
    for old in out_dir.glob("*.pdf"):
        old.unlink()
    for old in out_dir.glob("_danh-sach.txt"):
        old.unlink()

    trip = detect_trip(src, out_dir)
    log = [f"trip={trip} (ten file theo so do ghe doan, khong theo ten in PDF)"]
    for i, page in enumerate(doc):
        seat, full = parse_page(page)
        nick = nick_of(seat, trip, full)
        clip = content_clip(page)
        fname = f"{seat or f'p{i+1:02d}'}_{safe_filename(nick)}.pdf"
        dest = out_dir / fname

        new = pymupdf.open()
        npage = new.new_page(width=clip.width, height=clip.height)
        npage.show_pdf_page(npage.rect, doc, i, clip=clip)
        new.save(dest, garbage=4, deflate=True)
        new.close()
        log.append(f"{i+1:02d} seat={seat} nick={nick} full={full} file={fname}")

    summary = out_dir / "_danh-sach.txt"
    summary.write_text("\n".join(log) + f"\n\nsource={src.name}\ncount={len(log)}", encoding="utf-8")
    print(f"split {len(log)} -> {out_dir}")
    for line in log:
        print(line.encode("ascii", "backslashreplace").decode())
    doc.close()


if __name__ == "__main__":
    main()
