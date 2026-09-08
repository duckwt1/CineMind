# CineMind — REST API Specification

> **Document Type:** REST API Specification  
> **Document Number:** 05 — API Specification  
> **Target Version:** MVP 1.0  
> **Status:** Approved Baseline  
> **Base URL:** `https://api.cinemind.app/api/v1` (Local dev: `http://localhost:4000/api/v1`)  
> **Traceability References:**  
> - Project Brief: `docs/project_brief.md`  
> - Product Requirements Document: `docs/product-requirements.md`  
> - System Architecture Document: `docs/system-architecture.md`  
> - User Stories: `docs/user-stories.md`  

---

## 1. Global API Standards & Conventions

### 1.1 Protocol, Headers & Content-Types
- **Protocol:** HTTPS (TLS 1.3 mandatory in staging/production).
- **Default Content-Type:** `application/json; charset=utf-8`.
- **Streaming Content-Type:** `text/event-stream; charset=utf-8` (for AI Q&A endpoints).
- **Authentication Header:** Standard Bearer token:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- **Correlation Header:** Clients should send (or server will generate) `X-Request-ID` for end-to-end tracing.

### 1.2 Unified Response Envelopes

#### Success Envelope
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total_items": 105,
    "total_pages": 6,
    "has_more": true
  }
}
```

#### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested movie was not found in catalog.",
    "details": [
      {
        "field": "movieId",
        "issue": "Invalid UUID format"
      }
    ]
  },
  "timestamp": "2026-09-08T09:00:00.000Z"
}
```

### 1.3 Standard HTTP Status Codes

