import Sheet, { ExtendedSheetType, MergedCell, MergedCellReference } from "@core-ui/utils/Sheet";
import { Node } from "prosemirror-model";

export interface TablePositionMap {
	getPosition: (row: number, column: number) => number | null;
	getCellInfo: (
		row: number,
		column: number,
	) => {
		position: number;
		colspan: number;
		rowspan: number;
		isMerged: boolean;
		isMaster: boolean;
	} | null;
}

class TableNodeSheet extends Sheet<number> {
	private _positionMap: TablePositionMap | null = null;

	public static createFromProseMirrorNode(tableNode: Node, tableStartPos: number): TableNodeSheet {
		const sheet: ExtendedSheetType<number> = [];
		const positionMap = new Map<string, number>();

		let maxColumns = 0;
		for (let rowIndex = 0; rowIndex < tableNode.childCount; rowIndex++) {
			const row = tableNode.child(rowIndex);
			let columnCount = 0;
			for (let cellIndex = 0; cellIndex < row.childCount; cellIndex++) {
				const cell = row.child(cellIndex);
				columnCount += cell.attrs.colspan || 1;
			}
			maxColumns = Math.max(maxColumns, columnCount);
		}

		for (let rowIndex = 0; rowIndex < tableNode.childCount; rowIndex++) {
			sheet[rowIndex] = new Array(maxColumns).fill(null);
		}

		let currentPos = tableStartPos + 1;

		for (let rowIndex = 0; rowIndex < tableNode.childCount; rowIndex++) {
			const row = tableNode.child(rowIndex);
			currentPos += 1;

			let virtualColumnIndex = 0;

			for (let cellIndex = 0; cellIndex < row.childCount; cellIndex++) {
				const cell = row.child(cellIndex);
				const colspan = cell.attrs.colspan || 1;
				const rowspan = cell.attrs.rowspan || 1;

				while (virtualColumnIndex < maxColumns && sheet[rowIndex][virtualColumnIndex] !== null) {
					virtualColumnIndex++;
				}

				const cellPosition = currentPos;
				positionMap.set(`${rowIndex}-${virtualColumnIndex}`, cellPosition);

				if (colspan > 1 || rowspan > 1) {
					const masterCell: MergedCell<number> = {
						content: cellPosition,
						colspan,
						rowspan,
						isMaster: true,
					};
					sheet[rowIndex][virtualColumnIndex] = masterCell;

					for (let r = rowIndex; r < rowIndex + rowspan; r++) {
						for (let c = virtualColumnIndex; c < virtualColumnIndex + colspan; c++) {
							if (r === rowIndex && c === virtualColumnIndex) continue;

							if (!sheet[r]) {
								sheet[r] = new Array(maxColumns).fill(null);
							}

							const reference: MergedCellReference = {
								masterRow: rowIndex,
								masterColumn: virtualColumnIndex,
								isMaster: false,
							};
							sheet[r][c] = reference;
						}
					}
				} else {
					sheet[rowIndex][virtualColumnIndex] = cellPosition;
				}

				currentPos += cell.nodeSize;
				virtualColumnIndex += colspan;
			}

			currentPos += 1;
		}

		const instance = new TableNodeSheet([]);
		(instance as any)._sheet = sheet;
		instance._positionMap = {
			getPosition: (row: number, column: number) => {
				const key = `${row}-${column}`;
				return positionMap.get(key) || null;
			},
			getCellInfo: (row: number, column: number) => {
				if (row >= sheet.length || column >= sheet[0]?.length) return null;

				const cell = sheet[row][column];
				if (cell === null) return null;

				if (typeof cell === "number") {
					return {
						position: cell,
						colspan: 1,
						rowspan: 1,
						isMerged: false,
						isMaster: true,
					};
				}

				if (TableNodeSheet.isMergedCellHelper(cell)) {
					const position = positionMap.get(`${row}-${column}`) || cell.content;
					return {
						position,
						colspan: cell.colspan,
						rowspan: cell.rowspan,
						isMerged: true,
						isMaster: true,
					};
				}

				if (TableNodeSheet.isMergedCellReferenceHelper(cell)) {
					const masterPos = positionMap.get(`${cell.masterRow}-${cell.masterColumn}`);
					const masterCell = sheet[cell.masterRow][cell.masterColumn];
					if (TableNodeSheet.isMergedCellHelper(masterCell)) {
						return {
							position: masterPos || masterCell.content,
							colspan: masterCell.colspan,
							rowspan: masterCell.rowspan,
							isMerged: true,
							isMaster: false,
						};
					}
				}

				return null;
			},
		};

		return instance;
	}

	public getPositionMap(): TablePositionMap {
		return this._positionMap;
	}

	public getLogicalColumnIndex(columnIndex: number): number {
		const row = this.getSheet()[0];
		const seen = new Set<number>();
		let uniqueCount = 0;

		for (let i = 0; i < row.length; i++) {
			const value = row[i];
			if (!seen.has(value)) {
				seen.add(value);
				if (uniqueCount === columnIndex) return i;

				uniqueCount++;
			}
		}
	}

	public getLogicalRowIndex(rowIndex: number): number {
		const column = this.getSheet()[rowIndex];
		const seen = new Set<number>();
		let uniqueCount = 0;

		for (let i = 0; i < column.length; i++) {
			const value = column[i];
			if (!seen.has(value)) {
				seen.add(value);
				if (uniqueCount === rowIndex) return i;

				uniqueCount++;
			}
		}
	}

	private static isMergedCellHelper(cell: any): cell is MergedCell<number> {
		return typeof cell === "object" && cell !== null && "isMaster" in cell && cell.isMaster === true;
	}

	private static isMergedCellReferenceHelper(cell: any): cell is MergedCellReference {
		return typeof cell === "object" && cell !== null && "isMaster" in cell && cell.isMaster === false;
	}
}

export default TableNodeSheet;
