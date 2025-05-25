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

// Mock FileReader
let mockFileReaderInstance: { onload: ((event: Partial<ProgressEvent<FileReader>>) => void) | null; readAsDataURL: vi.Mock; result?: string | ArrayBuffer | null; error?: DOMException | null; onerror: ((event: Partial<ProgressEvent<FileReader>>) => void) | null; };

vi.mock('vitest', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    spyOn: vi.spyOn, // Ensure spyOn is correctly available if we are in a mixed module context
  };
});


describe('Profile Picture Management', () => {
  beforeEach(() => {
    mockUpdateUserProfile.mockClear();
    mockAlert.mockClear();

    // Resetable mock FileReader for each test
    mockFileReaderInstance = {
      onload: null,
      readAsDataURL: vi.fn(),
      result: null,
      error: null,
      onerror: null,
    };
    vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReaderInstance as any);
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore FileReader and alert mocks
  });

  const openProfilePictureDialog = async () => {
    // The trigger is the Avatar or the text "Edit Profile Picture"
    // Let's try to click the text which is more specific
    const editButton = screen.getByText(/Edit Profile Picture/i);
    fireEvent.click(editButton);
    await screen.findByRole('dialog'); // Wait for dialog to appear
    expect(screen.getByText('Profile Picture')).toBeInTheDocument(); // Dialog title
  };

  test('Successful profile picture upload', async () => {
    mockUpdateUserProfile.mockResolvedValue({ success: true });
    renderProfilePage();
    await openProfilePictureDialog();

    const fakeFile = new File(['dummy_content'], 'example.png', { type: 'image/png' });
    const fakeDataUrl = 'data:image/png;base64,dummies';

    // Find the hidden file input. It's within a label "Upload New Picture".
    // A more robust way would be a test-id, but we'll try to find it.
    // It's the only input type="file" within the dialog.
    const fileInput = screen.getByRole('dialog').querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();

    // Simulate the file reading process
    mockFileReaderInstance.readAsDataURL = vi.fn().mockImplementationOnce(() => {
      if (mockFileReaderInstance.onload) {
        mockFileReaderInstance.result = fakeDataUrl;
        mockFileReaderInstance.onload({ target: { result: fakeDataUrl } } as Partial<ProgressEvent<FileReader>>);
      }
    });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [fakeFile] } });
    } else {
      throw new Error("File input not found");
    }

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({ profilePictureURL: fakeDataUrl });
    });
    expect(mockAlert).not.toHaveBeenCalled();
    // Check dialog is closed
    await waitFor(() => {
      expect(screen.queryByText('Profile Picture')).not.toBeInTheDocument();
    });
  });

  test('Failed profile picture upload', async () => {
    const errorMessage = 'Upload failed';
    mockUpdateUserProfile.mockResolvedValue({ success: false, error: { message: errorMessage } });
    renderProfilePage();
    await openProfilePictureDialog();

    const fakeFile = new File(['dummy_content'], 'example.png', { type: 'image/png' });
    const fakeDataUrl = 'data:image/png;base64,dummies_fail';

    const fileInput = screen.getByRole('dialog').querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();

    mockFileReaderInstance.readAsDataURL = vi.fn().mockImplementationOnce(() => {
      if (mockFileReaderInstance.onload) {
        mockFileReaderInstance.result = fakeDataUrl;
        mockFileReaderInstance.onload({ target: { result: fakeDataUrl } } as Partial<ProgressEvent<FileReader>>);
      }
    });

    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [fakeFile] } });
    } else {
      throw new Error("File input not found");
    }

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({ profilePictureURL: fakeDataUrl });
    });
    expect(mockAlert).toHaveBeenCalledWith('Failed to upload profile picture: ' + errorMessage);
    // Check dialog is still open
    expect(screen.getByText('Profile Picture')).toBeInTheDocument();
  });
  
  test('FileReader error during upload', async () => {
    renderProfilePage();
    await openProfilePictureDialog();

    const fakeFile = new File(['dummy_content'], 'example.png', { type: 'image/png' });
    const fileInput = screen.getByRole('dialog').querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();

    mockFileReaderInstance.readAsDataURL = vi.fn().mockImplementationOnce(() => {
      if (mockFileReaderInstance.onerror) {
        mockFileReaderInstance.onerror({} as Partial<ProgressEvent<FileReader>>); // Simulate error
      }
    });

    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [fakeFile] } });
    } else {
      throw new Error("File input not found");
    }

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Failed to read file.');
    });
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    // Dialog should close or stay open based on implementation, current impl closes.
    // The current implementation in ProfilePage.tsx for onerror is: setProfileDialogOpen(false);
    await waitFor(() => {
        expect(screen.queryByText('Profile Picture')).not.toBeInTheDocument();
    });
  });


  test('Successful profile picture removal', async () => {
    mockUpdateUserProfile.mockResolvedValue({ success: true });
    renderProfilePage({ profilePictureURL: 'existing_url.png' }); // User has a picture
    await openProfilePictureDialog();

    const removeButton = screen.getByRole('button', { name: /Remove Profile Picture/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({ profilePictureURL: null });
    });
    expect(mockAlert).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText('Profile Picture')).not.toBeInTheDocument();
    });
  });

  test('Failed profile picture removal', async () => {
    const errorMessage = 'Remove failed';
    mockUpdateUserProfile.mockResolvedValue({ success: false, error: { message: errorMessage } });
    renderProfilePage({ profilePictureURL: 'existing_url.png' });
    await openProfilePictureDialog();

    const removeButton = screen.getByRole('button', { name: /Remove Profile Picture/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({ profilePictureURL: null });
    });
    expect(mockAlert).toHaveBeenCalledWith('Failed to remove profile picture: ' + errorMessage);
    expect(screen.getByText('Profile Picture')).toBeInTheDocument(); // Dialog still open
  });
});
