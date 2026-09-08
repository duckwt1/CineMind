# CineMind — User Stories & Backlog Specification

> **Document Type:** User Stories & Backlog Specification  
> **Document Number:** 04 — User Stories  
> **Target Version:** MVP 1.0  
> **Status:** Approved Baseline  
> **Traceability References:**  
> - Project Brief: `docs/project_brief.md`  
> - Product Requirements Document: `docs/product-requirements.md`  
> - System Architecture Document: `docs/system-architecture.md`  

---

## 1. User Personas & System Actors

| Persona / Actor | Label | Archetype Description | Primary Motivations |
| :--- | :--- | :--- | :--- |
| **Movie Enthusiast** | **Ethan (Enthusiast)** | Watches 3–5 films weekly; keeps granular records; rewatches favorites. | Wants deep journaling, rewatch counts, 0.5-step ratings, and taste analytics. |
| **Casual Viewer** | **Chloe (Casual)** | Watches movies on weekends; struggles with catalog choice paralysis. | Needs fast, spoiler-free summaries, match scores, and mood-based suggestions. |
| **Social Recommender** | **Sam (Social)** | Frequently shares film recommendations with trusted friends. | Wants to know if friends actually watched his picks and whether they enjoyed them. |
| **AI-Assisted Viewer** | **Aiden (AI-Explorer)** | Asks nuanced questions ("Is it violent?", "Is the pacing slow?"). | Seeks conversational Q&A without ruining plot twists or climax revelations. |
| **System Actor** | **Background Automator** | Backend event listeners and lifecycle synchronization workers. | Syncs recommendation lifecycle states when library entries transition. |

---

## 2. Epics & Story Map Overview

| Epic Code | Epic Title | Story Count | MoSCoW Priority |
| :--- | :--- | :--- | :--- |
| **`EPIC-AUTH`** | Authentication & Profile Management | 4 Stories | Must Have |
| **`EPIC-DISC`** | Movie Discovery & Catalog Browsing | 3 Stories | Must Have |
| **`EPIC-LIB`** | Personal Movie Library & Tracking | 6 Stories | Must Have |
| **`EPIC-JOURNAL`** | Personal Movie Journal & Viewing Context | 2 Stories | Must Have |
| **`EPIC-AI`** | AI Pre-Watch Intelligence & Spoiler-Safe Q&A | 5 Stories | Must Have |
| **`EPIC-FRIEND`** | Social Graph & Friend Management | 3 Stories | Must Have |
| **`EPIC-REC`** | Direct Recommendations & 5-Stage Lifecycle | 5 Stories | Must Have |
| **`EPIC-STAT`** | Viewing Analytics & Social Attribution | 2 Stories | Should Have |

---

## 3. Detailed User Stories

### Epic 1: Authentication & Profile Management (`EPIC-AUTH`)

#### US-AUTH-01: User Registration
- **User Story:**  
  *As a* new movie viewer,  
  *I want to* create an account using my email, a unique username, and a secure password,  
  *So that* my personal movie records and taste profile are preserved across all my devices.
- **Priority:** Must Have (P0) | **Estimate:** 3 SP
- **Preconditions:** Unauthenticated guest on `/register`.
- **Acceptance Criteria (Gherkin):**
  - **AC-01 (Happy Path):**  
    *Given* I submit a valid email `ethan@example.com`, username `ethan_cine` (3–20 alphanumeric characters), and password $\ge 8$ chars,  
    *When* the backend verifies uniqueness and persists the user record with an Argon2id password hash,  
    *Then* an initial empty `TasteProfile` is initialized, a valid JWT session token is returned, and I am navigated to the home discovery screen.
  - **AC-02 (Duplicate Identifier):**  
    *Given* an existing user registered with username `ethan_cine`,  
    *When* another user attempts to register with `ethan_cine`,  
    *Then* the system rejects registration with HTTP 409 Conflict and highlights: *"Username already taken."*

#### US-AUTH-02: User Login & Session Persistence
- **User Story:**  
  *As a* returning CineMind member,  
  *I want to* log in with my registered email or username and password,  
  *So that* I can access my private library, journal entries, and incoming recommendations.
- **Priority:** Must Have (P0) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - **AC-01 (Valid Credentials):**  
    *Given* correct credentials,  
    *When* I tap "Sign In",  
    *Then* the system returns a signed JWT Bearer token stored securely in `SecureStore` (Mobile) or browser storage (Web), persisting the session across restarts.
  - **AC-02 (Invalid Credentials):**  
    *Given* an incorrect password,  
    *When* I submit login,  
    *Then* the system returns HTTP 401 with a generic message: *"Invalid username/email or password."*

