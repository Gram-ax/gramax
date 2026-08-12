import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { useApi, useDeferApi } from "@core-ui/hooks/useApi";
import { refreshPage } from "@core-ui/utils/initGlobalFuncs";
import type { AgentEvent } from "@ext/agent/core/events";
import { agentLlmConfig } from "@ext/agent/llm/agentLlmConfig";
import t from "@ext/localization/locale/translate";
import { useWorkspaceAi } from "@ext/workspace/components/useWorkspaceAi";
import { useCallback, useRef, useState } from "react";
import { getApiKey } from "../store/AgentStore";
import type { SessionStatePayload } from "../types/chat";
import { useAgentAttachments } from "./useAgentAttachments";
import { getAgentEnabledSnapshot } from "./useAgentChatVisibility";
import { useAgentPollTick } from "./useAgentPollTick";
import { useDraftPersistence } from "./useDraftPersistence";

type MessageSendPayload = {
	sessionId?: string;
	error?: string;
	message?: string;
};

const SEND_OPTS = {
	method: Method.POST,
	mime: MimeTypes.json,
	consumeError: true,
} as const;

const CANCEL_OPTS = {
	method: Method.POST,
	mime: MimeTypes.json,
	consumeError: true,
} as const;

const errorText = (data: MessageSendPayload | null, fallback: string): string => {
	switch (data?.error) {
		case "session_not_found":
			return t("agent.chat-error.session-not-found");
		case "session_cancelled":
			return t("agent.chat-error.session-cancelled");
		case "empty_message":
			return t("agent.chat-error.empty-message");
		case "agent_failed":
			return t("agent.chat-error.agent-failed");
		default:
			return fallback;
	}
};

const getWorkspaceAiDirectUrl = (baseUrl: string | undefined) => {
	if (!baseUrl) return undefined;
	const trimmed = baseUrl.replace(/\/+$/, "");
	return `${trimmed}/openaiapi/chat/completions`;
};

type Args = {
	sessionId: string | null;
	sessionLoading: boolean;
	openCatalogName: string | null;
	openItemPath: string | null;
	fetchSessionState: () => Promise<SessionStatePayload | null>;
	flushSessionEvents: (data: SessionStatePayload | null) => AgentEvent[];
	startPolling: (tick: () => Promise<void> | void) => void;
	stopPolling: () => void;
	appendError: (message: string) => void;
};

