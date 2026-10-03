import { describe, it, expect, vi, beforeEach } from 'vitest';
import bookingService from '../services/booking.service';
import { backendClient } from '../services/tmdb';

vi.mock('../services/tmdb', () => ({
  backendClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Booking Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getOccupiedSeats returns array of seat codes', async () => {
    backendClient.get.mockResolvedValueOnce({
      data: { occupiedSeats: ['A1', 'A2', 'C4'] },
    });

    const seats = await bookingService.getOccupiedSeats('101', '2026-09-20 19:30');
    expect(seats).toEqual(['A1', 'A2', 'C4']);
    expect(backendClient.get).toHaveBeenCalledWith('/bookings/occupied', {
      params: { movieId: '101', showtime: '2026-09-20 19:30' },
    });
  });

  it('getOccupiedSeats gracefully falls back to empty array on error', async () => {
    backendClient.get.mockRejectedValueOnce(new Error('Network error'));
    const seats = await bookingService.getOccupiedSeats('101', '2026-09-20 19:30');
    expect(seats).toEqual([]);
  });

  it('createBooking posts booking data with auth header when token is supplied', async () => {
    const mockPayload = {
      movieId: '101',
      movieTitle: 'Moana 2',
      showtime: '2026-09-20 19:30',
      seats: ['A1', 'A2'],
      totalAmount: 30,
      idempotencyKey: 'idemp-1234',
    };
    backendClient.post.mockResolvedValueOnce({
      data: { id: 'booking-1', ...mockPayload, status: 'CONFIRMED' },
    });

    const result = await bookingService.createBooking(mockPayload, 'mock-jwt-token');
    expect(backendClient.post).toHaveBeenCalledWith(
      '/bookings',
      mockPayload,
      { headers: { Authorization: 'Bearer mock-jwt-token' } }
    );
    expect(result.id).toBe('booking-1');
  });

  it('getUserBookings retrieves user bookings', async () => {
    backendClient.get.mockResolvedValueOnce({
      data: [{ id: 'b1', movieTitle: 'Moana 2' }],
    });

    const bookings = await bookingService.getUserBookings('mock-jwt-token');
    expect(bookings).toHaveLength(1);
    expect(bookings[0].id).toBe('b1');
  });

  it('cancelBooking sends DELETE request with booking ID', async () => {
    backendClient.delete.mockResolvedValueOnce({
      data: { id: 'b1', status: 'CANCELLED' },
    });

    const res = await bookingService.cancelBooking('b1', 'mock-jwt-token');
    expect(backendClient.delete).toHaveBeenCalledWith(
      '/bookings/b1',
      { headers: { Authorization: 'Bearer mock-jwt-token' } }
    );
    expect(res.status).toBe('CANCELLED');
  });

  it('getOccupiedAndHeldSeats returns occupied and held seat lists', async () => {
    backendClient.get.mockResolvedValueOnce({
      data: {
        occupiedSeats: ['A1', 'A2'],
        heldSeats: [{ seatCode: 'B3', userId: 'user-2' }],
      },
    });

    const result = await bookingService.getOccupiedAndHeldSeats('101', '2026-09-20 19:30');
    expect(result.occupiedSeats).toEqual(['A1', 'A2']);
    expect(result.heldSeats).toEqual([{ seatCode: 'B3', userId: 'user-2' }]);
  });

  it('holdSeats posts to /bookings/hold with seats and token', async () => {
    backendClient.post.mockResolvedValueOnce({
      data: { success: true, heldSeats: ['C1'] },
    });

    const res = await bookingService.holdSeats({
      movieId: 101,
      showtime: '2026-09-20 19:30',
      seats: ['C1'],
    }, 'mock-jwt-token');

    expect(backendClient.post).toHaveBeenCalledWith(
      '/bookings/hold',
      { movieId: 101, showtime: '2026-09-20 19:30', seats: ['C1'] },
      { headers: { Authorization: 'Bearer mock-jwt-token' } }
    );
    expect(res.success).toBe(true);
  });

  it('releaseSeats posts to /bookings/release with seats and token', async () => {
    backendClient.post.mockResolvedValueOnce({
      data: { success: true, releasedSeats: ['C1'] },
    });

    const res = await bookingService.releaseSeats({
      movieId: 101,
      showtime: '2026-09-20 19:30',
      seats: ['C1'],
    }, 'mock-jwt-token');

    expect(backendClient.post).toHaveBeenCalledWith(
      '/bookings/release',
      { movieId: 101, showtime: '2026-09-20 19:30', seats: ['C1'] },
      { headers: { Authorization: 'Bearer mock-jwt-token' } }
    );
    expect(res.success).toBe(true);
  });

  it('getMovieShows retrieves theaters and shows for a movie', async () => {
    const mockVenues = [
      {
        theaterId: 'th-1',
        name: 'PVR IMAX',
        city: 'Mumbai',
        screens: [{ screenId: 'sc-1', format: 'IMAX', shows: [{ id: 'sh-1', startTime: '2026-10-04T19:30:00.000Z' }] }],
      },
    ];
    backendClient.get.mockResolvedValueOnce({ data: mockVenues });

    const venues = await bookingService.getMovieShows(101, 'Moana 2');
    expect(backendClient.get).toHaveBeenCalledWith('/movies/101/shows', {
      params: { title: 'Moana 2' },
    });
    expect(venues).toEqual(mockVenues);
  });

  it('getShowOccupancy retrieves screen format and seat occupancy', async () => {
    const mockShowData = {
      showId: 'sh-1',
      theaterName: 'PVR IMAX',
      format: 'IMAX',
      occupiedSeats: ['A1', 'A2'],
      heldSeats: [],
    };
    backendClient.get.mockResolvedValueOnce({ data: mockShowData });

    const occupancy = await bookingService.getShowOccupancy('sh-1');
    expect(backendClient.get).toHaveBeenCalledWith('/bookings/shows/sh-1/occupancy');
    expect(occupancy.format).toBe('IMAX');
    expect(occupancy.occupiedSeats).toEqual(['A1', 'A2']);
  });

  it('createCheckoutSession posts payload to /payments/create-checkout-session', async () => {
    backendClient.post.mockResolvedValueOnce({
      data: { checkoutUrl: 'https://checkout.stripe.com/pay/cs_123', sessionId: 'cs_123', isMock: false },
    });

    const res = await bookingService.createCheckoutSession({
      bookingId: 'b_123',
      successUrl: 'http://localhost:3000/success',
      cancelUrl: 'http://localhost:3000/cancel',
    }, 'mock-jwt-token');

    expect(backendClient.post).toHaveBeenCalledWith(
      '/payments/create-checkout-session',
      { bookingId: 'b_123', successUrl: 'http://localhost:3000/success', cancelUrl: 'http://localhost:3000/cancel' },
      { headers: { Authorization: 'Bearer mock-jwt-token' } }
    );
    expect(res.sessionId).toBe('cs_123');
  });

  it('confirmPaymentSession posts to /payments/confirm-session', async () => {
    backendClient.post.mockResolvedValueOnce({
      data: { success: true, booking: { id: 'b_123', status: 'CONFIRMED' } },
    });

    const res = await bookingService.confirmPaymentSession({
      bookingId: 'b_123',
      sessionId: 'cs_123',
    }, 'mock-jwt-token');

    expect(backendClient.post).toHaveBeenCalledWith(
      '/payments/confirm-session',
      { bookingId: 'b_123', sessionId: 'cs_123' },
      { headers: { Authorization: 'Bearer mock-jwt-token' } }
    );
    expect(res.booking.status).toBe('CONFIRMED');
  });
});
