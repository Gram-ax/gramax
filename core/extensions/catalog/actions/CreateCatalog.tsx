import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useRouter } from "../../../logic/Api/useRouter";
import { CatalogProps } from "../../../logic/SitePresenter/SitePresenter";
import CatalogPropsEditor from "./propsEditor/components/CatalogPropsEditor";
import CatalogEditProps from "./propsEditor/model/CatalogEditProps.schema";

const CreateCatalog = ({ trigger }: { trigger: JSX.Element }) => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;

	const createCatalog = async (props: CatalogEditProps) => {
		const response = await FetchService.fetch<CatalogProps>(
			apiUrlCreator.createCatalog(),
			JSON.stringify(props),
			MimeTypes.json,
		);
		if (!response.ok) return;
		const newCatalogProps = await response.json();
		router.pushPath("/" + newCatalogProps.name);
	};

	return (
		<CatalogPropsEditor
			catalogProps={{
				url: "",
				code: "",
				title: "",
				description: "",
			}}
			trigger={trigger}
			onSubmit={createCatalog}
		/>
	);
};

export default CreateCatalog;
