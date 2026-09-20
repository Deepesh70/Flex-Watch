import React, { useContext } from 'react';
import Footer from '../components/Footer/Footer';
import { MovieContext } from '../components/context/Movies.context';
import { TrailerModal } from '../components/common/MovieModal';

/**
 * Unified application layout providing header slot, main container, footer,
 * and global trailer modal viewer.
 */
export const BaseLayout = ({ navbar, mainClassName = '', children }) => {
  const { activeTrailer, closeTrailer } = useContext(MovieContext);

  return (
    <div className="bg-dark-900 text-gray-100 min-h-screen flex flex-col justify-between selection:bg-accent-gold selection:text-dark-900">
      {navbar}
      <main className={`flex-grow ${mainClassName}`}>
        {children}
      </main>
      <Footer />

      {/* Global Trailer Modal */}
      <TrailerModal
        isOpen={Boolean(activeTrailer)}
        onClose={closeTrailer}
        activeTrailer={activeTrailer}
      />
    </div>
  );
};

export default BaseLayout;
