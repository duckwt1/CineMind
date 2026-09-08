export type LibraryStatus = 'WANT_TO_WATCH' | 'WATCHING' | 'WATCHED' | 'DROPPED';

export type ViewingContext = 'THEATER' | 'HOME_SOLO' | 'HOME_GROUP' | 'AIRPLANE' | 'OTHER';

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED';

export type RecommendationStatus = 'PENDING' | 'SEEN' | 'ADDED_TO_WATCHLIST' | 'WATCHED' | 'RATED' | 'DISMISSED';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Movie {
  id: string;
  externalId: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  genres: string[];
  director?: string;
  cast?: string[];
  synopsis: string;
  posterUrl?: string;
  backdropUrl?: string;
  similarityScore?: number;
}

export interface LibraryEntry {
  id: string;
  movie: Movie;
  status: LibraryStatus;
  rating?: number | null;
  isFavorite: boolean;
  rewatchCount: number;
  tags: string[];
  watchedDate?: string | null;
  hasJournal: boolean;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  libraryEntryId: string;
  entryText: string;
  viewingContext: ViewingContext;
  privateNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MovieRecommendation {
  id: string;
  sender: User;
  recipient?: User;
  movie: Movie;
  message?: string;
  status: RecommendationStatus;
  isHelpful?: boolean | null;
  recipientRating?: number | null;
  createdAt: string;
}

export interface PreWatchAnalysis {
  movieId: string;
  matchScore: number;
  confidence: string;
  reasonsToWatch: string[];
  potentialConcerns: string[];
  tone: string;
  pacing: string;
  recommendedSetting: string;
  isSpoilerFree: boolean;
}

export interface FriendResponse {
  id: string;
  username: string;
  avatarUrl?: string | null;
  friendshipId: string;
  status: FriendshipStatus;
  friendsSince?: string | null;
  isIncoming?: boolean;
}

export interface ViewingStatsResponse {
  totalMoviesWatched: number;
  totalWatchTimeMinutes: number;
  averageRating?: number | null;
  topGenres?: Array<{ genre: string; count: number }>;
  ratingDistribution?: Record<string, number>;
}

export interface RecommendationStatsResponse {
  sentCount: number;
  receivedCount: number;
  sentCompletedCount: number;
  sentHelpfulCount: number;
  successRatePercentage: number;
  topRecommenderFriend?: { username: string; helpfulCount: number } | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}
