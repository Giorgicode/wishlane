export type HolidayType = 'religious' | 'national' | 'observance' | 'islamic' | 'jewish' | 'cultural';

export interface Holiday {
  name: string;
  emoji: string;
  color: string;
  type: HolidayType;
}

/* ─── Fixed-date holidays as tuples (handles same-date entries) ─ */
const FIXED: [string, Holiday][] = [
  // ── Global / widely shared ──────────────────────────────────────
  ['01-01', { name: "New Year's Day",            emoji: '🎊', color: '#5AF0D0', type: 'observance' }],
  ['01-06', { name: 'Epiphany',                  emoji: '⭐', color: '#FFD060', type: 'religious'  }],
  ['02-14', { name: "Valentine's Day",           emoji: '💝', color: '#FF6B81', type: 'observance' }],
  ['03-08', { name: "International Women's Day", emoji: '♀️', color: '#E040FB', type: 'observance' }],
  ['03-17', { name: "St. Patrick's Day",         emoji: '🍀', color: '#4CAF50', type: 'observance' }],
  ['04-01', { name: "April Fools' Day",          emoji: '🃏', color: '#9C27B0', type: 'observance' }],
  ['04-22', { name: 'Earth Day',                 emoji: '🌍', color: '#4CAF50', type: 'observance' }],
  ['05-01', { name: 'Labour Day / May Day',      emoji: '✊', color: '#FF5722', type: 'national'   }],
  ['10-31', { name: 'Halloween',                 emoji: '🎃', color: '#FF6F00', type: 'observance' }],
  ['11-01', { name: "All Saints' Day",           emoji: '✝️', color: '#9E9E9E', type: 'religious'  }],
  ['11-02', { name: "Día de Muertos",            emoji: '💀', color: '#9C27B0', type: 'cultural'   }],
  ['11-11', { name: "Remembrance / Veterans",    emoji: '🪖', color: '#795548', type: 'national'   }],
  ['12-08', { name: 'Immaculate Conception',     emoji: '✝️', color: '#7986CB', type: 'religious'  }],
  ['12-24', { name: 'Christmas Eve',             emoji: '🎄', color: '#4CAF50', type: 'religious'  }],
  ['12-25', { name: 'Christmas Day',             emoji: '🎄', color: '#EF5350', type: 'religious'  }],
  ['12-26', { name: 'Boxing Day',                emoji: '📦', color: '#FF9800', type: 'national'   }],
  ['12-31', { name: "New Year's Eve",            emoji: '🎆', color: '#5AF0D0', type: 'observance' }],

  // ── Australia / New Zealand ─────────────────────────────────────
  ['01-02', { name: 'Day after New Year (NZ)',   emoji: '🇳🇿', color: '#1565C0', type: 'national'   }],
  ['01-26', { name: 'Australia Day',             emoji: '🦘', color: '#2196F3', type: 'national'   }],
  ['02-06', { name: 'Waitangi Day (NZ)',         emoji: '🇳🇿', color: '#1565C0', type: 'national'   }],
  ['04-25', { name: 'Anzac Day (AU/NZ)',         emoji: '🌺', color: '#B71C1C', type: 'national'   }],

  // ── Canada ──────────────────────────────────────────────────────
  ['02-15', { name: 'Canada Flag Day',           emoji: '🍁', color: '#D32F2F', type: 'national'   }],
  ['07-01', { name: 'Canada Day',                emoji: '🍁', color: '#D32F2F', type: 'national'   }],

  // ── United Kingdom ──────────────────────────────────────────────
  ['04-23', { name: "St. George's Day (UK)",     emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#EF5350', type: 'national'   }],

  // ── United States ───────────────────────────────────────────────
  ['07-04', { name: 'US Independence Day',       emoji: '🎆', color: '#1565C0', type: 'national'   }],

  // ── France ──────────────────────────────────────────────────────
  ['07-14', { name: 'Bastille Day',              emoji: '🥖', color: '#1565C0', type: 'national'   }],

  // ── Italy ───────────────────────────────────────────────────────
  ['06-02', { name: 'Italy Republic Day',        emoji: '🇮🇹', color: '#009688', type: 'national'   }],

  // ── Brazil ──────────────────────────────────────────────────────
  ['09-07', { name: 'Brazil Independence Day',   emoji: '🇧🇷', color: '#4CAF50', type: 'national'   }],

  // ── China ───────────────────────────────────────────────────────
  ['10-01', { name: 'China National Day',        emoji: '🏮', color: '#D32F2F', type: 'national'   }],

  // ── Germany ─────────────────────────────────────────────────────
  ['10-03', { name: 'German Unity Day',          emoji: '🇩🇪', color: '#FDD835', type: 'national'   }],

  // ── Spain ───────────────────────────────────────────────────────
  ['10-12', { name: 'Día de la Hispanidad',      emoji: '🇪🇸', color: '#EF5350', type: 'national'   }],

  // ── Singapore ───────────────────────────────────────────────────
  ['08-09', { name: 'Singapore National Day',    emoji: '🦁', color: '#EF5350', type: 'national'   }],

  // ── India ───────────────────────────────────────────────────────
  ['08-15', { name: 'India Independence Day',    emoji: '🇮🇳', color: '#FF9800', type: 'national'   }],
  ['08-15', { name: 'Assumption of Mary',        emoji: '✝️', color: '#7986CB', type: 'religious'  }],

  // ── Mexico ──────────────────────────────────────────────────────
  ['12-06', { name: 'Finland Independence',      emoji: '🇫🇮', color: '#1565C0', type: 'national'   }],
  ['12-12', { name: 'Mexico Day of the Virgin',  emoji: '🇲🇽', color: '#4CAF50', type: 'religious'  }],

  // ── Japan 🇯🇵 ────────────────────────────────────────────────────
  ['02-11', { name: 'National Foundation Day (JP)', emoji: '🇯🇵', color: '#EF5350', type: 'national' }],
  ['02-23', { name: "Emperor's Birthday (JP)",   emoji: '👑', color: '#EF5350', type: 'national'   }],
  ['04-29', { name: 'Showa Day (JP)',             emoji: '🇯🇵', color: '#EF5350', type: 'national'   }],
  ['05-03', { name: 'Constitution Memorial Day (JP)', emoji: '🇯🇵', color: '#EF5350', type: 'national' }],
  ['05-04', { name: 'Greenery Day (JP)',          emoji: '🌿', color: '#4CAF50', type: 'national'   }],
  ['05-05', { name: "Children's Day (JP/KR)",    emoji: '🎏', color: '#FF6F00', type: 'national'   }],
  ['08-11', { name: 'Mountain Day (JP)',          emoji: '⛰️', color: '#795548', type: 'national'   }],
  ['09-23', { name: 'Autumnal Equinox Day (JP)', emoji: '🍂', color: '#FF9800', type: 'observance' }],
  ['11-03', { name: 'Culture Day (JP)',           emoji: '🎎', color: '#E91E63', type: 'cultural'   }],
  ['11-23', { name: 'Labor Thanksgiving Day (JP)', emoji: '🇯🇵', color: '#EF5350', type: 'national' }],

  // ── South Korea 🇰🇷 ──────────────────────────────────────────────
  ['03-01', { name: 'Independence Movement Day (KR)', emoji: '🇰🇷', color: '#EF5350', type: 'national' }],
  ['06-06', { name: 'Memorial Day (KR)',          emoji: '🕊️', color: '#1565C0', type: 'national'   }],
  ['06-06', { name: 'National Day of Sweden',     emoji: '🇸🇪', color: '#FFD060', type: 'national'   }],
  ['07-17', { name: 'Constitution Day (KR)',      emoji: '🇰🇷', color: '#1565C0', type: 'national'   }],
  ['08-15', { name: 'Liberation Day (KR)',        emoji: '🇰🇷', color: '#EF5350', type: 'national'   }],
  ['10-03', { name: 'National Foundation Day (KR)', emoji: '🇰🇷', color: '#EF5350', type: 'national' }],
  ['10-09', { name: 'Hangul Day (KR)',            emoji: '🇰🇷', color: '#1565C0', type: 'cultural'   }],

  // ── UAE 🇦🇪 ──────────────────────────────────────────────────────
  ['12-02', { name: 'UAE National Day',           emoji: '🇦🇪', color: '#009688', type: 'national'   }],
  ['12-03', { name: 'UAE National Day (Day 2)',   emoji: '🇦🇪', color: '#009688', type: 'national'   }],

  // ── Saudi Arabia 🇸🇦 ─────────────────────────────────────────────
  ['02-22', { name: 'Saudi Founding Day',         emoji: '🇸🇦', color: '#4CAF50', type: 'national'   }],
  ['09-23', { name: 'Saudi National Day',         emoji: '🇸🇦', color: '#4CAF50', type: 'national'   }],

  // ── Turkey 🇹🇷 ───────────────────────────────────────────────────
  ['04-23', { name: 'National Sovereignty Day (TR)', emoji: '🇹🇷', color: '#EF5350', type: 'national' }],
  ['05-19', { name: "Atatürk Day (TR)",           emoji: '🇹🇷', color: '#EF5350', type: 'national'   }],
  ['07-15', { name: 'Democracy Day (TR)',          emoji: '🇹🇷', color: '#EF5350', type: 'national'   }],
  ['08-30', { name: 'Victory Day (TR)',            emoji: '🇹🇷', color: '#EF5350', type: 'national'   }],
  ['10-29', { name: 'Republic Day (TR)',           emoji: '🇹🇷', color: '#EF5350', type: 'national'   }],

  // ── South Africa 🇿🇦 ─────────────────────────────────────────────
  ['03-21', { name: 'Human Rights Day (ZA)',      emoji: '✊', color: '#4CAF50', type: 'national'   }],
  ['04-27', { name: 'Freedom Day (ZA)',           emoji: '🇿🇦', color: '#4CAF50', type: 'national'   }],
  ['06-16', { name: 'Youth Day (ZA)',             emoji: '🇿🇦', color: '#FFD060', type: 'national'   }],
  ['08-09', { name: "National Women's Day (ZA)", emoji: '🇿🇦', color: '#E040FB', type: 'national'   }],
  ['09-24', { name: 'Heritage Day (ZA)',          emoji: '🇿🇦', color: '#FF9800', type: 'cultural'   }],
  ['12-16', { name: 'Day of Reconciliation (ZA)', emoji: '🇿🇦', color: '#4CAF50', type: 'national'   }],

  // ── Nigeria 🇳🇬 ──────────────────────────────────────────────────
  ['06-12', { name: 'Democracy Day (NG)',         emoji: '🇳🇬', color: '#4CAF50', type: 'national'   }],
  ['10-01', { name: 'Nigeria Independence Day',  emoji: '🇳🇬', color: '#4CAF50', type: 'national'   }],

  // ── Egypt 🇪🇬 ────────────────────────────────────────────────────
  ['01-07', { name: 'Coptic Christmas',           emoji: '✝️', color: '#FFD060', type: 'religious'  }],
  ['01-25', { name: 'Egypt Revolution Day',       emoji: '🇪🇬', color: '#EF5350', type: 'national'   }],
  ['04-25', { name: 'Sinai Liberation Day (EG)', emoji: '🇪🇬', color: '#EF5350', type: 'national'   }],
  ['06-30', { name: 'Egypt June 30 Revolution',  emoji: '🇪🇬', color: '#EF5350', type: 'national'   }],
  ['07-23', { name: 'Egypt July 23 Revolution',  emoji: '🇪🇬', color: '#EF5350', type: 'national'   }],
  ['10-06', { name: 'Armed Forces Day (EG)',      emoji: '🇪🇬', color: '#EF5350', type: 'national'   }],

  // ── Poland 🇵🇱 ───────────────────────────────────────────────────
  ['05-03', { name: 'Constitution Day (PL)',      emoji: '🇵🇱', color: '#EF5350', type: 'national'   }],
  ['11-11', { name: 'Poland Independence Day',   emoji: '🇵🇱', color: '#EF5350', type: 'national'   }],

  // ── Czech Republic 🇨🇿 ───────────────────────────────────────────
  ['05-08', { name: 'Victory Day (CZ)',           emoji: '🇨🇿', color: '#1565C0', type: 'national'   }],
  ['07-05', { name: 'Saints Cyril & Methodius (CZ)', emoji: '🇨🇿', color: '#1565C0', type: 'religious' }],
  ['07-06', { name: 'Jan Hus Day (CZ)',           emoji: '🇨🇿', color: '#1565C0', type: 'national'   }],
  ['09-28', { name: 'Czech Statehood Day',        emoji: '🇨🇿', color: '#1565C0', type: 'national'   }],
  ['10-28', { name: 'Czechoslovak State Day',     emoji: '🇨🇿', color: '#1565C0', type: 'national'   }],
  ['11-17', { name: 'Czech Freedom & Democracy Day', emoji: '🇨🇿', color: '#1565C0', type: 'national' }],

  // ── Norway 🇳🇴 ───────────────────────────────────────────────────
  ['05-17', { name: 'Norway Constitution Day',   emoji: '🇳🇴', color: '#EF5350', type: 'national'   }],

  // ── Sweden 🇸🇪 ───────────────────────────────────────────────────
  // 06-06 listed above (conflicts with Korea Memorial Day)

  // ── Netherlands 🇳🇱 ──────────────────────────────────────────────
  ['04-27', { name: "King's Day (NL)",            emoji: '🇳🇱', color: '#FF6F00', type: 'national'   }],
  ['05-05', { name: 'Liberation Day (NL)',        emoji: '🇳🇱', color: '#FF6F00', type: 'national'   }],

  // ── Argentina 🇦🇷 ────────────────────────────────────────────────
  ['03-24', { name: 'Day of Remembrance (AR)',    emoji: '🇦🇷', color: '#75AADB', type: 'national'   }],
  ['04-02', { name: 'Malvinas War Day (AR)',      emoji: '🇦🇷', color: '#75AADB', type: 'national'   }],
  ['05-25', { name: 'May Revolution (AR)',        emoji: '🇦🇷', color: '#75AADB', type: 'national'   }],
  ['06-20', { name: 'Belgrano Day (AR)',          emoji: '🇦🇷', color: '#75AADB', type: 'national'   }],
  ['07-09', { name: 'Argentina Independence Day', emoji: '🇦🇷', color: '#75AADB', type: 'national'   }],

  // ── Colombia 🇨🇴 ─────────────────────────────────────────────────
  ['07-20', { name: 'Colombia Independence Day', emoji: '🇨🇴', color: '#FFD060', type: 'national'   }],
  ['08-07', { name: 'Battle of Boyacá (CO)',      emoji: '🇨🇴', color: '#FFD060', type: 'national'   }],

  // ── Philippines 🇵🇭 ──────────────────────────────────────────────
  ['04-09', { name: 'Day of Valor (PH)',          emoji: '🇵🇭', color: '#1565C0', type: 'national'   }],
  ['06-12', { name: 'Philippines Independence Day', emoji: '🇵🇭', color: '#EF5350', type: 'national' }],
  ['08-21', { name: 'Ninoy Aquino Day (PH)',      emoji: '🇵🇭', color: '#FFD060', type: 'national'   }],
  ['11-30', { name: 'Bonifacio Day (PH)',         emoji: '🇵🇭', color: '#1565C0', type: 'national'   }],
  ['12-30', { name: 'Rizal Day (PH)',             emoji: '🇵🇭', color: '#1565C0', type: 'national'   }],

  // ── Thailand 🇹🇭 ─────────────────────────────────────────────────
  ['04-06', { name: 'Chakri Memorial Day (TH)',   emoji: '🇹🇭', color: '#EF5350', type: 'national'   }],
  ['04-13', { name: 'Songkran begins (TH)',       emoji: '💦', color: '#42A5F5', type: 'cultural'   }],
  ['04-14', { name: 'Songkran',                   emoji: '💦', color: '#42A5F5', type: 'cultural'   }],
  ['04-15', { name: 'Songkran',                   emoji: '💦', color: '#42A5F5', type: 'cultural'   }],
  ['05-04', { name: 'Coronation Day (TH)',        emoji: '👑', color: '#EF5350', type: 'national'   }],
  ['07-28', { name: "King's Birthday (TH)",       emoji: '🇹🇭', color: '#1565C0', type: 'national'   }],
  ['08-12', { name: "Queen Mother's Birthday (TH)", emoji: '🇹🇭', color: '#FF9800', type: 'national' }],
  ['10-13', { name: 'Navamindra Maharaj Day (TH)', emoji: '🇹🇭', color: '#1565C0', type: 'national' }],
  ['10-23', { name: 'Chulalongkorn Day (TH)',     emoji: '🇹🇭', color: '#1565C0', type: 'national'   }],
  ['12-05', { name: 'King Bhumibol Day (TH)',     emoji: '🇹🇭', color: '#1565C0', type: 'national'   }],
  ['12-10', { name: 'Constitution Day (TH)',      emoji: '🇹🇭', color: '#1565C0', type: 'national'   }],

  // ── Indonesia 🇮🇩 ────────────────────────────────────────────────
  ['06-01', { name: 'Pancasila Day (ID)',         emoji: '🇮🇩', color: '#EF5350', type: 'national'   }],
  ['08-17', { name: 'Indonesia Independence Day', emoji: '🇮🇩', color: '#EF5350', type: 'national'   }],

  // ── Pakistan 🇵🇰 ─────────────────────────────────────────────────
  ['02-05', { name: 'Kashmir Day (PK)',           emoji: '🇵🇰', color: '#4CAF50', type: 'national'   }],
  ['03-23', { name: 'Pakistan Day',               emoji: '🇵🇰', color: '#4CAF50', type: 'national'   }],
  ['08-14', { name: 'Pakistan Independence Day',  emoji: '🇵🇰', color: '#4CAF50', type: 'national'   }],
  ['09-06', { name: 'Defence Day (PK)',           emoji: '🇵🇰', color: '#4CAF50', type: 'national'   }],
  ['11-09', { name: 'Iqbal Day (PK)',             emoji: '🇵🇰', color: '#4CAF50', type: 'national'   }],

  // ── Greece 🇬🇷 ───────────────────────────────────────────────────
  ['03-25', { name: 'Greek Independence Day',     emoji: '🇬🇷', color: '#1565C0', type: 'national'   }],
  ['10-28', { name: 'Ohi Day (GR)',               emoji: '🇬🇷', color: '#1565C0', type: 'national'   }],

  // ── Portugal 🇵🇹 ─────────────────────────────────────────────────
  ['04-25', { name: 'Portugal Freedom Day',       emoji: '🇵🇹', color: '#EF5350', type: 'national'   }],
  ['06-10', { name: 'Portugal Day',               emoji: '🇵🇹', color: '#EF5350', type: 'national'   }],
  ['10-05', { name: 'Portugal Republic Day',      emoji: '🇵🇹', color: '#EF5350', type: 'national'   }],
  ['12-01', { name: 'Portugal Restoration Day',   emoji: '🇵🇹', color: '#EF5350', type: 'national'   }],

  // ── Vietnam 🇻🇳 ──────────────────────────────────────────────────
  ['04-30', { name: 'Reunification Day (VN)',     emoji: '🇻🇳', color: '#EF5350', type: 'national'   }],
  ['09-02', { name: 'Vietnam National Day',       emoji: '🇻🇳', color: '#EF5350', type: 'national'   }],
];

/* ─── Easter (Anonymous Gregorian algorithm) ──────────────── */
function easterDate(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100,
        d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3),
        h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451),
        mo = Math.floor((h + l - 7 * m + 114) / 31) - 1,
        dy = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, mo, dy);
}

