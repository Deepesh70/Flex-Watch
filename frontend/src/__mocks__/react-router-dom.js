const React = require('react');

const Link = ({ to, children, ...props }) => (
  React.createElement('a', { href: to, ...props }, children)
);

const useParams = () => ({ id: '101' });
const useLocation = () => ({ pathname: '/' });
const useNavigate = () => jest.fn();

const BrowserRouter = ({ children }) => React.createElement(React.Fragment, null, children);
const Routes = ({ children }) => React.createElement(React.Fragment, null, children);
const Route = ({ element }) => element || null;
const Navigate = () => null;

module.exports = {
  Link,
  useParams,
  useLocation,
  useNavigate,
  BrowserRouter,
  Routes,
  Route,
  Navigate,
};
