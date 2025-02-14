import { HoveredData } from "@ext/markdown/elements/table/edit/model/tableTypes";

export const hideOldControls = (containerVertical: Element, containerHorizontal: Element, hoveredData: HoveredData) => {
	const verticalController = containerVertical.childNodes.item(hoveredData.rowIndex) as HTMLElement;
	const horizontalController = containerHorizontal.childNodes.item(hoveredData.cellIndex) as HTMLElement;

	verticalController.childNodes.forEach((child: HTMLElement) => {
		child.classList.add("hidden");
	});

	const nextVerticalController = containerVertical?.childNodes
		?.item(hoveredData.rowIndex + 1)
		?.childNodes.item(0) as HTMLElement;
	if (nextVerticalController) nextVerticalController.classList.add("hidden");

	horizontalController?.childNodes?.forEach((child: HTMLElement) => {
		child.classList.add("hidden");
	});

	const nextHorizontalController = containerHorizontal?.childNodes
		?.item(hoveredData.cellIndex + 1)
		?.childNodes.item(0) as HTMLElement;
	if (nextHorizontalController) nextHorizontalController.classList.add("hidden");
};

export const showNewControls = (
	containerVertical: Element,
	containerHorizontal: Element,
	rowIndex: number,
	cellIndex: number,
) => {
	const verticalController = containerVertical.childNodes.item(rowIndex) as HTMLElement;
	const horizontalController = containerHorizontal.childNodes.item(cellIndex) as HTMLElement;

	verticalController?.childNodes?.forEach((child: HTMLElement) => {
		child.classList.remove("hidden");
	});

	horizontalController?.childNodes?.forEach((child: HTMLElement) => {
		child.classList.remove("hidden");
	});

	const nextVerticalController = containerVertical?.childNodes?.item(rowIndex + 1)?.childNodes.item(0) as HTMLElement;
	if (nextVerticalController) nextVerticalController.classList.remove("hidden");

	const nextHorizontalController = containerHorizontal?.childNodes
		?.item(cellIndex + 1)
		?.childNodes.item(0) as HTMLElement;
	if (nextHorizontalController) nextHorizontalController.classList.remove("hidden");
};
