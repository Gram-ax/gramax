import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import type { ContentLanguage } from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import { MouseEvent } from "react";

export type RemoveContentLanguageProps = {
	setIsLoading: (flag: boolean) => void;
	targetCode: ContentLanguage;
	disabled: boolean;
};

const RemoveContentLanguage = ({ targetCode, disabled, setIsLoading }: RemoveContentLanguageProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const removeLanguage = async (ev: MouseEvent<HTMLElement>) => {
		ev.preventDefault();
		ev.stopPropagation();

		if (!(await confirm(t("multilang.delete-confirm")))) return;

		setIsLoading(true);
		await FetchService.fetch(apiUrlCreator.removeCatalogLanguage(targetCode));
		setIsLoading(false);
		refreshPage();
	};

	return <ButtonLink iconCode="trash" text={t("delete")} onClick={removeLanguage} disabled={disabled} />;
};

export default RemoveContentLanguage;
