use std::io::Write;

use serde::Serialize;

use crate::metrics::exporter::AnyMetricExporter;
use crate::metrics::exporter::MetricExporter;

#[derive(Debug)]
pub struct StdoutExporter<T: Serialize + Send + Sync> {
  _marker: std::marker::PhantomData<T>,
}

impl<T: Serialize + Send + Sync> StdoutExporter<T> {
  pub fn new() -> Self {
    Self { _marker: std::marker::PhantomData }
  }
}

impl<T: Serialize + Send + Sync> AnyMetricExporter<T> {
  pub fn stdout() -> Self {
    Self::Stdout(StdoutExporter::new())
  }
}

impl<T: Serialize + Send + Sync> MetricExporter<T> for StdoutExporter<T> {
  async fn send(&self, doc: T) -> anyhow::Result<()> {
    let mut stdout = std::io::stdout().lock();
    serde_json::to_writer_pretty(&mut stdout, &doc)?;
    stdout.write_all(b"\n")?;
    stdout.flush()?;
    Ok(())
  }
}
