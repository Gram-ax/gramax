#!/usr/bin/env bun
/**
 * Gramax Bugsnag CLI.
 *
 * Subcommands:
 *   stats    - list top errors with impact + stacktrace
 *   show     - examine one error by ID (full event detail)
 *   fix      - PATCH error operation=fix + POST comment (requires --yes)
 *   comment  - POST comment only (requires --yes)
 *
 * Auth: env BUGSNAG_API_PAT_KEY (Personal Auth Token).
 * Output: JSON to stdout; progress to stderr.
 */

const API_BASE = "https://api.bugsnag.com";
const API_VERSION = "2";
const RATE_LIMIT_BATCH = 8;
const RATE_LIMIT_DELAY_MS = 700;
const PLATFORM_PREFIX_RE = /\[(TAURI|NEXT|BROWSER|DOCPORTAL|STATIC|CLI)\]/;
const GRAMAX_PROJECT_RE = /^gramax/i;

type Platform = "tauri" | "next" | "browser" | "docportal" | "static" | "cli" | "unknown";

interface BugsnagOrg {
	id: string;
	slug: string;
	name: string;
}

interface BugsnagProject {
	id: string;
	slug: string;
	name: string;
}

interface BugsnagErrorRow {
	id: string;
	error_class: string;
	message: string;
	context?: string;
	events: number;
	users?: number;
	first_seen?: string;
	last_seen?: string;
	url?: string;
	html_url?: string;
	project_url?: string;
}

interface BugsnagEvent {
	id: string;
	url?: string;
	received_at?: string;
	context?: string;
	device?: Record<string, unknown>;
	app?: Record<string, unknown>;
	user?: Record<string, unknown>;
	request?: Record<string, unknown>;
	breadcrumbs?: Array<Record<string, unknown>>;
	exceptions?: Array<{
		errorClass?: string;
		message?: string;
		stacktrace?: Array<{
			file?: string;
			lineNumber?: number;
			columnNumber?: number;
			method?: string;
			inProject?: boolean;
		}>;
	}>;
	metaData?: Record<string, Record<string, unknown>>;
}

interface StatsOpts {
	since: string;
	top: number;
	projectFilter: string;
	platformFilter: Platform | "all";
	noStack: boolean;
	noSplit: boolean;
	pretty: boolean;
}

interface ShowOpts {
	errorId: string;
	projectFilter: string;
	pretty: boolean;
}

interface FixOpts {
	errorId: string;
	projectFilter: string;
	comment: string;
	releaseStage?: string;
	yes: boolean;
}

interface CommentOpts {
	errorId: string;
	projectFilter: string;
	message: string;
	yes: boolean;
}

function getPat(): string {
	const pat = process.env.BUGSNAG_API_PAT_KEY;
	if (!pat) {
		console.error("error: BUGSNAG_API_PAT_KEY is required (Personal Auth Token).");
		console.error("get one at app.bugsnag.com -> account settings -> personal auth tokens");
		process.exit(2);
	}
	return pat;
}

function headers(): HeadersInit {
	return {
		Authorization: `token ${getPat()}`,
		"Content-Type": "application/json",
		"X-Version": API_VERSION,
		Accept: "application/json",
	};
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
	const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
	const res = await fetch(url, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } });
	if (!res.ok) {
		const text = await res.text();
		const err: Error & { status?: number; url?: string } = new Error(
			`bugsnag api ${res.status}: ${text.slice(0, 400)}`,
		);
		err.status = res.status;
		err.url = url;
		throw err;
	}
	return (await res.json()) as T;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
	const parts: string[] = [];
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined) continue;
		parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
	}
	return parts.length ? `?${parts.join("&")}` : "";
}

function buildFilters(filters: Array<[string, string, string?]>): string {
	const parts: string[] = [];
	for (const [field, value, type] of filters) {
		parts.push(`filters[${encodeURIComponent(field)}][][value]=${encodeURIComponent(value)}`);
		if (type) parts.push(`filters[${encodeURIComponent(field)}][][type]=${encodeURIComponent(type)}`);
	}
	return parts.join("&");
}

function isoSince(input: string): string {
	const m = input.match(/^(\d+)([hd])$/);
	if (m) {
		const n = Number(m[1]);
		const ms = m[2] === "h" ? n * 3600_000 : n * 86400_000;
		return new Date(Date.now() - ms).toISOString();
	}
	const d = new Date(input);
	if (Number.isNaN(d.getTime())) {
		console.error(`error: invalid --since '${input}'. use 24h, 7d, 30d, or ISO date.`);
		process.exit(2);
	}
	return d.toISOString();
}

