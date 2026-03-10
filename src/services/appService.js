import { supabase } from '@/api/supabaseClient';

const BOOTSTRAP_LIMIT = 20;
const REQUIRED_TESTERS = 12;
const TEST_DURATION_DAYS = 14;
const CREDITS_PER_UPLOAD = 3;
const MAX_ACTIVE_SESSIONS = 5;

export async function enrollInTest({ appId, user }) {
  const { data: app, error: appErr } = await supabase
    .from('apps').select('*').eq('id', appId).single();
  if (appErr || !app) throw new Error('App not found');
  if (app.owner_id === user.id) throw new Error("You can't test your own app");
  if (app.status === 'COMPLETED') throw new Error('This test is already completed');

  const { data: existingSessions } = await supabase
    .from('test_sessions').select('*')
    .eq('app_id', appId).eq('tester_id', user.id);
  const activeSession = (existingSessions || []).find(s => s.status !== 'LEFT');
  if (activeSession) throw new Error('You already have an active session for this app');

  const { data: allUserSessions } = await supabase
    .from('test_sessions').select('*').eq('tester_id', user.id);
  const activeSessions = (allUserSessions || []).filter(
    s => s.status === 'ENROLLED' || s.status === 'PENDING_GOOGLE_VERIFICATION'
  );
  if (activeSessions.length >= MAX_ACTIVE_SESSIONS) {
    throw new Error(`You can have at most ${MAX_ACTIVE_SESSIONS} active tests at a time`);
  }

  const { data: session, error: sessErr } = await supabase
    .from('test_sessions').insert({
      app_id: appId,
      app_name: app.app_name,
      tester_id: user.id,
      tester_email: user.email,
      status: 'PENDING_GOOGLE_VERIFICATION',
      joined_at: new Date().toISOString(),
    }).select().single();
  if (sessErr) throw sessErr;

  return { session, app };
}

export async function leaveTest({ sessionId, appId, user }) {
  const { data: sessions } = await supabase
    .from('test_sessions').select('*').eq('app_id', appId);
  const session = (sessions || []).find(s => s.id === sessionId);
  if (!session) throw new Error('Session not found');
  if (session.tester_id !== user.id) throw new Error('Not your session');

  const enrolledCount = (sessions || []).filter(
    s => (s.status === 'ENROLLED' || s.status === 'COMPLETED') && s.id !== sessionId
  ).length;

  if (enrolledCount < REQUIRED_TESTERS) {
    throw new Error(
      'Cannot leave: this would drop the tester count below the Google Play minimum of 12.'
    );
  }

  await supabase.from('test_sessions').update({
    status: 'LEFT',
    left_at: new Date().toISOString(),
  }).eq('id', sessionId);

  await supabase.from('apps').update({ testers_enrolled: enrolledCount }).eq('id', appId);
}

export async function uploadApp({ appName, playstoreLink, description, user }) {
  const { count } = await supabase
    .from('apps').select('*', { count: 'exact', head: true });
  const isBootstrap = (count || 0) < BOOTSTRAP_LIMIT;
  const completedSince = user.tests_completed_since_last_upload || 0;

  if (!isBootstrap && completedSince < CREDITS_PER_UPLOAD) {
    throw new Error(
      `You need ${CREDITS_PER_UPLOAD - completedSince} more test credits to upload an app.`
    );
  }

  const { data: app, error } = await supabase.from('apps').insert({
    app_name: appName,
    playstore_link: playstoreLink,
    description,
    owner_id: user.id,
    owner_email: user.email,
    status: 'WAITING_FOR_TESTERS',
    testers_enrolled: 0,
    is_bootstrap: isBootstrap,
  }).select().single();
  if (error) throw error;

  const newCredits = isBootstrap ? completedSince : completedSince - CREDITS_PER_UPLOAD;
  const newAppsTotal = (user.apps_uploaded_total || 0) + 1;

  await supabase.from('profiles').update({
    tests_completed_since_last_upload: Math.max(newCredits, 0),
    apps_uploaded_total: newAppsTotal,
  }).eq('id', user.id);

  return { app, isBootstrap };
}

export async function recountTesters(appId) {
  const { data: sessions } = await supabase
    .from('test_sessions').select('*').eq('app_id', appId);
  return (sessions || []).filter(s => s.status === 'ENROLLED' || s.status === 'COMPLETED').length;
}

export async function fetchPlatformStats() {
  try {
    const [{ count: totalApps }, { count: totalDevelopers }, { count: completedApps }] = await Promise.all([
      supabase.from('apps').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('apps').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
    ]);
    return {
      totalDevelopers: totalDevelopers || 0,
      totalApps: totalApps || 0,
      completedApps: completedApps || 0,
    };
  } catch {
    return { totalDevelopers: 0, totalApps: 0, completedApps: 0 };
  }
}

export { BOOTSTRAP_LIMIT, REQUIRED_TESTERS, TEST_DURATION_DAYS, CREDITS_PER_UPLOAD, MAX_ACTIVE_SESSIONS };
