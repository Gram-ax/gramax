import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import LanguageService from "@core-ui/ContextServices/Language";
import t from "@ext/localization/locale/translate";
import Language from "../core/model/Language";

const SwitchUiLanguage = () => {
	return (
		<PopupMenuLayout trigger={<ButtonLink iconCode="globe" text={t("current")} />}>
			{Object.values(Language).map((l, idx) => (
				<ButtonLink key={idx} onClick={() => LanguageService.setUiLanguage(l)} text={t("current", l)} />
			))}
		</PopupMenuLayout>
	);
};

export default SwitchUiLanguage;
