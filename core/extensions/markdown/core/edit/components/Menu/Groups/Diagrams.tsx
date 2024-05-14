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

const DiagramsMenuGroup = ({ editor }: { editor?: Editor }) => {
	const drawIo = ButtonStateService.useCurrentAction({ action: "drawio" });
	const diagrams = ButtonStateService.useCurrentAction({ action: "diagrams" });

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
						<DrawioMenuButton editor={editor} />
						{/* <DiagramsMenuButton editor={editor} diagramName={DiagramType["ts-diagram"]} /> */}
						{/* <DiagramsMenuButton editor={editor} diagramName={DiagramType["c4-diagram"]} /> */}
						<DiagramsMenuButton editor={editor} diagramName={DiagramType["mermaid"]} />
						{/* <MermaidMenuButton editor={editor} /> */}
						<DiagramsMenuButton editor={editor} diagramName={DiagramType["plant-uml"]} />
						<OpenApiMenuButton editor={editor} />
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
