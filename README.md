# Fitness Tracker App

A comprehensive React Native fitness tracking application built with Expo, featuring AI-powered workout generation, progress tracking, and macro nutrition monitoring.

## 🚀 Features

### 🤖 AI-Powered Workout Generation
- **Gemini AI Integration**: Personalized workout plans based on your goals, fitness level, and preferences
- **Smart Templates**: Expert-designed fallback templates when AI is unavailable
- **Customizable Parameters**: Days per week, fitness goals, session duration, and macro targets

### 💪 Workout Management
- **My Workouts**: Save and manage your workout routines
- **Exercise Cards**: Detailed exercise information with sets, reps, and rest periods
- **Workout Tracker**: Real-time workout tracking with timer functionality
- **Manual Exercise Entry**: Add custom exercises with weight and rep tracking

### 📊 Progress Tracking
- **Exercise Progress**: Track improvements over time for each exercise
- **Personal Records**: Monitor your best performances (weight, reps, time)
- **Session History**: Complete workout history with detailed statistics
- **Visual Progress**: Charts and graphs showing your fitness journey

### 🍎 Nutrition Tracking
- **Macro Goals**: Set daily targets for protein, carbs, fats, and calories
- **Daily Intake**: Track your nutrition throughout the day
- **Quick Add**: Fast macro entry with preset amounts
- **Auto-Calculator**: BMR-based macro calculation using personal stats
- **Progress Visualization**: Circular progress indicators and daily bars

### ⏱️ Rest Timer
- **Customizable Timers**: Set rest periods between exercises
- **Quick Timer Buttons**: Preset times for different workout types
- **Background Notifications**: Timer continues even when app is minimized

## 🛠️ Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Custom hooks with AsyncStorage
- **UI Components**: Custom styled components with Lucide React Native icons
- **Fonts**: Inter & Poppins font families
- **Gradients**: Expo Linear Gradient
- **AI Integration**: Google Gemini API
- **Storage**: AsyncStorage for local data persistence

## 📱 Installation Steps

### 1. Clone the repository
```bash
git clone <repository-url>
cd fitness-tracker-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:
```
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Start the development server
```bash
npm start
# or
expo start
```

### 5. Run on device/simulator
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app for physical device

## 🤖 AI Integration

The app integrates with Google's Gemini AI to generate personalized workout plans:

- **Smart Planning**: Analyzes user goals, fitness level, and preferences
- **Exercise Selection**: Chooses optimal exercises for target muscle groups
- **Progressive Overload**: Calculates appropriate sets, reps, and weights
- **Macro Integration**: Considers nutritional goals in workout planning
- **Fallback System**: Uses expert templates when AI is unavailable

## 🔧 Key Components

### Workout Creation Flow
1. **Days Selection**: Choose workout frequency (2-6 days per week)
2. **Goal Setting**: Select from Muscle Building, Weight Loss, or General Fitness
3. **Macro Goals**: Optional nutrition target setting with BMR calculator
4. **AI Generation**: Create personalized workout plan
5. **Save & Track**: Store workout for future use and tracking

### Progress Tracking Features
- **Exercise History**: View all previous sessions for each exercise
- **Personal Records**: Automatic detection and tracking of PRs
- **Progress Charts**: Visual representation of strength and endurance gains
- **Session Stats**: Detailed workout summaries with duration and volume

### Nutrition Monitoring
- **Daily Tracking**: Real-time macro and calorie monitoring
- **Goal Setting**: Customizable targets based on fitness goals
- **Quick Entry**: Fast macro logging with preset amounts
- **Auto-Reset**: Daily macro tracking with automatic midnight reset

### 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

### 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

**Built with ❤️ using React Native and Expo**
