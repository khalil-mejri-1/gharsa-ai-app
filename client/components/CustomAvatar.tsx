import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const BACKGROUND_COLORS = [
  ['#FF8A65', '#D84315'],
  ['#4DB6AC', '#00695C'],
  ['#7986CB', '#283593'],
  ['#F06292', '#AD1457'],
  ['#BA68C8', '#6A1B9A'],
  ['#4DD0E1', '#00838F'],
  ['#AED581', '#558B2F'],
  ['#FFD54F', '#FF8F00'],
  ['#81C784', '#2E7D32'],
];

interface CustomAvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: any;
}

export default function CustomAvatar({ uri, name, size = 40, style }: CustomAvatarProps) {
  const isDefaultUnsplash = uri && typeof uri === 'string' && uri.includes('unsplash.com');
  const hasValidUri = uri && typeof uri === 'string' && uri.trim().length > 0 && !isDefaultUnsplash;

  if (hasValidUri) {
    return (
      <Image 
        source={{ uri }} 
        style={[style, { width: size, height: size, borderRadius: size / 2 }]} 
        contentFit="cover" 
      />
    );
  }

  const char = (name && name.trim().length > 0) ? name.trim().charAt(0).toUpperCase() : '?';
  const colorIndex = name ? name.charCodeAt(0) % BACKGROUND_COLORS.length : 0;
  const colors = BACKGROUND_COLORS[colorIndex];

  return (
    <LinearGradient 
      colors={colors} 
      style={[
        style, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }
      ]}
    >
      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: size * 0.45 }}>
        {char}
      </Text>
    </LinearGradient>
  );
}
