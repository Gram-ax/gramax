import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import InboxNoteTooltipEditor from "@ext/inbox/components/InboxNoteTooltipEditor";
import InboxLocalStorageManager from "@ext/inbox/logic/InboxLocalStorageManager";
import InboxUtility from "@ext/inbox/logic/InboxUtility";
import { InboxArticle, InboxRect } from "@ext/inbox/models/types";
import TooltipBase from "@ext/markdown/elementsUtils/prosemirrorPlugins/TooltipBase";

class InboxTooltip extends TooltipBase {
	isMounted = false;
	element: HTMLElement;
	note: InboxArticle;
	onDestroy: () => void;
	localStorageManager: InboxLocalStorageManager;
	isPinned = false;
	id: string;

	constructor(
		parentElement: HTMLElement,
		note: InboxArticle,
		apiUrlCreator: ApiUrlCreator,
		localStorageManager: InboxLocalStorageManager,
		notes: InboxArticle[],
		selectedPath: string[],
	) {
		super(
			InboxNoteTooltipEditor,
			{
				note,
				apiUrlCreator,
				notes,
				selectedPath,
			},
			parentElement,
		);
		this.id = InboxUtility.getArticleID(note.fileName, note.props.date ?? "");
		this.note = note;
		this.localStorageManager = localStorageManager;
	}

	unMount() {
		this.closeComponent();
	}

	updateComponentProps<T extends object>(newProps: T) {
		this.updateProps(newProps);
	}

	canSetComponent() {
		return true;
	}

	updateRect(rect: InboxRect) {
		this.localStorageManager.update(this.id, { rect });
		this.updateProps({ inboxRect: rect });
	}

	setIsPinned(isPinned: boolean) {
		if (isPinned === this.isPinned) return;
		this.isPinned = isPinned;

		this.updateProps({ isPinned });
	}

	setComponent(element: HTMLElement) {
		if (!element) return this.closeComponent();

		if (!this.isMounted) {
			this.setTooltipPosition(element);
		}

		if (!this.canSetComponent()) return;

		this.element = element;
		this.isMounted = true;
		const inboxRect = this.getInboxRect();
		const tooltipPosition = this.calculateTooltipPosition(element);

		this.updateProps({
			isOpen: true,
			element,
			tooltipPosition,
			inboxRect,
			isPinned: this.isPinned,
			updateRect: (rect) => this.updateRect(rect),
			setIsPinned: (isPinned) => this.setIsPinned(isPinned),
		});
	}

	closeComponent() {
		this.isMounted = false;
		this.updateProps({ isOpen: false });
		this._element.remove();
	}

	getInboxRect(): Partial<InboxRect> {
		const rect = this.localStorageManager.getDataByID(this.id)?.rect;
		if (rect?.x && rect?.y) {
			this.isPinned = true;
		}

		return rect;
	}

	calculateTooltipPosition(element: HTMLElement): Partial<InboxRect> {
		const distance = -7;
		const xOffset = -10;
		const domReact = this._parentElement.getBoundingClientRect();
		const rect = element.getBoundingClientRect();
		const leftOffset = rect.left - domReact.left;
		const top = rect.top - domReact.top + distance;

		return {
			x: leftOffset + rect.width + xOffset,
			y: top,
		};
	}

	override setTooltipPosition(element: HTMLElement) {
		const { x, y } = this.calculateTooltipPosition(element);

		this._element.style.left = x + "px";
		this._element.style.top = y + "px";
	}
}

export default InboxTooltip;
