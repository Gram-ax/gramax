import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cn } from "@core-ui/utils/cn";
// biome-ignore lint/style/noRestrictedImports: unable to fix this at now
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
const TabsContent = styled.div<{ activeIdx: number; isPrint: boolean }>`
	position: relative;

	${(p) =>
		!p.isPrint &&
		`
		.tab:not([data-tab-index="${p.activeIdx}"]) {
			opacity: 0;
			width: 100%;
			top: 0;
			left: 0;
			height: 0;
			pointer-events: none;
			position: absolute;
			visibility: hidden;
			overflow: hidden;
		}
	`}
`;

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
	const hasActiveCatalogView = useCatalogPropsStore((state) => !!state.data?.resolvedView);
	const [activeTab, setActiveTab] = useState<number>(0);

	const onValueChange = useCallback((value: string) => {
		if (!value.length) return;
		setActiveTab(+value);
	}, []);

	if (!childAttrs.length) return null;

	return (
		<div
			className={cn(
				className,
				"border border-secondary-border rounded-xl p-2",
				"relative",
				childAttrs.length === 1 && hasActiveCatalogView && "print-single-tab",
			)}
			data-component="tabs"
		>
			{isPrint ? null : (
				<div className="switch" contentEditable="false" suppressContentEditableWarning>
					<div className="cases flex flex-row gap-1 min-w-0 items-center">
						<ToggleGroup
							className="cases-container sticky top-0"
							onValueChange={onValueChange}
							type="single"
							value={`${activeTab}`}
						>
							{childAttrs.map(({ name, icon, idx }) => (
								<TabCase
									getTabProperties={getTabProperties}
									icon={icon}
									idx={idx}
									isActive={activeTab === idx}
									isEdit={isEdit}
									key={`${name}-${idx}`}
									name={name}
									onNameUpdate={onNameUpdate}
									onPropertyAdd={onPropertyAdd}
									onPropertyDelete={onPropertyDelete}
									onRemoveClick={(tabIdx) => {
										onRemoveClick?.(tabIdx);
										setActiveTab(0);
									}}
								/>
							))}
						</ToggleGroup>
					</div>
					{isEdit && (
						<div className="flex flex-row gap-2">
							<TabActionButton
								className="tabs-action p-2 h-auto shrink-0"
								data-qa="qa-add-tab"
								icon="plus"
								onClick={(e) => {
									onAddClick();
									setActiveTab(childAttrs.length);
									e.stopPropagation();
								}}
								size="lg"
								tooltip={t("editor.tabs.add")}
								variant="ghost"
							/>
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
			<TabsContent activeIdx={activeTab} className="tabs" isPrint={isPrint}>
				{children}
			</TabsContent>
		</div>
	);
};

export default styled(Tabs)`
	.switch {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 0.7rem;
		gap: 0.25rem;
		position: sticky;
		top: 0;
		z-index: var(--z-index-foreground);
		background: var(--color-article-bg);
		padding: 0.25rem 0;
	}

	.cases {
		padding-right: 1rem;
		flex: 1;
		max-width: 100%;
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
	}

	.cases-container {
		max-width: 100%;
		justify-content: flex-start;
		flex-wrap: nowrap;
	}

	.content p:last-of-type,
	.tab p:last-of-type {
		margin-bottom: 0;
	}

	&.print-single-tab .case {
		display: none;
	}

	.tabs-navigation {
		display: flex;
		margin-top: 0.75rem;
		min-height: 2rem;
	}

	.tabs-step-button {
		color: hsl(var(--muted));
	}

`;
