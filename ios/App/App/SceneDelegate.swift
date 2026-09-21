import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        let bridgeVC = CAPBridgeViewController()
        bridgeVC.view.backgroundColor = UIColor(red: 8/255, green: 12/255, blue: 24/255, alpha: 1.0)
        bridgeVC.webView?.isOpaque = false
        bridgeVC.webView?.backgroundColor = UIColor(red: 8/255, green: 12/255, blue: 24/255, alpha: 1.0)
        bridgeVC.webView?.scrollView.backgroundColor = UIColor(red: 8/255, green: 12/255, blue: 24/255, alpha: 1.0)
        bridgeVC.webView?.scrollView.contentInsetAdjustmentBehavior = .never
        bridgeVC.webView?.scrollView.isScrollEnabled = true
        window?.backgroundColor = UIColor(red: 8/255, green: 12/255, blue: 24/255, alpha: 1.0)
        window?.rootViewController = bridgeVC
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