| Status Code | Reason / Usage |
| :--- | :--- |
| `200 OK` | Request succeeded; response contains payload. |
| `201 Created` | Resource successfully created (User, LibraryEntry, Recommendation). |
| `204 No Content` | Successful operation with empty body (Logout, Delete). |
| `400 Bad Request` | Malformed JSON or syntax violation. |
| `401 Unauthorized` | Missing, expired, or invalid JWT Bearer token. |
| `403 Forbidden` | Authenticated user lacks permission (e.g. accessing another user's journal). |
| `404 Not Found` | Target entity does not exist. |
| `409 Conflict` | Unique constraint violation (e.g. username/email already registered). |
| `422 Unprocessable Entity` | Semantic validation failure (e.g., rating not divisible by 0.5). |
| `429 Too Many Requests` | Rate limit threshold exceeded. |
| `500 Internal Server Error` | Unexpected backend runtime fault. |
| `503 Service Unavailable` | Upstream dependency offline (e.g., TMDB or Gemini LLM failure). |

---

## 2. Authentication Endpoints (`/auth`)

### 2.1 Register User
- **Method & Path:** `POST /auth/register`
- **Authentication:** None (Public)
- **Request Body:**
  ```json
  {
    "email": "ethan@example.com",
    "username": "ethan_cine",
    "password": "SecurePassword123!"
  }
  ```
- **Validations:**
  - `email`: Valid email syntax, normalized to lowercase.
  - `username`: 3–20 characters, regex `^[a-zA-Z0-9_]+$`.
  - `password`: Minimum 8 characters, at least 1 letter and 1 number.
- **Responses:**
  - `201 Created`:
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "email": "ethan@example.com",
          "username": "ethan_cine",
          "avatar_url": null,
          "created_at": "2026-09-08T09:00:00Z"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```
  - `409 Conflict`: `{"code": "EMAIL_TAKEN"}` or `{"code": "USERNAME_TAKEN"}`.

### 2.2 Login User
- **Method & Path:** `POST /auth/login`
- **Authentication:** None (Public)
- **Request Body:**
  ```json
  {
    "identifier": "ethan_cine",
    "password": "SecurePassword123!"
  }
  ```
- **Responses:**
  - `200 OK`: Same payload structure as registration response.
  - `401 Unauthorized`: Generic error `{"code": "INVALID_CREDENTIALS", "message": "Invalid username/email or password."}`.

### 2.3 Logout User
- **Method & Path:** `POST /auth/logout`
- **Authentication:** `Bearer <token>`
- **Responses:**
  - `204 No Content`

### 2.4 Get Current User Profile
- **Method & Path:** `GET /auth/me`
- **Authentication:** `Bearer <token>`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "email": "ethan@example.com",
        "username": "ethan_cine",
        "avatar_url": "https://cdn.cinemind.app/avatars/ethan.jpg",
        "created_at": "2026-09-08T09:00:00Z"
      }
    }
    ```

---

## 3. Movie Discovery Endpoints (`/movies`)

### 3.1 Search Movies
- **Method & Path:** `GET /movies/search`
- **Authentication:** `Bearer <token>` (or public preview)
- **Query Parameters:**
  - `q` (string, required): Search term (min 1 char).
  - `page` (integer, optional, default: 1).
  - `limit` (integer, optional, default: 20).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
          "external_id": "tmdb-693134",
          "title": "Dune: Part Two",
          "release_year": 2024,
          "runtime_minutes": 166,
          "genres": ["Science Fiction", "Adventure"],
          "poster_url": "https://image.tmdb.org/t/p/w500/8b8RnxnyHu9vhghb4928X0FTbh4.jpg",
          "backdrop_url": "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg"
        }
      ],
      "meta": {
        "page": 1,
        "limit": 20,
        "total_items": 42,
        "total_pages": 3,
        "has_more": true
      }
    }
    ```

### 3.2 Trending & Popular Movies
- **Method & Path:** `GET /movies/trending` & `GET /movies/popular`
- **Query Parameters:**
  - `window` (string, optional, enum: `day`, `week`, default: `week`).
  - `page` (integer, optional, default: 1).
- **Responses:**
  - `200 OK`: Array of movie summaries with pagination metadata.

### 3.3 Get Movie Details
- **Method & Path:** `GET /movies/{id}`
- **Path Parameters:**
  - `id` (UUID or external ID string): Movie identifier.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "external_id": "tmdb-693134",
        "title": "Dune: Part Two",
        "release_year": 2024,
        "runtime_minutes": 166,
        "genres": ["Science Fiction", "Adventure"],
        "director": "Denis Villeneuve",
        "cast": ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem"],
        "synopsis": "Paul Atreides unites with Chani and the Fremen while seeking revenge...",
        "poster_url": "https://image.tmdb.org/t/p/w500/8b8RnxnyHu9vhghb4928X0FTbh4.jpg",
        "backdrop_url": "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
        "user_library_entry": {
          "status": "WANT_TO_WATCH",
          "rating": null,
          "is_favorite": false
        }
      }
    }
    ```

---

## 4. Personal Movie Library Endpoints (`/library`)

