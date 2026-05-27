import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback } from 'react';

export function useLocalStorage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getItem = useCallback(async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const setItem = useCallback(async (key: string, value: any) => {
    try {
      setLoading(true);
      setError(null);
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      await AsyncStorage.removeItem(key);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await AsyncStorage.clear();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { getItem, setItem, removeItem, clear, loading, error };
}
