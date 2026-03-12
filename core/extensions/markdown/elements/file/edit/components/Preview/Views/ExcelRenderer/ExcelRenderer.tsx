import { xlsx } from "@dynamicImports/xlsx";
import styled from "@emotion/styled";
import type { RendererProps } from "@ext/markdown/elements/file/edit/components/Preview/FilePreview";
import { useEffect, useMemo, useState } from "react";
import { type AOAColumn, type Row, VirtualTable } from "./VirtualTable";

type CellData = {
	value: string | number;
};

const ExcelContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
`;

const DataGridContainer = styled.div`
	width: 100%;
	height: 100%;
	max-height: 85vh;
	max-width: 95vw;

	> div:first-of-type {
		height: 100%;
	}
`;

const ExcelRenderer = ({ file, onLoad, onError }: RendererProps) => {
	const [xlsxLib, setXlsxLib] = useState<Awaited<ReturnType<typeof xlsx>>>(null);
	const [data, setData] = useState<CellData[][]>([]);

	useEffect(() => {
		const loadExcel = async () => {
			try {
				const xlsxLib = await xlsx();
				setXlsxLib(xlsxLib);
			} catch (err) {
				onError?.(err);
			}
		};
		loadExcel();
	}, [onError]);

	useEffect(() => {
		if (!xlsxLib) return;

		const loadData = async () => {
			try {
				const buffer = await file.arrayBuffer();
				const workbook = xlsxLib.read(buffer, {
					type: "array",
				});

				const firstSheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[firstSheetName];

				const rawData = xlsxLib.utils.sheet_to_json(worksheet, {
					header: 1,
					raw: false,
					rawNumbers: false,
				});

				const formattedData = rawData.map((row) => {
					if (Array.isArray(row)) {
						return row.map((cell) => ({ value: cell ?? "" }));
					}

					return [];
				});

				setData(formattedData);
				onLoad?.();
			} catch (err) {
				onError?.(err);
			}
		};
		loadData();
	}, [file, xlsxLib, onLoad, onError]);

	const columns: AOAColumn[] = useMemo(
		() =>
			xlsxLib
				? Array.from({ length: Math.max(...data.map((row) => row.length)) }, (_, i) => ({
						key: String(i),
						name: xlsxLib.utils.encode_col(i),
						flex: 1,
					}))
				: [],
		[xlsxLib, data],
	);

	const rows: Row[] = useMemo(
		() =>
			data
				.filter((row) => row.length > 0)
				.map((row) =>
					row.reduce((acc, cell, i) => {
						acc[String(i)] = cell.value;
						return acc;
					}, {} as Row),
				),
		[data],
	);

	if (!xlsxLib) return null;
	return (
		<ExcelContainer>
			<DataGridContainer>
				<VirtualTable columns={columns} rows={rows} />
			</DataGridContainer>
		</ExcelContainer>
	);
};

export default ExcelRenderer;
