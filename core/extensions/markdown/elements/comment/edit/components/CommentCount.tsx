import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import Icon from "../../../../../../components/Atoms/Icon";
import Tooltip from "../../../../../../components/Atoms/Tooltip";

const VersionControlCommentCount = ({ count, className }: { count: number; className?: string }) => {
	return count > 0 ? (
		<Tooltip content={<span>{t("numbero-of-unsolved-comments")}</span>}>
			<div className={className}>
				<Icon
					code="message-square"
					viewBox="2 2 20 20"
					svgStyle={{ fill: "var(--color-text-accent)" }}
					style={{ color: "var(--color-text-accent)", fontSize: "1.2em" }}
				/>
				<div className="count">{count}</div>
			</div>
		</Tooltip>
	) : null;
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
