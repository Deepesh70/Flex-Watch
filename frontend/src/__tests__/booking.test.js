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
});