### 4.1 List Library Entries
- **Method & Path:** `GET /library`
- **Authentication:** `Bearer <token>`
- **Query Parameters:**
  - `status` (string, optional, enum: `WANT_TO_WATCH`, `WATCHING`, `WATCHED`, `DROPPED`).
  - `is_favorite` (boolean, optional).
  - `tag` (string, optional).
  - `sort` (string, optional, enum: `recent`, `rating_desc`, `title`, default: `recent`).
  - `page` (integer, default: 1), `limit` (integer, default: 20).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "e3b0c442-98fc-1c14-9afbf4c8996fb924",
          "movie": {
            "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            "title": "Dune: Part Two",
            "release_year": 2024,
            "poster_url": "https://image.tmdb.org/t/p/w500/..."
          },
          "status": "WATCHED",
          "rating": 9.5,
          "is_favorite": true,
          "rewatch_count": 1,
          "tags": ["#sci-fi", "#imax"],
          "watched_date": "2026-09-01",
          "has_journal": true,
          "updated_at": "2026-09-01T20:30:00Z"
        }
      ],
      "meta": { "page": 1, "limit": 20, "total_items": 1, "total_pages": 1, "has_more": false }
    }
    ```

### 4.2 Add or Update Library Entry
- **Method & Path:** `POST /library`
- **Authentication:** `Bearer <token>`
- **Request Body:**
  ```json
  {
    "movie_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "WANT_TO_WATCH",
    "rating": null,
    "is_favorite": false,
    "tags": ["#anticipated"]
  }
  ```
- **Responses:**
  - `201 Created`: Returns newly created `LibraryEntry`.

### 4.3 Update Library Entry Status / Details
- **Method & Path:** `PATCH /library/{movieId}`
- **Authentication:** `Bearer <token>`
- **Request Body:**
  ```json
  {
    "status": "WATCHED",
    "rating": 9.0,
    "watched_date": "2026-09-08",
    "is_favorite": true,
    "tags": ["#masterpiece"]
  }
  ```
- **Rules Enforced:**
  - `rating`: Optional, range `1.0` to `10.0`, step `0.5`. Invalid values return `422 Unprocessable Entity`.
  - Transitioning to `WATCHED` without `watched_date` sets today's date automatically (`BR-LIB-01`).
  - Transitioning `WATCHED` -> `WATCHING` increments `rewatch_count` by 1 (`BR-LIB-02`).
  - Automatically updates any linked `MovieRecommendation` status (`RULE-REC-02`, `03`, `04`).
- **Responses:**
  - `200 OK`: Returns updated `LibraryEntry`.

### 4.4 Remove Movie from Library
- **Method & Path:** `DELETE /library/{movieId}`
- **Authentication:** `Bearer <token>`
- **Responses:**
  - `204 No Content`: Preserves journal notes in soft-archive if configured (`BR-LIB-05`).

---

## 5. Personal Movie Journal Endpoints (`/library/{movieId}/journal`)

### 5.1 Get Journal Entry
- **Method & Path:** `GET /library/{movieId}/journal`
- **Authentication:** `Bearer <token>`
- **Security:** Private to owner only (`NFR-SEC-01`).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "library_entry_id": "e3b0c442-98fc-1c14-9afbf4c8996fb924",
        "entry_text": "## Visually Staggering\nThe sound design during the worm-riding scene was unmatched...",
        "viewing_context": "THEATER",
        "private_notes": "Watched at IMAX Melbourne with Chloe.",
        "created_at": "2026-09-01T21:00:00Z",
        "updated_at": "2026-09-01T21:00:00Z"
      }
    }
    ```
  - `404 Not Found`: No journal entry created for this library item yet.

### 5.2 Create / Update Journal Entry
- **Method & Path:** `PUT /library/{movieId}/journal`
- **Authentication:** `Bearer <token>`
- **Request Body:**
  ```json
  {
    "entry_text": "Incredible worldbuilding and score.",
    "viewing_context": "HOME_SOLO",
    "private_notes": "Rewatch candidate."
  }
  ```
- **Validations:**
  - `entry_text`: Max 10,000 characters.
  - `viewing_context`: Enum (`THEATER`, `HOME_SOLO`, `HOME_GROUP`, `AIRPLANE`, `OTHER`).
  - `private_notes`: Max 2,000 characters.
- **Responses:**
  - `200 OK`: Returns saved `JournalEntry`.

### 5.3 Delete Journal Entry
- **Method & Path:** `DELETE /library/{movieId}/journal`
- **Authentication:** `Bearer <token>`
- **Responses:**
  - `204 No Content`

---

## 6. AI Intelligence Endpoints (`/ai`)

