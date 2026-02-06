import { closestCorners, DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useWorkspaceSections } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceSections";
import { Button } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import React from "react";
import { useSortableSections } from "../../hooks/useSortableSections";
import { WorkspaceSettings } from "../../types/WorkspaceComponent";
import { SectionDialog } from "./components/SectionDialog";
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
		<div>
			<div className="flex items-center gap-4 mb-4">
				<h2 className="text-xl font-medium">Секции каталогов</h2>

				<Button onClick={() => openSectionDialog()} variant="outline">
					<Icon icon="plus" />
					Добавить секцию
				</Button>
			</div>

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
						<p>Секции каталогов не созданы</p>
						<p className="text-sm">Нажмите &quot;Добавить секцию&quot; для создания первой секции</p>
					</div>
				)}
			</div>

			<SectionDialog
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
		</div>
	);
}
