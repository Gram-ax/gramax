import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import useWatch from "@core-ui/hooks/useWatch";
import AuthorInfoCodec from "@core-ui/utils/authorInfoCodec";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import SelectGES from "@ext/git/actions/Branch/components/MergeRequest/SelectGES";
import SelectGitCommitAuthors from "@ext/git/actions/Branch/components/MergeRequest/SelectGitCommitAuthors";
import type {
	ApprovalSignature,
	CreateMergeRequest,
	MergeRequestOptions,
} from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { CheckboxField } from "@ui-kit/Checkbox";
import { Dialog, DialogBody, DialogContent } from "@ui-kit/Dialog";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Textarea } from "@ui-kit/Textarea";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface MergeRequestModalProps {
	useGesUsersSelect: boolean;
	isEnabledGetUsers?: boolean;
	sourceBranchRef: string;
	targetBranchRef: string;
	onSubmit: (mergeRequest: CreateMergeRequest) => void;
	onOpen?: () => void;
	onClose?: () => void;
	isLoading?: boolean;
}

const CreateMergeRequestModal = (props: MergeRequestModalProps) => {
	const {
		isEnabledGetUsers = false,
		sourceBranchRef,
		targetBranchRef,
		onSubmit,
		onOpen,
		isLoading = false,
		onClose,
		useGesUsersSelect,
	} = props;

	const [isOpen, setIsOpen] = useState(true);

	const schema = z.object({
		approvers: z
			.array(z.object({ label: z.string(), value: z.string() }), {
				message: t("must-be-not-empty"),
			})
			.min(1, { message: t("must-be-not-empty") }),
		description: z.string().optional(),
		options: z
			.object({
				deleteAfterMerge: z.boolean().default(true).optional(),
				squash: z.boolean().default(true).optional(),
			})
			.optional(),
	});

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { options: { deleteAfterMerge: true, squash: true } },
		mode: "onChange",
	});

	const formSubmit = async (e) => {
		await form.handleSubmit((data) => {
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
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogContent data-modal-root size="M">
				<Form asChild {...form}>
					<form className="contents ui-kit" onSubmit={formSubmit}>
						<FormHeader
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
							icon={"git-pull-request-arrow"}
							title={t("git.merge-requests.create")}
						/>
						<DialogBody>
							<FormStack>
								<FormField
									control={({ field }) => (
										<>
											{useGesUsersSelect ? (
												<SelectGES
													approvers={field.value}
													isEnabledGetUsers={isEnabledGetUsers}
													onChange={field.onChange}
												/>
											) : (
												<SelectGitCommitAuthors
													approvers={field.value}
													onChange={field.onChange}
													shouldFetch={isOpen}
												/>
											)}
										</>
									)}
									labelClassName={"w-44"}
									name="approvers"
									required
									title={t("git.merge-requests.approvers")}
								/>
								<FormField
									control={({ field }) => (
										<Textarea
											{...field}
											placeholder={`${t("write")} ${t("description").toLowerCase()}`}
											rows={5}
										/>
									)}
									name="description"
									title={t("description")}
								/>
								<FormField
									control={({ field }) => (
										<div className="flex flex-col gap-2">
											<CheckboxField
												checked={field.value?.deleteAfterMerge}
												label={t("git.merge.delete-branch-after-merge")}
												onCheckedChange={(value) =>
													field.onChange({ ...field.value, deleteAfterMerge: value })
												}
											/>
											<CheckboxField
												checked={field.value?.squash}
												description={t("git.merge.squash-tooltip")}
												label={t("git.merge.squash")}
												onCheckedChange={(value) =>
													field.onChange({ ...field.value, squash: value })
												}
											/>
										</div>
									)}
									labelClassName="items-start"
									name="options"
									title={t("other")}
								/>
							</FormStack>
						</DialogBody>
						<FormFooter
							primaryButton={
								<Button disabled={isLoading} type="submit">
									{isLoading && <SpinnerLoader height={16} width={16} />}
									{isLoading ? t("loading") : t("git.merge-requests.create-request")}
								</Button>
							}
						/>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default CreateMergeRequestModal;
