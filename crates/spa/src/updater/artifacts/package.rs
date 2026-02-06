use serde::Deserialize;
use serde::Serialize;

use crate::updater::artifacts::error::PackageError;

#[derive(Hash, Eq, PartialEq, Clone, Copy, Debug)]
pub enum PlatformPackage {
	WindowsX86_64Nsis,
	DarwinX86_64Dmg,
	DarwinAarch64Dmg,
	LinuxAppImage,
	LinuxDeb,
	LinuxRpm,
	AndroidApk,
	IosIpa,
}

impl PlatformPackage {
	pub const fn all() -> [PlatformPackage; 8] {
		[
			PlatformPackage::WindowsX86_64Nsis,
			PlatformPackage::DarwinX86_64Dmg,
			PlatformPackage::DarwinAarch64Dmg,
			PlatformPackage::LinuxAppImage,
			PlatformPackage::LinuxDeb,
			PlatformPackage::LinuxRpm,
			PlatformPackage::AndroidApk,
			PlatformPackage::IosIpa,
		]
	}

	pub const fn pairs() -> [(Platform, Package); 8] {
		[
			PlatformPackage::WindowsX86_64Nsis.as_pair(),
			PlatformPackage::DarwinX86_64Dmg.as_pair(),
			PlatformPackage::DarwinAarch64Dmg.as_pair(),
			PlatformPackage::LinuxAppImage.as_pair(),
			PlatformPackage::LinuxDeb.as_pair(),
			PlatformPackage::LinuxRpm.as_pair(),
			PlatformPackage::AndroidApk.as_pair(),
			PlatformPackage::IosIpa.as_pair(),
		]
	}

	pub const fn from_platform_default(platform: Platform) -> Self {
		match platform {
			Platform::WindowsX86_64 => PlatformPackage::WindowsX86_64Nsis,
			Platform::DarwinX86_64 => PlatformPackage::DarwinX86_64Dmg,
			Platform::DarwinAarch64 => PlatformPackage::DarwinAarch64Dmg,
			Platform::Linux => PlatformPackage::LinuxAppImage,
			Platform::Android => PlatformPackage::AndroidApk,
			Platform::Ios => PlatformPackage::IosIpa,
		}
	}

	pub const fn from_pair(platform: Platform, package: Package) -> Result<Self, PackageError> {
		match (platform, package) {
			(Platform::WindowsX86_64, Package::Nsis) => Ok(PlatformPackage::WindowsX86_64Nsis),
			(Platform::DarwinX86_64, Package::Dmg) => Ok(PlatformPackage::DarwinX86_64Dmg),
			(Platform::DarwinAarch64, Package::Dmg) => Ok(PlatformPackage::DarwinAarch64Dmg),
			(Platform::Linux, Package::AppImage) => Ok(PlatformPackage::LinuxAppImage),
			(Platform::Linux, Package::Deb) => Ok(PlatformPackage::LinuxDeb),
			(Platform::Linux, Package::Rpm) => Ok(PlatformPackage::LinuxRpm),
			(Platform::Android, Package::Apk) => Ok(PlatformPackage::AndroidApk),
			(Platform::Ios, Package::Ipa) => Ok(PlatformPackage::IosIpa),

			_ => Err(PackageError::InvalidPlatformPackagePair(platform, package)),
		}
	}

	pub const fn from_maybe_pair(platform: Platform, package: Option<Package>) -> Result<Self, PackageError> {
		match package {
			Some(package) => Self::from_pair(platform, package),
			None => Ok(Self::from_platform_default(platform)),
		}
	}

	pub const fn as_pair(&self) -> (Platform, Package) {
		(self.platform(), self.package())
	}

