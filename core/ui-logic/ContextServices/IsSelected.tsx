import getIsSelectedOneNode from "@ext/markdown/elementsUtils/getIsSelectedOneNode";
import { Editor } from "@tiptap/core";
import { ReactNode, createContext, useState, useEffect, useContext } from "react";

const IcSelectedContext = createContext<boolean>(false);

abstract class IsSelectedOneNodeService {
	static Provider = ({ editor, children }: { editor: Editor; children: ReactNode }) => {
		const [isSelected, dispatch] = useState(false);

		useEffect(() => {
			dispatch(getIsSelectedOneNode(editor.state));
		}, [editor.state.selection]);

		return <IcSelectedContext.Provider value={isSelected}>{children}</IcSelectedContext.Provider>;
	};

	static get value() {
		return useContext(IcSelectedContext);
	}
}

export default IsSelectedOneNodeService;
