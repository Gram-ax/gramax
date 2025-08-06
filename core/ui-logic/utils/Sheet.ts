import assert from "assert";

export type SheetCell<T> = T;

export type SheetRow<T> = Array<SheetCell<T>>;

export type SheetColumn<T> = Array<SheetCell<T>>;

export type SheetType<T> = Array<SheetRow<T>>;

export interface MergedCell<T> {
	content: T;
	colspan: number; // number of columns for merge
	rowspan: number; // number of rows for merge
	isMaster: true; // marks the main cell
}

export interface MergedCellReference {
	masterRow: number;
	masterColumn: number;
	isMaster: false;
}

export type ExtendedSheetCell<T> = T | MergedCell<T> | MergedCellReference;

export type ExtendedSheetRow<T> = Array<ExtendedSheetCell<T>>;

export type ExtendedSheetType<T> = Array<ExtendedSheetRow<T>>;

export interface SheetInterface<T> {
	getCell: (row: number, column: number) => SheetCell<T>;
	getRow: (row: number) => SheetRow<T>;
	getColumn: (column: number) => SheetColumn<T>;
	getSheet: () => SheetType<T>;
	appendRow: (row: SheetRow<T>) => SheetType<T>;
	appendColumn: (column: SheetColumn<T>) => SheetType<T>;
	removeCell: (row: number, column: number) => SheetType<T>;
	removeRow: (row: number) => SheetType<T>;
	removeColumn: (column: number) => SheetType<T>;
	map: (callback: (cell: SheetCell<T>) => SheetCell<T>) => SheetType<T>;
	mergeCells: (startRow: number, startColumn: number, endRow: number, endColumn: number) => void;
	unmergeCells: (row: number, column: number) => void;
	isCellMerged: (row: number, column: number) => boolean;
	getMasterCell: (row: number, column: number) => { row: number; column: number; content: T };
	getCellSpan: (row: number, column: number) => { colspan: number; rowspan: number };
}

class Sheet<T> implements SheetInterface<T> {
	private _sheet: ExtendedSheetType<T>;

	constructor(sheet: SheetType<T>) {
		this._sheet = sheet as ExtendedSheetType<T>;
	}

	public static fromEmpty<T>(rows: number, columns: number): Sheet<T> {
		const sheet: SheetType<T> = [];

		for (let row = 0; row < rows; row++) {
			sheet.push(new Array(columns).fill(null));
		}

		return new Sheet<T>(sheet);
	}

	public static fromArray<T>(array: SheetType<T>): Sheet<T> {
		return new Sheet(array);
	}

	public getCell(row: number, column: number): SheetCell<T> {
		const cell = this._sheet[row][column];

		if (this._isMergedCell(cell)) {
			return cell.content;
		}

		if (this._isMergedCellReference(cell)) {
			const masterCell = this._sheet[cell.masterRow][cell.masterColumn];
			if (this._isMergedCell(masterCell)) {
				return masterCell.content;
			}
		}

		return cell as T;
	}

	public getMasterCell(row: number, column: number): { row: number; column: number; content: T } {
		const cell = this._sheet[row][column];

		if (this._isMergedCell(cell)) return { row, column, content: cell.content };

		if (this._isMergedCellReference(cell)) {
			const masterCell = this._sheet[cell.masterRow][cell.masterColumn];
			if (this._isMergedCell(masterCell)) {
				return {
					row: cell.masterRow,
					column: cell.masterColumn,
					content: masterCell.content,
				};
			}
		}

		return null;
	}

	public getCellSpan(row: number, column: number): { colspan: number; rowspan: number } | null {
		const cell = this._sheet[row][column];

		if (this._isMergedCell(cell)) {
			return { colspan: cell.colspan, rowspan: cell.rowspan };
		}

		if (this._isMergedCellReference(cell)) {
			const masterCell = this._sheet[cell.masterRow][cell.masterColumn];
			if (this._isMergedCell(masterCell)) {
				return { colspan: masterCell.colspan, rowspan: masterCell.rowspan };
			}
		}

		return { colspan: 1, rowspan: 1 };
	}

	public isCellMerged(row: number, column: number): boolean {
		const cell = this._sheet?.[row]?.[column];
		if (!cell) return false;
		return this._isMergedCell(cell) || this._isMergedCellReference(cell);
	}

	public mergeCells(startRow: number, startColumn: number, endRow: number, endColumn: number): void {
		assert(startRow >= 0 && startColumn >= 0 && endRow >= 0 && endColumn >= 0, "Invalid range for merging cells");
		assert(startRow < this._sheet.length && startColumn < this._sheet[0].length, "Invalid range for merging cells");
		assert(endRow < this._sheet.length && endColumn < this._sheet[0].length, "Invalid range for merging cells");
		assert(startRow <= endRow && startColumn <= endColumn, "Invalid range for merging cells");

		const contents: T[] = [];
		for (let r = startRow; r <= endRow; r++) {
			for (let c = startColumn; c <= endColumn; c++) {
				const cellContent = this.getCell(r, c);
				if (cellContent !== null && cellContent !== undefined) contents.push(cellContent);
			}
		}

		const mergedContent = contents.length > 0 ? contents[0] : null;
		const masterCell: MergedCell<T> = {
			content: mergedContent,
			colspan: endColumn - startColumn + 1,
			rowspan: endRow - startRow + 1,
			isMaster: true,
		};

		this._sheet[startRow][startColumn] = masterCell;

		for (let r = startRow; r <= endRow; r++) {
			for (let c = startColumn; c <= endColumn; c++) {
				if (r === startRow && c === startColumn) continue;

				const reference: MergedCellReference = {
					masterRow: startRow,
					masterColumn: startColumn,
					isMaster: false,
				};
				this._sheet[r][c] = reference;
			}
		}
	}

