import { useCatalogLogo, useGetCatalogLogoSrc } from "@core-ui/ContextServices/CatalogLogoService/catalogLogoHooks";
import ContextService from "@core-ui/ContextServices/ContextService";
import { UpdateResource } from "@ext/workspace/components/LogoUploader";
import { createContext, ReactElement, useContext, useState, useCallback } from "react";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

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
		const linkName = useCatalogPropsStore((state) => state.data?.link?.name);
		const [key, setKey] = useState(0);

		const successCallback = useCallback(() => {
			setKey((p) => p + 1);
		}, []);

		const { ...data } = useCatalogLogo(linkName, successCallback);
		const { isExist, src } = useGetCatalogLogoSrc(linkName, [key]);

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
