import ContentEditable from "@components/Atoms/ContentEditable";
import Icon from "@components/Atoms/Icon";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import styled from "@emotion/styled";
import CurrentTabsTagService from "@ext/markdown/elements/tabs/components/CurrentTabsTagService";
import getVisibleChildAttrs from "@ext/markdown/elements/tabs/logic/getVisibleChildAttrs";
import TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";
import { ReactElement, useState } from "react";

const Tabs = ({
	className,
	childAttrs,
	children,
	onAddClick,
	onRemoveClick,
	onNameUpdate,
	isEdit = false,
}: {
	isEdit?: boolean;
	childAttrs: TabAttrs[];
	children?: ReactElement;
	onAddClick?: () => void;
	onRemoveClick?: (idx: number) => void;
	onNameUpdate?: (value: string, idx: number) => void;
	className?: string;
}): ReactElement => {
	const currentTag = CurrentTabsTagService.value;
	const catalogProps = CatalogPropsService.value;
	const tabsTags = catalogProps?.tabsTags;
	const tags = tabsTags?.tags ?? [];

	const visibleChildAttrs = getVisibleChildAttrs(tags, currentTag, childAttrs);
	const [activeIdx, setActiveIdx] = useState(0);

	if (!visibleChildAttrs.length) return null;
	return (
		<div className={className}>
			{visibleChildAttrs.length == 1 && !isEdit ? null : (
				<div className="switch" contentEditable={false}>
					{visibleChildAttrs.map(({ name, icon, idx }, key) => {
						return (
							<div
								key={key}
								onClick={() => setActiveIdx(idx)}
								className={`case ${activeIdx == idx ? "active" : ""} ${idx}`}
							>
								{icon && <Icon code={icon} />}
								{isEdit ? (
									<ContentEditable
										value={name}
										deps={[visibleChildAttrs.length]}
										onChange={(v) => onNameUpdate(v, idx)}
									/>
								) : (
									<span>{name}</span>
								)}
								{isEdit && (
									<Icon
										key={key}
										code="xmark"
										isAction
										onClick={() => {
											onRemoveClick(idx);
											setActiveIdx(0);
										}}
									/>
								)}
							</div>
						);
					})}
					{isEdit && visibleChildAttrs.length < 5 && (
						<Icon
							code="plus"
							isAction
							onClick={() => {
								onAddClick();
								setActiveIdx(visibleChildAttrs.length);
							}}
						/>
					)}
				</div>
			)}
			<div className={`tabs c-${activeIdx}`}>{children}</div>
		</div>
	);
};

export default styled(Tabs)`
	.switch {
		gap: 1rem;
		display: flex;
		flex-direction: row;
		align-items: baseline;
		margin-bottom: 0.7rem;
		border-bottom: var(--color-article-text) solid 1px;

		.case {
			display: flex;
			cursor: pointer;
			max-height: 34px;
			align-items: center;
			padding-bottom: 0.2rem;
			gap: var(--distance-i-span);
			border-bottom: 2px #ffffff0f solid;
			max-width: calc((100% / 5) - 13px);
		}

		.case:hover {
			border-bottom: var(--color-article-text) solid 2px;
		}

		.case.active {
			border-bottom: var(--color-article-text) solid 2px;
		}
	}

	.tabs {
		position: relative;

		.tab {
			left: 0;
			position: absolute;
			visibility: hidden;
			pointer-events: none;
		}
	}

	.tabs.c-0 .tab.c-0,
	.tabs.c-1 .tab.c-1,
	.tabs.c-2 .tab.c-2,
	.tabs.c-3 .tab.c-3,
	.tabs.c-4 .tab.c-4,
	.tabs.c-5 .tab.c-5 {
		position: unset;
		visibility: visible;
		pointer-events: all;
	}
`;
