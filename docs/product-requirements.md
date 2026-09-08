# CineMind — Product Requirements Document (PRD)

> **Document Type:** Product Requirements Document (PRD)  
> **Document Number:** 03 — PRD  
> **Target Version:** MVP 1.0  
> **Status:** Approved Baseline  
> **Traceability References:**  
> - Project Brief: `docs/project_brief.md`  
> - System Architecture: `docs/system-architecture.md`  
> - User Stories: `docs/user-stories.md`  

---

## 1. Product Vision & Goals

CineMind is a cross-platform application that unifies a personal movie journal, an AI pre-watch assistant, and friend-to-friend movie recommendations with full lifecycle tracking. It eliminates decision paralysis for movie viewers by combining objective film data, personal taste evolution, and trusted social circles.

### Core Objectives
1. **Effortless Journaling:** Provide a flexible personal film library and journal that captures genuine viewer impressions beyond static star ratings.
2. **Contextual AI Pre-Watch Intelligence:** Deliver spoiler-free evaluations, taste-aligned match scores, and conversational Q&A to help users decide what to watch.
3. **Accountable Social Recommendations:** Enable direct movie recommendations between friends, tracking their lifecycle through viewing and rating, and attributing recommendation quality over time.
4. **Consistent Multi-Platform Reach:** Deliver an identical core experience across Android, iOS, and Web.

---

## 2. Target Personas

| Persona | Core Needs | CineMind Solution |
| :--- | :--- | :--- |
| **Movie Enthusiasts** | Log watch history, rewatch dates, personal notes, and detailed reflections. | Flexible 4-state library (`Want to Watch`, `Watching`, `Watched`, `Dropped`), rewatch tracking, and rich journal entries. |
| **Casual Viewers** | Fast, reliable answers on whether a movie is worth their time without reading lengthy reviews. | Pre-watch AI analysis with instant Match Score, tone, pacing summaries, and mood-based prompts. |
| **Social Movie Groups** | Sharing movie suggestions with specific friends and seeing if they actually watched them. | Direct friend recommendations with personalized notes and 5-stage lifecycle tracking. |
| **AI-Assisted Viewers** | Asking specific, nuanced questions about a movie without spoiling the plot. | Natural language conversational Q&A with strict spoiler-free shielding and optional spoiler reveal. |

---

## 3. Success Signals & Validation Criteria

The MVP release must demonstrably satisfy the 16 core product criteria:
- **SS-01 (Account Setup):** User can register, authenticate, and maintain an active cross-device session.
- **SS-02 (Catalog Search):** User can search for any movie in the catalog by title or keyword.
- **SS-03 (Metadata Inspection):** User can inspect comprehensive movie details (director, cast, runtime, release date, synopsis, genres).
- **SS-04 (Pre-Watch AI Evaluation):** User can review an AI pre-watch breakdown with match score, tone, and pacing in spoiler-free mode.
- **SS-05 (AI Q&A Interaction):** User can query the AI about movie content with spoiler safeguards enforced.
- **SS-06 (Watchlist Addition):** User can save a movie into their "Want to Watch" library with a single tap.
- **SS-07 (Watch Logging):** User can transition a movie to "Watched" with date and rewatch count.
- **SS-08 (Rating & Journaling):** User can assign a 1.0–10.0 rating and draft a private journal entry.
- **SS-09 (Taste Synthesis):** The system generates and incrementally refines a personal taste profile from viewing habits.
- **SS-10 (Taste-Based AI Suggestions):** User can retrieve personalized AI movie recommendations driven by their taste profile.
- **SS-11 (Friend Discovery):** User can search for other users by username and establish friend connections.
- **SS-12 (Direct Recommendation):** User can send a movie recommendation with a custom pitch to a confirmed friend.
- **SS-13 (Recommendation Inbox):** Recipient receives the recommendation, viewing sender details and note (`Pending` → `Seen`).
- **SS-14 (Watchlist Conversion):** Recipient adds the recommendation to their watchlist (`Added to Watchlist`).
- **SS-15 (Recommendation Completion):** Recipient marks the movie watched and submits a rating (`Watched` → `Rated`).
- **SS-16 (Feedback & Attribution):** The system records recommendation feedback and computes recommendation success metrics.

---

## 4. Functional Requirements (`FR-*`)

