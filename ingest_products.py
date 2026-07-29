import pandas as pd
import os
import random
import uuid
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL", "https://xaukltifywuxuewdulfl.supabase.co")
key = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdWtsdGlmeXd1eHVld2R1bGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjEyMDksImV4cCI6MjA5NzYzNzIwOX0.F3OLZeZuEuBl8AHV6pyc5Hx0j-wxObu1RwNQn3yCnxI")
supabase = create_client(url, key)

df = pd.read_excel(r'C:\Users\Noman Traders\Downloads\Rashid Store - List.xlsx')
products = []
for idx, row in df.iterrows():
    name = str(row.iloc[4]) if len(row) > 4 else "nan"
    if name != "nan" and isinstance(name, str) and len(name) > 3 and name != "Product Name":
        products.append(name.strip())

print(f"Found {len(products)} products in XLSX.")

inserted = 0
for name in products:
    sku = name[:3].upper() + "-" + str(random.randint(1000, 9999))
    barcode = "89" + str(random.randint(1000000000, 9999999999))
    price = random.choice([500, 800, 1200, 1500, 2500])
    stock = random.choice([50, 100, 200, 500])
    
    payload = {
        "id": str(uuid.uuid4()),
        "barcode": barcode,
        "sku": sku,
        "name": name,
        "price": price,
        "stock": stock
    }
    try:
        supabase.table("products").insert(payload).execute()
        inserted += 1
    except Exception as e:
        print("Failed to insert", name, e)

print(f"Successfully inserted {inserted} products.")
