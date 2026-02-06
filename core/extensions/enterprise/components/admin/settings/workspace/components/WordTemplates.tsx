import { Button, IconButton } from "@ui-kit/Button";
import { Description } from "@ui-kit/Description";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { Modal, ModalBody, ModalContent, ModalFooterTemplate, ModalHeaderTemplate } from "@ui-kit/Modal";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { ConfirmationDialog } from "../../../ui-kit/ConfirmationDialog";
import { useTemplateManagement } from "../hooks/useTemplateManagement";
import { WorkspaceSettings } from "../types/WorkspaceComponent";

interface WordTemplatesProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
}

export function WordTemplates({ localSettings, setLocalSettings }: WordTemplatesProps) {
	const acceptedFormats = ".docx,.dotx,.docm,.dotm";
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
		downloadTemplate,
		getTemplates,
	} = useTemplateManagement({
		localSettings,
		setLocalSettings,
		templateType: "word",
		maxTemplates: 5,
		mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	});

	const templates = getTemplates();

	return (
		<div>
			<div className="flex items-center gap-4 mb-2">
				<h2 className="text-xl font-medium">
					Шаблоны Word <span className="text-sm font-normal">{templates.length}/5</span>
				</h2>
				<Button
					className="flex items-center gap-1"
					disabled={templates.length >= 5}
					onClick={() => fileInputRef.current?.click()}
					variant="outline"
				>
					<Icon icon="plus" />
					Загрузить шаблон
				</Button>
				<input
					accept={acceptedFormats}
					className="hidden"
					id="wordTemplates"
					multiple
					onChange={async (e) => {
						const fileList = e.target.files;
						if (!fileList) return;
						await handleTemplateUpload(fileList);
						e.target.value = "";
					}}
					ref={fileInputRef}
					type="file"
				/>
			</div>

			<Description>
				Загрузите сюда шаблоны в поддерживаемых форматах (.docx, .dotx). При экспорте статьи из Gramax вы
				сможете выбрать один из них, чтобы автоматически оформить документ в вашем фирменном стиле.
			</Description>

			<div className="flex flex-wrap gap-4 mt-2">
				{templates.map((template) => (
					<div
						className="relative w-40 border rounded-md p-3 flex flex-col items-center shadow-soft-sm bg-card"
						key={template.title}
					>
						<Icon icon="file" size="xl" />
						<span className="text-sm text-center break-words leading-4" title={template.title}>
							{template.title.replace(/\.[^.]+$/, "")}
						</span>
						<Popover>
							<PopoverTrigger asChild>
								<IconButton
									className="absolute top-1 right-1"
									icon="more-vertical"
									size="sm"
									variant="ghost"
								/>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-40 p-0">
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
				cancelText="Отмена"
				confirmText="Заменить"
				description={`Шаблон «${pendingDuplicate?.title ?? ""}» уже существует. Заменить его?`}
				isOpen={duplicateDialogOpen}
				onClose={() => {
					setPendingDuplicate(null);
				}}
				onOpenChange={setDuplicateDialogOpen}
				onSave={handleReplaceTemplate}
				showDiscard={false}
				title="Шаблон уже существует"
			/>

			<RenameTemplateDialog
				newTitle={newTemplateTitle}
				onOpenChange={setRenameDialogOpen}
				onSave={handleRenameTemplate}
				open={renameDialogOpen}
				setNewTitle={setNewTemplateTitle}
				templateTitle={templateToRename}
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
		<Modal onOpenChange={onOpenChange} open={open}>
			<ModalContent>
				<ModalHeaderTemplate className="pb-0 lg:pb-0 border-b-0" title="Переименовать шаблон" />

				<ModalBody>
					<Input
						className="mt-2"
						onChange={(e) => setNewTitle(e.target.value)}
						placeholder="Введите новое имя"
						value={newTitle}
					/>
				</ModalBody>

				<ModalFooterTemplate
					className="pt-0 lg:pt-0 border-t-0"
					primaryButton="Сохранить"
					primaryButtonProps={{ disabled: !newTitle.trim(), onClick: onSave }}
					secondaryButton="Отмена"
					secondaryButtonProps={{ variant: "outline", onClick: () => onOpenChange(false) }}
				/>
			</ModalContent>
		</Modal>
	);
}
