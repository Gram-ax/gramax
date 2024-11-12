import ArticleExtensions from "@components/Article/ArticleExtensions";
import Checkbox from "@components/Atoms/Checkbox";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useWatch from "@core-ui/hooks/useWatch";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import Menu from "@ext/markdown/core/edit/components/Menu/Menu";
import { getSimpleExtensions } from "@ext/markdown/core/edit/logic/getExtensions";
import DiffTriggers from "@ext/markdown/elements/diff/components/DiffTriggers";
import EditorExtensionsService from "@ext/markdown/elements/diff/components/EditorExtensionsService";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { EditorContent, useEditor } from "@tiptap/react";
import { useState } from "react";

const IsDiffModeNav = () => {
	const [isDiffMode, setIsDiffMode] = useState(false);

	useWatch(() => {
		if (isDiffMode) {
			ArticleViewService.setView(() => <DiffModeView />);
		} else {
			ArticleViewService.setDefaultView();
		}
	}, [isDiffMode]);

	return (
		<Checkbox checked={isDiffMode} onClick={setIsDiffMode}>
			<span style={{ fontSize: "12px" }}>Diff mode</span>
		</Checkbox>
	);
};

const DiffModeView = () => {
	const editor = EditorService.getEditor();
	const extensions = EditorExtensionsService.value;

	const newEditor = useEditor(
		{
			extensions: extensions ? [...extensions] : getSimpleExtensions(),
			content: editor?.getJSON(),
		},
		[editor, extensions],
	);
	const oldContentEditor = useEditor(
		{ extensions: extensions ? [...extensions] : getSimpleExtensions(), editable: false },
		[extensions],
	);

	return (
		<>
			<EditorContent editor={oldContentEditor} data-qa="article-editor" />
			<DiffTriggers editor={newEditor} oldContentEditor={oldContentEditor} />
			<Menu editor={newEditor} id={"diff-mode-extensions"} key={"diff-mode-extensions"} />
			<EditorContent editor={newEditor} data-qa="article-editor" />
			<ArticleMat editor={newEditor} />
			<ArticleExtensions id={"diff-mode-extensions"} />
		</>
	);
};

export default IsDiffModeNav;
