import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import type TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type ReactElement, useState } from "react";
import TabCase from "./TabCase";

interface TabsProps {
	isEdit?: boolean;
	isPrint?: boolean;
	childAttrs: TabAttrs[];
	children?: ReactElement;
	onAddClick?: () => void;
	onDeleteClick?: () => void;
	onTabEnter?: (idx: number) => void;
	onRemoveClick?: (idx: number) => void;
	onNameUpdate?: (value: string, idx: number) => void;
	className?: string;
}

const Tabs = (props: TabsProps) => {
	const {
		className,
		childAttrs,
		children,
		onAddClick,
		onTabEnter,
		onRemoveClick,
		onDeleteClick,
		onNameUpdate,
		isEdit = false,
		isPrint = false,
	} = props;
	const [activeIdx, setActiveIdx] = useState(0);

	if (!childAttrs.length) return null;
	return (
		<div
			className={classNames(className, { "print-single-tab": childAttrs.length === 1 && isPrint })}
			data-component="tabs"
		>
			{(childAttrs.length === 1 && !isEdit) || isPrint ? null : (
				<div className="switch" contentEditable="false" suppressContentEditableWarning>
					<div className="cases flex flex-row gap-2 overflow-hidden min-w-0">
						{childAttrs.map(({ name, icon, idx }, key) => (
							<TabCase
								activeIdx={activeIdx}
								icon={icon}
								idx={idx}
								isEdit={isEdit}
								key={key + idx}
								name={name}
								onClick={setActiveIdx}
								onNameUpdate={onNameUpdate}
								onRemoveClick={(tabIdx) => {
									onRemoveClick?.(tabIdx);
									setActiveIdx(0);
								}}
								onTabEnter={onTabEnter}
								totalTabs={childAttrs.length}
							/>
						))}
					</div>
					{isEdit && (
						<div className="flex flex-row gap-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<IconButton
										className="tabs-action w-4 h-4"
										data-qa="qa-add-tab"
										disabled={childAttrs.length >= 5}
										icon="plus"
										onClick={(e) => {
											onAddClick();
											setActiveIdx((prev) => prev + 1);
											e.stopPropagation();
										}}
										size="lg"
										style={{ padding: "0", height: "auto" }}
										variant="text"
									/>
								</TooltipTrigger>
								<TooltipContent>{t("editor.tabs.add")}</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<IconButton
										className="tabs-action w-4 h-4"
										data-qa="qa-delete-tabs"
										icon="trash"
										onClick={(e) => {
											onDeleteClick();
											e.stopPropagation();
										}}
										size="lg"
										style={{ padding: "0", height: "auto" }}
										variant="text"
									/>
								</TooltipTrigger>
								<TooltipContent>{t("delete")}</TooltipContent>
							</Tooltip>
						</div>
					)}
				</div>
			)}
			<div className={`tabs c-${activeIdx}`}>{children}</div>
		</div>
	);
};

export const tabsFoundElementBeforeHighlightHandler = (foundEl: HTMLElement) => {
	const tabsEl = foundEl.closest('[data-component="tabs"]');
	if (!tabsEl) return;

	const isFoundElementTabActivator = foundEl.parentElement?.classList.contains("case");
	if (isFoundElementTabActivator) {
		foundEl.click();
		return;
	}

	const tabWithFoundElement = foundEl.closest(".tab");
	if (!tabWithFoundElement) return;

	const tabCaseClassName = Array.from(tabWithFoundElement.classList.values()).find((className) =>
		className.startsWith("c-"),
	);
	if (!tabCaseClassName) return;

	const tabCaseIndex = parseInt(tabCaseClassName.slice(2), 10);
	if (Number.isNaN(tabCaseIndex)) return;

	const neededTabActivator = tabsEl.querySelector<HTMLElement>(`.case:nth-of-type(${tabCaseIndex + 1})`);
	if (!neededTabActivator) return;

	if (!neededTabActivator.classList.contains("active")) neededTabActivator.click();
	// div in editor / span in docportal
	const elementToHighlight = neededTabActivator.querySelector(":scope > *");

	return elementToHighlight ? { additionalElementsToHighlight: [elementToHighlight] } : undefined;
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

		.cases {
			padding-right: 1rem;
			flex: 1;
		}
	}

	&.print-single-tab {
		.case {
			display: none;
		}
	}

	.tabs {
		position: relative;

		.tab {
			${(p) =>
				!p.isPrint &&
				`
				opacity: 0;
				width: 100%;
				top: 0;
				left: 0;
				pointer-events: none;
				position: absolute;
				visibility: hidden;
			`}
		}
	}

	.tabs.c-0 .tab.c-0,
	.tabs.c-1 .tab.c-1,
	.tabs.c-2 .tab.c-2,
	.tabs.c-3 .tab.c-3,
	.tabs.c-4 .tab.c-4,
	.tabs.c-5 .tab.c-5 {
		opacity: 1;
		width: unset;
		position: unset;
		visibility: visible;
		pointer-events: all;
	}
`;
