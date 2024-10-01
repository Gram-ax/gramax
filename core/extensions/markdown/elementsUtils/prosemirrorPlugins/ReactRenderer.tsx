import { FC } from "react";
import { createRoot, Root } from "react-dom/client";

class ReactRenderer {
	private Component: FC;
	private props;
	private _root: Root;
	protected _parentElement: HTMLElement;
	private readonly _ignoreShouldRender;

	protected constructor(Component: FC, props = {}, _parentElement: HTMLElement, ignoreShouldRender = false) {
		this.Component = Component;
		this.props = props;
		this._parentElement = _parentElement;
		this._ignoreShouldRender = ignoreShouldRender;
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

	protected updateProps<T extends object>(newProps: T) {
		this.props = Object.assign(this.props, newProps);
		this.render();
	}

	protected silentUpdateProps<T extends object>(props: T) {
		this.props = Object.assign(this.props, props);
	}

	protected render() {
		if (this._ignoreShouldRender) return this._root.render(<this.Component {...this.props} />);
		this._root.render(<div>{this.props.isOpen && <this.Component {...this.props} />}</div>);
	}
}
export default ReactRenderer;
