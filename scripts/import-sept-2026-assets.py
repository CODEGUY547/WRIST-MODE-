import json
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
RECORDS_FILE = ROOT / "incoming" / "sept-2026-assets" / "contact-sheets" / "image-records.json"
DB_FILE = ROOT / "data" / "wrist-mode.sqlite"
WATCH_ASSET_DIR = ROOT / "public" / "assets" / "products" / "watches" / "sept-2026"
JEWELRY_ASSET_DIR = ROOT / "public" / "assets" / "products" / "custom-jewelry" / "sept-2026"
MAX_IMAGE_EDGE = 1400
JPEG_QUALITY = 86


WATCH_PRODUCTS = [
    {
        "brand": "Tissot",
        "name": "Black Chronograph Bracelet Watch",
        "indices": [1],
        "description": "Black Tissot chronograph bracelet watch. Contact Wrist Mode to confirm current price and availability.",
        "specs": {
            "collection": "New September Watches",
            "caseSize": "Standard fit",
            "strapMaterial": "Bracelet",
            "movementType": "Quartz",
            "style": "Chronograph",
        },
        "featured": True,
    },
    {
        "brand": "Cartier",
        "name": "Chronograph Bracelet Watch Collection",
        "indices": [2, 4, 5],
        "description": "Cartier chronograph bracelet watch options in light and dark dial styles. Contact Wrist Mode to confirm current price and availability.",
        "specs": {
            "collection": "New September Watches",
            "caseSize": "Standard fit",
            "strapMaterial": "Bracelet",
            "movementType": "Quartz",
            "style": "Luxury chronograph",
            "colorOptions": "Light, blue, and black dial looks",
        },
        "featured": True,
    },
    {
        "brand": "Montblanc",
        "name": "White Chronograph Bracelet Watch",
        "indices": [3],
        "description": "Montblanc white chronograph bracelet watch. Contact Wrist Mode to confirm current price and availability.",
        "specs": {
            "collection": "New September Watches",
            "caseSize": "Standard fit",
            "strapMaterial": "Bracelet",
            "movementType": "Quartz",
            "style": "Chronograph",
        },
        "featured": True,
    },
    {
        "brand": "Rick",
        "name": "Silver Date Bracelet Watch",
        "indices": [6],
        "description": "Rick silver bracelet watch with a clean date-window dial. Contact Wrist Mode to confirm current price and availability.",
        "specs": {
            "collection": "New September Watches",
            "caseSize": "Standard fit",
            "strapMaterial": "Bracelet",
            "movementType": "Quartz",
            "style": "Dress",
        },
    },
    {
        "brand": "Wrist Mode Luxury",
        "name": "Mixed Bracelet Chronograph Collection",
        "indices": [7, 8, 9, 10, 11, 12, 13],
        "description": "Luxury-style bracelet chronograph watches grouped as mixed options where the exact dial brand is not clear in the photo. Contact Wrist Mode to confirm current price and availability.",
        "specs": {
            "collection": "New September Watches",
            "caseSize": "Standard fit",
            "strapMaterial": "Bracelet",
            "movementType": "Quartz",
            "style": "Luxury chronograph",
            "colorOptions": "Gold, rose, silver, black, and blue looks",
        },
    },
    {
        "brand": "Wrist Mode Sport",
        "name": "Leather Strap Chronograph Collection",
        "indices": [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
        "description": "Leather and rubber strap chronograph watch options grouped together for customers to browse different colors and dial looks. Contact Wrist Mode to confirm current price and availability.",
        "specs": {
            "collection": "New September Watches",
            "caseSize": "Standard fit",
            "strapMaterial": "Leather or rubber",
            "movementType": "Quartz",
            "style": "Sport chronograph",
            "colorOptions": "Black, brown, blue, white, green, and red accents",
        },
        "featured": True,
    },
    {
        "brand": "Naviforce",
        "name": "Sport Watch Collection",
        "indices": [32, 33, 34, 35, 36, 37, 38, 42, 45, 46, 47, 48],
        "description": "Naviforce sport watches with bold digital, chronograph, bracelet, and strap designs. Contact Wrist Mode to confirm current price and availability.",
        "specs": {
            "collection": "New September Watches",
            "caseSize": "Standard fit",
            "strapMaterial": "Bracelet, rubber, or leather",
            "movementType": "Quartz and digital",
            "style": "Sport",
            "colorOptions": "Blue, black, green, gold, and steel looks",
        },
        "featured": True,
    },
    {
        "brand": "Gattonka",
        "name": "Dual Display Sport Watch Collection",
        "indices": [39, 40],
        "description": "Gattonka dual-display sport watch options with leather strap looks. Contact Wrist Mode to confirm current price and availability.",
        "specs": {
            "collection": "New September Watches",
            "caseSize": "Standard fit",
            "strapMaterial": "Leather",
            "movementType": "Dual display",
            "style": "Sport",
        },
    },
    {
        "brand": "Wrist Mode Sport",
        "name": "Digital Sport Watch Extras",
        "indices": [41, 43, 44],
        "description": "Extra sport and digital-style watch photos from the September stock batch where the brand label is not readable enough to classify. Contact Wrist Mode to confirm current price and availability.",
        "specs": {
            "collection": "New September Watches",
            "caseSize": "Standard fit",
            "strapMaterial": "Mixed",
            "movementType": "Dual display",
            "style": "Sport",
            "colorOptions": "Gold mesh, black, and blue sport looks",
        },
    },
]


JEWELRY_PRODUCTS = [
    {
        "brand": "Wrist Mode Custom",
        "name": "Engraved Bracelet and Name Plate Sets",
        "indices": [49, 50, 51, 54, 56, 57, 59, 60, 62, 63, 66, 69, 70, 77, 81, 82],
        "description": "Custom bracelet and name plate sets for names, dates, initials, scripture, and short messages. Contact Wrist Mode to confirm current price and availability.",
        "specs": {
            "collection": "Custom Jewelry",
            "piece": "Bracelets",
            "finish": "Black, silver, gold, and two tone",
            "customOptions": "Names, messages, dates, and scripture",
            "colorOptions": "16 bracelet photos",
        },
        "featured": True,
    },
    {
        "brand": "Wrist Mode Custom",
        "name": "Personalized Bar Necklace and Pendant Collection",
        "indices": [52, 53, 55, 58, 61, 65, 67, 71, 73, 75, 76, 78, 79, 80, 83],
        "description": "Bar necklaces and pendant styles that can be worn plain or customized with names, initials, dates, or a message. Contact Wrist Mode to confirm current price and availability.",
        "specs": {
            "collection": "Custom Jewelry",
            "piece": "Bar necklaces and pendants",
            "finish": "Gold, silver, black, and mixed finish",
            "customOptions": "Plain, name, initials, date, or short message",
            "colorOptions": "15 necklace photos",
        },
        "featured": True,
    },
    {
        "brand": "Wrist Mode Custom",
        "name": "Couple Broken Heart Pendant Sets",
        "indices": [64, 68, 72, 74],
        "description": "Matching couple pendant sets with broken-heart styling for names, initials, and meaningful dates. Contact Wrist Mode to confirm current price and availability.",
        "specs": {
            "collection": "Custom Jewelry",
            "piece": "Couple pendants",
            "finish": "Black, silver, and gold accents",
            "customOptions": "Names, dates, initials, or short dedication",
            "colorOptions": "4 couple pendant photos",
        },
        "featured": True,
    },
]


def slug(value):
    cleaned = []
    previous_dash = False
    for char in str(value).lower():
        if char.isalnum():
            cleaned.append(char)
            previous_dash = False
        elif not previous_dash:
            cleaned.append("-")
            previous_dash = True
    return "".join(cleaned).strip("-") or "item"


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def load_records():
    if not RECORDS_FILE.exists():
        raise FileNotFoundError(f"Image records were not found: {RECORDS_FILE}")
    records = json.loads(RECORDS_FILE.read_text(encoding="utf-8"))
    return {int(record["index"]): Path(record["path"]) for record in records}


def optimize_image(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((MAX_IMAGE_EDGE, MAX_IMAGE_EDGE), Image.Resampling.LANCZOS)
        image.save(destination, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)


def prepare_images(records, product, asset_dir, sequence):
    image_paths = []
    for position, index in enumerate(product["indices"], start=1):
        source = records.get(index)
        if not source or not source.exists():
            raise FileNotFoundError(f"Missing source image for index {index}: {source}")
        filename = f"{sequence:02d}-{slug(product['brand'])}-{slug(product['name'])}-{position:02d}.jpeg"
        destination = asset_dir / filename
        optimize_image(source, destination)
        public_path = "/" + destination.relative_to(ROOT / "public").as_posix()
        image_paths.append(public_path)
    return image_paths


def backup_database():
    if not DB_FILE.exists():
        raise FileNotFoundError(f"Database was not found: {DB_FILE}")
    backup = DB_FILE.with_suffix(f".sqlite.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    shutil.copy2(DB_FILE, backup)
    return backup


def upsert_product(connection, product):
    timestamp = now_iso()
    existing = connection.execute(
        "SELECT id, price, quantity FROM products WHERE category = ? AND brand = ? AND name = ?",
        (product["category"], product["brand"], product["name"]),
    ).fetchone()

    specs_json = json.dumps(product["specs"], ensure_ascii=True)
    images_json = json.dumps(product["images"], ensure_ascii=True)

    if existing:
        product_id, current_price, current_quantity = existing
        price = current_price if current_price and current_price > 0 else product.get("price", 0)
        quantity = current_quantity if current_quantity is not None else product.get("quantity", 5)
        connection.execute(
            """
            UPDATE products
               SET price = ?,
                   quantity = ?,
                   description = ?,
                   specs = ?,
                   images = ?,
                   featured = ?,
                   updated_at = ?
             WHERE id = ?
            """,
            (
                price,
                quantity,
                product["description"],
                specs_json,
                images_json,
                1 if product.get("featured") else 0,
                timestamp,
                product_id,
            ),
        )
        return "updated"

    connection.execute(
        """
        INSERT INTO products
          (category, brand, name, price, quantity, description, specs, images, featured, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            product["category"],
            product["brand"],
            product["name"],
            product.get("price", 0),
            product.get("quantity", 5),
            product["description"],
            specs_json,
            images_json,
            1 if product.get("featured") else 0,
            timestamp,
            timestamp,
        ),
    )
    return "created"


def build_products(records):
    products = []
    for sequence, product in enumerate(WATCH_PRODUCTS, start=1):
        products.append(
            {
                **product,
                "category": "watch",
                "price": 0,
                "quantity": 5,
                "images": prepare_images(records, product, WATCH_ASSET_DIR, sequence),
            }
        )

    for sequence, product in enumerate(JEWELRY_PRODUCTS, start=1):
        products.append(
            {
                **product,
                "category": "jewelry",
                "price": 0,
                "quantity": 5,
                "images": prepare_images(records, product, JEWELRY_ASSET_DIR, sequence),
            }
        )

    return products


def main():
    records = load_records()
    backup = backup_database()
    products = build_products(records)

    created = 0
    updated = 0
    with sqlite3.connect(DB_FILE) as connection:
        for product in products:
            action = upsert_product(connection, product)
            if action == "created":
                created += 1
            else:
                updated += 1
        connection.commit()

    watch_count = sum(1 for product in products if product["category"] == "watch")
    jewelry_count = sum(1 for product in products if product["category"] == "jewelry")
    image_count = sum(len(product["images"]) for product in products)

    print(f"Database backup: {backup}")
    print(f"Created {created} products and updated {updated} products.")
    print(f"Imported {watch_count} grouped watch products and {jewelry_count} grouped jewelry products.")
    print(f"Prepared {image_count} optimized image files.")


if __name__ == "__main__":
    main()
