import FileInput from "@components/Atoms/FileInput/FileInput";
import useTrigger from "@core-ui/triggers/useTrigger";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { useCallback, useEffect, useRef, useState } from "react";

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
		<Modal onOpenChange={onOpenChange} open={isOpen}>
			{trigger && (
				<ModalTrigger asChild onClick={() => void onOpenChange(true)}>
					{trigger}
				</ModalTrigger>
			)}
			<ModalContent data-modal-root size="L">
				<FormHeader
					description={t("article.markdown-edit.description")}
					icon={"file-pen"}
					title={t("article.markdown-edit.title")}
				/>
				<ModalBody className="space-y-4">
					<FileInput
						height={"100%"}
						key={key}
						language={"markdown"}
						onChange={setValue}
						style={{ padding: undefined }}
						uiKitTheme
						value={value}
					/>
				</ModalBody>
				<FormFooter primaryButton={<Button children={t("save")} onClick={save} variant="primary" />} />
			</ModalContent>
		</Modal>
	);
};

export default EditMarkdown;
