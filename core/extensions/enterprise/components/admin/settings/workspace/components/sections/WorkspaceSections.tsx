import React from "react";
import { useWorkspaceSections } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceSections";
import { closestCorners, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { useSortableSections } from "../../hooks/useSortableSections";
import { WorkspaceSettings } from "../../types/WorkspaceComponent";
import { SortableSectionItem } from "./components/SortableSectionItem";
import { SectionDialog } from "./components/SectionDialog";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

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
		<div>
			<div className="flex items-center gap-4 mb-4">
				<h2 className="text-xl font-medium">Секции каталогов</h2>

				<Button variant="outline" onClick={() => openSectionDialog()}>
					<Icon icon="plus" />
					Добавить секцию
				</Button>
			</div>

			<div className="flex flex-col gap-4 rounded-lg border p-4 max-h-96 overflow-y-auto overflow-x-hidden">
				{Object.keys(localSettings.sections || {}).length > 0 ? (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCorners}
						onDragEnd={handleDragEnd}
						modifiers={[restrictToVerticalAxis]}
					>
						<SortableContext
							items={Object.keys(localSettings.sections || {})}
							strategy={verticalListSortingStrategy}
						>
							{Object.entries(localSettings.sections || {}).map(([key, section]) => (
								<SortableSectionItem
									key={key}
									sectionKey={key}
									section={section}
									onEdit={openSectionDialog}
									onDelete={handleDeleteSection}
								/>
							))}
						</SortableContext>
					</DndContext>
				) : (
					<div className="text-center py-8 text-muted-foreground">
						<p>Секции каталогов не созданы</p>
						<p className="text-sm">Нажмите &quot;Добавить секцию&quot; для создания первой секции</p>
					</div>
				)}
			</div>

			<SectionDialog
				open={showSectionDialog}
				onOpenChange={setShowSectionDialog}
				editingKey={editingKey}
				form={form}
				setForm={setForm}
				selectedCatalogs={selectedCatalogs}
				setSelectedCatalogs={setSelectedCatalogs}
				sectionResources={sectionResources}
				onSave={handleSaveSection}
				onClose={closeDialog}
			/>
		</div>
	);
}
