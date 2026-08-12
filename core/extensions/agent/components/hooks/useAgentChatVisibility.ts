import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { feature } from "@ext/toggleFeatures/features";
import { useWorkspaceAi } from "@ext/workspace/components/useWorkspaceAi";
import { useEffect, useState, useSyncExternalStore } from "react";

export const AGENT_ENABLED_KEY = "agent-enabled";
export const AGENT_BROWSER_REVEAL_ENABLED_KEY = "agent-browser-reveal-enabled";

const subscribeAgentEnabled = (notify: () => void): (() => void) => {
	if (typeof window === "undefined") return () => {};
	window.addEventListener("storage", notify);
	return () => window.removeEventListener("storage", notify);
};

export const getAgentEnabledSnapshot = (): boolean =>
	typeof window !== "undefined" && window.localStorage?.getItem(AGENT_ENABLED_KEY) === "true";

export const getAgentBrowserRevealEnabledSnapshot = (): boolean =>
	typeof window !== "undefined" && window.localStorage?.getItem(AGENT_BROWSER_REVEAL_ENABLED_KEY) === "true";

const getAgentEnabledServerSnapshot = (): boolean => false;

const useAgentEnabled = (): boolean =>
	useSyncExternalStore(subscribeAgentEnabled, getAgentEnabledSnapshot, getAgentEnabledServerSnapshot);

const useAgentBrowserRevealEnabled = (): boolean =>
	useSyncExternalStore(subscribeAgentEnabled, getAgentBrowserRevealEnabledSnapshot, getAgentEnabledServerSnapshot);

export interface AgentChatVisibility {
	showToggle: boolean;
	showGear: boolean;
	showBrowserReveal: boolean;
}

export const useAgentChatVisibility = (): AgentChatVisibility => {
	const featureEnabled = feature("agent-chat");
	const workspacePath = WorkspaceService.current()?.path ?? "";
	const { getData } = useWorkspaceAi(workspacePath);
	const [hasServerConfig, setHasServerConfig] = useState(false);
	const agentEnabled = useAgentEnabled();
	const browserRevealEnabled = useAgentBrowserRevealEnabled();

	useEffect(() => {
		if (!featureEnabled || !workspacePath) {
			setHasServerConfig(false);
			return;
		}

		let cancelled = false;
		void (async () => {
			const data = await getData();
			if (!cancelled) setHasServerConfig(Boolean(data?.aiApiUrl && data?.aiToken));
		})();

		return () => {
			cancelled = true;
		};
	}, [featureEnabled, workspacePath, getData]);

	if (!featureEnabled) return { showToggle: false, showGear: false, showBrowserReveal: false };

	return {
		showToggle: agentEnabled || hasServerConfig,
		showGear: agentEnabled,
		showBrowserReveal: browserRevealEnabled,
	};
};