#### US-AUTH-03: User Logout
- **User Story:**  
  *As an* authenticated user,  
  *I want to* sign out of CineMind,  
  *So that* my session is terminated on the current device.
- **Priority:** Must Have (P0) | **Estimate:** 1 SP
- **Acceptance Criteria:**
  - *Given* I am signed in and tap "Sign Out" in Profile Settings,  
    *When* confirmed,  
    *Then* the local JWT token and cached private data are purged, and the client redirects to `/login`.

#### US-AUTH-04: View & Update Profile
- **User Story:**  
  *As a* CineMind member,  
  *I want to* view my profile information and set an avatar image URL,  
  *So that* my friends can easily recognize me when exchanging recommendations.
- **Priority:** Should Have (P1) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - *Given* my profile settings screen,  
    *When* I update my `avatar_url`,  
    *Then* my new avatar is visible on my profile and reflected on all recommendations I send.

---

### Epic 2: Movie Discovery & Catalog Browsing (`EPIC-DISC`)

#### US-DISC-01: Keyword Movie Search
- **User Story:**  
  *As a* movie viewer,  
  *I want to* search for films by title or keyword,  
  *So that* I can quickly locate any movie in the global catalog.
- **Priority:** Must Have (P0) | **Estimate:** 3 SP
- **Acceptance Criteria:**
  - **AC-01 (Search Execution):**  
    *Given* I type `"Interstellar"` in the search bar,  
    *When* input stabilizes (debounced $\ge 300\text{ ms}$),  
    *Then* results render in $\le 800\text{ ms}$ showing movie poster, title, release year, and genres.
  - **AC-02 (Empty Search Result):**  
    *Given* a search query yielding no matches (e.g. `"xyzqwerty999"`),  
    *When* search completes,  
    *Then* an empty state displays: *"No movies found matching 'xyzqwerty999'. Check spelling."*

#### US-DISC-02: Trending & Popular Movies
- **User Story:**  
  *As a* casual viewer looking for inspiration,  
  *I want to* view trending and popular movies on the explore home screen,  
  *So that* I can discover what is currently acclaimed without entering a query.
- **Priority:** Must Have (P0) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - *Given* I open the "Explore" tab,  
    *When* the screen loads,  
    *Then* two horizontal carousels render displaying "Trending This Week" and "Popular All Time" sourced via the cached movie gateway.

#### US-DISC-03: Movie Detail Inspection
- **User Story:**  
  *As a* viewer deciding whether to watch a film,  
  *I want to* inspect full movie metadata (director, cast, runtime, synopsis, backdrop),  
  *So that* I have comprehensive context before adding it to my library or asking AI.
- **Priority:** Must Have (P0) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - *Given* I tap on any movie card,  
    *When* the detail screen opens,  
    *Then* the system displays poster, backdrop, title, release year, runtime in hours/minutes, genre chips, director name, top 5 cast members, synopsis, and action buttons ("Add to Library", "Recommend", "AI Pre-Watch").

---

### Epic 3: Personal Movie Library & Tracking (`EPIC-LIB`)

#### US-LIB-01: Four-Status Library Management
- **User Story:**  
  *As an* avid movie watcher,  
  *I want to* organize movies into 4 distinct statuses (`Want to Watch`, `Watching`, `Watched`, `Dropped`),  
  *So that* my personal film collection accurately reflects my viewing stages.
- **Priority:** Must Have (P0) | **Estimate:** 3 SP
- **Acceptance Criteria:**
  - **AC-01 (Add to Watchlist):**  
    *Given* a movie not in my library,  
    *When* I tap "Want to Watch",  
    *Then* a `LibraryEntry` is created with status `WANT_TO_WATCH` and visible under my Library's Watchlist tab.
  - **AC-02 (Mark as Watched):**  
    *Given* a movie in `WANT_TO_WATCH` or `WATCHING`,  
    *When* I change status to `WATCHED`,  
    *Then* `watched_date` is automatically set to today's date if not manually specified (`BR-LIB-01`).

#### US-LIB-02: Rate Movie (1.0 to 10.0 Scale)
- **User Story:**  
  *As a* cinephile,  
  *I want to* assign a rating from 1.0 to 10.0 with 0.5 increments,  
  *So that* I can express nuanced evaluations of films I watched.
