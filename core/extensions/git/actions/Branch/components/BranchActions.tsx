/** biome-ignore-all lint/correctness/useExhaustiveDependencies: it's ok */
import Button, { TextSize } from "@components/Atoms/Button/Button";
import Icon from "@components/Atoms/Icon";
import Input from "@components/Atoms/Input";
import ScrollableElement from "@components/Layouts/ScrollableElement";
import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import { classNames } from "@components/libs/classNames";
import { useRouter } from "@core/Api/useRouter";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import BranchItem from "@ext/git/actions/Branch/components/BranchItem";
import { BranchStatusEnum } from "@ext/git/actions/Branch/components/BranchStatus";
import getNewBranchNameErrorLocalization from "@ext/git/actions/Branch/components/logic/getNewBranchNameErrorLocalization";
import validateBranchError from "@ext/git/actions/Branch/components/logic/validateBranchError";
import Search from "@ext/git/actions/Branch/components/Search";
import type ClientGitBranchData from "@ext/git/actions/Branch/model/ClientGitBranchData";
import tryOpenMergeConflict from "@ext/git/actions/MergeConflictHandler/logic/tryOpenMergeConflict";
import type MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import t from "@ext/localization/locale/translate";
import { Loader } from "@ui-kit/Loader";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface BranchActionsProps {
	show: boolean;
	tabWrapperRef: RefObject<HTMLDivElement>;
	currentBranch: string;
	isInitNewBranch: boolean;
	setIsInitNewBranch: (isInitNewBranch: boolean) => void;
	setShow: (show: boolean) => void;
	setContentHeight?: (height: number) => void;
	allowAddNewBranch?: boolean;
	allowBranchActions?: boolean;
	onSwitchBranch?: (isNewBranchCreated: boolean) => void;
	onMergeRequestCreate?: () => void;
}

const getBranchListItems = (
	disableBranchesSameAsHead: boolean,
	branches: ClientGitBranchData[],
	currentBranch: string,
	refreshList: () => void,
	canSwitchBranch: (branchName: string) => boolean,
	switchBranch: (branchName: string) => void,
	allowBranchActions: boolean,
	onMergeRequestCreate?: () => void,
) => {
	return branches.map((b) => {
		const disable = disableBranchesSameAsHead ? b.branchHashSameAsHead : false;

		return (
			<BranchItem
				branchStatus={b.remoteName ? BranchStatusEnum.Remote : BranchStatusEnum.Local}
				canSwitchBranch={canSwitchBranch}
				currentBranchName={currentBranch}
				data={{
					lastCommitAuthor: b.lastCommitAuthor,
					lastCommitModify: b.lastCommitModify,
					lastCommitAuthorMail: b.lastCommitAuthorMail,
				}}
				disable={disable}
				isLocal={!b.remoteName}
				key={b.name}
				mergeRequest={b.mergeRequest}
				onMergeRequestCreate={onMergeRequestCreate}
				refreshList={refreshList}
				showBranchMenu={allowBranchActions}
				switchBranch={switchBranch}
				title={b.name}
			/>
		);
	});
};

