import { backendClient } from './tmdb';

export const bookingService = {
  /**
   * Fetch already occupied seats for a movie and showtime
   */
  getOccupiedSeats: async (movieId, showtime) => {
    try {
      const res = await backendClient.get('/bookings/occupied', {
        params: { movieId, showtime },
      });
      return res.data?.occupiedSeats || [];
    } catch (err) {
      console.warn('Could not fetch occupied seats:', err.message);
      return [];
    }
  },

  /**
   * Fetch both confirmed occupied seats and active temporary holds
   */
  getOccupiedAndHeldSeats: async (movieId, showtime) => {
    try {
      const res = await backendClient.get('/bookings/occupied', {
        params: { movieId, showtime },
      });
      return {
        occupiedSeats: res.data?.occupiedSeats || [],
        heldSeats: res.data?.heldSeats || [],
      };
    } catch (err) {
      console.warn('Could not fetch occupied and held seats:', err.message);
      return { occupiedSeats: [], heldSeats: [] };
    }
  },

  /**
   * Fetch cinema venues, formats, and showtimes for a movie
   */
  getMovieShows: async (movieId, movieTitle) => {
    try {
      const res = await backendClient.get(`/movies/${movieId}/shows`, {
        params: movieTitle ? { title: movieTitle } : {},
      });
      return res.data || [];
    } catch (err) {
      console.warn('Could not fetch movie theaters and shows:', err.message);
      return [];
    }
  },

  /**
   * Fetch occupancy and metadata for a specific screening show
   */
  getShowOccupancy: async (showId) => {
    try {
      const res = await backendClient.get(`/bookings/shows/${showId}/occupancy`);
      return res.data;
    } catch (err) {
      console.warn('Could not fetch show occupancy:', err.message);
      return null;
    }
  },

  /**
   * Acquire temporary 10-minute hold on selected seats
   */
  holdSeats: async ({ movieId, showtime, showId, seats }, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await backendClient.post('/bookings/hold', { movieId, showtime, showId, seats }, { headers });
    return res.data;
  },

  /**
   * Release temporary seat hold
   */
  releaseSeats: async ({ movieId, showtime, showId, seats }, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await backendClient.post('/bookings/release', { movieId, showtime, showId, seats }, { headers });
    return res.data;
  },

  /**
   * Create an idempotent ticket reservation
   */
  createBooking: async (bookingData, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await backendClient.post('/bookings', bookingData, { headers });
    return res.data;
  },

  /**
   * List all bookings for the active user
   */
  getUserBookings: async (token) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await backendClient.get('/bookings', { headers });
      return res.data || [];
    } catch (err) {
      console.warn('Could not fetch user bookings:', err.message);
      return [];
    }
  },

  /**
   * Cancel an existing booking
   */
  cancelBooking: async (bookingId, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await backendClient.delete(`/bookings/${bookingId}`, { headers });
    return res.data;
  },

  /**
   * Create Stripe Checkout session for pending booking
   */
  createCheckoutSession: async ({ bookingId, successUrl, cancelUrl }, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await backendClient.post('/payments/create-checkout-session', {
      bookingId,
      successUrl,
      cancelUrl,
    }, { headers });
    return res.data;
  },

  /**
   * Confirm paid or sandbox session and retrieve confirmed ticket
   */
  confirmPaymentSession: async ({ bookingId, sessionId }, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await backendClient.post('/payments/confirm-session', {
      bookingId,
      sessionId,
    }, { headers });
    return res.data;
  },
};

export default bookingService;
