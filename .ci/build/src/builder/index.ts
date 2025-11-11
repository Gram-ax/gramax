import { AndroidBuilder } from "./android";
import type { BuildOptions } from "./builder";
import { IosBuilder } from "./ios";
import { LinuxBuilder } from "./linux";
import { DarwinArm64Builder, DarwinX64Builder } from "./macos";
import { WebBuilder } from "./web";
import { WindowsBuilder } from "./win";

export type { BuildOptions } from "./builder";

export const web = async (opts: BuildOptions) => {
	await new WebBuilder(opts).process();
};

export const macOsArm64 = async (opts: BuildOptions) => {
	await new DarwinArm64Builder(opts).process();
};

export const macOsIntel = async (opts: BuildOptions) => {
	await new DarwinX64Builder(opts).process();
};

export const windows = async (opts: BuildOptions) => {
	await new WindowsBuilder(opts).process();
};

export const linux = async (opts: BuildOptions) => {
	await new LinuxBuilder(opts).process();
};

export const android = async (opts: BuildOptions) => {
	await new AndroidBuilder(opts).process();
};

export const ios = async (opts: BuildOptions) => {
	await new IosBuilder(opts).process();
};
