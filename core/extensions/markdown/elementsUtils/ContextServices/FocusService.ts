import { Dispatch, SetStateAction } from "react";

export default abstract class FocusService {
	private static _setFocusPosition: Dispatch<SetStateAction<number>>;

	public static bindSetFocusPosition(setFocusPosition: Dispatch<SetStateAction<number>>) {
		this._setFocusPosition = setFocusPosition;
	}

	public static setFocusPosition(position: number) {
		this._setFocusPosition(position);
	}
}
