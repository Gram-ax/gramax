import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import translate from "@ext/localization/locale/translate";
import { useLowlightActions } from "@ext/markdown/elements/codeBlockLowlight/edit/component/CodeBlockComponent";
import lowlight from "@ext/markdown/elements/codeBlockLowlight/edit/logic/Lowlight";
import { Lang, getLowerLangName } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LowlightLangs";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { HTMLAttributes, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

interface CodeBlockProps {
	value: string;
	lang?: Lang;
	style?: HTMLAttributes<HTMLPreElement>["style"];
	className?: string;
	withoutHighlight?: boolean;
}

const CodeBlock = (props: CodeBlockProps) => {
	const { lang = "", value = "", withoutHighlight, className, style } = props;
	const trimVal = value.trim();
	const [coppedIsExpanded, setCoppedIsExpanded] = useState(false);
	const lowerLang = getLowerLangName(lang);
	const { isRegistered } = useLowlightActions({ language: lang });

	const [copped, setCopped] = useState(false);

	const clickToCopyText = translate("click-to-copy");
	const copiedText = translate("copied");

	const coppedText = () => {
		setCopped(true);
		void navigator.clipboard.writeText(trimVal);
	};

	if (withoutHighlight) {
		return (
			<pre className={classNames(className)} style={style}>
				{trimVal}
			</pre>
		);
	}

	const tree = isRegistered ? lowlight.highlight(lowerLang, trimVal) : lowlight.highlight("none", trimVal);

	return (
		<pre
			className={className}
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

	font-size: 0.8em;
	line-height: 1.5625em;

	.child-wrapper {
		overflow: auto;
		padding: 1.375em 1.625em;
	}

	.hover-right-button {
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
	}
`;
