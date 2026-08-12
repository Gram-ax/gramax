import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import t from "@ext/localization/locale/translate";
import type { ReactNode } from "react";

interface AgentSkillsItemProps {
	children?: ReactNode;
}

const AgentSkillsItem = ({ children }: AgentSkillsItemProps) => {
	const { onToggleTab } = useCatalogActionsContext();

	return (
		<CatalogItem
			renderLabel={(Item) => (
				<Item onSelect={() => onToggleTab(LeftNavigationTab.AgentSkills)}>
					<Icon code="square-chevron-right" />
					{t("agent.skills.name")}
				</Item>
			)}
		>
			{children}
		</CatalogItem>
	);
};

export default AgentSkillsItem;
