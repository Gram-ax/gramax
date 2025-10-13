import useTrigger from "@core-ui/triggers/useTrigger";
import { Button } from "@ui-kit/Button";
import FileInput from "@components/Atoms/FileInput/FileInput";
import t from "@ext/localization/locale/translate";
import { FormHeader, FormFooter } from "@ui-kit/Form";
import { Modal, ModalTrigger, ModalContent, ModalBody } from "@ui-kit/Modal";
import { useCallback, useState, useRef, useEffect } from "react";

interface FileEditorProps {
	trigger?: JSX.Element;
	loadContent: () => Promise<string>;
	saveContent: (content: string) => Promise<unknown>;
	onClose?: () => void;
}

const EditMarkdown = ({ trigger, loadContent, saveContent, onClose }: FileEditorProps) => {
	const [isOpen, setIsOpen] = useState(!trigger);
	const [value, setValue] = useState(null);
	const isLoadingRef = useRef(false);
	const [key, emit] = useTrigger();

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

	const onOpenChange = useCallback(
		(value) => {
			setIsOpen(value);
			if (value && !isLoadingRef.current) void loadArticleContent();
			if (!value) onClose?.();
		},
		[loadArticleContent],
	);

	const save = useCallback(async () => {
		await saveContent(value);
		onOpenChange(false);
	}, [value, saveContent, onOpenChange]);

	useEffect(() => {
		if (trigger) return;
		void loadArticleContent();
	}, []);

	return (
		<Modal open={isOpen} onOpenChange={onOpenChange}>
			{trigger && (
				<ModalTrigger onClick={() => void onOpenChange(true)} asChild>
					{trigger}
				</ModalTrigger>
			)}
			<ModalContent data-modal-root size="L">
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
						height={"100%"}
						uiKitTheme
					/>
				</ModalBody>
				<FormFooter primaryButton={<Button variant="primary" onClick={save} children={t("save")} />} />
			</ModalContent>
		</Modal>
	);
};

export default EditMarkdown;
