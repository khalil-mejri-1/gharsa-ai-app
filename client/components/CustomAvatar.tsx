import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const BACKGROUND_COLORS = [
  ['#FF5252', '#C62828'], // Red
  ['#FF4081', '#AD1457'], // Pink
  ['#E040FB', '#6A1B9A'], // Purple
  ['#7C4DFF', '#4527A0'], // Deep Purple
  ['#536DFE', '#283593'], // Indigo
  ['#448AFF', '#1565C0'], // Blue
  ['#40C4FF', '#007BB2'], // Light Blue
  ['#18FFFF', '#00838F'], // Cyan
  ['#64FFDA', '#00695C'], // Teal
  ['#69F0AE', '#2E7D32'], // Green
  ['#B2FF59', '#558B2F'], // Light Green
  ['#EEFF41', '#9E9D24'], // Lime
  ['#FFFF00', '#F9A825'], // Yellow
  ['#FFD740', '#FF8F00'], // Amber
  ['#FFAB40', '#EF6C00'], // Orange
  ['#FF6E40', '#D84315'], // Deep Orange
];

interface CustomAvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: any;
}

export default function CustomAvatar({ uri, name, size = 40, style }: CustomAvatarProps) {
  // Enhanced check for valid URIs
  const hasValidUri = uri && 
                     typeof uri === 'string' && 
                     uri.trim().length > 0 && 
                     uri.startsWith('http') && 
                     !uri.includes('unsplash.com/photos/default') &&
                     !uri.includes('photo-1472099645785-5658abf4ff4e') && 
                     !uri.includes('photo-1438761681033-6461ffad8d80') && 
                     !uri.includes('photo-1507003211169-0a1dd7228f2d') && 
                     !uri.includes('photo-1500648767791-00dcc994a43e') &&
                     !uri.includes('photo-1544005313-94ddf0286df2') &&
                     !uri.includes('photo-1506794778202-cad84cf45f1d') &&
                     !uri.includes('photo-1534528741775-53994a69daeb');

  if (hasValidUri) {
    return (
      <Image 
        source={{ uri }} 
        style={[style, { width: size, height: size, borderRadius: size / 2 }]} 
        contentFit="cover" 
      />
    );
  }

  // Fallback to Initials
  const getInitial = (str: string | null | undefined) => {
    if (!str || str.trim().length === 0) return '?';
    const trimmed = str.trim();
    // Support for both Latin and Arabic/other scripts
    return trimmed.charAt(0).toUpperCase();
  };

  const char = getInitial(name);
  
  // Deterministic color based on name
  const getColorIndex = (str: string | null | undefined) => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % BACKGROUND_COLORS.length;
  };

  const colors = BACKGROUND_COLORS[getColorIndex(name)];

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
          alignItems: 'center',
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      ]}
    >
      <Text 
        style={{ 
          color: 'white', 
          fontWeight: '900', 
          fontSize: size * 0.45, 
          textAlign: 'center',
          includeFontPadding: false,
          textAlignVertical: 'center',
        }}
      >
        {char}
      </Text>
    </LinearGradient>
  );
}
