from pathlib import Path
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
import json
import re

ROOT = Path(r"C:\Users\MAHAD M\Documents\Wrist Mode Website")
DEFAULT_RECORDS_PATH = ROOT / "incoming" / "women-watches-contact-sheets" / "image-records.json"
MANIFEST_PATH = ROOT / "scripts" / "women-watch-products.json"
ASSET_DIR = ROOT / "public" / "assets" / "products" / "women-watches"


def slug(value):
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def center_crop(img, size):
    width, height = img.size
    target_w, target_h = size
    src_ratio = width / height
    dst_ratio = target_w / target_h
    if src_ratio > dst_ratio:
        new_w = int(height * dst_ratio)
        left = (width - new_w) // 2
        box = (left, 0, left + new_w, height)
    else:
        new_h = int(width / dst_ratio)
        top = (height - new_h) // 2
        box = (0, top, width, top + new_h)
    return img.crop(box).resize(size, Image.Resampling.LANCZOS)


def make_contained_square(img, size):
    background = center_crop(img, size).filter(ImageFilter.GaussianBlur(22))
    background = ImageEnhance.Brightness(background).enhance(0.52)
    foreground = img.copy()
    foreground.thumbnail((int(size[0] * 0.94), int(size[1] * 0.94)), Image.Resampling.LANCZOS)
    x = (size[0] - foreground.width) // 2
    y = (size[1] - foreground.height) // 2
    background.paste(foreground, (x, y))
    return background


def enhance(img):
    img = ImageEnhance.Color(img).enhance(1.06)
    img = ImageEnhance.Contrast(img).enhance(1.05)
    return ImageEnhance.Sharpness(img).enhance(1.08)


def main():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    ASSET_DIR.mkdir(parents=True, exist_ok=True)

    written = []
    records_by_path = {}
    for group in manifest:
        records_path = ROOT / group.get("recordsPath", str(DEFAULT_RECORDS_PATH.relative_to(ROOT)))
        if records_path not in records_by_path:
            records = json.loads(records_path.read_text(encoding="utf-8"))
            records_by_path[records_path] = {int(record["idx"]): record for record in records}
        by_index = records_by_path[records_path]
        source_indices = group.get("sourceIndices", group["indices"])
        if len(source_indices) != len(group["indices"]):
            raise ValueError(f"Source image count does not match asset count for {group['name']}")
        group_slug = slug(group["name"])
        for idx, source_idx in zip(group["indices"], source_indices):
            record = by_index[int(source_idx)]
            source = Path(record["path"])
            destination = ASSET_DIR / f"{group_slug}-{int(idx):03d}.jpeg"
            with Image.open(source) as original:
                img = ImageOps.exif_transpose(original).convert("RGB")
                prepared = make_contained_square(enhance(img), (900, 900))
                prepared.save(destination, "JPEG", quality=86, optimize=True)
            written.append(str(destination))
    print(json.dumps({"count": len(written), "written": written}, indent=2))


if __name__ == "__main__":
    main()
