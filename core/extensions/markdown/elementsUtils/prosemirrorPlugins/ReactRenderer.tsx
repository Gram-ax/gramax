import { FC } from "react";
import { createRoot, Root } from "react-dom/client";

class ReactRenderer {
	private Component: FC;
	private props;
	private _root: Root;
	protected _parentElement: HTMLElement;

	protected constructor(Component: FC, props = {}, _parentElement: HTMLElement) {
		this.Component = Component;
		this.props = props;
		this._parentElement = _parentElement;
	}

	public destroy(element) {
		this._parentElement?.removeChild(element);
		this._root.unmount();
	}

	protected _initialization(element: HTMLElement) {
		this._root = createRoot(element);
		this._parentElement.appendChild(element);
	}

	protected getProps() {
		return this.props;
	}

	protected updateProps(newProps: object) {
		this.props = {
			...this.props,
			...newProps,
		};

		this.render();
	}

	protected render() {
		this._root.render(<div>{this.props.isOpen && <this.Component {...this.props} />}</div>);
	}
}
export default ReactRenderer;
