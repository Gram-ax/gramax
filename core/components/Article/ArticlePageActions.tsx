// biome-ignore lint/style/noRestrictedImports: tailwind migration is out of scope
import styled from "@emotion/styled";
import { useAgentChatVisibility } from "@ext/agent/components/hooks/useAgentChatVisibility";
import ChatToggleButton from "@ext/agent/components/panel/ChatToggleButton";
import ThemeToggle from "@ext/Theme/components/ThemeToggle";
import type { HTMLAttributes } from "react";

export type ArticlePageActionsProps = HTMLAttributes<HTMLDivElement>;

const ArticlePageActions = (props: ArticlePageActionsProps) => {
	const { showToggle } = useAgentChatVisibility();

	return (
		<div {...props} data-qa="top-menu">
			<ThemeToggle />
			{showToggle && <ChatToggleButton />}
		</div>
	);
};

export default styled(ArticlePageActions)`
	display: flex;
	align-items: center;
	flex-direction: row;
	gap: var(--distance-actions);
	justify-content: space-between;
`;
