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
    console.error('Gemini API key not available or not configured.');
    throw new Error(
      'Gemini API key not available. Please configure it in your .env file.'
    );
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
    // Re-throw the error to be handled by the caller
    throw new Error(
      `Failed to generate workout plan: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
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
    // return createFallbackWorkoutPlan(request);
    console.error(
      'Failed to parse workout response and no exercises were extracted.'
    );
    throw new Error(
      'Failed to parse the workout plan from the AI response. The response might be malformed or empty.'
    );
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
