import { Dispatch, ReactElement, SetStateAction, createContext, useContext, useState } from "react";

const IsOpenModalContext = createContext<boolean>(undefined);
let _setIsOpenModal: Dispatch<SetStateAction<boolean>> = () => {};

abstract class IsOpenModalService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
		_setIsOpenModal = setIsOpenModal;

		return <IsOpenModalContext.Provider value={isOpenModal}>{children}</IsOpenModalContext.Provider>;
	}

	static get value(): boolean {
		return useContext(IsOpenModalContext);
	}

	static set value(value: boolean) {
		_setIsOpenModal(value);
	}
}

export default IsOpenModalService;
