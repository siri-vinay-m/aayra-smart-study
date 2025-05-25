import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BottomTaskBar from './BottomTaskBar';
import { UserContext } from '@/contexts/UserContext';
import { vi } from 'vitest'; // Assuming Vitest, as per example suggestion. Use 'jest-mock' for Jest

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  // Import actual to ensure other exports like <Link> or <Outlet> still work if needed elsewhere
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }), // Default mock location
  };
});

describe('BottomTaskBar', () => {
  const mockUserContextValue = {
    user: null,
    login: async () => {},
    logout: async () => {},
    loading: false,
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

    // Attempt to find the button. The icon might provide an accessible name,
    // or this selector might need adjustment (e.g., adding aria-label to the button).
    const homeButton = screen.getByRole('button', { name: /home/i });
    fireEvent.click(homeButton);
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('should navigate to /home when home button is clicked (unauthenticated)', () => {
    render(
      <UserContext.Provider value={{ ...mockUserContextValue, isAuthenticated: false }}>
        <BottomTaskBar />
      </UserContext.Provider>
    );

    const homeButton = screen.getByRole('button', { name: /home/i });
    fireEvent.click(homeButton);
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  // Test for the favorites button
  it('should navigate to /favorites when favorites button is clicked', () => {
    render(
      <UserContext.Provider value={{ ...mockUserContextValue, isAuthenticated: true }}>
        <BottomTaskBar />
      </UserContext.Provider>
    );

    // Assuming the favorites button might be identifiable by a name "favorites" or similar
    // This selector will likely also need an aria-label on the button component for robustness
    const favoritesButton = screen.getByRole('button', { name: /heart/i }); // Lucide icon name is Heart
    fireEvent.click(favoritesButton);
    expect(mockNavigate).toHaveBeenCalledWith('/favorites');
  });

  // Test for the back button functionality (non-exit case)
  it('should navigate back when back button is clicked and not on /home', () => {
    // Mock useLocation to return a different path
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue({ pathname: '/some-other-page' });

    render(
      <UserContext.Provider value={{ ...mockUserContextValue, isAuthenticated: true }}>
        <BottomTaskBar />
      </UserContext.Provider>
    );
    
    const backButton = screen.getByRole('button', { name: /arrowleft/i }); // Lucide icon name is ArrowLeft
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);

    // Restore original mock for other tests
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue({ pathname: '/' });
  });

  // Test for the back button functionality (exit case on /home)
  it('should show confirm dialog when back button is clicked on /home', () => {
    // Mock useLocation to return /home
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue({ pathname: '/home' });
    
    // Mock window.confirm
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(
      <UserContext.Provider value={{ ...mockUserContextValue, isAuthenticated: true }}>
        <BottomTaskBar />
      </UserContext.Provider>
    );
    
    const backButton = screen.getByRole('button', { name: /arrowleft/i });
    fireEvent.click(backButton);
    
    expect(mockConfirm).toHaveBeenCalledWith('Do you want to exit?');
    // We can also check if navigate was NOT called to exit, as it's just a console.log
    expect(mockNavigate).not.toHaveBeenCalledWith(-1); 

    mockConfirm.mockRestore(); // Clean up spy
    // Restore original mock for other tests
    vi.mocked(require('react-router-dom').useLocation).mockReturnValue({ pathname: '/' });
  });
});
