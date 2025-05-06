import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { InvalidSourceData } from "@ext/storage/logic/SourceDataProvider/error/InvalidSourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import SourceData from "../model/SourceData";

export type OnSourceAvailabilityChanged = (sourceData: SourceData, isValid: boolean) => void;

export type ProxiedSourceDataCtx<T extends SourceData = SourceData> = {
	[K in keyof T]: T[K];
} & SourceDataCtx<T>;

export default class SourceDataCtx<T extends SourceData = SourceData> {
	constructor(
		private readonly _sourceData: T,
		private readonly _authServiceUrl: string,
		private readonly _onAvailabilityChanged: OnSourceAvailabilityChanged,
	) {}

	static init<T extends SourceData = SourceData>(
		sourceData: SourceData,
		authServiceUrl: string,
		onAvailabilityChanged: OnSourceAvailabilityChanged,
	): ProxiedSourceDataCtx<T> {
		const inner = new SourceDataCtx(
			sourceData,
			authServiceUrl,
			onAvailabilityChanged,
		) as unknown as ProxiedSourceDataCtx<T>;

		return new Proxy(inner, {
			get: (target, prop) => {
				if (prop in target) {
					return target[prop as keyof typeof target];
				}
				if (prop in target._sourceData) {
					return target._sourceData[prop as keyof T];
				}
				return undefined;
			},
			set: (target, prop, value) => {
				if (prop in target) return false;
				target._sourceData[prop as keyof T] = value as T[keyof T];
				return true;
			},
			has: (target, prop) => {
				return prop in target || prop in target._sourceData;
			},
		});
	}

	get isValid(): boolean {
		return !(this._sourceData.isInvalid ?? false);
	}

	set isValid(value: boolean) {
		this._sourceData.isInvalid = !value;
	}

	get raw(): T {
		return this._sourceData;
	}

	async assertValid(originalError?: Error) {
		const api = makeSourceApi(this.raw, this._authServiceUrl);
		if (!api) throw originalError;

		const isValid = await api.isCredentialsValid();
		if (this.isValid !== isValid) this._onAvailabilityChanged(this.raw, isValid);

		if (!isValid) throw new InvalidSourceData(getStorageNameByData(this.raw), new Error("Invalid source data"));
		if (originalError) throw originalError;
	}
}
