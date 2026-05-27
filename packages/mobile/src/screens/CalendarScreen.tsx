import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CalendarEntry, Group, UUID } from '@vereinskalender/shared';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatDate, parseDate } from '@vereinskalender/shared';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    color: '#fff',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    padding: 8,
    fontSize: 18,
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventsList: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 13,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
});

export function CalendarScreen({ navigation }: any) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { getItem, setItem } = useLocalStorage();

  useEffect(() => {
    loadEntries();
  }, [currentDate]);

  const loadEntries = async () => {
    try {
      const data = await getItem('calendarData');
      if (data) {
        const allEntries = data.entries || [];
        const monthEntries = allEntries.filter((entry) => {
          const entryDate = parseDate(entry.startDate);
          return (
            entryDate.getMonth() === currentDate.getMonth() &&
            entryDate.getFullYear() === currentDate.getFullYear()
          );
        });
        setEntries(monthEntries);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadEntries();
    } finally {
      setRefreshing(false);
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = currentDate.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.monthNavigation}>
        <TouchableOpacity onPress={previousMonth}>
          <Text style={styles.navButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{monthName}</Text>
        <TouchableOpacity onPress={nextMonth}>
          <Text style={styles.navButton}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.eventsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Keine Ereignisse in diesem Monat</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={[styles.eventCard, { borderLeftColor: '#2196F3' }]}
              onPress={() =>
                navigation.navigate('EventDetail', { entryId: entry.id })
              }
            >
              <Text style={styles.eventTitle}>{entry.title}</Text>
              <Text style={styles.eventDate}>
                {new Date(entry.startDate).toLocaleDateString('de-DE')}
              </Text>
              {entry.description && (
                <Text style={styles.eventDescription}>{entry.description}</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('EventDetail', { isNew: true })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
