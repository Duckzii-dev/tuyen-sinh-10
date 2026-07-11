import json
import os

DIEM_FILE = os.path.join("data", "diem.txt")
STUDENTS_FILE = os.path.join("data", "students.json")

def merge():
    print(f"Reading scores from {DIEM_FILE}...")
    scores = {}
    with open(DIEM_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split(",")
            if len(parts) < 5:
                print(f"Skipping invalid line: {line}")
                continue
            
            sbd = parts[0].strip()
            try:
                van = float(parts[1])
                toan = float(parts[2])
                anh = float(parts[3])
                chuyen = float(parts[4])
                # Calculate total score: Văn + Toán + Anh + Chuyên * 2
                tong = round(van + toan + anh + chuyen * 2, 2)
                
                scores[sbd] = {
                    "van": van,
                    "toan": toan,
                    "anh": anh,
                    "chuyen": chuyen,
                    "tong": tong
                }
            except ValueError as e:
                print(f"Error parsing scores on line '{line}': {e}")
                
    print(f"Loaded {len(scores)} student scores.")
    
    print(f"Reading students from {STUDENTS_FILE}...")
    if not os.path.exists(STUDENTS_FILE):
        print(f"Error: {STUDENTS_FILE} does not exist.")
        return
        
    with open(STUDENTS_FILE, "r", encoding="utf-8") as f:
        students = json.load(f)
        
    matched_count = 0
    for s in students:
        sbd = s.get("sbd", "").strip()
        if sbd in scores:
            score_data = scores[sbd]
            s["van"] = score_data["van"]
            s["toan"] = score_data["toan"]
            s["anh"] = score_data["anh"]
            s["chuyen"] = score_data["chuyen"]
            s["tong"] = score_data["tong"]
            matched_count += 1
        else:
            # Default empty score fields just in case
            s["van"] = None
            s["toan"] = None
            s["anh"] = None
            s["chuyen"] = None
            s["tong"] = None
            
    print(f"Successfully matched and merged {matched_count} out of {len(students)} students.")
    
    print(f"Saving merged data to {STUDENTS_FILE}...")
    with open(STUDENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(students, f, indent=4, ensure_ascii=False)
    print("Done!")

if __name__ == "__main__":
    merge()
