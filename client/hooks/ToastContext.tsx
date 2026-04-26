import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Animated, StyleSheet, View, Text, SafeAreaView, Dimensions, Platform, Modal, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAppTheme } from './ThemeContext';

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

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#43A047';
      case 'error': return '#E53935';
      case 'warning': return '#FB8C00';
      default: return '#1E88E5';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      
      {/* Toast Notification */}
      <Animated.View style={[
        styles.toastContainer, 
        { 
          transform: [{ translateY: slideAnim }], 
          backgroundColor: getBackgroundColor(),
          display: visible ? 'flex' : 'none'
        }
      ]}>
        <SafeAreaView>
          <View style={styles.toastContent}>
            <View style={styles.iconCircle}>
              <MaterialIcons name={getIcon()} size={20} color={getBackgroundColor()} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.toastTitle}>{type.toUpperCase()}</Text>
              <Text style={styles.toastText}>{message}</Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Confirmation Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: mode === 'dark' ? '#1a2e24' : '#ffffff' }]}>
            <View style={styles.confirmHeader}>
              <View style={[styles.confirmIconBg, { backgroundColor: '#ff4d4d20' }]}>
                <Ionicons name="alert-circle" size={32} color="#ff4d4d" />
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
                style={styles.btnConfirm} 
                onPress={() => {
                  onConfirmAction();
                  setConfirmVisible(false);
                }}
              >
                <Text style={styles.btnConfirmText}>Confirm</Text>
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
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    borderRadius: 20,
    zIndex: 99999,
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
  btnConfirm: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#ff4d4d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff4d4d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnConfirmText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },
});
