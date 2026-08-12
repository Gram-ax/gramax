import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionStatePayload } from "../types/chat";
import {
	type AgentSessionSnapshot,
	shouldShowAgentThinkingSpinner,
	snapshotAgentSession,
} from "../utils/agentSessionActivity";

type Args = {
	sessionId: string | null;
	sessionLoading: boolean;
	openCatalogName: string | null;
	openItemPath: string | null;
	fetchSessionState: () => Promise<SessionStatePayload | null>;
	flushAndRefresh: (state: SessionStatePayload | null) => void;
	startPolling: (tick: () => Promise<void> | void) => void;
	stopPolling: () => void;
};

export const useAgentPollTick = ({
	sessionId,
	sessionLoading,
	openCatalogName,
	openItemPath,
	fetchSessionState,
	flushAndRefresh,
	startPolling,
	stopPolling,
}: Args) => {
	const [sending, setSending] = useState(false);
	const [showAgentThinking, setShowAgentThinking] = useState(false);
	const sendingRef = useRef(false);
	const sessionSnapshotRef = useRef<AgentSessionSnapshot | null>(null);

	const setShowAgentThinkingIfChanged = useCallback((next: boolean) => {
		setShowAgentThinking((prev) => (prev === next ? prev : next));
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset sending state on session change
	useEffect(() => {
		if (!sessionId) return;
		setSending(false);
		sendingRef.current = false;
		setShowAgentThinkingIfChanged(false);
		sessionSnapshotRef.current = null;
	}, [sessionId]);

	const pollTick = useCallback(async (): Promise<boolean> => {
		if (!sessionId) return false;
		const state = await fetchSessionState();
		const currentSnapshot = snapshotAgentSession(state);
		flushAndRefresh(state);
		setShowAgentThinkingIfChanged(
			shouldShowAgentThinkingSpinner(currentSnapshot, { isSending: sendingRef.current }),
		);
		sessionSnapshotRef.current = currentSnapshot;

		const busy = !!state?.processing || sendingRef.current;
		setSending(busy);

		if (!busy) {
			stopPolling();
			setShowAgentThinkingIfChanged(false);
		}

		return busy;
	}, [sessionId, fetchSessionState, flushAndRefresh, stopPolling, setShowAgentThinkingIfChanged]);

	const pollTickRef = useRef(pollTick);
	pollTickRef.current = pollTick;

	// biome-ignore lint/correctness/useExhaustiveDependencies: resume poll after session load completes
	useEffect(() => {
		if (!sessionId || sessionLoading) return;
		void pollTickRef.current().then((busy) => {
			if (busy) startPolling(() => void pollTickRef.current());
		});
	}, [sessionId, sessionLoading, openCatalogName, openItemPath]);

	return {
		sending,
		setSending,
		sendingRef,
		showAgentThinking,
		setShowAgentThinkingIfChanged,
		sessionSnapshotRef,
		pollTickRef,
	};
};
