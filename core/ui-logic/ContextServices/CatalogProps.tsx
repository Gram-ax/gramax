import React, { ReactElement, useContext, useEffect, useState } from "react";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";

const CatalogPropsContext = React.createContext<ClientCatalogProps>(undefined);
let _setValue: React.Dispatch<React.SetStateAction<ClientCatalogProps>>;

abstract class CatalogPropsService {
	static Init({ children, value }: { children: ReactElement; value: ClientCatalogProps }): ReactElement {
		const [catalogProps, setCatalogProps] = useState<ClientCatalogProps>(value);
		_setValue = setCatalogProps;
		useEffect(() => setCatalogProps(value), [value]);
		return <CatalogPropsContext.Provider value={catalogProps}>{children}</CatalogPropsContext.Provider>;
	}

	static Provider({ children, value }: { children: ReactElement; value: ClientCatalogProps }): ReactElement {
		return <CatalogPropsContext.Provider value={value}>{children}</CatalogPropsContext.Provider>;
	}

	static Context({ children, value }: { children: ReactElement; value: ClientCatalogProps }): ReactElement {
		return <CatalogPropsContext.Provider value={value}>{children}</CatalogPropsContext.Provider>;
	}

	static get value(): ClientCatalogProps {
		return useContext(CatalogPropsContext);
	}

	static set value(value: ClientCatalogProps) {
		_setValue(value);
	}
}

export default CatalogPropsService;
