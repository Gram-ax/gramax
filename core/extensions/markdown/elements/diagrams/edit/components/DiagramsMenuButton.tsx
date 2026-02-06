import DiagramType from "@core/components/Diagram/DiagramType";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import type { Editor } from "@tiptap/core";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";
import { useMemo } from "react";
import { mermaidIcon } from "../../diagrams/mermaid/mermaidData";
import { plantUmlIcon } from "../../diagrams/plantUml/plantUmlData";
import createDiagrams from "../../logic/createDiagrams";

interface DiagramsMenuButtonProps {
	editor: Editor;
	diagramName: DiagramType;
	fileName?: string;
}

const DiagramsMenuButton = ({ editor, diagramName, fileName }: DiagramsMenuButtonProps) => {
	const resourceService = ResourceService.value;
	const pageDataContext = PageDataContextService.value;
	const articleProps = ArticlePropsService.value;
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "diagrams", attrs: { diagramName } });

	const { text, diagramIcon } = useMemo(() => {
		let text: string;
		let diagramIcon: JSX.Element;

		switch (diagramName) {
			case DiagramType.mermaid:
				diagramIcon = mermaidIcon;
				text = t("diagram.names.mermaid");
				break;
			case DiagramType["plant-uml"]:
				diagramIcon = plantUmlIcon;
				text = t("diagram.names.puml");
				break;
		}

		return { text, diagramIcon };
	}, [diagramName]);

	return (
		<ToolbarDropdownMenuItem
			active={isActive}
			disabled={disabled}
			onSelect={() =>
				void createDiagrams(
					editor,
					fileName || articleProps?.fileName,
					resourceService,
					diagramName,
					pageDataContext,
				)
			}
		>
			<div className="flex flex-row items-center gap-2" data-qa={`qa-edit-menu-${diagramName}`}>
				{diagramIcon}
				{text}
			</div>
		</ToolbarDropdownMenuItem>
	);
};

export default DiagramsMenuButton;