### 4.1 Authentication & Profile (`FR-AUTH`)
- **`FR-AUTH-01`**: The system shall allow new users to register using an email address, unique username, and password.
- **`FR-AUTH-02`**: The system shall authenticate existing users with email/username and password, issuing a persistent JWT session token.
- **`FR-AUTH-03`**: The system shall allow users to log out, revoking client session tokens.
- **`FR-AUTH-04`**: The system shall enforce resource authorization ensuring private journals and unconfirmed recommendations remain inaccessible to unauthorized users.

### 4.2 Movie Catalog & Discovery (`FR-DISC`)
- **`FR-DISC-01`**: The system shall provide keyword search over movie titles with pagination and instant results.
- **`FR-DISC-02`**: The system shall display trending and popular movie lists on the discovery homepage.
- **`FR-DISC-03`**: The system shall present rich movie detail screens containing poster, backdrop, synopsis, release year, runtime, genres, director, and top cast members.

### 4.3 Personal Library & Journal (`FR-LIB` & `FR-JOURNAL`)
- **`FR-LIB-01`**: The system shall support four library statuses for any catalog movie: `Want to Watch`, `Watching`, `Watched`, and `Dropped`.
- **`FR-LIB-02`**: The system shall allow users to remove a movie from their library or transition it between any of the four statuses.
- **`FR-LIB-03`**: The system shall record ratings on a 1.0 to 10.0 scale (0.5 increments).
- **`FR-LIB-04`**: The system shall allow users to mark any movie as a personal `Favorite`.
- **`FR-LIB-05`**: The system shall track the initial watch date, last watched date, and an integer rewatch counter.
- **`FR-LIB-06`**: The system shall allow attaching custom string tags to library items (e.g., `#cyberpunk`, `#comfort-movie`).
- **`FR-JOURNAL-01`**: The system shall provide a dedicated Journal editor for watched movies allowing rich text thoughts and viewing contexts (e.g., theater vs. home, viewing companions).
- **`FR-JOURNAL-02`**: Journal entries shall remain strictly private to the author in MVP.

### 4.4 AI Pre-Watch & Intelligence (`FR-AI`)
- **`FR-AI-01` (Pre-Watch Analysis):** The system shall generate a structured pre-watch summary for any movie, detailing:
  - Estimated Personal Match Score (0–100%).
  - 3–5 personalized reasons the user may enjoy the film.
  - Potential viewing cautions (e.g., slow pacing, intense violence, heavy themes).
  - Tone, pacing, and recommended viewing settings.
- **`FR-AI-02` (Spoiler Safeguards):** Pre-watch analyses and Q&A responses shall default to **Spoiler-Free**.
- **`FR-AI-03` (Spoiler Override):** The system shall require an intentional user toggle before returning narrative spoilers or plot twist analyses.
- **`FR-AI-04` (Conversational Q&A):** The system shall provide a natural language chat interface allowing users to ask specific questions about a movie's vibes, content warnings, and pacing.
- **`FR-AI-05` (Taste Profile Synthesis):** The system shall maintain an evolving Taste Profile vector synthesized from watched films, ratings, favorites, tags, and journal entries.
- **`FR-AI-06` (Personalized Recommendations):** The system shall generate recommended movie titles tailored to the user's active Taste Profile.
- **`FR-AI-07` (Mood-Based Querying):** The system shall allow users to request recommendations filtered by current mood keywords (e.g., "melancholic sci-fi", "lighthearted Sunday watch").

### 4.5 Social Connections & Friend Recommendations (`FR-SOC`)
- **`FR-SOC-01`**: The system shall allow users to search for other members by exact or partial username.
- **`FR-SOC-02`**: The system shall support a friendship connection lifecycle: Send Request, Accept Request, Reject Request, Remove Friend, and Block User.
- **`FR-SOC-03`**: The system shall enable a user to recommend a specific movie directly to an accepted friend with an optional text message (max 500 characters).
- **`FR-SOC-04` (Lifecycle Tracking):** Recommendations shall progress through 5 observable states:
  $$\text{Pending} \longrightarrow \text{Seen} \longrightarrow \text{Added to Watchlist} \longrightarrow \text{Watched} \longrightarrow \text{Rated}$$
  with an alternative terminal path: `Dismissed`.
