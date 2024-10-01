import { NEW_CATALOG_NAME } from "@app/config/const";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { uniqueName } from "@core/utils/uniqueName";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
import t from "@ext/localization/locale/translate";
import { useRouter } from "../../../logic/Api/useRouter";

const CreateCatalog = ({ trigger }: { trigger: JSX.Element }) => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;

	const getAllCatalogNames = async (): Promise<string[]> => {
		const res = await FetchService.fetch<string[]>(apiUrlCreator.getCatalogBrotherFileNames());
		if (!res.ok) return;
		return await res.json();
	};

	const createCatalog = async () => {
		const catalogNames = await getAllCatalogNames();
		if (!catalogNames) return;

		const props: CatalogEditProps = {
			url: uniqueName(NEW_CATALOG_NAME, catalogNames),
			title: t("catalog.new-name"),
		};

		const responsePromise = FetchService.fetch<ClientCatalogProps>(
			apiUrlCreator.createCatalog(),
			JSON.stringify(props),
			MimeTypes.json,
		);
		ModalToOpenService.setValue(ModalToOpen.Loading, { title: `${t("loading")}` });
		const response = await responsePromise;
		if (!response.ok) return;
		const newCatalogProps = await response.json();
		router.pushPath("/" + newCatalogProps.link.pathname);
	};

	return <div onClick={createCatalog}>{trigger}</div>;
};

export default CreateCatalog;
