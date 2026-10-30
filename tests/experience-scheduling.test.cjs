/* eslint-disable @typescript-eslint/no-require-imports -- Existing Node/TypeScript test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const previousLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(
  // Next enforces this marker at build time; allow isolated server unit tests in Node.
  fs.readFileSync(filename, 'utf8').replace(/import "server-only";/g, ''),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, filename);
const source = path.join(__dirname, '../src');
const { schedulingMode, addDays, bogotaDate } = require(`${source}/features/experience/scheduling/config/scheduling.ts`);
const { MockCalendarProvider } = require(`${source}/server/scheduling/mock-calendar-provider.ts`);
const { getAvailability } = require(`${source}/server/scheduling/availability-service.ts`);
const { createBooking } = require(`${source}/server/scheduling/booking-service.ts`);
const { schedulingFailure } = require(`${source}/server/scheduling/http.ts`);
const { getCalendarProvider } = require(`${source}/server/scheduling/provider.ts`);
const { GET } = require(`${source}/app/api/scheduling/availability/route.ts`);
const { POST } = require(`${source}/app/api/scheduling/bookings/route.ts`);
const { getSchedulingAvailability, createSchedulingBooking, SchedulingApiError } = require(`${source}/features/experience/scheduling/api/scheduling-api.ts`);
if (previousLoader) require.extensions['.ts'] = previousLoader;
else delete require.extensions['.ts'];
const now = new Date('2026-11-02T13:00:00Z'); // Monday, 08:00 Bogota.
const query = { mode: 'IN_PERSON', advisorCode: 'DIRECT_CONTACT', from: '2026-11-03', to: '2026-11-09' };
const input = { mode: 'IN_PERSON', advisorCode: 'DIRECT_CONTACT', submissionId: '11111111-1111-4111-8111-111111111111',
  bookingRequestId: '22222222-2222-4222-8222-222222222222', startsAt: '2026-11-03T10:00:00-05:00' };
const bad = fn => assert.throws(fn, e => e.status === 400 && e.code === 'invalid_request');
function uiHandler(name, dependencies) {
  const text = fs.readFileSync(`${source}/features/experience/scheduling/components/scheduling-calendar.tsx`, 'utf8');
  const ast = ts.createSourceFile('calendar.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let body;
  const visit = node => { if (ts.isFunctionDeclaration(node) && node.name?.text === name) body = node.body.getText(ast); ts.forEachChild(node, visit); };
  visit(ast); assert.ok(body);
  return new Function(...Object.keys(dependencies), `return ${name === 'confirm' ? 'async ' : ''}(date) => ${body}`)(...Object.values(dependencies));
}

function flowHandler(name, dependencies) {
  const code = fs.readFileSync(`${source}/features/experience/components/experience-flow.tsx`, 'utf8');
  const ast = ts.createSourceFile('flow.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let body;
  const visit = node => { if (ts.isFunctionDeclaration(node) && node.name?.text === name) body = node.body.getText(ast); ts.forEachChild(node, visit); };
  visit(ast); assert.ok(body);
  return new Function(...Object.keys(dependencies), `return ${name === 'sendProject' ? 'async ' : ''}() => ${body}`)(...Object.values(dependencies));
}
function calendarDeps(overrides = {}) {
  return { pending: { current: false }, requestId: { current: null }, selectedSlot: input.startsAt, status: 'READY',
    advisorSelected: true, submissionId: undefined, advisorCode: input.advisorCode, mode: input.mode,
    onRegisterProject: async () => input.submissionId, setBooking: () => {}, setRegistering: () => {},
    setBookingUncertain: () => {}, setMessage: () => {}, setConfirmed: () => {}, reload: () => {},
    SchedulingApiError, ...overrides };
}
test('mapping retains existing opt-out; navigation opens agenda before any submission', () => {
  assert.equal(schedulingMode('centro_exp'), 'IN_PERSON'); assert.equal(schedulingMode('reunion_virt'), 'VIRTUAL');
  for (const value of ['no_dispuesto', '', undefined, []]) assert.equal(schedulingMode(value), null);
  for (const mode of ['IN_PERSON', 'VIRTUAL']) {
    let opened = false;
    flowHandler('continueToConfirmation', { canAdvance: true, mode, setPlanning: value => { opened = value; },
      sendProject: () => assert.fail('must not submit before planning') })();
    assert.equal(opened, true);
  }
  let submitted = 0;
  flowHandler('continueToConfirmation', { canAdvance: true, mode: null, sendProject: () => submitted++ })();
  assert.equal(submitted, 1);
});
test('calendar date change clears stale slot and logical request', () => {
  const requestId = { current: 'old' }; let selection;
  uiHandler('chooseDate', { requestId, onSelectionChange: value => { selection = value; }, setMessage: () => {} })('2026-11-05');
  assert.deepEqual(selection, { date: '2026-11-05', slot: '' }); assert.equal(requestId.current, null);
});
test('confirmation waits for receipt; failed submission never calls booking', async () => {
  let release, calls = 0, message;
  const deps = calendarDeps({ onRegisterProject: () => new Promise(resolve => { release = resolve; }),
    setMessage: value => { message = value; }, createSchedulingBooking: async () => { calls++; } });
  const first = uiHandler('confirm', deps)();
  await uiHandler('confirm', deps)(); // double click while persistence is pending
  assert.equal(calls, 0); release(undefined); await first;
  assert.equal(calls, 0); assert.match(message, /No se pudo completar el envío/);
});
test('booking is called only with the accepted submission ID and selected advisor', async () => {
  const order = [];
  await uiHandler('confirm', calendarDeps({
    onRegisterProject: async () => { order.push('registered'); return input.submissionId; },
    createSchedulingBooking: async value => { assert.equal(value.submissionId, input.submissionId); assert.equal(value.advisorCode, input.advisorCode); order.push('booking'); return { mock: true }; },
  }))();
  assert.deepEqual(order, ['registered', 'booking']);
});
test('booking failure preserves request ID; retry with received project never registers it again', async () => {
  let message, result, calls = 0, receivedId;
  const deps = calendarDeps({
    onRegisterProject: async () => { receivedId = input.submissionId; calls++; return receivedId; },
    setMessage: value => { message = value; }, setConfirmed: value => { result = value; },
    createSchedulingBooking: async () => { throw new Error('uncertain network result'); },
  });
  await uiHandler('confirm', deps)();
  const id = deps.requestId.current;
  assert.equal(calls, 1); assert.ok(id); assert.match(message, /Proyecto recibido, agendamiento pendiente/);
  deps.submissionId = receivedId;
  deps.onRegisterProject = () => assert.fail('must not register again');
  deps.createSchedulingBooking = async value => { assert.equal(value.bookingRequestId, id); return { status: 'CONFIRMED', mock: true }; };
  await uiHandler('confirm', deps)(); assert.equal(result.status, 'CONFIRMED');
});
test('calendar conflict clears selection via reload without re-registering received project', async () => {
  let reloads = 0, message;
  await uiHandler('confirm', calendarDeps({ submissionId: input.submissionId,
    onRegisterProject: () => assert.fail('project already exists'),
    createSchedulingBooking: async () => { throw new SchedulingApiError(409, 'slot_unavailable'); },
    reload: () => reloads++, setMessage: value => { message = value; },
  }))();
  assert.equal(reloads, 1); assert.match(message, /Elige otro horario/);
});
test('actual send handler caches received ID and retains original files/draft on retry', async () => {
  const file = new File(['plan'], 'plan.pdf', { type: 'application/pdf' });
  const photo = new File(['photo'], 'photo.png', { type: 'image/png' });
  const draft = { payload: { submissionId: input.submissionId }, files: [file], ideaPhoto: photo };
  let httpCalls = 0;
  const states = [], receipt = { current: null };
  const deps = { receivedSubmission: receipt, submitting: { current: false }, projectFiles: [file],
    submissionDraft: { current: draft }, setSubmissionError: () => {}, setSubmissionLocked: () => {},
    setReceivedId: value => assert.equal(value, input.submissionId), setSubmissionState: value => states.push(value),
    submitExperience: async value => { httpCalls++; assert.equal(value, draft); assert.equal(value.files[0], file); assert.equal(value.ideaPhoto, photo); } };
  assert.equal(await flowHandler('sendProject', deps)(), input.submissionId);
  assert.equal(await flowHandler('sendProject', deps)(), input.submissionId);
  assert.equal(httpCalls, 1); assert.deepEqual(states, ['SUBMITTING', 'SUCCESS']);
});
test('failed project registration retries the exact draft and never marks received early', async () => {
  class SubmitError extends Error {}
  const draft = { payload: { submissionId: input.submissionId }, files: [new File(['plan'], 'plan.pdf')], ideaPhoto: new File(['photo'], 'photo.png') };
  const receipt = { current: null }, states = [], sent = [];
  const deps = { receivedSubmission: receipt, submitting: { current: false }, projectFiles: draft.files,
    submissionDraft: { current: draft }, setSubmissionError: () => {}, setSubmissionLocked: () => {},
    setReceivedId: () => {}, setSubmissionState: value => states.push(value), ExperienceSubmitError: SubmitError,
    ExperienceSubmissionError: SubmitError, submitExperience: async value => { sent.push(value); throw new SubmitError('offline'); } };
  assert.equal(await flowHandler('sendProject', deps)(), undefined);
  assert.equal(receipt.current, null); assert.deepEqual(states, ['SUBMITTING', 'ERROR']);
  assert.equal(deps.submissionDraft.current, draft);
  deps.submitExperience = async value => { sent.push(value); };
  assert.equal(await flowHandler('sendProject', deps)(), input.submissionId);
  assert.equal(sent.length, 2); assert.equal(sent[0], sent[1]); assert.equal(receipt.current, input.submissionId);
});
test('edit navigation keeps selection and attachments; received project cannot be edited/recreated', () => {
  const draft = { current: {} }, updates = [], receivedSubmission = { current: null };
  const deps = { receivedSubmission, submitting: { current: false }, submissionDraft: draft,
    setSubmissionLocked: value => updates.push(['locked', value]), setSubmissionState: value => updates.push(['state', value]),
    setSubmissionError: () => {}, setPlanning: value => updates.push(['planning', value]) };
  flowHandler('editProject', deps)();
  assert.equal(draft.current, null); assert.ok(updates.some(([key, value]) => key === 'planning' && value === false));
  // Actual body has no answers/files/photo/selection setters; those stay in ExperienceFlow.
  receivedSubmission.current = input.submissionId; updates.length = 0;
  flowHandler('editProject', deps)(); assert.deepEqual(updates, []);
});
test('availability is deterministic, timezone explicit, weekends and fixed busy slots excluded', async () => {
  const provider = new MockCalendarProvider();
  const result = await getAvailability(query, provider, now);
  assert.deepEqual(result, await getAvailability(query, new MockCalendarProvider(), now));
  assert.equal(result.timezone, 'America/Bogota');
  assert.equal(result.dates.length, 7);
  const slots = result.dates[0].slots;
  assert.equal(slots.length, 7);
  assert.deepEqual(slots[0], { startsAt: '2026-11-03T09:00:00-05:00', endsAt: '2026-11-03T10:00:00-05:00' });
  assert.equal(slots.at(-1).endsAt, '2026-11-03T17:00:00-05:00');
  assert.ok(slots.every(s => !s.startsAt.includes('T12:')));
  assert.equal(result.dates.find(d => d.date === '2026-11-07').slots.length, 0);
  assert.equal(result.dates.find(d => d.date === '2026-11-08').slots.length, 0);
  const closed = await getAvailability({ ...query, from: '2026-11-15', to: '2026-11-15' }, provider, now);
  assert.deepEqual(closed.dates[0].slots, []);
});
test('range, dates, modes, advisor and horizon are validated', () => {
  const provider = new MockCalendarProvider();
  for (const change of [{ from: '2026-11-10' }, { from: '2026-11-01' }, { to: '2027-01-01' },
    { from: '2026-02-30' }, { to: 'not-a-date' }, { mode: 'OTHER' }, { advisorCode: '' }, { advisorCode: 'UNKNOWN' }]) {
    bad(() => getAvailability({ ...query, ...change }, provider, now));
  }
  bad(() => getAvailability(null, provider, now));
});
test('notice and date arithmetic do not depend on host timezone', async () => {
  assert.equal(bogotaDate(new Date('2026-11-03T02:00:00Z')), '2026-11-02');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  const result = await getAvailability({ ...query, from: '2026-11-02', to: '2026-11-03' }, new MockCalendarProvider(), new Date('2026-11-02T15:30:00Z'));
  assert.deepEqual(result.dates[0].slots, []);
  assert.equal(result.dates[1].slots[0].startsAt, '2026-11-03T11:00:00-05:00');
});
test('valid booking replays exact result; changed idempotency payload conflicts', async () => {
  const provider = new MockCalendarProvider();
  const result = await createBooking(input, provider, now);
  assert.equal(result.status, 'CONFIRMED'); assert.equal(result.mock, true); assert.equal(result.meetingUrl, null);
  assert.deepEqual(result, await createBooking(input, provider, now));
  await assert.rejects(createBooking({ ...input, startsAt: '2026-11-03T11:00:00-05:00' }, provider, now), e => e.code === 'idempotency_conflict');
  const available = await getAvailability(query, provider, now);
  assert.ok(available.dates[0].slots.every(slot => slot.startsAt !== input.startsAt));
});
test('booking validates required identifiers, exact instant and policy', () => {
  for (const change of [{ submissionId: '' }, { submissionId: 'client-name' }, { advisorCode: '' }, { mode: 'OTHER' },
    { bookingRequestId: '' }, { startsAt: '2026-11-03T10:30:00-05:00' }, { startsAt: '2026-11-03T10:00:00Z' },
    { startsAt: '2026-11-03T18:00:00-05:00' }, { startsAt: '2026-11-07T10:00:00-05:00' },
    { startsAt: '2026-11-02T10:00:00-05:00' }, { startsAt: '2027-01-01T10:00:00-05:00' }]) {
    bad(() => createBooking({ ...input, ...change }, new MockCalendarProvider(), now));
  }
});
test('slot lost after availability produces stable HTTP 409; both modes share advisor', async () => {
  const provider = new MockCalendarProvider();
  assert.ok((await getAvailability(query, provider, now)).dates[0].slots.some(s => s.startsAt === input.startsAt));
  provider.occupy(input.advisorCode, input.startsAt);
  try { await createBooking({ ...input, mode: 'VIRTUAL' }, provider, now); assert.fail('must conflict'); }
  catch (error) { const response = schedulingFailure(error); assert.equal(response.status, 409); assert.deepEqual(await response.json(), { error: 'slot_unavailable' }); }
});
test('concurrent requests cannot double book; identical retries converge', async () => {
  const p = new MockCalendarProvider();
  const results = await Promise.allSettled([createBooking(input, p, now), createBooking({ ...input, bookingRequestId: '33333333-3333-4333-8333-333333333333' }, p, now)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const retryProvider = new MockCalendarProvider();
  const replies = await Promise.all([createBooking(input, retryProvider, now), createBooking(input, retryProvider, now)]);
  assert.deepEqual(replies[0], replies[1]);
});
test('production and unsupported providers fail closed, including actual routes', async t => {
  const oldNode = process.env.NODE_ENV, oldProvider = process.env.SCHEDULING_PROVIDER;
  t.after(() => { if (oldNode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldNode;
    if (oldProvider === undefined) delete process.env.SCHEDULING_PROVIDER; else process.env.SCHEDULING_PROVIDER = oldProvider; });
  process.env.NODE_ENV = 'production'; process.env.SCHEDULING_PROVIDER = 'mock';
  assert.throws(getCalendarProvider, e => e.code === 'scheduling_not_configured');
  for (const response of [await GET(new Request('http://test.invalid/api/scheduling/availability')), await POST(new Request('http://test.invalid/api/scheduling/bookings', { method: 'POST' }))]) {
    assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'scheduling_not_configured' });
  }
  process.env.NODE_ENV = 'development'; process.env.SCHEDULING_PROVIDER = 'google';
  assert.throws(getCalendarProvider, e => e.status === 503);
  delete process.env.SCHEDULING_PROVIDER;
  assert.ok(getCalendarProvider() instanceof MockCalendarProvider);
  assert.equal((await POST(new Request('http://test.invalid/api/scheduling/bookings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' }))).status, 400);
  const from = bogotaDate(new Date());
  const valid = await GET(new Request(`http://test.invalid/api/scheduling/availability?mode=VIRTUAL&advisorCode=DIRECT_CONTACT&from=${from}&to=${addDays(from, 3)}`));
  assert.equal(valid.status, 200); assert.equal(valid.headers.get('cache-control'), 'no-store');
});
test('client API preserves IDs on retry, transports advisor and exposes conflict', async t => {
  const original = global.fetch; t.after(() => { global.fetch = original; });
  const calls = [];
  global.fetch = async (url, options) => { calls.push({ url, options }); return Response.json({ error: 'slot_unavailable' }, { status: 409 }); };
  for (let i = 0; i < 2; i++) await assert.rejects(createSchedulingBooking(input), e => e instanceof SchedulingApiError && e.status === 409);
  assert.equal(calls[0].options.body, calls[1].options.body);
  assert.equal(JSON.parse(calls[0].options.body).submissionId, input.submissionId);
  await assert.rejects(getSchedulingAvailability(query));
  assert.ok(calls[2].url.includes('advisorCode=DIRECT_CONTACT'));
});
