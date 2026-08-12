import { useDeferApi } from "@core-ui/hooks/useApi";
import AgentSkillService from "@ext/agent/components/skills/AgentSkillService";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import { memo, useCallback } from "react";
import { useChatInput } from "../store/ChatStore";
import { ChatInput } from "./ChatInput";

const SKILL_FETCH_OPTS = { consumeError: true } as const;

export const ChatFooter = memo(() => {
	const {
		attachments,
		inputDisabled,
		isSending,
		catalogName,
		selectedSkillName,
		browserAllowed,
		onAttachmentsChange,
		onSubmit,
		onCancel,
		onSkillChange,
		onBrowserAllowedChange,
	} = useChatInput();

	const { skills } = AgentSkillService.value;
	const { call: fetchSkillItems } = useDeferApi<ProviderItemProps[]>({ opts: SKILL_FETCH_OPTS });

	const handleSkillTagClick = useCallback(async () => {
		if (!selectedSkillName) return;

		let skill = Array.from(skills.values()).find((s) => s.title === selectedSkillName);

		if (!skill) {
			const items = await fetchSkillItems({ url: (api) => api.getArticleListInGramaxDir("agentSkill") });
			if (items) {
				AgentSkillService.setItems(items);
				skill = items.find((s) => s.title === selectedSkillName);
			}
		}

		if (skill) AgentSkillService.openItem(skill);
	}, [selectedSkillName, skills, fetchSkillItems]);

	return (
		<div className="shrink-0 pb-4 px-4">
			<ChatInput
				attachments={attachments}
				browserAllowed={browserAllowed}
				catalogName={catalogName}
				disabled={inputDisabled}
				onAttachmentsChange={onAttachmentsChange}
				onBrowserAllowedChange={onBrowserAllowedChange}
				onCancel={onCancel ?? undefined}
				onSkillChange={onSkillChange}
				onSkillTagClick={handleSkillTagClick}
				onSubmit={onSubmit}
				selectedSkillName={selectedSkillName}
				sending={isSending}
			/>
		</div>
	);
});
