import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { defaultRefreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import BranchData from "@ext/VersionControl/model/branch/BranchData";
import t from "@ext/localization/locale/translate";
import { ComponentProps } from "react";
import InfoModalForm from "../../../../extensions/errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "../../../../extensions/errorHandlers/logic/GetErrorComponent";
import CatalogPropsService from "../../../../ui-logic/ContextServices/CatalogProps";
import { useRouter } from "../../../Api/useRouter";

const ArticleNotFoundErrorComponent = (args: ComponentProps<typeof GetErrorComponent>) => {
	const router = useRouter();
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<InfoModalForm
			{...args}
			title={t("article.error.not-found.title")}
			actionButton={{
				text: t("refresh"),
				onClick: async () => {
					const res = await FetchService.fetch<BranchData>(
						apiUrlCreator.getVersionControlCurrentBranchUrl({ cached: false }),
					);
					if (!res.ok) return;
					const branch = (await res.json())?.name;
					const path = RouterPathProvider.updatePathnameData(new Path(catalogProps.link.pathname), {
						refname: branch,
					});
					router.pushPath(path.value);
					args.onCancelClick();
					defaultRefreshPage();
				},
			}}
		>
			<span>{t("article.error.not-found.body")}</span>
		</InfoModalForm>
	);
};

export default ArticleNotFoundErrorComponent;
