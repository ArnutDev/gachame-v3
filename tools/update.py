import os
import re
import sys
import json
import time
import argparse
import requests
from datetime import datetime, timezone, timedelta
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Force stdout/stderr to use UTF-8 on Windows just in case
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# --- Helpers ---

def get_thailand_time():
    """Returns the current datetime in Thailand timezone (UTC+7)."""
    tz_th = timezone(timedelta(hours=7))
    return datetime.now(tz_th)

def get_previous_month(event_str):
    """Calculates the previous month YYYY-MM based on the given YYYY-MM event string."""
    try:
        year, month = map(int, event_str.split('-'))
        if month == 1:
            return f"{year - 1}-12"
        else:
            return f"{year}-{month - 1:02d}"
    except Exception as e:
        print(f"   [WARNING] Error parsing event month for previous month: {e}")
        return None

def download_image(url, folder_path, file_name):
    """Downloads an image from a URL and saves it to the specified folder."""
    if not os.path.exists(folder_path):
        os.makedirs(folder_path, exist_ok=True)
    
    save_path = os.path.join(folder_path, file_name)
    
    # If the file already exists, skip download
    if os.path.exists(save_path):
        print(f"   [INFO] Image already exists, skipping: {file_name}")
        return True

    try:
        response = requests.get(url, stream=True, timeout=15)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            print(f"   [DOWNLOAD] Downloaded: {file_name}")
            return True
        else:
            print(f"   [WARNING] Failed download: HTTP {response.status_code} for {file_name}")
            return False
    except Exception as e:
        print(f"   [WARNING] Failed to download {file_name}: {e}")
        return False

def parse_input_file(file_path):
    """Parses input files containing lines with [KEEP|TEMP]|Name."""
    items = []
    if not os.path.exists(file_path):
        print(f"   [WARNING] Input file not found: {file_path}")
        return items

    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line_str = line.strip()
            if not line_str or line_str.startswith('#'):
                continue
            
            status = "KEEP"  # Default status
            name = line_str
            if '|' in line_str:
                parts = line_str.split('|', 1)
                status = parts[0].strip().upper()
                name = parts[1].strip()
            
            items.append({"status": status, "raw_name": name})
    
    return items

def get_base_id(unit_code):
    """Extracts the base Ranger ID from a UnitCode.
    Example: u1617e-ka -> u1617
             u1617u-ka -> u1617
    """
    match = re.match(r"^(u\d+)[eu]-", unit_code)
    if match:
        return match.group(1)
    return None

def init_driver(headless=True):
    """Initializes the Selenium Chrome WebDriver."""
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
    
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=chrome_options
    )
    return driver

# --- Core Scrapers ---

def scrape_ranger_data(driver, rangers_to_scrape, image_folder):
    """Scrapes ranger details from rangers-book."""
    results = []
    NEW_DOMAIN = "https://gachame.github.io/images/rangers/"
    target_url = "https://rangers.lerico.net/en/rangers-book"

    print(f"[URL] Opening {target_url} to scrape Rangers...")
    driver.get(target_url)
    time.sleep(5)

    for item in rangers_to_scrape:
        raw_name = item["raw_name"]
        status = item["status"]
        
        # Determine if it's ultimate and extract star count
        is_ultimate = "Ultimate Evolved" in raw_name
        
        # Get star count (default 8)
        star_match = re.match(r"^(\d+)-Star", raw_name)
        star = int(star_match.group(1)) if star_match else 8

        # Extract search keyword
        keyword = raw_name.replace(f"{star}-Star ", "").replace("Ultimate Evolved ", "").strip()
        print(f"[SEARCH] Searching Ranger: {keyword} ({'Ultra' if is_ultimate else 'Normal'}, Status: {status})")

        try:
            # Wait for search box and clear/enter search term
            search_input = WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, "#tblRangerBook_filter input"))
            )
            search_input.clear()
            search_input.send_keys(keyword + Keys.ENTER)
            time.sleep(2)

            rows = driver.find_elements(By.CSS_SELECTOR, "#tblRangerBook tbody tr")
            found = False
            for row in rows:
                if "No matching records" in row.text:
                    break
                
                try:
                    link_el = row.find_element(By.CSS_SELECTOR, "td:nth-child(2) a")
                    if link_el.text.strip() == keyword:
                        img_src = row.find_element(By.TAG_NAME, "img").get_attribute("src")
                        file_name = img_src.split('/')[-1]
                        unit_code = link_el.get_attribute("href").split('/')[-1]

                        # Download the image
                        download_image(img_src, image_folder, file_name)

                        results.append({
                            "Name": keyword,
                            "Image": NEW_DOMAIN + file_name,
                            "UnitCode": unit_code,
                            "is_ultimate": is_ultimate,
                            "star": star,
                            "status": status
                        })
                        print(f"   [SUCCESS] Found Ranger: {keyword} -> Code: {unit_code}")
                        found = True
                        break
                except Exception as e:
                    print(f"   [WARNING] Row extraction failed for {keyword}: {e}")

            if not found:
                print(f"   [ERROR] Ranger not found in table: {keyword}")

        except Exception as e:
            print(f"   [ERROR] Error searching for Ranger {keyword}: {e}")

    return results

