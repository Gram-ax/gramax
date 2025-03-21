import Icon from "@components/Atoms/Icon";
import Input from "@components/Atoms/Input";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import styled from "@emotion/styled";
import { useState, forwardRef } from "react";

interface SearchProps {
	dataQa: string;
	showErrorText?: boolean;
	placeholder?: string;
	errorText?: string;
	searchValue: string;
	setSearchValue: (value: string) => void;
	onValueChange?: (value: string) => Promise<void> | void;
	className?: string;
}

const Search = forwardRef<HTMLInputElement, SearchProps>((props, ref) => {
	const { dataQa, showErrorText, placeholder, errorText, searchValue, setSearchValue, onValueChange, className } =
		props;
	const [isLoading, setIsLoading] = useState(false);
	const debounceSearch = useDebounce(async (value: string) => {
		await onValueChange?.(value);
		setIsLoading(false);
	}, 250);

	const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setSearchValue(newValue);
		setIsLoading(true);
		debounceSearch.cancel();
		debounceSearch.start(newValue);
	};

	return (
		<span className={className}>
			<Input
				dataQa={dataQa ?? placeholder}
				showErrorText={showErrorText}
				errorText={errorText}
				ref={ref}
				value={searchValue}
				onChange={onChangeHandler}
				placeholder={placeholder}
			/>
			{isLoading ? <SpinnerLoader width={14} height={14} /> : <Icon code="search" />}
		</span>
	);
});

export default styled(Search)`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.9rem;
	padding-right: 1rem;
	padding-left: 1rem;
	margin-bottom: 0.5em;
	background-color: var(--color-article-bg);
	padding-top: 0.2rem;
	padding-bottom: 0.2rem;
`;
