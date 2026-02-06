import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import createOpenApi from "@ext/markdown/elements/openApi/edit/logic/createOpenApi";
import { Editor } from "@tiptap/core";
import { Icon } from "@ui-kit/Icon";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";

const OpenApiMenuButton = ({ editor }: { editor: Editor }) => {
	const articleProps = ArticlePropsService.value;
	const resourceService = ResourceService.value;
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "openapi" });

	return (
		<ToolbarDropdownMenuItem
			active={isActive}
			disabled={disabled}
			onSelect={() => void createOpenApi(editor, articleProps, resourceService)}
		>
			<div className="flex flex-row items-center gap-2" data-qa={`qa-edit-menu-openApi`}>
				<Icon icon="openapi" />
				{t("open-api")}
			</div>
		</ToolbarDropdownMenuItem>
	);
};

export default OpenApiMenuButton;
