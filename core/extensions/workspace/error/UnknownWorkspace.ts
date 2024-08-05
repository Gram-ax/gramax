export default class WorkspaceMissingPath extends Error {
	constructor(name?: string) {
		super(`Workspace ${name || "unknown"} missing path`);
	}
}