def scrape_gear_data(driver, gears_to_scrape, image_folder):
    """Scrapes gear details from equipments-book."""
    results = []
    NEW_DOMAIN = "https://gachame.github.io/images/gears/"
    target_url = "https://rangers.lerico.net/en/equipments-book"

    print(f"[URL] Opening {target_url} to scrape Gears...")
    driver.get(target_url)
    time.sleep(5)

    for item in gears_to_scrape:
        raw_name = item["raw_name"]
        status = item["status"]

        # Parse star count
        star_match = re.search(r"(\d+)-Star", raw_name)
        star = int(star_match.group(1)) if star_match else 7

        # Extract keyword (part after ']' or stripping prefix)
        if "]" in raw_name:
            keyword = raw_name.split("]")[-1].strip()
        else:
            keyword = raw_name.replace(f"{star}-Star Weapon ", "").replace(f"{star}-Star Armor ", "").replace(f"{star}-Star Accessory ", "").strip()

        print(f"[SEARCH] Searching Gear: {keyword} ({star}-Star, Status: {status})")

        try:
            search_input = WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, "#tblEquipmentsBook_filter input"))
            )
            search_input.clear()
            search_input.send_keys(keyword + Keys.ENTER)
            time.sleep(2)

            rows = driver.find_elements(By.CSS_SELECTOR, "#tblEquipmentsBook tbody tr")
            found = False
            for row in rows:
                if "No matching records" in row.text:
                    break
                
                try:
                    name_el = row.find_element(By.CSS_SELECTOR, "td:nth-child(2) a")
                    if keyword in name_el.text.strip():
                        img_src = row.find_element(By.CSS_SELECTOR, "td.col-icon img").get_attribute("src")
                        file_name = img_src.split('/')[-1]
                        item_code = file_name.replace("_icon.png", "").replace(".png", "")

                        # Download the image
                        download_image(img_src, image_folder, file_name)

                        results.append({
                            "Name": keyword,
                            "Image": NEW_DOMAIN + file_name,
                            "ItemCode": item_code,
                            "star": star,
                            "status": status
                        })
                        print(f"   [SUCCESS] Found Gear: {keyword} -> Code: {item_code}")
                        found = True
                        break
                except Exception as e:
                    print(f"   [WARNING] Row extraction failed for {keyword}: {e}")

            if not found:
                print(f"   [ERROR] Gear not found in table: {keyword}")

        except Exception as e:
            print(f"   [ERROR] Error searching for Gear {keyword}: {e}")

    return results

# --- File Exporters ---

def save_event_rangers(rangers, event_str, project_root):
    """Saves rangers data to src/data/events/YYYY-MM/rangers/*.json files."""
    if not rangers:
        print("[INFO] No rangers to save.")
        return

    # Group by star rating
    grouped = {}
    for r in rangers:
        star = r["star"]
        is_ultimate = r["is_ultimate"]
        key = (star, "ultra" if is_ultimate else "normal")
        if key not in grouped:
            grouped[key] = []
        
        # Prepare object for event JSON (matches UI schema: Name, Image, UnitCode)
        grouped[key].append({
            "Name": r["Name"],
            "Image": r["Image"],
            "UnitCode": r["UnitCode"]
        })

    for (star, form), items in grouped.items():
        folder_path = os.path.join(project_root, "src", "data", "events", event_str, "rangers")
        os.makedirs(folder_path, exist_ok=True)
        file_name = f"{star}-{form}.json"
        file_path = os.path.join(folder_path, file_name)

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"[SAVE] Saved Event Rangers: {file_path} ({len(items)} items)")

def save_event_gears(gears, event_str, project_root):
    """Saves gears data to src/data/events/YYYY-MM/gears/*.json files."""
    if not gears:
        print("[INFO] No gears to save.")
        return

    # Group by star rating
    grouped = {}
    for g in gears:
        star = g["star"]
        if star not in grouped:
            grouped[star] = []
        
        # Prepare object for event JSON
        grouped[star].append({
            "Name": g["Name"],
            "Image": g["Image"],
            "ItemCode": g["ItemCode"]
        })

    for star, items in grouped.items():
        folder_path = os.path.join(project_root, "src", "data", "events", event_str, "gears")
        os.makedirs(folder_path, exist_ok=True)
        file_name = f"{star}.json"
        file_path = os.path.join(folder_path, file_name)

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"[SAVE] Saved Event Gears: {file_path} ({len(items)} items)")

