import { Editor } from "@tiptap/core";
import { createContext, ReactElement, ReactNode } from "react";
import { ActionContextValue, NodeValues } from "./hooks/types";
import useCurrentAction from "./hooks/useCurrentAction";
import useType from "./hooks/useType";

const ActionContext = createContext<ActionContextValue>({
	actions: [],
	marks: [],
	attrs: { level: null },
	selection: null,
});

abstract class ButtonStateService {
	static Provider({ children, editor }: { children: ReactNode; editor: Editor }): ReactElement {
		const value = useType(editor);

		return <ActionContext.Provider value={value}>{children}</ActionContext.Provider>;
	}

	static useCurrentAction(current: NodeValues) {
		return useCurrentAction(current);
	}
}

export default ButtonStateService;

export { ActionContext };
