import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { ChevronDown, ChevronUp, Target, Flame, Clock, Zap, Trash2 } from 'lucide-react-native';
import { ExerciseCard } from './ExerciseCard';
import { useWorkoutStore } from '@/hooks/useWorkoutStore';

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
}

interface WorkoutCardProps {
  workout: Workout;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const { removeWorkout } = useWorkoutStore();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(animatedValue, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleDeleteWorkout = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeWorkout(workout.id) },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Recently';
    }
  };

  const GoalIcon = workout.goal === 'Fat Burn' ? Flame : Target;
  const goalColor = workout.goal === 'Fat Burn' ? '#F97316' : '#10B981';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleExpanded}>
        <View style={styles.headerLeft}>
          <View style={[styles.goalIcon, { backgroundColor: `${goalColor}15` }]}>
            <GoalIcon size={20} color={goalColor} />
          </View>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{workout.goal} Program</Text>
              <View style={styles.aiTag}>
                <Zap size={12} color="#FFD700" />
                <Text style={styles.aiTagText}>AI</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              {workout.daysPerWeek} days/week • Created {formatDate(workout.createdAt)}
            </Text>
            {workout.totalWeeks && (
              <Text style={styles.duration}>
                {workout.totalWeeks} week program
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteWorkout}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
          <View style={styles.expandIcon}>
            {isExpanded ? (
              <ChevronUp size={20} color="#6B7280" />
            ) : (
              <ChevronDown size={20} color="#6B7280" />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <Animated.View style={styles.content}>
          {workout.progressionNotes && (
            <View style={styles.progressionContainer}>
              <Text style={styles.progressionTitle}>💡 Progression Tips</Text>
              <Text style={styles.progressionText}>{workout.progressionNotes}</Text>
            </View>
          )}

          {workout.exercises.map((dayWorkout) => (
            <View key={dayWorkout.day} style={styles.dayContainer}>
              <View style={styles.dayHeader}>
                <View style={styles.dayHeaderLeft}>
                  <Text style={styles.dayTitle}>{dayWorkout.name}</Text>
                  <View style={styles.dayMeta}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.dayDuration}>{dayWorkout.estimatedDuration}</Text>
                  </View>
                </View>
              </View>
              {dayWorkout.focus && (
                <Text style={styles.dayFocus}>Focus: {dayWorkout.focus}</Text>
              )}
              {dayWorkout.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={`${dayWorkout.day}-${index}`}
                  exercise={exercise}
                  index={index}
                />
              ))}
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginRight: 8,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiTagText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    marginLeft: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  duration: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    marginRight: 4,
  },
  expandIcon: {
    padding: 4,
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  progressionContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  progressionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  progressionText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 18,
  },
  dayContainer: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayHeaderLeft: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 4,
  },
  dayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayDuration: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 4,
  },
  dayFocus: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
});