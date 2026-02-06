import t from "@ext/localization/locale/translate";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Loader } from "@ui-kit/Loader";
import { Filter } from "lucide-react";
import { FC, useCallback, useMemo, useRef, useState } from "react";
import { PaginatedUsersResponse, useInfiniteScroll } from "./useInfiniteScroll";

interface MetricsUserFilterProps {
	disabled: boolean;
	selectedUserEmails: string[];
	onSearchUsers: (search?: string, limit?: number, cursor?: number) => Promise<PaginatedUsersResponse | null>;
	onSelectionChange: (selectedEmails: string[]) => void;
}

const MetricsUserFilter: FC<MetricsUserFilterProps> = ({
	disabled,
	selectedUserEmails,
	onSearchUsers,
	onSelectionChange,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const { users, searchQuery, isLoading, isLoadingMore, handleSearchChange, handleScroll, reset, loadInitial } =
		useInfiniteScroll({ onFetch: onSearchUsers });

	const handleUserToggle = useCallback(
		(userEmail: string) => {
			const isSelected = selectedUserEmails.includes(userEmail);
			if (isSelected) {
				onSelectionChange(selectedUserEmails.filter((email) => email !== userEmail));
			} else {
				onSelectionChange([...selectedUserEmails, userEmail]);
			}
		},
		[selectedUserEmails, onSelectionChange],
	);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			setIsOpen(open);
			if (open) {
				loadInitial();
			} else {
				reset();
			}
		},
		[loadInitial, reset],
	);

	const getDisplayLabel = (email: string): string => {
		return email || t("metrics.filters.users.anonymous");
	};

	const unifiedList = useMemo(() => {
		const list: { email: string; isSelected: boolean }[] = [];

		selectedUserEmails.forEach((email) => {
			if (email) {
				list.push({ email, isSelected: true });
			}
		});

		users.forEach((email) => {
			if (email && !selectedUserEmails.includes(email)) {
				list.push({ email, isSelected: false });
			}
		});

		return list;
	}, [selectedUserEmails, users]);

	const hasSelectedUsers = selectedUserEmails.length > 0;
	const unselectedUsers = unifiedList.filter((item) => !item.isSelected);
	const showNoResultsState = !isLoading && unselectedUsers.length === 0 && searchQuery.trim();

	return (
		<DropdownMenu onOpenChange={handleOpenChange} open={isOpen}>
			<DropdownMenuTrigger asChild>
				<div className="relative">
					<DropdownMenuTriggerButton className="h-9 w-9 p-0" disabled={disabled} variant="outline">
						<Filter className="h-4 w-4" />
					</DropdownMenuTriggerButton>
					{hasSelectedUsers && (
						<span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full" />
					)}
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-72 max-h-[400px] overflow-hidden flex flex-col">
				<div className="px-2 shrink-0" onKeyDown={(e) => e.stopPropagation()}>
					<div className="relative">
						<Icon
							className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
							icon="search"
						/>
						<input
							autoFocus
							className="w-full pl-8 pr-3 py-2 text-sm bg-transparent border-0 outline-none focus:outline-none placeholder:text-muted-foreground"
							onChange={(e) => handleSearchChange(e.target.value)}
							placeholder={t("metrics.filters.users.search-users")}
							type="text"
							value={searchQuery}
						/>
					</div>
				</div>
				{hasSelectedUsers && (
					<DropdownMenuItem
						className="text-muted-foreground text-sm shrink-0"
						onSelect={(e) => {
							e.preventDefault();
							onSelectionChange([]);
						}}
					>
						{t("metrics.filters.users.clear-selection")}
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator className="shrink-0" />
				<div className="overflow-y-auto flex-1" onScroll={handleScroll} ref={scrollContainerRef}>
					{/* Selected users always at top */}
					{unifiedList
						.filter((item) => item.isSelected)
						.map((item) => (
							<DropdownMenuCheckboxItem
								checked={true}
								key={item.email}
								onSelect={(e) => {
									e.preventDefault();
									handleUserToggle(item.email);
								}}
							>
								<span className="whitespace-nowrap">{getDisplayLabel(item.email)}</span>
							</DropdownMenuCheckboxItem>
						))}

					{/* Initial loading state */}
					{isLoading && unselectedUsers.length === 0 ? (
						<div className="flex items-center justify-center gap-2 py-4">
							<Loader />
							{t("metrics.filters.users.loading")}
						</div>
					) : showNoResultsState ? (
						<div className="py-4 text-center text-muted-foreground">
							{t("metrics.filters.users.no-users-found")}
						</div>
					) : (
						<>
							{unifiedList
								.filter((item) => !item.isSelected)
								.map((item) => (
									<DropdownMenuCheckboxItem
										checked={false}
										key={item.email}
										onSelect={(e) => {
											e.preventDefault();
											handleUserToggle(item.email);
										}}
									>
										<span className="whitespace-nowrap">{getDisplayLabel(item.email)}</span>
									</DropdownMenuCheckboxItem>
								))}

							{isLoadingMore && (
								<div className="flex items-center justify-center gap-2 py-2">
									<Loader />
								</div>
							)}
						</>
					)}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default MetricsUserFilter;