- **`FR-SOC-05` (Automatic Lifecycle Synchronization):** When a user adds a recommended movie to their watchlist, watches it, or rates it, the linked recommendation status shall update automatically.
- **`FR-SOC-06` (Feedback & Attribution):** When the recipient rates a recommended movie, the system shall record:
  - Whether the recommendation was deemed helpful (Yes/No).
  - Recipient's rating compared to sender's rating.
- **`FR-SOC-07`**: The system shall calculate friend recommendation effectiveness (e.g., "% of recommendations watched", "average rating of recommended movies").

### 4.6 Analytics & Statistics (`FR-STAT`)
- **`FR-STAT-01`**: The system shall display personal viewing statistics: total movies watched, total minutes, top 5 genres, and rating distribution histogram.
- **`FR-STAT-02`**: The system shall display social recommendation statistics: total recommendations sent/received, completion rate, and top recommender among friends.

---

## 5. User Stories & Observable Acceptance Criteria (`US-*`)

### US-AUTH-01: User Registration & Session
- **As a** new movie viewer,  
  **I want to** register an account with my email, username, and password,  
  **So that** my movie library and journal entries are securely stored and synced across devices.
  - **Given** I am on the registration screen with valid, unused credentials,  
    **When** I submit the registration form,  
    **Then** my account is created, an authentication token is issued, and I am navigated to the discovery screen.
  - **Given** an email or username that is already registered,  
    **When** I attempt to register,  
    **Then** the system displays a clear, safe validation error without crashing or leaking sensitive data.

### US-LIB-01: Managing Movie Status & Rating
- **As an** avid film watcher,  
  **I want to** mark a film as "Watched" and give it an 8.5/10 rating,  
  **So that** my watch history is updated and my taste profile reflects my score.
  - **Given** a movie in my catalog or "Want to Watch" list,  
    **When** I select "Watched" and choose 8.5 on the rating slider,  
    **Then** the movie moves to my "Watched" tab, the watch date is recorded as today, and the rating is saved.

### US-AI-01: Spoiler-Free Pre-Watch Evaluation
- **As a** viewer deciding whether to watch a psychological thriller,  
  **I want to** view an AI pre-watch analysis without spoilers,  
  **So that** I understand the movie's pacing and themes without ruining the ending.
  - **Given** I open the AI Assistant tab on a movie details page,  
    **When** the analysis loads,  
    **Then** the summary displays Match Score, tone, and pacing with a badge confirming "Spoiler-Free Mode Active".
  - **Given** the pre-watch analysis is displayed in spoiler-free mode,  
    **When** I examine the text,  
    **Then** key plot twists and ending revelations are completely omitted.

### US-AI-02: Conversational Movie Q&A
- **As a** parent or sensitive viewer,  
  **I want to** ask the AI "Does this movie contain jump scares?",  
  **So that** I can make an informed choice before pressing play.
  - **Given** I am on the movie Q&A interface,  
    **When** I submit the query "Does this movie contain jump scares?",  
    **Then** the AI responds within 3 seconds with a factual, spoiler-safe assessment of scare frequency and intensity.

### US-SOC-01: Recommending a Movie to a Friend
- **As a** friend who just finished a great film,  
  **I want to** recommend the movie directly to my friend Alex with a note,  
  **So that** Alex gets a notification and can add it to their watchlist.
  - **Given** I am friends with user "Alex" and viewing a movie detail page,  
    **When** I tap "Recommend to Friend", select Alex, type "You will love the cinematography", and tap send,  
    **Then** a `MovieRecommendation` is created in state `Pending`, and confirmation is displayed.

### US-SOC-02: Recommendation Lifecycle & Automatic Progression
- **As a** recipient of a movie recommendation,  
  **I want** my actions on the recommended film to automatically update the recommendation's status,  
  **So that** my friend knows I followed through without manual check-ins.
  - **Given** I have a `Pending` recommendation from Alex,  
    **When** I open the recommendation card,  
    **Then** its status advances to `Seen`.
  - **Given** the recommendation is in `Seen`,  
    **When** I tap "Add to Watchlist",  
    **Then** the movie is added to my "Want to Watch" library, and the recommendation status updates to `Added to Watchlist`.
  - **Given** the recommendation is in `Added to Watchlist`,  
    **When** I mark the movie as "Watched" and rate it 9.0,  
    **Then** the recommendation status advances to `Rated`, and Alex is credited with a successful recommendation.

