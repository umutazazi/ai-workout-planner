import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  description?: string;
  targetMuscles?: string[];
}

interface DayWorkout {
  day: number;
  name: string;
  focus: string;
  exercises: Exercise[];
  estimatedDuration: string;
}

interface Workout {
  id: string;
  daysPerWeek: number;
  goal: string;
  createdAt: string;
  exercises: DayWorkout[];
  totalWeeks?: number;
  progressionNotes?: string;
  macroGoals?: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
  nutritionTips?: string[];
}

const STORAGE_KEY = '@fitness_app_workouts';

export function useWorkoutStore() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load workouts from storage on mount
  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const storedWorkouts = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedWorkouts) {
        const parsedWorkouts = JSON.parse(storedWorkouts);
        setWorkouts(parsedWorkouts);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWorkouts = async (newWorkouts: Workout[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newWorkouts));
    } catch (error) {
      console.error('Error saving workouts:', error);
    }
  };

  const addWorkout = async (workout: Workout) => {
    // Ensure unique ID
    const newWorkout = {
      ...workout,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    const updatedWorkouts = [newWorkout, ...workouts];
    setWorkouts(updatedWorkouts);
    await saveWorkouts(updatedWorkouts);

    console.log('Workout added successfully:', newWorkout.id);
    return newWorkout;
  };

  const removeWorkout = async (id: string) => {
    const updatedWorkouts = workouts.filter((w) => w.id !== id);
    setWorkouts(updatedWorkouts);
    await saveWorkouts(updatedWorkouts);
  };

  const clearWorkouts = async () => {
    setWorkouts([]);
    await saveWorkouts([]);
  };

  const getWorkoutById = (id: string) => {
    return workouts.find((w) => w.id === id);
  };

  return {
    workouts,
    isLoading,
    addWorkout,
    removeWorkout,
    clearWorkouts,
    getWorkoutById,
    refreshWorkouts: loadWorkouts,
  };
}
