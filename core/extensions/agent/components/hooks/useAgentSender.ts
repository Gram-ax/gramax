import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { useApi, useDeferApi } from "@core-ui/hooks/useApi";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionStatePayload } from "../store/AgentStore";

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

function errorText(data: MessageSendPayload | null, fallback: string): string {
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
}

type Args = {
	sessionId: string | null;
	openItemPath?: string;
	fetchSessionState: () => Promise<SessionStatePayload | null>;
	flushSessionEvents: (data: SessionStatePayload | null) => void;
	startPolling: (tick: () => Promise<void> | void) => void;
	stopPolling: () => void;
	appendError: (message: string) => void;
	setAwaitingAgentEvent: (value: boolean) => void;
};

export const useAgentSender = ({
	sessionId,
	openItemPath,
	fetchSessionState,
	flushSessionEvents,
	startPolling,
	stopPolling,
	appendError,
	setAwaitingAgentEvent,
}: Args) => {
	const [draft, setDraft] = useState("");
	const [sending, setSending] = useState(false);
	const sendingRef = useRef(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on session change
	useEffect(() => {
		setSending(false);
		sendingRef.current = false;
	}, [sessionId]);

	const { call: callSend } = useDeferApi<MessageSendPayload>({
		url: (api) => api.getAgentMessageSendUrl(),
		opts: SEND_OPTS,
	});
	const { call: callCancel } = useApi<void>({
		url: (api) => api.getAgentSessionCancelUrl(sessionId ?? ""),
		opts: CANCEL_OPTS,
	});

	const pollTick = useCallback(async () => {
		if (!sessionId) return;
		const state = await fetchSessionState();
		flushSessionEvents(state);
		if (!state?.processing && !sendingRef.current) {
			stopPolling();
			setSending(false);
		}
	}, [sessionId, fetchSessionState, flushSessionEvents, stopPolling]);

	const send = useCallback(async () => {
		const text = draft.trim();
		if (!text || sending) return;

		setSending(true);
		sendingRef.current = true;
		setAwaitingAgentEvent(true);
		setDraft("");

		try {
			if (!sessionId) {
				setDraft(text);
				appendError(t("agent.chat-error.no-active-session"));
				setAwaitingAgentEvent(false);
				return;
			}

			startPolling(pollTick);

			let httpErrorBody: MessageSendPayload | null = null;
			let networkErrored = false;
			const data = await callSend({
				opts: {
					body: JSON.stringify({ sessionId, text, openItemPath }),
				},
				onError: (err) => {
					if (err instanceof Error) networkErrored = true;
					else httpErrorBody = (err as MessageSendPayload | null) ?? null;
				},
			});

			if (networkErrored) {
				setDraft(text);
				appendError(t("agent.chat-error.agent-failed"));
				setAwaitingAgentEvent(false);
				return;
			}

			if (!data) {
				setDraft(text);
				appendError(errorText(httpErrorBody, t("agent.chat-error.send-message-error")));
				setAwaitingAgentEvent(false);
				return;
			}

			if (data.error) {
				setDraft(text);
				appendError(errorText(data, t("agent.chat-error.get-response-error")));
				setAwaitingAgentEvent(false);
				return;
			}
		} catch {
			setDraft(text);
			appendError(t("agent.chat-error.agent-failed"));
			setAwaitingAgentEvent(false);
		} finally {
			sendingRef.current = false;
			if (sessionId) {
				const state = await fetchSessionState();
				flushSessionEvents(state);
			}
			stopPolling();
			setSending(false);
		}
	}, [
		appendError,
		callSend,
		draft,
		fetchSessionState,
		flushSessionEvents,
		openItemPath,
		pollTick,
		sending,
		sessionId,
		setAwaitingAgentEvent,
		startPolling,
		stopPolling,
	]);

	const cancel = useCallback(async () => {
		if (!sessionId || !sending) return;

		setAwaitingAgentEvent(false);
		setSending(false);
		sendingRef.current = false;
		stopPolling();

		await callCancel();
	}, [callCancel, sending, sessionId, setAwaitingAgentEvent, stopPolling]);

	return { draft, setDraft, send, cancel, sending };
};
