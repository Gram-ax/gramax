import { getExecutingEnvironment } from "@app/resolveModule";
import styled from "@emotion/styled";
import useLocalize from "../../extensions/localization/useLocalize";
import SaveAsWord from "../../extensions/wordExport/actions/SaveAsWord/Component/SaveAsWord";
import FetchService from "../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../ui-logic/ApiServices/Types/MimeTypes";
import Url from "../../ui-logic/ApiServices/Types/Url";
import { downloadFile } from "../../ui-logic/downloadResource";
import Icon from "../Atoms/Icon";

const ExportToDocxOrPdf = styled(
	({
		text,
		wordLink,
		pdfPart,
		className,
	}: {
		text: string;
		wordLink: { downloadLink: Url; fileName: string };
		pdfPart: JSX.Element;
		className?: string;
	}) => {
		return (
			<div className={className}>
				<Icon code="file-word" faFw={true} />
				<span>
					{useLocalize("Save")} {text} {useLocalize("in")}{" "}
					{getExecutingEnvironment() !== "next" && <><SaveAsWord
						label={"DOCX"}
						onClick={async (signal) => {
							const res = await FetchService.fetch(wordLink.downloadLink);
							if (!res.ok || signal.aborted) return;
							downloadFile(res.body, MimeTypes.docx, wordLink.fileName);
						}}
					/>{" /"}</>}
					{pdfPart}
				</span>
			</div>
		);
	},
)`
	span > a {
		margin: 0 !important;
	}
`;

export default ExportToDocxOrPdf;
