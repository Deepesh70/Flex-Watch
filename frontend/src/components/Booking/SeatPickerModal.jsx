import React, { useState, useEffect } from 'react';
import { FaTimes, FaFilm, FaCalendarDay, FaClock, FaCheck, FaExclamationTriangle, FaLock, FaBuilding, FaCreditCard } from 'react-icons/fa';
import bookingService from '../../services/booking.service';
import { getGuestId } from '../../services/guestAuth';

const SEAT_TIERS = {
  VIP: { rows: ['A', 'B'], price: 15.0, label: 'VIP Recliners', color: 'border-accent-gold/60 text-accent-gold' },
  PREMIUM: { rows: ['C', 'D', 'E'], price: 12.0, label: 'Premium', color: 'border-blue-400/60 text-blue-400' },
  STANDARD: { rows: ['F', 'G'], price: 10.0, label: 'Standard', color: 'border-gray-400/60 text-gray-300' },
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
  const [venues, setVenues] = useState([]);
  const [selectedTheaterId, setSelectedTheaterId] = useState(null);
  const [selectedScreenId, setSelectedScreenId] = useState(null);
  const [selectedShowId, setSelectedShowId] = useState(null);

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(2); // default 07:30 PM
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [heldByOthers, setHeldByOthers] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [holdRemainingSeconds, setHoldRemainingSeconds] = useState(null);

  const currentUserId = token || getGuestId();

  // 0. Load real theaters, screens, and shows for this movie
  useEffect(() => {
    let isMounted = true;
    const fetchVenues = async () => {
      try {
        const data = await bookingService.getMovieShows(movie.id, movie.title || movie.original_title);
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setVenues(data);
          const firstTheater = data[0];
          setSelectedTheaterId(firstTheater.theaterId);
          if (firstTheater.screens?.length > 0) {
            const firstScreen = firstTheater.screens[0];
            setSelectedScreenId(firstScreen.screenId);
            if (firstScreen.shows?.length > 0) {
              setSelectedShowId(firstScreen.shows[0].id);
            }
          }
        }
      } catch (err) {
        // Fallback gracefully to offline slots
      }
    };

    fetchVenues();
    return () => {
      isMounted = false;
    };
  }, [movie.id, movie.title, movie.original_title]);

  const currentTheater = venues.find((t) => t.theaterId === selectedTheaterId) || venues[0] || null;
  const currentScreen = currentTheater?.screens?.find((s) => s.screenId === selectedScreenId) || currentTheater?.screens?.[0] || null;
  const currentShow = currentScreen?.shows?.find((s) => s.id === selectedShowId) || currentScreen?.shows?.[0] || null;

  // Calculate selected showtime Date
  const getCalculatedShowtime = () => {
    if (currentShow?.startTime) {
      return currentShow.startTime;
    }
    const base = new Date();
    base.setDate(base.getDate() + (DATES[selectedDateIndex]?.offsetDays || 0));
    const [hours, minutes] = (TIME_SLOTS[selectedSlotIndex]?.time || '19:30').split(':').map(Number);
    base.setHours(hours, minutes, 0, 0);
    return base.toISOString();
  };

  const currentShowtimeISO = getCalculatedShowtime();
  const currentShowId = currentShow?.id || null;
  const basePrice = currentShow?.basePrice || 12.0;

  const handleSelectTheater = (theaterId) => {
    setSelectedTheaterId(theaterId);
    setSelectedSeats([]);
    const t = venues.find((v) => v.theaterId === theaterId);
    if (t?.screens?.length > 0) {
      setSelectedScreenId(t.screens[0].screenId);
      if (t.screens[0].shows?.length > 0) {
        setSelectedShowId(t.screens[0].shows[0].id);
      }
    }
  };

  const handleSelectShow = (showId) => {
    setSelectedShowId(showId);
    setSelectedSeats([]);
  };

  const formatShowtime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return isoString;
    }
  };

  // 1. Load occupied & held seats on movie or showtime change
  useEffect(() => {
    let isMounted = true;
    const loadOccupied = async () => {
      setLoadingSeats(true);
      setErrorMessage('');
      try {
        const res = await bookingService.getOccupiedAndHeldSeats(movie.id, currentShowtimeISO);
        if (isMounted) {
          const occupied = res.occupiedSeats || [];
          const held = res.heldSeats || [];
          setOccupiedSeats(occupied);

          const otherHolds = held
            .filter((h) => h.userId !== currentUserId)
            .map((h) => h.seatCode);
          setHeldByOthers(otherHolds);

          // Deselect any seats that are now occupied or held by others
          setSelectedSeats((prev) => prev.filter((s) => !occupied.includes(s.id) && !otherHolds.includes(s.id)));
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
  }, [movie.id, currentShowtimeISO, currentUserId]);

  // 2. Real-time WebSocket connection to room
  useEffect(() => {
    let ws = null;
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.port === '3000'
        ? `${window.location.hostname}:5001`
        : window.location.host;
      ws = new WebSocket(`${wsProtocol}//${wsHost}/ws/seats`);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          action: 'subscribe',
          movieId: movie.id,
          showtime: currentShowtimeISO,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'SEATS_HELD') {
            if (data.userId !== currentUserId) {
              setHeldByOthers((prev) => Array.from(new Set([...prev, ...data.seats])));
              setSelectedSeats((prev) => prev.filter((s) => !data.seats.includes(s.id)));
            }
          } else if (data.type === 'SEATS_RELEASED') {
            setHeldByOthers((prev) => prev.filter((seat) => !data.seats.includes(seat)));
            setOccupiedSeats((prev) => prev.filter((seat) => !data.seats.includes(seat)));
          } else if (data.type === 'SEATS_CONFIRMED') {
            setOccupiedSeats((prev) => Array.from(new Set([...prev, ...data.seats])));
            setHeldByOthers((prev) => prev.filter((seat) => !data.seats.includes(seat)));
            if (data.userId !== currentUserId) {
              setSelectedSeats((prev) => prev.filter((s) => !data.seats.includes(s.id)));
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      };
    } catch (e) {
      // WS fallback
    }

    return () => {
      if (ws) ws.close();
    };
  }, [movie.id, currentShowtimeISO, currentUserId]);

  // 3. Countdown timer for temporary 10-minute hold
  useEffect(() => {
    if (selectedSeats.length === 0 || !holdExpiresAt) {
      setHoldRemainingSeconds(null);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((holdExpiresAt - Date.now()) / 1000));
      setHoldRemainingSeconds(remaining);

      if (remaining <= 0) {
        setErrorMessage('Your 10-minute seat hold has expired. Please reselect your seats.');
        setSelectedSeats([]);
        setHoldExpiresAt(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSeats.length, holdExpiresAt]);

  const getSeatTier = (rowLetter) => {
    if (SEAT_TIERS.VIP.rows.includes(rowLetter)) {
      return { ...SEAT_TIERS.VIP, price: Number((basePrice * 1.25).toFixed(2)) };
    }
    if (SEAT_TIERS.PREMIUM.rows.includes(rowLetter)) {
      return { ...SEAT_TIERS.PREMIUM, price: Number(basePrice.toFixed(2)) };
    }
    return { ...SEAT_TIERS.STANDARD, price: Number((basePrice * 0.85).toFixed(2)) };
  };

  const handleSeatClick = async (seatId, tier) => {
    setErrorMessage('');
    const exists = selectedSeats.some((s) => s.id === seatId);

    if (exists) {
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
      try {
        await bookingService.releaseSeats({
          movieId: movie.id,
          showtime: currentShowtimeISO,
          showId: currentShowId,
          seats: [seatId],
        }, token);
      } catch (err) {
        // non-blocking
      }
    } else {
      if (selectedSeats.length >= 8) {
        setErrorMessage('You can select a maximum of 8 seats per booking.');
        return;
      }

      try {
        const holdRes = await bookingService.holdSeats({
          movieId: movie.id,
          showtime: currentShowtimeISO,
          showId: currentShowId,
          seats: [seatId],
        }, token);

        if (holdRes?.success) {
          setSelectedSeats((prev) => [...prev, { id: seatId, price: tier.price }]);
          setHoldExpiresAt(Date.now() + 600 * 1000);
        }
      } catch (err) {
        if (err.response?.status === 409) {
          setErrorMessage(err.response.data?.detail || 'This seat is currently held by another customer.');
          setHeldByOthers((prev) => Array.from(new Set([...prev, seatId])));
        } else {
          // Graceful fallback if running offline
          setSelectedSeats((prev) => [...prev, { id: seatId, price: tier.price }]);
        }
      }
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
        showId: currentShowId,
        seats: selectedSeats.map((s) => s.id),
        totalAmount,
        status: 'PENDING_PAYMENT',
      };

      const booking = await bookingService.createBooking(payload, token);

      // Create Stripe or sandbox checkout session
      const checkoutRes = await bookingService.createCheckoutSession({
        bookingId: booking.id,
        successUrl: `${window.location.origin}/booking/success`,
        cancelUrl: `${window.location.origin}/booking/cancel`,
      }, token);

      if (checkoutRes && !checkoutRes.isMock && checkoutRes.checkoutUrl) {
        window.location.href = checkoutRes.checkoutUrl;
        return;
      }

      // Sandbox simulated checkout: auto-confirm session and present ticket
      const confirmedRes = await bookingService.confirmPaymentSession({
        bookingId: booking.id,
        sessionId: checkoutRes?.sessionId,
      }, token);

      setSubmitting(false);
      onBookingSuccess(confirmedRes?.booking || booking);
    } catch (err) {
      setSubmitting(false);
      if (err.response?.status === 409) {
        setErrorMessage(
          err.response.data?.detail || 'One or more of your chosen seats was just reserved by another user. Please choose another seat.'
        );
        // Refresh occupied and held seats
        const refreshed = await bookingService.getOccupiedAndHeldSeats(movie.id, currentShowtimeISO);
        const otherHolds = (refreshed.heldSeats || [])
          .filter((h) => h.userId !== currentUserId)
          .map((h) => h.seatCode);
        setHeldByOthers(otherHolds);
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
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-accent-gold">
                Cinema Seat Selection
              </span>
              {holdRemainingSeconds !== null && holdRemainingSeconds > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold animate-pulse">
                  <FaClock className="w-3 h-3" />
                  <span>Hold: {Math.floor(holdRemainingSeconds / 60)}:{(holdRemainingSeconds % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black text-white truncate max-w-xs sm:max-w-md">
                {movie.title || movie.original_title}
              </h3>
              {currentTheater && currentScreen && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[11px] font-bold">
                  {currentTheater.name} • {currentScreen.format}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Showtime, Cinema & Date Pickers */}
        {venues.length > 0 ? (
          <div className="px-6 py-3.5 bg-dark-800/40 border-b border-white/5 space-y-3">
            {/* Cinema Venues */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 shrink-0">
                <FaBuilding className="text-accent-gold" /> Cinema:
              </span>
              <div className="flex gap-2">
                {venues.map((theater) => (
                  <button
                    key={theater.theaterId}
                    onClick={() => handleSelectTheater(theater.theaterId)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                      currentTheater?.theaterId === theater.theaterId
                        ? 'bg-accent-gold text-dark-900 shadow-md shadow-accent-gold/20'
                        : 'bg-dark-700/80 text-gray-300 hover:text-white hover:bg-dark-600'
                    }`}
                  >
                    <span>{theater.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      currentTheater?.theaterId === theater.theaterId ? 'bg-dark-900/20 text-dark-900 font-extrabold' : 'bg-white/10 text-gray-400'
                    }`}>
                      {theater.city}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Screen Formats and Showtimes */}
            {currentTheater && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                {/* Screens */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <FaFilm className="text-accent-gold" /> Screen:
                  </span>
                  <div className="flex gap-1.5">
                    {currentTheater.screens?.map((screen) => (
                      <button
                        key={screen.screenId}
                        onClick={() => {
                          setSelectedScreenId(screen.screenId);
                          setSelectedSeats([]);
                          if (screen.shows?.length > 0) {
                            setSelectedShowId(screen.shows[0].id);
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                          currentScreen?.screenId === screen.screenId
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-dark-700/60 text-gray-300 hover:text-white hover:bg-dark-600'
                        }`}
                      >
                        {screen.name} ({screen.format})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Showtimes for current screen */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <FaClock className="text-accent-gold" /> Showtime:
                  </span>
                  <div className="flex gap-1.5">
                    {currentScreen?.shows?.map((show) => (
                      <button
                        key={show.id}
                        onClick={() => handleSelectShow(show.id)}
                        className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                          currentShow?.id === show.id
                            ? 'bg-accent-gold text-dark-900 shadow-md shadow-accent-gold/20'
                            : 'bg-dark-700/60 text-gray-300 hover:text-white hover:bg-dark-600'
                        }`}
                      >
                        {formatShowtime(show.startTime)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
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
        )}

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
                      const isHeldByOther = heldByOthers.includes(seatId);
                      const isSelected = selectedSeats.some((s) => s.id === seatId);

                      return (
                        <button
                          key={seatId}
                          disabled={isOccupied || isHeldByOther}
                          onClick={() => handleSeatClick(seatId, tier)}
                          title={isHeldByOther ? `${seatId} (Held by another customer)` : `${seatId} (${tier.label})`}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-t-lg rounded-b text-[11px] font-bold transition-all flex items-center justify-center relative ${
                            isOccupied
                              ? 'bg-dark-800 text-gray-600 border border-white/5 cursor-not-allowed opacity-40'
                              : isHeldByOther
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 cursor-not-allowed animate-pulse shadow-sm'
                              : isSelected
                              ? 'bg-accent-gold text-dark-900 border border-accent-gold shadow-lg shadow-accent-gold/30 scale-105'
                              : 'bg-dark-800/90 text-gray-300 border border-white/10 hover:border-accent-gold/60 hover:text-white hover:scale-105'
                          }`}
                        >
                          {isSelected ? <FaCheck className="w-3 h-3" /> : isHeldByOther ? <FaLock className="w-2.5 h-2.5 text-amber-400" /> : num}
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
                      const isHeldByOther = heldByOthers.includes(seatId);
                      const isSelected = selectedSeats.some((s) => s.id === seatId);

                      return (
                        <button
                          key={seatId}
                          disabled={isOccupied || isHeldByOther}
                          onClick={() => handleSeatClick(seatId, tier)}
                          title={isHeldByOther ? `${seatId} (Held by another customer)` : `${seatId} (${tier.label})`}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-t-lg rounded-b text-[11px] font-bold transition-all flex items-center justify-center relative ${
                            isOccupied
                              ? 'bg-dark-800 text-gray-600 border border-white/5 cursor-not-allowed opacity-40'
                              : isHeldByOther
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 cursor-not-allowed animate-pulse shadow-sm'
                              : isSelected
                              ? 'bg-accent-gold text-dark-900 border border-accent-gold shadow-lg shadow-accent-gold/30 scale-105'
                              : 'bg-dark-800/90 text-gray-300 border border-white/10 hover:border-accent-gold/60 hover:text-white hover:scale-105'
                          }`}
                        >
                          {isSelected ? <FaCheck className="w-3 h-3" /> : isHeldByOther ? <FaLock className="w-2.5 h-2.5 text-amber-400" /> : num}
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
              <div className="w-4 h-4 rounded-t bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                <FaLock className="w-2 h-2 text-amber-400" />
              </div>
              <span className="text-amber-400 font-semibold">Held (10m)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-t bg-dark-800 border border-white/5 opacity-40" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-white/10">
              <span className="text-accent-gold font-bold">Rows A-B:</span> VIP (${(basePrice * 1.25).toFixed(2)})
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold">Rows C-E:</span> Premium (${basePrice.toFixed(2)})
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold">Rows F-G:</span> Standard (${(basePrice * 0.85).toFixed(2)})
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
              {currentTheater && (
                <span className="text-[10px] text-gray-400 block -mt-0.5 truncate max-w-[160px]">
                  {currentTheater.name} • {currentScreen?.format || 'Standard'}
                </span>
              )}
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
              <FaCreditCard className="w-3.5 h-3.5" />
              <span>
                {submitting
                  ? 'Processing Checkout...'
                  : `Pay & Book ${selectedSeats.length} Ticket${selectedSeats.length > 1 ? 's' : ''} ($${totalAmount.toFixed(2)})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatPickerModal;
