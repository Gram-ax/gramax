import styled from "@emotion/styled";
import useLocalize from "../../extensions/localization/useLocalize";
import Icon from "../Atoms/Icon";
import Tooltip from "../Atoms/Tooltip";

const VersionControlCommentCount = styled(({ count, className }: { count: number; className?: string }) => {
	return count > 0 ? (
		<Tooltip content={<span>{useLocalize("numberoOfUnsolvedComments")}</span>}>
			<div className={className}>
				<Icon prefix="fad" code="comment-alt" style={{ fontSize: "15px", color: "var(--color-text-accent)" }} />
				<div className="count">{count}</div>
			</div>
		</Tooltip>
	) : null;
})`
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

export default VersionControlCommentCount;
