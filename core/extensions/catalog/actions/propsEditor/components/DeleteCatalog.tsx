import { useDismissableToast } from "@components/Atoms/DismissableToast";
import ButtonLink from "@components/Molecules/ButtonLink";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import t from "@ext/localization/locale/translate";
import CloudApi from "@ext/static/logic/CloudApi";
import { Loader } from "ics-ui-kit/components/loader";
import { CSSProperties, useCallback } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";

const DeleteCatalog = ({ style }: { style?: CSSProperties }) => {
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const cloudServiceUrl = PageDataContextService.value.conf.cloudServiceUrl;

	const { dismiss, show } = useDismissableToast({
		title: t("catalog.delete.progress"),
		closeAction: false,
		focus: "medium",
		size: "sm",
		status: "info",
		primaryAction: <Loader size="md" />,
	});

	const router = useRouter();
	const deleteText = catalogProps.sourceName ? t("catalog.delete.storage") : t("catalog.delete.local");
	const { isStatic } = usePlatform();

	const deleteCatalog = useCallback(async () => {
		const agreed = await confirm(deleteText);
		if (!agreed) return;

		try {
			show();
			const res = await FetchService.fetch(apiUrlCreator.removeCatalog());
			if (!res.ok) return;
			router.pushPath("/");
		} finally {
			dismiss.current?.();
		}
	}, [router, show, apiUrlCreator]);

	const deleteCatalogInCloud = useCallback(async () => {
		if (!(await confirm(t("cloud.delete-catalog")))) return;

		try {
			show();
			const cloudApi = new CloudApi(cloudServiceUrl, (e) => ErrorConfirmService.notify(e));
			await cloudApi.deleteCatalog(catalogProps.name);
		} finally {
			dismiss.current?.();
		}
		router.pushPath("/");
		location.reload();
	}, [cloudServiceUrl, catalogProps, router]);

	return (
		<ButtonLink
			style={style}
			onClick={isStatic ? deleteCatalogInCloud : deleteCatalog}
			iconCode="trash"
			text={t("catalog.delete.name")}
		/>
	);
};

export default DeleteCatalog;
