import ButtonLink from "@components/Molecules/ButtonLink";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import astToParagraphs from "@ext/StyleGuide/logic/astToParagraphs";
import { getSuggestionItems } from "@ext/StyleGuide/logic/getSuggestionItems";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import t from "@ext/localization/locale/translate";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { ParagraphsMerger } from "@ics/gx-ai";
import { useEffect, useState } from "react";

const EnterpriseCheckStyleGuide = () => {
	const [render, setRender] = useState(false);
	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;

	const checkArticle = async () => {
		const editor = EditorService.getEditor();
		if (!editor) return;
		ModalToOpenService.setValue(ModalToOpen.Loading, { title: "Проверка статьи" });
		const paragraphs = astToParagraphs(editor.getJSON());
		const result = await new EnterpriseApi(gesUrl).checkStyleGuide(paragraphs);
		const paragraphsMerger = new ParagraphsMerger(result ?? { suggestions: [] }, { paragraphs });
		const suggestionItems = getSuggestionItems(paragraphsMerger.getMergedParagraphs(), paragraphs);
		editor.commands.setSuggestion(suggestionItems);
		ModalToOpenService.resetValue();
	};

	const healthcheck = async (gesUrl: string) => {
		const res = await new EnterpriseApi(gesUrl).healthcheckStyleGuide();
		setRender(res);
	};

	useEffect(() => {
		if (!gesUrl) return;
		healthcheck(gesUrl);
	}, []);

	if (!render) return null;
	return (
		<li>
			<ButtonLink iconCode="spell-check" text={t("style-guide.check-with-style-guide")} onClick={checkArticle} />
		</li>
	);
};

export default EnterpriseCheckStyleGuide;
