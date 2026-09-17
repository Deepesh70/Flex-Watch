import '@testing-library/jest-dom';

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Mock window.scrollTo
window.scrollTo = jest.fn();
