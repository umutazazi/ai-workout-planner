import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Clock, RotateCcw } from 'lucide-react-native';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
}

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
}

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.indexContainer}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detail}>
          <Text style={styles.detailValue}>{exercise.sets}</Text>
          <Text style={styles.detailLabel}>Sets</Text>
        </View>
        
        <View style={styles.detail}>
          <Text style={styles.detailValue}>{exercise.reps}</Text>
          <Text style={styles.detailLabel}>Reps</Text>
        </View>
        
        <View style={styles.detail}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.restText}>{exercise.rest}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  indexContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  indexText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detail: {
    alignItems: 'center',
    flex: 1,
  },
  detailValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#3B82F6',
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  restText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 4,
  },
});