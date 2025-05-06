import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import ButtonLink from "@components/Molecules/ButtonLink";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import t from "@ext/localization/locale/translate";
import CloudApi from "@ext/static/logic/CloudApi";
import { CSSProperties, useState } from "react";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";

const DeleteCatalog = ({ style }: { style?: CSSProperties }) => {
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const cloudServiceUrl = PageDataContextService.value.conf.cloudServiceUrl;

	const router = useRouter();
	const [deleteProcess, setDeleteProcess] = useState(false);
	const deleteText = t(catalogProps.sourceName ? "delete-storage-catalog" : "delete-local-catalog");
	const { isStatic } = usePlatform();

	const deleteCatalog = async () => {
		if (!(await confirm(deleteText))) return;
		setDeleteProcess(true);
		ErrorConfirmService.stop();
		const res = await FetchService.fetch(apiUrlCreator.removeCatalog());
		ErrorConfirmService.start();
		setDeleteProcess(false);
		if (!res.ok) return;
		router.pushPath("/");
	};

	const deleteCatalogInCloud = async () => {
		if (!(await confirm(t("cloud.delete-catalog")))) return;
		setDeleteProcess(true);
		const staticApi = new CloudApi(cloudServiceUrl, (e) => ErrorConfirmService.notify(e));
		try {
			await staticApi.deleteCatalog(catalogProps.name);
		} finally {
			setDeleteProcess(false);
		}
		router.pushPath("/");
		location.reload();
	};

	return (
		<>
			<ModalLayout isOpen={deleteProcess}>
				<LogsLayout style={{ overflow: "hidden" }}>
					<SpinnerLoader fullScreen />
				</LogsLayout>
			</ModalLayout>
			<ButtonLink
				style={style}
				onClick={isStatic ? deleteCatalogInCloud : deleteCatalog}
				iconCode="trash"
				text={t("catalog.delete")}
			/>
		</>
	);
};

export default DeleteCatalog;
