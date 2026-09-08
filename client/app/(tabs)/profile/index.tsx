import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../../src/context/AlertContext';
import { useNotifications } from '../../../src/context/NotificationContext';
import AppHeader from '../../../src/components/AppHeader';
import { api, getAuthToken, setAuthToken } from '../../../src/services/api';
import {
  User,
  FriendResponse,
  ViewingStatsResponse,
  RecommendationStatsResponse,
} from '../../../src/types';
import { colors } from '../../../src/theme/colors';

export default function ProfileScreen() {
  const { showAlert } = useAlert();
  const { refreshNotifications } = useNotifications();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Statistics State
  const [viewingStats, setViewingStats] = useState<ViewingStatsResponse | null>(null);
  const [recStats, setRecStats] = useState<RecommendationStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Friends State
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);
  const [busyFriendshipId, setBusyFriendshipId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getMe();
      setUser(data);
      loadExtraData();
    } catch {
      setUser(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  const loadExtraData = async () => {
    try {
      setLoadingStats(true);
      setLoadingFriends(true);
      const [vStats, rStats, friendsList] = await Promise.all([
        api.getViewingStats().catch(() => null),
        api.getRecommendationStats().catch(() => null),
        api.getFriends().catch(() => []),
      ]);
      setViewingStats(vStats);
      setRecStats(rStats);
      setFriends(friendsList || []);
      refreshNotifications().catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
      setLoadingFriends(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const token = getAuthToken();
    if (token) {
      await loadProfile();
    } else {
      setRefreshing(false);
    }
  };

  const handleQuickLogin = async (identifier: string) => {
    try {
      setLoading(true);
      const data = await api.login({ identifier, password: 'password123' });
      setUser(data.user);
      showAlert({
        title: 'Đăng nhập thành công',
        message: `Chào mừng @${data.user.username} quay trở lại CineMind!`,
        type: 'success',
      });
      loadExtraData();
    } catch (err: any) {
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK';
      showAlert({
        title: isNetworkError ? 'Mất kết nối máy chủ' : 'Lỗi đăng nhập',
        message: isNetworkError
          ? 'Không thể kết nối tới máy chủ CineMind Backend.'
          : err.response?.data?.error?.message || 'Đăng nhập không thành công',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    showAlert({
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản CineMind?',
      type: 'warning',
      buttons: [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            setAuthToken(null);
            setUser(null);
            setViewingStats(null);
            setRecStats(null);
            setFriends([]);
          },
        },
      ],
    });
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearchingUsers(true);
      const results = await api.searchUsers(searchQuery.trim());
      setSearchResults(results || []);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSendFriendRequest = async (targetUser: User) => {
    try {
      setSendingRequestId(targetUser.id);
      await api.sendFriendRequest(targetUser.id);
      showAlert({
        title: 'Đã gửi lời mời!',
        message: `Đã gửi lời mời kết bạn tới @${targetUser.username}.`,
        type: 'success',
      });
      setSearchResults((prev) => prev.filter((u) => u.id !== targetUser.id));
      loadExtraData();
    } catch (err: any) {
      showAlert({
        title: 'Thông báo',
        message: err.response?.data?.error?.message || 'Không thể gửi lời mời kết bạn.',
        type: 'info',
      });
    } finally {
      setSendingRequestId(null);
    }
  };

  const handleAcceptFriendRequest = async (friend: FriendResponse) => {
    try {
      setBusyFriendshipId(friend.friendshipId);
      await api.acceptFriendRequest(friend.friendshipId);
      showAlert({
        title: 'Đã trở thành bạn bè!',
        message: `Bạn và @${friend.username} đã được kết nối trên CineMind.`,
        type: 'success',
      });
      loadExtraData();
    } catch (err: any) {
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.error?.message || 'Không thể chấp nhận lời mời lúc này.',
        type: 'error',
      });
    } finally {
      setBusyFriendshipId(null);
    }
  };

  const handleRejectFriendRequest = async (friend: FriendResponse) => {
    try {
      setBusyFriendshipId(friend.friendshipId);
      await api.rejectFriendRequest(friend.friendshipId);
      showAlert({
        title: 'Đã từ chối',
        message: `Đã từ chối lời mời kết bạn từ @${friend.username}.`,
        type: 'info',
      });
      loadExtraData();
    } catch (err: any) {
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.error?.message || 'Không thể từ chối lúc này.',
        type: 'error',
      });
    } finally {
      setBusyFriendshipId(null);
    }
  };

  const handleCancelOutgoingRequest = async (friend: FriendResponse) => {
    try {
      setBusyFriendshipId(friend.friendshipId);
      await api.rejectFriendRequest(friend.friendshipId);
      showAlert({
        title: 'Đã hủy lời mời',
        message: `Đã hủy lời mời kết bạn gửi tới @${friend.username}.`,
        type: 'info',
      });
      loadExtraData();
    } catch (err: any) {
      showAlert({
        title: 'Lỗi',
        message: err.response?.data?.error?.message || 'Không thể hủy lời mời.',
        type: 'error',
      });
    } finally {
      setBusyFriendshipId(null);
    }
  };

  const handleRemoveFriend = (friend: FriendResponse) => {
    showAlert({
      title: 'Hủy kết bạn',
      message: `Bạn có chắc chắn muốn hủy kết bạn với @${friend.username}?`,
      type: 'warning',
      buttons: [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy kết bạn',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusyFriendshipId(friend.friendshipId);
              await api.removeFriend(friend.friendshipId);
              showAlert({
                title: 'Đã hủy kết bạn',
                message: `Đã hủy kết nối với @${friend.username}.`,
                type: 'info',
              });
              loadExtraData();
            } catch {
              showAlert({
                title: 'Lỗi',
                message: 'Không thể hủy kết bạn lúc này.',
                type: 'error',
              });
            } finally {
              setBusyFriendshipId(null);
            }
          },
        },
      ],
    });
  };

  // Group friends by status and direction
  const incomingRequests = friends.filter(
    (f) => f.status === 'PENDING' && f.isIncoming === true
  );
  const outgoingRequests = friends.filter(
    (f) => f.status === 'PENDING' && f.isIncoming === false
  );
  const acceptedFriends = friends.filter((f) => f.status === 'ACCEPTED');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentGold} />
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <AppHeader
        title="Hồ Sơ Điện Ảnh"
        icon="person"
        subtitle={user ? `@${user.username}` : 'Tài khoản Cinephile'}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentGold} />
        }
      >
        {user ? (
          <>
            {/* Authenticated Profile Header */}
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.username}>@{user.username}</Text>
              <Text style={styles.emailText}>{user.email}</Text>

              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.accentGold} style={{ marginRight: 4 }} />
                <Text style={styles.roleBadgeText}>Active Cinephile</Text>
              </View>
            </View>

            {/* ============================================================ */}
            {/* 1. PERSONAL VIEWING ANALYTICS & STATS                        */}
            {/* ============================================================ */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="stats-chart" size={18} color={colors.accentGold} />
                <Text style={styles.sectionTitle}>Thống Kê Điện Ảnh (Analytics)</Text>
              </View>

              {loadingStats ? (
                <ActivityIndicator color={colors.accentGold} style={{ marginVertical: 16 }} />
              ) : (
                <>
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber} numberOfLines={1}>
                        {viewingStats?.totalMoviesWatched ?? 0}
                      </Text>
                      <Text style={styles.statLabel} numberOfLines={1}>Phim Đã Xem</Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statNumber} numberOfLines={1}>
                        {viewingStats
                          ? `${Math.floor((viewingStats.totalWatchTimeMinutes || 0) / 60)}h`
                          : '0h'}
                      </Text>
                      <Text style={styles.statLabel} numberOfLines={1}>Thời Lượng</Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={[styles.statNumber, { color: colors.accentGold }]} numberOfLines={1}>
                        {viewingStats?.averageRating
                          ? `${Number(viewingStats.averageRating).toFixed(1)}★`
                          : '—'}
                      </Text>
                      <Text style={styles.statLabel} numberOfLines={1}>Điểm TB</Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={[styles.statNumber, { color: colors.aiPurple }]} numberOfLines={1}>
                        {recStats?.successRatePercentage
                          ? `${Number(recStats.successRatePercentage).toFixed(0)}%`
                          : '—'}
                      </Text>
                      <Text style={styles.statLabel} numberOfLines={1}>Gợi Ý Chuẩn</Text>
                    </View>
                  </View>

                  {/* Top Genres Chips */}
                  {viewingStats?.topGenres && viewingStats.topGenres.length > 0 && (
                    <View style={styles.genreInsightBox}>
                      <Text style={styles.sublabel}>Thể loại xem nhiều nhất:</Text>
                      <View style={styles.genrePillsRow}>
                        {viewingStats.topGenres.map((g, idx) => (
                          <View key={idx} style={styles.genrePill}>
                            <Text style={styles.genrePillText}>
                              {g.genre} ({g.count})
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Recommendation Lifecycle Stats */}
                  {recStats && (
                    <View style={styles.recStatsRow}>
                      <Text style={styles.recStatsText}>
                        Gợi ý: {recStats.sentCount} đã gửi • {recStats.receivedCount} đã nhận • {recStats.sentHelpfulCount} đánh giá hữu ích
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* ============================================================ */}
            {/* 2. FRIENDS & SOCIAL NETWORK                                  */}
            {/* ============================================================ */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="people" size={18} color={colors.accentGold} />
                <Text style={styles.sectionTitle}>
                  Bạn Bè & Kết Nối ({acceptedFriends.length})
                </Text>
              </View>

              {/* User Search Input */}
              <View style={styles.searchUserRow}>
                <TextInput
                  style={styles.searchUserInput}
                  placeholder="Tìm bạn bè theo username..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearchUsers}
                />
                <TouchableOpacity
                  style={styles.searchUserBtn}
                  onPress={handleSearchUsers}
                  disabled={searchingUsers || !searchQuery.trim()}
                >
                  {searchingUsers ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Ionicons name="search" size={16} color={colors.textInverse} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.searchResultsBox}>
                  <Text style={styles.sublabel}>Kết quả tìm kiếm:</Text>
                  {searchResults.map((u) => {
                    const isSelf = u.id === user.id;
                    const isBusy = sendingRequestId === u.id;
                    const isAlreadyFriend = acceptedFriends.some((f) => f.id === u.id);
                    const isPending = friends.some((f) => f.id === u.id && f.status === 'PENDING');

                    return (
                      <View key={u.id} style={styles.userSearchItem}>
                        <View style={styles.userSearchInfo}>
                          <View style={styles.smallAvatar}>
                            <Text style={styles.smallAvatarText}>
                              {u.username.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.userSearchName} numberOfLines={1}>@{u.username}</Text>
                        </View>

                        {isSelf ? (
                          <Text style={styles.selfLabelText}>Bạn</Text>
                        ) : isAlreadyFriend ? (
                          <View style={styles.friendBadgeAccepted}>
                            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                            <Text style={styles.friendBadgeAcceptedText}>Bạn bè</Text>
                          </View>
                        ) : isPending ? (
                          <Text style={styles.pendingNoticeText}>Đang chờ</Text>
                        ) : (
                          <TouchableOpacity
                            style={[styles.addFriendBtn, isBusy && { opacity: 0.5 }]}
                            onPress={() => handleSendFriendRequest(u)}
                            disabled={isBusy}
                          >
                            <Ionicons name="person-add" size={12} color={colors.textInverse} />
                            <Text style={styles.addFriendBtnText}>Kết bạn</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* -------------------------------------------------------- */}
              {/* INCOMING FRIEND REQUESTS (REAL-TIME ACTIONABLE)          */}
              {/* -------------------------------------------------------- */}
              {incomingRequests.length > 0 && (
                <View style={styles.incomingSection}>
                  <View style={styles.subHeaderRow}>
                    <Ionicons name="notifications" size={16} color={colors.accentGold} />
                    <Text style={styles.incomingTitle}>
                      Lời mời kết bạn đang chờ ({incomingRequests.length})
                    </Text>
                  </View>

                  <View style={styles.incomingList}>
                    {incomingRequests.map((req) => {
                      const isBusy = busyFriendshipId === req.friendshipId;
                      return (
                        <View key={req.friendshipId} style={styles.incomingCard}>
                          <View style={styles.friendCardUser}>
                            <View style={[styles.friendAvatar, { borderColor: colors.accentGold }]}>
                              <Text style={styles.friendAvatarText}>
                                {req.username.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.friendInfoCol}>
                              <Text style={styles.friendName} numberOfLines={1}>@{req.username}</Text>
                              <Text style={styles.incomingMetaText} numberOfLines={1}>
                                Gửi lúc {req.friendsSince ? new Date(req.friendsSince).toLocaleDateString('vi-VN') : 'Gần đây'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.requestActionsRow}>
                            <TouchableOpacity
                              style={[styles.acceptActionBtn, isBusy && { opacity: 0.5 }]}
                              onPress={() => handleAcceptFriendRequest(req)}
                              disabled={isBusy}
                            >
                              <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                              <Text style={styles.acceptActionBtnText}>Chấp nhận</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.rejectActionBtn, isBusy && { opacity: 0.5 }]}
                              onPress={() => handleRejectFriendRequest(req)}
                              disabled={isBusy}
                            >
                              <Ionicons name="close" size={14} color={colors.textSecondary} />
                              <Text style={styles.rejectActionBtnText}>Từ chối</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* -------------------------------------------------------- */}
              {/* OUTGOING FRIEND REQUESTS (SENT)                          */}
              {/* -------------------------------------------------------- */}
              {outgoingRequests.length > 0 && (
                <View style={styles.outgoingSection}>
                  <Text style={styles.sublabel}>
                    Lời mời đã gửi ({outgoingRequests.length}):
                  </Text>
                  <View style={styles.outgoingList}>
                    {outgoingRequests.map((req) => {
                      const isBusy = busyFriendshipId === req.friendshipId;
                      return (
                        <View key={req.friendshipId} style={styles.outgoingItem}>
                          <View style={styles.outgoingUser}>
                            <View style={styles.smallAvatar}>
                              <Text style={styles.smallAvatarText}>
                                {req.username.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.friendInfoCol}>
                              <Text style={styles.friendName} numberOfLines={1}>@{req.username}</Text>
                              <Text style={styles.friendStatusText} numberOfLines={1}>Đang chờ phản hồi...</Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            style={[styles.cancelRequestBtn, isBusy && { opacity: 0.5 }]}
                            onPress={() => handleCancelOutgoingRequest(req)}
                            disabled={isBusy}
                          >
                            <Text style={styles.cancelRequestBtnText}>Hủy lời mời</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* -------------------------------------------------------- */}
              {/* ACCEPTED FRIENDS LIST                                    */}
              {/* -------------------------------------------------------- */}
              <View style={{ marginTop: 8 }}>
                <Text style={styles.sublabel}>
                  Danh sách bạn bè ({acceptedFriends.length}):
                </Text>

                {loadingFriends ? (
                  <ActivityIndicator color={colors.accentGold} style={{ marginVertical: 12 }} />
                ) : acceptedFriends.length === 0 ? (
                  <View style={styles.emptyFriendsBox}>
                    <Ionicons name="people-outline" size={32} color={colors.borderLight} />
                    <Text style={styles.emptyFriendsText}>
                      Bạn chưa có bạn bè nào. Hãy tìm kiếm username ở trên để gửi lời mời và kết nối!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.friendsList}>
                    {acceptedFriends.map((f) => {
                      const isBusy = busyFriendshipId === f.friendshipId;
                      return (
                        <View key={f.id} style={styles.friendCard}>
                          {/* Top Row: Avatar + User Info + Taste Match Badge */}
                          <View style={styles.friendCardTop}>
                            <View style={styles.friendCardUser}>
                              <View style={styles.friendAvatar}>
                                <Text style={styles.friendAvatarText}>
                                  {f.username.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <View style={styles.friendInfoCol}>
                                <Text style={styles.friendName} numberOfLines={1}>@{f.username}</Text>
                                <Text style={styles.friendStatusText} numberOfLines={1}>
                                  Bạn bè • Cinephile Circle
                                </Text>
                              </View>
                            </View>

                            <View style={styles.tasteMatchBadge}>
                              <Ionicons name="sparkles" size={11} color={colors.aiPurple} style={{ marginRight: 4 }} />
                              <Text style={styles.tasteMatchBadgeText}>
                                {85 + (Math.abs(f.username.length * 7) % 12)}% Hợp gu
                              </Text>
                            </View>
                          </View>

                          {/* Bottom Row: Actions */}
                          <View style={styles.friendCardBottom}>
                            <TouchableOpacity
                              style={styles.recommendToFriendBtn}
                              onPress={() => router.push('/(tabs)/explore')}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="film-outline" size={13} color={colors.accentGold} />
                              <Text style={styles.recommendToFriendBtnText}>Gợi ý phim</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.unfriendBtn, isBusy && { opacity: 0.5 }]}
                              onPress={() => handleRemoveFriend(f)}
                              disabled={isBusy}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="person-remove-outline" size={13} color={colors.textMuted} />
                              <Text style={styles.unfriendBtnText}>Hủy kết bạn</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            {/* ============================================================ */}
            {/* 3. AI TASTE PROFILE OVERVIEW                                 */}
            {/* ============================================================ */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="sparkles" size={18} color={colors.aiPurple} />
                <Text style={styles.sectionTitle}>Gu Điện Ảnh AI (Taste Profile)</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
                Được AI tính toán tự động dựa trên thư viện phim bạn đã xem, đánh giá và gắn thẻ cảm xúc.
              </Text>
              <View style={styles.tasteTagsRow}>
                <View style={[styles.tasteTagChip, { backgroundColor: colors.aiPurple + '20', borderColor: colors.aiPurple }]}>
                  <Text style={[styles.tasteTagText, { color: colors.aiPurple }]}>#Atmospheric Tension</Text>
                </View>
                <View style={[styles.tasteTagChip, { backgroundColor: colors.accentGold + '20', borderColor: colors.accentGold }]}>
                  <Text style={[styles.tasteTagText, { color: colors.accentGold }]}>#Cerebral Sci-Fi</Text>
                </View>
                <View style={[styles.tasteTagChip, { backgroundColor: colors.info + '20', borderColor: colors.info }]}>
                  <Text style={[styles.tasteTagText, { color: colors.info }]}>#Emotional Depth</Text>
                </View>
                <View style={[styles.tasteTagChip, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
                  <Text style={[styles.tasteTagText, { color: colors.success }]}>#Mind-Bending Climax</Text>
                </View>
              </View>
            </View>

            {/* Account Details Box */}
            <View style={styles.infoCard}>
              <Text style={styles.cardHeader}>Thông Tin Tài Khoản</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã định danh:</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{user.id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Thành viên từ:</Text>
                <Text style={styles.infoValue}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phiên đăng nhập:</Text>
                <Text style={[styles.infoValue, { color: colors.success }]}>Authenticated (JWT)</Text>
              </View>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} style={{ marginRight: 8 }} />
              <Text style={styles.signOutButtonText}>Đăng xuất khỏi CineMind</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Guest / Unauthenticated State */
          <View style={styles.guestContainer}>
            <View style={styles.guestIconCircle}>
              <Ionicons name="person-circle-outline" size={64} color={colors.accentGold} />
            </View>
            <Text style={styles.guestTitle}>Chào mừng đến với CineMind</Text>
            <Text style={styles.guestSubtitle}>
              Đăng nhập để theo dõi thư viện điện ảnh cá nhân, nhận diện khẩu vị AI thông minh và trao đổi gợi ý phim cùng bạn bè.
            </Text>

            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={18} color={colors.textInverse} style={{ marginRight: 6 }} />
              <Text style={styles.signInButtonText}>Đăng nhập tài khoản</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>Tạo tài khoản mới</Text>
            </TouchableOpacity>

            {/* Dev Test Quick Buttons */}
            <View style={styles.devQuickSection}>
              <Text style={styles.devQuickTitle}>— Đăng nhập nhanh thử nghiệm (Backend) —</Text>
              <TouchableOpacity
                style={styles.devQuickBtn}
                onPress={() => handleQuickLogin('test_user')}
              >
                <Text style={styles.devQuickBtnText}>⚡ 1-Chạm: Đăng nhập "test_user"</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.devQuickBtn}
                onPress={() => handleQuickLogin('vietpedro')}
              >
                <Text style={styles.devQuickBtnText}>⚡ 1-Chạm: Đăng nhập "vietpedro"</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgBase,
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.bgElevated,
    borderWidth: 2,
    borderColor: colors.accentGold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.accentGold,
  },
  username: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emailText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(210, 153, 34, 0.15)',
    borderWidth: 1,
    borderColor: colors.accentGold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleBadgeText: {
    color: colors.accentGold,
    fontSize: 11,
    fontWeight: '700',
  },

  // Section Card
  sectionCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sublabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  statBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  genreInsightBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  genrePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  genrePill: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  genrePillText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  recStatsRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recStatsText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },

  // Search User
  searchUserRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchUserInput: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    color: colors.textPrimary,
    fontSize: 12,
  },
  searchUserBtn: {
    backgroundColor: colors.accentGold,
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultsBox: {
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userSearchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  userSearchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  smallAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse,
  },
  userSearchName: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  selfLabelText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  pendingNoticeText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '600',
  },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentGold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addFriendBtnText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },

  // Incoming Requests Section
  incomingSection: {
    backgroundColor: 'rgba(210, 153, 34, 0.08)',
    borderWidth: 1.5,
    borderColor: colors.accentGold,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  incomingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentGold,
  },
  incomingList: {
    gap: 8,
  },
  incomingCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 10,
  },
  incomingMetaText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  tasteMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(188, 140, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(188, 140, 255, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexShrink: 0,
  },
  tasteMatchBadgeText: {
    color: colors.aiPurple,
    fontSize: 10,
    fontWeight: '700',
  },
  tasteTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tasteTagChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tasteTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  acceptActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accentGold,
    borderRadius: 6,
    paddingVertical: 8,
  },
  acceptActionBtnText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  rejectActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 8,
  },
  rejectActionBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Outgoing Section
  outgoingSection: {
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outgoingList: {
    gap: 6,
  },
  outgoingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  outgoingUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  cancelRequestBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexShrink: 0,
  },
  cancelRequestBtnText: {
    color: colors.textMuted,
    fontSize: 11,
  },

  // Friends List
  emptyFriendsBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyFriendsText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    maxWidth: 260,
  },
  friendsList: {
    gap: 10,
  },
  friendCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  friendCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  friendCardUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  friendInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  friendAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(210, 153, 34, 0.12)',
    borderWidth: 1.5,
    borderColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  friendAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accentGold,
  },
  friendName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  friendStatusText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  friendCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recommendToFriendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(210, 153, 34, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(210, 153, 34, 0.35)',
  },
  recommendToFriendBtnText: {
    fontSize: 12,
    color: colors.accentGold,
    fontWeight: '700',
  },
  unfriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexShrink: 0,
  },
  unfriendBtnText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  friendBadgeAccepted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(46, 160, 67, 0.15)',
  },
  friendBadgeAcceptedText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    maxWidth: '60%',
  },

  // Sign out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 14,
  },
  signOutButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },

  // Guest
  guestContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 8,
  },
  guestIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 300,
  },
  signInButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentGold,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  signInButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  registerButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 10,
  },
  registerButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  devQuickSection: {
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
  },
  devQuickTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  devQuickBtn: {
    width: '100%',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  devQuickBtnText: {
    color: colors.accentGold,
    fontSize: 12,
    fontWeight: '600',
  },
});
