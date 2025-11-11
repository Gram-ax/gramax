import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import isNavigatorAvailable from "@core-ui/isNavigatorAvailable";
import styled from "@emotion/styled";
import translate from "@ext/localization/locale/translate";
import { useLowlightActions } from "@ext/markdown/elements/codeBlockLowlight/edit/component/CodeBlockComponent";
import lowlight from "@ext/markdown/elements/codeBlockLowlight/edit/logic/Lowlight";
import { Lang, normalizeLangName } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LowlightLangs";
import { splitCodeIntoLines } from "@ext/markdown/elements/codeBlockLowlight/print/splitCodeIntoLines";
import StyledCodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/StyledCodeBlock";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { HTMLAttributes, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

interface CodeBlockProps {
	value: string;
	language?: Lang;
	style?: HTMLAttributes<HTMLPreElement>["style"];
	withoutHighlight?: boolean;
	isPrint?: boolean;
}

const StyledHoverButton = styled.div`
	top: 8px;
	width: 2.1875em;
	right: 8px;
	height: 2.1875em;
	display: flex;
	cursor: pointer;
	font-size: 1.0625em;
	padding: 0 2px;
	border-radius: var(--radius-medium);
	position: absolute;
	align-items: center;
	justify-content: center;
	color: var(--color-primary-general);
	background: var(--color-article-bg);
`;

const NewStyledCodeBlock = styled(StyledCodeBlock)`
	.child-wrapper {
		padding: 1.375em 1.625em !important;
		${(p) => (p.isPrint ? "white-space: pre-wrap !important" : "")};
	}
`;

const CodeBlock = (props: CodeBlockProps) => {
	const { language = "", value = "", withoutHighlight, style, isPrint } = props;
	const trimVal = value.trim();
	const [coppedIsExpanded, setCoppedIsExpanded] = useState(false);
	const normalizedLang = normalizeLangName(language);
	const { isRegistered } = useLowlightActions({ language: normalizedLang });
	const copyAllowed = isNavigatorAvailable();

	const [copped, setCopped] = useState(false);

	const clickToCopyText = translate("click-to-copy");
	const copiedText = translate("copied");

	const coppedText = () => {
		setCopped(true);
		void navigator.clipboard.writeText(trimVal);
	};

	if (withoutHighlight) {
		return <StyledCodeBlock style={style}>{trimVal}</StyledCodeBlock>;
	}

	const onMouseEnterHandler = () => {
		if (!copyAllowed) return;
		setCoppedIsExpanded(true);
	};

	const onMouseLeaveHandler = () => {
		if (!copyAllowed) return;
		setCoppedIsExpanded(false);
		setCopped(false);
	};

	const tree =
		isRegistered && normalizedLang && lowlight.registered(normalizedLang)
			? lowlight.highlight(normalizedLang, trimVal)
			: lowlight.highlight("none", trimVal);

	return (
		<NewStyledCodeBlock
			style={style}
			onMouseEnter={onMouseEnterHandler}
			onMouseLeave={onMouseLeaveHandler}
			isPrint={isPrint}
		>
			{coppedIsExpanded && (
				<Tooltip content={!copped ? clickToCopyText : copiedText}>
					<StyledHoverButton onClick={coppedText}>
						<Icon code={!copped ? "copy" : "check"} />
					</StyledHoverButton>
				</Tooltip>
			)}
			{isPrint ? splitCodeIntoLines(tree) : toJsxRuntime(tree, { jsx, jsxs, Fragment })}
		</NewStyledCodeBlock>
	);
};

export default CodeBlock;
