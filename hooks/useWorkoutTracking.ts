import { useState, useEffect } from 'react';

export interface ExerciseLog {
  exerciseName: string;
  sets: SetLog[];
  notes?: string;
  completed: boolean;
}

export interface SetLog {
  id: string;
  reps: number;
  weight?: number;
  duration?: number; // for time-based exercises
  completed: boolean;
  restTime?: number;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  startTime: string;
  endTime?: string;
  exercises: ExerciseLog[];
  totalDuration?: number;
  notes?: string;
  completed: boolean;
}

export interface PersonalRecord {
  exerciseName: string;
  type: 'weight' | 'reps' | 'duration';
  value: number;
  date: string;
  workoutSessionId: string;
}

// In-memory store for workout sessions
let workoutSessions: WorkoutSession[] = [];
let personalRecords: PersonalRecord[] = [];
let currentActiveSession: WorkoutSession | null = null; // Global session state
let manualExercises: ExerciseLog[] = []; // Manual exercises added by user

export function useWorkoutTracking() {
  const [sessions, setSessions] = useState<WorkoutSession[]>(workoutSessions);
  const [records, setRecords] = useState<PersonalRecord[]>(personalRecords);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(
    currentActiveSession
  );
  const [recentManualExercises, setRecentManualExercises] =
    useState<ExerciseLog[]>(manualExercises);

  // Sync with global session state only when it changes
  useEffect(() => {
    if (activeSession !== currentActiveSession) {
      setActiveSession(currentActiveSession);
    }
  }, [currentActiveSession]);

  // Start a new workout session
  const startWorkoutSession = (
    workoutId: string,
    workoutName: string,
    exercises: any[]
  ) => {
    // Validate inputs
    if (!workoutId || !workoutName || !exercises || exercises.length === 0) {
      throw new Error('Invalid workout data provided');
    }

    // End any existing session
    if (currentActiveSession) {
      currentActiveSession = null;
    }

    const newSession: WorkoutSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workoutId,
      workoutName,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toISOString(),
      exercises: exercises.map((exercise, exerciseIndex) => ({
        exerciseName: exercise.name,
        sets: Array.from({ length: exercise.sets || 3 }, (_, setIndex) => ({
          id: `set-${Date.now()}-${exerciseIndex}-${setIndex}-${Math.random()
            .toString(36)
            .substr(2, 4)}`,
          reps: 0,
          weight: 0,
          completed: false,
        })),
        notes: '',
        completed: false,
      })),
      completed: false,
    };

    // Update both local and global state
    currentActiveSession = newSession;
    setActiveSession(newSession);

    return newSession;
  };

  // Get active session
  const getActiveSession = () => {
    return currentActiveSession;
  };

  // Check if there's an active session
  const hasActiveSession = () => {
    return currentActiveSession !== null;
  };

  // Update a set in the active session
  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    updates: Partial<SetLog>
  ) => {
    if (!currentActiveSession) {
      return;
    }

    const updatedSession = { ...currentActiveSession };

    // Validate indices
    if (
      exerciseIndex >= updatedSession.exercises.length ||
      setIndex >= updatedSession.exercises[exerciseIndex].sets.length
    ) {
      return;
    }

    updatedSession.exercises[exerciseIndex].sets[setIndex] = {
      ...updatedSession.exercises[exerciseIndex].sets[setIndex],
      ...updates,
    };

    // Check if exercise is completed
    const exercise = updatedSession.exercises[exerciseIndex];
    exercise.completed = exercise.sets.every((set) => set.completed);

    // Update both global and local state
    currentActiveSession = updatedSession;
    setActiveSession(updatedSession);
  };

  // Add exercise notes
  const updateExerciseNotes = (exerciseIndex: number, notes: string) => {
    if (!currentActiveSession) {
      return;
    }

    const updatedSession = { ...currentActiveSession };

    if (exerciseIndex >= updatedSession.exercises.length) {
      return;
    }

    updatedSession.exercises[exerciseIndex].notes = notes;

    // Update both global and local state
    currentActiveSession = updatedSession;
    setActiveSession(updatedSession);
  };

  // Complete workout session
  const completeWorkoutSession = (sessionNotes?: string) => {
    if (!currentActiveSession) {
      return;
    }

    const completedSession: WorkoutSession = {
      ...currentActiveSession,
      endTime: new Date().toISOString(),
      totalDuration: Math.round(
        (Date.now() - new Date(currentActiveSession.startTime).getTime()) /
          1000 /
          60
      ),
      notes: sessionNotes,
      completed: true,
    };

    // Check for personal records
    checkPersonalRecords(completedSession);

    // Save session
    workoutSessions = [completedSession, ...workoutSessions];
    setSessions([...workoutSessions]);

    // Clear active session
    currentActiveSession = null;
    setActiveSession(null);

    return completedSession;
  };

  // Cancel active session
  const cancelWorkoutSession = () => {
    currentActiveSession = null;
    setActiveSession(null);
  };

  // Check for personal records
  const checkPersonalRecords = (session: WorkoutSession) => {
    const newRecords: PersonalRecord[] = [];

    session.exercises.forEach((exercise) => {
      if (!exercise.completed) return;

      // Check weight PR
      const maxWeight = Math.max(
        ...exercise.sets
          .filter((set) => set.completed && set.weight)
          .map((set) => set.weight || 0)
      );
      if (maxWeight > 0) {
        const existingWeightRecord = personalRecords.find(
          (record) =>
            record.exerciseName === exercise.exerciseName &&
            record.type === 'weight'
        );

        if (!existingWeightRecord || maxWeight > existingWeightRecord.value) {
          newRecords.push({
            exerciseName: exercise.exerciseName,
            type: 'weight',
            value: maxWeight,
            date: session.date,
            workoutSessionId: session.id,
          });
        }
      }

      // Check reps PR
      const maxReps = Math.max(
        ...exercise.sets.filter((set) => set.completed).map((set) => set.reps)
      );
      if (maxReps > 0) {
        const existingRepsRecord = personalRecords.find(
          (record) =>
            record.exerciseName === exercise.exerciseName &&
            record.type === 'reps'
        );

        if (!existingRepsRecord || maxReps > existingRepsRecord.value) {
          newRecords.push({
            exerciseName: exercise.exerciseName,
            type: 'reps',
            value: maxReps,
            date: session.date,
            workoutSessionId: session.id,
          });
        }
      }
    });

    if (newRecords.length > 0) {
      // Update existing records or add new ones
      newRecords.forEach((newRecord) => {
        const existingIndex = personalRecords.findIndex(
          (record) =>
            record.exerciseName === newRecord.exerciseName &&
            record.type === newRecord.type
        );

        if (existingIndex >= 0) {
          personalRecords[existingIndex] = newRecord;
        } else {
          personalRecords.push(newRecord);
        }
      });

      setRecords([...personalRecords]);
    }
  };

  // Get workout history for a specific workout
  const getWorkoutHistory = (workoutId: string) => {
    return workoutSessions.filter((session) => session.workoutId === workoutId);
  };

  // Get exercise progress over time
  const getExerciseProgress = (exerciseName: string) => {
    const exerciseData = workoutSessions
      .filter((session) => session.completed)
      .map((session) => {
        const exercise = session.exercises.find(
          (ex) => ex.exerciseName === exerciseName
        );
        if (!exercise || !exercise.completed) return null;

        const maxWeight = Math.max(
          ...exercise.sets
            .filter((set) => set.completed && set.weight)
            .map((set) => set.weight || 0)
        );
        const maxReps = Math.max(
          ...exercise.sets.filter((set) => set.completed).map((set) => set.reps)
        );
        const totalVolume = exercise.sets
          .filter((set) => set.completed)
          .reduce((sum, set) => sum + set.reps * (set.weight || 0), 0);

        return {
          date: session.date,
          maxWeight,
          maxReps,
          totalVolume,
          sets: exercise.sets.filter((set) => set.completed).length,
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime()
      );

    return exerciseData;
  };

  // Get recent workouts
  const getRecentWorkouts = (limit: number = 10) => {
    return workoutSessions
      .filter((session) => session.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  // Get workout statistics
  const getWorkoutStats = () => {
    const completedSessions = workoutSessions.filter(
      (session) => session.completed
    );
    const totalWorkouts = completedSessions.length;
    const totalMinutes = completedSessions.reduce(
      (sum, session) => sum + (session.totalDuration || 0),
      0
    );
    const averageDuration =
      totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;

    // Get current week's workouts
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const thisWeekWorkouts = completedSessions.filter(
      (session) => new Date(session.date) >= startOfWeek
    ).length;

    return {
      totalWorkouts,
      totalMinutes,
      averageDuration,
      thisWeekWorkouts,
      personalRecords: personalRecords.length,
    };
  };

  // Add manual exercise
  const addManualExercise = (
    exerciseName: string,
    sets: { reps: number; weight?: number }[]
  ) => {
    const exerciseLog: ExerciseLog = {
      exerciseName,
      sets: sets.map((set, index) => ({
        id: `manual-set-${Date.now()}-${index}`,
        reps: set.reps,
        weight: set.weight || 0,
        completed: true,
      })),
      notes: '',
      completed: true,
    };

    manualExercises = [exerciseLog, ...manualExercises.slice(0, 9)]; // Keep last 10
    setRecentManualExercises([...manualExercises]);

    // Check for personal records
    checkManualExerciseRecords(exerciseLog);

    return exerciseLog;
  };

  // Check personal records for manual exercise
  const checkManualExerciseRecords = (exercise: ExerciseLog) => {
    const newRecords: PersonalRecord[] = [];

    // Check weight PR
    const maxWeight = Math.max(
      ...exercise.sets
        .filter((set) => set.completed && set.weight)
        .map((set) => set.weight || 0)
    );

    if (maxWeight > 0) {
      const existingWeightRecord = personalRecords.find(
        (record) =>
          record.exerciseName === exercise.exerciseName &&
          record.type === 'weight'
      );

      if (!existingWeightRecord || maxWeight > existingWeightRecord.value) {
        newRecords.push({
          exerciseName: exercise.exerciseName,
          type: 'weight',
          value: maxWeight,
          date: new Date().toISOString().split('T')[0],
          workoutSessionId: 'manual',
        });
      }
    }

    // Check reps PR
    const maxReps = Math.max(
      ...exercise.sets.filter((set) => set.completed).map((set) => set.reps)
    );

    if (maxReps > 0) {
      const existingRepsRecord = personalRecords.find(
        (record) =>
          record.exerciseName === exercise.exerciseName &&
          record.type === 'reps'
      );

      if (!existingRepsRecord || maxReps > existingRepsRecord.value) {
        newRecords.push({
          exerciseName: exercise.exerciseName,
          type: 'reps',
          value: maxReps,
          date: new Date().toISOString().split('T')[0],
          workoutSessionId: 'manual',
        });
      }
    }

    // Update records if new ones found
    if (newRecords.length > 0) {
      newRecords.forEach((newRecord) => {
        const existingIndex = personalRecords.findIndex(
          (record) =>
            record.exerciseName === newRecord.exerciseName &&
            record.type === newRecord.type
        );

        if (existingIndex >= 0) {
          personalRecords[existingIndex] = newRecord;
        } else {
          personalRecords.push(newRecord);
        }
      });

      setRecords([...personalRecords]);
    }
  };

  // Get recent manual exercises
  const getRecentManualExercises = (limit: number = 5) => {
    return manualExercises.slice(0, limit);
  };

  return {
    sessions,
    records,
    activeSession,
    recentManualExercises,
    startWorkoutSession,
    getActiveSession,
    hasActiveSession,
    updateSet,
    updateExerciseNotes,
    completeWorkoutSession,
    cancelWorkoutSession,
    getWorkoutHistory,
    getExerciseProgress,
    getRecentWorkouts,
    getWorkoutStats,
    addManualExercise,
    getRecentManualExercises,
  };
}
