import { useOutsideClick } from "@core-ui/hooks/useOutsideClick";
import HeadersMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Headers";
import InlineMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Inline";
import ListMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/List";
import TextMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Text";
import { Editor } from "@tiptap/core";
import { useRef, useState, useEffect } from "react";

const InlineEditPanel = ({ editor, closeHandler }: { editor: Editor; closeHandler: () => void }) => {
	const [isReady, setIsReady] = useState(false);
	const editPanelRef = useRef<HTMLDivElement>(null);

	useOutsideClick([editPanelRef.current], closeHandler, isReady);

	useEffect(() => {
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
		<div style={{ display: "flex", gap: "4px" }} ref={editPanelRef}>
			<HeadersMenuGroup editor={editor} />
			<div className="divider" />
			<TextMenuGroup editor={editor} />
			<div className="divider" />
			<ListMenuGroup editor={editor} />
			<div className="divider" />
			<InlineMenuGroup editor={editor} onClick={closeHandler} />
		</div>
	);
};

export default InlineEditPanel;
