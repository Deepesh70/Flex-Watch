import React, { useState, useEffect } from 'react';
import { FaTimes, FaFilm, FaCalendarDay, FaClock, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import bookingService from '../../services/booking.service';

const SEAT_TIERS = {
  VIP: { rows: ['A', 'B'], price: 15.0, label: 'VIP Recliners ($15.00)', color: 'border-accent-gold/60 text-accent-gold' },
  PREMIUM: { rows: ['C', 'D', 'E'], price: 12.0, label: 'Premium ($12.00)', color: 'border-blue-400/60 text-blue-400' },
  STANDARD: { rows: ['F', 'G'], price: 10.0, label: 'Standard ($10.00)', color: 'border-gray-400/60 text-gray-300' },
};

const DATES = [
  { label: 'Today', offsetDays: 0 },
  { label: 'Tomorrow', offsetDays: 1 },
  { label: 'Day After', offsetDays: 2 },
];

const TIME_SLOTS = [
  { time: '13:30', label: '01:30 PM • 2D' },
  { time: '16:45', label: '04:45 PM • Dolby 7.1' },
  { time: '19:30', label: '07:30 PM • IMAX Laser' },
  { time: '22:15', label: '10:15 PM • Night Show' },
];

const SeatPickerModal = ({ movie, onClose, onBookingSuccess, token }) => {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(2); // default 07:30 PM
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate selected showtime Date
  const getCalculatedShowtime = () => {
    const base = new Date();
    base.setDate(base.getDate() + DATES[selectedDateIndex].offsetDays);
    const [hours, minutes] = TIME_SLOTS[selectedSlotIndex].time.split(':').map(Number);
    base.setHours(hours, minutes, 0, 0);
    return base.toISOString();
  };

  const currentShowtimeISO = getCalculatedShowtime();

  // Load occupied seats on movie or showtime change
  useEffect(() => {
    let isMounted = true;
    const loadOccupied = async () => {
      setLoadingSeats(true);
      setErrorMessage('');
      try {
        const occupied = await bookingService.getOccupiedSeats(movie.id, currentShowtimeISO);
        if (isMounted) {
          setOccupiedSeats(occupied || []);
          // Deselect any seats that are now occupied
          setSelectedSeats((prev) => prev.filter((s) => !occupied.includes(s.id)));
          setLoadingSeats(false);
        }
      } catch (err) {
        if (isMounted) setLoadingSeats(false);
      }
    };

    loadOccupied();
    return () => {
      isMounted = false;
    };
  }, [movie.id, currentShowtimeISO]);

  const getSeatTier = (rowLetter) => {
    if (SEAT_TIERS.VIP.rows.includes(rowLetter)) return SEAT_TIERS.VIP;
    if (SEAT_TIERS.PREMIUM.rows.includes(rowLetter)) return SEAT_TIERS.PREMIUM;
    return SEAT_TIERS.STANDARD;
  };

  const handleSeatClick = (seatId, tier) => {
    setErrorMessage('');
    const exists = selectedSeats.some((s) => s.id === seatId);
    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seatId));
    } else {
      if (selectedSeats.length >= 8) {
        setErrorMessage('You can select a maximum of 8 seats per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, { id: seatId, price: tier.price }]);
    }
  };

  const totalAmount = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      setErrorMessage('Please select at least one seat to continue.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : `${Date.now()}`;
    const idempotencyKey = `idemp_${movie.id}_${Date.now()}_${randomSuffix}`;

    try {
      const payload = {
        idempotencyKey,
        movieId: movie.id,
        movieTitle: movie.title || movie.original_title,
        showtime: currentShowtimeISO,
        seats: selectedSeats.map((s) => s.id),
        totalAmount,
      };

      const booking = await bookingService.createBooking(payload, token);
      setSubmitting(false);
      onBookingSuccess(booking);
    } catch (err) {
      setSubmitting(false);
      if (err.response?.status === 409) {
        setErrorMessage(
          err.response.data?.detail || 'One or more of your chosen seats was just reserved by another user. Please choose another seat.'
        );
        // Refresh occupied seats
        const refreshed = await bookingService.getOccupiedSeats(movie.id, currentShowtimeISO);
        setOccupiedSeats(refreshed);
      } else {
        setErrorMessage(err.response?.data?.detail || err.message || 'Failed to complete reservation.');
      }
    }
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-dark-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-800/90">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-accent-gold">
              Cinema Seat Selection
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white truncate max-w-md sm:max-w-xl">
              {movie.title || movie.original_title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Showtime & Date Pickers */}
        <div className="px-6 py-4 bg-dark-800/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
              <FaCalendarDay className="text-accent-gold" /> Date:
            </span>
            <div className="flex gap-1.5">
              {DATES.map((d, index) => (
                <button
                  key={d.label}
                  onClick={() => setSelectedDateIndex(index)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedDateIndex === index
                      ? 'bg-accent-gold text-dark-900 shadow-md shadow-accent-gold/20'
                      : 'bg-dark-700/80 text-gray-300 hover:text-white hover:bg-dark-600'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeslot Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
              <FaClock className="text-accent-gold" /> Slot:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TIME_SLOTS.map((slot, index) => (
                <button
                  key={slot.time}
                  onClick={() => setSelectedSlotIndex(index)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedSlotIndex === index
                      ? 'bg-accent-gold text-dark-900 shadow-md shadow-accent-gold/20'
                      : 'bg-dark-700/80 text-gray-300 hover:text-white hover:bg-dark-600'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Seating Map Canvas Area */}
        <div className="p-6 sm:p-8 flex flex-col items-center select-none overflow-x-auto">
          {/* Curved Cinema Screen Graphic */}
          <div className="w-full max-w-md flex flex-col items-center mb-8">
            <div className="relative w-full h-10 flex items-center justify-center">
              <svg viewBox="0 0 300 40" className="w-full h-full stroke-accent-gold/60 fill-none">
                <path d="M 10 35 Q 150 5 290 35" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-b from-accent-gold/10 to-transparent blur-md pointer-events-none" />
            </div>
            <span className="text-[10px] tracking-widest font-black uppercase text-gray-500 -mt-2">
              ALL EYES THIS WAY • CINEMA SCREEN
            </span>
          </div>

          {/* Seat Grid */}
          <div className="space-y-3 min-w-[340px]">
            {rows.map((row) => {
              const tier = getSeatTier(row);
              return (
                <div key={row} className="flex items-center gap-3">
                  {/* Row Letter Label */}
                  <span className="w-5 text-center text-xs font-black text-gray-500">
                    {row}
                  </span>

                  {/* Left Block (Seats 1-4) */}
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((num) => {
                      const seatId = `${row}${num}`;
                      const isOccupied = occupiedSeats.includes(seatId);
                      const isSelected = selectedSeats.some((s) => s.id === seatId);

                      return (
                        <button
                          key={seatId}
                          disabled={isOccupied}
                          onClick={() => handleSeatClick(seatId, tier)}
                          title={`${seatId} (${tier.label})`}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-t-lg rounded-b text-[11px] font-bold transition-all flex items-center justify-center relative ${
                            isOccupied
                              ? 'bg-dark-800 text-gray-600 border border-white/5 cursor-not-allowed opacity-40'
                              : isSelected
                              ? 'bg-accent-gold text-dark-900 border border-accent-gold shadow-lg shadow-accent-gold/30 scale-105'
                              : 'bg-dark-800/90 text-gray-300 border border-white/10 hover:border-accent-gold/60 hover:text-white hover:scale-105'
                          }`}
                        >
                          {isSelected ? <FaCheck className="w-3 h-3" /> : num}
                        </button>
                      );
                    })}
                  </div>

                  {/* Aisle Gap */}
                  <div className="w-6 sm:w-8" />

                  {/* Right Block (Seats 5-8) */}
                  <div className="flex gap-2">
                    {[5, 6, 7, 8].map((num) => {
                      const seatId = `${row}${num}`;
                      const isOccupied = occupiedSeats.includes(seatId);
                      const isSelected = selectedSeats.some((s) => s.id === seatId);

                      return (
                        <button
                          key={seatId}
                          disabled={isOccupied}
                          onClick={() => handleSeatClick(seatId, tier)}
                          title={`${seatId} (${tier.label})`}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-t-lg rounded-b text-[11px] font-bold transition-all flex items-center justify-center relative ${
                            isOccupied
                              ? 'bg-dark-800 text-gray-600 border border-white/5 cursor-not-allowed opacity-40'
                              : isSelected
                              ? 'bg-accent-gold text-dark-900 border border-accent-gold shadow-lg shadow-accent-gold/30 scale-105'
                              : 'bg-dark-800/90 text-gray-300 border border-white/10 hover:border-accent-gold/60 hover:text-white hover:scale-105'
                          }`}
                        >
                          {isSelected ? <FaCheck className="w-3 h-3" /> : num}
                        </button>
                      );
                    })}
                  </div>

                  {/* Row Letter Label (Right) */}
                  <span className="w-5 text-center text-xs font-black text-gray-500">
                    {row}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Seat Status Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-white/10 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-t bg-dark-800 border border-white/15" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-t bg-accent-gold border border-accent-gold shadow-sm" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-t bg-dark-800 border border-white/5 opacity-40" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-white/10">
              <span className="text-accent-gold font-bold">Rows A-B:</span> VIP ($15)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold">Rows C-E:</span> Premium ($12)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold">Rows F-G:</span> Standard ($10)
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mx-6 mb-4 p-3.5 bg-red-500/10 border border-red-500/40 rounded-xl flex items-center gap-3 text-red-300 text-xs animate-fade-in">
            <FaExclamationTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Footer Summary & Checkout Bar */}
        <div className="px-6 py-4 bg-dark-800/90 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400">Selected Seats</span>
              <p className="text-sm font-bold text-white">
                {selectedSeats.length > 0
                  ? selectedSeats.map((s) => s.id).join(', ')
                  : 'None selected'}
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Price</span>
              <p className="text-xl font-black text-accent-gold">
                ${totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={submitting || selectedSeats.length === 0}
              className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${
                selectedSeats.length > 0 && !submitting
                  ? 'bg-accent-gold hover:bg-accent-goldHover text-dark-900 shadow-accent-gold/20 hover:scale-105'
                  : 'bg-dark-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Confirming Reservation...' : `Book ${selectedSeats.length} Ticket${selectedSeats.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatPickerModal;
