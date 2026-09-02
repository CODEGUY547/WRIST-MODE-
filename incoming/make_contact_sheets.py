from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import hashlib, json, math

root = Path(r"C:\Users\MAHAD M\Documents\Wrist Mode Website")
src = root / "incoming" / "watch-photos-2026-08-19"
out = root / "incoming" / "watch-contact-sheets"
out.mkdir(parents=True, exist_ok=True)

files = sorted([p for p in src.rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}])

def dhash(img, size=8):
    gray = img.convert("L").resize((size + 1, size), Image.Resampling.LANCZOS)
    pixels = list(gray.getdata())
    bits = []
    for y in range(size):
        row = y * (size + 1)
        for x in range(size):
            bits.append(1 if pixels[row + x] > pixels[row + x + 1] else 0)
    value = 0
    for bit in bits:
        value = (value << 1) | bit
    return f"{value:016x}"

def hamming_hex(a, b):
    return bin(int(a, 16) ^ int(b, 16)).count("1")

records = []
for idx, path in enumerate(files, 1):
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        records.append({
            "idx": idx,
            "name": path.name,
            "path": str(path),
            "width": im.width,
            "height": im.height,
            "sha256": digest,
            "dhash": dhash(im),
        })

clusters = []
for rec in records:
    placed = False
    for cluster in clusters:
        if rec["sha256"] == cluster[0]["sha256"] or hamming_hex(rec["dhash"], cluster[0]["dhash"]) <= 4:
            cluster.append(rec)
            placed = True
            break
    if not placed:
        clusters.append([rec])

for i, cluster in enumerate(clusters, 1):
    for rec in cluster:
        rec["cluster"] = i
        rec["cluster_size"] = len(cluster)

thumb_w, thumb_h = 230, 230
label_h = 48
cols = 5
rows = 4
per_sheet = cols * rows
font = ImageFont.load_default()

for sheet_idx, start in enumerate(range(0, len(records), per_sheet), 1):
    batch = records[start:start + per_sheet]
    sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), "#111714")
    draw = ImageDraw.Draw(sheet)
    for n, rec in enumerate(batch):
        x = (n % cols) * thumb_w
        y = (n // cols) * (thumb_h + label_h)
        path = Path(rec["path"])
        with Image.open(path) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            im.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
            px = x + (thumb_w - im.width) // 2
            py = y + (thumb_h - im.height) // 2
            sheet.paste(im, (px, py))
        label = f"{rec['idx']:03d}  c{rec['cluster']:02d}"
        if rec["cluster_size"] > 1:
            label += f" x{rec['cluster_size']}"
        draw.rectangle((x, y + thumb_h, x + thumb_w, y + thumb_h + label_h), fill="#0b0f0d")
        draw.text((x + 8, y + thumb_h + 8), label, fill="#f7d778", font=font)
        draw.text((x + 8, y + thumb_h + 25), rec["name"][:32], fill="#ffffff", font=font)
    sheet.save(out / f"sheet-{sheet_idx:02d}.jpg", quality=90)

(out / "image-records.json").write_text(json.dumps(records, indent=2), encoding="utf-8")
summary = {
    "total_images": len(records),
    "unique_clusters": len(clusters),
    "duplicate_clusters": sum(1 for c in clusters if len(c) > 1),
    "largest_clusters": sorted([len(c) for c in clusters], reverse=True)[:10],
    "sheets": [str(p) for p in sorted(out.glob("sheet-*.jpg"))],
}
(out / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
print(json.dumps(summary, indent=2))
