import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export type AlertType = 'error' | 'warning' | 'success' | 'info';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  hideAlert: () => {},
});

export const useAlert = () => useContext(AlertContext);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const showAlert = (newOptions: AlertOptions) => {
    setOptions(newOptions);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  const handleButtonPress = (btn?: AlertButton) => {
    hideAlert();
    if (btn?.onPress) {
      btn.onPress();
    }
  };

  const type = options?.type || 'info';

  const getIconConfig = () => {
    switch (type) {
      case 'error':
        return { name: 'alert-circle' as const, color: colors.danger, bg: colors.dangerDim };
      case 'warning':
        return { name: 'warning' as const, color: colors.warning, bg: colors.warningDim };
      case 'success':
        return { name: 'checkmark-circle' as const, color: colors.success, bg: colors.successDim };
      case 'info':
      default:
        return { name: 'information-circle' as const, color: colors.accentGold, bg: colors.accentGoldDim };
    }
  };

  const iconConfig = getIconConfig();
  const buttons = options?.buttons && options.buttons.length > 0
    ? options.buttons
    : [{ text: 'Đồng ý', style: 'default' as const }];

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <TouchableWithoutFeedback onPress={hideAlert}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.card}>
                {/* Header Icon */}
                <View style={[styles.iconWrapper, { backgroundColor: iconConfig.bg }]}>
                  <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
                </View>

                {/* Content */}
                <Text style={styles.title}>{options?.title}</Text>
                {options?.message ? (
                  <Text style={styles.message}>{options.message}</Text>
                ) : null}

                {/* Action Buttons */}
                <View style={[styles.buttonRow, buttons.length > 2 && styles.buttonColumn]}>
                  {buttons.map((btn, idx) => {
                    const isCancel = btn.style === 'cancel';
                    const isDestructive = btn.style === 'destructive';

                    let btnStyle = styles.defaultBtn;
                    let textStyle = styles.defaultBtnText;

                    if (isCancel) {
                      btnStyle = styles.cancelBtn;
                      textStyle = styles.cancelBtnText;
                    } else if (isDestructive) {
                      btnStyle = styles.destructiveBtn;
                      textStyle = styles.destructiveBtnText;
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.btnBase, btnStyle]}
                        onPress={() => handleButtonPress(btn)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.btnTextBase, textStyle]}>{btn.text}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </AlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 4, 8, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  buttonColumn: {
    flexDirection: 'column',
  },
  btnBase: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnTextBase: {
    fontSize: 14,
    fontWeight: '700',
  },
  defaultBtn: {
    backgroundColor: colors.accentGold,
  },
  defaultBtnText: {
    color: colors.textInverse,
  },
  cancelBtn: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textSecondary,
  },
  destructiveBtn: {
    backgroundColor: colors.dangerDim,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  destructiveBtnText: {
    color: colors.danger,
  },
});
