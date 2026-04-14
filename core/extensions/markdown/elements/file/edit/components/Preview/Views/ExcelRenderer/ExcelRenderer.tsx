import styled from "@emotion/styled";
import type { RendererProps } from "@ext/markdown/elements/file/edit/components/Preview/FilePreview";
import { useEffect, useMemo, useRef, useState } from "react";
import createExcelWorker from "./createExcelWorker";
import type { ExcelParseResponse } from "./excelParse.worker";
import { type AOAColumn, type Row, VirtualTable } from "./VirtualTable";

const ExcelContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
`;

const DataGridContainer = styled.div`
	width: min(95vw, 100%);
	height: min(85vh, 100%);

	> div:first-of-type {
		height: 100%;
	}
`;

const encodeCol = (n: number): string => {
	let name = "";

	for (let col = n; col >= 0; col = Math.floor(col / 26) - 1) {
		name = String.fromCharCode(65 + (col % 26)) + name;
	}

	return name;
};

const ExcelRenderer = ({ file, onLoad, onError }: RendererProps) => {
	const [rows, setRows] = useState<Row[]>([]);
	const [maxCols, setMaxCols] = useState(0);
	const workerRef = useRef<Worker>(null);

	useEffect(() => {
		const worker = createExcelWorker();
		workerRef.current = worker;

		worker.onmessage = (event: MessageEvent<ExcelParseResponse>) => {
			const response = event.data;

			if ("error" in response) {
				onError?.(new Error(response.error));
				return;
			}

			const colCount = response.data.reduce<number>((max, row) => Math.max(max, Object.keys(row).length), 0);
			setRows(response.data);
			setMaxCols(colCount);
			onLoad?.();
		};

		worker.onerror = (e) => {
			onError?.(e);
		};

		const loadData = async () => {
			try {
				const buffer = await file.arrayBuffer();
				worker.postMessage(buffer, [buffer]);
			} catch (err) {
				onError?.(err);
			}
		};

		void loadData();

		return () => {
			worker.terminate();
			workerRef.current = null;
		};
	}, [file, onLoad, onError]);

	const columns: AOAColumn[] = useMemo(
		() =>
			Array.from({ length: maxCols }, (_, i) => ({
				key: String(i),
				name: encodeCol(i),
				flex: 1,
			})),
		[maxCols],
	);

	return (
		<ExcelContainer>
			<DataGridContainer>
				<VirtualTable columns={columns} rows={rows} />
			</DataGridContainer>
		</ExcelContainer>
	);
};

export default ExcelRenderer;