### 6.1 Get Pre-Watch Analysis
- **Method & Path:** `GET /ai/movies/{movieId}/pre-watch`
- **Authentication:** `Bearer <token>`
- **Query Parameters:**
  - `spoilers` (boolean, optional, default: `false`).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "movie_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "match_score": 92,
        "confidence": "HIGH",
        "reasons_to_watch": [
          "Aligns with your highest-rated sci-fi epic preferences",
          "Exceptional Hans Zimmer auditory landscape",
          "Pacing matches your favorable reviews of Blade Runner 2049"
        ],
        "potential_concerns": [
          "Runtime exceeds 2.5 hours",
          "Political intrigue demands sustained attention"
        ],
        "tone": "Grand, Mythic, Tense",
        "pacing": "Deliberate Epic",
        "recommended_setting": "Theater or home setup with subwoofers",
        "is_spoiler_free": true
      }
    }
    ```

### 6.2 Conversational Movie Q&A (Streaming)
- **Method & Path:** `POST /ai/movies/{movieId}/qa`
- **Authentication:** `Bearer <token>`
- **Headers:** `Accept: text/event-stream`
- **Request Body:**
  ```json
  {
    "query": "Are there intense jump scares or animal cruelty?",
    "spoilers_allowed": false
  }
  ```
- **Responses:**
  - `200 OK` (`text/event-stream`):
    ```text
    event: chunk
    data: {"token": "There "}

    event: chunk
    data: {"token": "are no jump scares "}

    event: chunk
    data: {"token": "or animal violence in this film."}

    event: done
    data: {"status": "complete", "is_spoiler_free": true}
    ```

### 6.3 Mood-Based Recommendations
- **Method & Path:** `POST /ai/recommendations/mood`
- **Authentication:** `Bearer <token>`
- **Request Body:**
  ```json
  {
    "mood_prompt": "mind-bending philosophical mystery with great cinematography"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "mood_prompt": "mind-bending philosophical mystery with great cinematography",
        "recommendations": [
          {
            "movie": {
              "id": "b789d012-3456-789a-bcde-f01234567890",
              "title": "Arrival",
              "release_year": 2016,
              "poster_url": "https://image.tmdb.org/t/p/w500/..."
            },
            "match_score": 96,
            "ai_pitch": "Matches your request for deep linguistics, mind-bending non-linear storytelling, and Villeneuve's moody visuals."
          }
        ]
      }
    }
    ```

### 6.4 Get User Taste Profile
- **Method & Path:** `GET /ai/taste-profile`
- **Authentication:** `Bearer <token>`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "top_genres": {
          "Science Fiction": 18,
          "Psychological Thriller": 12,
          "Drama": 9
        },
        "preferred_keywords": ["atmospheric", "nonlinear", "cerebral", "existential"],
        "last_calculated_at": "2026-09-08T08:00:00Z"
      }
    }
    ```

---

## 7. Social & Friend Endpoints (`/friends`)

### 7.1 List Friends
- **Method & Path:** `GET /friends`
- **Authentication:** `Bearer <token>`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f",
          "username": "alex_film",
          "avatar_url": "https://cdn.cinemind.app/avatars/alex.jpg",
          "friendship_id": "33445566-7788-9900-aabb-ccddeeff0011",
          "friends_since": "2026-08-15T12:00:00Z"
        }
      ]
    }
    ```

### 7.2 Search Users
- **Method & Path:** `GET /friends/search?q={username}`
- **Authentication:** `Bearer <token>`
- **Responses:**
  - `200 OK`: List of matched users with connection status (`NONE`, `PENDING_SENT`, `PENDING_RECEIVED`, `ACCEPTED`).

### 7.3 Send Friend Request
- **Method & Path:** `POST /friends/requests`
- **Authentication:** `Bearer <token>`
- **Request Body:**
  ```json
  {
    "recipient_id": "c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f"
  }
  ```
- **Responses:**
  - `201 Created`: Friendship created with status `PENDING`.

### 7.4 Accept / Reject Friend Request
- **Method & Path:** `POST /friends/requests/{id}/accept` & `POST /friends/requests/{id}/reject`
- **Authentication:** `Bearer <token>`
- **Responses:**
  - `200 OK`: Request accepted (status -> `ACCEPTED`) or rejected (record deleted).

### 7.5 Block User
- **Method & Path:** `POST /friends/{id}/block`
- **Authentication:** `Bearer <token>`
- **Responses:**
  - `200 OK`: Relationship set to `BLOCKED`.

---

## 8. Social Recommendations Endpoints (`/recommendations`)

### 8.1 Send Movie Recommendation
- **Method & Path:** `POST /recommendations`
- **Authentication:** `Bearer <token>`
- **Request Body:**
  ```json
  {
    "recipient_id": "c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f",
    "movie_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "message": "You loved Blade Runner, you must watch Dune 2 this weekend!"
  }
  ```
- **Validations:**
  - Sender and recipient must be confirmed `ACCEPTED` friends.
  - `message`: Max 500 characters.
- **Responses:**
  - `201 Created`:
    ```json
    {
      "success": true,
      "data": {
        "id": "99887766-5544-3322-1100-aabbccddeeff",
        "status": "PENDING",
        "created_at": "2026-09-08T09:30:00Z"
      }
    }
    ```

### 8.2 Get Recommendations Inbox
- **Method & Path:** `GET /recommendations/inbox`
- **Authentication:** `Bearer <token>`
- **Query Parameters:**
  - `status` (string, optional, enum: `PENDING`, `SEEN`, `ADDED_TO_WATCHLIST`, `WATCHED`, `RATED`, `DISMISSED`).
  - `page` (integer, default: 1), `limit` (integer, default: 20).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "99887766-5544-3322-1100-aabbccddeeff",
          "sender": {
            "id": "c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f",
            "username": "alex_film",
            "avatar_url": "https://cdn.cinemind.app/avatars/alex.jpg"
          },
          "movie": {
            "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            "title": "Dune: Part Two",
            "release_year": 2024,
            "poster_url": "https://image.tmdb.org/t/p/w500/..."
          },
          "message": "You loved Blade Runner, you must watch Dune 2 this weekend!",
          "status": "PENDING",
          "is_helpful": null,
          "recipient_rating": null,
          "created_at": "2026-09-08T09:30:00Z"
        }
      ]
    }
    ```

