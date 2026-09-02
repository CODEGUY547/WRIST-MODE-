from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageOps, ImageDraw, ImageFont
import hashlib
import json

ROOT = Path(r"C:\Users\MAHAD M\Documents\Wrist Mode Website")
ZIP_PATH = Path(r"C:\Users\MAHAD M\Desktop\WhatsApp Unknown 2026-08-20 at 6.54.17 PM.zip")
EXTRACT_DIR = ROOT / "incoming" / "women-watches-2026-08-20"
OUT_DIR = ROOT / "incoming" / "women-watches-contact-sheets"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def dhash(img, size=8):
    gray = img.convert("L").resize((size + 1, size), Image.Resampling.LANCZOS)
    pixels = list(gray.getdata())
    value = 0
    for y in range(size):
        row = y * (size + 1)
        for x in range(size):
            value = (value << 1) | (1 if pixels[row + x] > pixels[row + x + 1] else 0)
    return f"{value:016x}"


def hamming_hex(a, b):
    return bin(int(a, 16) ^ int(b, 16)).count("1")


def extract_zip():
    EXTRACT_DIR.mkdir(parents=True, exist_ok=True)
    if not any(EXTRACT_DIR.rglob("*")):
        with ZipFile(ZIP_PATH) as archive:
            archive.extractall(EXTRACT_DIR)


def build_records():
    files = sorted(path for path in EXTRACT_DIR.rglob("*") if path.suffix.lower() in IMAGE_EXTS)
    records = []
    for idx, path in enumerate(files, 1):
        with Image.open(path) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            records.append(
                {
                    "idx": idx,
                    "name": path.name,
                    "path": str(path),
                    "width": im.width,
                    "height": im.height,
                    "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                    "dhash": dhash(im),
                }
            )
    return records


def add_clusters(records):
    clusters = []
    for record in records:
        for cluster in clusters:
            if record["sha256"] == cluster[0]["sha256"] or hamming_hex(record["dhash"], cluster[0]["dhash"]) <= 4:
                cluster.append(record)
                break
        else:
            clusters.append([record])

    for number, cluster in enumerate(clusters, 1):
        for record in cluster:
            record["cluster"] = number
            record["cluster_size"] = len(cluster)
    return clusters


def write_sheets(records):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("sheet-*.jpg"):
        old.unlink()

    thumb_w, thumb_h, label_h = 220, 220, 50
    cols, rows = 5, 5
    per_sheet = cols * rows
    font = ImageFont.load_default()
    sheets = []

    for sheet_idx, start in enumerate(range(0, len(records), per_sheet), 1):
        batch = records[start : start + per_sheet]
        sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), "#0c1110")
        draw = ImageDraw.Draw(sheet)
        for n, record in enumerate(batch):
            x = (n % cols) * thumb_w
            y = (n // cols) * (thumb_h + label_h)
            with Image.open(record["path"]) as im:
                im = ImageOps.exif_transpose(im).convert("RGB")
                im.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                px = x + (thumb_w - im.width) // 2
                py = y + (thumb_h - im.height) // 2
                sheet.paste(im, (px, py))
            draw.rectangle((x, y + thumb_h, x + thumb_w, y + thumb_h + label_h), fill="#080b0a")
            label = f"{record['idx']:03d} c{record['cluster']:02d}"
            if record["cluster_size"] > 1:
                label += f" x{record['cluster_size']}"
            draw.text((x + 8, y + thumb_h + 8), label, fill="#f7d778", font=font)
            draw.text((x + 8, y + thumb_h + 27), record["name"][:32], fill="#ffffff", font=font)
        sheet_path = OUT_DIR / f"sheet-{sheet_idx:02d}.jpg"
        sheet.save(sheet_path, quality=90)
        sheets.append(str(sheet_path))
    return sheets


def main():
    extract_zip()
    records = build_records()
    clusters = add_clusters(records)
    sheets = write_sheets(records)
    (OUT_DIR / "image-records.json").write_text(json.dumps(records, indent=2), encoding="utf-8")
    summary = {
        "total_images": len(records),
        "unique_clusters": len(clusters),
        "duplicate_clusters": sum(1 for cluster in clusters if len(cluster) > 1),
        "sheets": sheets,
    }
    (OUT_DIR / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
