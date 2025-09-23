import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PendingReview } from '@/types/session';

/**
 * Custom hook for managing review operations including pending reviews
 * and review cycle calculations
 */
export const useReviewOperations = () => {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);

  /**
   * Loads pending review cycle entries that are due today or overdue
   */
  const loadPendingReviews = async () => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      // Get current date in YYYY-MM-DD format for comparison
      const currentDate = new Date().toISOString().split('T')[0];

      console.log('Loading pending reviews for date:', currentDate);
      console.log('User ID for pending reviews query:', authUser.user.id);
      
      // Load pending review cycle entries that are due today or overdue
      const { data: reviewEntries, error } = await supabase
        .from('reviewcycleentries')
        .select(`
          *,
          studysessions (
            sessionid,
            sessionname,
            subjectname,
            topicname,
            lastreviewedat,
            createdat
          )
        `)
        .eq('userid', authUser.user.id)
        .eq('status', 'pending')
        .lte('currentreviewduedate', currentDate) // Only reviews due today or earlier
        .order('currentreviewduedate', { ascending: true });
        
      console.log('Database query completed. Error:', error);
      console.log('Raw review entries from database:', reviewEntries?.length || 0, 'entries');
      
      // Log all entries with their status to debug
      if (reviewEntries) {
        console.log('All entries returned by query:');
        reviewEntries.forEach((entry, index) => {
          console.log(`Entry ${index + 1}:`, {
            entryId: entry.entryid,
            sessionId: entry.sessionid,
            status: entry.status,
            reviewStage: entry.reviewstage,
            dueDate: entry.currentreviewduedate,
            userId: entry.userid
          });
        });
      }
      if (reviewEntries) {
        reviewEntries.forEach(entry => {
          console.log('Review entry:', {
            id: entry.entryid,
            sessionId: entry.sessionid,
            status: entry.status,
            reviewStage: entry.reviewstage,
            dueDate: entry.currentreviewduedate
          });
        });
      }

      if (error) {
        console.error('Error loading pending reviews:', error);
        return;
      }

      if (!reviewEntries) {
        console.log('No review entries found');
        setPendingReviews([]);
        return;
      }

      // Transform the data to match PendingReview interface
      const transformedReviews: PendingReview[] = reviewEntries
        .filter(entry => entry.studysessions) // Only include entries with valid session data
        .map(entry => ({
          id: entry.entryid,
          sessionId: entry.sessionid,
          sessionName: entry.studysessions.sessionname,
          subjectName: entry.studysessions.subjectname,
          topicName: entry.studysessions.topicname,
          reviewStage: entry.reviewstage,
          dueDate: entry.currentreviewduedate,
          lastReviewedAt: entry.studysessions.lastreviewedat,
          createdAt: entry.studysessions.createdat,
          completedAt: new Date(entry.studysessions.lastreviewedat || new Date().toISOString()) // Add completedAt field as Date
        }));

      console.log('Transformed pending reviews:', transformedReviews.length, 'reviews');
      transformedReviews.forEach(review => {
        console.log('Pending review:', {
          id: review.id,
          sessionName: review.sessionName,
          reviewStage: review.reviewStage,
          dueDate: review.dueDate
        });
      });

      console.log('Setting pending reviews state with', transformedReviews.length, 'reviews');
      setPendingReviews(transformedReviews);
      console.log('Pending reviews state updated successfully');
    } catch (error) {
      console.error('Error in loadPendingReviews:', error);
      setPendingReviews([]);
    }
  };

  /**
   * Calculates the next review date based on spaced repetition intervals
   * @param currentStage - The current review stage (1-6)
   * @returns ISO date string for the next review
   */
  const calculateNextReviewDate = (currentStage: number): string => {
    const now = new Date();
    let daysToAdd = 0;

    // Spaced repetition intervals: 1 day, 3 days, 1 week, 2 weeks, 1 month, 3 months
    switch (currentStage) {
      case 1:
        daysToAdd = 1; // 1 day
        break;
      case 2:
        daysToAdd = 3; // 3 days
        break;
      case 3:
        daysToAdd = 7; // 1 week
        break;
      case 4:
        daysToAdd = 14; // 2 weeks
        break;
      case 5:
        daysToAdd = 30; // 1 month
        break;
      case 6:
        daysToAdd = 90; // 3 months
        break;
      default:
        daysToAdd = 1; // Default to 1 day
    }

    const nextDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    return nextDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  };

  // Note: markReviewAsCompleted function has been removed to avoid conflicts.
  // All review completion logic is now handled by useReviewCompletion.completeReviewSession()

  return {
    pendingReviews,
    setPendingReviews,
    loadPendingReviews,
    calculateNextReviewDate
  };
};