import { closestCorners, DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useWorkspaceSections } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceSections";
import { AddButton } from "@ext/enterprise/components/admin/ui-kit/AddButton";
import { SettingsSection } from "@ext/enterprise/components/admin/ui-kit/SettingsSection";
import t from "@ext/localization/locale/translate";
import type React from "react";
import { useSortableSections } from "../../hooks/useSortableSections";
import type { WorkspaceSettings } from "../../types/WorkspaceComponent";
import { SectionCard } from "./components/SectionCard";
import { SortableSectionItem } from "./components/SortableSectionItem";

interface WorkspaceSectionsProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
	sectionResources: string[];
}

export function WorkspaceSections({ localSettings, setLocalSettings, sectionResources }: WorkspaceSectionsProps) {
	const {
		showSectionDialog,
		setShowSectionDialog,
		editingKey,
		form,
		setForm,
		selectedCatalogs,
		setSelectedCatalogs,
		openSectionDialog,
		handleSaveSection,
		handleDeleteSection,
		closeDialog,
	} = useWorkspaceSections(localSettings, setLocalSettings);

	const { sensors, handleDragEnd } = useSortableSections(localSettings.sections || {}, (sections) => {
		setLocalSettings({ ...localSettings, sections });
	});

	return (
		<SettingsSection
			actions={
				<AddButton onClick={() => openSectionDialog()} title={t("enterprise.admin.workspace.sections.add")} />
			}
			title={t("enterprise.admin.workspace.sections.title")}
		>
			<div className="flex flex-col gap-4 rounded-lg border p-4 max-h-96 overflow-y-auto overflow-x-hidden">
				{Object.keys(localSettings.sections || {}).length > 0 ? (
					<DndContext
						collisionDetection={closestCorners}
						modifiers={[restrictToVerticalAxis]}
						onDragEnd={handleDragEnd}
						sensors={sensors}
					>
						<SortableContext
							items={Object.keys(localSettings.sections || {})}
							strategy={verticalListSortingStrategy}
						>
							{Object.entries(localSettings.sections || {}).map(([key, section]) => (
								<SortableSectionItem
									key={key}
									onDelete={handleDeleteSection}
									onEdit={openSectionDialog}
									section={section}
									sectionKey={key}
								/>
							))}
						</SortableContext>
					</DndContext>
				) : (
					<div className="text-center py-8 text-muted-foreground">
						<p>{t("enterprise.admin.workspace.sections.empty")}</p>
						<p className="text-sm">{t("enterprise.admin.workspace.sections.empty-hint")}</p>
					</div>
				)}
			</div>

			<SectionCard
				editingKey={editingKey}
				form={form}
				onClose={closeDialog}
				onOpenChange={setShowSectionDialog}
				onSave={handleSaveSection}
				open={showSectionDialog}
				sectionResources={sectionResources}
				selectedCatalogs={selectedCatalogs}
				setForm={setForm}
				setSelectedCatalogs={setSelectedCatalogs}
			/>
		</SettingsSection>
	);
}
