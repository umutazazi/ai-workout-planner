import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment variables
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
  console.warn(
    'EXPO_PUBLIC_GEMINI_API_KEY is not set. Please add your Gemini API key to the .env file.'
  );
}

const genAI =
  API_KEY && API_KEY !== 'your_gemini_api_key_here'
    ? new GoogleGenerativeAI(API_KEY)
    : null;

export interface WorkoutRequest {
  daysPerWeek: number;
  goal: string;
  fitnessLevel?: string;
  equipment?: string;
  timePerSession?: number;
  macroGoals?: {
    protein: number; // grams per day
    carbs: number; // grams per day
    fats: number; // grams per day
    calories: number; // total calories per day
  };
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  description?: string;
  targetMuscles?: string[];
}

export interface DayWorkout {
  day: number;
  name: string;
  focus: string;
  exercises: Exercise[];
  estimatedDuration: string;
}

export interface AIWorkoutPlan {
  id: string;
  daysPerWeek: number;
  goal: string;
  createdAt: string;
  exercises: DayWorkout[];
  totalWeeks: number;
  progressionNotes: string;
  macroGoals?: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
  nutritionTips?: string[];
}

export async function generateWorkoutPlan(
  request: WorkoutRequest
): Promise<AIWorkoutPlan> {
  // If no API key is available, return fallback workout
  if (!genAI || !API_KEY || API_KEY === 'your_gemini_api_key_here') {
    console.warn('Gemini API key not available, using fallback workout');
    return createFallbackWorkoutPlan(request);
  }

  const prompt = createWorkoutPrompt(request);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response from Gemini AI');
    }

    return parseWorkoutResponse(text, request);
  } catch (error) {
    console.error('Error generating workout plan:', error);

    // Return fallback workout instead of throwing error
    console.warn('Using fallback workout due to API error');
    return createFallbackWorkoutPlan(request);
  }
}

function createWorkoutPrompt(request: WorkoutRequest): string {
  const {
    daysPerWeek,
    goal,
    fitnessLevel = 'intermediate',
    timePerSession = 50,
    macroGoals,
  } = request;

  const macroSection = macroGoals
    ? `
NUTRITION GOALS:
- Daily Calories: ${macroGoals.calories}
- Protein: ${macroGoals.protein}g (${Math.round(
        ((macroGoals.protein * 4) / macroGoals.calories) * 100
      )}% of calories)
- Carbohydrates: ${macroGoals.carbs}g (${Math.round(
        ((macroGoals.carbs * 4) / macroGoals.calories) * 100
      )}% of calories)
- Fats: ${macroGoals.fats}g (${Math.round(
        ((macroGoals.fats * 9) / macroGoals.calories) * 100
      )}% of calories)

Please provide nutrition guidance that aligns with these macro targets and the fitness goal of ${goal}.`
    : '';

  return `You are a professional fitness trainer with 15+ years of experience. Create a comprehensive ${daysPerWeek}-day per week workout plan for ${goal.toLowerCase()}.

REQUIREMENTS:
- ${daysPerWeek} workout days per week
- Primary goal: ${goal}
- Fitness level: ${fitnessLevel}
- Each workout should be ${timePerSession} minutes
- Focus on bodyweight exercises (no equipment needed)
- Include proper rest periods between sets
- Emphasize compound movements and functional fitness
${macroSection}

STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:

Day 1: [Workout Name]
Focus: [Primary muscle groups/training focus]
Duration: [time estimate]

Exercise 1: [Exercise Name]
- Sets: [number] sets of [reps/time]
- Rest: [rest period]
- Target: [muscle groups]

Exercise 2: [Exercise Name]
- Sets: [number] sets of [reps/time]
- Rest: [rest period]
- Target: [muscle groups]

[Continue with 4-6 exercises per day]

Day 2: [Workout Name]
[Follow same format]

[Continue for all ${daysPerWeek} days]

PROGRESSION NOTES:
[Provide specific tips for advancing the workout over time]

${
  macroGoals
    ? `
NUTRITION TIPS:
[Provide 3-5 specific nutrition tips to help achieve the macro targets and fitness goal. Include meal timing, food suggestions, and hydration advice.]
`
    : ''
}

Make the workout challenging but achievable for ${fitnessLevel} level. Include exercise variations and form cues where helpful. Ensure each exercise has a clear name, sets count, reps specification, and rest period.`;
}

