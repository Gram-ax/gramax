import { useWorkspaceTemplates } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceTemplates";
import { ConfirmationDialog } from "../../../ui-kit/ConfirmationDialog";
import { WorkspaceSettings } from "../types/WorkspaceComponent";
import { Icon } from "@ui-kit/Icon";
import { Button, IconButton } from "@ui-kit/Button";
import { Description } from "@ui-kit/Description";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { Input } from "@ui-kit/Input";
import { Modal, ModalContent, ModalHeaderTemplate, ModalBody, ModalFooterTemplate } from "@ui-kit/Modal";

interface WorkspaceTemplatesProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
}

export function WorkspaceTemplates({ localSettings, setLocalSettings }: WorkspaceTemplatesProps) {
	const {
		fileInputRef,
		duplicateDialogOpen,
		setDuplicateDialogOpen,
		pendingDuplicate,
		setPendingDuplicate,
		renameDialogOpen,
		setRenameDialogOpen,
		templateToRename,
		newTemplateTitle,
		setNewTemplateTitle,
		handleTemplateUpload,
		handleDeleteTemplate,
		handleReplaceTemplate,
		openRenameDialog,
		handleRenameTemplate,
		downloadTemplate
	} = useWorkspaceTemplates(localSettings, setLocalSettings);

	return (
		<div>
			<div className="flex items-center gap-4 mb-2">
				<h2 className="text-xl font-medium">
					Шаблоны Word{" "}
					<span className="text-sm font-normal">({localSettings.wordTemplates?.length ?? 0}/5)</span>
				</h2>
				<Button
					variant="outline"
					disabled={(localSettings.wordTemplates?.length ?? 0) >= 5}
					onClick={() => fileInputRef.current?.click()}
					className="flex items-center gap-1"
				>
					<Icon icon="plus" />
					Загрузить шаблон
				</Button>
				<input
					ref={fileInputRef}
					id="wordTemplates"
					type="file"
					accept=".docx,.dotx,.docm,.dotm"
					multiple
					className="hidden"
					onChange={async (e) => {
						const fileList = e.target.files;
						if (!fileList) return;
						await handleTemplateUpload(fileList);
						e.target.value = "";
					}}
				/>
			</div>

			<Description>
				Загрузите сюда шаблоны в поддерживаемых форматах (.docx, .dotx). При экспорте статьи из Gramax вы
				сможете выбрать один из них, чтобы автоматически оформить документ в вашем фирменном стиле.
			</Description>

			<div className="flex flex-wrap gap-4 mt-2">
				{(localSettings.wordTemplates ?? []).map((template) => (
					<div
						key={template.title}
						className="relative w-40 border rounded-md p-3 flex flex-col items-center shadow-sm bg-card"
					>
						<Icon icon="file" size="xl" />
						<span className="text-sm text-center break-words leading-4" title={template.title}>
							{template.title.replace(/\.[^.]+$/, "")}
						</span>
						<Popover>
							<PopoverTrigger asChild>
								<IconButton
									variant="ghost"
									icon="more-vertical"
									size="sm"
									className="absolute top-1 right-1"
								/>
							</PopoverTrigger>
							<PopoverContent className="w-40 p-0" align="end">
								<button
									className="w-full text-left px-3 py-2 hover:bg-secondary-bg-hover text-sm rounded"
									onClick={() => downloadTemplate(template)}
								>
									Скачать
								</button>
								<button
									className="w-full text-left px-3 py-2 hover:bg-secondary-bg-hover text-sm rounded"
									onClick={() => openRenameDialog(template.title)}
								>
									Переименовать
								</button>
								<button
									className="w-full text-left px-3 py-2 hover:bg-secondary-bg-hover text-sm rounded text-red-600"
									onClick={() => handleDeleteTemplate(template.title)}
								>
									Удалить
								</button>
							</PopoverContent>
						</Popover>
					</div>
				))}
			</div>

			<ConfirmationDialog
				isOpen={duplicateDialogOpen}
				onOpenChange={setDuplicateDialogOpen}
				onSave={handleReplaceTemplate}
				onClose={() => {
					setPendingDuplicate(null);
				}}
				title="Шаблон уже существует"
				description={`Шаблон «${pendingDuplicate?.title ?? ""}» уже существует. Заменить его?`}
				confirmText="Заменить"
				cancelText="Отмена"
				showDiscard={false}
			/>

			<RenameTemplateDialog
				open={renameDialogOpen}
				onOpenChange={setRenameDialogOpen}
				templateTitle={templateToRename}
				newTitle={newTemplateTitle}
				setNewTitle={setNewTemplateTitle}
				onSave={handleRenameTemplate}
			/>
		</div>
	);
}

interface RenameTemplateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	templateTitle: string | null;
	newTitle: string;
	setNewTitle: (title: string) => void;
	onSave: () => void;
}

function RenameTemplateDialog({ open, onOpenChange, newTitle, setNewTitle, onSave }: RenameTemplateDialogProps) {
	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalContent>
				<ModalHeaderTemplate title="Переименовать шаблон" className="pb-0 lg:pb-0 border-b-0" />

				<ModalBody>
					<Input
						value={newTitle}
						onChange={(e) => setNewTitle(e.target.value)}
						placeholder="Введите новое имя"
						className="mt-2"
					/>
				</ModalBody>

				<ModalFooterTemplate
					className="pt-0 lg:pt-0 border-t-0"
					primaryButton="Сохранить"
					secondaryButton="Отмена"
					primaryButtonProps={{ disabled: !newTitle.trim(), onClick: onSave }}
					secondaryButtonProps={{ variant: "outline", onClick: () => onOpenChange(false) }}
				/>
			</ModalContent>
		</Modal>
	);
}
