import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { CalendarEntry, UUID, generateUUID } from '@vereinskalender/shared';
import { useLocalStorage } from '../hooks/useLocalStorage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
    fontSize: 14,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export function EventDetailScreen({ route, navigation }: any) {
  const { isNew, entryId } = route.params || {};
  const [entry, setEntry] = useState<Partial<CalendarEntry>>({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'event',
    groups: [],
  });
  const { getItem, setItem } = useLocalStorage();

  useEffect(() => {
    if (!isNew && entryId) {
      loadEntry(entryId);
    }
  }, [isNew, entryId]);

  const loadEntry = async (id: UUID) => {
    try {
      const data = await getItem('calendarData');
      const foundEntry = data?.entries?.find((e: CalendarEntry) => e.id === id);
      if (foundEntry) {
        setEntry(foundEntry);
      }
    } catch (error) {
      console.error('Failed to load entry:', error);
    }
  };

  const handleSave = async () => {
    if (!entry.title || !entry.startDate) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }

    try {
      const data = await getItem('calendarData');
      const calendarData = data || { entries: [], groups: [], rules: [], holidays: [], conflicts: [] };

      if (isNew) {
        const newEntry: CalendarEntry = {
          id: generateUUID() as UUID,
          title: entry.title || '',
          description: entry.description || '',
          startDate: entry.startDate || '',
          endDate: entry.endDate || entry.startDate || '',
          type: 'event',
          groups: entry.groups || [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: 'active',
        };
        calendarData.entries.push(newEntry);
      } else {
        const index = calendarData.entries.findIndex((e: CalendarEntry) => e.id === entryId);
        if (index >= 0) {
          calendarData.entries[index] = {
            ...calendarData.entries[index],
            ...entry,
            updatedAt: Date.now(),
          };
        }
      }

      await setItem('calendarData', calendarData);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Fehler', 'Ereignis konnte nicht gespeichert werden');
    }
  };

  const handleDelete = async () => {
    if (isNew) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Bestätigung',
      'Möchten Sie diesen Eintrag wirklich löschen?',
      [
        { text: 'Abbrechen', onPress: () => {} },
        {
          text: 'Löschen',
          onPress: async () => {
            try {
              const data = await getItem('calendarData');
              data.entries = data.entries.filter((e: CalendarEntry) => e.id !== entryId);
              await setItem('calendarData', data);
              navigation.goBack();
            } catch (error) {
              console.error('Failed to delete entry:', error);
              Alert.alert('Fehler', 'Ereignis konnte nicht gelöscht werden');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Titel</Text>
          <TextInput
            style={styles.input}
            placeholder="Ereignistitel"
            value={entry.title}
            onChangeText={(text) => setEntry({ ...entry, title: text })}
          />

          <Text style={styles.label}>Beschreibung</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Ereignisbeschreibung"
            value={entry.description}
            onChangeText={(text) => setEntry({ ...entry, description: text })}
            multiline
          />

          <Text style={styles.label}>Startdatum</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={entry.startDate}
            onChangeText={(text) => setEntry({ ...entry, startDate: text })}
          />

          <Text style={styles.label}>Enddatum</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={entry.endDate}
            onChangeText={(text) => setEntry({ ...entry, endDate: text })}
          />

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Speichern</Text>
            </TouchableOpacity>
            {!isNew && (
              <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleDelete}>
                <Text style={styles.buttonText}>Löschen</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
