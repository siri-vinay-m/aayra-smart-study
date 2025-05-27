
import React from 'react';
import { render, act } from '@testing-library/react';
import { waitFor, fireEvent } from '@testing-library/dom';
import { UserProvider, useUser, User } from './UserContext';
import { AuthContext } from './AuthContext'; // To mock AuthContext values
import { supabase } from '@/integrations/supabase/client'; // To mock Supabase client
import { vi } from 'vitest';

// Mock Supabase client
const mockSupabaseSelect = vi.fn();
const mockSupabaseUpdate = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSupabaseSelect,
      update: mockSupabaseUpdate,
    })),
    // Add other Supabase modules if needed by UserContext, e.g., auth, storage
  },
}));

// Mock AuthContext values
const mockAuthUser = { id: 'auth-user-123', email: 'auth@example.com' };
const mockSession = { access_token: 'fake-token', user: mockAuthUser };

const TestConsumerComponent = () => {
  const { user, loadUserData, updateUserProfile } = useUser();
  return (
    <div>
      <div data-testid="user-id">{user?.id}</div>
      <div data-testid="user-displayname">{user?.displayName}</div>
      <div data-testid="user-email">{user?.email}</div>
      <div data-testid="user-lastloginat">{user?.lastLoginAt}</div>
      <div data-testid="user-subscriptionid">{user?.currentSubscriptionId}</div>
      <div data-testid="user-profilepicurl">{user?.profilePictureURL}</div>
      <button onClick={loadUserData}>Load User Data</button>
      <button onClick={() => updateUserProfile({ displayName: 'New Name', currentSubscriptionId: 'sub_new' })}>
        Update Profile
      </button>
    </div>
  );
};

const renderWithContext = (authUser: any = mockAuthUser, session: any = mockSession) => {
  return render(
    <AuthContext.Provider value={{ 
        user: authUser, 
        session: session, 
        loading: false, 
        signIn: vi.fn(), 
        signUp: vi.fn(), 
        signOut: vi.fn() 
    }}>
      <UserProvider>
        <TestConsumerComponent />
      </UserProvider>
    </AuthContext.Provider>
  );
};

describe('UserContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations for each test
    mockSupabaseSelect.mockReset();
    mockSupabaseUpdate.mockReset();
  });

  describe('loadUserData', () => {
    it('correctly loads and processes user data from Supabase', async () => {
      const mockDbUser = {
        userid: 'auth-user-123',
        displayname: 'DB User',
        email: 'db@example.com',
        studentcategory: 'college',
        profilepictureurl: 'http://db.com/pic.png',
        preferredstudyweekdays: ['Monday'],
        preferredstudystarttime: '10:00',
        last_login_at: '2023-01-01T10:00:00Z',
        current_subscription_id: 'sub_db123',
      };
      mockSupabaseSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          maybeSingle: vi.fn().mockResolvedValueOnce({ data: mockDbUser, error: null }),
        }),
      });

      const { getByTestId, getByText } = renderWithContext();
      
      // loadUserData is called automatically on mount due to useEffect in UserProvider if session exists
      // We can also trigger it manually if needed for specific test cases.
      // For this test, we'll rely on the initial load.
      await act(async () => {
         // Allow useEffect in UserProvider to run if it didn't complete due to async nature
         // Or, if loadUserData is not called on mount anymore, click the button:
         fireEvent.click(getByText('Load User Data'));
      });

      await waitFor(() => {
        expect(getByTestId('user-id').textContent).toBe(mockDbUser.userid);
        expect(getByTestId('user-displayname').textContent).toBe(mockDbUser.displayname);
        expect(getByTestId('user-email').textContent).toBe(mockDbUser.email);
        expect(getByTestId('user-lastloginat').textContent).toBe(mockDbUser.last_login_at);
        expect(getByTestId('user-subscriptionid').textContent).toBe(mockDbUser.current_subscription_id);
        expect(getByTestId('user-profilepicurl').textContent).toBe(mockDbUser.profilepictureurl);
      });
    });

    it('handles case where no user data is found in Supabase', async () => {
      mockSupabaseSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
        }),
      });
      
      const { getByTestId } = renderWithContext();
      // Wait for useEffect in UserProvider to complete
      await act(async () => {}); 

      await waitFor(() => {
        // User object in context should be null or have defaults based on AuthUser if no DB record
        // The TestConsumerComponent would render empty strings for these if user is null
        expect(getByTestId('user-id').textContent).toBe(''); // Or specific default if user is not set to null
        expect(getByTestId('user-displayname').textContent).toBe('');
      });
    });

    it('does not set user if authUser is null', async () => {
      const { getByTestId } = renderWithContext(null, null); // No authenticated user
       await act(async () => {});

      await waitFor(() => {
        expect(getByTestId('user-id').textContent).toBe('');
      });
      expect(mockSupabaseSelect).not.toHaveBeenCalled();
    });
  });

  describe('updateUserProfile', () => {
    it('attempts to save current_subscription_id if provided', async () => {
      // Initial load to set a user in context
      const initialDbUser = { userid: 'auth-user-123', displayname: 'Initial' };
      mockSupabaseSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          maybeSingle: vi.fn().mockResolvedValueOnce({ data: initialDbUser, error: null }),
        }),
      });
      mockSupabaseUpdate.mockReturnValueOnce({ // For the updateUserProfile call
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      });
      
      const { getByText } = renderWithContext();
      
      // Ensure initial user is loaded
      await act(async () => {});
      await waitFor(() => expect(getByText('Update Profile')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(getByText('Update Profile'));
      });

      await waitFor(() => {
        expect(mockSupabaseUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            displayname: 'New Name', // From TestConsumerComponent's updateUserProfile call
            current_subscription_id: 'sub_new',
          })
        );
      });
    });
  });
});
