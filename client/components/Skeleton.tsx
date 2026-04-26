import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export const SkeletonCircle = ({ size, style }: { size: number; style?: any }) => {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
};

export const SkeletonRect = ({ width, height, borderRadius = 4, style }: SkeletonProps) => {
  return <Skeleton width={width} height={height} borderRadius={borderRadius} style={style} />;
};

const Skeleton = ({ width, height, borderRadius, style }: SkeletonProps) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          width,
          height,
          borderRadius,
          backgroundColor: 'rgba(150, 150, 150, 0.2)',
          opacity: pulseAnim,
        },
      ]}
    />
  );
};

export default Skeleton;
