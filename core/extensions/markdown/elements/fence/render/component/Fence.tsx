import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { Property } from "csstype";
import Highlight, { defaultProps, Language } from "prism-react-renderer";
import themeDark from "prism-react-renderer/themes/nightOwl";
import themeLight from "prism-react-renderer/themes/nightOwlLight";
import { CSSProperties, useState } from "react";
import ThemeService from "../../../../../Theme/components/ThemeService";

import Theme from "@ext/Theme/Theme";
import { gherkin } from "../logic/prism-gherkin";

interface FenceProps {
	value: string;
	style?: CSSProperties;
	lang?: string;
	overflow?: Property.Overflow;
	className?: string;
}

const Fence = styled((props: FenceProps) => {
	const { lang, value = "", overflow, className, style: mainStyle } = props;
	const theme = ThemeService.value;
	const language = lang?.replace(/language-/, "");
	const [coppedIsExpanded, setCoppedIsExpanded] = useState(false);
	const [copped, setCopped] = useState(false);
	const clickToCopyText = t("click-to-copy");
	const copiedText = t("copied");

	const coppedText = () => {
		setCopped(true);
		navigator.clipboard.writeText(value.trim());
	};

	gherkin(defaultProps.Prism);

	const styledClassName = " " + className;
	return (
		<Highlight
			{...defaultProps}
			theme={theme === Theme.dark ? themeDark : themeLight}
			code={(value ?? "").trim()}
			language={language as Language}
		>
			{({ className, style, tokens, getLineProps, getTokenProps }) => (
				<pre
					className={className + styledClassName}
					style={{ ...style, position: "relative" }}
					onMouseEnter={() => setCoppedIsExpanded(true)}
					onMouseLeave={() => {
						setCoppedIsExpanded(false);
						setCopped(false);
					}}
				>
					<div style={{ overflow: overflow ?? "auto", padding: `${mainStyle?.padding ?? "0"}px` }}>
						{coppedIsExpanded ? (
							<Tooltip content={!copped ? clickToCopyText : copiedText}>
								<div className="hover-right-button" onClick={coppedText}>
									<Icon code={!copped ? "copy" : "check"} />
								</div>
							</Tooltip>
						) : null}

						{tokens.map((line, i) => (
							<div
								className={className}
								key={i}
								style={{ ...style, color: "var(--color-article-text)" }}
								{...getLineProps({ line, key: i })}
							>
								{line.map((token, key) => (
									<span key={key} {...getTokenProps({ token, key })} />
								))}
							</div>
						))}
					</div>
				</pre>
			)}
		</Highlight>
	);
})`
	background: var(--color-code-bg) !important;
	border-radius: var(--radius-normal);

	*::-webkit-scrollbar {
		height: var(--scroll-width);
		width: var(--scroll-width);
	}

	.hover-right-button {
		top: 8px;
		width: 35px;
		right: 8px;
		height: 35px;
		display: flex;
		cursor: pointer;
		font-size: 17px;
		padding: 0px 2px;
		border-radius: 3px;
		position: absolute;
		align-items: center;
		justify-content: center;
		color: var(--color-primary-general);
		background: var(--color-article-bg);
	}
`;

export default Fence;
