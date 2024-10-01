import Button from "@components/Atoms/Button/Button";
import Input from "@components/Atoms/Input";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { ButtonItem, ListItem } from "@components/List/Item";
import ListLayout from "@components/List/ListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import AddNewBranchListItem from "@ext/git/actions/Branch/components/AddNewBranchListItem";
import DisableTooltipContent from "@ext/git/actions/Branch/components/DisableTooltipContent";
import GitDateSideBar from "@ext/git/actions/Branch/components/GitDateSideBar";
import MergeBranches from "@ext/git/actions/Branch/components/MergeBranches";
import getNewBranchNameErrorLocalization from "@ext/git/actions/Branch/components/logic/getNewBranchNameErrorLocalization";
import validateBranchError from "@ext/git/actions/Branch/components/logic/validateBranchError";
import ClientGitBranchData from "@ext/git/actions/Branch/model/ClientGitBranchData";
import type MergeConflictConfirm from "@ext/git/actions/MergeConflictHandler/components/MergeConflictConfirm";
import type MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import t from "@ext/localization/locale/translate";
import { useEffect, useRef, useState, type ComponentProps } from "react";

interface BranchActionsProps {
	currentBranch: string;
	trigger: JSX.Element;
	onNewBranch?: () => void;
	onStopMerge?: (haveConflict: boolean) => void;
}

