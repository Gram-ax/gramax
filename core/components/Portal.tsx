import { Component } from "react";
import ReactDOM from "react-dom";

export default class Portal extends Component<{ parentId: string; className?: string; children?: React.ReactNode }> {
	private el: Element;
	private modalRoot: HTMLElement = null;
	constructor(props) {
		super(props);
	}
	private _createElemets() {
		this.el = document.createElement("div");
		this.el.className = this.props.className ?? "";
		this.modalRoot = document.getElementById(this.props.parentId);
	}
	override componentDidMount() {
		try {
			this._createElemets();
			this.modalRoot.appendChild(this.el);
		} catch {
			/* empty */
		}
	}

	override componentWillUnmount() {
		try {
			this._createElemets();
			this.modalRoot.innerHTML = "";
			this.modalRoot.removeChild(this.el);
		} catch {
			/* empty */
		}
	}

	override render() {
		if (this.modalRoot) return ReactDOM.createPortal(this.props.children, this.el);
		else return null;
	}
}
