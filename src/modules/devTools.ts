/**
 * Developer Tools detection module
 * This module detects if the Developer Tools is a open or not.
 * @returns true if the Developer Tools is open, false otherwise
*/

// Define the shape of the devtools state
interface DevtoolsState {
	isOpen: boolean;
	orientation: 'vertical' | 'horizontal' | undefined;
}

// Shared state object to track DevTools visibility and orientation
const devtools: DevtoolsState = {
	isOpen: false,
	orientation: undefined,
};

// Pixel difference threshold to detect devtools
const threshold = 170;

// Dispatches a custom global event when devtools status changes
const emitEvent = (isOpen: boolean, orientation: 'vertical' | 'horizontal' | undefined): void => {
	globalThis.dispatchEvent(new CustomEvent('devtoolschange', {
		detail: {
			isOpen,
			orientation,
		},
	}));
};

// Configuration interface for the detection function
interface MainOptions {
	emitEvents?: boolean;
}

// Core detection function to check if DevTools is open
const detect = ({ emitEvents = true }: MainOptions = {}): void => {
	const widthThreshold = globalThis.outerWidth - globalThis.innerWidth > threshold;
	const heightThreshold = globalThis.outerHeight - globalThis.innerHeight > threshold;
	const orientation: 'vertical' | 'horizontal' = widthThreshold ? 'vertical' : 'horizontal';

	// Legacy Firebug support
	const firebugDetected = (globalThis as any)?.Firebug?.chrome?.isInitialized;

	if (
		!(heightThreshold && widthThreshold) &&
		(firebugDetected || widthThreshold || heightThreshold)
	) {
		if ((!devtools.isOpen || devtools.orientation !== orientation) && emitEvents) {
			emitEvent(true, orientation);
		}
		devtools.isOpen = true;
		devtools.orientation = orientation;
	} else {
		if (devtools.isOpen && emitEvents) {
			emitEvent(false, undefined);
		}
		devtools.isOpen = false;
		devtools.orientation = undefined;
	}
};

// Exported async wrapper to start the detection loop
export const developerToolsDetection = async (): Promise<any> => {
	// Initial run without events
	detect({ emitEvents: false });

	// Periodically check for devtools status
	setInterval(detect, 500);

	// Return current devtools state as a promise result
	return devtools;
};