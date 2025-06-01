
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProfilePage from './ProfilePage';
import { UserContext, User, StudentCategory } from '@/contexts/UserContext';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { vi } from 'vitest';

// --- Mocks ---
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock Supabase client
const mockSupabaseSelect = vi.fn();
const mockSupabaseUpdate = vi.fn();
const mockSupabaseInsert = vi.fn();
const mockSupabaseStorageUpload = vi.fn();
const mockSupabaseStorageGetPublicUrl = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    from: vi.fn((tableName: string) => ({
      select: mockSupabaseSelect,
      update: mockSupabaseUpdate,
      insert: mockSupabaseInsert,
    })),
    storage: {
      from: vi.fn(() => ({
        upload: mockSupabaseStorageUpload,
        getPublicUrl: mockSupabaseStorageGetPublicUrl,
      })),
    },
  },
}));
// --- End Mocks ---

// Default Mock User
const defaultMockUser: User = {
  id: 'test-user-id',
  displayName: 'Old Name',
  email: 'test@example.com',
  studentCategory: 'college' as StudentCategory,
  profilePictureURL: null,
  preferredStudyWeekdays: ['Monday', 'Wednesday'],
  preferredStudyStartTime: '09:00',
  isSubscribed: false,
  subscriptionPlan: 'free',
  lastLoginAt: new Date().toISOString(),
  currentSubscriptionId: null,
};

// Mock UserContext values
const mockSetUser = vi.fn();
const mockLoadUserData = vi.fn().mockResolvedValue(undefined);
const mockCheckSubscriptionStatus = vi.fn().mockResolvedValue(undefined); // Add missing mock

