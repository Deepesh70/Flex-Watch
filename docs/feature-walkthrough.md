# 🎬 Feature Walkthrough: Flex-Watch

A comprehensive guide to the user-facing capabilities and technical implementations across **Flex-Watch**.

---

## 1. Interactive Hero Carousel

Located at the top of the homepage (`frontend/src/components/HeroCarousal/`):

* **Cinematic Video Previews**: Automatically streams silent official YouTube trailers in the background on high-speed connections after a 1.6-second delay.
* **Low-Resource Device Optimization**: Checks `navigator.connection` and device hardware concurrency (`isLowResourceEnvironment()`). If the user is on a slow connection or low-end device, video autoplay is disabled, and high-definition backdrop posters are used instead.
* **User Audio & Mode Controls**: Floating ambient buttons allow visitors to toggle audio (`Mute / Sound On`) or switch to `Poster Mode` at any time.
* **Smart Slide Progression**: Listens for the YouTube player's `onStateChange === 0` (video ended) event to automatically advance to the next movie.

---

## 2. Real-Time Search & Discovery

* **Instant Search Bar**: Embedded in the main navigation bar (`frontend/src/components/Navbar/`).
* **Debounced / Live Queries**: As users type, queries hit `/api/v1/search?q=...`.
* **Zero-Reload Results**: Replaces the homepage shelf with an instant grid of matched movies, complete with rating badges and release years.

---

## 3. Dynamic Category & Genre Filtering

* **Interactive Genre Chips**: Users can filter movies by Action, Adventure, Drama, Comedy, Sci-Fi, Crime, and Fantasy (`frontend/src/components/CategoryFilter/`).
* **Client & Server Coordination**: Dynamically partitions trending and popular datasets by TMDB genre IDs with animated filter transitions.

---

## 4. Movie Details Experience

Opening any movie (`/movie/:id`) navigates to a rich details layout (`frontend/src/pages/Movie.page.jsx`):

* **Cinematic Banner**: High-resolution backdrop image with dark vignettes, title, release year, runtime, and average rating score.
* **Trailer Streaming Modal**: Clicking "Watch Trailer" opens an accessible video modal (`frontend/src/components/common/MovieModal.jsx`) streaming the official YouTube trailer fetched dynamically from the backend.
* **Cast & Crew Shelves**: Horizontal slider presenting actor profile avatars, character names, and crew credits.
* **Similar Titles**: Algorithmically matched similar movies fetched from `/api/v1/movies/:id/similar`.

---

## 5. Machine Learning Recommendations Engine

Rather than displaying arbitrary movies, Flex-Watch provides **content-based ML recommendations**:

* **How It Works**:
  1. The client requests `/api/v1/movies/:id/recommendations?title=<movieTitle>`.
  2. The backend searches the precomputed ML similarity dictionary (`backend/data/recommendations.json`), which calculates the 5 closest cosine-similarity neighbors based on metadata vectors (genres, keywords, cast, and directors).
  3. **Intelligent Fallback**: If the movie is not present in the ~4,800 training dataset, the backend automatically falls back to TMDB's similar movies API so recommendations are **never empty**.

---

## 6. Database-Backed Persistent Watchlist ("My List")

Previously stored only in browser memory, the watchlist is now a **relational, database-persisted feature**:

* **One-Click Bookmarking**: Available via `+` and `✓` buttons on the hero carousel, poster cards, and movie details pages.
* **Optimistic UI Updates**: The card icon toggles instantly in 0ms on the screen, while asynchronously syncing with the database in the background via `watchlistService`.
* **Cross-Device Sync**: Persists to SQLite/PostgreSQL, ensuring the user's saved movies are accessible anywhere.
* **Dedicated Watchlist View**: Users can view and manage their entire saved collection in the **Profile Page** (`/profile`).

---

## 7. Dedicated TV Series Catalog

Accessible via `/series` (`frontend/src/pages/Series.page.jsx`):

* Explores four TV catalog shelves: **Most Popular**, **Top Rated**, **On The Air**, and **Trending TV**.
* Multi-axis sorting (by rating, release date, or alphabetical title) and view toggles (`Grid` vs `List` mode).

---

## 8. Authentication with Clerk

* **Header Sign-In / Sign-Out**: Powered by `@clerk/clerk-react` (`<SignInButton>`, `<UserButton>`).
* **Profile Integration**: When logged in, user identity tokens are validated by the backend, automatically creating or linking the user record in the database.
* **Guest Fallback**: Visitors can browse, bookmark, and explore the app fully even without signing in.

---

## 9. UX Resilience & Skeletons

* **Shimmering Skeleton Screens**: Pre-renders layout placeholders (`frontend/src/components/common/LoadingSkeleton.jsx`) during network fetching, eliminating layout shifts.
* **React Error Boundaries**: Catches uncaught runtime render errors in `<ErrorBoundary>`, displaying an intuitive retry screen instead of a white crash page.

---

## 10. Interactive Cinema Seat Booking System (BookMyShow Experience)

Flex-Watch features a flagship **BookMyShow-style cinema reservation engine** directly integrated into movie details:

* **Entry Point**: A prominent **"Book Tickets"** CTA on every movie page opens the modal experience.
* **Interactive Seating Map (`SeatPickerModal.jsx`)**:
  * **Curved Cinema Screen**: High-fidelity neon-glow curved screen SVG with projection beam styling and "SCREEN THIS WAY".
  * **Showtime & Date Carousel**: Select between multiple date tabs (Today, Tomorrow, Weekend) and showtimes (01:30 PM, 04:45 PM, 07:30 PM IMAX Laser, 10:15 PM).
  * **Multi-Tier Seating Grid**:
    * **VIP Recliners** (Rows A-B, $15.00/seat, gold accent)
    * **Premium Club** (Rows C-E, $12.00/seat, blue accent)
    * **Standard Cinema** (Rows F-G, $10.00/seat, slate accent)
  * **Live Occupancy Sync**: Queries `/api/v1/bookings/occupied` in real-time to disable already-booked seats.
  * **Dynamic Price Calculation**: Real-time tally of selected seats and subtotal.
* **Idempotent & Race-Condition Safe Backend**:
  * Employs UUID v4 `idempotencyKey` preventing duplicate charges or bookings upon network retransmits.
  * Checks for seat collisions atomically, returning `HTTP 409 Conflict` if another patron reserved any of the selected seats first.
* **Digital Cinema Pass (`TicketModal.jsx`)**:
  * Perforated cinema pass layout with tear notches, simulated scannable QR / barcodes, movie thumbnail, reference ID (`FLX-XXXXXX`), and seat allocation.
  * Features native **"Print / Save Ticket"** support via window print styling.
* **Profile Integration**:
  * The **Profile Page** (`/profile`) features a dedicated **"My Cinema Bookings"** tab with count badge, card summaries, digital ticket viewer, and cancellation controls (`DELETE /api/v1/bookings/:id`).

