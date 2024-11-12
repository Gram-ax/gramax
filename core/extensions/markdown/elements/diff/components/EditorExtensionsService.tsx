import { Extensions } from "@tiptap/react";
import { Dispatch, ReactElement, SetStateAction, createContext, useContext, useState } from "react";

export const EditorExtensionsContext = createContext<Extensions>(undefined);
let _setExtensions: Dispatch<SetStateAction<Extensions>>;

abstract class EditorExtensionsService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [extensions, setExtensions] = useState<Extensions>(null);
		_setExtensions = setExtensions;
		return <EditorExtensionsContext.Provider value={extensions}>{children}</EditorExtensionsContext.Provider>;
	}

	static get value(): Extensions {
		return useContext(EditorExtensionsContext);
	}

	static set value(value: Extensions) {
		_setExtensions(value);
	}
}

export default EditorExtensionsService;