- **Priority:** Must Have (P0) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - **AC-01 (Rating Granularity):**  
    *Given* a movie in my library,  
    *When* I select a rating (e.g., `8.5`),  
    *Then* the rating is stored as a decimal `8.5` and displayed as stars with half-star visual rendering.
  - **AC-02 (Validation Enforcement):**  
    *Given* a rating payload,  
    *When* a value outside `1.0–10.0` or not divisible by `0.5` is submitted (e.g. `8.3` or `11.0`),  
    *Then* the API rejects the request with HTTP 422 Unprocessable Entity.

#### US-LIB-03: Favorite Toggle
- **User Story:**  
  *As a* user,  
  *I want to* mark special films as "Favorite",  
  *So that* they are highlighted in my profile and carry higher weight in my AI taste profile.
- **Priority:** Must Have (P0) | **Estimate:** 1 SP
- **Acceptance Criteria:**
  - *Given* any movie in my library,  
    *When* I tap the Heart icon,  
    *Then* `is_favorite` toggles to `true` (or `false`) with an instant optimistic UI update.

#### US-LIB-04: Watch Date & Rewatch Counter
- **User Story:**  
  *As an* enthusiast who revisits comfort movies,  
  *I want to* increment a rewatch counter and log repeat viewings,  
  *So that* my lifetime viewing metrics reflect multiple watches.
- **Priority:** Must Have (P0) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - *Given* a movie currently marked as `WATCHED`,  
    *When* I transition it back to `WATCHING` to rewatch it,  
    *Then* the system automatically increments `rewatch_count` by 1 (`BR-LIB-02`).

#### US-LIB-05: Custom Tags
- **User Story:**  
  *As an* organized viewer,  
  *I want to* attach custom string tags (e.g., `#cyberpunk`, `#comfort-movie`) to movies,  
  *So that* I can filter my library and feed contextual keywords to the AI engine.
- **Priority:** Should Have (P1) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - *Given* a library entry,  
    *When* I add tags `["#mind-bender", "#rainy-day"]`,  
    *Then* the tags are saved and can be used to filter library items.

#### US-LIB-06: Remove Movie from Library with Confirmation
- **User Story:**  
  *As a* user cleaning my library,  
  *I want to* remove a movie from my library with a safety confirmation,  
  *So that* I don't accidentally erase my records.
- **Priority:** Must Have (P0) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - *Given* I tap "Remove from Library",  
    *When* the destructive action is triggered,  
    *Then* a modal confirms: *"Remove this movie from your library? Associated journal notes will remain preserved."* (`BR-LIB-05`), and upon confirmation, the library entry is deleted.

---

### Epic 4: Personal Movie Journal (`EPIC-JOURNAL`)

#### US-JOURNAL-01: Create & Edit Private Journal Entry
- **User Story:**  
  *As a* reflective movie watcher,  
  *I want to* write rich journal reflections with viewing context (e.g., Theater, Solo at home),  
  *So that* I preserve the memory and personal emotions of that specific screening.
- **Priority:** Must Have (P0) | **Estimate:** 3 SP
- **Acceptance Criteria:**
  - **AC-01 (Journal Creation):**  
    *Given* a movie marked `WATCHED`,  
    *When* I open the Journal tab and enter `entry_text` (markdown supported, max 10,000 chars), select viewing context `THEATER`, and add `private_notes` (max 2,000 chars),  
    *Then* the entry is saved and linked to my `LibraryEntry`.
  - **AC-02 (Strict Privacy `NFR-SEC-01`):**  
    *Given* a journal entry created by User A,  
    *When* User B attempts to access it via API or UI,  
    *Then* the server returns HTTP 403 Forbidden.

#### US-JOURNAL-02: Delete Journal Entry
- **User Story:**  
  *As a* user,  
  *I want to* permanently delete a journal entry with confirmation,  
  *So that* I can remove unwanted notes.
- **Priority:** Must Have (P0) | **Estimate:** 1 SP
- **Acceptance Criteria:**
  - *Given* an existing journal entry,  
    *When* I tap "Delete Entry" and confirm the alert: *"Permanently delete this journal entry? This action cannot be undone."*,  
    *Then* the `JournalEntry` is deleted from the database.

---

### Epic 5: AI Pre-Watch Intelligence & Spoiler-Safe Q&A (`EPIC-AI`)

