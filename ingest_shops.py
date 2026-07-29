import pdfplumber
import os
import uuid
import random
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL", "https://xaukltifywuxuewdulfl.supabase.co")
key = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdWtsdGlmeXd1eHVld2R1bGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjEyMDksImV4cCI6MjA5NzYzNzIwOX0.F3OLZeZuEuBl8AHV6pyc5Hx0j-wxObu1RwNQn3yCnxI")
supabase = create_client(url, key)

# Try signing in or signing up
try:
    supabase.auth.sign_up({"email": "testagent1@example.com", "password": "password123"})
except Exception as e:
    pass
try:
    supabase.auth.sign_in_with_password({"email": "testagent1@example.com", "password": "password123"})
except Exception as e:
    print("Sign in failed:", e)

shops = []

with pdfplumber.open(r'C:\Users\Noman Traders\Downloads\Shops List.pdf') as pdf:
    for page in pdf.pages:
        table = page.extract_table()
        if table:
            for row in table:
                for cell in row:
                    if cell and cell.strip() and cell.strip() not in ["Saturday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "N/A"]:
                        if "SHAHEEN TRADERS" in cell or "Order Booker" in cell:
                            continue
                        shop_name = cell.replace('\n', ' ').strip()
                        if len(shop_name) > 3:
                            shops.append(shop_name)
        else:
            lines = page.extract_text().split('\n')
            for line in lines:
                import re
                parts = re.split(r'\s{2,}', line)
                for p in parts:
                    p = p.strip()
                    if p and p not in ["Saturday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "N/A"]:
                        if "SHAHEEN TRADERS" not in p and "Order Booker" not in p and "/" not in p and "Water Pump" not in p:
                            shops.append(p)

shops = list(set(shops))
print(f"Found {len(shops)} shops.")

inserted = 0
for shop_name in shops:
    payload = {
        "id": str(uuid.uuid4()),
        "name": shop_name,
        "owner_name": "Owner " + shop_name.split()[0],
        "contact_number": "0300" + str(random.randint(1000000, 9999999)),
        "address": shop_name + " Area, Karachi"
    }
    try:
        supabase.table("shops").insert(payload).execute()
        inserted += 1
    except Exception as e:
        print("Failed to insert", shop_name, e)

print(f"Successfully inserted {inserted} shops.")
