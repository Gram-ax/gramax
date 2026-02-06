import { env } from "@app/resolveModule/env";
import { Kafka } from "kafkajs";
import BaseLogger from "./BaseLogger";
import type Logger from "./Logger";

const topic = "logs";
const facilityCode = 14;

const status = {
	info: "info",
	warning: "warning",
	error: "err",
};

export default class KafkaLogger extends BaseLogger implements Logger {
	kafka: Kafka;

	constructor(private _isProduction: boolean) {
		super();
		this.kafka = new Kafka({
			clientId: "docreader",
			brokers: [env("KAFKA_CONNECTION") ?? ""],
		});
	}

	async logWarning(message: string, procId?: string) {
		await this._sendMessage(message, status.warning, procId);
	}

	async logError(e: Error, procId?: string) {
		await this._sendMessage(e.message, status.error, procId);
	}

	async logInfo(message: string, procId?: string) {
		await this._sendMessage(message, status.info, procId);
	}

	async logTrace(message: string, procId?: string) {
		await this._sendMessage(message, status.info, procId);
	}

	private async _sendMessage(message: string, status: string, procId: string) {
		if (this._isProduction) {
			const producer = this.kafka.producer();
			await producer.connect();
			try {
				await producer.send({
					topic,
					messages: [
						{
							value: this._createMessage(message, status, procId),
						},
					],
				});
			} finally {
				await producer.disconnect();
			}
		}
	}

	private _createMessage = (message: string, severity: string, procId?: string): string => {
		return `syslog,appname=DocReader,facility=console,host=server,hostname=server,severity=${severity} facility_code=${facilityCode}i,message="${this._escape(
			message,
		)}",procid="${procId ?? "0"}",timestamp=${Date.now() * 1000000},version=1i`;
	};

	private _escape(s: string) {
		return s.replace("\\", "\\\\").replace('"', '\\"');
	}
}