function pickPlatform(errorClass: string, message: string): Platform {
	const m = `${errorClass ?? ""} ${message ?? ""}`.match(PLATFORM_PREFIX_RE);
	return m ? (m[1].toLowerCase() as Platform) : "unknown";
}

async function fetchOrg(): Promise<BugsnagOrg> {
	const orgSlug = process.env.BUGSNAG_ORG;
	const orgs = await api<BugsnagOrg[]>("/user/organizations");
	if (!orgs.length) throw new Error("no organizations accessible with this token");
	return orgSlug ? (orgs.find((o) => o.slug === orgSlug || o.name === orgSlug) ?? orgs[0]) : orgs[0];
}

async function fetchProjects(org: BugsnagOrg): Promise<BugsnagProject[]> {
	return api<BugsnagProject[]>(`/organizations/${org.id}/projects${buildQuery({ per_page: 100 })}`);
}

function selectProjects(all: BugsnagProject[], filter: string): BugsnagProject[] {
	if (!filter || filter === "all") {
		const gramax = all.filter((p) => GRAMAX_PROJECT_RE.test(p.name));
		return gramax.length ? gramax : all;
	}
	const exact = all.find((p) => p.name.toLowerCase() === filter.toLowerCase());
	if (exact) return [exact];
	const sub = all.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));
	return sub;
}

function bugsnagErrorUrl(org: BugsnagOrg, project: BugsnagProject, errorId: string): string {
	const orgSlug = org.slug || encodeURIComponent(org.name);
	const projectSlug = project.slug || project.id;
	return `https://app.bugsnag.com/${orgSlug}/${projectSlug}/errors/${errorId}`;
}

async function listErrors(project: BugsnagProject, since: string, top: number): Promise<BugsnagErrorRow[]> {
	const filters = buildFilters([["event.since", since, "eq"]]);
	const q = buildQuery({ per_page: top, sort: "events", direction: "desc" });
	return api<BugsnagErrorRow[]>(`/projects/${project.id}/errors${q}&${filters}`);
}

async function getError(project: BugsnagProject, errorId: string): Promise<BugsnagErrorRow | null> {
	try {
		return await api<BugsnagErrorRow>(`/projects/${project.id}/errors/${errorId}`);
	} catch {
		return null;
	}
}

async function listEventsForError(
	project: BugsnagProject,
	errorId: string,
	since: string,
	limit = 100,
): Promise<BugsnagEvent[]> {
	const filters = buildFilters([
		["error", errorId, "eq"],
		["event.since", since, "eq"],
	]);
	const q = buildQuery({ per_page: limit, sort: "timestamp", direction: "desc", full_reports: "true" });
	return api<BugsnagEvent[]>(`/projects/${project.id}/events${q}&${filters}`);
}

async function getLatestEvent(project: BugsnagProject, errorId: string): Promise<BugsnagEvent | null> {
	try {
		return await api<BugsnagEvent>(`/projects/${project.id}/errors/${errorId}/latest_event`);
	} catch {
		return null;
	}
}

interface Frame {
	file: string;
	line?: number;
	col?: number;
	method: string;
	inProject: boolean;
}

function extractStacktrace(ev?: BugsnagEvent): { frames: Frame[]; topFrame: string } {
	const raw = ev?.exceptions?.[0]?.stacktrace ?? [];
	const frames: Frame[] = raw.map((f) => ({
		file: f.file ?? "",
		line: typeof f.lineNumber === "number" ? f.lineNumber : undefined,
		col: typeof f.columnNumber === "number" ? f.columnNumber : undefined,
		method: f.method ?? "",
		inProject: Boolean(f.inProject),
	}));
	const inProject = frames.filter((f) => f.inProject);
	const order = [...inProject, ...frames.filter((f) => !f.inProject)].slice(0, 15);
	const top = inProject[0] ?? frames[0];
	const topFrame = top ? `${top.file}${top.line ? `:${top.line}` : ""}${top.method ? ` ${top.method}` : ""}` : "";
	return { frames: order, topFrame };
}

