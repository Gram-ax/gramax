/**
 * @jest-environment node
 */

import Path from "@core/FileProvider/Path/Path";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { MergeRequest, MergeRequestOptions } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import FileRepository from "@ext/git/core/Repository/test/utils/FileRepository";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import fs from "fs";

const path = (path: string) => new Path(path);

let rep: WorkdirRepository;
let pushMock: jest.SpyInstance;
const fr = new FileRepository(__dirname);

const createMergeRequest = (
	options: MergeRequestOptions = {
		deleteAfterMerge: true,
		squash: true,
	},
): Promise<void> => {
	return rep.mergeRequests.create(FileRepository.sourceData, {
		targetBranchRef: "master",
		title: "test title",
		description: "test description",
		approvers: [{ name: "Test User", email: "test@test.com", approvedAt: new Date() }],
		createdAt: new Date(),
		options,
	});
};

const clearMrDates = (mr: MergeRequest) => {
	mr.approvers = mr.approvers.map((approver) => ({
		...approver,
		approvedAt: null,
	}));
	mr.createdAt = null;
	mr.updatedAt = null;
};

describe("Repository", () => {
	beforeEach(async () => {
		rep = fr.create().firstInstance;
		await rep.gvc.createNewBranch("feature");
	});

	afterEach(() => {
		fr.clear();
	});

	test("creates merge request", async () => {
		await createMergeRequest();

		const mr = await rep.mergeRequests.tryGetDraft();
		clearMrDates(mr);

		expect(mr).toEqual({
			targetBranchRef: "master",
			sourceBranchRef: "feature",
			title: "test title",
			description: "test description",
			creator: { name: "Test User", email: "test@test.com" },
			approvers: [
				{
					approvedAt: null,
					name: "Test User",
					email: "test@test.com",
				},
			],
			createdAt: null,
			updatedAt: null,
			options: {
				deleteAfterMerge: true,
				squash: true,
			},
		} as MergeRequest);
		expect(fs.existsSync(fr.firstPath + "/.gramax/mr/open.yaml")).toBeTruthy();
	});

	describe("merges merge request", () => {
		beforeEach(async () => {
			fs.writeFileSync(fr.firstPath + "/feature_1", "test");
			await rep.publish({
				commitMessage: "feature commit",
				data: FileRepository.sourceData,
				filesToPublish: [path("feature_1")],
			});
		});

		test("without branch deletion", async () => {
			await createMergeRequest({ deleteAfterMerge: false, squash: true });
			await rep.publish({
				commitMessage: "mr commit",
				data: FileRepository.sourceData,
				filesToPublish: [path(".gramax/mr/open.yaml")],
			});
			const beforeMergeCommitHash = await rep.gvc.getHeadCommit();

			let mr = await rep.mergeRequests.tryGetDraft();
			expect(mr).toBeDefined();

			await rep.mergeRequests.merge(FileRepository.sourceData);

			mr = await rep.mergeRequests.tryGetDraft();
			expect(mr).toBeUndefined();

			expect((await rep.gvc.getCurrentBranch()).toString()).toBe("master");
			expect(rep.gvc.getBranch("feature")).toBeDefined();
			expect(fs.existsSync(fr.firstPath + "/.gramax/mr/open.yaml")).toBeFalsy();

			await rep.gvc.checkoutToBranch(FileRepository.sourceData, "feature");

			mr = await rep.mergeRequests.tryGetDraft();
			expect(mr).toBeUndefined();

			expect(fs.existsSync(fr.firstPath + "/.gramax/mr/open.yaml")).toBeFalsy();

			const afterMergeCommitHash = await rep.gvc.getHeadCommit();
			expect(afterMergeCommitHash.compare(beforeMergeCommitHash)).toBeFalsy();
			const parentCommitHash = await rep.gvc.getParentCommitHash(afterMergeCommitHash);
			expect(parentCommitHash.compare(beforeMergeCommitHash)).toBeTruthy();
		});

		test("with branch deletion", async () => {
			await createMergeRequest({ deleteAfterMerge: true, squash: true });
			await rep.publish({
				commitMessage: "mr commit",
				data: FileRepository.sourceData,
				filesToPublish: [path(".gramax/mr/open.yaml")],
			});

			let mr = await rep.mergeRequests.tryGetDraft();
			expect(mr).toBeDefined();

			await rep.mergeRequests.merge(FileRepository.sourceData);

			mr = await rep.mergeRequests.tryGetDraft();
			expect(mr).toBeUndefined();

			expect((await rep.gvc.getCurrentBranch()).toString()).toBe("master");
			await expect(rep.gvc.getBranch("feature")).rejects.toThrow();
			expect(fs.existsSync(fr.firstPath + "/.gramax/mr/open.yaml")).toBeFalsy();
			expect(fs.existsSync(fr.firstPath + "/.gramax/mr/archive")).toBeTruthy();
		});
	});

	describe("throws an error if there are local changes", () => {
		test("in workdir", async () => {
			await createMergeRequest();
			await rep.publish({
				commitMessage: "mr commit",
				data: FileRepository.sourceData,
				filesToPublish: [path(".gramax/mr/open.yaml")],
			});
			fs.writeFileSync(fr.firstPath + "/test_file", "test_file content");

			await expect(rep.mergeRequests.merge(FileRepository.sourceData)).rejects.toThrow(DefaultError);
		});

		test("in index", async () => {
			await createMergeRequest();
			await rep.publish({
				commitMessage: "mr commit",
				data: FileRepository.sourceData,
				filesToPublish: [path(".gramax/mr/open.yaml")],
			});
			fs.writeFileSync(fr.firstPath + "/test_file", "test_file content");
			await rep.gvc.add([path("test_file")]);

			await expect(rep.mergeRequests.merge(FileRepository.sourceData)).rejects.toThrow(DefaultError);
		});
	});

	test("throws an error when merging merge request with conflicts", async () => {
		await rep.gvc.checkoutToBranch(FileRepository.sourceData, "master");
		fs.writeFileSync(fr.firstPath + "/conflict_file", "change in master");
		await rep.publish({
			commitMessage: "master commit",
			data: FileRepository.sourceData,
			filesToPublish: [path("conflict_file")],
		});

		await rep.gvc.checkoutToBranch(FileRepository.sourceData, "feature");
		fs.writeFileSync(fr.firstPath + "/conflict_file", "change in feature");
		await rep.publish({
			commitMessage: "feature commit",
			data: FileRepository.sourceData,
			filesToPublish: [path("conflict_file")],
		});
		await createMergeRequest();
		await rep.publish({
			commitMessage: "mr commit",
			data: FileRepository.sourceData,
			filesToPublish: [path(".gramax/mr/open.yaml")],
		});

		const lastCommitOidBefore = (await rep.gvc.getCurrentBranch()).getData().lastCommitOid;

		expect((await rep.status(false)).length).toBe(0);

		let mr = await rep.mergeRequests.tryGetDraft();
		expect(mr).toBeDefined();

		await expect(rep.mergeRequests.merge(FileRepository.sourceData)).rejects.toThrow(DefaultError);

		mr = await rep.mergeRequests.tryGetDraft();
		expect(mr).toBeDefined();

		const lastCommitOidAfter = (await rep.gvc.getCurrentBranch()).getData().lastCommitOid;
		expect(lastCommitOidAfter).toBe(lastCommitOidBefore);

		expect((await rep.status(false)).length).toBe(0);

		expect(fs.existsSync(fr.firstPath + "/.gramax/mr/open.yaml")).toBeTruthy();
		expect(fs.existsSync(fr.firstPath + "/.gramax/mr/archive")).toBeFalsy();
	});

	test("restores if push fails", async () => {
		await createMergeRequest();
		await rep.publish({
			commitMessage: "mr commit",
			data: FileRepository.sourceData,
			filesToPublish: [path(".gramax/mr/open.yaml")],
		});

		let mr = await rep.mergeRequests.tryGetDraft();
		expect(mr).toBeDefined();

		const statusLengthBefore = (await rep.status(false)).length;
		const headCommitHashBefore = await rep.gvc.getHeadCommit();

		pushMock = jest.spyOn(GitStorage.prototype, "push").mockImplementation(() => {
			return Promise.reject(new Error("Test push failed"));
		});

		await expect(rep.mergeRequests.merge(FileRepository.sourceData)).rejects.toThrow(Error);

		pushMock.mockRestore();

		mr = await rep.mergeRequests.tryGetDraft();
		expect(mr).toBeDefined();

		const statusLengthAfter = (await rep.status(false)).length;
		expect(statusLengthAfter).toBe(statusLengthBefore);

		const headCommitHashAfter = await rep.gvc.getHeadCommit();
		expect(headCommitHashAfter.compare(headCommitHashBefore)).toBeTruthy();
		expect((await rep.gvc.getCurrentBranch()).getData().lastCommitOid).toBe(headCommitHashBefore.toString());

		expect(fs.existsSync(fr.firstPath + "/.gramax/mr/open.yaml")).toBeTruthy();
		expect(fs.existsSync(fr.firstPath + "/.gramax/mr/archive")).toBeFalsy();
	});
});