export const useAgentSender = ({
	sessionId,
	sessionLoading,
	openCatalogName,
	openItemPath,
	fetchSessionState,
	flushSessionEvents,
	startPolling,
	stopPolling,
	appendError,
}: Args) => {
	const [browserAllowed, setBrowserAllowedState] = useState(false);
	const browserAllowedRef = useRef(browserAllowed);
	browserAllowedRef.current = browserAllowed;
	const workspacePath = WorkspaceService.current()?.path ?? "";
	const { getData: getWorkspaceAiData } = useWorkspaceAi(workspacePath);

	const { call: callSetBrowserAllowed } = useDeferApi<unknown>({
		url: (api) => api.getAgentBrowserSetAllowedUrl(),
		opts: { method: Method.POST, mime: MimeTypes.json, consumeError: true },
	});

	const setBrowserAllowed = useCallback(
		(allowed: boolean) => {
			setBrowserAllowedState(allowed);
			void callSetBrowserAllowed({ opts: { body: JSON.stringify({ allowed }) } });
		},
		[callSetBrowserAllowed],
	);

	const flushAndRefresh = useCallback(
		(state: SessionStatePayload | null) => {
			for (const event of flushSessionEvents(state)) {
				if ("refreshPage" in event && event.refreshPage) void refreshPage();
			}
		},
		[flushSessionEvents],
	);

	const {
		sending,
		setSending,
		sendingRef,
		showAgentThinking,
		setShowAgentThinkingIfChanged,
		sessionSnapshotRef,
		pollTickRef,
	} = useAgentPollTick({
		sessionId,
		sessionLoading,
		openCatalogName,
		openItemPath,
		fetchSessionState,
		flushAndRefresh,
		startPolling,
		stopPolling,
	});

	const {
		draft,
		setDraft,
		selectedSkillName,
		setSelectedSkillName,
		draftAttachments,
		setDraftAttachments,
		hydrating,
		flushDraft,
		persistDraft,
		clearOnSend,
		restoreBaseline,
	} = useDraftPersistence(sessionId, sendingRef);

	const { attachments, setAttachments } = useAgentAttachments({
		sessionId,
		draftAttachments,
		setDraftAttachments,
		hydrating,
	});

	const { call: callSend } = useDeferApi<MessageSendPayload>({
		url: (api) => api.getAgentMessageSendUrl(),
		opts: SEND_OPTS,
	});
	const { call: callCancel } = useApi<void>({
		url: (api) => api.getAgentSessionCancelUrl(sessionId ?? ""),
		opts: CANCEL_OPTS,
	});

	const send = useCallback(async () => {
		const text = draft.trim();
		if (!text || sending) return;

		const pickedAttachments = attachments;
		const pickedSkill = selectedSkillName;
		const pickedDraftAttachments = draftAttachments;
		const restoreDraft = () => {
			setDraft(text);
			setAttachments(pickedAttachments);
			setDraftAttachments(pickedDraftAttachments);
			if (sessionId) {
				persistDraft(sessionId, text, pickedSkill, pickedDraftAttachments);
				restoreBaseline(text, pickedSkill, pickedDraftAttachments);
			}
		};
		setSending(true);
		sendingRef.current = true;
		sessionSnapshotRef.current = null;
		setShowAgentThinkingIfChanged(true);
		flushDraft();
		setDraft("");
		setAttachments([]);
		setDraftAttachments([]);

		try {
			const activeId = sessionId;
			if (!activeId) {
				restoreDraft();
				appendError(t("agent.chat-error.no-active-session"));
				return;
			}

			clearOnSend(activeId, pickedSkill);

			startPolling(() => void pollTickRef.current());
			const workspaceAiData = await getWorkspaceAiData().catch(() => undefined);
			const agentEnabled = getAgentEnabledSnapshot();
			const apiUrl = agentEnabled
				? agentLlmConfig.directUrl
				: (getWorkspaceAiDirectUrl(workspaceAiData?.aiApiUrl) ?? "");
			const apiToken = agentEnabled ? (getApiKey() ?? "") : (workspaceAiData?.aiToken ?? "");

			let httpErrorBody: MessageSendPayload | null = null;
			let networkErrored = false;
			const data = await callSend({
				opts: {
					body: JSON.stringify({
						sessionId: activeId,
						text,
						apiUrl,
						apiToken,
						attachments: pickedAttachments,
						openCatalogName,
						openItemPath,
						useSkill: pickedSkill,
					}),
				},
				onError: (err) => {
					if (err instanceof Error) networkErrored = true;
					else httpErrorBody = (err as MessageSendPayload | null) ?? null;
				},
			});
			if (networkErrored) {
				restoreDraft();
				appendError(t("agent.chat-error.agent-failed"));
				return;
			}

			if (!data) {
				restoreDraft();
				appendError(errorText(httpErrorBody, t("agent.chat-error.send-message-error")));
				return;
			}

			if (data.error) {
				restoreDraft();
				appendError(errorText(data, t("agent.chat-error.get-response-error")));
				return;
			}
		} catch {
			restoreDraft();
			appendError(t("agent.chat-error.agent-failed"));
		} finally {
			sendingRef.current = false;
			await pollTickRef.current();
		}
	}, [
		appendError,
		attachments,
		callSend,
		clearOnSend,
		draft,
		draftAttachments,
		flushDraft,
		openCatalogName,
		openItemPath,
		persistDraft,
		pollTickRef,
		restoreBaseline,
		selectedSkillName,
		sending,
		sendingRef,
		sessionId,
		sessionSnapshotRef,
		setAttachments,
		setDraft,
		setDraftAttachments,
		setSending,
		startPolling,
		setShowAgentThinkingIfChanged,
		getWorkspaceAiData,
	]);

	const cancel = useCallback(async () => {
		if (!sessionId) return;
		sendingRef.current = false;
		setShowAgentThinkingIfChanged(false);
		sessionSnapshotRef.current = null;
		stopPolling();
		await callCancel();
		await pollTickRef.current();
	}, [
		callCancel,
		pollTickRef,
		sendingRef,
		sessionId,
		sessionSnapshotRef,
		stopPolling,
		setShowAgentThinkingIfChanged,
	]);

	return {
		draft,
		setDraft,
		attachments,
		setAttachments,
		selectedSkillName,
		setSelectedSkillName,
		browserAllowed,
		setBrowserAllowed,
		send,
		cancel,
		sending,
		hydrating,
		showAgentThinking,
	};
};
