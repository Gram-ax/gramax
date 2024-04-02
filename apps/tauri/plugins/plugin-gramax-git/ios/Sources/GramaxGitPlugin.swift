import UIKit
import WebKit
import Tauri
import SwiftRs

class GramaxGitPlugin: Plugin {}

@_cdecl("init_plugin_gramaxgit")
func initPlugin() -> Plugin {
	return GramaxGitPlugin()
}
