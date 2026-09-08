import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../../src/context/AlertContext';
import AppHeader from '../../../src/components/AppHeader';
import ErrorState from '../../../src/components/ErrorState';
import { api } from '../../../src/services/api';
import { Movie } from '../../../src/types';
import { colors } from '../../../src/theme/colors';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
  const { showAlert } = useAlert();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSemanticMode, setIsSemanticMode] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async (showErrorAlert = false) => {
    try {
      setLoading(true);
      const data = await api.getTrending();
      setMovies(data || []);
    } catch (e: any) {
      console.error(e);
      setMovies([]);
      if (showErrorAlert) {
        const isNetwork = !e.response || e.code === 'ERR_NETWORK';
        showAlert({
          title: isNetwork ? 'Mất kết nối máy chủ' : 'Lỗi tải dữ liệu',
          message: isNetwork
            ? 'Không thể kết nối đến máy chủ CineMind Backend. Vui lòng kiểm tra lại kết nối mạng của bạn.'
            : 'Đã xảy ra lỗi khi lấy danh sách phim.',
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrending(true);
  };

  const executeSearch = async (text: string, semantic: boolean) => {
    if (!text.trim()) {
      loadTrending();
      return;
    }
    try {
      setLoading(true);
      let results: Movie[] = [];
      if (semantic) {
        results = await api.searchSemantic(text.trim());
      } else {
        results = await api.searchMovies(text.trim());
      }
      setMovies(results || []);
    } catch (e: any) {
      console.error(e);
      showAlert({
        title: 'Lỗi tìm kiếm',
        message: 'Không thể tìm kiếm phim. Vui lòng thử lại sau.',
        type: 'warning',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    executeSearch(text, isSemanticMode);
  };

  const toggleSearchMode = () => {
    const newMode = !isSemanticMode;
    setIsSemanticMode(newMode);
    if (searchQuery.trim()) {
      executeSearch(searchQuery, newMode);
    }
  };

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/movie/[id]', params: { id: item.id } })}
      activeOpacity={0.8}
    >
      <View style={styles.posterContainer}>
        <Image
          source={{ uri: item.posterUrl || 'https://via.placeholder.com/300x450?text=No+Poster' }}
          style={styles.poster}
          resizeMode="cover"
        />
        {item.releaseYear ? (
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{item.releaseYear}</Text>
          </View>
        ) : null}
        {item.similarityScore ? (
          <View style={styles.semanticMatchBadge}>
            <Ionicons name="sparkles" size={10} color={colors.textInverse} style={{ marginRight: 3 }} />
            <Text style={styles.semanticMatchBadgeText}>{item.similarityScore}% Khớp</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <Text style={styles.movieTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.genreRow}>
          {item.genres && item.genres.length > 0 ? (
            item.genres.slice(0, 2).map((g, idx) => (
              <View key={idx} style={styles.genrePill}>
                <Text style={styles.genreText}>{g}</Text>
              </View>
            ))
          ) : (
            <View style={styles.genrePill}>
              <Text style={styles.genreText}>Featured</Text>
            </View>
          )}
        </View>
        {item.director ? (
          <Text style={styles.directorText} numberOfLines={1}>
            Dir. {item.director}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screenWrapper}>
      {/* Unified Cinematic AppHeader */}
      <AppHeader title="CineMind" icon="film" subtitle="AI Film Journal" />

      <View style={styles.container}>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name={isSemanticMode ? 'sparkles' : 'search'}
          size={18}
          color={isSemanticMode ? colors.aiPurple : colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={
            isSemanticMode
              ? "Hành trình vũ trụ cô độc, kết thúc buồn..."
              : "Tìm theo tên phim, đạo diễn, thể loại..."
          }
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Mode Selector Pill (Keyword vs AI Semantic) */}
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity
          style={[styles.modePill, !isSemanticMode && styles.modePillActive]}
          onPress={() => isSemanticMode && toggleSearchMode()}
          activeOpacity={0.8}
        >
          <Ionicons name="film-outline" size={13} color={!isSemanticMode ? colors.textInverse : colors.textMuted} style={{ marginRight: 5 }} />
          <Text style={[styles.modePillText, !isSemanticMode && styles.modePillTextActive]}>Tìm Tên TMDB</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modePill, isSemanticMode && styles.modePillActiveAi]}
          onPress={() => !isSemanticMode && toggleSearchMode()}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={13} color={isSemanticMode ? colors.textInverse : colors.aiPurple} style={{ marginRight: 5 }} />
          <Text style={[styles.modePillText, isSemanticMode && styles.modePillTextActive]}>✨ AI Semantic (pgvector)</Text>
        </TouchableOpacity>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons
            name={searchQuery.trim() ? 'search-outline' : 'flame'}
            size={18}
            color={colors.accentGold}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.sectionTitle}>
            {searchQuery.trim() ? `Results for "${searchQuery}"` : 'Trending & Popular Films'}
          </Text>
        </View>
        {!loading && (
          <Text style={styles.countText}>{movies.length} films</Text>
        )}
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accentGold} />
          <Text style={styles.loadingText}>Fetching cinema catalog from Backend...</Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id}
          renderItem={renderMovieItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentGold} />
          }
          ListEmptyComponent={
            searchQuery.trim() ? (
              <ErrorState
                title="Không tìm thấy phim phù hợp"
                message={`Không tìm thấy bộ phim nào khớp với từ khóa "${searchQuery}". Hãy thử tìm tên phim khác.`}
                type="empty"
              />
            ) : (
              <ErrorState
                title="Không thể tải danh sách phim"
                message="Chưa kết nối được máy chủ hoặc danh sách phim đang được cập nhật. Vui lòng kiểm tra lại mạng hoặc kéo xuống để thử lại."
                onRetry={onRefresh}
                retrying={refreshing}
                type="offline"
              />
            )
          }
        />
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 10,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modePillActive: {
    backgroundColor: colors.accentGold,
    borderColor: colors.accentGold,
  },
  modePillActiveAi: {
    backgroundColor: colors.aiPurple,
    borderColor: colors.aiPurple,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modePillTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  countText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  listContent: {
    paddingBottom: 90,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  card: {
    width: '48%',
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  posterContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: colors.bgElevated,
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  yearBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  yearText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  semanticMatchBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(130, 80, 223, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  semanticMatchBadgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '800',
  },
  info: {
    padding: 10,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  genrePill: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  genreText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  directorText: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
});