#### US-AI-01: Spoiler-Free Pre-Watch Analysis
- **User Story:**  
  *As a* viewer considering a movie,  
  *I want to* read an AI-generated briefing with match score, tone, pacing, and pros/cons in spoiler-free mode,  
  *So that* I can decide whether to watch it without ruining plot surprises.
- **Priority:** Must Have (P0) | **Estimate:** 3 SP
- **Acceptance Criteria:**
  - **AC-01 (Default Spoiler-Free):**  
    *Given* I open the AI Pre-Watch tab on a movie detail page,  
    *When* the analysis loads (latency $\le 2.5\text{s}$),  
    *Then* the screen renders:
      - Personal Match Score (0–100%)
      - 3–5 personalized reasons to watch
      - Potential concerns / warnings (e.g., slow pacing, graphic elements)
      - Tone and pacing badges
      - A prominent indicator: *"Spoiler-Free Mode Active"*.
  - **AC-02 (Zero Plot Twists):**  
    *Given* spoiler-free mode is active,  
    *When* the AI generates text for a mystery/thriller film (e.g., *The Sixth Sense* or *Shutter Island*),  
    *Then* the climax, endings, and twist identities are strictly omitted.

#### US-AI-02: Intentional Spoiler Override Toggle
- **User Story:**  
  *As a* viewer who has already seen the movie or doesn't mind spoilers,  
  *I want to* explicitly toggle Spoiler Mode on with a confirmation prompt,  
  *So that* I can get deeper narrative analysis when desired.
- **Priority:** Must Have (P0) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - *Given* I am on the Pre-Watch or Q&A screen,  
    *When* I switch the "Enable Spoilers" toggle,  
    *Then* a warning modal appears: *"Warning: Enabling spoilers will reveal major plot points, twists, and ending details. Proceed?"*  
    *And* only upon confirming "Enable" does the AI request permit spoiler-containing responses.

#### US-AI-03: Conversational Movie Q&A
- **User Story:**  
  *As a* viewer with specific sensitivities,  
  *I want to* ask questions like "Does this movie have jump scares?" or "Is it too gory for a date night?",  
  *So that* I receive direct, conversational advice.
- **Priority:** Must Have (P0) | **Estimate:** 3 SP
- **Acceptance Criteria:**
  - **AC-01 (Streaming Q&A):**  
    *Given* I submit a question (max 300 chars),  
    *When* the query dispatches,  
    *Then* the answer streams in via SSE with time-to-first-token $\le 1.2\text{s}$.
  - **AC-02 (Spoiler Shield Enforcement):**  
    *Given* spoiler-free mode is active,  
    *When* I ask *"Who is the killer?"*,  
    *Then* the AI responds: *"To preserve your movie experience, spoilers are hidden. Tap 'Enable Spoilers' above to reveal."*

#### US-AI-04: Mood-Based Recommendations
- **User Story:**  
  *As a* viewer in a specific emotional state,  
  *I want to* request movie suggestions by typing a mood phrase (e.g., "comforting rainy-day sci-fi"),  
  *So that* the AI finds titles matching my mood and calibrated to my taste profile.
- **Priority:** Must Have (P0) | **Estimate:** 3 SP
- **Acceptance Criteria:**
  - *Given* I submit a mood prompt,  
    *When* the AI processes the query with my active `TasteProfile`,  
    *Then* a curated list of 3–5 recommended movie cards is returned, each displaying a tailored rationale explaining why it matches my mood.

#### US-AI-05: Dynamic Taste Profile Synthesis
- **User Story:**  
  *As an* active CineMind user,  
  *I want* my taste profile to automatically calibrate as I log, rate, and favorite films,  
  *So that* my match scores and recommendations become more accurate over time.
- **Priority:** Must Have (P0) | **Estimate:** 3 SP
- **Acceptance Criteria:**
  - *Given* I rate 3 horror films with high scores (9.0+) and mark them favorites,  
    *When* the system updates my `TasteProfile`,  
    *Then* horror genre weighting increases and subsequent Pre-Watch analyses reflect higher match scores for quality horror titles.

---

### Epic 6: Social Graph & Friend Management (`EPIC-FRIEND`)

#### US-FRIEND-01: Search Users by Username
- **User Story:**  
  *As a* user,  
  *I want to* search for friends by their CineMind username,  
  *So that* I can send them a friendship connection request.
