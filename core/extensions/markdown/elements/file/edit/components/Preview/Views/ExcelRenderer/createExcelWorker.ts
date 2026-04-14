const createExcelWorker = (): Worker =>
	new Worker(new URL("./excelParse.worker.ts", import.meta.url), { type: "module" });

export default createExcelWorker;
