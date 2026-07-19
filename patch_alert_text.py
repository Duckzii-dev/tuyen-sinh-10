import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = r"Hệ thống này được phát triển độc lập nhằm mục đích <strong>tra cứu và phân tích thống kê tham khảo</strong>.<br>\s*Đây <strong>không</strong> phải là cổng thông tin chính thức của Sở Giáo dục & Đào tạo."

replacement = r"Trang này chỉ mang mục đích tham khảo<br>\n                không phải trang chính thống"

content = re.sub(target, replacement, content)

target2 = r"Xây dựng và phát triển bởi:<br>\s*<strong style=\"color: #3b82f6; font-size: 1.15rem; display: inline-block; margin-top: 8px;\">Đức Duy - Chuyên Tin K35<\/strong>"
replacement2 = r"được thực hiện bởi:<br>\n                    <strong style=\"color: #3b82f6; font-size: 1.15rem; display: inline-block; margin-top: 8px;\">Duy - tin K35<\/strong>"

content = re.sub(target2, replacement2, content)
content = content.replace("showModal('Lưu ý quan trọng'", "showModal('Thông báo'")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
