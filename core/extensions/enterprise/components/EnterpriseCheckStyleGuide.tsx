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
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { CheckSuggestion } from "@ics/gx-vector-search";
import { toast } from "@ui-kit/Toast";

const EnterpriseCheckStyleGuide = () => {
	const workspace = WorkspaceService.current();
	const { isNext } = usePlatform();

	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;
	const apiUrlCreator = ApiUrlCreatorService.value;

	if (isNext || !workspace?.enterprise?.modules?.styleGuide) return null;

	const checkArticle = async () => {
		if (!workspace?.enterprise?.modules?.styleGuide) return;
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
		if (!result) return ModalToOpenService.resetValue();

		const isError = "code" in result && result.code !== 200;
		if (isError) {
			ModalToOpenService.resetValue();
			return toast(result.message, { status: "error", icon: "alert-circle", focus: "medium" });
		}

		const suggestionItems = getSuggestionItems(result as CheckSuggestion[], paragraphs);
		editor.commands.setSuggestion(suggestionItems);
		ModalToOpenService.resetValue();
	};

	return (
		<DropdownMenuItem onSelect={checkArticle}>
			<Icon icon="spell-check" />
			{t("style-guide.check-with-style-guide")}
		</DropdownMenuItem>
	);
};

export default EnterpriseCheckStyleGuide;
