import { createContext, useContext, useEffect, useState } from "react";
import CatalogPropsService from "./CatalogProps";
import PageDataContextService from "./PageDataContext";

const IsEditContext = createContext<boolean>(undefined);
abstract class IsEditService {
	static Provider({ children }: { children: JSX.Element }): JSX.Element {
		const catalogProps = CatalogPropsService.value;
		const isReadonly = PageDataContextService.value.conf.isReadOnly;
		const [isEdit, setIsEdit] = useState(false);

		useEffect(() => {
			setIsEdit(!catalogProps.readOnly && !isReadonly);
		}, [isReadonly, catalogProps.readOnly]);

		return <IsEditContext.Provider value={isEdit}>{children}</IsEditContext.Provider>;
	}

	static get value(): boolean {
		return useContext(IsEditContext);
	}
}

export default IsEditService;
