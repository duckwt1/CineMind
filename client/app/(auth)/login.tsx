import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../src/context/AlertContext';
import { api } from '../../src/services/api';
import { colors } from '../../src/theme/colors';

export default function LoginScreen() {
  const { showAlert } = useAlert();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      showAlert({
        title: 'Chưa điền đủ thông tin',
        message: 'Vui lòng nhập tên người dùng / email và mật khẩu của bạn.',
        type: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      await api.login({ identifier: identifier.trim(), password });
      router.replace('/(tabs)/explore');
    } catch (err: any) {
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK';
      const msg = isNetworkError
        ? 'Không thể kết nối đến máy chủ CineMind. Vui lòng kiểm tra lại mạng hoặc thử lại sau ít phút.'
        : err.response?.data?.error?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
      showAlert({
        title: isNetworkError ? 'Lỗi kết nối máy chủ' : 'Lỗi đăng nhập',
        message: msg,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="film" size={32} color={colors.accentGold} />
          </View>
          <Text style={styles.brandName}>CineMind</Text>
          <Text style={styles.tagline}>Your AI Movie Journal & Cinephile Circle</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          {/* Identifier Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username or Email"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>Continue Watching</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Login Buttons for Instant Testing */}
          <View style={styles.quickLoginSection}>
            <Text style={styles.quickLoginTitle}>— Quick Dev Test Accounts —</Text>
            <View style={styles.quickLoginRow}>
              <TouchableOpacity
                style={styles.quickLoginBtn}
                onPress={() => {
                  setIdentifier('test_user');
                  setPassword('password123');
                }}
              >
                <Text style={styles.quickLoginBtnText}>👤 test_user</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickLoginBtn}
                onPress={() => {
                  setIdentifier('ethan_cine');
                  setPassword('password123');
                }}
              >
                <Text style={styles.quickLoginBtnText}>🎬 ethan_cine</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Switch to Register */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to CineMind? </Text>
            <Link href="/(auth)/register" style={styles.linkText}>
              Create Account
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.bgSurface,
    borderWidth: 1.5,
    borderColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
  },
  button: {
    backgroundColor: colors.accentGold,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: colors.accentGold,
    fontSize: 14,
    fontWeight: '700',
  },
  quickLoginSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  quickLoginTitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickLoginRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  quickLoginBtn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickLoginBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
