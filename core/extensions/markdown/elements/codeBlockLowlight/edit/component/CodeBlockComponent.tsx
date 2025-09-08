import BlockActionPanel from "@components/BlockActionPanel";
import CodeBlockActions from "@ext/markdown/elements/codeBlockLowlight/edit/component/CodeBlockActions";
import { loadLanguage, checkLanguage } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/Lowlight";
import {
	getLowerLangName,
	getOriginalLangName,
	getStandardCaseByLower,
} from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LowlightLangs";
import StyledCodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/StyledCodeBlock";
import { Editor, NodeViewProps } from "@tiptap/core";
import { NodeViewContent } from "@tiptap/react";
import { useLayoutEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";

export const useLowlightActions = (props: {
	language?: string;
	updateAttributes?: (props: any) => void;
	editor?: Editor;
}) => {
	const { language, updateAttributes, editor } = props;
	const [isRegistered, setIsRegistered] = useState(false);

	const internalLogic = async (lang: string) => {
		const langRegistered = checkLanguage(lang);
		if (langRegistered) {
			setIsRegistered(true);
			forceUpdate();
			return;
		}

		const res = await loadLanguage(lang);
		if (res && res.registered(lang)) setIsRegistered(true);
		forceUpdate();
	};

	const forceUpdate = () => {
		if (!editor || editor.isDestroyed || !editor.view) return;
		editor.view.dispatch(editor.view.state.tr.setMeta("forceUpdate", true));
	};

	useLayoutEffect(() => {
		const lowerLang = getLowerLangName(language);
		void internalLogic(lowerLang);
	}, [language]);

	const onChange = (lang: string) => {
		const lowerLang = getLowerLangName(lang);
		updateAttributes?.({ language: lowerLang });
		void internalLogic(lowerLang);
	};

	return { onChange, isRegistered };
};

const StyledNodeViewContent = styled(NodeViewContent)`
	white-space: unset !important;

	> div:first-of-type {
		overflow: auto;
		padding: 1.375em 1.625em;
	}
`;

const CodeBlockComponent = (props: NodeViewProps) => {
	const { node, editor, getPos, updateAttributes } = props;
	const viewWrapperRef = useRef<HTMLDivElement>(null);
	const isEditable = editor.isEditable;

	const { onChange } = useLowlightActions({
		language: getOriginalLangName(getStandardCaseByLower(node.attrs.language)),
		updateAttributes,
		editor,
	});

	return (
		<NodeViewContextableWrapper ref={viewWrapperRef} props={props}>
			<BlockActionPanel
				updateAttributes={updateAttributes}
				hoverElementRef={viewWrapperRef}
				getPos={getPos}
				rightActions={isEditable && <CodeBlockActions onChange={onChange} node={node} />}
			>
				<StyledCodeBlock>
					<StyledNodeViewContent />
				</StyledCodeBlock>
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};

export default CodeBlockComponent;
