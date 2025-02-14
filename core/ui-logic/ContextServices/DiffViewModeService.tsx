import { DiffViewMode } from "@ext/markdown/elements/diff/components/DiffBottomBar";
import { Dispatch, ReactElement, SetStateAction, useContext, useState } from "react";
import { createContext } from "react";

const DiffViewModeContext = createContext<DiffViewMode>(undefined);
let _setDiffViewMode: Dispatch<SetStateAction<DiffViewMode>>;

abstract class DiffViewModeService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [diffViewMode, setDiffViewMode] = useState<DiffViewMode>("wysiwyg");
		_setDiffViewMode = setDiffViewMode;
		return <DiffViewModeContext.Provider value={diffViewMode}>{children}</DiffViewModeContext.Provider>;
	}

	static get value(): DiffViewMode {
		return useContext(DiffViewModeContext);
	}

	static set value(value: DiffViewMode) {
		_setDiffViewMode(value);
	}
}

export default DiffViewModeService;
