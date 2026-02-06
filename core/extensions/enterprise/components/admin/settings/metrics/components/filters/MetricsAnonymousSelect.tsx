import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import {
	SelectItem as BaseSelectItem,
	Select,
	SelectContent,
	SelectGroup,
	SelectTrigger,
	SelectValue,
} from "@ui-kit/Select";
import type { FC } from "react";
import type { AnonymousFilter } from "../../filters";

const StyledSelectItemWrapper = styled.div`
  [role="option"] {
    padding-left: 2rem;
    padding-right: 0.5rem;
  }
  [role="option"] > span:first-child {
    left: 0.5rem;
    right: auto;
  }
`;

const SelectItem: FC<React.ComponentProps<typeof BaseSelectItem>> = (props) => {
	return (
		<StyledSelectItemWrapper>
			<BaseSelectItem {...props} />
		</StyledSelectItemWrapper>
	);
};

interface MetricsAnonymousSelectProps {
	value: AnonymousFilter;
	disabled: boolean;
	onChange: (value: AnonymousFilter) => void;
}

const MetricsAnonymousSelect: FC<MetricsAnonymousSelectProps> = ({ value, disabled, onChange }) => {
	const handleChange = (newValue: string) => {
		onChange(newValue as AnonymousFilter);
	};

	const getDisplayValue = () => {
		switch (value) {
			case "all":
				return t("metrics.filters.anonymous.all");
			case "registered":
				return t("metrics.filters.anonymous.registered");
			case "anonymous":
				return t("metrics.filters.anonymous.anonymous");
		}
	};

	return (
		<Select disabled={disabled} onValueChange={handleChange} value={value}>
			<SelectTrigger className="w-auto min-w-[180px]">
				<SelectValue placeholder={getDisplayValue()} />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectItem value="all">{t("metrics.filters.anonymous.all")}</SelectItem>
					<SelectItem value="registered">{t("metrics.filters.anonymous.registered")}</SelectItem>
					<SelectItem value="anonymous">{t("metrics.filters.anonymous.anonymous")}</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	);
};

export default MetricsAnonymousSelect;
