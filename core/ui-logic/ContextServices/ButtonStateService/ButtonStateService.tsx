import useCurrentAction from "./hooks/useCurrentAction";
import { ReactElement, ReactNode, createContext } from "react";
import { Editor } from "@tiptap/core";
import { NodeValues, ActionContextValue } from "./hooks/types";
import useType from "./hooks/useType";

const ActionContext = createContext<ActionContextValue>({ action: "", marks: [], attrs: { level: null } });

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
