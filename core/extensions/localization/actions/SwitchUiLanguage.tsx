import Icon from "@components/Atoms/Icon";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import LanguageService from "@core-ui/ContextServices/Language";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import UiLanguage from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import { useCallback } from "react";

const SwitchUiLanguage = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isNext } = usePlatform();

	const setLanguage = useCallback(
		async (language: UiLanguage) => {
			if (!isNext) return LanguageService.setUiLanguage(language);

			const r = await FetchService.fetch(apiUrlCreator.getSetLanguageURL(language));
			if (r.ok) LanguageService.setUiLanguage(language);
		},
		[apiUrlCreator],
	);

	const current = LanguageService.currentUi();

	return (
		<PopupMenuLayout trigger={<ButtonLink iconCode="globe" text={t("current")} />}>
			{Object.values(UiLanguage).map((l, idx) => (
				<ButtonLink
					key={idx}
					onClick={l == current ? null : () => setLanguage(l)}
					text={t("current", l)}
					fullWidth={current == l}
					rightActions={[current == l ? <Icon key={0} code="check" /> : null]}
				/>
			))}
		</PopupMenuLayout>
	);
};

export default SwitchUiLanguage;
