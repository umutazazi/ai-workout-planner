import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface DailyProgressBarProps {
    current: number;
    target: number;
    label: string;
    color: string;
    unit?: string;
}

export function DailyProgressBar({ current, target, label, color, unit = '' }: DailyProgressBarProps) {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const isOverTarget = current > target;
    const remaining = Math.max(target - current, 0);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.values}>
                    {Math.round(current)}/{target}{unit}
                </Text>
            </View>

            {/* Add percentage display above the progress bar */}
            <Text style={[styles.percentageFixed, { color: isOverTarget ? '#EF4444' : color }]}>
                {Math.round(percentage)}%
            </Text>

            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                    <LinearGradient
                        colors={isOverTarget ? ['#EF4444', '#DC2626'] : [color, color]}
                        style={[
                            styles.progressFill,
                            {
                                height: `${Math.min(percentage, 100)}%`,
                                opacity: isOverTarget ? 0.8 : 1
                            }
                        ]}
                    />
                    {isOverTarget && (
                        <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            style={[
                                styles.overflowFill,
                                {
                                    height: `${Math.min((current / target) * 100 - 100, 20)}%`
                                }
                            ]}
                        />
                    )}
                </View>

                {/* Remove the old percentage container that was causing the problem */}
            </View>

            <View style={styles.footer}>
                <Text style={[styles.remaining, { color: isOverTarget ? '#EF4444' : '#6B7280' }]}>
                    {isOverTarget
                        ? `+${Math.round(current - target)}${unit} over`
                        : `${remaining}${unit} left`
                    }
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minWidth: 80,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 6,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: '#374151',
        marginBottom: 4,
    },
    values: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: '#6B7280',
    },
    // New fixed percentage text that won't move with the progress
    percentageFixed: {
        fontSize: 12,
        fontFamily: 'Inter-Bold',
        marginBottom: 4,
    },
    progressContainer: {
        height: 120,
        width: 20,
        position: 'relative',
        marginBottom: 12,
    },
    progressTrack: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    progressFill: {
        width: '100%',
        borderRadius: 10,
    },
    overflowFill: {
        width: '100%',
        position: 'absolute',
        top: 0,
        borderRadius: 10,
        opacity: 0.8,
    },
    // Remove the percentageContainer style
    footer: {
        alignItems: 'center',
    },
    remaining: {
        fontSize: 11,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
});