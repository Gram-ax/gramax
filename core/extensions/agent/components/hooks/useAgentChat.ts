import Path from "@core/FileProvider/Path/Path";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { mapAgentTimelineToViewModel } from "@ext/agent/components/utils/agentTimeline";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { setChatState } from "../store/ChatStore";
import { useAgentSender } from "./useAgentSender";
import { useAgentSession } from "./useAgentSession";
import { useAgentTimeline } from "./useAgentTimeline";
import { useSessionPolling } from "./useSessionPolling";

const useAgentOpenCatalogPaths = (): { openCatalogName: string | null; openItemPath: string | null } => {
	const articlePath = useArticlePropsStore((s) => s.data.ref.path);
	return useMemo(() => {
		const openPath = new Path(articlePath);
		const openCatalogName = openPath.rootDirectory.value || null;
		const openItemPath = openCatalogName ? openPath.rootDirectory.subDirectory(openPath)?.value || null : null;
		return { openCatalogName, openItemPath };
	}, [articlePath]);
};

export const useAgentChat = (sessionId: string | null) => {
	const { openCatalogName, openItemPath } = useAgentOpenCatalogPaths();

	const { timeline, applyEvents, replaceEvents, appendError, reset } = useAgentTimeline();

	const { start: startPolling, stop: stopPolling } = useSessionPolling();

	const { sessionLoading, sessionError, fetchSessionState, flushSessionEvents } = useAgentSession({
		sessionId,
		openCatalogName,
		openItemPath,
		applyEvents,
		replaceEvents,
		resetTimeline: reset,
		stopPolling,
	});

	const {
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
	} = useAgentSender({
		sessionId,
		sessionLoading,
		openCatalogName,
		openItemPath,
		fetchSessionState,
		flushSessionEvents,
		startPolling,
		stopPolling,
		appendError,
	});

	const vm = useMemo(() => mapAgentTimelineToViewModel(timeline), [timeline]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: clear stale chat before paint
	useLayoutEffect(() => {
		setChatState({
			messages: [],
			streamingMessageId: null,
			streamText: "",
			showAgentThinking: false,
		});
	}, [sessionId]);

	const sendRef = useRef(send);
	sendRef.current = send;
	const cancelRef = useRef(cancel);
	cancelRef.current = cancel;

	// biome-ignore lint/correctness/useExhaustiveDependencies: it's ok
	useEffect(() => {
		setChatState({
			onDraftChange: setDraft,
			onAttachmentsChange: setAttachments,
			onSkillChange: setSelectedSkillName,
			onBrowserAllowedChange: setBrowserAllowed,
			onSubmit: () => void sendRef.current(),
			onCancel: () => void cancelRef.current(),
		});
	}, []);

	useEffect(() => {
		setChatState({
			messages: vm.messages,
			streamingMessageId: vm.streamingMessageId,
			streamText: vm.streamText,
			showAgentThinking,
		});
	}, [vm.messages, vm.streamingMessageId, vm.streamText, showAgentThinking]);

	useEffect(() => {
		setChatState({
			draft,
			attachments,
			selectedSkillName,
			browserAllowed,
			isSending: sending,
			hydrating,
			catalogName: openCatalogName,
		});
	}, [draft, attachments, selectedSkillName, browserAllowed, sending, openCatalogName, hydrating]);

	return {
		timeline,
		draft,
		setDraft,
		attachments,
		setAttachments,
		selectedSkillName,
		setSelectedSkillName,
		send,
		cancel,
		sending,
		showAgentThinking,
		sessionLoading,
		sessionError,
	};
};
