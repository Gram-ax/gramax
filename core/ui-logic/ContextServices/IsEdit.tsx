import { Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from "react";
import ArticlePropsService from "./ArticleProps";
import CatalogPropsService from "./CatalogProps";
import PageDataContextService from "./PageDataContext";

let _setIsEdit: Dispatch<SetStateAction<boolean>>;
const IsEditContext = createContext<boolean>(undefined);
const _localStorageName = "IsEdit";
abstract class IsEditService {
	static Provider({ children }: { children: JSX.Element }): JSX.Element {
		const articleProps = ArticlePropsService.value;
		const catalogProps = CatalogPropsService.value;
		const isLogged = PageDataContextService.value.isLogged;
		const isReadonly = PageDataContextService.value.conf.isReadOnly;
		const [isEdit, setIsEdit] = useState<boolean>(false);

		useEffect(() => {
			setIsEdit(
				isLogged &&
					!catalogProps.readOnly &&
					!articleProps?.errorCode &&
					!isReadonly &&
					window.localStorage.getItem(_localStorageName) !== "false",
			);
		}, [isLogged, catalogProps.readOnly, articleProps?.errorCode]);

		_setIsEdit = setIsEdit;
		return <IsEditContext.Provider value={isEdit}>{children}</IsEditContext.Provider>;
	}

	static get value(): boolean {
		return useContext(IsEditContext);
	}

	static set value(value: boolean) {
		window.localStorage.setItem(_localStorageName, `${value}`);
		_setIsEdit(value);
	}
}

export default IsEditService;
