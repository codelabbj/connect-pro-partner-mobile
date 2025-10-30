// Simple hardware back button bridge for web/Capacitor
// Registers a single callback for back navigation.

let backHandler: (() => void) | null = null

export function registerHardwareBackHandler(handler: () => void) {
	backHandler = handler
}

export function unregisterHardwareBackHandler() {
	backHandler = null
}

function onHardwareBackEvent() {
	if (backHandler) {
		try {
			backHandler()
			return
		} catch {
			// ignore
		}
	}
	// Fallback to browser history if no handler
	if (typeof window !== "undefined" && window.history.length > 1) {
		window.history.back()
	}
}

// Attach listeners once in browser
if (typeof window !== "undefined") {
	// Custom event emitted by inline script in app/layout.tsx
	window.addEventListener("hardwareBack", onHardwareBackEvent)
}

export function emitHardwareBack() {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event("hardwareBack"))
	}
}


