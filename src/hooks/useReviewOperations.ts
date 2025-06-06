
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
          reviewStage: `Stage ${entry.reviewstage}`,
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

  const markReviewAsCompleted = async (reviewId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      console.log('Marking review as completed:', reviewId);

      // Update review cycle entry status to completed
      const { error } = await supabase
        .from('reviewcycleentries')
        .update({ 
          status: 'completed',
          updatedat: new Date().toISOString()
        })
        .eq('entryid', reviewId)
        .eq('userid', authUser.user.id);

      if (error) {
        console.error('Error marking review as completed:', error);
        return false;
      }

      console.log('Review marked as completed successfully');
      
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
