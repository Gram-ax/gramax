import { Editor } from "@tiptap/core";
import { createContext, useState } from "react";
import EditorService from "../../../elementsUtils/ContextServices/EditorService";
import FocusService from "../../../elementsUtils/ContextServices/FocusService";

export const FocusPositionContext = createContext<number>(1);

const ContextWrapper = ({ editor, children }: { editor: Editor; children: JSX.Element | JSX.Element[] }) => {
	return (
		<EditorInitializer editor={editor}>
			<FocusInitializer>{children}</FocusInitializer>
		</EditorInitializer>
	);
};

const EditorInitializer = ({ editor, children }: { editor: Editor; children: JSX.Element | JSX.Element[] }) => {
	EditorService.bindEditor(editor);
	return <>{children}</>;
};

const FocusInitializer = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
	const [focusPosition, setFocusPosition] = useState(0);
	FocusService.bindSetFocusPosition(setFocusPosition);
	return <FocusPositionContext.Provider value={focusPosition}>{children}</FocusPositionContext.Provider>;
};

export default ContextWrapper;
