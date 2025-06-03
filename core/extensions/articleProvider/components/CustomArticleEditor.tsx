import { Editor, Extensions, JSONContent } from "@tiptap/core";
import getExtensions, { GetExtensionsPropsOptions } from "@ext/markdown/core/edit/logic/getExtensions";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import Document from "@tiptap/extension-document";
import { useMemo } from "react";
import SmallEditor from "@ext/inbox/components/Editor/SmallEditor";
import Main, { MainMenuOptions } from "@ext/markdown/core/edit/components/Menu/Menus/Main";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";

interface TemplateEditorProps {
	title: string;
	content: JSONContent;
	id: string;
	extensions?: Extensions;
	providerType: ArticleProviderType;
	extensionsOptions?: GetExtensionsPropsOptions;
	menuOptions?: MainMenuOptions;
	onUpdate: (id: string, content: JSONContent, title: string) => void;
}

const getCustomArticleExtensions = (extensions: Extensions, options?: GetExtensionsPropsOptions): Extensions => [
	...getExtensions(options),
	...extensions,
	Document.extend({
		content: `paragraph ${ElementGroups.block}+`,
	}),
];

const CustomArticleEditor = (props: TemplateEditorProps) => {
	const { title, content, id, extensions: customExtensions, extensionsOptions, onUpdate, menuOptions, providerType } = props;
	const extensions = useMemo(
		() => getCustomArticleExtensions(customExtensions, extensionsOptions),
		[customExtensions, extensionsOptions],
	);

	return (
		<SmallEditor
			props={{ title, content }}
			content={content}
			id={id}
			articleType={providerType}
			extensions={extensions}
			updateCallback={onUpdate}
			options={{ menu: (editor: Editor) => <Main editor={editor} includeResources={false} {...menuOptions} /> }}
		/>
	);
};

export default CustomArticleEditor;