### 8.3 Update Recommendation Status (Direct or Dismiss)
- **Method & Path:** `PATCH /recommendations/{id}/status`
- **Authentication:** `Bearer <token>`
- **Request Body:**
  ```json
  {
    "status": "SEEN"
  }
  ```
- **Permitted Manual Transitions:**
  - Recipient: `PENDING` -> `SEEN`, `PENDING` -> `DISMISSED`, `SEEN` -> `DISMISSED`.
  - (Automated transitions via library actions handle `ADDED_TO_WATCHLIST`, `WATCHED`, `RATED`).
- **Responses:**
  - `200 OK`: Updated recommendation record.

### 8.4 Submit Recommendation Feedback
- **Method & Path:** `POST /recommendations/{id}/feedback`
- **Authentication:** `Bearer <token>`
- **Request Body:**
  ```json
  {
    "is_helpful": true
  }
  ```
- **Responses:**
  - `200 OK`: Recorded feedback. Sender's success metrics re-attributed.

---

## 9. Statistics & Analytics Endpoints (`/stats`)

### 9.1 Personal Viewing Statistics
- **Method & Path:** `GET /stats/viewing`
- **Authentication:** `Bearer <token>`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "total_movies_watched": 142,
        "total_watch_time_minutes": 17040,
        "average_rating": 7.85,
        "top_genres": [
          { "genre": "Sci-Fi", "count": 48 },
          { "genre": "Thriller", "count": 35 },
          { "genre": "Drama", "count": 29 },
          { "genre": "Action", "count": 18 },
          { "genre": "Crime", "count": 12 }
        ],
        "rating_distribution": {
          "5.0": 2, "6.0": 8, "6.5": 10, "7.0": 22,
          "7.5": 30, "8.0": 34, "8.5": 20, "9.0": 12, "9.5": 3, "10.0": 1
        }
      }
    }
    ```

### 9.2 Social Recommendation Effectiveness
- **Method & Path:** `GET /stats/recommendations`
- **Authentication:** `Bearer <token>`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "sent_count": 25,
        "received_count": 18,
        "sent_completed_count": 16,
        "sent_helpful_count": 14,
        "success_rate_percentage": 87.5,
        "top_recommender_friend": {
          "user_id": "c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f",
          "username": "alex_film",
          "average_rating_given_by_you": 8.9,
          "completed_recommendations": 8
        }
      }
    }
    ```
