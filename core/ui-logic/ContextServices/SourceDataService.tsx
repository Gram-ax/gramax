import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import ContextService from "@core-ui/ContextServices/ContextService";
import { useValidateSource } from "@ext/git/actions/Source/logic/useValidateSource";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";

export const SourceDataContext = createContext<SourceData[]>(undefined);

class SourceDataService implements ContextService {
	private _setSourceDataContecxt: Dispatch<SetStateAction<SourceData[]>>;

	Init({ children }: { children: ReactElement }): ReactElement {
		const [sourceDatas, setSourceDatas] = useState<SourceData[]>([]);
		this._setSourceDataContecxt = setSourceDatas;

		const apiUrlCreator = ApiUrlCreator.value;
		const validateSource = useValidateSource();

		useEffect(() => {
			void (async () => {
				const res = await FetchService.fetch<SourceData[]>(apiUrlCreator.getSourceData());
				if (!res.ok) return;
				const sourceDatas = await res.json();
				setSourceDatas(sourceDatas);
				await sourceDatas.mapAsync((sourceData) => validateSource(sourceData, sourceDatas));
				setSourceDatas([...sourceDatas]);
			})();
		}, []);

		return <SourceDataContext.Provider value={sourceDatas}>{children}</SourceDataContext.Provider>;
	}

	Provider({ children, value }: { children: ReactElement; value: SourceData[] }): ReactElement {
		return <SourceDataContext.Provider value={value}>{children}</SourceDataContext.Provider>;
	}

	get value(): SourceData[] {
		return useContext(SourceDataContext);
	}

	set value(value: SourceData[]) {
		this._setSourceDataContecxt(value);
	}
}

export default new SourceDataService();
