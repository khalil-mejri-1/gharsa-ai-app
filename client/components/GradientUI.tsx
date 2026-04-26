import React from 'react';
import { Text, Platform, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface GradientTextProps {
  colors: readonly [string, string, ...string[]];
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

export function GradientText({ colors, children, style }: GradientTextProps) {
  if (Platform.OS === 'web') {
    return <Text style={[style, { color: colors[0] }]}>{children}</Text>;
  }
  return (
    <MaskedView maskElement={<Text style={style}>{children}</Text>}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

interface GradientIconProps {
  colors: readonly [string, string, ...string[]];
  name: any;
  size: number;
  library: any;
  style?: ViewStyle;
}

export function GradientIcon({ colors, name, size, library: IconLibrary, style }: GradientIconProps) {
  if (Platform.OS === 'web') {
    return <IconLibrary name={name} size={size} color={colors[0]} style={style} />;
  }
  return (
    <MaskedView maskElement={<IconLibrary name={name} size={size} color="white" style={style} />}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        <IconLibrary name={name} size={size} style={[style, { opacity: 0 }]} />
      </LinearGradient>
    </MaskedView>
  );
}
