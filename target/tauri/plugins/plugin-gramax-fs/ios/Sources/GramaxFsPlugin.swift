import UIKit
import WebKit
import Tauri
import SwiftRs

class GramaxFsPlugin: Plugin {}

@_cdecl("init_plugin_gramaxfs")
func initPlugin() -> Plugin {
	return GramaxFsPlugin()
}
