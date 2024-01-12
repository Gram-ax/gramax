import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import Path from "@core/FileProvider/Path/Path";
import { CatalogProps } from "@core/SitePresenter/SitePresenter";
import createNewFilePathUtils from "@core/utils/createNewFilePathUtils";
import CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";
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
		const newPath = createNewFilePathUtils.create(
			Path.empty,
			catalogNames.map((n) => new Path(n)),
			"catalog_",
			"",
		);

		const props: CatalogEditProps = {
			url: newPath.value,
			code: "",
			title: `Каталог ${newPath.value.slice(-1)}`,
			description: "",
		};

		const response = await FetchService.fetch<CatalogProps>(
			apiUrlCreator.createCatalog(),
			JSON.stringify(props),
			MimeTypes.json,
		);
		if (!response.ok) return;
		const newCatalogProps = await response.json();
		router.pushPath("/" + newCatalogProps.name);
	};

	return <div onClick={createCatalog}>{trigger}</div>;
};

export default CreateCatalog;
