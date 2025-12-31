import t from "@ext/localization/locale/translate";
import { Select, SelectContent, SelectGroup, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { SelectItem as BaseSelectItem } from "@ui-kit/Select";
import styled from "@emotion/styled";
import { FC } from "react";
import { AnonymousFilter } from "../../useMetricsFilters";

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
		<Select value={value} onValueChange={handleChange} disabled={disabled}>
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