/* ─── nth weekday helper ──────────────────────────────────── */
function nthWeekday(year: number, month: number, dow: number, n: number): Date {
  const d = new Date(year, month, 1);
  const first = (7 + dow - d.getDay()) % 7;
  return new Date(year, month, first + 1 + (n - 1) * 7);
}

/* ─── last weekday in month ───────────────────────────────── */
function lastWeekday(year: number, month: number, dow: number): Date {
  const last = new Date(year, month + 1, 0);
  const diff = (last.getDay() - dow + 7) % 7;
  return new Date(year, month, last.getDate() - diff);
}

/* ─── Ramadan start dates ───────────────────────────────────── */
const RAMADAN_START: Record<number, [number, number]> = {
  2024: [2,  11],
  2025: [1,  28],
  2026: [1,  17],
  2027: [1,   6],
  2028: [0,  26],
  2029: [0,  14],
  2030: [0,   4],
};

/* ─── Hanukkah start dates ──────────────────────────────────── */
const HANUKKAH_START: Record<number, [number, number]> = {
  2024: [11, 26],
  2025: [11, 14],
  2026: [11,  4],
  2027: [11, 24],
  2028: [11, 12],
  2029: [11,  1],
  2030: [11, 20],
};

/* ─── Diwali ────────────────────────────────────────────────── */
const DIWALI: Record<number, [number, number]> = {
  2024: [10, 1],
  2025: [9, 20],
  2026: [9,  8],
  2027: [9, 28],
  2028: [9, 16],
  2029: [9,  5],
  2030: [9, 25],
};

