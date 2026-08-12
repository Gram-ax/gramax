import { useEffect, useRef, useState } from "react";
import type { AgentDraftAttachment } from "../types/chat";
export const useAgentAttachments = ({
	sessionId,
	draftAttachments,
	setDraftAttachments,
	hydrating,
}: {
	sessionId: string | null;
	draftAttachments: AgentDraftAttachment[];
	setDraftAttachments: (a: AgentDraftAttachment[]) => void;
	hydrating: boolean;
}) => {
	const [attachments, setAttachments] = useState<AgentDraftAttachment[]>([]);
	const restoredRef = useRef(false);

	useEffect(() => {
		if (!sessionId) return;
		setAttachments([]);
		restoredRef.current = false;
	}, [sessionId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: sync serialized attachments for draft persistence
	useEffect(() => {
		setDraftAttachments(attachments);
	}, [attachments]);

	useEffect(() => {
		if (hydrating || restoredRef.current) return;
		restoredRef.current = true;
		if (!draftAttachments.length) return;
		setAttachments(draftAttachments);
	}, [hydrating, draftAttachments]);

	return { attachments, setAttachments };
};
