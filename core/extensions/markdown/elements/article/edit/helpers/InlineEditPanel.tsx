import { useOutsideClick } from "@core-ui/hooks/useOutsideClick";
import AiWritingPanel from "@ext/markdown/elements/article/edit/helpers/Panels/AiPanel";
import MainPanel from "@ext/markdown/elements/article/edit/helpers/Panels/MainPanel";
import { Editor } from "@tiptap/core";
import { useRef, useState, useEffect, ReactNode, Dispatch, SetStateAction } from "react";

export enum PanelMenu {
	Main,
	AiWriting,
}

const PanelMenuComponent: { [type in PanelMenu]: (args: PanelMenuComponentProps) => ReactNode } = {
	[PanelMenu.Main]: MainPanel,
	[PanelMenu.AiWriting]: AiWritingPanel,
};

interface ImportantComponentProps {
	editor: Editor;
	closeHandler: () => void;
	isCellSelection: boolean;
	inTable: boolean;
	isGramaxAiEnabled: boolean;
}

export interface PanelMenuComponentProps extends ImportantComponentProps {
	setPanel: Dispatch<SetStateAction<PanelMenu>>;
}

interface InlineEditPanelProps extends ImportantComponentProps {
	onMountCallback: () => void;
}

const InlineEditPanel = (props: InlineEditPanelProps) => {
	const { editor, closeHandler, onMountCallback, isCellSelection, inTable, isGramaxAiEnabled } = props;
	const [isReady, setIsReady] = useState(false);
	const [panel, setPanel] = useState<PanelMenu>(PanelMenu.Main);
	const editPanelRef = useRef<HTMLDivElement>(null);

	useOutsideClick([editPanelRef.current], closeHandler, isReady);

	useEffect(() => {
		onMountCallback();
		setIsReady(true);
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key == "Escape") closeHandler();
			if (e.key != "Backspace") return;

			const target = e.target as HTMLElement;

			if (target.nodeName === "INPUT" && editPanelRef.current.contains(target)) return;

			closeHandler();
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const PanelComponent = PanelMenuComponent[panel];

	return (
		<div style={{ display: "flex", gap: "4px" }} ref={editPanelRef} data-qa="qa-inline-wysiwyg-menu">
			<PanelComponent
				editor={editor}
				closeHandler={closeHandler}
				isCellSelection={isCellSelection}
				inTable={inTable}
				setPanel={setPanel}
				isGramaxAiEnabled={isGramaxAiEnabled}
			/>
		</div>
	);
};

export default InlineEditPanel;