/* ─── Vietnam Tết (Lunar New Year) ─────────────────────────── */
const TET: Record<number, [number, number]> = {
  2024: [1, 10],
  2025: [0, 29],
  2026: [1, 17],
  2027: [1,  6],
  2028: [0, 26],
  2029: [1, 13],
  2030: [1,  3],
};

/* ─── Build holiday map for a year ─────────────────────────── */
function buildYearMap(year: number): Map<string, Holiday[]> {
  const map = new Map<string, Holiday[]>();

  const add = (date: Date, h: Holiday) => {
    const key = `${date.getMonth()}-${date.getDate()}`;
    const arr = map.get(key) ?? [];
    arr.push(h);
    map.set(key, arr);
  };

  // Fixed holidays — tuple array naturally handles duplicate dates
  for (const [mmdd, h] of FIXED) {
    const [mm, dd] = mmdd.split('-').map(Number);
    add(new Date(year, mm - 1, dd), h);
  }

  // Easter Sunday
  const easter = easterDate(year);
  add(easter, { name: 'Easter Sunday', emoji: '🐣', color: '#66BB6A', type: 'religious' });
  add(new Date(easter.getTime() - 2 * 86400000),  { name: 'Good Friday',   emoji: '✝️', color: '#78909C', type: 'religious' });
  add(new Date(easter.getTime() - 46 * 86400000), { name: 'Ash Wednesday', emoji: '✝️', color: '#78909C', type: 'religious' });
  add(new Date(easter.getTime() + 1 * 86400000),  { name: 'Easter Monday', emoji: '🐣', color: '#81C784', type: 'religious' });

  // ── Floating — US / CA / AU ──────────────────────────────────────
  add(nthWeekday(year, 4, 0, 2),  { name: "Mother's Day",       emoji: '💐', color: '#F48FB1', type: 'observance' });
  add(nthWeekday(year, 5, 0, 3),  { name: "Father's Day",       emoji: '👔', color: '#42A5F5', type: 'observance' });
  add(nthWeekday(year, 10, 4, 4), { name: 'Thanksgiving (US)',  emoji: '🦃', color: '#FF8F00', type: 'national'   });
  add(nthWeekday(year, 9, 1, 2),  { name: 'Thanksgiving (CA)',  emoji: '🍁', color: '#D32F2F', type: 'national'   });
  add(nthWeekday(year, 0, 1, 3),  { name: 'MLK Day (US)',       emoji: '✊', color: '#1565C0', type: 'national'   });
  add(nthWeekday(year, 8, 1, 1),  { name: 'Labor Day (US)',     emoji: '✊', color: '#FF5722', type: 'national'   });

  // Memorial Day US — last Monday in May
  const memDay = nthWeekday(year, 4, 1, 4);
  const memDay5 = nthWeekday(year, 4, 1, 5);
  add(memDay5.getMonth() === 4 ? memDay5 : memDay, { name: 'Memorial Day (US)', emoji: '🎖️', color: '#1565C0', type: 'national' });

  // ── Floating — Japan ─────────────────────────────────────────────
  add(nthWeekday(year, 0, 1, 2),  { name: 'Coming-of-Age Day (JP)',    emoji: '🎓', color: '#EF5350', type: 'national' });
  add(nthWeekday(year, 6, 1, 3),  { name: 'Marine Day (JP)',           emoji: '🌊', color: '#1565C0', type: 'national' });
  add(nthWeekday(year, 8, 1, 3),  { name: 'Respect for the Aged (JP)', emoji: '👴', color: '#FF9800', type: 'national' });
  add(nthWeekday(year, 9, 1, 2),  { name: 'Health & Sports Day (JP)',  emoji: '🏅', color: '#EF5350', type: 'national' });

  // ── Floating — New Zealand ───────────────────────────────────────
  add(nthWeekday(year, 5, 1, 1),  { name: "King's Birthday (NZ)",  emoji: '👑', color: '#1565C0', type: 'national' });
  add(nthWeekday(year, 9, 1, 4),  { name: 'Labour Day (NZ)',        emoji: '✊', color: '#1565C0', type: 'national' });

  // ── Floating — Philippines ───────────────────────────────────────
  add(lastWeekday(year, 7, 1),    { name: 'National Heroes Day (PH)', emoji: '🇵🇭', color: '#1565C0', type: 'national' });

  // ── Ramadan (all 30 days) ────────────────────────────────────────
  if (RAMADAN_START[year]) {
    const [rm, rd] = RAMADAN_START[year];
    for (let i = 0; i < 30; i++) {
      add(new Date(year, rm, rd + i), { name: i === 0 ? 'Ramadan begins' : 'Ramadan', emoji: '🌙', color: '#7986CB', type: 'islamic' });
    }
    add(new Date(year, rm, rd + 30), { name: 'Eid al-Fitr',  emoji: '🌙', color: '#5C6BC0', type: 'islamic' });
    add(new Date(year, rm, rd + 70), { name: 'Eid al-Adha',  emoji: '🌙', color: '#5C6BC0', type: 'islamic' });
  }

  // ── Hanukkah (8 nights) ──────────────────────────────────────────
  if (HANUKKAH_START[year]) {
    const [hm, hd] = HANUKKAH_START[year];
    for (let i = 0; i < 8; i++) {
      add(new Date(year, hm, hd + i), { name: i === 0 ? 'Hanukkah begins' : 'Hanukkah', emoji: '🕎', color: '#42A5F5', type: 'jewish' });
    }
  }

  // ── Diwali ───────────────────────────────────────────────────────
  if (DIWALI[year]) {
    const [dm, dd] = DIWALI[year];
    add(new Date(year, dm, dd), { name: 'Diwali', emoji: '🪔', color: '#FFB300', type: 'cultural' });
  }

  // ── Vietnam Tết ──────────────────────────────────────────────────
  if (TET[year]) {
    const [tm, td] = TET[year];
    add(new Date(year, tm, td),     { name: 'Tết (Vietnamese New Year)', emoji: '🏮', color: '#EF5350', type: 'cultural' });
    add(new Date(year, tm, td + 1), { name: 'Tết (Day 2)',               emoji: '🏮', color: '#EF5350', type: 'cultural' });
    add(new Date(year, tm, td + 2), { name: 'Tết (Day 3)',               emoji: '🏮', color: '#EF5350', type: 'cultural' });
  }

  return map;
}

