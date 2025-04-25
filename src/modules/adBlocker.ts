/**
 * Function to detect if an ad blocker is enabled.
 * @returns A Promise that resolves to `true` if an ad blocker is detected, otherwise `false`.
 */
export const isAdBlockerEnabled = (): Promise<boolean> => {
	return new Promise((resolve) => {
		try {
			// Create a script element to test ad blocker behavior
			const senseAds: HTMLScriptElement = document.createElement('script');
			senseAds.type = 'text/javascript';
			senseAds.src =
				'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

			// If the script fails to load, an ad blocker is likely enabled
			senseAds.onerror = () => resolve(true);

			// If the script loads successfully, no ad blocker is detected
			senseAds.onload = () => resolve(false);

			// Append the script to the document head
			document.head.appendChild(senseAds);

			// Clean up the script element after a short delay
			setTimeout(() => {
				document.head.removeChild(senseAds);
			}, 1000);
		} catch (error) {
			console.log(`Ad blocker error : ${error}`)
			// If an error occurs, assume an ad blocker is enabled
			resolve(true);
		}
	});
};
