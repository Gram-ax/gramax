import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useState } from "react";
import getModalComponentToRender from "./logic/getModalComponentToRender";
import ModalToOpen from "./model/ModalsToOpen";

const ModalToOpenContext = createContext<ModalToOpen>(undefined);
let _setIsOpenModal: Dispatch<SetStateAction<ModalToOpen>>;
let _setArgs: Dispatch<SetStateAction<{ [name: string]: any }>>;

export default abstract class ModalToOpenService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [modalToOpen, setModalToOpen] = useState<ModalToOpen>(null);
		const [args, setArgs] = useState<{ [name: string]: any }>({});
		_setIsOpenModal = setModalToOpen;
		_setArgs = setArgs;
		const Component = getModalComponentToRender[modalToOpen];

		return (
			<ModalToOpenContext.Provider value={modalToOpen}>
				<>
					{children}
					{Component ? <Component {...args} /> : null}
				</>
			</ModalToOpenContext.Provider>
		);
	}

	static setValue<T extends { [name: string]: any }>(value: ModalToOpen, args?: T) {
		_setIsOpenModal(value);
		if (args) _setArgs(args);
	}

	static get value(): ModalToOpen {
		return useContext(ModalToOpenContext);
	}
}
