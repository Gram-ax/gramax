import useWatch from "@core-ui/hooks/useWatch";
import {
	ApprovalSignature,
	CreateMergeRequest,
	MergeRequestOptions,
} from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoadOptionsParams } from "@ui-kit/AsyncSearchSelect";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { CommitAuthorInfo } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { Textarea } from "@ui-kit/Textarea";
import { MultiSelect, useCache } from "@ui-kit/MultiSelect";
import { CheckboxField } from "@ui-kit/Checkbox";
import styled from "@emotion/styled";
import { Button } from "@ui-kit/Button";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import Icon from "@components/Atoms/Icon";
import AuthorInfoCodec from "@core-ui/utils/authorInfoCodec";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";

const OptionsContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5em;
`;

interface MergeRequestModalProps {
	useGesUsersSelect: boolean;
	sourceBranchRef: string;
	targetBranchRef: string;
	onSubmit: (mergeRequest: CreateMergeRequest) => void;
	onOpen?: () => void;
	onClose?: () => void;
	preventSearchAndStartLoading?: boolean;
	isLoading?: boolean;
}

type LoadApprovers = (params: LoadOptionsParams) => Promise<Array<{ value: string; label: string }>>;

const CreateMergeRequestModal = (props: MergeRequestModalProps) => {
	const {
		preventSearchAndStartLoading = false,
		sourceBranchRef,
		targetBranchRef,
		onSubmit,
		onOpen,
		isLoading = false,
		onClose,
		useGesUsersSelect,
	} = props;
	const apiUrlCreator = ApiUrlCreator.value;
	const gesUrl = PageDataContext.value.conf.enterprise.gesUrl;

	const [isOpen, setIsOpen] = useState(true);
	const [enterpriseApi] = useState(() => new EnterpriseApi(gesUrl));

	const schema = z.object({
		approvers: z.array(z.object({ label: z.string(), value: z.string() })),
		description: z.string().optional(),
		options: z
			.object({
				deleteAfterMerge: z.boolean().default(false).optional(),
				squash: z.boolean().default(false).optional(),
			})
			.optional(),
	});

	const loadApprovers: LoadApprovers = async ({ searchQuery }) => {
		const fetchAuthors = async (searchQuery: string) => {
			const url = apiUrlCreator.getGitCommitAuthors(searchQuery);
			const response = await FetchService.fetch<CommitAuthorInfo[]>(url);
			const data = await response.json();

			return data?.sort((a, b) => b.count - a.count) || [];
		};

		const users = useGesUsersSelect ? await enterpriseApi.getUsers(searchQuery) : await fetchAuthors(searchQuery);
		return users.map((user) => {
			const codec = AuthorInfoCodec.serialize({ name: user.name, email: user.email });
			return {
				value: codec,
				label: codec,
			};
		});
	};

	const { loadOptions } = useCache(loadApprovers);

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		mode: "onChange",
	});

	const formSubmit = (e) => {
		form.handleSubmit((data) => {
			onSubmit({
				targetBranchRef,
				approvers: data.approvers.map((item) => AuthorInfoCodec.deserialize(item.value) as ApprovalSignature),
				description: data.description,
				options: data.options as MergeRequestOptions,
			});
		})(e);
	};

	useWatch(() => {
		if (isOpen) onOpen?.();
		else onClose?.();
	}, [isOpen]);

	return (
		<Modal open={isOpen} onOpenChange={setIsOpen}>
			<ModalContent data-modal-root>
				<Form asChild {...form}>
					<form className="contents ui-kit" onSubmit={formSubmit}>
						<FormHeader
							icon={"git-pull-request-arrow"}
							title={t("git.merge-requests.create")}
							description={
								<div className="flex items-center gap-1">
									<span>{t("git.merge.branches")}</span>
									<FormattedBranch name={sourceBranchRef} />
									<span>
										<Icon code="arrow-right" />
									</span>
									<FormattedBranch name={targetBranchRef} />
								</div>
							}
						/>
						<ModalBody>
							<FormStack>
								<FormField
									name="approvers"
									required
									title={t("git.merge-requests.approvers")}
									control={({ field }) => (
										<MultiSelect
											{...field}
											placeholder={`${t("select2")} ${t("git.merge-requests.approvers2")}`}
											loadMode={preventSearchAndStartLoading ? "input" : "auto"}
											minInputLength={preventSearchAndStartLoading ? 0 : 3}
											loadOptions={loadOptions}
											invalid={!!form.formState.errors?.approvers}
										/>
									)}
									labelClassName={"w-44"}
								/>
								<FormField
									name="description"
									title={t("description")}
									control={({ field }) => (
										<Textarea
											{...field}
											rows={5}
											placeholder={`${t("write")} ${t("description").toLowerCase()}`}
										/>
									)}
								/>
								<FormField
									name="options"
									title={t("other")}
									control={({ field }) => (
										<OptionsContainer>
											<CheckboxField
												checked={field.value?.deleteAfterMerge}
												onCheckedChange={(value) =>
													field.onChange({ ...field.value, deleteAfterMerge: value })
												}
												label={t("git.merge.delete-branch-after-merge")}
											/>
											<CheckboxField
												checked={field.value?.squash}
												description={t("git.merge.squash-tooltip")}
												onCheckedChange={(value) =>
													field.onChange({ ...field.value, squash: value })
												}
												label={t("git.merge.squash")}
											/>
										</OptionsContainer>
									)}
								/>
							</FormStack>
						</ModalBody>
						<FormFooter
							primaryButton={
								<Button disabled={isLoading} type="submit">
									{isLoading && <SpinnerLoader width={16} height={16} />}
									{isLoading ? t("loading") : t("git.merge-requests.create-request")}
								</Button>
							}
						/>
					</form>
				</Form>
			</ModalContent>
		</Modal>
	);
};

export default CreateMergeRequestModal;
