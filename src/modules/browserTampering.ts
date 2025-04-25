import { performReduce } from "../utils/common";

interface NavigatorUAData {
    brands: UADataBrand[];
    mobile: boolean;
    platform: string;
}
  
interface UADataBrand {
    brand: string;
    version: string;
}
  
/**
 * Browser Tampering module
 * This module detects if the browser is tampered or not.
 * @returns true if the browser is tampered, false otherwise
 */

export const browserTampering = (): boolean => {
    const ua = navigator.userAgent;
    if (/opr\//i.exec(ua)) {
        return !window.opr;
    } else if(navigator?.brave?.isBrave()) {
        return !_bBrowserDetect()
    } else if (/safari/i.exec(ua) && !(/chrome|crios|chromium/i).exec(ua)) {
        return !_sBrowserDetect()
    } else if (/chrome|chromium|crios/i.exec(ua)) {
        return !_cBrowserDetect()
    } else if (/firefox|fxios/i.exec(ua)) {
        return !_fBrowserDetect()
    } else {
        return false;
    }
}


// Check for Brave browser
const _bBrowserDetect = () => {
    let braveFn;
    try{
        if (navigator?.brave?.isBrave()) {
            braveFn = true
        } else {
            braveFn = false;
        }
    } catch(err){
        console.log(`browser detect : ${err}`)
        braveFn = false;
    }
    return _cBrowserDetect() && braveFn
}

// Check for Chrome browser
const _cBrowserDetect = () => {
    return (
        performReduce([
            "webkitTemporaryStorage" in navigator,
            isChrome((navigator as any).userAgentData),
            "webkitResolveLocalFileSystemURL" in window,
            "BatteryManager" in window,
            "webkitMediaStream" in window,
            "webkitSpeechGrammar" in window,
            "webkitPersistentStorage" in navigator
        ], 5) 
    );
}

/**
 * 
 * @returns true if the user agent is a Safari browser, false otherwise
 */
const _sBrowserDetect = () => {
    return (
        performReduce([
            "ApplePayError" in window,
            "Counter" in window,
            isApple,
            "RGBColor" in window,
            "CSSPrimitiveValue" in window,
            "WebKitMediaKeys" in window
        ], 4)
    );
}


/**
 * Function to detect if the browser is Firefox
 * @returns A boolean indicating if the browser is Firefox
 */
export const _fBrowserDetect = () => {
    let a, t;
    return (
        performReduce([
            "mozInnerScreenX" in window,
            "CSSMozDocumentRule" in window,
            "buildID" in navigator,
            isFirefox(),
            "onmozfullscreenchange" in window,
            "CanvasCaptureMediaStream" in window
        ], 4)
    );
}

const isChrome = (uaData : NavigatorUAData) => uaData?.brands?.some((b: UADataBrand) => b.brand === "Google Chrome") ?? false;
const isApple: boolean = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
const isFirefox : any =  () => {
    let a = document.documentElement;
    let style = null;

    if (a !== null && a !== undefined) {
        style = a.style;
    }

    return "MozAppearance" in (style || {});
}