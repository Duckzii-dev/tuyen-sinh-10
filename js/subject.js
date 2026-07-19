/**
 * Subject Module
 * Handles rendering the subject list cards and the dynamic subject detail dashboards.
 */

import { getStudents } from './data.js';
import { getSubjectDetailStats, getCompetitionStats, getCompetitiveness, getSubjectName, getSubjectQuota } from './stats.js';
import { renderBarChart, renderHorizontalBarChart, setupChartDownload } from './charts.js';
import { showModal, showToast } from './ui.js';

/**
 * Render the /subjects page (list of cards for each subject)
 */
export function initSubjectListPage() {
    const students = getStudents();
    const statsList = getCompetitionStats(students);
    const container = document.getElementById('content');
    if (!container) return;

    let html = `
        <div class="fade-in">
            <h1 class="page-title">Danh sách môn thi chuyên</h1>
            <p class="page-subtitle">Thống kê chỉ tiêu tuyển sinh và số lượng đăng ký cho từng môn.</p>

            <div class="subject-cards-grid mt-4">
    `;

    statsList.forEach(item => {
        const quota = item.quota;
        const ratio = item.ratio;

        html += `
            <a href="/subjects/${item.code}" class="subject-card">
                <div class="subject-card-header">
                    <span class="subject-card-name">${item.name}</span>
                    <span class="subject-card-code">${item.code}</span>
                </div>
                <div class="subject-card-stats">
                    <div>
                        <div class="subject-card-stat-value">${item.count}</div>
                        <div class="text-muted" style="font-size: 11px;">Thí sinh</div>
                    </div>
                    <div>
                        <div class="subject-card-stat-value">${quota}</div>
                        <div class="text-muted" style="font-size: 11px;">Chỉ tiêu</div>
                    </div>
                    <div>
                        <div class="subject-card-stat-value">${ratio} : 1</div>
                        <div class="text-muted" style="font-size: 11px;">Tỉ lệ chọi</div>
                    </div>
                </div>
                <div class="subject-card-footer">
                    <span class="badge ${item.competitiveness.class}">${item.competitiveness.label}</span>
                    <span class="subject-card-link">Xem chi tiết <i class="fas fa-arrow-right"></i></span>
                </div>
            </a>
        `;
    });

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Render the dynamic subject detail page
 */
export function initSubjectDetailPage(code) {
    const students = getStudents();
    const stats = getSubjectDetailStats(students, code);
    const container = document.getElementById('content');
    if (!container) return;

    // Define color variable or accent class depending on competitiveness
    const accentColor = stats.competitiveness.class === 'badge-danger' ? 'var(--danger)' :
        (stats.competitiveness.class === 'badge-warning' ? 'var(--warning)' : 'var(--accent-primary)');

    let html = `
        <div class="fade-in" style="--card-accent: ${accentColor}">
            <!-- Hero Section -->
            <div class="hero-section">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                        <h1 class="hero-title">${stats.name}</h1>
                        <div class="hero-code">Mã chuyên: ${stats.code}</div>
                    </div>
                    <span class="badge ${stats.competitiveness.class} fs-6 py-2 px-3">${stats.competitiveness.label}</span>
                </div>
                <div class="hero-stats mt-4">
                    <div class="hero-stat-item">
                        <div class="hero-stat-value">${stats.total}</div>
                        <div class="hero-stat-label">Thí sinh</div>
                    </div>
                    <div class="hero-stat-item">
                        <div class="hero-stat-value">${stats.classes.toFixed(1)}</div>
                        <div class="hero-stat-label">Số lớp (dự kiến)</div>
                    </div>
                    <div class="hero-stat-item">
                        <div class="hero-stat-value">${stats.quota}</div>
                        <div class="hero-stat-label">Chỉ tiêu</div>
                    </div>
                    <div class="hero-stat-item" style="border-right: none;">
                        <div class="hero-stat-value text-primary">${stats.ratio} : 1</div>
                        <div class="hero-stat-label">Tỷ lệ chọi</div>
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-icon" style="background: var(--accent-muted); color: var(--accent-primary)">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-card-label">Tổng thí sinh môn ${stats.name}</div>
                    <div class="stat-card-value">${stats.total}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon" style="background: var(--success-muted); color: var(--success)">
                        <i class="fas fa-bullseye"></i>
                    </div>
                    <div class="stat-card-label">Chỉ tiêu tuyển sinh</div>
                    <div class="stat-card-value">${stats.quota}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon" style="background: var(--warning-muted); color: var(--warning)">
                        <i class="fas fa-calculator"></i>
                    </div>
                    <div class="stat-card-label">Tỷ lệ chọi</div>
                    <div class="stat-card-value">${stats.ratio}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon" style="background: var(--info-muted); color: var(--info)">
                        <i class="fas fa-door-open"></i>
                    </div>
                    <div class="stat-card-label">Số phòng thi môn ${stats.name}</div>
                    <div class="stat-card-value">${stats.roomsCount}</div>
                </div>
            </div>

            <!-- Charts Grid -->
            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <span class="chart-title">Phân bố thí sinh theo phòng thi</span>
                        <button class="chart-download" id="dl-room-chart" title="Tải biểu đồ PNG"><i class="fas fa-download"></i></button>
                    </div>
                    <div class="chart-container">
                        <canvas id="subject-room-chart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <div class="chart-header">
                        <span class="chart-title">Phân bố học sinh theo trường (Top 10)</span>
                        <button class="chart-download" id="dl-school-chart" title="Tải biểu đồ PNG"><i class="fas fa-download"></i></button>
                    </div>
                    <div class="chart-container">
                        <canvas id="subject-school-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- School & Room Splits -->
            <div class="two-col mb-4">
                <div class="data-panel">
                    <h3 class="section-title mb-3">Top trường đông thí sinh nhất</h3>
                    <ul class="top-list">
                        ${stats.topSchools.slice(0, 10).map((s, idx) => `
                            <li class="top-list-item">
                                <span class="top-list-rank">${idx + 1}</span>
                                <span class="top-list-name">${s.name}</span>
                                <span class="top-list-value">${s.count} HS</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="data-panel">
                    <h3 class="section-title mb-3">Phân bố phòng thi (${stats.roomsCount} phòng)</h3>
                    <div class="room-grid" style="max-height: 380px; overflow-y: auto; padding-right: 8px;">
                        ${stats.roomsBreakdown.map(r => `
                            <div class="room-card" data-room-name="${r.name}">
                                <div class="room-card-name">${r.name}</div>
                                <div class="room-card-count">${r.count} học sinh</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Students List -->
            <div class="data-panel mt-4">
                <h3 class="section-title mb-3">Danh sách thí sinh môn ${stats.name}</h3>
                
                <div class="export-bar">
                    <button id="subj-export-csv" class="btn-secondary"><i class="fas fa-file-csv text-success"></i> Xuất CSV</button>
                    <button id="subj-export-excel" class="btn-secondary"><i class="fas fa-file-excel text-success"></i> Xuất Excel</button>
                    <button id="subj-export-print" class="btn-secondary"><i class="fas fa-print text-primary"></i> In danh sách</button>
                </div>

                <div class="table-responsive">
                    <table id="subject-students-table" class="table table-striped table-hover" style="width:100%">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>SBD</th>
                                <th>Họ tên</th>
                                <th>Giới tính</th>
                                <th>Ngày sinh</th>
                                <th>Huyện/TP</th>
                                <th>Trường</th>
                                <th>Phòng</th>
                                <th>Văn</th>
                                <th>Toán</th>
                                <th>Anh</th>
                                <th>Chuyên</th>
                                <th>Tổng</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
    // Render Charts
    const roomLabels = stats.roomsBreakdown.map(r => r.name);
    const roomData = stats.roomsBreakdown.map(r => r.count);
    renderBarChart('subject-room-chart', roomLabels, roomData, 'Học sinh/Phòng');
    setupChartDownload('subject-room-chart', 'dl-room-chart', `phong_thi_${code}.png`);

    const topSchoolsSlice = stats.topSchools.slice(0, 10);
    const schoolLabels = topSchoolsSlice.map(s => s.name.replace('Trường THCS ', '').replace('Trường ', ''));
    const schoolData = topSchoolsSlice.map(s => s.count);
    renderHorizontalBarChart('subject-school-chart', schoolLabels, schoolData, 'Học sinh/Trường');
    setupChartDownload('subject-school-chart', 'dl-school-chart', `truong_hoc_${code}.png`);

    // Setup DataTable
    const tableEl = $('#subject-students-table');
    let dt = null;
    dt = tableEl.DataTable({
        data: stats.students,

        columns: [
            { data: 'stt' },
            { data: 'sbd' },
            { data: 'name' },
            { data: 'gender' },
            { data: 'birthday' },
            { data: 'district' },
            { data: 'school' },
            { data: 'room' },
            {
                data: 'van',
                render: (data) => data !== null && data !== undefined ? data : '—'
            },
            {
                data: 'toan',
                render: (data) => data !== null && data !== undefined ? data : '—'
            },
            {
                data: 'anh',
                render: (data) => data !== null && data !== undefined ? data : '—'
            },
            {
                data: 'chuyen',
                render: (data) => data !== null && data !== undefined ? data : '—'
            },
            {
                data: 'tong',
                render: (data) => data !== null && data !== undefined ? data : '—'
            }
        ],

        lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, "Tất cả"]
        ],

        pageLength: -1,

        language: {
            search: "Tìm kiếm:",
            lengthMenu: "Hiển thị _MENU_ bản ghi",
            info: "Hiển thị từ _START_ đến _END_ trong tổng số _TOTAL_ thí sinh",
            paginate: {
                first: "Đầu",
                last: "Cuối",
                next: "Sau",
                previous: "Trước"
            }
        },

        responsive: true,
        order: [[0, 'asc']],
        dom: 'lfrtip',
        deferRender: true,

        fnRowCallback(nRow, aData) {
            $(nRow).on('click', () => openStudentModal(aData));
        },
    });

    // Export binds
    document.getElementById('subj-export-csv').onclick = () => exportDetailedData(stats.students, 'csv', code);
    document.getElementById('subj-export-excel').onclick = () => exportDetailedData(stats.students, 'excel', code);
    document.getElementById('subj-export-print').onclick = () => printDetailedData(stats.students, stats.name);

    // Bind Room Card click filters
    document.querySelectorAll('.room-card').forEach(card => {
        card.onclick = () => {
            const roomName = card.getAttribute('data-room-name');
            const roomStudents = stats.students.filter(s => s.room === roomName);

            let modalHtml = `
                <div class="table-responsive" style="max-height: 400px;">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>SBD</th>
                                <th>Họ tên</th>
                                <th>Trường</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${roomStudents.map(s => `
                                <tr>
                                    <td><strong>${s.sbd}</strong></td>
                                    <td>${s.name}</td>
                                    <td>${s.school}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            showModal(`Danh sách học sinh Phòng ${roomName} - Môn ${stats.name}`, modalHtml);
        };
    });
}

function openStudentModal(student) {
    const textTones = getSubjectName(student.subject);
    const quota = getSubjectQuota(student.subject);
    const html = `
        <div class="modal-detail-row">
            <span class="modal-detail-label">Họ tên</span>
            <span class="modal-detail-value">${student.name}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Giới tính</span>
            <span class="modal-detail-value">${student.gender}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Số báo danh</span>
            <span class="modal-detail-value"><strong>${student.sbd}</strong></span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Ngày sinh</span>
            <span class="modal-detail-value">${student.birthday}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Môn đăng ký</span>
            <span class="modal-detail-value">${textTones} (${student.subject})</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Phòng thi</span>
            <span class="modal-detail-value">${student.room}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Trường THCS</span>
            <span class="modal-detail-value">${student.school}</span>
        </div>
        <div class="modal-detail-divider" style="margin: 15px 0; border-top: 1px dashed rgba(255,255,255,.12);"></div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Điểm Ngữ Văn</span>
            <span class="modal-detail-value">${student.van !== null && student.van !== undefined ? student.van : '—'}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Điểm Toán</span>
            <span class="modal-detail-value">${student.toan !== null && student.toan !== undefined ? student.toan : '—'}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Điểm Anh Văn</span>
            <span class="modal-detail-value">${student.anh !== null && student.anh !== undefined ? student.anh : '—'}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Điểm Chuyên (hệ số 2)</span>
            <span class="modal-detail-value">${student.chuyen !== null && student.chuyen !== undefined ? student.chuyen : '—'}</span>
        </div>
        <div class="modal-detail-row highlight" style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 4px; font-weight: bold; margin-top: 8px;">
            <span class="modal-detail-label">Tổng điểm xét tuyển</span>
            <span class="modal-detail-value fs-5" style="color: var(--accent-primary);">${student.tong !== null && student.tong !== undefined ? student.tong : '—'}</span>
        </div>
    `;
    showModal('Thẻ thông tin thí sinh', html);
}

/**
 * Handle formatting data for CSV/Excel export
 */
function exportDetailedData(students, type, code) {
    if (type === 'csv') {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "STT,Môn,SBD,Họ tên,Giới tính,Ngày sinh,Huyện/TP,Trường,Phòng\n";
        students.forEach(s => {
            const row = [s.stt, s.subject, s.sbd, s.name, s.gender, s.birthday, s.district, s.school, s.room];
            csvContent += row.map(val => `"${val}"`).join(",") + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `thi_sinh_${code}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Xuất tệp CSV thành công!', 'success');
    } else if (type === 'excel') {
        // Build Excel XML string standard for basic tables
        let excelContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="utf-8"/></head>
            <body>
            <table>
                <tr>
                    <th>STT</th><th>Môn</th><th>SBD</th><th>Họ tên</th>
                                <th>Giới tính</th>
                                <th>Ngày sinh</th>
                                <th>Huyện/TP</th><th>Trường</th><th>Phòng</th>
                </tr>
        `;
        students.forEach(s => {
            excelContent += `
                <tr>
                    <td>${s.stt}</td><td>${s.subject}</td><td>${s.sbd}</td><td>${s.name}</td><td>${s.gender}</td><td>${s.birthday}</td><td>${s.district}</td><td>${s.school}</td><td>${s.room}</td>
                </tr>
            `;
        });
        excelContent += `</table></body></html>`;

        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `thi_sinh_${code}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Xuất tệp Excel thành công!', 'success');
    }
}

function printDetailedData(students, subjectName) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>In Danh Sách Thí Sinh - Môn ${subjectName}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body onload="window.print();window.close();">
            <h1>DANH SÁCH THÍ SINH KỲ THI CHUYÊN - MÔN ${subjectName.toUpperCase()}</h1>
            <table>
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>SBD</th>
                        <th>Họ tên</th>
                                <th>Giới tính</th>
                                <th>Ngày sinh</th>
                                <th>Huyện/TP</th>
                        <th>Trường</th>
                        <th>Phòng</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(s => `
                        <tr>
                            <td>${s.stt}</td>
                            <td>${s.sbd}</td>
                            <td>${s.name}</td>
                            <td>${s.gender}</td>
                            <td>${s.birthday}</td>
                            <td>${s.district}</td>
                            <td>${s.school}</td>
                            <td>${s.room}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `);
    printWindow.document.close();
}
