import { useCallback, useState } from "react";

export interface AlertMessageState {
	isShown: boolean;
	title?: string;
	message: string;
	badge?: string;
}

export const useAlertMessage = () => {
	const [title, setTitle] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [badge, setBadge] = useState<string | null>(null);
	const [isShown, setIsShow] = useState(false);

	const hide = useCallback(() => {
		setIsShow(false);
	}, []);

	const alert = useCallback((text: string, title?: string, badge?: string) => {
		setMessage(text);
		setTitle(title);
		setBadge(badge);
		setIsShow(true);
	}, []);

	return { message, title, badge, isShown, alert, hide };
};
