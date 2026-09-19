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
};

export default bookingService;
