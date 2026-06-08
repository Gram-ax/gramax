import Input from "@components/Atoms/Input";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { cn } from "@core-ui/utils/cn";
import { Icon } from "@ui-kit/Icon";
import { Loader } from "@ui-kit/Loader";
import { forwardRef } from "react";

interface SearchProps {
	dataQa: string;
	showErrorText?: boolean;
	placeholder?: string;
	errorText?: string;
	searchValue: string;
	isLoading: boolean;
	setIsLoading: (isLoading: boolean) => void;
	setSearchValue: (value: string) => void;
	onValueChange?: (value: string) => Promise<void> | void;
	className?: string;
}

const Search = forwardRef<HTMLInputElement, SearchProps>((props, ref) => {
	const {
		dataQa,
		showErrorText,
		placeholder,
		errorText,
		searchValue,
		setSearchValue,
		onValueChange,
		className,
		isLoading,
		setIsLoading,
	} = props;
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
		<span
			className={cn(
				"flex items-center gap-2 text-sm px-4 mb-2 bg-[var(--color-article-bg)] py-1 font-normal",
				className,
			)}
		>
			<Input
				dataQa={dataQa ?? placeholder}
				errorText={errorText}
				onChange={onChangeHandler}
				placeholder={placeholder}
				ref={ref}
				showErrorText={showErrorText}
				value={searchValue}
			/>
			{isLoading ? <Loader className="p-0" size="md" /> : <Icon icon="search" />}
		</span>
	);
});

export default Search;
