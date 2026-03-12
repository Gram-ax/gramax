import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

const VersionControlCommentCount = ({ count, className }: { count: number; className?: string }) => {
	if (typeof count !== "number" || count <= 0) return null;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className={className}>
					<Icon
						code="message-square"
						style={{ color: "var(--color-text-accent)", fontSize: "1.2em" }}
						svgStyle={{ fill: "var(--color-text-accent)" }}
						viewBox="2 2 20 20"
					/>
					<div className="count">{count}</div>
				</div>
			</TooltipTrigger>
			<TooltipContent>
				<span>{t("numbero-of-unsolved-comments")}</span>
			</TooltipContent>
		</Tooltip>
	);
};

export default styled(VersionControlCommentCount)`
	width: auto !important;
	position: relative;
	display: inline-flex;
	justify-content: center;
	margin-left: var(--distance-i-span);

	> i::after {
		opacity: 1;
	}

	.count {
		color: var(--color-text-count);
		font-size: 8px;
		font-weight: 700;
		position: absolute;
		line-height: 13.5px;
	}
`;
