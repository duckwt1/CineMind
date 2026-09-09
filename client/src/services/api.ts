import axios from 'axios';
import {
  ApiResponse,
  FriendResponse,
  JournalEntry,
  LibraryEntry,
  Movie,
  MovieRecommendation,
  PreWatchAnalysis,
  RecommendationStatsResponse,
  User,
  ViewingStatsResponse,
} from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://cinemind-api-vrk1.onrender.com/api/v1';

if (typeof window !== 'undefined') {
  console.log('[CineMind API] Active backend URL:', API_BASE_URL);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const TOKEN_STORAGE_KEY = 'cinemind_auth_token';

// Safe web localStorage wrapper
const getStoredToken = (): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }
  return null;
};

const persistToken = (token: string | null) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (token) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Could not persist token in localStorage', e);
    }
  }
};

let currentToken: string | null = getStoredToken();
if (currentToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
}

export const setAuthToken = (token: string | null) => {
  currentToken = token;
  persistToken(token);
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = (): string | null => currentToken;

export const api = {
  // System Health
  checkHealth: async (): Promise<{ isConnected: boolean; message: string }> => {
    try {
      const res = await apiClient.get<ApiResponse<{ component: string; status: string }>>('/health/live');
      return {
        isConnected: res.data?.data?.status === 'UP',
        message: res.data?.data?.status === 'UP' ? 'Connected' : 'Degraded',
      };
    } catch (err: any) {
      return {
        isConnected: false,
        message: err.message || 'Offline',
      };
    }
  },

  // Auth
  register: async (data: { username: string; email: string; password: string }) => {
    const res = await apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    setAuthToken(res.data.data.token);
    return res.data.data;
  },

  login: async (data: { identifier: string; password: string }) => {
    const res = await apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data);
    setAuthToken(res.data.data.token);
    return res.data.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {}
    setAuthToken(null);
  },

  getMe: async () => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },

  // Movies
  searchMovies: async (query: string, page: number = 1) => {
    const res = await apiClient.get<ApiResponse<Movie[]>>('/movies/search', { params: { q: query, page } });
    return res.data.data;
  },

  searchSemantic: async (query: string, limit: number = 20) => {
    const res = await apiClient.get<ApiResponse<Movie[]>>('/movies/semantic-search', {
      params: { q: query, limit },
    });
    return res.data.data;
  },

  getTrending: async (page: number = 1) => {
    const res = await apiClient.get<ApiResponse<Movie[]>>('/movies/trending', { params: { page } });
    return res.data.data;
  },

  getMovieDetails: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Movie>>(`/movies/${id}`);
    return res.data.data;
  },

  // Library
  getLibrary: async (status?: string) => {
    const res = await apiClient.get<ApiResponse<LibraryEntry[]>>('/library', {
      params: status ? { status } : undefined,
    });
    return res.data.data;
  },

  getLibraryEntry: async (movieId: string) => {
    try {
      const res = await apiClient.get<ApiResponse<LibraryEntry>>(`/library/${movieId}`);
      return res.data.data;
    } catch {
      return null;
    }
  },

  saveLibraryEntry: async (entry: {
    movieId: string;
    status: string;
    rating?: number | null;
    isFavorite?: boolean;
    tags?: string[];
    rewatchCount?: number;
  }) => {
    const res = await apiClient.post<ApiResponse<LibraryEntry>>('/library', entry);
    return res.data.data;
  },

  deleteLibraryEntry: async (movieId: string) => {
    await apiClient.delete(`/library/${movieId}`);
  },

  // AI Assistant
  getPreWatch: async (movieId: string, spoilers: boolean = false) => {
    const res = await apiClient.get<ApiResponse<PreWatchAnalysis>>(`/ai/movies/${movieId}/pre-watch`, {
      params: { spoilers },
    });
    return res.data.data;
  },

  askAiQuestion: async (movieId: string, query: string, spoilersAllowed: boolean = false) => {
    const res = await apiClient.post<ApiResponse<{ answer: string; isSpoilerFree: boolean }>>(
      `/ai/movies/${movieId}/qa`,
      { query, spoilersAllowed }
    );
    return res.data.data;
  },

  getTasteProfile: async () => {
    const res = await apiClient.get<ApiResponse<{
      topGenres: Record<string, number>;
      preferredKeywords: string[];
      lastCalculatedAt: string;
    }>>('/ai/taste-profile');
    return res.data.data;
  },

  getFriendTasteMatch: async (friendId: string) => {
    const res = await apiClient.get<ApiResponse<{
      matchPercentage: number;
      sharedGenres: string[];
      compatibilityTier: string;
    }>>(`/ai/taste-match/friend/${friendId}`);
    return res.data.data;
  },

  // Social & Recommendations
  getRecommendationsInbox: async (status?: string) => {
    const res = await apiClient.get<ApiResponse<MovieRecommendation[]>>('/recommendations/inbox', {
      params: status ? { status } : undefined,
    });
    return res.data.data;
  },

  getSentRecommendations: async () => {
    const res = await apiClient.get<ApiResponse<MovieRecommendation[]>>('/recommendations/sent');
    return res.data.data;
  },

  sendRecommendation: async (data: { recipientId: string; movieId: string; message?: string }) => {
    const res = await apiClient.post<ApiResponse<MovieRecommendation>>('/recommendations', data);
    return res.data.data;
  },

  updateRecommendationStatus: async (id: string, status: string) => {
    const res = await apiClient.patch<ApiResponse<MovieRecommendation>>(`/recommendations/${id}/status`, {
      status,
    });
    return res.data.data;
  },

  sendRecommendationFeedback: async (
    id: string,
    data: { isHelpful: boolean; recipientRating?: number | null }
  ) => {
    const res = await apiClient.post<ApiResponse<MovieRecommendation>>(
      `/recommendations/${id}/feedback`,
      data
    );
    return res.data.data;
  },

  // Friends & Social
  getFriends: async () => {
    const res = await apiClient.get<ApiResponse<FriendResponse[]>>('/friends');
    return res.data.data;
  },

  searchUsers: async (query: string) => {
    const res = await apiClient.get<ApiResponse<User[]>>('/friends/search', {
      params: { q: query },
    });
    return res.data.data;
  },

  sendFriendRequest: async (recipientId: string) => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/friends/requests', {
      recipientId,
    });
    return res.data.data;
  },

  acceptFriendRequest: async (friendshipId: string) => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      `/friends/requests/${friendshipId}/accept`
    );
    return res.data.data;
  },

  rejectFriendRequest: async (friendshipId: string) => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      `/friends/requests/${friendshipId}/reject`
    );
    return res.data.data;
  },

  getPendingFriendRequests: async () => {
    const res = await apiClient.get<ApiResponse<FriendResponse[]>>('/friends/requests/pending');
    return res.data.data;
  },

  removeFriend: async (friendshipId: string) => {
    await apiClient.delete(`/friends/${friendshipId}`);
  },

  // Journal
  getJournal: async (movieId: string) => {
    try {
      const res = await apiClient.get<ApiResponse<JournalEntry>>(`/library/${movieId}/journal`);
      return res.data.data;
    } catch {
      return null;
    }
  },

  saveJournal: async (
    movieId: string,
    data: { entryText: string; viewingContext: string; privateNotes?: string }
  ) => {
    const res = await apiClient.put<ApiResponse<JournalEntry>>(`/library/${movieId}/journal`, data);
    return res.data.data;
  },

  deleteJournal: async (movieId: string) => {
    await apiClient.delete(`/library/${movieId}/journal`);
  },

  // Statistics
  getViewingStats: async () => {
    const res = await apiClient.get<ApiResponse<ViewingStatsResponse>>('/stats/viewing');
    return res.data.data;
  },

  getRecommendationStats: async () => {
    const res = await apiClient.get<ApiResponse<RecommendationStatsResponse>>('/stats/recommendations');
    return res.data.data;
  },
};
