import { base44 } from '@/api/base44Client';

const BOOTSTRAP_LIMIT = 20;
const REQUIRED_TESTERS = 12;
const TEST_DURATION_DAYS = 14;
const CREDITS_PER_UPLOAD = 3;
const MAX_ACTIVE_SESSIONS = 5;

export async function enrollInTest({ appId, user }) {
  const apps = await base44.entities.App.filter({ id: appId });
  const app = apps[0];
  if (!app) throw new Error('App not found');
  if (app.owner_id === user.id) throw new Error("You can't test your own app");
  if (app.status === 'COMPLETED') throw new Error('This test is already completed');

  const existingSessions = await base44.entities.TestSession.filter({
    app_id: appId,
    tester_id: user.id,
  });
  const activeSession = existingSessions.find(s => s.status !== 'LEFT');
  if (activeSession) throw new Error('You already have an active session for this app');

  const allUserSessions = await base44.entities.TestSession.filter({ tester_id: user.id });
  const activeSessions = allUserSessions.filter(
    s => s.status === 'ENROLLED' || s.status === 'PENDING_GOOGLE_VERIFICATION'
  );
  if (activeSessions.length >= MAX_ACTIVE_SESSIONS) {
    throw new Error(`You can have at most ${MAX_ACTIVE_SESSIONS} active tests at a time`);
  }

  const session = await base44.entities.TestSession.create({
    app_id: appId,
    app_name: app.app_name,
    tester_id: user.id,
    tester_email: user.email,
    status: 'PENDING_GOOGLE_VERIFICATION',
    joined_at: new Date().toISOString(),
  });

  return { session, app };
}

export async function verifyScreenshot({ appId, file, user }) {
  const apps = await base44.entities.App.filter({ id: appId });
  const app = apps[0];
  if (!app) throw new Error('App not found');

  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  const extractedText = await base44.integrations.Core.InvokeLLM({
    prompt: `Extract ALL text visible in this screenshot. Return the complete text as-is, including any app names, confirmation messages, buttons, and UI text. Do not summarize or interpret.`,
    file_urls: [file_url],
    response_json_schema: {
      type: 'object',
      properties: { extracted_text: { type: 'string' } },
    },
  });

  const text = extractedText.extracted_text || '';

  const CONFIRMATION_PHRASES = [
    "you're now a tester",
    'become a tester',
    'join the testing program',
    'you are now a tester',
    'accepted into the testing program',
    'you have joined',
    'tester for this app',
    'now a tester for',
    'joined the test',
    "you've joined",
    'testing program for',
  ];

  const normalize = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const fuzzyMatch = (source, target) => {
    const normalizedSource = normalize(source);
    const normalizedTarget = normalize(target);
    if (normalizedSource.includes(normalizedTarget)) return true;
    const targetWords = normalizedTarget.split(' ');
    const matchCount = targetWords.filter(
      (w) => w.length > 2 && normalizedSource.includes(w)
    ).length;
    return targetWords.length > 0 && matchCount / targetWords.length >= 0.6;
  };

  const hasConfirmation = CONFIRMATION_PHRASES.some((phrase) => fuzzyMatch(text, phrase));
  const hasAppName = fuzzyMatch(text, app.app_name);

  if (!hasConfirmation || !hasAppName) {
    let msg = 'The screenshot does not match the expected Google Play tester confirmation.';
    if (!hasConfirmation) msg += ' No tester confirmation message found.';
    if (!hasAppName) msg += ` App name "${app.app_name}" not found in screenshot.`;
    throw new Error(msg);
  }

  const sessions = await base44.entities.TestSession.filter({
    app_id: appId,
    tester_id: user.id,
  });
  const pendingSession = sessions.find((s) => s.status === 'PENDING_GOOGLE_VERIFICATION');
  if (!pendingSession) throw new Error('No pending session found');

  const now = new Date().toISOString();
  await base44.entities.TestSession.update(pendingSession.id, {
    status: 'ENROLLED',
    enrolled_at: now,
  });

  const enrolledCount = await recountTesters(appId);
  const updateData = { testers_enrolled: enrolledCount };
  if (app.status === 'WAITING_FOR_TESTERS') {
    updateData.status = 'TESTING';
    updateData.testing_start_date = now;
  }
  await base44.entities.App.update(appId, updateData);

  return { success: true, app };
}

export async function leaveTest({ sessionId, appId, user }) {
  const sessions = await base44.entities.TestSession.filter({ app_id: appId });
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) throw new Error('Session not found');
  if (session.tester_id !== user.id) throw new Error('Not your session');

  const enrolledCount = sessions.filter(
    (s) => (s.status === 'ENROLLED' || s.status === 'COMPLETED') && s.id !== sessionId
  ).length;

  if (enrolledCount < REQUIRED_TESTERS) {
    throw new Error(
      'Cannot leave: this would drop the tester count below the Google Play minimum of 12.'
    );
  }

  await base44.entities.TestSession.update(sessionId, {
    status: 'LEFT',
    left_at: new Date().toISOString(),
  });

  await base44.entities.App.update(appId, { testers_enrolled: enrolledCount });
}

export async function uploadApp({ appName, playstoreLink, description, user }) {
  const allApps = await base44.entities.App.list();
  const isBootstrap = allApps.length < BOOTSTRAP_LIMIT;
  const completedSince = user.tests_completed_since_last_upload || 0;

  if (!isBootstrap && completedSince < CREDITS_PER_UPLOAD) {
    throw new Error(
      `You need ${CREDITS_PER_UPLOAD - completedSince} more test credits to upload an app.`
    );
  }

  const app = await base44.entities.App.create({
    app_name: appName,
    playstore_link: playstoreLink,
    description,
    owner_id: user.id,
    owner_email: user.email,
    status: 'WAITING_FOR_TESTERS',
    testers_enrolled: 0,
    is_bootstrap: isBootstrap,
  });

  const newCredits = isBootstrap ? completedSince : completedSince - CREDITS_PER_UPLOAD;
  const newAppsTotal = (user.apps_uploaded_total || 0) + 1;

  await base44.auth.updateMe({
    tests_completed_since_last_upload: Math.max(newCredits, 0),
    apps_uploaded_total: newAppsTotal,
  });

  return { app, isBootstrap };
}

export async function recountTesters(appId) {
  const sessions = await base44.entities.TestSession.filter({ app_id: appId });
  return sessions.filter((s) => s.status === 'ENROLLED' || s.status === 'COMPLETED').length;
}

export async function fetchPlatformStats() {
  try {
    const [apps, users] = await Promise.all([
      base44.entities.App.list(),
      base44.entities.User.list(),
    ]);
    const completedApps = apps.filter((a) => a.status === 'COMPLETED').length;
    return {
      totalDevelopers: users.length,
      totalApps: apps.length,
      completedApps,
    };
  } catch {
    return { totalDevelopers: 0, totalApps: 0, completedApps: 0 };
  }
}

export { BOOTSTRAP_LIMIT, REQUIRED_TESTERS, TEST_DURATION_DAYS, CREDITS_PER_UPLOAD, MAX_ACTIVE_SESSIONS };
