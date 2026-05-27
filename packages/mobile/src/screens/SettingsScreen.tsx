import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';

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
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    padding: 12,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
});

export function SettingsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', onPress: () => {} },
        {
          text: 'Abmelden',
          onPress: () => Alert.alert('Erfolg', 'Sie wurden abgemeldet'),
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Cache löschen',
      'Alle lokalen Daten werden gelöscht. Fortfahren?',
      [
        { text: 'Abbrechen', onPress: () => {} },
        {
          text: 'Löschen',
          onPress: () => Alert.alert('Erfolg', 'Cache wurde gelöscht'),
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benachrichtigungen</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push-Benachrichtigungen</Text>
            <Switch value={notifications} onValueChange={setNotifications} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>E-Mail-Erinnerungen</Text>
            <Switch value={true} onValueChange={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offline & Synchronisierung</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Offline-Modus</Text>
            <Switch value={offlineMode} onValueChange={setOfflineMode} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Automatische Synchronisierung</Text>
            <Switch value={autoSync} onValueChange={setAutoSync} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datenschutz & Sicherheit</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Passwort ändern</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearCache}>
            <Text style={styles.buttonText}>Cache löschen</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konto</Text>
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Abmelden</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Über die App</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingLabel}>0.1.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
