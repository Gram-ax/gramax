import type { RendererProps } from "@ext/markdown/elements/file/edit/components/Preview/FilePreview";
import { useEffect, useMemo, useRef, useState } from "react";
import createExcelWorker from "./createExcelWorker";
import type { ExcelParseResponse } from "./excelParse.worker";
import { type AOAColumn, type Row, VirtualTable } from "./VirtualTable";

const encodeCol = (n: number): string => {
	let name = "";

	for (let col = n; col >= 0; col = Math.floor(col / 26) - 1) {
		name = String.fromCharCode(65 + (col % 26)) + name;
	}

	return name;
};

const ExcelRenderer = ({ file, onLoad, onError, onMetaChange, selectedSheetName }: RendererProps) => {
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
			onMetaChange?.({
				sheetCount: response.sheetCount,
				sheetName: response.sheetName,
				sheetNames: response.sheetNames,
			});
			onLoad?.();
		};

		worker.onerror = (e) => {
			onError?.(e);
		};

		const loadData = async () => {
			try {
				setRows([]);
				setMaxCols(0);
				const buffer = await file.arrayBuffer();
				worker.postMessage({ buffer, sheetName: selectedSheetName }, [buffer]);
			} catch (err) {
				onError?.(err);
			}
		};

		void loadData();

		return () => {
			worker.terminate();
			workerRef.current = null;
		};
	}, [file, onLoad, onError, onMetaChange, selectedSheetName]);

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
		<div className="box-border flex h-full min-h-[420px] w-full flex-col items-center justify-center pb-6">
			<div className="min-h-0 w-full flex-1 overflow-hidden rounded-lg border border-primary-border bg-secondary-bg [&>div:first-of-type]:h-full">
				<VirtualTable columns={columns} rows={rows} />
			</div>
		</div>
	);
};

export default ExcelRenderer;
