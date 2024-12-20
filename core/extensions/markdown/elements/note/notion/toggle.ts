import t from "@ext/localization/locale/translate";
import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const toggle: NotionNodeConverter = (toggleNode) => {
	return {
		type: "note",
		attrs: {
			title: toggleNode[toggleNode.type]?.rich_text[0]?.plain_text || t("more"),
			type: "info",
			collapsed: true,
		},
		content: toggleNode.content,
	};
};

export default toggle;
