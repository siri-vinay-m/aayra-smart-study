
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PendingReview } from '@/types/session';

export const useReviewOperations = () => {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);

  const loadPendingReviews = async () => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      // Get current date in YYYY-MM-DD format for comparison
      const currentDate = new Date().toISOString().split('T')[0];

      // Loading pending reviews
      
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
        
      console.log('Raw review entries from database:', reviewEntries?.length || 0, 'entries');
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

      if (reviewEntries) {
        const formattedReviews: PendingReview[] = reviewEntries.map(entry => ({
          id: entry.entryid,
          sessionId: entry.sessionid,
          sessionName: entry.studysessions.sessionname,
          subjectName: entry.studysessions.subjectname,
          topicName: entry.studysessions.topicname,
          completedAt: new Date(entry.studysessions.lastreviewedat || entry.studysessions.createdat),
          dueDate: entry.currentreviewduedate, // Keep as string to match PendingReview interface
          reviewStage: entry.reviewstage,
        }));

        setPendingReviews(formattedReviews);
      }
    } catch (error) {
      console.error('Error in loadPendingReviews:', error);
    }
  };

  const completeSession = async (
    sessionId: string, 
    loadCompletedSessions: () => Promise<void>,
    loadIncompleteSessions?: () => Promise<void>
  ) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      console.log('Completing session:', sessionId);

      // Update session status to completed and set last reviewed date
      const { error: sessionError } = await supabase
        .from('studysessions')
        .update({ 
          status: 'completed',
          lastreviewedat: new Date().toISOString()
        })
        .eq('sessionid', sessionId);

      if (sessionError) {
        console.error('Error completing session:', sessionError);
        return;
      }

      console.log('Session status updated to completed');

      // Create review cycle entry for spaced repetition
      const { error: reviewError } = await supabase
        .from('reviewcycleentries')
        .insert({
          sessionid: sessionId,
          userid: authUser.user.id,
          initialappearancedate: new Date().toISOString().split('T')[0],
          currentreviewduedate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24 hours from now
          reviewstage: 1,
          status: 'pending'
        });

      if (reviewError) {
        console.error('Error creating review cycle entry:', reviewError);
      } else {
        console.log('Review cycle entry created successfully');
      }
      
      // Reload the data to reflect changes
      await loadCompletedSessions();
      if (loadIncompleteSessions) {
        await loadIncompleteSessions();
      }
      await loadPendingReviews();
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  // Helper function to calculate next review date based on spaced repetition
  const calculateNextReviewDate = (currentStage: number): string => {
    const now = new Date();
    let daysToAdd = 1;
    
    switch (currentStage) {
      case 1: daysToAdd = 3; break;
      case 2: daysToAdd = 7; break;
      case 3: daysToAdd = 14; break;
      case 4: daysToAdd = 30; break;
      case 5: daysToAdd = 90; break;
      default: daysToAdd = 180; break;
    }
    
    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString().split('T')[0];
  };

  const markReviewAsCompleted = async (reviewId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return false;

      console.log('Marking review as completed:', reviewId);

      // First, get the current review entry to extract session info and current stage
      const { data: currentReview, error: fetchError } = await supabase
        .from('reviewcycleentries')
        .select('*')
        .eq('entryid', reviewId)
        .eq('userid', authUser.user.id)
        .single();

      if (fetchError || !currentReview) {
        console.error('Error fetching review entry:', fetchError);
        return false;
      }

      console.log('Updating review entry status to completed:', {
        entryId: reviewId,
        currentStatus: currentReview.status,
        reviewStage: currentReview.reviewstage
      });
      
      // Update current review cycle entry status to completed
      const { error: updateError } = await supabase
        .from('reviewcycleentries')
        .update({ 
          status: 'completed',
          updatedat: new Date().toISOString()
        })
        .eq('entryid', reviewId)
        .eq('userid', authUser.user.id);
        
      console.log('Review status update result:', updateError ? 'FAILED' : 'SUCCESS', updateError);

      if (updateError) {
        console.error('Error marking review as completed:', updateError);
        return false;
      }

      console.log('Review marked as completed successfully');
      
      // Verify the status update by checking the database
      const { data: verifyUpdate } = await supabase
        .from('reviewcycleentries')
        .select('status, updatedat')
        .eq('entryid', reviewId)
        .single();
        
      console.log('Status verification after update:', verifyUpdate);

      // Create next review cycle entry if we haven't reached the maximum stage (6)
      const currentStage = currentReview.reviewstage;
      if (currentStage < 6) {
        const nextStage = currentStage + 1;
        const nextReviewDate = calculateNextReviewDate(currentStage);

        const { error: nextEntryError } = await supabase
          .from('reviewcycleentries')
          .insert({
            sessionid: currentReview.sessionid,
            userid: authUser.user.id,
            initialappearancedate: currentReview.initialappearancedate,
            currentreviewduedate: nextReviewDate,
            reviewstage: nextStage,
            status: 'pending'
          });

        if (nextEntryError) {
          console.error('Error creating next review cycle entry:', nextEntryError);
        } else {
          console.log('Next review cycle entry created for stage:', nextStage);
        }
      }

      // Update session last reviewed date
      const { error: sessionError } = await supabase
        .from('studysessions')
        .update({ 
          lastreviewedat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        })
        .eq('sessionid', currentReview.sessionid);

      if (sessionError) {
        console.error('Error updating session last reviewed date:', sessionError);
      }
      
      // Add a small delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload pending reviews to reflect changes
      await loadPendingReviews();
      return true;
    } catch (error) {
      console.error('Error in markReviewAsCompleted:', error);
      return false;
    }
  };

  return {
    pendingReviews,
    setPendingReviews,
    loadPendingReviews,
    completeSession,
    markReviewAsCompleted,
  };
};
