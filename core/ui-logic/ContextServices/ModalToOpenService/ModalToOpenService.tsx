import { usePlatform } from "@core-ui/hooks/usePlatform";
import { type Dispatch, type ReactElement, type SetStateAction, useState } from "react";
import getModalComponentToRender from "./logic/getModalComponentToRender";
import type ModalToOpen from "./model/ModalsToOpen";

interface ModalStackEntry {
	id: string;
	modalType: ModalToOpen;
	args: { [name: string]: any };
}

let _setModalStack: Dispatch<SetStateAction<ModalStackEntry[]>> = () => {};
let _idCounter = 0;

export default abstract class ModalToOpenService {
	private static _value: ModalToOpen = null;
	private static _modalStackRef: ModalStackEntry[] = [];

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const isStaticCli = usePlatform().isStaticCli;
		const [modalStack, setModalStack] = useState<ModalStackEntry[]>(
			!isStaticCli ? ModalToOpenService._modalStackRef : [],
		);

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
		this._modalStackRef = [];
		_setModalStack?.(this._modalStackRef);
	}

	static setValue<T extends { [name: string]: any }>(value: ModalToOpen, args?: T) {
		ModalToOpenService._value = value;

		if (value === null) {
			this._modalStackRef = [];
			_setModalStack?.(this._modalStackRef);
		} else {
			const entry: ModalStackEntry = {
				id: `modal-${_idCounter++}`,
				modalType: value,
				args: args || {},
			};
			this._modalStackRef = [entry];
			_setModalStack?.(this._modalStackRef);
		}
	}

	static hasValue(): boolean {
		return ModalToOpenService._value !== null;
	}

	static addModal<T extends { [name: string]: any }>(modalType: ModalToOpen, args?: T): string {
		const entry: ModalStackEntry = {
			id: `modal-${_idCounter++}`,
			modalType,
			args: args || {},
		};

		_setModalStack?.((prev) => {
			const updated = [...prev, entry];
			this._modalStackRef = updated;
			return updated;
		});
		return entry.id;
	}

	static removeModal(id: string) {
		_setModalStack?.((prev) => {
			const filtered = prev.filter((m) => m.id !== id);
			this._modalStackRef = filtered;
			return filtered;
		});
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
			this._modalStackRef = updated;
			return updated;
		});
	}

	static get value(): ModalToOpen {
		return ModalToOpenService._value;
	}
}
