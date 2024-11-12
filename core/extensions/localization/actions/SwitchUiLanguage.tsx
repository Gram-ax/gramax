import { getExecutingEnvironment } from "@app/resolveModule/env";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import LanguageService from "@core-ui/ContextServices/Language";
import UiLanguage from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import { useCallback } from "react";

const SwitchUiLanguage = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const setLanguage = useCallback(
		(language: UiLanguage) => {
			if (getExecutingEnvironment() == "next") FetchService.fetch(apiUrlCreator.getSetLanguageURL(language));
			LanguageService.setUiLanguage(language);
		},
		[apiUrlCreator],
	);

	return (
		<PopupMenuLayout trigger={<ButtonLink iconCode="globe" text={t("current")} />}>
			{Object.values(UiLanguage).map((l, idx) => (
				<ButtonLink key={idx} onClick={() => setLanguage(l)} text={t("current", l)} />
			))}
		</PopupMenuLayout>
	);
};

export default SwitchUiLanguage;
