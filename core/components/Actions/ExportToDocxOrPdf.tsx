import { TextSize } from "@components/Atoms/Button/Button";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { openPrintView } from "@ext/artilce/actions/SaveAsPdf/OpenPrintView";
import useLocalize from "@ext/localization/useLocalize";
import ThemeService from "@ext/Theme/components/ThemeService";
import SaveAsWord from "../../extensions/wordExport/actions/SaveAsWord/Component/SaveAsWord";
import FetchService from "../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../ui-logic/ApiServices/Types/MimeTypes";
import Url from "../../ui-logic/ApiServices/Types/Url";
import { downloadFile } from "@core-ui/downloadResource";
import styled from "@emotion/styled";
import { useState } from "react";

interface ExportToDocxOrPdfProps {
	downloadLink: Url;
	fileName: string;
	isCatalogSave?: boolean;
	className?: string;
}

const ExportToDocxOrPdf = (props: ExportToDocxOrPdfProps) => {
	const { downloadLink, fileName, isCatalogSave = true, className } = props;
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
				trigger={
					<div className="test">
						<ButtonLink className="test" iconCode="file-export" text={useLocalize("export")} />
						<ButtonLink textSize={TextSize.XXS} iconCode={`chevron-${isOpen ? "up" : "down"}`} />
					</div>
				}
			>
				{!isNext && <SaveAsWord onClick={SaveAsWordHandler} />}
				<ButtonLink className="test" onClick={SaveAsPdfHandler} iconCode="file-lines" text={"PDF"} />
			</PopupMenuLayout>
		</li>
	);
};

export default styled(ExportToDocxOrPdf)`
	.test {
		display: flex;
		justify-content: start;
		text-align: center;
		gap: 0.4em;
		align-items: center;

		&:hover {
			i,
			span {
				color: var(--color-primary);
			}
		}
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

			&:hover {
				i,
				span {
					color: var(--color-primary);
				}
			}
		}
	}
`;
