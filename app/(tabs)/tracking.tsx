import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableNativeFeedback,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Dumbbell, TrendingUp, Trophy, Timer, Target, Apple } from 'lucide-react-native';
import { useWorkoutTracking } from '@/hooks/useWorkoutTracking';
import { useWorkoutStore } from '@/hooks/useWorkoutStore';
import { useMacroTracking } from '@/hooks/useMacroTracking';
import { ManualExerciseEntry } from '@/components/ManualExerciseEntry';
import { RestTimer } from '@/components/RestTimer';
import { DailyProgressBar } from '@/components/DailyProgressBar';

const { width } = Dimensions.get('window');

export default function TrackingScreen() {
  const { getRecentManualExercises, records, getExerciseProgress } = useWorkoutTracking();
  const { workouts } = useWorkoutStore();
  const {
    dailyMacros,
    isLoading: macrosLoading,
    addProtein,
    addCarbs,
    addFats,
    addMacros,
    resetDailyMacros,
    refreshMacros
  } = useMacroTracking();
  const [selectedTab, setSelectedTab] = useState<'exercises' | 'progress' | 'records' | 'macros'>('exercises');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(60);
  const insets = useSafeAreaInsets();

  // Refresh macros when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshMacros();
    }, [refreshMacros])
  );

  const recentManualExercises = getRecentManualExercises(10);

  // Get unique exercise names for progress tracking
  const uniqueExercises = Array.from(
    new Set(recentManualExercises.map(ex => ex.exerciseName))
  );

  // Platform-specific touchable component
  const TouchableComponent = Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;

  const TabButton = ({ tab, title, isActive, onPress }: {
    tab: 'exercises' | 'progress' | 'records' | 'macros';
    title: string;
    isActive: boolean;
    onPress: () => void;
  }) => {
    if (Platform.OS === 'android') {
      return (
        <TouchableNativeFeedback
          onPress={onPress}
          background={TouchableNativeFeedback.Ripple('#E5E7EB', true)}
        >
          <View style={[styles.tab, isActive && styles.activeTab]}>
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {title}
            </Text>
          </View>
        </TouchableNativeFeedback>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const startQuickRestTimer = (duration: number = 60) => {
    setRestDuration(duration);
    setShowRestTimer(true);
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
  };

  const handleRestSkip = () => {
    setShowRestTimer(false);
  };

  const ExerciseItem = ({ exercise }: { exercise: any }) => (
    <View style={styles.exerciseItem}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseIconContainer}>
          <Dumbbell size={20} color="#3B82F6" />
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          <Text style={styles.exerciseDetails}>
            {exercise.sets.length} sets
          </Text>
        </View>
        <View style={styles.exerciseStats}>
          <Text style={styles.statValue}>
            {Math.max(...exercise.sets.map((s: any) => s.weight || 0))} lbs
          </Text>
          <Text style={styles.statLabel}>Max Weight</Text>
        </View>
      </View>

      <View style={styles.setsContainer}>
        {exercise.sets.map((set: any, index: number) => (
          <View key={set.id} style={styles.setItem}>
            <Text style={styles.setNumber}>{index + 1}</Text>
            <Text style={styles.setValue}>{set.reps} reps</Text>
            {set.weight > 0 && (
              <Text style={styles.setValue}>{set.weight} lbs</Text>
            )}
          </View>
        ))}
      </View>

      {/* Quick Rest Button for this exercise */}
      <TouchableOpacity
        style={styles.exerciseRestButton}
        onPress={() => startQuickRestTimer(90)} // 90s default for exercise-specific rest
      >
        <Timer size={16} color="#F97316" />
        <Text style={styles.exerciseRestText}>Rest 90s</Text>
      </TouchableOpacity>
    </View>
  );

  const ProgressItem = ({ exerciseName }: { exerciseName: string }) => {
    const progress = getExerciseProgress(exerciseName);
    const latestData = progress[progress.length - 1];
    const previousData = progress[progress.length - 2];

    const weightChange = latestData && previousData
      ? latestData.maxWeight - previousData.maxWeight
      : 0;

    return (
      <View style={styles.progressItem}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressExerciseName}>{exerciseName}</Text>
          <View style={styles.progressTrend}>
            <TrendingUp
              size={16}
              color={weightChange >= 0 ? "#10B981" : "#EF4444"}
            />
            <Text style={[
              styles.progressChange,
              { color: weightChange >= 0 ? "#10B981" : "#EF4444" }
            ]}>
              {weightChange >= 0 ? '+' : ''}{weightChange} lbs
            </Text>
          </View>
        </View>

        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>
              {latestData?.maxWeight || 0} lbs
            </Text>
            <Text style={styles.progressStatLabel}>Max Weight</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>
              {latestData?.maxReps || 0}
            </Text>
            <Text style={styles.progressStatLabel}>Max Reps</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>
              {progress.length}
            </Text>
            <Text style={styles.progressStatLabel}>Sessions</Text>
          </View>
        </View>
      </View>
    );
  };

  const PersonalRecordItem = ({ record }: { record: any }) => (
    <View style={styles.recordItem}>
      <View style={styles.recordHeader}>
        <Trophy size={20} color="#F59E0B" />
        <Text style={styles.recordExercise}>{record.exerciseName}</Text>
      </View>
      <View style={styles.recordDetails}>
        <Text style={styles.recordValue}>
          {record.type === 'weight' ? `${record.value} lbs` :
            record.type === 'reps' ? `${record.value} reps` :
              `${record.value} sec`}
        </Text>
        <Text style={styles.recordDate}>
          {new Date(record.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </Text>
      </View>
    </View>
  );

  const EmptyState = ({ icon: Icon, title, subtitle }: {
    icon: any;
    title: string;
    subtitle: string;
  }) => (
    <View style={styles.emptyState}>
      <Icon size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );

  const renderExercises = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {recentManualExercises.length > 0 ? (
        <View style={styles.exercisesList}>
          {recentManualExercises.map((exercise, index) => (
            <ExerciseItem key={`${exercise.exerciseName}-${index}`} exercise={exercise} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon={Dumbbell}
          title="No Exercises Yet"
          subtitle="Add your first exercise to start tracking your progress"
        />
      )}
    </ScrollView>
  );

  const renderProgress = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {uniqueExercises.length > 0 ? (
        <View style={styles.progressList}>
          {uniqueExercises.map((exerciseName) => (
            <ProgressItem key={exerciseName} exerciseName={exerciseName} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="No Progress Data"
          subtitle="Add exercises to track your progress over time"
        />
      )}
    </ScrollView>
  );

  const renderRecords = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {records.length > 0 ? (
        <View style={styles.recordsList}>
          {records.map((record, index) => (
            <PersonalRecordItem key={`${record.exerciseName}-${record.type}-${index}`} record={record} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No Personal Records"
          subtitle="Keep training to set your first personal records!"
        />
      )}
    </ScrollView>
  );

  // Get the most recent workout with macro goals
  const getLatestMacroGoals = () => {
    const workoutWithMacros = workouts.find(w => w.macroGoals && w.macroGoals.calories > 0);
    return workoutWithMacros?.macroGoals || null;
  };

  const macroGoals = getLatestMacroGoals(); const MacroProgressCircle = ({ label, current, target, color }: {
    label: string;
    current: number;
    target: number;
    color: string;
  }) => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const [animatedValue] = useState(new Animated.Value(0));

    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }, [percentage]);

    const size = 90;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
      <View style={styles.macroCircle}>
        <View style={styles.macroCircleContainer}>
          {/* Background Circle */}
          <View style={[styles.circleBackground, {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: '#F3F4F6'
          }]} />

          {/* Progress Circle using multiple segments for better visual */}
          <View style={styles.progressContainer}>
            {[0, 1, 2, 3].map((quarter) => {
              const quarterPercentage = Math.max(0, Math.min(25, percentage - quarter * 25));
              const opacity = quarterPercentage / 25;
              const rotation = quarter * 90 - 90; // Start from top

              return (
                <Animated.View
                  key={quarter}
                  style={[
                    styles.quarterCircle,
                    {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      borderWidth: strokeWidth,
                      borderColor: 'transparent',
                      borderTopColor: color,
                      transform: [{ rotate: `${rotation}deg` }],
                      opacity: opacity,
                    }
                  ]}
                />
              );
            })}
          </View>

          {/* Center Content */}
          <View style={styles.macroCircleContent}>
            <Text style={styles.macroValue}>{current}g</Text>
            <Text style={styles.macroTarget}>/{target}g</Text>
          </View>
        </View>
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
    );
  };

  const renderMacros = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {macroGoals ? (
        <View style={styles.macrosContainer}>
          {/* Daily Calories */}
          <View style={styles.caloriesCard}>
            <View style={styles.caloriesHeader}>
              <Apple size={24} color="#FF6B6B" />
              <Text style={styles.caloriesTitle}>Daily Calories</Text>
            </View>
            <View style={styles.caloriesProgress}>
              <Text style={styles.caloriesValue}>
                {dailyMacros.calories} / {macroGoals.calories}
              </Text>
              <View style={styles.caloriesBar}>
                <View
                  style={[
                    styles.caloriesBarFill,
                    { width: `${Math.min((dailyMacros.calories / macroGoals.calories) * 100, 100)}%` }
                  ]}
                />
              </View>
              <Text style={styles.caloriesRemaining}>
                {Math.max(macroGoals.calories - dailyMacros.calories, 0)} calories remaining
              </Text>
            </View>
          </View>

          {/* Daily Progress Bars */}
          <View style={styles.dailyProgressSection}>
            <Text style={styles.dailyProgressTitle}>Daily Progress</Text>
            <View style={styles.dailyProgressBars}>
              <DailyProgressBar
                current={dailyMacros.protein}
                target={macroGoals.protein}
                label="Protein"
                color="#3B82F6"
                unit="g"
              />
              <DailyProgressBar
                current={dailyMacros.carbs}
                target={macroGoals.carbs}
                label="Carbs"
                color="#10B981"
                unit="g"
              />
              <DailyProgressBar
                current={dailyMacros.fats}
                target={macroGoals.fats}
                label="Fats"
                color="#F59E0B"
                unit="g"
              />
              <DailyProgressBar
                current={dailyMacros.calories}
                target={macroGoals.calories}
                label="Calories"
                color="#FF6B6B"
                unit=""
              />
            </View>
          </View>

          {/* Macro Circles */}
          <View style={styles.macroCirclesContainer}>
            <MacroProgressCircle
              label="Protein"
              current={dailyMacros.protein}
              target={macroGoals.protein}
              color="#3B82F6"
            />
            <MacroProgressCircle
              label="Carbs"
              current={dailyMacros.carbs}
              target={macroGoals.carbs}
              color="#10B981"
            />
            <MacroProgressCircle
              label="Fats"
              current={dailyMacros.fats}
              target={macroGoals.fats}
              color="#F59E0B"
            />
          </View>

          {/* Quick Add Section */}
          <View style={styles.quickAddSection}>
            <Text style={styles.quickAddTitle}>Quick Add</Text>
            <View style={styles.quickAddButtons}>
              <TouchableOpacity
                style={[styles.quickAddButton, { backgroundColor: '#3B82F615' }]}
                onPress={() => addMacros({ protein: 25, calories: 100 })}
              >
                <Text style={[styles.quickAddText, { color: '#3B82F6' }]}>+25g Protein</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAddButton, { backgroundColor: '#10B98115' }]}
                onPress={() => addMacros({ carbs: 30, calories: 120 })}
              >
                <Text style={[styles.quickAddText, { color: '#10B981' }]}>+30g Carbs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAddButton, { backgroundColor: '#F59E0B15' }]}
                onPress={() => addMacros({ fats: 10, calories: 90 })}
              >
                <Text style={[styles.quickAddText, { color: '#F59E0B' }]}>+10g Fats</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetDailyMacros}
          >
            <Text style={styles.resetButtonText}>Reset Daily Intake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <EmptyState
          icon={Target}
          title="No Macro Goals Set"
          subtitle="Create a workout with macro goals to start tracking your nutrition"
        />
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Dumbbell size={32} color="#FFFFFF" />
          <Text style={styles.title}>Exercise Tracking</Text>
          <Text style={styles.subtitle}>
            Track your exercises and progress
          </Text>
        </View>

        <View style={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
          <View style={styles.tabBar}>
            <TabButton
              tab="exercises"
              title="Exercises"
              isActive={selectedTab === 'exercises'}
              onPress={() => setSelectedTab('exercises')}
            />
            <TabButton
              tab="progress"
              title="Progress"
              isActive={selectedTab === 'progress'}
              onPress={() => setSelectedTab('progress')}
            />
            <TabButton
              tab="records"
              title="Records"
              isActive={selectedTab === 'records'}
              onPress={() => setSelectedTab('records')}
            />
            <TabButton
              tab="macros"
              title="Macros"
              isActive={selectedTab === 'macros'}
              onPress={() => setSelectedTab('macros')}
            />
          </View>

          {selectedTab === 'exercises' && renderExercises()}
          {selectedTab === 'progress' && renderProgress()}
          {selectedTab === 'records' && renderRecords()}
          {selectedTab === 'macros' && renderMacros()}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowManualEntry(true)}
            activeOpacity={0.8}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Quick Rest Timer Button */}
          <TouchableOpacity
            style={styles.timerButton}
            onPress={() => startQuickRestTimer(60)}
            activeOpacity={0.8}
          >
            <Timer size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ManualExerciseEntry
        visible={showManualEntry}
        onClose={() => setShowManualEntry(false)}
      />

      {/* Rest Timer */}
      <RestTimer
        isVisible={showRestTimer}
        restDuration={restDuration}
        onComplete={handleRestComplete}
        onSkip={handleRestSkip}
        onDismiss={handleRestSkip}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#E0E7FF',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    position: 'relative',
    elevation: 0,
    paddingBottom: 120, // Increased padding for new tab bar height
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    elevation: 0,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 44,
    overflow: 'hidden',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 120, // Increased padding for new tab bar height
  },
  exercisesList: {
    gap: 16,
  },
  exerciseItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  exerciseStats: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  setsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  setNumber: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  setValue: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  exerciseRestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  exerciseRestText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F97316',
    marginLeft: 4,
  },
  progressList: {
    gap: 16,
  },
  progressItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressExerciseName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
  },
  progressTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressChange: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 16,
  },
  progressStat: {
    flex: 1,
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
  },
  progressStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  recordsList: {
    gap: 12,
  },
  recordItem: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordExercise: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordValue: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#F59E0B',
  },
  recordDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  addButton: {
    position: 'absolute',
    bottom: 100, // Adjusted for new tab bar height
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
  },
  timerButton: {
    position: 'absolute',
    bottom: 100, // Same level as add button
    right: 88, // Position to the left of add button
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
  },
  // Macro tracking styles
  macrosContainer: {
    padding: 4,
  },
  caloriesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caloriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  caloriesTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  caloriesProgress: {
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  caloriesBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  caloriesBarFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  caloriesRemaining: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  macroCirclesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  macroCircle: {
    alignItems: 'center',
  },
  macroCircleContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  progressContainer: {
    position: 'absolute',
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quarterCircle: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  macroCircleBackground: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  macroCircleProgress: {
    width: 90,
    height: 90,
    borderRadius: 45,
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 15,
    left: 15,
  },
  progressArc: {
    width: 90,
    height: 90,
    borderRadius: 45,
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  progressRing: {
    position: 'absolute',
    width: 90,
    height: 90,
  },
  halfCircle: {
    width: 90,
    height: 45,
    borderWidth: 6,
    borderColor: '#F3F4F6',
    position: 'absolute',
  },
  topHalfCircle: {
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    borderBottomWidth: 0,
    top: 0,
  },
  bottomHalfCircle: {
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    borderTopWidth: 0,
    bottom: 0,
  },
  progressOverlay: {
    width: 78,
    height: 78,
    borderRadius: 39,
    position: 'absolute',
    top: 6,
    left: 6,
  },
  macroCircleContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
  },
  macroTarget: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  macroLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  quickAddSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAddTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAddButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickAddText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  resetButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  // Daily progress styles
  dailyProgressSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dailyProgressTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  dailyProgressBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
});