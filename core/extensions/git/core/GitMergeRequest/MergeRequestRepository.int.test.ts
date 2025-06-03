/**
 * @jest-environment node
 */

import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import { MergeRequest, MergeRequestOptions } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type Repository from "@ext/git/core/Repository/Repository";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import BlankWatcher from "@ext/Watchers/BlankWatcher";

const mockUserData: GitSourceData = {
	sourceType: SourceType.git,
	userEmail: "test-email@email.com",
	userName: "test user",
	domain: "localhost:8174",
	token: "test-token",
};

const path = (path: string) => new Path(path);
const repPath = (path: string) => new Path(["testRep", path]);

const dfp = new DiskFileProvider(__dirname);

let gvc: GitVersionControl;
let rep: Repository;

const mountFp = MountFileProvider.fromDefault(new Path(__dirname), new BlankWatcher());

const createMergeRequest = (
	options: MergeRequestOptions = {
		deleteAfterMerge: true,
		squash: true,
	},
): Promise<void> => {
	return rep.mergeRequests.create(mockUserData, {
		targetBranchRef: "master",
		title: "test title",
		description: "test description",
		approvers: [{ name: "test user", email: "test-email@email.com", approvedAt: new Date() }],
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
		await RepositoryProvider.resetRepo();
		await GitStorage.clone({
			source: mockUserData,
			repositoryPath: path("testRep"),
			fs: { fp: mountFp } as any,
			cancelToken: 0,
			data: {
				url: "http://localhost:8174/remoteRep.git",
			} as any,
			branch: "master",
		});

		gvc = new GitVersionControl(path("testRep"), dfp);
		const storage = new GitStorage(path("testRep"), dfp);
		rep = new WorkdirRepository(path("testRep"), dfp, gvc, storage);
		await rep.gvc.createNewBranch("feature");
		await rep.storage.push(mockUserData);
	});

	afterEach(async () => {
		await RepositoryProvider.resetRepo();
		await dfp.delete(path("testRep"));
		rep = null;
	});

	test("creates merge request", async () => {
		await rep.storage.push(mockUserData);

		await createMergeRequest();

		const mr = await rep.mergeRequests.tryGetDraft();
		clearMrDates(mr);

		expect(mr).toEqual({
			targetBranchRef: "master",
			sourceBranchRef: "feature",
			title: "test title",
			description: "test description",
			creator: { name: "test user", email: "test-email@email.com" },
			approvers: [
				{
					approvedAt: null,
					name: "test user",
					email: "test-email@email.com",
				},
			],
			createdAt: null,
			updatedAt: null,
			options: {
				deleteAfterMerge: true,
				squash: true,
			},
		} as MergeRequest);
		expect(await dfp.exists(repPath(".gramax/mr/open.yaml"))).toBeTruthy();
	});

	describe("merges merge request", () => {
		beforeEach(async () => {
			await dfp.write(repPath("feature_1"), "test");
			await rep.publish({
				commitMessage: "feature commit",
				data: mockUserData,
				filesToPublish: [path("feature_1")],
			});
		});

		test("without branch deletion", async () => {
			await createMergeRequest({ deleteAfterMerge: false, squash: true });
			await rep.publish({
				commitMessage: "mr commit",
				data: mockUserData,
				filesToPublish: [path(".gramax/mr/open.yaml")],
			});

			let mr = await rep.mergeRequests.tryGetDraft();
			expect(mr).toBeDefined();

			await rep.mergeRequests.merge(mockUserData);

			mr = await rep.mergeRequests.tryGetDraft();
			expect(mr).toBeUndefined();

			expect((await rep.gvc.getCurrentBranch()).toString()).toBe("master");
			expect(rep.gvc.getBranch("feature")).toBeDefined();
			expect(await dfp.exists(repPath(".gramax/mr/open.yaml"))).toBeFalsy();
		});

		test("with branch deletion", async () => {
			await createMergeRequest({ deleteAfterMerge: true, squash: true });
			await rep.publish({
				commitMessage: "mr commit",
				data: mockUserData,
				filesToPublish: [path(".gramax/mr/open.yaml")],
			});

			let mr = await rep.mergeRequests.tryGetDraft();
			expect(mr).toBeDefined();

			await rep.mergeRequests.merge(mockUserData);

			mr = await rep.mergeRequests.tryGetDraft();
			expect(mr).toBeUndefined();

			expect((await rep.gvc.getCurrentBranch()).toString()).toBe("master");
			await expect(rep.gvc.getBranch("feature")).rejects.toThrow(LibGit2Error);
			expect(await dfp.exists(repPath(".gramax/mr/open.yaml"))).toBeFalsy();
		});
	});

	test("throws an error if there are local changes", async () => {
		await createMergeRequest();
		await rep.publish({
			commitMessage: "mr commit",
			data: mockUserData,
			filesToPublish: [path(".gramax/mr/open.yaml")],
		});
		await dfp.write(repPath("test_file"), "test_file content");

		await expect(rep.mergeRequests.merge(mockUserData)).rejects.toThrow(DefaultError);
	});

	test("throws an error when merge merge request has conflicts", async () => {
		await gvc.checkoutToBranch("master");
		await dfp.write(repPath("conflict_file"), "change in master");
		await rep.publish({
			commitMessage: "master commit",
			data: mockUserData,
			filesToPublish: [path("conflict_file")],
		});

		await gvc.checkoutToBranch("feature");
		await dfp.write(repPath("conflict_file"), "change in feature");
		await rep.publish({
			commitMessage: "feature commit",
			data: mockUserData,
			filesToPublish: [path("conflict_file")],
		});
		await createMergeRequest();
		await rep.publish({
			commitMessage: "mr commit",
			data: mockUserData,
			filesToPublish: [path(".gramax/mr/open.yaml")],
		});

		expect((await rep.status(false)).length).toBe(0);

		await expect(rep.mergeRequests.merge(mockUserData)).rejects.toThrow(DefaultError);

		expect(await dfp.exists(repPath(".gramax/mr/open.yaml"))).toBeTruthy();
		expect((await rep.status(false)).length).toBe(0);
		expect(await dfp.exists(repPath(".gramax/mr/archive"))).toBeFalsy();
	});
});
