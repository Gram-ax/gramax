import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { defaultRefreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import BranchData from "@ext/VersionControl/model/branch/BranchData";
import { ComponentProps } from "react";
import InfoModalForm from "../../../../extensions/errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "../../../../extensions/errorHandlers/logic/GetErrorComponent";
import useLocalize from "../../../../extensions/localization/useLocalize";
import CatalogPropsService from "../../../../ui-logic/ContextServices/CatalogProps";
import { useRouter } from "../../../Api/useRouter";

const NotFoundErrorComponent = (args: ComponentProps<typeof GetErrorComponent>) => {
	const router = useRouter();
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<InfoModalForm
			{...args}
			title={useLocalize("articleNotFound")}
			actionButton={{
				text: useLocalize("refresh"),
				onClick: async () => {
					const res = await FetchService.fetch<BranchData>(
						apiUrlCreator.getVersionControlCurrentBranchUrl({ cached: false }),
					);
					if (!res.ok) return;
					const branch = (await res.json())?.name;
					const path = RouterPathProvider.updatePathnameData(new Path(catalogProps.link.pathname), {
						branch,
					});
					router.pushPath(path.value);
					args.onCancelClick();
					defaultRefreshPage();
				},
			}}
		>
			<span>{useLocalize("articleNotFountError")}</span>
		</InfoModalForm>
	);
};

export default NotFoundErrorComponent;
