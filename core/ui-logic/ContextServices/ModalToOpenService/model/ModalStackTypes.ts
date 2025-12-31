import { ReactNode } from "react";
import ModalToOpen from "./ModalsToOpen";

export interface ModalControls<T = void> {
	close: () => void;
	resolve: (value: T | undefined) => void;
	reject: (reason?: any) => void;
}

export type ModalContent<T = void> = (controls: ModalControls<T>) => ReactNode;

export interface ModalEntry<T = any> {
	id: string;
	modalType: ModalToOpen;
	args: { [name: string]: any };
	resolve: (value: T | undefined) => void;
	reject: (reason?: any) => void;
}
