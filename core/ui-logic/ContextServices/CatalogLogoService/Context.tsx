import { useCatalogLogo, useGetCatalogLogoSrc } from "@core-ui/ContextServices/CatalogLogoService/catalogLogoHooks";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import ContextService from "@core-ui/ContextServices/ContextService";
import { UpdateResource } from "@ext/workspace/components/LogoUploader";
import { createContext, ReactElement, useContext, useState, useCallback } from "react";

interface CatalogLogoInterface {
	isLoadingLight: boolean;
	isLoadingDark: boolean;
	darkLogo: string;
	updateLightLogo: UpdateResource;
	confirmChanges: () => Promise<void>;
	deleteDarkLogo: () => void;
	updateDarkLogo: UpdateResource;
	lightLogo: string;
	deleteLightLogo: () => void;
	refreshState: () => Promise<void>;
	logo: string;
}

const CatalogLogoContext = createContext<CatalogLogoInterface>(undefined);

class CatalogLogoService implements ContextService {
	Init({ children }: { children: ReactElement }): ReactElement {
		const catalogProps = CatalogPropsService.value;
		const [key, setKey] = useState(0);

		const successCallback = useCallback(() => {
			setKey((p) => p + 1);
		}, []);

		const { ...data } = useCatalogLogo(catalogProps?.link?.name, successCallback);
		const { isExist, src } = useGetCatalogLogoSrc(catalogProps?.link?.name, [key]);

		return (
			<CatalogLogoContext.Provider value={{ ...data, logo: isExist && src }}>
				{children}
			</CatalogLogoContext.Provider>
		);
	}

	value() {
		return useContext(CatalogLogoContext);
	}
}

export default new CatalogLogoService();
