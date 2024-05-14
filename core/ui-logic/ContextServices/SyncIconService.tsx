import { Dispatch, ReactElement, SetStateAction, createContext, useContext, useState } from "react";

const SyncIconContext = createContext<boolean>(undefined);
let _setSyncProccess: Dispatch<SetStateAction<boolean>>;

abstract class SyncIconService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [syncProccess, setSyncProccess] = useState(false);
		_setSyncProccess = setSyncProccess;
		return <SyncIconContext.Provider value={syncProccess}>{children}</SyncIconContext.Provider>;
	}

    static get value(): boolean{
        return useContext(SyncIconContext)
    }

	static start() {
		_setSyncProccess(true);
	}

	static stop() {
		_setSyncProccess(false);
	}
}

export default SyncIconService;
