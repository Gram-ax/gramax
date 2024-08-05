import Tooltip from "@components/Atoms/Tooltip";
import Anchor from "@components/controls/Anchor";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

const Term = styled(
	({
		title,
		summary,
		children,
		className,
		url,
	}: {
		title: string;
		summary: string;
		children: any;
		className?: string;
		url: string;
	}) => {
		return (
			<span className={className} data-qa={"term"}>
				<Tooltip
					content={
						<div className={className}>
							<div className="content">
								{summary && <span className="summary">{summary}</span>}
								{children}
								{url ? <Anchor href={url}>{t("more")}</Anchor> : null}
							</div>
						</div>
					}
					interactive={true}
				>
					<span className="term">{title}</span>
				</Tooltip>
			</span>
		);
	},
)`
	.content {
		gap: 3px;
		display: flex;
		font-size: 14px;
		line-height: initial;
		flex-direction: column;

		.summary {
			font-weight: 500;
		}

		a {
			outline: none !important;
			color: var(--color-tooltip-text) !important;
		}
	}

	.term {
		border-bottom: 1px dotted var(--color-article-text);
		cursor: help;
	}
`;

export default Term;
