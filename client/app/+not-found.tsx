import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Ionicons name="film-outline" size={64} color={colors.borderLight} style={{ marginBottom: 16 }} />
        <Text style={styles.title}>This film roll is missing</Text>
        <Text style={styles.subtitle}>The screen you are looking for doesn't exist or has been moved.</Text>
        <Link href="/(tabs)/explore" style={styles.link}>
          <Text style={styles.linkText}>Return to Explore</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bgBase,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 20,
  },
  link: {
    backgroundColor: colors.accentGold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