---

## 6. Non-Functional Requirements (NFR)

- **`NFR-PERF-01` (Catalog Latency):** Search queries and detail page loads shall return results within $\le 800\text{ ms}$ under standard broadband/4G conditions.
- **`NFR-PERF-02` (AI Response Time):** Pre-watch analyses shall render within $\le 2.5\text{ seconds}$, and Q&A chat streaming must initiate within $\le 1.2\text{ seconds}$.
- **`NFR-RESP-01` (Cross-Platform Adaptive UI):** The interface must gracefully adapt across mobile screen widths (360px–430px) and tablet/desktop web viewports ($\ge 1024\text{px}$) utilizing responsive grid layouts rather than mobile stretching.
- **`NFR-SEC-01` (Data Isolation):** Personal journals, private watch notes, and account passwords must be securely isolated; no user can access or modify another user's journal entries.
- **`NFR-SAFE-01` (Spoiler Defense):** The AI system prompt must enforce strict spoiler quarantine rules; violation of spoiler-free contracts is treated as a critical defect.

---

## 7. Assumptions, Dependencies & Exclusions

### Assumptions & Dependencies
- Movie catalog metadata and artwork are provided via a backend proxy to an external film database (e.g., TMDB API).
- AI services are brokered via backend integration with a major LLM provider (e.g., Google Gemini API).
- Cross-platform build is managed via Expo EAS and React Native Web.

### Explicit MVP Exclusions
- Model Context Protocol (MCP) servers or integrations.
- Direct peer-to-peer real-time chat or instant messaging.
- Public activity feed, social comments, like buttons, and shared watchlists.
- Social OAuth / SSO login providers, password reset via email, and email confirmation gates.
- Group movie voting or party planning tools.

---

## 8. UI State Matrix & Error Handling

| Screen / Component | Loading State | Empty State | Populated State | Error / Failure State | Offline State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Movie Search** | Skeleton cards (3 placeholders) | "No movies found matching '{query}'. Check spelling." | Paginated movie grid with posters and years | "Failed to load movie results. Tap to retry." | Cached previous results; offline indicator banner |
| **Library List** | Shimmer rows | "Your library is empty. Discover movies to add!" | Tabbed filter (`Want to Watch`, `Watching`, `Watched`, `Dropped`) with count badges | "Unable to sync library. Pull to refresh." | Read-only local cache with queued update markers |
| **Pre-Watch AI** | Shimmer analysis card with pulsing badge | "AI analysis currently unavailable for this title." | Match score dial, pros list, cautions, tone badge, spoiler toggle | "AI Service busy. Tap to regenerate analysis." | "Pre-watch AI requires an active internet connection." |
| **Recommendations Inbox** | 3 Skeleton notification cards | "No incoming recommendations. Ask friends for ideas!" | List of recommendations with sender avatar, message, and action buttons | "Failed to fetch recommendations." | Cached inbox with disabled status transitions |

---

## 9. Destructive Action Safety Matrix

| Action | Trigger UI | Confirmation Dialogue | Rollback / Undo Policy |
| :--- | :--- | :--- | :--- |
| **Remove Movie from Library** | Trash icon in details / swipe left in list | *"Remove '{title}' from your library? Your rating will be cleared, but journal entries will be archived."* | Soft delete flag; undoable within 5-second toast notification. |
| **Delete Journal Entry** | "Delete Entry" button in journal editor | *"Permanently delete this journal entry? This action cannot be undone."* | Immediate hard delete of `JournalEntry` record; non-recoverable. |
| **Dismiss Recommendation** | "Dismiss" button on recommendation card | *"Dismiss this recommendation from {sender}? It will be moved to archived."* | Status updated to `DISMISSED`; accessible in archived filter. |
| **Remove Friend** | "Remove Friend" in friend profile | *"Remove {username} from your friends? They will no longer be able to send you recommendations."* | Friendship state deleted; previous recommendations preserved. |
| **Block User** | "Block User" in friend options | *"Block {username}? They will not be able to find your profile or contact you."* | State set to `BLOCKED`; removes all active pending interactions. |

