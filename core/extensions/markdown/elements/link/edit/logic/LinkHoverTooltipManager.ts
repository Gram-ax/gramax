import type { Environment } from "@app/resolveModule/env";
import type PageDataContext from "@core/Context/PageDataContext";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import LinkHoverTooltip from "./LinkHoverTooltip";

export class LinkHoverTooltipManager {
	private _tooltips: Set<LinkHoverTooltip> = new Set();

	constructor(
		private _parentElement: HTMLElement,
		private _pageDataContext: PageDataContext,
		private _environment?: Environment,
		private _basePath?: string,
	) {}

	createTooltip({
		linkElement,
		markData,
		anchorPos,
		resourcePath,
		hash,
		apiUrlCreator,
		href,
	}: {
		linkElement: HTMLElement;
		markData?: { from: number; to: number; mark: any };
		anchorPos?: number | null;
		resourcePath?: string;
		hash?: string;
		apiUrlCreator: ApiUrlCreator;
		href?: string;
	}) {
		const tooltip = new LinkHoverTooltip(
			this._parentElement,
			apiUrlCreator,
			this._pageDataContext,
			this._environment,
			this._basePath,
		);

		tooltip.onDestroy = () => {
			this._tooltips.delete(tooltip);
		};

		if (markData) tooltip.setMarkData(markData);
		if (resourcePath) tooltip.setResourcePath(resourcePath, hash, href);
		if (anchorPos) tooltip.updateAnchorPos(anchorPos);

		tooltip.setComponent(linkElement);

		this._tooltips.add(tooltip);
		return tooltip;
	}

	removeTooltip(tooltip: LinkHoverTooltip) {
		if (this._tooltips.has(tooltip)) {
			tooltip.unMount();
			this._tooltips.delete(tooltip);
		}
	}

	updateAnchorPos(pos: number | null) {
		this._tooltips.forEach((tooltip) => tooltip.updateAnchorPos(pos));
	}

	getTooltip(resourcePath: string) {
		return Array.from(this._tooltips.values()).find((tooltip) => tooltip.resourcePath === resourcePath);
	}

	destroyAll() {
		this._tooltips.forEach((tooltip) => tooltip.unMount());
		this._tooltips.clear();
	}
}
