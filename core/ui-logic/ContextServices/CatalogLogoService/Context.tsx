import { useCatalogLogo, useGetCatalogLogoSrc } from "@core-ui/ContextServices/CatalogLogoService/catalogLogoHooks";
import type ContextService from "@core-ui/ContextServices/ContextService";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { createContext, type ReactElement, useCallback, useContext, useState } from "react";

interface CatalogLogoInterface {
	isLoadingLight: boolean;
	isLoadingDark: boolean;
	darkLogo: string;
	lightLogo: string;
	refreshState: () => Promise<void>;
	refreshLogo: () => void;
	logo: string;
}

const CatalogLogoContext = createContext<CatalogLogoInterface>(undefined);

class CatalogLogoService implements ContextService {
	Init({ children }: { children: ReactElement }): ReactElement {
		const linkName = useCatalogPropsStore((state) => state.data?.link?.name);
		const [key, setKey] = useState(0);

		const refreshLogo = useCallback(() => setKey((k) => k + 1), []);

		const { ...data } = useCatalogLogo(linkName);
		const { isExist, src } = useGetCatalogLogoSrc(linkName, [key]);

		return (
			<CatalogLogoContext.Provider value={{ ...data, logo: isExist && src, refreshLogo }}>
				{children}
			</CatalogLogoContext.Provider>
		);
	}

	value() {
		return useContext(CatalogLogoContext);
	}
}

export default new CatalogLogoService();