const renderProfilePage = (userOverride?: Partial<User>) => {
  const currentUser = userOverride ? { ...defaultMockUser, ...userOverride } : defaultMockUser;
  
  // Setup mock implementations for Supabase calls for each render
  mockSupabaseSelect.mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { userid: currentUser?.id }, error: null }),
    }),
  });
  mockSupabaseUpdate.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  mockSupabaseInsert.mockResolvedValue({ error: null });
  mockSupabaseStorageUpload.mockResolvedValue({ error: null });
  mockSupabaseStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'http://mockurl.com/new-image.png' } });

  return render(
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <UserContext.Provider value={{
            user: currentUser,
            setUser: mockSetUser,
            isAuthenticated: !!currentUser,
            setIsAuthenticated: vi.fn(),
            loadUserData: mockLoadUserData,
            updateUserProfile: vi.fn(),
            checkSubscriptionStatus: mockCheckSubscriptionStatus, // Add missing property
          }}>
            <ProfilePage />
          </UserContext.Provider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders form elements and loads initial data', () => {
    renderProfilePage();
    expect(screen.getByLabelText(/Display Name/i)).toHaveValue(defaultMockUser.displayName);
    expect(screen.getByLabelText(/Student Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preferred Study Weekdays/i)).toHaveTextContent('Monday, Wednesday');
    expect(screen.getByLabelText(/Preferred Study Start Time/i)).toHaveValue(defaultMockUser.preferredStudyStartTime);
  });

  test('updates display name on input change and saves correctly', async () => {
    renderProfilePage();
    const newDisplayName = 'New Display Name';
    const displayNameInput = screen.getByLabelText(/Display Name/i);
    
    await act(async () => {
      fireEvent.change(displayNameInput, { target: { value: newDisplayName } });
    });
    expect(displayNameInput).toHaveValue(newDisplayName);

    const saveButton = screen.getByRole('button', { name: /Save Profile/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ displayname: newDisplayName })
      );
      expect(mockLoadUserData).toHaveBeenCalled();
    });
  });

  describe('Weekday Picker', () => {
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    test('loads and displays various weekday selections correctly', () => {
      const { rerender } = renderProfilePage({ ...defaultMockUser, preferredStudyWeekdays: ['Tuesday', 'Friday'] });
      expect(screen.getByLabelText(/Preferred Study Weekdays/i)).toHaveTextContent('Tuesday, Friday');

      rerender(
         <BrowserRouter><ToastProvider><AuthProvider><UserContext.Provider value={{ user: { ...defaultMockUser, preferredStudyWeekdays: weekdays }, setUser: mockSetUser, isAuthenticated: true, setIsAuthenticated: vi.fn(), loadUserData: mockLoadUserData, updateUserProfile: vi.fn(), checkSubscriptionStatus: mockCheckSubscriptionStatus }}><ProfilePage /></UserContext.Provider></AuthProvider></ToastProvider></BrowserRouter>
      );
      expect(screen.getByLabelText(/Preferred Study Weekdays/i)).toHaveTextContent('All weekdays');
      
      rerender(
         <BrowserRouter><ToastProvider><AuthProvider><UserContext.Provider value={{ user: { ...defaultMockUser, preferredStudyWeekdays: [] }, setUser: mockSetUser, isAuthenticated: true, setIsAuthenticated: vi.fn(), loadUserData: mockLoadUserData, updateUserProfile: vi.fn(), checkSubscriptionStatus: mockCheckSubscriptionStatus }}><ProfilePage /></UserContext.Provider></AuthProvider></ToastProvider></BrowserRouter>
      );
      expect(screen.getByLabelText(/Preferred Study Weekdays/i)).toHaveTextContent('Select weekdays');
    });

    test('selecting/deselecting individual days updates display and save payload', async () => {
      renderProfilePage({ ...defaultMockUser, preferredStudyWeekdays: [] });
      const weekdaysButton = screen.getByLabelText(/Preferred Study Weekdays/i);
      
      await act(async () => { fireEvent.click(weekdaysButton); });
      await act(async () => { fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Monday' })); });
      expect(weekdaysButton).toHaveTextContent('Monday');
      
      await act(async () => { fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Wednesday' })); });
      expect(weekdaysButton).toHaveTextContent('Monday, Wednesday');

      const saveButton = screen.getByRole('button', { name: /Save Profile/i });
      await act(async () => { fireEvent.click(saveButton); });
      await waitFor(() => {
        expect(mockSupabaseUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ preferredstudyweekdays: 'Monday,Wednesday' })
        );
      });
    });

    test('"All Weekdays" checkbox selects/deselects all and updates save payload', async () => {
      renderProfilePage({ ...defaultMockUser, preferredStudyWeekdays: [] });
      const weekdaysButton = screen.getByLabelText(/Preferred Study Weekdays/i);
      await act(async () => { fireEvent.click(weekdaysButton); });
      
      const allWeekdaysCheckbox = screen.getByRole('menuitemcheckbox', { name: 'All Weekdays' });

      await act(async () => { fireEvent.click(allWeekdaysCheckbox); });
      expect(weekdaysButton).toHaveTextContent('All weekdays');
      
      const saveButton = screen.getByRole('button', { name: /Save Profile/i });
      await act(async () => { fireEvent.click(saveButton); });
      await waitFor(() => {
        expect(mockSupabaseUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ preferredstudyweekdays: weekdays.join(',') })
        );
      });

      await act(async () => { fireEvent.click(allWeekdaysCheckbox); });
      expect(weekdaysButton).toHaveTextContent('Select weekdays');

      await act(async () => { fireEvent.click(saveButton); });
      await waitFor(() => {
        expect(mockSupabaseUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ preferredstudyweekdays: null })
        );
      });
    });
  });
  
  describe('Profile Picture Upload', () => {
    test('selecting a file updates component state and saving uploads the file', async () => {
      renderProfilePage();

      const mockFile = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });

      const fileInput = screen.getByTestId('profile-image-upload').querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      const saveButton = screen.getByRole('button', { name: /Save Profile/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockSupabaseStorageUpload).toHaveBeenCalledWith(
          expect.stringContaining(`public/${defaultMockUser.id}`),
          mockFile,
          expect.any(Object)
        );
        
        expect(mockSupabaseUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ profilepictureurl: 'http://mockurl.com/new-image.png' })
        );
        
        expect(mockLoadUserData).toHaveBeenCalled();
      });
    });

    test('saving profile without a new image does not attempt upload but saves other data', async () => {
      renderProfilePage({ ...defaultMockUser, displayName: "Initial Name" });
      
      const newDisplayName = "Changed Name Only";
      const displayNameInput = screen.getByLabelText(/Display Name/i);
      await act(async () => {
        fireEvent.change(displayNameInput, { target: { value: newDisplayName } });
      });

      const saveButton = screen.getByRole('button', { name: /Save Profile/i });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockSupabaseStorageUpload).not.toHaveBeenCalled();
        expect(mockSupabaseUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ 
            displayname: newDisplayName,
            profilepictureurl: defaultMockUser.profilePictureURL
          })
        );
        expect(mockLoadUserData).toHaveBeenCalled();
      });
    });
  });
});
