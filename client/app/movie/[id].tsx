import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../src/context/AlertContext';
import ErrorState from '../../src/components/ErrorState';
import { api, getAuthToken } from '../../src/services/api';
import { Movie, PreWatchAnalysis, LibraryEntry, FriendResponse } from '../../src/types';
import { colors } from '../../src/theme/colors';

const STATUS_OPTIONS = [
  { label: 'Want to Watch', value: 'WANT_TO_WATCH', icon: 'bookmark-outline' },
  { label: 'Watching', value: 'WATCHING', icon: 'play-circle-outline' },
  { label: 'Watched', value: 'WATCHED', icon: 'checkmark-circle-outline' },
  { label: 'Dropped', value: 'DROPPED', icon: 'close-circle-outline' },
];

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showAlert } = useAlert();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [preWatch, setPreWatch] = useState<PreWatchAnalysis | null>(null);
  const [spoilersEnabled, setSpoilersEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // Library Tracking State
  const [selectedStatus, setSelectedStatus] = useState<'WANT_TO_WATCH' | 'WATCHING' | 'WATCHED' | 'DROPPED'>('WANT_TO_WATCH');
  const [rating, setRating] = useState<number>(8.0);
  const [savingLibrary, setSavingLibrary] = useState(false);
  const [libraryEntry, setLibraryEntry] = useState<LibraryEntry | null>(null);
  const [librarySuccessMsg, setLibrarySuccessMsg] = useState<string | null>(null);

  // Custom Tags & Rewatch state
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [rewatchCount, setRewatchCount] = useState<number>(0);

  // Recommend to Friend State
  const [recommendModalVisible, setRecommendModalVisible] = useState(false);
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [recommendNote, setRecommendNote] = useState('');
  const [sendingRecommend, setSendingRecommend] = useState(false);

  // Q&A state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [qaLoading, setQaLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadMovieDetails(id);
      loadPreWatch(id, spoilersEnabled);
      loadExistingLibraryEntry(id);
    }
  }, [id, spoilersEnabled]);

  const loadMovieDetails = async (movieId: string) => {
    try {
      setLoading(true);
      const data = await api.getMovieDetails(movieId);
      setMovie(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingLibraryEntry = async (movieId: string) => {
    if (!getAuthToken()) return;
    try {
      const entry = await api.getLibraryEntry(movieId);
      if (entry) {
        setLibraryEntry(entry);
        setSelectedStatus(entry.status as any);
        if (entry.rating) setRating(entry.rating);
        if (entry.tags) setTags(entry.tags);
        if (typeof entry.rewatchCount === 'number') setRewatchCount(entry.rewatchCount);
      }
    } catch {
      // Not in library yet
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const openRecommendModal = async () => {
    if (!getAuthToken()) {
      showAlert({
        title: 'Yêu cầu đăng nhập',
        message: 'Vui lòng đăng nhập tài khoản để giới thiệu phim cho bạn bè.',
        type: 'info',
        buttons: [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Đăng nhập ngay', onPress: () => router.push('/(auth)/login') },
        ],
      });
      return;
    }

    setRecommendModalVisible(true);
    try {
      setLoadingFriends(true);
      const data = await api.getFriends();
      const acceptedFriends = data.filter((f) => f.status === 'ACCEPTED');
      setFriends(acceptedFriends);
      if (acceptedFriends.length > 0 && !selectedFriendId) {
        setSelectedFriendId(acceptedFriends[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleSendRecommendation = async () => {
    if (!selectedFriendId || !id) {
      showAlert({
        title: 'Chọn bạn bè',
        message: 'Vui lòng chọn một người bạn để gửi lời giới thiệu.',
        type: 'warning',
      });
      return;
    }

    try {
      setSendingRecommend(true);
      await api.sendRecommendation({
        recipientId: selectedFriendId,
        movieId: id,
        message: recommendNote.trim() || undefined,
      });
      setRecommendModalVisible(false);
      setRecommendNote('');
      showAlert({
        title: 'Thành công!',
        message: 'Đã gửi lời giới thiệu phim thành công đến bạn của bạn.',
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: 'Lỗi gửi giới thiệu',
        message: err.response?.data?.error?.message || 'Không thể gửi giới thiệu phim.',
        type: 'error',
      });
    } finally {
      setSendingRecommend(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!getAuthToken()) {
      showAlert({
        title: 'Yêu cầu đăng nhập',
        message: 'Vui lòng đăng nhập tài khoản để theo dõi phim và lưu nhật ký.',
        type: 'info',
        buttons: [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Đăng nhập ngay', onPress: () => router.push('/(auth)/login') },
        ],
      });
      return;
    }

    try {
      setSavingLibrary(true);
      const res = await api.saveLibraryEntry({
        movieId: id!,
        status: selectedStatus,
        rating: selectedStatus === 'WATCHED' ? rating : null,
        tags,
        rewatchCount,
      });
      setLibraryEntry(res);
      setLibrarySuccessMsg(`✓ Đã lưu phim vào danh sách "${selectedStatus}"!`);
      setTimeout(() => setLibrarySuccessMsg(null), 4000);
    } catch (err: any) {
      const isNetwork = !err.response || err.code === 'ERR_NETWORK';
      showAlert({
        title: isNetwork ? 'Mất kết nối máy chủ' : 'Lỗi lưu thư viện',
        message: isNetwork
          ? 'Không thể kết nối đến máy chủ CineMind Backend để lưu trạng thái phim.'
          : err.response?.data?.error?.message || 'Không thể lưu vào thư viện.',
        type: 'error',
      });
    } finally {
      setSavingLibrary(false);
    }
  };


  const loadPreWatch = async (movieId: string, spoilers: boolean) => {
    try {
      setAiLoading(true);
      const data = await api.getPreWatch(movieId, spoilers);
      setPreWatch(data);
    } catch {
      // Optional fallback if AI service key not configured
    } finally {
      setAiLoading(false);
    }
  };

  const toggleSpoilers = () => {
    if (!spoilersEnabled) {
      showAlert({
        title: 'Cảnh báo Tiết lộ Nội dung (Spoilers)',
        message: 'Bật chế độ này sẽ hiển thị các tình tiết quan trọng, cú twist bất ngờ và kết thúc phim. Bạn có chắc chắn muốn xem?',
        type: 'warning',
        buttons: [
          { text: 'Giữ an toàn', style: 'cancel' },
          {
            text: 'Hiển thị Spoilers',
            style: 'destructive',
            onPress: () => setSpoilersEnabled(true),
          },
        ],
      });
    } else {
      setSpoilersEnabled(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !id) return;
    try {
      setQaLoading(true);
      const res = await api.askAiQuestion(id, question, spoilersEnabled);
      setAnswer(res.answer);
    } catch (err: any) {
      const isNetwork = !err.response || err.code === 'ERR_NETWORK';
      showAlert({
        title: isNetwork ? 'Mất kết nối máy chủ' : 'Thông báo AI CineMind',
        message: isNetwork
          ? 'Không thể kết nối tới máy chủ để gửi câu hỏi cho AI.'
          : 'Trợ lý AI sẵn sàng phân tích phim. Hãy đảm bảo máy chủ Backend đã được thiết lập khóa GEMINI_API_KEY.',
        type: isNetwork ? 'error' : 'info',
      });
    } finally {
      setQaLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentGold} />
        <Text style={styles.loadingText}>Đang tải thông tin phim từ máy chủ...</Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.loadingContainer}>
        <ErrorState
          title="Không tìm thấy thông tin phim"
          message="Không thể kết nối máy chủ hoặc phim này không tồn tại trong hệ thống."
          onRetry={() => id && loadMovieDetails(id)}
          type="offline"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Backdrop Header */}
      <View style={styles.backdropWrapper}>
        <Image
          source={{
            uri:
              movie.backdropUrl ||
              movie.posterUrl ||
              'https://placehold.co/800x450?text=CineMind+Backdrop',
          }}
          style={styles.backdrop}
          resizeMode="cover"
        />
        <View style={styles.backdropOverlay} />
      </View>

      <View style={styles.content}>
        {/* Main Info Row with Overlapping Poster */}
        <View style={styles.headerRow}>
          <Image
            source={{ uri: movie.posterUrl || 'https://placehold.co/150x225?text=Poster' }}
            style={styles.poster}
            resizeMode="cover"
          />
          <View style={styles.meta}>
            <Text style={styles.title}>{movie.title}</Text>
            <View style={styles.runtimeRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.submetaText}>{movie.releaseYear}</Text>
              <Text style={styles.bullet}>•</Text>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.submetaText}>{movie.runtimeMinutes} phút</Text>
            </View>

            {/* Genre tags */}
            <View style={styles.genreTagsRow}>
              {movie.genres?.map((g, idx) => (
                <View key={idx} style={styles.genreBadge}>
                  <Text style={styles.genreBadgeText}>{g}</Text>
                </View>
              ))}
            </View>

            {movie.director && (
              <View style={styles.directorRow}>
                <Ionicons name="videocam-outline" size={13} color={colors.accentGold} />
                <Text style={styles.directorText}>Đạo diễn: {movie.director}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ============================================================ */}
        {/* PERSONAL LIBRARY ACTION CARD - Interactive Backend Test     */}
        {/* ============================================================ */}
        <View style={styles.libraryCard}>
          <View style={styles.libraryCardHeader}>
            <Ionicons name="bookmark" size={18} color={colors.accentGold} />
            <Text style={styles.libraryCardTitle}>Nhật ký & Thư viện cá nhân</Text>
            {libraryEntry && (
              <View style={styles.inLibraryBadge}>
                <Text style={styles.inLibraryBadgeText}>Đã lưu</Text>
              </View>
            )}
          </View>

          {librarySuccessMsg && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>{librarySuccessMsg}</Text>
            </View>
          )}

          {/* Status Selection Buttons */}
          <Text style={styles.sublabel}>Chọn trạng thái xem:</Text>
          <View style={styles.statusGrid}>
            {STATUS_OPTIONS.map((opt) => {
              const isActive = selectedStatus === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.statusButton, isActive && styles.statusButtonActive]}
                  onPress={() => setSelectedStatus(opt.value as any)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={14}
                    color={isActive ? colors.textInverse : colors.textSecondary}
                  />
                  <Text style={[styles.statusButtonText, isActive && styles.statusButtonTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Rating selector if status is WATCHED */}
          {selectedStatus === 'WATCHED' && (
            <View style={styles.ratingSection}>
              <Text style={styles.sublabel}>Đánh giá của bạn: {rating.toFixed(1)} / 10.0</Text>
              <View style={styles.ratingStarsRow}>
                {[5.0, 6.0, 7.0, 8.0, 9.0, 10.0].map((score) => (
                  <TouchableOpacity
                    key={score}
                    style={[styles.ratingPill, rating === score && styles.ratingPillActive]}
                    onPress={() => setRating(score)}
                  >
                    <Text style={[styles.ratingPillText, rating === score && styles.ratingPillTextActive]}>
                      ★ {score.toFixed(0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Rewatch Counter */}
          <View style={styles.rewatchSection}>
            <Text style={styles.sublabel}>Số lần xem lại (Rewatches): {rewatchCount}</Text>
            <View style={styles.rewatchRow}>
              <TouchableOpacity
                style={styles.rewatchBtn}
                onPress={() => setRewatchCount(Math.max(0, rewatchCount - 1))}
              >
                <Ionicons name="remove" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.rewatchValue}>{rewatchCount}</Text>
              <TouchableOpacity
                style={styles.rewatchBtn}
                onPress={() => setRewatchCount(rewatchCount + 1)}
              >
                <Ionicons name="add" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Custom Tags Section */}
          <View style={styles.tagsSection}>
            <Text style={styles.sublabel}>Gắn thẻ riêng (Custom Tags):</Text>
            {tags.length > 0 && (
              <View style={styles.tagsList}>
                {tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>#{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                      <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.addTagRow}>
              <TextInput
                style={styles.tagInput}
                placeholder="Thêm tag (VD: Hack não, Cảm động...)"
                placeholderTextColor={colors.textMuted}
                value={newTagInput}
                onChangeText={setNewTagInput}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity style={styles.addTagBtn} onPress={handleAddTag}>
                <Text style={styles.addTagBtnText}>Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveLibraryBtn, savingLibrary && { opacity: 0.6 }]}
            onPress={handleSaveToLibrary}
            disabled={savingLibrary}
            activeOpacity={0.8}
          >
            {savingLibrary ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Text style={styles.saveLibraryBtnText}>
                {libraryEntry ? 'Cập nhật Thư viện' : 'Lưu vào Thư viện của tôi'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Action Row: Journal & Recommend to Friend */}
          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={styles.journalActionBtn}
              onPress={() => router.push(`/journal/${id}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="book-outline" size={16} color={colors.accentGold} />
              <Text style={styles.journalActionBtnText}>
                {libraryEntry?.hasJournal ? 'Xem Nhật Ký' : 'Viết Nhật Ký'}
              </Text>
              {libraryEntry?.hasJournal && <View style={styles.hasJournalDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recommendActionBtn}
              onPress={openRecommendModal}
              activeOpacity={0.8}
            >
              <Ionicons name="paper-plane-outline" size={16} color={colors.textPrimary} />
              <Text style={styles.recommendActionBtnText}>Giới thiệu bạn bè</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Synopsis Section */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Tổng quan nội dung</Text>
          <Text style={styles.synopsis}>{movie.synopsis}</Text>
        </View>

        {/* AI Pre-Watch Section */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiHeaderLeft}>
              <View style={styles.aiIconBadge}>
                <Ionicons name="sparkles" size={16} color={colors.aiPurple} />
              </View>
              <View>
                <Text style={styles.aiTitle}>Phân tích trước khi xem (AI Pre-Watch)</Text>
                <View style={styles.spoilerStatusRow}>
                  <Ionicons
                    name={spoilersEnabled ? 'warning' : 'shield-checkmark'}
                    size={12}
                    color={spoilersEnabled ? colors.danger : colors.success}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.spoilerBadgeText,
                      { color: spoilersEnabled ? colors.danger : colors.success },
                    ]}
                  >
                    {spoilersEnabled ? 'Chế độ Spoilers: ĐANG BẬT' : 'Khiên chống Spoilers: BẢO VỆ AN TOÀN'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.spoilerButton,
                spoilersEnabled ? styles.spoilerButtonActive : undefined,
              ]}
              onPress={toggleSpoilers}
              activeOpacity={0.8}
            >
              <Text style={styles.spoilerButtonText}>
                {spoilersEnabled ? 'Ẩn Spoilers' : 'Mở Spoilers'}
              </Text>
            </TouchableOpacity>
          </View>

          {aiLoading ? (
            <View style={styles.aiLoadingBox}>
              <ActivityIndicator size="small" color={colors.aiPurple} />
              <Text style={styles.aiLoadingText}>AI đang phân tích tác phẩm...</Text>
            </View>
          ) : preWatch ? (
            <View style={styles.aiBody}>
              <View style={styles.scoreContainer}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreNumber}>{preWatch.matchScore}%</Text>
                  <Text style={styles.scoreLabel}>Độ phù hợp</Text>
                </View>
                <View style={styles.scoreDetails}>
                  <Text style={styles.confidenceText}>
                    Độ tin cậy: <Text style={styles.highlightConfidence}>{preWatch.confidence}</Text>
                  </Text>
                  <Text style={styles.toneText}>Tông điệu: {preWatch.tone}</Text>
                  <Text style={styles.toneText}>Nhịp phim: {preWatch.pacing}</Text>
                  {preWatch.recommendedSetting && (
                    <Text style={styles.toneText}>Gợi ý xem: {preWatch.recommendedSetting}</Text>
                  )}
                </View>
              </View>

              {/* Reasons to Watch */}
              {preWatch.reasonsToWatch && preWatch.reasonsToWatch.length > 0 && (
                <View style={styles.reasonsContainer}>
                  <Text style={styles.reasonsHeader}>✨ Lý do phù hợp với gu của bạn:</Text>
                  {preWatch.reasonsToWatch.map((r, idx) => (
                    <View key={idx} style={styles.reasonRow}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginRight: 6, marginTop: 2 }} />
                      <Text style={styles.reasonText}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Potential Concerns / Cautions */}
              {preWatch.potentialConcerns && preWatch.potentialConcerns.length > 0 && (
                <View style={[styles.reasonsContainer, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 8 }]}>
                  <Text style={[styles.reasonsHeader, { color: colors.warning }]}>⚠️ Lưu ý trước khi xem:</Text>
                  {preWatch.potentialConcerns.map((c, idx) => (
                    <View key={idx} style={styles.reasonRow}>
                      <Ionicons name="alert-circle" size={14} color={colors.warning} style={{ marginRight: 6, marginTop: 2 }} />
                      <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{c}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.aiNotice}>
              <Text style={styles.aiNoticeText}>
                Thông tin phân tích trước khi xem đang được CineMind AI tạo lập...
              </Text>
            </View>
          )}

          {/* AI Q&A Input Box */}
          <View style={styles.qaBox}>
            <View style={styles.qaHeaderRow}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.accentGold} style={{ marginRight: 6 }} />
              <Text style={styles.qaTitle}>Hỏi CineMind AI về phim này</Text>
            </View>
            <View style={styles.qaInputRow}>
              <TextInput
                style={styles.qaInput}
                placeholder="Phim có sợ không? Tiết tấu thế nào? Có đáng xem không?"
                placeholderTextColor={colors.textMuted}
                value={question}
                onChangeText={setQuestion}
              />
              <TouchableOpacity
                style={[styles.qaButton, (!question.trim() || qaLoading) && styles.qaButtonDisabled]}
                onPress={handleAskQuestion}
                disabled={!question.trim() || qaLoading}
              >
                {qaLoading ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Ionicons name="send" size={16} color={colors.textInverse} />
                )}
              </TouchableOpacity>
            </View>

            {answer && (
              <View style={styles.answerBox}>
                <View style={styles.answerHeader}>
                  <Ionicons name="sparkles" size={14} color={colors.aiPurple} style={{ marginRight: 4 }} />
                  <Text style={styles.answerHeaderTitle}>Phản hồi từ CineMind AI</Text>
                </View>
                <Text style={styles.answerText}>{answer}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Recommend to Friend Modal */}
      <Modal
        visible={recommendModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRecommendModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Giới thiệu phim cho bạn bè</Text>
              <TouchableOpacity onPress={() => setRecommendModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Gợi ý xem phim "{movie.title}" kèm ghi chú riêng
            </Text>

            {loadingFriends ? (
              <ActivityIndicator color={colors.accentGold} style={{ marginVertical: 20 }} />
            ) : friends.length === 0 ? (
              <View style={styles.noFriendsBox}>
                <Ionicons name="people-outline" size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
                <Text style={styles.noFriendsText}>
                  Bạn chưa có bạn bè nào được kết nối trong hệ thống. Hãy tìm và kết bạn tại tab Cá nhân!
                </Text>
              </View>
            ) : (
              <View style={{ marginVertical: 10 }}>
                <Text style={styles.modalFieldLabel}>Chọn bạn bè:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsPickerScroll}>
                  {friends.map((f) => {
                    const isSelected = selectedFriendId === f.id;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.friendChip, isSelected && styles.friendChipSelected]}
                        onPress={() => setSelectedFriendId(f.id)}
                      >
                        <View style={styles.friendAvatarPlaceholder}>
                          <Text style={styles.friendAvatarLetter}>
                            {f.username.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.friendChipName, isSelected && styles.friendChipNameSelected]}>
                          {f.username}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.modalFieldLabel, { marginTop: 12 }]}>Lời nhắn / Lý do nên xem:</Text>
                <TextInput
                  style={styles.modalNoteInput}
                  placeholder="Ví dụ: Kịch bản phim đỉnh lắm, đoạn kết bất ngờ, bạn xem thử nhé..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={recommendNote}
                  onChangeText={setRecommendNote}
                />

                <TouchableOpacity
                  style={[styles.sendRecommendBtn, sendingRecommend && { opacity: 0.6 }]}
                  onPress={handleSendRecommendation}
                  disabled={sendingRecommend}
                >
                  {sendingRecommend ? (
                    <ActivityIndicator color={colors.textInverse} size="small" />
                  ) : (
                    <Text style={styles.sendRecommendBtnText}>Gửi Lời Giới Thiệu</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
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
  errorText: {
    marginTop: 12,
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  backdropWrapper: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: colors.bgElevated,
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 8, 12, 0.65)',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    marginTop: -50,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  poster: {
    width: 110,
    height: 165,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgElevated,
  },
  meta: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    lineHeight: 26,
  },
  runtimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  submetaText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  bullet: {
    color: colors.textMuted,
    marginHorizontal: 6,
    fontSize: 12,
  },
  genreTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  genreBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genreBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  directorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  directorText: {
    color: colors.accentGold,
    fontSize: 12,
    fontWeight: '600',
  },

  // Library Card Styles
  libraryCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 20,
  },
  libraryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  libraryCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  inLibraryBadge: {
    backgroundColor: 'rgba(46, 160, 67, 0.2)',
    borderColor: colors.success,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  inLibraryBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  successBanner: {
    backgroundColor: 'rgba(46, 160, 67, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  successBannerText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  sublabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  statusButtonActive: {
    backgroundColor: colors.accentGold,
    borderColor: colors.accentGold,
  },
  statusButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  statusButtonTextActive: {
    color: colors.textInverse,
  },
  ratingSection: {
    marginTop: 4,
    marginBottom: 12,
  },
  ratingStarsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ratingPill: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  ratingPillActive: {
    backgroundColor: 'rgba(210, 153, 34, 0.25)',
    borderColor: colors.accentGold,
  },
  ratingPillText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  ratingPillTextActive: {
    color: colors.accentGold,
    fontWeight: '700',
  },
  saveLibraryBtn: {
    backgroundColor: colors.accentGold,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveLibraryBtnText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },

  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  synopsis: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  aiCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiIconBadge: {
    backgroundColor: 'rgba(188, 140, 255, 0.15)',
    padding: 6,
    borderRadius: 8,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  spoilerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  spoilerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  spoilerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  spoilerButtonActive: {
    borderColor: colors.danger,
  },
  spoilerButtonText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  aiLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  aiLoadingText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  aiBody: {
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(188, 140, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.aiPurple,
  },
  scoreNumber: {
    color: colors.aiPurple,
    fontSize: 16,
    fontWeight: '800',
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  scoreDetails: {
    flex: 1,
  },
  confidenceText: {
    color: colors.textPrimary,
    fontSize: 12,
    marginBottom: 4,
  },
  highlightConfidence: {
    color: colors.accentGold,
    fontWeight: '700',
  },
  toneText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  reasonsContainer: {
    marginTop: 12,
  },
  reasonsHeader: {
    color: colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  reasonText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  aiNotice: {
    paddingVertical: 8,
  },
  aiNoticeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  qaBox: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  qaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qaTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  qaInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qaInput: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    color: colors.textPrimary,
    fontSize: 12,
  },
  qaButton: {
    backgroundColor: colors.accentGold,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaButtonDisabled: {
    opacity: 0.5,
  },
  answerBox: {
    backgroundColor: colors.bgElevated,
    borderLeftWidth: 3,
    borderLeftColor: colors.aiPurple,
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  answerHeaderTitle: {
    color: colors.aiPurple,
    fontSize: 11,
    fontWeight: '700',
  },
  answerText: {
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },

  // Rewatch Styles
  rewatchSection: {
    marginVertical: 10,
  },
  rewatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  rewatchBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewatchValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },

  // Tags Styles
  tagsSection: {
    marginVertical: 10,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagChipText: {
    color: colors.accentGold,
    fontSize: 11,
    fontWeight: '600',
  },
  addTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    color: colors.textPrimary,
    fontSize: 12,
  },
  addTagBtn: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.accentGold,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagBtnText: {
    color: colors.accentGold,
    fontSize: 12,
    fontWeight: '600',
  },

  // Secondary Actions Row
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  journalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.accentGold,
    borderRadius: 8,
    paddingVertical: 10,
    position: 'relative',
  },
  journalActionBtnText: {
    color: colors.accentGold,
    fontSize: 12,
    fontWeight: '600',
  },
  hasJournalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    position: 'absolute',
    top: 6,
    right: 8,
  },
  recommendActionBtn: {
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
  recommendActionBtnText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Recommend Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
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
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  noFriendsBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noFriendsText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  friendsPickerScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  friendChipSelected: {
    borderColor: colors.accentGold,
    backgroundColor: 'rgba(210, 153, 34, 0.15)',
  },
  friendAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarLetter: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
  },
  friendChipName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  friendChipNameSelected: {
    color: colors.accentGold,
    fontWeight: '700',
  },
  modalNoteInput: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    color: colors.textPrimary,
    fontSize: 12,
    textAlignVertical: 'top',
    minHeight: 64,
    marginBottom: 16,
  },
  sendRecommendBtn: {
    backgroundColor: colors.accentGold,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendRecommendBtnText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
});