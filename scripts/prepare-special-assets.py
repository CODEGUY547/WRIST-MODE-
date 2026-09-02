from pathlib import Path
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
import json

ROOT = Path(r"C:\Users\MAHAD M\Documents\Wrist Mode Website")
ASSET_ROOT = ROOT / "public" / "assets" / "products"

SETS = [
    {
        "records": ROOT / "incoming" / "custom-jewelry-contact-sheets" / "image-records.json",
        "out": ASSET_ROOT / "custom-jewelry",
        "mode": "contain",
        "items": {
            1: "custom-photo-keyholders.jpeg",
            2: "photo-pendant-closeup-box.jpeg",
            7: "photo-pendant-gift-box.jpeg",
            8: "engraved-message-pendant-box.jpeg",
            9: "engraved-name-bracelet-gold.jpeg",
            12: "blue-rolex-name-bracelet.jpeg",
            14: "silver-name-bar-necklace.jpeg",
            15: "engraved-message-dog-tag.jpeg",
            16: "custom-bracelet-display.jpeg",
        },
    },
    {
        "records": ROOT / "incoming" / "wooden-watches-contact-sheets" / "image-records.json",
        "out": ASSET_ROOT / "wooden-watches",
        "mode": "cover",
        "items": {
            1: "black-minimal-wood-watch.jpeg",
            2: "gold-bamboo-wood-watch.jpeg",
            3: "amber-grain-wood-watch.jpeg",
            4: "striped-zebrawood-watch.jpeg",
            5: "rosewood-silver-dial-watch.jpeg",
            6: "light-bamboo-silver-watch.jpeg",
            7: "engraved-face-wood-watch.jpeg",
            10: "black-brown-wood-chronograph.jpeg",
            11: "dual-dial-bamboo-chronograph.jpeg",
            12: "black-round-wood-watch.jpeg",
            13: "black-steel-wood-chronograph.jpeg",
            14: "brown-dual-time-wood-watch.jpeg",
            15: "gold-wood-moonphase-watch.jpeg",
            16: "orange-black-wood-chronograph.jpeg",
            17: "burgundy-gold-wood-watch.jpeg",
            18: "white-black-bamboo-chronograph.jpeg",
            19: "black-red-wood-sport-watch.jpeg",
            20: "blue-dial-zebrawood-chronograph.jpeg",
            21: "black-gold-wood-dress-watch.jpeg",
            22: "black-gold-wood-compass-watch.jpeg",
            23: "bold-number-zebrawood-watch.jpeg",
            24: "rectangular-subdial-wood-watch.jpeg",
            25: "dark-wood-skeleton-look-watch.jpeg",
            26: "gold-black-wood-sport-watch.jpeg",
            27: "blue-black-wood-chronograph.jpeg",
            28: "multi-dial-brown-wood-watch.jpeg",
            29: "black-cream-dial-wood-watch.jpeg",
            30: "black-gold-luxury-wood-watch.jpeg",
            31: "white-multicolor-wood-watch.jpeg",
            32: "green-chronograph-wood-watch.jpeg",
            33: "navy-rugged-wood-watch.jpeg",
        },
    },
]


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
    background = ImageEnhance.Brightness(background).enhance(0.45)
    foreground = img.copy()
    foreground.thumbnail((int(size[0] * 0.92), int(size[1] * 0.92)), Image.Resampling.LANCZOS)
    x = (size[0] - foreground.width) // 2
    y = (size[1] - foreground.height) // 2
    background.paste(foreground, (x, y))
    return background


def enhance(img):
    img = ImageEnhance.Color(img).enhance(1.06)
    img = ImageEnhance.Contrast(img).enhance(1.05)
    return ImageEnhance.Sharpness(img).enhance(1.08)


def main():
    written = []
    for image_set in SETS:
        records = json.loads(image_set["records"].read_text(encoding="utf-8"))
        by_index = {int(record["idx"]): record for record in records}
        image_set["out"].mkdir(parents=True, exist_ok=True)
        for idx, filename in image_set["items"].items():
            source = Path(by_index[idx]["path"])
            destination = image_set["out"] / filename
            with Image.open(source) as original:
                img = ImageOps.exif_transpose(original).convert("RGB")
                img = enhance(img)
                if image_set["mode"] == "contain":
                    prepared = make_contained_square(img, (900, 900))
                else:
                    prepared = center_crop(img, (900, 900))
                prepared.save(destination, "JPEG", quality=86, optimize=True)
            written.append(str(destination))
    print(json.dumps({"written": written, "count": len(written)}, indent=2))


if __name__ == "__main__":
    main()
