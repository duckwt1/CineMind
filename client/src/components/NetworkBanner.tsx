import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface NetworkBannerProps {
  isOffline: boolean;
  onRetry?: () => void;
  retrying?: boolean;
}

export default function NetworkBanner({
  isOffline,
  onRetry,
  retrying = false,
}: NetworkBannerProps) {
  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={16} color={colors.warning} style={styles.icon} />
        <Text style={styles.text} numberOfLines={1}>
          Chưa kết nối máy chủ CineMind (Chế độ xem offline)
        </Text>
      </View>

      {onRetry && (
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={onRetry}
          disabled={retrying}
          activeOpacity={0.7}
        >
          {retrying ? (
            <ActivityIndicator size="small" color={colors.accentGold} />
          ) : (
            <>
              <Ionicons name="reload" size={12} color={colors.accentGold} style={{ marginRight: 4 }} />
              <Text style={styles.retryText}>Kết nối lại</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    flex: 1,
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryText: {
    color: colors.accentGold,
    fontSize: 11,
    fontWeight: '700',
  },
});
