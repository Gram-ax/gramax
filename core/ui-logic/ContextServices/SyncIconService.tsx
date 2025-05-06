import ContextService from "@core-ui/ContextServices/ContextService";
import { Dispatch, ReactElement, SetStateAction, createContext, useContext, useState } from "react";

const SyncIconContext = createContext<boolean>(undefined);

class SyncIconService implements ContextService {
	private _setSyncProcess: Dispatch<SetStateAction<boolean>>;

	Init({ children }: { children: ReactElement }): ReactElement {
		const [syncProcess, setSyncProcess] = useState(false);
		this._setSyncProcess = setSyncProcess;

		return <SyncIconContext.Provider value={syncProcess}>{children}</SyncIconContext.Provider>;
	}

	get value(): boolean {
		return useContext(SyncIconContext);
	}

	start() {
		this._setSyncProcess(true);
	}

	stop() {
		this._setSyncProcess(false);
	}
}

export default new SyncIconService();
