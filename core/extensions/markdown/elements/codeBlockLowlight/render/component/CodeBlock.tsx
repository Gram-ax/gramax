import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import isNavigatorAvailable from "@core-ui/isNavigatorAvailable";
import { tryCopyToClipboard } from "@core-ui/utils/clipboard";
import { cn } from "@core-ui/utils/cn";
import translate from "@ext/localization/locale/translate";
import { useLowlightActions } from "@ext/markdown/elements/codeBlockLowlight/edit/component/CodeBlockComponent";
import lowlight from "@ext/markdown/elements/codeBlockLowlight/edit/logic/Lowlight";
import { type Lang, normalizeLangName } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LowlightLangs";
import { splitCodeIntoLines } from "@ext/markdown/elements/codeBlockLowlight/print/splitCodeIntoLines";
import StyledCodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/StyledCodeBlock";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { type HTMLAttributes, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

interface CodeBlockProps {
	children: string;
	language?: Lang;
	style?: HTMLAttributes<HTMLPreElement>["style"];
	withoutHighlight?: boolean;
	isPrint?: boolean;
	className?: string;
}

const CodeBlock = (props: CodeBlockProps) => {
	const { language = "", children = "", withoutHighlight, style, isPrint, className } = props;
	const trimVal = children.trim();
	const [coppedIsExpanded, setCoppedIsExpanded] = useState(false);
	const normalizedLang = normalizeLangName(language);
	const { isRegistered } = useLowlightActions({ language: normalizedLang });
	const copyAllowed = isNavigatorAvailable();

	const [copped, setCopped] = useState(false);

	const clickToCopyText = translate("click-to-copy");
	const copiedText = translate("copied");

	const coppedText = () => {
		void tryCopyToClipboard(trimVal, { showPopover: false }).then((copied) => copied && setCopped(true));
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
		<StyledCodeBlock
			className={cn(
				className,
				`[&_.child-wrapper]:py-[1.375em]`,
				`[&_.child-wrapper]:px-[1.625em]`,
				isPrint && "[&_.child-wrapper]:!whitespace-pre-wrap",
			)}
			isPrint={isPrint}
			onMouseEnter={onMouseEnterHandler}
			onMouseLeave={onMouseLeaveHandler}
			spellCheck={false}
			style={style}
		>
			{coppedIsExpanded && (
				<Tooltip content={!copped ? clickToCopyText : copiedText}>
					<div
						className={cn(
							"absolute top-2 right-2",
							"flex items-center justify-center",
							"h-[2em] w-[2em]",
							"cursor-pointer",
							"px-[2px]",
							"text-[1.0625em]",
							"rounded-[var(--radius-medium)]",
							"text-[var(--color-primary-general)]",
							"bg-[var(--color-article-bg)]",
						)}
						onClick={coppedText}
					>
						<Icon code={!copped ? "copy" : "check"} />
					</div>
				</Tooltip>
			)}
			{isPrint ? splitCodeIntoLines(tree) : toJsxRuntime(tree, { jsx, jsxs, Fragment })}
		</StyledCodeBlock>
	);
};

export default CodeBlock;
