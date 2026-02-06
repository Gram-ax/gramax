import Icon from "@components/Atoms/Icon";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@ui-kit/Dropdown";
import ItemExport, { ExportFormat } from "../../extensions/wordExport/components/ItemExport";

interface ExportToDocxOrPdfProps {
	fileName: string;
	itemRefPath: string;
	isCategory: boolean;
}

const ExportToDocxOrPdf = (props: ExportToDocxOrPdfProps) => {
	const { fileName, itemRefPath, isCategory } = props;

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<Icon code="file-output" />
				{t("export.name")}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{isCategory && (
					<ItemExport
						exportFormat={ExportFormat.docx}
						fileName={fileName}
						isCategory={isCategory}
						itemRefPath={itemRefPath}
					/>
				)}
				<ItemExport
					exportFormat={ExportFormat.docx}
					fileName={fileName}
					isCategory={false}
					itemRefPath={itemRefPath}
				/>
				{isCategory && <DropdownMenuSeparator />}
				{isCategory && (
					<ItemExport
						exportFormat={ExportFormat.pdf}
						fileName={fileName}
						isCategory={isCategory}
						itemRefPath={itemRefPath}
					/>
				)}

				<ItemExport
					exportFormat={ExportFormat.pdf}
					fileName={fileName}
					isCategory={false}
					itemRefPath={itemRefPath}
				/>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default ExportToDocxOrPdf;
