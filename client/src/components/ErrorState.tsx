import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
  type?: 'offline' | 'error' | 'empty';
}

export default function ErrorState({
  title = 'Mất kết nối máy chủ',
  message = 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc thử lại.',
  onRetry,
  retrying = false,
  type = 'offline',
}: ErrorStateProps) {
  const iconName =
    type === 'offline'
      ? 'cloud-offline-outline'
      : type === 'error'
      ? 'alert-circle-outline'
      : 'film-outline';

  const iconColor =
    type === 'offline'
      ? colors.warning
      : type === 'error'
      ? colors.danger
      : colors.textMuted;

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { borderColor: iconColor }]}>
        <Ionicons name={iconName} size={36} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, retrying && styles.retryButtonDisabled]}
          onPress={onRetry}
          disabled={retrying}
          activeOpacity={0.8}
        >
          {retrying ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <>
              <Ionicons
                name="refresh-outline"
                size={16}
                color={colors.textInverse}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.retryText}>Thử lại kết nối</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bgSurface,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentGold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: colors.accentGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
});
