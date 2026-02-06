import { Alert, AlertDescription, AlertIcon, AlertTitle } from "@ui-kit/Alert";

type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

interface FloatingAlertProps {
	show: boolean;
	title?: string;
	message: string | null;
	corner?: Corner;
	offsetClassName?: string;
	className?: string;
}

const cornerToBase = (corner: Corner) => {
	switch (corner) {
		case "top-left":
			return "fixed left-6 top-24";
		case "bottom-right":
			return "fixed right-6 bottom-6";
		case "bottom-left":
			return "fixed left-6 bottom-6";
		case "top-right":
		default:
			return "fixed right-6 top-24";
	}
};

export function FloatingAlert({
	show,
	title = "",
	message = "Ошибка операции",
	corner = "top-right",
	offsetClassName,
	className,
}: FloatingAlertProps) {
	const base = cornerToBase(corner);
	const offset = offsetClassName ? offsetClassName : "";
	return (
		<div
			className={[
				base,
				offset,
				"z-50 max-w-md min-w-[320px] transition-all duration-300",
				show ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0 pointer-events-none",
				className ?? "",
			].join(" ")}
		>
			<Alert focus="medium" status="error">
				<AlertIcon icon="alert-circle" />
				{title && <AlertTitle>{title}</AlertTitle>}
				<AlertDescription>{message}</AlertDescription>
			</Alert>
		</div>
	);
}
