import re

with open('js/subject.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix exports row mapping
content = content.replace('<td>${s.stt}</td><td>${s.subject}</td><td>${s.sbd}</td><td>${s.name}</td><td>${s.birthday}</td><td>${s.school}</td><td>${s.room}</td>', '<td>${s.stt}</td><td>${s.subject}</td><td>${s.sbd}</td><td>${s.name}</td><td>${s.gender}</td><td>${s.birthday}</td><td>${s.district}</td><td>${s.school}</td><td>${s.room}</td>')

# Fix table generation
content = content.replace('<td>${s.name}</td>\n                            <td>${s.birthday}</td>\n                            <td>${s.school}</td>', '<td>${s.name}</td>\n                            <td>${s.gender}</td>\n                            <td>${s.birthday}</td>\n                            <td>${s.district}</td>\n                            <td>${s.school}</td>')

with open('js/subject.js', 'w', encoding='utf-8') as f:
    f.write(content)
