import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import {
  Play,
  Pause,
  Check,
  Plus,
  Minus,
  Clock,
  MessageSquare,
  X,
  Trophy
} from 'lucide-react-native';
import { useWorkoutTracking, SetLog } from '@/hooks/useWorkoutTracking';
import { RestTimer } from './RestTimer';

interface WorkoutTrackerProps {
  workout: any;
  onComplete: () => void;
  onCancel: () => void;
}

export function WorkoutTracker({ workout, onComplete, onCancel }: WorkoutTrackerProps) {
  const {
    activeSession,
    getActiveSession,
    hasActiveSession,
    updateSet,
    updateExerciseNotes,
    completeWorkoutSession,
    cancelWorkoutSession
  } = useWorkoutTracking();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [currentRestDuration, setCurrentRestDuration] = useState(60);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesExerciseIndex, setNotesExerciseIndex] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Get the actual active session
  const currentSession = activeSession || getActiveSession();

  // Helper function to parse rest time from exercise data
  const parseRestTime = (restString: string): number => {
    if (!restString) return 60; // Default 60 seconds

    const lowerRest = restString.toLowerCase();

    // Extract number from string like "60s", "2min", "90 seconds", etc.
    const match = lowerRest.match(/(\d+)/);
    if (!match) return 60;

    const number = parseInt(match[1]);

    if (lowerRest.includes('min')) {
      return number * 60; // Convert minutes to seconds
    }

    return number; // Assume seconds if no unit specified
  };

  useEffect(() => {
    // Validate session on mount only
    if (!hasActiveSession()) {
      console.error('No active session found on WorkoutTracker mount');
      onCancel();
      return;
    }

    // Validate exercises only once
    if (!currentSession?.exercises || currentSession.exercises.length === 0) {
      console.error('No exercises found in session');
      onCancel();
      return;
    }
  }, []); // Empty dependency array - run only on mount

  if (!currentSession || !hasActiveSession()) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No active workout session found</Text>
          <Text style={styles.errorSubtext}>
            The workout session may have been cancelled or expired.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={onCancel}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Validate current exercise index
  if (currentExerciseIndex >= currentSession.exercises.length) {
    setCurrentExerciseIndex(0);
  }

  const currentExercise = currentSession.exercises[currentExerciseIndex];
  const totalExercises = currentSession.exercises.length;
  const completedExercises = currentSession.exercises.filter(ex => ex.completed).length;

  if (!currentExercise) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Exercise not found</Text>
          <Text style={styles.errorSubtext}>
            Unable to load exercise data. Please try restarting the workout.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={onCancel}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Validate current exercise has valid data
  if (!currentExercise.exerciseName || !currentExercise.sets || currentExercise.sets.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid exercise data</Text>
          <Text style={styles.errorSubtext}>
            The exercise data is corrupted. Please try generating a new workout.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={onCancel}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSetUpdate = (setIndex: number, field: keyof SetLog, value: any) => {
    updateSet(currentExerciseIndex, setIndex, { [field]: value });
  };

  const toggleSetComplete = (setIndex: number) => {
    const set = currentExercise.sets[setIndex];
    handleSetUpdate(setIndex, 'completed', !set.completed);

    if (!set.completed && set.reps > 0) {
      // Get rest duration from workout data
      const exerciseData = workout.exercises?.find((ex: any) => ex.name === currentExercise.exerciseName);
      const restDuration = exerciseData?.rest ? parseRestTime(exerciseData.rest) : 60;

      setCurrentRestDuration(restDuration);
      setShowRestTimer(true);
    }
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
    // Optional: Auto-focus on next set or show completion feedback
  };

  const handleRestSkip = () => {
    setShowRestTimer(false);
  };

  const nextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleCompleteWorkout = () => {
    const completedSession = completeWorkoutSession(sessionNotes);
    setShowCompleteModal(false);
    onComplete();
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel this workout? Your progress will be lost.',
      [
        { text: 'Continue Workout', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: () => {
            cancelWorkoutSession();
            onCancel();
          }
        },
      ]
    );
  };

  const SetRow = ({ set, index }: { set: SetLog; index: number }) => (
    <View style={[styles.setRow, set.completed && styles.completedSetRow]}>
      <Text style={styles.setNumber}>{index + 1}</Text>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => handleSetUpdate(index, 'weight', Math.max(0, (set.weight || 0) - 5))}
        >
          <Minus size={16} color="#6B7280" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={set.weight?.toString() || '0'}
          onChangeText={(text) => handleSetUpdate(index, 'weight', parseInt(text) || 0)}
          keyboardType="numeric"
          placeholder="0"
        />
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => handleSetUpdate(index, 'weight', (set.weight || 0) + 5)}
        >
          <Plus size={16} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.inputLabel}>lbs</Text>
      </View>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => handleSetUpdate(index, 'reps', Math.max(0, set.reps - 1))}
        >
          <Minus size={16} color="#6B7280" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={set.reps.toString()}
          onChangeText={(text) => handleSetUpdate(index, 'reps', parseInt(text) || 0)}
          keyboardType="numeric"
          placeholder="0"
        />
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => handleSetUpdate(index, 'reps', set.reps + 1)}
        >
          <Plus size={16} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.inputLabel}>reps</Text>
      </View>

      <TouchableOpacity
        style={[styles.checkButton, set.completed && styles.checkedButton]}
        onPress={() => toggleSetComplete(index)}
      >
        <Check size={20} color={set.completed ? '#FFFFFF' : '#6B7280'} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelWorkout}>
          <X size={24} color="#EF4444" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle}>{currentSession.workoutName}</Text>
          <Text style={styles.progressText}>
            Exercise {currentExerciseIndex + 1} of {totalExercises}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notesButton}
          onPress={() => {
            setNotesExerciseIndex(currentExerciseIndex);
            setShowNotesModal(true);
          }}
        >
          <MessageSquare size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(completedExercises / totalExercises) * 100}%` }
          ]}
        />
      </View>

      {/* Exercise Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{currentExercise.exerciseName}</Text>
          {currentExercise.completed && (
            <View style={styles.completedBadge}>
              <Check size={16} color="#10B981" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>

        <View style={styles.setsContainer}>
          <View style={styles.setsHeader}>
            <Text style={styles.setHeaderText}>Set</Text>
            <Text style={styles.setHeaderText}>Weight</Text>
            <Text style={styles.setHeaderText}>Reps</Text>
            <Text style={styles.setHeaderText}>✓</Text>
          </View>

          {currentExercise.sets.map((set, index) => (
            <SetRow key={set.id} set={set} index={index} />
          ))}
        </View>

        {currentExercise.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{currentExercise.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentExerciseIndex === 0 && styles.disabledButton]}
          onPress={previousExercise}
          disabled={currentExerciseIndex === 0}
        >
          <Text style={[styles.navButtonText, currentExerciseIndex === 0 && styles.disabledText]}>
            Previous
          </Text>
        </TouchableOpacity>

        {currentExerciseIndex === totalExercises - 1 ? (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => setShowCompleteModal(true)}
          >
            <Trophy size={20} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Complete Workout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextExercise}
          >
            <Text style={styles.nextButtonText}>Next Exercise</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Exercise Notes</Text>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.notesInput}
            value={currentSession.exercises[notesExerciseIndex]?.notes || ''}
            onChangeText={(text) => updateExerciseNotes(notesExerciseIndex, text)}
            placeholder="Add notes about this exercise..."
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.saveNotesButton}
            onPress={() => setShowNotesModal(false)}
          >
            <Text style={styles.saveNotesText}>Save Notes</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Complete Workout Modal */}
      <Modal
        visible={showCompleteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Workout</Text>
            <TouchableOpacity onPress={() => setShowCompleteModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.completeMessage}>
            Great job! Add any final notes about your workout:
          </Text>
          <TextInput
            style={styles.notesInput}
            value={sessionNotes}
            onChangeText={setSessionNotes}
            placeholder="How did the workout feel? Any observations..."
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleCompleteWorkout}
          >
            <Trophy size={20} color="#FFFFFF" />
            <Text style={styles.finishButtonText}>Finish Workout</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Enhanced Rest Timer */}
      <RestTimer
        isVisible={showRestTimer}
        restDuration={currentRestDuration}
        onComplete={handleRestComplete}
        onSkip={handleRestSkip}
        onDismiss={handleRestSkip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  notesButton: {
    padding: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  exerciseName: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
    marginLeft: 4,
  },
  setsContainer: {
    marginBottom: 24,
  },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  setHeaderText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  completedSetRow: {
    backgroundColor: '#F0FDF4',
  },
  setNumber: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    width: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginHorizontal: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  checkedButton: {
    backgroundColor: '#10B981',
  },
  notesContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  notesTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  completeButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  completeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
  },
  notesInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  saveNotesButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveNotesText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  completeMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  finishButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});