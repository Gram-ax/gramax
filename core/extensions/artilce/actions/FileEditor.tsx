import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import FileInput from "@components/Atoms/FileInput";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useCallback, useState } from "react";
import useLocalize from "../../localization/useLocalize";

const FileEditor = ({ trigger }: { trigger: JSX.Element }) => {
	const [value, setValue] = useState(null);
	const [isOpen, setIsOpen] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const loadArticleContent = useCallback(async () => {
		const res = await FetchService.fetch(apiUrlCreator.getArticleContent());
		if (res.ok) setValue(await res.text());
	}, [apiUrlCreator]);

	const save = useCallback(async () => {
		await FetchService.fetch(apiUrlCreator.setArticleContent(), value);
		await ArticleUpdaterService.update(apiUrlCreator);
		setIsOpen(false);
	}, [value, apiUrlCreator]);

	return (
		<ModalLayout
			trigger={trigger}
			contentWidth="80%"
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
				<FormStyle>
					{value == null ? (
						<SpinnerLoader fullScreen />
					) : (
						<>
							<legend>{useLocalize("editMarkdown")}</legend>
							<FileInput value={value} language="markdown" onChange={setValue} />
							<div className="buttons">
								<Button
									buttonStyle={ButtonStyle.transparent}
									onClick={() => {
										setIsOpen(false);
									}}
								>
									<span>{useLocalize("cancel")}</span>
								</Button>
								<Button buttonStyle={ButtonStyle.default} onClick={save}>
									<span>{useLocalize("save")}</span>
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
