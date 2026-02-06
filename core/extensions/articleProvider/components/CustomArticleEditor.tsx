import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import SmallEditor from "@ext/inbox/components/Editor/SmallEditor";
import Main, { ToolbarMenuProps } from "@ext/markdown/core/edit/components/Menu/Menus/Toolbar";
import getExtensions, { GetExtensionsPropsOptions } from "@ext/markdown/core/edit/logic/getExtensions";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import { Editor, Extensions, JSONContent } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import { useMemo } from "react";

interface TemplateEditorProps {
	title: string;
	content: JSONContent;
	id: string;
	extensions?: Extensions;
	providerType: ArticleProviderType;
	extensionsOptions?: GetExtensionsPropsOptions;
	menuOptions?: ToolbarMenuProps;
	onUpdate: (id: string, content: JSONContent, title: string) => void;
}

const getCustomArticleExtensions = (extensions: Extensions, options?: GetExtensionsPropsOptions): Extensions => [
	...getExtensions(options),
	Comment,
	...extensions,
	Document.extend({
		content: `paragraph ${ElementGroups.block}+`,
	}),
];

const CustomArticleEditor = (props: TemplateEditorProps) => {
	const {
		title,
		content,
		id,
		extensions: customExtensions,
		extensionsOptions,
		onUpdate,
		menuOptions,
		providerType,
	} = props;
	const extensions = useMemo(
		() => getCustomArticleExtensions(customExtensions, extensionsOptions),
		[customExtensions, extensionsOptions],
	);

	return (
		<SmallEditor
			articleType={providerType}
			content={content}
			extensions={extensions}
			id={id}
			options={{ menu: (editor: Editor) => <Main editor={editor} includeResources={false} {...menuOptions} /> }}
			props={{ title, content }}
			updateCallback={onUpdate}
		/>
	);
};

export default CustomArticleEditor;
