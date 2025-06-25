# Aayra Smart Study - User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Core Features](#core-features)
4. [Study Session Workflow](#study-session-workflow)
5. [Review System](#review-system)
6. [Session Management](#session-management)
7. [Profile & Settings](#profile--settings)
8. [Mobile Features](#mobile-features)
9. [Troubleshooting](#troubleshooting)
10. [Tips for Effective Use](#tips-for-effective-use)

## Introduction

**Aayra** is an intelligent study application that combines focused study sessions with AI-powered content generation and spaced repetition learning. The tagline "The Smarter way to Master more" reflects its mission to help students learn more effectively through structured study sessions and intelligent review scheduling.

### Key Benefits
- **Focused Study Sessions**: Pomodoro-style timer with customizable focus and break durations
- **AI-Powered Learning**: Automatic generation of flashcards, quizzes, and summaries from your study materials
- **Spaced Repetition**: Intelligent review scheduling based on proven learning science
- **Multi-Modal Input**: Support for text, files, URLs, and voice recordings
- **Progress Tracking**: Comprehensive session history and performance analytics
- **Mobile Support**: Native Android app with offline capabilities

## Getting Started

### Account Creation
1. **Registration**: Create an account with email and password
2. **Profile Setup**: Complete your profile with:
   - Display name
   - Student category (High School, College, Graduate, Professional)
   - Profile picture (optional)
   - Study preferences (weekdays, start time)
   - Notification preferences

### First Login
- New users are automatically redirected to the Profile page to complete setup
- Returning users go directly to the Home dashboard

### Subscription Plans
Aayra offers different subscription tiers with varying session limits:
- **Daily Limits**: Number of study sessions per day
- **Weekly Limits**: Total sessions per week
- Session limits are enforced to encourage quality over quantity

## Core Features

### Home Dashboard
The main hub displaying:
- **Pending Reviews**: Sessions due for spaced repetition review
- **Start New Session**: Create a new study session (if within limits)
- **Completed Sessions**: Access to your study history
- **Incomplete Sessions**: Resume interrupted sessions
- **Favorites**: Quick access to starred sessions

### Session Limits
- Real-time tracking of daily/weekly usage
- Visual indicators when approaching limits
- Prevents session creation when limits are reached

## Study Session Workflow

### 1. Creating a New Session
1. Click "Start New Session" from the home page
2. Fill in session details:
   - **Subject Name**: The course or subject area
   - **Topic Name**: Specific topic being studied
   - **Focus Duration**: Study time in minutes (default: 25)
   - **Break Duration**: Break time in minutes (default: 5)
3. Click "Start Session" to begin

### 2. Focus Timer Phase
- **Circular Timer**: Visual countdown display
- **Manual Start**: User must click "Start" to begin timing
- **Session Status**: `focus_in_progress`
- **Navigation Protection**: Warns before leaving the page
- **Instructions**: Clear guidance on what to do during focus time

### 3. Upload Phase
After the focus timer completes, users upload study materials:

#### Upload Methods
- **Text Input**: Direct text entry via textarea
- **File Upload**: PDF, images, documents
- **URL Input**: Web links to articles or resources
- **Voice Recording**: Audio notes with playback controls

#### Upload Features
- **Multiple Items**: Add various types of content
- **Content Preview**: Review uploaded items before processing
- **Content Moderation**: Automatic filtering of inappropriate content
- **File Validation**: Size and type restrictions
- **Voice Controls**: Record, stop, play, delete audio

### 4. AI Processing
- **Status**: Session moves to `validating`
- **AI Generation**: Creates three types of content:
  - **Flashcards**: Question-answer pairs for active recall
  - **Quiz Questions**: Multiple choice with explanations
  - **Summary**: Condensed key points
- **Processing Time**: Usually 30-60 seconds depending on content volume

### 5. Validation Phase
Review and interact with AI-generated content:

#### Flashcard Review
- **Card Navigation**: Browse through generated flashcards
- **Flip Interaction**: Click to reveal answers
- **Progress Tracking**: Visual indicator of current position

#### Quiz Taking
- **Multiple Choice**: Select from provided options
- **Immediate Feedback**: See correct answers and explanations
- **Score Tracking**: Performance metrics for each quiz

#### Summary Review
- **Key Points**: AI-extracted important concepts
- **Study Guide**: Structured overview of the material

### 6. Session Completion
Two possible outcomes:
- **Complete Session**: Moves to `completed` status and enters review cycle
- **Mark Incomplete**: Saves progress for later resumption

### 7. Break Timer (Optional)
- **Automatic Transition**: After validation completion
- **Break Activities**: Suggested activities for effective breaks
- **Timer Display**: Countdown for break duration
- **Session Finalization**: Marks session as fully completed

## Review System

### Spaced Repetition Algorithm
Aayra implements a scientifically-backed spaced repetition system:

#### Review Stages
1. **Stage 1**: 1 day after completion
2. **Stage 2**: 3 days after Stage 1
3. **Stage 3**: 7 days after Stage 2
4. **Stage 4**: 14 days after Stage 3
5. **Stage 5**: 30 days after Stage 4
6. **Stage 6**: 90 days after Stage 5
7. **Final**: 180 days (mastery achieved)

#### Review Process
1. **Pending Reviews Page**: Shows all due reviews
2. **Review Session**: Same validation interface as original session
3. **Completion**: Advances to next stage or marks as mastered
4. **Scheduling**: Automatic calculation of next review date

### Review Management
- **Due Date Tracking**: Reviews appear when due or overdue
- **Priority Sorting**: Oldest reviews appear first
- **Progress Indicators**: Visual feedback on review stage
- **Performance Tracking**: Success rates and completion times

## Session Management

### Completed Sessions
- **Subject Grouping**: Sessions organized by subject
- **Chronological Order**: Newest sessions first
- **Favorites System**: Star important sessions for quick access
- **Review Access**: Click any session to review its content
- **Hierarchical Navigation**: Subject → Session drill-down

### Incomplete Sessions
- **Resume Capability**: Continue interrupted sessions
- **Status Preservation**: Maintains progress through workflow
- **Subject Organization**: Same grouping as completed sessions
- **Smart Resumption**: Continues from the last completed phase

### Session States
- `focus_in_progress`: Timer is running
- `uploading`: Adding study materials
- `validating`: AI processing and user review
- `break_in_progress`: Break timer active
- `completed`: Finished and in review cycle
- `incomplete`: Saved for later completion

## Profile & Settings

### Personal Information
- **Display Name**: How you appear in the app
- **Student Category**: Affects content recommendations
- **Profile Picture**: Upload custom avatar

### Study Preferences
- **Preferred Weekdays**: Days you typically study
- **Study Start Time**: When you usually begin studying
- **Notification Settings**: Control reminder frequency

### Subscription Management
- **Current Plan**: View active subscription details
- **Usage Statistics**: Track session consumption
- **Upgrade Options**: Access to higher-tier plans
- **Payment History**: Billing and transaction records

### Notifications
- **Study Reminders**: Scheduled notifications for study time
- **Review Alerts**: Notifications when reviews are due
- **Permission Management**: Enable/disable notification types
- **Platform Integration**: Native mobile notifications

### Theme & Appearance
- **Theme Toggle**: Light/Dark/System modes
- **Responsive Design**: Optimized for all screen sizes
- **Accessibility**: High contrast and readable fonts

## Mobile Features

### Android App
- **Native Performance**: Built with Capacitor for optimal mobile experience
- **Offline Capability**: Continue sessions without internet
- **Background Processing**: Timers continue when app is minimized
- **Native Notifications**: System-level alerts and reminders
- **File System Access**: Direct access to device storage
- **Hardware Integration**: Camera, microphone, and storage access

### Mobile-Specific Features
- **Haptic Feedback**: Tactile responses for interactions
- **Status Bar Integration**: App state reflected in status bar
- **Splash Screen**: Branded loading experience
- **Network Awareness**: Handles connectivity changes gracefully
- **Device Preferences**: Persistent settings storage

### Cross-Platform Sync
- **Real-time Sync**: Changes sync across all devices
- **Conflict Resolution**: Handles simultaneous edits
- **Offline Queue**: Actions sync when connection restored

## Troubleshooting

### Common Issues

#### Session Creation Problems
- **Limit Reached**: Check daily/weekly usage on home page
- **Network Issues**: Ensure stable internet connection
- **Form Validation**: All required fields must be completed

#### Timer Issues
- **Timer Not Starting**: Click the start button manually
- **Timer Stops**: Check if app was backgrounded on mobile
- **Inaccurate Time**: Refresh page and restart session

#### Upload Problems
- **File Too Large**: Check file size limits (usually 10MB)
- **Unsupported Format**: Use PDF, images, or text files
- **Content Moderation**: Ensure content is appropriate
- **Network Timeout**: Try uploading smaller files

#### AI Processing Issues
- **Long Processing Time**: Complex content takes longer
- **Processing Failed**: Check content quality and try again
- **Missing Content**: Ensure uploaded materials have sufficient text

#### Review System Issues
- **Missing Reviews**: Check if reviews are actually due
- **Duplicate Reviews**: Contact support if reviews appear twice
- **Progress Not Saving**: Ensure stable internet connection

### Performance Optimization
- **Clear Browser Cache**: Resolve loading issues
- **Update App**: Ensure latest version is installed
- **Check Storage**: Free up device storage space
- **Network Speed**: Use stable, fast internet connection

### Data Recovery
- **Session Recovery**: Incomplete sessions are automatically saved
- **Content Backup**: All data is stored securely in the cloud
- **Account Recovery**: Use forgot password feature

## Tips for Effective Use

### Study Session Best Practices
1. **Consistent Timing**: Use the same focus/break durations
2. **Quality Materials**: Upload comprehensive, well-organized content
3. **Active Engagement**: Fully engage with AI-generated content
4. **Regular Reviews**: Don't skip scheduled review sessions
5. **Subject Organization**: Use clear, consistent subject naming

### Content Upload Tips
1. **Diverse Sources**: Mix text, files, and voice recordings
2. **Clear Audio**: Ensure voice recordings are audible
3. **Structured Text**: Use headings and bullet points
4. **Relevant URLs**: Include only directly related web content
5. **Sufficient Volume**: Provide enough content for meaningful AI processing

### Review Optimization
1. **Honest Assessment**: Don't rush through flashcards
2. **Focus on Weak Areas**: Spend more time on difficult concepts
3. **Regular Schedule**: Maintain consistent review habits
4. **Active Recall**: Try to answer before revealing solutions
5. **Spaced Practice**: Trust the algorithm's scheduling

### Time Management
1. **Plan Sessions**: Use session limits strategically
2. **Break Discipline**: Take breaks as scheduled
3. **Peak Hours**: Study during your most alert times
4. **Batch Similar Topics**: Group related subjects together
5. **Progress Tracking**: Monitor your completion rates

### Mobile Usage
1. **Stable Connection**: Ensure good internet for sync
2. **Battery Management**: Keep device charged during sessions
3. **Notification Setup**: Enable reminders for consistency
4. **Offline Preparation**: Download content before going offline
5. **Regular Sync**: Open app regularly to sync data

---

*This manual covers Aayra Smart Study version 1.0. For additional support, contact the development team or check for updates to this documentation.*