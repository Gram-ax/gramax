import { TextSize } from "@components/Atoms/Button/Button";
import Tooltip from "@components/Atoms/Tooltip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import { downloadFile } from "@core-ui/downloadResource";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import { openPrintView } from "@ext/artilce/actions/SaveAsPdf/OpenPrintView";
import useLocalize from "@ext/localization/useLocalize";
import ThemeService from "@ext/Theme/components/ThemeService";
import { useState } from "react";
import SaveAsWord from "../../extensions/wordExport/actions/SaveAsWord/Component/SaveAsWord";
import FetchService from "../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../ui-logic/ApiServices/Types/MimeTypes";
import Url from "../../ui-logic/ApiServices/Types/Url";

interface ExportToDocxOrPdfProps {
	downloadLink: Url;
	fileName: string;
	isCatalogSave?: boolean;
	className?: string;
	disabled?: boolean;
}

const ExportToDocxOrPdf = (props: ExportToDocxOrPdfProps) => {
	const { downloadLink, fileName, isCatalogSave = true, className, disabled } = props;
	const theme = ThemeService.value;
	const { isNext } = usePlatform();
	const [isOpen, setIsOpen] = useState(false);

	const SaveAsWordHandler = async (signal) => {
		const res = await FetchService.fetch(downloadLink);
		if (!res.ok || signal.aborted) return;
		downloadFile(res.body, MimeTypes.docx, fileName);
	};

	const SaveAsPdfHandler = () => isCatalogSave && openPrintView(theme);

	return (
		<li className={className} data-qa="qa-clickable">
			<PopupMenuLayout
				onClose={() => setIsOpen(false)}
				onOpen={() => setIsOpen(true)}
				className="wrapper"
				disabled={disabled}
				trigger={
					<Tooltip disabled={!disabled} content={useLocalize("createFilesToExport")}>
						<div className="export-button">
							<ButtonLink disabled={disabled} iconCode="file-output" text={useLocalize("export")} />
							<ButtonLink
								disabled={disabled}
								textSize={TextSize.XXS}
								iconCode={isOpen ? "chevron-up" : "chevron-down"}
								iconViewBox="3 3 18 18"
							/>
						</div>
					</Tooltip>
				}
			>
				{!isNext && <SaveAsWord onClick={SaveAsWordHandler} />}
				<ButtonLink className="test" onClick={SaveAsPdfHandler} iconCode="file-text" text={"PDF"} />
			</PopupMenuLayout>
		</li>
	);
};

export default styled(ExportToDocxOrPdf)`
	width: fit-content;

	.export-button {
		display: flex;
		justify-content: start;
		text-align: center;
		gap: 0.4em;
		align-items: center;
		width: fit-content;

		${(p) =>
			p.disabled
				? ``
				: `&:hover {
			i,
			span {
				color: var(--color-primary);
			}
		}`}
	}

	.tippy-content {
		margin-top: 7px;
	}

	.wrapper {
		div {
			width: 220px;

			justify-content: start;
			height: 30px;
			padding: 0;

			i {
				margin-left: 0.46rem;
			}

			${(p) =>
				p.disabled
					? ``
					: `&:hover {
						i,
						span {
							color: var(--color-primary);
						}
					}`}
		}
	}
`;
