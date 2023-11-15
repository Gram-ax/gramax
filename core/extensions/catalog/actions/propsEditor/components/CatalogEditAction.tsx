import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import { useState } from "react";
import { useRouter } from "../../../../../logic/Api/useRouter";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { CatalogProps } from "../../../../../logic/SitePresenter/SitePresenter";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../ui-logic/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ArticlePropsService from "../../../../../ui-logic/ContextServices/ArticleProps";
import CatalogPropsService from "../../../../../ui-logic/ContextServices/CatalogProps";
import ErrorConfirmService from "../../../../errorHandlers/client/ErrorConfirmService";
import useLocalize from "../../../../localization/useLocalize";
import getCatalogEditProps from "../logic/getCatalogEditProps";
import CatalogEditProps from "../model/CatalogEditProps.schema";
import CatalogPropsEditor from "./CatalogPropsEditor";

const CatalogEditAction = () => {
	const router = useRouter();
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [saveProcess, setSaveProcess] = useState(false);
	const [deleteProcess, setDeleteProcess] = useState(false);
	const deleteText = useLocalize(catalogProps.sourceName ? "deleteStorageCatalog" : "deleteLocalCatalog");

	const deleteCatalog = async () => {
		setDeleteProcess(true);
		ErrorConfirmService.stop();
		const res = await FetchService.fetch(apiUrlCreator.removeCatalog());
		ErrorConfirmService.start();
		if (!res.ok) return;
		setDeleteProcess(false);
		router.pushPath("/");
	};

	const onSubmit = async (props: CatalogEditProps) => {
		setSaveProcess(true);
		const result = await FetchService.fetch<CatalogProps>(
			apiUrlCreator.updateCatalogProps(),
			JSON.stringify(props),
			MimeTypes.json,
		);
		if (!result.ok) return;
		const newCatalogProps = await result.json();
		setSaveProcess(false);
		CatalogPropsService.value = newCatalogProps;
		router.pushPath(
			new Path("/" + newCatalogProps.name).join(
				new Path(catalogProps.name).subDirectory(new Path(articleProps.path)),
			).value,
		);
	};

	return (
		<>
			<ModalLayout isOpen={deleteProcess || saveProcess}>
				<LogsLayout style={{ overflow: "hidden" }}>
					<SpinnerLoader fullScreen />
				</LogsLayout>
			</ModalLayout>
			<CatalogPropsEditor
				trigger={
					<a>
						<Icon code="pen-to-square" faFw={true} />
						<span>{useLocalize("catalogSettings")}</span>
					</a>
				}
				onSubmit={onSubmit}
				catalogProps={getCatalogEditProps(catalogProps)}
				leftButton={
					<Button
						style={{ paddingLeft: "0" }}
						buttonStyle={ButtonStyle.transparent}
						onClick={async () => {
							if (await confirm(deleteText)) deleteCatalog();
						}}
					>
						{useLocalize("delete") + " " + useLocalize("catalog2")}
					</Button>
				}
			/>
		</>
	);
};

export default CatalogEditAction;
