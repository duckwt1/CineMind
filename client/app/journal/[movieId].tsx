import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, getAuthToken } from '../../src/services/api';
import { Movie, JournalEntry, ViewingContext } from '../../src/types';
import { colors } from '../../src/theme/colors';

const CONTEXT_OPTIONS: { label: string; value: ViewingContext; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Theater', value: 'THEATER', icon: 'film-outline' },
  { label: 'Home Solo', value: 'HOME_SOLO', icon: 'home-outline' },
  { label: 'With Friends / Family', value: 'HOME_GROUP', icon: 'people-outline' },
  { label: 'Airplane / Travel', value: 'AIRPLANE', icon: 'airplane-outline' },
  { label: 'Other', value: 'OTHER', icon: 'compass-outline' },
];

export default function JournalEditorScreen() {
  const { movieId } = useLocalSearchParams<{ movieId: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [entryText, setEntryText] = useState('');
  const [viewingContext, setViewingContext] = useState<ViewingContext>('HOME_SOLO');
  const [privateNotes, setPrivateNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingEntry, setHasExistingEntry] = useState(false);

  useEffect(() => {
    if (movieId) {
      loadData(movieId);
    }
  }, [movieId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const [movieData, journalData] = await Promise.all([
        api.getMovieDetails(id),
        getAuthToken() ? api.getJournal(id) : Promise.resolve(null),
      ]);

      setMovie(movieData);
      if (journalData) {
        setEntryText(journalData.entryText || '');
        setViewingContext(journalData.viewingContext || 'HOME_SOLO');
        setPrivateNotes(journalData.privateNotes || '');
        setHasExistingEntry(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!getAuthToken()) {
      Alert.alert('Sign In Required', 'Please sign in to save journal reflections.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (!entryText.trim()) {
      Alert.alert('Incomplete Entry', 'Please write your personal thoughts or reflections on the movie.');
      return;
    }

    try {
      setSaving(true);
      await api.saveJournal(movieId!, {
        entryText: entryText.trim(),
        viewingContext,
        privateNotes: privateNotes.trim() || undefined,
      });

      Alert.alert('Journal Saved', 'Your reflection has been safely recorded in your private journal.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to save journal entry.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            await api.deleteJournal(movieId!);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete journal entry.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentGold} />
        <Text style={styles.loadingText}>Loading film journal...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {/* Top Navigation */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Movie Journal</Text>
        {hasExistingEntry ? (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* Movie Banner Card */}
      {movie && (
        <View style={styles.movieHeader}>
          <Image
            source={{ uri: movie.posterUrl || 'https://via.placeholder.com/100x150?text=Poster' }}
            style={styles.poster}
          />
          <View style={styles.movieDetails}>
            <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
            <Text style={styles.movieMeta}>
              {movie.releaseYear} • {movie.director ? `Dir. ${movie.director}` : movie.genres?.slice(0, 2).join(', ')}
            </Text>
            <View style={styles.privateBadge}>
              <Ionicons name="lock-closed" size={11} color={colors.accentGold} style={{ marginRight: 4 }} />
              <Text style={styles.privateBadgeText}>Strictly Private to You</Text>
            </View>
          </View>
        </View>
      )}

      {/* Viewing Context Selector */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>Where & how did you watch it?</Text>
        <View style={styles.contextGrid}>
          {CONTEXT_OPTIONS.map((opt) => {
            const isSelected = viewingContext === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.contextBtn, isSelected && styles.contextBtnSelected]}
                onPress={() => setViewingContext(opt.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon}
                  size={16}
                  color={isSelected ? colors.textInverse : colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.contextBtnText, isSelected && styles.contextBtnTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Reflection Text Input */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>Your Impressions & Reflections</Text>
        <TextInput
          style={styles.textArea}
          placeholder="How did this film make you feel? What scenes, performances, or themes lingered in your mind?"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={entryText}
          onChangeText={setEntryText}
        />
      </View>

      {/* Private Notes Input */}
      <View style={styles.sectionBlock}>
        <View style={styles.privateLabelRow}>
          <Text style={styles.sectionLabel}>Secret / Private Notes</Text>
          <Text style={styles.optionalHint}>(Optional)</Text>
        </View>
        <TextInput
          style={styles.notesInput}
          placeholder="Personal trivia, whom you watched it with, spoilers, or memorable quotes..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={privateNotes}
          onChangeText={setPrivateNotes}
        />
      </View>

      {/* Action Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <>
            <Ionicons name="bookmark" size={18} color={colors.textInverse} style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>
              {hasExistingEntry ? 'Update Journal Entry' : 'Save Reflection to Journal'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgBase,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  movieHeader: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: colors.bgElevated,
  },
  movieDetails: {
    flex: 1,
    marginLeft: 12,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  movieMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentGoldDim,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  privateBadgeText: {
    color: colors.accentGold,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  contextBtnSelected: {
    backgroundColor: colors.accentGold,
    borderColor: colors.accentGold,
  },
  contextBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  contextBtnTextSelected: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 140,
  },
  privateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionalHint: {
    color: colors.textMuted,
    fontSize: 11,
  },
  notesInput: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
    minHeight: 80,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: colors.accentGold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
});