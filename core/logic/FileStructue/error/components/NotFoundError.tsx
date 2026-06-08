import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { defaultRefreshPage } from "@core-ui/utils/initGlobalFuncs";
import { DialogErrorHeader } from "@ext/errorHandlers/client/components/DialogErrorHeader";
import t from "@ext/localization/locale/translate";
import type BranchData from "@ext/VersionControl/model/branch/BranchData";
import { DialogBody, DialogFooterTemplate } from "@ui-kit/Dialog";
import type { GetErrorComponentProps } from "../../../../extensions/errorHandlers/logic/GetErrorComponent";
import { useRouter } from "../../../Api/useRouter";

const ArticleNotFoundErrorComponent = (args: GetErrorComponentProps) => {
	const router = useRouter();
	const catalogLinkPath = useCatalogPropsStore((state) => state.data?.link.pathname);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const onRefresh = async () => {
		const res = await FetchService.fetch<BranchData>(apiUrlCreator.getCurrentBranch({ cached: false }));
		if (!res.ok) return;
		const branch = (await res.json())?.name;
		const path = RouterPathProvider.updatePathnameData(new Path(catalogLinkPath), {
			refname: branch,
		});
		router.pushPath(path.value);
		args.onCancelClick();
		defaultRefreshPage();
	};

	return (
		<>
			<DialogErrorHeader title={t("article.error.not-found.title")} />
			<DialogBody>
				<span>{t("article.error.not-found.body")}</span>
			</DialogBody>
			<DialogFooterTemplate
				primaryButton={t("refresh")}
				primaryButtonProps={{ onClick: onRefresh }}
				secondaryButton={t("cancel")}
				secondaryButtonProps={{ onClick: args.onCancelClick, variant: "outline" }}
			/>
		</>
	);
};

export default ArticleNotFoundErrorComponent;
