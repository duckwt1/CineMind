import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../../src/context/AlertContext';
import AppHeader from '../../../src/components/AppHeader';
import ErrorState from '../../../src/components/ErrorState';
import { api, getAuthToken, setAuthToken } from '../../../src/services/api';
import { LibraryEntry, LibraryStatus } from '../../../src/types';
import { colors } from '../../../src/theme/colors';

const STATUS_TABS: { label: string; value: LibraryStatus; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Want to Watch', value: 'WANT_TO_WATCH', icon: 'bookmark-outline' },
  { label: 'Watching', value: 'WATCHING', icon: 'play-circle-outline' },
  { label: 'Watched', value: 'WATCHED', icon: 'checkmark-circle-outline' },
  { label: 'Dropped', value: 'DROPPED', icon: 'close-circle-outline' },
];

export default function LibraryScreen() {
  const { showAlert } = useAlert();
  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus>('WANT_TO_WATCH');
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, [selectedStatus]);

  const checkAuthAndLoad = async () => {
    const token = getAuthToken();
    const authed = !!token;
    setIsAuthenticated(authed);
    if (authed) {
      await loadLibrary(selectedStatus);
    } else {
      setLoading(false);
      setEntries([]);
      setHasError(false);
    }
  };

  const loadLibrary = async (status: LibraryStatus) => {
    try {
      setLoading(true);
      setHasError(false);
      const data = await api.getLibrary(status);
      setEntries(data || []);
    } catch (e) {
      console.error(e);
      setHasError(true);
      setEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkAuthAndLoad();
  };

  const handleQuickLogin = async () => {
    try {
      setLoading(true);
      await api.login({ identifier: 'test_user', password: 'password123' });
      setIsAuthenticated(true);
      showAlert({
        title: 'Đăng nhập thành công',
        message: 'Đã đăng nhập bằng tài khoản mẫu test_user. Đang đồng bộ thư viện!',
        type: 'success',
      });
      await loadLibrary(selectedStatus);
    } catch (err: any) {
      const isNetwork = !err.response || err.code === 'ERR_NETWORK';
      showAlert({
        title: isNetwork ? 'Mất kết nối máy chủ' : 'Lỗi đăng nhập',
        message: isNetwork
          ? 'Không thể kết nối đến máy chủ CineMind Backend. Vui lòng kiểm tra lại mạng.'
          : err.response?.data?.error?.message || 'Đăng nhập nhanh thất bại.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEntry = ({ item }: { item: LibraryEntry }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/movie/[id]', params: { id: item.movie.id } })}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.movie.posterUrl || 'https://via.placeholder.com/150x225?text=Poster' }}
        style={styles.poster}
        resizeMode="cover"
      />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {item.movie.title}
        </Text>
        <Text style={styles.year}>{item.movie.releaseYear || 'Unknown Year'}</Text>

        <View style={styles.metaRow}>
          {item.rating != null && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color={colors.accentGold} style={{ marginRight: 3 }} />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.ratingOutOf}>/10</Text>
            </View>
          )}

          {item.isFavorite && (
            <View style={styles.favBadge}>
              <Ionicons name="heart" size={12} color={colors.danger} />
            </View>
          )}

          {item.rewatchCount > 0 && (
            <View style={styles.rewatchBadge}>
              <Ionicons name="repeat" size={11} color={colors.textSecondary} style={{ marginRight: 2 }} />
              <Text style={styles.rewatchText}>{item.rewatchCount}x</Text>
            </View>
          )}
        </View>

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.map((tag, idx) => (
              <View key={idx} style={styles.tagPill}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Unified Cinematic AppHeader */}
      <AppHeader
        title="My Library"
        icon="film"
        subtitle={isAuthenticated ? `${entries.length} films in log` : 'Sign in to sync'}
      />

      {/* Status Filter Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={(tab) => tab.value}
          contentContainerStyle={styles.tabListContent}
          renderItem={({ item: tab }) => {
            const isActive = selectedStatus === tab.value;
            return (
              <TouchableOpacity
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setSelectedStatus(tab.value)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={isActive ? colors.accentGold : colors.textSecondary}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Guest Mode Warning Banner if not logged in */}
      {!isAuthenticated && (
        <View style={styles.guestBanner}>
          <View style={styles.guestBannerTop}>
            <Ionicons name="lock-closed" size={20} color={colors.accentGold} />
            <Text style={styles.guestBannerTitle}>Sign in to access your Library</Text>
          </View>
          <Text style={styles.guestBannerText}>
            Your movie history, ratings, and watchlists are securely synced with the CineMind backend.
          </Text>
          <View style={styles.guestBannerActions}>
            <TouchableOpacity
              style={styles.guestLoginBtn}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.guestLoginBtnText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.guestQuickBtn}
              onPress={handleQuickLogin}
            >
              <Text style={styles.guestQuickBtnText}>⚡ Quick Login as Test User</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Library Entry List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentGold} />
          <Text style={styles.loadingText}>Fetching your movie entries from PostgreSQL...</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentGold} />
          }
          ListEmptyComponent={
            hasError ? (
              <ErrorState
                title="Mất kết nối máy chủ"
                message="Không thể tải danh sách phim trong thư viện từ máy chủ PostgreSQL. Vui lòng kiểm tra lại mạng hoặc thử lại."
                onRetry={onRefresh}
                retrying={refreshing}
                type="offline"
              />
            ) : isAuthenticated ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="film-outline" size={54} color={colors.borderLight} />
                <Text style={styles.emptyTitle}>Chưa có phim trong "{STATUS_TABS.find((t) => t.value === selectedStatus)?.label}"</Text>
                <Text style={styles.emptySubtitle}>
                  Khám phá các bộ phim thịnh hành và nhấn "Lưu vào Thư viện" để bắt đầu theo dõi.
                </Text>
                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => router.push('/(tabs)/explore')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="compass-outline" size={16} color={colors.textInverse} style={{ marginRight: 6 }} />
                  <Text style={styles.exploreButtonText}>Khám phá phim ngay</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  tabsContainer: {
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabListContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.accentGoldDim,
    borderColor: colors.accentGold,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.accentGold,
    fontWeight: '700',
  },
  guestBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  guestBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  guestBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  guestBannerText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  guestBannerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  guestLoginBtn: {
    backgroundColor: colors.accentGold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  guestLoginBtnText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  guestQuickBtn: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  guestQuickBtnText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 12,
  },
  poster: {
    width: 65,
    height: 95,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  year: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingText: {
    color: colors.accentGold,
    fontSize: 11,
    fontWeight: '700',
  },
  ratingOutOf: {
    color: colors.textMuted,
    fontSize: 9,
  },
  favBadge: {
    backgroundColor: 'rgba(248, 81, 73, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rewatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rewatchText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagPill: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagText: {
    color: colors.accentGold,
    fontSize: 10,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentGold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
});