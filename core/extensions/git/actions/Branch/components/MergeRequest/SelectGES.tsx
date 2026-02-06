import ReformattedSelect from "@components/Select/ReformattedSelect";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import type { Signature } from "@ext/git/core/model/Signature";
import { useRef, useState } from "react";

interface SelectGESProps {
	approvers: Signature[];
	preventSearchAndStartLoading: boolean;
	onChange: (
		reviewers: {
			value: string;
			label: string;
			name: string;
			email: string;
		}[],
	) => void;
}

const SelectGES = ({ approvers, onChange, preventSearchAndStartLoading }: SelectGESProps) => {
	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;
	const enterpriseSource = getEnterpriseSourceData(SourceDataService.value, gesUrl);
	const [options, setOptions] = useState<Signature[]>([]);
	const [enterpriseApi] = useState(() => new EnterpriseApi(gesUrl));
	const [isLoading, setIsLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const { start } = useDebounce(async () => {
		const value = inputRef.current?.value || "";
		setIsLoading(true);
		const users = await enterpriseApi.getUsers(value, enterpriseSource?.token ?? "");
		setIsLoading(false);
		setOptions(users);
	}, 200);

	return (
		<ReformattedSelect
			backspaceDelete
			dropdownHeight="200px"
			handleKeyDownFn={({ event }) => {
				inputRef.current = event.target as HTMLInputElement;
				if (
					event.location !== 0 ||
					event.key.startsWith("Arrow") ||
					event.key === "Enter" ||
					preventSearchAndStartLoading
				)
					return;
				start();
			}}
			loading={preventSearchAndStartLoading || isLoading}
			onChange={onChange}
			options={options.map((author) => ({
				value: `${author.name} <${author.email}>`,
				label: `${author.name} <${author.email}>`,
				name: author.name,
				email: author.email,
			}))}
			placeholder=""
			required
			values={approvers?.map((approver) => ({
				value: `${approver.name} <${approver.email}>`,
				label: `${approver.name} <${approver.email}>`,
			}))}
		/>
	);
};

export default SelectGES;
