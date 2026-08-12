// Preloaded only when jest is about to run under bun (see scripts/run-tests.ts).
// jest-runtime copies the statics of `node:module`'s Module onto its own subclass with
// `Object.entries(Module).forEach(([k, v]) => (Subclass[k] = v))`. In bun `Module.prototype`
// is an enumerable own property (in node it is not), so it lands in that loop and the
// assignment to a readonly `prototype` throws `TypeError: Attempted to assign to readonly
// property` before a single test starts. Hiding it from enumeration is enough.
const { Module } = require("node:module");
const vm = require("node:vm");

const descriptor = Object.getOwnPropertyDescriptor(Module, "prototype");
if (descriptor?.enumerable && descriptor.configurable)
	Object.defineProperty(Module, "prototype", { ...descriptor, enumerable: false });

// jest reads vm's module classes as "this runtime can load ES modules" and then refuses to
// `require` any dependency whose package.json says `"type": "module"` — ics-ui-kit, for one.
// Node only exposes them under `--experimental-vm-modules`, so on CI jest never takes that
// branch and babel-jest transpiles those packages to CommonJS instead. Bun always exposes
// them; hiding them keeps the container on the same code path as CI.
for (const name of ["SyntheticModule", "SourceTextModule"]) {
	if (typeof vm[name] === "function") delete vm[name];
}

// Not covered here: suites carrying an `@jest-environment node` docblock still fail in a
// whole-project run — `@jest/transform` loads that environment through a `pirates` hook whose
// `module._compile` call bun rejects ("Expected CommonJS module to have a function wrapper",
// bun's own internals, not patchable from here). They pass when the suite is run on its own,
// and CI runs on node, so the full job is unaffected.
