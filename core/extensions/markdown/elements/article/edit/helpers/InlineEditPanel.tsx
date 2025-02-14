import { useOutsideClick } from "@core-ui/hooks/useOutsideClick";
import InlineMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Inline";
import ListMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/List";
import TableMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Table";
import TableAggregation from "@ext/markdown/core/edit/components/Menu/Groups/TableAggregation";
import TextMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Text";
import { Editor } from "@tiptap/core";
import { useRef, useState, useEffect } from "react";

interface InlineEditPanelProps {
	editor: Editor;
	closeHandler: () => void;
	onMountCallback: () => void;
	isCellSelection: boolean;
	inTable: boolean;
}

const InlineEditPanel = (props: InlineEditPanelProps) => {
	const { editor, closeHandler, onMountCallback, isCellSelection, inTable } = props;
	const [isReady, setIsReady] = useState(false);
	const editPanelRef = useRef<HTMLDivElement>(null);

	useOutsideClick([editPanelRef.current], closeHandler, isReady);

	useEffect(() => {
		onMountCallback();
		setIsReady(true);
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key == "Escape" || e.key == "Backspace") closeHandler();
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<div style={{ display: "flex", gap: "4px" }} ref={editPanelRef} data-qa="qa-inline-wysiwyg-menu">
			{inTable && (
				<>
					<TableMenuGroup editor={editor} onClick={closeHandler} />
					<TableAggregation editor={editor} disabled={!isCellSelection} />
					<div className="divider" />
				</>
			)}
			<TextMenuGroup editor={editor} />
			<div className="divider" />
			<ListMenuGroup editor={editor} />
			{!isCellSelection && (
				<>
					<div className="divider" />
					<InlineMenuGroup editor={editor} onClick={closeHandler} />
				</>
			)}
		</div>
	);
};

export default InlineEditPanel;
