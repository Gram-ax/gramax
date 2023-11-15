import DiagramType from "@core/components/Diagram/DiagramType";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";

import Tooltip from "@components/Atoms/Tooltip";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import DiagramsMenuButton from "@ext/markdown/elements/diagrams/edit/components/DiagramsMenuButton";
import DrawioMenuButton from "@ext/markdown/elements/drawio/edit/components/DrawioMenuButton";

const DiagramsMenuGroup = ({ editor }: { editor?: Editor }) => {
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
						<DiagramsMenuButton editor={editor} diagramName={DiagramType["ts-diagram"]} />
						<DiagramsMenuButton editor={editor} diagramName={DiagramType["c4-diagram"]} />
						{/* <MermaidMenuButton editor={editor} /> */}
						<DiagramsMenuButton editor={editor} diagramName={DiagramType["plant-uml"]} />
					</ButtonsLayout>
				</ModalLayoutDark>
			}
		>
			<div>
				<Button icon="diagram-project" nodeValues={{ action: ["diagramsMenuGroup"] }} />
			</div>
		</Tooltip>
	);
};

export default DiagramsMenuGroup;
