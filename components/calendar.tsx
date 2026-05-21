import { EventItem, Gift } from '@/types/firebase';
import { C, glass, glassStrong, R, S, shadow, spring, T } from '@/constants/design';
import { getHolidaysForDate, getUpcomingHolidays, Holiday } from '@/constants/holidays';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface CalendarProps {
  events: EventItem[];
  gifts: Gift[];
  onEventPress: (event: EventItem) => void;
  onDatePress: (date: Date) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CELL_H = 38;

export default function Calendar({ events, gifts, onEventPress, onDatePress }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const calendarScale = useSharedValue(1);
  const monthOpacity = useSharedValue(1);
  const monthX = useSharedValue(0);

  const toDate = (d: any): Date | null => {
    if (!d) return null;
    if (d?.toDate) return d.toDate();
    if (d instanceof Date) return d;
    return new Date(d);
  };

  const getGridRows = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  };

  const getEventsForDate = (date: Date) =>
    events.filter(ev => {
      const d = toDate(ev.expirationDate);
      return d && d.toDateString() === date.toDateString();
    });

  const formatCountdown = (ev: EventItem) => {
    const d = toDate(ev.expirationDate);
    if (!d) return '';
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d ago`;
    if (diff === 0) return 'Today!';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };

  const formatHolidayCountdown = (date: Date) => {
    const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d ago`;
    if (diff === 0) return 'Today!';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };

  const navigateMonth = (dir: 'prev' | 'next') => {
    const sign = dir === 'next' ? -1 : 1;
    monthOpacity.value = withTiming(0, { duration: 150 });
    monthX.value = withTiming(sign * 24, { duration: 150 });
    setTimeout(() => {
      setCurrentDate(prev => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
        return d;
      });
      monthX.value = -sign * 24;
      monthOpacity.value = withTiming(1, { duration: 200 });
      monthX.value = withSpring(0, spring.snappy);
    }, 160);
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    calendarScale.value = withSequence(
      withTiming(0.97, { duration: 80 }),
      withSpring(1, spring.bouncy),
    );
    onDatePress(date);
  };

  const calStyle = useAnimatedStyle(() => ({
    transform: [{ scale: calendarScale.value }],
  }));

  const monthStyle = useAnimatedStyle(() => ({
    opacity: monthOpacity.value,
    transform: [{ translateX: monthX.value }],
  }));

  const upcomingEvents = events
    .filter(ev => { const d = toDate(ev.expirationDate); return d && d >= new Date(); })
    .sort((a, b) => (toDate(a.expirationDate)?.getTime() ?? 0) - (toDate(b.expirationDate)?.getTime() ?? 0))
    .slice(0, 3);

  const upcomingHolidays = getUpcomingHolidays(new Date(), 5);

  // Merge and sort upcoming events + holidays by date, cap at 6
  const upcomingMixed: { date: Date; label: string; sub: string; isHoliday: boolean; color?: string; emoji?: string }[] = [
    ...upcomingEvents.map(ev => ({
      date: toDate(ev.expirationDate) as Date,
      label: ev.name,
      sub: formatCountdown(ev),
      isHoliday: false,
    })),
    ...upcomingHolidays.map(({ date, holiday }) => ({
      date,
      label: holiday.name,
      sub: formatHolidayCountdown(date),
      isHoliday: true,
      color: holiday.color,
      emoji: holiday.emoji,
    })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);

  const rows = getGridRows(currentDate);
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Animated.View style={[styles.container, calStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigateMonth('prev')}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <Animated.Text style={[styles.monthYear, monthStyle]}>{monthLabel}</Animated.Text>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigateMonth('next')}>
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day name headers */}
      <Animated.View style={styles.dayNamesRow} entering={FadeIn.duration(400)}>
        {DAY_NAMES.map(d => (
          <Text key={d} style={styles.dayName}>{d}</Text>
        ))}
      </Animated.View>

      {/* Grid rows */}
      <Animated.View entering={FadeIn.duration(400).delay(100)}>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.gridRow}>
            {row.map((date, ci) => {
              if (!date) {
                return <View key={`e-${ri}-${ci}`} style={styles.cell} />;
              }
              const dayEvents = getEventsForDate(date);
              const holidays = getHolidaysForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const hasEvents = dayEvents.length > 0;
              const hasHolidays = holidays.length > 0;
              // Pick the first holiday's color for the indicator dot
              const holidayColor = holidays[0]?.color ?? '#FFD060';

              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[
                    styles.cell,
                    styles.dayCell,
                    isToday && styles.todayCell,
                    isSelected && !isToday && styles.selectedCell,
                    hasEvents && !isToday && !isSelected && styles.hasEventsCell,
                  ]}
                  onPress={() => handleDatePress(date)}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    styles.dayNum,
                    isToday && styles.todayNum,
                    isSelected && !isToday && styles.selectedNum,
                    hasHolidays && !isToday && !isSelected && styles.holidayNum,
                  ]}>
                    {date.getDate()}
                  </Text>
                  {(hasEvents || hasHolidays) && (
                    <View style={styles.dotsRow}>
                      {hasEvents && dayEvents.slice(0, 2).map((_, i) => (
                        <View key={`ev-${i}`} style={[styles.dot, isToday && styles.dotLight]} />
                      ))}
                      {hasHolidays && (
                        <View
                          style={[
                            styles.dot,
                            styles.holidayDot,
                            { backgroundColor: isToday ? 'rgba(255,255,255,0.9)' : holidayColor },
                          ]}
                        />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </Animated.View>

      {/* Selected date detail panel */}
      {selectedDate && (() => {
        const selHolidays = getHolidaysForDate(selectedDate);
        const selEvents = getEventsForDate(selectedDate);
        if (selHolidays.length === 0 && selEvents.length === 0) return null;
        const dateLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        return (
          <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(150)} style={styles.dayPanel}>
            <Text style={styles.dayPanelTitle}>{dateLabel}</Text>
            {selHolidays.map((h, i) => (
              <View key={`h-${i}`} style={[styles.dayPanelRow, { backgroundColor: h.color + '18' }]}>
                <View style={[styles.dayPanelIcon, { backgroundColor: h.color + '30' }]}>
                  <Text style={{ fontSize: 16 }}>{h.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dayPanelName, { color: h.color }]}>{h.name}</Text>
                  <Text style={styles.dayPanelSub}>{h.type}</Text>
                </View>
              </View>
            ))}
            {selEvents.map((ev) => (
              <TouchableOpacity key={ev.id} style={styles.dayPanelRow} onPress={() => onEventPress(ev)} activeOpacity={0.75}>
                <View style={[styles.dayPanelIcon, { backgroundColor: C.roseDim }]}>
                  <Text style={{ fontSize: 16 }}>🎯</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayPanelName}>{ev.name}</Text>
                  <Text style={styles.dayPanelSub}>{formatCountdown(ev)}</Text>
                </View>
                <Text style={styles.eventRowArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        );
      })()}

      {/* Upcoming */}
      <Animated.View style={styles.upcomingSection} entering={FadeIn.duration(400).delay(200)}>
        <Text style={styles.upcomingTitle}>Upcoming ({upcomingMixed.length})</Text>
        {upcomingMixed.length === 0 ? (
          <Text style={styles.noUpcoming}>Nothing upcoming</Text>
        ) : (
          upcomingMixed.map((item, idx) => (
            <TouchableOpacity
              key={`mixed-${idx}`}
              style={styles.eventRow}
              onPress={() => {
                if (!item.isHoliday) {
                  const ev = upcomingEvents.find(e => toDate(e.expirationDate)?.getTime() === item.date.getTime());
                  if (ev) onEventPress(ev);
                }
              }}
              activeOpacity={item.isHoliday ? 1 : 0.75}
            >
              {item.isHoliday ? (
                <View style={[styles.holidayBadge, { backgroundColor: (item.color ?? '#FFD060') + '22' }]}>
                  <Text style={styles.holidayEmoji}>{item.emoji}</Text>
                </View>
              ) : (
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>🎯</Text>
                </View>
              )}
              <View style={styles.eventRowLeft}>
                <Text style={styles.eventRowName} numberOfLines={1}>{item.label}</Text>
                <Text style={[styles.eventRowCountdown, item.isHoliday && { color: item.color ?? C.rose }]}>
                  {item.sub}
                </Text>
              </View>
              {!item.isHoliday && <Text style={styles.eventRowArrow}>›</Text>}
            </TouchableOpacity>
          ))
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: R.xl,
    padding: S.sm,
    marginHorizontal: 0,
    maxWidth: 480,
    alignSelf: 'stretch',
    ...glass,
    ...shadow.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: S.xs,
  },
  navBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.roseDim,
    alignItems: 'center', justifyContent: 'center',
  },
  navText: { fontSize: 20, color: C.rose, fontWeight: 'bold', lineHeight: 24 },
  monthYear: { ...T.small, color: C.rose, fontWeight: '700', flex: 1, textAlign: 'center' },

  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: C.t3,
    fontWeight: '600',
  },

  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    height: CELL_H,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
    borderRadius: R.sm,
  },
  dayCell: {},
  todayCell: {
    backgroundColor: C.rose,
    ...shadow.glow,
  },
  selectedCell: {
    backgroundColor: C.roseDim,
    borderWidth: 1,
    borderColor: C.rose,
  },
  hasEventsCell: {
    backgroundColor: C.surface2,
  },
  dayNum: {
    fontSize: 12,
    color: C.t1,
    fontWeight: '500',
  },
  todayNum: {
    color: C.white,
    fontWeight: '700',
  },
  selectedNum: {
    color: C.rose,
    fontWeight: '700',
  },
  holidayNum: {
    color: '#FFD060',
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 1,
  },
  dot: {
    width: 3, height: 3, borderRadius: 2,
    backgroundColor: C.rose,
  },
  dotLight: { backgroundColor: 'rgba(255,255,255,0.8)' },
  holidayDot: {
    width: 4, height: 4,
  },

  dayPanel: {
    marginTop: S.sm,
    borderRadius: R.lg,
    padding: S.sm,
    ...glassStrong,
  },
  dayPanelTitle: { fontSize: 11, color: C.t3, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayPanelRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    borderRadius: R.md, padding: 8, marginBottom: 4,
    backgroundColor: C.surface3,
  },
  dayPanelIcon: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  dayPanelName: { fontSize: 13, color: C.t1, fontWeight: '600' },
  dayPanelSub: { fontSize: 10, color: C.t3, marginTop: 1, textTransform: 'capitalize' },

  upcomingSection: {
    marginTop: S.sm,
    borderRadius: R.lg,
    padding: S.sm,
    ...glassStrong,
  },
  upcomingTitle: { fontSize: 11, color: C.rose, fontWeight: '700', marginBottom: 4 },
  noUpcoming: { ...T.small, color: C.t3, textAlign: 'center', paddingVertical: S.sm },
  eventRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface3, borderRadius: R.md,
    paddingHorizontal: S.sm, paddingVertical: 6,
    marginTop: 4, gap: S.xs,
  },
  holidayBadge: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  holidayEmoji: { fontSize: 14 },
  eventBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.roseDim,
    alignItems: 'center', justifyContent: 'center',
  },
  eventBadgeText: { fontSize: 12 },
  eventRowLeft: { flex: 1 },
  eventRowName: { fontSize: 12, color: C.t1, fontWeight: '500' },
  eventRowCountdown: { fontSize: 10, color: C.rose, marginTop: 1 },
  eventRowArrow: { fontSize: 16, color: C.t3 },
});
