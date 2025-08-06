use anyhow::Context;
use elasticsearch::auth::Credentials;
use elasticsearch::http::transport::Transport;
use elasticsearch::Elasticsearch;

use elasticsearch::IndexParts;
use serde::Serialize;
use tracing::*;

use crate::metrics::exporter::AnyMetricExporter;
use crate::metrics::exporter::MetricExporter;

#[derive(clap::Args, Clone, Debug)]
#[group(required = false)]
pub struct ElasticOptions {
  #[arg(long = "es-url", env = "ELASTICSEARCH_URL", requires_all = ["es_username", "es_password", "es_index"])]
  pub es_url: Option<String>,

  #[arg(long = "es-username", env = "ELASTICSEARCH_USERNAME", requires = "es_url")]
  pub es_username: Option<String>,

  #[arg(long = "es-password", env = "ELASTICSEARCH_PASSWORD")]
  pub es_password: Option<String>,

  #[arg(long = "es-index", env = "ELASTICSEARCH_INDEX")]
  pub es_index: Option<String>,
}

#[derive(Debug)]
pub struct ElasticSearchExporter<T: Serialize + Send + Sync> {
  es_client: Elasticsearch,
  es_index: String,
  _marker: std::marker::PhantomData<T>,
}

impl<T: Serialize + Send + Sync> ElasticSearchExporter<T> {
  pub async fn new(opts: ElasticOptions) -> anyhow::Result<Self> {
    let transport = Transport::single_node(&opts.es_url.unwrap())?;
    transport.set_auth(Credentials::Basic(opts.es_username.unwrap(), opts.es_password.unwrap()));
    let es_client = Elasticsearch::new(transport);

    let es_index = opts.es_index.unwrap();
    let ping = es_client.ping().send().await?;

    ping.error_for_status_code().context("failed to ping elasticsearch")?;
    info!("elasticsearch ready; using index {es_index}");

    Ok(ElasticSearchExporter { es_client, es_index, _marker: std::marker::PhantomData })
  }
}

impl<T: Serialize + Send + Sync> AnyMetricExporter<T> {
  pub async fn elasticsearch(opts: ElasticOptions) -> Self {
    Self::ElasticSearch(ElasticSearchExporter::new(opts).await.unwrap())
  }
}

impl<T: Serialize + Send + Sync> MetricExporter<T> for ElasticSearchExporter<T> {
  async fn send(&self, doc: T) -> anyhow::Result<()> {
    let res = self.es_client.index(IndexParts::Index(&self.es_index)).body(doc).send().await?;
    res.error_for_status_code().context("failed to send metric to elasticsearch")?;
    Ok(())
  }
}
