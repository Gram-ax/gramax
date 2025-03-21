import SelectSrc from "@components/Select/Select";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import styled from "@emotion/styled";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { Signature } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import { useRef, useState } from "react";

const Select = styled(SelectSrc)`
	.react-dropdown-select-content {
		overflow: hidden;
	}
`;

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
	const [options, setOptions] = useState<Signature[]>([]);
	const [enterpriseApi] = useState(() => new EnterpriseApi(gesUrl));
	const [isLoading, setIsLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const { start } = useDebounce(async () => {
		const value = inputRef.current?.value || "";
		setIsLoading(true);
		const users = await enterpriseApi.getUsers(value);
		setIsLoading(false);
		setOptions(users);
	}, 200);

	return (
		<Select
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
			backspaceDelete
			required
			values={approvers.map((approver) => ({
				value: `${approver.name} <${approver.email}>`,
				label: `${approver.name} <${approver.email}>`,
			}))}
			options={options.map((author) => ({
				value: `${author.name} <${author.email}>`,
				label: `${author.name} <${author.email}>`,
				name: author.name,
				email: author.email,
			}))}
			placeholder=""
			onChange={onChange}
			loading={preventSearchAndStartLoading || isLoading}
			dropdownHeight="200px"
		/>
	);
};

export default SelectGES;
