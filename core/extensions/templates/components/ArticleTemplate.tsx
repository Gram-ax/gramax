import ArticleExtensions from "@components/Article/ArticleExtensions";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import SmallEditor from "@ext/inbox/components/Editor/SmallEditor";
import t from "@ext/localization/locale/translate";
import { ContentEditorId } from "@ext/markdown/core/edit/components/ContentEditor";
import getExtensions from "@ext/markdown/core/edit/logic/getExtensions";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import TemplateMenu from "@ext/templates/components/TemplateMenu";
import TemplateService from "@ext/templates/components/TemplateService";
import { TemplateProps } from "@ext/templates/models/types";
import Document from "@tiptap/extension-document";
import { Editor, Extensions, JSONContent } from "@tiptap/react";
import { useCallback, useMemo, useState } from "react";

const getTemplateExtensions = (): Extensions => [
	...getExtensions({ isTemplateInstance: false }),
	Document.extend({
		content: `paragraph ${ElementGroups.block}+`,
	}),
	Placeholder.configure({
		placeholder: ({ editor, node }) => {
			if (editor.state.doc.firstChild.type.name === "paragraph" && editor.state.doc.firstChild === node)
				return t("template.placeholders.title");

			if (
				node.type.name === "paragraph" &&
				editor.state.doc.content.child(1) === node &&
				editor.state.doc.content.childCount === 2
			)
				return t("template.placeholders.content");
		},
	}),
];

const ContainerWrapper = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
`;

const StyledWrapper = styled.div`
	flex: 1 1 0px;
	display: flex;
	gap: 1rem;
	flex-direction: row;
	margin-top: -0.1rem;

	> div:first-of-type {
		width: 100%;
	}
`;

const ArticleTemplate = ({ template }: { template: TemplateProps }) => {
	const [content, setContent] = useState<JSONContent>(null);
	const [isLoading, setIsLoading] = useState(true);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { templates } = TemplateService.value;

	const fetchContent = useCallback(async () => {
		setIsLoading(true);
		const res = await FetchService.fetch(apiUrlCreator.getTemplateContent(template.id));
		if (!res.ok) return setIsLoading(false);

		const json = getArticleWithTitle(template.title, await res.json());
		setContent(json);
		setIsLoading(false);
	}, [apiUrlCreator, template.id, template.title]);

	const updateContent = useCallback(
		(id: string, content: JSONContent, title: string) => {
			const newTemplate = templates.get(id);
			if (!newTemplate) return;

			if (newTemplate.title !== title) {
				newTemplate.title = title.trim();
			}

			let newContent = { ...content };
			newContent.content.shift();
			newContent = getArticleWithTitle(title, newContent);

			TemplateService.setTemplates(Array.from(templates.values()));
		},
		[templates, content],
	);

	useWatch(() => {
		fetchContent();
	}, [template.id]);

	const extensions = useMemo(() => getTemplateExtensions(), []);

	return (
		<ContainerWrapper>
			<StyledWrapper>
				<div>
					{isLoading ? (
						<SpinnerLoader />
					) : (
						<SmallEditor
							props={{ title: template.title, content }}
							content={content}
							id={template.id}
							path={template.ref.path}
							articleType="template"
							extensions={extensions}
							updateCallback={updateContent}
							options={{ menu: (editor: Editor) => <TemplateMenu editor={editor} /> }}
						/>
					)}
				</div>
			</StyledWrapper>
			<ArticleExtensions id={ContentEditorId} />
		</ContainerWrapper>
	);
};

export default ArticleTemplate;
