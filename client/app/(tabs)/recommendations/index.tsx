import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../../src/components/AppHeader';
import ErrorState from '../../../src/components/ErrorState';
import { useAlert } from '../../../src/context/AlertContext';
import { api, getAuthToken } from '../../../src/services/api';
import { MovieRecommendation } from '../../../src/types';
import { colors } from '../../../src/theme/colors';

export default function RecommendationsScreen() {
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [inboxRecommendations, setInboxRecommendations] = useState<MovieRecommendation[]>([]);
  const [sentRecommendations, setSentRecommendations] = useState<MovieRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Feedback Modal State
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedRec, setSelectedRec] = useState<MovieRecommendation | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(8.0);
  const [feedbackHelpful, setFeedbackHelpful] = useState<boolean>(true);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadData = async (silent = false) => {
    if (!getAuthToken()) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      setHasError(false);
      const [inbox, sent] = await Promise.all([
        api.getRecommendationsInbox().catch(() => []),
        api.getSentRecommendations().catch(() => []),
      ]);
      setInboxRecommendations(inbox || []);
      setSentRecommendations(sent || []);
    } catch (e) {
      console.error(e);
      if (!silent) setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [])
  );

  // Periodic polling while on screen to keep inbox/sent counts live
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleAddToWatchlist = async (rec: MovieRecommendation) => {
    try {
      setActionLoadingId(rec.id);
      await api.updateRecommendationStatus(rec.id, 'ADDED_TO_WATCHLIST');
      await api.saveLibraryEntry({
        movieId: rec.movie.id,
        status: 'WANT_TO_WATCH',
      });
      setInboxRecommendations((prev) =>
        prev.map((item) =>
          item.id === rec.id ? { ...item, status: 'ADDED_TO_WATCHLIST' } : item
        )
      );
      showAlert({
        title: 'Đã lưu vào danh sách xem!',
        message: `"${rec.movie.title}" đã được thêm vào Watchlist của bạn.`,
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: 'Lỗi cập nhật',
        message: err.response?.data?.error?.message || 'Không thể cập nhật trạng thái.',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismiss = async (rec: MovieRecommendation) => {
    try {
      setActionLoadingId(rec.id);
      await api.updateRecommendationStatus(rec.id, 'DISMISSED');
      setInboxRecommendations((prev) =>
        prev.map((item) =>
          item.id === rec.id ? { ...item, status: 'DISMISSED' } : item
        )
      );
    } catch (err: any) {
      showAlert({
        title: 'Lỗi bỏ qua',
        message: err.response?.data?.error?.message || 'Không thể bỏ qua gợi ý này.',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openFeedbackModal = (rec: MovieRecommendation) => {
    setSelectedRec(rec);
    setFeedbackRating(rec.recipientRating ? Number(rec.recipientRating) : 8.0);
    setFeedbackHelpful(rec.isHelpful ?? true);
    setFeedbackModalVisible(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedRec) return;
    try {
      setSubmittingFeedback(true);
      await api.sendRecommendationFeedback(selectedRec.id, {
        isHelpful: feedbackHelpful,
        recipientRating: feedbackRating,
      });
      setInboxRecommendations((prev) =>
        prev.map((item) =>
          item.id === selectedRec.id
            ? {
                ...item,
                status: 'RATED',
                isHelpful: feedbackHelpful,
                recipientRating: feedbackRating,
              }
            : item
        )
      );
      setFeedbackModalVisible(false);
      showAlert({
        title: 'Đã gửi phản hồi!',
        message: `Cảm ơn bạn đã phản hồi gợi ý phim "${selectedRec.movie.title}". Bạn của bạn sẽ nhận được thông báo này.`,
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: 'Lỗi gửi phản hồi',
        message: err.response?.data?.error?.message || 'Không thể gửi phản hồi lúc này.',
        type: 'error',
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getStatusBadgeConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: colors.warningDim, text: colors.warning, label: 'Mới nhận' };
      case 'SEEN':
        return { bg: colors.infoDim, text: colors.info, label: 'Đã xem' };
      case 'ADDED_TO_WATCHLIST':
        return { bg: colors.accentGoldDim, text: colors.accentGold, label: 'Trong Watchlist' };
      case 'WATCHED':
        return { bg: colors.aiPurpleDim, text: colors.aiPurple, label: 'Đã xem phim' };
      case 'RATED':
        return { bg: colors.successDim, text: colors.success, label: 'Đã phản hồi' };
      case 'DISMISSED':
        return { bg: colors.bgElevated, text: colors.textMuted, label: 'Đã bỏ qua' };
      default:
        return { bg: colors.bgElevated, text: colors.textSecondary, label: status };
    }
  };

  const renderInboxItem = ({ item }: { item: MovieRecommendation }) => {
    const badge = getStatusBadgeConfig(item.status);
    const isActionBusy = actionLoadingId === item.id;

    return (
      <View style={styles.card}>
        {/* Card Header: Sender & Status */}
        <View style={styles.header}>
          <View style={styles.senderRow}>
            <View style={styles.senderAvatar}>
              <Text style={styles.avatarInitial}>
                {item.sender?.username ? item.sender.username.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.senderName}>@{item.sender?.username || 'Bạn bè'}</Text>
              <Text style={styles.recommendedDate}>Gửi gợi ý cho bạn</Text>
            </View>
          </View>

          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Message Bubble */}
        {item.message ? (
          <View style={styles.messageBubble}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textMuted} style={styles.quoteIcon} />
            <Text style={styles.message}>"{item.message}"</Text>
          </View>
        ) : null}

        {/* Recommended Movie Row */}
        <TouchableOpacity
          style={styles.movieRow}
          onPress={() => router.push({ pathname: '/movie/[id]', params: { id: item.movie.id } })}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.movie.posterUrl || 'https://placehold.co/100x150?text=Movie' }}
            style={styles.poster}
            resizeMode="cover"
          />
          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle} numberOfLines={1}>
              {item.movie.title}
            </Text>
            <Text style={styles.movieMeta}>
              {item.movie.releaseYear} • {item.movie.genres?.slice(0, 2).join(', ')}
            </Text>
            <View style={styles.aiHintPill}>
              <Ionicons name="sparkles" size={12} color={colors.aiPurple} style={{ marginRight: 4 }} />
              <Text style={styles.aiHintText}>AI Match & Pre-Watch</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Lifecycle Actions */}
        {(item.status === 'PENDING' || item.status === 'SEEN') && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.primaryActionBtn, isActionBusy && { opacity: 0.5 }]}
              onPress={() => handleAddToWatchlist(item)}
              disabled={isActionBusy}
            >
              <Ionicons name="bookmark" size={14} color={colors.textInverse} />
              <Text style={styles.primaryActionBtnText}>Thêm vào Watchlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dismissBtn, isActionBusy && { opacity: 0.5 }]}
              onPress={() => handleDismiss(item)}
              disabled={isActionBusy}
            >
              <Text style={styles.dismissBtnText}>Bỏ qua</Text>
            </TouchableOpacity>
          </View>
        )}

        {(item.status === 'ADDED_TO_WATCHLIST' || item.status === 'WATCHED') && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.feedbackActionBtn}
              onPress={() => openFeedbackModal(item)}
            >
              <Ionicons name="star" size={14} color={colors.accentGold} />
              <Text style={styles.feedbackActionBtnText}>Đã xem phim & Gửi phản hồi</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'RATED' && (
          <View style={styles.ratedInfoBanner}>
            <Ionicons
              name={item.isHelpful ? 'thumbs-up' : 'thumbs-down'}
              size={14}
              color={item.isHelpful ? colors.success : colors.warning}
            />
            <Text style={styles.ratedInfoText}>
              Đã đánh giá {item.recipientRating ? Number(item.recipientRating).toFixed(1) : ''}★ • {item.isHelpful ? 'Hợp gu & Hữu ích' : 'Không đúng gu'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSentItem = ({ item }: { item: MovieRecommendation }) => {
    const badge = getStatusBadgeConfig(item.status);

    return (
      <View style={styles.card}>
        {/* Card Header: Recipient & Status */}
        <View style={styles.header}>
          <View style={styles.senderRow}>
            <View style={[styles.senderAvatar, { borderColor: colors.aiPurple }]}>
              <Text style={[styles.avatarInitial, { color: colors.aiPurple }]}>
                {item.recipient?.username ? item.recipient.username.charAt(0).toUpperCase() : 'B'}
              </Text>
            </View>
            <View>
              <Text style={styles.senderName}>Gửi tới @{item.recipient?.username || 'Bạn bè'}</Text>
              <Text style={styles.recommendedDate}>
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
              </Text>
            </View>
          </View>

          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Message Bubble */}
        {item.message ? (
          <View style={styles.messageBubble}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textMuted} style={styles.quoteIcon} />
            <Text style={styles.message}>"{item.message}"</Text>
          </View>
        ) : null}

        {/* Movie Row */}
        <TouchableOpacity
          style={styles.movieRow}
          onPress={() => router.push({ pathname: '/movie/[id]', params: { id: item.movie.id } })}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.movie.posterUrl || 'https://placehold.co/100x150?text=Movie' }}
            style={styles.poster}
            resizeMode="cover"
          />
          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle} numberOfLines={1}>
              {item.movie.title}
            </Text>
            <Text style={styles.movieMeta}>
              {item.movie.releaseYear} • {item.movie.genres?.slice(0, 2).join(', ')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Feedback received info */}
        {item.status === 'RATED' && (
          <View style={styles.feedbackReceivedCard}>
            <Ionicons
              name={item.isHelpful ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={item.isHelpful ? colors.success : colors.textMuted}
            />
            <Text style={styles.feedbackReceivedText}>
              Bạn bè đã đánh giá {item.recipientRating ? Number(item.recipientRating).toFixed(1) : ''}★ • {item.isHelpful ? 'Thấy rất hữu ích 👍' : 'Không thích 👎'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const currentList = activeTab === 'inbox' ? inboxRecommendations : sentRecommendations;

  return (
    <View style={styles.screenWrapper}>
      {/* Unified Cinematic AppHeader */}
      <AppHeader
        title="Gợi Ý & Bạn Bè"
        icon="sparkles"
        subtitle={`${inboxRecommendations.length} gợi ý nhận • ${sentRecommendations.length} đã gửi`}
      />

      <View style={styles.container}>
        {/* Segmented Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'inbox' && styles.tabBtnActive]}
            onPress={() => setActiveTab('inbox')}
          >
            <Ionicons
              name="mail-outline"
              size={14}
              color={activeTab === 'inbox' ? colors.accentGold : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeTab === 'inbox' && styles.tabBtnTextActive]}>
              Hộp thư đến ({inboxRecommendations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'sent' && styles.tabBtnActive]}
            onPress={() => setActiveTab('sent')}
          >
            <Ionicons
              name="paper-plane-outline"
              size={14}
              color={activeTab === 'sent' ? colors.accentGold : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeTab === 'sent' && styles.tabBtnTextActive]}>
              Đã gửi ({sentRecommendations.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accentGold} />
            <Text style={styles.loadingText}>Đang tải danh sách gợi ý...</Text>
          </View>
        ) : (
          <FlatList
            data={currentList}
            keyExtractor={(item) => item.id}
            renderItem={activeTab === 'inbox' ? renderInboxItem : renderSentItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentGold} />
            }
            ListEmptyComponent={
              hasError ? (
                <ErrorState
                  title="Mất kết nối máy chủ"
                  message="Không thể tải hòm thư gợi ý phim từ bạn bè. Vui lòng kiểm tra lại mạng hoặc thử lại."
                  onRetry={onRefresh}
                  retrying={refreshing}
                  type="offline"
                />
              ) : (
                <View style={styles.empty}>
                  <Ionicons
                    name={activeTab === 'inbox' ? 'mail-unread-outline' : 'paper-plane-outline'}
                    size={48}
                    color={colors.borderLight}
                  />
                  <Text style={styles.emptyText}>
                    {activeTab === 'inbox' ? 'Chưa có đề xuất phim nào' : 'Chưa gửi gợi ý nào'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {activeTab === 'inbox'
                      ? 'Kết nối cùng bạn bè yêu điện ảnh để trao đổi gợi ý phim hay'
                      : 'Mở một bộ phim yêu thích và bấm "Giới thiệu bạn bè" để bắt đầu chia sẻ!'}
                  </Text>
                </View>
              )
            }
          />
        )}
      </View>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Phản hồi gợi ý phim</Text>
              <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedRec && (
              <Text style={styles.modalSubtitle}>
                Gửi cảm nhận về phim "{selectedRec.movie.title}" cho @{selectedRec.sender?.username}
              </Text>
            )}

            {/* Rating Selector */}
            <Text style={styles.fieldLabel}>Điểm đánh giá của bạn: {feedbackRating.toFixed(1)} / 10</Text>
            <View style={styles.ratingRow}>
              {[5.0, 6.0, 7.0, 8.0, 9.0, 10.0].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[styles.ratingChip, feedbackRating === score && styles.ratingChipActive]}
                  onPress={() => setFeedbackRating(score)}
                >
                  <Text
                    style={[styles.ratingChipText, feedbackRating === score && styles.ratingChipTextActive]}
                  >
                    ★ {score.toFixed(0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Helpful Toggle */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Gợi ý này có hợp gu bạn không?</Text>
            <View style={styles.helpfulToggleRow}>
              <TouchableOpacity
                style={[styles.helpfulBtn, feedbackHelpful && styles.helpfulBtnActive]}
                onPress={() => setFeedbackHelpful(true)}
              >
                <Ionicons
                  name="thumbs-up"
                  size={16}
                  color={feedbackHelpful ? colors.success : colors.textMuted}
                />
                <Text style={[styles.helpfulBtnText, feedbackHelpful && styles.helpfulBtnTextActive]}>
                  Rất hợp gu / Hay
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.helpfulBtn, !feedbackHelpful && styles.helpfulBtnActiveDanger]}
                onPress={() => setFeedbackHelpful(false)}
              >
                <Ionicons
                  name="thumbs-down"
                  size={16}
                  color={!feedbackHelpful ? colors.danger : colors.textMuted}
                />
                <Text
                  style={[
                    styles.helpfulBtnText,
                    !feedbackHelpful && { color: colors.danger, fontWeight: '700' },
                  ]}
                >
                  Không đúng gu
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitFeedbackBtn, submittingFeedback && { opacity: 0.6 }]}
              onPress={handleSubmitFeedback}
              disabled={submittingFeedback}
            >
              {submittingFeedback ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={styles.submitFeedbackBtnText}>Hoàn tất phản hồi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.bgSurface,
  },
  tabBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: colors.accentGold,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 90,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitial: {
    color: colors.accentGold,
    fontSize: 14,
    fontWeight: '700',
  },
  senderName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  recommendedDate: {
    color: colors.textMuted,
    fontSize: 11,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quoteIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  message: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  movieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  poster: {
    width: 48,
    height: 72,
    borderRadius: 6,
    backgroundColor: colors.bgSubtle,
  },
  movieInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  movieTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  movieMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  aiHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.aiPurpleDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiHintText: {
    color: colors.aiPurple,
    fontSize: 10,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryActionBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accentGold,
    borderRadius: 8,
    paddingVertical: 9,
  },
  primaryActionBtnText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  dismissBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 9,
  },
  dismissBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.accentGold,
    borderRadius: 8,
    paddingVertical: 9,
  },
  feedbackActionBtnText: {
    color: colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  ratedInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratedInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  feedbackReceivedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(46, 160, 67, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  feedbackReceivedText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 260,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ratingChip: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
  },
  ratingChipActive: {
    backgroundColor: 'rgba(210, 153, 34, 0.25)',
    borderColor: colors.accentGold,
  },
  ratingChipText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  ratingChipTextActive: {
    color: colors.accentGold,
    fontWeight: '700',
  },
  helpfulToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  helpfulBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
  },
  helpfulBtnActive: {
    borderColor: colors.success,
    backgroundColor: 'rgba(46, 160, 67, 0.15)',
  },
  helpfulBtnActiveDanger: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(248, 81, 73, 0.15)',
  },
  helpfulBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  helpfulBtnTextActive: {
    color: colors.success,
    fontWeight: '700',
  },
  submitFeedbackBtn: {
    backgroundColor: colors.accentGold,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitFeedbackBtnText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
});
