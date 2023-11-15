import React, { ReactElement, useContext, useEffect, useState } from "react";
import { CatalogProps } from "../../logic/SitePresenter/SitePresenter";

const CatalogPropsContext = React.createContext<CatalogProps>(undefined);
let _setValue: React.Dispatch<React.SetStateAction<CatalogProps>>;

abstract class CatalogPropsService {
	static Provider({ children, value }: { children: ReactElement; value: CatalogProps }): ReactElement {
		const [catalogProps, setCatalogProps] = useState<CatalogProps>(value);
		_setValue = setCatalogProps;
		useEffect(() => setCatalogProps(value), [value]);
		return <CatalogPropsContext.Provider value={catalogProps}>{children}</CatalogPropsContext.Provider>;
	}

	static get value(): CatalogProps {
		const value = useContext(CatalogPropsContext);
		return value;
	}

	static set value(value: CatalogProps) {
		_setValue(value);
	}
}

export default CatalogPropsService;
