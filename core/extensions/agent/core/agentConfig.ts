class AgentConfig {
	maxStoredSessions: number | null = null;
	maxSteps: number | null = null;
	toolPreviewMaxChars = 8_000;
	readMaxChars = 60_000;
	searchHitsLimit = 15;
	searchSnippetsPerHit = 2;
	searchSnippetSize = 160;
	searchTimeoutMs = 120_000;
	searchIndexProgressWaitMs = 300_000;
	repoExcludedPathPatterns = [/(^|\/)\.git(\/|$)/i];
	allowedAttachmentExtensions = [
		"txt",
		"md",
		"markdown",
		"json",
		"xml",
		"yaml",
		"yml",
		"csv",
		"html",
		"htm",
		"log",
		"ts",
		"tsx",
		"js",
		"jsx",
		"css",
		"sql",
		"ini",
		"toml",
		"docx",
		"xlsx",
		"pdf",
	];
	binaryAttachmentExtensions = ["docx", "xlsx", "pdf"];
}

export const agentConfig = new AgentConfig();
