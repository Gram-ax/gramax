import ButtonsLayout from "@components/Layouts/ButtonLayout";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { PanelMenu } from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";
import AIGroup from "@ext/markdown/elements/article/edit/helpers/Panels/AIGroup";
import CodeMenuButton from "@ext/markdown/elements/code/edit/components/CodeMenuButton";
import CommentMenuButton from "@ext/markdown/elements/comment/edit/components/CommentMenuButton";
import FileMenuButton from "@ext/markdown/elements/file/edit/components/FileMenuButton";
import LinkMenuButton from "@ext/markdown/elements/link/edit/components/LinkMenuButton";
import { Editor } from "@tiptap/core";

interface InlineMenuGroupProps {
	editor?: Editor;
	onClick?: () => void;
	isGramaxAiEnabled?: boolean;
	setPanel?: (panel: PanelMenu) => void;
}

const InlineMenuGroup = ({ editor, onClick, isGramaxAiEnabled, setPanel }: InlineMenuGroupProps) => {
	const syntax = CatalogPropsService.value.syntax;
	const supportedElements = getFormatterType(syntax).supportedElements;
	const isCommentSupported = supportedElements.includes("comment");

	return (
		<ButtonsLayout>
			<LinkMenuButton onClick={onClick} editor={editor} />
			<CodeMenuButton editor={editor} />
			<FileMenuButton onSave={onClick} editor={editor} />
			{isGramaxAiEnabled && (
				<>
					<div className="divider" />
					<AIGroup setPanel={setPanel} />
				</>
			)}
			<div className="divider" />
			{isCommentSupported && <CommentMenuButton onClick={onClick} editor={editor} />}
		</ButtonsLayout>
	);
};

export default InlineMenuGroup;
