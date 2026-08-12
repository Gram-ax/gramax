import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import t from "@ext/localization/locale/translate";
import { Counter } from "@ui-kit/Counter";
import { forwardRef } from "react";

interface DeleteSelectedButtonProps {
	count: number;
	onClick: () => void;
}

export const DeleteSelectedButton = forwardRef<HTMLButtonElement, DeleteSelectedButtonProps>((props, ref) => {
	const { count, onClick } = props;
	if (count === 0) return null;

	return (
		<Button
			className="group hover:!bg-status-error/10 focus:!bg-status-error/10 hover:text-status-error-fg focus:text-status-error-fg hover:!border-status-error-primary-border focus:!border-status-error-primary-border"
			onClick={onClick}
			ref={ref}
			startIcon="trash"
			type="button"
			variant="outline"
		>
			{t("delete")}
			<Counter
				className="group-hover:text-status-error-fg group-focus:text-status-error-fg tabular-nums p-0 min-w-0"
				variant="text"
			>
				{count}
			</Counter>
		</Button>
	);
});
