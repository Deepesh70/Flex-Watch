/**
 * Guest Identity Manager
 * Ensures each unauthenticated/guest session has a stable UUID in localStorage,
 * allowing watchlist items and user states to persist seamlessly in the backend database.
 */

const GUEST_STORAGE_KEY = 'flexwatch_guest_id';

export function getGuestId() {
  try {
    let guestId = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!guestId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        guestId = `guest_${crypto.randomUUID()}`;
      } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const randArray = new Uint32Array(2);
        crypto.getRandomValues(randArray);
        guestId = `guest_${randArray[0].toString(36)}${randArray[1].toString(36)}_${Date.now()}`;
      } else {
        guestId = `guest_anon_${Date.now()}`;
      }
      localStorage.setItem(GUEST_STORAGE_KEY, guestId);
    }
    return guestId;
  } catch (err) {
    console.warn('LocalStorage unavailable for guest ID, using ephemeral ID', err);
    return 'guest_ephemeral_user';
  }
}

export default getGuestId;
