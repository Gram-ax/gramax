import ContentEditable from "@components/Atoms/ContentEditable";
import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { ReactElement, useState } from "react";

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
		<div className={className} data-component="tabs">
			{(childAttrs.length == 1 && !isEdit) || isPrint ? null : (
				<div className="switch" contentEditable="false" suppressContentEditableWarning>
					<div className="cases flex flex-row gap-2 overflow-hidden min-w-0">
						{childAttrs.map(({ name, icon, idx }, key) => {
							return (
								<div
									key={idx}
									onClick={() => setActiveIdx(idx)}
									className={`case ${activeIdx == idx ? "active" : ""} ${idx}`}
								>
									{icon && <Icon code={icon} style={{ marginRight: "0.2em" }} />}
									{isEdit ? (
										<ContentEditable
											value={name}
											className="text"
											deps={[childAttrs.length]}
											onEnter={() => onTabEnter(idx)}
											onChange={(v) => onNameUpdate(v, idx)}
										/>
									) : (
										<span title={name} className="read text">
											{name}
										</span>
									)}
									{isEdit && (
										<Tooltip>
											<TooltipTrigger asChild>
												<IconButton
													key={key}
													size="lg"
													variant="text"
													data-qa="qa-del-tab"
													icon="x"
													style={{ padding: "0", height: "auto" }}
													className="tabs-action w-4 h-4"
													onClick={(e) => {
														onRemoveClick(idx);
														setActiveIdx(0);
														e.stopPropagation();
													}}
												/>
											</TooltipTrigger>
											<TooltipContent>
												{childAttrs.length == 1
													? t("editor.tabs.delete-last")
													: t("editor.tabs.delete")}
											</TooltipContent>
										</Tooltip>
									)}
								</div>
							);
						})}
					</div>
					{isEdit && (
						<div className="flex flex-row gap-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<IconButton
										size="lg"
										variant="text"
										data-qa="qa-add-tab"
										icon="plus"
										disabled={childAttrs.length >= 5}
										style={{ padding: "0", height: "auto" }}
										className="tabs-action w-4 h-4"
										onClick={(e) => {
											onAddClick();
											setActiveIdx((prev) => prev + 1);
											e.stopPropagation();
										}}
									/>
								</TooltipTrigger>
								<TooltipContent>{t("editor.tabs.add")}</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<IconButton
										size="lg"
										variant="text"
										data-qa="qa-delete-tabs"
										icon="trash"
										style={{ padding: "0", height: "auto" }}
										className="tabs-action w-4 h-4"
										onClick={(e) => {
											onDeleteClick();
											e.stopPropagation();
										}}
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

	const tabCaseIndex = parseInt(tabCaseClassName.slice(2));
	if (isNaN(tabCaseIndex)) return;

	const neededTabActivator = tabsEl.querySelector<HTMLElement>(`.case:nth-of-type(${tabCaseIndex + 1})`);
	if (!neededTabActivator) return;

	if (!neededTabActivator.classList.contains("active")) neededTabActivator.click();
	const elementToHighlight = neededTabActivator.querySelector("span");

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

		.case {
			gap: 0.1rem;
			display: flex;
			max-height: 34px;
			font-weight: 400;
			align-items: center;
			cursor: ${(p) => (p.isEdit ? "text" : "pointer")};
			max-width: ${(p) => `${100 / p.childAttrs.length}%`};

			.read {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap !important;
				flex: 1;
			}

			.text {
				border-bottom: 2px #ffffff0f solid;
			}

			.tabs-action {
				flex-shrink: 0;
				visibility: hidden;
			}
		}

		.case:hover {
			.text {
				border-bottom: var(--color-text-secondary) solid 2px;
			}

			.tabs-action {
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
