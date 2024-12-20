import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const confluenceConfig = {
	titleKey: "unsupported-elements.confluence.title",
	descriptionKey: "unsupported-elements.confluence.description",
	noteTitleKey: "unsupported-elements.confluence.noteTitle",
};

const notionConfig = {
	titleKey: "unsupported-elements.notion.title",
	descriptionKey: "unsupported-elements.notion.description",
	noteTitleKey: "unsupported-elements.notion.noteTitle",
};

const defaultConfig = {
	titleKey: "unsupported-elements.default.title",
	descriptionKey: "unsupported-elements.default.description",
	noteTitleKey: "unsupported-elements.default.noteTitle",
};

const sourceTypeConfig: Record<string, any> = {
	default: defaultConfig,
	[SourceType.confluenceCloud]: confluenceConfig,
	[SourceType.confluenceServer]: confluenceConfig,
	[SourceType.notion]: notionConfig,
};

export default sourceTypeConfig;