# --- Base Database & Changelog Updates ---

def update_base_database(event_str, project_root):
    """Updates the permanent base database if the current month is EVEN (means odd month has ended).
    It looks back at the previous (odd) month and copies rangers that have BOTH normal and ultra forms
    into the base rangers database.
    """
    try:
        _, month = map(int, event_str.split('-'))
    except Exception as e:
        print(f"[ERROR] Error parsing event month: {e}")
        return

    if month % 2 != 0:
        print(f"[INFO] Current event month ({event_str}) is ODD. Skip copying previous month's rangers to base database.")
        return

    # Current month is even. Find previous month (odd month)
    prev_event = get_previous_month(event_str)
    if not prev_event:
        return

    print(f"[SYNC] Current month is EVEN ({event_str}). Processing previous ODD month ({prev_event}) rangers to base database...")

    prev_rangers_dir = os.path.join(project_root, "src", "data", "events", prev_event, "rangers")
    if not os.path.exists(prev_rangers_dir):
        print(f"[WARNING] Previous month event rangers directory not found: {prev_rangers_dir}. Skipping base database update.")
        return

    # Scan for any star ratings (usually 8-star)
    # Load normal and ultra files
    normal_files = [f for f in os.listdir(prev_rangers_dir) if f.endswith("-normal.json")]
    for norm_file in normal_files:
        star_prefix = norm_file.split('-')[0]
        ult_file = f"{star_prefix}-ultra.json"
        
        norm_path = os.path.join(prev_rangers_dir, norm_file)
        ult_path = os.path.join(prev_rangers_dir, ult_file)

        if not os.path.exists(ult_path):
            print(f"[INFO] No matching ultra file for {norm_file}. Skipping base update for star {star_prefix}.")
            continue

        print(f"   [ANALYZING] Analyzing star {star_prefix} normal/ultra rangers from {prev_event}...")
        try:
            with open(norm_path, 'r', encoding='utf-8') as f:
                norm_data = json.load(f)
            with open(ult_path, 'r', encoding='utf-8') as f:
                ult_data = json.load(f)
        except Exception as e:
            print(f"   [ERROR] Error loading previous month ranger files: {e}")
            continue

        # Extract base IDs
        norm_by_base = {}
        for item in norm_data:
            base_id = get_base_id(item["UnitCode"])
            if base_id:
                norm_by_base[base_id] = item

        ult_by_base = {}
        for item in ult_data:
            base_id = get_base_id(item["UnitCode"])
            if base_id:
                ult_by_base[base_id] = item

        # Match base IDs that are present in both
        keep_ids = set(norm_by_base.keys()).intersection(set(ult_by_base.keys()))
        print(f"   [MATCH] Found {len(keep_ids)} rangers with both Normal and Ultra forms: {list(keep_ids)}")

        # Add to base database
        base_norm_items = [norm_by_base[bid] for bid in keep_ids]
        base_ult_items = [ult_by_base[bid] for bid in keep_ids]

        base_norm_path = os.path.join(project_root, "src", "data", "rangers", f"{star_prefix}-normal.json")
        base_ult_path = os.path.join(project_root, "src", "data", "rangers", f"{star_prefix}-ultra.json")

        append_to_base_json(base_norm_path, base_norm_items)
        append_to_base_json(base_ult_path, base_ult_items)

def append_to_base_json(file_path, new_items):
    """Appends items to a base JSON database checking for duplicate UnitCodes."""
    if not new_items:
        return

    base_items = []
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                base_items = json.load(f)
        except Exception as e:
            print(f"   [WARNING] Error reading base database {file_path}: {e}")

    existing_codes = {item["UnitCode"] for item in base_items}
    added_count = 0

    for item in new_items:
        if item["UnitCode"] not in existing_codes:
            base_items.append(item)
            added_count += 1
            print(f"   [ADD] Appended to base database: {item['Name']} ({item['UnitCode']})")

    if added_count > 0:
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(base_items, f, ensure_ascii=False, indent=2)
        print(f"   [SAVE] Saved updates to {file_path} ({added_count} items added)")
    else:
        print(f"   [INFO] All items already exist in {os.path.basename(file_path)}. No updates written.")

