import { Dispatch, ReactElement, SetStateAction, useState } from "react";
import getModalComponentToRender from "./logic/getModalComponentToRender";
import ModalToOpen from "./model/ModalsToOpen";

let _setIsOpenModal: Dispatch<SetStateAction<ModalToOpen>> = () => {};
let _setArgs: Dispatch<SetStateAction<{ [name: string]: any }>> = () => {};

export default abstract class ModalToOpenService {
	private static _value: ModalToOpen = null;
	private static _args: { [name: string]: any } = {};

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [modalToOpen, setModalToOpen] = useState<ModalToOpen>(null);
		const [args, setArgs] = useState<{ [name: string]: any }>({});
		ModalToOpenService._args = args;
		_setIsOpenModal = setModalToOpen;
		_setArgs = setArgs;
		const Component = getModalComponentToRender[modalToOpen];

		return (
			<>
				{children}
				{Component ? <Component {...args} /> : null}
			</>
		);
	}

	static resetValue() {
		this._value = null;
		_setIsOpenModal?.(null);
	}

	static setValue<T extends { [name: string]: any }>(value: ModalToOpen, args?: T) {
		this._value = value;
		_setIsOpenModal?.(value);
		_setArgs?.(args);
	}

	static updateArgs<T extends { [name: string]: any }>(f: (prevArgs: T) => T) {
		_setArgs?.(f(ModalToOpenService._args as T));
	}

	static get value(): ModalToOpen {
		return this._value;
	}
}
