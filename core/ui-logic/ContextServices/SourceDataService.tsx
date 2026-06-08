import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import type ContextService from "@core-ui/ContextServices/ContextService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
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

	Init({ children }: { children: ReactElement }): ReactElement {
		const [sourceDatas, setSourceDatas] = useState<SourceData[]>([]);
		this._setSourceDataContext = setSourceDatas;

		const apiUrlCreator = ApiUrlCreator.value;
		const currentWorkspace = PageDataContextService.value.workspace.current;
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
		}, [currentWorkspace]);

		return <SourceDataContext.Provider value={sourceDatas}>{children}</SourceDataContext.Provider>;
	}

	Provider({ children, value }: { children: ReactElement; value: SourceData[] }): ReactElement {
		return <SourceDataContext.Provider value={value}>{children}</SourceDataContext.Provider>;
	}

	get value(): SourceData[] {
		return useContext(SourceDataContext);
	}

	set value(value: SourceData[]) {
		this._setSourceDataContext(value);
	}
}

export default new SourceDataService();
