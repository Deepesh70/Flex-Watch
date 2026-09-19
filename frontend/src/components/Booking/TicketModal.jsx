import React from 'react';
import { FaCheckCircle, FaPrint, FaTimes, FaFilm, FaCalendarAlt, FaClock, FaChair } from 'react-icons/fa';

const TicketModal = ({ booking, onClose }) => {
  if (!booking) return null;

  const showtimeDate = new Date(booking.showtime);
  const formattedDate = showtimeDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = showtimeDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const seatsList = Array.isArray(booking.seats)
    ? booking.seats
    : (booking.seats || '').split(',').map((s) => s.trim());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-dark-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-800/80">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Booking Confirmed!</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Cinematic Ticket Body */}
        <div className="p-6">
          <div className="relative bg-gradient-to-b from-dark-800 to-dark-700 rounded-2xl border border-accent-gold/30 p-6 shadow-xl overflow-hidden">
            {/* Ambient Gold Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/10 rounded-full blur-2xl pointer-events-none" />

            {/* Top Row: Cinema Info & Status */}
            <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-accent-gold px-2 py-0.5 rounded-full bg-accent-gold/10 border border-accent-gold/30">
                  IMAX • Dolby Atmos
                </span>
                <h4 className="text-xl font-black text-white mt-1">
                  {booking.movieTitle}
                </h4>
                <p className="text-xs text-gray-400">FlexWatch Cinema • Screen 4</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-gray-400">Ref Code</span>
                <p className="text-xs font-mono font-extrabold text-accent-gold">
                  {booking.id ? `FLX-${booking.id.slice(-6).toUpperCase()}` : 'FLX-CONFIRMED'}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <FaCalendarAlt className="w-3.5 h-3.5 text-accent-gold" />
                  <span>Date</span>
                </div>
                <p className="text-white font-bold">{formattedDate}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <FaClock className="w-3.5 h-3.5 text-accent-gold" />
                  <span>Showtime</span>
                </div>
                <p className="text-white font-bold">{formattedTime}</p>
              </div>

              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <FaChair className="w-3.5 h-3.5 text-accent-gold" />
                  <span>Reserved Seats ({seatsList.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {seatsList.map((seat) => (
                    <span
                      key={seat}
                      className="bg-dark-900 border border-accent-gold/40 text-accent-gold font-mono font-bold px-2.5 py-1 rounded-lg text-xs"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Perforated divider line with cutouts */}
            <div className="relative -mx-6 my-4 border-t-2 border-dashed border-white/20">
              <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-dark-900 border-r border-white/10" />
              <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-dark-900 border-l border-white/10" />
            </div>

            {/* Total Paid & Barcode Section */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">Total Paid</span>
                <p className="text-2xl font-black text-white">
                  ${Number(booking.totalAmount || 0).toFixed(2)}
                </p>
              </div>

              {/* Barcode Graphic */}
              <div className="flex flex-col items-end">
                <div className="flex gap-1 items-center h-8 bg-white/90 px-3 py-1 rounded">
                  <div className="w-1 h-full bg-dark-900" />
                  <div className="w-0.5 h-full bg-dark-900" />
                  <div className="w-2 h-full bg-dark-900" />
                  <div className="w-0.5 h-full bg-dark-900" />
                  <div className="w-1.5 h-full bg-dark-900" />
                  <div className="w-0.5 h-full bg-dark-900" />
                  <div className="w-1 h-full bg-dark-900" />
                  <div className="w-2 h-full bg-dark-900" />
                  <div className="w-1 h-full bg-dark-900" />
                </div>
                <span className="text-[9px] font-mono text-gray-400 mt-1">E-TICKET VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-dark-800 hover:bg-dark-700 text-white font-bold py-3 rounded-xl border border-white/10 transition-colors text-sm shadow-md"
            >
              <FaPrint className="w-4 h-4 text-accent-gold" />
              <span>Print / Save Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-extrabold py-3 rounded-xl transition-all text-sm shadow-lg shadow-accent-gold/20"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
