import Button, { TextSize } from "@components/Atoms/Button/Button";
import Icon from "@components/Atoms/Icon";
import Input from "@components/Atoms/Input";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import ScrollableElement from "@components/Layouts/ScrollableElement";
import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import { classNames } from "@components/libs/classNames";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import BranchItem from "@ext/git/actions/Branch/components/BranchItem";
import { BranchStatusEnum } from "@ext/git/actions/Branch/components/BranchStatus";
import getNewBranchNameErrorLocalization from "@ext/git/actions/Branch/components/logic/getNewBranchNameErrorLocalization";
import validateBranchError from "@ext/git/actions/Branch/components/logic/validateBranchError";
import Search from "@ext/git/actions/Branch/components/Search";
import ClientGitBranchData from "@ext/git/actions/Branch/model/ClientGitBranchData";
import tryOpenMergeConflict from "@ext/git/actions/MergeConflictHandler/logic/tryOpenMergeConflict";
import type MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import t from "@ext/localization/locale/translate";
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

const BranchActionsWrapper = styled.div`
	padding-top: 0.52em;
	> div {
		font-size: 12px !important;
	}
`;

const NewBranchInputWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: end;
	height: 0;
	overflow: hidden;
	padding-left: 1rem;
	padding-right: 1rem;

	> div:first-of-type {
		margin-top: 0.5em;
		margin-bottom: 0.5em;
		font-size: 0.9em;
	}

	&.active {
		height: auto;
	}
`;

interface BranchActionsProps {
	show: boolean;
	tabWrapperRef: RefObject<HTMLDivElement>;
	currentBranch: string;
	isInitNewBranch: boolean;
	setIsInitNewBranch: (isInitNewBranch: boolean) => void;
	setShow: (show: boolean) => void;
	setContentHeight?: (height: number) => void;
	canEditCatalog?: boolean;
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
	onMergeRequestCreate?: () => void,
) => {
	return branches.map((b) => {
		const disable = disableBranchesSameAsHead ? b.branchHashSameAsHead : false;

		return (
			<BranchItem
				key={b.name}
				currentBranchName={currentBranch}
				isLocal={!b.remoteName}
				mergeRequest={b.mergeRequest}
				title={b.name}
				branchStatus={b.remoteName ? BranchStatusEnum.Remote : BranchStatusEnum.Local}
				data={{
					lastCommitAuthor: b.lastCommitAuthor,
					lastCommitModify: b.lastCommitModify,
					lastCommitAuthorMail: b.lastCommitAuthorMail,
				}}
				disable={disable}
				showBranchMenu
				refreshList={refreshList}
				onMergeRequestCreate={onMergeRequestCreate}
				switchBranch={switchBranch}
				canSwitchBranch={canSwitchBranch}
			/>
		);
	});
};

const BranchActions = (props: BranchActionsProps) => {
	const {
		currentBranch,
		show,
		setShow,
		canEditCatalog = false,
		tabWrapperRef,
		onSwitchBranch,
		onMergeRequestCreate,
		setContentHeight,
		isInitNewBranch,
		setIsInitNewBranch,
	} = props;
	const apiUrlCreator = ApiUrlCreatorService.value;

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
	}, [apiUrlCreator]);

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

			onSwitchBranch?.(false);
			setIsInitNewBranch(false);
			await getNewBranches();
			setApiProcess(false);
		},
		[onSwitchBranch, apiUrlCreator, getNewBranches],
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
		[onSwitchBranch, apiUrlCreator, getNewBranches],
	);

	const canSwitchBranch = (branchName: string) => {
		return !isInitNewBranch && branchName && !isInitNewBranch && currentBranch !== branchName && !apiProcess;
	};

	const items = useMemo(
		() =>
			getBranchListItems(
				false,
				branches,
				currentBranch,
				getNewBranches,
				canSwitchBranch,
				switchBranch,
				onMergeRequestCreate,
			),
		[branches, currentBranch, switchBranch, canSwitchBranch, getNewBranches],
	);

	useEffect(() => {
		setIsInitNewBranchNameExist(
			[currentBranch, ...branches.map((otherBranch) => otherBranch.name)].includes(initNewBranchName),
		);
	}, [initNewBranchName]);

	useEffect(() => {
		if (isInitNewBranch) initNewBranchInputRef.current?.focus();
	}, [isInitNewBranch]);

	const areNewBranchesLoading = newBranches.length === 0;

	useEffect(() => {
		if (areNewBranchesLoading) return;
		if (isInitNewBranch) initNewBranchInputRef.current?.focus();
	}, [areNewBranchesLoading]);

	useEffect(() => {
		if (!newBranches) return;
		if (!newBranches.length) return;
		const branches = newBranches.filter((b) => b.name != currentBranch);
		setAllBranches(branches);
		setBranches(branches);
	}, [newBranches]);

	useEffect(() => {
		if (!containerRef.current || !tabWrapperRef.current || !show || searchValue.length || isLoadingSearch) return;
		const mainElement = tabWrapperRef.current;
		const firstChild = containerRef.current.firstElementChild as HTMLElement;
		const isSpinner = firstChild.dataset.qa === "loader";

		if (!mainElement && !isSpinner) return;
		setContentHeight(calculateTabWrapperHeight(mainElement));
	}, [containerRef.current, apiProcess, items, tabWrapperRef.current, isInitNewBranch, searchValue, isLoadingSearch]);

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
	}, []);

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

	if (apiProcess || isLoadingData) return <SpinnerLoader ref={containerRef} fullScreen />;

	return (
		<BranchActionsWrapper ref={containerRef}>
			<Search
				dataQa="qa-branch-search"
				placeholder={t("search.name")}
				onValueChange={onSearchChange}
				searchValue={searchValue}
				setSearchValue={setSearchValue}
				isLoading={isLoadingSearch}
				setIsLoading={setIsLoadingSearch}
			/>
			<ScrollableElement
				dragScrolling={false}
				style={{ maxHeight: "45vh" }}
				boxShadowStyles={{
					top: "0px 6px 5px 0px var(--color-diff-entries-shadow) inset",
					bottom: "0px -6px 5px 0px var(--color-diff-entries-shadow) inset",
				}}
			>
				{items}
			</ScrollableElement>
			{canEditCatalog && (
				<NewBranchInputWrapper className={classNames("init-new-branch-input", { active: isInitNewBranch })}>
					<Input
						dataQa="input-new-branch"
						isCode
						errorText={newBranchValidationError}
						type="text"
						ref={initNewBranchInputRef}
						style={{ pointerEvents: isInitNewBranch ? "auto" : "none" }}
						placeholder={t("enter-branch-name")}
						onChange={(e) => {
							const validateBranchNameValue = validateBranchName(e.currentTarget.value);
							setNewBranchValidationError(validateBranchNameValue);
							setInitNewBranchName(e.currentTarget.value);
						}}
					/>
					<Button
						isEmUnits
						textSize={TextSize.M}
						onClick={() => initNewBranch(initNewBranchName)}
						disabled={!canInitNewBranch}
					>
						<Icon code="plus" />
						<span>{t("add-new-branch")}</span>
					</Button>
				</NewBranchInputWrapper>
			)}
		</BranchActionsWrapper>
	);
};

export default BranchActions;
