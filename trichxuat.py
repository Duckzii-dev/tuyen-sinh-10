import pdfplumber
import re

PDF_FILE = "Bang_ghi_diem_tam_thoi_mon_chuyen_BenTre.pdf"
OUTPUT_FILE = "diem.txt"

pattern = re.compile(
    r'^\d+\s+'                     # STT
    r'(\d+)\s+'                    # SBD
    r'.+?\s+'                      # Họ tên
    r'(?:Nam|Nữ)\s+'
    r'\d{2}/\d{2}/\d{4}\s+'
    r'.+?\s+'                      # Trường
    r'[\d.]+\s+T\s+'               # KQHT + KQRL
    r'([\d.]+)\s+'                 # Ngữ văn
    r'([\d.]+)\s+'                 # Toán
    r'([\d.]+)\s+'                 # Anh
    r'.+?\s+'                      # Môn chuyên
    r'([\d.]+)$'                   # Điểm chuyên
)

with pdfplumber.open(PDF_FILE) as pdf, open(OUTPUT_FILE, "w", encoding="utf-8") as out:

    for page in pdf.pages:
        text = page.extract_text()
        if not text:
            continue

        for line in text.split("\n"):
            line = " ".join(line.split())

            m = pattern.match(line)
            if m:
                sbd = m.group(1)
                van = m.group(2)
                toan = m.group(3)
                anh = m.group(4)
                chuyen = m.group(5)

                out.write(f"{sbd},{van},{toan},{anh},{chuyen}\n")

print("Đã lưu vào", OUTPUT_FILE)