function parseWorkoutResponse(
  response: string,
  request: WorkoutRequest
): AIWorkoutPlan {
  const lines = response.split('\n').filter((line) => line.trim());
  const exercises: DayWorkout[] = [];
  let currentDay: DayWorkout | null = null;
  let progressionNotes = '';
  let nutritionTips: string[] = [];
  let isProgressionSection = false;
  let isNutritionSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for nutrition tips section
    if (
      line.toLowerCase().includes('nutrition') &&
      line.toLowerCase().includes('tips') &&
      line.includes(':')
    ) {
      isNutritionSection = true;
      isProgressionSection = false;
      continue;
    }

    // Check for progression notes section
    if (line.toLowerCase().includes('progression') && line.includes(':')) {
      isProgressionSection = true;
      isNutritionSection = false;
      continue;
    }

    if (isNutritionSection) {
      if (line.length > 10 && !line.toLowerCase().startsWith('day')) {
        // Clean up the nutrition tip
        const tip = line.replace(/^[-•*]\s*/, '').trim();
        if (tip) {
          nutritionTips.push(tip);
        }
      }
      continue;
    }

    if (isProgressionSection) {
      if (
        !line.toLowerCase().includes('nutrition') &&
        !line.toLowerCase().startsWith('day')
      ) {
        progressionNotes += line + ' ';
      }
      continue;
    }

    // Check if this is a day header
    if (line.toLowerCase().startsWith('day') && line.includes(':')) {
      if (currentDay) {
        exercises.push(currentDay);
      }

      const dayMatch = line.match(/day\s+(\d+):\s*(.+)/i);
      if (dayMatch) {
        const dayNumber = parseInt(dayMatch[1]);
        const dayName = dayMatch[2].trim();

        // Look ahead for focus and duration
        let focus = '';
        let duration = '45-60 min';

        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const nextLine = lines[j].trim().toLowerCase();
          if (nextLine.startsWith('focus:')) {
            focus = lines[j].trim().substring(6).trim();
          } else if (nextLine.startsWith('duration:')) {
            duration = lines[j].trim().substring(9).trim();
          }
        }

        currentDay = {
          day: dayNumber,
          name: `Day ${dayNumber}: ${dayName}`,
          focus: focus || dayName,
          exercises: [],
          estimatedDuration: duration,
        };
      }
    }
    // Check if this is an exercise line (but not sets/rest/target lines)
    else if (
      currentDay &&
      (line.toLowerCase().startsWith('exercise') ||
        (line.match(/^[-•]\s*\w/) &&
          !line.toLowerCase().includes('sets:') &&
          !line.toLowerCase().includes('rest:') &&
          !line.toLowerCase().includes('target:') &&
          !line.toLowerCase().startsWith('- sets:') &&
          !line.toLowerCase().startsWith('- rest:') &&
          !line.toLowerCase().startsWith('- target:')))
    ) {
      const exercise = parseExerciseBlock(lines, i);
      if (exercise) {
        currentDay.exercises.push(exercise);
      }
    }
  }

  // Add the last day if it exists
  if (currentDay) {
    exercises.push(currentDay);
  }

  // If parsing failed, create a fallback workout
  if (exercises.length === 0) {
    return createFallbackWorkoutPlan(request);
  }

  return {
    id: Date.now().toString(),
    daysPerWeek: request.daysPerWeek,
    goal: request.goal,
    createdAt: new Date().toISOString(),
    exercises: exercises.slice(0, request.daysPerWeek),
    totalWeeks: 4,
    progressionNotes:
      progressionNotes.trim() ||
      'Increase difficulty by adding more reps, sets, or reducing rest time as you get stronger.',
    macroGoals: request.macroGoals,
    nutritionTips: nutritionTips.length > 0 ? nutritionTips : undefined,
  };
}

