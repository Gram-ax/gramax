import { useDismissableToast } from "@components/Atoms/DismissableToast";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useApi } from "@core-ui/hooks/useApi";
import { useRouter } from "@core/Api/useRouter";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import t from "@ext/localization/locale/translate";
import CloudApi from "@ext/static/logic/CloudApi";
import { Loader } from "ics-ui-kit/components/loader";
import { useCallback } from "react";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

export type UseDeleteCatalogProps = {
	name: string;
	onDeleted?: () => void;
};

export const useDeleteCloudCatalog = ({ onDeleted }: Omit<UseDeleteCatalogProps, "name">) => {
	const router = useRouter();

	const name = useCatalogPropsStore((state) => state.data?.name);
	const cloudServiceUrl = PageDataContextService.value.conf.cloudServiceUrl;

	const { dismiss, show } = useDismissableToast({
		title: t("catalog.delete.progress"),
		closeAction: false,
		focus: "medium",
		size: "sm",
	});

	return useCallback(async () => {
		try {
			show();
			const cloudApi = new CloudApi(cloudServiceUrl, (e) => ErrorConfirmService.notify(e));
			await cloudApi.deleteCatalog(name);
		} finally {
			dismiss.current?.();
		}
		router.pushPath("/");
		location.reload();
		onDeleted?.();
	}, [name, cloudServiceUrl, dismiss, router, show]);
};

export const useDeleteCatalog = ({ name, onDeleted }: UseDeleteCatalogProps) => {
	const { dismiss, show } = useDismissableToast({
		title: t("catalog.delete.progress"),
		closeAction: false,
		focus: "medium",
		size: "sm",
		status: "info",
		primaryAction: <Loader size="md" />,
	});

	const { call: removeCatalog } = useApi({
		url: (api) => api.removeCatalog(name),
		onStart: show,
		onDone: onDeleted || refreshPage,
		onFinally: () => dismiss.current?.(),
	});

	return useCallback(() => removeCatalog(), [removeCatalog]);
};
