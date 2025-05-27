
import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegistrationPage from './RegistrationPage';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode, to: string }) => <a href={to}>{children}</a>,
}));

// Mock AuthContext
const mockSignUp = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  ...jest.requireActual('@/contexts/AuthContext'),
  useAuth: () => ({
    signUp: mockSignUp,
  }),
}));

describe('RegistrationPage', () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockNavigate.mockClear();
    mockSignUp.mockClear();
  });

  test('navigates to /profile on successful registration', async () => {
    mockSignUp.mockResolvedValueOnce(undefined); // Simulate successful sign up

    render(
      <BrowserRouter>
        <AuthProvider>
          <RegistrationPage />
        </AuthProvider>
      </BrowserRouter>
    );

    // Fill out the form
    await userEvent.type(screen.getByLabelText(/Display Name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'password123'); // Exact match for Password
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'password123');
    await userEvent.click(screen.getByLabelText(/I agree to the AAYRA/i));

    // Submit the form
    // Use userEvent.click for better simulation of user interaction
    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    // Wait for navigation
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1);
    });
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  test('shows "Invalid email address" for invalid email format', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegistrationPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    const displayNameInput = screen.getByLabelText(/Display Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i); // Exact match
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the AAYRA/i);

    // Fill all fields with valid data first
    await userEvent.type(displayNameInput, 'Test User');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(termsCheckbox);
    
    // Now, input an invalid email
    await userEvent.type(emailInput, 'invalid-email');
    
    // Submit the form
    await userEvent.click(submitButton);
    
    // Now, input an invalid email
    await userEvent.type(emailInput, 'invalid-email'); 
    
    await userEvent.click(submitButton);

    // Check for the "Invalid email address" message
    const errorMessage = await screen.findByText('Invalid email address');
    expect(errorMessage).toBeInTheDocument();

    // Check that other error messages are not present
    expect(screen.queryByText('Display name is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument(); // Should not be "Email is required"
    expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
    expect(screen.queryByText('You must agree to the Terms of Service')).not.toBeInTheDocument();
  });

  // Add more specific tests for other validation rules as needed, for example:
  test('shows required field errors when form is submitted empty', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegistrationPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText('Display name is required')).toBeInTheDocument();
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
    expect(await screen.findByText('You must agree to the Terms of Service')).toBeInTheDocument();
  });

  test('shows "Password must be at least 8 characters" error', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegistrationPage />
        </AuthProvider>
      </BrowserRouter>
    );
    await userEvent.type(screen.getByLabelText(/Display Name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'short');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'short');
    await userEvent.click(screen.getByLabelText(/I agree to the AAYRA/i));
    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  test('shows "Passwords do not match" error', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegistrationPage />
        </AuthProvider>
      </BrowserRouter>
    );
    await userEvent.type(screen.getByLabelText(/Display Name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'password456');
    await userEvent.click(screen.getByLabelText(/I agree to the AAYRA/i));
    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  test('shows error message on registration failure', async () => {
    const errorMessage = 'Firebase error: Test registration failed';
    mockSignUp.mockRejectedValueOnce({ message: errorMessage });

    render(
      <BrowserRouter>
        <AuthProvider>
          <RegistrationPage />
        </AuthProvider>
      </BrowserRouter>
    );

    await userEvent.type(screen.getByLabelText(/Display Name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'password123');
    await userEvent.click(screen.getByLabelText(/I agree to the AAYRA/i));

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
