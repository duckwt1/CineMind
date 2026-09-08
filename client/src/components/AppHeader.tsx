import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../context/AlertContext';
import { api, getAuthToken } from '../services/api';
import { User } from '../types';
import { colors } from '../theme/colors';

interface AppHeaderProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
}

export default function AppHeader({
  title,
  icon = 'film',
  subtitle,
}: AppHeaderProps) {
  const { showAlert } = useAlert();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        const me = await api.getMe();
        setCurrentUser(me);
      } catch {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Left: Brand Icon + Title */}
      <View style={styles.leftSection}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={18} color={colors.accentGold} />
        </View>
        <View>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        </View>
      </View>

      {/* Right: User Avatar / Sign In */}
      <View style={styles.rightSection}>
        {currentUser ? (
          <TouchableOpacity
            style={styles.userBadge}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle" size={22} color={colors.accentGold} />
            <Text style={styles.userBadgeText}>@{currentUser.username}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={16} color={colors.textInverse} style={{ marginRight: 4 }} />
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: colors.bgBase,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleText: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  userBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 5,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: colors.accentGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  signInBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
