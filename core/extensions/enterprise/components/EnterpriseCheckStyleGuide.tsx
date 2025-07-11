import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import astToParagraphs from "@ext/StyleGuide/logic/astToParagraphs";
import { getSuggestionItems } from "@ext/StyleGuide/logic/getSuggestionItems";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import t from "@ext/localization/locale/translate";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { ParagraphsMerger } from "@ics/gx-ai";
import { useEffect, useState } from "react";

const EnterpriseCheckStyleGuide = () => {
	const [render, setRender] = useState(false);
	const { isNext } = usePlatform();
	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const checkArticle = async () => {
		const editor = EditorService.getEditor();
		if (!editor) return;
		ModalToOpenService.setValue(ModalToOpen.Loading, { title: "Проверка статьи" });

		const res = await FetchService.fetch(apiUrlCreator.getArticleEditorContent());
		if (!res.ok) {
			ModalToOpenService.resetValue();
			return;
		}
		const content = await res.json();
		const json = content;
		json.content.shift();

		const paragraphs = astToParagraphs(json);
		const result = await new EnterpriseApi(gesUrl).checkStyleGuide(paragraphs);
		const paragraphsMerger = new ParagraphsMerger({ suggestions: result ?? [] }, { paragraphs });
		const suggestionItems = getSuggestionItems(paragraphsMerger.getMergedParagraphs(), paragraphs);
		editor.commands.setSuggestion(suggestionItems);
		ModalToOpenService.resetValue();
	};

	const healthcheck = async (gesUrl: string) => {
		const res = await new EnterpriseApi(gesUrl).healthcheckStyleGuide();
		setRender(res);
	};

	useEffect(() => {
		if (!gesUrl || isNext) return;
		healthcheck(gesUrl);
	}, []);

	if (!render) return null;
	return <ButtonLink iconCode="spell-check" text={t("style-guide.check-with-style-guide")} onClick={checkArticle} />;
};

export default EnterpriseCheckStyleGuide;
