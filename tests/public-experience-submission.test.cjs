/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness registers the TypeScript loader before requiring source modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, filename);
const root = path.join(__dirname, '../src/features/experience');
const { questions } = require(`${root}/config/questions.ts`);
const { buildExperienceSubmission, ExperienceSubmissionError } = require(`${root}/submission/build-experience-submission.ts`);
const { submitExperience, ExperienceSubmitError } = require(`${root}/submission/submit-experience.ts`);
const { PROJECT_DOCUMENT_REQUIRED, projectFilesError } = require(`${root}/submission/file-policy.ts`);

function answers() {
  return Object.fromEntries(questions.map(q => [q.id, q.type === 'scale' ? 1
    : q.type === 'multi-choice' ? [q.options[0].value]
    : q.type === 'single-choice' ? q.options[0].value : 'Project notes']));
}
const file = (name = 'documento.pdf', type = 'application/pdf') =>
  new File(['document bytes'], name, { type, lastModified: 123456 });
const build = files => buildExperienceSubmission({ submissionId: 'stable-id', answers: answers(), files });
function apiUrl(t) {
  const oldUrl = process.env.NEXT_PUBLIC_COTIZADOR_API_URL;
  process.env.NEXT_PUBLIC_COTIZADOR_API_URL = 'http://test.invalid';
  t.after(() => { if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_COTIZADOR_API_URL; else process.env.NEXT_PUBLIC_COTIZADOR_API_URL = oldUrl; });
}

test('builder rejects zero documents without making notes required', () => {
  assert.throws(() => build([]), error => error instanceof ExperienceSubmissionError
    && error.field === 'files' && error.message === PROJECT_DOCUMENT_REQUIRED);
  const input = answers();
  delete input.project_documents;
  assert.equal(buildExperienceSubmission({ submissionId: 'id', answers: input, files: [file()] }).payload.project.notes, undefined);
});

test('submit rejects zero documents before fetch even for a directly constructed draft', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('must not fetch'); });
  const draft = build([file()]);
  draft.files = [];
  draft.payload.files = [];
  await assert.rejects(submitExperience(draft), { message: PROJECT_DOCUMENT_REQUIRED });
  assert.equal(fetch.mock.callCount(), 0);
});

test('actual UI send handler returns before UUID, builder or SUBMITTING with no files', async () => {
  const source = fs.readFileSync(`${root}/components/experience-flow.tsx`, 'utf8');
  const ast = ts.createSourceFile('flow.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let body;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'sendProject') body = node.body.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(body);
  const unexpected = () => assert.fail('No side effects allowed');
  const submitting = { current: false };
  const dependencies = { submitting, submissionState: 'IDLE', projectFiles: [],
    setSubmissionState: unexpected, createExperienceSubmissionId: unexpected,
    buildExperienceSubmission: unexpected, submitExperience: unexpected };
  await new Function(...Object.keys(dependencies), `return async () => ${body}`)(...Object.values(dependencies))();
  assert.equal(submitting.current, false);
});

for (const [name, type, expected] of [
  ['documento.pdf', 'application/pdf', 'application/pdf'],
  ['documento.pdf', '', 'application/pdf'],
  ['foto.jpg', 'image/jpeg', 'image/jpeg'],
  ['foto.jpg', '', 'image/jpeg'],
  ['plano.png', '', 'image/png'],
  ['planilla.xlsx', '', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ['documento.pdf', 'application/octet-stream', 'application/pdf'],
  ['foto.jpeg', 'image/jpg', 'image/jpeg'],
]) test(`normalizes ${name} (${type || 'empty MIME'}) without changing bytes`, async () => {
  const original = file(name, type);
  const draft = build([original]);
  const normalized = draft.files[0];
  assert.equal(draft.payload.files[0].contentType, expected);
  assert.equal(normalized.type, expected);
  assert.equal(normalized.name, original.name);
  assert.equal(normalized.lastModified, original.lastModified);
  assert.deepEqual(await normalized.arrayBuffer(), await original.arrayBuffer());
  if (type === expected) assert.equal(normalized, original);
});

test('unsupported extension and incompatible MIME are rejected before fetch', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', () => assert.fail('must not fetch'));
  assert.throws(() => build([file('run.exe', 'application/octet-stream')]));
  assert.throws(() => build([file('renamed.pdf', 'application/x-msdownload')]));
  const draft = build([file()]);
  draft.files = [file('renamed.pdf', 'application/x-msdownload')];
  await assert.rejects(submitExperience(draft), ExperienceSubmitError);
  assert.equal(fetch.mock.callCount(), 0);
});

test('retry retains normalized File objects, order, payload and MIME in actual multipart', async t => {
  apiUrl(t);
  const draft = build([file('documento.pdf', ''), file('foto.jpg', '')]);
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    requests.push(init.body);
    if (requests.length === 1) throw new Error('network');
    return new Response(JSON.stringify({ status: 'RECEIVED', submissionId: 'stable-id' }), { status: 201 });
  });
  await assert.rejects(submitExperience(draft), ExperienceSubmitError);
  await submitExperience(draft);
  assert.equal(requests[0].get('payload'), requests[1].get('payload'));
  for (const request of requests) {
    request.getAll('files').forEach((f, i) => assert.equal(f, draft.files[i]));
    const body = await new Request('http://test.invalid', { method: 'POST', body: request }).text();
    assert.match(body, /Content-Type: application\/pdf/i);
    assert.match(body, /Content-Type: image\/jpeg/i);
  }
});

test('canonical backend documents-required error has helpful copy', async t => {
  apiUrl(t);
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    processingErrorCode: 'PUBLIC_EXPERIENCE_DOCUMENTS_REQUIRED',
  }), { status: 422 }));
  await assert.rejects(submitExperience(build([file()])), { message: PROJECT_DOCUMENT_REQUIRED });
});

test('file count, size and total limits remain unchanged', () => {
  const metadata = { name: 'doc.pdf', type: 'application/pdf', size: 20 * 1024 * 1024 };
  assert.equal(projectFilesError(Array(5).fill(metadata)), undefined);
  assert.ok(projectFilesError(Array(6).fill(metadata)));
  assert.ok(projectFilesError([{ ...metadata, size: metadata.size + 1 }]));
  assert.ok(projectFilesError([{ ...metadata, size: 0 }]));
});
