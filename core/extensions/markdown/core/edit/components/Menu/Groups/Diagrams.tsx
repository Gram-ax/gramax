import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import DiagramType from "@core/components/Diagram/DiagramType";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

import Tooltip from "@components/Atoms/Tooltip";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import DiagramsMenuButton from "@ext/markdown/elements/diagrams/edit/components/DiagramsMenuButton";
import DrawioMenuButton from "@ext/markdown/elements/drawio/edit/components/DrawioMenuButton";
import OpenApiMenuButton from "@ext/markdown/elements/openApi/edit/components/OpenApiMenuButton";
import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

interface DiagramsMenuGroupProps {
	editor?: Editor;
	fileName?: string;
}

const DiagramsMenuGroup = ({ editor, fileName }: DiagramsMenuGroupProps) => {
	const drawIo = ButtonStateService.useCurrentAction({ action: "drawio" });
	const diagrams = ButtonStateService.useCurrentAction({ action: "diagrams" });

	const syntax = useCatalogPropsStore((state) => state.data.syntax);
	const formatterSupportedElements = getFormatterType(syntax).supportedElements;

	const isDrawioSupported = formatterSupportedElements.includes("drawio");
	const isMermaidSupported = formatterSupportedElements.includes("mermaid");
	const isPlantUmlSupported = formatterSupportedElements.includes("plant-uml");
	const isOpenApiSupported = formatterSupportedElements.includes("openApi");

	if (!isDrawioSupported && !isMermaidSupported && !isPlantUmlSupported && !isOpenApiSupported) {
		return null;
	}

	const isActive = drawIo.isActive || diagrams.isActive;
	const disabled = drawIo.disabled && diagrams.disabled;

	return (
		<Tooltip
			arrow={false}
			interactive
			distance={8}
			customStyle
			content={
				<ModalLayoutDark>
					<ButtonsLayout>
						{isDrawioSupported && <DrawioMenuButton editor={editor} fileName={fileName} />}
						{isMermaidSupported && (
							<DiagramsMenuButton
								editor={editor}
								diagramName={DiagramType["mermaid"]}
								fileName={fileName}
							/>
						)}
						{isPlantUmlSupported && (
							<DiagramsMenuButton
								editor={editor}
								diagramName={DiagramType["plant-uml"]}
								fileName={fileName}
							/>
						)}
						{isOpenApiSupported && <OpenApiMenuButton editor={editor} />}
					</ButtonsLayout>
				</ModalLayoutDark>
			}
		>
			<div>
				<Button isActive={isActive} disabled={disabled} icon="share-2" />
			</div>
		</Tooltip>
	);
};

export default DiagramsMenuGroup;
