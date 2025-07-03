import useTrigger from "@core-ui/triggers/useTrigger";
import { Button } from "@ui-kit/Button";
import FileInput from "@components/Atoms/FileInput/FileInput";
import t from "@ext/localization/locale/translate";
import { FormHeader, FormFooter } from "@ui-kit/Form";
import { Modal, ModalTrigger, ModalContent, ModalBody } from "@ui-kit/Modal";
import { useCallback, useState, useRef } from "react";

interface FileEditorProps {
	trigger: JSX.Element;
	loadContent: () => Promise<string>;
	saveContent: (content: string) => Promise<unknown>;
}

const EditMarkdown = ({ trigger, loadContent, saveContent }: FileEditorProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [value, setValue] = useState(null);
	const isLoadingRef = useRef(false);
	const [key, emit] = useTrigger();

	const closeEditor = useCallback(() => {
		setIsOpen(false);
	}, []);

	const loadArticleContent = useCallback(async () => {
		if (isLoadingRef.current) return;

		isLoadingRef.current = true;
		try {
			const content = await loadContent();
			emit();
			setValue(content);
		} finally {
			isLoadingRef.current = false;
		}
	}, [loadContent]);

	const save = useCallback(async () => {
		await saveContent(value);
		setIsOpen(false);
	}, [value, saveContent]);

	const onOpenChange = useCallback(
		(value) => {
			setIsOpen(value);
			if (value && !isLoadingRef.current) {
				void loadArticleContent();
			}
		},
		[loadArticleContent],
	);

	return (
		<Modal open={isOpen} onOpenChange={onOpenChange}>
			{trigger && (
				<ModalTrigger onClick={() => void onOpenChange(true)} asChild>
					{trigger}
				</ModalTrigger>
			)}
			<ModalContent data-modal-root data-monaco-modal-normal-width>
				<FormHeader
					title={t("article.markdown-edit.title")}
					description={t("article.markdown-edit.description")}
					icon={"file-pen"}
				/>
				<ModalBody className="space-y-4">
					<FileInput
						key={key}
						style={{ padding: undefined }}
						language={"markdown"}
						value={value}
						onChange={setValue}
						height={"min(calc(650px - 2.5rem), calc(60vh - 2.5rem))"}
						uiKitTheme
					/>
				</ModalBody>
				<FormFooter
					primaryButton={<Button variant="primary" onClick={save} children={t("save")} />}
					secondaryButton={<Button onClick={closeEditor} variant="text" children={t("cancel")} />}
				/>
			</ModalContent>
		</Modal>
	);
};

export default EditMarkdown;
