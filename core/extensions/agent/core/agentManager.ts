import type { AppConfig } from "@app/config/AppConfig";
import Path from "@core/FileProvider/Path/Path";
import type { AgentBrowserHost } from "../browser/browserHost";
import { createAgentBrowserHost } from "../browser/createAgentBrowserHost";
import { AgentLlmClient } from "../llm";
import { AgentToolRegistry } from "../mcp/registry";
import { AgentFileStore } from "./agentFileStore";
import { AgentAttachmentStore } from "./attachmentStore";
import { AgentSessionStore } from "./sessionStore";

export default class AgentManager {
	readonly fileStore: AgentFileStore;
	readonly sessions: AgentSessionStore;
	readonly attachments: AgentAttachmentStore;
	readonly toolRegistry: AgentToolRegistry;
	readonly browserHost: AgentBrowserHost;
	browserAllowed = false;

	constructor(config: AppConfig) {
		const agentDataPath = config.paths.data.join(new Path("agent"));
		this.fileStore = new AgentFileStore(agentDataPath);
		this.sessions = new AgentSessionStore(this.fileStore);
		this.attachments = new AgentAttachmentStore(this.fileStore);
		this.toolRegistry = new AgentToolRegistry();
		this.browserHost = createAgentBrowserHost();
	}

	getLlmClient(apiUrl?: string, apiKey?: string): AgentLlmClient {
		return AgentLlmClient.create(apiUrl ?? "", apiKey ?? "");
	}
}
