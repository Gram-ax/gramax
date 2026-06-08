import type PageDataContext from "@core/Context/PageDataContext";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ArticleLinkTooltip from "@ext/markdown/elements/link/edit/logic/ArticleLinkTooltip";
import TooltipBase from "@ext/markdown/elementsUtils/prosemirrorPlugins/TooltipBase";

export class FragmentLinkHoverTooltip extends TooltipBase {
	fragmentId: string;
	isMounted = false;
	element: HTMLElement;
	onDestroy: () => void;

	constructor(
		parentElement: HTMLElement,
		apiUrlCreator: ApiUrlCreator,
		pageDataContext: PageDataContext,
		catalogProps?: ClientCatalogProps,
	) {
		super(
			ArticleLinkTooltip,
			{
				isOpen: false,
				apiUrlCreator,
				catalogProps,
				pageDataContext,
				getMark: () => undefined,
				closeHandler: () => this.closeComponent(),
			},
			parentElement,
		);
	}

	setFragmentId(id: string, apiUrlCreator: ApiUrlCreator) {
		this.fragmentId = id;
		this.updateProps({
			url: apiUrlCreator.getFragmentRenderData(id),
			resourceItemId: id,
			resourceProviderType: "fragment",
		});
	}

	setComponent(element: HTMLElement) {
		if (!element) return this.closeComponent();
		if (!this.isMounted) this.setTooltipPosition(element);
		this.element = element;
		this.isMounted = true;
		this.updateProps({ isOpen: true, element });
	}

	closeComponent() {
		this.isMounted = false;
		this.updateProps({ isOpen: false });
		setTimeout(() => {
			this.destroy(this._element);
			this.onDestroy?.();
		}, 250);
	}
}
