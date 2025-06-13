import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    ScrollView,
} from 'react-native';
import { X, Plus, Minus, Check, Dumbbell } from 'lucide-react-native';
import { useWorkoutTracking } from '@/hooks/useWorkoutTracking';

interface ManualExerciseEntryProps {
    visible: boolean;
    onClose: () => void;
}

interface SetEntry {
    reps: number;
    weight: number;
}

export function ManualExerciseEntry({ visible, onClose }: ManualExerciseEntryProps) {
    const { addManualExercise } = useWorkoutTracking();
    const [exerciseName, setExerciseName] = useState('');
    const [sets, setSets] = useState<SetEntry[]>([{ reps: 0, weight: 0 }]);

    const addSet = () => {
        setSets([...sets, { reps: 0, weight: 0 }]);
    };

    const removeSet = (index: number) => {
        if (sets.length > 1) {
            setSets(sets.filter((_, i) => i !== index));
        }
    };

    const updateSet = (index: number, field: keyof SetEntry, value: number) => {
        const newSets = [...sets];
        newSets[index][field] = value;
        setSets(newSets);
    };

    const handleSave = () => {
        if (!exerciseName.trim()) {
            Alert.alert('Error', 'Please enter an exercise name');
            return;
        }

        const validSets = sets.filter(set => set.reps > 0);
        if (validSets.length === 0) {
            Alert.alert('Error', 'Please enter at least one set with reps');
            return;
        }

        try {
            addManualExercise(exerciseName.trim(), validSets);

            // Reset form
            setExerciseName('');
            setSets([{ reps: 0, weight: 0 }]);

            Alert.alert('Success', 'Exercise added successfully!');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to save exercise');
        }
    };

    const handleClose = () => {
        setExerciseName('');
        setSets([{ reps: 0, weight: 0 }]);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Add Exercise</Text>
                    <TouchableOpacity onPress={handleClose}>
                        <X size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.exerciseNameSection}>
                        <Text style={styles.sectionTitle}>Exercise Name</Text>
                        <TextInput
                            style={styles.exerciseNameInput}
                            value={exerciseName}
                            onChangeText={setExerciseName}
                            placeholder="Enter exercise name (e.g., Push-ups, Squats)"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View style={styles.setsSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Sets</Text>
                            <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
                                <Plus size={20} color="#3B82F6" />
                                <Text style={styles.addSetText}>Add Set</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.setsHeader}>
                            <Text style={styles.setHeaderText}>Set</Text>
                            <Text style={styles.setHeaderText}>Weight (lbs)</Text>
                            <Text style={styles.setHeaderText}>Reps</Text>
                            <Text style={styles.setHeaderText}></Text>
                        </View>

                        {sets.map((set, index) => (
                            <View key={index} style={styles.setRow}>
                                <Text style={styles.setNumber}>{index + 1}</Text>

                                <View style={styles.inputContainer}>
                                    <TouchableOpacity
                                        style={styles.adjustButton}
                                        onPress={() => updateSet(index, 'weight', Math.max(0, set.weight - 5))}
                                    >
                                        <Minus size={16} color="#6B7280" />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={styles.input}
                                        value={set.weight.toString()}
                                        onChangeText={(text) => updateSet(index, 'weight', parseInt(text) || 0)}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                    <TouchableOpacity
                                        style={styles.adjustButton}
                                        onPress={() => updateSet(index, 'weight', set.weight + 5)}
                                    >
                                        <Plus size={16} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputContainer}>
                                    <TouchableOpacity
                                        style={styles.adjustButton}
                                        onPress={() => updateSet(index, 'reps', Math.max(0, set.reps - 1))}
                                    >
                                        <Minus size={16} color="#6B7280" />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={styles.input}
                                        value={set.reps.toString()}
                                        onChangeText={(text) => updateSet(index, 'reps', parseInt(text) || 0)}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                    <TouchableOpacity
                                        style={styles.adjustButton}
                                        onPress={() => updateSet(index, 'reps', set.reps + 1)}
                                    >
                                        <Plus size={16} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.removeButton, sets.length === 1 && styles.disabledButton]}
                                    onPress={() => removeSet(index)}
                                    disabled={sets.length === 1}
                                >
                                    <X size={16} color={sets.length === 1 ? "#D1D5DB" : "#EF4444"} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Check size={20} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>Save Exercise</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
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
    title: {
        fontSize: 20,
        fontFamily: 'Poppins-SemiBold',
        color: '#1F2937',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    exerciseNameSection: {
        marginTop: 24,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#374151',
        marginBottom: 12,
    },
    exerciseNameInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#1F2937',
    },
    setsSection: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    addSetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
    },
    addSetText: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: '#3B82F6',
        marginLeft: 4,
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
    removeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    disabledButton: {
        backgroundColor: '#F9FAFB',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#374151',
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: '#10B981',
    },
    saveButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#FFFFFF',
        marginLeft: 8,
    },
});
