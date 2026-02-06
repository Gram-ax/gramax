import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import type ContextService from "@core-ui/ContextServices/ContextService";
import useTrigger from "@core-ui/triggers/useTrigger";
import { useValidateSource } from "@ext/git/actions/Source/logic/useValidateSource";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import {
	createContext,
	type Dispatch,
	type ReactElement,
	type SetStateAction,
	useContext,
	useEffect,
	useState,
} from "react";

export const SourceDataContext = createContext<SourceData[]>(undefined);

class SourceDataService implements ContextService {
	private _setSourceDataContext: Dispatch<SetStateAction<SourceData[]>>;
	private _bumpRefresh: () => void;

	Init({ children }: { children: ReactElement }): ReactElement {
		const [sourceDatas, setSourceDatas] = useState<SourceData[]>([]);
		const [trigger, setTrigger] = useTrigger();
		this._setSourceDataContext = setSourceDatas;
		this._bumpRefresh = setTrigger;

		const apiUrlCreator = ApiUrlCreator.value;
		const validateSource = useValidateSource();

		useEffect(() => {
			(async () => {
				const res = await FetchService.fetch<SourceData[]>(apiUrlCreator.getSourceData());
				if (!res.ok) return;
				const sourceDatas = await res.json();
				setSourceDatas(sourceDatas);
				await sourceDatas.mapAsync((sd) => validateSource(sd, sourceDatas));
				setSourceDatas([...sourceDatas]);
			})();
		}, [trigger]);

		return <SourceDataContext.Provider value={sourceDatas}>{children}</SourceDataContext.Provider>;
	}

	Provider({ children, value }: { children: ReactElement; value: SourceData[] }): ReactElement {
		return <SourceDataContext.Provider value={value}>{children}</SourceDataContext.Provider>;
	}

	get value(): SourceData[] {
		// biome-ignore lint/correctness/useHookAtTopLevel: idc
		return useContext(SourceDataContext);
	}

	set value(value: SourceData[]) {
		this._setSourceDataContext(value);
	}

	refresh() {
		this._bumpRefresh?.();
	}
}

export default new SourceDataService();
