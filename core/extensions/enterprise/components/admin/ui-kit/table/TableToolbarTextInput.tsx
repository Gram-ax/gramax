import { TextInput } from "@ui-kit/Input";
import { Icon } from "@ui-kit/Icon";
import { TextInputProps } from "@ui-kit/Input";
import styled from "@emotion/styled";

const StyledTextInput = styled(TextInput)`
	flex: 1;
	min-width: 220px;
	max-width: 200px;
`;

export const TableToolbarTextInput = ({ className, startIcon, placeholder, ...props }: TextInputProps) => {
	return (
		<StyledTextInput
			className={className}
			startIcon={startIcon || <Icon icon="search" />}
			placeholder={placeholder || "Поиск..."}
			{...props}
		/>
	);
};
