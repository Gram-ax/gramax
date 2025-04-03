import BlockActionPanel from "@components/BlockActionPanel";
import useWatch from "@core-ui/hooks/useWatch";
import CodeBlockActions from "@ext/markdown/elements/codeBlockLowlight/edit/component/CodeBlockActions";
import { loadLanguage, checkLanguage } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/Lowlight";
import { getLowerLangName } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LowlightLangs";
import { NodeViewProps } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { useRef, useState } from "react";

export const useLowlightActions = (props: { language?: string; updateAttributes?: (props: any) => void }) => {
	const { language, updateAttributes } = props;
	const [isRegistered, setIsRegistered] = useState(false);

	const internalLogic = async (lang: string) => {
		const lowerLang = getLowerLangName(lang);
		if (!lowerLang) {
			return updateAttributes?.({ language: lang });
		}

		const langRegistered = checkLanguage(lowerLang);
		if (langRegistered) {
			updateAttributes?.({ language: lowerLang });
			return setIsRegistered(true);
		}

		const res = await loadLanguage(lowerLang);
		if (res && res.registered(lowerLang)) {
			setIsRegistered(true);
			updateAttributes?.({ language: lowerLang });
		}
	};

	useWatch(() => {
		void internalLogic(language);
	}, [language]);

	const onChange = (lang: string) => {
		void internalLogic(lang);
	};

	return { onChange, isRegistered };
};

const CodeBlockComponent = (props: NodeViewProps) => {
	const { node, editor, getPos, updateAttributes } = props;
	const viewWrapperRef = useRef<HTMLDivElement>(null);
	const isEditable = editor.isEditable;

	const { onChange } = useLowlightActions({ language: node.attrs.language, updateAttributes });

	return (
		<NodeViewWrapper ref={viewWrapperRef}>
			<BlockActionPanel
				updateAttributes={updateAttributes}
				hoverElementRef={viewWrapperRef}
				getPos={getPos}
				rightActions={
					isEditable && <CodeBlockActions onChange={onChange} editor={editor} node={node} getPos={getPos} />
				}
			>
				<pre>
					<NodeViewContent />
				</pre>
			</BlockActionPanel>
		</NodeViewWrapper>
	);
};

export default CodeBlockComponent;
