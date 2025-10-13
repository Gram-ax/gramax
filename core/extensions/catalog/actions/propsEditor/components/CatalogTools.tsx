import Icon from "@components/Atoms/Icon";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSub } from "@ui-kit/Dropdown";

interface CatalogToolsProps {
	toggleTab: (tab: LeftNavigationTab) => void;
	isAiEnabled: boolean;
}

const CatalogTools = ({ toggleTab, isAiEnabled }: CatalogToolsProps) => {
	return (
		<>
			<DropdownMenuItem onSelect={() => toggleTab(LeftNavigationTab.Inbox)}>
				<Icon code="inbox" />
				{t("inbox.notes")}
			</DropdownMenuItem>
			<DropdownMenuSub>
				<DropdownMenuSubTrigger>
					<Icon code="tool-case" />
					{t("tools")}
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent>
					<DropdownMenuItem onSelect={() => toggleTab(LeftNavigationTab.Snippets)}>
						<Icon code="file" />
						{t("snippets")}
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => toggleTab(LeftNavigationTab.Template)}>
						<Icon code="layout-template" />
						{t("template.name")}
					</DropdownMenuItem>
					{isAiEnabled && (
						<DropdownMenuItem onSelect={() => toggleTab(LeftNavigationTab.Prompt)}>
							<Icon code="square-chevron-right" />
							{t("ai.ai-prompts")}
						</DropdownMenuItem>
					)}
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		</>
	);
};

export default CatalogTools;
