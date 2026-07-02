/**
 * Stats Module
 * Handles calculation of statistics, quotas, and competition ratios.
 */

// Mapping of subject codes to full names in Vietnamese
const SUBJECT_MAP = {
    'AV': 'Anh Văn',
    'T': 'Toán',
    'V': 'Ngữ Văn',
    'H': 'Hóa học',
    'L': 'Vật lý',
    'S': 'Sinh học',
    'SU': 'Lịch sử',
    'Ti': 'Tin học',
    'Đ': 'Địa lý'
};

/**
 * Get the full Vietnamese name of a subject from its code
 */
export function getSubjectName(code) {
    return SUBJECT_MAP[code] || code;
}

/**
 * Get the quota (chỉ tiêu) according to context/rules
 * Multi-class rules:
 * - Toán (T), Anh Văn (AV) -> 2 classes * 35 students = 70 quota
 * - Tin học (Ti), Lịch sử (SU), Địa lý (Đ) -> 1 class * 30 students = 30 quota
 * - Others (V, L, H, S) -> 1 class * 35 students = 35 quota
 */
export function getSubjectQuota(code) {
    const cleanCode = code.toUpperCase();
    if (cleanCode === 'T' || cleanCode === 'AV' || cleanCode === 'TOAN' || cleanCode === 'ANH') {
        return 70;
    }
    if (cleanCode === 'TI' || cleanCode === 'TIN' || cleanCode === 'SU' || cleanCode === 'Đ' || cleanCode === 'DIA') {
        return 30;
    }
    return 35; // Default for V, L, H, S
}

/**
 * Get competitiveness label and badge type based on ratio
 */
export function getCompetitiveness(ratio) {
    if (ratio >= 3.0) return { label: 'Rất cao', class: 'badge-danger' };
    if (ratio >= 2.0) return { label: 'Cao', class: 'badge-warning' };
    if (ratio >= 1.0) return { label: 'Trung bình', class: 'badge-primary' };
    return { label: 'Thấp', class: 'badge-success' };
}

/**
 * Calculate system-wide summary counts
 */
export function calculateOverallStats(students) {
    const totalStudents = students.length;
    const subjects = new Set(students.map(s => s.subject));
    const schools = new Set(students.map(s => s.school));
    const rooms = new Set(students.map(s => s.room));

    return {
        totalStudents,
        totalSubjects: subjects.size,
        totalSchools: schools.size,
        totalRooms: rooms.size
    };
}

/**
 * Get Top entities (schools, rooms, subjects) by student count
 */
export function getTopLists(students, limit = 5) {
    // School counts
    const schoolCounts = {};
    // Room counts
    const roomCounts = {};
    // Subject counts
    const subjectCounts = {};

    students.forEach(s => {
        if (s.school) schoolCounts[s.school] = (schoolCounts[s.school] || 0) + 1;
        if (s.room) roomCounts[s.room] = (roomCounts[s.room] || 0) + 1;
        if (s.subject) subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1;
    });

    const topSchools = Object.entries(schoolCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }));

    const topRooms = Object.entries(roomCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }));

    const topSubjects = Object.entries(subjectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([code, count]) => ({
            code,
            name: getSubjectName(code),
            count
        }));

    return { topSchools, topRooms, topSubjects };
}

/**
 * Calculates birth year distribution from student birthdays (DD/MM/YYYY)
 */
export function getBirthYearDistribution(students) {
    const years = {};
    students.forEach(s => {
        if (s.birthday) {
            const parts = s.birthday.split('/');
            const year = parts[2] ? parts[2].trim() : 'Không rõ';
            years[year] = (years[year] || 0) + 1;
        }
    });
    return Object.entries(years)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([year, count]) => ({ year, count }));
}

/**
 * Calculate competition stats for all subjects
 */
export function getCompetitionStats(students) {
    const subjectGroups = {};
    students.forEach(s => {
        if (s.subject) {
            subjectGroups[s.subject] = (subjectGroups[s.subject] || 0) + 1;
        }
    });

    return Object.entries(SUBJECT_MAP).map(([code, name]) => {
        const count = subjectGroups[code] || 0;
        const quota = getSubjectQuota(code);
        const ratio = quota > 0 ? parseFloat((count / quota).toFixed(2)) : 0;
        const competitiveness = getCompetitiveness(ratio);

        return {
            code,
            name,
            count,
            quota,
            ratio,
            competitiveness
        };
    }).sort((a, b) => b.ratio - a.ratio); // Sort by highest competition ratio first
}

/**
 * Detailed stats for a single subject
 */
export function getSubjectDetailStats(students, subjectCode) {
    const subjectStudents = students.filter(s => s.subject === subjectCode);
    const total = subjectStudents.length;
    const quota = getSubjectQuota(subjectCode);
    const ratio = quota > 0 ? parseFloat((total / quota).toFixed(2)) : 0;

    // School distribution
    const schoolCounts = {};
    // Room distribution
    const roomCounts = {};

    subjectStudents.forEach(s => {
        if (s.school) schoolCounts[s.school] = (schoolCounts[s.school] || 0) + 1;
        if (s.room) roomCounts[s.room] = (roomCounts[s.room] || 0) + 1;
    });

    const topSchools = Object.entries(schoolCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

    const roomsBreakdown = Object.entries(roomCounts)
        .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
        .map(([name, count]) => ({ name, count }));

    return {
        code: subjectCode,
        name: getSubjectName(subjectCode),
        total,
        quota,
        ratio,
        classes: quota / 35, // Approx class count
        competitiveness: getCompetitiveness(ratio),
        topSchools,
        roomsCount: Object.keys(roomCounts).length,
        schoolsCount: Object.keys(schoolCounts).length,
        roomsBreakdown,
        students: subjectStudents
    };
}
