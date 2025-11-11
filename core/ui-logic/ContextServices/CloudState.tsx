import React, { ReactElement, useContext, useEffect, useState, useMemo } from "react";
import ContextService from "@core-ui/ContextServices/ContextService";
import CloudApi from "@ext/static/logic/CloudApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { feature } from "@ext/toggleFeatures/features";

const CatalogPropsContext = React.createContext<CloudStateServiceContextProps>(undefined);

interface CloudStateServiceInitProps {
	cloudServiceUrl: string;
	catalogName: string;
}

interface CloudStateServiceContextProps {
	cloudApi: CloudApi;
	clientName?: string;
	catalogVersion?: string;
	cloudUrl: string;
	checkClientName: () => Promise<void>;
	checkCatalogVersion: () => Promise<void>;
}

class CloudStateService implements ContextService {
	Init({ children, value }: { children: ReactElement; value: CloudStateServiceInitProps }): ReactElement {
		const { catalogName, cloudServiceUrl } = value;
		const { isStatic, isStaticCli } = usePlatform();

		if (!cloudServiceUrl || isStatic || isStaticCli || !feature("cloud")) return children;

		const [clientName, setClientName] = useState<string>();
		const [catalogVersion, setCatalogVersion] = useState<string>();
		const cloudApi = useMemo(() => new CloudApi(cloudServiceUrl), []);

		const cloudUrl = useMemo(() => {
			const [protocol, domain] = cloudServiceUrl.split("://");
			return `${protocol}://${clientName || "your-account"}.${domain}`;
		}, [clientName]);

		const checkCatalogVersion = async () => {
			const newCatalogVersion = await cloudApi.getCatalogPublishDate(catalogName);
			setCatalogVersion(newCatalogVersion);
		};
		const checkClientName = async () => {
			const newClientName = await cloudApi.getAuthClientName();
			setClientName(newClientName);
		};

		useEffect(() => {
			checkClientName();
		}, [cloudApi]);

		useEffect(() => {
			if (!clientName || !catalogName) setCatalogVersion(null);
			checkCatalogVersion();
		}, [clientName, catalogName]);

		return (
			<CatalogPropsContext.Provider
				value={{
					cloudApi,
					cloudUrl,
					clientName,
					catalogVersion,
					checkClientName,
					checkCatalogVersion,
				}}
			>
				{children}
			</CatalogPropsContext.Provider>
		);
	}

	get value() {
		return useContext(CatalogPropsContext);
	}
}

export default new CloudStateService();