def update_changelog(event_str, project_root):
    """Appends a new changelog entry to src/data/updates.json with Thai date and version bump."""
    updates_path = os.path.join(project_root, "src", "data", "updates.json")
    if not os.path.exists(updates_path):
        print(f"[WARNING] Updates file not found at: {updates_path}. Skipping changelog update.")
        return

    print("[LOG] Updating changelog in updates.json...")
    try:
        with open(updates_path, 'r', encoding='utf-8') as f:
            updates = json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to parse updates.json: {e}")
        return

    # Bump version
    last_ver = "3.0.0"
    if updates:
        last_ver = updates[-1].get("version", "3.0.0")

    # Match standard major.minor.patch
    ver_match = re.match(r"^v?(\d+)\.(\d+)\.(\d+)", last_ver)
    if ver_match:
        major = int(ver_match.group(1))
        minor = int(ver_match.group(2))
        # Increments minor version and resets patch to 0
        new_ver = f"{major}.{minor + 1}.0"
    else:
        new_ver = "3.1.0"

    # Get Thai date format
    th_now = get_thailand_time()
    date_str = th_now.strftime("%d-%m-%Y")

    # Get Month Name
    month_names = {
        1: "January", 2: "February", 3: "March", 4: "April",
        5: "May", 6: "June", 7: "July", 8: "August",
        9: "September", 10: "October", 11: "November", 12: "December"
    }
    
    try:
        _, month = map(int, event_str.split('-'))
    except:
        month = th_now.month

    month_name = month_names.get(month, "Event Month")
    change_msg = f"Add new content for {month_name}."

    # Avoid duplicate changes
    if updates and updates[-1].get("version") == new_ver:
        print(f"   [INFO] Version {new_ver} already exists in changelog. Skipping.")
        return

    new_entry = {
        "version": new_ver,
        "date": date_str,
        "changes": [change_msg]
    }
    updates.append(new_entry)

    with open(updates_path, 'w', encoding='utf-8') as f:
        json.dump(updates, f, ensure_ascii=False, indent=2)
    print(f"   [SUCCESS] Added version {new_ver} to updates.json with changes: ['{change_msg}']")

# --- Main Flow ---

def main():
    parser = argparse.ArgumentParser(description="GachaMe Auto Update Script")
    parser.add_argument("--event", type=str, help="Event month in YYYY-MM format (e.g. 2026-08). Defaults to current Thailand time.")
    parser.add_argument("--gui", action="store_true", help="Run Chrome with GUI (non-headless mode).")
    parser.add_argument("--skip-scrape", action="store_true", help="Skip the scraping step. Runs only JSON and base database updates.")
    parser.add_argument("--rangers-input", type=str, help="Custom path to rangers input file. Defaults to tools/inputs/rangers.txt")
    parser.add_argument("--gears-input", type=str, help="Custom path to gears input file. Defaults to tools/inputs/gears.txt (or gear.txt)")
    
    args = parser.parse_args()

    # Determine paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    # Calculate default event
    th_now = get_thailand_time()
    event_str = args.event if args.event else th_now.strftime("%Y-%m")
    
    print(f"[START] Starting Auto Update System")
    print(f"[DATE] Target Event Month: {event_str}")
    print(f"[ROOT] Project Root: {project_root}")

    # Set input paths
    rangers_in_path = args.rangers_input if args.rangers_input else os.path.join(script_dir, "inputs", "rangers.txt")
    
    if args.gears_input:
        gears_in_path = args.gears_input
    else:
        # Fallback to gear.txt if gears.txt doesn't exist
        gears_in_path = os.path.join(script_dir, "inputs", "gears.txt")
        if not os.path.exists(gears_in_path):
            gears_in_path = os.path.join(script_dir, "inputs", "gear.txt")

    # Set output image folders
    ranger_img_folder = os.path.join(script_dir, "images", "rangers")
    gear_img_folder = os.path.join(script_dir, "images", "gears")

    if not args.skip_scrape:
        print("[READ] Reading input files...")
        rangers_to_scrape = parse_input_file(rangers_in_path)
        gears_to_scrape = parse_input_file(gears_in_path)

        print(f"   [INFO] Rangers to scrape: {len(rangers_to_scrape)}")
        print(f"   [INFO] Gears to scrape: {len(gears_to_scrape)}")

        if rangers_to_scrape or gears_to_scrape:
            # Initialize selenium driver
            driver = init_driver(headless=not args.gui)
            
            try:
                # 1. Scrape and save Rangers
                if rangers_to_scrape:
                    scraped_rangers = scrape_ranger_data(driver, rangers_to_scrape, ranger_img_folder)
                    save_event_rangers(scraped_rangers, event_str, project_root)

                # 2. Scrape and save Gears
                if gears_to_scrape:
                    scraped_gears = scrape_gear_data(driver, gears_to_scrape, gear_img_folder)
                    save_event_gears(scraped_gears, event_str, project_root)
            
            finally:
                driver.quit()
                print("[CLOSE] Browser driver closed.")
        else:
            print("[INFO] Input files are empty. Nothing to scrape.")
    else:
        print("[SKIP] Skipping scraping step.")

    # 3. Handle base database updates (Move previous month's rangers into base if current month is even)
    update_base_database(event_str, project_root)

    # 4. Update the updates.json changelog
    update_changelog(event_str, project_root)

    print("[FINISHED] Auto Update execution completed successfully.")

if __name__ == "__main__":
    main()