import { NEW_CATALOG_NAME } from "@app/config/const";
import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import { useRouter } from "@core/Api/useRouter";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type { GesCloudInitCatalog } from "@ext/enterprise-cloud/components/Catalog/GesCloudInitCatalog";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import t from "@ext/localization/locale/translate";
import { type ComponentProps, useCallback, useState } from "react";
import ApiUrlCreatorService from "../../../../ui-logic/ContextServices/ApiUrlCreator";

interface CatalogRepositoryNameResponse {
	repositoryName: string;
	isRepositoryNameAlreadyExists: boolean;
}

type InitNewCatalogResult =
	| { success: true; catalogProps: ClientCatalogProps }
	| { success: false; errorCode: "REPOSITORY_ALREADY_EXISTS" };

export const GesCloudConnectStorage = () => {
	const catalogPropsStore = useCatalogPropsStore((state) => state, "shallow");
	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();

	const [isConnectingCatalog, setIsConnectingCatalog] = useState(false);

	const connectStorage = useCallback(
		async (newCatalogTitle: string, newRepositoryName: string) => {
			const oldCatalogName = catalogPropsStore.data.repositoryName;

			const res = await FetchService.fetch<InitNewCatalogResult>(
				apiUrlCreator.getInitEnterpriseCloudCatalogUrl(oldCatalogName, newCatalogTitle, newRepositoryName),
			);
			if (!res.ok) return;

			const result = await res.json();
			if (!result.success) return result;

			catalogPropsStore.update(result.catalogProps);
			router.pushPath(result.catalogProps.link.pathname);
			return result;
		},
		[catalogPropsStore, router],
	);

	const getRepositoryName = useCallback(
		async (catalogTitle: string) => {
			const oldCatalogName = catalogPropsStore.data.repositoryName;

			const res = await FetchService.fetch<CatalogRepositoryNameResponse>(
				apiUrlCreator.getEnterpriseCloudCatalogRepositoryNameUrl(oldCatalogName, catalogTitle),
			);
			if (!res.ok) throw new Error(`Failed to get catalog repository name: ${res.status}`);

			const data = await res.json();
			return data;
		},
		[catalogPropsStore.data.repositoryName],
	);

	const handleClick = useCallback(async () => {
		if (isConnectingCatalog) return;
		setIsConnectingCatalog(true);
		try {
			const catalogTitle = catalogPropsStore.data.title?.trim() ?? "";
			const repositoryNameData = await getRepositoryName(catalogTitle || NEW_CATALOG_NAME);

			if (!catalogTitle || repositoryNameData.isRepositoryNameAlreadyExists) {
				const id = ModalToOpenService.addModal<ComponentProps<typeof GesCloudInitCatalog>>(
					ModalToOpen.GesCloudInitCatalog,
					{
						initialCatalogTitle: catalogTitle,
						initialRepositoryName: catalogPropsStore.data.name,
						onClose: () => {
							setIsConnectingCatalog(false);
							ModalToOpenService.removeModal(id);
						},
						connectStorage,
					},
				);
				return;
			}

			await connectStorage(catalogTitle, repositoryNameData.repositoryName);
		} catch (error) {
			ErrorConfirmService.notify(error);
		} finally {
			setIsConnectingCatalog(false);
		}
	}, [
		catalogPropsStore.data.name,
		catalogPropsStore.data.title,
		connectStorage,
		getRepositoryName,
		isConnectingCatalog,
	]);

	return (
		<StatusBarElement
			disable={isConnectingCatalog}
			iconClassName={isConnectingCatalog ? "animate-spin" : ""}
			iconCode={isConnectingCatalog ? "loader-circle" : "cloud-upload"}
			iconStyle={{ fontSize: "15px" }}
			onClick={handleClick}
			tooltipText={t("publish-catalog")}
		/>
	);
};
