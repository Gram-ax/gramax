import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { downloadFile } from "@core-ui/downloadResource";
import { CancelableFunction } from "@core/utils/CancelableFunction";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { useMemo, useState } from "react";

interface ItemExportProps {
	fileName: string;
	itemRefPath?: string;
	isCategory?: boolean;
}

const ItemExport = ({ fileName, itemRefPath, isCategory }: ItemExportProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isDownloading, setIsDownloading] = useState(false);
	const [errorWordElements, setErrorWordElements] = useState<string[]>([]);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const cancelableFunction = useMemo(
		() =>
			new CancelableFunction(async (signal) => {
				const res = await FetchService.fetch(apiUrlCreator.getWordSaveUrl(isCategory, itemRefPath));
				if (!res.ok || signal.aborted) return;
				downloadFile(res.body, MimeTypes.docx, fileName + ".docx");
			}),
		[fileName],
	);

	const startDownload = () => {
		setIsOpen(true);
		setIsLoading(true);
		setIsDownloading(true);
		cancelableFunction.start().finally(() => {
			setIsOpen(false);
			setIsDownloading(false);
		});
	};

	const onOpen = async () => {
		setIsLoading(true);
		const res = await FetchService.fetch<string[]>(apiUrlCreator.getErrorWordElementsUrl(isCategory, itemRefPath));
		if (!res.ok) {
			setIsOpen(false);
			return;
		}
		const errorWordElements = await res.json();
		setErrorWordElements(errorWordElements);
		if (errorWordElements.length > 0) {
			setIsLoading(false);
			return;
		}
		startDownload();
	};

	const loading = (
		<FormStyle>
			<>
				<legend>{t("loading2")}</legend>
				<SpinnerLoader height={100} width={100} fullScreen />
			</>
		</FormStyle>
	);

	const info = (
		<InfoModalForm
			title={t("unsupported-elements-title")}
			icon={{ code: "circle-alert", color: "var(--color-admonition-note-br-h)" }}
			isWarning={false}
			actionButton={{
				onClick: startDownload,
				text: t("continue"),
			}}
			onCancelClick={() => setIsOpen(false)}
		>
			<div className="article">
				<p>{t("unsupported-elements-warning1")}</p>
				<div style={{ overflowX: "hidden", overflowY: "auto", maxHeight: "50vh" }}>
					<ul style={{ marginTop: 0 }}>
						{errorWordElements.map((elem, idx) => (
							<li key={idx}>
								<p>{t(elem as any)}</p>
							</li>
						))}
					</ul>
				</div>
				<p>{t("unsupported-elements-warning2")}</p>
			</div>
		</InfoModalForm>
	);

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={() => {
				setIsOpen(true);
				void onOpen();
			}}
			onClose={() => {
				setIsOpen(false);
				if (isDownloading) cancelableFunction.abort();
			}}
			trigger={
				<ButtonLink
					iconCode="file-text"
					text={t(
						itemRefPath ? (isCategory ? "category-to-docx" : "article-to-docx") : "export-catalog-docx",
					)}
				/>
			}
		>
			<ModalLayoutLight>{!isLoading ? info : loading}</ModalLayoutLight>
		</ModalLayout>
	);
};

export default ItemExport;
