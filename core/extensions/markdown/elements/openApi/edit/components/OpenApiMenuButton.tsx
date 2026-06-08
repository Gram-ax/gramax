import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { setEditorStore } from "@core-ui/stores/EditorStore";
import t from "@ext/localization/locale/translate";
import createOpenApi from "@ext/markdown/elements/openApi/edit/logic/createOpenApi";
import type { Editor } from "@tiptap/core";
import { Icon } from "@ui-kit/Icon";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";
import { useCallback } from "react";

const OpenApiMenuButton = ({ editor }: { editor: Editor }) => {
	const articleProps = ArticlePropsService.value;
	const resourceService = ResourceService.value;
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "openapi" });

	const onSelect = useCallback(() => {
		setEditorStore({ lastUsedDiagramType: "openapi" });
		void createOpenApi(editor, articleProps, resourceService);
	}, [editor, articleProps, resourceService]);

	return (
		<ToolbarDropdownMenuItem active={isActive} disabled={disabled} onSelect={onSelect}>
			<div className="flex flex-row items-center gap-2" data-qa={`qa-edit-menu-openApi`}>
				<Icon icon="openapi" />
				{t("open-api")}
			</div>
		</ToolbarDropdownMenuItem>
	);
};

export default OpenApiMenuButton;