- **Priority:** Must Have (P0) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - *Given* I enter a username in the friend search tab,  
    *When* matching accounts are found,  
    *Then* their username, avatar, and a "Add Friend" button are displayed. Blocked users are excluded from search results.

#### US-FRIEND-02: Friendship Lifecycle (Send, Accept, Reject)
- **User Story:**  
  *As a* user receiving a friend request,  
  *I want to* accept or decline the invitation,  
  *So that* I control who can send me direct movie recommendations.
- **Priority:** Must Have (P0) | **Estimate:** 3 SP
- **Acceptance Criteria:**
  - **AC-01 (Send Request):** User A sends request to User B -> Friendship state set to `PENDING`.
  - **AC-02 (Accept Request):** User B accepts -> Friendship state becomes `ACCEPTED`. Both users now appear in each other's friend lists and can exchange recommendations.
  - **AC-03 (Reject Request):** User B rejects -> The pending friendship record is removed.

#### US-FRIEND-03: Remove Friend & Block User
- **User Story:**  
  *As a* user,  
  *I want to* remove a friend or block an abusive user,  
  *So that* they can no longer interact with me or send recommendations.
- **Priority:** Must Have (P0) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - **AC-01 (Remove Friend):** Tapping "Remove Friend" deletes the friendship connection; existing recommendations remain archived.
  - **AC-02 (Block User):** Tapping "Block User" sets status to `BLOCKED`; all active pending recommendations between the two users are cancelled, and neither can search for the other.

---

### Epic 7: Direct Movie Recommendations & Lifecycle Tracking (`EPIC-REC`)

#### US-REC-01: Send Direct Movie Recommendation
- **User Story:**  
  *As a* friend who loved a movie,  
  *I want to* recommend it directly to a confirmed friend with a personal pitch (max 500 chars),  
  *So that* it appears in their recommendation inbox with my personal endorsement.
- **Priority:** Must Have (P0) | **Estimate:** 3 SP
- **Acceptance Criteria:**
  - *Given* User A and User B are `ACCEPTED` friends,  
    *When* User A chooses a movie, selects User B, types *"You will love the soundtrack"*, and taps Send,  
    *Then* a `MovieRecommendation` is created in state `PENDING`, and User B receives an in-app notification.

#### US-REC-02: View Recommendation & Auto-Transition to "Seen"
- **User Story:**  
  *As a* recommendation recipient,  
  *I want to* open and inspect the recommendation card,  
  *So that* the sender knows I acknowledged it and I can see their message.
- **Priority:** Must Have (P0) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - *Given* a recommendation in status `PENDING`,  
    *When* the recipient navigates to `/recommendations/{id}` or taps the inbox item,  
    *Then* the recommendation status automatically advances to `SEEN` (`RULE-REC-01`).

#### US-REC-03: Add Recommendation to Watchlist
- **User Story:**  
  *As a* recipient interested in a friend's recommendation,  
  *I want to* tap "Add to Watchlist" directly from the recommendation card,  
  *So that* the film is saved to my library and my friend sees my progress.
- **Priority:** Must Have (P0) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - *Given* a recommendation in status `SEEN`,  
    *When* the recipient taps "Add to Watchlist",  
    *Then* the movie is added to their library with status `WANT_TO_WATCH`, and the recommendation status updates automatically to `ADDED_TO_WATCHLIST` (`RULE-REC-02`).

#### US-REC-04: Watch, Rate & Submit Recommendation Feedback
- **User Story:**  
  *As a* recipient who just finished watching a recommended movie,  
  *I want to* rate the movie and state whether the recommendation was helpful,  
  *So that* the recommendation lifecycle completes and my friend is credited with a successful suggestion.
- **Priority:** Must Have (P0) | **Estimate:** 3 SP
- **Acceptance Criteria:**
  - **AC-01 (Auto-Progression on Watch):** When the recipient marks the movie as `WATCHED`, the linked recommendation automatically advances to `WATCHED` (`RULE-REC-03`).
  - **AC-02 (Rating & Feedback Modal):** When the recipient submits a rating (e.g. `9.0`), the status advances to `RATED` (`RULE-REC-04`), and a prompt asks: *"Was this recommendation from {Sender} helpful?"*  
    *When* the recipient submits "Yes", `is_helpful` is saved as `true`, and the sender's recommendation success rate increases.