function parseExerciseBlock(
  lines: string[],
  startIndex: number
): Exercise | null {
  try {
    const exerciseLine = lines[startIndex].trim();

    // Extract exercise name
    let name = '';
    if (exerciseLine.toLowerCase().startsWith('exercise')) {
      const nameMatch = exerciseLine.match(/exercise\s+\d+:\s*(.+)/i);
      name = nameMatch?.[1]?.trim() || '';
    } else {
      name = exerciseLine.replace(/^[-•]\s*/, '').trim();
    }

    if (!name) return null;

    let sets = 3;
    let reps = '12';
    let rest = '60s';
    let targetMuscles: string[] = [];
    let description = 'Focus on proper form and controlled movement';

    // Look at the next few lines for exercise details
    for (
      let i = startIndex + 1;
      i < Math.min(startIndex + 10, lines.length);
      i++
    ) {
      const line = lines[i].trim().toLowerCase();

      // Stop if we hit another exercise or day
      if (line.startsWith('exercise') || line.startsWith('day')) {
        break;
      }

      if (line.startsWith('- sets:') || line.startsWith('sets:')) {
        const setsMatch = line.match(/(\d+)\s*sets?\s*of\s*([^,\n]+)/i);
        if (setsMatch) {
          sets = parseInt(setsMatch[1]);
          reps = setsMatch[2].trim();
        }
      } else if (line.startsWith('- rest:') || line.startsWith('rest:')) {
        const restMatch = line.match(/rest:\s*([^,\n]+)/i);
        if (restMatch) {
          rest = restMatch[1].trim();
        }
      } else if (line.startsWith('- target:') || line.startsWith('target:')) {
        const targetMatch = line.match(/target:\s*([^,\n]+)/i);
        if (targetMatch) {
          targetMuscles = [targetMatch[1].trim()];
          description = targetMatch[1].trim();
        }
      }
    }

    return {
      name,
      sets,
      reps,
      rest,
      description,
      targetMuscles,
    };
  } catch (error) {
    console.error('Error parsing exercise block:', error);
    return null;
  }
}

