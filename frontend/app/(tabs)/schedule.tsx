import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import * as scheduleService from '../../src/services/scheduleService';
import type { Schedule } from '../../src/types/models';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const CALENDAR_ROWS = 6;
const DEFAULT_COLOR = '#4A90D9';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateStr: string;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sf = `${s.getMonth() + 1}/${s.getDate()}`;
  const ef = `${e.getMonth() + 1}/${e.getDate()}`;
  return sf === ef ? sf : `${sf} ~ ${ef}`;
}

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date();
  const todayStr = toDateStr(today);
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startDow);

  const days: CalendarDay[] = [];
  for (let i = 0; i < CALENDAR_ROWS * 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = toDateStr(d);
    days.push({
      date: d,
      isCurrentMonth: d.getMonth() === month,
      isToday: dateStr === todayStr,
      dateStr,
    });
  }
  return days;
}

function schedulesForDate(schedules: Schedule[], dateStr: string): Schedule[] {
  return schedules.filter((s) => {
    const start = s.startDate.slice(0, 10);
    const end = s.endDate.slice(0, 10);
    return dateStr >= start && dateStr <= end;
  });
}

function dotColorsForDate(schedules: Schedule[], dateStr: string): string[] {
  const matched = schedulesForDate(schedules, dateStr);
  const userColors = new Map<number, string>();
  matched.forEach((s) => {
    if (!userColors.has(s.userId)) {
      userColors.set(s.userId, s.user.calendarColor ?? DEFAULT_COLOR);
    }
  });
  return [...userColors.values()].slice(0, 4);
}

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateStr(now));
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const calendarDays = buildCalendarDays(year, month);
  const selectedSchedules = schedulesForDate(schedules, selectedDate);
  const monthLabel = `${year}년 ${month + 1}월`;

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await scheduleService.getSchedulesByMonth(year, month + 1);
      setSchedules(res.data.data);
    } catch {
      setSchedules([]);
    }
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [fetchSchedules]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSchedules();
    setRefreshing(false);
  }, [fetchSchedules]);

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  const openCreateModal = () => {
    setEditingSchedule(null);
    setTitle('');
    setMemo('');
    setStartDate(selectedDate);
    setEndDate(selectedDate);
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setTitle(schedule.title);
    setMemo(schedule.memo ?? '');
    setStartDate(schedule.startDate.slice(0, 10));
    setEndDate(schedule.endDate.slice(0, 10));
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setEditingSchedule(null);
    });
  };

  const validateDate = (d: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(d);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('알림', '일정 제목을 입력해주세요.');
      return;
    }
    if (!validateDate(startDate) || !validateDate(endDate)) {
      Alert.alert('알림', '날짜 형식을 확인해주세요. (YYYY-MM-DD)');
      return;
    }
    if (startDate > endDate) {
      Alert.alert('알림', '종료일이 시작일보다 앞설 수 없습니다.');
      return;
    }

    try {
      if (editingSchedule) {
        await scheduleService.updateSchedule(editingSchedule.id, {
          title: title.trim(),
          startDate,
          endDate,
          memo: memo.trim() || undefined,
        });
      } else {
        await scheduleService.createSchedule({
          title: title.trim(),
          startDate,
          endDate,
          memo: memo.trim() || undefined,
        });
      }
      closeModal();
      fetchSchedules();
    } catch {
      Alert.alert('오류', '일정 저장에 실패했습니다.');
    }
  };

  const handleDelete = (schedule: Schedule) => {
    Alert.alert('일정 삭제', `"${schedule.title}" 일정을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await scheduleService.deleteSchedule(schedule.id);
            fetchSchedules();
          } catch {
            Alert.alert('오류', '일정 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const renderDayHeader = () => (
    <View style={styles.dayHeaderRow}>
      {DAY_LABELS.map((label, i) => (
        <View key={label} style={styles.dayHeaderCell}>
          <Text style={[
            styles.dayHeaderText,
            i === 0 && styles.sundayText,
            i === 6 && styles.saturdayText,
          ]}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderCalendarGrid = () => {
    const rows: CalendarDay[][] = [];
    for (let r = 0; r < CALENDAR_ROWS; r++) {
      rows.push(calendarDays.slice(r * 7, r * 7 + 7));
    }

    return (
      <View style={styles.calendarGrid}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.calendarRow}>
            {row.map((day) => {
              const isSelected = day.dateStr === selectedDate;
              const dow = day.date.getDay();
              const dots = dotColorsForDate(schedules, day.dateStr);

              return (
                <TouchableOpacity
                  key={day.dateStr}
                  style={styles.calendarCell}
                  activeOpacity={0.6}
                  onPress={() => setSelectedDate(day.dateStr)}
                >
                  <View style={[
                    styles.dateCircle,
                    day.isToday && styles.todayCircle,
                    isSelected && styles.selectedCircle,
                  ]}>
                    <Text style={[
                      styles.dateText,
                      !day.isCurrentMonth && styles.otherMonthText,
                      dow === 0 && day.isCurrentMonth && styles.sundayText,
                      dow === 6 && day.isCurrentMonth && styles.saturdayText,
                      day.isToday && styles.todayText,
                      isSelected && styles.selectedText,
                    ]}>
                      {day.date.getDate()}
                    </Text>
                  </View>
                  <View style={styles.dotRow}>
                    {dots.map((c, i) => (
                      <View key={i} style={[styles.dot, { backgroundColor: c }]} />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderScheduleItem = ({ item }: { item: Schedule }) => {
    const isOwner = user?.id === item.userId;
    const isAdmin = user?.role === 'ADMIN';

    return (
      <TouchableOpacity
        style={styles.scheduleItem}
        activeOpacity={0.7}
        onPress={() => isOwner ? openEditModal(item) : undefined}
        onLongPress={() => (isOwner || isAdmin) ? handleDelete(item) : undefined}
      >
        <View style={[styles.colorBar, { backgroundColor: item.user.calendarColor ?? DEFAULT_COLOR }]} />
        <View style={styles.scheduleContent}>
          <Text style={styles.scheduleTitle}>{item.title}</Text>
          <Text style={styles.scheduleDate}>{formatRange(item.startDate, item.endDate)}</Text>
          {item.memo ? <Text style={styles.scheduleMemo} numberOfLines={2}>{item.memo}</Text> : null}
          <Text style={styles.scheduleAuthor}>{item.user.nickname}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const selectedDateLabel = (() => {
    const d = new Date(selectedDate + 'T00:00:00');
    const dow = DAY_LABELS[d.getDay()];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`;
  })();

  const listHeader = (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={goToPrevMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={goToNextMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      {renderDayHeader()}
      {renderCalendarGrid()}
      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateLabel}>{selectedDateLabel}</Text>
        <Text style={styles.scheduleCount}>
          {selectedSchedules.length > 0 ? `${selectedSchedules.length}건` : '일정 없음'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={selectedSchedules}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderScheduleItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>이 날에 일정이 없습니다</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={openCreateModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeModal} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeModal}>
                  <Text style={styles.modalCancel}>취소</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {editingSchedule ? '일정 수정' : '일정 추가'}
                </Text>
                <TouchableOpacity onPress={handleSave}>
                  <Text style={styles.modalSave}>저장</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>제목</Text>
                <TextInput
                  style={styles.formInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="일정 제목"
                  placeholderTextColor="#bbb"
                  maxLength={50}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>시작일</Text>
                  <TextInput
                    style={styles.formInput}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#bbb"
                    maxLength={10}
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>종료일</Text>
                  <TextInput
                    style={styles.formInput}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#bbb"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>메모</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  value={memo}
                  onChangeText={setMemo}
                  placeholder="간단한 설명 (선택)"
                  placeholderTextColor="#bbb"
                  multiline
                  maxLength={200}
                />
              </View>

            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  sundayText: {
    color: '#E74C3C',
  },
  saturdayText: {
    color: '#4A90D9',
  },
  calendarGrid: {
    paddingHorizontal: 4,
  },
  calendarRow: {
    flexDirection: 'row',
  },
  calendarCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 48,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: '#f0f0f0',
  },
  selectedCircle: {
    backgroundColor: '#1a1a1a',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  otherMonthText: {
    color: '#d0d0d0',
  },
  todayText: {
    fontWeight: '700',
    color: '#333',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  selectedDateLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scheduleCount: {
    fontSize: 13,
    color: '#999',
  },
  listContent: {
    paddingBottom: 100,
  },
  scheduleItem: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    overflow: 'hidden',
  },
  colorBar: {
    width: 4,
  },
  scheduleContent: {
    flex: 1,
    padding: 12,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  scheduleDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  scheduleMemo: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
    lineHeight: 18,
  },
  scheduleAuthor: {
    fontSize: 12,
    color: '#aaa',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#bbb',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 16,
  },
  modalCancel: {
    fontSize: 15,
    color: '#999',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalSave: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A90D9',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  formTextarea: {
    height: 72,
    textAlignVertical: 'top',
  },
});
