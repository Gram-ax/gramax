import type { Locator } from "@playwright/test";
import { editorTest } from "@web/fixtures/editor.fixture";

type TableCellPosition = { rowIndex: number; cellIndex: number };

export interface ResizerFixture {
	getCell: (cell: TableCellPosition) => Locator;
	dragResizer: (deltaX: number, cell: TableCellPosition) => Promise<void>;
}

export const resizerTest = editorTest.extend<ResizerFixture>({
	getCell: async ({ sharedPage }, use) => {
		const getCell = ({ rowIndex, cellIndex }: TableCellPosition) =>
			sharedPage.getByTestId("table").locator("tbody tr").nth(rowIndex).locator("td").nth(cellIndex);

		await use(getCell);
	},

	dragResizer: async ({ getCell }, use) => {
		await use(async (deltaX: number, tableCellPosition: TableCellPosition) => {
			const cell = getCell(tableCellPosition);
			const box = await cell.boundingBox();
			if (!box) return;
			const x = box.x + box.width;
			const y = box.y + box.height / 2;

			await cell.dispatchEvent("mousemove", { clientX: x, clientY: y, pointerId: 1, bubbles: true });
			await cell.dispatchEvent("mousedown", { clientX: x, clientY: y, pointerId: 1, bubbles: true });
			await cell.dispatchEvent("mousemove", { clientX: x + deltaX, clientY: y, pointerId: 1, bubbles: true });
			await cell.dispatchEvent("mouseup", { clientX: x + deltaX, clientY: y, pointerId: 1, bubbles: true });
		});
	},
});
