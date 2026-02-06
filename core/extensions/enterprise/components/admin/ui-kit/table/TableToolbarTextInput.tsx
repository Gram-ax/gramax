import styled from "@emotion/styled";
import { Icon } from "@ui-kit/Icon";
import { TextInput, TextInputProps } from "@ui-kit/Input";

const StyledTextInput = styled(TextInput)`
	flex: 1;
	min-width: 220px;
`;

export const TableToolbarTextInput = ({ className, startIcon, placeholder, ...props }: TextInputProps) => {
	return (
		<StyledTextInput
			className={className}
			placeholder={placeholder || "Поиск..."}
			startIcon={startIcon || <Icon icon="search" />}
			{...props}
		/>
	);
};
