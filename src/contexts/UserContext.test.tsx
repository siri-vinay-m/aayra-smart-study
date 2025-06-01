
import React from 'react';
import { render, act } from '@testing-library/react';
import { waitFor, fireEvent } from '@testing-library/dom';
import { UserProvider, useUser, User } from './UserContext';
import { AuthContext } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { vi } from 'vitest';

// Mock Supabase client
const mockSupabaseSelect = vi.fn();
const mockSupabaseUpdate = vi.fn();
const mockSupabaseFunctionsInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSupabaseSelect,
      update: mockSupabaseUpdate,
    })),
    functions: {
      invoke: mockSupabaseFunctionsInvoke,
    },
  },
}));

// Mock AuthContext values
const mockAuthUser = { id: 'auth-user-123', email: 'auth@example.com' };
const mockSession = { access_token: 'fake-token', user: mockAuthUser };

const TestConsumerComponent = () => {
  const { user, loadUserData, updateUserProfile, checkSubscriptionStatus } = useUser();
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
      <button onClick={checkSubscriptionStatus}>Check Subscription</button>
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
    mockSupabaseSelect.mockReset();
    mockSupabaseUpdate.mockReset();
    mockSupabaseFunctionsInvoke.mockReset();
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
        lastloginat: '2023-01-01T10:00:00Z',
        currentsubscriptionid: 'sub_db123',
        subscription_plan: 'free',
      };
      mockSupabaseSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          maybeSingle: vi.fn().mockResolvedValueOnce({ data: mockDbUser, error: null }),
        }),
      });

      const { getByTestId, getByText } = renderWithContext();
      
      await act(async () => {
         fireEvent.click(getByText('Load User Data'));
      });

      await waitFor(() => {
        expect(getByTestId('user-id').textContent).toBe(mockDbUser.userid);
        expect(getByTestId('user-displayname').textContent).toBe(mockDbUser.displayname);
        expect(getByTestId('user-email').textContent).toBe(mockDbUser.email);
        expect(getByTestId('user-lastloginat').textContent).toBe(mockDbUser.lastloginat);
        expect(getByTestId('user-subscriptionid').textContent).toBe(mockDbUser.currentsubscriptionid);
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
      await act(async () => {}); 

      await waitFor(() => {
        expect(getByTestId('user-id').textContent).toBe('');
        expect(getByTestId('user-displayname').textContent).toBe('');
      });
    });

    it('does not set user if authUser is null', async () => {
      const { getByTestId } = renderWithContext(null, null);
       await act(async () => {});

      await waitFor(() => {
        expect(getByTestId('user-id').textContent).toBe('');
      });
      expect(mockSupabaseSelect).not.toHaveBeenCalled();
    });
  });

  describe('updateUserProfile', () => {
    it('attempts to save current_subscription_id if provided', async () => {
      const initialDbUser = { userid: 'auth-user-123', displayname: 'Initial', subscription_plan: 'free' };
      mockSupabaseSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          maybeSingle: vi.fn().mockResolvedValueOnce({ data: initialDbUser, error: null }),
        }),
      });
      mockSupabaseUpdate.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      });
      
      const { getByText } = renderWithContext();
      
      await act(async () => {});
      await waitFor(() => expect(getByText('Update Profile')).toBeInTheDocument());

      await act(async () => {
        fireEvent.click(getByText('Update Profile'));
      });

      await waitFor(() => {
        expect(mockSupabaseUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            displayname: 'New Name',
            currentsubscriptionid: 'sub_new',
          })
        );
      });
    });
  });

  describe('checkSubscriptionStatus', () => {
    it('invokes the check-subscription function', async () => {
      mockSupabaseFunctionsInvoke.mockResolvedValueOnce({ data: {}, error: null });
      mockSupabaseSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
        }),
      });
      
      const { getByText } = renderWithContext();
      
      await act(async () => {
        fireEvent.click(getByText('Check Subscription'));
      });

      await waitFor(() => {
        expect(mockSupabaseFunctionsInvoke).toHaveBeenCalledWith('check-subscription');
      });
    });
  });
});