/* ─── Cache ─────────────────────────────────────────────────── */
const cache = new Map<number, Map<string, Holiday[]>>();

export function getHolidaysForDate(date: Date): Holiday[] {
  const year = date.getFullYear();
  if (!cache.has(year)) cache.set(year, buildYearMap(year));
  const key = `${date.getMonth()}-${date.getDate()}`;
  return cache.get(year)!.get(key) ?? [];
}

export function getUpcomingHolidays(from: Date, count = 5): { date: Date; holiday: Holiday }[] {
  const year = from.getFullYear();
  const results: { date: Date; holiday: Holiday }[] = [];
  const seen = new Set<string>();

  for (let y = year; y <= year + 1 && results.length < count; y++) {
    if (!cache.has(y)) cache.set(y, buildYearMap(y));
    const ymap = cache.get(y)!;

    for (let m = 0; m < 12 && results.length < count; m++) {
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth && results.length < count; d++) {
        const date = new Date(y, m, d);
        if (date < from) continue;
        const holidays = ymap.get(`${m}-${d}`);
        if (holidays) {
          for (const h of holidays) {
            // Skip daily repetitions of multi-day events
            if (h.name === 'Ramadan' || h.name === 'Hanukkah' || h.name === 'Songkran' || h.name.startsWith('Tết (Day')) continue;
            const uid = `${y}-${m}-${d}-${h.name}`;
            if (!seen.has(uid)) {
              seen.add(uid);
              results.push({ date, holiday: h });
              if (results.length >= count) break;
            }
          }
        }
      }
    }
  }

  return results;
}
