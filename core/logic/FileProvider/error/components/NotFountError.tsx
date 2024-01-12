import { defaultRefreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import { ComponentProps } from "react";
import ErrorForm from "../../../../extensions/errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "../../../../extensions/errorHandlers/logic/GetErrorComponent";
import useLocalize from "../../../../extensions/localization/useLocalize";
import CatalogPropsService from "../../../../ui-logic/ContextServices/CatalogProps";
import { useRouter } from "../../../Api/useRouter";

const NotFountErrorComponent = (args: ComponentProps<typeof GetErrorComponent>) => {
	const router = useRouter();
	const catalogProps = CatalogPropsService.value;

	return (
		<ErrorForm
			{...args}
			title={useLocalize("articleNotFound")}
			actionButton={{
				text: useLocalize("refresh"),
				onClick: () => {
					router.pushPath(catalogProps.name);
					args.onCancelClick();
					defaultRefreshPage();
				},
			}}
		>
			<span>{useLocalize("articleNotFountError")}</span>
		</ErrorForm>
	);
};

export default NotFountErrorComponent;