	pub const fn platform(&self) -> Platform {
		match self {
			PlatformPackage::WindowsX86_64Nsis => Platform::WindowsX86_64,
			PlatformPackage::DarwinX86_64Dmg => Platform::DarwinX86_64,
			PlatformPackage::DarwinAarch64Dmg => Platform::DarwinAarch64,
			PlatformPackage::LinuxAppImage => Platform::Linux,
			PlatformPackage::LinuxDeb => Platform::Linux,
			PlatformPackage::LinuxRpm => Platform::Linux,
			PlatformPackage::AndroidApk => Platform::Android,
			PlatformPackage::IosIpa => Platform::Ios,
		}
	}

	pub const fn package(&self) -> Package {
		match self {
			PlatformPackage::WindowsX86_64Nsis => Package::Nsis,
			PlatformPackage::DarwinX86_64Dmg => Package::Dmg,
			PlatformPackage::DarwinAarch64Dmg => Package::Dmg,
			PlatformPackage::LinuxAppImage => Package::AppImage,
			PlatformPackage::LinuxDeb => Package::Deb,
			PlatformPackage::LinuxRpm => Package::Rpm,
			PlatformPackage::AndroidApk => Package::Apk,
			PlatformPackage::IosIpa => Package::Ipa,
		}
	}

	pub const fn installer_artifact_name(&self) -> &'static str {
		match self {
			PlatformPackage::WindowsX86_64Nsis => "gramax.windows-x86_64.setup.exe",
			PlatformPackage::DarwinX86_64Dmg => "gramax.darwin-x86_64.dmg",
			PlatformPackage::DarwinAarch64Dmg => "gramax.darwin-aarch64.dmg",
			PlatformPackage::LinuxAppImage => "gramax.linux-x86_64.appimage",
			PlatformPackage::LinuxDeb => "gramax.linux-x86_64.deb",
			PlatformPackage::LinuxRpm => "gramax.linux-x86_64.rpm",
			PlatformPackage::AndroidApk => "gramax.android.apk",
			PlatformPackage::IosIpa => "gramax.ios.ipa",
		}
	}

	pub const fn update_artifact_name(&self) -> &'static str {
		match self {
			PlatformPackage::WindowsX86_64Nsis => "gramax.windows-x86_64.setup.exe",
			PlatformPackage::DarwinX86_64Dmg => "gramax.darwin-x86_64.update.tar.gz",
			PlatformPackage::DarwinAarch64Dmg => "gramax.darwin-aarch64.update.tar.gz",
			PlatformPackage::LinuxAppImage => "gramax.linux-x86_64.appimage",
			PlatformPackage::LinuxDeb => "gramax.linux-x86_64.deb",
			PlatformPackage::LinuxRpm => "gramax.linux-x86_64.rpm",
			PlatformPackage::AndroidApk => "gramax.android.apk",
			PlatformPackage::IosIpa => "gramax.ios.ipa",
		}
	}

	pub const fn signature_artifact_name(&self) -> &'static str {
		match self {
			PlatformPackage::WindowsX86_64Nsis => "gramax.windows-x86_64.setup.exe.sig",
			PlatformPackage::DarwinX86_64Dmg => "gramax.darwin-x86_64.update.tar.gz.sig",
			PlatformPackage::DarwinAarch64Dmg => "gramax.darwin-aarch64.update.tar.gz.sig",
			PlatformPackage::LinuxAppImage => "gramax.linux-x86_64.appimage.sig",
			PlatformPackage::LinuxDeb => "gramax.linux-x86_64.deb.sig",
			PlatformPackage::LinuxRpm => "gramax.linux-x86_64.rpm.sig",
			PlatformPackage::AndroidApk => "gramax.android.apk.sig",
			PlatformPackage::IosIpa => "gramax.ios.ipa.sig",
		}
	}

	pub fn filename(&self, version: &semver::Version) -> String {
		let mut version = version.clone();

		let platform = match self {
			PlatformPackage::WindowsX86_64Nsis => "win",
			PlatformPackage::DarwinX86_64Dmg => "mac-intel",
			PlatformPackage::DarwinAarch64Dmg => "mac-silicon",
			PlatformPackage::LinuxAppImage | PlatformPackage::LinuxRpm | PlatformPackage::LinuxDeb => "linux",
			PlatformPackage::AndroidApk => "android",
			PlatformPackage::IosIpa => "ios",
		};

		if let Ok(pre) = semver::Prerelease::new(&format!("{}.{}", platform, version.pre)) {
			version.pre = pre;
		}

		match self {
			PlatformPackage::WindowsX86_64Nsis => format!("Gramax.{}.setup.exe", version),
			PlatformPackage::DarwinX86_64Dmg => format!("Gramax.{}.dmg", version),
			PlatformPackage::DarwinAarch64Dmg => format!("Gramax.{}.dmg", version),
			PlatformPackage::LinuxAppImage => format!("Gramax.{}.AppImage", version),
			PlatformPackage::LinuxDeb => format!("Gramax.{}.deb", version),
			PlatformPackage::LinuxRpm => format!("Gramax.{}.rpm", version),
			PlatformPackage::AndroidApk => format!("Gramax.{}.apk", version),
			PlatformPackage::IosIpa => format!("Gramax.{}.ipa", version),
		}
	}
}

