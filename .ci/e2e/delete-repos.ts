#!/usr/bin/env bun

/** biome-ignore-all lint/suspicious/noExplicitAny: 123 */

import assert from "node:assert";

const GITLAB_URL = process.env.GX_E2E_GITLAB_URL;
const GITLAB_TOKEN = process.env.GX_E2E_GITLAB_TOKEN;

assert(GITLAB_URL, "GX_E2E_GITLAB_URL was not provided");
assert(GITLAB_TOKEN, "GX_E2E_GITLAB_TOKEN was not provided");

const headers = { "PRIVATE-TOKEN": GITLAB_TOKEN };

async function fetchAllProjects(): Promise<any[]> {
	const projects: any[] = [];
	let page = 1;

	while (true) {
		const url = `https://${GITLAB_URL}/api/v4/projects?membership=true&per_page=100&page=${page}`;
		const res = await fetch(url, { headers });

		if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status} ${await res.text()}`);

		const batch = await res.json();
		if (!batch.length) break;

		projects.push(...batch);
		page++;
	}

	return projects;
}

async function deleteProject(id: number, name: string): Promise<void> {
	const deleteUrl = `https://${GITLAB_URL}/api/v4/projects/${id}?permanently_delete=true`;
	const res = await fetch(deleteUrl, { method: "DELETE", headers });

	if (res.ok || res.status === 202) {
		console.log(`  deleted: ${name} (id=${id})`);
	} else {
		const body = await res.text();
		console.error(`  FAILED: ${name} (id=${id}) - ${res.status} ${body}`);
	}
}

const projects = await fetchAllProjects();
const targets = projects.filter(
	(p) =>
		!p.name.includes("deletion_scheduled") && (p.name.startsWith("test-push-") || p.path.startsWith("test-push-")),
);

if (!targets.length) {
	console.log("No projects matching test-push-* found.");
	process.exit(0);
}

console.log(`Found ${targets.length} project(s) to delete:`);
for (const p of targets) console.log(`  - ${p.path_with_namespace} (id=${p.id})`);

const dryRun = process.argv.includes("--dry-run");
if (dryRun) {
	console.log("\nDry run - no deletions performed.");
	process.exit(0);
}

console.log("\nDeleting...");

for (const p of targets) {
	await new Promise((resolve) => setTimeout(resolve, 200));
	await deleteProject(p.id, p.path_with_namespace);
}

console.log("Done.");
