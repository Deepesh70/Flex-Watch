import React, { useState, useContext } from 'react';
import DefaultlayoutHOC from '../layouts/Default.layout';
import { MovieContext } from '../components/context/Movies.context';
import Poster from '../components/poster/Poster.component';
import {
  SignedIn,
  SignedOut,
  SignIn,
  UserButton,
  useUser,
  useClerk,
} from '@clerk/clerk-react';
import {
  FaUserCircle,
  FaBookmark,
  FaCog,
  FaTv,
  FaSignOutAlt,
  FaCheckCircle,
  FaInfoCircle,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

import { CLERK_PUBLISHABLE_KEY as CLERK_KEY } from '../config/env';

// Internal Profile Content View
const ProfileContent = ({ user, isClerk = false, onSignOut }) => {
  const { myList } = useContext(MovieContext);
  const [activeTab, setActiveTab] = useState('watchlist'); // 'watchlist' | 'settings'
  const [qualitySetting, setQualitySetting] = useState('4k');
  const [notifications, setNotifications] = useState(true);

  const userName =
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    'Alex Morgan';

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    'alex.morgan@example.com';

  const userAvatar = user?.imageUrl;

  return (
    <div className="space-y-8">
      {/* Profile Header Card */}
      <div className="bg-dark-800/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-dark-700 border-2 border-accent-gold shadow-lg flex items-center justify-center">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUserCircle className="w-16 h-16 text-accent-gold" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-2xl sm:text-3xl font-black text-white">{userName}</h2>
                <span className="bg-accent-gold/20 text-accent-gold border border-accent-gold/40 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Member
                </span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">{userEmail}</p>
              <p className="text-gray-500 text-xs mt-1">
                Authenticated via Clerk Authentication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isClerk ? (
              <div className="bg-dark-700 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span className="text-xs text-gray-300 font-medium">Manage Account</span>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all border border-white/10"
              >
                <FaSignOutAlt className="w-3.5 h-3.5 text-accent-red" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5 text-center">
          <div className="bg-dark-700/50 p-3 rounded-2xl border border-white/5">
            <span className="text-xs text-gray-400">Saved in Watchlist</span>
            <p className="text-xl font-bold text-accent-gold mt-0.5">{myList?.length || 0}</p>
          </div>
          <div className="bg-dark-700/50 p-3 rounded-2xl border border-white/5">
            <span className="text-xs text-gray-400">Streaming Quality</span>
            <p className="text-xl font-bold text-white mt-0.5">4K Ultra HD</p>
          </div>
          <div className="bg-dark-700/50 p-3 rounded-2xl border border-white/5">
            <span className="text-xs text-gray-400">Account Status</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">Active</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'watchlist'
              ? 'bg-accent-gold text-dark-900 shadow-md shadow-accent-gold/20'
              : 'text-gray-400 hover:text-white bg-dark-800'
          }`}
        >
          <FaBookmark className="w-3.5 h-3.5" />
          <span>My Watchlist ({myList?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-accent-gold text-dark-900 shadow-md shadow-accent-gold/20'
              : 'text-gray-400 hover:text-white bg-dark-800'
          }`}
        >
          <FaCog className="w-3.5 h-3.5" />
          <span>Preferences & Settings</span>
        </button>
      </div>

      {/* Tab 1: Watchlist */}
      {activeTab === 'watchlist' && (
        <div className="animate-fade-in">
          {myList && myList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {myList.map((movie) => (
                <Poster {...movie} key={movie.id} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-dark-800/40 rounded-3xl border border-white/5 p-8">
              <FaBookmark className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Your Watchlist is empty</h3>
              <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto mb-6">
                Explore our TMDB movie catalog and click the bookmark button on any movie card to save titles.
              </p>
              <Link
                to="/movies"
                className="inline-flex items-center gap-2 bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md"
              >
                Browse Movies
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-dark-800/80 rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <FaTv className="text-accent-gold w-4 h-4" />
              Playback & Video Quality
            </h3>
            <p className="text-gray-400 text-xs">
              Configure default video streaming resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: '4k', label: '4K Ultra HD', desc: 'Highest resolution stream' },
              { id: '1080p', label: 'Full HD 1080p', desc: 'Standard HD stream' },
              { id: 'auto', label: 'Auto (Adaptive)', desc: 'Adjusts based on connection' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setQualitySetting(item.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  qualitySetting === item.id
                    ? 'bg-accent-gold/15 border-accent-gold text-white font-semibold'
                    : 'bg-dark-700 border-white/5 text-gray-300 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">{item.label}</span>
                  {qualitySetting === item.id && (
                    <FaCheckCircle className="text-accent-gold w-3.5 h-3.5" />
                  )}
                </div>
                <p className="text-[11px] text-gray-400">{item.desc}</p>
              </button>
            ))}
          </div>

          <div className="border-t border-white/5 pt-6 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Email Notifications & Recommendations</h4>
              <p className="text-gray-400 text-xs">
                Receive alerts when new movies matching your favorite genres are released.
              </p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                notifications ? 'bg-accent-gold' : 'bg-dark-600'
              }`}
            >
              <div
                className={`bg-dark-900 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  notifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Page with Clerk Auth Handling
const ProfilePage = () => {
  const [demoLoggedIn, setDemoLoggedIn] = useState(true);

  // If Clerk Publishable Key is provided, use Clerk Auth flow
  if (CLERK_KEY && CLERK_KEY.startsWith('pk_')) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SignedIn>
          <ClerkUserProfileWrapper />
        </SignedIn>

        <SignedOut>
          <div className="max-w-md mx-auto py-12">
            <div className="text-center mb-8">
              <span className="bg-accent-gold text-dark-900 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                Authentication
              </span>
              <h1 className="text-3xl font-black text-white">Sign In to FlexWatch</h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Access your personalized movie watchlist
              </p>
            </div>
            <div className="flex justify-center">
              <SignIn routing="hash" />
            </div>
          </div>
        </SignedOut>
      </div>
    );
  }

  // Fallback mode when Clerk key is not set yet in .env
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Clerk Info Alert */}
      <div className="mb-6 bg-accent-gold/10 border border-accent-gold/30 rounded-2xl p-4 flex items-center gap-3 text-xs sm:text-sm text-gray-200">
        <FaInfoCircle className="text-accent-gold w-5 h-5 flex-shrink-0" />
        <div>
          <span className="text-accent-gold font-bold">Clerk Authentication Not Enabled: </span>
          <span>
            To connect your live Clerk project, set{' '}
            <code className="bg-black/40 px-1.5 py-0.5 rounded text-accent-gold font-mono">
              REACT_APP_CLERK_PUBLISHABLE_KEY
            </code>{' '}
            in your <code className="bg-black/40 px-1.5 py-0.5 rounded text-white font-mono">.env</code> file.
          </span>
        </div>
      </div>

      {demoLoggedIn ? (
        <ProfileContent
          user={{
            fullName: 'Alex Morgan',
            primaryEmailAddress: { emailAddress: 'alex.morgan@example.com' },
          }}
          isClerk={false}
          onSignOut={() => setDemoLoggedIn(false)}
        />
      ) : (
        <div className="max-w-md mx-auto py-16 text-center bg-dark-800/80 rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="w-16 h-16 bg-accent-gold/20 text-accent-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUserCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Welcome to FlexWatch</h2>
          <p className="text-gray-400 text-xs sm:text-sm mb-6">
            Sign in to sync your watchlist and manage your profile.
          </p>
          <button
            onClick={() => setDemoLoggedIn(true)}
            className="w-full bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-bold py-3 rounded-xl transition-all shadow-lg shadow-accent-gold/20"
          >
            Sign In with Clerk Demo
          </button>
        </div>
      )}
    </div>
  );
};

// Sub-component using Clerk useUser hook safely when signed in
const ClerkUserProfileWrapper = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  return <ProfileContent user={user} isClerk={true} onSignOut={() => signOut()} />;
};

export default DefaultlayoutHOC(ProfilePage);
