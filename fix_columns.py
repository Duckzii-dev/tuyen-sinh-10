import re
import glob

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix multi-line <th>
    target_th = r"<th>Họ tên</th>\s*<th>Ngày sinh</th>"
    replacement_th = r"<th>Họ tên</th>\n                                <th>Giới tính</th>\n                                <th>Ngày sinh</th>\n                                <th>Huyện/TP</th>"
    content = re.sub(target_th, replacement_th, content)

    target_th2 = r"<th>Họ tên</th>\n(.*?)<th>Ngày sinh</th>"
    replacement_th2 = r"<th>Họ tên</th>\n\1<th>Giới tính</th>\n\1<th>Ngày sinh</th>\n\1<th>Huyện/TP</th>"
    content = re.sub(target_th2, replacement_th2, content)

    # In subject.js we also have inline th/td fixes needed
    if 'subject.js' in filepath:
        # replace <th>Họ tên</th><th>Ngày sinh</th>... inline if exists
        content = content.replace("<th>Họ tên</th><th>Ngày sinh</th><th>Trường</th><th>Phòng</th>", "<th>Họ tên</th><th>Giới tính</th><th>Ngày sinh</th><th>Huyện/TP</th><th>Trường</th><th>Phòng</th>")
        
        # fix the exports row array! (s.gender, s.district)
        content = content.replace("s.name, s.birthday, s.school", "s.name, s.gender, s.birthday, s.district, s.school")
        content = content.replace("Họ tên,Ngày sinh,Trường", "Họ tên,Giới tính,Ngày sinh,Huyện/TP,Trường")
        # fix modal details
        content = content.replace('<span class="modal-detail-label">Họ tên</span>\n            <span class="modal-detail-value">${student.name}</span>\n        </div>', '<span class="modal-detail-label">Họ tên</span>\n            <span class="modal-detail-value">${student.name}</span>\n        </div>\n        <div class="modal-detail-row">\n            <span class="modal-detail-label">Giới tính</span>\n            <span class="modal-detail-value">${student.gender}</span>\n        </div>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for f in ['js/app.js', 'js/router.js', 'js/subject.js', 'rankingg.html']:
    try:
        fix_file(f)
    except:
        pass

