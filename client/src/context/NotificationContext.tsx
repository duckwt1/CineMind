import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, getAuthToken } from '../services/api';
import { FriendResponse, MovieRecommendation } from '../types';
import { colors } from '../theme/colors';

interface NotificationContextType {
  pendingFriendRequests: FriendResponse[];
  pendingRecsCount: number;
  refreshNotifications: () => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  rejectFriendRequest: (friendshipId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  pendingFriendRequests: [],
  pendingRecsCount: 0,
  refreshNotifications: async () => {},
  acceptFriendRequest: async () => {},
  rejectFriendRequest: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [pendingFriendRequests, setPendingFriendRequests] = useState<FriendResponse[]>([]);
  const [pendingRecsCount, setPendingRecsCount] = useState<number>(0);
  const [activeBanner, setActiveBanner] = useState<{
    id: string;
    type: 'friend_request' | 'recommendation';
    title: string;
    subtitle: string;
    friendReq?: FriendResponse;
    rec?: MovieRecommendation;
  } | null>(null);

  const slideAnim = useRef(new Animated.Value(-120)).current;
  const seenFriendshipIds = useRef<Set<string>>(new Set());
  const seenRecIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Synthesize notification chime via Web Audio API
  const playChime = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1); // A5
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.45);
        }
      } catch {}
    }
  };

  const showBanner = (notif: typeof activeBanner) => {
    setActiveBanner(notif);
    playChime();
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();

    // Auto dismiss after 8 seconds
    setTimeout(() => {
      dismissBanner();
    }, 8000);
  };

  const dismissBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setActiveBanner(null));
  };

  const pollNotifications = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const [pendingFriends, inbox] = await Promise.all([
        api.getPendingFriendRequests().catch(() => []),
        api.getRecommendationsInbox('PENDING').catch(() => []),
      ]);

      setPendingFriendRequests(pendingFriends || []);
      setPendingRecsCount(inbox ? inbox.length : 0);

      // Check for newly arrived friend requests
      if (pendingFriends && pendingFriends.length > 0) {
        for (const req of pendingFriends) {
          if (!seenFriendshipIds.current.has(req.friendshipId)) {
            seenFriendshipIds.current.add(req.friendshipId);
            if (!isFirstLoad.current) {
              showBanner({
                id: req.friendshipId,
                type: 'friend_request',
                title: '🔔 Lời mời kết bạn mới!',
                subtitle: `@${req.username} vừa gửi lời mời kết bạn cho bạn`,
                friendReq: req,
              });
              break;
            }
          }
        }
      }

      // Check for newly arrived movie recommendations
      if (inbox && inbox.length > 0) {
        for (const rec of inbox) {
          if (!seenRecIds.current.has(rec.id)) {
            seenRecIds.current.add(rec.id);
            if (!isFirstLoad.current) {
              showBanner({
                id: rec.id,
                type: 'recommendation',
                title: '🎬 Gợi ý phim mới!',
                subtitle: `@${rec.sender?.username || 'Bạn bè'} đã gợi ý xem "${rec.movie.title}"`,
                rec,
              });
              break;
            }
          }
        }
      }

      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }
    } catch {}
  };

  useEffect(() => {
    pollNotifications();
    const interval = setInterval(() => {
      pollNotifications();
    }, 4500); // 4.5 seconds real-time polling

    return () => clearInterval(interval);
  }, []);

  const handleAcceptBanner = async () => {
    if (activeBanner?.friendReq) {
      try {
        await api.acceptFriendRequest(activeBanner.friendReq.friendshipId);
        setPendingFriendRequests((prev) =>
          prev.filter((r) => r.friendshipId !== activeBanner.friendReq!.friendshipId)
        );
        dismissBanner();
      } catch {}
    }
  };

  const handleViewBanner = () => {
    dismissBanner();
    if (activeBanner?.type === 'friend_request') {
      router.push('/(tabs)/profile');
    } else if (activeBanner?.type === 'recommendation') {
      router.push('/(tabs)/recommendations');
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    await api.acceptFriendRequest(friendshipId);
    setPendingFriendRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    await api.rejectFriendRequest(friendshipId);
    setPendingFriendRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
  };

  return (
    <NotificationContext.Provider
      value={{
        pendingFriendRequests,
        pendingRecsCount,
        refreshNotifications: pollNotifications,
        acceptFriendRequest,
        rejectFriendRequest,
      }}
    >
      {children}

      {/* Floating Real-time Notification Banner */}
      {activeBanner && (
        <Animated.View
          style={[
            styles.bannerContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerIconBadge}>
              <Ionicons
                name={activeBanner.type === 'friend_request' ? 'person-add' : 'film'}
                size={18}
                color={colors.accentGold}
              />
            </View>

            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>{activeBanner.title}</Text>
              <Text style={styles.bannerSubtitle} numberOfLines={1}>
                {activeBanner.subtitle}
              </Text>
            </View>

            <View style={styles.bannerActionsRow}>
              {activeBanner.type === 'friend_request' && (
                <TouchableOpacity
                  style={styles.bannerAcceptBtn}
                  onPress={handleAcceptBanner}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bannerAcceptBtnText}>Chấp nhận</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.bannerViewBtn}
                onPress={handleViewBanner}
                activeOpacity={0.8}
              >
                <Text style={styles.bannerViewBtnText}>Xem</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bannerCloseBtn}
                onPress={dismissBanner}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  bannerContent: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.accentGold,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  bannerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(210, 153, 34, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bannerTextCol: {
    flex: 1,
    marginRight: 8,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bannerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerAcceptBtn: {
    backgroundColor: colors.accentGold,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerAcceptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textInverse,
  },
  bannerViewBtn: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerViewBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bannerCloseBtn: {
    padding: 4,
    marginLeft: 2,
  },
});
