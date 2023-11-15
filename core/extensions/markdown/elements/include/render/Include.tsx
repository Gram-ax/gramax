import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "../../../../../logic/Api/useRouter";
import ThemeService from "../../../../Theme/components/ThemeService";

export default function Include({ path, children }: { path: string; children: JSX.Element }) {
	const catalogProps = CatalogPropsService.value;
	const pageDataContext = PageDataContextService.value;
	const apiUrlCreator: ApiUrlCreator = new ApiUrlCreator(
		useRouter()?.basePath,
		pageDataContext?.lang,
		ThemeService?.value,
		pageDataContext?.isLogged,
		catalogProps?.name,
		path,
	);

	return <ApiUrlCreatorService.Provider value={apiUrlCreator}>{children ?? null}</ApiUrlCreatorService.Provider>;
}
