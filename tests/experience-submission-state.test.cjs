/* eslint-disable @typescript-eslint/no-require-imports -- Uses existing Node/TypeScript harness, no UI test framework. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const filename = path.join(__dirname, '../src/features/experience/components/experience-submission-state.tsx');
// Evaluate the real presentation component and JSX. Only effects/refs and the
// already-tested scheduling child are isolated; callbacks remain real props.
function SchedulingStub({ context }) {
  return React.createElement('section', { 'data-mode': context.mode },
    React.createElement('p', { role: 'alert' }, 'No fue posible consultar disponibilidad.'));
}
const compiled = new Module(filename, module);
compiled.filename = filename;
compiled.paths = module.paths;
compiled.require = name => {
  if (name === 'react') return { ...React, useEffect: () => {}, useRef: () => ({ current: null }) };
  if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
  if (name === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
  if (name.includes('scheduling-calendar')) return { SchedulingCalendar: SchedulingStub };
  return require(name);
};
compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);
const { ExperienceSubmissionState } = compiled.exports;
const context = mode => ({ mode, advisorCode: 'DIRECT_CONTACT', submissionId: 'received-id' });
const noop = () => {};
function tree(overrides = {}) {
  return ExperienceSubmissionState({ state: 'SUCCESS', error: '', agenda: null, onRetry: noop, onEdit: noop, ...overrides });
}
function nodes(element) {
  if (!element || typeof element !== 'object') return [];
  const children = element.props?.children;
  return [element, ...(Array.isArray(children) ? children.flat() : [children]).flatMap(nodes)];
}
const html = props => renderToStaticMarkup(tree(props));

test('SUBMITTING shows editorial status, busy indicator and no actions/calendar', () => {
  const view = tree({ state: 'SUBMITTING', agenda: React.createElement(SchedulingStub, { context: context('IN_PERSON') }) });
  const output = renderToStaticMarkup(view);
  assert.match(output, /Estamos preparando tu proyecto/);
  assert.match(output, /aria-busy="true"/);
  assert.equal(nodes(view).some(node => node.type === 'button' || node.type === SchedulingStub), false);
});
test('ERROR keeps retry and edit callbacks and honest session copy', () => {
  let retries = 0, edits = 0;
  const view = tree({ state: 'ERROR', error: 'Revisa los documentos.', onRetry: () => retries++, onEdit: () => edits++ });
  const output = renderToStaticMarkup(view);
  assert.match(output, /Tu información sigue aquí/); assert.match(output, /role="alert"/);
  assert.match(output, /mientras sigas en esta página/);
  const buttons = nodes(view).filter(node => node.type === 'button');
  assert.equal(buttons.length, 2);
  buttons[0].props.onClick(); buttons[1].props.onClick();
  assert.equal(retries, 1); assert.equal(edits, 1);
});
test('SUCCESS without scheduling renders received closure and home link', () => {
  const view = tree();
  assert.equal(nodes(view).some(node => node.type === SchedulingStub), false);
  const output = renderToStaticMarkup(view);
  assert.match(output, /PROYECTO RECIBIDO/); assert.match(output, /Ya conocemos un poco mejor tu proyecto/);
  assert.match(output, /href="\/"/);
});
for (const mode of ['IN_PERSON', 'VIRTUAL']) test(`SUCCESS mounts ${mode} without invoking submission callbacks`, () => {
  const unexpected = () => assert.fail('presentation must not send a project');
  const view = tree({ agenda: React.createElement(SchedulingStub, { context: context(mode) }), onRetry: unexpected, onEdit: unexpected });
  const calendar = nodes(view).find(node => node.type === SchedulingStub);
  assert.deepEqual(calendar.props.context, context(mode));
  const output = renderToStaticMarkup(view);
  // A scheduling error must coexist with the project receipt, never become submission ERROR.
  assert.match(output, /PROYECTO RECIBIDO/); assert.match(output, /No fue posible consultar disponibilidad/);
  assert.doesNotMatch(output, /NO PUDIMOS COMPLETAR EL ENVÍO/);
});
test('PLANNING displays agenda without claiming project was received or calling retry', () => {
  const agenda = React.createElement(SchedulingStub, { context: context('IN_PERSON') });
  const unexpected = () => assert.fail('planning must not register a project');
  const view = tree({ state: 'PLANNING', agenda, onRetry: unexpected, onEdit: unexpected });
  const output = renderToStaticMarkup(view);
  assert.match(output, /Demos forma a tu proyecto/);
  assert.doesNotMatch(output, /PROYECTO RECIBIDO/);
  assert.equal(nodes(view).find(node => node.type === SchedulingStub), agenda);
});
test('planning-to-received retains agenda subtree key so in-flight booking is not unmounted', () => {
  const agenda = React.createElement(SchedulingStub, { context: context('IN_PERSON') });
  const before = nodes(tree({ state: 'PLANNING', agenda })).find(node => node.key === 'agenda');
  const after = nodes(tree({ state: 'SUCCESS', agenda })).find(node => node.key === 'agenda');
  assert.ok(before); assert.ok(after); assert.equal(before.type, after.type);
  assert.match(html({ state: 'SUCCESS' }), /Ya conocemos un poco mejor tu proyecto/);
});
