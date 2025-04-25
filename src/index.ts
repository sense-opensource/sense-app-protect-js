import { isAdBlockerEnabled } from './modules/adBlocker';
import { botDetection } from './modules/bot';
import { browserTampering } from './modules/browserTampering';
import { developerToolsDetection } from './modules/devTools';
import { detectIncognito } from './modules/incognito';

/**
 * Function to get all Sense - Web Application Security.
 * @returns An object containing the details like Ad-Blocker Detection, Browser Tampering, Bot Detection, Incognito Detection, Developer Tools Detection.
 */
export const getDeviceAppSecurity = async () => {
	try {
		return {
			adBlocker: await isAdBlockerEnabled(),
			browserTampering : browserTampering(),
			bot : await botDetection(),
			incognito : await detectIncognito(),
			devTools : await developerToolsDetection()
		};
	} catch (error) {
	 	console.log(`Exception while doing something: ${error}`);
		 return null;
	}
};
