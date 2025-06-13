import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Dumbbell, Clock, RotateCcw, Plus } from 'lucide-react-native';
import { useWorkoutStore } from '@/hooks/useWorkoutStore';
import { WorkoutCard } from '@/components/WorkoutCard';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExercisesScreen() {
  const { workouts, isLoading, refreshWorkouts } = useWorkoutStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      // Refresh workouts when screen comes into focus
      refreshWorkouts();
    }, [refreshWorkouts])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshWorkouts();
    setRefreshing(false);
  }, [refreshWorkouts]);

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Dumbbell size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Workouts Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first AI-powered workout plan in the "Create Workout" tab
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create Workout</Text>
      </TouchableOpacity>
    </View>
  );

  const LoadingState = () => (
    <View style={styles.loadingState}>
      <Text style={styles.loadingText}>Loading workouts...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Calendar size={32} color="#FFFFFF" />
          <Text style={styles.title}>My Workouts</Text>
          <Text style={styles.subtitle}>
            Your personalized training plans
          </Text>
          {workouts.length > 0 && (
            <Text style={styles.workoutCount}>
              {workouts.length} workout{workouts.length !== 1 ? 's' : ''} saved
            </Text>
          )}
        </View>

        <View style={styles.content}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {isLoading ? (
              <LoadingState />
            ) : workouts.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <View style={styles.workoutsList}>
                  {workouts.map((workout) => (
                    <WorkoutCard
                      key={workout.id}
                      workout={workout}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.addMoreButton}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Plus size={20} color="#3B82F6" />
                  <Text style={styles.addMoreText}>Create Another Workout</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </LinearGradient>
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
  workoutCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#E0E7FF',
    marginTop: 8,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // Increased for new tab bar height
  },
  workoutsList: {
    marginBottom: 24,
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
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  addMoreText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
    marginLeft: 8,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});