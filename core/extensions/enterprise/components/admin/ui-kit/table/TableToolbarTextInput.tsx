import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { Icon } from "@ui-kit/Icon";
import { TextInput, type TextInputProps } from "@ui-kit/Input";

export const TableToolbarTextInput = ({ className, startIcon, placeholder, ...props }: TextInputProps) => {
	return (
		<TextInput
			className={cn("flex-1 max-w-[300px]", className)}
			placeholder={placeholder || t("enterprise.admin.search")}
			showClearIcon
			startIcon={startIcon || <Icon icon="list-filter" />}
			{...props}
		/>
	);
};
