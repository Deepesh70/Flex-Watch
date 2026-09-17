import React, { useContext } from 'react';
import Navbar from '../components/Navbar/Navbar.component';
import Footer from '../components/Footer/Footer';
import { MovieContext } from '../components/context/Movies.context';
import { TrailerModal } from '../components/common/MovieModal';

const DefaultlayoutHOC = (Component) => {
  const WithDefaultLayout = (props) => {
    const { activeTrailer, closeTrailer } = useContext(MovieContext);

    return (
      <div className="bg-dark-900 text-gray-100 min-h-screen flex flex-col justify-between selection:bg-accent-gold selection:text-dark-900">
        <Navbar />
        <main className="flex-grow">
          <Component {...props} />
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

  return WithDefaultLayout;
};

export default DefaultlayoutHOC;