from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import json

root = Path(r"C:\Users\MAHAD M\Documents\Wrist Mode Website")
records = json.loads((root / "incoming" / "watch-contact-sheets" / "image-records.json").read_text(encoding="utf-8"))
out = root / "incoming" / "watch-contact-sheets" / "zoom"
out.mkdir(parents=True, exist_ok=True)

thumb_w, thumb_h = 420, 420
label_h = 46
cols = 3
rows = 3
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
            w, h = im.size
            # Center-biased crop: most photos have the watch dial around the middle.
            side = int(min(w, h) * 0.68)
            cx, cy = w // 2, h // 2
            left = max(0, min(w - side, cx - side // 2))
            top = max(0, min(h - side, cy - side // 2))
            crop = im.crop((left, top, left + side, top + side))
            crop.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
            px = x + (thumb_w - crop.width) // 2
            py = y + (thumb_h - crop.height) // 2
            sheet.paste(crop, (px, py))
        draw.rectangle((x, y + thumb_h, x + thumb_w, y + thumb_h + label_h), fill="#0b0f0d")
        draw.text((x + 8, y + thumb_h + 8), f"{rec['idx']:03d}", fill="#f7d778", font=font)
        draw.text((x + 52, y + thumb_h + 8), rec["name"][:42], fill="#ffffff", font=font)
    sheet.save(out / f"zoom-{sheet_idx:02d}.jpg", quality=93)

print("created", len(list(out.glob('zoom-*.jpg'))), "zoom sheets")
