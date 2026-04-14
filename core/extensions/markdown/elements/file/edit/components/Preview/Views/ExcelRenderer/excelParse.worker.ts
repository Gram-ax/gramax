export type ExcelParseRequest = ArrayBuffer;

export type ExcelParseOkResponse = { ok: true; data: Record<string, unknown>[] };

export type ExcelParseErrResponse = { ok: false; error: string };

export type ExcelParseResponse = ExcelParseOkResponse | ExcelParseErrResponse;

declare const self: Worker;

self.addEventListener("message", async (event: MessageEvent<ExcelParseRequest>) => {
	try {
		const xlsxLib = await import("@e965/xlsx");
		const workbook = xlsxLib.read(new Uint8Array(event.data), { type: "array" });

		const firstSheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[firstSheetName];

		const rawData = xlsxLib.utils.sheet_to_json<unknown[]>(worksheet, {
			header: 1,
			raw: false,
			rawNumbers: false,
		});

		const data = rawData
			.filter((row): row is unknown[] => Array.isArray(row) && row.length > 0)
			.map((row) =>
				(row as unknown[]).reduce<Record<string, unknown>>((acc, cell, i) => {
					acc[String(i)] = cell ?? "";
					return acc;
				}, {}),
			);

		const response: ExcelParseResponse = { ok: true, data };
		self.postMessage(response);
	} catch (e) {
		const response: ExcelParseResponse = { ok: false, error: String(e) };
		self.postMessage(response);
	}
});
