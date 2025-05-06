import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import FileInput from "@components/Atoms/FileInput/FileInput";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import t from "@ext/localization/locale/translate";
import { useCallback, useState } from "react";

interface FileEditorProps {
	trigger: JSX.Element;
	loadContent: () => Promise<string>;
	saveContent: (content: string) => Promise<unknown>;
}

const FileEditor = ({ trigger, loadContent, saveContent }: FileEditorProps) => {
	const [value, setValue] = useState(null);
	const [isOpen, setIsOpen] = useState(false);

	const loadArticleContent = useCallback(async () => {
		const content = await loadContent();
		setValue(content);
	}, [loadContent]);

	const save = useCallback(() => {
		saveContent(value);
		setIsOpen(false);
	}, [value, saveContent]);

	return (
		<ModalLayout
			trigger={trigger}
			contentWidth="L"
			isOpen={isOpen}
			closeOnCmdEnter={false}
			onOpen={() => {
				setIsOpen(true);
				loadArticleContent();
			}}
			onClose={() => {
				setIsOpen(false);
				setValue(null);
			}}
			onCmdEnter={save}
		>
			<ModalLayoutLight>
				<FormStyle overflow={false}>
					{value == null ? (
						<SpinnerLoader fullScreen />
					) : (
						<>
							<legend>{t("article.edit-markdown")}</legend>
							<FileInput value={value} language="markdown" onChange={setValue} />
							<div className="buttons">
								<Button
									buttonStyle={ButtonStyle.underline}
									onClick={() => {
										setIsOpen(false);
									}}
								>
									<span>{t("cancel")}</span>
								</Button>
								<Button buttonStyle={ButtonStyle.default} onClick={save}>
									<span>{t("save")}</span>
								</Button>
							</div>
						</>
					)}
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default FileEditor;
