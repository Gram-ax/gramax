import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import PageDataContext from "@core/Context/PageDataContext";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import ArticleLinkTooltip from "@ext/markdown/elements/link/edit/logic/ArticleLinkTooltip";
import TooltipBase from "@ext/markdown/elementsUtils/prosemirrorPlugins/TooltipBase";
import { Mark } from "@tiptap/pm/model";

class LinkHoverTooltip extends TooltipBase {
	markPosition: { from: number; to: number };
	isMounted = false;
	isLeaved = false;
	element: HTMLElement;
	resourcePath?: string;
	anchorPos: number;
	onDestroy: () => void;
	mark: Mark;

	constructor(
		parentElement: HTMLElement,
		apiUrlCreator: ApiUrlCreator,
		pageDataContext: PageDataContext,
		catalogProps: ClientCatalogProps,
	) {
		const props = {
			isOpen: false,
			catalogProps,
			apiUrlCreator,
			pageDataContext,
			closeHandler: () => this.closeComponent(),
			getMark: () => this.getMark(),
		};

		super(ArticleLinkTooltip, props, parentElement);
	}

	getMark() {
		return this.mark;
	}

	unMount() {
		this.closeComponent();
		this.destroyFunctions();
	}

	destroyFunctions(delay?: 200) {
		setTimeout(() => {
			this.destroy(this._element);
			this.onDestroy();
		}, delay);
	}

	canSetComponent() {
		if (!this.markPosition || !this.anchorPos) return true;
		const { from, to } = this.markPosition;

		if (this.anchorPos >= from && this.anchorPos <= to - 1) {
			return false;
		}

		return true;
	}

	updateAnchorPos(pos: number) {
		this.anchorPos = pos;
	}

	setMarkData({ from, to, mark }: { from: number; to: number; mark: Mark }) {
		this.markPosition = { from, to };
		this.mark = mark;
	}

	setResourcePath = (resourcePath: string) => {
		this.resourcePath = resourcePath;
	};

	setComponent(element: HTMLElement) {
		if (!element) return this.closeComponent();

		if (!this.isMounted) {
			this.setTooltipPosition(element);
		}

		if (!this.canSetComponent()) return;

		if (this.element !== element) {
			this.deleteObserver(this.element);
			this.setObserver(element);
		}

		this.element = element;
		this.isMounted = true;

		this.updateProps({ isOpen: true, element, resourcePath: this.resourcePath });
	}

	setObserver(element: HTMLElement) {
		element.addEventListener("mouseleave", this._mouseLeave.bind(this));
		this.isLeaved = false;
	}

	deleteObserver(element: HTMLElement) {
		if (element && element.removeEventListener) {
			element.removeEventListener("mouseleave", this._mouseLeave.bind(this));
		}
	}

	closeComponent() {
		this.isMounted = false;
		this.deleteObserver(this.element);
		this.updateProps({ isOpen: false });
		this.destroyFunctions();
	}

	observerCallback() {
		this.isLeaved = true;
	}

	private _mouseLeave = () => this.observerCallback();
}

export default LinkHoverTooltip;
