import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Target, Flame, RotateCcw } from 'lucide-react-native';

interface WorkoutFormProps {
  currentStep: number;
  workoutData: {
    daysPerWeek: number;
    goal: string;
  };
  onDaysSelection: (days: number) => void;
  onGoalSelection: (goal: string) => void;
  onReset: () => void;
}

export function WorkoutForm({
  currentStep,
  workoutData,
  onDaysSelection,
  onGoalSelection,
  onReset,
}: WorkoutFormProps) {
  const daysOptions = [3, 4, 5, 6];

  if (currentStep === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.questionTitle}>
            How many days per week can you workout?
          </Text>
          <Text style={styles.questionSubtitle}>
            Choose the number of days that fits your schedule
          </Text>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.optionsContainer}>
            {daysOptions.map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.dayOption,
                  workoutData.daysPerWeek === days && styles.selectedOption
                ]}
                onPress={() => onDaysSelection(days)}
              >
                <Text style={[
                  styles.dayNumber,
                  workoutData.daysPerWeek === days && styles.selectedText
                ]}>
                  {days}
                </Text>
                <Text style={[
                  styles.dayLabel,
                  workoutData.daysPerWeek === days && styles.selectedLabel
                ]}>
                  {days === 3 ? 'Beginner' : days === 4 ? 'Intermediate' : days === 5 ? 'Advanced' : 'Expert'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onReset}>
        <RotateCcw size={20} color="#6B7280" />
        <Text style={styles.backText}>Start Over</Text>
      </TouchableOpacity>

      <View style={styles.headerContainer}>
        <Text style={styles.questionTitle}>
          What's your primary goal?
        </Text>
        <Text style={styles.questionSubtitle}>
          Choose your main fitness objective for your {workoutData.daysPerWeek}-day program
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.goalContainer}>
          <TouchableOpacity
            style={[
              styles.goalOption,
              styles.fatBurnOption,
              workoutData.goal === 'Fat Burn' && styles.selectedGoalOption
            ]}
            onPress={() => onGoalSelection('Fat Burn')}
          >
            <View style={[
              styles.goalIconContainer,
              workoutData.goal === 'Fat Burn' && styles.selectedIconContainer
            ]}>
              <Flame size={32} color="#F97316" />
            </View>
            <Text style={[
              styles.goalTitle,
              workoutData.goal === 'Fat Burn' && styles.selectedGoalTitle
            ]}>
              Fat Burn
            </Text>
            <Text style={[
              styles.goalDescription,
              workoutData.goal === 'Fat Burn' && styles.selectedGoalDescription
            ]}>
              High-intensity workouts to maximize calorie burn and improve cardiovascular health
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.goalOption,
              styles.muscleGainOption,
              workoutData.goal === 'Muscle Gain' && styles.selectedGoalOption
            ]}
            onPress={() => onGoalSelection('Muscle Gain')}
          >
            <View style={[
              styles.goalIconContainer,
              workoutData.goal === 'Muscle Gain' && styles.selectedIconContainer
            ]}>
              <Target size={32} color="#10B981" />
            </View>
            <Text style={[
              styles.goalTitle,
              workoutData.goal === 'Muscle Gain' && styles.selectedGoalTitle
            ]}>
              Muscle Gain
            </Text>
            <Text style={[
              styles.goalDescription,
              workoutData.goal === 'Muscle Gain' && styles.selectedGoalDescription
            ]}>
              Strength-focused exercises to build lean muscle mass and increase overall strength
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  backText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 8,
  },
  questionTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 60,
    flexGrow: 1,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  dayOption: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  dayNumber: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  selectedText: {
    color: '#1D4ED8',
  },
  dayLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedLabel: {
    color: '#1D4ED8',
  },
  goalContainer: {
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  goalOption: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
  },
  fatBurnOption: {
    borderColor: '#FED7AA',
  },
  muscleGainOption: {
    borderColor: '#A7F3D0',
  },
  selectedGoalOption: {
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  goalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  selectedIconContainer: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  selectedGoalTitle: {
    color: '#111827',
  },
  goalDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedGoalDescription: {
    color: '#374151',
  },
});