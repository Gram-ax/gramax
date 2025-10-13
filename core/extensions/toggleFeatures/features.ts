import { env, getExecutingEnvironment } from "@app/resolveModule/env";
import assert from "assert";

export enum FeatureTarget {
	none = 0,
	web = 1 << 0,
	desktop = 1 << 1,
	docportal = 1 << 2,
	static = 1 << 3,
	all = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3),
}

export const FEATURES_KEY = "enabled-features";

export type FeatureList = Record<string, Omit<Feature, "isEnabled" | "name">>;

export type DefinedFeatures = keyof typeof features;

export type Feature = {
	name: keyof typeof features;
	icon: string;
	title: {
		ru: string;
		en: string;
	};
	desc?: {
		ru: string;
		en: string;
	};
	url?: string;
	status?: "in-dev" | "experimental" | "unstable" | "beta";
	default: boolean;
	isEnabled: boolean;
	targets: FeatureTarget;
};

let cachedFeatures: Record<string, Feature> = null;

const getRawEnabledFeatures = () => {
	if (getExecutingEnvironment() == "next") return env("DOCPORTAL_FEATURES");
	return typeof window !== "undefined" ? window.localStorage?.getItem(FEATURES_KEY) : null;
};

const loadFeatures = (list?: (keyof typeof features)[]) => {
	const feats = { ...features };

	const enabledFeatures = list || getRawEnabledFeatures()?.split(",") || [];

	const availableFeatures = Object.entries(feats)
		.filter(([n, f]) => f.targets & target[getExecutingEnvironment()] && enabledFeatures.includes(n))
		.map(([name]) => name);

	const invalidFeatures = enabledFeatures.filter((feature) => !availableFeatures.includes(feature));

	if (invalidFeatures.length > 0) {
		console.warn(`invalid features provided: ${invalidFeatures.join(", ")}`);
	}

	if (availableFeatures.length > 0) {
		console.log(`enabled features: ${availableFeatures.join(", ")}`);
	}

	cachedFeatures = Object.fromEntries(
		Object.entries(feats)
			.filter(([, feature]) => feature.targets & target[getExecutingEnvironment()])
			.map(([name, feature]) => [
				name,
				{
					...feature,
					name: name as keyof typeof features,
					icon: feature.icon || "zap",
					isEnabled: feature.default !== enabledFeatures.includes(name),
				},
			]),
	);
};

export const getFeatureList = () => {
	return Object.values(cachedFeatures);
};

export const getEnabledFeatures = () => {
	return Object.values(cachedFeatures).filter((feature) => feature.isEnabled);
};

export const setFeature = (name: keyof typeof features, value: boolean) => {
	assert(getExecutingEnvironment() !== "next", "Setting feature in runtime are not supported in this environment");
	assert(cachedFeatures[name], `Feature ${name} not found`);

	cachedFeatures[name].isEnabled = value;

	const enabledFeatureNames = Object.keys(cachedFeatures).filter(
		(featureName) => cachedFeatures[featureName].default !== cachedFeatures[featureName].isEnabled,
	);
	typeof window !== "undefined" && window.localStorage?.setItem(FEATURES_KEY, enabledFeatureNames.join(","));
};

export const setFeatureList = (enabled: (keyof typeof features)[]) => {
	assert(getExecutingEnvironment() === "next", "Supported only in next environment");
	loadFeatures(enabled);
};

const target: Record<ReturnType<typeof getExecutingEnvironment>, FeatureTarget> = {
	browser: FeatureTarget.web,
	tauri: FeatureTarget.desktop,
	next: FeatureTarget.docportal,
	static: FeatureTarget.static,
	test: FeatureTarget.none,
	cli: FeatureTarget.none,
};

export const feature = (name: keyof typeof features): boolean => {
	return cachedFeatures[name]?.isEnabled || false;
};

export const features = {
	cloud: {
		title: {
			ru: "Облако",
			en: "Cloud",
		},
		desc: {
			ru: "Опубликуйте портал для читателей за несколько кликов",
			en: "Publish a docportal for readers in a few clicks",
		},
		url: "https://gram.ax/resources/docs/doc-portal/cloud-gramax",
		icon: "cloud",
		targets: FeatureTarget.web | FeatureTarget.desktop,
		default: false,
	},
	"filtered-catalog": {
		title: {
			ru: "Фильтрация каталога",
			en: "Filtered Catalog",
		},
		desc: {
			ru: "Создайте разные сборки документации из одного каталога",
			en: "Create a various docs builds from single catalog",
		},
		url: "https://gram.ax/resources/docs/catalog/filter",
		icon: "filter",
		targets: FeatureTarget.web | FeatureTarget.desktop | FeatureTarget.static | FeatureTarget.docportal,
		default: false,
	},
	"export-pdf": {
		title: {
			ru: "Новый экспорт в PDF",
			en: "New export to PDF",
		},
		desc: {
			ru: "Поддерживает все элементы оформления статей",
			en: "Supports all article formatting elements",
		},
		icon: "file-text",
		targets: FeatureTarget.web | FeatureTarget.desktop | FeatureTarget.static | FeatureTarget.docportal,
		default: false,
	}
} as const satisfies FeatureList;

loadFeatures();
