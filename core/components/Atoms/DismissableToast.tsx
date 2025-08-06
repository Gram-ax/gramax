import { customToast, Toast, type CustomToastProps } from "ics-ui-kit/components/toast";
import type { ToastProps } from "ics-ui-kit/components/toast/ToastView";
import { useCallback, useRef } from "react";

export type DismissableToastProps = ToastProps & { dismiss: React.MutableRefObject<() => void> };

const DismissableToast = ({ dismiss, toast, id, ...props }: CustomToastProps & DismissableToastProps) => {
	dismiss.current = () => toast.dismiss(id);
	return <Toast id={id as number} {...props} />;
};

const dismissableToast = (props: DismissableToastProps) => {
	return customToast(({ id, toast }) => <DismissableToast id={id} toast={toast} {...props} />, {
		duration: Infinity,
	});
};

export const useDismissableToast = (props: Omit<DismissableToastProps, "dismiss">) => {
	const dismiss = useRef<() => void>(null);

	const show = useCallback(() => {
		dismissableToast({ ...props, dismiss });
	}, [props, dismiss]);

	return { dismiss, show };
};

export default dismissableToast;
