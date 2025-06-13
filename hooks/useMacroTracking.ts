import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyMacros {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  date: string; // ISO date string for the day
}

export interface MacroGoals {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

const MACRO_STORAGE_KEY = '@fitness_app_daily_macros';

// Get today's date in YYYY-MM-DD format
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

export function useMacroTracking() {
  const [dailyMacros, setDailyMacros] = useState<DailyMacros>({
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
    date: getTodayString(),
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load daily macros from storage on mount
  useEffect(() => {
    loadDailyMacros();
  }, []);

  // Check if we need to reset macros for a new day
  useEffect(() => {
    const today = getTodayString();
    if (dailyMacros.date !== today) {
      resetDailyMacros();
    }
  }, [dailyMacros.date]);

  const loadDailyMacros = async () => {
    try {
      const storedMacros = await AsyncStorage.getItem(MACRO_STORAGE_KEY);
      if (storedMacros) {
        const parsedMacros: DailyMacros = JSON.parse(storedMacros);
        const today = getTodayString();

        // If the stored data is from today, use it
        if (parsedMacros.date === today) {
          setDailyMacros(parsedMacros);
        } else {
          // If it's from a previous day, reset to zero for today
          const newMacros: DailyMacros = {
            protein: 0,
            carbs: 0,
            fats: 0,
            calories: 0,
            date: today,
          };
          setDailyMacros(newMacros);
          await saveDailyMacros(newMacros);
        }
      } else {
        // No stored data, create new for today
        const newMacros: DailyMacros = {
          protein: 0,
          carbs: 0,
          fats: 0,
          calories: 0,
          date: getTodayString(),
        };
        setDailyMacros(newMacros);
      }
    } catch (error) {
      console.error('Error loading daily macros:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDailyMacros = async (macros: DailyMacros) => {
    try {
      await AsyncStorage.setItem(MACRO_STORAGE_KEY, JSON.stringify(macros));
    } catch (error) {
      console.error('Error saving daily macros:', error);
    }
  };

  const updateMacros = async (
    macroType: keyof Omit<DailyMacros, 'date'>,
    amount: number
  ) => {
    const today = getTodayString();
    const updatedMacros: DailyMacros = {
      ...dailyMacros,
      [macroType]: Math.max(0, dailyMacros[macroType] + amount),
      date: today,
    };

    setDailyMacros(updatedMacros);
    await saveDailyMacros(updatedMacros);
  };

  const addProtein = (grams: number) => updateMacros('protein', grams);
  const addCarbs = (grams: number) => updateMacros('carbs', grams);
  const addFats = (grams: number) => updateMacros('fats', grams);
  const addCalories = (calories: number) => updateMacros('calories', calories);

  const addMacros = async (macros: {
    protein?: number;
    carbs?: number;
    fats?: number;
    calories?: number;
  }) => {
    const today = getTodayString();
    const updatedMacros: DailyMacros = {
      protein: Math.max(0, dailyMacros.protein + (macros.protein || 0)),
      carbs: Math.max(0, dailyMacros.carbs + (macros.carbs || 0)),
      fats: Math.max(0, dailyMacros.fats + (macros.fats || 0)),
      calories: Math.max(0, dailyMacros.calories + (macros.calories || 0)),
      date: today,
    };

    setDailyMacros(updatedMacros);
    await saveDailyMacros(updatedMacros);
  };

  const resetDailyMacros = async () => {
    const today = getTodayString();
    const resetMacros: DailyMacros = {
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0,
      date: today,
    };

    setDailyMacros(resetMacros);
    await saveDailyMacros(resetMacros);
  };

  const setCustomMacros = async (macros: Omit<DailyMacros, 'date'>) => {
    const today = getTodayString();
    const customMacros: DailyMacros = {
      ...macros,
      date: today,
    };

    setDailyMacros(customMacros);
    await saveDailyMacros(customMacros);
  };

  return {
    dailyMacros,
    isLoading,
    addProtein,
    addCarbs,
    addFats,
    addCalories,
    addMacros,
    resetDailyMacros,
    setCustomMacros,
    refreshMacros: loadDailyMacros,
  };
}