	public unmergeCells(row: number, column: number): void {
		const masterCell = this.getMasterCell(row, column);
		if (!masterCell) return;

		const masterRow = masterCell.row;
		const masterColumn = masterCell.column;
		const cell = this._sheet[masterRow][masterColumn];

		if (!this._isMergedCell(cell)) return;

		const content = cell.content;
		const endRow = masterRow + cell.rowspan - 1;
		const endColumn = masterColumn + cell.colspan - 1;

		for (let r = masterRow; r <= endRow; r++) {
			for (let c = masterColumn; c <= endColumn; c++) {
				this._sheet[r][c] = r === masterRow && c === masterColumn ? content : null;
			}
		}
	}

	public getRow(row: number): SheetRow<T> {
		if (this.isCellMerged(row, 0)) {
			const masterCell = this.getMasterCell(row, 0);
			if (masterCell) {
				const masterCellData = this._sheet[masterCell.row][masterCell.column];
				if (this._isMergedCell(masterCellData)) {
					const startRow = masterCell.row;
					const endRow = startRow + masterCellData.rowspan - 1;

					const result: SheetRow<T> = [];
					for (let r = startRow; r <= endRow; r++) {
						for (let column = 0; column < this._sheet[r].length; column++) {
							const cell = this._sheet[r][column];
							if (!this._isMergedCellReference(cell)) result.push(this.getCell(r, column));
						}
					}
					return result;
				}
			}
		}

		return this._sheet[row].map((_, column) => this.getCell(row, column));
	}

	public getColumn(column: number): SheetColumn<T> {
		if (this.isCellMerged(0, column)) {
			const masterCell = this.getMasterCell(0, column);
			if (masterCell) {
				const masterCellData = this._sheet[masterCell.row][masterCell.column];
				if (this._isMergedCell(masterCellData)) {
					const startColumn = masterCell.column;
					const endColumn = startColumn + masterCellData.colspan - 1;

					const result: SheetColumn<T> = [];
					for (let row = 0; row < this._sheet.length; row++) {
						for (let col = startColumn; col <= endColumn; col++) {
							const cell = this._sheet[row][col];
							if (!this._isMergedCellReference(cell)) result.push(this.getCell(row, col));
						}
					}
					return result;
				}
			}
		}

		return this._sheet.map((_, row) => this.getCell(row, column));
	}

	public getSheet(): SheetType<T> {
		return this._sheet.map((row, rowIndex) => row.map((_, columnIndex) => this.getCell(rowIndex, columnIndex)));
	}

	public appendRow(row: SheetRow<T>): SheetType<T> {
		this._sheet.push(row as ExtendedSheetRow<T>);
		return this.getSheet();
	}

	public appendColumn(column: SheetColumn<T>): SheetType<T> {
		this._sheet.forEach((row, index) => {
			if (column[index] !== undefined) row.push(column[index]);
		});
		return this.getSheet();
	}

	public sliceRow(startRow: number, endRow: number): SheetType<T> {
		return this._sheet
			.slice(startRow, endRow)
			.map((row, rowIndex) => row.map((_, columnIndex) => this.getCell(startRow + rowIndex, columnIndex)));
	}

	public sliceColumn(startColumn: number, endColumn: number): SheetType<T> {
		return this._sheet.map((row, rowIndex) =>
			row
				.slice(startColumn, endColumn)
				.map((_, columnIndex) => this.getCell(rowIndex, startColumn + columnIndex)),
		);
	}

	public removeCell(row: number, column: number): SheetType<T> {
		if (this.isCellMerged(row, column)) this.unmergeCells(row, column);

		this._sheet[row].splice(column, 1);
		return this.getSheet();
	}

	public removeRow(row: number): SheetType<T> {
		for (let column = 0; column < this._sheet[row].length; column++) {
			if (this.isCellMerged(row, column)) this.unmergeCells(row, column);
		}

		this._sheet.splice(row, 1);
		return this.getSheet();
	}

	public removeColumn(column: number): SheetType<T> {
		for (let row = 0; row < this._sheet.length; row++) {
			if (this.isCellMerged(row, column)) this.unmergeCells(row, column);
		}

		this._sheet.forEach((row) => row.splice(column, 1));
		return this.getSheet();
	}

	public map(callback: (cell: SheetCell<T>) => SheetCell<T>): SheetType<T> {
		return this._sheet.map((row, rowIndex) =>
			row.map((_, columnIndex) => callback(this.getCell(rowIndex, columnIndex))),
		);
	}

	private _isMergedCell<T>(cell: ExtendedSheetCell<T>): cell is MergedCell<T> {
		return typeof cell === "object" && cell !== null && "isMaster" in cell && cell.isMaster === true;
	}

	private _isMergedCellReference<T>(cell: ExtendedSheetCell<T>): cell is MergedCellReference {
		return typeof cell === "object" && cell !== null && "isMaster" in cell && cell.isMaster === false;
	}
}

export default Sheet;
