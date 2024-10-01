import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import translate from "@ext/localization/locale/translate";
import LangList from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LangList";
import lowlight from "@ext/markdown/elements/codeBlockLowlight/edit/logic/Lowlight";
import ExtendedCodeBlockLowlight from "@ext/markdown/elements/codeBlockLowlight/edit/model/codeBlockLowlight";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { HTMLAttributes, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

interface CodeBlockProps {
	value: string;
	lang?: LangList;
	style?: HTMLAttributes<HTMLPreElement>["style"];
	className?: string;
	withoutHighlight?: boolean;
}

const CodeBlock = (props: CodeBlockProps) => {
	const { languageClassPrefix, monochromeClassName } = ExtendedCodeBlockLowlight.options;
	const { lang = "", value = "", withoutHighlight, className, style } = props;
	const [coppedIsExpanded, setCoppedIsExpanded] = useState(false);

	const [copped, setCopped] = useState(false);

	const language = lang.replace(languageClassPrefix, "");
	const clickToCopyText = translate("click-to-copy");
	const copiedText = translate("copied");

	const coppedText = () => {
		setCopped(true);
		void navigator.clipboard.writeText(value.trim());
	};

	if (withoutHighlight) {
		return (
			<pre className={classNames(className)} style={style}>
				{value.trim()}
			</pre>
		);
	}

	const tree = lowlight.registered(language)
		? lowlight.highlight(language, value.trim())
		: lowlight.highlightAuto(value.trim());

	return (
		<pre
			className={classNames(className, { [monochromeClassName]: !lowlight.registered(language) })}
			style={style}
			onMouseEnter={() => setCoppedIsExpanded(true)}
			onMouseLeave={() => {
				setCoppedIsExpanded(false);
				setCopped(false);
			}}
		>
			<div className={"child-wrapper"}>
				{coppedIsExpanded && (
					<Tooltip content={!copped ? clickToCopyText : copiedText}>
						<div className={"hover-right-button"} onClick={coppedText}>
							<Icon code={!copped ? "copy" : "check"} />
						</div>
					</Tooltip>
				)}
				{toJsxRuntime(tree, { jsx, jsxs, Fragment })}
			</div>
		</pre>
	);
};

export default styled(CodeBlock)`
	background: var(--color-code-bg) !important;
	border-radius: var(--radius-small);
	position: relative;
	padding: 0 !important;

	.child-wrapper {
		overflow: auto;
		padding: 1.375em 1.625em;
	}

	.hover-right-button {
		top: 8px;
		width: 35px;
		right: 8px;
		height: 35px;
		display: flex;
		cursor: pointer;
		font-size: 17px;
		padding: 0 2px;
		border-radius: var(--radius-medium);
		position: absolute;
		align-items: center;
		justify-content: center;
		color: var(--color-primary-general);
		background: var(--color-article-bg);
	}
`;