const BranchActions = (props: BranchActionsProps) => {
	const {
		currentBranch,
		show,
		setShow,
		allowAddNewBranch = false,
		tabWrapperRef,
		onSwitchBranch,
		onMergeRequestCreate,
		setContentHeight,
		isInitNewBranch,
		setIsInitNewBranch,
		allowBranchActions = true,
	} = props;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();

	const [initNewBranchName, setInitNewBranchName] = useState("");
	const [isInitNewBranchNameExist, setIsInitNewBranchNameExist] = useState(false);

	const [apiProcess, setApiProcess] = useState(false);
	const initNewBranchInputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const [allBranches, setAllBranches] = useState<ClientGitBranchData[]>([]);
	const [branches, setBranches] = useState<ClientGitBranchData[]>([]);
	const [newBranches, setNewBranches] = useState<ClientGitBranchData[]>([]);

	const [searchValue, setSearchValue] = useState("");
	const [isLoadingData, setIsLoadingData] = useState(false);
	const [isLoadingSearch, setIsLoadingSearch] = useState(false);

	const [newBranchValidationError, setNewBranchValidationError] = useState<string>("");
	const mergeData = useRef<MergeData>({ ok: true });

	const canInitNewBranch =
		isInitNewBranch && initNewBranchName && !isInitNewBranchNameExist && !apiProcess && !newBranchValidationError;

	const getNewBranches = useCallback(async () => {
		setIsLoadingData(true);

		const getBranchUrl = apiUrlCreator.getVersionControlResetBranchesUrl();
		const response = await FetchService.fetch<ClientGitBranchData[]>(getBranchUrl);

		if (!response.ok) {
			setShow(false);
			return;
		}

		const a = await response.json();
		setNewBranches(a);
		setIsLoadingData(false);
	}, [apiUrlCreator, setShow]);

	const validateBranchName = useCallback(
		(value: string): string => {
			const branchExists = [currentBranch, ...branches.map((otherBranch) => otherBranch.name)];
			const errorResult = validateBranchError(value, branchExists);
			const str = getNewBranchNameErrorLocalization(errorResult);

			return str;
		},
		[currentBranch, branches],
	);

	const switchBranch = useCallback(
		async (branchName: string) => {
			if (!branchName) return;
			const newBranchUrl = apiUrlCreator.getVersionControlCheckoutBranchUrl(branchName);

			setApiProcess(true);

			const response = await FetchService.fetch(newBranchUrl);
			if (!response.ok) {
				setApiProcess(false);
				return;
			}

			const newPathname = await response.text();
			router.pushPath(newPathname);

			onSwitchBranch?.(false);
			setIsInitNewBranch(false);
			await getNewBranches();
			setApiProcess(false);

			const mergeDataRes = await FetchService.fetch<MergeData>(apiUrlCreator.getMergeData());
			if (mergeDataRes.ok) tryOpenMergeConflict({ mergeData: await mergeDataRes.json() });
		},
		[onSwitchBranch, apiUrlCreator, getNewBranches, router, setIsInitNewBranch],
	);

	const initNewBranch = useCallback(
		async (branchName: string) => {
			const initNewBranchUrl = apiUrlCreator.getVersionControlCreateNewBranchUrl(branchName);
			setApiProcess(true);

			const response = await FetchService.fetch(initNewBranchUrl);
			if (!response.ok) {
				setApiProcess(false);
				return;
			}

			onSwitchBranch?.(true);
			setIsInitNewBranch(false);
			await getNewBranches();
			setApiProcess(false);
		},
		[onSwitchBranch, apiUrlCreator, getNewBranches, setIsInitNewBranch],
	);

	const canSwitchBranch = useCallback(
		(branchName: string) => {
			return !isInitNewBranch && branchName && !isInitNewBranch && currentBranch !== branchName && !apiProcess;
		},
		[isInitNewBranch, currentBranch, apiProcess],
	);

	const items = useMemo(
		() =>
			getBranchListItems(
				false,
				branches,
				currentBranch,
				getNewBranches,
				canSwitchBranch,
				switchBranch,
				allowBranchActions,
				onMergeRequestCreate,
			),
		[
			branches,
			currentBranch,
			switchBranch,
			getNewBranches,
			onMergeRequestCreate,
			canSwitchBranch,
			allowBranchActions,
		],
	);

	useEffect(() => {
		setIsInitNewBranchNameExist(
			[currentBranch, ...branches.map((otherBranch) => otherBranch.name)].includes(initNewBranchName),
		);
	}, [initNewBranchName, currentBranch, branches]);

	useEffect(() => {
		if (isInitNewBranch) initNewBranchInputRef.current?.focus();
	}, [isInitNewBranch]);

	const areNewBranchesLoading = newBranches.length === 0;

	useEffect(() => {
		if (areNewBranchesLoading) return;
		if (isInitNewBranch) initNewBranchInputRef.current?.focus();
	}, [areNewBranchesLoading, isInitNewBranch]);

	useEffect(() => {
		if (!newBranches) return;
		if (!newBranches.length) return;
		const branches = newBranches.filter((b) => b.name !== currentBranch);
		setAllBranches(branches);
		setBranches(branches);
	}, [newBranches, currentBranch]);

	useEffect(() => {
		if (!containerRef.current || !tabWrapperRef.current || !show || searchValue.length || isLoadingSearch) return;
		const mainElement = tabWrapperRef.current;
		const firstChild = containerRef.current.firstElementChild as HTMLElement;
		const isSpinner = firstChild.dataset.qa === "loader";

		if (!mainElement && !isSpinner) return;
		setContentHeight(calculateTabWrapperHeight(mainElement));
	}, [
		containerRef.current,
		apiProcess,
		items,
		tabWrapperRef.current,
		isInitNewBranch,
		searchValue,
		isLoadingSearch,
		setContentHeight,
	]);

	const modalOnCloseHandler = useCallback(() => {
		setIsInitNewBranch(false);
		setIsInitNewBranch(false);
		setNewBranches([]);
		setApiProcess(false);
		setInitNewBranchName("");
		setNewBranchValidationError(null);
		setContentHeight(undefined);
		setSearchValue("");
		setBranches(allBranches);

		if (!mergeData.current.ok) tryOpenMergeConflict({ mergeData: { ...mergeData.current } });

		mergeData.current = { ok: true };
	}, [allBranches, setContentHeight, setIsInitNewBranch]);

	const modalOnOpenHandler = useCallback(() => {
		void getNewBranches();
	}, [getNewBranches]);

	useEffect(() => {
		if (show) modalOnOpenHandler();
		else modalOnCloseHandler();
	}, [show]);

	const onSearchChange = useCallback(
		(value: string) => {
			if (!value.length) return setBranches(allBranches);
			setBranches(allBranches.filter((b) => b.name.toLowerCase().includes(value.toLowerCase())));
		},
		[allBranches],
	);

	if (apiProcess || isLoadingData)
		return <Loader className="py-6" ref={containerRef} role="progressbar" size="3xl" />;

	return (
		<div className="pt-2 text-xs" ref={containerRef}>
			<Search
				dataQa="qa-branch-search"
				isLoading={isLoadingSearch}
				onValueChange={onSearchChange}
				placeholder={t("search.name")}
				searchValue={searchValue}
				setIsLoading={setIsLoadingSearch}
				setSearchValue={setSearchValue}
			/>
			<ScrollableElement
				boxShadowStyles={{
					top: "0px 6px 5px 0px var(--color-diff-entries-shadow) inset",
					bottom: "0px -6px 5px 0px var(--color-diff-entries-shadow) inset",
				}}
				dragScrolling={false}
				style={{ maxHeight: "45vh", paddingBottom: "0.25rem" }}
			>
				{items}
			</ScrollableElement>
			{allowAddNewBranch && (
				<div
					className={classNames("init-new-branch-input flex flex-col items-end overflow-hidden px-4", {
						"h-0": !isInitNewBranch,
						"h-auto": isInitNewBranch,
					})}
				>
					<Input
						className="mt-2 mb-2 text-sm"
						dataQa="input-new-branch"
						errorText={newBranchValidationError}
						isCode
						onChange={(e) => {
							const validateBranchNameValue = validateBranchName(e.currentTarget.value);
							setNewBranchValidationError(validateBranchNameValue);
							setInitNewBranchName(e.currentTarget.value);
						}}
						placeholder={t("enter-branch-name")}
						ref={initNewBranchInputRef}
						style={{ pointerEvents: isInitNewBranch ? "auto" : "none" }}
						type="text"
					/>
					<Button
						disabled={!canInitNewBranch}
						isEmUnits
						onClick={() => initNewBranch(initNewBranchName)}
						textSize={TextSize.M}
					>
						<Icon code="plus" />
						<span>{t("add-new-branch")}</span>
					</Button>
				</div>
			)}
		</div>
	);
};

export default BranchActions;