impl From<PlatformPackage> for Platform {
	fn from(val: PlatformPackage) -> Self {
		val.platform()
	}
}

impl From<PlatformPackage> for Package {
	fn from(val: PlatformPackage) -> Self {
		val.package()
	}
}

impl std::fmt::Display for PlatformPackage {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		write!(f, "{} ({})", self.platform(), self.package())
	}
}

#[derive(Serialize, Deserialize, Hash, Eq, PartialEq, Copy, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Package {
	#[serde(rename = "appimage")]
	AppImage,
	#[serde(rename = "deb")]
	Deb,
	#[serde(rename = "rpm")]
	Rpm,
	#[serde(rename = "dmg")]
	Dmg,
	#[serde(rename = "nsis")]
	Nsis,
	#[serde(rename = "apk")]
	Apk,
	#[serde(rename = "ipa")]
	Ipa,
}

impl AsRef<str> for Package {
	fn as_ref(&self) -> &str {
		match self {
			Package::AppImage => "appimage",
			Package::Deb => "deb",
			Package::Rpm => "rpm",
			Package::Dmg => "dmg",
			Package::Nsis => "nsis",
			Package::Apk => "apk",
			Package::Ipa => "ipa",
		}
	}
}

impl std::fmt::Display for Package {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		write!(f, "{}", self.as_ref())
	}
}

impl std::str::FromStr for Package {
	type Err = PackageError;

	fn from_str(value: &str) -> Result<Self, Self::Err> {
		match value {
			"appimage" => Ok(Package::AppImage),
			"deb" => Ok(Package::Deb),
			"rpm" => Ok(Package::Rpm),
			"dmg" => Ok(Package::Dmg),
			"nsis" => Ok(Package::Nsis),
			"apk" => Ok(Package::Apk),
			"ipa" => Ok(Package::Ipa),
			_ => Err(PackageError::UnknownPackage(value.to_string())),
		}
	}
}

#[derive(Serialize, Deserialize, Hash, Eq, PartialEq, Clone, Copy, Debug)]
pub enum Platform {
	#[serde(rename = "windows-x86_64")]
	WindowsX86_64,
	#[serde(rename = "darwin-x86_64")]
	DarwinX86_64,
	#[serde(rename = "darwin-aarch64")]
	DarwinAarch64,
	#[serde(rename = "linux-x86_64")]
	Linux,
	#[serde(rename = "android")]
	Android,
	#[serde(rename = "ios")]
	Ios,
}

impl AsRef<str> for Platform {
	fn as_ref(&self) -> &str {
		match self {
			Platform::WindowsX86_64 => "windows-x86_64",
			Platform::DarwinX86_64 => "darwin-x86_64",
			Platform::DarwinAarch64 => "darwin-aarch64",
			Platform::Linux => "linux-x86_64",
			Platform::Android => "android",
			Platform::Ios => "ios",
		}
	}
}

impl std::fmt::Display for Platform {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		write!(f, "{}", self.as_ref())
	}
}
