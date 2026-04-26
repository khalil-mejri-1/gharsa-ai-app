import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Animated, StyleSheet, View, Text, SafeAreaView, Dimensions, Platform, Modal, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from './ThemeContext';
import { GradientIcon } from '../components/GradientUI';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { tokens, mode } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const slideAnim = useRef(new Animated.Value(-150)).current;

  // Confirm state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => {});

  const showToast = useCallback((msg: string, t: ToastType = 'success') => {
    setMessage(msg);
    setType(t);
    setVisible(true);

    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: Platform.OS === 'ios' ? 10 : 30,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [slideAnim]);

  const showConfirm = useCallback((title: string, msg: string, onConfirm: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(msg);
    setOnConfirmAction(() => onConfirm);
    setConfirmVisible(true);
  }, []);

  const getIcon = () => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  const getGradientColors = () => {
    switch (type) {
      case 'success': return tokens.gradients.green;
      case 'error': return tokens.gradients.red;
      case 'warning': return tokens.gradients.orange || ['#FB8C00', '#F57C00'];
      default: return ['#42A5F5', '#1E88E5'];
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      
      {/* Toast Notification */}
      <Animated.View style={[
        styles.toastContainerWrapper, 
        { 
          transform: [{ translateY: slideAnim }], 
          display: visible ? 'flex' : 'none'
        }
      ]}>
        <LinearGradient 
          colors={getGradientColors()} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
          style={styles.toastContainer}
        >
          <SafeAreaView>
            <View style={styles.toastContent}>
              <View style={styles.iconCircle}>
                <MaterialIcons name={getIcon()} size={20} color={getGradientColors()[0]} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.toastTitle}>{type.toUpperCase()}</Text>
                <Text style={styles.toastText}>{message}</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      {/* Confirmation Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: mode === 'dark' ? '#1a2e24' : '#ffffff' }]}>
            <View style={styles.confirmHeader}>
              <View style={[styles.confirmIconBg, { backgroundColor: tokens.gradients.red[0] + '20' }]}>
                <GradientIcon colors={tokens.gradients.red} name="alert-circle" size={32} library={Ionicons} />
              </View>
              <Text style={[styles.confirmTitle, { color: tokens.onSurface }]}>{confirmTitle}</Text>
              <Text style={[styles.confirmMsg, { color: tokens.onSurfaceVariant }]}>{confirmMessage}</Text>
            </View>
            <View style={styles.confirmActions}>
              <TouchableOpacity 
                style={[styles.btnCancel, { backgroundColor: tokens.surfaceContainerHigh }]} 
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={[styles.btnCancelText, { color: tokens.onSurface }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnConfirmContainer} 
                onPress={() => {
                  onConfirmAction();
                  setConfirmVisible(false);
                }}
              >
                <LinearGradient
                  colors={tokens.gradients.red}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnConfirm}
                >
                  <Text style={styles.btnConfirmText}>Confirm</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  toastContainerWrapper: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 99999,
  },
  toastContainer: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  toastTitle: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    opacity: 0.8,
    marginBottom: 2,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.1)',
  },
  confirmHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmMsg: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelText: {
    fontWeight: '700',
    fontSize: 15,
  },
  btnConfirmContainer: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    shadowColor: '#ff4d4d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  btnConfirm: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnConfirmText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },
});
