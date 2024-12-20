import ContentEditable from "@components/Atoms/ContentEditable";
import Icon from "@components/Atoms/Icon";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import CurrentTabsTagService from "@ext/markdown/elements/tabs/components/CurrentTabsTagService";
import getVisibleChildAttrs from "@ext/markdown/elements/tabs/logic/getVisibleChildAttrs";
import TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";
import { ReactElement, useState } from "react";

const Tabs = ({
	className,
	childAttrs,
	children,
	onAddClick,
	onTabEnter,
	onRemoveClick,
	onNameUpdate,
	isEdit = false,
}: {
	isEdit?: boolean;
	childAttrs: TabAttrs[];
	children?: ReactElement;
	onAddClick?: () => void;
	onTabEnter?: (idx: number) => void;
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
				<div className="switch" contentEditable="false">
					{visibleChildAttrs.map(({ name, icon, idx }, key) => {
						return (
							<div
								key={idx}
								onClick={() => setActiveIdx(idx)}
								className={`case ${activeIdx == idx ? "active" : ""} ${idx}`}
							>
								{icon && <Icon code={icon} />}
								{isEdit ? (
									<ContentEditable
										value={name}
										className="text"
										deps={[visibleChildAttrs.length]}
										onEnter={() => onTabEnter(idx)}
										onChange={(v) => onNameUpdate(v, idx)}
									/>
								) : (
									<span title={name} className="read text">
										{name}
									</span>
								)}
								{isEdit && (
									<Icon
										key={key}
										isAction
										data-qa="qa-del-tab"
										code="x"
										className="xmark"
										tooltipContent={
											visibleChildAttrs.length == 1
												? t("editor.tabs.delete-last")
												: t("editor.tabs.delete")
										}
										onClick={(e) => {
											onRemoveClick(idx);
											setActiveIdx(0);
											e.stopPropagation();
										}}
									/>
								)}
							</div>
						);
					})}
					{isEdit && visibleChildAttrs.length < 5 && (
						<Icon
							code="plus"
							viewBox="3 3 18 18"
							isAction
							data-qa="qa-add-tab"
							tooltipContent={t("editor.tabs.add")}
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
	margin: ${(p) => (p.isEdit ? "-4px -8px 0.2em -8px" : "0 0 0.2em 0")};
	.switch {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 0.7rem;
		gap: ${(p) => (p.isEdit ? "0.3rem" : "1rem")};
		border-bottom: var(--color-article-text) solid 1px;

		.case {
			gap: 0.1rem;
			display: flex;
			max-height: 34px;
			font-weight: 400;
			align-items: center;
			cursor: ${(p) => (p.isEdit ? "text" : "pointer")};
			max-width: ${(p) =>
				p.isEdit
					? `calc(((100% - ${p.childAttrs.length != 5 ? "20px" : "0px"}) / ${p.childAttrs.length}) - 0.5rem)`
					: `calc((100% / ${p.childAttrs.length}) - 1rem)`};

			.read {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap !important;
			}

			.text {
				border-bottom: 2px #ffffff0f solid;
			}

			.xmark {
				visibility: hidden;
			}
		}

		.case:hover {
			.text {
				border-bottom: var(--color-text-secondary) solid 2px;
			}

			.xmark {
				visibility: ${(p) => (p.isEdit ? "visible" : "hidden")};
			}
		}

		.case.active {
			.text {
				border-bottom: var(--color-article-text) solid 2px;
			}
		}
	}

	.tabs {
		position: relative;

		.tab {
			top: 0;
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
