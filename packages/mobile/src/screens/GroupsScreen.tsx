import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Group } from '@vereinskalender/shared';
import { useLocalStorage } from '../hooks/useLocalStorage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
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
});

export function GroupsScreen({ navigation }: any) {
  const [groups, setGroups] = useState<Group[]>([]);
  const { getItem } = useLocalStorage();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await getItem('calendarData');
      setGroups(data?.groups || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const renderGroupCard = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={[styles.groupCard, { borderLeftColor: item.color }]}
      onPress={() => Alert.alert(item.name, item.description)}
    >
      <Text style={styles.groupName}>{item.name}</Text>
      <Text style={styles.groupDescription}>{item.description}</Text>
      <Text style={styles.memberCount}>{item.members.length} Mitglieder</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Keine Gruppen vorhanden</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.id}
          scrollEnabled
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Neue Gruppe', 'Funktion kommt bald')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
