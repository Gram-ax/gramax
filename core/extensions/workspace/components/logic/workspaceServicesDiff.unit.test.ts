import { getWorkspaceServicesDiff } from "./workspaceServicesDiff";

describe("getWorkspaceServicesDiff", () => {
	it("should return empty object if no services differ", () => {
		const orig = { "web-editor": { endpoint: "https://a" }, auth: { endpoint: "https://b" } };
		const next = { "web-editor": { endpoint: "https://a" }, auth: { endpoint: "https://b" } };
		expect(getWorkspaceServicesDiff(orig, next)).toEqual({});
	});

	it("should return patch with changed services", () => {
		const orig = { "web-editor": { endpoint: "https://a" }, auth: { endpoint: "https://b" } };
		const next = {
			"web-editor": { endpoint: "https://a" },
			auth: { endpoint: "https://c" },
			"git-proxy": { endpoint: "https://d" },
		};
		expect(getWorkspaceServicesDiff(orig, next)).toEqual({
			"services.auth.endpoint": "https://c",
			"services.git-proxy.endpoint": "https://d",
		});
	});

	it("should handle missing original services as empty string", () => {
		const orig = {};
		const next = { "web-editor": { endpoint: "https://a" } };
		expect(getWorkspaceServicesDiff(orig, next)).toEqual({
			"services.web-editor.endpoint": "https://a",
		});
	});
});
