import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageStat


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "contact-sheets"
OUT.mkdir(parents=True, exist_ok=True)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def dhash(image, hash_size=8):
    gray = ImageOps.grayscale(image)
    resized = gray.resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    pixels = list(resized.getdata())
    bits = []
    for row in range(hash_size):
        offset = row * (hash_size + 1)
        for col in range(hash_size):
            bits.append(pixels[offset + col] > pixels[offset + col + 1])
    value = 0
    for bit in bits:
        value = (value << 1) | int(bit)
    return value


def hamming(a, b):
    return (a ^ b).bit_count()


def brightness_score(image):
    thumb = ImageOps.grayscale(image).resize((32, 32), Image.Resampling.LANCZOS)
    return ImageStat.Stat(thumb).mean[0]


def safe_open(path):
    try:
        image = Image.open(path)
        image.load()
        return ImageOps.exif_transpose(image).convert("RGB")
    except Exception:
        return None


def center_crop(image, width, height):
    return ImageOps.fit(image, (width, height), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def main():
    candidates = []
    for path in sorted(ROOT.rglob("*")):
        if OUT in path.parents or path.suffix.lower() not in IMAGE_EXTS:
            continue
        image = safe_open(path)
        if image is None:
            continue
        candidates.append(
            {
                "path": str(path),
                "relative": str(path.relative_to(ROOT)),
                "width": image.width,
                "height": image.height,
                "hash": dhash(image),
                "brightness": brightness_score(image),
            }
        )

    groups = []
    for item in candidates:
        placed = False
        for group in groups:
            if hamming(item["hash"], group[0]["hash"]) <= 4:
                group.append(item)
                placed = True
                break
        if not placed:
            groups.append([item])

    records = []
    for index, group in enumerate(groups, 1):
        # Prefer larger, clear images when duplicates are close.
        best = sorted(group, key=lambda x: (x["width"] * x["height"], x["brightness"]), reverse=True)[0]
        best["index"] = index
        best["duplicate_count"] = len(group)
        best["duplicates"] = [g["relative"] for g in group if g is not best]
        records.append(best)

    font = ImageFont.load_default()
    tile_w, tile_h = 220, 250
    img_w, img_h = 200, 200
    cols = 5
    pages = math.ceil(len(records) / 20)
    for page in range(pages):
        page_items = records[page * 20 : (page + 1) * 20]
        rows = math.ceil(len(page_items) / cols)
        sheet = Image.new("RGB", (cols * tile_w, rows * tile_h), "white")
        draw = ImageDraw.Draw(sheet)
        for local_index, item in enumerate(page_items):
            x = (local_index % cols) * tile_w
            y = (local_index // cols) * tile_h
            image = safe_open(Path(item["path"]))
            thumb = center_crop(image, img_w, img_h)
            sheet.paste(thumb, (x + 10, y + 10))
            label = f"{item['index']:03d}  dup:{item['duplicate_count']}"
            draw.rectangle((x + 10, y + 211, x + img_w + 10, y + 236), fill=(10, 28, 22))
            draw.text((x + 16, y + 218), label, fill=(255, 225, 150), font=font)
        sheet.save(OUT / f"sheet-{page + 1:02d}.jpg", quality=88)

    for item in records:
        item["hash"] = f"{item['hash']:016x}"
    (OUT / "image-records.json").write_text(json.dumps(records, indent=2), encoding="utf-8")
    print(json.dumps({"source_images": len(candidates), "unique_images": len(records), "pages": pages}, indent=2))


if __name__ == "__main__":
    main()
