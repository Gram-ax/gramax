pub mod branch;
pub mod clone;
pub mod diff;
pub mod merge;
pub mod remote;
pub mod stash;
pub mod status;
pub mod tags;
pub mod refs;

pub mod prelude {
  pub use crate::actions::branch::*;
  pub use crate::actions::clone::*;
  pub use crate::actions::diff::*;
  pub use crate::actions::merge::*;
  pub use crate::actions::remote::*;
  pub use crate::actions::stash::*;
  pub use crate::actions::status::*;
  pub use crate::actions::tags::*;
  pub use crate::actions::refs::*;
}
