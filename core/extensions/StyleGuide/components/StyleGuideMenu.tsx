import Tooltip from "@components/Atoms/Tooltip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import useWatch from "@core-ui/hooks/useWatch";
import astToSentences from "@ext/StyleGuide/logic/astToSentences";
import { getSuggestionItems } from "@ext/StyleGuide/logic/getSuggestionItems";
import settingsStorage from "@ext/StyleGuide/logic/settingsStorage";
import t from "@ext/localization/locale/translate";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { StyleGuideChecker } from "gx-ai";
import { useEffect, useState } from "react";
import StyleGuideAccountSettings, { AccountSettings } from "./StyleGuideAccountSettings";
import StyleGuideCheckSettings, { CheckSettings } from "./StyleGuideCheckSettings";

const getErrorTooltipText = (accountSettings: AccountSettings, checkSettings: CheckSettings) => {
	if (!accountSettings && !checkSettings) return "Настройте подключение и правила";
	if (!accountSettings && checkSettings) return "Настройте подключение";
	if (accountSettings && !checkSettings) return "Настройте правила";
};

const StyleGuideMenu = () => {
	const [checkSettings, setCheckSettings] = useState<CheckSettings>(null);
	const [accountSettings, setAccountSettings] = useState<AccountSettings>(null);
	const [styleGuideChecker, setStyleGuideChecker] = useState<StyleGuideChecker>(null);

	useEffect(() => {
		setCheckSettings(settingsStorage.getCheckSettings());
		setAccountSettings(settingsStorage.getAccountSettings());
	}, []);

	useWatch(() => {
		if (!accountSettings || !checkSettings) return;
		setStyleGuideChecker(
			new StyleGuideChecker({
				llm: {
					model: accountSettings.model,
					apiKey: accountSettings.token,
				},
				styleGuideOptions: {
					rules: checkSettings.rules,
				},
			}),
		);
	}, [accountSettings, checkSettings]);

	const checkArticle = async () => {
		const editor = EditorService.getEditor();
		if (!styleGuideChecker || !editor) return;
		ModalToOpenService.setValue(ModalToOpen.Loading, { title: "Проверка статьи" });
		const paragraphModel = astToSentences(editor.getJSON());
		const result = await styleGuideChecker.check({ paragraphs: paragraphModel });
		const suggestionItems = getSuggestionItems(result, paragraphModel);
		editor.commands.setSuggestion(suggestionItems);
		ModalToOpenService.resetValue();
	};

	return (
		<li>
			<PopupMenuLayout
				offset={[0, 20]}
				trigger={<ButtonLink iconCode="spell-check" text={t("style-guide.check-with-style-guide")} />}
			>
				<Tooltip
					disabled={!!accountSettings && !!checkSettings}
					content={<span>{getErrorTooltipText(accountSettings, checkSettings)}</span>}
				>
					<ButtonLink
						disabled={!accountSettings || !checkSettings}
						iconCode="file-check-2"
						text={t("style-guide.check-article")}
						className={!accountSettings || !checkSettings ? "disabled" : ""}
						onClick={checkArticle}
					/>
				</Tooltip>
				<div className="divider" />
				<StyleGuideCheckSettings
					trigger={<ButtonLink iconCode="settings" text={t("style-guide.set-up-style-guide")} />}
					settings={checkSettings}
					setSettings={(settings) => {
						settingsStorage.setCheckSettings(settings);
						setCheckSettings(settings);
					}}
				/>
				<StyleGuideAccountSettings
					trigger={<ButtonLink iconCode="bot" text={t("style-guide.set-up-connection")} />}
					settings={accountSettings}
					setSettings={(settings) => {
						settingsStorage.setAccountSettings(settings);
						setAccountSettings(settings);
					}}
				/>
			</PopupMenuLayout>
		</li>
	);
};

export default StyleGuideMenu;
