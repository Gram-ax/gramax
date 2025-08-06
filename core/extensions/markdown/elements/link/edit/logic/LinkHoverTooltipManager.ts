import LinkHoverTooltip from "./LinkHoverTooltip";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import PageDataContext from "@core/Context/PageDataContext";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";

export class LinkHoverTooltipManager {
	private tooltips: Set<LinkHoverTooltip> = new Set();

	constructor(
		private parentElement: HTMLElement,
		private apiUrlCreator: ApiUrlCreator,
		private pageDataContext: PageDataContext,
		private catalogProps: ClientCatalogProps,
	) {}

	createTooltip({
		linkElement,
		markData,
		anchorPos,
		resourcePath,
		hash,
	}: {
		linkElement: HTMLElement;
		markData?: { from: number; to: number; mark: any };
		anchorPos?: number | null;
		resourcePath?: string;
		hash?: string;
	}) {
		const tooltip = new LinkHoverTooltip(
			this.parentElement,
			this.apiUrlCreator,
			this.pageDataContext,
			this.catalogProps,
		);

		tooltip.onDestroy = () => {
			this.tooltips.delete(tooltip);
		};

		if (markData) tooltip.setMarkData(markData);
		if (resourcePath) tooltip.setResourcePath(resourcePath, hash);
		if (anchorPos) tooltip.updateAnchorPos(anchorPos);

		tooltip.setComponent(linkElement);

		this.tooltips.add(tooltip);
		return tooltip;
	}

	removeTooltip(tooltip: LinkHoverTooltip) {
		if (this.tooltips.has(tooltip)) {
			tooltip.unMount();
			this.tooltips.delete(tooltip);
		}
	}

	updateAnchorPos(pos: number | null) {
		this.tooltips.forEach((tooltip) => tooltip.updateAnchorPos(pos));
	}

	getTooltip(resourcePath: string) {
		return Array.from(this.tooltips.values()).find((tooltip) => tooltip.resourcePath === resourcePath);
	}

	destroyAll() {
		this.tooltips.forEach((tooltip) => tooltip.unMount());
		this.tooltips.clear();
	}
}
