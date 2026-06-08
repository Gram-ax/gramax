// biome-ignore lint/style/noRestrictedImports: tailwind migration is out of scope
import styled from "@emotion/styled";
import ChatToggleButton from "@ext/agent/components/panel/ChatToggleButton";
import ThemeToggle from "@ext/Theme/components/ThemeToggle";
import { feature } from "@ext/toggleFeatures/features";
import type { HTMLAttributes } from "react";

export type ArticlePageActionsProps = HTMLAttributes<HTMLDivElement>;

const ArticlePageActions = (props: ArticlePageActionsProps) => {
	return (
		<div {...props} data-qa="top-menu">
			<ThemeToggle />
			{feature("agent-chat") && <ChatToggleButton />}
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
