import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from "react";

const CurrentTabsTagContext = createContext<string>(undefined);
let _setCurrentTabsTag: Dispatch<SetStateAction<string>>;

abstract class CurrentTabsTagService {
	static Provider({ children }: { children: JSX.Element }): JSX.Element {
		const catalogProps = CatalogPropsService.value;
		const tabsTags = catalogProps.tabsTags;
		const tags = tabsTags?.tags ?? [];
		const [tag, setTag] = useState(tags[0]);

		_setCurrentTabsTag = setTag;
		useEffect(() => {
			setTag(tags[0] ?? null);
		}, [tags.length, tabsTags?.label]);

		return <CurrentTabsTagContext.Provider value={tag}>{children}</CurrentTabsTagContext.Provider>;
	}

	static get value(): string {
		return useContext(CurrentTabsTagContext);
	}
	static set value(value: string) {
		_setCurrentTabsTag(value);
	}
}

export default CurrentTabsTagService;
