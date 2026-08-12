import Icon from "@components/Atoms/Icon";
// biome-ignore lint/style/noRestrictedImports: will be removed with new sidebars
import styled from "@emotion/styled";
import { DiffCheckbox } from "@ext/git/core/Diff/components/Changes/DiffCheckbox";
import t from "@ext/localization/locale/translate";

export type SelectAllProps = {
	isSelectedAll: boolean;
	onSelectAll: (select: boolean, reset: boolean) => void;
	onDiscard: (e: React.MouseEvent<HTMLDivElement>) => void;
	canDiscard: boolean;
	overview: JSX.Element;
};

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-left: 1rem;
	padding-right: 1rem;
	cursor: pointer;

	> div {
		display: flex;
		align-items: center;
		justify-content: center;

		> span {
			color: var(--color-merge-request-text);
		}
	}

	.action {
		padding-left: 0;
		width: 0;
		opacity: 0;
		transition: all 0.07s ease-in-out;
		color: var(--color-nav-item);
		:hover {
			color: var(--color-nav-item-selected);
		}
	}

	:hover {
		.action {
			padding-left: var(--distance-i-span);
			width: 1.5em;
			opacity: 1;
		}
	}
`;

const CheckboxWrapper = styled.div`
	gap: 0.3rem;
`;

const SelectAll = ({ isSelectedAll, onSelectAll, onDiscard, canDiscard, overview }: SelectAllProps) => {
	return (
		<Wrapper
			className="hover:bg-secondary-bg-hover"
			data-qa="qa-clickable"
			onClick={(e) => {
				onSelectAll(!isSelectedAll, true);
				e.stopPropagation();
			}}
		>
			<CheckboxWrapper>
				<DiffCheckbox checked={isSelectedAll} />
				<span>{t("properties.select-all")}</span>
			</CheckboxWrapper>
			<div>
				{overview}
				{canDiscard && (
					<Icon
						className="action"
						code="reply-all"
						onClick={onDiscard}
						tooltipContent={t("git.discard.select-all-arrow-tooltip")}
					/>
				)}
			</div>
		</Wrapper>
	);
};

export default SelectAll;
