import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import type TabAttrs from "@ext/markdown/elements/tabs/model/TabAttrs";
import TabActionButton from "@ext/markdown/elements/tabs/render/component/Helpers/TabActionButton";
import type { PropertyID, PropertyValue } from "@ext/properties/models";
import { ToggleGroup } from "@ui-kit/ToggleGroup";
import { type ReactElement, useCallback, useState } from "react";
import TabCase from "./TabCase";

interface TabsProps {
	isEdit?: boolean;
	isPrint?: boolean;
	childAttrs: TabAttrs[];
	children?: ReactElement;
	onAddClick?: () => void;
	onDeleteClick?: () => void;
	onRemoveClick?: (idx: number) => void;
	onNameUpdate?: (value: string, idx: number) => void;
	onPropertyAdd?: (index: number, property: PropertyID, value?: string) => void;
	onPropertyDelete?: (index: number, property: PropertyID) => void;
	getTabProperties?: (index: number) => PropertyValue[];
	className?: string;
}

const Tabs = (props: TabsProps) => {
	const {
		className,
		childAttrs,
		children,
		onAddClick,
		onRemoveClick,
		onDeleteClick,
		onNameUpdate,
		onPropertyAdd,
		onPropertyDelete,
		getTabProperties,
		isEdit = false,
		isPrint = false,
	} = props;
	const [activeIdx, setActiveIdx] = useState(0);
	const hasActiveCatalogView = useCatalogPropsStore((state) => !!state.data?.resolvedView);

	const onValueChange = useCallback((value: string) => {
		if (!value.length) return;
		setActiveIdx(+value);
	}, []);

	if (!childAttrs.length) return null;
	return (
		<div
			className={cn(
				className,
				childAttrs.length === 1 && (isPrint || hasActiveCatalogView) && "print-single-tab",
				(childAttrs.length > 1 || !hasActiveCatalogView) &&
					!isPrint &&
					"border border-secondary-border rounded-xl p-2",
			)}
			data-component="tabs"
		>
			{isPrint ? null : (
				<div className="switch" contentEditable="false" suppressContentEditableWarning>
					<div className="cases flex flex-row gap-1 overflow-hidden min-w-0 items-center">
						<ToggleGroup
							className="cases-container"
							onValueChange={onValueChange}
							type="single"
							value={`${activeIdx}`}
						>
							{childAttrs.map(({ name, icon, idx }, key) => (
								<TabCase
									getTabProperties={getTabProperties}
									icon={icon}
									idx={idx}
									isActive={activeIdx === idx}
									isEdit={isEdit}
									key={key + idx}
									name={name}
									onClick={setActiveIdx}
									onNameUpdate={onNameUpdate}
									onPropertyAdd={onPropertyAdd}
									onPropertyDelete={onPropertyDelete}
									onRemoveClick={(tabIdx) => {
										onRemoveClick?.(tabIdx);
										setActiveIdx(0);
									}}
								/>
							))}
						</ToggleGroup>
						{isEdit && childAttrs.length < 5 && (
							<TabActionButton
								className="tabs-action p-2 h-auto shrink-0"
								data-qa="qa-add-tab"
								icon="plus"
								onClick={(e) => {
									onAddClick();
									setActiveIdx((prev) => prev + 1);
									e.stopPropagation();
								}}
								size="lg"
								tooltip={t("editor.tabs.add")}
								variant="ghost"
							/>
						)}
					</div>
					{isEdit && (
						<div className="flex flex-row gap-2">
							<TabActionButton
								className="tabs-action p-2 h-auto"
								data-qa="qa-delete-tabs"
								icon="trash"
								onClick={(e) => {
									onDeleteClick();
									e.stopPropagation();
								}}
								size="lg"
								tooltip={t("delete")}
								variant="ghost"
							/>
						</div>
					)}
				</div>
			)}
			<div className={`tabs c-${activeIdx}`}>{children}</div>
		</div>
	);
};

export default styled(Tabs)`
	margin: -4px -8px 0.2em -8px;

	.switch {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 0.7rem;
		gap: 0.25rem;
	}

	.cases {
		padding-right: 1rem;
		flex: 1;
		max-width: 100%;
		overflow-x: hidden;
	}

	.cases-container {
		max-width: 100%;
		justify-content: flex-start;
	}

	.content p:last-of-type,
	.tab p:last-of-type {
		margin-bottom: 0;
	}

	&.print-single-tab .case {
		display: none;
	}

	.tabs {
		position: relative;
	}

	.tabs .tab {
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
