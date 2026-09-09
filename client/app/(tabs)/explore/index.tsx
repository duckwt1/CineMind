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

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const searchSeqRef = React.useRef(0);

  useEffect(() => {
    loadTrending(1, false);
  }, []);

  const loadTrending = async (targetPage = 1, showErrorAlert = false) => {
    try {
      if (targetPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const data = await api.getTrending(targetPage);
      const newItems = data || [];
      if (targetPage === 1) {
        setMovies(newItems);
      } else {
        // Append unique movies
        setMovies((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          return [...prev, ...newItems.filter((m) => !existingIds.has(m.id))];
        });
      }
      setHasMore(newItems.length >= 10);
      setPage(targetPage);
    } catch (e: any) {
      console.error(e);
      if (targetPage === 1) setMovies([]);
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
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    if (searchQuery.trim()) {
      await executeSearch(searchQuery, isSemanticMode, 1);
    } else {
      await loadTrending(1, true);
    }
  };

  const executeSearch = async (text: string, semantic: boolean, targetPage = 1) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setPage(1);
      loadTrending(1);
      return;
    }

    // Sequence token to discard stale async responses from earlier keystrokes
    const seq = ++searchSeqRef.current;

    try {
      if (targetPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      let results: Movie[] = [];
      if (semantic) {
        results = await api.searchSemantic(trimmed, 20);
      } else {
        results = await api.searchMovies(trimmed, targetPage);
      }

      // If a newer search was dispatched while this request was in-flight, ignore these results
      if (seq !== searchSeqRef.current) {
        return;
      }

      if (semantic) {
        setHasMore(false);
      } else {
        setHasMore(results && results.length >= 10);
      }

      if (targetPage === 1) {
        setMovies(results || []);
      } else {
        setMovies((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          return [...prev, ...(results || []).filter((m) => !existingIds.has(m.id))];
        });
      }
      setPage(targetPage);
    } catch (e: any) {
      if (seq !== searchSeqRef.current) return;
      console.error(e);
      showAlert({
        title: 'Lỗi tìm kiếm',
        message: 'Không thể tìm kiếm phim. Vui lòng thử lại sau.',
        type: 'warning',
      });
    } finally {
      if (seq === searchSeqRef.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  };

  const handleInputChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim() && movies.length === 0) {
      // If user cleared text and list is empty, reload trending
      searchSeqRef.current++;
      setPage(1);
      loadTrending(1);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
    searchSeqRef.current++;
    setLoading(false);
    loadTrending(1);
  };

  const handleTriggerSearch = (mode = isSemanticMode) => {
    setPage(1);
    executeSearch(searchQuery, mode, 1);
  };

  const toggleSearchMode = () => {
    const newMode = !isSemanticMode;
    setIsSemanticMode(newMode);
    setPage(1);
    if (searchQuery.trim()) {
      executeSearch(searchQuery, newMode, 1);
    }
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || !hasMore || isSemanticMode) return;
    const nextPage = page + 1;
    if (searchQuery.trim()) {
      executeSearch(searchQuery, false, nextPage);
    } else {
      loadTrending(nextPage);
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
          source={{ uri: item.posterUrl || 'https://placehold.co/300x450/161B22/C9D1D9.png?text=No+Poster' }}
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
          onChangeText={handleInputChange}
          onSubmitEditing={() => handleTriggerSearch()}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={handleClearSearch}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.searchSubmitBtn, isSemanticMode && styles.searchSubmitBtnAi]}
          onPress={() => handleTriggerSearch()}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isSemanticMode ? "sparkles" : "arrow-forward"}
            size={14}
            color={colors.textInverse}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.searchSubmitBtnText}>Tìm</Text>
        </TouchableOpacity>
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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentGold} />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={colors.accentGold} />
                <Text style={styles.loadingMoreText}>Đang tải thêm phim...</Text>
              </View>
            ) : null
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
    paddingRight: 6,
  },
  clearBtn: {
    padding: 4,
    marginRight: 6,
  },
  searchSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentGold,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  searchSubmitBtnAi: {
    backgroundColor: colors.aiPurple,
  },
  searchSubmitBtnText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
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
  loadingMoreContainer: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingMoreText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
