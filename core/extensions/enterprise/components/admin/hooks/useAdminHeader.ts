import {
	type StickyHeaderContent,
	useAdminHeaderStore,
} from "@ext/enterprise/components/admin/contexts/AdminHeaderContext";
import { useLayoutEffect, useRef } from "react";

type UseAdminHeaderArgs = StickyHeaderContent;

export const useAdminHeader = (args: UseAdminHeaderArgs) => {
	const { title, actions, className, titleClassName, alert } = args;
	const store = useAdminHeaderStore();
	const ownerRef = useRef({});

	const alertTitle = alert?.title ?? null;
	const alertBadge = alert?.badge ?? null;
	const alertMessage = alert?.message ?? null;
	const alertShow = Boolean(alert?.isShown);

	useLayoutEffect(() => {
		const owner = ownerRef.current;
		store.publish(owner, {
			title,
			actions,
			className,
			titleClassName,
			alert: { title: alertTitle, message: alertMessage, isShown: alertShow, badge: alertBadge },
		});
		return () => store.clear(owner);
	}, [store, title, actions, className, titleClassName, alertTitle, alertMessage, alertShow, alertBadge]);
};
