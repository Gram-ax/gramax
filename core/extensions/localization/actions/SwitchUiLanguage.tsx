import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import LanguageService from "@core-ui/ContextServices/Language";
import UiLanguage from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";

const SwitchUiLanguage = () => {
	return (
		<PopupMenuLayout trigger={<ButtonLink iconCode="globe" text={t("current")} />}>
			{Object.values(UiLanguage).map((l, idx) => (
				<ButtonLink key={idx} onClick={() => LanguageService.setUiLanguage(l)} text={t("current", l)} />
			))}
		</PopupMenuLayout>
	);
};

export default SwitchUiLanguage;
