import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Vibration,
} from 'react-native';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react-native';

interface RestTimerProps {
    isVisible: boolean;
    restDuration: number; // in seconds
    onComplete: () => void;
    onSkip: () => void;
    onDismiss: () => void;
}

export function RestTimer({
    isVisible,
    restDuration,
    onComplete,
    onSkip,
    onDismiss
}: RestTimerProps) {
    const [timeLeft, setTimeLeft] = useState(restDuration);
    const [isRunning, setIsRunning] = useState(true);
    const [progress, setProgress] = useState(1);
    const intervalRef = useRef<number | null>(null);
    const animatedValue = useRef(new Animated.Value(0));
    const pulseAnim = useRef(new Animated.Value(1));

    useEffect(() => {
        if (isVisible) {
            setTimeLeft(restDuration);
            setProgress(1);
            setIsRunning(true);

            // Start entrance animation
            Animated.spring(animatedValue.current, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }).start();
        } else {
            // Reset when hidden
            animatedValue.current.setValue(0);
            setIsRunning(false);
        }
    }, [isVisible, restDuration]);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    const newTime = prev - 1;
                    setProgress(newTime / restDuration);

                    // Pulse animation when less than 10 seconds
                    if (newTime <= 10 && newTime > 0) {
                        Animated.sequence([
                            Animated.timing(pulseAnim.current, {
                                toValue: 1.1,
                                duration: 150,
                                useNativeDriver: true,
                            }),
                            Animated.timing(pulseAnim.current, {
                                toValue: 1,
                                duration: 150,
                                useNativeDriver: true,
                            }),
                        ]).start();
                    }

                    if (newTime <= 0) {
                        // Timer completed
                        Vibration.vibrate([100, 100, 100]); // Triple vibration
                        onComplete();
                        return 0;
                    }

                    return newTime;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, timeLeft, restDuration, onComplete]);

    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setTimeLeft(restDuration);
        setProgress(1);
        setIsRunning(true);
    };

    const addTime = (seconds: number) => {
        setTimeLeft(prev => {
            const newTime = prev + seconds;
            setProgress(newTime / restDuration);
            return newTime;
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}`;
    };

    const getTimerColor = () => {
        if (timeLeft <= 10) return '#EF4444'; // Red
        if (timeLeft <= 30) return '#F97316'; // Orange
        return '#10B981'; // Green
    };

    if (!isVisible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ scale: animatedValue.current }],
                    opacity: animatedValue.current,
                }
            ]}
        >
            <View style={styles.timerContainer}>        {/* Circular Progress */}
                <View style={styles.circularProgress}>
                    <View style={[styles.progressRing, { borderColor: '#F3F4F6' }]} />
                    <View
                        style={[
                            styles.progressRing,
                            {
                                borderColor: getTimerColor(),
                                borderRightColor: 'transparent',
                                borderBottomColor: 'transparent',
                                transform: [{ rotate: `${progress * 360}deg` }],
                            }
                        ]}
                    />

                    <Animated.View
                        style={[
                            styles.timerText,
                            { transform: [{ scale: pulseAnim.current }] }
                        ]}
                    >
                        <Text style={[styles.timeDisplay, { color: getTimerColor() }]}>
                            {formatTime(timeLeft)}
                        </Text>
                        <Text style={styles.timerLabel}>Rest Time</Text>
                    </Animated.View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.controlButton, styles.secondaryButton]}
                        onPress={resetTimer}
                    >
                        <RotateCcw size={20} color="#6B7280" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, styles.primaryButton]}
                        onPress={toggleTimer}
                    >
                        {isRunning ? (
                            <Pause size={24} color="#FFFFFF" />
                        ) : (
                            <Play size={24} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, styles.secondaryButton]}
                        onPress={onSkip}
                    >
                        <SkipForward size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Quick Add Time */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.quickButton}
                        onPress={() => addTime(15)}
                    >
                        <Text style={styles.quickButtonText}>+15s</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickButton}
                        onPress={() => addTime(30)}
                    >
                        <Text style={styles.quickButtonText}>+30s</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickButton}
                        onPress={() => addTime(-15)}
                    >
                        <Text style={styles.quickButtonText}>-15s</Text>
                    </TouchableOpacity>
                </View>

                {/* Status */}
                <Text style={styles.statusText}>
                    {isRunning ? 'Resting...' : 'Paused'}
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    timerContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        minWidth: 280,
    }, circularProgress: {
        width: 160,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        position: 'relative',
    }, progressRing: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 8,
        borderColor: '#F3F4F6',
        backgroundColor: 'transparent',
    },
    timerText: {
        alignItems: 'center',
    },
    timeDisplay: {
        fontSize: 32,
        fontFamily: 'Poppins-Bold',
        marginBottom: 4,
    },
    timerLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: '#6B7280',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    controlButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        shadowColor: '#3B82F6',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    secondaryButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    quickButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    quickButtonText: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        color: '#6B7280',
    },
    statusText: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        color: '#6B7280',
    },
});
