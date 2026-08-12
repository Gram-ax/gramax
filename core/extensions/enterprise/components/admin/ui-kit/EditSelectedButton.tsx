import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import t from "@ext/localization/locale/translate";
import { Counter } from "@ui-kit/Counter";
import { forwardRef } from "react";

interface EditSelectedButtonProps {
	count: number;
	onClick?: () => void;
}

export const EditSelectedButton = forwardRef<HTMLButtonElement, EditSelectedButtonProps>(({ count, onClick }, ref) => {
	if (count === 0) return null;

	return (
		<Button onClick={onClick} ref={ref} startIcon="pen" variant="outline">
			{t("edit2")}
			<Counter className="tabular-nums p-0 min-w-0" variant="text">
				{count}
			</Counter>
		</Button>
	);
});
