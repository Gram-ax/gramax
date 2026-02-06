use serde::Serialize;
use tokio::sync::mpsc::Sender;

use tracing::*;

mod elastic;
mod stdout;

#[allow(unused)]
pub use elastic::*;

#[allow(unused)]
pub use stdout::*;

use crate::metrics::doc::MetricDoc;

pub trait MetricExporter<T: Serialize + Send + Sync> {
	fn send(&self, doc: T) -> impl std::future::Future<Output = anyhow::Result<()>> + Send;
}

#[derive(Debug)]
pub struct MetricExporterCollection<T: Serialize + Send + Sync> {
	exporters: Vec<AnyMetricExporter<T>>,
}

impl<T: Serialize + Send + Sync> Default for MetricExporterCollection<T> {
	fn default() -> Self {
		Self { exporters: vec![] }
	}
}

impl<T: Serialize + Send + Sync> MetricExporterCollection<T> {
	pub fn with_exporter(mut self, exporter: AnyMetricExporter<T>) -> Self {
		self.exporters.push(exporter);
		self
	}
}

impl<T: Clone + Serialize + Send + Sync + 'static> MetricExporter<T> for MetricExporterCollection<T> {
	async fn send(&self, doc: T) -> anyhow::Result<()> {
		if self.exporters.len() == 1 {
			self.exporters.first().unwrap().send(doc).await?;
			return Ok(());
		}

		for exporter in &self.exporters {
			_ = exporter.send(doc.clone()).await;
		}

		Ok(())
	}
}

#[derive(Debug)]
#[allow(unused)]
pub enum AnyMetricExporter<T: Serialize + Send + Sync> {
	ElasticSearch(elastic::ElasticSearchExporter<T>),
	Stdout(stdout::StdoutExporter<T>),
	None,
}

impl<T: Serialize + Send + Sync + 'static> MetricExporter<T> for AnyMetricExporter<T> {
	async fn send(&self, doc: T) -> anyhow::Result<()> {
		match self {
			AnyMetricExporter::ElasticSearch(exporter) => exporter.send(doc).await,
			AnyMetricExporter::Stdout(exporter) => exporter.send(doc).await,
			AnyMetricExporter::None => Ok(()),
		}
	}
}

#[derive(Clone)]
pub struct MetricSender<T: Serialize + Send + Sync + Clone = MetricDoc> {
	tx: Sender<T>,
}

impl<T: Serialize + Send + Sync + Clone + 'static> MetricSender<T> {
	pub fn new(exporter: MetricExporterCollection<T>) -> Self {
		let (tx, mut rx) = tokio::sync::mpsc::channel(100);

		tokio::spawn(async move {
			while let Some(doc) = rx.recv().await {
				_ = exporter.send(doc).await.inspect_err(|err| error!("rx error: {:#?}", err));
			}
		});

		Self { tx }
	}
}

impl<T: Serialize + Send + Sync + Clone> MetricExporter<T> for MetricSender<T> {
	async fn send(&self, doc: T) -> anyhow::Result<()> {
		self.tx.send(doc).await.map_err(|e| anyhow::anyhow!("failed to send metric: {:#?}", e))
	}
}
