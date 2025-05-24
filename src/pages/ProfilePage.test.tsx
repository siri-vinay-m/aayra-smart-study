import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from './ProfilePage'; // Assuming ProfilePage.tsx is in the same directory or adjust path
import { UserContext, User, StudentCategory } from '@/contexts/UserContext';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock window.alert
const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

// Default Mock User
const mockUser: User = {
  id: 'test-user-id',
  displayName: 'Old Name',
  email: 'test@example.com',
  studentCategory: 'college',
  profilePictureURL: null,
  preferredStudyWeekdays: 'all',
  preferredStudyStartTime: '09:00',
  isSubscribed: false,
  subscriptionPlan: 'free',
};

// Mock UserContext
const mockSetUser = vi.fn();
const mockSetIsAuthenticated = vi.fn();
const mockLoadUserData = vi.fn().mockResolvedValue(undefined);
const mockUpdateUserProfile = vi.fn();


const renderProfilePage = (
  userOverride?: Partial<User>, 
  updateUserProfileMockOverride?: any
) => {
  const currentUser = { ...mockUser, ...userOverride };
  const userContextValue = {
    user: currentUser,
    setUser: mockSetUser,
    isAuthenticated: true,
    setIsAuthenticated: mockSetIsAuthenticated,
    loadUserData: mockLoadUserData,
    updateUserProfile: updateUserProfileMockOverride || mockUpdateUserProfile,
  };

  return render(
    <BrowserRouter>
      <UserContext.Provider value={userContextValue}>
        <ProfilePage />
      </UserContext.Provider>
    </BrowserRouter>
  );
};

describe('ProfilePage', () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockNavigate.mockClear();
    mockUpdateUserProfile.mockClear();
    mockAlert.mockClear();
    mockSetUser.mockClear();
    mockSetIsAuthenticated.mockClear();
    mockLoadUserData.mockClear();
  });

  test('Successful Profile Save', async () => {
    mockUpdateUserProfile.mockResolvedValue({ success: true });

    renderProfilePage();

    const newDisplayName = 'New Name';
    const newCategory = 'professional' as StudentCategory;

    // Simulate user input
    const displayNameInput = screen.getByLabelText(/Display Name/i);
    fireEvent.change(displayNameInput, { target: { value: newDisplayName } });

    // For Select, it's a bit more involved. We need to click the trigger, then the item.
    // Ensure your SelectTrigger has an accessible name or use getByRole if not.
    // Assuming SelectTrigger has a role 'combobox' or similar.
    const categorySelectTrigger = screen.getByLabelText(/Student Category/i); // This often points to the label, not the trigger itself
    // A better way to get the trigger might be by its role if it has one, or a test-id.
    // Let's assume the trigger is identifiable. For ShadCN, it's often a button.
    fireEvent.mouseDown(categorySelectTrigger); // Open the select

    // Wait for the items to be in the document
    const categoryOption = await screen.findByText(newCategory, { selector: '[role="option"]' });
    fireEvent.click(categoryOption);
    
    // Simulate clicking the "Save Changes" button
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledTimes(1);
    });
    
    expect(mockUpdateUserProfile).toHaveBeenCalledWith({
      displayName: newDisplayName,
      studentCategory: newCategory,
      preferredStudyWeekdays: mockUser.preferredStudyWeekdays, // Not changed in this test
      preferredStudyStartTime: mockUser.preferredStudyStartTime, // Not changed in this test
    });
    expect(mockNavigate).toHaveBeenCalledWith('/home');
    expect(mockAlert).not.toHaveBeenCalled();
  });

  test('Failed Profile Save', async () => {
    const errorMessage = 'Update failed miserably';
    mockUpdateUserProfile.mockResolvedValue({ success: false, error: { message: errorMessage } });

    renderProfilePage();

    const newDisplayName = 'Another Name';

    // Simulate user input
    const displayNameInput = screen.getByLabelText(/Display Name/i);
    fireEvent.change(displayNameInput, { target: { value: newDisplayName } });
    
    // Simulate clicking the "Save Changes" button
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateUserProfile).toHaveBeenCalledWith(expect.objectContaining({
      displayName: newDisplayName,
    }));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith('Failed to save profile: ' + errorMessage);
  });

  test('handleSaveProfile when user is null', async () => {
    renderProfilePage({ id: undefined } as any, mockUpdateUserProfile); // Force user to be effectively null for the check in handleSaveProfile

    // Attempt to click save
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
        // Check that alert was called because user is null
        expect(mockAlert).toHaveBeenCalledWith('User data not available. Please try again.');
    });
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
