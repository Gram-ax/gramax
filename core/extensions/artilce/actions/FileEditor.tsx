import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import FileInput from "@components/Atoms/FileInput/FileInput";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import { useCallback, useState } from "react";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";

interface FileEditorProps {
	trigger: JSX.Element;
	item: ClientArticleProps;
	isCurrentItem: boolean;
}

const FileEditor = ({ trigger, item, isCurrentItem }: FileEditorProps) => {
	const [value, setValue] = useState(null);
	const [isOpen, setIsOpen] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const loadArticleContent = useCallback(async () => {
		const res = await FetchService.fetch(apiUrlCreator.getArticleContent(item.ref.path));
		if (res.ok) setValue(await res.text());
	}, [apiUrlCreator, item.ref.path]);

	const save = useCallback(async () => {
		const res = await FetchService.fetch(apiUrlCreator.setArticleContent(item.ref.path), value);
		if (res.ok && isCurrentItem) ArticleUpdaterService.setUpdateData(await res.json());
		setIsOpen(false);
	}, [value, apiUrlCreator, item.ref.path, isCurrentItem]);

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
