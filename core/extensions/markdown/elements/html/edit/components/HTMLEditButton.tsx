import FileInput from "@components/Atoms/FileInput/FileInput";
import t from "@ext/localization/locale/translate";
import type { Editor } from "@tiptap/core";
import { Button } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent } from "@ui-kit/Dialog";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { useCallback, useEffect, useState } from "react";

const HTMLEditor = ({ content, editor, onClose }: { content?: string; editor: Editor; onClose: () => void }) => {
	const [isOpen, setIsOpen] = useState(true);
	const [startContent, setStartContent] = useState(content ?? "");
	const [value, setValue] = useState(content ?? "");

	useEffect(() => {
		setStartContent(content ?? "");
		setValue(content ?? "");
	}, [content]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			setIsOpen(open);
			if (!open) onClose();
		},
		[onClose],
	);

	const save = useCallback(() => {
		const newContent = value.length === 0 ? "<p>HTML</p>" : value;
		editor.commands.updateAttributes("html", { content: newContent });
		onOpenChange(false);
	}, [value, editor, onOpenChange]);

	const cancel = useCallback(() => {
		setValue(startContent);
		onOpenChange(false);
	}, [startContent, onOpenChange]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (!isOpen) return;
			if (e.code === "Enter" && (e.ctrlKey || e.metaKey)) save();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [isOpen, save]);

	return (
		<Dialog onOpenChange={onOpenChange} open={isOpen}>
			<DialogContent data-modal-root size="L">
				<FormHeader description={t("edit-html-description")} icon="code" title={t("edit-html")} />
				<DialogBody className="space-y-4">
					<FileInput
						height={"100%"}
						language={"html"}
						onChange={setValue}
						style={{ padding: undefined }}
						theme={{ dark: "new-vs-dark", light: "light" }}
						value={value}
					/>
				</DialogBody>
				<FormFooter
					primaryButton={<Button onClick={save}>{t("save")}</Button>}
					secondaryButton={
						<Button onClick={cancel} variant="outline">
							{t("cancel")}
						</Button>
					}
				/>
			</DialogContent>
		</Dialog>
	);
};

export default HTMLEditor;
