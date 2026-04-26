import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface VoiceMessageProps {
  uri: string;
  isMe: boolean;
  tokens: any;
  passedDuration?: number;
}

export default function VoiceMessage({ uri, isMe, tokens, passedDuration }: VoiceMessageProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(passedDuration || 0);

  useEffect(() => {
    // Only pre-fetch if we don't have a passed duration
    if (!passedDuration) {
      const loadMetadata = async () => {
        try {
          const { sound: metaSound, status } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: false }
          );
          if (status.isLoaded && status.durationMillis) {
            setDuration(status.durationMillis);
          }
          await metaSound.unloadAsync();
        } catch (e) {
          console.log('Error loading metadata', e);
        }
      };
      loadMetadata();
    } else {
      setDuration(passedDuration);
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [uri]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || duration);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        sound?.setPositionAsync(0);
      }
    }
  };

  const playPauseSound = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        setIsLoading(true);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error playing sound', error);
      setIsLoading(false);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.max(0, Math.floor(millis / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Calculate remaining time
  const remainingTime = Math.max(0, duration - position);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={playPauseSound} 
        style={[styles.playBtn, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)' }]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isMe ? 'white' : tokens.primary} />
        ) : (
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={20} 
            color={isMe ? 'white' : tokens.primary} 
          />
        )}
      </TouchableOpacity>
      
      <View style={styles.waveformContainer}>
        <View style={[styles.progressTrack, { backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }]}>
          <View style={[styles.progressBar, { 
            width: duration > 0 ? `${(position / duration) * 100}%` : 0, 
            backgroundColor: isMe ? 'white' : tokens.primary 
          }]} />
        </View>
        <Text style={[styles.duration, { color: isMe ? 'white' : tokens.onSurface }]}>
          {duration > 0 ? formatTime(remainingTime) : '...'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 180,
    paddingVertical: 2,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flex: 1,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  duration: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  }
});
