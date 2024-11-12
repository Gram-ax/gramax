import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";

const root = new Path([__dirname, "__test"]);

describe("MountFileProvider", () => {
	beforeAll(async () => {
		await new DiskFileProvider(root).delete(Path.empty);
	});

	afterAll(async () => {
		await new DiskFileProvider(root).delete(Path.empty);
	});

	test("может смаунтить несколько FileProvider и выбрасывает ошибку, если не добавлено ни одного FileProvider", async () => {
		const fp1 = new DiskFileProvider(Path.empty);
		const fp2 = new DiskFileProvider(Path.empty);
		const mount = new MountFileProvider(root);

		await expect(async () => await mount.readdir(Path.empty)).rejects.toThrow("Root mount not found");

		mount.mount(Path.empty, fp1);
		await mount.createRootPathIfNeed();
		await expect(mount.readdir(Path.empty)).resolves.toEqual([]);

		mount.mount(new Path("test"), fp2);

		expect(mount.getItemRef(Path.empty).storageId).not.toEqual(mount.getItemRef(new Path("test")).storageId);
	});

	test("может анмаунтить FileProvider", () => {
		const fp1 = new DiskFileProvider(Path.empty);
		const fp2 = new DiskFileProvider(Path.empty);
		const mount = new MountFileProvider(root);

		mount.mount(Path.empty, fp1);
		mount.mount(new Path("test"), fp2);

		expect(mount.getItemRef(Path.empty).storageId).not.toEqual(mount.getItemRef(new Path("test")).storageId);

		mount.unmount(new Path("test"));
		expect(mount.getItemRef(Path.empty).storageId).toEqual(mount.getItemRef(new Path("test")).storageId);
	});
});
