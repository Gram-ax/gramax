import { Dispatch, ReactElement, SetStateAction, useState } from "react";
import getModalComponentToRender from "./logic/getModalComponentToRender";
import ModalToOpen from "./model/ModalsToOpen";
import { usePlatform } from "@core-ui/hooks/usePlatform";

interface ModalStackEntry {
	id: string;
	modalType: ModalToOpen;
	args: { [name: string]: any };
}

let _setModalStack: Dispatch<SetStateAction<ModalStackEntry[]>> = () => {};
let _idCounter = 0;

export default abstract class ModalToOpenService {
	private static _value: ModalToOpen = null;

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const isStaticCli = usePlatform().isStaticCli;
		const [modalStack, setModalStack] = useState<ModalStackEntry[]>([]);

		if (!isStaticCli) {
			_setModalStack = setModalStack;
		}

		return (
			<>
				{children}
				{modalStack.map((entry) => {
					const Component = getModalComponentToRender[entry.modalType];
					return Component ? <Component key={entry.id} {...entry.args} /> : null;
				})}
			</>
		);
	}

	static resetValue() {
		this._value = null;
		_setModalStack?.([]);
	}

	static setValue<T extends { [name: string]: any }>(value: ModalToOpen, args?: T) {
		this._value = value;

		if (value === null) {
			_setModalStack?.([]);
		} else {
			const entry: ModalStackEntry = {
				id: `modal-${_idCounter++}`,
				modalType: value,
				args: args || {},
			};
			_setModalStack?.([entry]);
		}
	}

	static hasValue(): boolean {
		return this._value !== null;
	}

	static addModal<T extends { [name: string]: any }>(modalType: ModalToOpen, args?: T): string {
		const entry: ModalStackEntry = {
			id: `modal-${_idCounter++}`,
			modalType,
			args: args || {},
		};

		_setModalStack?.((prev) => [...prev, entry]);
		return entry.id;
	}

	static removeModal(id: string) {
		_setModalStack?.((prev) => prev.filter((m) => m.id !== id));
	}

	static updateArgs<T extends { [name: string]: any }>(updater: (prevArgs: T) => T) {
		_setModalStack?.((prev) => {
			if (prev.length === 0) return prev;
			const updated = [...prev];
			const lastIndex = updated.length - 1;
			updated[lastIndex] = {
				...updated[lastIndex],
				args: updater(updated[lastIndex].args as T),
			};
			return updated;
		});
	}

	static get value(): ModalToOpen {
		return this._value;
	}
}
