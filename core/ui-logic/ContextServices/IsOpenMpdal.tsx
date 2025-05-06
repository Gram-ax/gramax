import ContextService from "@core-ui/ContextServices/ContextService";
import { Dispatch, ReactElement, SetStateAction, createContext, useContext, useState } from "react";

const IsOpenModalContext = createContext<boolean>(undefined);

class IsOpenModalService implements ContextService {
	private _setIsOpenModal: Dispatch<SetStateAction<boolean>> = () => {};

	Init({ children }: { children: ReactElement }): ReactElement {
		const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
		this._setIsOpenModal = setIsOpenModal;

		return <IsOpenModalContext.Provider value={isOpenModal}>{children}</IsOpenModalContext.Provider>;
	}

	get value(): boolean {
		return useContext(IsOpenModalContext);
	}

	set value(value: boolean) {
		this._setIsOpenModal(value);
	}
}

export default new IsOpenModalService();
