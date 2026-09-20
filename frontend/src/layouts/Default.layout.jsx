import React from 'react';
import Navbar from '../components/Navbar/Navbar.component';
import BaseLayout from './BaseLayout';

export const DefaultLayout = ({ children }) => (
  <BaseLayout navbar={<Navbar />}>{children}</BaseLayout>
);

const DefaultlayoutHOC = (Component) => {
  const WithDefaultLayout = (props) => (
    <DefaultLayout>
      <Component {...props} />
    </DefaultLayout>
  );
  return WithDefaultLayout;
};

export default DefaultlayoutHOC;