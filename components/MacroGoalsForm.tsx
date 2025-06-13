import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
} from 'react-native';
import { Calculator, Target, TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MacroGoalsFormProps {
    onComplete: (macroGoals: {
        protein: number;
        carbs: number;
        fats: number;
        calories: number;
    }) => void;
    onSkip: () => void;
}

export function MacroGoalsForm({ onComplete, onSkip }: MacroGoalsFormProps) {
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fats, setFats] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [activityLevel, setActivityLevel] = useState('moderate');
    const [gender, setGender] = useState('male');
    const insets = useSafeAreaInsets();

    const calculateMacros = () => {
        if (!age || !weight || !height) return;

        const ageNum = parseInt(age);
        const weightNum = parseFloat(weight);
        const heightNum = parseFloat(height);

        // Calculate BMR using Mifflin-St Jeor Equation
        let bmr;
        if (gender === 'male') {
            bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
        } else {
            bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
        }

        // Apply activity factor
        const activityFactors = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9,
        };

        const totalCalories = Math.round(bmr * activityFactors[activityLevel as keyof typeof activityFactors]);

        // Calculate macros (moderate approach)
        const proteinGrams = Math.round(weightNum * 2.2); // 1g per lb
        const fatGrams = Math.round(totalCalories * 0.25 / 9); // 25% of calories from fat
        const carbGrams = Math.round((totalCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4);

        setCalories(totalCalories.toString());
        setProtein(proteinGrams.toString());
        setCarbs(carbGrams.toString());
        setFats(fatGrams.toString());
    };

    const handleSubmit = () => {
        const macroGoals = {
            protein: parseInt(protein) || 0,
            carbs: parseInt(carbs) || 0,
            fats: parseInt(fats) || 0,
            calories: parseInt(calories) || 0,
        };
        onComplete(macroGoals);
    };

    const isValid = calories && protein && carbs && fats;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 8) + 80 }]}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <Target size={32} color="#3B82F6" />
                <Text style={styles.title}>Set Your Macro Goals</Text>
                <Text style={styles.subtitle}>
                    Define your daily nutrition targets to support your fitness goals
                </Text>
            </View>

            {/* Calculator Section */}
            <View style={styles.calculatorSection}>
                <View style={styles.sectionHeader}>
                    <Calculator size={20} color="#3B82F6" />
                    <Text style={styles.sectionTitle}>Auto-Calculate (Optional)</Text>
                </View>

                <View style={styles.row}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Age</Text>
                        <TextInput
                            style={styles.input}
                            value={age}
                            onChangeText={setAge}
                            placeholder="25"
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Weight (kg)</Text>
                        <TextInput
                            style={styles.input}
                            value={weight}
                            onChangeText={setWeight}
                            placeholder="70"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Height (cm)</Text>
                        <TextInput
                            style={styles.input}
                            value={height}
                            onChangeText={setHeight}
                            placeholder="175"
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.genderButtons}>
                            <TouchableOpacity
                                style={[styles.genderButton, gender === 'male' && styles.activeGender]}
                                onPress={() => setGender('male')}
                            >
                                <Text style={[styles.genderText, gender === 'male' && styles.activeGenderText]}>Male</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.genderButton, gender === 'female' && styles.activeGender]}
                                onPress={() => setGender('female')}
                            >
                                <Text style={[styles.genderText, gender === 'female' && styles.activeGenderText]}>Female</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Activity Level</Text>
                    <View style={styles.activityButtons}>
                        {[
                            { key: 'sedentary', label: 'Sedentary' },
                            { key: 'light', label: 'Light' },
                            { key: 'moderate', label: 'Moderate' },
                            { key: 'active', label: 'Active' },
                            { key: 'very_active', label: 'Very Active' },
                        ].map((option) => (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    styles.activityButton,
                                    activityLevel === option.key && styles.activeActivity
                                ]}
                                onPress={() => setActivityLevel(option.key)}
                            >
                                <Text style={[
                                    styles.activityText,
                                    activityLevel === option.key && styles.activeActivityText
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.calculateButton} onPress={calculateMacros}>
                    <Calculator size={16} color="#FFFFFF" />
                    <Text style={styles.calculateButtonText}>Calculate Macros</Text>
                </TouchableOpacity>
            </View>

            {/* Manual Entry Section */}
            <View style={styles.manualSection}>
                <View style={styles.sectionHeader}>
                    <TrendingUp size={20} color="#3B82F6" />
                    <Text style={styles.sectionTitle}>Your Daily Targets</Text>
                </View>

                <View style={styles.macroInputs}>
                    <View style={styles.macroInput}>
                        <Text style={styles.macroLabel}>Calories</Text>
                        <TextInput
                            style={styles.macroTextInput}
                            value={calories}
                            onChangeText={setCalories}
                            placeholder="2000"
                            keyboardType="numeric"
                        />
                        <Text style={styles.macroUnit}>kcal</Text>
                    </View>

                    <View style={styles.macroInput}>
                        <Text style={styles.macroLabel}>Protein</Text>
                        <TextInput
                            style={styles.macroTextInput}
                            value={protein}
                            onChangeText={setProtein}
                            placeholder="150"
                            keyboardType="numeric"
                        />
                        <Text style={styles.macroUnit}>g</Text>
                    </View>

                    <View style={styles.macroInput}>
                        <Text style={styles.macroLabel}>Carbs</Text>
                        <TextInput
                            style={styles.macroTextInput}
                            value={carbs}
                            onChangeText={setCarbs}
                            placeholder="200"
                            keyboardType="numeric"
                        />
                        <Text style={styles.macroUnit}>g</Text>
                    </View>

                    <View style={styles.macroInput}>
                        <Text style={styles.macroLabel}>Fats</Text>
                        <TextInput
                            style={styles.macroTextInput}
                            value={fats}
                            onChangeText={setFats}
                            placeholder="65"
                            keyboardType="numeric"
                        />
                        <Text style={styles.macroUnit}>g</Text>
                    </View>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                    <Text style={styles.skipButtonText}>Skip for Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.continueButton, !isValid && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={!isValid}
                >
                    <Text style={[styles.continueButtonText, !isValid && styles.disabledButtonText]}>
                        Continue
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Poppins-Bold',
        color: '#1F2937',
        marginTop: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 24,
    },
    calculatorSection: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        color: '#1F2937',
        marginLeft: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    inputGroup: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        backgroundColor: '#FFFFFF',
    },
    genderButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    genderButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    activeGender: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    genderText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: '#6B7280',
    },
    activeGenderText: {
        color: '#FFFFFF',
    },
    activityButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    activityButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },
    activeActivity: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    activityText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: '#6B7280',
    },
    activeActivityText: {
        color: '#FFFFFF',
    },
    calculateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    calculateButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#FFFFFF',
        marginLeft: 8,
    },
    manualSection: {
        marginBottom: 32,
    },
    macroInputs: {
        gap: 16,
    },
    macroInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    macroLabel: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#1F2937',
        width: 80,
    },
    macroTextInput: {
        flex: 1,
        fontSize: 18,
        fontFamily: 'Inter-Medium',
        color: '#1F2937',
        textAlign: 'center',
        paddingVertical: 4,
    },
    macroUnit: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: '#6B7280',
        width: 40,
        textAlign: 'right',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    skipButton: {
        flex: 1,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    skipButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#6B7280',
    },
    continueButton: {
        flex: 1,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 12,
    },
    disabledButton: {
        backgroundColor: '#D1D5DB',
    },
    continueButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#FFFFFF',
    },
    disabledButtonText: {
        color: '#9CA3AF',
    },
});
