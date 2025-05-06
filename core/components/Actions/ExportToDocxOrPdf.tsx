import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import t from "@ext/localization/locale/translate";
import { useRef } from "react";
import ItemExport, { ExportFormat } from "../../extensions/wordExport/components/ItemExport";
import ExportButton from "@ext/wordExport/components/DropdownButton";
import styled from "@emotion/styled";

interface ExportToDocxOrPdfProps {
	fileName: string;
	itemRefPath: string;
	isCategory: boolean;
	className?: string;
}

const ExportToDocxOrPdf = (props: ExportToDocxOrPdfProps) => {
	const { fileName, itemRefPath, isCategory, className } = props;
	const ref = useRef();

	return (
		<PopupMenuLayout
			appendTo={() => ref.current}
			offset={[10, -5]}
			buttonClassName={className}
			className="wrapper"
			placement="right-start"
			openTrigger="mouseenter focus"
			trigger={<ExportButton ref={ref} iconCode="file-output" text={t("export")} />}
		>
			{isCategory && (
				<ItemExport
					fileName={fileName}
					itemRefPath={itemRefPath}
					isCategory={isCategory}
					exportFormat={ExportFormat.docx}
				/>
			)}
			<ItemExport
				fileName={fileName}
				itemRefPath={itemRefPath}
				isCategory={false}
				exportFormat={ExportFormat.docx}
			/>
			{isCategory && (
				<ItemExport
					fileName={fileName}
					itemRefPath={itemRefPath}
					isCategory={isCategory}
					exportFormat={ExportFormat.pdf}
				/>
			)}

			<ItemExport
				fileName={fileName}
				itemRefPath={itemRefPath}
				isCategory={false}
				exportFormat={ExportFormat.pdf}
			/>
		</PopupMenuLayout>
	);
};

export default styled(ExportToDocxOrPdf)`
	width: 100%;

	> span {
		width: 100%;
	}
`;