async function chunked<T, R>(items: T[], size: number, fn: (it: T) => Promise<R>, delayMs: number): Promise<R[]> {
	const out: R[] = [];
	for (let i = 0; i < items.length; i += size) {
		const slice = items.slice(i, i + size);
		out.push(...(await Promise.all(slice.map(fn))));
		if (i + size < items.length && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
	}
	return out;
}

interface EventOut {
	project: string;
	platform: Platform;
	errorId: string;
	errorClass: string;
	message: string;
	count: number;
	countDisplayed: number;
	countUndisplayed: number;
	impact: number;
	firstSeen?: string;
	lastSeen?: string;
	topFrame: string;
	stacktrace: Frame[];
	latestEvent?: {
		id: string;
		received?: string;
		context?: string;
		device?: BugsnagEvent["device"];
		app?: BugsnagEvent["app"];
	};
	url: string;
}

async function enrichError(
	org: BugsnagOrg,
	project: BugsnagProject,
	err: BugsnagErrorRow,
	sinceIso: string,
	opts: { noStack: boolean; noSplit: boolean },
): Promise<EventOut> {
	let countDisplayed = 0;
	let countUndisplayed = err.events;
	let stack: { frames: Frame[]; topFrame: string } = { frames: [], topFrame: "" };
	let latest: EventOut["latestEvent"];

	try {
		if (!opts.noSplit) {
			const sample = await listEventsForError(project, err.id, sinceIso, 100);
			if (sample.length) {
				const first = sample[0];
				if (!opts.noStack) {
					stack = extractStacktrace(first);
					latest = {
						id: first.id,
						received: first.received_at,
						context: first.context,
						device: first.device,
						app: first.app,
					};
				}
				const displayed = sample.filter((e) => e.metaData?.user?.errorDisplayed === true).length;
				const ratio = displayed / sample.length;
				countDisplayed = Math.round(err.events * ratio);
				countUndisplayed = err.events - countDisplayed;
			}
		}
		if (!opts.noStack && stack.frames.length === 0) {
			const full = await getLatestEvent(project, err.id);
			if (full) {
				stack = extractStacktrace(full);
				if (!latest)
					latest = {
						id: full.id,
						received: full.received_at,
						context: full.context,
						device: full.device,
						app: full.app,
					};
			}
		}
	} catch (e) {
		process.stderr.write(`  warn: enrich ${err.id} failed: ${(e as Error).message}\n`);
	}

	const impact = opts.noSplit ? err.events / 100 : countDisplayed / 10 + countUndisplayed / 100;
	return {
		project: project.name,
		platform: pickPlatform(err.error_class, err.message),
		errorId: err.id,
		errorClass: err.error_class,
		message: err.message,
		count: err.events,
		countDisplayed,
		countUndisplayed,
		impact: Number(impact.toFixed(2)),
		firstSeen: err.first_seen,
		lastSeen: err.last_seen,
		topFrame: stack.topFrame,
		stacktrace: stack.frames,
		latestEvent: latest,
		url: err.html_url ?? bugsnagErrorUrl(org, project, err.id),
	};
}

async function resolveSingleProject(filter: string): Promise<{ org: BugsnagOrg; project: BugsnagProject }> {
	const org = await fetchOrg();
	const all = await fetchProjects(org);
	const matches = selectProjects(all, filter);
	if (matches.length === 0) {
		console.error(`error: no project matches '${filter}' in org '${org.name}'`);
		console.error(`available: ${all.map((p) => p.name).join(", ")}`);
		process.exit(2);
	}
	if (matches.length > 1) {
		console.error(`error: project '${filter}' is ambiguous: ${matches.map((p) => p.name).join(", ")}`);
		process.exit(2);
	}
	return { org, project: matches[0] };
}

async function runStats(opts: StatsOpts) {
	const sinceIso = isoSince(opts.since);
	const until = new Date().toISOString();
	process.stderr.write(`discovering projects...\n`);
	const org = await fetchOrg();
	const allProjects = await fetchProjects(org);
	const projects = selectProjects(allProjects, opts.projectFilter);
	if (!projects.length) {
		console.error(`error: no projects match '${opts.projectFilter}' in org '${org.name}'`);
		console.error(`available: ${allProjects.map((p) => p.name).join(", ")}`);
		process.exit(2);
	}
	process.stderr.write(`org: ${org.name} (${org.id})\n`);
	for (const p of projects) process.stderr.write(`  - ${p.name} (${p.id})\n`);

	const events: EventOut[] = [];
	const byProject: Record<string, number> = {};
	const byPlatform: Record<string, number> = {};

	for (const project of projects) {
		process.stderr.write(`[${project.name}] fetching top ${opts.top} errors since ${sinceIso}...\n`);
		const errors = await listErrors(project, sinceIso, opts.top);
		process.stderr.write(`[${project.name}] got ${errors.length} errors. enriching...\n`);

		const enriched = await chunked(
			errors,
			RATE_LIMIT_BATCH,
			(err) => enrichError(org, project, err, sinceIso, { noStack: opts.noStack, noSplit: opts.noSplit }),
			RATE_LIMIT_DELAY_MS,
		);

		for (const e of enriched) {
			if (opts.platformFilter !== "all" && e.platform !== opts.platformFilter) continue;
			events.push(e);
			byProject[e.project] = (byProject[e.project] ?? 0) + e.count;
			byPlatform[e.platform] = (byPlatform[e.platform] ?? 0) + e.count;
		}
	}

	events.sort((a, b) => b.impact - a.impact);

	const out = {
		window: { since: sinceIso, until },
		totals: { by_project: byProject, by_platform: byPlatform },
		events,
	};

	process.stdout.write(opts.pretty ? JSON.stringify(out, null, 2) : JSON.stringify(out));
	process.stdout.write("\n");
}

async function runShow(opts: ShowOpts) {
	process.stderr.write(`resolving project '${opts.projectFilter}'...\n`);
	const { org, project } = await resolveSingleProject(opts.projectFilter);
	process.stderr.write(`fetching error ${opts.errorId} from ${project.name}...\n`);
	const err = await getError(project, opts.errorId);
	if (!err) {
		console.error(`error: error ${opts.errorId} not found in '${project.name}'`);
		process.exit(3);
	}
	const full = await getLatestEvent(project, opts.errorId);
	const stack = extractStacktrace(full ?? undefined);

	const out = {
		project: project.name,
		platform: pickPlatform(err.error_class, err.message),
		errorId: err.id,
		errorClass: err.error_class,
		message: err.message,
		count: err.events,
		firstSeen: err.first_seen,
		lastSeen: err.last_seen,
		topFrame: stack.topFrame,
		stacktrace: stack.frames,
		latestEvent: full
			? {
					id: full.id,
					received: full.received_at,
					context: full.context,
					device: full.device,
					app: full.app,
					user: full.user,
					request: full.request,
					metaData: full.metaData,
					breadcrumbs: full.breadcrumbs?.slice(-20),
				}
			: null,
		url: err.html_url ?? bugsnagErrorUrl(org, project, err.id),
	};

	process.stdout.write(opts.pretty ? JSON.stringify(out, null, 2) : JSON.stringify(out));
	process.stdout.write("\n");
}

async function runFix(opts: FixOpts) {
	if (!opts.yes) {
		console.error(`would: fix error ${opts.errorId} in '${opts.projectFilter}' + comment "${opts.comment}"`);
		console.error(`rerun with --yes to apply.`);
		process.exit(2);
	}
	const { org, project } = await resolveSingleProject(opts.projectFilter);
	const operations: string[] = [];

	try {
		await api(`/projects/${project.id}/errors/${opts.errorId}`, {
			method: "PATCH",
			body: JSON.stringify({ operation: "fix", release_stage: opts.releaseStage ?? "production" }),
		});
		operations.push("fix");
	} catch (e) {
		const err = e as Error & { status?: number };
		process.stdout.write(
			`${JSON.stringify({ ok: false, step: "fix", status: err.status ?? 0, error: err.message })}\n`,
		);
		process.exit(3);
	}

	let commentObj: unknown = null;
	try {
		commentObj = await api<unknown>(`/projects/${project.id}/errors/${opts.errorId}/comments`, {
			method: "POST",
			body: JSON.stringify({ message: opts.comment }),
		});
		operations.push("comment");
	} catch (e) {
		const err = e as Error & { status?: number };
		process.stdout.write(
			`${JSON.stringify({ ok: false, step: "comment", status: err.status ?? 0, error: err.message, partial_operations: operations })}\n`,
		);
		process.exit(3);
	}

	process.stdout.write(
		`${JSON.stringify({
			ok: true,
			errorId: opts.errorId,
			project: project.name,
			operations,
			comment: commentObj,
			url: bugsnagErrorUrl(org, project, opts.errorId),
		})}\n`,
	);
}

async function runComment(opts: CommentOpts) {
	if (!opts.yes) {
		console.error(`would: comment on error ${opts.errorId} in '${opts.projectFilter}': "${opts.message}"`);
		console.error(`rerun with --yes to apply.`);
		process.exit(2);
	}
	const { org, project } = await resolveSingleProject(opts.projectFilter);
	try {
		const body = await api<unknown>(`/projects/${project.id}/errors/${opts.errorId}/comments`, {
			method: "POST",
			body: JSON.stringify({ message: opts.message }),
		});
		process.stdout.write(
			`${JSON.stringify({
				ok: true,
				errorId: opts.errorId,
				project: project.name,
				operations: ["comment"],
				comment: body,
				url: bugsnagErrorUrl(org, project, opts.errorId),
			})}\n`,
		);
	} catch (e) {
		const err = e as Error & { status?: number };
		process.stdout.write(
			`${JSON.stringify({ ok: false, step: "comment", status: err.status ?? 0, error: err.message })}\n`,
		);
		process.exit(3);
	}
}

function parseArgs(argv: string[]): { cmd: string; flags: Record<string, string | boolean> } {
	const cmd = argv[0] && !argv[0].startsWith("--") ? argv[0] : "stats";
	const rest = argv[0] && !argv[0].startsWith("--") ? argv.slice(1) : argv;
	const flags: Record<string, string | boolean> = {};
	for (let i = 0; i < rest.length; i++) {
		const a = rest[i];
		if (!a.startsWith("--")) continue;
		const key = a.slice(2);
		const next = rest[i + 1];
		if (next === undefined || next.startsWith("--")) flags[key] = true;
		else {
			flags[key] = next;
			i++;
		}
	}
	return { cmd, flags };
}

function usage(exitCode = 2): never {
	const stream = exitCode === 0 ? process.stdout : process.stderr;
	stream.write(
		`bugsnag.ts - Gramax Bugsnag CLI

usage:
  bugsnag.ts stats [--since 30d|24h|7d|ISO] [--top 20] [--project <name>|all]
                   [--platform tauri|next|browser|docportal|static|cli|all]
                   [--no-stack] [--no-split] [--pretty]

  bugsnag.ts show --error <id> --project <name> [--pretty]

  bugsnag.ts fix --error <id> --project <name> --comment "<text>"
                 [--release-stage <stage>] --yes

  bugsnag.ts comment --error <id> --project <name> --message "<text>" --yes

projects:
  --project accepts the full Bugsnag project name (case-insensitive),
  e.g. "Gramax-PROD" or "Gramax-DEV". Substring match used if no exact hit.
  For stats: --project all (default) scans every project whose name starts with "Gramax".

env:
  BUGSNAG_API_PAT_KEY      (required) Personal Auth Token from app.bugsnag.com
  BUGSNAG_ORG              (optional) override org auto-pick by slug or name
`,
	);
	process.exit(exitCode);
}

function requireString(flags: Record<string, string | boolean>, key: string): string {
	const v = flags[key];
	if (typeof v !== "string" || v.length === 0) return "";
	return v;
}

async function main() {
	const argv = process.argv.slice(2);
	if (argv[0] === "--help" || argv[0] === "-h") usage(0);
	if (argv.length === 0) usage();
	const { cmd, flags } = parseArgs(argv);

	switch (cmd) {
		case "stats": {
			const opts: StatsOpts = {
				since: requireString(flags, "since") || "30d",
				top: typeof flags.top === "string" ? Number(flags.top) : 20,
				projectFilter: requireString(flags, "project") || "all",
				platformFilter: (requireString(flags, "platform") || "all") as StatsOpts["platformFilter"],
				noStack: Boolean(flags["no-stack"]),
				noSplit: Boolean(flags["no-split"]),
				pretty: Boolean(flags.pretty),
			};
			if (!Number.isFinite(opts.top) || opts.top <= 0) {
				console.error(`error: --top must be a positive number`);
				process.exit(2);
			}
			await runStats(opts);
			break;
		}
		case "show": {
			const errorId = requireString(flags, "error");
			const projectFilter = requireString(flags, "project");
			if (!errorId || !projectFilter) {
				console.error("error: show requires --error and --project");
				process.exit(2);
			}
			await runShow({ errorId, projectFilter, pretty: Boolean(flags.pretty) });
			break;
		}
		case "fix": {
			const errorId = requireString(flags, "error");
			const projectFilter = requireString(flags, "project");
			const comment = requireString(flags, "comment");
			if (!errorId || !projectFilter || !comment) {
				console.error("error: fix requires --error, --project, --comment");
				process.exit(2);
			}
			await runFix({
				errorId,
				projectFilter,
				comment,
				releaseStage: requireString(flags, "release-stage") || undefined,
				yes: Boolean(flags.yes),
			});
			break;
		}
		case "comment": {
			const errorId = requireString(flags, "error");
			const projectFilter = requireString(flags, "project");
			const message = requireString(flags, "message");
			if (!errorId || !projectFilter || !message) {
				console.error("error: comment requires --error, --project, --message");
				process.exit(2);
			}
			await runComment({ errorId, projectFilter, message, yes: Boolean(flags.yes) });
			break;
		}
		default:
			usage();
	}
}

main().catch((e: Error) => {
	console.error(`error: ${e.message}`);
	process.exit(1);
});

export {};
