import { CellAttrs } from "@ext/markdown/elements/table/edit/model/columnResizing/CellAttrs";
import { Node } from "prosemirror-model";

export function updateColumnsOnResize(
	node: Node,
	colgroup: HTMLTableColElement,
	table: HTMLTableElement,
	overrideCol?: number,
	overrideValue?: number,
): void {
	let nextDOM = colgroup.firstChild as HTMLElement;
	const row = node.firstChild;
	if (!row) return;

	for (let i = 0, col = 0; i < row.childCount; i++) {
		const { colspan, colwidth } = row.child(i).attrs as CellAttrs;
		for (let j = 0; j < colspan; j++, col++) {
			const hasWidth = overrideCol == col ? overrideValue : colwidth && colwidth[j];
			const cssWidth = hasWidth + "px";
			if (!nextDOM) {
				colgroup.appendChild(document.createElement("col"));
			} else {
				if (hasWidth && nextDOM.style.minWidth != cssWidth) {
					nextDOM.style.width = cssWidth;
					nextDOM.style.minWidth = cssWidth;
				}
				nextDOM = nextDOM.nextSibling as HTMLElement;
			}
		}
	}

	while (nextDOM) {
		const after = nextDOM.nextSibling;
		nextDOM.parentNode?.removeChild(nextDOM);
		nextDOM = after as HTMLElement;
	}
}
