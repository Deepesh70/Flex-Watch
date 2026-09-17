import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/common/ErrorBoundary';

const ProblemChild = () => {
  throw new Error('Test crash');
};

const NormalChild = () => <div>Normal Content</div>;

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <NormalChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  test('renders recovery fallback when child crashes', () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Return to Home')).toBeInTheDocument();
  });
});