function createFallbackWorkoutPlan(request: WorkoutRequest): AIWorkoutPlan {
  const { daysPerWeek, goal } = request;

  const fatBurnWorkouts = [
    {
      day: 1,
      name: 'Day 1: HIIT Cardio Blast',
      focus: 'High-Intensity Interval Training',
      exercises: [
        {
          name: 'Burpees',
          sets: 4,
          reps: '15',
          rest: '45s',
          description: 'Full body explosive movement',
          targetMuscles: ['Full Body'],
        },
        {
          name: 'Mountain Climbers',
          sets: 4,
          reps: '30s',
          rest: '30s',
          description: 'Core and cardio intensive',
          targetMuscles: ['Core', 'Shoulders'],
        },
        {
          name: 'Jump Squats',
          sets: 4,
          reps: '20',
          rest: '45s',
          description: 'Explosive lower body power',
          targetMuscles: ['Legs', 'Glutes'],
        },
        {
          name: 'High Knees',
          sets: 4,
          reps: '30s',
          rest: '30s',
          description: 'Cardio and leg activation',
          targetMuscles: ['Legs', 'Core'],
        },
        {
          name: 'Plank Jacks',
          sets: 3,
          reps: '45s',
          rest: '60s',
          description: 'Core stability with cardio',
          targetMuscles: ['Core', 'Shoulders'],
        },
      ],
      estimatedDuration: '45 min',
    },
    {
      day: 2,
      name: 'Day 2: Full Body Circuit',
      focus: 'Metabolic Conditioning',
      exercises: [
        {
          name: 'Push-ups',
          sets: 3,
          reps: '12-15',
          rest: '45s',
          description: 'Upper body strength',
          targetMuscles: ['Chest', 'Triceps'],
        },
        {
          name: 'Bodyweight Squats',
          sets: 3,
          reps: '20',
          rest: '45s',
          description: 'Lower body endurance',
          targetMuscles: ['Legs', 'Glutes'],
        },
        {
          name: 'Lunges',
          sets: 3,
          reps: '12 each leg',
          rest: '60s',
          description: 'Unilateral leg strength',
          targetMuscles: ['Legs', 'Glutes'],
        },
        {
          name: 'Pike Push-ups',
          sets: 3,
          reps: '10',
          rest: '60s',
          description: 'Shoulder focused movement',
          targetMuscles: ['Shoulders', 'Triceps'],
        },
        {
          name: 'Russian Twists',
          sets: 3,
          reps: '30',
          rest: '45s',
          description: 'Rotational core strength',
          targetMuscles: ['Core', 'Obliques'],
        },
      ],
      estimatedDuration: '50 min',
    },
    {
      day: 3,
      name: 'Day 3: Cardio Intervals',
      focus: 'Fat Burning Intervals',
      exercises: [
        {
          name: 'Jumping Jacks',
          sets: 5,
          reps: '45s',
          rest: '15s',
          description: 'Full body cardio warm-up',
          targetMuscles: ['Full Body'],
        },
        {
          name: 'Squat Jumps',
          sets: 4,
          reps: '30s',
          rest: '30s',
          description: 'Explosive leg power',
          targetMuscles: ['Legs', 'Glutes'],
        },
        {
          name: 'Push-up Burpees',
          sets: 4,
          reps: '12',
          rest: '60s',
          description: 'Ultimate fat burner',
          targetMuscles: ['Full Body'],
        },
        {
          name: 'Bicycle Crunches',
          sets: 4,
          reps: '40',
          rest: '45s',
          description: 'Dynamic core work',
          targetMuscles: ['Core', 'Obliques'],
        },
        {
          name: 'Wall Sit',
          sets: 3,
          reps: '60s',
          rest: '90s',
          description: 'Isometric leg endurance',
          targetMuscles: ['Legs', 'Glutes'],
        },
      ],
      estimatedDuration: '40 min',
    },
    {
      day: 4,
      name: 'Day 4: Upper Body Focus',
      focus: 'Upper Body Strength',
      exercises: [
        {
          name: 'Diamond Push-ups',
          sets: 3,
          reps: '10',
          rest: '60s',
          description: 'Tricep focused variation',
          targetMuscles: ['Triceps', 'Chest'],
        },
        {
          name: 'Wide Push-ups',
          sets: 3,
          reps: '12',
          rest: '60s',
          description: 'Chest focused variation',
          targetMuscles: ['Chest', 'Shoulders'],
        },
        {
          name: 'Pike Push-ups',
          sets: 3,
          reps: '8',
          rest: '60s',
          description: 'Shoulder development',
          targetMuscles: ['Shoulders'],
        },
        {
          name: 'Tricep Dips',
          sets: 3,
          reps: '15',
          rest: '60s',
          description: 'Tricep isolation',
          targetMuscles: ['Triceps'],
        },
        {
          name: 'Plank Up-Downs',
          sets: 3,
          reps: '10',
          rest: '60s',
          description: 'Dynamic core and arms',
          targetMuscles: ['Core', 'Arms'],
        },
      ],
      estimatedDuration: '45 min',
    },
    {
      day: 5,
      name: 'Day 5: Lower Body Power',
      focus: 'Lower Body Strength',
      exercises: [
        {
          name: 'Jump Squats',
          sets: 4,
          reps: '15',
          rest: '60s',
          description: 'Explosive leg power',
          targetMuscles: ['Legs', 'Glutes'],
        },
        {
          name: 'Single Leg Squats',
          sets: 3,
          reps: '8 each leg',
          rest: '90s',
          description: 'Unilateral strength',
          targetMuscles: ['Legs', 'Glutes'],
        },
        {
          name: 'Reverse Lunges',
          sets: 3,
          reps: '12 each leg',
          rest: '60s',
          description: 'Posterior chain focus',
          targetMuscles: ['Glutes', 'Hamstrings'],
        },
        {
          name: 'Calf Raises',
          sets: 3,
          reps: '20',
          rest: '45s',
          description: 'Calf strengthening',
          targetMuscles: ['Calves'],
        },
        {
          name: 'Glute Bridges',
          sets: 3,
          reps: '20',
          rest: '45s',
          description: 'Glute activation',
          targetMuscles: ['Glutes', 'Hamstrings'],
        },
      ],
      estimatedDuration: '50 min',
    },
    {
      day: 6,
      name: 'Day 6: Active Recovery',
      focus: 'Mobility and Light Movement',
      exercises: [
        {
          name: 'Cat-Cow Stretches',
          sets: 2,
          reps: '15',
          rest: '30s',
          description: 'Spinal mobility',
          targetMuscles: ['Back', 'Core'],
        },
        {
          name: 'Arm Circles',
          sets: 2,
          reps: '20 each direction',
          rest: '30s',
          description: 'Shoulder mobility',
          targetMuscles: ['Shoulders'],
        },
        {
          name: 'Leg Swings',
          sets: 2,
          reps: '15 each leg',
          rest: '30s',
          description: 'Hip mobility',
          targetMuscles: ['Hips', 'Legs'],
        },
        {
          name: 'Gentle Squats',
          sets: 2,
          reps: '15',
          rest: '30s',
          description: 'Light movement',
          targetMuscles: ['Legs'],
        },
        {
          name: 'Walking in Place',
          sets: 3,
          reps: '2 minutes',
          rest: '60s',
          description: 'Light cardio',
          targetMuscles: ['Full Body'],
        },
      ],
      estimatedDuration: '30 min',
    },
  ];

  const muscleGainWorkouts = [
    {
      day: 1,
      name: 'Day 1: Upper Body Strength',
      focus: 'Chest, Shoulders, Triceps',
      exercises: [
        {
          name: 'Diamond Push-ups',
          sets: 4,
          reps: '8-12',
          rest: '90s',
          description: 'Tricep focused push-up variation',
          targetMuscles: ['Triceps', 'Chest'],
        },
        {
          name: 'Pike Push-ups',
          sets: 4,
          reps: '10-12',
          rest: '90s',
          description: 'Shoulder development exercise',
          targetMuscles: ['Shoulders', 'Triceps'],
        },
        {
          name: 'Wide-Grip Push-ups',
          sets: 3,
          reps: '12-15',
          rest: '75s',
          description: 'Chest focused variation',
          targetMuscles: ['Chest', 'Shoulders'],
        },
        {
          name: 'Tricep Dips',
          sets: 3,
          reps: '12-15',
          rest: '75s',
          description: 'Isolated tricep strength',
          targetMuscles: ['Triceps'],
        },
        {
          name: 'Plank to Push-up',
          sets: 3,
          reps: '10',
          rest: '90s',
          description: 'Dynamic core and upper body',
          targetMuscles: ['Core', 'Shoulders'],
        },
      ],
      estimatedDuration: '55 min',
    },
    {
      day: 2,
      name: 'Day 2: Lower Body Power',
      focus: 'Legs, Glutes, Core',
      exercises: [
        {
          name: 'Pistol Squats',
          sets: 4,
          reps: '6-8 each leg',
          rest: '120s',
          description: 'Advanced single-leg strength',
          targetMuscles: ['Legs', 'Glutes'],
        },
        {
          name: 'Bulgarian Split Squats',
          sets: 4,
          reps: '12 each leg',
          rest: '90s',
          description: 'Unilateral leg development',
          targetMuscles: ['Legs', 'Glutes'],
        },
        {
          name: 'Single-leg Glute Bridges',
          sets: 3,
          reps: '15 each leg',
          rest: '60s',
          description: 'Glute activation and strength',
          targetMuscles: ['Glutes', 'Hamstrings'],
        },
        {
          name: 'Jump Lunges',
          sets: 3,
          reps: '20 total',
          rest: '75s',
          description: 'Explosive leg power',
          targetMuscles: ['Legs', 'Glutes'],
        },
        {
          name: 'Wall Sit',
          sets: 3,
          reps: '60s',
          rest: '90s',
          description: 'Isometric leg endurance',
          targetMuscles: ['Legs', 'Glutes'],
        },
      ],
      estimatedDuration: '50 min',
    },
    {
      day: 3,
      name: 'Day 3: Pull & Core',
      focus: 'Back, Biceps, Core',
      exercises: [
        {
          name: 'Superman',
          sets: 4,
          reps: '15',
          rest: '60s',
          description: 'Lower back strengthening',
          targetMuscles: ['Lower Back', 'Glutes'],
        },
        {
          name: 'Reverse Snow Angels',
          sets: 3,
          reps: '20',
          rest: '60s',
          description: 'Upper back activation',
          targetMuscles: ['Upper Back', 'Rear Delts'],
        },
        {
          name: 'Hollow Body Hold',
          sets: 4,
          reps: '30s',
          rest: '60s',
          description: 'Core stability and strength',
          targetMuscles: ['Core'],
        },
        {
          name: 'Dead Bug',
          sets: 3,
          reps: '10 each side',
          rest: '45s',
          description: 'Core stability exercise',
          targetMuscles: ['Core'],
        },
        {
          name: 'Bear Crawl',
          sets: 3,
          reps: '30s',
          rest: '90s',
          description: 'Full body coordination',
          targetMuscles: ['Core', 'Shoulders'],
        },
      ],
      estimatedDuration: '45 min',
    },
    {
      day: 4,
      name: 'Day 4: Push Focus',
      focus: 'Chest, Shoulders, Triceps',
      exercises: [
        {
          name: 'Archer Push-ups',
          sets: 4,
          reps: '6 each side',
          rest: '120s',
          description: 'Advanced unilateral push',
          targetMuscles: ['Chest', 'Triceps'],
        },
        {
          name: 'Handstand Push-ups',
          sets: 3,
          reps: '5-8',
          rest: '120s',
          description: 'Advanced shoulder strength',
          targetMuscles: ['Shoulders', 'Triceps'],
        },
        {
          name: 'Decline Push-ups',
          sets: 3,
          reps: '12',
          rest: '90s',
          description: 'Upper chest focus',
          targetMuscles: ['Upper Chest', 'Shoulders'],
        },
        {
          name: 'Hindu Push-ups',
          sets: 3,
          reps: '10',
          rest: '90s',
          description: 'Dynamic full body push',
          targetMuscles: ['Chest', 'Shoulders', 'Core'],
        },
        {
          name: 'Pseudo Planche Push-ups',
          sets: 2,
          reps: '5-8',
          rest: '120s',
          description: 'Advanced strength move',
          targetMuscles: ['Chest', 'Shoulders', 'Core'],
        },
      ],
      estimatedDuration: '60 min',
    },
    {
      day: 5,
      name: 'Day 5: Leg Strength',
      focus: 'Quadriceps, Glutes, Hamstrings',
      exercises: [
        {
          name: 'Shrimp Squats',
          sets: 4,
          reps: '5 each leg',
          rest: '120s',
          description: 'Advanced single leg squat',
          targetMuscles: ['Legs', 'Glutes'],
        },
        {
          name: 'Dragon Squats',
          sets: 3,
          reps: '8 each leg',
          rest: '90s',
          description: 'Lateral leg strength',
          targetMuscles: ['Legs', 'Glutes'],
        },
        {
          name: 'Single Leg Romanian Deadlifts',
          sets: 3,
          reps: '12 each leg',
          rest: '90s',
          description: 'Hamstring and glute focus',
          targetMuscles: ['Hamstrings', 'Glutes'],
        },
        {
          name: 'Cossack Squats',
          sets: 3,
          reps: '10 each side',
          rest: '75s',
          description: 'Lateral mobility and strength',
          targetMuscles: ['Legs', 'Glutes'],
        },
        {
          name: 'Single Leg Calf Raises',
          sets: 3,
          reps: '20 each leg',
          rest: '60s',
          description: 'Calf strengthening',
          targetMuscles: ['Calves'],
        },
      ],
      estimatedDuration: '55 min',
    },
    {
      day: 6,
      name: 'Day 6: Full Body Integration',
      focus: 'Compound Movements',
      exercises: [
        {
          name: 'Burpee Muscle-ups',
          sets: 4,
          reps: '8',
          rest: '120s',
          description: 'Full body explosive movement',
          targetMuscles: ['Full Body'],
        },
        {
          name: 'Turkish Get-ups',
          sets: 3,
          reps: '5 each side',
          rest: '120s',
          description: 'Full body coordination',
          targetMuscles: ['Full Body'],
        },
        {
          name: 'Man Makers',
          sets: 3,
          reps: '10',
          rest: '90s',
          description: 'Complex full body exercise',
          targetMuscles: ['Full Body'],
        },
        {
          name: 'Mountain Climber Push-ups',
          sets: 3,
          reps: '15',
          rest: '90s',
          description: 'Dynamic full body',
          targetMuscles: ['Full Body'],
        },
        {
          name: 'Sprawls',
          sets: 3,
          reps: '20',
          rest: '75s',
          description: 'Explosive conditioning',
          targetMuscles: ['Full Body'],
        },
      ],
      estimatedDuration: '60 min',
    },
  ];

  const baseWorkouts =
    goal === 'Fat Burn' ? fatBurnWorkouts : muscleGainWorkouts;
  const selectedWorkouts = baseWorkouts.slice(0, daysPerWeek);

  return {
    id: Date.now().toString(),
    daysPerWeek: daysPerWeek,
    goal: goal,
    createdAt: new Date().toISOString(),
    exercises: selectedWorkouts,
    totalWeeks: 4,
    progressionNotes:
      goal === 'Fat Burn'
        ? 'Increase workout intensity by reducing rest periods, adding more rounds, or increasing exercise duration. Focus on maintaining proper form while pushing your cardiovascular limits.'
        : 'Progress by increasing reps, adding more challenging exercise variations, or reducing rest time. Focus on progressive overload - gradually make each workout more challenging than the last.',
    macroGoals: request.macroGoals,
    nutritionTips: request.macroGoals
      ? [
          'Eat protein within 30 minutes after your workout to support muscle recovery',
          'Stay hydrated by drinking at least 8-10 glasses of water daily',
          'Include complex carbohydrates in your pre-workout meal for sustained energy',
          "Don't skip meals - consistent nutrition supports your fitness goals",
          'Consider meal prep to stay consistent with your macro targets',
        ]
      : undefined,
  };
}