const BranchActions = (props: BranchActionsProps) => {
	const { currentBranch, trigger, onNewBranch = () => {}, onStopMerge = () => {} } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const readOnly = PageDataContextService.value.conf.isReadOnly;
	const addNewBranchText = t("add-new-branch");

	const [displayedBranch, setDisplayedBranch] = useState("");
	const [isOpen, setIsOpen] = useState(false);

	const [initNewBranchName, setInitNewBranchName] = useState("");
	const [isInitNewBranch, setIsInitNewBranch] = useState(false);
	const [isInitNewBranchNameExist, setIsInitNewBranchNameExist] = useState(false);
	const [apiProcess, setApiProcess] = useState(false);
	const initNewBranchInputRef = useRef<HTMLInputElement>(null);

	const [isNewBranch, setIsNewBranch] = useState(false);
	const [branches, setBranches] = useState<ClientGitBranchData[]>([]);

	const [newBranches, setNewBranches] = useState<ClientGitBranchData[]>([]);

	const [branchToMergeInTo, setBranchToMergeInTo] = useState<string>(null);
	const [deleteAfterMerge, setDeleteAfterMerge] = useState<boolean>(null);
	const [canMerge, setCanMerge] = useState<boolean>(null);
	const [isLoadingData, setIsLoadingData] = useState(false);

	const [newBranchValidationError, setNewBranchValidationError] = useState<string>("");

	const mergeData = useRef<MergeData>({ ok: true });

	const canInitNewBranch =
		isInitNewBranch &&
		!isNewBranch &&
		initNewBranchName &&
		!isInitNewBranchNameExist &&
		!apiProcess &&
		!newBranchValidationError;

	const canSwitchBranch =
		!isInitNewBranch && displayedBranch && !isNewBranch && currentBranch !== displayedBranch && !apiProcess;

	const getNewBranches = async () => {
		setIsLoadingData(true);
		const getBranchUrl = apiUrlCreator.getVersionControlResetBranchesUrl();
		const response = await FetchService.fetch<ClientGitBranchData[]>(getBranchUrl);
		if (!response.ok) {
			setIsOpen(false);
			return;
		}
		const a = await response.json();
		setNewBranches(a);
		setIsLoadingData(false);
	};

	const validateBranchName = (value: string): string => {
		const branchExists = [currentBranch, ...branches.map((otherBranch) => otherBranch.name)];
		const errorResult = validateBranchError(value, branchExists);
		const str = getNewBranchNameErrorLocalization(errorResult);

		return str;
	};

	const switchBranch = async () => {
		if (!displayedBranch) return;
		const newBranchUrl = apiUrlCreator.getVersionControlCheckoutBranchUrl(displayedBranch);
		setApiProcess(true);
		const response = await FetchService.fetch(newBranchUrl);
		if (!response.ok) {
			setIsOpen(false);
			setApiProcess(false);
			return;
		}
		onNewBranch();
		setIsNewBranch(true);
		setIsOpen(false);
		setApiProcess(false);
	};

	const initNewBranch = async () => {
		const initNewBranchUrl = apiUrlCreator.getVersionControlCreateNewBranchUrl(initNewBranchName);
		setApiProcess(true);
		const response = await FetchService.fetch(initNewBranchUrl);
		if (!response.ok) {
			setApiProcess(false);
			return;
		}
		onNewBranch();
		setIsNewBranch(true);
		setIsOpen(false);
		setApiProcess(false);
	};

	const mergeBranches = async () => {
		const mergeIntoUrl = apiUrlCreator.mergeInto(branchToMergeInTo, deleteAfterMerge);
		setApiProcess(true);
		const res = await FetchService.fetch<MergeData>(mergeIntoUrl);
		setApiProcess(false);
		if (!res.ok) return setIsOpen(false);

		mergeData.current = await res.json();
		onStopMerge(!mergeData.current.ok);
		setIsOpen(false);
	};

	const onCmdEnter = async () => {
		let action: () => Promise<void>;
		if (canInitNewBranch) action = initNewBranch;
		else if (canSwitchBranch) action = switchBranch;
		if (!action && canMerge) action = mergeBranches;
		if (!action) return;
		if ((canInitNewBranch || canSwitchBranch) && canMerge) return;
		await action();
	};

	useEffect(() => {
		setIsInitNewBranchNameExist(
			[currentBranch, ...branches.map((otherBranch) => otherBranch.name)].includes(initNewBranchName),
		);
	}, [initNewBranchName]);

	useEffect(() => {
		if (isInitNewBranch) initNewBranchInputRef.current.focus();
	}, [isInitNewBranch]);

	const areNewBranchesLoading = newBranches.length === 0;

	useEffect(() => {
		if (areNewBranchesLoading) return;
		if (isInitNewBranch) initNewBranchInputRef.current?.focus();
	}, [areNewBranchesLoading]);

	useEffect(() => {
		if (!newBranches) return;
		setBranches(newBranches.filter((b) => b.name != currentBranch));
	}, [newBranches]);

	const addNewBranchListItem: ButtonItem[] = !readOnly
		? [
				{
					element: <AddNewBranchListItem addNewBranchText={addNewBranchText} />,
					labelField: addNewBranchText,
					onClick: () => {
						setIsInitNewBranch(true);
					},
				},
		  ]
		: undefined;

	const getBranchListItems = (disableBranchesSameAsHead: boolean): ListItem[] => [
		...branches.map((b): ListItem => {
			const disable = disableBranchesSameAsHead ? b.branchHashSameAsHead : false;
			return {
				element: (
					<GitDateSideBar
						title={b.name}
						iconCode={b.remoteName ? "cloud" : "monitor"}
						tooltipContent={b.remoteName ? t("remote") : t("local")}
						data={{ lastCommitAuthor: b.lastCommitAuthor, lastCommitModify: b.lastCommitModify }}
						disable={disable}
					/>
				),
				labelField: b.name,
				disable,
				tooltipDisabledContent: <DisableTooltipContent branch={currentBranch} />,
			};
		}),
	];

	const modalOnCloseHandler = () => {
		setIsInitNewBranch(false);
		setDisplayedBranch("");
		setIsNewBranch(false);
		setNewBranches([]);
		setApiProcess(false);
		setIsOpen(false);
		setInitNewBranchName("");
		setNewBranchValidationError(null);

		if (!mergeData.current.ok)
			ModalToOpenService.setValue<ComponentProps<typeof MergeConflictConfirm>>(ModalToOpen.MergeConfirm, {
				mergeData: { ...mergeData.current },
			});

		mergeData.current = { ok: true };
	};

	const modalOnOpenHandler = () => {
		setIsOpen(true);
		void getNewBranches();
	};

	if (apiProcess) {
		return (
			<ModalLayout
				trigger={trigger}
				isOpen={isOpen}
				onOpen={modalOnOpenHandler}
				onClose={modalOnCloseHandler}
				onCmdEnter={onCmdEnter}
				setGlobalsStyles
			>
				<ModalLayoutLight>
					<FormStyle>
						<>
							<legend>{t("loading2")}</legend>
							<SpinnerLoader fullScreen />
						</>
					</FormStyle>
				</ModalLayoutLight>
			</ModalLayout>
		);
	}

	return (
		<ModalLayout
			trigger={trigger}
			isOpen={isOpen}
			onOpen={modalOnOpenHandler}
			onClose={modalOnCloseHandler}
			onCmdEnter={onCmdEnter}
			setGlobalsStyles
		>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>{t("change-branch")}</legend>
						<fieldset>
							<div className="form-group field field-string">
								<ListLayout
									openByDefault
									selectAllOnFocus
									isLoadingData={isLoadingData}
									onSearchChange={() => {
										setIsInitNewBranch(false);
										setDisplayedBranch("");
									}}
									onSearchClick={() => {
										if (isInitNewBranch) setIsInitNewBranch(false);
									}}
									item={isInitNewBranch ? t("add-new-branch") : undefined}
									buttons={addNewBranchListItem}
									items={getBranchListItems(false)}
									onItemClick={(elem) => {
										setDisplayedBranch(elem ?? currentBranch);
									}}
									placeholder={t("find-branch")}
								/>
							</div>
							{isInitNewBranch && (
								<div className="init-new-branch-input form-group">
									<Input
										isCode
										errorText={newBranchValidationError}
										type="text"
										ref={initNewBranchInputRef}
										style={{ pointerEvents: isNewBranch ? "none" : "auto" }}
										placeholder={t("enter-branch-name")}
										onChange={(e) => {
											const validateBranchNameValue = validateBranchName(e.currentTarget.value);
											setNewBranchValidationError(validateBranchNameValue);
											setInitNewBranchName(e.currentTarget.value);
										}}
									/>
								</div>
							)}
							<div className="buttons">
								<Button
									disabled={isInitNewBranch ? !canInitNewBranch : !canSwitchBranch}
									onClick={isInitNewBranch ? initNewBranch : switchBranch}
								>
									{t(isInitNewBranch ? "add" : "switch")}
								</Button>
							</div>

							<IsReadOnlyHOC>
								<MergeBranches
									onClick={mergeBranches}
									onCanMergeChange={(value) => setCanMerge(value)}
									onBranchToMergeInToChange={(value) => setBranchToMergeInTo(value)}
									onDeleteAfterMergeChange={(value) => setDeleteAfterMerge(value)}
									currentBranch={currentBranch}
									isLoadingData={isLoadingData}
									branches={getBranchListItems(true)}
								/>
							</IsReadOnlyHOC>
						</fieldset>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default BranchActions;
