/** biome-ignore-all lint/suspicious/noExplicitAny: it's oks */
/** biome-ignore-all lint/complexity/noStaticOnlyClass: expected */
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { type Dispatch, type ReactElement, type SetStateAction, Suspense, useState } from "react";
import getModalComponentToRender from "./logic/getModalComponentToRender";
import type ModalToOpen from "./model/ModalsToOpen";

interface ModalStackEntry {
	id: string;
	modalType: ModalToOpen;
	args: { [name: string]: unknown };
}

let SetModalStack: Dispatch<SetStateAction<ModalStackEntry[]>> = () => {};
let IdCounter = 0;

export default abstract class ModalToOpenService {
	private static _value: ModalToOpen = null;
	private static _modalStackRef: ModalStackEntry[] = [];

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const isStaticCli = usePlatform().isStaticCli;
		const [modalStack, setModalStack] = useState<ModalStackEntry[]>(
			!isStaticCli ? ModalToOpenService._modalStackRef : [],
		);

		if (!isStaticCli) {
			SetModalStack = setModalStack;
		}

		return (
			<>
				{children}
				{modalStack.map((entry) => {
					const Component = getModalComponentToRender[entry.modalType];
					return Component ? (
						<Suspense fallback={<div>Loading...</div>} key={entry.id}>
							<Component {...entry.args} />
						</Suspense>
					) : null;
				})}
			</>
		);
	}

	static resetValue() {
		this._value = null;
		this._modalStackRef = [];
		SetModalStack?.(this._modalStackRef);
	}

	static setValue<T extends { [name: string]: any }>(value: ModalToOpen, args?: T) {
		ModalToOpenService._value = value;

		if (value === null) {
			this._modalStackRef = [];
			SetModalStack?.(this._modalStackRef);
		} else {
			const entry: ModalStackEntry = {
				id: `modal-${IdCounter++}`,
				modalType: value,
				args: args || {},
			};
			this._modalStackRef = [entry];
			SetModalStack?.(this._modalStackRef);
		}
	}

	static hasValue(): boolean {
		return ModalToOpenService._value !== null;
	}

	static addModal<T extends { [name: string]: any }>(modalType: ModalToOpen, args?: T): string {
		const entry: ModalStackEntry = {
			id: `modal-${IdCounter++}`,
			modalType,
			args: args || {},
		};

		SetModalStack?.((prev) => {
			const updated = [...prev, entry];
			this._modalStackRef = updated;
			return updated;
		});
		return entry.id;
	}

	static removeModal(id: string) {
		SetModalStack?.((prev) => {
			const filtered = prev.filter((m) => m.id !== id);
			this._modalStackRef = filtered;
			return filtered;
		});
	}

	static updateArgs<T extends { [name: string]: any }>(updater: (prevArgs: T) => T) {
		SetModalStack?.((prev) => {
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
