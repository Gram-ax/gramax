use gramaxgit::commands as git;
use gramaxgit::prelude::CloneOptions;

use napi::bindgen_prelude::AsyncTask;
use napi::threadsafe_function::*;
use napi::Env;
use napi::JsFunction;
use napi::JsNull;
use napi::Task;

use crate::AccessTokenCreds;
use crate::JsonExt;

#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct RawCloneOptions {
  pub branch: Option<String>,
  pub depth: Option<i32>,
  pub url: String,
  pub to: String,
  pub is_bare: bool,
  pub cancel_token: i32,
}

impl From<RawCloneOptions> for CloneOptions {
  fn from(val: RawCloneOptions) -> Self {
    gramaxgit::actions::clone::CloneOptions {
      branch: val.branch,
      depth: val.depth,
      url: val.url,
      to: val.to.into(),
      is_bare: val.is_bare,
      cancel_token: val.cancel_token as usize,
    }
  }
}

pub struct CloneTask {
  creds: AccessTokenCreds,
  opts: RawCloneOptions,
  callback: ThreadsafeFunction<String, ErrorStrategy::CalleeHandled>,
}

impl CloneTask {
  pub fn create_task(
    creds: AccessTokenCreds,
    opts: RawCloneOptions,
    callback: JsFunction,
  ) -> Result<AsyncTask<CloneTask>, napi::Error> {
    let tsfn_callback: ThreadsafeFunction<String, ErrorStrategy::CalleeHandled> = callback
      .create_threadsafe_function(4, |ctx: ThreadSafeCallContext<String>| {
        Ok(vec![ctx.env.create_string(ctx.value.as_str())?])
      })?;


    Ok(AsyncTask::new(CloneTask { creds, opts, callback: tsfn_callback }))
  }
}

impl Task for CloneTask {
  type Output = ();
  type JsValue = JsNull;

  fn compute(&mut self) -> napi::Result<Self::Output> {
    git::clone(
      self.creds.clone().into(),
      self.opts.clone().into(),
      Box::new(|val| {
        if let Ok(val) = serde_json::to_string(&val) {
          self.callback.call(Ok(val), ThreadsafeFunctionCallMode::Blocking);
        }
      }),
    )
    .json()?;

    Ok(())
  }

  fn resolve(&mut self, env: Env, _: Self::Output) -> napi::Result<Self::JsValue> {
    env.get_null()
  }

  fn reject(&mut self, _: Env, error: napi::Error) -> napi::Result<Self::JsValue> {
    Err(error)
  }
}
