import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { createContext, useContext } from "react";
import CatalogPropsService from "./CatalogProps";
import PageDataContextService from "./PageDataContext";

const IsEditContext = createContext<boolean>(undefined);
abstract class IsEditService {
	static Provider({ children }: { children: JSX.Element }): JSX.Element {
		const articleProps = ArticlePropsService.value;
		const isReadonly = PageDataContextService.value.conf.isReadOnly;
		const isEdit = !isReadonly && !articleProps?.errorCode;

		return <IsEditContext.Provider value={isEdit}>{children}</IsEditContext.Provider>;
	}

	static get value(): boolean {
		return useContext(IsEditContext);
	}
}

export default IsEditService;
