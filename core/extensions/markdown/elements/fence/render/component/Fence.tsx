import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import { Property } from "csstype";
import Highlight, { defaultProps, Language } from "prism-react-renderer";
import themeDark from "prism-react-renderer/themes/nightOwl";
import themeLight from "prism-react-renderer/themes/nightOwlLight";
import { HTMLProps, useState } from "react";
import useLocalize from "../../../../../localization/useLocalize";
import ThemeService from "../../../../../Theme/components/ThemeService";

import { gherkin } from "../logic/prism-gherkin";
import Theme from "@ext/Theme/Theme";

const Fence = styled(
	({ className, value, overflow, ...props }: HTMLProps<HTMLElement> & { overflow?: Property.Overflow }) => {
		const theme = ThemeService.value;
		const language = props.lang?.replace(/language-/, "");
		const [coppedIsExpanded, setCoppedIsExpanded] = useState(false);
		const [copped, setCopped] = useState(false);
		const clickToCopyText = useLocalize("clickToCopy");
		const copiedText = useLocalize("copied");

		const coppedText = () => {
			setCopped(true);
			navigator.clipboard.writeText((value as string).trim());
		};

		gherkin(defaultProps.Prism);

		const styledClassName = " " + className;
		return (
			<Highlight
				{...defaultProps}
				theme={theme === Theme.dark ? themeDark : themeLight}
				code={(value as string).trim()}
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
						<div style={{ overflow: overflow ?? "auto", padding: `${props?.style?.padding ?? "20"}px` }}>
							{coppedIsExpanded ? (
								<Tooltip content={!copped ? clickToCopyText : copiedText}>
									<div className="hover-right-button" onClick={coppedText}>
										<Icon code={!copped ? "copy" : "check"} faFw={true} />
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
	}
)`
	background: var(--color-code-bg) !important;
	border-radius: var(--radius-block);

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
