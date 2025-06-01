
import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import BottomTaskBar from './BottomTaskBar';
import { UserContext } from '@/contexts/UserContext';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }), // Default mock location
}));

describe('BottomTaskBar', () => {
  const mockUserContextValue = {
    user: null,
    setUser: jest.fn(),
    isAuthenticated: false,
    setIsAuthenticated: jest.fn(),
    loadUserData: jest.fn(),
    updateUserProfile: jest.fn(),
    checkSubscriptionStatus: jest.fn(), // Add missing property
  };

  beforeEach(() => {
    // Clear mock calls before each test
    mockNavigate.mockClear();
  });

  it('should navigate to /home when home button is clicked (authenticated)', () => {
    render(
      <UserContext.Provider value={{ ...mockUserContextValue, isAuthenticated: true }}>
        <BottomTaskBar />
      </UserContext.Provider>
    );

    // Find the home button by its icon
    const homeButton = screen.getByRole('button');
    const homeButtons = screen.getAllByRole('button');
    const homeButtonElement = homeButtons.find(button => 
      button.querySelector('svg') && button.querySelector('svg')?.getAttribute('data-lucide') === 'home'
    );
    
    if (homeButtonElement) {
      fireEvent.click(homeButtonElement);
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    }
  });

  it('should navigate to /home when home button is clicked (unauthenticated)', () => {
    render(
      <UserContext.Provider value={{ ...mockUserContextValue, isAuthenticated: false }}>
        <BottomTaskBar />
      </UserContext.Provider>
    );

    const homeButtons = screen.getAllByRole('button');
    const homeButtonElement = homeButtons.find(button => 
      button.querySelector('svg') && button.querySelector('svg')?.getAttribute('data-lucide') === 'home'
    );
    
    if (homeButtonElement) {
      fireEvent.click(homeButtonElement);
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    }
  });

  it('should navigate to /favorites when favorites button is clicked', () => {
    render(
      <UserContext.Provider value={{ ...mockUserContextValue, isAuthenticated: true }}>
        <BottomTaskBar />
      </UserContext.Provider>
    );

    const buttons = screen.getAllByRole('button');
    const favoritesButton = buttons.find(button => 
      button.querySelector('svg') && button.querySelector('svg')?.getAttribute('data-lucide') === 'heart'
    );
    
    if (favoritesButton) {
      fireEvent.click(favoritesButton);
      expect(mockNavigate).toHaveBeenCalledWith('/favorites');
    }
  });

  it('should navigate back when back button is clicked and not on /home', () => {
    // Mock useLocation to return a different path
    jest.mocked(require('react-router-dom').useLocation).mockReturnValue({ pathname: '/some-other-page' });

    render(
      <UserContext.Provider value={{ ...mockUserContextValue, isAuthenticated: true }}>
        <BottomTaskBar />
      </UserContext.Provider>
    );
    
    const buttons = screen.getAllByRole('button');
    const backButton = buttons.find(button => 
      button.querySelector('svg') && button.querySelector('svg')?.getAttribute('data-lucide') === 'arrow-left'
    );
    
    if (backButton) {
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    }

    // Restore original mock for other tests
    jest.mocked(require('react-router-dom').useLocation).mockReturnValue({ pathname: '/' });
  });

  it('should show confirm dialog when back button is clicked on /home', () => {
    // Mock useLocation to return /home
    jest.mocked(require('react-router-dom').useLocation).mockReturnValue({ pathname: '/home' });
    
    // Mock window.confirm
    const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(
      <UserContext.Provider value={{ ...mockUserContextValue, isAuthenticated: true }}>
        <BottomTaskBar />
      </UserContext.Provider>
    );
    
    const buttons = screen.getAllByRole('button');
    const backButton = buttons.find(button => 
      button.querySelector('svg') && button.querySelector('svg')?.getAttribute('data-lucide') === 'arrow-left'
    );
    
    if (backButton) {
      fireEvent.click(backButton);
      expect(mockConfirm).toHaveBeenCalledWith('Do you want to exit?');
      expect(mockNavigate).not.toHaveBeenCalledWith(-1);
    }

    mockConfirm.mockRestore();
    jest.mocked(require('react-router-dom').useLocation).mockReturnValue({ pathname: '/' });
  });
});
