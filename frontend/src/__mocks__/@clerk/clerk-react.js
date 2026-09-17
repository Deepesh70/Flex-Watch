const React = require('react');

const ClerkProvider = ({ children }) => React.createElement(React.Fragment, null, children);
const SignedIn = ({ children }) => React.createElement(React.Fragment, null, children);
const SignedOut = ({ children }) => React.createElement(React.Fragment, null, children);
const SignIn = () => React.createElement('div', null, 'Sign In Component');
const SignUp = () => React.createElement('div', null, 'Sign Up Component');
const SignInButton = ({ children }) => React.createElement('div', null, children);
const SignUpButton = ({ children }) => React.createElement('div', null, children);
const UserButton = () => React.createElement('button', null, 'User Profile');
const UserProfile = () => React.createElement('div', null, 'User Profile View');

const useUser = () => ({
  user: {
    fullName: 'Alex Morgan',
    primaryEmailAddress: { emailAddress: 'alex.morgan@example.com' },
  },
  isSignedIn: true,
  isLoaded: true,
});

const useClerk = () => ({
  signOut: jest.fn(),
});

const useAuth = () => ({
  userId: 'user_123',
  sessionId: 'sess_123',
  getToken: jest.fn(() => Promise.resolve('token')),
});

module.exports = {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
  SignInButton,
  SignUpButton,
  UserButton,
  UserProfile,
  useUser,
  useClerk,
  useAuth,
};
