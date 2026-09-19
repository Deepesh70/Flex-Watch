import React from 'react';
import '@testing-library/jest-dom';

// Compatibility shim for Vitest
if (typeof vi !== 'undefined' && typeof jest === 'undefined') {
  globalThis.jest = vi;
}

// Mock @clerk/clerk-react globally in tests
if (typeof vi !== 'undefined') {
  vi.mock('@clerk/clerk-react', () => {
    return {
      ClerkProvider: ({ children }) => React.createElement(React.Fragment, null, children),
      SignedIn: ({ children }) => React.createElement(React.Fragment, null, children),
      SignedOut: ({ children }) => React.createElement(React.Fragment, null, children),
      SignIn: () => React.createElement('div', null, 'Sign In Component'),
      SignUp: () => React.createElement('div', null, 'Sign Up Component'),
      SignInButton: ({ children }) => React.createElement('div', null, children),
      SignUpButton: ({ children }) => React.createElement('div', null, children),
      UserButton: () => React.createElement('button', null, 'User Profile'),
      UserProfile: () => React.createElement('div', null, 'User Profile View'),
      useUser: () => ({
        user: {
          fullName: 'Alex Morgan',
          primaryEmailAddress: { emailAddress: 'alex.morgan@example.com' },
        },
        isSignedIn: true,
        isLoaded: true,
      }),
      useClerk: () => ({
        signOut: vi.fn(),
      }),
      useAuth: () => ({
        userId: 'user_123',
        sessionId: 'sess_123',
        getToken: vi.fn(() => Promise.resolve('token')),
      }),
    };
  });
}

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Mock window.scrollTo
const mockFn = typeof vi !== 'undefined' ? vi.fn : (typeof jest !== 'undefined' ? jest.fn : () => {});
window.scrollTo = mockFn();
