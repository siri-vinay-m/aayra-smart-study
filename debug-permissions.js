// Debug script to check UPDATE permissions on reviewcycleentries table
// Run this in browser console to diagnose permission issues

async function debugReviewCyclePermissions() {
  console.log('=== DEBUGGING REVIEWCYCLEENTRIES UPDATE PERMISSIONS ===');
  
  try {
    // 1. Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('1. User Authentication:');
    console.log('  - User ID:', user?.id);
    console.log('  - User Email:', user?.email);
    console.log('  - Auth Error:', authError);
    
    if (!user) {
      console.error('❌ No authenticated user found!');
      return;
    }
    
    // 2. Check if the specific entry exists and user owns it
    const targetEntryId = 'YOUR_ENTRY_ID_HERE'; // Replace with actual entry ID
    console.log('\n2. Entry Ownership Check:');
    
    const { data: entryCheck, error: entryError } = await supabase
      .from('reviewcycleentries')
      .select('entryid, userid, status, reviewstage')
      .eq('entryid', targetEntryId)
      .single();
      
    console.log('  - Entry exists:', !!entryCheck);
    console.log('  - Entry data:', entryCheck);
    console.log('  - Entry error:', entryError);
    
    if (entryCheck) {
      console.log('  - User owns entry:', entryCheck.userid === user.id);
      console.log('  - Current status:', entryCheck.status);
    }
    
    // 3. Test SELECT permissions
    console.log('\n3. SELECT Permission Test:');
    const { data: selectTest, error: selectError } = await supabase
      .from('reviewcycleentries')
      .select('entryid, status')
      .eq('userid', user.id)
      .limit(1);
      
    console.log('  - SELECT works:', !selectError);
    console.log('  - SELECT error:', selectError);
    console.log('  - SELECT data count:', selectTest?.length || 0);
    
    // 4. Test UPDATE permissions with a harmless update
    console.log('\n4. UPDATE Permission Test:');
    const testUpdateResult = await supabase
      .from('reviewcycleentries')
      .update({ updatedat: new Date().toISOString() })
      .eq('entryid', targetEntryId)
      .eq('userid', user.id)
      .select('entryid, status, updatedat');
      
    console.log('  - UPDATE works:', !testUpdateResult.error);
    console.log('  - UPDATE error:', testUpdateResult.error);
    console.log('  - UPDATE data:', testUpdateResult.data);
    console.log('  - Rows affected:', testUpdateResult.data?.length || 0);
    
    // 5. Check RLS policies (this will show policy violations)
    console.log('\n5. RLS Policy Check:');
    if (testUpdateResult.error) {
      const errorCode = testUpdateResult.error.code;
      const errorMessage = testUpdateResult.error.message;
      
      console.log('  - Error Code:', errorCode);
      console.log('  - Error Message:', errorMessage);
      
      // Common RLS error patterns
      if (errorCode === '42501') {
        console.log('  ❌ INSUFFICIENT PRIVILEGES - RLS policy blocking update');
      } else if (errorCode === 'PGRST116') {
        console.log('  ❌ NO ROWS AFFECTED - Entry not found or access denied');
      } else if (errorMessage.includes('policy')) {
        console.log('  ❌ RLS POLICY VIOLATION');
      }
    }
    
    // 6. Check current session and JWT token
    console.log('\n6. Session Information:');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('  - Session exists:', !!session);
    console.log('  - Session error:', sessionError);
    console.log('  - Access token length:', session?.access_token?.length || 0);
    console.log('  - Token expires at:', session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A');
    
    // 7. Test with raw SQL (if available)
    console.log('\n7. Raw SQL Test (if RPC available):');
    try {
      const { data: sqlTest, error: sqlError } = await supabase.rpc('check_update_permissions', {
        table_name: 'reviewcycleentries',
        entry_id: targetEntryId,
        user_id: user.id
      });
      console.log('  - SQL test result:', sqlTest);
      console.log('  - SQL test error:', sqlError);
    } catch (e) {
      console.log('  - RPC not available or failed:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Instructions for use:
console.log('To run this debug script:');
console.log('1. Replace YOUR_ENTRY_ID_HERE with the actual entry ID you are trying to update');
console.log('2. Run: debugReviewCyclePermissions()');
console.log('3. Check the console output for permission issues');

// Export for use
window.debugReviewCyclePermissions = debugReviewCyclePermissions;