#### US-REC-05: Dismiss Recommendation
- **User Story:**  
  *As a* recipient not interested in a suggested film,  
  *I want to* dismiss the recommendation,  
  *So that* it is archived from my active inbox without cluttering my view.
- **Priority:** Must Have (P0) | **Estimate:** 1 SP
- **Acceptance Criteria:**
  - *Given* an uncompleted recommendation (`PENDING` or `SEEN`),  
    *When* I tap "Dismiss",  
    *Then* the status transitions to `DISMISSED`, removing it from the active inbox tab.

---

### Epic 8: Viewing Analytics & Recommendation Insights (`EPIC-STAT`)

#### US-STAT-01: Personal Viewing Statistics
- **User Story:**  
  *As a* movie enthusiast,  
  *I want to* view analytics on my watch count, total hours watched, top genres, and rating distribution,  
  *So that* I understand my personal cinematic habits.
- **Priority:** Should Have (P1) | **Estimate:** 3 SP
- **Acceptance Criteria:**
  - *Given* my library contains watched movies,  
    *When* I open the Stats tab in Profile,  
    *Then* the system displays:
      - Total movies watched
      - Total watch time (converted from runtime minutes to hours/days)
      - Top 5 genres ranked by watch frequency
      - Rating distribution bar chart (histogram across 1.0 to 10.0).

#### US-STAT-02: Social Recommendation Effectiveness
- **User Story:**  
  *As a* friend who loves giving movie advice,  
  *I want to* see my recommendation success rate and see which friend gives me the best recommendations,  
  *So that* we can celebrate great taste and track recommendation quality over time.
- **Priority:** Should Have (P1) | **Estimate:** 2 SP
- **Acceptance Criteria:**
  - *Given* sent recommendations have been rated by recipients,  
    *When* I view social stats,  
    *Then* the system displays my recommendation success rate:
      $$\text{Success Rate} = \frac{\text{Count of Recommendations marked Helpful}}{\text{Total Completed Recommendations}} \times 100\%$$
    *And* highlights my top recommender friend whose recommendations have the highest average rating in my library.

---

## 4. Traceability Matrix

| User Story | PRD Requirements (`FR-*`) | Architecture Module | Business Rules (`BR-*` / `RULE-*`) |
| :--- | :--- | :--- | :--- |
| `US-AUTH-01..04` | `FR-AUTH-01` to `FR-AUTH-04` | `AuthModule` | Argon2id, JWT Bearer sessions |
| `US-DISC-01..03` | `FR-DISC-01` to `FR-DISC-03` | `CatalogModule` | `MovieCache` TTL, TMDB Proxy |
| `US-LIB-01..06` | `FR-LIB-01` to `FR-LIB-06` | `LibraryModule` | `BR-LIB-01` to `BR-LIB-05` |
| `US-JOURNAL-01..02` | `FR-JOURNAL-01`, `FR-JOURNAL-02` | `JournalModule` | Private access isolation (`NFR-SEC-01`) |
| `US-AI-01..05` | `FR-AI-01` to `FR-AI-07` | `AIModule`, `TasteModule` | Spoiler Guardrails, SSE Streaming |
| `US-FRIEND-01..03` | `FR-SOC-01`, `FR-SOC-02` | `SocialModule` | Friendship lifecycle, Block filtering |
| `US-REC-01..05` | `FR-SOC-03` to `FR-SOC-07` | `SocialModule` | `RULE-REC-01` to `RULE-REC-05` |
| `US-STAT-01..02` | `FR-STAT-01`, `FR-STAT-02` | `TasteModule`, `SocialModule` | Success rate formula |

---

## 5. Agile Quality Gates: Definition of Ready & Done

### Definition of Ready (DoR)
A User Story is ready for sprint ingestion only when:
1. Title, user story narrative, and Gherkin acceptance criteria are fully specified.
2. Business rules and error/edge cases are explicitly documented.
3. Dependencies on schema entities or external gateways are satisfied.
4. MoSCoW priority and story point estimation are assigned.

### Definition of Done (DoD)
A User Story is marked completed only when:
1. Implementation matches all Gherkin acceptance criteria.
2. Unit and integration tests pass with $\ge 85\%$ branch coverage.
3. Endpoint validations strictly conform to `api-specification.md`.
4. Mobile (iOS/Android) and Web responsiveness are verified without UI clipping or horizontal scrolling.
5. Spoiler-free guardrails are verified with zero plot leakage in pre-watch and Q&A tests.
