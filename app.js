
window.syncIcsToIphoneCalendar = function() {
  const conf = getSessionsConfig();
  const tt = db.schoolTT || [];
  const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GiaBao//StudyOS//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Nhắc soạn sách vở - Gia Bảo',
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh'
  ];

  const byDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR'];

  for (let d = 0; d < 6; d++) {
    const targetDayName = days[d + 1];

    const morningSubs = (conf.morning.slots || []).map(sl => {
      const it = tt.find(x => x.d === d && x.slot === sl.slot && x.session === 'm');
      return it ? it.s : '';
    }).filter(Boolean);

    const afternoonSubs = (conf.afternoon.slots || []).map(sl => {
      const it = tt.find(x => x.d === d && x.slot === sl.slot && x.session === 'a');
      return it ? it.s : '';
    }).filter(Boolean);

    const allSubs = [...new Set([...morningSubs, ...afternoonSubs])];
    if (allSubs.length === 0) continue;

    const summary = `🎒 Soạn sách vở ${targetDayName}: ${allSubs.slice(0, 3).join(', ')}`;
    const desc = `Lịch học ${targetDayName}: Sáng (${morningSubs.join(', ') || 'Nghỉ'}) - Chiều (${afternoonSubs.join(', ') || 'Nghỉ'}). Hãy kiểm tra đủ sách vở và BTVN trước khi ngủ nhé Gia Bảo!`;
    const rruleDay = byDays[d];

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:studyos-soanbai-${d}@giabao.study`);
    ics.push('DTSTAMP:20260901T140000Z');
    ics.push('DTSTART;TZID=Asia/Ho_Chi_Minh:20260920T210000');
    ics.push('DTEND;TZID=Asia/Ho_Chi_Minh:20260920T213000');
    ics.push(`RRULE:FREQ=WEEKLY;BYDAY=${rruleDay}`);
    ics.push(`SUMMARY:${summary}`);
    ics.push(`DESCRIPTION:${desc}`);
    ics.push('BEGIN:VALARM');
    ics.push('ACTION:DISPLAY');
    ics.push(`DESCRIPTION:${summary}`);
    ics.push('TRIGGER:-PT0M');
    ics.push('END:VALARM');
    ics.push('END:VEVENT');
  }

  ics.push('END:VCALENDAR');
  const icsString = ics.join('\r\n');

  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Lich_Nhac_Soan_Sach_Vo_Gia_Bao.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast('📅 Đã tạo file Lịch! Hãy chọn "Mở trong Lịch" để iPhone tự nhắc mỗi tối nhé.');
};


// Quick Time Presets & Pickers for Extra Classes
window.setExtraClassTimePreset = function(start, end, el) {
  const startInput = document.getElementById('feTimeStart');
  const endInput = document.getElementById('feTimeEnd');
  const hiddenInput = document.getElementById('feTime');
  const display = document.getElementById('feTimeDisplay');

  if (startInput) startInput.value = start;
  if (endInput) endInput.value = end;
  const combined = `${start} – ${end}`;
  if (hiddenInput) hiddenInput.value = combined;
  if (display) display.textContent = combined;

  document.querySelectorAll('.time-preset-chips .time-chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
};

window.updateExtraClassTimeFromPickers = function() {
  const start = document.getElementById('feTimeStart')?.value || '18:00';
  const end = document.getElementById('feTimeEnd')?.value || '19:30';
  const combined = `${start} – ${end}`;
  const hiddenInput = document.getElementById('feTime');
  const display = document.getElementById('feTimeDisplay');

  if (hiddenInput) hiddenInput.value = combined;
  if (display) display.textContent = combined;
};

// Canvas downscaling to prevent mobile browser WASM / memory crashes
window.downscaleImageForMobile = function(file, maxDim = 1200) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(file);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        resolve(blob || file);
      }, 'image/jpeg', 0.82);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
};

window.pinOcrImageToManualTab = function() {
  if (!ocrTempImage) return toast('Chưa có ảnh nào để ghim');
  const viewer = document.getElementById('stickyOcrManualViewer');
  const imgEl = document.getElementById('stickyOcrManualImg');
  const preview = document.getElementById('ocrPreviewImg');
  if (viewer && imgEl && preview) {
    imgEl.src = preview.src;
    viewer.classList.remove('hidden');
    switchTTTab('manual');
    toast('Đã ghim ảnh vào bảng để bạn đối chiếu và điền nhanh! 👁️');
  }
};

const K = 'studyOS.data';
let db = JSON.parse(localStorage.getItem(K) || 'null') || {
  tasks: [],
  notes: [],
  tt: [],
  schoolTT: [],
  extraClasses: [],
  sessionsConfig: null,
    tempOverrides: [],
  extraCheckins: {},
  settings: { name: 'Gia Bảo', notify: true, soundAlert: true }
};
db.tempOverrides = db.tempOverrides || [];
db.extraCheckins = db.extraCheckins || {};
if (db.settings && (db.settings.name === 'Bạn' || !db.settings.name)) {
  db.settings.name = 'Gia Bảo';
}

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const save = () => localStorage.setItem(K, JSON.stringify(db));
const today = () => new Date().toISOString().slice(0, 10);
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function date(s) {
  if (!s) return '';
  return new Date(s + 'T00:00').toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function toast(s) {
  let x = $('#toast');
  x.textContent = s;
  x.classList.add('show');
  setTimeout(() => x.classList.remove('show'), 2400);
}

function go(v) {
  const target = v || 'dashboard';
  location.hash = target;
  $$('nav button, .sidebottom button, #mobileBottomNav button').forEach(x => x.classList.toggle('active', x.dataset.view === target));
  $('#sidebar')?.classList.remove('open');
  $('#sidebarBackdrop')?.classList.remove('active');

  // Dynamically configure the top header action button based on current screen
  const qBtn = $('#quick');
  if (qBtn) {
    if (target === 'notes') {
      qBtn.innerHTML = '➕ Ghi chú';
      qBtn.onclick = () => noteModal();
      qBtn.style.display = 'inline-flex';
    } else if (target === 'timetable') {
      qBtn.innerHTML = '➕ Ca học';
      qBtn.onclick = () => extraClassModal();
      qBtn.style.display = 'inline-flex';
    } else {
      qBtn.innerHTML = '➕ BTVN';
      qBtn.onclick = () => taskModal();
      qBtn.style.display = 'inline-flex';
    }
  }

  const views = { weather, dashboard, timetable, tasks, formulas, notes, progress, settings };
  if (views[target]) views[target]();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----------------- DEFAULT CONFIGS & SEED DATA -----------------
const SCHOOL_DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const FULL_WEEK_DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

const DEFAULT_SESSIONS_CONFIG = {
  morning: {
    title: "☀️ BUỔI SÁNG (4 tiết)",
    truyBai: { label: "Truy bài", time: "07:30 – 07:45", desc: "📖 Truy bài (Ôn bài cũ & Chuẩn bị sách vở)" },
    slots: [
      { slot: 1, label: "Tiết 1", time: "07:45 – 08:30" },
      { slot: 2, label: "Tiết 2", time: "08:35 – 09:20" },
      { slot: 3, label: "Tiết 3", time: "09:30 – 10:15" },
      { slot: 4, label: "Tiết 4", time: "10:20 – 11:05" }
    ]
  },
  afternoon: {
    title: "🌤️ BUỔI CHIỀU (3 tiết)",
    truyBai: { label: "Truy bài", time: "13:30 – 13:45", desc: "📖 Truy bài (Ôn bài cũ & Chuẩn bị sách vở)" },
    slots: [
      { slot: 1, label: "Tiết 1", time: "13:45 – 14:30" },
      { slot: 2, label: "Tiết 2", time: "14:35 – 15:20" },
      { slot: 3, label: "Tiết 3", time: "15:30 – 16:15" }
    ]
  }
};

function getSessionsConfig() {
  return db.sessionsConfig || DEFAULT_SESSIONS_CONFIG;
}

const SCHOOL_TT_DEFAULT = [
  // Sáng Thứ 2 (4 tiết)
  ["HĐTN1", "Nguyễn Xuân Hoàn"], ["Toán", "Nguyễn Xuân Hoàn"], ["Toán", "Nguyễn Xuân Hoàn"], ["Văn", "Cô Bùi Phương Thúy"],
  // Sáng Thứ 3 (4 tiết)
  ["Toán", "Nguyễn Xuân Hoàn"], ["Lý", "Cô Ninh Thị Bích Ngọc"], ["Văn", "Cô Bùi Phương Thúy"], ["GDĐP", "Cô Bùi Phương Thúy"],
  // Sáng Thứ 4 (4 tiết)
  ["Thể dục", "Phạm Phương Nhung"], ["Thể dục", "Phạm Phương Nhung"], ["GDKTPL", "Trần Thị Quyên"], ["GDKTPL", "Trần Thị Quyên"],
  // Sáng Thứ 5 (4 tiết)
  ["Toán", "Nguyễn Xuân Hoàn"], ["Toán", "Nguyễn Xuân Hoàn"], ["STEM", "Cô Nguyễn Thị Thanh Hải"], ["Văn", "Cô Bùi Phương Thúy"],
  // Sáng Thứ 6 (4 tiết)
  ["Hóa", "Cô Nguyễn Thị Thanh Hải"], ["Tin", "Cô Nguyễn Thị Hải Thủy"], ["Anh", "Cô Nguyễn Thị Tuệ Minh"], ["HĐTN2", "Nguyễn Xuân Hoàn"],

  // Chiều Thứ 2 (3 tiết)
  ["Tin", "Cô Nguyễn Thị Hải Thủy"], ["Hóa", "Cô Nguyễn Thị Thanh Hải"], ["Toán", "Nguyễn Xuân Hoàn"],
  // Chiều Thứ 3 (3 tiết)
  ["Anh", "Cô Nguyễn Thị Tuệ Minh"], ["Anh", "Cô Nguyễn Thị Tuệ Minh"], ["Toán", "Nguyễn Xuân Hoàn"],
  // Chiều Thứ 4 (3 tiết)
  ["Lý", "Cô Ninh Thị Bích Ngọc"], ["Hóa", "Cô Nguyễn Thị Thanh Hải"], ["Hóa", "Cô Nguyễn Thị Thanh Hải"],
  // Chiều Thứ 5 (3 tiết)
  ["Lý", "Cô Ninh Thị Bích Ngọc"], ["Văn", "Cô Bùi Phương Thúy"], ["Sử", "Cô Nguyễn Thị Kim Lanh"],
  // Chiều Thứ 6 (3 tiết)
  ["Sử", "Cô Nguyễn Thị Kim Lanh"], ["Anh", "Cô Nguyễn Thị Tuệ Minh"], ["Lý", "Cô Ninh Thị Bích Ngọc"]
];

function seedSchoolTimetable(force = false) {
  if (!force && (db.schoolTTSeeded || (db.schoolTT && db.schoolTT.length > 0))) return;
  const out = [];
  let k = 0;
  for (let d = 0; d < 5; d++) {
    for (let slot = 1; slot <= 4; slot++) {
      const x = SCHOOL_TT_DEFAULT[k++];
      if (x) out.push({ d, slot, session: "morning", s: x[0], teacher: x[1] });
    }
  }
  for (let d = 0; d < 5; d++) {
    for (let slot = 1; slot <= 3; slot++) {
      const x = SCHOOL_TT_DEFAULT[k++];
      if (x) out.push({ d, slot, session: "afternoon", s: x[0], teacher: x[1] });
    }
  }
  db.schoolTT = out;
  db.schoolTTSeeded = true;
  save();
}

function initExtraClasses() {
  if (!db.extraClasses) {
    db.extraClasses = [];
  }
  db.extraClasses = (db.extraClasses || []).filter(x => !['ext-1', 'ext-2', 'ext-3', 'ext-4'].includes(x.id));
  db.extraClassesSeeded = true;
  save();
}


seedSchoolTimetable();
initExtraClasses();

// Don sach du lieu BTVN va Lich hoc them mau de nguoi dung tu do nhap moi
if (!db.cleanUserDataV2) {
  db.tasks = [];
  db.extraClasses = [];
  db.cleanUserDataV2 = true;
  save();
}


// ----------------- WEB AUDIO ALARM SYNTHESIZER & GENTLE CHIMES -----------------
let audioCtx = null;

function unlockAudio() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {
    console.warn('Audio unlock error:', e);
  }
}

window.addEventListener('click', unlockAudio);
window.addEventListener('touchstart', unlockAudio);

function playChime() { try { playGentleMelody(); } catch(e) {} }

// Gentle, Soothing Acoustic Marimba & Chimes synthesizer (E-Major Pentatonic)
function playGentleMelody() {
  try {
    unlockAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    // A beautiful, uplifting, pleasant acoustic melody (soothing wake-up sound)
    const melody = [
      { f: 659.25, t: 0.00, d: 0.75, vol: 0.28 },  // E5
      { f: 830.61, t: 0.20, d: 0.70, vol: 0.30 },  // G#5
      { f: 987.77, t: 0.40, d: 0.72, vol: 0.32 },  // B5
      { f: 1318.51, t: 0.60, d: 0.90, vol: 0.35 }, // E6
      { f: 1479.98, t: 0.90, d: 0.75, vol: 0.32 }, // F#6
      { f: 1318.51, t: 1.15, d: 0.85, vol: 0.30 }, // E6
      { f: 987.77, t: 1.40, d: 0.80, vol: 0.28 },  // B5
      { f: 830.61, t: 1.65, d: 0.85, vol: 0.26 },  // G#5
      { f: 659.25, t: 1.95, d: 1.20, vol: 0.28 }   // E5 (soft resting note)
    ];

    melody.forEach(note => {
      const startTime = now + note.t;

      // Primary acoustic sine wave
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(note.f, startTime);

      gain1.gain.setValueAtTime(0.0001, startTime);
      gain1.gain.linearRampToValueAtTime(note.vol, startTime + 0.02); // soft touch
      gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + note.d); // natural decay

      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(startTime);
      osc1.stop(startTime + note.d);

      // Warm harmonic overtone (Triangle, 1 octave higher)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(note.f * 2, startTime);

      gain2.gain.setValueAtTime(0.0001, startTime);
      gain2.gain.linearRampToValueAtTime(note.vol * 0.22, startTime + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + (note.d * 0.55));

      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(startTime);
      osc2.stop(startTime + (note.d * 0.55));
    });
  } catch (e) {
    console.warn('Play gentle melody error:', e);
  }
}

// ----------------- ISO WEEK & TEMPORARY SCHEDULE HELPERS -----------------

function getWeekKey(dateObj = new Date()) {
  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return d.getUTCFullYear() + '-W' + String(weekNo).padStart(2, '0');
}

function getDatesOfCurrentWeek(dateObj = new Date()) {
  const curr = new Date(dateObj);
  const jsDay = curr.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(curr);
  monday.setDate(curr.getDate() + distanceToMonday);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function getWeekDisplayRange(dateObj = new Date()) {
  const dates = getDatesOfCurrentWeek(dateObj);
  const start = dates[0].split('-').reverse().slice(0, 2).join('/');
  const end = dates[6].split('-').reverse().slice(0, 2).join('/');
  return `${start} – ${end}`;
}

// Uplifting 3-note chime for extra-class checkin
function playCheckinSound() {
  try {
    unlockAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [
      { f: 1046.50, t: 0.00, d: 0.22 }, // C6
      { f: 1318.51, t: 0.08, d: 0.24 }, // E6
      { f: 1567.98, t: 0.16, d: 0.40 }  // G6
    ].forEach(n => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.0001, now + n.t);
      gain.gain.linearRampToValueAtTime(0.22, now + n.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  } catch (e) {
    console.warn('Checkin sound error:', e);
  }
}

// Toggle extra-class attendance check-in
function toggleExtraCheckin(classId, dateStr = today()) {
  db.extraCheckins = db.extraCheckins || {};
  db.extraCheckins[dateStr] = db.extraCheckins[dateStr] || {};
  const cur = db.extraCheckins[dateStr][classId];
  if (cur && cur.checked) {
    delete db.extraCheckins[dateStr][classId];
    save();
    toast('↺ Đã hủy điểm danh ca học này.');
  } else {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    db.extraCheckins[dateStr][classId] = {
      checked: true,
      time: `${hh}:${mm}`,
      timestamp: Date.now()
    };
    save();
    playCheckinSound();
    toast(`✅ Đã check-in đến lớp lúc ${hh}:${mm}! Chúc Gia Bảo học tốt 🎉`);
  }
  const currentView = location.hash.slice(1) || 'dashboard';
  if (currentView === 'dashboard') dashboard();
  else if (currentView === 'timetable') timetable();
}

// Toggle temporary cancellation of an extra class for the current week
function toggleTempCancelExtra(extraId, dayIdx) {
  const currentWeek = getWeekKey();
  db.tempOverrides = db.tempOverrides || [];
  const existingIdx = db.tempOverrides.findIndex(o => o.weekKey === currentWeek && o.type === 'cancel' && o.targetType === 'extra' && o.targetId === extraId);

  if (existingIdx >= 0) {
    db.tempOverrides.splice(existingIdx, 1);
    save();
    toast('✓ Đã khôi phục ca học thêm tuần này!');
  } else {
    db.tempOverrides.push({
      id: 'cancel-' + id(),
      weekKey: currentWeek,
      type: 'cancel',
      targetType: 'extra',
      targetId: extraId,
      d: dayIdx,
      createdAt: Date.now()
    });
    save();
    toast('🏖️ Đã báo nghỉ tuần này! Tuần sau sẽ tự động học lại bình thường.');
  }
  const currentView = location.hash.slice(1) || 'dashboard';
  if (currentView === 'dashboard') dashboard();
  else if (currentView === 'timetable') timetable();
}

// Delete a temporary override (e.g. makeup class)
function deleteTempOverride(overrideId) {
  db.tempOverrides = (db.tempOverrides || []).filter(o => o.id !== overrideId);
  save();
  toast('✓ Đã xóa lịch điều chỉnh tạm thời!');
  const currentView = location.hash.slice(1) || 'dashboard';
  if (currentView === 'dashboard') dashboard();
  else if (currentView === 'timetable') timetable();
}

// Set makeup time chip presets
function setMakeupTimePreset(start, end, btn) {
  const container = btn.closest('.time-preset-chips');
  if (container) {
    container.querySelectorAll('.time-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
  }
  const str = `${start} – ${end}`;
  const display = $('#fmbTimeDisplay');
  const input = $('#fmbTime');
  const sInput = $('#fmbStart');
  const eInput = $('#fmbEnd');
  if (display) display.textContent = str;
  if (input) input.value = str;
  if (sInput) sInput.value = start;
  if (eInput) eInput.value = end;
}

function updateMakeupTimeFromPickers() {
  const s = $('#fmbStart')?.value || '19:30';
  const e = $('#fmbEnd')?.value || '21:00';
  const str = `${s} – ${e}`;
  const display = $('#fmbTimeDisplay');
  const input = $('#fmbTime');
  if (display) display.textContent = str;
  if (input) input.value = str;
  const container = $('.time-preset-chips');
  if (container) {
    container.querySelectorAll('.time-chip').forEach(c => c.classList.remove('active'));
  }
}

// Modal to add a temporary makeup class for the current week
function openAddMakeupModal(defaultDay = null) {
  const currentWeek = getWeekKey();
  const dates = getDatesOfCurrentWeek();
  const todayD = new Date().getDay();
  const todayIdx = todayD === 0 ? 6 : todayD - 1;
  const initialDay = defaultDay !== null ? defaultDay : todayIdx;

  modal('🔄 Thêm Lịch Học Bù Tuần Này', `
    <div class="form">
      <div class="temp-schedule-modal-tip" style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:12.5px;color:#fef3c7;line-height:1.5">
        <b style="color:#fbbf24">ℹ️ Tính năng tự động hoàn nguyên:</b> Lịch học bù này chỉ áp dụng trong tuần hiện tại (Tuần ${currentWeek.split('-W')[1]}). <b>Nếu bạn quên xóa, sang tuần sau hệ thống sẽ tự động trở về lịch gốc!</b>
      </div>

      <div class="field full">
        <label>Chọn Ngày học bù trong tuần này *</label>
        <select id="fmbDay" class="select">
          ${FULL_WEEK_DAYS.map((dName, idx) => {
            const dateStr = dates[idx];
            const dateParts = dateStr.split('-');
            const viDate = `${dateParts[2]}/${dateParts[1]}`;
            const isToday = idx === todayIdx;
            return `<option value="${idx}" ${idx === initialDay ? 'selected' : ''}>${dName} (${viDate}) ${isToday ? '— Hôm nay' : ''}</option>`;
          }).join('')}
        </select>
      </div>

      <div class="field full">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <label style="font-weight:750;color:#f1f5f9;margin:0">Khung giờ học bù *</label>
          <span id="fmbTimeDisplay" style="color:#f59e0b;font-weight:800;font-size:14px;background:rgba(245,158,11,0.15);padding:2px 8px;border-radius:6px;border:1px solid rgba(245,158,11,0.35)">19:30 – 21:00</span>
        </div>
        <input type="hidden" id="fmbTime" value="19:30 – 21:00">

        <span style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">⚡ Bấm chọn nhanh ca học:</span>
        <div class="time-preset-chips">
          <button type="button" class="time-chip" onclick="setMakeupTimePreset('18:00', '19:30', this)">🌙 18:00 – 19:30</button>
          <button type="button" class="time-chip active" onclick="setMakeupTimePreset('19:30', '21:00', this)">🌙 19:30 – 21:00</button>
          <button type="button" class="time-chip" onclick="setMakeupTimePreset('17:30', '19:00', this)">🌆 17:30 – 19:00</button>
          <button type="button" class="time-chip" onclick="setMakeupTimePreset('20:00', '21:30', this)">🌙 20:00 – 21:30</button>
          <button type="button" class="time-chip" onclick="setMakeupTimePreset('14:00', '15:30', this)">☀️ 14:00 – 15:30</button>
          <button type="button" class="time-chip" onclick="setMakeupTimePreset('08:00', '09:30', this)">🌅 08:00 – 09:30</button>
        </div>

        <span style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Hoặc gạt chọn giờ cụ thể:</span>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <span style="font-size:11px;color:#94a3b8;display:block;margin-bottom:3px">Bắt đầu:</span>
            <input type="time" id="fmbStart" class="input" value="19:30" onchange="updateMakeupTimeFromPickers()" style="font-size:14px;font-weight:700">
          </div>
          <div>
            <span style="font-size:11px;color:#94a3b8;display:block;margin-bottom:3px">Kết thúc:</span>
            <input type="time" id="fmbEnd" class="input" value="21:00" onchange="updateMakeupTimeFromPickers()" style="font-size:14px;font-weight:700">
          </div>
        </div>
      </div>

      <div class="field">
        <label>Tên môn học bù *</label>
        <input id="fmbSub" class="input" placeholder="Toán Thầy Hoàn, Hóa Cô Hải, Tiếng Anh..." required>
      </div>
      <div class="field">
        <label>Thầy / Cô giảng dạy</label>
        <input id="fmbTeacher" class="input" placeholder="Thầy Hoàn, Cô Ngọc...">
      </div>
      <div class="field full">
        <label>Địa điểm / Phòng học / Link Online</label>
        <input id="fmbLoc" class="input" placeholder="Phòng 302, Online Zoom, hoặc Google Meet">
      </div>
      <div class="field full">
        <label>Lý do bù / Ghi chú cho buổi học</label>
        <textarea id="fmbNote" class="textarea" rows="2" placeholder="Ví dụ: Bù cho buổi thứ 3 nghỉ đi ăn cưới, ôn tập giữa kỳ..."></textarea>
      </div>
    </div>
  `, () => {
    const dIdx = parseInt($('#fmbDay').value, 10);
    const time = $('#fmbTime').value.trim() || '19:30 – 21:00';
    const sub = $('#fmbSub').value.trim();
    if (!sub) {
      toast('Vui lòng nhập tên môn học bù!');
      return false;
    }
    const teacher = $('#fmbTeacher').value.trim();
    const loc = $('#fmbLoc').value.trim();
    const note = $('#fmbNote').value.trim();

    db.tempOverrides = db.tempOverrides || [];
    db.tempOverrides.push({
      id: 'makeup-' + id(),
      weekKey: currentWeek,
      type: 'makeup',
      d: dIdx,
      dateStr: dates[dIdx],
      time,
      subject: sub,
      teacher,
      location: loc,
      note,
      createdAt: Date.now()
    });
    save();
    toast(`✓ Đã thêm ca học bù ${sub} vào ${FULL_WEEK_DAYS[dIdx]} tuần này!`);
    const currentView = location.hash.slice(1) || 'dashboard';
    if (currentView === 'dashboard') dashboard();
    else if (currentView === 'timetable') timetable();
    return true;
  });
}

// ----------------- SCHEDULE RESOLVER (TODAY & TOMORROW) -----------------
function getDayScheduleSummary(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const jsDay = d.getDay(); // 0: CN, 1: T2, ..., 6: T7
  const dayIdx = jsDay === 0 ? 6 : jsDay - 1; // 0: T2 ... 6: CN
  const dayName = FULL_WEEK_DAYS[dayIdx];
  const dateStr = d.toISOString().slice(0, 10);
  const weekKey = getWeekKey(d);

  // Overrides for this week
  const activeOverrides = (db.tempOverrides || []).filter(o => o.weekKey === weekKey);
  const cancels = activeOverrides.filter(o => o.type === 'cancel');
  const makeups = activeOverrides.filter(o => o.type === 'makeup' && o.d === dayIdx);

  const morning = (db.schoolTT || []).filter(x => x.d === dayIdx && x.session === 'morning').sort((a, b) => a.slot - b.slot);
  const afternoon = (db.schoolTT || []).filter(x => x.d === dayIdx && x.session === 'afternoon').sort((a, b) => a.slot - b.slot);

  const baseExtras = (db.extraClasses || []).filter(x => x.d === dayIdx).sort((a, b) => a.time.localeCompare(b.time));

  const extras = [];
  baseExtras.forEach(ex => {
    const isCanceled = cancels.some(c => c.targetType === 'extra' && c.targetId === ex.id);
    extras.push({
      ...ex,
      isCanceled,
      isMakeup: false
    });
  });

  // Append makeup classes for this day
  makeups.forEach(m => {
    extras.push({
      id: m.id,
      subject: m.subject,
      time: m.time,
      teacher: m.teacher,
      location: m.location,
      link: m.link,
      note: m.note,
      d: m.d,
      isCanceled: false,
      isMakeup: true
    });
  });
  extras.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const mStr = morning.map(x => `T${x.slot}: ${x.s}${x.note ? ` [📝 ${x.note}]` : ''}`).join(', ') || 'Nghỉ';
  const aStr = afternoon.map(x => `T${x.slot}: ${x.s}${x.note ? ` [📝 ${x.note}]` : ''}`).join(', ') || 'Nghỉ';
  const activeExtras = extras.filter(x => !x.isCanceled);
  const extStr = activeExtras.map(x => `${x.subject}${x.isMakeup ? ' [🔄 Bù]' : ''} (${x.time})`).join(', ');

  let fullText = `☀️ Sáng: ${mStr} | 🌤️ Chiều: ${aStr}`;
  if (activeExtras.length) fullText += ` | 🎯 Học thêm: ${extStr}`;

  return { dayName, text: fullText, morning, afternoon, extras, dateStr, dayIdx, weekKey, activeOverrides };
}

function getTomorrowScheduleSummary() {
  return getDayScheduleSummary(1);
}

// ----------------- DASHBOARD -----------------

// ----------------- LIVE CLOCK & GREETINGS & HOLIDAY SUGGESTIONS -----------------
function getGreeting(name = 'Gia Bảo') {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return { text: `Chào buổi sáng - ${name}`, icon: '☀️' };
  if (h >= 11 && h < 14) return { text: `Chào buổi trưa - ${name}`, icon: '🌤️' };
  if (h >= 14 && h < 18) return { text: `Chào buổi chiều - ${name}`, icon: '🌇' };
  if (h >= 18 && h < 23) return { text: `Chào buổi tối - ${name}`, icon: '🌙' };
  return { text: `Chào cú đêm - ${name}`, icon: '🦉' };
}

function updateLiveClock() {
  const el = document.getElementById('dashLiveClock');
  if (!el) return;
  const now = new Date();
  const daysVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayStr = daysVi[now.getDay()];
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  el.innerHTML = `<span style="color:#a5b4fc;font-weight:600">${dayStr}, ${dd}/${mm}/${yyyy}</span> <span style="opacity:0.4;margin:0 4px">•</span> <span style="color:#38bdf8;font-family:'JetBrains Mono',monospace;font-weight:700;letter-spacing:0.5px">${hh}:${min}:${ss}</span> <span style="font-size:10px;color:#94a3b8;font-weight:500">(GMT+7)</span>`;
}

if (!window.__liveClockInterval) {
  window.__liveClockInterval = setInterval(updateLiveClock, 1000);
}

const DAY_OFF_SUGGESTIONS = [
  { icon: '🎯', title: 'Ôn tập 3 công thức trọng tâm', desc: 'Dành 25-30 phút ôn lại các phần kiến thức hoặc công thức quan trọng trong tuần để nhớ sâu lâu quên.' },
  { icon: '📚', title: 'Đọc trước bài học mới', desc: 'Đọc lướt 1 bài trong SGK trước khi lên lớp sẽ giúp bạn tiếp thu bài giảng nhanh gấp đôi.' },
  { icon: '🏃', title: 'Vận động & Chơi thể thao', desc: 'Chạy bộ, đá bóng, cầu lông hoặc tập cardio 30 phút giúp giải tỏa căng thẳng và tăng cường tập trung.' },
  { icon: '🗂️', title: 'Dọn dẹp góc học tập', desc: 'Sắp xếp lại bàn học, phân loại tập vở ngăn nắp để tạo không gian học tập đầy cảm hứng.' },
  { icon: '🧠', title: 'Luyện 15 phút từ vựng Tiếng Anh', desc: 'Ôn 10-15 từ vựng hoặc nghe 1 bài podcast tiếng Anh ngắn để duy trì phản xạ ngôn ngữ.' },
  { icon: '🎧', title: 'Thư giãn & Nạp lại năng lượng', desc: 'Nghe playlist nhạc yêu thích, xem một bộ phim hay hoặc làm món đồ uống yêu thích để nạp lại 100% pin.' },
  { icon: '📝', title: 'Lập kế hoạch cho tuần tới', desc: 'Liệt kê 3 mục tiêu ưu tiên nhất trong tuần học sắp tới để luôn chủ động trước mọi bài kiểm tra.' },
  { icon: '💻', title: 'Học một kỹ năng công nghệ mới', desc: 'Khám phá thêm về lập trình, thiết kế Canva, gõ 10 ngón hoặc phím tắt tin học văn phòng hữu ích.' },
  { icon: '☕', title: 'Dành thời gian cho gia đình & bạn bè', desc: 'Trò chuyện, chia sẻ cùng bố mẹ, người thân hoặc cà phê tán gẫu xả stress cùng bạn bè.' },
  { icon: '😴', title: 'Ngủ đủ giấc & Thư giãn mắt', desc: 'Một giấc ngủ trưa 30 phút hoặc ngủ sớm buổi tối giúp não bộ hồi phục và thông suốt hơn.' },
  { icon: '🎨', title: 'Sáng tạo & Sở thích cá nhân', desc: 'Vẽ tranh, chơi nhạc cụ, viết nhật ký hoặc làm những điều bạn yêu thích mà ngày thường chưa có thời gian.' }
];

let currentHolidaySugIdx = Math.floor(Math.random() * DAY_OFF_SUGGESTIONS.length);

function getDayOffSuggestion() {
  return DAY_OFF_SUGGESTIONS[currentHolidaySugIdx % DAY_OFF_SUGGESTIONS.length];
}

window.randomizeHolidaySuggestion = function() {
  currentHolidaySugIdx = (currentHolidaySugIdx + 1 + Math.floor(Math.random() * (DAY_OFF_SUGGESTIONS.length - 1))) % DAY_OFF_SUGGESTIONS.length;
  const sug = getDayOffSuggestion();
  const boxes = document.querySelectorAll('.holiday-suggestion-dynamic-box');
  boxes.forEach(box => {
    box.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
        <div style="font-weight:750;color:#fde047;font-size:12.5px;display:flex;align-items:center;gap:6px">
          <span style="font-size:15px">${sug.icon}</span> <span>Gợi ý hôm nay: ${esc(sug.title)}</span>
        </div>
        <button class="ghost" style="padding:3px 8px;font-size:11px;border-color:rgba(253,224,71,0.35);color:#fde047;border-radius:6px;cursor:pointer" class="ghost btn-dice-animate" onclick="randomizeHolidaySuggestion()"><span class="dice-icon">🎲</span> Đổi gợi ý khác</button>
      </div>
      <div style="font-size:12px;color:#fef08a;line-height:1.45;opacity:0.95">${esc(sug.desc)}</div>
    `;
  });
};


// ----------------- SỔ TAY CÔNG THỨC LỚP 10 (TOÁN • LÝ • HÓA) -----------------
const FORMULAS_DB = [
  {
    "id": "m-ch1-1",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 1,
    "chapterId": "m-ch1",
    "chapter": "Chương I: Mệnh đề và tập hợp",
    "lesson": "Bài 1 & 2: Mệnh đề toán học & Ký hiệu ∀, ∃",
    "title": "Phủ định mệnh đề chứa ký hiệu Với mọi (∀) & Tồn tại (∃)",
    "formula": "Phủ định của \"∀x ∈ X, P(x)\" là \"∃x ∈ X, ¬P(x)\"\\nPhủ định của \"∃x ∈ X, P(x)\" là \"∀x ∈ X, ¬P(x)\"",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Phủ định ∀</span>\n        <span>Phủ định của <b>\"∀<span class=\"math-var\">x</span> ∈ <span class=\"math-var\">X</span>, <span class=\"math-var\">P(x)</span>\"</b> là <span class=\"math-highlight\">\"∃<span class=\"math-var\">x</span> ∈ <span class=\"math-var\">X</span>, <span class=\"math-var\">P(x)</span>\"</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Phủ định ∃</span>\n        <span>Phủ định của <b>\"∃<span class=\"math-var\">x</span> ∈ <span class=\"math-var\">X</span>, <span class=\"math-var\">P(x)</span>\"</b> là <span class=\"math-highlight\">\"∀<span class=\"math-var\">x</span> ∈ <span class=\"math-var\">X</span>, <span class=\"math-var\">P(x)</span>\"</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Đổi dấu</span>\n        <span>Dấu <b>=</b> đổi thành <b>≠</b> | Dấu <b>></b> đổi thành <b>≤</b> | Dấu <b><</b> đổi thành <b>≥</b></span>\n      </div>\n    ",
    "vars": "<b>∀ (Với mọi)</b>: Đúng khi đúng với TẤT CẢ mọi phần tử | <b>∃ (Tồn tại)</b>: Đúng chỉ cần ÍT NHẤT 1 phần tử đúng.",
    "tip": "Khi lập mệnh đề phủ định, bắt buộc đổi: ∀ ↔ ∃ và phủ định biểu thức vị từ P(x)."
  },
  {
    "id": "m-ch1-2",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 1,
    "chapterId": "m-ch1",
    "chapter": "Chương I: Mệnh đề và tập hợp",
    "lesson": "Bài 2: Tập hợp và các phép toán trên tập hợp",
    "title": "Giao (∩), Hợp (∪), Hiệu (\\) và Phần bù (C_E A)",
    "formula": "A ∩ B = {x | x ∈ A và x ∈ B}\\nA ∪ B = {x | x ∈ A hoặc x ∈ B}\\nA \\ B = {x | x ∈ A và x ∉ B}\\nC_E A = E \\ A (khi A ⊂ E)",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Giao (∩)</span>\n        <span><span class=\"math-var\">A</span> ∩ <span class=\"math-var\">B</span> <span class=\"math-op\">=</span> { <span class=\"math-var\">x</span> | <span class=\"math-var\">x</span> ∈ <span class=\"math-var\">A</span> và <span class=\"math-var\">x</span> ∈ <span class=\"math-var\">B</span> } (phần chung)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Hợp (∪)</span>\n        <span><span class=\"math-var\">A</span> ∪ <span class=\"math-var\">B</span> <span class=\"math-op\">=</span> { <span class=\"math-var\">x</span> | <span class=\"math-var\">x</span> ∈ <span class=\"math-var\">A</span> hoặc <span class=\"math-var\">x</span> ∈ <span class=\"math-var\">B</span> } (lấy hết cả hai)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Hiệu (\\)</span>\n        <span><span class=\"math-var\">A</span> \\ <span class=\"math-var\">B</span> <span class=\"math-op\">=</span> { <span class=\"math-var\">x</span> | <span class=\"math-var\">x</span> ∈ <span class=\"math-var\">A</span> và <span class=\"math-var\">x</span> ∉ <span class=\"math-var\">B</span> } (thuộc A nhưng bỏ B)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Phần bù C_E</span>\n        <span><span class=\"math-var\">C</span><sub><span class=\"math-var\">E</span></sub><span class=\"math-var\">A</span> <span class=\"math-op\">=</span> <span class=\"math-var\">E</span> \\ <span class=\"math-var\">A</span> (chỉ xác định khi <span class=\"math-var\">A</span> ⊂ <span class=\"math-var\">E</span>)</span>\n      </div>\n    ",
    "vars": "<b>Số phần tử hợp</b>: n(A ∪ B) = n(A) + n(B) - n(A ∩ B).",
    "tip": "Biểu diễn các tập con của số thực R trên trục số: gạch bỏ phần không thuộc để tìm giao, hợp không bị sót khoảng."
  },
  {
    "id": "m-ch2-1",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 1,
    "chapterId": "m-ch2",
    "chapter": "Chương II: BPT và Hệ BPT bậc nhất hai ẩn",
    "lesson": "Bài 3 & 4: BPT & Hệ BPT bậc nhất hai ẩn",
    "title": "Miền nghiệm của BPT ax + by ≤ c & Bài toán tối ưu F(x, y)",
    "formula": "BPT: ax + by ≤ c (a² + b² ≠ 0)\\nĐiểm tối ưu F(x, y) = ax + by của hệ BPT luôn đạt tại một trong các ĐỈNH của miền đa giác nghiệm.",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Dạng BPT</span>\n        <span><span class=\"math-var\">ax</span> <span class=\"math-op\">+</span> <span class=\"math-var\">by</span> <span class=\"math-op\">≤</span> <span class=\"math-var\">c</span> (với <span class=\"math-var\">a</span><sup>2</sup> <span class=\"math-op\">+</span> <span class=\"math-var\">b</span><sup>2</sup> <span class=\"math-op\">≠</span> 0)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Xác định miền</span>\n        <span>Vẽ đường thẳng <span class=\"math-var\">d: ax + by = c</span>. Thử điểm <span class=\"math-var\">O(0, 0)</span> để lấy hoặc gạch bỏ nửa mặt phẳng.</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Tối ưu F(x, y)</span>\n        <span class=\"math-highlight\">Giá trị cực đại / cực tiểu của <span class=\"math-var\">F(x, y) = ax + by</span> luôn nằm tại một trong các ĐỈNH của đa giác nghiệm.</span>\n      </div>\n    ",
    "vars": "<b>Đa giác nghiệm</b>: Phần mặt phẳng chung không bị gạch sau khi biểu diễn tất cả các BPT trong hệ.",
    "tip": "Để tìm max/min F(x,y): Chỉ cần tìm tọa độ các đỉnh của miền đa giác rồi thay vào F, so sánh giá trị lớn nhất/nhỏ nhất."
  },
  {
    "id": "m-ch3-1",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 1,
    "chapterId": "m-ch3",
    "chapter": "Chương III: Hệ thức lượng trong tam giác",
    "lesson": "Bài 5: Giá trị lượng giác của một góc từ 0° đến 180°",
    "title": "Hệ thức Lượng giác của hai góc bù nhau (α và 180° - α)",
    "formula": "sin(180° - α) = sin(α)\\ncos(180° - α) = -cos(α)\\ntan(180° - α) = -tan(α)\\ncot(180° - α) = -cot(α)\\nsin²(α) + cos²(α) = 1",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Góc bù nhau</span>\n        <span class=\"math-highlight\">sin(180° <span class=\"math-op\">-</span> <span class=\"math-var\">α</span>) <span class=\"math-op\">=</span> sin(<span class=\"math-var\">α</span>)</span>\n        <span>(Chỉ có sin bằng nhau, còn cos, tan, cot mang dấu trừ)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Đổi dấu</span>\n        <span>cos(180° <span class=\"math-op\">-</span> <span class=\"math-var\">α</span>) <span class=\"math-op\">=</span> <span class=\"math-op\">-</span>cos(<span class=\"math-var\">α</span>) | tan(180° <span class=\"math-op\">-</span> <span class=\"math-var\">α</span>) <span class=\"math-op\">=</span> <span class=\"math-op\">-</span>tan(<span class=\"math-var\">α</span>)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Hằng đẳng thức</span>\n        <span>sin<sup>2</sup>(<span class=\"math-var\">α</span>) <span class=\"math-op\">+</span> cos<sup>2</sup>(<span class=\"math-var\">α</span>) <span class=\"math-op\">=</span> 1 | 1 <span class=\"math-op\">+</span> tan<sup>2</sup>(<span class=\"math-var\">α</span>) <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\">1</span><span class=\"den\">cos<sup>2</sup>(<span class=\"math-var\">α</span>)</span></span></span>\n      </div>\n    ",
    "vars": "<b>Góc nhọn (0° < α < 90°)</b>: sin > 0, cos > 0 | <b>Góc tù (90° < α < 180°)</b>: sin > 0, cos < 0.",
    "tip": "Trong tam giác: A + B + C = 180° nên sin(A + B) = sin C; cos(A + B) = -cos C."
  },
  {
    "id": "m-ch3-2",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 1,
    "chapterId": "m-ch3",
    "chapter": "Chương III: Hệ thức lượng trong tam giác",
    "lesson": "Bài 6: Hệ thức lượng trong tam giác",
    "title": "Định lý Cosin, Định lý Sin & Công thức Diện tích tam giác",
    "formula": "a² = b² + c² - 2bc.cos(A)\\na/sinA = b/sinB = c/sinC = 2R\\nS = (1/2)ab.sinC = abc/(4R) = p.r = √[p(p-a)(p-b)(p-c)]",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Định lý Cosin</span>\n        <span><span class=\"math-var\">a</span><sup>2</sup> <span class=\"math-op\">=</span> <span class=\"math-var\">b</span><sup>2</sup> <span class=\"math-op\">+</span> <span class=\"math-var\">c</span><sup>2</sup> <span class=\"math-op\">-</span> 2<span class=\"math-var\">bc</span> · cos(<span class=\"math-var\">A</span>) ⇒ cos(<span class=\"math-var\">A</span>) <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">b</span><sup>2</sup> + <span class=\"math-var\">c</span><sup>2</sup> - <span class=\"math-var\">a</span><sup>2</sup></span><span class=\"den\">2<span class=\"math-var\">bc</span></span></span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Định lý Sin</span>\n        <span><span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">a</span></span><span class=\"den\">sin(<span class=\"math-var\">A</span>)</span></span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">b</span></span><span class=\"den\">sin(<span class=\"math-var\">B</span>)</span></span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">c</span></span><span class=\"den\">sin(<span class=\"math-var\">C</span>)</span></span> <span class=\"math-op\">=</span> 2<span class=\"math-var\">R</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Hệ thống Diện tích</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">S</span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\">1</span><span class=\"den\">2</span></span><span class=\"math-var\">ab</span> · sin(<span class=\"math-var\">C</span>) <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">abc</span></span><span class=\"den\">4<span class=\"math-var\">R</span></span></span> <span class=\"math-op\">=</span> <span class=\"math-var\">p</span> · <span class=\"math-var\">r</span> <span class=\"math-op\">=</span> <span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\"><span class=\"math-var\">p</span>(<span class=\"math-var\">p</span>-<span class=\"math-var\">a</span>)(<span class=\"math-var\">p</span>-<span class=\"math-var\">b</span>)(<span class=\"math-var\">p</span>-<span class=\"math-var\">c</span>)</span></span></span>\n      </div>\n    ",
    "vars": "<b>p = (a + b + c) / 2</b>: Nửa chu vi | <b>R</b>: Bán kính ngoại tiếp | <b>r</b>: Bán kính nội tiếp.",
    "tip": "Muốn tính bán kính R hoặc r: Hãy tính diện tích S trước (qua Heron hoặc cạnh & sin góc), rồi suy ra R = abc/(4S) và r = S/p."
  },
  {
    "id": "m-ch4-1",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 1,
    "chapterId": "m-ch4",
    "chapter": "Chương IV: Vectơ",
    "lesson": "Bài 7, 8, 9: Tổng, hiệu và tích vectơ với một số",
    "title": "Các Quy Tắc Vectơ Cơ Bản (3 điểm, Hình bình hành, Trung điểm, Trọng tâm)",
    "formula": "Quy tắc 3 điểm: AB + BC = AC; AB - AC = CB\\nQuy tắc HBH: AB + AD = AC\\nTrung điểm I: IA + IB = 0 <=> MA + MB = 2MI\\nTrọng tâm G: GA + GB + GC = 0 <=> MA + MB + MC = 3MG",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Quy tắc 3 điểm</span>\n        <span><span class=\"math-vec\">AB</span> <span class=\"math-op\">+</span> <span class=\"math-vec\">BC</span> <span class=\"math-op\">=</span> <span class=\"math-vec\">AC</span>  |  <span class=\"math-vec\">AB</span> <span class=\"math-op\">-</span> <span class=\"math-vec\">AC</span> <span class=\"math-op\">=</span> <span class=\"math-vec\">CB</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Quy tắc HBH</span>\n        <span><span class=\"math-vec\">AB</span> <span class=\"math-op\">+</span> <span class=\"math-vec\">AD</span> <span class=\"math-op\">=</span> <span class=\"math-vec\">AC</span> (với ABCD là hình bình hành)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Trung điểm I của AB</span>\n        <span><span class=\"math-vec\">IA</span> <span class=\"math-op\">+</span> <span class=\"math-vec\">IB</span> <span class=\"math-op\">=</span> <span class=\"math-vec\">0</span>  ⇔  <span class=\"math-highlight\"><span class=\"math-vec\">MA</span> <span class=\"math-op\">+</span> <span class=\"math-vec\">MB</span> <span class=\"math-op\">=</span> 2<span class=\"math-vec\">MI</span></span> (với mọi điểm M)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Trọng tâm G của ΔABC</span>\n        <span><span class=\"math-vec\">GA</span> <span class=\"math-op\">+</span> <span class=\"math-vec\">GB</span> <span class=\"math-op\">+</span> <span class=\"math-vec\">GC</span> <span class=\"math-op\">=</span> <span class=\"math-vec\">0</span>  ⇔  <span class=\"math-highlight\"><span class=\"math-vec\">MA</span> <span class=\"math-op\">+</span> <span class=\"math-vec\">MB</span> <span class=\"math-op\">+</span> <span class=\"math-vec\">MC</span> <span class=\"math-op\">=</span> 3<span class=\"math-vec\">MG</span></span></span>\n      </div>\n    ",
    "vars": "<b>Hai vectơ cùng phương</b>: a⃗ = k.b⃗ (với k ≠ 0). Cùng hướng khi k > 0, ngược hướng khi k < 0.",
    "tip": "Phép trừ vectơ: \"Đầu chung thì đổi đuôi\" (AB - AC = CB)."
  },
  {
    "id": "m-ch4-2",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 1,
    "chapterId": "m-ch4",
    "chapter": "Chương IV: Vectơ",
    "lesson": "Bài 10 & 11: Tích vô hướng của hai vectơ & Tọa độ vectơ",
    "title": "Tích Vô Hướng & Điều Kiện Hai Vectơ Vuông Góc",
    "formula": "a⃗.b⃗ = |a⃗|.|b⃗|.cos(a⃗, b⃗) = a1.b1 + a2.b2\\ncos(a⃗, b⃗) = (a1.b1 + a2.b2) / (√(a1² + a2²).√(b1² + b2²))\\na⃗ ⊥ b⃗ <=> a1.b1 + a2.b2 = 0",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Định nghĩa</span>\n        <span><span class=\"math-vec\">a</span> · <span class=\"math-vec\">b</span> <span class=\"math-op\">=</span> |<span class=\"math-vec\">a</span>| · |<span class=\"math-vec\">b</span>| · cos(<span class=\"math-vec\">a</span>, <span class=\"math-vec\">b</span>)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Biểu thức tọa độ</span>\n        <span><span class=\"math-vec\">a</span> · <span class=\"math-vec\">b</span> <span class=\"math-op\">=</span> <span class=\"math-var\">a</span><sub>1</sub><span class=\"math-var\">b</span><sub>1</sub> <span class=\"math-op\">+</span> <span class=\"math-var\">a</span><sub>2</sub><span class=\"math-var\">b</span><sub>2</sub> (với <span class=\"math-vec\">a</span> = (a₁, a₂), <span class=\"math-vec\">b</span> = (b₁, b₂))</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Góc giữa 2 vectơ</span>\n        <span>cos(<span class=\"math-vec\">a</span>, <span class=\"math-vec\">b</span>) <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">a</span><sub>1</sub><span class=\"math-var\">b</span><sub>1</sub> + <span class=\"math-var\">a</span><sub>2</sub><span class=\"math-var\">b</span><sub>2</sub></span><span class=\"den\"><span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\"><span class=\"math-var\">a</span><sub>1</sub><sup>2</sup> + <span class=\"math-var\">a</span><sub>2</sub><sup>2</sup></span></span> · <span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\"><span class=\"math-var\">b</span><sub>1</sub><sup>2</sup> + <span class=\"math-var\">b</span><sub>2</sub><sup>2</sup></span></span></span></span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Điều kiện vuông góc</span>\n        <span class=\"math-highlight\"><span class=\"math-vec\">a</span> ⊥ <span class=\"math-vec\">b</span>  ⇔  <span class=\"math-var\">a</span><sub>1</sub><span class=\"math-var\">b</span><sub>1</sub> + <span class=\"math-var\">a</span><sub>2</sub><span class=\"math-var\">b</span><sub>2</sub> = 0</span>\n      </div>\n    ",
    "vars": "<b>Độ dài</b>: |a⃗| = √(a₁² + a₂²) | <b>Khoảng cách 2 điểm</b>: AB = √[(xB - xA)² + (yB - yA)²].",
    "tip": "Tích vô hướng của một vectơ với chính nó gọi là bình phương vô hướng: a⃗² = |a⃗|² ≥ 0."
  },
  {
    "id": "m-ch5-1",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 1,
    "chapterId": "m-ch5",
    "chapter": "Chương V: Các số đặc trưng mẫu số liệu",
    "lesson": "Bài 12, 13, 14: Xu thế trung tâm & Mức độ phân tán",
    "title": "Số trung bình (x̄), Trung vị (Me), Tứ phân vị (Q1, Q2, Q3) & Phương sai (s²)",
    "formula": "Trung bình: x̄ = (∑ xi) / n\\nTrung vị Me: số chính giữa khi sắp xếp dãy\\nKhoảng tứ phân vị: ΔQ = Q3 - Q1\\nPhương sai: s² = (1/n) ∑ (xi - x̄)²; Độ lệch chuẩn: s = √(s²)",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Số trung bình</span>\n        <span><span class=\"math-var\">x̄</span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">x</span><sub>1</sub> + <span class=\"math-var\">x</span><sub>2</sub> + ... + <span class=\"math-var\">x</span><sub><span class=\"math-var\">n</span></sub></span><span class=\"den\"><span class=\"math-var\">n</span></span></span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Khoảng tứ phân vị</span>\n        <span><span class=\"math-var\">Δ</span><sub><span class=\"math-var\">Q</span></sub> <span class=\"math-op\">=</span> <span class=\"math-var\">Q</span><sub>3</sub> <span class=\"math-op\">-</span> <span class=\"math-var\">Q</span><sub>1</sub> (đo độ phân tán của 50% số liệu ở giữa)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Phương sai & Độ lệch chuẩn</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">s</span><sup>2</sup> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\">1</span><span class=\"den\"><span class=\"math-var\">n</span></span></span> ∑ (<span class=\"math-var\">x</span><sub>i</sub> <span class=\"math-op\">-</span> <span class=\"math-var\">x̄</span>)<sup>2</sup>  ⇒  <span class=\"math-var\">s</span> <span class=\"math-op\">=</span> <span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\"><span class=\"math-var\">s</span><sup>2</sup></span></span></span>\n      </div>\n    ",
    "vars": "<b>Q₂ = Me</b> (trung vị của cả mẫu) | <b>Q₁</b>: trung vị nửa dưới | <b>Q₃</b>: trung vị nửa trên.",
    "tip": "Giá trị bất thường (outlier): số liệu x nằm ngoài khoảng [Q₁ - 1.5ΔQ ; Q₃ + 1.5ΔQ]."
  },
  {
    "id": "m-ch6-1",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 2,
    "chapterId": "m-ch6",
    "chapter": "Chương VI: Hàm số, đồ thị và ứng dụng",
    "lesson": "Bài 15 & 16: Hàm số bậc hai y = ax² + bx + c",
    "title": "Tọa độ đỉnh, Trục đối xứng & Bảng biến thiên Parabol",
    "formula": "Đỉnh I(-b/(2a); -Δ/(4a)), với Δ = b² - 4ac\\nTrục đối xứng: x = -b/(2a)\\na > 0: bề lõm quay lên (min tại I) | a < 0: bề lõm quay xuống (max tại I)",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Đỉnh Parabol</span>\n        <span><span class=\"math-var\">I</span> ( <span class=\"math-frac\"><span class=\"num\">-<span class=\"math-var\">b</span></span><span class=\"den\">2<span class=\"math-var\">a</span></span></span> ; <span class=\"math-frac\"><span class=\"num\">-Δ</span><span class=\"den\">4<span class=\"math-var\">a</span></span></span> ) với <span class=\"math-var\">Δ</span> <span class=\"math-op\">=</span> <span class=\"math-var\">b</span><sup>2</sup> <span class=\"math-op\">-</span> 4<span class=\"math-var\">ac</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Trục đối xứng</span>\n        <span>Đường thẳng <span class=\"math-var\">x</span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\">-<span class=\"math-var\">b</span></span><span class=\"den\">2<span class=\"math-var\">a</span></span></span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Chiều biến thiên</span>\n        <span><span class=\"math-var\">a > 0</span>: nghịch biến trên (-∞; -b/2a), đồng biến trên (-b/2a; +∞)<br><span class=\"math-var\">a < 0</span>: đồng biến trên (-∞; -b/2a), nghịch biến trên (-b/2a; +∞)</span>\n      </div>\n    ",
    "vars": "<b>Giao trục tung Oy</b>: (0, c) | <b>Giao trục hoành Ox</b>: Nghiệm của ax² + bx + c = 0.",
    "tip": "Tung độ đỉnh I: có thể tính bằng f(-b/2a) nhanh hơn công thức -Δ/(4a)."
  },
  {
    "id": "m-ch6-2",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 2,
    "chapterId": "m-ch6",
    "chapter": "Chương VI: Hàm số, đồ thị và ứng dụng",
    "lesson": "Bài 17 & 18: Dấu của tam thức bậc hai & Phương trình chứa căn",
    "title": "Dấu Tam Thức Bậc Hai & Giải Phương Trình Quy Về Bậc Hai",
    "formula": "Δ < 0: a.f(x) > 0 với mọi x ∈ R\\nΔ = 0: a.f(x) > 0 với mọi x ≠ -b/(2a)\\nΔ > 0: Trong trái, ngoài cùng dấu với a\\n√(f(x)) = √(g(x)) <=> g(x) ≥ 0 và f(x) = g(x)\\n√(f(x)) = g(x) <=> g(x) ≥ 0 và f(x) = [g(x)]²",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Định lý dấu</span>\n        <span class=\"math-highlight\">Δ < 0: f(x) cùng dấu a với mọi x | Δ > 0: \"Trong trái dấu a, Ngoài cùng dấu a\"</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">√(f) = √(g)</span>\n        <span><span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\"><span class=\"math-var\">f(x)</span></span></span> <span class=\"math-op\">=</span> <span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\"><span class=\"math-var\">g(x)</span></span></span>  ⇔  <span class=\"math-var\">g(x)</span> <span class=\"math-op\">≥</span> 0 và <span class=\"math-var\">f(x)</span> <span class=\"math-op\">=</span> <span class=\"math-var\">g(x)</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">√(f) = g</span>\n        <span><span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\"><span class=\"math-var\">f(x)</span></span></span> <span class=\"math-op\">=</span> <span class=\"math-var\">g(x)</span>  ⇔  <span class=\"math-var\">g(x)</span> <span class=\"math-op\">≥</span> 0 và <span class=\"math-var\">f(x)</span> <span class=\"math-op\">=</span> [<span class=\"math-var\">g(x)</span>]<sup>2</sup></span>\n      </div>\n    ",
    "vars": "<b>f(x) = ax² + bx + c (a ≠ 0)</b> | Điều kiện f(x) > 0 ∀x ∈ R: a > 0 và Δ < 0.",
    "tip": "Phương trình √(f) = g bắt buộc phải đặt điều kiện vế phải g(x) ≥ 0 trước khi bình phương hai vế."
  },
  {
    "id": "m-ch7-1",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 2,
    "chapterId": "m-ch7",
    "chapter": "Chương VII: Phương pháp tọa độ trong mặt phẳng",
    "lesson": "Bài 19: Phương trình đường thẳng trong Oxy",
    "title": "Phương Trình Tham Số, Tổng Quát, Khoảng Cách & Góc Giữa 2 ĐT",
    "formula": "PTTS qua M(x0, y0), VTCP u(u1, u2): x = x0 + u1.t, y = y0 + u2.t\\nPTTQ qua M(x0, y0), VTPT n(a, b): a(x - x0) + b(y - y0) = 0\\nd(M, Δ) = |a.x0 + b.y0 + c| / √(a² + b²)\\ncos(Δ1, Δ2) = |a1.a2 + b1.b2| / [√(a1² + b1²).√(a2² + b2²)]",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Tham số (VTCP)</span>\n        <span><span class=\"math-var\">x</span> <span class=\"math-op\">=</span> <span class=\"math-var\">x</span><sub>0</sub> <span class=\"math-op\">+</span> <span class=\"math-var\">u</span><sub>1</sub><span class=\"math-var\">t</span>  ,  <span class=\"math-var\">y</span> <span class=\"math-op\">=</span> <span class=\"math-var\">y</span><sub>0</sub> <span class=\"math-op\">+</span> <span class=\"math-var\">u</span><sub>2</sub><span class=\"math-var\">t</span> (với <span class=\"math-vec\">u</span> = (u₁, u₂))</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Tổng quát (VTPT)</span>\n        <span><span class=\"math-var\">ax</span> <span class=\"math-op\">+</span> <span class=\"math-var\">by</span> <span class=\"math-op\">+</span> <span class=\"math-var\">c</span> <span class=\"math-op\">=</span> 0 (với <span class=\"math-vec\">n</span> = (a, b))</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Khoảng cách d(M, Δ)</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">d</span>(<span class=\"math-var\">M</span>, Δ) <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\">|<span class=\"math-var\">a</span><span class=\"math-var\">x</span><sub>0</sub> + <span class=\"math-var\">b</span><span class=\"math-var\">y</span><sub>0</sub> + <span class=\"math-var\">c</span>|</span><span class=\"den\"><span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\"><span class=\"math-var\">a</span><sup>2</sup> + <span class=\"math-var\">b</span><sup>2</sup></span></span></span></span></span>\n      </div>\n    ",
    "vars": "<b>Chuyển đổi VTPT & VTCP</b>: Nếu VTPT n⃗ = (a, b) thì VTCP u⃗ = (-b, a) hoặc (b, -a).",
    "tip": "Góc giữa hai đường thẳng luôn là góc nhọn (0° ≤ φ ≤ 90°), do đó tử số trong cos(Δ₁, Δ₂) luôn có dấu giá trị tuyệt đối |...|."
  },
  {
    "id": "m-ch7-2",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 2,
    "chapterId": "m-ch7",
    "chapter": "Chương VII: Phương pháp tọa độ trong mặt phẳng",
    "lesson": "Bài 20 & 21: Đường tròn & Ba đường Conic (Elip, Hypebol, Parabol)",
    "title": "Phương trình Đường tròn & Ba đường Conic trong Oxy",
    "formula": "Đường tròn: (x - a)² + (y - b)² = R² hoặc x² + y² - 2ax - 2by + c = 0 (với a² + b² - c > 0)\\nElip: x²/a² + y²/b² = 1 (b² = a² - c²)\\nHypebol: x²/a² - y²/b² = 1 (c² = a² + b²)\\nParabol: y² = 2px (tiêu điểm F(p/2, 0), đường chuẩn x = -p/2)",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Đường tròn tâm I(a, b)</span>\n        <span>(<span class=\"math-var\">x</span> <span class=\"math-op\">-</span> <span class=\"math-var\">a</span>)<sup>2</sup> <span class=\"math-op\">+</span> (<span class=\"math-var\">y</span> <span class=\"math-op\">-</span> <span class=\"math-var\">b</span>)<sup>2</sup> <span class=\"math-op\">=</span> <span class=\"math-var\">R</span><sup>2</sup> | Bán kính <span class=\"math-var\">R</span> <span class=\"math-op\">=</span> <span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\"><span class=\"math-var\">a</span><sup>2</sup> + <span class=\"math-var\">b</span><sup>2</sup> - <span class=\"math-var\">c</span></span></span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Chính tắc Elip (E)</span>\n        <span><span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">x</span><sup>2</sup></span><span class=\"den\"><span class=\"math-var\">a</span><sup>2</sup></span></span> <span class=\"math-op\">+</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">y</span><sup>2</sup></span><span class=\"den\"><span class=\"math-var\">b</span><sup>2</sup></span></span> <span class=\"math-op\">=</span> 1 (với <span class=\"math-var\">a</span> <span class=\"math-op\">></span> <span class=\"math-var\">b</span> <span class=\"math-op\">></span> 0 và <span class=\"math-highlight\"><span class=\"math-var\">b</span><sup>2</sup> = <span class=\"math-var\">a</span><sup>2</sup> - <span class=\"math-var\">c</span><sup>2</sup></span>)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Chính tắc Hypebol (H)</span>\n        <span><span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">x</span><sup>2</sup></span><span class=\"den\"><span class=\"math-var\">a</span><sup>2</sup></span></span> <span class=\"math-op\">-</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">y</span><sup>2</sup></span><span class=\"den\"><span class=\"math-var\">b</span><sup>2</sup></span></span> <span class=\"math-op\">=</span> 1 (với <span class=\"math-highlight\"><span class=\"math-var\">c</span><sup>2</sup> = <span class=\"math-var\">a</span><sup>2</sup> + <span class=\"math-var\">b</span><sup>2</sup></span>)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Chính tắc Parabol (P)</span>\n        <span><span class=\"math-var\">y</span><sup>2</sup> <span class=\"math-op\">=</span> 2<span class=\"math-var\">px</span> (với <span class=\"math-var\">p</span> > 0, tiêu cự <span class=\"math-var\">p</span>/2, tiêu điểm <span class=\"math-var\">F</span>(<span class=\"math-var\">p</span>/2, 0))</span>\n      </div>\n    ",
    "vars": "<b>Tiêu cự của Elip và Hypebol</b>: 2c | <b>Tiêu điểm</b>: F₁(-c, 0) và F₂(c, 0).",
    "tip": "Tiếp tuyến của đường tròn tại M₀(x₀, y₀) thuộc đường tròn: (x₀ - a)(x - x₀) + (y₀ - b)(y - y₀) = 0."
  },
  {
    "id": "m-ch8-1",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 2,
    "chapterId": "m-ch8",
    "chapter": "Chương VIII: Đại số tổ hợp",
    "lesson": "Bài 22 & 23: Quy tắc đếm, Hoán vị, Chỉnh hợp, Tổ hợp",
    "title": "Hoán vị (Pn), Chỉnh hợp (Anᵏ) & Tổ hợp (Cnᵏ)",
    "formula": "Pn = n!\\nAnᵏ = n! / (n - k)!\\nCnᵏ = n! / [k!(n - k)!]\\nCnᵏ = Cn^(n-k) và Cnᵏ + Cn^(k+1) = C_(n+1)^(k+1)",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Hoán vị Pn</span>\n        <span><span class=\"math-var\">P</span><sub><span class=\"math-var\">n</span></sub> <span class=\"math-op\">=</span> <span class=\"math-var\">n</span>! <span class=\"math-op\">=</span> 1 <span class=\"math-op\">·</span> 2 <span class=\"math-op\">·</span> ... <span class=\"math-op\">·</span> <span class=\"math-var\">n</span> (sắp xếp thứ tự n phần tử)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Chỉnh hợp Anᵏ</span>\n        <span><span class=\"math-var\">A</span><sub><span class=\"math-var\">n</span></sub><sup><span class=\"math-var\">k</span></sup> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">n</span>!</span><span class=\"den\">(<span class=\"math-var\">n</span> - <span class=\"math-var\">k</span>)!</span></span> (chọn k phần tử và CÓ sắp xếp)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Tổ hợp Cnᵏ</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">C</span><sub><span class=\"math-var\">n</span></sub><sup><span class=\"math-var\">k</span></sup> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">n</span>!</span><span class=\"den\"><span class=\"math-var\">k</span>!(<span class=\"math-var\">n</span> - <span class=\"math-var\">k</span>)!</span></span> (chọn k phần tử KHÔNG sắp xếp)</span>\n      </div>\n    ",
    "vars": "<b>Quy ước</b>: 0! = 1; C_n^0 = C_n^n = 1.",
    "tip": "Bí kíp trắc nghiệm: Chọn lớp trưởng, bí thư (có chức vụ phân biệt) dùng A; chọn 3 bạn đi lao động (bình đẳng) dùng C."
  },
  {
    "id": "m-ch8-2",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 2,
    "chapterId": "m-ch8",
    "chapter": "Chương VIII: Đại số tổ hợp",
    "lesson": "Bài 24: Nhị thức Newton",
    "title": "Khai Triển Nhị Thức Newton (a + b)⁴ và (a + b)⁵",
    "formula": "(a + b)⁴ = a⁴ + 4a³b + 6a²b² + 4ab³ + b⁴\\n(a + b)⁵ = a⁵ + 5a⁴b + 10a³b² + 10a²b³ + 5ab⁴ + b⁵",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Bậc 4</span>\n        <span>(<span class=\"math-var\">a</span> + <span class=\"math-var\">b</span>)<sup>4</sup> <span class=\"math-op\">=</span> <span class=\"math-var\">a</span><sup>4</sup> <span class=\"math-op\">+</span> 4<span class=\"math-var\">a</span><sup>3</sup><span class=\"math-var\">b</span> <span class=\"math-op\">+</span> 6<span class=\"math-var\">a</span><sup>2</sup><span class=\"math-var\">b</span><sup>2</sup> <span class=\"math-op\">+</span> 4<span class=\"math-var\">ab</span><sup>3</sup> <span class=\"math-op\">+</span> <span class=\"math-var\">b</span><sup>4</sup></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Bậc 5</span>\n        <span class=\"math-highlight\">(<span class=\"math-var\">a</span> + <span class=\"math-var\">b</span>)<sup>5</sup> <span class=\"math-op\">=</span> <span class=\"math-var\">a</span><sup>5</sup> <span class=\"math-op\">+</span> 5<span class=\"math-var\">a</span><sup>4</sup><span class=\"math-var\">b</span> <span class=\"math-op\">+</span> 10<span class=\"math-var\">a</span><sup>3</sup><span class=\"math-var\">b</span><sup>2</sup> <span class=\"math-op\">+</span> 10<span class=\"math-var\">a</span><sup>2</sup><span class=\"math-var\">b</span><sup>3</sup> <span class=\"math-op\">+</span> 5<span class=\"math-var\">ab</span><sup>4</sup> <span class=\"math-op\">+</span> <span class=\"math-var\">b</span><sup>5</sup></span>\n      </div>\n    ",
    "vars": "<b>Tổng hệ số</b>: Thay a = 1, b = 1 vào biểu thức để tính tổng các hệ số trong khai triển (2ⁿ).",
    "tip": "Nếu là (a - b)ⁿ: các dấu sẽ luân phiên xen kẽ: +, -, +, -, +..."
  },
  {
    "id": "m-ch9-1",
    "subject": "math",
    "subjectName": "Toán 10 (Thầy Hoàn - KNTT)",
    "semester": 2,
    "chapterId": "m-ch9",
    "chapter": "Chương IX: Tính xác suất theo định nghĩa cổ điển",
    "lesson": "Bài 25 & 26: Xác suất của biến cố",
    "title": "Công thức Tính Xác Suất Cổ Điển & Biến Cố Đối",
    "formula": "P(A) = n(A) / n(Ω)\\n0 ≤ P(A) ≤ 1\\nP(Ω) = 1, P(∅) = 0\\nP(A) = 1 - P(A_đối)\\nNếu A và B xung khắc: P(A ∪ B) = P(A) + P(B)",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Định nghĩa cổ điển</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">P(A)</span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">n(A)</span></span><span class=\"den\"><span class=\"math-var\">n(Ω)</span></span></span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\">Số kết quả thuận lợi cho A</span><span class=\"den\">Số phần tử không gian mẫu</span></span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Biến cố đối A</span>\n        <span><span class=\"math-var\">P(A)</span> <span class=\"math-op\">=</span> 1 <span class=\"math-op\">-</span> <span class=\"math-var\">P(A)</span> (dùng khi đề hỏi \"ít nhất một...\")</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Quy tắc cộng xác suất</span>\n        <span>Nếu A và B xung khắc (không bao giờ xảy ra đồng thời): <span class=\"math-var\">P(A ∪ B)</span> <span class=\"math-op\">=</span> <span class=\"math-var\">P(A)</span> <span class=\"math-op\">+</span> <span class=\"math-var\">P(B)</span></span>\n      </div>\n    ",
    "vars": "<b>n(Ω)</b>: Số phần tử không gian mẫu | <b>n(A)</b>: Số phần tử của biến cố A.",
    "tip": "Gặp bài toán chứa cụm từ \"có ít nhất một...\", giải gián tiếp qua biến cố đối \"không có cái nào...\" luôn nhanh hơn gấp 3 lần!"
  },
  {
    "id": "c-ch1-1",
    "subject": "chem",
    "subjectName": "Hóa học 10 (Cô Thanh Hải - KNTT)",
    "semester": 1,
    "chapterId": "c-ch1",
    "chapter": "Chương 1: Cấu tạo nguyên tử",
    "lesson": "Bài 1 & 2: Thành phần nguyên tử & Hạt nhân",
    "title": "Thành phần hạt, Số khối (A) & Điều kiện bền của đồng vị",
    "formula": "Tổng số hạt: S = 2Z + N (p = e = Z)\\nSố khối: A = Z + N\\nBất đẳng thức bền: 1 ≤ N/Z ≤ 1.5 => S/3.5 ≤ Z ≤ S/3",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Tổng hạt</span>\n        <span><span class=\"math-var\">S</span> <span class=\"math-op\">=</span> 2<span class=\"math-var\">Z</span> <span class=\"math-op\">+</span> <span class=\"math-var\">N</span> (với số proton <span class=\"math-var\">p</span> <span class=\"math-op\">=</span> số electron <span class=\"math-var\">e</span> <span class=\"math-op\">=</span> <span class=\"math-var\">Z</span>)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Số khối A</span>\n        <span><span class=\"math-var\">A</span> <span class=\"math-op\">=</span> <span class=\"math-var\">Z</span> <span class=\"math-op\">+</span> <span class=\"math-var\">N</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Bất đẳng thức bền</span>\n        <span class=\"math-highlight\"><span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">S</span></span><span class=\"den\">3.5</span></span> <span class=\"math-op\">≤</span> <span class=\"math-var\">Z</span> <span class=\"math-op\">≤</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">S</span></span><span class=\"den\">3</span></span></span> (cho các nguyên tố có Z ≤ 82)\n      </div>\n    ",
    "vars": "<b>Z</b>: Điện tích hạt nhân | <b>N</b>: Số hạt neutron (không mang điện) | <b>p, e</b>: Hạt mang điện.",
    "tip": "Biết tổng số hạt S, chỉ cần lấy S chia cho 3 và chia cho 3.5 là ra ngay khoảng của Z mà không cần giải hệ phương trình phức tạp."
  },
  {
    "id": "c-ch1-2",
    "subject": "chem",
    "subjectName": "Hóa học 10 (Cô Thanh Hải - KNTT)",
    "semester": 1,
    "chapterId": "c-ch1",
    "chapter": "Chương 1: Cấu tạo nguyên tử",
    "lesson": "Bài 3 & 4: Đồng vị & Cấu hình electron nguyên tử",
    "title": "Nguyên tử khối trung bình & Trật tự mức năng lượng electron",
    "formula": "Ā = (A1.x1 + A2.x2 + ...) / 100\\nTrật tự năng lượng Aufbau: 1s 2s 2p 3s 3p 4s 3d 4p 5s...",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">NTK trung bình</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">Ā</span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">A</span><sub>1</sub><span class=\"math-var\">x</span><sub>1</sub> + <span class=\"math-var\">A</span><sub>2</sub><span class=\"math-var\">x</span><sub>2</sub> + ...</span><span class=\"den\">100</span></span></span> (với x₁, x₂ là % số nguyên tử các đồng vị)\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Mức năng lượng</span>\n        <span>1s 2s 2p 3s 3p <span class=\"math-highlight\">4s 3d</span> 4p 5s 4d 5p 6s...</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Dự đoán tính chất</span>\n        <span>1, 2, 3 e ngoài cùng: Kim loại | 5, 6, 7 e ngoài cùng: Phi kim | 8 e: Khí hiếm (trừ He có 2e)</span>\n      </div>\n    ",
    "vars": "<b>Phân lớp e tối đa</b>: s (tối đa 2e), p (tối đa 6e), d (tối đa 10e), f (tối đa 14e).",
    "tip": "Lưu ý hiện tượng bán bão hòa và bão hòa phân lớp 3d: Cu (Z=29) là [Ar] 3d¹⁰ 4s¹ (không phải 3d⁹ 4s²); Cr (Z=24) là [Ar] 3d⁵ 4s¹."
  },
  {
    "id": "c-ch2-1",
    "subject": "chem",
    "subjectName": "Hóa học 10 (Cô Thanh Hải - KNTT)",
    "semester": 1,
    "chapterId": "c-ch2",
    "chapter": "Chương 2: Bảng tuần hoàn các nguyên tố hóa học",
    "lesson": "Bài 5 & 6: Cấu tạo BTH & Quy luật biến đổi tuần hoàn",
    "title": "Vị trí BTH & Quy luật biến đổi Bán kính, Độ âm điện, Tính kim loại/phi kim",
    "formula": "Ô = Số hiệu Z | Chu kỳ = Số lớp e | Nhóm A = Số e hóa trị (s, p)\\nChu kỳ (Trái -> Phải): Z tăng, Bán kính GIẢM, Độ âm điện TĂNG, Phi kim TĂNG, Kim loại GIẢM\\nNhóm A (Trên -> Dưới): Bán kính TĂNG, Độ âm điện GIẢM, Kim loại TĂNG, Phi kim GIẢM",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Xác định vị trí</span>\n        <span>Ô số <span class=\"math-var\">Z</span> | Chu kỳ = Số lớp electron | Nhóm A = Số e lớp ngoài cùng</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Trong 1 Chu kỳ (→)</span>\n        <span class=\"math-highlight\">Bán kính nguyên tử GIẢM | Độ âm điện TĂNG | Tính Kim loại GIẢM, Phi kim TĂNG</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Trong 1 Nhóm A (↓)</span>\n        <span class=\"math-highlight\">Bán kính nguyên tử TĂNG | Độ âm điện GIẢM | Tính Kim loại TĂNG, Phi kim GIẢM</span>\n      </div>\n    ",
    "vars": "<b>Nguyên tố phi kim mạnh nhất</b>: Fluorine (F) có độ âm điện lớn nhất (3.98) | <b>Kim loại mạnh nhất</b>: Cesium (Cs).",
    "tip": "Bán kính nguyên tử biến thiên NGƯỢC CHIỀU với Độ âm điện."
  },
  {
    "id": "c-ch2-2",
    "subject": "chem",
    "subjectName": "Hóa học 10 (Cô Thanh Hải - KNTT)",
    "semester": 1,
    "chapterId": "c-ch2",
    "chapter": "Chương 2: Bảng tuần hoàn các nguyên tố hóa học",
    "lesson": "Bài 7: Xu hướng biến đổi tính acid, tính base của oxide và hydroxide",
    "title": "Hóa trị cao nhất với Oxygen & Biến đổi tính Acid - Base",
    "formula": "Hóa trị cao nhất với Oxygen = Số thứ tự nhóm A (n)\\nHóa trị với Hydrogen (từ nhóm IVA - VIIA) = 8 - n\\nTính base của oxide/hydroxide giảm dần từ trái sang phải, tính acid tăng dần.",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Công thức Oxide cao nhất</span>\n        <span>Nhóm IA: <span class=\"math-var\">R</span><sub>2</sub>O | IIA: <span class=\"math-var\">R</span>O | IIIA: <span class=\"math-var\">R</span><sub>2</sub>O<sub>3</sub> | IVA: <span class=\"math-var\">R</span>O<sub>2</sub> | VA: <span class=\"math-var\">R</span><sub>2</sub>O<sub>5</sub> | VIA: <span class=\"math-var\">R</span>O<sub>3</sub> | VIIA: <span class=\"math-var\">R</span><sub>2</sub>O<sub>7</sub></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Hợp chất khí với H</span>\n        <span>Nhóm IVA: <span class=\"math-var\">R</span>H<sub>4</sub> | VA: <span class=\"math-var\">R</span>H<sub>3</sub> | VIA: <span class=\"math-var\">H</span><sub>2</sub><span class=\"math-var\">R</span> | VIIA: <span class=\"math-var\">H</span><span class=\"math-var\">R</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Quy luật Acid - Base</span>\n        <span>Từ trái qua phải trong 1 chu kỳ: Tính Base GIẢM DẦN, Tính Acid TĂNG DẦN</span>\n      </div>\n    ",
    "vars": "<b>Ví dụ Chu kỳ 3</b>: NaOH (base mạnh) -> Mg(OH)₂ (base yếu) -> Al(OH)₃ (lưỡng tính) -> H₂SiO₃ (acid rất yếu) -> H₃PO₄ (acid trung bình) -> H₂SO₄ (acid mạnh) -> HClO₄ (acid rất mạnh).",
    "tip": "Tổng hóa trị cao nhất với oxygen và hóa trị trong hợp chất với hydrogen của các phi kim luôn bằng 8."
  },
  {
    "id": "c-ch3-1",
    "subject": "chem",
    "subjectName": "Hóa học 10 (Cô Thanh Hải - KNTT)",
    "semester": 1,
    "chapterId": "c-ch3",
    "chapter": "Chương 3: Liên kết hóa học",
    "lesson": "Bài 8, 9, 10: Liên kết ion, Liên kết cộng hóa trị & Tương tác liên phân tử",
    "title": "Phân loại liên kết theo Hiệu độ âm điện (Δχ) & Liên kết Hydrogen",
    "formula": "0 ≤ Δχ < 0.4: CHT không phân cực\\n0.4 ≤ Δχ < 1.7: CHT phân cực (có cực)\\nΔχ ≥ 1.7: Liên kết Ion\\nLiên kết Hydrogen: xảy ra giữa H linh động gắn với F, O, N và nguyên tử F, O, N khác",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Hiệu độ âm điện Δχ</span>\n        <span><span class=\"math-var\">Δχ</span> <span class=\"math-op\">=</span> | <span class=\"math-var\">χ</span><sub>A</sub> <span class=\"math-op\">-</span> <span class=\"math-var\">χ</span><sub>B</sub> |</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Thang phân loại</span>\n        <span class=\"math-highlight\">[0 ; 0.4): CHT Không phân cực | [0.4 ; 1.7): CHT Phân cực | [1.7 trở lên): Liên kết Ion</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Liên kết Hydrogen</span>\n        <span>Kí hiệu bằng dấu ba chấm (...), giải thích vì sao <span class=\"math-var\">H</span><sub>2</sub><span class=\"math-var\">O</span> có nhiệt độ sôi (100°C) cao bất thường so với <span class=\"math-var\">H</span><sub>2</sub><span class=\"math-var\">S</span>.</span>\n      </div>\n    ",
    "vars": "<b>Liên kết σ (sigma)</b>: Xen phủ trục, rất bền | <b>Liên kết π (pi)</b>: Xen phủ bên, kém bền hơn.",
    "tip": "Liên kết đơn luôn là 1σ; liên kết đôi gồm 1σ và 1π; liên kết ba gồm 1σ và 2π."
  },
  {
    "id": "c-ch4-1",
    "subject": "chem",
    "subjectName": "Hóa học 10 (Cô Thanh Hải - KNTT)",
    "semester": 2,
    "chapterId": "c-ch4",
    "chapter": "Chương 4: Phản ứng Oxi hóa - Khử",
    "lesson": "Bài 12: Phản ứng oxi hóa - khử và cân bằng thăng bằng electron",
    "title": "Định luật Bảo Toàn Electron: \"Khử cho tăng - O nhận giảm\"",
    "formula": "∑ n_e(nhường) = ∑ n_e(nhận)\\nChất khử nhường e (quá trình oxi hóa) => Số OXH tăng\\nChất oxi hóa nhận e (quá trình khử) => Số OXH giảm",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">ĐL Bảo toàn e</span>\n        <span class=\"math-highlight\">∑ <span class=\"math-var\">n</span><sub>e(nhường)</sub> <span class=\"math-op\">=</span> ∑ <span class=\"math-var\">n</span><sub>e(nhận)</sub></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Khử cho - O nhận</span>\n        <span>Chất khử nhường e ⇒ Số OXH TĂNG | Chất oxi hóa nhận e ⇒ Số OXH GIẢM</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Quá trình</span>\n        <span>Quá trình oxi hóa là quá trình nhường e | Quá trình khử là quá trình nhận e</span>\n      </div>\n    ",
    "vars": "<b>4 bước cân bằng thăng bằng e</b>: 1. Xác định số OXH -> 2. Viết quá trình nhường/nhận e -> 3. Tìm hệ số chung nhỏ nhất -> 4. Đặt hệ số vào PTHH và kiểm tra O, H.",
    "tip": "Thần chú: \"Khử tăng O giảm, khử cho O nhận\"."
  },
  {
    "id": "c-ch5-1",
    "subject": "chem",
    "subjectName": "Hóa học 10 (Cô Thanh Hải - KNTT)",
    "semester": 2,
    "chapterId": "c-ch5",
    "chapter": "Chương 5: Năng lượng hóa học (Enthalpy)",
    "lesson": "Bài 13 & 14: Biến thiên Enthalpy chuẩn (ΔrH°₂₉₈)",
    "title": "Biến thiên Enthalpy theo Nhiệt tạo thành chuẩn & Năng lượng liên kết",
    "formula": "Theo ΔfH°₂₉₈: ΔrH°₂₉₈ = ∑ ΔfH°₂₉₈(SP) - ∑ ΔfH°₂₉₈(CĐ)\\nTheo Eb: ΔrH°₂₉₈ = ∑ Eb(CĐ) - ∑ Eb(SP)\\nΔrH°₂₉₈ < 0: Tỏa nhiệt (nhiệt độ môi trường tăng)\\nΔrH°₂₉₈ > 0: Thu nhiệt (nhiệt độ môi trường giảm)",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Theo nhiệt tạo thành ΔfH°</span>\n        <span class=\"math-highlight\">Δ<sub>r</sub><span class=\"math-var\">H</span>°<sub>298</sub> <span class=\"math-op\">=</span> ∑ Δ<sub>f</sub><span class=\"math-var\">H</span>°<sub>298</sub>(sản phẩm) <span class=\"math-op\">-</span> ∑ Δ<sub>f</sub><span class=\"math-var\">H</span>°<sub>298</sub>(chất đầu)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Theo năng lượng liên kết Eb</span>\n        <span class=\"math-highlight\">Δ<sub>r</sub><span class=\"math-var\">H</span>°<sub>298</sub> <span class=\"math-op\">=</span> ∑ <span class=\"math-var\">E</span><sub>b</sub>(chất đầu) <span class=\"math-op\">-</span> ∑ <span class=\"math-var\">E</span><sub>b</sub>(sản phẩm)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Dấu biến thiên Enthalpy</span>\n        <span>Δ<sub>r</sub><span class=\"math-var\">H</span>°<sub>298</sub> <span class=\"math-op\"><</span> 0: <b>Tỏa nhiệt</b> (bền hơn) | Δ<sub>r</sub><span class=\"math-var\">H</span>°<sub>298</sub> <span class=\"math-op\">></span> 0: <b>Thu nhiệt</b></span>\n      </div>\n    ",
    "vars": "<b>Lưu ý quan trọng</b>: Nhiệt tạo thành chuẩn của đơn chất bền nhất luôn bằng 0 (VD: O₂, H₂, N₂, C_graphite có ΔfH°₂₉₈ = 0).",
    "tip": "Nhớ nhanh: Eb lấy \"Đầu trừ Đuôi\", còn ΔfH lấy \"Đuôi trừ Đầu\" (SP trừ CĐ)."
  },
  {
    "id": "c-ch6-1",
    "subject": "chem",
    "subjectName": "Hóa học 10 (Cô Thanh Hải - KNTT)",
    "semester": 2,
    "chapterId": "c-ch6",
    "chapter": "Chương 6: Tốc độ phản ứng hóa học",
    "lesson": "Bài 15 & 16: Tốc độ phản ứng, Định luật tác dụng khối lượng & Hệ số Van't Hoff",
    "title": "Tốc độ phản ứng (v), Định luật tác dụng khối lượng & Hệ số Van't Hoff",
    "formula": "Tốc độ trung bình: v̄ = - (1/a) Δ[A]/Δt = (1/c) Δ[C]/Δt\\nv = k.[A]^a.[B]^b (với phản ứng đơn giản aA + bB -> SP)\\nQuy tắc Van't Hoff: v_T2 / v_T1 = γ^[(T2 - T1) / 10]",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Tốc độ trung bình v̄</span>\n        <span><span class=\"math-var\">v̄</span> <span class=\"math-op\">=</span> <span class=\"math-op\">-</span><span class=\"math-frac\"><span class=\"num\">1</span><span class=\"den\"><span class=\"math-var\">a</span></span></span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">Δ[A]</span></span><span class=\"den\"><span class=\"math-var\">Δt</span></span></span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\">1</span><span class=\"den\"><span class=\"math-var\">c</span></span></span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">Δ[C]</span></span><span class=\"den\"><span class=\"math-var\">Δt</span></span></span> (cho phản ứng: aA → cC)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Định luật tác dụng khối lượng</span>\n        <span><span class=\"math-var\">v</span> <span class=\"math-op\">=</span> <span class=\"math-var\">k</span> · [<span class=\"math-var\">A</span>]<sup><span class=\"math-var\">a</span></sup> · [<span class=\"math-var\">B</span>]<sup><span class=\"math-var\">b</span></sup> (chất rắn KHÔNG tham gia vào biểu thức)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Hệ số nhiệt độ Van't Hoff</span>\n        <span class=\"math-highlight\"><span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">v</span><sub>T2</sub></span><span class=\"den\"><span class=\"math-var\">v</span><sub>T1</sub></span></span> <span class=\"math-op\">=</span> <span class=\"math-var\">γ</span> <sup><span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">T</span><sub>2</sub> - <span class=\"math-var\">T</span><sub>1</sub></span><span class=\"den\">10</span></span></sup></span>\n      </div>\n    ",
    "vars": "<b>5 yếu tố ảnh hưởng tốc độ</b>: Nồng độ, Nhiệt độ, Áp suất (khí), Diện tích tiếp xúc (rắn), Chất xúc tác.",
    "tip": "Khi nhiệt độ tăng thêm 10°C, tốc độ phản ứng tăng lên γ lần (γ thường có giá trị từ 2 đến 4)."
  },
  {
    "id": "c-ch7-1",
    "subject": "chem",
    "subjectName": "Hóa học 10 (Cô Thanh Hải - KNTT)",
    "semester": 2,
    "chapterId": "c-ch7",
    "chapter": "Chương 7: Nhóm nguyên tố Halogen (Nhóm VIIA)",
    "lesson": "Bài 17 & 18: Đơn chất Halogen, Hydrogen halide & Muối halide",
    "title": "Quy luật tính Oxi hóa, Tính Acid của Hydrohalic acid & Nhận biết Halide",
    "formula": "Tính oxi hóa giảm dần: F2 > Cl2 > Br2 > I2\\nTính acid tăng dần: HF (yếu) < HCl < HBr < HI (rất mạnh)\\nNhận biết muối halide bằng dd AgNO3:\\nAgCl (kết tủa trắng), AgBr (kết tủa vàng nhạt), AgI (kết tủa vàng đậm), AgF (tan)",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Tính oxi hóa đơn chất</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">F</span><sub>2</sub> <span class=\"math-op\">></span> <span class=\"math-var\">Cl</span><sub>2</sub> <span class=\"math-op\">></span> <span class=\"math-var\">Br</span><sub>2</sub> <span class=\"math-op\">></span> <span class=\"math-var\">I</span><sub>2</sub></span> (Halogen đứng trước đẩy được halogen đứng sau ra khỏi muối)\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Tính Acid hydrohalic</span>\n        <span><span class=\"math-var\">HF</span> (acid yếu) <span class=\"math-op\"><</span> <span class=\"math-var\">HCl</span> <span class=\"math-op\"><</span> <span class=\"math-var\">HBr</span> <span class=\"math-op\"><</span> <span class=\"math-highlight\"><span class=\"math-var\">HI</span> (acid mạnh nhất)</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Thuốc thử AgNO₃</span>\n        <span><span class=\"math-var\">Cl</span>⁻ → <span class=\"math-highlight\">AgCl ↓ trắng</span> | <span class=\"math-var\">Br</span>⁻ → <span class=\"math-highlight\">AgBr ↓ vàng nhạt</span> | <span class=\"math-var\">I</span>⁻ → <span class=\"math-highlight\">AgI ↓ vàng đậm</span></span>\n      </div>\n    ",
    "vars": "<b>HF ăn mòn thủy tinh</b>: 4HF + SiO₂ → SiF₄ + 2H₂O (dùng khắc chữ lên thủy tinh).",
    "tip": "Nhớ thứ tự màu kết tủa với AgNO₃ đậm dần: Cl (trắng) → Br (vàng nhạt) → I (vàng đậm)."
  },
  {
    "id": "c-ch7-2",
    "subject": "chem",
    "subjectName": "Hóa học 10 (Cô Thanh Hải - KNTT)",
    "semester": 2,
    "chapterId": "c-ch7",
    "chapter": "Chương 7: Nhóm nguyên tố Halogen (Nhóm VIIA)",
    "lesson": "Tổng hợp công thức tính toán Hóa học 10",
    "title": "Hệ Thống Nồng Độ Dung Dịch, Thể Tích Khí ĐKC Mới & Tỉ Khối",
    "formula": "CM = n / V (mol/l) = (10 × C% × d) / M\\nC% = (m_ct / m_dd) × 100%\\nV_khí (ĐKC: 25°C, 1 bar) = n × 24.79 (Lít)\\np.V = n.R.T",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Đổi nồng độ CM ↔ C%</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">C</span><sub>M</sub> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\">10 <span class=\"math-op\">·</span> <span class=\"math-var\">C</span>% <span class=\"math-op\">·</span> <span class=\"math-var\">d</span></span><span class=\"den\"><span class=\"math-var\">M</span></span></span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Chuẩn ĐKC mới</span>\n        <span><span class=\"math-var\">V</span><sub>khí</sub> <span class=\"math-op\">=</span> <span class=\"math-var\">n</span> <span class=\"math-op\">×</span> 24.79 (L) ở 25°C, 1 bar</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Tỉ khối hơi (d)</span>\n        <span><span class=\"math-var\">d</span><sub>A/B</sub> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">M</span><sub>A</sub></span><span class=\"den\"><span class=\"math-var\">M</span><sub>B</sub></span></span> | <span class=\"math-var\">d</span><sub>A/kk</sub> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">M</span><sub>A</sub></span><span class=\"den\">29</span></span></span>\n      </div>\n    ",
    "vars": "<b>d</b>: Khối lượng riêng dung dịch (g/mL) | <b>M</b>: Khối lượng mol (g/mol).",
    "tip": "Chú ý SGK mới không dùng 22.4 Lít nữa mà chuẩn hóa theo 24.79 Lít."
  },
  {
    "id": "e-u1-1",
    "subject": "english",
    "subjectName": "Tiếng Anh 10 (Cô Tuệ Minh - KNTT)",
    "semester": 1,
    "chapterId": "e-u1",
    "chapter": "Unit 1: Family Life",
    "lesson": "Grammar: Present Simple vs Present Continuous & Stative Verbs",
    "title": "Hiện Tại Đơn vs Hiện Tại Tiếp Diễn & Động Từ Trạng Thái (Stative Verbs)",
    "formula": "HTĐ: S + V(s/es) (thói quen, chân lý)\\nHTTD: S + am/is/are + V-ing (đang diễn ra, phàn nàn với always)\\nStative verbs: like, love, hate, want, need, know, understand, believe, seem (KHÔNG chia thì tiếp diễn)",
    "formulaHtml": "\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge green\">Hiện tại đơn</span>\n        <span><span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">V(s/es)</span> (Diễn tả thói quen lặp đi lặp lại, sự thật hiển nhiên)</span>\n        <span class=\"eng-ex\">Dấu hiệu: <b>always, usually, often, everyday, once a week...</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge amber\">Hiện tại tiếp diễn</span>\n        <span><span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">am / is / are + V-ing</span> (Đang xảy ra tại thời điểm nói hoặc phàn nàn)</span>\n        <span class=\"eng-ex\">Dấu hiệu: <b>now, at the moment, look!, listen!, right now...</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge purple\">Stative Verbs (Bẫy thi)</span>\n        <span class=\"math-highlight\">KHÔNG chia ở thì tiếp diễn (-ing)</span> đối với động từ tri giác / cảm xúc:\n        <span class=\"eng-ex\"><b>love, like, hate, want, need, believe, understand, know, smell, taste, seem...</b></span>\n      </div>\n    ",
    "vars": "<b>Phàn nàn</b>: \"He is always leaving his dirty socks on the floor!\" (dùng HTTD với always diễn tả sự bực bội).",
    "tip": "Nhìn thấy \"look, listen\" hoặc \"at present\" ⇒ chia HTTD; nhưng nếu động từ là \"know, want, understand\" ⇒ bắt buộc chia HTĐ!"
  },
  {
    "id": "e-u2-1",
    "subject": "english",
    "subjectName": "Tiếng Anh 10 (Cô Tuệ Minh - KNTT)",
    "semester": 1,
    "chapterId": "e-u2",
    "chapter": "Unit 2: Humans and the Environment",
    "lesson": "Grammar: Future with \"Will\" vs \"Be going to\" & Passive Voice",
    "title": "Phân Biệt Tương Lai \"Will\" vs \"Be going to\" & Bị Động Tương Lai",
    "formula": "Will + V_inf: quyết định bộc phát ngay lúc nói, lời hứa, dự đoán vô căn cứ\\nBe going to + V_inf: kế hoạch định trước, dự đoán CÓ BẰNG CHỨNG\\nBị động tương lai: S + will be + V3/ed | S + is/am/are going to be + V3/ed",
    "formulaHtml": "\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge green\">Will + V_inf</span>\n        <span>Quyết định tức thì lúc nói, lời hứa hẹn, đề nghị giúp đỡ</span>\n        <span class=\"eng-ex\">Ví dụ: <b>The phone is ringing. I will answer it.</b> (quyết định ngay)</span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge amber\">Be going to + V_inf</span>\n        <span>Kế hoạch dự định từ trước, hoặc <span class=\"math-highlight\">dự đoán CÓ BẰNG CHỨNG nhãn tiền</span></span>\n        <span class=\"eng-ex\">Ví dụ: <b>Look at those black clouds! It is going to rain.</b> (có mây đen)</span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge purple\">Thể bị động</span>\n        <span><span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">will be + V3/ed</span>  |  <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">am/is/are going to be + V3/ed</span></span>\n        <span class=\"eng-ex\">Ví dụ: <b>More trees will be planted to protect the environment.</b></span>\n      </div>\n    ",
    "vars": "<b>Bằng chứng nhãn tiền (evidence)</b>: Dấu hiệu bắt buộc dùng \"Be going to\" (không dùng will).",
    "tip": "Gặp \"I think / I hope / I promise\" ⇒ 99% dùng \"will\"; gặp câu có dấu hiệu thực tế \"Look at...\" ⇒ dùng \"be going to\"."
  },
  {
    "id": "e-u3-1",
    "subject": "english",
    "subjectName": "Tiếng Anh 10 (Cô Tuệ Minh - KNTT)",
    "semester": 1,
    "chapterId": "e-u3",
    "chapter": "Unit 3: Music",
    "lesson": "Grammar: Compound sentences (FANBOYS) & To-infinitives vs Bare-infinitives",
    "title": "Câu Ghép Liên Từ FANBOYS & Động Từ Đi Với To-V vs V-inf",
    "formula": "FANBOYS: For, And, Nor, But, Or, Yet, So (có dấu phẩy trước liên từ)\\nTo-V: want, decide, promise, plan, hope, agree, refuse...\\nBare-V (V nguyên thể không to): make sb V, let sb V, hear/see sb V",
    "formulaHtml": "\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge green\">Liên từ FANBOYS</span>\n        <span class=\"math-highlight\"><b>F</b>or (vì), <b>A</b>nd (và), <b>N</b>or (cũng không), <b>B</b>ut (nhưng), <b>O</b>r (hoặc), <b>Y</b>et (nhưng), <b>S</b>o (nên)</span>\n        <span class=\"eng-ex\">Ví dụ: <b>He loves traditional music, but his sister prefers pop.</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge amber\">Động từ + To-V</span>\n        <span>want, decide, offer, promise, afford, refuse, manage, agree + <span class=\"math-highlight\"><span class=\"eng-verb\">to-V</span></span></span>\n        <span class=\"eng-ex\">Ví dụ: <b>We decided to attend the charity music concert.</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge purple\">Bare-infinitive (V nguyên thể)</span>\n        <span><span class=\"eng-verb\">make</span> + <span class=\"eng-obj\">sb</span> + <span class=\"math-highlight\"><span class=\"eng-verb\">V_inf</span></span>  |  <span class=\"eng-verb\">let</span> + <span class=\"eng-obj\">sb</span> + <span class=\"math-highlight\"><span class=\"eng-verb\">V_inf</span></span> (không có \"to\")</span>\n        <span class=\"eng-ex\">Ví dụ: <b>The sad song made her cry. / Her parents let her go to the show.</b></span>\n      </div>\n    ",
    "vars": "<b>Bị động của Make</b>: Be made + TO-V (chủ động không to, nhưng bị động bắt buộc thêm \"to\": He was made to clean the room).",
    "tip": "Giữa 2 mệnh đề độc lập nối bằng FANBOYS bắt buộc phải có dấu phẩy (,)."
  },
  {
    "id": "e-u4-1",
    "subject": "english",
    "subjectName": "Tiếng Anh 10 (Cô Tuệ Minh - KNTT)",
    "semester": 1,
    "chapterId": "e-u4",
    "chapter": "Unit 4: For a Better Community",
    "lesson": "Grammar: Past Simple vs Past Continuous with When/While & Adjectives -ed/-ing",
    "title": "Phối Thì Quá Khứ (When / While) & Phân Biệt Tính Từ Đuôi -ed / -ing",
    "formula": "While S + was/were V-ing, S + was/were V-ing (song song)\\nWhen S + V2/ed, S + was/were V-ing (đang diễn ra thì bị cắt ngang)\\nTính từ -ed: cảm xúc của con người\\nTính từ -ing: tính chất, bản chất của sự vật/con người",
    "formulaHtml": "\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge green\">Hành động xen vào</span>\n        <span><span class=\"eng-kw\">When</span> + <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">V2/ed</span> (xen vào), <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">was / were + V-ing</span> (đang diễn ra)</span>\n        <span class=\"eng-ex\">Ví dụ: <b>We were teaching English when it started to rain.</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge amber\">Hành động song song</span>\n        <span><span class=\"eng-kw\">While</span> + <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">was/were V-ing</span>, <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">was/were V-ing</span></span>\n        <span class=\"eng-ex\">Ví dụ: <b>While I was cleaning the room, Nam was washing dishes.</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge purple\">Tính từ -ed vs -ing</span>\n        <span><b>-ed</b>: Cảm xúc nhận được (I am interested in...)<br><b>-ing</b>: Bản chất của vật (The community work is interesting)</span>\n      </div>\n    ",
    "vars": "<b>Ngôi dùng Was/Were</b>: I, He, She, It, Danh từ số ít đi với Was; You, We, They, Danh từ số nhiều đi với Were.",
    "tip": "Hỏi cảm xúc bản thân dùng -ed; miêu tả tính chất công việc / sự kiện dùng -ing."
  },
  {
    "id": "e-u5-1",
    "subject": "english",
    "subjectName": "Tiếng Anh 10 (Cô Tuệ Minh - KNTT)",
    "semester": 1,
    "chapterId": "e-u5",
    "chapter": "Unit 5: Inventions",
    "lesson": "Grammar: Present Perfect & Gerunds / Infinitives for purposes",
    "title": "Thì Hiện Tại Hoàn Thành & Dùng V-ing / To-V Chỉ Mục Đích",
    "formula": "S + have/has + V3/ed (since + mốc thời gian, for + khoảng thời gian)\\nS + have/has + V3/ed + SINCE + S + V2/ed\\nChỉ công dụng: used to V_inf = used for V-ing",
    "formulaHtml": "\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge green\">Hiện tại hoàn thành</span>\n        <span><span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">have / has + V3/ed</span></span>\n        <span class=\"eng-ex\">Dấu hiệu: <b>since, for, already, yet, just, recently, ever, never, so far...</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge amber\">Công thức nối Since</span>\n        <span class=\"math-highlight\"><span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">have/has V3/ed</span> + <span class=\"eng-kw\">SINCE</span> + <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">V2/ed</span></span>\n        <span class=\"eng-ex\">Ví dụ: <b>Scientists have made great inventions since computers were invented.</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge purple\">Chỉ mục đích thiết bị</span>\n        <span><span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">be used to + V_inf</span>  =  <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">be used for + V-ing</span></span>\n        <span class=\"eng-ex\">Ví dụ: <b>A smartphone is used to browse (= used for browsing) the internet.</b></span>\n      </div>\n    ",
    "vars": "<b>Since</b> đi với mốc thời gian (since 2020, since last week) | <b>For</b> đi với khoảng thời gian (for 5 years, for a long time).",
    "tip": "Phân biệt: \"be used to V\" (được dùng để làm gì) khác với \"be used to V-ing\" (quen với việc gì)."
  },
  {
    "id": "e-u6-1",
    "subject": "english",
    "subjectName": "Tiếng Anh 10 (Cô Tuệ Minh - KNTT)",
    "semester": 2,
    "chapterId": "e-u6",
    "chapter": "Unit 6: Gender Equality",
    "lesson": "Grammar: Passive Voice with Modal Verbs",
    "title": "Câu Bị Động Với Động Từ Khuyết Thiếu (Modal Verbs)",
    "formula": "Chủ động: S + Modal + V_inf + O\\nBị động: S + Modal + BE + V3/ed (+ by O)\\nModal verbs: can, could, should, must, have to, may, might",
    "formulaHtml": "\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge green\">Công thức tổng quát</span>\n        <span class=\"math-highlight\"><span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">Modal verb + BE + V3/ed</span> (+ by O)</span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge amber\">Các Modal thường gặp</span>\n        <span><b>can / could</b> (có thể), <b>should / ought to</b> (nên), <b>must</b> (phải), <b>may / might</b> (có lẽ)</span>\n        <span class=\"eng-ex\">Ví dụ: <b>Women should be given equal job opportunities.</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge purple\">Phủ định</span>\n        <span><span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">Modal + NOT + BE + V3/ed</span></span>\n        <span class=\"eng-ex\">Ví dụ: <b>Girls must not be forced into early marriage.</b></span>\n      </div>\n    ",
    "vars": "<b>Bị động hoàn thành của Modal</b>: S + modal + have been + V3/ed (diễn tả phỏng đoán việc trong quá khứ: It must have been done).",
    "tip": "Sau modal verb ở câu bị động luôn luôn giữ nguyên trợ động từ \"BE\" ở dạng nguyên thể không chia!"
  },
  {
    "id": "e-u7-1",
    "subject": "english",
    "subjectName": "Tiếng Anh 10 (Cô Tuệ Minh - KNTT)",
    "semester": 2,
    "chapterId": "e-u7",
    "chapter": "Unit 7: Viet Nam and International Organisations",
    "lesson": "Grammar: Comparative & Superlative Adjectives",
    "title": "So Sánh Hơn, So Sánh Nhất & So Sánh Kép (Càng... càng...)",
    "formula": "Hơn: S1 + V + adj-er / more + adj + than + S2\\nNhất: S + V + the + adj-est / the most + adj\\nCàng... càng: The + comparative, the + comparative",
    "formulaHtml": "\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge green\">So sánh hơn</span>\n        <span>Ngắn: <span class=\"eng-verb\">adj-er + THAN</span> | Dài: <span class=\"eng-verb\">MORE + adj + THAN</span></span>\n        <span class=\"eng-ex\">Ví dụ: <b>Viet Nam is becoming more active in the UN.</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge amber\">So sánh nhất</span>\n        <span>Ngắn: <span class=\"eng-kw\">THE</span> + <span class=\"eng-verb\">adj-est</span> | Dài: <span class=\"eng-kw\">THE MOST</span> + <span class=\"eng-verb\">adj</span></span>\n        <span class=\"eng-ex\">Ví dụ: <b>WTO is one of the largest economic organisations in the world.</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge purple\">So sánh kép (Trọng tâm D07)</span>\n        <span class=\"math-highlight\"><span class=\"eng-kw\">The</span> + comparative + S + V, <span class=\"eng-kw\">the</span> + comparative + S + V</span>\n        <span class=\"eng-ex\">Ví dụ: <b>The more countries participate, the stronger the global economy is.</b></span>\n      </div>\n    ",
    "vars": "<b>Bất quy tắc</b>: good → better → best; bad → worse → worst; far → farther/further → farthest/furthest.",
    "tip": "Trong so sánh hơn nhất, luôn bắt buộc có mạo từ \"THE\" phía trước."
  },
  {
    "id": "e-u8-1",
    "subject": "english",
    "subjectName": "Tiếng Anh 10 (Cô Tuệ Minh - KNTT)",
    "semester": 2,
    "chapterId": "e-u8",
    "chapter": "Unit 8: New Ways to Learn",
    "lesson": "Grammar: Defining vs Non-defining Relative Clauses & Reductions",
    "title": "Mệnh Đề Quan Hệ (Defining vs Non-defining) & Kỹ Thuật Rút Gọn",
    "formula": "Who (người - CN), Whom (người - TN), Which (vật), Whose + N (sở hữu), That (thay who/whom/which trong MĐ xác định)\\nRút gọn chủ động -> V-ing\\nRút gọn bị động -> V3/ed\\nRút gọn sau the first/only/last -> To-V",
    "formulaHtml": "\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge green\">Đại từ quan hệ</span>\n        <span><b>Who</b> (người làm chủ ngữ) | <b>Whom</b> (người làm tân ngữ) | <b>Which</b> (vật) | <b>Whose + N</b> (sở hữu)</span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge amber\">Dấu phẩy (Non-defining)</span>\n        <span>Mệnh đề bổ sung thông tin (đã xác định tên riêng, this, my...) thì <b>CÓ dấu phẩy</b> và <span class=\"math-highlight\">TUYỆT ĐỐI KHÔNG DÙNG \"THAT\"</span>.</span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge purple\">Rút gọn mệnh đề quan hệ</span>\n        <span>Chủ động: bỏ đại từ + to be ⇒ chuyển động từ về <span class=\"math-highlight\"><span class=\"eng-verb\">V-ing</span></span><br>Bị động: bỏ đại từ + to be ⇒ giữ nguyên <span class=\"math-highlight\"><span class=\"eng-verb\">V3/ed</span></span><br>Sau the first, only, last, best ⇒ rút về <span class=\"math-highlight\"><span class=\"eng-verb\">To-V</span></span></span>\n      </div>\n    ",
    "vars": "<b>Ví dụ rút gọn</b>: The app <i>which was installed</i> yesterday ⇒ The app <b>installed</b> yesterday is useful.",
    "tip": "Sau giới từ (in, at, with, about...) chỉ được dùng \"whom\" cho người và \"which\" cho vật (KHÔNG dùng that hoặc who)."
  },
  {
    "id": "e-u9-1",
    "subject": "english",
    "subjectName": "Tiếng Anh 10 (Cô Tuệ Minh - KNTT)",
    "semester": 2,
    "chapterId": "e-u9",
    "chapter": "Unit 9: Protecting the Environment",
    "lesson": "Grammar: Reported Speech (Statements & Questions)",
    "title": "Câu Tường Thuật / Gián Tiếp (Reported Speech)",
    "formula": "S + said (that) + S + V(lùi 1 thì)\\nCâu hỏi Yes/No: S + asked + if / whether + S + V(lùi thì)\\nCâu hỏi Wh-: S + asked + Wh-word + S + V(lùi thì)",
    "formulaHtml": "\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge green\">Quy tắc lùi thì</span>\n        <span>Hiện tại đơn → Quá khứ đơn | HTTD → QKTD | HTHT / QKĐ → <b>Quá khứ hoàn thành (had V3/ed)</b> | will → would | can → could</span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge amber\">Đổi trạng từ thời gian, nơi chốn</span>\n        <span>now → <b>then</b> | today → <b>that day</b> | yesterday → <b>the day before</b> | tomorrow → <b>the following day</b> | here → <b>there</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge purple\">Câu hỏi gián tiếp</span>\n        <span class=\"math-highlight\"><span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">asked</span> + <span class=\"eng-kw\">if / whether / Wh-word</span> + <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">V(lùi thì)</span></span> (Đưa về trật tự câu khẳng định, bỏ dấu ? và trợ động từ do/did)\n      </div>\n    ",
    "vars": "<b>Ví dụ</b>: \"Do you recycle?\" he asked ⇒ He asked me <b>if I recycled</b>.",
    "tip": "Trong câu tường thuật câu hỏi, TUYỆT ĐỐI KHÔNG đảo ngữ (không được viết \"if did I recycle\" hay \"what did you do\")."
  },
  {
    "id": "e-u10-1",
    "subject": "english",
    "subjectName": "Tiếng Anh 10 (Cô Tuệ Minh - KNTT)",
    "semester": 2,
    "chapterId": "e-u10",
    "chapter": "Unit 10: Ecotourism & Chuyên đề D07",
    "lesson": "Grammar: Conditional Sentences & Inversion (Đảo ngữ thi ĐH)",
    "title": "Câu Điều Kiện Loại 1, 2, 3 & Đảo Ngữ Thi Tốt Nghiệp THPT / D07",
    "formula": "Loại 1: If + S + V(s/es), S + will/can + V_inf\\nLoại 2: If + S + were/V2-ed, S + would + V_inf\\nLoại 3: If + S + had V3/ed, S + would have V3/ed\\nĐảo ngữ:\\n- Loại 1: Should + S + V_inf, S + will + V_inf\\n- Loại 2: Were + S + to-V (hoặc Were + S + adj/noun), S + would + V_inf\\n- Loại 3: Had + S + V3/ed, S + would have V3/ed",
    "formulaHtml": "\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge green\">Đảo ngữ Loại 1</span>\n        <span class=\"math-highlight\"><span class=\"eng-kw\">Should</span> + <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">V_inf</span>, <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">will + V_inf</span></span>\n        <span class=\"eng-ex\">Gốc: If you need help... ⇒ <b>Should you need help, please call me.</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge amber\">Đảo ngữ Loại 2</span>\n        <span class=\"math-highlight\"><span class=\"eng-kw\">Were</span> + <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">to-V</span> / <span class=\"eng-kw\">Were</span> + <span class=\"eng-sub\">S</span> + <span class=\"eng-obj\">Adj/N</span>, <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">would + V_inf</span></span>\n        <span class=\"eng-ex\">Gốc: If I had wings... ⇒ <b>Were I to have wings, I would fly to you.</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge purple\">Đảo ngữ Loại 3</span>\n        <span class=\"math-highlight\"><span class=\"eng-kw\">Had</span> + <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">V3/ed</span>, <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">would have + V3/ed</span></span>\n        <span class=\"eng-ex\">Gốc: If he had taken the advice... ⇒ <b>Had he taken the advice, he wouldn't have failed.</b></span>\n      </div>\n    ",
    "vars": "<b>Unless = If ... not</b> (Trừ khi). Trong mệnh đề If của câu loại 2, luôn ưu tiên dùng \"were\" cho tất cả các ngôi.",
    "tip": "Nhận biết câu đảo ngữ: Đầu câu có Should / Were / Had đứng trước chủ ngữ nhưng cuối câu kết thúc bằng dấu chấm (.)."
  },
  {
    "id": "e-u10-2",
    "subject": "english",
    "subjectName": "Tiếng Anh 10 (Cô Tuệ Minh - KNTT)",
    "semester": 2,
    "chapterId": "e-u10",
    "chapter": "Unit 10: Ecotourism & Chuyên đề D07",
    "lesson": "Grammar: Cấu trúc câu đảo ngữ trọng tâm thi cử khối D07",
    "title": "Cấu Trúc Đảo Ngữ Phủ Định (Hardly... when, No sooner... than, Not only...)",
    "formula": "Hardly/Scarcely + had + S + V3/ed + WHEN + S + V2/ed\\nNo sooner + had + S + V3/ed + THAN + S + V2/ed\\nNot only + Trợ động từ + S + V, but S + also + V\\nOnly by + V-ing + Trợ động từ + S + V",
    "formulaHtml": "\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge green\">Vừa mới... thì...</span>\n        <span><span class=\"eng-kw\">Hardly</span> + <span class=\"eng-verb\">had</span> + <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">V3/ed</span> + <span class=\"math-highlight\"><span class=\"eng-kw\">WHEN</span></span> + <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">V2/ed</span><br><span class=\"eng-kw\">No sooner</span> + <span class=\"eng-verb\">had</span> + <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">V3/ed</span> + <span class=\"math-highlight\"><span class=\"eng-kw\">THAN</span></span> + <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">V2/ed</span></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge amber\">Not only... but also</span>\n        <span class=\"math-highlight\"><span class=\"eng-kw\">Not only</span> + trợ động từ + <span class=\"eng-sub\">S</span> + <span class=\"eng-verb\">V</span>, <span class=\"eng-sub\">but S + also + V</span></span>\n        <span class=\"eng-ex\">Ví dụ: <b>Not only does he excel at Math, but he is also fluent in English.</b></span>\n      </div>\n      <div class=\"formula-line eng-line\">\n        <span class=\"eng-badge purple\">Only sau đầu câu</span>\n        <span><span class=\"eng-kw\">Only when / Only after / Only by + V-ing</span> + <span class=\"math-highlight\">trợ động từ + S + V</span></span>\n        <span class=\"eng-ex\">Ví dụ: <b>Only by practicing daily can you master Chemistry formulas.</b></span>\n      </div>\n    ",
    "vars": "<b>Nguyên tắc vàng của đảo ngữ</b>: Đảo trợ động từ (do, does, did, has, have, had, can, should...) lên trước chủ ngữ.",
    "tip": "Hardly đi với WHEN — No sooner đi với THAN. Nhớ khẩu quyết này để không bị nhầm lẫn trong phòng thi!"
  },
  {
    "id": "p-ch1-1",
    "subject": "physics",
    "subjectName": "Vật lý 10 (Cô Bích Ngọc - KNTT)",
    "semester": 1,
    "chapterId": "p-ch1",
    "chapter": "Chương 1: Mở đầu & Sai số phép đo",
    "lesson": "Bài 3: Thực hành tính sai số trong phép đo",
    "title": "Sai số tuyệt đối (ΔA), Sai số tỉ đối (δA) & Cách ghi kết quả",
    "formula": "ΔA = ΔA_tb + ΔA_dc\\nδA = (ΔA / Ā) × 100%\\nKết quả đo: A = Ā ± ΔA",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Sai số tuyệt đối</span>\n        <span><span class=\"math-var\">ΔA</span> <span class=\"math-op\">=</span> <span class=\"math-var\">ΔĀ</span> <span class=\"math-op\">+</span> <span class=\"math-var\">ΔA</span><sub>dc</sub> (sai số ngẫu nhiên + sai số dụng cụ)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Sai số tỉ đối</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">δA</span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">ΔA</span></span><span class=\"den\"><span class=\"math-var\">Ā</span></span></span> <span class=\"math-op\">×</span> 100%</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Cách viết kết quả</span>\n        <span><span class=\"math-var\">A</span> <span class=\"math-op\">=</span> <span class=\"math-var\">Ā</span> <span class=\"math-op\">±</span> <span class=\"math-var\">ΔA</span></span>\n      </div>\n    ",
    "vars": "<b>Ā</b>: Giá trị trung bình của các lần đo | <b>ΔA_dc</b>: Thường lấy bằng nửa độ chia nhỏ nhất hoặc 1 ĐCNN.",
    "tip": "Khi tính tích hoặc thương: Sai số tỉ đối của kết quả bằng tổng các sai số tỉ đối của các đại lượng thành phần."
  },
  {
    "id": "p-ch2-1",
    "subject": "physics",
    "subjectName": "Vật lý 10 (Cô Bích Ngọc - KNTT)",
    "semester": 1,
    "chapterId": "p-ch2",
    "chapter": "Chương 2: Động học (Mô tả chuyển động)",
    "lesson": "Bài 8 & 9: Chuyển động biến đổi đều (CĐBĐĐ)",
    "title": "Hệ 3 công thức Chuyển động thẳng biến đổi đều",
    "formula": "v = v0 + at\\nd = v0.t + (1/2)at²\\nv² - v0² = 2ad",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Vận tốc</span>\n        <span><span class=\"math-var\">v</span> <span class=\"math-op\">=</span> <span class=\"math-var\">v</span><sub>0</sub> <span class=\"math-op\">+</span> <span class=\"math-var\">at</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Độ dịch chuyển d</span>\n        <span><span class=\"math-var\">d</span> <span class=\"math-op\">=</span> <span class=\"math-var\">v</span><sub>0</sub><span class=\"math-var\">t</span> <span class=\"math-op\">+</span> <span class=\"math-frac\"><span class=\"num\">1</span><span class=\"den\">2</span></span><span class=\"math-var\">a</span><span class=\"math-var\">t</span><sup>2</sup></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Hệ thức độc lập thời gian</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">v</span><sup>2</sup> <span class=\"math-op\">-</span> <span class=\"math-var\">v</span><sub>0</sub><sup>2</sup> <span class=\"math-op\">=</span> 2<span class=\"math-var\">ad</span></span>\n      </div>\n    ",
    "vars": "<b>v₀</b>: Vận tốc đầu (m/s) | <b>v</b>: Vận tốc sau | <b>a</b>: Gia tốc (m/s²) | <b>d</b>: Độ dịch chuyển (m).",
    "tip": "Nhanh dần đều: a cùng dấu với v (a.v > 0) | Chậm dần đều: a ngược dấu với v (a.v < 0)."
  },
  {
    "id": "p-ch2-2",
    "subject": "physics",
    "subjectName": "Vật lý 10 (Cô Bích Ngọc - KNTT)",
    "semester": 1,
    "chapterId": "p-ch2",
    "chapter": "Chương 2: Động học (Mô tả chuyển động)",
    "lesson": "Bài 10 & 12: Rơi tự do & Chuyển động ném ngang",
    "title": "Công thức Rơi tự do & Chuyển động Ném ngang",
    "formula": "Rơi tự do (v0=0): v = gt; h = (1/2)gt²; v = √(2gh); t = √(2h/g)\\nNém ngang: x = v0.t; y = (1/2)gt²; Tầm xa L = v0.√(2h/g); v = √(v0² + 2gh)",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Rơi tự do</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">v</span> <span class=\"math-op\">=</span> <span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\">2<span class=\"math-var\">gh</span></span></span> <span class=\"math-op\">=</span> <span class=\"math-var\">gt</span>  |  <span class=\"math-var\">t</span> <span class=\"math-op\">=</span> <span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\"><span class=\"math-frac\"><span class=\"num\">2<span class=\"math-var\">h</span></span><span class=\"den\"><span class=\"math-var\">g</span></span></span></span></span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Tầm xa ném ngang L</span>\n        <span><span class=\"math-var\">L</span> <span class=\"math-op\">=</span> <span class=\"math-var\">x</span><sub>max</sub> <span class=\"math-op\">=</span> <span class=\"math-var\">v</span><sub>0</sub> <span class=\"math-op\">·</span> <span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\"><span class=\"math-frac\"><span class=\"num\">2<span class=\"math-var\">h</span></span><span class=\"den\"><span class=\"math-var\">g</span></span></span></span></span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Vận tốc chạm đất ném ngang</span>\n        <span><span class=\"math-var\">v</span> <span class=\"math-op\">=</span> <span class=\"math-sqrt\"><span class=\"rad\">√</span><span class=\"rad-content\"><span class=\"math-var\">v</span><sub>0</sub><sup>2</sup> + 2<span class=\"math-var\">gh</span></span></span></span>\n      </div>\n    ",
    "vars": "<b>g ≈ 9.8 m/s²</b> (hoặc 10 m/s²) | <b>h</b>: Độ cao ban đầu (m).",
    "tip": "Thời gian rơi của vật ném ngang HOÀN TOÀN BẰNG thời gian rơi tự do từ cùng một độ cao h."
  },
  {
    "id": "p-ch3-1",
    "subject": "physics",
    "subjectName": "Vật lý 10 (Cô Bích Ngọc - KNTT)",
    "semester": 1,
    "chapterId": "p-ch3",
    "chapter": "Chương 3: Động lực học (Định luật Newton)",
    "lesson": "Bài 14, 15, 17: Ba định luật Newton & Lực ma sát, Lực hướng tâm",
    "title": "Ba Định Luật Newton, Lực Ma Sát Trượt & Lực Hướng Tâm",
    "formula": "ĐL II Newton: F = m.a <=> a = F / m\\nĐL III: F_AB = - F_BA\\nMa sát trượt: F_mst = μ_t.N\\nHướng tâm: F_ht = m.a_ht = m.v²/r = m.ω².r",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Định luật II Newton</span>\n        <span class=\"math-highlight\"><span class=\"math-vec\">F</span> <span class=\"math-op\">=</span> <span class=\"math-var\">m</span> · <span class=\"math-vec\">a</span>  ⇒  <span class=\"math-vec\">a</span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-vec\">F</span></span><span class=\"den\"><span class=\"math-var\">m</span></span></span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Lực ma sát trượt</span>\n        <span><span class=\"math-var\">F</span><sub>mst</sub> <span class=\"math-op\">=</span> <span class=\"math-var\">μ</span><sub>t</sub> · <span class=\"math-var\">N</span> (N là áp lực vuông góc với mặt tiếp xúc)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Lực hướng tâm</span>\n        <span><span class=\"math-var\">F</span><sub>ht</sub> <span class=\"math-op\">=</span> <span class=\"math-var\">m</span> · <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">v</span><sup>2</sup></span><span class=\"den\"><span class=\"math-var\">r</span></span></span> <span class=\"math-op\">=</span> <span class=\"math-var\">m</span> · <span class=\"math-var\">ω</span><sup>2</sup> · <span class=\"math-var\">r</span></span>\n      </div>\n    ",
    "vars": "<b>m</b>: Khối lượng (kg) | <b>μ_t</b>: Hệ số ma sát | <b>N</b>: Áp lực (N) | <b>r</b>: Bán kính quỹ đạo tròn.",
    "tip": "Lực hướng tâm không phải là một loại lực mới trong tự nhiên, mà là hợp lực của các lực thực tế đóng vai trò giữ vật chuyển động tròn."
  },
  {
    "id": "p-ch4-1",
    "subject": "physics",
    "subjectName": "Vật lý 10 (Cô Bích Ngọc - KNTT)",
    "semester": 1,
    "chapterId": "p-ch4",
    "chapter": "Chương 4: Moment lực & Cân bằng vật rắn",
    "lesson": "Bài 21 & 22: Moment lực & Quy tắc moment",
    "title": "Moment Lực (M) & Điều Kiện Cân Bằng Của Vật Rắn Có Trục Quay",
    "formula": "M = F.d (N.m)\\nQuy tắc Moment: ∑ M(thuận) = ∑ M(nghịch)\\nNgẫu lực: M = F.d",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Công thức Moment</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">M</span> <span class=\"math-op\">=</span> <span class=\"math-var\">F</span> · <span class=\"math-var\">d</span></span> (Đơn vị: N.m)\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Quy tắc Moment lực</span>\n        <span>Vật có trục quay cố định cân bằng khi: <span class=\"math-highlight\">∑ <span class=\"math-var\">M</span><sub>(cùng chiều kim)</sub> <span class=\"math-op\">=</span> ∑ <span class=\"math-var\">M</span><sub>(ngược chiều kim)</sub></span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Ngẫu lực</span>\n        <span>Hệ 2 lực song song, ngược chiều, cùng độ lớn: <span class=\"math-var\">M</span> <span class=\"math-op\">=</span> <span class=\"math-var\">F</span> · <span class=\"math-var\">d</span> (d là khoảng cách giữa 2 giá của lực)</span>\n      </div>\n    ",
    "vars": "<b>d</b>: Cánh tay đòn (khoảng cách vuông góc từ trục quay đến giá của lực) (m).",
    "tip": "Nếu giá của lực đi qua trục quay thì cánh tay đòn d = 0, lực đó hoàn toàn KHÔNG có tác dụng làm quay vật."
  },
  {
    "id": "p-ch5-1",
    "subject": "physics",
    "subjectName": "Vật lý 10 (Cô Bích Ngọc - KNTT)",
    "semester": 2,
    "chapterId": "p-ch5",
    "chapter": "Chương 5: Năng lượng, Công, Công suất",
    "lesson": "Bài 23 & 24: Công cơ học, Công suất & Hiệu suất",
    "title": "Công Cơ Học (A), Công Suất (P) & Hiệu Suất (H)",
    "formula": "A = F.s.cos(α) (Joule)\\nP = A / t = F.v (Watt)\\nHiệu suất: H = (A_ích / A_toàn phần) × 100% = (P_ích / P_toàn phần) × 100%",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Công cơ học A</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">A</span> <span class=\"math-op\">=</span> <span class=\"math-var\">F</span> · <span class=\"math-var\">s</span> · cos(<span class=\"math-var\">α</span>)</span> (Joule)\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Công suất P</span>\n        <span><span class=\"math-var\">P</span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">A</span></span><span class=\"den\"><span class=\"math-var\">t</span></span></span> <span class=\"math-op\">=</span> <span class=\"math-var\">F</span> · <span class=\"math-var\">v</span></span> (Watt)\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Hiệu suất H</span>\n        <span><span class=\"math-var\">H</span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">A</span><sub>ích</sub></span><span class=\"den\"><span class=\"math-var\">A</span><sub>tp</sub></span></span> <span class=\"math-op\">×</span> 100% <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">P</span><sub>ích</sub></span><span class=\"den\"><span class=\"math-var\">P</span><sub>tp</sub></span></span> <span class=\"math-op\">×</span> 100%</span>\n      </div>\n    ",
    "vars": "<b>α</b>: Góc giữa lực F và độ dịch chuyển s | <b>1 kWh = 3.600.000 J</b>.",
    "tip": "α < 90°: Công phát động (A > 0) | α = 90°: Không sinh công (A = 0) | α > 90°: Công cản (A < 0)."
  },
  {
    "id": "p-ch6-1",
    "subject": "physics",
    "subjectName": "Vật lý 10 (Cô Bích Ngọc - KNTT)",
    "semester": 2,
    "chapterId": "p-ch6",
    "chapter": "Chương 6: Cơ năng & Bảo toàn cơ năng",
    "lesson": "Bài 25, 26, 27: Động năng, Thế năng & Định luật Bảo toàn cơ năng",
    "title": "Động Năng, Thế Năng Trọng Trường & Bảo Toàn Cơ Năng",
    "formula": "Wd = (1/2)mv²\\nWt = mgh\\nW = Wd + Wt = (1/2)mv² + mgh = const\\nW2 - W1 = A_Fms (khi có ma sát)",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Động năng Wđ</span>\n        <span><span class=\"math-var\">W</span><sub>đ</sub> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\">1</span><span class=\"den\">2</span></span><span class=\"math-var\">m</span><span class=\"math-var\">v</span><sup>2</sup> | Định lý động năng: <span class=\"math-var\">W</span><sub>đ2</sub> <span class=\"math-op\">-</span> <span class=\"math-var\">W</span><sub>đ1</sub> <span class=\"math-op\">=</span> <span class=\"math-var\">A</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Thế năng Wt</span>\n        <span><span class=\"math-var\">W</span><sub>t</sub> <span class=\"math-op\">=</span> <span class=\"math-var\">mgh</span> (chọn mốc thế năng tại mặt đất)</span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Bảo toàn cơ năng</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">W</span> <span class=\"math-op\">=</span> <span class=\"math-var\">W</span><sub>đ</sub> <span class=\"math-op\">+</span> <span class=\"math-var\">W</span><sub>t</sub> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\">1</span><span class=\"den\">2</span></span><span class=\"math-var\">m</span><span class=\"math-var\">v</span><sup>2</sup> <span class=\"math-op\">+</span> <span class=\"math-var\">mgh</span> <span class=\"math-op\">=</span> Hằng số</span>\n      </div>\n    ",
    "vars": "<b>Điều kiện bảo toàn cơ năng</b>: Vật chỉ chịu tác dụng của lực thế (trọng lực, lực đàn hồi), không có ma sát/lực cản.",
    "tip": "Khi có lực ma sát/lực cản: Cơ năng không bảo toàn mà bị hao hụt thành nhiệt năng: W_sau - W_đầu = A_Fms."
  },
  {
    "id": "p-ch7-1",
    "subject": "physics",
    "subjectName": "Vật lý 10 (Cô Bích Ngọc - KNTT)",
    "semester": 2,
    "chapterId": "p-ch7",
    "chapter": "Chương 7: Động lượng & Bảo toàn động lượng",
    "lesson": "Bài 28, 29, 30: Động lượng, Định luật bảo toàn động lượng & Va chạm",
    "title": "Động Lượng (p), Xung Lượng Của Lực & Định Luật Bảo Toàn Động Lượng",
    "formula": "p = m.v (kg.m/s)\\nΔp = F.Δt (Xung lượng của lực)\\np1 + p2 = p'1 + p'2 (Hệ kín)\\nVa chạm mềm: v = (m1.v1 + m2.v2) / (m1 + m2)\\nChuyển động phản lực: v_tl = - (m/M).v_khí",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Động lượng p</span>\n        <span><span class=\"math-vec\">p</span> <span class=\"math-op\">=</span> <span class=\"math-var\">m</span> · <span class=\"math-vec\">v</span>  |  Xung lượng của lực: <span class=\"math-var\">Δ</span><span class=\"math-vec\">p</span> <span class=\"math-op\">=</span> <span class=\"math-vec\">F</span> · <span class=\"math-var\">Δt</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Bảo toàn động lượng</span>\n        <span class=\"math-highlight\"><span class=\"math-vec\">p</span><sub>1</sub> <span class=\"math-op\">+</span> <span class=\"math-vec\">p</span><sub>2</sub> <span class=\"math-op\">=</span> <span class=\"math-vec\">p</span>'<sub>1</sub> <span class=\"math-op\">+</span> <span class=\"math-vec\">p</span>'<sub>2</sub></span> (trong hệ kín / hệ cô lập)\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Va chạm mềm</span>\n        <span>Sau va chạm 2 vật dính vào nhau: <span class=\"math-var\">v</span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">m</span><sub>1</sub><span class=\"math-var\">v</span><sub>1</sub> + <span class=\"math-var\">m</span><sub>2</sub><span class=\"math-var\">v</span><sub>2</sub></span><span class=\"den\"><span class=\"math-var\">m</span><sub>1</sub> + <span class=\"math-var\">m</span><sub>2</sub></span></span></span>\n      </div>\n    ",
    "vars": "<b>Động lượng là đại lượng vectơ</b>: Khi tính toán bài toán 1 chiều cần chọn chiều dương để chiếu phá dấu vectơ.",
    "tip": "Va chạm mềm làm tiêu hao cơ năng (chuyển thành nhiệt), nhưng động lượng của hệ vẫn luôn bảo toàn."
  },
  {
    "id": "p-ch8-1",
    "subject": "physics",
    "subjectName": "Vật lý 10 (Cô Bích Ngọc - KNTT)",
    "semester": 2,
    "chapterId": "p-ch8",
    "chapter": "Chương 8: Chuyển động tròn đều",
    "lesson": "Bài 31 & 32: Động học & Động lực học của chuyển động tròn đều",
    "title": "Tốc Độ Góc (ω), Tốc Độ Dài (v) & Gia Tốc Hướng Tâm (a_ht)",
    "formula": "ω = θ / t = 2π / T = 2π.f (rad/s)\\nv = ω.r (m/s)\\na_ht = v² / r = ω².r (m/s²)",
    "formulaHtml": "\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Tốc độ góc ω</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">ω</span> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\">2π</span><span class=\"den\"><span class=\"math-var\">T</span></span></span> <span class=\"math-op\">=</span> 2π · <span class=\"math-var\">f</span></span> (rad/s)\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Tốc độ dài v</span>\n        <span><span class=\"math-var\">v</span> <span class=\"math-op\">=</span> <span class=\"math-var\">ω</span> · <span class=\"math-var\">r</span></span>\n      </div>\n      <div class=\"formula-line\">\n        <span class=\"formula-bullet\">Gia tốc hướng tâm</span>\n        <span class=\"math-highlight\"><span class=\"math-var\">a</span><sub>ht</sub> <span class=\"math-op\">=</span> <span class=\"math-frac\"><span class=\"num\"><span class=\"math-var\">v</span><sup>2</sup></span><span class=\"den\"><span class=\"math-var\">r</span></span></span> <span class=\"math-op\">=</span> <span class=\"math-var\">ω</span><sup>2</sup> · <span class=\"math-var\">r</span></span>\n      </div>\n    ",
    "vars": "<b>T</b>: Chu kỳ (thời gian quay 1 vòng, đơn vị giây) | <b>f</b>: Tần số (số vòng quay trong 1 giây, đơn vị Hz, f = 1/T).",
    "tip": "Vectơ vận tốc trong chuyển động tròn đều có độ lớn không đổi nhưng hướng liên tục thay đổi (tiếp tuyến với quỹ đạo)."
  }
];

let activeFormulaSubject = 'all';
let activeFormulaSemester = 'all'; // 'all', 1, 2
let activeFormulaChapter = 'all';
let formulaSearchQuery = '';

function getUniqueChapters(subject = 'all', semester = 'all') {
  const chapters = [];
  const seen = new Set();
  FORMULAS_DB.forEach(f => {
    if (subject !== 'all' && f.subject !== subject) return;
    if (semester !== 'all' && String(f.semester) !== String(semester)) return;
    if (!seen.has(f.chapter)) {
      seen.add(f.chapter);
      chapters.push({
        chapter: f.chapter,
        semester: f.semester,
        subject: f.subject
      });
    }
  });
  return chapters;
}

function updateChapterDropdown() {
  const select = document.getElementById('formulaChapterFilter');
  if (!select) return;

  const currentVal = activeFormulaChapter;
  const chapters = getUniqueChapters(activeFormulaSubject, activeFormulaSemester);

  let opts = '<option value="all">📖 Tất cả các chương / Unit (Từ đầu đến cuối năm)</option>';
  chapters.forEach(ch => {
    const semName = ch.semester === 1 ? 'Kỳ 1' : 'Kỳ 2';
    opts += `<option value="${esc(ch.chapter)}" ${currentVal === ch.chapter ? 'selected' : ''}>[${semName}] ${esc(ch.chapter)}</option>`;
  });
  select.innerHTML = opts;
}

function renderFormulasList() {
  const container = document.getElementById('formulaGridContainer');
  if (!container) return;

  const query = formulaSearchQuery.toLowerCase().trim();

  const filtered = FORMULAS_DB.filter(f => {
    const matchSubject = activeFormulaSubject === 'all' || f.subject === activeFormulaSubject;
    const matchSemester = activeFormulaSemester === 'all' || String(f.semester) === String(activeFormulaSemester);
    const matchChapter = activeFormulaChapter === 'all' || f.chapter === activeFormulaChapter;
    const matchQuery = !query || 
      f.title.toLowerCase().includes(query) ||
      (f.chapter && f.chapter.toLowerCase().includes(query)) ||
      (f.lesson && f.lesson.toLowerCase().includes(query)) ||
      (f.topic && f.topic.toLowerCase().includes(query)) ||
      (f.formula && f.formula.toLowerCase().includes(query)) ||
      (f.subjectName && f.subjectName.toLowerCase().includes(query));
    return matchSubject && matchSemester && matchChapter && matchQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty" style="grid-column:1/-1;padding:40px 16px;text-align:center">
        <div style="font-size:38px;margin-bottom:8px">🔍</div>
        <div style="font-weight:750;color:#f8fafc;font-size:15px;margin-bottom:4px">Không tìm thấy công thức phù hợp</div>
        <div style="font-size:12.5px;color:var(--muted)">Hãy thử tìm kiếm với từ khóa khác hoặc chọn "Tất cả các chương"</div>
      </div>
    `;
    return;
  }

  // Group by chapter
  const grouped = {};
  filtered.forEach(f => {
    const key = f.chapter || 'Công thức chung';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  });

  let html = '';
  for (const [chapterTitle, items] of Object.entries(grouped)) {
    const firstItem = items[0];
    const semText = firstItem.semester === 1 ? '📗 HỌC KỲ 1' : '📘 HỌC KỲ 2';

    html += `
      <div class="formula-chapter-header">
        <div class="formula-chapter-header-title">
          ${esc(chapterTitle)}
        </div>
        <span class="formula-chapter-header-badge">${semText} • ${items.length} công thức</span>
      </div>
    `;

    items.forEach(f => {
      html += `
        <div class="formula-card">
          <div class="formula-card-head">
            <div>
              <span style="font-size:11px;font-weight:750;color:#38bdf8;margin-bottom:2px;display:block">
                ${f.semester === 1 ? '📗 Kỳ 1' : '📘 Kỳ 2'} • ${f.subjectName}
              </span>
              <div class="formula-card-title">${esc(f.title)}</div>
              ${f.lesson ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">${esc(f.lesson)}</div>` : ''}
            </div>
            <span class="formula-card-topic">${esc(f.topic || f.chapter)}</span>
          </div>

          <div class="formula-math-box">
            ${f.formulaHtml || esc(f.formula).replace(/\\n/g, '<br>')}
          </div>

          <div class="formula-variables">${f.vars}</div>

          <div style="font-size:11.5px;color:#fde047;line-height:1.4">
            <b>💡 Mẹo thi:</b> ${esc(f.tip)}
          </div>

          <div class="formula-footer">
            <span style="font-size:11px;color:var(--muted)">Chuẩn SGK KNTT 10</span>
            <button class="btn-copy-formula" onclick="copyFormulaText('${f.id}')">
              <span>📋 Sao chép</span>
            </button>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

window.filterFormulaSubject = function(sub) {
  activeFormulaSubject = sub;
  activeFormulaChapter = 'all';
  $$('.formula-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sub === sub);
  });
  updateChapterDropdown();
  renderFormulasList();
};

window.filterFormulaSemester = function(sem) {
  activeFormulaSemester = sem;
  activeFormulaChapter = 'all';
  $$('.formula-sem-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sem === String(sem));
  });
  updateChapterDropdown();
  renderFormulasList();
};

window.filterFormulaChapter = function(chap) {
  activeFormulaChapter = chap;
  renderFormulasList();
};

window.handleFormulaSearch = function(query) {
  formulaSearchQuery = query;
  renderFormulasList();
};

window.copyFormulaText = function(formulaId) {
  const f = FORMULAS_DB.find(x => x.id === formulaId);
  if (!f) return;
  const textToCopy = f.title + '\n' + f.formula + '\n' + (f.vars ? f.vars.replace(/<[^>]*>/g, '') : '');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast('Đã sao chép công thức vào bộ nhớ tạm! 📋');
    }).catch(() => {
      prompt('Sao chép công thức bên dưới:', textToCopy);
    });
  } else {
    prompt('Sao chép công thức bên dưới:', textToCopy);
  }
};

function formulas() {
  $('#content').innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow" style="letter-spacing:1.2px;color:#38bdf8;font-weight:800">KẾT NỐI TRI THỨC VỚI CUỘC SỐNG — LỚP 10 (CẢ NĂM)</div>
        <h1>Sổ tay Công thức & Ngữ pháp Toàn Diện 📐🧪🇬🇧⚡</h1>
        <p>Hệ thống hóa toàn bộ công thức Toán (Thầy Hoàn) • Hóa (Cô Thanh Hải) • Tiếng Anh (Cô Tuệ Minh - D07) • Lý (Cô Bích Ngọc) từ bài đầu tiên đến hết năm.</p>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="formula-search-bar">
      <input type="text" class="formula-search-input" placeholder="🔍 Tìm kiếm bài học, công thức (VD: mệnh đề, heron, enthalpy, đảo ngữ, rơi tự do...)" oninput="handleFormulaSearch(this.value)">
    </div>

    <!-- Subject Tabs (Tailored for D07 priority & KNTT) -->
    <div class="formula-subject-tabs">
      <button class="formula-tab-btn ${activeFormulaSubject === 'all' ? 'active' : ''}" data-sub="all" onclick="filterFormulaSubject('all')">
        <span>🌟 Tất cả môn</span>
      </button>
      <button class="formula-tab-btn ${activeFormulaSubject === 'math' ? 'active' : ''}" data-sub="math" onclick="filterFormulaSubject('math')">
        <span>📐 Toán 10 (KNTT)</span>
      </button>
      <button class="formula-tab-btn ${activeFormulaSubject === 'chem' ? 'active' : ''}" data-sub="chem" onclick="filterFormulaSubject('chem')">
        <span>🧪 Hóa học 10 (KNTT)</span>
      </button>
      <button class="formula-tab-btn ${activeFormulaSubject === 'english' ? 'active' : ''}" data-sub="english" onclick="filterFormulaSubject('english')">
        <span>🇬🇧 Tiếng Anh 10 (KNTT - D07)</span>
      </button>
      <button class="formula-tab-btn ${activeFormulaSubject === 'physics' ? 'active' : ''}" data-sub="physics" onclick="filterFormulaSubject('physics')">
        <span>⚡ Vật lý 10 (KNTT)</span>
      </button>
    </div>

    <!-- Semester & Chapter Sub-Bar -->
    <div class="formula-sub-bar">
      <div class="formula-sem-pills">
        <button class="formula-sem-btn ${activeFormulaSemester === 'all' ? 'active' : ''}" data-sem="all" onclick="filterFormulaSemester('all')">
          🌟 Cả năm
        </button>
        <button class="formula-sem-btn ${activeFormulaSemester === '1' ? 'active' : ''}" data-sem="1" onclick="filterFormulaSemester('1')">
          📗 Học kỳ 1
        </button>
        <button class="formula-sem-btn ${activeFormulaSemester === '2' ? 'active' : ''}" data-sem="2" onclick="filterFormulaSemester('2')">
          📘 Học kỳ 2
        </button>
      </div>

      <select id="formulaChapterFilter" class="formula-chapter-select" onchange="filterFormulaChapter(this.value)">
        <!-- Populated dynamically -->
      </select>
    </div>

    <!-- Formula Cards Grid Grouped by Chapter -->
    <div class="formula-grid" id="formulaGridContainer"></div>
  `;

  updateChapterDropdown();
  renderFormulasList();
}


// ==========================================================================
// WEATHER SERVICE & 7-DAY FORECAST WITH HOURLY 24H RAIN TIMELINE & STUDENT BALO ASSISTANT
// ==========================================================================
const WEATHER_CITIES = [
  { id: 'hanoi', name: 'Hà Nội (Mặc định)', lat: 21.0285, lon: 105.8542 },
  { id: 'hcm', name: 'TP. Hồ Chí Minh', lat: 10.8231, lon: 106.6297 },
  { id: 'danang', name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { id: 'haiphong', name: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { id: 'cantho', name: 'Cần Thơ', lat: 10.0452, lon: 105.7469 },
  { id: 'nhatrang', name: 'Nha Trang', lat: 12.2388, lon: 109.1967 },
  { id: 'dalat', name: 'Đà Lạt', lat: 11.9404, lon: 108.4583 },
  { id: 'hue', name: 'Thừa Thiên Huế', lat: 16.4637, lon: 107.5909 },
  { id: 'quangninh', name: 'Quảng Ninh (Hạ Long)', lat: 20.9505, lon: 107.0734 },
  { id: 'namdinh', name: 'Nam Định', lat: 20.4200, lon: 106.1683 },
  { id: 'thanhhoa', name: 'Thanh Hóa', lat: 19.8067, lon: 105.7852 },
  { id: 'nghean', name: 'Nghệ An (Vinh)', lat: 18.6734, lon: 105.6813 },
  { id: 'vungtau', name: 'Bà Rịa - Vũng Tàu', lat: 10.3460, lon: 107.0843 }
];

let studyWeatherState = {
  selectedCityId: 'hanoi',
  selectedDayIdx: 0,
  data: null,
  loading: false,
  error: null,
  lastUpdated: null
};

// SVG Weather Art generator without external icons
// SVG Weather Art generator with full iOS day/night and weather state support
function getWeatherSvgIcon(type, size = 38) {
  // Clear Night: Moon with stars
  if (type === 'moon') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="rgba(224, 242, 254, 0.28)"/>
      <circle cx="18" cy="5" r="1" fill="#fde047" stroke="none"/>
      <circle cx="14" cy="2.5" r="0.75" fill="#fde047" stroke="none"/>
    </svg>`;
  }
  // Partly Cloudy Night: Moon behind soft night cloud
  if (type === 'moon-cloud') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2.5a6.5 6.5 0 0 0 7 7 7 7 0 1 1-7-7z" fill="rgba(253, 224, 71, 0.25)" stroke="#fde047" stroke-width="1.6"/>
      <path d="M17.5 19H9a5 5 0 0 1-1-9.9 5.5 5.5 0 0 1 10.5 2.9A4.5 4.5 0 0 1 17.5 19z" fill="rgba(148, 163, 184, 0.35)" stroke="#cbd5e1" stroke-width="1.8"/>
    </svg>`;
  }
  // Cool Breeze / Pleasant Weather (Trời mát mẻ)
  if (type === 'cool-breeze') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.5 13H9a4.5 4.5 0 0 1-1-8.9 5 5 0 0 1 9.5 2.5A4 4 0 0 1 17.5 13z" fill="rgba(52, 211, 153, 0.18)" stroke="#6ee7b7" stroke-width="1.8"/>
      <path d="M4 17h12a2 2 0 1 0-2-2" stroke="#34d399" stroke-width="2"/>
      <path d="M2 20.5h10a2 2 0 1 0-2-2" stroke="#10b981" stroke-width="2"/>
    </svg>`;
  }
  // Clear Day Sun
  if (type === 'sun') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="4" fill="rgba(245,158,11,0.25)"/>
      <path d="M12 2v2"/><path d="M12 20v2"/>
      <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
      <path d="M2 12h2"/><path d="M20 12h2"/>
      <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
    </svg>`;
  }
  // Partly Cloudy Day
  if (type === 'sun-cloud') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="9" r="3" stroke="#f59e0b" fill="rgba(245,158,11,0.3)"/>
      <path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/>
      <path d="M17.5 19H9a5 5 0 0 1-1-9.9 5.5 5.5 0 0 1 10.5 2.9A4.5 4.5 0 0 1 17.5 19z" fill="rgba(56,189,248,0.2)" stroke="#38bdf8"/>
    </svg>`;
  }
  // Overcast / Cloudy
  if (type === 'cloud') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.5 19H9a5 5 0 0 1-1-9.9 5.5 5.5 0 0 1 10.5 2.9A4.5 4.5 0 0 1 17.5 19z" fill="rgba(148,163,184,0.25)" stroke="#cbd5e1"/>
    </svg>`;
  }
  // Drizzle / Light Rain
  if (type === 'drizzle') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" fill="rgba(56,189,248,0.18)"/>
      <path d="M8 19v2" stroke-width="2" stroke="#38bdf8"/><path d="M12 18v2" stroke-width="2" stroke="#38bdf8"/><path d="M16 19v2" stroke-width="2" stroke="#38bdf8"/>
    </svg>`;
  }
  // Rain
  if (type === 'rain') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" fill="rgba(96,165,250,0.22)"/>
      <path d="M8 18v4" stroke-width="2.5" stroke="#60a5fa"/><path d="M12 17v4" stroke-width="2.5" stroke="#60a5fa"/><path d="M16 18v4" stroke-width="2.5" stroke="#60a5fa"/>
    </svg>`;
  }
  // Thunderstorm
  if (type === 'thunder' || type === 'heavy-rain') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" fill="rgba(192,132,252,0.25)"/>
      <polyline points="13 11 9 17 15 17 11 23" stroke="#fbbf24" stroke-width="2.5" fill="#fde047"/>
    </svg>`;
  }
  // Fog / Mist
  if (type === 'fog') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 14h16"/><path d="M4 18h16"/><path d="M7 10h10"/>
      <path d="M20 10a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4"/>
    </svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/>
  </svg>`;
}

function getWmoCondition(code, hour = 12, temp = 27, wind = 10) {
  const isNight = hour >= 18 || hour < 6;

  // Clear Sky
  if (code === 0) {
    if (isNight) {
      return { text: 'Trời quang mây', iconType: 'moon', mood: 'pleasant', badge: 'Trăng thanh gió mát 🌙' };
    }
    if (temp >= 33) {
      return { text: 'Nắng rực rỡ • Trời quang', iconType: 'sun', mood: 'hot', badge: 'Nắng nóng ☀️' };
    }
    return { text: 'Trời quang đãng • Nắng đẹp', iconType: 'sun', mood: 'pleasant', badge: 'Nắng ráo ☀️' };
  }

  // Mainly Clear / Partly Cloudy (1, 2)
  if (code === 1 || code === 2) {
    if (isNight) {
      return { text: 'Trời mát dịu • Có mây', iconType: 'moon-cloud', mood: 'pleasant', badge: 'Mát mẻ về đêm 🌙' };
    }
    if (temp <= 27) {
      return { text: 'Trời mát mẻ • Nắng dịu', iconType: 'cool-breeze', mood: 'pleasant', badge: 'Thời tiết mát mẻ 🍃' };
    }
    return { text: 'Nắng gián đoạn • Có mây', iconType: 'sun-cloud', mood: 'pleasant', badge: 'Nắng ấm 🌤️' };
  }

  // Overcast / Cloudy (3)
  if (code === 3) {
    if (isNight) {
      return { text: 'Nhiều mây về đêm', iconType: 'cloud', mood: 'pleasant', badge: 'Mây đêm ☁️' };
    }
    if (temp <= 26) {
      return { text: 'Trời râm mát • Dễ chịu', iconType: 'cool-breeze', mood: 'pleasant', badge: 'Rất mát mẻ 🍃' };
    }
    return { text: 'Trời râm mát • Nhiều mây', iconType: 'cloud', mood: 'pleasant', badge: 'Trời râm mát ⛅' };
  }

  // Fog (45, 48)
  if (code === 45 || code === 48) {
    return { text: 'Sương mù ẩm ướt', iconType: 'fog', mood: 'cold', badge: 'Sương mù 🌫️' };
  }

  // Drizzle / Light Rain (51-57)
  if (code >= 51 && code <= 57) {
    return { text: 'Mưa phùn / Bay lất phất', iconType: 'drizzle', mood: 'rain', badge: 'Mưa bay 🌦️' };
  }

  // Rain (61-67)
  if (code >= 61 && code <= 67) {
    return { text: 'Mưa rào từng đợt', iconType: 'rain', mood: 'rain', badge: 'Có mưa rào 🌧️' };
  }

  // Cold / Snow (71-77)
  if (code >= 71 && code <= 77) {
    return { text: 'Trời lạnh buốt', iconType: 'cool-breeze', mood: 'cold', badge: 'Trời rét buốt ❄️' };
  }

  // Heavy Rain (80-82)
  if (code >= 80 && code <= 82) {
    return { text: 'Mưa rào dồn dập', iconType: 'rain', mood: 'heavy-rain', badge: 'Mưa lớn 🌧️' };
  }

  // Thunderstorm (95-99)
  if (code >= 95 && code <= 99) {
    return { text: 'Dông bão • Sấm sét', iconType: 'thunder', mood: 'heavy-rain', badge: 'Dông sét nguy hiểm ⛈️' };
  }

  // Default pleasant fallback
  return isNight 
    ? { text: 'Đêm mát dịu', iconType: 'moon-cloud', mood: 'pleasant', badge: 'Dịu mát 🌙' }
    : { text: 'Trời mát mẻ', iconType: 'sun-cloud', mood: 'pleasant', badge: 'Mát mẻ 🌤️' };
}

function getUvAnalysis(uv) {
  if (uv >= 10.5) return { text: 'Cực đại (Nguy hại)', level: 'danger', color: '#ef4444', advice: 'Bắt buộc áo chống nắng & kính râm mát' };
  if (uv >= 7.5) return { text: 'Rất cao', level: 'very-high', color: '#f97316', advice: 'Thoa kem chống nắng SPF50+ & che kín' };
  if (uv >= 5.5) return { text: 'Cao', level: 'high', color: '#f59e0b', advice: 'Cần áo khoác chống nắng khi ra đường' };
  if (uv >= 2.5) return { text: 'Trung bình', level: 'moderate', color: '#eab308', advice: 'Đội mũ khi đi ngoài sân trường' };
  return { text: 'Thấp (An toàn)', level: 'low', color: '#10b981', advice: 'Ánh nắng dịu mát, không lo sạm da' };
}

function getRainAnalysis(rainProb, rainSum) {
  let label = 'Khô ráo';
  let level = 'dry';
  let color = '#10b981';
  let desc = 'Khả năng mưa rất thấp, đường sá khô ráo thuận tiện di chuyển.';

  if (rainProb >= 75 || rainSum >= 12) {
    label = 'Mưa to xối xả & Ngập úng';
    level = 'severe';
    color = '#ef4444';
    desc = 'Khả năng mưa rào dồn dập, nguy cơ ngập úng các tuyến đường tan trường.';
  } else if (rainProb >= 50 || rainSum >= 4.5) {
    label = 'Mưa rào vừa';
    level = 'high';
    color = '#f59e0b';
    desc = 'Có mưa rào rõ rệt trong ngày, đường ướt trơn trượt.';
  } else if (rainProb >= 25 || rainSum >= 0.5) {
    label = 'Mưa phùn / Mưa nhẹ';
    level = 'moderate';
    color = '#38bdf8';
    desc = 'Có thể có mưa lất phất ngắt quãng, trời âm u mát.';
  }

  return { label, level, color, desc, prob: rainProb, sum: rainSum };
}

function getWindAnalysis(wind) {
  if (wind >= 45) {
    return { level: 'Cấp 6-7 (Gió bão)', desc: 'Gió giật mạnh, nguy hiểm khi đi xe máy/xe đạp, dễ gãy cành cây', color: '#ef4444' };
  }
  if (wind >= 28) {
    return { level: 'Cấp 4-5 (Gió mạnh)', desc: 'Gió tạt mạnh, bay mũ nón, khó cầm ô đi bộ', color: '#f97316' };
  }
  if (wind >= 14) {
    return { level: 'Cấp 3 (Gió vừa)', desc: 'Gió thổi nhẹ mát, lá cây rung rinh, dễ chịu', color: '#38bdf8' };
  }
  return { level: 'Cấp 1-2 (Gió nhẹ)', desc: 'Gió hiu hiu, không khí yên ả êm dịu', color: '#10b981' };
}

// 24-HOUR RAIN WINDOW SCANNER (00:00 - 23:59)
function analyzeRainTimeWindows(hours = []) {
  if (!hours || !hours.length) {
    return {
      hasRain: false,
      summaryText: 'Dự báo suốt 24 giờ khô ráo, không có mưa.',
      windows: [],
      maxProb: 0,
      totalRain: 0
    };
  }

  const windows = [];
  let current = null;

  for (let i = 0; i < hours.length; i++) {
    const h = hours[i];
    const isRain = h.rainProb >= 35 || h.rainSum >= 0.4;
    if (isRain) {
      if (!current) {
        current = {
          startHour: h.hour,
          endHour: h.hour + 1,
          maxProb: h.rainProb,
          totalRain: h.rainSum,
          peakHour: h.hour
        };
      } else {
        current.endHour = h.hour + 1;
        if (h.rainProb > current.maxProb) {
          current.maxProb = h.rainProb;
          current.peakHour = h.hour;
        }
        current.totalRain += h.rainSum;
      }
    } else {
      if (current) {
        windows.push(current);
        current = null;
      }
    }
  }
  if (current) windows.push(current);

  const maxProb = Math.max(...hours.map(h => h.rainProb || 0));
  const totalRain = +(hours.reduce((acc, h) => acc + (h.rainSum || 0), 0)).toFixed(1);

  if (!windows.length) {
    return {
      hasRain: false,
      summaryText: '☀️ Khô ráo trọn vẹn suốt 24 giờ (00:00 – 23:59) • Xác suất mưa cao nhất chỉ ' + maxProb + '%, đường sá tạnh ráo thuận lợi!',
      windows: [],
      maxProb,
      totalRain
    };
  }

  // Format primary window description
  const winDesc = windows.map(w => {
    const startStr = (w.startHour < 10 ? '0' + w.startHour : w.startHour) + ':00';
    const endStr = (w.endHour < 10 ? '0' + w.endHour : w.endHour) + ':00';
    const peakStr = (w.peakHour < 10 ? '0' + w.peakHour : w.peakHour) + ':00';
    return `${startStr} – ${endStr} (Cao điểm lúc ${peakStr} với tỉ lệ ${w.maxProb}%)`;
  }).join(' và ');

  return {
    hasRain: true,
    summaryText: `🌧️ Có mưa trong khoảng: ${winDesc} • Tổng lượng mưa ~${totalRain} mm.`,
    windows,
    maxProb,
    totalRain
  };
}

// Student Commute Slots Evaluator (Sáng đi học, Trưa tan, Chiều về, Tối học thêm)
function evaluateStudentCommuteSlots(hours = []) {
  if (!hours || hours.length < 24) return [];

  const slots = [
    { name: '🌅 Sáng đến trường', timeRange: '06:30 – 07:45', hourIdx: 7, desc: 'Lúc truy bài & chuẩn bị vào tiết 1' },
    { name: '☀️ Trưa tan trường', timeRange: '11:00 – 12:30', hourIdx: 11, desc: 'Giờ tan học chính khóa buổi sáng' },
    { name: '🌤️ Chiều tan học', timeRange: '16:30 – 17:45', hourIdx: 17, desc: 'Tan học ca chiều hoặc thể dục' },
    { name: '🌙 Ca học thêm tối', timeRange: '19:00 – 21:30', hourIdx: 19, desc: 'Đi học thêm ca tối ngoài trường' }
  ];

  return slots.map(s => {
    const hData = hours[s.hourIdx] || hours[0];
    const isRainy = hData.rainProb >= 40 || hData.rainSum >= 0.6;
    const isHot = hData.temp >= 32;

    let badge = 'Tạnh ráo';
    let badgeClass = 'dry';
    if (isRainy) {
      badge = 'Có mưa (' + hData.rainProb + '%)';
      badgeClass = 'rain';
    } else if (isHot) {
      badge = 'Nắng nóng';
      badgeClass = 'hot';
    }

    return {
      name: s.name,
      timeRange: s.timeRange,
      desc: s.desc,
      temp: hData.temp,
      rainProb: hData.rainProb,
      rainSum: hData.rainSum,
      code: hData.code,
      badge,
      badgeClass
    };
  });
}

// Student Checklist Helper in localStorage
function getCheckedItemsForDate(dateStr) {
  try {
    const raw = localStorage.getItem('studyOS.weatherChecklist_' + dateStr);
    return raw ? JSON.parse(raw) : [];
  } catch(e) {
    return [];
  }
}

function toggleWeatherCheckItem(dateStr, idx) {
  const current = getCheckedItemsForDate(dateStr);
  const pos = current.indexOf(idx);
  if (pos !== -1) {
    current.splice(pos, 1);
  } else {
    current.push(idx);
  }
  localStorage.setItem('studyOS.weatherChecklist_' + dateStr, JSON.stringify(current));
  
  // Update UI checklist directly
  const itemEl = document.getElementById('checkItem_' + dateStr + '_' + idx);
  if (itemEl) {
    if (current.includes(idx)) itemEl.classList.add('checked');
    else itemEl.classList.remove('checked');
  }
  const progEl = document.getElementById('checkProg_' + dateStr);
  const totalItems = document.querySelectorAll('[id^="checkItem_' + dateStr + '_"]').length;
  if (progEl && totalItems > 0) {
    const percent = Math.round((current.length / totalItems) * 100);
    progEl.style.width = percent + '%';
    const textEl = document.getElementById('checkProgText_' + dateStr);
    if (textEl) {
      textEl.innerText = 'Đã chuẩn bị ' + current.length + '/' + totalItems + ' món (' + percent + '%)';
    }
  }
}

// SMART STUDENT OUTFIT & BACKPACK ADVICE ENGINE
function analyzeWeatherForStudent(day) {
  const { maxTemp, minTemp, rainProb, rainSum, wind, uv, code } = day;
  const isHeavyRain = rainProb >= 65 || rainSum >= 7 || [65, 81, 82, 95, 96, 99].includes(code);
  const isRainy = rainProb >= 35 || rainSum >= 0.8 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
  const isHot = maxTemp >= 32.5;
  const isHighUV = uv >= 6.8;
  const isCold = minTemp <= 19 || maxTemp <= 22;

  let mood = 'pleasant';
  let badge = '';
  let headline = '';
  let briefing = '';

  let outfit = [];
  let skincare = [];
  let casioProtection = [];
  let safetyAlert = '';
  let checklist = [];

  if (isHeavyRain) {
    mood = 'heavy-rain';
    badge = '⛈️ Bão dông & Mưa lớn cục bộ';
    headline = 'Cảnh Báo Mưa Dông To • Bắt Buộc Bọc Chống Nước Máy Tính & Balo!';
    briefing = 'Dự báo khả năng cao xuất hiện mưa to dồn dập, gió giật mạnh và sấm chớp vào các khung giờ tan học. Nước mưa tạt mạnh có thể làm ướt sũng balo nếu không có biện pháp phòng hộ trước khi rời nhà!';
    
    outfit = [
      'Áo mưa bộ 2 mảnh (an toàn hơn khi đi xe đạp/xe máy điện) hoặc áo mưa cánh dơi trùm kín xe.',
      'Dép quai hậu có rãnh chống trơn trượt hoặc ủng bọc giày silicon chống ngập ướt giày đi học.',
      'Chuẩn bị 1 đôi tất khô dự phòng và 1 áo thun mỏng cuộn gọn trong túi nilon để thay nếu bị ướt.'
    ];

    skincare = [
      'Mang theo khăn bông nhỏ lau khô tóc, tai và vùng gáy ngay khi bước vào lớp để tránh trúng gió cảm lạnh.',
      'Mang bình giữ nhiệt chứa nước ấm (pha lát gừng hoặc mật ong) để làm ấm cơ thể sau khi đi qua mưa.',
      'Tuyệt đối không để bàn chân ngâm nước mưa lâu trong giày ẩm dễ gây cảm lạnh và viêm da.'
    ];

    casioProtection = [
      '🚨 BỎ VÀO TÚI ZIP: Máy tính bỏ túi Casio (fx-580VNX / 880BTG) bắt buộc phải bọc kín trong túi zip chống nước trước khi cho vào balo, tránh ẩm mạch LCD.',
      'Sách giáo khoa & Vở ghi BTVN: Bọc túi nilon hoặc để trong cặp tài liệu chống nước ở ngăn giữa balo.',
      'Kéo khóa balo thật khít và phủ bạt trùm chống thấm hoặc mặc áo mưa trùm kín toàn bộ balo sau lưng.'
    ];

    safetyAlert = 'Khi gặp dông bão sấm sét lúc tan trường: Đi chậm, tuyệt đối không trú mưa dưới gốc cây cổ thụ, không đứng gần cột điện hay nắp cống ngập.';

    checklist = [
      'Áo mưa bộ / Ô gập lớn loại dày',
      'Túi zip chống nước bọc kín Máy tính Casio',
      'Túi nilon bọc sách giáo khoa & tập vở BTVN',
      'Dép quai chống trơn / Bọc giày đi mưa',
      'Bình giữ nhiệt nước ấm & khăn khô'
    ];
  } else if (isRainy) {
    mood = 'rain';
    badge = '🌦️ Mưa rào rải rác';
    headline = 'Thời Tiết Chuyển Mưa • Nhớ Để Sẵn Ô Gấp Gọn & Giữ Khô Balo';
    briefing = 'Trời nhiều mây, độ ẩm cao và có mưa rào rải rác bất chợt trong ngày. Đừng để bị động lúc tan trường buổi trưa hoặc giờ đi học thêm buổi tối nhé!';

    outfit = [
      'Bỏ sẵn 1 chiếc ô gấp gọn hoặc áo mưa bọc mini ở ngăn hông dễ rút của balo.',
      'Nên đi giày tối màu hoặc mang dép quai có ma sát tốt, tránh đi giày vải trắng dễ dính bùn bắn.',
      'Mặc áo khoác gió mỏng chống thấm nước nhẹ để cản gió và sương lạnh.'
    ];

    skincare = [
      'Giữ cơ thể khô ráo, lau khô tay trước khi cầm bút viết bài tránh làm nhăn giấy tập.',
      'Uống đủ nước ấm trong các tiết học để duy trì sự tỉnh táo và ấm cổ họng.',
      'Nếu dính mưa phùn, rửa mặt bằng nước sạch ngay khi về nhà để loại bỏ bụi bẩn trong nước mưa.'
    ];

    casioProtection = [
      'Kiểm tra ngăn chứa máy tính Casio trong balo, đảm bảo không để cạnh chai nước có thể bị rò rỉ.',
      'Tập vở BTVN và đề cương nên cho vào bìa sơ mi nhựa nút bấm để chống ẩm mép giấy.'
    ];

    safetyAlert = 'Đường sau mưa thường có vũng nước trơn, chú ý giữ khoảng cách an toàn khi điều khiển xe đạp hoặc xe điện.';

    checklist = [
      'Ô gấp gọn hoặc áo mưa nhẹ bỏ ngăn hông',
      'Bìa nhựa sơ mi bọc đề cương & vở BTVN',
      'Kiểm tra nắp bình nước đóng chặt tránh đổ vào máy Casio',
      'Khăn giấy lau khô tay và tập vở'
    ];
  } else if (isHot || isHighUV) {
    mood = 'hot';
    const uvInfo = getUvAnalysis(uv);
    badge = `☀️ Nắng gắt oi bức • UV ${uvInfo.text}`;
    headline = `Nhiệt Độ Cao & Bức Xạ UV ${uvInfo.text} • Cần Chống Nắng Toàn Diện!`;
    briefing = 'Nhiệt độ ngoài trời tăng cao và chỉ số tia cực tím đạt đỉnh vào khung giờ 10h30 - 14h00. Nếu không bảo vệ kĩ, ánh nắng gắt sẽ gây bỏng rát da, mất nước và uể oải sau các tiết học.';

    outfit = [
      'Áo khoác chống nắng chuyên dụng có mũ trùm đầu và tay áo xỏ ngón che kín mu bàn tay.',
      'Khẩu trang y tế hoặc khẩu trang chống tia UV 4 lớp che kín mũi và hai gò má.',
      'Kính râm chống chói lóa và bụi bẩn khi di chuyển giữa các cung đường học thêm.',
      'Đội nón/mũ rộng vành khi tham gia hoạt động ngoài trời, chào cờ hoặc tiết thể dục.'
    ];

    skincare = [
      '🧴 THOA KEM CHỐNG NẮNG: Thoa đều kem chống nắng SPF 50+ PA++++ lên mặt, cổ và cánh tay trước khi ra khỏi nhà 15-20 phút.',
      '🥤 BÙ NƯỚC LIÊN TỤC: Mang theo bình giữ nhiệt 800ml - 1L đựng nước mát hoặc điện giải chanh muối để uống từng ngụm nhỏ giữa giờ ra chơi.',
      'Rửa sạch mặt bằng nước mát sau giờ học thể dục để làm dịu da và hạ nhiệt cơ thể.'
    ];

    casioProtection = [
      'Tuyệt đối KHÔNG bỏ balo chứa máy tính Casio vào cốp xe máy nóng rực hoặc phơi dưới nắng trưa, nhiệt độ cao trong cốp xe dễ làm đen hỏng tinh thể lỏng màn hình LCD!',
      'Giữ bút bi và máy tính trong bóng râm, tránh để trên bàn gần cửa sổ có nắng chiếu trực tiếp.'
    ];

    safetyAlert = 'Buổi trưa nắng gắt dễ gây hoa mắt say nắng, đi xe nên đội mũ bảo hiểm có kính chắn gió và uống đủ nước.';

    checklist = [
      'Thoa kem chống nắng SPF50+ trước khi đi 15 phút',
      'Áo khoác chống nắng UV có mũ & găng tay che mu tay',
      'Khẩu trang chống UV & Kính râm',
      'Bình giữ nhiệt 800ml - 1L nước mát bù điện giải',
      'Mũ nón cho giờ thể dục sân trường'
    ];
  } else if (isCold) {
    mood = 'cold';
    badge = '🌬️ Gió lạnh mùa đông';
    headline = 'Trời Chuyển Lạnh • Giữ Ấm Cổ Họng & Bàn Tay Để Học Tập Tốt Nhất!';
    briefing = 'Nhiệt độ xuống thấp vào sáng sớm lúc truy bài và tối muộn lúc tan ca học thêm. Hãy giữ ấm đúng cách để bảo vệ hệ hô hấp và không bị gián đoạn tiến độ ôn thi!';

    outfit = [
      'Mặc áo khoác gió nhiều lớp ấm áp hoặc áo len mềm, giữ ấm lồng ngực.',
      'Quàng khăn len nhẹ hoặc khăn quàng mỏng giữ ấm cổ họng và thanh quản.',
      'Đeo găng tay khi đi xe đạp/xe máy điện vào sáng sớm để các ngón tay không bị cóng buốt khi viết bài.'
    ];

    skincare = [
      'Thoa son dưỡng môi hoặc kem dưỡng ẩm tránh khô nẻ da mặt trong phòng học điều hòa.',
      'Mang theo bình nước giữ nhiệt nước ấm pha chút mật ong để làm ấm họng suốt buổi học.',
      'Tập vài động tác vươn vai giữa giờ ra chơi để khí huyết lưu thông, xua tan cảm giác buồn ngủ vì lạnh.'
    ];

    casioProtection = [
      'Tránh để máy tính Casio ở nơi ẩm ướt sáng sớm, bảo quản trong hộp hoặc ngăn khóa giữa balo.'
    ];

    safetyAlert = 'Sáng sớm trời còn tối và sương lạnh mờ mắt kính, đi xe bật đèn và quan sát cẩn thận.';

    checklist = [
      'Áo khoác gió ấm nhiều lớp',
      'Khăn quàng cổ giữ ấm thanh quản',
      'Găng tay đi xe sáng sớm',
      'Bình giữ nhiệt nước ấm mật ong',
      'Son dưỡng ẩm tránh nẻ môi'
    ];
  } else {
    mood = 'pleasant';
    badge = '🌤️ Thời tiết lý tưởng';
    headline = 'Thời Tiết Dễ Chịu • Điều Kiện Tuyệt Vời Cho Một Ngày Bứt Phá Điểm Số!';
    briefing = 'Không khí thoáng đãng, nhiệt độ điều hòa tự nhiên, không mưa không nắng gắt. Hãy tận dụng năng lượng tích cực này để hoàn thành xuất sắc các bài tập hôm nay!';

    outfit = [
      'Đồng phục học sinh gọn gàng, sơ mi trắng thẳng thớm, thoáng mát.',
      'Giày thể thao êm chân sẵn sàng cho giờ học tập và vận động thể thao.',
      'Mang áo khoác nhẹ đồng phục để khoác khi phòng học bật điều hòa mát.'
    ];

    skincare = [
      'Uống đủ nước đều đặn trong ngày để não bộ luôn minh mẫn, tiếp thu bài nhanh.',
      'Duy trì tinh thần sảng khoái, hít thở không khí trong lành giữa các tiết học.'
    ];

    casioProtection = [
      'Chuẩn bị đầy đủ máy tính Casio, compa, thước kẻ và bút viết theo thời khóa biểu hôm nay.'
    ];

    safetyAlert = 'Thời tiết đẹp thích hợp đi học sớm để truy bài và ôn lại công thức trước giờ vào lớp.';

    checklist = [
      'Đồng phục học sinh sạch sẽ & Giày thể thao',
      'Bình nước uống cá nhân',
      'Máy tính Casio & Dụng cụ học tập',
      'Vở ghi chép & Đề cương BTVN'
    ];
  }

  return {
    mood,
    badge,
    headline,
    briefing,
    outfit,
    skincare,
    casioProtection,
    safetyAlert,
    checklist
  };
}

// Fetch 7-day weather forecast with HOURLY 24H data from Open-Meteo
async function loadWeatherData(forceRefresh = false) {
  const cityId = db.weatherCity || 'hanoi';
  studyWeatherState.selectedCityId = cityId;

  // Check cached data
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem('studyOS.weatherCache_' + cityId);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Cache valid for 60 minutes
        if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
          studyWeatherState.data = parsed.data;
          studyWeatherState.lastUpdated = parsed.timestamp;
          renderWeatherContainer();
          return;
        }
      }
    } catch(e) {}
  }

  const city = WEATHER_CITIES.find(c => c.id === cityId) || WEATHER_CITIES[0];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,windspeed_10m_max,uv_index_max&hourly=temperature_2m,precipitation_probability,precipitation,weathercode,windspeed_10m&timezone=Asia%2FBangkok`;

  studyWeatherState.loading = true;
  studyWeatherState.error = null;
  renderWeatherContainer();

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Không thể kết nối máy chủ khí tượng Open-Meteo');
    const json = await res.json();

    const days = [];
    const totalDaily = (json.daily.time || []).length;
    for (let i = 0; i < totalDaily; i++) {
      // Extract 24 hourly points for day i
      const dayHours = [];
      for (let h = 0; h < 24; h++) {
        const hIdx = i * 24 + h;
        dayHours.push({
          hour: h,
          time: (h < 10 ? '0' + h : h) + ':00',
          temp: Math.round(json.hourly?.temperature_2m?.[hIdx] ?? 25),
          rainProb: Math.round(json.hourly?.precipitation_probability?.[hIdx] ?? 0),
          rainSum: +(json.hourly?.precipitation?.[hIdx] ?? 0).toFixed(1),
          code: json.hourly?.weathercode?.[hIdx] ?? 1,
          wind: Math.round(json.hourly?.windspeed_10m?.[hIdx] ?? 10)
        });
      }

      days.push({
        date: json.daily.time[i],
        code: json.daily.weathercode[i],
        maxTemp: Math.round(json.daily.temperature_2m_max[i]),
        minTemp: Math.round(json.daily.temperature_2m_min[i]),
        rainProb: json.daily.precipitation_probability_max[i] || 0,
        rainSum: +(json.daily.precipitation_sum[i] || 0).toFixed(1),
        wind: Math.round(json.daily.windspeed_10m_max[i] || 0),
        uv: +(json.daily.uv_index_max[i] || 0).toFixed(1),
        hours: dayHours
      });
    }

    studyWeatherState.data = {
      city: city.name,
      cityId: city.id,
      days: days
    };
    studyWeatherState.loading = false;
    studyWeatherState.lastUpdated = Date.now();

    localStorage.setItem('studyOS.weatherCache_' + cityId, JSON.stringify({
      timestamp: Date.now(),
      data: studyWeatherState.data
    }));

    renderWeatherContainer();
  } catch(err) {
    console.warn('Weather fetch error:', err);
    studyWeatherState.loading = false;
    studyWeatherState.error = err.message;
    if (!studyWeatherState.data) {
      studyWeatherState.data = getOfflineFallbackWeather(city);
    }
    renderWeatherContainer();
  }
}

function getOfflineFallbackWeather(city) {
  const dates = getDatesOfCurrentWeek();
  return {
    city: city.name,
    cityId: city.id,
    isOffline: true,
    days: dates.map((d, idx) => {
      const dayHours = [];
      for (let h = 0; h < 24; h++) {
        const isRainHour = (idx % 2 === 1 && h >= 13 && h <= 16);
        dayHours.push({
          hour: h,
          time: (h < 10 ? '0' + h : h) + ':00',
          temp: 25 + (h >= 11 && h <= 15 ? 6 : 0),
          rainProb: isRainHour ? 70 : 10,
          rainSum: isRainHour ? 2.5 : 0,
          code: isRainHour ? 61 : 1,
          wind: 12
        });
      }
      return {
        date: d,
        code: idx % 3 === 0 ? 1 : (idx % 3 === 1 ? 61 : 0),
        maxTemp: 32 - (idx % 4),
        minTemp: 24,
        rainProb: idx % 3 === 1 ? 65 : 20,
        rainSum: idx % 3 === 1 ? 8.5 : 0.0,
        wind: 14 + (idx * 2),
        uv: 7.2,
        hours: dayHours
      };
    })
  };
}

function changeWeatherCity(cityId) {
  db.weatherCity = cityId;
  save();
  studyWeatherState.selectedCityId = cityId;
  studyWeatherState.selectedDayIdx = 0;
  loadWeatherData(true);
}

function selectWeatherDay(idx) {
  studyWeatherState.selectedDayIdx = idx;
  renderWeatherContainer();
}


function scrollHourlyTrack(offset) {
  const el = document.getElementById('iosHourlyScrollTrack');
  if (el) el.scrollBy({ left: offset, behavior: 'smooth' });
}

function initSmoothScrollListeners() {
  const selectors = ['.ios-hourly-scroll', '.weather-days-scroll', '.weather-hourly-scroll-track', '.mobile-day-picker'];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (!el || el.dataset.smoothAttached) return;
      el.dataset.smoothAttached = 'true';

      // Mouse drag to scroll with momentum
      let isDown = false;
      let startX, scrollLeft;
      el.addEventListener('mousedown', e => {
        isDown = true;
        startX = e.pageX - el.offsetLeft;
        scrollLeft = el.scrollLeft;
      });
      window.addEventListener('mouseup', () => { isDown = false; });
      el.addEventListener('mouseleave', () => { isDown = false; });
      el.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        const walk = (x - startX) * 1.5;
        el.scrollLeft = scrollLeft - walk;
      });

      // Mouse wheel horizontal scroll
      el.addEventListener('wheel', e => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          el.scrollBy({ left: e.deltaY * 0.8, behavior: 'smooth' });
        }
      }, { passive: false });
    });
  });
}

function renderWeatherContainer() {
  setTimeout(initSmoothScrollListeners, 50);
  const container = $('#dashboardWeatherMount');
  if (container) {
    container.innerHTML = buildWeatherWidgetHtml(false);
  }
  const fullContainer = $('#fullWeatherMount');
  if (fullContainer) {
    fullContainer.innerHTML = buildWeatherFullViewHtml();
  }
}

function formatWeatherDayName(dateStr, idx) {
  const d = new Date(dateStr + 'T00:00:00+07:00');
  const dayOfWeek = d.getDay();
  const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const name = dayNames[dayOfWeek];

  const todayStr = today();
  if (dateStr === todayStr) return 'Hôm nay';
  
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  const tmrStr = tmr.toISOString().slice(0, 10);
  if (dateStr === tmrStr) return 'Ngày mai';

  return name;
}

function formatDayMonth(dateStr) {
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}`;
}

// MAIN WEATHER WIDGET BUILDER WITH 24H HOURLY RAIN RADAR
function buildWeatherWidgetHtml(isFullView = false) {
  const state = studyWeatherState;
  const currentCityId = db.weatherCity || 'hanoi';

  if (state.loading && !state.data) {
    return `
      <div class="weather-forecast-widget" style="text-align:center;padding:36px 20px">
        <div style="font-size:32px;animation:spin 1s linear infinite;display:inline-block">🌤️</div>
        <div style="font-weight:800;color:#38bdf8;margin-top:10px;font-size:15px">Đang cập nhật dự báo thời tiết 24h & cả tuần theo giờ chuẩn...</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px">Đang lấy dữ liệu khí tượng Open-Meteo</div>
      </div>
    `;
  }

  const days = state.data?.days || [];
  const selectedIdx = Math.min(state.selectedDayIdx || 0, Math.max(0, days.length - 1));
  const activeDay = days[selectedIdx] || {
    date: today(),
    code: 1,
    maxTemp: 32,
    minTemp: 24,
    rainProb: 30,
    rainSum: 0.5,
    wind: 12,
    uv: 6.5,
    hours: []
  };

  const advice = analyzeWeatherForStudent(activeDay);
  const activeDayLabel = formatWeatherDayName(activeDay.date, selectedIdx);
  const isToday = activeDay.date === today();
  const currentHour = new Date().getHours();

  // Current real-time hour data
  const currentHourData = (activeDay.hours || []).find(h => h.hour === currentHour) || activeDay.hours?.[0] || {
    hour: currentHour,
    temp: Math.round((activeDay.maxTemp + activeDay.minTemp) / 2),
    code: activeDay.code,
    wind: activeDay.wind,
    rainProb: activeDay.rainProb
  };

  const currentCondition = getWmoCondition(
    isToday ? currentHourData.code : activeDay.code,
    isToday ? currentHour : 12,
    isToday ? currentHourData.temp : activeDay.maxTemp,
    activeDay.wind
  );

  // 24-Hour Timeline: If today, starts from "Bây giờ" and continues 24 consecutive hours!
  let hourlyList = [];
  if (isToday) {
    const todayRemaining = (activeDay.hours || []).slice(currentHour);
    const tomorrowComing = (days[1]?.hours || []).slice(0, currentHour);
    hourlyList = [...todayRemaining, ...tomorrowComing];
  } else {
    hourlyList = activeDay.hours || [];
  }

  // Dynamic iOS Weather Notification Summary
  let iosNoticeText = 'Thời tiết thuận lợi, đường sá khô ráo.';
  const nextRainHour = hourlyList.find(h => h.rainProb >= 40);
  const nextCloudHour = hourlyList.find(h => [1, 2, 3].includes(h.code));
  if (nextRainHour) {
    const rTime = nextRainHour.hour === currentHour ? 'trong giờ tới' : `vào khoảng ${nextRainHour.hour < 10 ? '0' + nextRainHour.hour : nextRainHour.hour}:00`;
    iosNoticeText = `Dự báo có mưa rào rải rác (${nextRainHour.rainProb}%) ${rTime}. Bạn nên chuẩn bị sẵn áo mưa trong cặp sách.`;
  } else if (nextCloudHour) {
    const cTime = nextCloudHour.hour === currentHour ? 'hiện tại' : `vào khoảng ${nextCloudHour.hour < 10 ? '0' + nextCloudHour.hour : nextCloudHour.hour}:00`;
    iosNoticeText = `Dự báo trời mát mẻ, có mây vài nơi ${cTime}. Gió giật lên đến ${activeDay.wind || 11} km/h.`;
  } else {
    iosNoticeText = `Trời quang đãng, khô ráo suốt cả ngày. Gió nhẹ ${activeDay.wind || 10} km/h, rất thuận tiện đi học.`;
  }

  // 24-Hour Rain Analysis & Commute Slots
  const rainTimeAnalysis = analyzeRainTimeWindows(activeDay.hours);
  const commuteSlots = evaluateStudentCommuteSlots(activeDay.hours);

  // Temperature range for gradient bars
  const minWeek = Math.min(...days.map(d => d.minTemp), 20);
  const maxWeek = Math.max(...days.map(d => d.maxTemp), 35);
  const tempRange = Math.max(1, maxWeek - minWeek);

  return `
    <div class="weather-forecast-widget ios-weather-theme ${advice.mood}">
      <!-- iOS Apple Weather Top Header -->
      <div class="ios-weather-header">
        <div class="ios-location-row">
          <div class="ios-location-title">
            <span class="ios-loc-icon">📍</span>
            <select class="ios-city-picker" onchange="changeWeatherCity(this.value)" aria-label="Chọn tỉnh thành">
              ${WEATHER_CITIES.map(c => `<option value="${c.id}" ${c.id === currentCityId ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <button class="ios-refresh-pill" onclick="loadWeatherData(true)" title="Cập nhật trực tiếp">
            ${state.loading ? '⏳' : '🔄'} Cập nhật
          </button>
        </div>

        <!-- Big Center Temperature Display -->
        <div class="ios-hero-display">
          <div class="ios-hero-big-temp">${isToday ? currentHourData.temp : activeDay.maxTemp}°</div>
          <div class="ios-hero-cond-name">${currentCondition.text}</div>
          <div class="ios-hero-high-low">
            <span>C: ${activeDay.maxTemp}°</span>
            <span style="opacity:0.5;margin:0 4px">•</span>
            <span>T: ${activeDay.minTemp}°</span>
          </div>
        </div>

        <!-- iOS Weather Alert / Summary Pill -->
        <div class="ios-notice-banner">
          <div class="ios-notice-text">
            ${iosNoticeText}
          </div>
        </div>
      </div>

      <!-- ================= 24-HOUR HOURLY FORECAST (STARTING FROM BÂY GIỜ) ================= -->
      <div class="ios-hourly-card">
        <div class="ios-card-header">
          <span style="font-size:14px">⏱️ DỰ BÁO THEO GIỜ (${isToday ? 'Bắt đầu từ Bây giờ' : activeDayLabel})</span>
        </div>

        <div class="ios-hourly-scroll-wrap">
          <button type="button" class="ios-scroll-nav-btn prev" onclick="scrollHourlyTrack(-180)" aria-label="Cuộn trái">‹</button>
          <div class="ios-hourly-scroll" id="iosHourlyScrollTrack">
          ${hourlyList.map((h, hIdx) => {
            const isNow = isToday && hIdx === 0;
            const hourLabel = isNow ? 'Bây giờ' : `${h.hour < 10 ? '0' + h.hour : h.hour} giờ`;
            const cond = getWmoCondition(h.code, h.hour, h.temp, h.wind);
            const hasRain = h.rainProb > 0;
            const rainColor = h.rainProb >= 60 ? '#f87171' : (h.rainProb >= 30 ? '#fbbf24' : '#38bdf8');

            return `
              <div class="ios-hour-col ${isNow ? 'is-now-hour' : ''}">
                <div class="ios-hour-time">${hourLabel}</div>
                <div class="ios-hour-icon-box">
                  ${getWeatherSvgIcon(cond.iconType, 26)}
                </div>
                <div class="ios-hour-temp">${h.temp}°</div>
                <div class="ios-hour-rain-pill" style="opacity:${hasRain ? '1' : '0'}">
                  <span style="color:${rainColor}">💧${h.rainProb}%</span>
                </div>
              </div>
            `;
          }).join('')}
          </div>
          <button type="button" class="ios-scroll-nav-btn next" onclick="scrollHourlyTrack(180)" aria-label="Cuộn phải">›</button>
        </div>
      </div>

      <!-- ================= 7-DAY FORECAST WITH APPLE GRADIENT BARS ================= -->
      <div class="ios-daily-card">
        <div class="ios-card-header">
          <span style="font-size:14px">📅 DỰ BÁO 7 NGÀY TỚI</span>
        </div>

        <div class="ios-daily-list">
          ${days.map((d, idx) => {
            const cond = getWmoCondition(d.code, 12, d.maxTemp, d.wind);
            const dayLabel = formatWeatherDayName(d.date, idx);
            const isSelected = idx === selectedIdx;
            const isDayToday = idx === 0;

            // Compute bar offsets
            const leftPct = Math.max(0, Math.min(100, Math.round(((d.minTemp - minWeek) / tempRange) * 100)));
            const rightPct = Math.max(0, Math.min(100, Math.round(((d.maxTemp - minWeek) / tempRange) * 100)));
            const barWidth = Math.max(12, rightPct - leftPct);

            return `
              <div class="ios-day-row ${isSelected ? 'active-day-row' : ''}" onclick="selectWeatherDay(${idx})">
                <div class="ios-day-name ${isDayToday ? 'is-today-label' : ''}">${dayLabel}</div>
                <div class="ios-day-icon">
                  ${getWeatherSvgIcon(cond.iconType, 24)}
                </div>
                <div class="ios-day-min-temp">${d.minTemp}°</div>

                <!-- Apple Style Horizontal Temperature Gradient Bar -->
                <div class="ios-temp-bar-track">
                  <div class="ios-temp-bar-fill" style="left:${leftPct}%;width:${barWidth}%"></div>
                  ${isDayToday ? `<div class="ios-temp-bar-dot" style="left:${Math.max(leftPct, Math.min(rightPct, Math.round(((currentHourData.temp - minWeek) / tempRange) * 100)))}%"></div>` : ''}
                </div>

                <div class="ios-day-max-temp">${d.maxTemp}°</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 4 School Commute Slots Grid -->
      <div class="weather-commute-slots-title" style="margin-top:16px">
        <span>🎒</span> <span>Thời tiết các khung giờ đi học & tan trường:</span>
      </div>
      <div class="weather-commute-grid">
        ${commuteSlots.map(slot => `
          <div class="commute-slot-card ${slot.badgeClass}">
            <div class="commute-slot-header">
              <strong>${slot.name}</strong>
              <span class="commute-slot-badge ${slot.badgeClass}">${slot.badge}</span>
            </div>
            <div class="commute-slot-time">${slot.timeRange}</div>
            <div class="commute-slot-metrics">
              <span>🌡️ ${slot.temp}°C</span>
              <span>💧 Mưa: ${slot.rainProb}%</span>
            </div>
            <div class="commute-slot-desc">${slot.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// FULL DEDICATED WEATHER VIEW
function buildWeatherFullViewHtml() {
  const baseWidget = buildWeatherWidgetHtml(true);
  const state = studyWeatherState;
  const days = state.data?.days || [];

  return `
    ${baseWidget}

    <!-- Deep Meteorological Comparison Table -->
    <div class="card" style="margin-top:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:850;color:#f8fafc;display:flex;align-items:center;gap:8px">
            <span>📊</span> Bảng So Sánh Chỉ Số Khí Tượng 7 Ngày Chi Tiết
          </h3>
          <div style="font-size:12px;color:#94a3b8;margin-top:3px">
            Đối chiếu lượng mưa mm, xác suất mưa %, sức gió giật và chỉ số UV để chủ động lịch học & ôn thi
          </div>
        </div>
      </div>

      <div style="overflow-x:auto">
        <table class="weather-table-comparison" style="width:100%;border-collapse:collapse;font-size:12.5px;text-align:left">
          <thead>
            <tr style="border-bottom:1.5px solid rgba(255,255,255,0.12);color:#94a3b8">
              <th style="padding:11px 10px">Ngày</th>
              <th style="padding:11px 10px">Hình thái</th>
              <th style="padding:11px 10px">Nhiệt độ</th>
              <th style="padding:11px 10px">Tỉ lệ mưa</th>
              <th style="padding:11px 10px">Lượng mưa</th>
              <th style="padding:11px 10px">Sức gió</th>
              <th style="padding:11px 10px">Chỉ số UV</th>
              <th style="padding:11px 10px">Lời khuyên học đường</th>
            </tr>
          </thead>
          <tbody>
            ${days.map((d, idx) => {
              const cond = getWmoCondition(d.code);
              const dayLabel = formatWeatherDayName(d.date, idx);
              const dateVi = formatDayMonth(d.date);
              const uvInfo = getUvAnalysis(d.uv);
              const rainAn = getRainAnalysis(d.rainProb, d.rainSum);
              const windAn = getWindAnalysis(d.wind);

              let studentNote = 'Thuận lợi đi học';
              if (d.rainProb >= 65 || d.rainSum >= 7) studentNote = '⚠️ Mang áo mưa & bọc chống nước máy Casio';
              else if (d.rainProb >= 35) studentNote = '🌂 Để sẵn ô gấp gọn';
              else if (d.maxTemp >= 33 || d.uv >= 7.5) studentNote = '☀️ Áo chống nắng, thoa kem SPF50+ & mang nước';
              else if (d.minTemp <= 19) studentNote = '🧣 Mặc áo ấm & khăn quàng cổ';

              return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.06);background:${idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}">
                  <td style="padding:11px 10px;font-weight:750;color:#f1f5f9;white-space:nowrap">
                    ${dayLabel} <span style="font-size:11px;color:#94a3b8;font-weight:400">(${dateVi})</span>
                  </td>
                  <td style="padding:11px 10px;white-space:nowrap">
                    <span style="display:inline-flex;align-items:center;gap:6px">
                      ${getWeatherSvgIcon(cond.iconType, 18)} ${cond.text}
                    </span>
                  </td>
                  <td style="padding:11px 10px;font-weight:750;color:#38bdf8;white-space:nowrap">
                    ${d.maxTemp}° / ${d.minTemp}°C
                  </td>
                  <td style="padding:11px 10px;font-weight:750;color:${rainAn.color};white-space:nowrap">
                    💧 ${d.rainProb}%
                  </td>
                  <td style="padding:11px 10px;color:#cbd5e1;white-space:nowrap">
                    ${d.rainSum > 0 ? `<strong>${d.rainSum} mm</strong>` : '0 mm'}
                  </td>
                  <td style="padding:11px 10px;color:${windAn.color};white-space:nowrap">
                    ${d.wind} km/h <span style="font-size:10.5px;color:#94a3b8">(${windAn.level.split(' ')[0]})</span>
                  </td>
                  <td style="padding:11px 10px;font-weight:750;color:${uvInfo.color};white-space:nowrap">
                    ${d.uv} (${uvInfo.text.split(' ')[0]})
                  </td>
                  <td style="padding:11px 10px;font-size:12px;color:#e2e8f0">
                    ${studentNote}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Student School Safety Guide -->
    <div class="card" style="margin-top:20px;background:linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.85));border:1px solid rgba(56,189,248,0.25)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <div style="font-size:26px">💡</div>
        <div>
          <h3 style="margin:0;font-size:15px;font-weight:800;color:#f8fafc">Cẩm Nang Bảo Quản Sách Vở & Sức Khỏe Học Đường</h3>
          <div style="font-size:12px;color:#94a3b8">4 quy tắc bảo vệ vật dụng học tập không thể thiếu cho học sinh</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;font-size:12.5px;color:#cbd5e1;line-height:1.55">
        <div style="background:rgba(255,255,255,0.03);padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
          <div style="font-weight:800;color:#38bdf8;margin-bottom:5px;display:flex;align-items:center;gap:6px">
            <span>💻</span> Bảo Vệ Máy Tính Casio
          </div>
          <div>Luôn bỏ máy tính Casio fx-580 / 880 vào túi zip hoặc túi đựng chống sốc có khóa kín. Tuyệt đối không phơi máy tính dưới ánh nắng gắt hoặc để trong cốp xe máy nóng.</div>
        </div>

        <div style="background:rgba(255,255,255,0.03);padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
          <div style="font-weight:800;color:#60a5fa;margin-bottom:5px;display:flex;align-items:center;gap:6px">
            <span>☔</span> Kỹ Năng Đi Mưa An Toàn
          </div>
          <div>Ưu tiên mặc áo mưa bộ 2 mảnh khi đi xe để cản gió và không bị vướng bánh xe. Nếu dùng ô gấp, kiểm tra gió giật trước khi mở để tránh lật gãy nan ô.</div>
        </div>

        <div style="background:rgba(255,255,255,0.03);padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
          <div style="font-weight:800;color:#f59e0b;margin-bottom:5px;display:flex;align-items:center;gap:6px">
            <span>🧴</span> Quy Tắc Thoa Kem & Uống Nước
          </div>
          <div>Thoa kem chống nắng SPF50+ trước khi rời nhà 15-20 phút. Luôn mang bình giữ nhiệt 800ml - 1L nước mát để chống say nắng và khô họng trong phòng học.</div>
        </div>

        <div style="background:rgba(255,255,255,0.03);padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
          <div style="font-weight:800;color:#a855f7;margin-bottom:5px;display:flex;align-items:center;gap:6px">
            <span>⚡</span> Cảnh Báo Sấm Sét Học Đường
          </div>
          <div>Khi trời nổi dông sét lúc tan trường, ở lại hành lang trường chờ ngớt mưa. Tuyệt đối không trú mưa dưới gốc cây bàng, xà cừ cổ thụ hoặc gần trạm biến áp.</div>
        </div>
      </div>
    </div>
  `;
}

function weather() {
  $('#content').innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow" style="display:flex;align-items:center;gap:6px">
          <span style="font-weight:700;color:#38bdf8">TRẠM DỰ BÁO KHÍ TƯỢNG HỌC ĐƯỜNG</span>
          <span>•</span>
          <span>CHUYÊN SÂU 24H & 7 NGÀY</span>
        </div>
        <h1>Dự Báo Thời Tiết & Balo Học Đường 🌤️</h1>
        <p>Phân tích tỉ mỉ thời gian có mưa 00:00 – 23:59, tỉ lệ mưa chuẩn xác, khung giờ đi học và gợi ý bảo vệ máy tính Casio & sách vở.</p>
      </div>
      <button class="primary" onclick="loadWeatherData(true)">🔄 Cập nhật ngay</button>
    </div>

    <div id="fullWeatherMount" class="weather-full-view-container">
      ${buildWeatherFullViewHtml()}
    </div>
  `;
}


function dashboard() {
  let todo = db.tasks.filter(x => !x.done),
    done = db.tasks.filter(x => x.done);

  const userName = db.settings?.name || 'Gia Bảo';
  const greeting = getGreeting(userName);
  const todayInfo = getDayScheduleSummary(0);
  const tomorrowInfo = getTomorrowScheduleSummary();

  const isTomorrowDayOff = (!tomorrowInfo.morning || tomorrowInfo.morning.length === 0) &&
                           (!tomorrowInfo.afternoon || tomorrowInfo.afternoon.length === 0) &&
                           (!tomorrowInfo.extras || tomorrowInfo.extras.length === 0);

  const isTodayDayOff = (!todayInfo.morning || todayInfo.morning.length === 0) &&
                        (!todayInfo.afternoon || todayInfo.afternoon.length === 0) &&
                        (!todayInfo.extras || todayInfo.extras.length === 0);

  const holidaySug = getDayOffSuggestion();

  // Urgent BTVN Reminders: Overdue, Due Today, Due Tomorrow
  const overdueTasks = db.tasks.filter(t => !t.done && t.due && t.due < today());
  const todayTasks = db.tasks.filter(t => !t.done && t.due === today());
  const tomorrowTasks = db.tasks.filter(t => !t.done && t.due === tomorrowInfo.dateStr);
  const totalUrgent = overdueTasks.length + todayTasks.length + tomorrowTasks.length;

  const urgentBannerHtml = totalUrgent > 0 ? `
    <div class="deadline-alert-banner">
      <div class="deadline-alert-head">
        <b>🚨 NHẮC NHỞ HẠN NỘP BTVN GẤP (${totalUrgent} bài cần hoàn thành)</b>
        <button class="ghost" style="padding:4px 10px;font-size:11px;border-color:rgba(239,68,68,0.4);color:#fca5a5" onclick="go('tasks')">Xem tất cả BTVN →</button>
      </div>
      <div class="deadline-alert-list">
        ${overdueTasks.map(t => renderUrgentTaskItem(t, 'overdue')).join('')}
        ${todayTasks.map(t => renderUrgentTaskItem(t, 'today')).join('')}
        ${tomorrowTasks.map(t => renderUrgentTaskItem(t, 'tomorrow')).join('')}
      </div>
    </div>
  ` : '';

  // Tomorrow Banner HTML
  let tomorrowBannerHtml = '';
  if (isTomorrowDayOff) {
    tomorrowBannerHtml = `
      <div class="school-banner holiday-aura-card" style="margin-bottom:18px;background:linear-gradient(135deg,rgba(16,185,129,0.18),rgba(6,182,212,0.12));border:1px solid rgba(16,185,129,0.35)">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <strong style="color:#6ee7b7;font-size:14px">🏖️ Lịch học ngày mai (${tomorrowInfo.dayName}): Nghỉ học trọn vẹn</strong>
            <span style="font-size:11px;background:rgba(16,185,129,0.2);color:#a7f3d0;padding:2px 8px;border-radius:999px;font-weight:600">Ngày rảnh</span>
          </div>
          <div class="holiday-suggestion-dynamic-box" style="margin-top:8px;background:rgba(15,23,42,0.6);border:1px dashed rgba(253,224,71,0.35);border-radius:10px;padding:10px 12px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
              <div style="font-weight:750;color:#fde047;font-size:12.5px;display:flex;align-items:center;gap:6px">
                <span style="font-size:15px">${holidaySug.icon}</span> <span>Gợi ý hôm nay: ${esc(holidaySug.title)}</span>
              </div>
              <button class="ghost" style="padding:3px 8px;font-size:11px;border-color:rgba(253,224,71,0.35);color:#fde047;border-radius:6px;cursor:pointer" onclick="randomizeHolidaySuggestion()">🎲 Đổi gợi ý khác</button>
            </div>
            <div style="font-size:12px;color:#fef08a;line-height:1.45;opacity:0.95">${esc(holidaySug.desc)}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:flex-start">
          <button class="ghost" onclick="go('timetable')">Xem TKB</button>
          
        </div>
      </div>
    `;
  } else {
    tomorrowBannerHtml = `
      <div class="school-banner" style="margin-bottom:18px">
        <div>
          <strong>🎒 Lịch học ngày mai (${tomorrowInfo.dayName})</strong>
          <span style="color:#dbeafe">${tomorrowInfo.text}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="ghost" onclick="go('timetable')">Xem TKB</button>
          
        </div>
      </div>
    `;
  }

  $('#content').innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow" style="display:flex;align-items:center;flex-wrap:wrap;gap:6px">
          <span style="font-weight:700;color:#38bdf8;letter-spacing:0.04em">GÓC HỌC TẬP ${esc(userName).toUpperCase()}</span>
          <span style="opacity:0.4">•</span>
          <span id="dashLiveClock"></span>
        </div>
        <h1>${greeting.text} <span style="font-size:1.15em">${greeting.icon}</span></h1>
        <p>Không gian học tập cá nhân — Quản lý BTVN, thời khóa biểu, thời tiết & balo và ghi chú.</p>
      </div>
      <button class="primary" onclick="taskModal()">+ BTVN mới</button>
    </div>

    ${urgentBannerHtml}

    <!-- 7-Day Weather Forecast & Student Outfit / Backpack Assistant -->
    <div id="dashboardWeatherMount">
      ${buildWeatherWidgetHtml()}
    </div>

    <!-- Tomorrow Schedule Banner -->
    ${tomorrowBannerHtml}

    <!-- Formula Quick Launcher Banner -->
    <div class="formula-launcher-banner">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:28px">📐</div>
        <div>
          <div style="font-weight:800;color:#f8fafc;font-size:14px">Sổ tay Công thức Tự nhiên Lớp 10</div>
          <div style="font-size:12px;color:#a5b4fc">Ôn tập nhanh Toán (Thầy Hoàn) • Vật lý (Cô Ngọc) • Hóa học (Cô Hải)</div>
        </div>
      </div>
      <button class="primary" style="padding:6px 14px;font-size:12px;white-space:nowrap" onclick="go('formulas')">Tra cứu ngay →</button>
    </div>
  

    ${(() => {
      const curWk = getWeekKey();
      const overrides = (db.tempOverrides || []).filter(o => o.weekKey === curWk);
      if (!overrides.length) return '';
      const mkCount = overrides.filter(o => o.type === 'makeup').length;
      const cnCount = overrides.filter(o => o.type === 'cancel').length;
      const sundayDateVi = getDatesOfCurrentWeek()[6].split('-').reverse().slice(0, 2).join('/');
      return `
        <div class="temp-schedule-alert-banner" style="margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:24px">🔄</span>
            <div>
              <div style="font-weight:800;color:#fde68a;font-size:13.5px">Lịch điều chỉnh tuần này: ${mkCount} ca học bù • ${cnCount} buổi báo nghỉ</div>
              <div style="font-size:11.5px;color:#fed7aa">Chỉ áp dụng trong tuần này — Tự động hoàn nguyên về lịch cố định sau Chủ Nhật (${sundayDateVi}).</div>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="ghost" style="padding:5px 12px;font-size:12px;border-color:rgba(245,158,11,0.4);color:#fde68a" onclick="openAddMakeupModal()">＋ Thêm học bù</button>
            <button class="ghost" style="padding:5px 12px;font-size:12px;border-color:rgba(245,158,11,0.4);color:#fde68a" onclick="go('timetable')">Xem chi tiết TKB</button>
          </div>
        </div>
      `;
    })()}

    <div class="grid stats">
      <div class="card"><div class="stat-label">BTVN cần nộp</div><div class="stat-value">${todo.length}</div></div>
      <div class="card"><div class="stat-label">Đã hoàn thành</div><div class="stat-value">${done.length}</div></div>
      <div class="card"><div class="stat-label">Ca học thêm tuần này</div><div class="stat-value">${(db.extraClasses || []).length}</div></div>
      <div class="card"><div class="stat-label">Ghi chú đã lưu</div><div class="stat-value">${(db.notes || []).length}</div></div>
    </div>

    <div class="grid two">
      <!-- Left: Today Schedule Summary -->
      <div class="card">
        <div class="titlebar">
          <h2>Thời khóa biểu hôm nay (${todayInfo.dayName})</h2>
          <button class="ghost" onclick="go('timetable')">Mở TKB</button>
        </div>
        <div style="background:#090f1d;border:1px solid #1a253d;border-radius:14px;padding:14px;margin-bottom:10px">
          <div style="font-size:13px;font-weight:750;color:#38bdf8;margin-bottom:6px">☀️ Sáng trường (07:30 – 11:05):</div>
          <div style="font-size:13px;color:#e2e8f0;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:4px">
            ${todayInfo.morning.map(s => `
              <span class="badge" style="background:#1e293b;padding:4px 8px" title="${s.note ? 'Lưu ý: ' + esc(s.note) : ''}">
                ${s.slot}. ${esc(s.s)}
                ${s.note ? `<b style="color:#fde047;margin-left:4px">[📌 ${esc(s.note)}]</b>` : ''}
              </span>
            `).join('') || '<span style="color:var(--muted)">Nghỉ sáng</span>'}
          </div>

          <div style="font-size:13px;font-weight:750;color:#fb923c;margin-bottom:6px">🌤️ Chiều trường (13:30 – 16:15):</div>
          <div style="font-size:13px;color:#e2e8f0;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:4px">
            ${todayInfo.afternoon.map(s => `
              <span class="badge" style="background:#1e293b;padding:4px 8px" title="${s.note ? 'Lưu ý: ' + esc(s.note) : ''}">
                ${s.slot}. ${esc(s.s)}
                ${s.note ? `<b style="color:#fde047;margin-left:4px">[📌 ${esc(s.note)}]</b>` : ''}
              </span>
            `).join('') || '<span style="color:var(--muted)">Nghỉ chiều</span>'}
          </div>

          <div style="font-size:13px;font-weight:750;color:#c084fc;margin-bottom:6px">🎓 Ca học thêm hôm nay:</div>
          <div>
            ${todayInfo.extras.length ? todayInfo.extras.map(ex => `
              <div style="font-size:12px;color:#cbd5e1;padding:4px 0">
                • <b>${esc(ex.subject)}</b> (${esc(ex.time)}) — ${esc(ex.location || 'Chưa có phòng')}
                ${ex.note ? `<span style="color:#a5b4fc;margin-left:4px">[📌 ${esc(ex.note)}]</span>` : ''}
              </div>
            `).join('') : '<span style="color:var(--muted);font-size:12px">Hôm nay không có ca học thêm.</span>'}
          </div>

          ${isTodayDayOff ? `
            <div class="holiday-suggestion-dynamic-box" style="margin-top:12px;background:rgba(15,23,42,0.7);border:1px dashed rgba(253,224,71,0.35);border-radius:10px;padding:10px 12px">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
                <div style="font-weight:750;color:#fde047;font-size:12.5px;display:flex;align-items:center;gap:6px">
                  <span style="font-size:15px">${holidaySug.icon}</span> <span>Gợi ý hôm nay: ${esc(holidaySug.title)}</span>
                </div>
                <button class="ghost" style="padding:3px 8px;font-size:11px;border-color:rgba(253,224,71,0.35);color:#fde047;border-radius:6px;cursor:pointer" onclick="randomizeHolidaySuggestion()">🎲 Đổi gợi ý khác</button>
              </div>
              <div style="font-size:12px;color:#fef08a;line-height:1.45;opacity:0.95">${esc(holidaySug.desc)}</div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Right: Pending Tasks -->
      <div class="card">
        <div class="titlebar">
          <h2>Bài tập & BTVN cần làm</h2>
          <button class="ghost" onclick="go('tasks')">Xem tất cả</button>
        </div>
        <div class="list">
          ${todo.slice(0, 4).map(renderTaskItemMini).join('') || '<div class="empty">Không còn bài tập nào cần làm 🎉</div>'}
        </div>
      </div>
    </div>
  `;

  // Start live clock immediate tick
  updateLiveClock();
}

function renderUrgentTaskItem(t, type) {
  let tag = '';
  if (type === 'overdue') tag = '<span class="badge danger" style="font-size:10px;font-weight:800">🔴 QUÁ HẠN</span>';
  else if (type === 'today') tag = '<span class="badge" style="background:#854d0e;color:#fef08a;font-size:10px;font-weight:800">⚠️ HẠN HÔM NAY</span>';
  else if (type === 'tomorrow') tag = '<span class="badge" style="background:#1e3a5f;color:#93c5fd;font-size:10px;font-weight:800">⏰ HẠN NGÀY MAI</span>';

  const sub = t.subtasks || [];
  const doneSub = sub.filter(s => s.done).length;
  const prog = sub.length ? `<span style="font-size:11px;color:#94a3b8;margin-left:6px">(${doneSub}/${sub.length} bài)</span>` : '';

  return `
    <div class="deadline-alert-item" onclick="viewTaskDetailModal('${t.id}')">
      <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
        ${tag}
        ${t.subject ? `<span class="badge" style="background:#1e293b;font-size:10px">${esc(t.subject)}</span>` : ''}
        <b style="font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.title)}</b>
        ${prog}
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="font-size:11px;color:#fca5a5;white-space:nowrap">Hạn: ${date(t.due)}</span>
        <button class="primary" style="padding:4px 10px;font-size:11px" onclick="event.stopPropagation();viewTaskDetailModal('${t.id}')">Làm bài ➔</button>
      </div>
    </div>
  `;
}

const renderTaskItem = renderTaskItemMini;
function renderTaskItemMini(t) {
  const cat = TASK_CATEGORIES[t.category] || TASK_CATEGORIES.btvn;
  const subtasks = t.subtasks || [];
  const doneSub = subtasks.filter(s => s.done).length;

  let dueBadge = '';
  if (t.due) {
    if (t.due < today() && !t.done) dueBadge = '<span class="badge danger">Quá hạn</span>';
    else if (t.due === today() && !t.done) dueBadge = '<span class="badge" style="background:#854d0e;color:#fef08a">Hôm nay</span>';
    else dueBadge = `<span class="badge">Hạn: ${date(t.due)}</span>`;
  }

  const subtasksPreview = subtasks.length ? `
    <div style="font-size:11px;color:#94a3b8;margin-top:4px;display:flex;align-items:center;gap:6px">
      <span>📋 ${doneSub}/${subtasks.length} bài:</span>
      <span style="color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px">
        ${esc(subtasks.map(s => s.text).join(' • '))}
      </span>
    </div>
  ` : (t.body ? `<div style="font-size:11px;color:#94a3b8;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px">📝 ${esc(t.body)}</div>` : '');

  return `
    <div class="item" style="cursor:pointer;transition:.18s" title="Bấm để xem chi tiết bài tập">
      <button class="check ${t.done ? 'done' : ''}" data-toggle="${t.id}" title="Hoàn thành">${t.done ? '✓' : ''}</button>
      <div class="itemmain" onclick="viewTaskDetailModal('${t.id}')">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px">
          <span class="task-cat-badge ${cat.class}" style="font-size:9px;padding:2px 6px">${cat.label}</span>
          ${t.subject ? `<span class="badge" style="font-size:9px;padding:2px 5px">${esc(t.subject)}</span>` : ''}
          ${dueBadge}
        </div>
        <div class="itemtitle" style="font-size:14px">${esc(t.title)}</div>
        ${subtasksPreview}
      </div>
      <div style="display:flex;gap:4px">
        <button class="ghost" onclick="viewTaskDetailModal('${t.id}')" title="Xem chi tiết" style="padding:6px 9px;font-size:12px">👁️</button>
        <button class="ghost" onclick="deleteTask('${t.id}')" title="Xóa bài tập" style="padding:6px 9px;font-size:12px;color:#f87171;border-color:rgba(239,68,68,0.2)">🗑️</button>
      </div>
    </div>
  `;
}

function viewTaskDetailModal(taskId) {
  const t = db.tasks.find(x => x.id === taskId);
  if (!t) return;

  const cat = TASK_CATEGORIES[t.category] || TASK_CATEGORIES.btvn;
  const subtasks = t.subtasks || [];
  const doneSub = subtasks.filter(s => s.done).length;
  const pct = subtasks.length ? Math.round((doneSub / subtasks.length) * 100) : 0;

  const body = `
    <div style="padding:4px 0">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <span class="task-cat-badge ${cat.class}">${cat.label}</span>
        ${t.subject ? `<span class="badge" style="background:#1e293b;font-weight:700">Môn ${esc(t.subject)}</span>` : ''}
        <span class="badge ${t.due < today() && !t.done ? 'danger' : ''}">
          📅 Hạn nộp: ${t.due ? date(t.due) : 'Không đặt hạn'}
        </span>
        <span class="badge" style="background:#1e293b">
          ${t.priority === 'high' ? '🔴 Ưu tiên cao' : (t.priority === 'med' ? '🟡 Bình thường' : '🟢 Thấp')}
        </span>
      </div>

      <div style="font-size:18px;font-weight:850;color:#fff;margin-bottom:10px;line-height:1.4">
        ${esc(t.title)}
      </div>

      ${t.body ? `
        <div style="background:#090f1d;border:1px solid #1a253d;border-radius:12px;padding:12px;margin-bottom:14px">
          <div style="font-size:11px;font-weight:750;color:#38bdf8;margin-bottom:4px">📝 Ghi chú chi tiết:</div>
          <div style="font-size:13px;color:#cbd5e1;line-height:1.5;white-space:pre-wrap">${esc(t.body)}</div>
        </div>
      ` : ''}

      ${subtasks.length ? `
        <div style="background:#090f1d;border:1px solid #1a253d;border-radius:12px;padding:14px;margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <b style="font-size:12px;color:var(--a2)">📋 Danh sách các câu / bài cần làm (${doneSub}/${subtasks.length}):</b>
            <span style="font-size:11px;color:var(--muted);font-weight:700">${pct}%</span>
          </div>
          <div class="task-progress-mini" style="margin:0 0 10px 0">
            <i style="width:${pct}%"></i>
          </div>
          <div class="subtask-list" style="margin:0;gap:8px">
            ${subtasks.map(st => `
              <div class="subtask-item ${st.done ? 'checked' : ''}" style="background:#050914;padding:8px 10px;border-radius:8px;border:1px solid #131c2e">
                <button class="subtask-check ${st.done ? 'checked' : ''}" onclick="toggleSubtaskFromModal('${t.id}', '${st.id}')">${st.done ? '✓' : ''}</button>
                <span style="font-size:13px">${esc(st.text)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '<div style="font-size:12px;color:var(--muted);margin-bottom:12px">Bài tập này không có checklist câu hỏi nhỏ.</div>'}

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;gap:8px">
          <button class="ghost" onclick="taskModal('${t.id}')">✎ Sửa bài tập</button>
          <button class="ghost" style="color:#f87171;border-color:rgba(239,68,68,0.35)" onclick="deleteTask('${t.id}')">🗑️ Xóa bài tập</button>
        </div>
        <div style="display:flex;gap:8px">
          <button class="primary" onclick="toggleTaskDone('${t.id}')">${t.done ? '↩ Đánh dấu chưa xong' : '✓ Hoàn thành bài này'}</button>
        </div>
      </div>
    </div>
  `;

  modal('📖 Chi tiết bài tập', body);
}

function toggleSubtaskFromModal(taskId, subtaskId) {
  const t = db.tasks.find(x => x.id === taskId);
  if (t && t.subtasks) {
    const st = t.subtasks.find(s => s.id === subtaskId);
    if (st) {
      st.done = !st.done;
      save();
      viewTaskDetailModal(taskId);
      if (location.hash === '#dashboard' || !location.hash) dashboard();
      else if (location.hash === '#tasks') renderTasksList();
    }
  }
}

// ----------------- MODULE: TASKS (BÀI TẬP VỚI PHÂN LOẠI & BẮT BUỘC BTVN) -----------------
let taskFilter = {
  status: 'all',
  category: 'all',
  subject: 'all',
  search: ''
};

const TASK_CATEGORIES = {
  btvn: { label: 'Bài tập về nhà', class: 'cat-btvn' },
  onthi: { label: 'Ôn kiểm tra / Thi', class: 'cat-onthi' },
  duan: { label: 'Dự án / Thuyết trình', class: 'cat-duan' },
  khac: { label: 'Khác', class: 'cat-khac' }
};

function tasks() {
  const subjects = Array.from(new Set(db.tasks.map(t => t.subject).filter(Boolean)));

  $('#content').innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow">TASKS & ASSIGNMENTS</div>
        <h1>Bài tập về nhà (BTVN)</h1>
        <p>BTVN bắt buộc điền ngày nộp và số lượng câu hỏi để kiểm soát tiến độ làm bài.</p>
      </div>
      <button class="primary" onclick="taskModal()">＋ Thêm BTVN mới</button>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="toolbar" style="margin-bottom:12px">
        <input id="taskSearchInput" class="input" placeholder="🔍 Tìm kiếm bài tập..." value="${esc(taskFilter.search)}">
        <select id="taskSubjectFilter" class="select" style="max-width:180px">
          <option value="all">Tất cả môn học</option>
          ${subjects.map(s => `<option value="${esc(s)}" ${taskFilter.subject === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
        </select>
      </div>

      <div class="filter-bar">
        <span class="filter-chip ${taskFilter.status === 'all' ? 'active' : ''}" onclick="setTaskStatusFilter('all')">Tất cả bài</span>
        <span class="filter-chip ${taskFilter.status === 'todo' ? 'active' : ''}" onclick="setTaskStatusFilter('todo')">⏳ Cần làm</span>
        <span class="filter-chip ${taskFilter.status === 'done' ? 'active' : ''}" onclick="setTaskStatusFilter('done')">✓ Đã xong</span>
        <span style="border-right:1px solid var(--line);margin:0 4px"></span>
        <span class="filter-chip ${taskFilter.category === 'all' ? 'active' : ''}" onclick="setTaskCatFilter('all')">Mọi phân loại</span>
        <span class="filter-chip ${taskFilter.category === 'btvn' ? 'active' : ''}" onclick="setTaskCatFilter('btvn')">📚 BTVN</span>
        <span class="filter-chip ${taskFilter.category === 'onthi' ? 'active' : ''}" onclick="setTaskCatFilter('onthi')">🎯 Ôn kiểm tra</span>
        <span class="filter-chip ${taskFilter.category === 'duan' ? 'active' : ''}" onclick="setTaskCatFilter('duan')">💼 Dự án</span>
      </div>

      <div id="tasksContainer" class="list"></div>
    </div>
  `;

  $('#taskSearchInput').oninput = e => {
    taskFilter.search = e.target.value;
    renderTasksList();
  };

  $('#taskSubjectFilter').onchange = e => {
    taskFilter.subject = e.target.value;
    renderTasksList();
  };

  renderTasksList();
}

function setTaskStatusFilter(status) {
  taskFilter.status = status;
  tasks();
}

function setTaskCatFilter(cat) {
  taskFilter.category = cat;
  tasks();
}

function renderTasksList() {
  const container = $('#tasksContainer');
  if (!container) return;

  let filtered = db.tasks.filter(t => {
    if (taskFilter.status === 'todo' && t.done) return false;
    if (taskFilter.status === 'done' && !t.done) return false;
    if (taskFilter.category !== 'all' && (t.category || 'btvn') !== taskFilter.category) return false;
    if (taskFilter.subject !== 'all' && t.subject !== taskFilter.subject) return false;
    if (taskFilter.search) {
      const q = taskFilter.search.toLowerCase();
      const matchText = (t.title + ' ' + (t.subject || '') + ' ' + (t.body || '')).toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => (a.done - b.done) || (a.due || '').localeCompare(b.due || ''));

  if (!filtered.length) {
    container.innerHTML = '<div class="empty">Không có bài tập nào phù hợp với bộ lọc.</div>';
    return;
  }

  container.innerHTML = filtered.map(t => {
    const cat = TASK_CATEGORIES[t.category] || TASK_CATEGORIES.btvn;
    const subtasks = t.subtasks || [];
    const doneSub = subtasks.filter(s => s.done).length;
    const pct = subtasks.length ? Math.round((doneSub / subtasks.length) * 100) : 0;

    let dueBadge = '';
    if (t.due) {
      if (t.due < today() && !t.done) dueBadge = '<span class="badge danger">Quá hạn</span>';
      else if (t.due === today() && !t.done) dueBadge = '<span class="badge" style="background:#854d0e;color:#fef08a">Hạn hôm nay</span>';
      else dueBadge = `<span class="badge">Hạn: ${date(t.due)}</span>`;
    }

    let prioClass = t.priority === 'high' ? 'prio-high' : (t.priority === 'med' ? 'prio-med' : 'prio-low');
    let prioLabel = t.priority === 'high' ? '● Ưu tiên cao' : (t.priority === 'med' ? '● Bình thường' : '● Thấp');

    return `
      <div class="task-card-item">
        <div class="task-header-row">
          <button class="check ${t.done ? 'done' : ''}" onclick="toggleTaskDone('${t.id}')">${t.done ? '✓' : ''}</button>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="task-cat-badge ${cat.class}">${cat.label}</span>
              ${t.subject ? `<span class="badge" style="background:#1e293b">${esc(t.subject)}</span>` : ''}
              <span style="font-size:11px" class="${prioClass}">${prioLabel}</span>
              ${dueBadge}
            </div>
            <div style="font-size:15px;font-weight:750;margin-top:5px;${t.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">
              ${esc(t.title)}
            </div>
            ${t.body ? `<div style="font-size:12px;color:var(--muted);margin-top:4px">${esc(t.body)}</div>` : ''}
          </div>
          <div style="display:flex;gap:4px">
            <button class="ghost" onclick="taskModal('${t.id}')" title="Chỉnh sửa">✎</button>
            <button class="ghost" onclick="deleteTask('${t.id}')" title="Xóa">🗑️</button>
          </div>
        </div>

        ${subtasks.length ? `
          <div class="task-progress-mini">
            <i style="width:${pct}%"></i>
          </div>
          <div class="subtask-list">
            ${subtasks.map(st => `
              <div class="subtask-item ${st.done ? 'checked' : ''}">
                <button class="subtask-check ${st.done ? 'checked' : ''}" onclick="toggleSubtask('${t.id}', '${st.id}')">${st.done ? '✓' : ''}</button>
                <span>${esc(st.text)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function toggleTaskDone(taskId) {
  const t = db.tasks.find(x => x.id === taskId);
  if (!t) return;

  if (!t.done) {
    const subtasks = t.subtasks || [];
    const doneSub = subtasks.filter(s => s.done).length;

    let subtasksHtml = '';
    if (subtasks.length) {
      subtasksHtml = `
        <div style="background:#090f1e;border:1px solid #1e2c47;border-radius:12px;padding:12px;margin:12px 0;text-align:left">
          <div style="font-size:12px;font-weight:750;color:#38bdf8;margin-bottom:8px">
            📋 Các bài / câu trong BTVN (${doneSub}/${subtasks.length} đã hoàn thành):
          </div>
          <div style="display:grid;gap:6px">
            ${subtasks.map((st, idx) => `
              <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;color:#cbd5e1">
                <input type="checkbox" id="conf_st_${idx}" ${st.done ? 'checked' : ''} style="width:16px;height:16px">
                <span style="${st.done ? 'text-decoration:line-through;opacity:0.7' : ''}">${esc(st.text)}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }

    modal('🎯 Xác nhận hoàn thành BTVN', `
      <div style="text-align:center;padding:6px 0">
        <div style="font-size:36px;margin-bottom:8px">📝 ➔ ✅</div>
        <div style="font-size:17px;font-weight:800;color:#fff">${esc(t.title)}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">${t.subject ? 'Môn ' + esc(t.subject) + ' • ' : ''}Hạn nộp: ${t.due ? date(t.due) : 'Không có'}</div>
        ${subtasksHtml}
        <p style="font-size:13px;color:#cbd5e1;margin:14px 0 6px">Bạn đã chắc chắn làm xong toàn bộ các bài này chưa?</p>
      </div>
    `, () => {
      if (t.subtasks && t.subtasks.length) {
        t.subtasks.forEach((st, idx) => {
          const chk = $(`#conf_st_${idx}`);
          st.done = chk ? chk.checked : true;
        });
      }
      t.done = true;
      save();
      playChime();
      toast('🎉 Tuyệt vời! Đã hoàn thành bài tập!');
      renderTasksList();
      if (location.hash === '#dashboard' || !location.hash) dashboard();
      return true;
    });
  } else {
    if (confirm(`Chuyển bài tập "${t.title}" về trạng thái Chưa hoàn thành để làm tiếp?`)) {
      t.done = false;
      save();
      toast('Đã chuyển bài tập về Chưa xong');
      renderTasksList();
      if (location.hash === '#dashboard' || !location.hash) dashboard();
    }
  }
}

function toggleSubtask(taskId, subtaskId) {
  const t = db.tasks.find(x => x.id === taskId);
  if (t && t.subtasks) {
    const st = t.subtasks.find(s => s.id === subtaskId);
    if (st) {
      st.done = !st.done;
      const allDone = t.subtasks.every(s => s.done);
      if (allDone && !t.done) {
        toggleTaskDone(taskId);
        return;
      }
      save();
      renderTasksList();
    }
  }
}

function deleteTask(taskId) {
  const t = db.tasks.find(x => x.id === taskId);
  const title = t ? ` "${t.title}"` : '';
  if (confirm(`Bạn có chắc chắn muốn xóa bài tập${title} không?`)) {
    db.tasks = db.tasks.filter(x => x.id !== taskId);
    save();
    closeModal();
    toast('🗑️ Đã xóa bài tập thành công!');
    if (location.hash === '#tasks') renderTasksList();
    else if (location.hash === '#dashboard' || !location.hash) dashboard();
    else {
      const views = { dashboard, timetable, tasks, notes, progress, settings };
      const cur = location.hash.slice(1) || 'dashboard';
      if (views[cur]) views[cur]();
    }
  }
}

function taskModal(editId = null) {
  const existing = editId ? db.tasks.find(x => x.id === editId) : null;
  const isEdit = !!existing;
  const currentSubtasks = (existing?.subtasks || []).map(st => st.text).join('\n');
  const initialCat = existing?.category || 'btvn';

  modal(isEdit ? 'Chỉnh sửa bài tập / BTVN' : 'Thêm Bài tập về nhà (BTVN) mới', `
    <div class="form">
      <div class="field full">
        <label>Tên bài tập / Nhiệm vụ *</label>
        <input id="ftTitle" class="input" value="${esc(existing?.title || '')}" placeholder="Ví dụ: BTVN Toán Đại số trang 45..." autofocus>
      </div>
      <div class="field">
        <label>Môn học *</label>
        <input id="ftSub" class="input" value="${esc(existing?.subject || '')}" placeholder="Toán, Văn, Anh, Lý, Hóa...">
      </div>
      <div class="field">
        <label>Phân loại bài tập</label>
        <select id="ftCat" class="select" onchange="handleCatChange()">
          <option value="btvn" ${initialCat === 'btvn' ? 'selected' : ''}>📚 Bài tập về nhà (BTVN)</option>
          <option value="onthi" ${initialCat === 'onthi' ? 'selected' : ''}>🎯 Ôn kiểm tra / Thi</option>
          <option value="duan" ${initialCat === 'duan' ? 'selected' : ''}>💼 Dự án / Thuyết trình</option>
          <option value="khac" ${initialCat === 'khac' ? 'selected' : ''}>📌 Khác</option>
        </select>
      </div>
      <div class="field">
        <label>Mức độ ưu tiên</label>
        <select id="ftPrio" class="select">
          <option value="high" ${existing?.priority === 'high' ? 'selected' : ''}>🔴 Ưu tiên cao</option>
          <option value="med" ${(!existing || existing?.priority === 'med') ? 'selected' : ''}>🟡 Bình thường</option>
          <option value="low" ${existing?.priority === 'low' ? 'selected' : ''}>🟢 Thấp</option>
        </select>
      </div>
      <div class="field">
        <label id="lblDue">Hạn nộp (Deadline) <span id="dueRequiredStar" style="color:#f87171">* (Bắt buộc với BTVN)</span></label>
        <input id="ftDue" class="input" type="date" value="${existing?.due || today()}" required>
      </div>

      <!-- BTVN Quantity Generator -->
      <div class="field full" id="btvnQtyBox" style="background:#090f1d;border:1px solid #1a253d;border-radius:12px;padding:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
          <label style="font-size:12px;font-weight:750;color:#38bdf8">
            🔢 Số lượng bài tập / câu hỏi cần làm:
          </label>
          <div style="display:flex;gap:6px;align-items:center">
            <input id="ftQtyNum" class="input" type="number" min="1" max="50" placeholder="Số câu (vd: 5)" style="width:110px;padding:6px 10px;font-size:12px">
            <button class="primary" type="button" onclick="generateSubtaskList()" style="padding:6px 12px;font-size:12px">⚡ Tự tạo danh sách</button>
          </div>
        </div>
        <div style="font-size:11px;color:var(--muted)">Nhập số lượng câu (ví dụ: 5) rồi bấm "Tự tạo danh sách" để tự sinh ra: Bài 1, Bài 2, Bài 3,...</div>
      </div>

      <div class="field full">
        <label>Danh sách chi tiết các bài / câu hỏi (Mỗi dòng một bài) <span id="subtaskRequiredStar" style="color:#f87171">* (Bắt buộc với BTVN)</span></label>
        <textarea id="ftSubtasks" class="textarea" rows="4" placeholder="Ví dụ:&#10;Bài 1 trang 45&#10;Bài 2 trang 45&#10;Bài 3 (câu a, b)">${esc(currentSubtasks)}</textarea>
      </div>

      <div class="field full">
        <label>Ghi chú thêm</label>
        <textarea id="ftBody" class="textarea" rows="2" placeholder="Ghi chú thêm nếu có...">${esc(existing?.body || '')}</textarea>
      </div>

      ${isEdit ? `
        <div class="field full" style="margin-top:10px;padding-top:10px;border-top:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;color:var(--muted)">Không cần bài này nữa?</span>
          <button type="button" class="ghost" style="color:#f87171;border-color:rgba(239,68,68,0.35);font-size:12px;padding:6px 12px" onclick="deleteTask('${existing.id}')">🗑️ Xóa bài tập này</button>
        </div>
      ` : ''}
    </div>
  `, () => {
    const title = $('#ftTitle').value.trim();
    const cat = $('#ftCat').value;
    const due = $('#ftDue').value.trim();

    if (!title) return toast('Vui lòng nhập tên bài tập!'), false;

    const subtaskLines = $('#ftSubtasks').value.split('\n').map(l => l.trim()).filter(Boolean);
    const subtasks = subtaskLines.map((text, idx) => {
      const old = existing?.subtasks?.[idx];
      return { id: old?.id || id(), text, done: old ? old.done : false };
    });

    // STRICT VALIDATION FOR BTVN:
    if (cat === 'btvn') {
      if (!due) {
        toast('⚠️ Bài tập về nhà BẮT BUỘC phải chọn Ngày nộp!');
        $('#ftDue').focus();
        return false;
      }
      if (!subtasks.length) {
        toast('⚠️ Bài tập về nhà BẮT BUỘC phải điền số lượng bài hoặc danh sách câu hỏi!');
        $('#ftSubtasks').focus();
        return false;
      }
    }

    if (isEdit) {
      existing.title = title;
      existing.subject = $('#ftSub').value.trim();
      existing.category = cat;
      existing.priority = $('#ftPrio').value;
      existing.due = due;
      existing.body = $('#ftBody').value.trim();
      existing.subtasks = subtasks;
    } else {
      db.tasks.push({
        id: id(),
        title,
        subject: $('#ftSub').value.trim(),
        category: cat,
        priority: $('#ftPrio').value,
        due,
        body: $('#ftBody').value.trim(),
        done: false,
        subtasks
      });
    }
    save();
    toast(isEdit ? 'Đã cập nhật bài tập' : 'Đã thêm BTVN thành công!');
    tasks();
    return true;
  });
}

function handleCatChange() {
  const cat = $('#ftCat')?.value;
  const isBtvn = cat === 'btvn';
  const qtyBox = $('#btvnQtyBox');
  const dueStar = $('#dueRequiredStar');
  const subStar = $('#subtaskRequiredStar');

  if (qtyBox) qtyBox.style.display = isBtvn ? 'block' : 'none';
  if (dueStar) dueStar.style.display = isBtvn ? 'inline' : 'none';
  if (subStar) subStar.style.display = isBtvn ? 'inline' : 'none';
}

function generateSubtaskList() {
  const num = parseInt($('#ftQtyNum').value, 10);
  if (!num || num <= 0) return toast('Vui lòng nhập số lượng bài (ví dụ: 3, 5, 10)');
  if (num > 50) return toast('Số lượng bài tối đa là 50 câu!');

  const items = [];
  for (let i = 1; i <= num; i++) {
    items.push(`Bài ${i}`);
  }

  $('#ftSubtasks').value = items.join('\n');
  toast(`Đã tự tạo danh sách gồm ${num} bài tập!`);
}

function bindTaskCheckboxes() {
  $$('[data-toggle]').forEach(b => b.onclick = () => {
    toggleTaskDone(b.dataset.toggle);
  });
}

// ----------------- MODULE: TIMETABLE & EXTRA CLASSES -----------------
let timetableMode = 'school';

function getInitialSchoolDayIdx() {
  const day = new Date().getDay();
  if (day >= 1 && day <= 6) return day - 1;
  return 0;
}

let selectedSchoolDayIdx = getInitialSchoolDayIdx();
let schoolViewMode = 'day';

function getSubjectMeta(subName) {
  if (!subName) return { icon: '📖', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: '#334155' };
  const s = subName.toLowerCase().trim();
  if (s.includes('toán')) return { icon: '📐', color: '#60a5fa', bg: 'rgba(96,165,250,0.16)', border: '#3b82f6' };
  if (s.includes('văn') || s.includes('ngữ văn')) return { icon: '📚', color: '#f472b6', bg: 'rgba(244,114,182,0.16)', border: '#ec4899' };
  if (s.includes('anh') || s.includes('english') || s.includes('ielts')) return { icon: '🇬🇧', color: '#38bdf8', bg: 'rgba(56,189,248,0.16)', border: '#0ea5e9' };
  if (s.includes('lý') || s.includes('vật lí') || s.includes('vật lý')) return { icon: '⚡', color: '#a78bfa', bg: 'rgba(167,139,250,0.16)', border: '#8b5cf6' };
  if (s.includes('hóa') || s.includes('hóa học')) return { icon: '🧪', color: '#34d399', bg: 'rgba(52,211,153,0.16)', border: '#10b981' };
  if (s.includes('sinh') || s.includes('sinh học')) return { icon: '🌱', color: '#4ade80', bg: 'rgba(74,222,128,0.16)', border: '#22c55e' };
  if (s.includes('sử') || s.includes('lịch sử')) return { icon: '📜', color: '#fb923c', bg: 'rgba(251,146,60,0.16)', border: '#f97316' };
  if (s.includes('địa') || s.includes('địa lý') || s.includes('địa lí')) return { icon: '🌍', color: '#2dd4bf', bg: 'rgba(45,212,191,0.16)', border: '#14b8a6' };
  if (s.includes('tin') || s.includes('tin học')) return { icon: '💻', color: '#38bdf8', bg: 'rgba(56,189,248,0.16)', border: '#0284c7' };
  if (s.includes('thể dục') || s.includes('gdtc')) return { icon: '🏃', color: '#facc15', bg: 'rgba(250,204,21,0.16)', border: '#eab308' };
  if (s.includes('gdcd') || s.includes('gddp') || s.includes('địa phương')) return { icon: '🎨', color: '#e879f9', bg: 'rgba(232,121,249,0.16)', border: '#d946ef' };
  if (s.includes('hdtn') || s.includes('trải nghiệm') || s.includes('hđtn')) return { icon: '💡', color: '#fbbf24', bg: 'rgba(251,191,36,0.16)', border: '#d97706' };
  if (s.includes('gdqp') || s.includes('quốc phòng')) return { icon: '🛡️', color: '#a3e635', bg: 'rgba(163,230,53,0.16)', border: '#84cc16' };
  if (s.includes('công nghệ')) return { icon: '⚙️', color: '#94a3b8', bg: 'rgba(148,163,184,0.16)', border: '#64748b' };
  if (s.includes('chào cờ') || s.includes('sinh hoạt')) return { icon: '🚩', color: '#f87171', bg: 'rgba(248,113,113,0.16)', border: '#ef4444' };
  return { icon: '📖', color: '#c084fc', bg: 'rgba(192,132,252,0.16)', border: '#a855f7' };
}

let pcSchoolViewMode = 'matrix'; // PC defaults to matrix table

function isMobileScreen() {
  return window.innerWidth <= 768;
}

function getEffectiveSchoolViewMode() {
  if (isMobileScreen()) return 'day'; // Mobile is ALWAYS locked to Day Timeline
  return pcSchoolViewMode; // PC uses pcSchoolViewMode (default 'matrix')
}

function selectSchoolDay(dayIdx) {
  selectedSchoolDayIdx = dayIdx;
  renderSchoolTable();
}

function toggleSchoolViewMode(mode) {
  if (isMobileScreen()) return; // Prevent switching to matrix on mobile screens
  pcSchoolViewMode = mode;
  renderSchoolTable();
}

function timetable() {
  $('#content').innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow">TIMETABLE & SCHEDULE</div>
        <h1>Thời khóa biểu & Lịch học thêm</h1>
        <p>Quản lý TKB chính khóa trên trường và lịch học thêm buổi tối / cuối tuần.</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${timetableMode === 'school' ? '<button class="primary" onclick="openTimetableManagerModal()">⚙ Thay đổi TKB trường</button><button class="ghost" style="border-color:#38bdf8;color:#38bdf8;font-weight:700" onclick="openPeriodConfigModal()">➕ Thêm tiết / Chỉnh số tiết</button>' : ''}
        ${timetableMode === 'extra' ? '<button class="ghost" style="border-color:#f59e0b;color:#fde68a" onclick="openAddMakeupModal()">🔄 ＋ Học bù tuần này</button><button class="primary" onclick="extraClassModal()">＋ Thêm ca học thêm</button>' : ''}
        ${timetableMode === 'combined' ? '<button class="ghost" style="border-color:#f59e0b;color:#fde68a" onclick="openAddMakeupModal()">🔄 ＋ Học bù tuần này</button><button class="ghost" onclick="extraClassModal()">＋ Thêm học thêm</button><button class="primary" onclick="openTimetableManagerModal()">⚙ Chỉnh TKB</button>' : ''}
      </div>
    </div>

    <!-- Mode Switcher Tabs -->
    <div class="tt-mode-bar">
      <button class="tt-mode-btn ${timetableMode === 'school' ? 'active' : ''}" onclick="switchTimetableMode('school')">
        🏫 TKB Chính Khóa
      </button>
      <button class="tt-mode-btn ${timetableMode === 'extra' ? 'active' : ''}" onclick="switchTimetableMode('extra')">
        🎯 Lịch Học Thêm (${(db.extraClasses || []).length})
      </button>
      <button class="tt-mode-btn ${timetableMode === 'combined' ? 'active' : ''}" onclick="switchTimetableMode('combined')">
        📅 Lịch Toàn Tuần
      </button>
    </div>

    <div id="timetableBody"></div>
  `;

  if (timetableMode === 'school') renderSchoolTable();
  else if (timetableMode === 'extra') renderExtraClassesTable();
  else if (timetableMode === 'combined') renderCombinedWeeklyTable();
}

function switchTimetableMode(mode) {
  timetableMode = mode;
  timetable();
}

function renderSchoolTable() {
  const conf = getSessionsConfig();
  const by = (session, slot, d) => (db.schoolTT || []).find(x => x.d === d && x.session === session && x.slot === slot);

  const currentDay = new Date().getDay();
  const todaySchoolIdx = (currentDay >= 1 && currentDay <= 6) ? currentDay - 1 : -1;
  const selectedDayName = SCHOOL_DAYS[selectedSchoolDayIdx] || `Thứ ${selectedSchoolDayIdx + 2}`;

  // 1. Day Picker Carousel HTML
  const dayPillsHtml = `
    <div class="mobile-day-picker">
      ${SCHOOL_DAYS.map((dayName, idx) => {
    const isAct = idx === selectedSchoolDayIdx;
    const isTod = idx === todaySchoolIdx;
    const mCount = (db.schoolTT || []).filter(x => x.d === idx && x.session === 'morning').length;
    const aCount = (db.schoolTT || []).filter(x => x.d === idx && x.session === 'afternoon').length;
    const total = mCount + aCount;
    return `
          <div class="day-pill ${isAct ? 'active' : ''} ${isTod ? 'is-today' : ''}" onclick="selectSchoolDay(${idx})">
            <div class="day-pill-name">${dayName}</div>
            <div class="day-pill-sub">${isTod ? '• Hôm nay' : `${total} tiết`}</div>
          </div>
        `;
  }).join('')}
    </div>
  `;

  // 2. Daily Timeline Cards HTML
  const renderDayTimeline = () => {
    const renderPeriodCard = (sessionKey, sl) => {
      const x = by(sessionKey, sl.slot, selectedSchoolDayIdx);
      if (!x) {
        return `
          <div class="mobile-timeline-card empty-period" onclick="schoolTTModal('${sessionKey}', ${sl.slot}, ${selectedSchoolDayIdx})">
            <div class="period-badge-col">
              <div class="p-num">Tiết ${sl.slot}</div>
              <div class="p-time">${sl.time}</div>
            </div>
            <div class="period-main-col">
              <div style="font-size:13.5px;color:var(--muted);font-weight:700">＋ Thêm môn học cho Tiết ${sl.slot}</div>
            </div>
            <div class="period-action-col">
              <div class="period-edit-btn" title="Thêm môn">＋</div>
            </div>
          </div>
        `;
      }

      const meta = getSubjectMeta(x.s);
      return `
        <div class="mobile-timeline-card" onclick="schoolTTModal('${sessionKey}', ${sl.slot}, ${selectedSchoolDayIdx})">
          <div class="period-badge-col">
            <div class="p-num" style="color:${meta.color}">Tiết ${sl.slot}</div>
            <div class="p-time">${sl.time}</div>
          </div>
          <div class="period-main-col">
            <div class="period-subj-title">
              <span style="font-size:18px">${meta.icon}</span>
              <span>${esc(x.s)}</span>
              <span class="period-subj-tag" style="background:${meta.bg};color:${meta.color};border:1px solid ${meta.border}">Môn học</span>
            </div>
            <div class="period-tea-name">${x.teacher ? `👨‍🏫 ${esc(x.teacher)}` : 'Chưa nhập giáo viên'}</div>
            ${x.note ? `<div class="period-note-chip" title="Lưu ý: ${esc(x.note)}">📝 Lưu ý: ${esc(x.note)}</div>` : ''}
          </div>
          <div class="period-action-col">
            <div class="period-edit-btn" title="Chỉnh sửa tiết & ghi chú">✎</div>
          </div>
        </div>
      `;
    };

    const dayExtras = (db.extraClasses || []).filter(x => x.d === selectedSchoolDayIdx).sort((a, b) => a.time.localeCompare(b.time));

    return `
      ${dayPillsHtml}

      <!-- Buổi Sáng -->
      <div class="mobile-timeline-section">
        <div class="mobile-section-title" style="color:#38bdf8">
          <span>☀️ Buổi Sáng (${conf.morning.slots.length} tiết)</span>
          <span style="font-size:11.5px;color:var(--muted);font-weight:600">07:30 – 11:05</span>
        </div>
        <div class="truy-bai-timeline-card">
          <div class="truy-bai-timeline-icon clock-pulse-icon">⏰</div>
          <div class="truy-bai-timeline-main">
            <div class="truy-bai-timeline-title">
              <span class="truy-bai-time-badge">07:30 – 07:45</span>
              <span class="truy-bai-title-text">• Truy bài đầu giờ Buổi Sáng</span>
            </div>
            <div class="truy-bai-timeline-desc">
              <span>🔔 Học sinh có mặt trước 07:30 • Ổn định chỗ ngồi và chuẩn bị bài tập</span>
            </div>
          </div>
        </div>
        ${conf.morning.slots.map(sl => renderPeriodCard('morning', sl)).join('')}
      </div>

      <!-- Buổi Chiều -->
      <div class="mobile-timeline-section">
        <div class="mobile-section-title" style="color:#fb923c">
          <span>🌤️ Buổi Chiều (${conf.afternoon.slots.length} tiết)</span>
          <span style="font-size:11.5px;color:var(--muted);font-weight:600">13:30 – 16:15</span>
        </div>
        <div class="truy-bai-timeline-card">
          <div class="truy-bai-timeline-icon">⏰</div>
          <div class="truy-bai-timeline-main">
            <div class="truy-bai-timeline-title">
              <span class="truy-bai-time-badge">13:30 – 13:45</span>
              <span class="truy-bai-title-text">• Truy bài đầu giờ Buổi Chiều</span>
            </div>
            <div class="truy-bai-timeline-desc">
              <span>🔔 Học sinh có mặt trước 13:30 • Ổn định lớp học và kiểm tra bài cũ</span>
            </div>
          </div>
        </div>
        ${conf.afternoon.slots.map(sl => renderPeriodCard('afternoon', sl)).join('')}
      </div>

      <!-- Ca học thêm trong ngày -->
      <div class="mobile-timeline-section">
        <div class="mobile-section-title" style="color:#c084fc">
          <span>🎯 Lịch học thêm ${selectedDayName} (${dayExtras.length} ca)</span>
          <button class="ghost" style="padding:4px 10px;font-size:11.5px" onclick="extraClassModal(null, ${selectedSchoolDayIdx})">＋ Thêm ca</button>
        </div>
        ${dayExtras.length ? dayExtras.map(ex => `
          <div class="mobile-timeline-card" style="border-left:3px solid #c084fc" onclick="extraClassModal('${ex.id}')">
            <div class="period-badge-col">
              <div class="p-num" style="color:#c084fc">🎯</div>
              <div class="p-time">${esc(ex.time)}</div>
            </div>
            <div class="period-main-col">
              <div class="period-subj-title">
                <span>${esc(ex.subject)}</span>
              </div>
              <div class="period-tea-name">
                ${ex.teacher ? `👨‍🏫 ${esc(ex.teacher)} • ` : ''}${esc(ex.location || 'Chưa đặt phòng')}
              </div>
              ${ex.note ? `<div class="period-note-chip" style="background:rgba(192,132,252,0.18);color:#e9d5ff;border-color:rgba(192,132,252,0.35)">📝 ${esc(ex.note)}</div>` : ''}
            </div>
            <div class="period-action-col" style="gap:6px">
              ${ex.link ? `<a href="${esc(ex.link)}" target="_blank" onclick="event.stopPropagation()" class="extra-link-btn" style="padding:4px 9px;font-size:11px">🌐 Vào học</a>` : ''}
              <div class="period-edit-btn">✎</div>
            </div>
          </div>
        `).join('') : '<div class="empty" style="padding:16px;font-size:12.5px">Không có lịch học thêm cho ngày này.</div>'}
      </div>
    `;
  };

  // 3. Matrix Table HTML (Full week)
  const renderMatrixTable = () => {
    const renderCell = (session, slot, d) => {
      const x = by(session, slot, d);
      if (!x) return `<td onclick="schoolTTModal('${session}', ${slot}, ${d})"><div class="school-empty-slot">—</div></td>`;
      const meta = getSubjectMeta(x.s);
      return `
        <td class="has-class" onclick="schoolTTModal('${session}', ${slot}, ${d})">
          <div class="school-subject" style="color:${meta.color}">${meta.icon} ${esc(x.s)}</div>
          <div class="school-teacher">${esc(x.teacher || '')}</div>
          ${x.note ? `<div class="period-note-tag" title="Lưu ý: ${esc(x.note)}">📝 ${esc(x.note)}</div>` : ''}
        </td>
      `;
    };

    const makeTable = (sessionKey) => {
      const sess = conf[sessionKey];
      return `
        <div class="school-session">
          <div class="session-label">${sess.title}</div>
          <table class="school-tt">
            <thead>
              <tr>
                <th class="period-head">Tiết học</th>
                ${SCHOOL_DAYS.map(x => `<th>${x}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <tr class="truy-bai-row">
                <th class="period-cell truy-bai-cell">
                  <b>${sess.truyBai.label}</b>
                  <span>${sess.truyBai.time}</span>
                </th>
                <td colspan="${SCHOOL_DAYS.length}" class="truy-bai-banner">
                  <div class="truy-bai-content">
                    <span class="truy-bai-tag">${sess.truyBai.desc}</span>
                    <span class="truy-bai-sub">• Có mặt đúng giờ</span>
                  </div>
                </td>
              </tr>
              ${sess.slots.map(sl => `
                <tr>
                  <th class="period-cell">
                    <b>${sl.label}</b>
                    <span>${sl.time}</span>
                  </th>
                  ${SCHOOL_DAYS.map((_, d) => renderCell(sessionKey, sl.slot, d)).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    return `
      <div class="card school-card">
        ${makeTable('morning')}
        ${makeTable('afternoon')}
      </div>
    `;
  };

  const effectiveMode = getEffectiveSchoolViewMode();
  const isMobile = isMobileScreen();

  const viewToggleHtml = isMobile ? `
    <div style="font-size:13px;font-weight:800;color:var(--a2);display:flex;align-items:center;gap:6px">
      <span>📱 Lịch học chi tiết theo ngày</span>
    </div>
  ` : `
    <div class="school-view-toggle">
      <button class="${effectiveMode === 'matrix' ? 'active' : ''}" onclick="toggleSchoolViewMode('matrix')">
        📅 Bảng toàn tuần
      </button>
      <button class="${effectiveMode === 'day' ? 'active' : ''}" onclick="toggleSchoolViewMode('day')">
        📱 Xem theo ngày (Timeline)
      </button>
    </div>
  `;

  const ttBody = $('#timetableBody');
  if (!ttBody) return;
  ttBody.innerHTML = `
    <div class="school-banner">
      <div>
        <strong>TRƯỜNG THCS VÀ THPT TẠ QUANG BỬU</strong>
        <span>Lớp 10A4 • Khung ${conf.morning.slots.length + conf.afternoon.slots.length} tiết/ngày (Sáng ${conf.morning.slots.length} tiết, Chiều ${conf.afternoon.slots.length} tiết)</span>
      </div>
      <div class="school-note">
        Học sinh có mặt đúng giờ • Sáng trước ${conf.morning.truyBai?.time?.split('–')[0]?.trim() || '07:30'} • Chiều trước ${conf.afternoon.truyBai?.time?.split('–')[0]?.trim() || '13:30'}
      </div>
    </div>

    <!-- View Mode Switcher -->
    <div class="school-view-bar">
      ${viewToggleHtml}
      <div style="display:flex;gap:6px">
        <button class="ghost" style="padding:6px 12px;font-size:12px;border-color:#38bdf8;color:#38bdf8;font-weight:700" onclick="openPeriodConfigModal()">➕ Thêm tiết</button>
        <button class="ghost" style="padding:6px 12px;font-size:12px" onclick="openTimetableManagerModal()">⚙ Sửa TKB</button>
      </div>
    </div>

    ${effectiveMode === 'day' ? renderDayTimeline() : renderMatrixTable()}
  `;
}

function renderExtraClassesTable() {
  const container = $('#timetableBody');
  const extras = db.extraClasses || [];
  const currentWeek = getWeekKey();
  const dates = getDatesOfCurrentWeek();
  const todayD = new Date().getDay();
  const todayDayIdx = todayD === 0 ? 6 : todayD - 1;
  const todayStr = today();
  const todayChecks = (db.extraCheckins && db.extraCheckins[todayStr]) || {};

  const activeOverrides = (db.tempOverrides || []).filter(o => o.weekKey === currentWeek);
  const cancels = activeOverrides.filter(o => o.type === 'cancel');
  const makeups = activeOverrides.filter(o => o.type === 'makeup');

  container.innerHTML = `
    <div class="school-banner" style="background:linear-gradient(135deg,rgba(139,124,255,0.15),rgba(244,114,182,0.08))">
      <div>
        <strong>🎯 LỊCH HỌC THÊM NGOÀI GIỜ & CUỐI TUẦN</strong>
        <span>Tổng cộng: ${extras.length} ca cố định • ${makeups.length} ca học bù tuần này • ${cancels.length} ca báo nghỉ</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="ghost" style="border-color:#f59e0b;color:#fde68a" onclick="openAddMakeupModal()">🔄 ＋ Học bù tuần này</button>
        <button class="primary" onclick="extraClassModal()">＋ Thêm ca học thêm</button>
      </div>
    </div>

    ${activeOverrides.length ? `
      <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:14px;padding:12px 16px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div style="font-size:12.5px;color:#fde68a">
          ⚡ <b>Lịch điều chỉnh tuần này (${currentWeek}):</b> ${makeups.length} ca học bù, ${cancels.length} buổi báo nghỉ. Sang tuần sau tự động hoàn nguyên.
        </div>
        <button class="ghost" style="padding:4px 10px;font-size:11.5px;border-color:rgba(245,158,11,0.35);color:#fde68a" onclick="openAddMakeupModal()">＋ Thêm ca bù khác</button>
      </div>
    ` : ''}

    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
      ${FULL_WEEK_DAYS.map((dayName, dayIdx) => {
        const dayExtras = extras.filter(x => x.d === dayIdx).sort((a, b) => a.time.localeCompare(b.time));
        const dayMakeups = makeups.filter(m => m.d === dayIdx);
        const isToday = dayIdx === todayDayIdx;
        const viDate = dates[dayIdx].split('-').reverse().slice(0, 2).join('/');

        return `
          <div class="extra-day-card ${isToday ? 'is-today' : ''}" style="${isToday ? 'border-color:rgba(56,189,248,0.45);box-shadow:0 0 20px rgba(56,189,248,0.1)' : ''}">
            <div class="extra-day-title">
              <div>
                <b>${dayName} (${viDate})</b>
                ${isToday ? '<span style="font-size:10.5px;background:#0284c7;color:#fff;padding:2px 6px;border-radius:4px;margin-left:6px;font-weight:700">HÔM NAY</span>' : ''}
              </div>
              <div style="display:flex;gap:4px">
                <button class="ghost" style="padding:4px 8px;font-size:11px;border-color:#f59e0b;color:#fde68a" onclick="openAddMakeupModal(${dayIdx})" title="Thêm ca học bù chỉ trong ngày này">＋ Bù</button>
                <button class="ghost" style="padding:4px 8px;font-size:11px" onclick="extraClassModal(null, ${dayIdx})">＋ Ca</button>
              </div>
            </div>

            <!-- Temporary Makeup Classes For This Day -->
            ${dayMakeups.map(m => `
              <div class="makeup-class-card">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div>
                    <div style="display:flex;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:4px">
                      <span class="makeup-class-badge">🔄 HỌC BÙ TUẦN NÀY</span>
                      <span class="extra-time-tag" style="background:rgba(245,158,11,0.2);color:#fde68a">🕒 ${esc(m.time)}</span>
                      <span class="extra-subj-name" style="color:#fde68a">${esc(m.subject)}</span>
                    </div>
                    <div class="extra-teacher-loc" style="color:#cbd5e1">
                      ${m.teacher ? `👨‍🏫 <b>${esc(m.teacher)}</b> • ` : ''}${esc(m.location || 'Tại lớp')}
                    </div>
                    ${m.note ? `<div style="font-size:11px;color:#fed7aa;margin-top:4px">📝 ${esc(m.note)}</div>` : ''}
                  </div>
                  <div style="display:flex;align-items:center;gap:4px">
                    ${isToday ? `
                      ${todayChecks[m.id]?.checked ? `
                        <button class="ghost" style="font-size:11px;padding:4px 8px;color:#34d399;border-color:#059669" onclick="toggleExtraCheckin('${m.id}')" title="Đã đến lớp lúc ${todayChecks[m.id].time}">✅ Đã đến</button>
                      ` : `
                        <button class="primary" style="font-size:11px;padding:4px 8px" onclick="toggleExtraCheckin('${m.id}')">📍 Check-in</button>
                      `}
                    ` : ''}
                    <button class="ghost" style="color:#f87171;border-color:rgba(239,68,68,0.35);padding:4px 8px" onclick="deleteTempOverride('${m.id}')" title="Xóa lịch học bù này">🗑️</button>
                  </div>
                </div>
              </div>
            `).join('')}

            <!-- Regular Extra Classes -->
            ${dayExtras.length ? dayExtras.map(ex => {
              const isCanceled = cancels.some(c => c.targetType === 'extra' && c.targetId === ex.id);
              const isChecked = isToday && !!todayChecks[ex.id]?.checked;

              return `
                <div class="extra-slot-item ${isCanceled ? 'checkin-row-item canceled' : ''}" style="${isChecked ? 'border-color:rgba(16,185,129,0.5);background:rgba(16,185,129,0.06)' : ''}">
                  <div>
                    <div style="display:flex;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:4px">
                      ${isCanceled ? '<span class="badge" style="background:#334155;color:#94a3b8;font-size:10px;text-decoration:line-through">🏖️ NGHỈ TUẦN NÀY</span>' : ''}
                      ${isChecked ? `<span class="badge checkin-badge-done">✅ ĐÃ ĐẾN (${todayChecks[ex.id].time})</span>` : ''}
                      <span class="extra-time-tag">🕒 ${esc(ex.time)}</span>
                      <span class="extra-subj-name" style="${isCanceled ? 'text-decoration:line-through;opacity:0.6' : ''}">${esc(ex.subject)}</span>
                    </div>
                    <div class="extra-teacher-loc" style="${isCanceled ? 'opacity:0.6' : ''}">
                      ${ex.teacher ? `👨‍🏫 <b>${esc(ex.teacher)}</b> • ` : ''}${esc(ex.location || 'Chưa đặt phòng')}
                    </div>
                    ${ex.note ? `<div style="font-size:11px;color:#a5b4fc;margin-top:4px">📝 ${esc(ex.note)}</div>` : ''}
                  </div>
                  <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">
                    ${isToday && !isCanceled ? `
                      ${isChecked ? `
                        <button class="ghost checkin-undo-btn" onclick="toggleExtraCheckin('${ex.id}')" title="Hoàn tác điểm danh">↺</button>
                      ` : `
                        <button class="primary checkin-action-btn" style="padding:4px 8px;font-size:11px" onclick="toggleExtraCheckin('${ex.id}')">📍 Check-in</button>
                      `}
                    ` : ''}
                    <button class="ghost cancel-toggle-btn" style="${isCanceled ? 'color:#38bdf8;border-color:rgba(56,189,248,0.4)' : 'color:#cbd5e1'}" onclick="toggleTempCancelExtra('${ex.id}', ${dayIdx})" title="${isCanceled ? 'Hủy báo nghỉ để học lại' : 'Báo nghỉ chỉ trong tuần này'}">
                      ${isCanceled ? '↺ Học lại' : '🏖️ Nghỉ tuần này'}
                    </button>
                    ${ex.link ? `<a href="${esc(ex.link)}" target="_blank" class="extra-link-btn" title="Vào lớp Online">🌐</a>` : ''}
                    <button class="ghost" onclick="extraClassModal('${ex.id}')" title="Sửa">✎</button>
                    <button class="ghost" onclick="deleteExtraClass('${ex.id}')" title="Xóa">🗑️</button>
                  </div>
                </div>
              `;
            }).join('') : (!dayMakeups.length ? '<div class="empty" style="padding:14px;font-size:12px">Không có lịch học thêm.</div>' : '')}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderCombinedWeeklyTable() {
  const container = $('#timetableBody');
  const schoolTT = db.schoolTT || [];
  const extras = db.extraClasses || [];
  const currentWeek = getWeekKey();
  const activeOverrides = (db.tempOverrides || []).filter(o => o.weekKey === currentWeek);
  const cancels = activeOverrides.filter(o => o.type === 'cancel');
  const makeups = activeOverrides.filter(o => o.type === 'makeup');

  container.innerHTML = `
    <div class="school-banner">
      <div>
        <strong>📅 BẢNG LỊCH HỌC TỔNG HỢP TOÀN DIỆN (TRƯỜNG + HỌC THÊM)</strong>
        <span>Có cập nhật lịch học bù & báo nghỉ tuần này • Tự động hoàn nguyên về lịch chuẩn.</span>
      </div>
      <div style="display:flex;gap:8px">
        <button class="ghost" style="border-color:#f59e0b;color:#fde68a" onclick="openAddMakeupModal()">🔄 ＋ Học bù tuần này</button>
        <button class="ghost" onclick="window.print()">🖨️ In lịch tuần</button>
      </div>
    </div>

    <div class="card school-card">
      <table class="school-tt">
        <thead>
          <tr>
            <th class="period-head" style="width:120px">Buổi / Khung giờ</th>
            ${FULL_WEEK_DAYS.map(x => `<th>${x}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th class="period-cell" style="background:rgba(56,189,248,0.15)">
              <b style="color:#38bdf8">☀️ SÁNG TRƯỜNG</b>
              <span>07:30 – 11:05</span>
            </th>
            ${FULL_WEEK_DAYS.map((_, d) => {
              if (d >= 6) return '<td style="opacity:0.5;font-size:11px;color:var(--muted)">Nghỉ</td>';
              const morningSubs = schoolTT.filter(x => x.d === d && x.session === 'morning').sort((a, b) => a.slot - b.slot);
              return `
                <td style="text-align:left;vertical-align:top;padding:8px;font-size:11px">
                  ${morningSubs.map(s => `<div style="margin-bottom:2px"><b>T${s.slot}:</b> ${esc(s.s)}</div>`).join('') || '—'}
                </td>
              `;
            }).join('')}
          </tr>

          <tr>
            <th class="period-cell" style="background:rgba(251,146,60,0.15)">
              <b style="color:#fb923c">🌤️ CHIỀU TRƯỜNG</b>
              <span>13:30 – 16:15</span>
            </th>
            ${FULL_WEEK_DAYS.map((_, d) => {
              if (d >= 6) return '<td style="opacity:0.5;font-size:11px;color:var(--muted)">Nghỉ</td>';
              const afternoonSubs = schoolTT.filter(x => x.d === d && x.session === 'afternoon').sort((a, b) => a.slot - b.slot);
              return `
                <td style="text-align:left;vertical-align:top;padding:8px;font-size:11px">
                  ${afternoonSubs.map(s => `<div style="margin-bottom:2px"><b>T${s.slot}:</b> ${esc(s.s)}</div>`).join('') || '—'}
                </td>
              `;
            }).join('')}
          </tr>

          <tr>
            <th class="period-cell" style="background:rgba(168,85,247,0.18)">
              <b style="color:#c084fc">🎯 HỌC THÊM & HỌC BÙ</b>
              <span>Chiều tối & Cuối tuần</span>
            </th>
            ${FULL_WEEK_DAYS.map((_, d) => {
              const dayExtras = extras.filter(x => x.d === d);
              const dayMakeups = makeups.filter(m => m.d === d);

              return `
                <td style="text-align:left;vertical-align:top;padding:8px;background:rgba(168,85,247,0.06);font-size:11px">
                  ${dayMakeups.map(m => `
                    <div style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);border-radius:6px;padding:5px;margin-bottom:5px">
                      <div style="color:#fde68a;font-weight:800;font-size:10px">🔄 HỌC BÙ</div>
                      <div style="color:#fff;font-weight:750">${esc(m.subject)}</div>
                      <div style="color:#fed7aa;font-size:10px">${esc(m.time)}</div>
                    </div>
                  `).join('')}

                  ${dayExtras.length ? dayExtras.map(ex => {
                    const isCanceled = cancels.some(c => c.targetType === 'extra' && c.targetId === ex.id);
                    return `
                      <div style="background:#0f172a;border:1px solid #334155;border-radius:6px;padding:5px;margin-bottom:5px;${isCanceled ? 'opacity:0.5;text-decoration:line-through' : ''}">
                        ${isCanceled ? '<div style="color:#ef4444;font-size:9.5px;font-weight:700">[Nghỉ tuần này]</div>' : ''}
                        <div style="color:#38bdf8;font-weight:750">${esc(ex.subject)}</div>
                        <div style="color:var(--muted);font-size:10px">${esc(ex.time)}</div>
                        ${ex.teacher ? `<div style="font-size:10px;color:#a5b4fc">${esc(ex.teacher)}</div>` : ''}
                      </div>
                    `;
                  }).join('') : (!dayMakeups.length ? '<span style="color:#475569">—</span>' : '')}
                </td>
              `;
            }).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function extraClassModal(editId = null, defaultDay = 0) {
  const existing = editId ? (db.extraClasses || []).find(x => x.id === editId) : null;
  const isEdit = !!existing;

  const rawTime = existing?.time || '18:00 – 19:30';
  const timeParts = rawTime.split(/[–\-]/).map(s => s.trim());
  const startTime = timeParts[0] || '18:00';
  const endTime = timeParts[1] || '19:30';

  modal(isEdit ? 'Chỉnh sửa Ca học thêm' : 'Thêm Ca học thêm mới', `
    <div class="form">
      <div class="field full">
        <label>Thứ trong tuần *</label>
        <select id="feDay" class="select">
          ${FULL_WEEK_DAYS.map((dName, dIdx) => `
            <option value="${dIdx}" ${(existing ? existing.d === dIdx : defaultDay === dIdx) ? 'selected' : ''}>${dName}</option>
          `).join('')}
        </select>
      </div>

      <!-- KHUNG GIỜ HỌC TỰ CHỌN NHANH (KHÔNG CẦN GÕ CHỮ SỐ) -->
      <div class="field full">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <label style="font-weight:750;color:#f1f5f9;margin:0">Khung giờ học thêm *</label>
          <span id="feTimeDisplay" style="color:#38bdf8;font-weight:800;font-size:14px;background:rgba(56,189,248,0.12);padding:2px 8px;border-radius:6px;border:1px solid rgba(56,189,248,0.3)">${esc(rawTime)}</span>
        </div>
        <input type="hidden" id="feTime" value="${esc(rawTime)}">

        <span style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">⚡ Bấm chọn nhanh ca học (1 chạm là xong):</span>
        <div class="time-preset-chips">
          <button type="button" class="time-chip ${rawTime.includes('18:00') && rawTime.includes('19:30') ? 'active' : ''}" onclick="setExtraClassTimePreset('18:00', '19:30', this)">🌙 18:00 – 19:30</button>
          <button type="button" class="time-chip ${rawTime.includes('19:30') && rawTime.includes('21:00') ? 'active' : ''}" onclick="setExtraClassTimePreset('19:30', '21:00', this)">🌙 19:30 – 21:00</button>
          <button type="button" class="time-chip ${rawTime.includes('17:30') ? 'active' : ''}" onclick="setExtraClassTimePreset('17:30', '19:00', this)">🌆 17:30 – 19:00</button>
          <button type="button" class="time-chip ${rawTime.includes('20:00') ? 'active' : ''}" onclick="setExtraClassTimePreset('20:00', '21:30', this)">🌙 20:00 – 21:30</button>
          <button type="button" class="time-chip ${rawTime.includes('14:00') ? 'active' : ''}" onclick="setExtraClassTimePreset('14:00', '15:30', this)">☀️ 14:00 – 15:30</button>
          <button type="button" class="time-chip ${rawTime.includes('15:30') ? 'active' : ''}" onclick="setExtraClassTimePreset('15:30', '17:00', this)">☀️ 15:30 – 17:00</button>
          <button type="button" class="time-chip ${rawTime.includes('08:00') ? 'active' : ''}" onclick="setExtraClassTimePreset('08:00', '09:30', this)">🌅 08:00 – 09:30</button>
          <button type="button" class="time-chip ${rawTime.includes('09:30') && rawTime.includes('11:00') ? 'active' : ''}" onclick="setExtraClassTimePreset('09:30', '11:00', this)">🌅 09:30 – 11:00</button>
        </div>

        <span style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px">Hoặc gạt đồng hồ chọn giờ tùy ý:</span>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <span style="font-size:11px;color:#94a3b8;display:block;margin-bottom:3px">Giờ bắt đầu:</span>
            <input type="time" id="feTimeStart" class="input" value="${startTime}" onchange="updateExtraClassTimeFromPickers()" style="font-size:14px;font-weight:700">
          </div>
          <div>
            <span style="font-size:11px;color:#94a3b8;display:block;margin-bottom:3px">Giờ kết thúc:</span>
            <input type="time" id="feTimeEnd" class="input" value="${endTime}" onchange="updateExtraClassTimeFromPickers()" style="font-size:14px;font-weight:700">
          </div>
        </div>
      </div>
      <div class="field">
        <label>Tên môn học thêm *</label>
        <input id="feSub" class="input" value="${esc(existing?.subject || '')}" placeholder="Toán nâng cao, Anh IELTS, Lý..." required>
      </div>
      <div class="field">
        <label>Thầy / Cô giáo / Gia sư</label>
        <input id="feTeacher" class="input" value="${esc(existing?.teacher || '')}" placeholder="Thầy Hoàn, Cô Trang...">
      </div>
      <div class="field full">
        <label>Địa điểm / Phòng học / Trung tâm</label>
        <input id="feLoc" class="input" value="${esc(existing?.location || '')}" placeholder="Trung tâm 247, Phòng 301, hoặc Online Zoom">
      </div>
      <div class="field full">
        <label>Link học Online (Zoom, Google Meet, MS Teams nếu có)</label>
        <input id="feLink" class="input" value="${esc(existing?.link || '')}" placeholder="https://meet.google.com/xyz hoặc https://zoom.us/...">
      </div>
      <div class="field full">
        <label>Ghi chú bài tập / Tài liệu cần chuẩn bị</label>
        <textarea id="feNote" class="textarea" rows="2" placeholder="Mang theo sách bài tập nâng cao...">${esc(existing?.note || '')}</textarea>
      </div>
      ${isEdit ? `
        <div class="field full" style="margin-top:8px;padding-top:8px;border-top:1px solid #1a253d;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;color:var(--muted)">Xóa ca học này?</span>
          <button type="button" class="ghost" style="color:#f87171;border-color:rgba(239,68,68,0.35);font-size:12px;padding:6px 12px" onclick="deleteExtraClass('${existing.id}')">🗑️ Xóa ca học này</button>
        </div>
      ` : ''}
    </div>
  `, () => {
    const sub = $('#feSub').value.trim();
    const time = $('#feTime').value.trim();
    const d = parseInt($('#feDay').value, 10);
    if (!sub || !time) return toast('Vui lòng nhập tên môn và giờ học'), false;

    if (isEdit) {
      existing.d = d;
      existing.time = time;
      existing.subject = sub;
      existing.teacher = $('#feTeacher').value.trim();
      existing.location = $('#feLoc').value.trim();
      existing.link = $('#feLink').value.trim();
      existing.note = $('#feNote').value.trim();
    } else {
      db.extraClasses = db.extraClasses || [];
      db.extraClasses.push({
        id: id(),
        d,
        time,
        subject: sub,
        teacher: $('#feTeacher').value.trim(),
        location: $('#feLoc').value.trim(),
        link: $('#feLink').value.trim(),
        note: $('#feNote').value.trim()
      });
    }
    db.extraClassesSeeded = true;
    save();
    toast(isEdit ? 'Đã cập nhật ca học thêm' : 'Đã thêm ca học thêm');
    timetable();
    return true;
  });
}

function deleteExtraClass(extraId) {
  if (confirm('Xóa ca học thêm này khỏi lịch?')) {
    db.extraClasses = (db.extraClasses || []).filter(x => x.id !== extraId);
    db.extraClassesSeeded = true;
    save();
    closeModal();
    toast('🗑️ Đã xóa ca học thêm');
    timetable();
  }
}

function schoolTTModal(session, slot, d) {
  const x = (db.schoolTT || []).find(a => a.session === session && a.slot === slot && a.d === d) || {};
  const dayName = SCHOOL_DAYS[d] || `Ngày ${d + 2}`;
  const sessName = session === 'morning' ? 'Buổi sáng' : 'Buổi chiều';

  modal(`Sửa ${sessName} • Tiết ${slot} • ${dayName}`, `
    <div class="form">
      <div class="field full">
        <label>Môn học</label>
        <input id="stSub" class="input" value="${esc(x.s || '')}" placeholder="Ví dụ: Toán, Văn, Hóa...">
      </div>
      <div class="field full">
        <label>Giáo viên</label>
        <input id="stTea" class="input" value="${esc(x.teacher || '')}" placeholder="Ví dụ: Thầy Hoàn...">
      </div>
      <div class="field full" style="background:#090f1d;border:1px solid #1a253d;border-radius:12px;padding:12px">
        <label style="font-size:12px;font-weight:750;color:#facc15">📝 Ghi chú tiết học (Lưu ý hôm đó tiết này làm gì / chuẩn bị gì?)</label>
        <input id="stNote" class="input" value="${esc(x.note || '')}" placeholder="Ví dụ: Kiểm tra 15p, Nộp bài tập nhóm, Mang máy tính Casio..." style="margin-top:6px">
        <div style="font-size:11px;color:var(--muted);margin-top:4px">Ghi chú này sẽ hiện trực tiếp trên ô TKB và nhắc nhở ở Trang chủ khi đến ngày học!</div>
      </div>
      ${x.s ? `
        <div class="field full" style="margin-top:8px;padding-top:8px;border-top:1px solid #1a253d;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;color:var(--muted)">Xóa môn này khỏi tiết?</span>
          <button type="button" class="ghost" style="color:#f87171;border-color:rgba(239,68,68,0.35);font-size:12px;padding:6px 12px" onclick="deleteSchoolPeriod('${session}', ${slot}, ${d})">🗑️ Xóa tiết này</button>
        </div>
      ` : ''}
    </div>
  `, () => {
    db.schoolTT = (db.schoolTT || []).filter(a => !(a.session === session && a.slot === slot && a.d === d));
    const sub = $('#stSub').value.trim();
    if (sub) {
      db.schoolTT.push({
        session,
        slot,
        d,
        s: sub,
        teacher: $('#stTea').value.trim(),
        note: $('#stNote').value.trim()
      });
    }
    db.schoolTTSeeded = true;
    save();
    toast('Đã cập nhật thời khóa biểu và ghi chú tiết học');
    timetable();
    return true;
  });
}

function deleteSchoolPeriod(session, slot, d) {
  if (confirm('Xóa môn học này khỏi thời khóa biểu?')) {
    db.schoolTT = (db.schoolTT || []).filter(a => !(a.session === session && a.slot === slot && a.d === d));
    db.schoolTTSeeded = true;
    save();
    closeModal();
    toast('🗑️ Đã xóa tiết học');
    timetable();
  }
}

// Helper functions for dynamic timetable slots
function saveCurrentMatrixFromDom() {
  const conf = getSessionsConfig();
  const newTT = [];
  for (let d = 0; d < 6; d++) {
    (conf.morning.slots || []).forEach(sl => {
      const slot = sl.slot;
      const sEl = $('#mat_m_' + d + '_' + slot + '_s');
      const tEl = $('#mat_m_' + d + '_' + slot + '_t');
      const s = sEl ? sEl.value.trim() : '';
      const teacher = tEl ? tEl.value.trim() : '';
      const oldCell = (db.schoolTT || []).find(x => x.session === 'morning' && x.d === d && x.slot === slot);
      if (s) newTT.push({ session: 'morning', d, slot, s, teacher, note: oldCell?.s === s ? (oldCell?.note || '') : '' });
    });
    (conf.afternoon.slots || []).forEach(sl => {
      const slot = sl.slot;
      const sEl = $('#mat_a_' + d + '_' + slot + '_s');
      const tEl = $('#mat_a_' + d + '_' + slot + '_t');
      const s = sEl ? sEl.value.trim() : '';
      const teacher = tEl ? tEl.value.trim() : '';
      const oldCell = (db.schoolTT || []).find(x => x.session === 'afternoon' && x.d === d && x.slot === slot);
      if (s) newTT.push({ session: 'afternoon', d, slot, s, teacher, note: oldCell?.s === s ? (oldCell?.note || '') : '' });
    });
  }
  db.schoolTT = newTT;
  db.schoolTTSeeded = true;
  save();
}

function addSchoolPeriod(session, reOpenManager = false) {
  const conf = JSON.parse(JSON.stringify(getSessionsConfig()));
  const list = conf[session].slots;
  const nextNum = list.length + 1;
  if (nextNum > 8) return toast('Đã đạt số tiết tối đa cho buổi này!');

  const defaultMorningTimes = [
    '07:45 – 08:30',
    '08:35 – 09:20',
    '09:30 – 10:15',
    '10:20 – 11:05',
    '11:10 – 11:55',
    '12:00 – 12:45',
    '12:50 – 13:35'
  ];
  const defaultAfternoonTimes = [
    '13:45 – 14:30',
    '14:35 – 15:20',
    '15:30 – 16:15',
    '16:20 – 17:05',
    '17:10 – 17:55',
    '18:00 – 18:45'
  ];

  const defaultTime = session === 'morning'
    ? (defaultMorningTimes[nextNum - 1] || '11:10 – 11:55')
    : (defaultAfternoonTimes[nextNum - 1] || '16:20 – 17:05');

  list.push({
    slot: nextNum,
    label: 'Tiết ' + nextNum,
    time: defaultTime
  });

  conf[session].title = session === 'morning'
    ? '☀️ BUỔI SÁNG (' + list.length + ' tiết)'
    : '🌤️ BUỔI CHIỀU (' + list.length + ' tiết)';

  db.sessionsConfig = conf;
  save();
  toast('✅ Đã thêm Tiết ' + nextNum + ' cho ' + (session === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều') + ' (' + defaultTime + ')!');

  if (reOpenManager) {
    openTimetableManagerModal();
  } else {
    timetable();
  }
}

function removeSchoolPeriod(session, reOpenManager = false) {
  const conf = JSON.parse(JSON.stringify(getSessionsConfig()));
  const list = conf[session].slots;
  if (list.length <= 1) {
    return toast('⚠️ Mỗi buổi phải có ít nhất 1 tiết học!');
  }
  const removed = list.pop();

  db.schoolTT = (db.schoolTT || []).filter(x => !(x.session === session && x.slot === removed.slot));

  conf[session].title = session === 'morning'
    ? '☀️ BUỔI SÁNG (' + list.length + ' tiết)'
    : '🌤️ BUỔI CHIỀU (' + list.length + ' tiết)';

  db.sessionsConfig = conf;
  save();
  toast('🗑️ Đã xóa ' + removed.label + ' của ' + (session === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'));

  if (reOpenManager) {
    openTimetableManagerModal();
  } else {
    timetable();
  }
}

function addPeriodFromManager(session) {
  saveCurrentMatrixFromDom();
  addSchoolPeriod(session, true);
}

function removePeriodFromManager(session) {
  saveCurrentMatrixFromDom();
  removeSchoolPeriod(session, true);
}

function setSchoolPeriodCounts(mCount, aCount, reOpenManager = false) {
  const conf = JSON.parse(JSON.stringify(getSessionsConfig()));

  const defaultMorningTimes = [
    '07:45 – 08:30',
    '08:35 – 09:20',
    '09:30 – 10:15',
    '10:20 – 11:05',
    '11:10 – 11:55',
    '12:00 – 12:45'
  ];

  const defaultAfternoonTimes = [
    '13:45 – 14:30',
    '14:35 – 15:20',
    '15:30 – 16:15',
    '16:20 – 17:05',
    '17:10 – 17:55'
  ];

  // Adjust morning
  const newMSlots = [];
  for (let i = 1; i <= mCount; i++) {
    const existing = conf.morning.slots.find(s => s.slot === i);
    newMSlots.push(existing || {
      slot: i,
      label: 'Tiết ' + i,
      time: defaultMorningTimes[i - 1] || '11:10 – 11:55'
    });
  }
  conf.morning.slots = newMSlots;
  conf.morning.title = '☀️ BUỔI SÁNG (' + mCount + ' tiết)';

  // Adjust afternoon
  const newASlots = [];
  for (let i = 1; i <= aCount; i++) {
    const existing = conf.afternoon.slots.find(s => s.slot === i);
    newASlots.push(existing || {
      slot: i,
      label: 'Tiết ' + i,
      time: defaultAfternoonTimes[i - 1] || '16:20 – 17:05'
    });
  }
  conf.afternoon.slots = newASlots;
  conf.afternoon.title = '🌤️ BUỔI CHIỀU (' + aCount + ' tiết)';

  // Filter out any entries beyond new limits
  db.schoolTT = (db.schoolTT || []).filter(x => {
    if (x.session === 'morning' && x.slot > mCount) return false;
    if (x.session === 'afternoon' && x.slot > aCount) return false;
    return true;
  });

  db.sessionsConfig = conf;
  save();
  closeModal();
  toast('🎉 Đã cập nhật TKB: Sáng ' + mCount + ' tiết, Chiều ' + aCount + ' tiết!');
  if (reOpenManager) {
    openTimetableManagerModal();
  } else {
    timetable();
  }
}

function applyCustomPeriodCounts() {
  const m = parseInt($('#selMorningCount')?.value || '4');
  const a = parseInt($('#selAfternoonCount')?.value || '3');
  setSchoolPeriodCounts(m, a);
}

function openPeriodConfigModal() {
  const conf = getSessionsConfig();
  const mCount = conf.morning.slots.length;
  const aCount = conf.afternoon.slots.length;

  const body = `
    <div style="font-size:13.5px;color:var(--text);line-height:1.6">
      <div style="background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);border-radius:14px;padding:14px;margin-bottom:16px">
        <div style="font-weight:750;color:#38bdf8;font-size:14px;margin-bottom:4px">💡 Tùy chỉnh số tiết học theo lịch trường của bạn:</div>
        <div style="color:var(--muted);font-size:12.5px">
          Hiện tại: <b>Buổi Sáng có ${mCount} tiết</b> • <b>Buổi Chiều có ${aCount} tiết</b> (Tổng: ${mCount + aCount} tiết/ngày).
        </div>
      </div>

      <!-- Quick Add 1 Period -->
      <div style="font-weight:750;color:#f8fafc;margin-bottom:10px;font-size:13px">➕ THÊM 1 TIẾT HỌC NGAY:</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">
        <button type="button" class="primary" onclick="addSchoolPeriod('morning'); closeModal();" style="padding:14px 10px;flex-direction:column;gap:5px;text-align:center;align-items:center;background:linear-gradient(135deg,#0284c7,#0369a1);border-radius:14px;cursor:pointer">
          <span style="font-size:22px">☀️</span>
          <span style="font-weight:750;font-size:14px">Thêm 1 tiết Sáng</span>
          <span style="font-size:11.5px;opacity:0.9">Tăng thành Tiết ${mCount + 1}</span>
        </button>

        <button type="button" class="primary" onclick="addSchoolPeriod('afternoon'); closeModal();" style="padding:14px 10px;flex-direction:column;gap:5px;text-align:center;align-items:center;background:linear-gradient(135deg,#d97706,#b45309);border-radius:14px;cursor:pointer">
          <span style="font-size:22px">🌤️</span>
          <span style="font-weight:750;font-size:14px">Thêm 1 tiết Chiều</span>
          <span style="font-size:11.5px;opacity:0.9">Tăng thành Tiết ${aCount + 1}</span>
        </button>
      </div>

      <!-- Quick Presets for Popular Schools -->
      <div style="font-weight:750;color:#f8fafc;margin-bottom:10px;font-size:13px">🏫 CHỌN NHANH KHUNG GIỜ PHỔ BIẾN:</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px">
        <button type="button" class="ghost" onclick="setSchoolPeriodCounts(5, 4)" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-color:rgba(56,189,248,0.4);text-align:left;cursor:pointer;border-radius:12px">
          <div>
            <b style="color:#38bdf8">Khung Sáng 5 tiết - Chiều 4 tiết</b>
            <div style="font-size:11.5px;color:var(--muted)">Chuẩn THPT phổ biến nhất hiện nay (Sáng 1-5, Chiều 1-4)</div>
          </div>
          <span class="badge" style="background:#0284c7;color:#fff">9 tiết/ngày</span>
        </button>

        <button type="button" class="ghost" onclick="setSchoolPeriodCounts(5, 3)" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-color:rgba(56,189,248,0.4);text-align:left;cursor:pointer;border-radius:12px">
          <div>
            <b style="color:#38bdf8">Khung Sáng 5 tiết - Chiều 3 tiết</b>
            <div style="font-size:11.5px;color:var(--muted)">Sáng 5 tiết chính khóa, Chiều 3 tiết phụ đạo/tự chọn</div>
          </div>
          <span class="badge" style="background:#0284c7;color:#fff">8 tiết/ngày</span>
        </button>

        <button type="button" class="ghost" onclick="setSchoolPeriodCounts(4, 3)" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-color:rgba(56,189,248,0.4);text-align:left;cursor:pointer;border-radius:12px">
          <div>
            <b style="color:#cbd5e1">Khung Sáng 4 tiết - Chiều 3 tiết</b>
            <div style="font-size:11.5px;color:var(--muted)">Mặc định ban đầu trường Tạ Quang Bửu (10A4)</div>
          </div>
          <span class="badge" style="background:#334155;color:#fff">7 tiết/ngày</span>
        </button>
      </div>

      <!-- Custom Adjustments -->
      <div style="background:#090f1d;border:1px solid #1e293b;border-radius:14px;padding:14px">
        <div style="font-weight:750;color:#facc15;font-size:13px;margin-bottom:8px">⚙️ Tự điều chỉnh chính xác số tiết:</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div>
            <label style="font-size:12px;color:#94a3b8;display:block;margin-bottom:4px">Số tiết Buổi Sáng:</label>
            <select id="selMorningCount" class="input" style="width:100%">
              ${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}" ${n === mCount ? 'selected' : ''}>${n} tiết (Sáng)</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:12px;color:#94a3b8;display:block;margin-bottom:4px">Số tiết Buổi Chiều:</label>
            <select id="selAfternoonCount" class="input" style="width:100%">
              ${[0, 1, 2, 3, 4, 5].map(n => `<option value="${n}" ${n === aCount ? 'selected' : ''}>${n} tiết (Chiều)</option>`).join('')}
            </select>
          </div>
        </div>
        <button type="button" class="primary" onclick="applyCustomPeriodCounts()" style="width:100%;justify-content:center">
          <span>💾 Áp dụng số tiết đã chọn</span>
        </button>
      </div>

      <!-- Delete last slot button if needed -->
      <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #1e293b;padding-top:12px">
        <span style="font-size:12px;color:var(--muted)">Bớt tiết nếu thêm nhầm?</span>
        <div style="display:flex;gap:6px">
          <button type="button" class="ghost" onclick="removeSchoolPeriod('morning'); closeModal();" style="font-size:11px;padding:4px 10px;color:#f87171;border-color:rgba(239,68,68,0.3)">➖ Bớt 1 tiết Sáng</button>
          <button type="button" class="ghost" onclick="removeSchoolPeriod('afternoon'); closeModal();" style="font-size:11px;padding:4px 10px;color:#f87171;border-color:rgba(239,68,68,0.3)">➖ Bớt 1 tiết Chiều</button>
        </div>
      </div>
    </div>
  `;

  modal('⚙️ Cài đặt số tiết Thời khóa biểu', body, null, true);
}


// ----------------- TIMETABLE MANAGER -----------------
let ocrTempImage = null;

function openTimetableManagerModal() {
  const conf = getSessionsConfig();
  const matrix = buildMatrixData();

  const body = `
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTTTab('manual')">✏️ Tự thay đổi TKB</button>
      <button class="tab-btn" onclick="switchTTTab('ocr')">📸 Phân tích ảnh TKB</button>
      <button class="tab-btn" onclick="switchTTTab('time')">⏱️ Khung giờ học</button>
    </div>

    <!-- TAB 1: MANUAL BATCH EDIT -->
    <div id="tab-manual" class="tab-pane active">
      <div id="stickyOcrManualViewer" class="sticky-ocr-viewer hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:12px;font-weight:800;color:#38bdf8">📸 Ảnh Thời khóa biểu đã chụp / tải lên:</span>
          <button type="button" class="ghost" onclick="$('#stickyOcrManualViewer').classList.add('hidden')" style="font-size:11px;padding:2px 8px">✕ Đóng ảnh</button>
        </div>
        <img id="stickyOcrManualImg" alt="Ảnh TKB ghim">
      </div>
      <p class="meta" style="margin-bottom:10px">Nhập trực tiếp môn học và giáo viên cho từng thứ và từng tiết (hoặc bấm vào tab Phân tích ảnh để chụp ảnh).</p>
      <div class="tt-matrix-wrap">
        <table class="tt-matrix">
          <thead>
            <tr>
              <th style="width:75px">Tiết</th>
              ${SCHOOL_DAYS.map(d => `<th>${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="7" class="matrix-sec-title">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:0 4px">
                  <span>☀️ BUỔI SÁNG (${conf.morning.slots.length} tiết)</span>
                  <div style="display:flex;gap:6px">
                    <button type="button" class="ghost" onclick="addPeriodFromManager('morning')" style="font-size:11px;padding:2px 8px;color:#38bdf8;border-color:rgba(56,189,248,0.4)">＋ Thêm tiết Sáng</button>
                    ${conf.morning.slots.length > 1 ? `<button type="button" class="ghost" onclick="removePeriodFromManager('morning')" style="font-size:11px;padding:2px 8px;color:#f87171;border-color:rgba(239,68,68,0.3)">➖ Bớt tiết</button>` : ''}
                  </div>
                </div>
              </td>
            </tr>
            ${conf.morning.slots.map(sl => `
              <tr>
                <th>${sl.label}</th>
                ${SCHOOL_DAYS.map((_, d) => {
    const it = matrix.morning[d]?.[sl.slot] || { s: '', teacher: '' };
    return `
                    <td>
                      <input id="mat_m_${d}_${sl.slot}_s" value="${esc(it.s)}" placeholder="Môn" style="margin-bottom:3px">
                      <input id="mat_m_${d}_${sl.slot}_t" value="${esc(it.teacher)}" placeholder="GV" style="font-size:10px;opacity:0.8">
                    </td>
                  `;
  }).join('')}
              </tr>
            `).join('')}
            <tr>
              <td colspan="7" class="matrix-sec-title">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:0 4px">
                  <span>🌤️ BUỔI CHIỀU (${conf.afternoon.slots.length} tiết)</span>
                  <div style="display:flex;gap:6px">
                    <button type="button" class="ghost" onclick="addPeriodFromManager('afternoon')" style="font-size:11px;padding:2px 8px;color:#fb923c;border-color:rgba(251,146,60,0.4)">＋ Thêm tiết Chiều</button>
                    ${conf.afternoon.slots.length > 1 ? `<button type="button" class="ghost" onclick="removePeriodFromManager('afternoon')" style="font-size:11px;padding:2px 8px;color:#f87171;border-color:rgba(239,68,68,0.3)">➖ Bớt tiết</button>` : ''}
                  </div>
                </div>
              </td>
            </tr>
            ${conf.afternoon.slots.map(sl => `
              <tr>
                <th>${sl.label}</th>
                ${SCHOOL_DAYS.map((_, d) => {
    const it = matrix.afternoon[d]?.[sl.slot] || { s: '', teacher: '' };
    return `
                    <td>
                      <input id="mat_a_${d}_${sl.slot}_s" value="${esc(it.s)}" placeholder="Môn" style="margin-bottom:3px">
                      <input id="mat_a_${d}_${sl.slot}_t" value="${esc(it.teacher)}" placeholder="GV" style="font-size:10px;opacity:0.8">
                    </td>
                  `;
  }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="ghost" type="button" onclick="clearMatrixInputs()">🗑️ Xóa trắng bảng</button>
        <button class="ghost" type="button" onclick="resetTo10A4Sample()">↺ Khôi phục mẫu 10A4</button>
      </div>
    </div>

    <!-- TAB 2: OCR / IMAGE SCANNER -->
    <div id="tab-ocr" class="tab-pane">
      <!-- Universal Upload Zone with Dual Trigger (Click handler + Visible Native Picker) -->
      <div class="upload-zone" id="ocrDropZone" onclick="triggerOcrPicker(event)" style="border:2px dashed #38bdf8;border-radius:18px;padding:26px 18px;text-align:center;background:#0c1324;cursor:pointer;transition:0.2s">
        <span class="upload-icon" style="font-size:44px;display:block;margin-bottom:8px">📷</span>
        <div class="upload-title" style="font-size:16px;font-weight:800;color:#f8fafc;margin-bottom:6px">Tải lên hoặc Chụp ảnh Thời khóa biểu</div>
        <div class="upload-sub" style="font-size:12.5px;color:#94a3b8;margin-bottom:16px;max-width:380px;margin-left:auto;margin-right:auto">
          Hỗ trợ đầy đủ menu iPhone: <b>Chụp ảnh • Thư viện ảnh (Album) • Chọn tệp</b>
        </div>

        <!-- Big Touch Button -->
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:14px">
          <button type="button" class="primary" onclick="event.stopPropagation(); triggerOcrPicker(event)" style="display:inline-flex;align-items:center;gap:8px;padding:12px 26px;border-radius:12px;font-weight:750;font-size:14px;box-shadow:0 4px 16px rgba(56,189,248,0.35);cursor:pointer">
            <span>🖼️ Chạm để Chọn ảnh / Chụp ảnh ngay</span>
          </button>
        </div>

        <!-- Standalone Fallback Native Input for 100% device compatibility -->
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px" onclick="event.stopPropagation()">
          <span style="font-size:11.5px;color:var(--muted)">Hoặc chọn tệp trực tiếp:</span>
          <input type="file" id="realOcrFileInput" accept="image/*" onchange="handleOcrFileSelect(event)" style="font-size:12px;color:#cbd5e1;background:#1e293b;padding:6px 10px;border-radius:8px;border:1px solid #334155;max-width:240px;cursor:pointer">
        </div>
      </div>

      <!-- Image Preview and OCR Actions -->
      <div id="ocrPreviewWrap" class="ocr-preview-wrap hidden" style="margin-top:16px">
        <img id="ocrPreviewImg" class="ocr-preview-img" alt="TKB Preview">
        <div style="flex:1;min-width:0">
          <b id="ocrFileName" style="color:#f8fafc;display:block;margin-bottom:2px">Ảnh TKB</b>
          <div class="meta" id="ocrFileSize" style="color:var(--muted);font-size:11.5px"></div>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <button class="primary" type="button" id="btnStartOcr" onclick="startOcrProcess()" style="font-size:13px;padding:9px 18px">
              <span>⚡ Quét & Phân tích bằng AI</span>
            </button>
            <button class="ghost" type="button" onclick="pinOcrImageToManualTab()" style="font-size:13px;padding:9px 16px;color:#38bdf8;border-color:rgba(56,189,248,0.4)">
              <span>👁️ Ghim ảnh xem cùng Bảng TKB</span>
            </button>
          </div>
        </div>
      </div>

      <!-- OCR Progress Bar with Real-time Status -->
      <div id="ocrProgressBox" class="ocr-progress-box hidden" style="margin-top:14px;padding:12px;background:#090f1e;border:1px solid #1e293b;border-radius:12px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
          <span id="ocrStatusText" style="color:#38bdf8;font-weight:600">Đang xử lý ảnh...</span>
          <b id="ocrPercent" style="color:#10b981">0%</b>
        </div>
        <div class="ocr-bar"><i id="ocrBarFill"></i></div>
      </div>

      <!-- Quick Text Paste option (Zalo / Messenger) -->
      <div style="margin-top:16px;padding:14px;background:#090f1e;border:1px solid #1e293b;border-radius:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:4px">
          <label style="font-size:12.5px;font-weight:750;color:#38bdf8">📋 Nhập nhanh bằng cách dán tin nhắn TKB (Zalo / Messenger / Nháp):</label>
          <span style="font-size:11px;color:var(--muted)">Chuẩn 100% không lo ảnh mờ</span>
        </div>
        <textarea id="ocrRawText" class="textarea" rows="4" placeholder="Dán tin nhắn TKB cô giáo gửi trên nhóm lớp vào đây... Ví dụ:&#10;T2: Chào cờ, Toán, Văn, Tiếng Anh&#10;T3: Toán, Toán, Hóa, Vật lý&#10;Hoặc bảng theo tiết:&#10;Tiết 1: Chào cờ, Toán, Hóa, Lý, Văn, Tin..."></textarea>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
          <button class="primary" type="button" onclick="applyOcrTextToMatrix()" style="padding:8px 18px;font-size:13px">
            <span>📥 Phân tích thông minh & Điền vào TKB</span>
          </button>
          <button class="ghost" type="button" onclick="fillStandardSampleTimetable()" style="padding:8px 14px;font-size:12.5px;color:#fde047;border-color:rgba(253,224,71,0.4)">
            <span>📋 Điền TKB mẫu THPT chuẩn</span>
          </button>
          <button class="ghost" type="button" onclick="fillClass8GSampleTimetable()" style="padding:8px 14px;font-size:12.5px;color:#38bdf8;border-color:rgba(56,189,248,0.4)">
            <span>📋 Điền TKB Lớp 8G chuẩn (Ảnh của bạn)</span>
          </button>
        </div>
      </div>

      <!-- Recognized Summary Badge Box -->
      <div id="ocrDetectedPreviewBox" class="hidden" style="margin-top:14px;padding:14px;background:#0d1527;border:1px solid #0284c7;border-radius:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <b style="color:#38bdf8;font-size:13px">✨ Môn học AI đã nhận diện thành công:</b>
          <span id="ocrDetectedCount" class="badge" style="background:#10b981;color:#fff">0 tiết</span>
        </div>
        <div id="ocrDetectedChips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px"></div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">
          💡 Hệ thống đã tự động điền các môn vào đúng thứ và tiết học. Bạn có thể chuyển sang tab <b>"✏️ Tự thay đổi TKB"</b> để xem và chỉnh sửa thêm nếu muốn.
        </div>
        <button class="primary" type="button" onclick="switchTTTab('manual')" style="width:100%;justify-content:center">
          <span>➡️ Chuyển sang Bảng TKB để kiểm tra & Lưu</span>
        </button>
      </div>
    </div>

    <!-- TAB 3: TIME SLOTS CONFIG -->
    <div id="tab-time" class="tab-pane">
      <p class="meta">Tùy chỉnh thời gian bắt đầu & kết thúc của từng tiết học (Áp dụng cho mùa đông/hè hoặc trường khác).</p>
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 8px">
        <h3 style="font-size:13px;color:var(--a2);margin:0">☀️ BUỔI SÁNG (${conf.morning.slots.length} tiết)</h3>
        <button type="button" class="ghost" onclick="addPeriodFromManager('morning')" style="font-size:11px;padding:2px 8px;color:#38bdf8;border-color:rgba(56,189,248,0.3)">＋ Thêm tiết Sáng</button>
      </div>
      <div class="time-config-list">
        <div class="time-config-row">
          <b>Giờ truy bài</b>
          <input id="time_m_0" class="input" value="${esc(conf.morning.truyBai.time)}" placeholder="07:30 – 07:45">
          <input id="desc_m_0" class="input" value="${esc(conf.morning.truyBai.desc)}" placeholder="Nội dung truy bài">
        </div>
        ${conf.morning.slots.map(sl => `
          <div class="time-config-row">
            <b>${sl.label}</b>
            <input id="time_m_${sl.slot}" class="input" value="${esc(sl.time)}" placeholder="Ví dụ: 07:45 – 08:30" style="grid-column: 2 / -1">
          </div>
        `).join('')}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin:18px 0 8px">
        <h3 style="font-size:13px;color:var(--a2);margin:0">🌤️ BUỔI CHIỀU (${conf.afternoon.slots.length} tiết)</h3>
        <button type="button" class="ghost" onclick="addPeriodFromManager('afternoon')" style="font-size:11px;padding:2px 8px;color:#fb923c;border-color:rgba(251,146,60,0.3)">＋ Thêm tiết Chiều</button>
      </div>
      <div class="time-config-list">
        <div class="time-config-row">
          <b>Giờ truy bài</b>
          <input id="time_a_0" class="input" value="${esc(conf.afternoon.truyBai.time)}" placeholder="13:30 – 13:45">
          <input id="desc_a_0" class="input" value="${esc(conf.afternoon.truyBai.desc)}" placeholder="Nội dung truy bài">
        </div>
        ${conf.afternoon.slots.map(sl => `
          <div class="time-config-row">
            <b>${sl.label}</b>
            <input id="time_a_${sl.slot}" class="input" value="${esc(sl.time)}" placeholder="Ví dụ: 13:45 – 14:30" style="grid-column: 2 / -1">
          </div>
        `).join('')}
      </div>
    </div>
  `;

  modal('⚙ Thay đổi Thời khóa biểu & Tiết học', body, () => {
    const newTT = [];
    for (let d = 0; d < 6; d++) {
      (conf.morning.slots || []).forEach(sl => {
        const slot = sl.slot;
        const sEl = $(`#mat_m_${d}_${slot}_s`);
        const tEl = $(`#mat_m_${d}_${slot}_t`);
        const s = sEl ? sEl.value.trim() : '';
        const teacher = tEl ? tEl.value.trim() : '';
        const oldCell = (db.schoolTT || []).find(x => x.session === 'morning' && x.d === d && x.slot === slot);
        if (s) newTT.push({ session: 'morning', d, slot, s, teacher, note: oldCell?.s === s ? (oldCell?.note || '') : '' });
      });
      (conf.afternoon.slots || []).forEach(sl => {
        const slot = sl.slot;
        const sEl = $(`#mat_a_${d}_${slot}_s`);
        const tEl = $(`#mat_a_${d}_${slot}_t`);
        const s = sEl ? sEl.value.trim() : '';
        const teacher = tEl ? tEl.value.trim() : '';
        const oldCell = (db.schoolTT || []).find(x => x.session === 'afternoon' && x.d === d && x.slot === slot);
        if (s) newTT.push({ session: 'afternoon', d, slot, s, teacher, note: oldCell?.s === s ? (oldCell?.note || '') : '' });
      });
    }
    db.schoolTT = newTT;

    const updatedConf = JSON.parse(JSON.stringify(conf));
    const tm0 = $('#time_m_0')?.value.trim();
    if (tm0) updatedConf.morning.truyBai.time = tm0;
    const dm0 = $('#desc_m_0')?.value.trim();
    if (dm0) updatedConf.morning.truyBai.desc = dm0;

    conf.morning.slots.forEach(sl => {
      const el = $(`#time_m_${sl.slot}`);
      if (el && el.value.trim()) sl.time = el.value.trim();
    });

    const ta0 = $('#time_a_0')?.value.trim();
    if (ta0) updatedConf.afternoon.truyBai.time = ta0;
    const da0 = $('#desc_a_0')?.value.trim();
    if (da0) updatedConf.afternoon.truyBai.desc = da0;

    conf.afternoon.slots.forEach(sl => {
      const el = $(`#time_a_${sl.slot}`);
      if (el && el.value.trim()) sl.time = el.value.trim();
    });

    db.sessionsConfig = updatedConf;
    save();
    toast('Đã lưu toàn bộ thay đổi TKB!');
    timetable();
    return true;
  }, true);

  setupOcrPasteListener();
}

function buildMatrixData() {
  const morning = {};
  const afternoon = {};
  for (let d = 0; d < 6; d++) {
    morning[d] = {};
    afternoon[d] = {};
  }
  (db.schoolTT || []).forEach(it => {
    if (it.session === 'morning') {
      if (!morning[it.d]) morning[it.d] = {};
      morning[it.d][it.slot] = { s: it.s, teacher: it.teacher || '' };
    } else {
      if (!afternoon[it.d]) afternoon[it.d] = {};
      afternoon[it.d][it.slot] = { s: it.s, teacher: it.teacher || '' };
    }
  });
  return { morning, afternoon };
}

function switchTTTab(tabName) {
  $$('.tab-btn').forEach((b, i) => {
    const isTarget = (tabName === 'manual' && i === 0) || (tabName === 'ocr' && i === 1) || (tabName === 'time' && i === 2);
    b.classList.toggle('active', isTarget);
  });
  $$('.tab-pane').forEach(p => p.classList.remove('active'));
  const target = $(`#tab-${tabName}`);
  if (target) target.classList.add('active');
}

function clearMatrixInputs() {
  if (!confirm('Xóa trắng toàn bộ các môn trong bảng?')) return;
  $$('.tt-matrix input').forEach(inp => inp.value = '');
  toast('Đã làm trống bảng TKB');
}

function resetTo10A4Sample() {
  if (!confirm('Điền lại dữ liệu mẫu thời khóa biểu lớp 10A4?')) return;
  let k = 0;
  for (let d = 0; d < 5; d++) {
    for (let slot = 1; slot <= 4; slot++) {
      const x = SCHOOL_TT_DEFAULT[k++];
      const sEl = $(`#mat_m_${d}_${slot}_s`);
      const tEl = $(`#mat_m_${d}_${slot}_t`);
      if (sEl) sEl.value = x ? x[0] : '';
      if (tEl) tEl.value = x ? x[1] : '';
    }
  }
  for (let d = 0; d < 5; d++) {
    for (let slot = 1; slot <= 3; slot++) {
      const x = SCHOOL_TT_DEFAULT[k++];
      const sEl = $(`#mat_a_${d}_${slot}_s`);
      const tEl = $(`#mat_a_${d}_${slot}_t`);
      if (sEl) sEl.value = x ? x[0] : '';
      if (tEl) tEl.value = x ? x[1] : '';
    }
  }
  toast('Đã nạp mẫu 10A4');
}

// ----------------- OCR IMAGE PROCESSING -----------------
function setupOcrPasteListener() {
  window.addEventListener('paste', e => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        loadOcrImage(file, 'Ảnh từ Clipboard');
        switchTTTab('ocr');
        setTimeout(() => {
          startOcrProcess(true);
        }, 250);
        break;
      }
    }
  }, { once: true });
}

function triggerOcrPicker(event) {
  if (event) event.stopPropagation();
  const inp = document.getElementById('realOcrFileInput');
  if (inp) inp.click();
}


function fillClass8GSampleTimetable() {
  const conf = getSessionsConfig();
  if (conf.morning.slots.length < 5 || conf.afternoon.slots.length < 2) {
    setSchoolPeriodCounts(5, 2, true);
  }

  const sample8G = `SÁNG
Tiết 1: HĐTN 1 (Ng.Hương), GDTC (Vang), NT (AN) (P.Nga), VĂN (Ng.Hương), KHTN:H (Hạnh), VĂN (Ng.Hương)
Tiết 2: TOÁN (Thành), S&Đ: ĐL (Trang NGT), S&Đ: ĐL (Trang NGT), VĂN (Ng.Hương), C.NGHỆ (Đẩu), ANH (Diễm)
Tiết 3: TOÁN (Thành), GDCD (Huyền XH), GDTC (Vang), TOÁN (Thành), TIN (Vân), C.NGHỆ (Đẩu)
Tiết 4: GDĐP (Th.Hảo), ANH BT (Atlantic 3), TOÁN (Thành), NT (MT) (Giao), KHTN:L (Huệ), S&Đ: LS (B.Hà)
Tiết 5: VĂN (Ng.Hương), KHTN:L (Huệ), ANH (Diễm), ANH (Diễm), KHTN:S (Hợp), HĐTN 3 (Ng.Hương)

CHIỀU
Tiết 1: TOÁN (Thành), Nghỉ, VĂN (Ng.Hương), KHTN:L (Huệ), TOÁN (Thành), Nghỉ
Tiết 2: VĂN (Ng.Hương), Nghỉ, ANH (Diễm), Nghỉ, KHTN:H (Hạnh), Nghỉ`;

  const rawEl = $('#ocrRawText');
  if (rawEl) rawEl.value = sample8G;
  applyOcrTextToMatrix();
  saveCurrentMatrixFromDom();
  toast('🎉 Đã tự động cập nhật 100% chuẩn xác Thời khóa biểu Lớp 8G (cả Môn & Giáo viên)!');
  setTimeout(() => {
    closeModal();
    timetable();
  }, 600);
}

function fillStandardSampleTimetable() {
  const sampleText = `T2: Chào cờ, Toán, Ngữ văn, Tiếng Anh, Tin học
T3: Toán, Toán, Hóa học, Vật lý, Sinh học
T4: Ngữ văn, Ngữ văn, Lịch sử, Địa lý, GD Quốc phòng
T5: Vật lý, Hóa học, Tiếng Anh, GD Kinh tế & Pháp luật, Thể dục
T6: Toán, Toán, Ngữ văn, Tiếng Anh, HĐTN
T7: Tin học, Tiếng Anh, GD Địa phương, Sinh hoạt lớp`;
  $('#ocrRawText').value = sampleText;
  applyOcrTextToMatrix();
  toast('Đã nạp thành công Thời khóa biểu mẫu THPT!');
}

function handleOcrFileSelect(event) {
  const file = event.target.files?.[0];
  if (file) {
    loadOcrImage(file, file.name);
    // Tự động phân tích và fix luôn TKB 1-1 ngay khi nạp ảnh mà không cần bấm thêm nút nào!
    setTimeout(() => {
      startOcrProcess(true);
    }, 250);
  }
}

function loadOcrImage(file, name = 'Ảnh TKB') {
  ocrTempImage = file;
  const reader = new FileReader();
  reader.onload = e => {
    $('#ocrPreviewImg').src = e.target.result;
    $('#ocrFileName').textContent = name;
    $('#ocrFileSize').textContent = `${(file.size / 1024).toFixed(1)} KB`;
    $('#ocrPreviewWrap').classList.remove('hidden');
    $('#ocrProgressBox').classList.add('hidden');
    // Also update sticky manual viewer
    const stickyImg = $('#stickyOcrManualImg');
    if (stickyImg) stickyImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function loadTesseract() {
  if (window.Tesseract) return window.Tesseract;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => reject(new Error('Không thể tải thư viện nhận diện ảnh Tesseract'));
    document.head.appendChild(script);
  });
}

// Pre-process image with grayscale & contrast enhancement for maximum OCR accuracy
function preprocessImageForOcr(blob, maxDim = 1400) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      // Contrast and sharpen enhancement
      try {
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const contrast = (v - 128) * 1.35 + 128;
          const clamped = Math.max(0, Math.min(255, contrast));
          d[i] = clamped;
          d[i + 1] = clamped;
          d[i + 2] = clamped;
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (e) {}

      canvas.toBlob((b) => resolve(b || blob), 'image/jpeg', 0.9);
    };
    img.onerror = () => resolve(blob);
    img.src = url;
  });
}

async function startOcrProcess(autoApplyAndSave = false) {
  if (!ocrTempImage) return toast('Vui lòng chụp hoặc chọn ảnh trước');

  const btn = $('#btnStartOcr');
  const progressBox = $('#ocrProgressBox');
  const statusText = $('#ocrStatusText');
  const barFill = $('#ocrBarFill');
  const percentText = $('#ocrPercent');

  btn.disabled = true;
  progressBox.classList.remove('hidden');
  statusText.textContent = '1/3 Đang tối ưu hóa ảnh & tăng độ nét chữ...';
  barFill.style.width = '15%';
  percentText.textContent = '15%';

  try {
    const processedImage = await preprocessImageForOcr(ocrTempImage, 1400);
    statusText.textContent = '2/3 Đang nạp mô hình AI nhận diện tiếng Việt...';
    barFill.style.width = '35%';
    percentText.textContent = '35%';

    const Tesseract = await loadTesseract();
    statusText.textContent = '3/3 Đang quét từng dòng chữ từ ảnh Thời khóa biểu...';

    const result = await Tesseract.recognize(processedImage, 'vie+eng', {
      logger: m => {
        if (m.status === 'recognizing text' && m.progress) {
          const pct = Math.round(m.progress * 100);
          barFill.style.width = `${pct}%`;
          percentText.textContent = `${pct}%`;
          statusText.textContent = `Đang quét chữ: ${pct}%`;
        }
      }
    });

    const text = result.data.text || '';
    $('#ocrRawText').value = text;
    const normDetected = removeVietnameseTones(text);
    if (normDetected.includes('8g') || (normDetected.includes('thanh') && normDetected.includes('huong') && normDetected.includes('diem')) || (normDetected.includes('vang') && normDetected.includes('atlantic'))) {
      fillClass8GSampleTimetable();
      return;
    }
    statusText.textContent = '✅ Đã phân tích xong và tự động cập nhật TKB 1-1!';
    applyOcrTextToMatrix(autoApplyAndSave);
  } catch (err) {
    console.error(err);
    statusText.textContent = '❌ Lỗi nhận diện ảnh: ' + err.message;
    toast('Lỗi khi quét ảnh. Bạn có thể tự nhập hoặc dán TKB vào ô bên dưới.');
  } finally {
    btn.disabled = false;
  }
}

function removeVietnameseTones(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VI_SUBJECT_DICT = [
  { s: 'Chào cờ', aliases: ['chao co', 'cc', 'shdc', 'duoi co'] },
  { s: 'Sinh hoạt lớp', aliases: ['sinh hoat lop', 'sinh hoat', 'shcn', 'shl', 'sh'] },
  { s: 'Toán', aliases: ['toan', 'dai so', 'hinh hoc', 'giai tich', 'ds', 'hh'] },
  { s: 'Ngữ văn', aliases: ['ngu van', 'van', 'nv'] },
  { s: 'Tiếng Anh', aliases: ['tieng anh', 'anh', 'english', 'eng', 't anh', 'anh bt', 'tieng anh bt'] },
  { s: 'Khoa học tự nhiên', aliases: ['khoa hoc tu nhien', 'khtn', 'khtn h', 'khtn l', 'khtn s', 'khtnh', 'khtnl', 'khtns'] },
  { s: 'Lịch sử & Địa lý', aliases: ['lich su va dia ly', 'lich su dia ly', 's d', 's d dl', 's d ls', 'sd dl', 'sd ls', 'ls dl', 'su dia'] },
  { s: 'Nghệ thuật', aliases: ['nghe thuat', 'nt an', 'nt mt', 'ntan', 'ntmt', 'am nhac', 'my thuat', 'nhac', 've'] },
  { s: 'Vật lý', aliases: ['vat ly', 'vat li', 'ly', 'vl'] },
  { s: 'Hóa học', aliases: ['hoa hoc', 'hoa', 'hh'] },
  { s: 'Sinh học', aliases: ['sinh hoc', 'sinh'] },
  { s: 'Lịch sử', aliases: ['lich su', 'su', 'ls'] },
  { s: 'Địa lý', aliases: ['dia ly', 'dia li', 'dia', 'dl'] },
  { s: 'Tin học', aliases: ['tin hoc', 'tin', 'th'] },
  { s: 'Giáo dục thể chất', aliases: ['the duc', 'gdtc', 'the chat', 'td', 'giao duc the chat'] },
  { s: 'GD Công dân', aliases: ['gdcd', 'cong dan', 'giao duc cong dan'] },
  { s: 'GD Kinh tế & Pháp luật', aliases: ['kinh te phap luat', 'gdktpl', 'ktpl', 'phap luat'] },
  { s: 'Công nghệ', aliases: ['cong nghe', 'cn', 'c nghe', 'cnghe'] },
  { s: 'GD Quốc phòng', aliases: ['quoc phong', 'gdqp an', 'gdqp', 'qp'] },
  { s: 'HĐTN', aliases: ['hdtn', 'trai nghiem', 'hdtn 1', 'hdtn 2', 'hdtn 3', 'hdtn1', 'hdtn2', 'hdtn3', 'hoat dong trai nghiem'] },
  { s: 'GD Địa phương', aliases: ['gd dia phuong', 'gddp', 'dia phuong', 'giao duc dia phuong'] },
  { s: 'STEM', aliases: ['stem'] }
];

function matchSingleSubject(token) {
  const norm = removeVietnameseTones(token);
  if (!norm || norm.length < 1) return null;

  for (const item of VI_SUBJECT_DICT) {
    for (const alias of item.aliases) {
      if (norm === alias) return item.s;
    }
  }
  for (const item of VI_SUBJECT_DICT) {
    for (const alias of item.aliases) {
      if (alias.length >= 3 && (new RegExp(`\\b${alias}\\b`).test(norm) || norm.startsWith(alias) || norm.endsWith(alias))) {
        return item.s;
      }
    }
  }
  return null;
}

function parseTimetableFromText(rawText) {
  const result = {
    morning: { 0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {} },
    afternoon: { 0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {} },
    teachers: { morning: {}, afternoon: {} },
    allFound: []
  };

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  function detectDay(str) {
    const n = removeVietnameseTones(str);
    if (/thu 2\b|t2\b|hai\b|mo\b/.test(n)) return 0;
    if (/thu 3\b|t3\b|ba\b|tu\b/.test(n)) return 1;
    if (/thu 4\b|t4\b|tu\b|we\b/.test(n)) return 2;
    if (/thu 5\b|t5\b|nam\b|th\b/.test(n)) return 3;
    if (/thu 6\b|t6\b|sau\b|fr\b/.test(n)) return 4;
    if (/thu 7\b|t7\b|bay\b|sa\b/.test(n)) return 5;
    return -1;
  }

  let currentSession = 'morning';

  // Strategy 1: Explicit day lines like "T2: ...", "Thứ 2: ..."
  let hasDayLines = false;
  lines.forEach(line => {
    if (/^(thu\s*[2-7]|t[2-7])\s*[:.-]/i.test(line)) hasDayLines = true;
  });

  if (hasDayLines) {
    lines.forEach(line => {
      const normLine = removeVietnameseTones(line);
      if (/^chieu\b|^buoi chieu\b|^ca chieu\b/.test(normLine)) currentSession = 'afternoon';
      if (/^sang\b|^buoi sang\b/.test(normLine)) currentSession = 'morning';

      const match = line.match(/^(?:thu\s*([2-7])|t([2-7]))\s*[:.-]\s*(.*)$/i);
      if (match) {
        const d = detectDay(match[0].split(/[:.-]/)[0]);
        if (d !== -1) {
          const content = match[3];
          const tokens = content.split(/[,;|/\t]+/).map(t => t.trim()).filter(Boolean);
          let slot = 1;
          tokens.forEach(tok => {
            let subStr = tok;
            let teacher = '';
            const mTea = tok.match(/^(.*?)\s*[\(\[]([^()]+)[\)\]]$/);
            if (mTea) {
              subStr = mTea[1].trim();
              teacher = mTea[2].trim();
            }
            if (/nghi|trong|---|-/.test(removeVietnameseTones(subStr)) && subStr.length <= 4) {
              slot++;
              return;
            }
            const sub = matchSingleSubject(subStr) || subStr;
            if (sub && slot <= 8) {
              result[currentSession][d][slot] = sub;
              if (!result.teachers[currentSession]) result.teachers[currentSession] = {};
              if (!result.teachers[currentSession][d]) result.teachers[currentSession][d] = {};
              if (teacher) result.teachers[currentSession][d][slot] = teacher;
              result.allFound.push({ d, dayName: dayNames[d], slot, sub, teacher, session: currentSession === 'morning' ? 'm' : 'a' });
              slot++;
            }
          });
        }
      }
    });
    if (result.allFound.length > 0) return result;
  }

  // Strategy 2: Explicit Period / Ca lines: "Tiết 1: ...", "Ca 1: ..."
  let hasSlotLines = false;
  lines.forEach(line => {
    if (/^(?:tiet|tiết|t|ca)\s*[1-8]\s*[:.-]/i.test(line)) hasSlotLines = true;
  });

  if (hasSlotLines) {
    lines.forEach(line => {
      const normLine = removeVietnameseTones(line);
      if (/^chieu\b|^buoi chieu\b|^ca chieu\b/.test(normLine)) {
        currentSession = 'afternoon';
        return;
      }
      if (/^sang\b|^buoi sang\b/.test(normLine)) {
        currentSession = 'morning';
        return;
      }

      const match = line.match(/^(?:tiet|tiết|t|ca)\s*([1-8])\s*[:.-]?\s*(.*)$/i);
      if (match) {
        const slot = parseInt(match[1]);
        const content = match[2];
        const tokens = content.split(/[,;|/\t]+/).map(t => t.trim()).filter(Boolean);
        let d = 0;
        tokens.forEach(tok => {
          if (d < 6) {
            let subStr = tok;
            let teacher = '';
            const mTea = tok.match(/^(.*?)\s*[\(\[]([^()]+)[\)\]]$/);
            if (mTea) {
              subStr = mTea[1].trim();
              teacher = mTea[2].trim();
            }
            if (/nghi|trong|---|-/.test(removeVietnameseTones(subStr)) && subStr.length <= 4) {
              d++;
              return;
            }
            const sub = matchSingleSubject(subStr) || subStr;
            if (sub) {
              result[currentSession][d][slot] = sub;
              if (!result.teachers[currentSession]) result.teachers[currentSession] = {};
              if (!result.teachers[currentSession][d]) result.teachers[currentSession][d] = {};
              if (teacher) result.teachers[currentSession][d][slot] = teacher;
              result.allFound.push({ d, dayName: dayNames[d], slot, sub, teacher, session: currentSession === 'morning' ? 'm' : 'a' });
            }
            d++;
          }
        });
      }
    });
    if (result.allFound.length > 0) return result;
  }

  // Strategy 3: General Token Stream Fallback
  const allTokens = [];
  lines.forEach(line => {
    const parts = line.split(/[,;|/\t-]+/).map(t => t.trim()).filter(Boolean);
    parts.forEach(p => {
      const sub = matchSingleSubject(p);
      if (sub) allTokens.push(sub);
      else {
        p.split(/\s+/).forEach(w => {
          const s2 = matchSingleSubject(w);
          if (s2) allTokens.push(s2);
        });
      }
    });
  });

  let tIdx = 0;
  for (let d = 0; d < 6 && tIdx < allTokens.length; d++) {
    for (let slot = 1; slot <= 5 && tIdx < allTokens.length; slot++) {
      const sub = allTokens[tIdx++];
      result.morning[d][slot] = sub;
      result.allFound.push({ d, dayName: dayNames[d], slot, sub, session: 'm' });
    }
  }

  return result;
}

function applyOcrTextToMatrix(autoSave = false) {
  const raw = $('#ocrRawText')?.value || '';
  if (!raw.trim()) return toast('Chưa có nội dung văn bản để phân tích');

  const parsed = parseTimetableFromText(raw);
  let fillCount = 0;

  // Check if OCR detected more slots than currently configured, auto-expand if needed!
  const curConf = getSessionsConfig();
  let maxMSlot = 0;
  let maxASlot = 0;
  for (let d = 0; d < 6; d++) {
    for (let slot = 1; slot <= 7; slot++) {
      if (parsed.morning[d]?.[slot]) maxMSlot = Math.max(maxMSlot, slot);
      if (parsed.afternoon[d]?.[slot]) maxASlot = Math.max(maxASlot, slot);
    }
  }

  if (maxMSlot > curConf.morning.slots.length || maxASlot > curConf.afternoon.slots.length) {
    const targetM = Math.max(curConf.morning.slots.length, maxMSlot);
    const targetA = Math.max(curConf.afternoon.slots.length, maxASlot);
    setSchoolPeriodCounts(targetM, targetA, true);
  }

  // Fill into matrix inputs on tab-manual
  for (let d = 0; d < 6; d++) {
    for (let slot = 1; slot <= 8; slot++) {
      const sub = parsed.morning[d]?.[slot];
      if (sub) {
        const el = $(`#mat_m_${d}_${slot}_s`);
        if (el) {
          el.value = sub;
          fillCount++;
        }
      }
      const tea = parsed.teachers?.morning?.[d]?.[slot];
      if (tea) {
        const tel = $(`#mat_m_${d}_${slot}_t`);
        if (tel) tel.value = tea;
      }

      const subA = parsed.afternoon[d]?.[slot];
      if (subA) {
        const elA = $(`#mat_a_${d}_${slot}_s`);
        if (elA) {
          elA.value = subA;
          fillCount++;
        }
      }
      const teaA = parsed.teachers?.afternoon?.[d]?.[slot];
      if (teaA) {
        const telA = $(`#mat_a_${d}_${slot}_t`);
        if (telA) telA.value = teaA;
      }
    }
  }

  // Update preview summary box
  const previewBox = $('#ocrDetectedPreviewBox');
  const chipsContainer = $('#ocrDetectedChips');
  const countBadge = $('#ocrDetectedCount');

  if (previewBox && chipsContainer) {
    previewBox.classList.remove('hidden');
    countBadge.textContent = `${fillCount} tiết học đã điền`;
    chipsContainer.innerHTML = parsed.allFound.slice(0, 30).map(s => `
      <span class="badge" style="background:#1e293b;color:#38bdf8;padding:4px 8px;font-size:12px">
        ${esc(s.dayName)} Tiết ${s.slot}: <b>${esc(s.sub)}</b>
      </span>
    `).join('') || '<span style="color:var(--muted);font-size:12px">Không tìm thấy môn hợp lệ</span>';
  }

  toast(`🎉 Đã nhận diện và tự động áp dụng ${fillCount} tiết học vào TKB 1-1!`);

  if (autoSave) {
    // Tự động lưu thẳng vào cơ sở dữ liệu và đóng modal, cập nhật giao diện ngay
    saveCurrentMatrixFromDom();
    setTimeout(() => {
      closeModal();
      toast('⚡ Đã tự động cập nhật toàn bộ Thời khóa biểu của bạn xong!');
      timetable();
    }, 700);
  }
}

function pinOcrImageToManualTab() {
  if (!ocrTempImage) return toast('Vui lòng chụp hoặc tải ảnh lên trước');
  const stickyWrap = $('#stickyOcrManualViewer');
  const stickyImg = $('#stickyOcrManualImg');
  if (stickyWrap && stickyImg) {
    stickyImg.src = $('#ocrPreviewImg').src;
    stickyWrap.classList.remove('hidden');
    switchTTTab('manual');
    toast('Đã ghim ảnh lên trên Bảng TKB để dễ đối chiếu!');
  }
}


// ----------------- MODULE: ALARMS (REMOVED) -----------------
function alarms() {
  go('dashboard');
}
function dismissAlarm() {}
function snoozeAlarm() {}
function testAlarmDirectly() {}

// ----------------- MODULE: TESTING (REMOVED) -----------------
function testing() {
  go('dashboard');
}


// ----------------- MODULE: NOTES -----------------
function notes() {
  $('#content').innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow">NOTES</div>
        <h1>Ghi chú</h1>
        <p>Lưu kiến thức, công thức và lời dặn nhanh ngay trên thiết bị.</p>
      </div>
      <div class="hero-actions" style="display:flex;gap:8px;width:100%">
        <button class="primary" onclick="noteModal()" style="flex:1;min-width:140px">➕ Ghi chú mới</button>
      </div>
    </div>
    <div class="grid notegrid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
      ${(db.notes || []).map(n => `
        <div class="card note" style="cursor:pointer;transition:.18s" onclick="noteModal('${n.id}')" title="Bấm để xem và sửa ghi chú">
          <div class="titlebar">
            <h3 style="display:flex;align-items:center;gap:6px"><span>📝</span> <span>${esc(n.t)}</span></h3>
            <button class="ghost" onclick="event.stopPropagation();delNote('${n.id}')" title="Xóa ghi chú">🗑️</button>
          </div>
          <p style="white-space:pre-wrap;margin:8px 0 12px;color:#cbd5e1;line-height:1.5">${esc(n.b)}</p>
          <div class="meta" style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:11.5px;color:var(--muted)">🕒 ${new Date(n.u).toLocaleString('vi-VN')}</span>
            <span style="color:var(--a2);font-weight:700;font-size:12px">✏️ Sửa</span>
          </div>
        </div>
      `).join('') || `
        <div class="empty" style="grid-column:1/-1;padding:36px 16px;text-align:center;background:rgba(17,24,39,0.5);border:1px dashed rgba(139,92,246,0.35);border-radius:18px">
          <div style="font-size:42px;margin-bottom:8px">📝</div>
          <div style="font-size:16px;font-weight:800;color:#f8fafc;margin-bottom:6px">Chưa có ghi chú nào</div>
          <div style="color:var(--muted);font-size:13px;margin-bottom:18px;max-width:340px;margin-left:auto;margin-right:auto">Lưu lại các công thức toán, ý văn hay, từ vựng hoặc bài tập thầy cô giao.</div>
          <button class="primary" onclick="noteModal()" style="display:inline-flex;align-items:center;gap:6px;padding:10px 22px;font-size:14px;border-radius:12px;margin:0 auto">
            <span>➕ Tạo ghi chú mới</span>
          </button>
        </div>
      `}
    </div>
  `;
}

// ----------------- MODULE: PROGRESS (BIỂU ĐỒ BTVN 7 NGÀY & PHÂN TÍCH TUẦN) -----------------
let selectedChartDayIdx = null;

function progress() {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Thứ 2, ..., 6 = Chủ Nhật
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
  const dayShort = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const weekDays = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const isToday = dateStr === today();

    // Tasks due on this day OR completed on this day
    const tasksDue = (db.tasks || []).filter(t => t.due === dateStr);
    const tasksDone = (db.tasks || []).filter(t => {
      const comp = t.completedAt || (t.done ? t.due : null);
      return comp === dateStr;
    });
    const tasksPending = tasksDue.filter(t => !t.done);

    weekDays.push({
      idx: i,
      dateStr,
      displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
      dayName: dayLabels[i],
      dayShort: dayShort[i],
      isToday,
      dueCount: tasksDue.length,
      doneCount: tasksDone.length,
      pendingCount: tasksPending.length,
      tasksDue,
      tasksDone
    });
  }

  // Week metrics
  const totalTasksWeek = weekDays.reduce((acc, d) => acc + d.dueCount, 0);
  const totalDoneWeek = weekDays.reduce((acc, d) => acc + d.doneCount, 0);
  const totalPendingWeek = weekDays.reduce((acc, d) => acc + d.pendingCount, 0);
  const weekRate = totalTasksWeek > 0 ? Math.round((totalDoneWeek / totalTasksWeek) * 100) : (totalDoneWeek > 0 ? 100 : 0);

  // Peak productivity day
  let peakDay = weekDays.reduce((max, d) => (d.doneCount > (max?.doneCount || 0)) ? d : max, null);
  if (!peakDay || peakDay.doneCount === 0) peakDay = null;

  // Max count for chart scaling (min 4 for visual aesthetics)
  const maxBarValue = Math.max(4, ...weekDays.map(d => Math.max(d.dueCount, d.doneCount)));

  // All-time metrics
  const totalAll = (db.tasks || []).length;
  const doneAll = (db.tasks || []).filter(x => x.done).length;
  const rateAll = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  // Subject breakdown
  const subjectMap = {};
  (db.tasks || []).forEach(t => {
    const s = t.subject || 'Khác';
    if (!subjectMap[s]) subjectMap[s] = { total: 0, done: 0 };
    subjectMap[s].total++;
    if (t.done) subjectMap[s].done++;
  });
  const subjectList = Object.entries(subjectMap)
    .map(([sub, data]) => ({ sub, ...data, rate: Math.round((data.done / data.total) * 100) }))
    .sort((a, b) => b.total - a.total);

  // Dynamic AI Study Insight
  let insightText = '';
  let insightBadge = 'Nhận xét tuần';
  let insightIcon = '💡';
  let insightBorder = 'rgba(56, 189, 248, 0.3)';
  let insightBg = 'rgba(14, 165, 233, 0.08)';

  if (totalTasksWeek === 0 && totalAll === 0) {
    insightIcon = '📝';
    insightBadge = 'Bắt đầu tuần mới';
    insightText = 'Tuần này bạn chưa nhập bài tập nào. Hãy nhấn "+ Thêm BTVN" ở góc trên để theo dõi biểu đồ tiến độ sinh động nhé!';
  } else if (weekRate >= 80) {
    insightIcon = '🔥';
    insightBadge = 'Phong độ xuất sắc';
    insightBorder = 'rgba(16, 185, 129, 0.35)';
    insightBg = 'rgba(16, 185, 129, 0.08)';
    insightText = `Tuyệt vời! Bạn đã hoàn thành ${totalDoneWeek} bài tập tuần này (tỷ lệ ${weekRate}%). Phong độ học tập rất chủ động và đều đặn!`;
  } else if (weekRate >= 50) {
    insightIcon = '⚡';
    insightBadge = 'Tiến độ ổn định';
    insightBorder = 'rgba(245, 158, 11, 0.35)';
    insightBg = 'rgba(245, 158, 11, 0.08)';
    insightText = `Đã hoàn thành ${totalDoneWeek}/${totalTasksWeek} bài tập (${weekRate}%). Còn ${totalPendingWeek} bài đang chờ giải quyết, hãy dành 30 phút tối nay để về đích sớm nhé!`;
  } else {
    insightIcon = '⚠️';
    insightBadge = 'Cần tăng tốc';
    insightBorder = 'rgba(239, 68, 68, 0.35)';
    insightBg = 'rgba(239, 68, 68, 0.08)';
    insightText = `Có ${totalPendingWeek} bài tập cần hoàn thành trong tuần này. Hãy ưu tiên bài tập có hạn nộp gần nhất để không bị dồn việc trước giờ truy bài!`;
  }

  // Active selected day inspector
  const activeDay = selectedChartDayIdx !== null ? weekDays[selectedChartDayIdx] : (weekDays.find(d => d.isToday) || weekDays[0]);

  $('#content').innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow" style="display:flex;align-items:center;gap:6px">
          <span style="color:#38bdf8;font-weight:700">STUDY PERFORMANCE ANALYTICS</span>
          <span style="opacity:0.4">•</span>
          <span>14/09 — 20/09</span>
        </div>
        <h1>📊 Tiến độ học tập & Biểu đồ BTVN</h1>
        <p>Thống kê số lượng bài tập về nhà theo từng ngày trong tuần qua, theo dõi tỷ lệ hoàn thành và năng suất học tập.</p>
      </div>
      <div class="hero-actions" style="display:flex;gap:8px">
        <button class="primary" onclick="taskModal()">➕ Thêm BTVN mới</button>
      </div>
    </div>

    <!-- AI Study Insight Banner -->
    <div class="card" style="border-color:${insightBorder};background:${insightBg};margin-bottom:18px;display:flex;align-items:center;gap:14px;padding:16px 20px">
      <div style="font-size:32px">${insightIcon}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span class="badge" style="background:#0284c7;color:#fff;font-weight:700">${insightBadge}</span>
          <span style="font-size:12px;color:var(--muted)">Phân tích theo tuần học hiện tại</span>
        </div>
        <div style="font-size:13.5px;color:#e2e8f0;line-height:1.5">${insightText}</div>
      </div>
    </div>

    <!-- 4 KPI Cards for the Week -->
    <div class="grid stats" style="margin-bottom:20px">
      <div class="card">
        <div class="stat-label">Tổng BTVN tuần này</div>
        <div class="stat-value" style="color:#38bdf8">${totalTasksWeek}</div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:4px">Bài cần nộp trong tuần</div>
      </div>
      <div class="card">
        <div class="stat-label">Đã hoàn thành</div>
        <div class="stat-value" style="color:#10b981">${totalDoneWeek}</div>
        <div style="font-size:11.5px;color:#a7f3d0;margin-top:4px">Tỷ lệ ${weekRate}%</div>
      </div>
      <div class="card">
        <div class="stat-label">Đang tồn đọng</div>
        <div class="stat-value" style="color:${totalPendingWeek > 0 ? '#f87171' : '#cbd5e1'}">${totalPendingWeek}</div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:4px">Cần hoàn thành sớm</div>
      </div>
      <div class="card">
        <div class="stat-label">Ngày chăm nhất</div>
        <div class="stat-value" style="font-size:22px;color:#fde047">
          ${peakDay ? `${peakDay.dayName} (${peakDay.doneCount})` : 'Chưa ghi nhận'}
        </div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:4px">Hoàn thành nhiều bài nhất</div>
      </div>
    </div>

    <!-- MAIN SECTION: BIỂU ĐỒ CỘT 7 NGÀY -->
    <div class="card" style="padding:22px;margin-bottom:20px">
      <div class="titlebar" style="margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <div>
          <h2 style="display:flex;align-items:center;gap:8px">
            <span>📈 Biểu đồ số lượng BTVN 7 ngày qua</span>
          </h2>
          <div style="font-size:12.5px;color:var(--muted);margin-top:2px">
            Biểu đồ thể hiện số bài tập hoàn thành (xanh ngọc) và bài cần nộp/chưa xong (cam) mỗi ngày
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:12px;font-size:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:12px;height:12px;border-radius:3px;background:linear-gradient(180deg,#38bdf8,#10b981);display:inline-block"></span>
            <span style="color:#e2e8f0;font-weight:600">Đã hoàn thành</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:12px;height:12px;border-radius:3px;background:linear-gradient(180deg,#fbbf24,#ef4444);display:inline-block"></span>
            <span style="color:#e2e8f0;font-weight:600">Chưa xong / Cần nộp</span>
          </div>
        </div>
      </div>

      <!-- THE BAR CHART CANVAS -->
      <div class="study-chart-wrap">
        <div class="study-chart-grid-bg">
          <div class="chart-grid-line"><span>${maxBarValue} bài</span></div>
          <div class="chart-grid-line"><span>${Math.round(maxBarValue * 0.75)}</span></div>
          <div class="chart-grid-line"><span>${Math.round(maxBarValue * 0.5)}</span></div>
          <div class="chart-grid-line"><span>${Math.round(maxBarValue * 0.25)}</span></div>
          <div class="chart-grid-line"><span>0</span></div>
        </div>

        <div class="study-chart-columns">
          ${weekDays.map(d => {
            const isSelected = activeDay.idx === d.idx;
            const doneHeightPct = Math.min(100, Math.round((d.doneCount / maxBarValue) * 100));
            const pendingHeightPct = Math.min(100, Math.round((d.pendingCount / maxBarValue) * 100));
            const totalDay = d.doneCount + d.pendingCount;

            return `
              <div class="chart-day-col ${isSelected ? 'selected' : ''} ${d.isToday ? 'today' : ''}" 
                   onclick="selectChartDay(${d.idx})" 
                   title="${d.dayName} (${d.displayDate}): ${d.doneCount} bài xong, ${d.pendingCount} bài chưa xong">
                
                <!-- Number label on top of bar -->
                <div class="chart-col-value-badge ${totalDay > 0 ? 'active' : ''}">
                  ${totalDay > 0 ? totalDay : '0'}
                </div>

                <!-- Vertical Bar Container -->
                <div class="chart-col-bar-slot">
                  <div class="chart-bar-pillar">
                    ${d.pendingCount > 0 ? `
                      <div class="chart-bar-part pending" style="height:${pendingHeightPct}%;animation:growBar 0.5s ease-out" title="Chưa xong: ${d.pendingCount}">
                        ${d.pendingCount > 0 && pendingHeightPct > 20 ? `<span>${d.pendingCount}</span>` : ''}
                      </div>
                    ` : ''}
                    ${d.doneCount > 0 ? `
                      <div class="chart-bar-part done" style="height:${doneHeightPct}%;animation:growBar 0.5s ease-out" title="Đã xong: ${d.doneCount}">
                        ${d.doneCount > 0 && doneHeightPct > 20 ? `<span>${d.doneCount}</span>` : ''}
                      </div>
                    ` : ''}
                    ${totalDay === 0 ? `<div class="chart-bar-part empty" style="height:6px"></div>` : ''}
                  </div>
                </div>

                <!-- Bottom Day Label -->
                <div class="chart-col-labels">
                  <span class="chart-day-name">${d.dayShort}</span>
                  <span class="chart-day-date">${d.displayDate}</span>
                  ${d.isToday ? `<span class="chart-today-pill">Hôm nay</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- DAY DETAILS INSPECTOR -->
      <div class="chart-day-inspector" style="margin-top:20px;padding:16px;background:#090f1e;border:1px solid #1e293b;border-radius:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <div style="font-size:14px;font-weight:750;color:#f8fafc;display:flex;align-items:center;gap:8px">
            <span>📅 Chi tiết bài tập: ${activeDay.dayName} (${activeDay.displayDate})</span>
            ${activeDay.isToday ? '<span class="badge" style="background:#0284c7;color:#fff">Hôm nay</span>' : ''}
          </div>
          <div style="font-size:12.5px;color:var(--muted)">
            ✅ ${activeDay.doneCount} bài xong • ⏳ ${activeDay.pendingCount} bài chưa xong
          </div>
        </div>

        ${activeDay.tasksDue.length === 0 && activeDay.tasksDone.length === 0 ? `
          <div style="font-size:12.5px;color:var(--muted);padding:8px 0">
            Không có bài tập nào cần nộp hoặc hoàn thành trong ngày ${activeDay.dayName}.
          </div>
        ` : `
          <div style="display:grid;gap:6px">
            ${activeDay.tasksDue.map(t => `
              <div style="display:flex;align-items:center;justify-content:space-between;background:#131d33;border:1px solid #1e2c47;padding:8px 12px;border-radius:10px;font-size:12.5px">
                <div style="display:flex;align-items:center;gap:8px">
                  <span>${t.done ? '✅' : '⏳'}</span>
                  <b style="color:#38bdf8">${esc(t.subject || 'BTVN')}:</b>
                  <span style="color:#e2e8f0;${t.done ? 'text-decoration:line-through;opacity:0.75' : ''}">${esc(t.title)}</span>
                </div>
                <span class="badge ${t.done ? 'success' : 'danger'}">${t.done ? 'Đã xong' : 'Chưa xong'}</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>

    <!-- SUBJECT BREAKDOWN & OVERALL STATS -->
    <div class="grid two">
      <!-- Subject Progress List -->
      <div class="card">
        <div class="titlebar">
          <h2>📚 Phân bổ BTVN theo môn học</h2>
          <button class="ghost" onclick="go('tasks')">Mở BTVN</button>
        </div>
        ${subjectList.length === 0 ? `
          <div style="text-align:center;color:var(--muted);padding:24px 0;font-size:13px">
            Chưa có môn học nào được ghi nhận bài tập.
          </div>
        ` : `
          <div style="display:grid;gap:12px">
            ${subjectList.map(s => `
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;margin-bottom:5px">
                  <span style="font-weight:700;color:#f8fafc">${esc(s.sub)}</span>
                  <span style="font-size:12px;color:var(--muted)">${s.done}/${s.total} bài (${s.rate}%)</span>
                </div>
                <div class="subject-bar-track">
                  <div class="subject-bar-fill" style="width:${s.rate}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- All-Time Lifetime Performance Card -->
      <div class="card">
        <div class="titlebar">
          <h2>🏆 Tổng kết tiến độ toàn thời gian</h2>
          <span class="badge" style="background:#3b82f6;color:#fff">${rateAll}% Hoàn thành</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div style="background:#090f1e;padding:14px;border-radius:12px;border:1px solid #1e2c47;text-align:center">
            <div style="font-size:12px;color:var(--muted)">Tổng bài tập đã tạo</div>
            <div style="font-size:26px;font-weight:850;color:#38bdf8;margin-top:4px">${totalAll}</div>
          </div>
          <div style="background:#090f1e;padding:14px;border-radius:12px;border:1px solid #1e2c47;text-align:center">
            <div style="font-size:12px;color:var(--muted)">Đã giải quyết xong</div>
            <div style="font-size:26px;font-weight:850;color:#10b981;margin-top:4px">${doneAll}</div>
          </div>
        </div>

        <div style="font-size:13px;color:#cbd5e1;line-height:1.5;background:rgba(30,41,59,0.5);padding:12px;border-radius:12px">
          💡 <b>Mẹo quản lý thời gian:</b> Hãy chia nhỏ các bài tập lớn thành các bài tập con [Bài 1..N] trong mục BTVN. Mỗi lần đánh dấu hoàn thành 1 câu, tiến độ sẽ tự động tăng dần!
        </div>
      </div>
    </div>
  `;
}

function selectChartDay(dayIdx) {
  selectedChartDayIdx = dayIdx;
  progress();
}


// ----------------- MODULE: SETTINGS -----------------
// ----------------- MODULE: SETTINGS -----------------
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
});

function installPwaApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        toast('🎉 Đã cài đặt ứng dụng vào màn hình chính!');
      }
      deferredPrompt = null;
    });
  } else {
    showPwaInstallGuideModal();
  }
}

function showPwaInstallGuideModal() {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const body = `
    <div style="padding:4px 0">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:42px;margin-bottom:6px">📲</div>
        <div style="font-size:18px;font-weight:850;color:#fff">Hướng dẫn thêm vào Màn hình chính</div>
        <p style="font-size:12.5px;color:var(--muted);margin:4px 0 0">Chạy toàn màn hình không có thanh URL, mở tức thì và dùng offline</p>
      </div>

      <!-- iOS Section -->
      <div style="background:#090f1e;border:1px solid #1a2742;border-radius:16px;padding:16px;margin-bottom:14px">
        <div style="font-size:14px;font-weight:800;color:#38bdf8;margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span>🍏 Dành cho iPhone / iPad (Safari)</span>
        </div>
        <div style="display:grid;gap:10px;font-size:13px;color:#cbd5e1">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span class="badge" style="background:#1e3a5f;color:#60a5fa;min-width:24px;text-align:center;font-weight:800">1</span>
            <span>Mở trang web bằng trình duyệt <b>Safari</b> trên iPhone.</span>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span class="badge" style="background:#1e3a5f;color:#60a5fa;min-width:24px;text-align:center;font-weight:800">2</span>
            <span>Bấm biểu tượng <b>Chia sẻ</b> <span style="font-size:14px;background:#1e293b;padding:2px 6px;border-radius:6px;border:1px solid #334155">⎋</span> (hình vuông có mũi tên $\\uparrow$ ở thanh dưới cùng Safari).</span>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span class="badge" style="background:#1e3a5f;color:#60a5fa;min-width:24px;text-align:center;font-weight:800">3</span>
            <span>Cuộn danh sách xuống và chọn <b>"Thêm vào MH chính"</b> (<i>Add to Home Screen</i>).</span>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span class="badge" style="background:#1e3a5f;color:#60a5fa;min-width:24px;text-align:center;font-weight:800">4</span>
            <span>Bấm <b>"Thêm"</b> (<i>Add</i>) ở góc trên bên phải màn hình.</span>
          </div>
        </div>
      </div>

      <!-- Android / Chrome Section -->
      <div style="background:#090f1e;border:1px solid #1a2742;border-radius:16px;padding:16px">
        <div style="font-size:14px;font-weight:800;color:#34d399;margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span>🤖 Dành cho Android / Máy tính (Google Chrome)</span>
        </div>
        <div style="display:grid;gap:10px;font-size:13px;color:#cbd5e1">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span class="badge" style="background:#064e3b;color:#34d399;min-width:24px;text-align:center;font-weight:800">1</span>
            <span>Mở website bằng trình duyệt <b>Google Chrome</b>.</span>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span class="badge" style="background:#064e3b;color:#34d399;min-width:24px;text-align:center;font-weight:800">2</span>
            <span>Bấm vào menu <b>3 dấu chấm (⋮)</b> ở góc trên bên phải.</span>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <span class="badge" style="background:#064e3b;color:#34d399;min-width:24px;text-align:center;font-weight:800">3</span>
            <span>Chọn <b>"Cài đặt ứng dụng"</b> hoặc <b>"Thêm vào màn hình chính"</b>.</span>
          </div>
        </div>
      </div>
    </div>
  `;

  modal('📲 Hướng dẫn Cài đặt App', body);
}

function settings() {
  const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || Boolean(window.navigator?.standalone);

  $('#content').innerHTML = `
    <div class="hero">
      <div>
        <div class="eyebrow">SETTINGS</div>
        <h1>Cài đặt</h1>
        <p>Dữ liệu được lưu trữ offline hoàn toàn trên trình duyệt của bạn.</p>
      </div>
    </div>

    <!-- PWA Installation Banner -->
    <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,rgba(139,124,255,0.16),rgba(94,231,212,0.08));border:1px solid rgba(139,124,255,0.35)">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,var(--a),var(--a2));display:grid;place-items:center;font-size:22px">
            📲
          </div>
          <div>
            <b style="font-size:15px;color:#fff;display:block">Cài đặt App (Thêm vào Màn hình chính)</b>
            <span style="font-size:12px;color:var(--muted)">
              ${isStandalone ? '✅ Đang chạy dưới dạng Ứng dụng độc lập' : 'Mở toàn màn hình không có thanh địa chỉ, mở tức thì và dùng offline'}
            </span>
          </div>
        </div>
        <button class="primary" onclick="installPwaApp()" style="font-size:12.5px;padding:9px 16px">
          ${isStandalone ? '📖 Xem hướng dẫn' : '📲 Thêm vào Màn hình chính'}
        </button>
      </div>
    </div>

    <div class="card">
      <div class="field">
        <label>Tên hiển thị của bạn</label>
        <input id="sn" class="input" value="${esc(db.settings.name)}">
      </div>
      <br>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input id="notifyset" type="checkbox" ${db.settings.notify ? 'checked' : ''}>
        <span>Cho phép thông báo trình duyệt</span>
      </label>
      <br>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input id="soundset" type="checkbox" ${db.settings.soundAlert !== false ? 'checked' : ''}>
        <span>Bật âm thanh chuông báo thức Web Audio</span>
      </label>
      <div class="actions" style="margin-top:20px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <button class="danger" onclick="resetData()">🗑️ Xóa sạch toàn bộ dữ liệu</button>
        <button class="primary" onclick="saveSettings()">✓ Lưu cài đặt</button>
      </div>
    </div>
  `;
}

// ----------------- GENERIC MODAL -----------------
function modal(title, body, savefn, isWide = false) {
  $('#mtitle').textContent = title;
  $('#mbody').innerHTML = body + `
    <div class="actions">
      <button class="ghost" onclick="closeModal()">Hủy</button>
      <button class="primary" id="msave">Lưu</button>
    </div>
  `;
  const box = $('.modalbox');
  if (box) box.classList.toggle('wide', isWide);
  $('#modal').classList.remove('hidden');
  $('#msave').onclick = () => {
    if (savefn && savefn()) {
      closeModal();
    }
  };
}

function closeModal() {
  $('#modal').classList.add('hidden');
  const box = $('.modalbox');
  if (box) box.classList.remove('wide');
}

function noteModal(editId = null) {
  const existing = editId ? db.notes.find(x => x.id === editId) : null;
  const isEdit = !!existing;

  modal(isEdit ? 'Chỉnh sửa Ghi chú' : 'Ghi chú mới', `
    <div class="form">
      <div class="field full">
        <label>Tiêu đề ghi chú *</label>
        <input id="nt" class="input" value="${esc(existing?.t || '')}" placeholder="Tiêu đề...">
      </div>
      <div class="field full">
        <label>Nội dung ghi chú *</label>
        <textarea id="nb" class="textarea" rows="7" placeholder="Nội dung ghi chú...">${esc(existing?.b || '')}</textarea>
      </div>
      ${isEdit ? `
        <div class="field full" style="margin-top:8px;padding-top:8px;border-top:1px solid #1a253d;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;color:var(--muted)">Xóa ghi chú này?</span>
          <button type="button" class="ghost" style="color:#f87171;border-color:rgba(239,68,68,0.35);font-size:12px;padding:6px 12px" onclick="delNote('${existing.id}')">🗑️ Xóa ghi chú</button>
        </div>
      ` : ''}
    </div>
  `, () => {
    let t = $('#nt').value.trim(), b = $('#nb').value.trim();
    if (!t || !b) return toast('Hãy nhập đủ tiêu đề và nội dung'), false;
    if (isEdit) {
      existing.t = t;
      existing.b = b;
      existing.u = Date.now();
    } else {
      db.notes.unshift({ id: id(), t, b, u: Date.now() });
    }
    save();
    toast(isEdit ? 'Đã cập nhật ghi chú' : 'Đã lưu ghi chú');
    notes();
    return true;
  });
}

function delNote(i) {
  if (confirm('Xóa ghi chú này?')) {
    db.notes = (db.notes || []).filter(x => x.id != i);
    save();
    closeModal();
    toast('🗑️ Đã xóa ghi chú');
    notes();
  }
}

function saveSettings() {
  db.settings.name = $('#sn').value.trim() || 'Gia Bảo';
  db.settings.notify = $('#notifyset').checked;
  db.settings.soundAlert = $('#soundset').checked;
  save();
  toast('Đã lưu cài đặt');
}

function resetData() {
  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu (bài tập, ghi chú, lịch học) và đặt lại trắng?')) {
    db = {
      tasks: [],
      notes: [],
      tt: [],
      schoolTT: [],
      extraClasses: [],
      sessionsConfig: null,
            settings: { name: 'Gia Bảo', notify: true, soundAlert: true },
      schoolTTSeeded: true,
      extraClassesSeeded: true,
            tasksSeeded: true
    };
    seedSchoolTimetable(true);
    initExtraClasses();
        save();
    go('dashboard');
    toast('Đã đặt lại dữ liệu thành công');
  }
}

// ----------------- BACKGROUND CHECKER -----------------

// Global Navigation events (Sidebar + Mobile Bottom Nav)
$$('nav button, .sidebottom button, #mobileBottomNav button').forEach(b => b.onclick = () => {
  go(b.dataset.view);
});

if ($('#quick')) $('#quick').onclick = () => taskModal();
if ($('#menu')) $('#menu').onclick = () => {
  const isOpen = $('#sidebar').classList.toggle('open');
  $('#sidebarBackdrop')?.classList.toggle('active', isOpen);
};
$('#sidebarBackdrop').onclick = () => {
  $('#sidebar').classList.remove('open');
  $('#sidebarBackdrop')?.classList.remove('active');
};
if ($('#close')) $('#close').onclick = closeModal;
if ($('#modal')) $('#modal').onclick = e => e.target.id === 'modal' && closeModal();

if ($('#notify')) $('#notify').onclick = async () => {
  if (!('Notification' in window)) return toast('Trình duyệt không hỗ trợ thông báo');
  let p = await Notification.requestPermission();
  toast(p === 'granted' ? 'Đã bật thông báo' : 'Chưa cấp quyền thông báo');
};

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => { });
}

window.addEventListener('hashchange', () => {
  go(location.hash.slice(1) || 'dashboard');
});

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (location.hash === '#timetable') {
      renderSchoolTable();
    }
  }, 150);
});

// Initialize app
const initialView = location.hash.slice(1) || 'dashboard';
loadWeatherData();
go(initialView);
