import { Button, IconButton } from "@ui-kit/Button";
import { Description } from "@ui-kit/Description";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { Modal, ModalBody, ModalContent, ModalFooterTemplate, ModalHeaderTemplate } from "@ui-kit/Modal";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { ConfirmationDialog } from "../../../ui-kit/ConfirmationDialog";
import { useTemplateManagement } from "../hooks/useTemplateManagement";
import { WorkspaceSettings } from "../types/WorkspaceComponent";

interface PdfTemplatesProps {
	localSettings: WorkspaceSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
}

export function PdfTemplates({ localSettings, setLocalSettings }: PdfTemplatesProps) {
	const acceptedFormats = ".css";
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
		templateType: "pdf",
		maxTemplates: 5,
		mimeType: "application/pdf",
	});

	const templates = getTemplates();

	return (
		<div>
			<div className="flex items-center gap-4 mb-2">
				<h2 className="text-xl font-medium">
					Шаблоны PDF <span className="text-sm font-normal">({templates.length}/5)</span>
				</h2>
				<Button
					variant="outline"
					disabled={templates.length >= 5}
					onClick={() => fileInputRef.current?.click()}
					className="flex items-center gap-1"
				>
					<Icon icon="plus" />
					Загрузить шаблон
				</Button>
				<input
					ref={fileInputRef}
					id="pdfTemplates"
					type="file"
					accept={acceptedFormats}
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
				Загрузите сюда PDF шаблоны. При экспорте статьи из Gramax вы сможете выбрать один из них, чтобы
				автоматически оформить документ в вашем фирменном стиле.
			</Description>

			<div className="flex flex-wrap gap-4 mt-2">
				{templates.map((template) => (
					<div
						key={template.title}
						className="relative w-40 border rounded-md p-3 flex flex-col items-center shadow-soft-sm bg-card"
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
