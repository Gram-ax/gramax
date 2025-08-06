import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";
import { ProgressIconButton } from "@ui-kit/Button";

export const useCardError = (link: CatalogLink, error: DefaultError) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const onClick = async () => {
		ErrorConfirmService.notify(error);
		await FetchService.fetch(apiUrlCreator.getRemoveCloneCatalogUrl(link.name));
		ErrorConfirmService.onModalClose = async () => {
			await refreshPage();
		};
	};

	return { onClick };
};

const CardError = ({ link, error }: { link: CatalogLink; error: DefaultError }) => {
	const { onClick } = useCardError(link, error);
	return (
		<div className="flex flex-row gap-2 text-status-error">
			<span style={{ fontSize: "11px" }}>{t("git.clone.error.title")}</span>
			<ProgressIconButton
				className="ml-auto text-status-error hover:text-status-error-hover"
				icon="circle-x"
				size="sm"
				onClick={onClick}
			/>
		</div>
	);
};

export default CardError;
