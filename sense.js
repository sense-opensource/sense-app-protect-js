var SenseOS = (function (exports) {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    /**
     * Function to detect if an ad blocker is enabled.
     * @returns A Promise that resolves to `true` if an ad blocker is detected, otherwise `false`.
     */
    const isAdBlockerEnabled = () => {
        return new Promise((resolve) => {
            try {
                // Create a script element to test ad blocker behavior
                const senseAds = document.createElement('script');
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
            }
            catch (error) {
                console.log(`Ad blocker error : ${error}`);
                // If an error occurs, assume an ad blocker is enabled
                resolve(true);
            }
        });
    };

    /**
     * Bot Detection module
     * This module detects bot or not.
     * @returns true if the user is bot, false otherwise
    */
    const collectBotSignals = () => {
        var _a, _b;
        const res = {};
        res.chromeDriver = !!window.domAutomation || !!window._Selenium_IDE_Recorder;
        res.wrongChromeOrder = Object.getOwnPropertyNames(window).toString() !== [...Object.getOwnPropertyNames(window)].sort((a, b) => a.localeCompare(b)).toString();
        res.inconsistentCloneError = (() => {
            try {
                const err = new DOMException('');
                return err.name !== 'Error';
            }
            catch (_a) {
                return true;
            }
        })();
        res.fakeCreateElement = !HTMLElement.prototype.hasOwnProperty('attachShadow');
        res.firefoxDevTools = navigator.userAgent.includes('Firefox') && window.mozInnerScreenX !== undefined;
        res.hiddenScroll = (() => {
            const el = document.createElement('div');
            el.style.overflow = 'scroll';
            document.body.appendChild(el);
            const hasScroll = el.scrollHeight > el.clientHeight;
            document.body.removeChild(el);
            return !hasScroll;
        })();
        res.inconsistentChromeObject = !('chrome' in window) || Object.keys((_a = window.chrome) !== null && _a !== void 0 ? _a : {}).length < 2;
        res.iframeChromeRuntime = (() => {
            var _a;
            try {
                return window.top !== window && !!((_a = window.chrome) === null || _a === void 0 ? void 0 : _a.runtime);
            }
            catch (_b) {
                return false;
            }
        })();
        res.noHovermq = !window.matchMedia('(hover: hover)').matches;
        res.oldSelenium = !!window.selenium || !!window.Selenium;
        res.inconsistentPermissions = (() => {
            try {
                const p = navigator.permissions;
                return !(p && typeof p.query === 'function');
            }
            catch (_a) {
                return true;
            }
        })();
        res.phantomWindow = !!window.callPhantom || !!window._phantom;
        res.playwrightOrientation = typeof ((_b = window.screen.orientation) === null || _b === void 0 ? void 0 : _b.type) === 'undefined';
        res.playwrightWebKit = !!(navigator.userAgent.includes('AppleWebKit') && !window.WebKitCSSMatrix);
        res.toStringSpoofed = (() => {
            try {
                const str = Function.prototype.toString.call(Function);
                return !/\[native code\]/.test(str);
            }
            catch (_a) {
                return true;
            }
        })();
        res.webdriver = !!navigator.webdriver;
        res.webGLDisabled = (() => {
            try {
                const canvas = document.createElement('canvas');
                return !canvas.getContext('webgl') && !canvas.getContext('experimental-webgl');
            }
            catch (_a) {
                return true;
            }
        })();
        const isRealBrowser = (navigator.userAgent && !navigator.webdriver);
        const ignoreRules = ['wrongChromeOrder', 'fakeCreateElement', 'inconsistentChromeObject'];
        if (isRealBrowser) {
            // Skip checking the above rules
            ignoreRules.forEach(rule => {
                delete res[rule];
            });
        }
        return res;
    };
    const detectBotFromSignals = (signals) => {
        const detectionRules = [
            'errorTrapPhantomJS',
            'errorTrapPuppeteer',
            'errorTrapPlaywrightChrome',
            'errorTrapPlaywrightFirefox',
            'errorTrapPlaywrightWebKit',
            'errorTrapSeleniumChrome',
            'chromeDriver',
            'wrongChromeOrder',
            'inconsistentCloneError',
            'fakeCreateElement',
            ['firefoxDevTools', 'hiddenScroll', 'noHovermq'],
            'inconsistentChromeObject',
            'iframeChromeRuntime',
            'oldSelenium',
            'inconsistentPermissions',
            'phantomWindow',
            'playwrightOrientation',
            'playwrightWebKit',
            'toStringSpoofed',
            'webdriver',
            ['firefoxDevTools', 'webGLDisabled']
        ];
        const triggeredRules = [];
        for (const rule of detectionRules) {
            if (typeof rule === 'string') {
                if (signals[rule])
                    triggeredRules.push(rule);
            }
            else if (Array.isArray(rule)) {
                if (rule.every(r => signals[r])) {
                    triggeredRules.push(rule.join('+'));
                }
            }
        }
        return {
            isBot: triggeredRules.length > 0
        };
    };
    const botDetection = () => __awaiter(void 0, void 0, void 0, function* () {
        const collectedSignals = collectBotSignals();
        const { isBot } = detectBotFromSignals(collectedSignals);
        return { isBot, collectedSignals };
    });

    /**
     * Helper function to reduce an array of booleans to a single boolean value
     * @param m
     * @param n
     * @returns
     */
    const performReduce = (m, n) => {
        return (m.reduce((m, n) => m + (n === true), 0)) >= n;
    };

    /**
     * Browser Tampering module
     * This module detects if the browser is tampered or not.
     * @returns true if the browser is tampered, false otherwise
     */
    const browserTampering = () => {
        var _a;
        const ua = navigator.userAgent;
        if (/opr\//i.exec(ua)) {
            return !window.opr;
        }
        else if ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.brave) === null || _a === void 0 ? void 0 : _a.isBrave()) {
            return !_bBrowserDetect();
        }
        else if (/safari/i.exec(ua) && !(/chrome|crios|chromium/i).exec(ua)) {
            return !_sBrowserDetect();
        }
        else if (/chrome|chromium|crios/i.exec(ua)) {
            return !_cBrowserDetect();
        }
        else if (/firefox|fxios/i.exec(ua)) {
            return !_fBrowserDetect();
        }
        else {
            return false;
        }
    };
    // Check for Brave browser
    const _bBrowserDetect = () => {
        var _a;
        let braveFn;
        try {
            if ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.brave) === null || _a === void 0 ? void 0 : _a.isBrave()) {
                braveFn = true;
            }
            else {
                braveFn = false;
            }
        }
        catch (err) {
            console.log(`browser detect : ${err}`);
            braveFn = false;
        }
        return _cBrowserDetect() && braveFn;
    };
    // Check for Chrome browser
    const _cBrowserDetect = () => {
        return (performReduce([
            "webkitTemporaryStorage" in navigator,
            isChrome(navigator.userAgentData),
            "webkitResolveLocalFileSystemURL" in window,
            "BatteryManager" in window,
            "webkitMediaStream" in window,
            "webkitSpeechGrammar" in window,
            "webkitPersistentStorage" in navigator
        ], 5));
    };
    /**
     *
     * @returns true if the user agent is a Safari browser, false otherwise
     */
    const _sBrowserDetect = () => {
        return (performReduce([
            "ApplePayError" in window,
            "Counter" in window,
            isApple,
            "RGBColor" in window,
            "CSSPrimitiveValue" in window,
            "WebKitMediaKeys" in window
        ], 4));
    };
    /**
     * Function to detect if the browser is Firefox
     * @returns A boolean indicating if the browser is Firefox
     */
    const _fBrowserDetect = () => {
        return (performReduce([
            "mozInnerScreenX" in window,
            "CSSMozDocumentRule" in window,
            "buildID" in navigator,
            isFirefox(),
            "onmozfullscreenchange" in window,
            "CanvasCaptureMediaStream" in window
        ], 4));
    };
    const isChrome = (uaData) => { var _a, _b; return (_b = (_a = uaData === null || uaData === void 0 ? void 0 : uaData.brands) === null || _a === void 0 ? void 0 : _a.some((b) => b.brand === "Google Chrome")) !== null && _b !== void 0 ? _b : false; };
    const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    const isFirefox = () => {
        let a = document.documentElement;
        let style = null;
        if (a !== null && a !== undefined) {
            style = a.style;
        }
        return "MozAppearance" in (style || {});
    };

    /**
     * Developer Tools detection module
     * This module detects if the Developer Tools is a open or not.
     * @returns true if the Developer Tools is open, false otherwise
    */
    // Shared state object to track DevTools visibility and orientation
    const devtools = {
        isOpen: false,
        orientation: undefined,
    };
    // Pixel difference threshold to detect devtools
    const threshold = 170;
    // Dispatches a custom global event when devtools status changes
    const emitEvent = (isOpen, orientation) => {
        globalThis.dispatchEvent(new CustomEvent('devtoolschange', {
            detail: {
                isOpen,
                orientation,
            },
        }));
    };
    // Core detection function to check if DevTools is open
    const detect = ({ emitEvents = true } = {}) => {
        var _a, _b;
        const widthThreshold = globalThis.outerWidth - globalThis.innerWidth > threshold;
        const heightThreshold = globalThis.outerHeight - globalThis.innerHeight > threshold;
        const orientation = widthThreshold ? 'vertical' : 'horizontal';
        // Legacy Firebug support
        const firebugDetected = (_b = (_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.Firebug) === null || _a === void 0 ? void 0 : _a.chrome) === null || _b === void 0 ? void 0 : _b.isInitialized;
        if (!(heightThreshold && widthThreshold) &&
            (firebugDetected || widthThreshold || heightThreshold)) {
            if ((!devtools.isOpen || devtools.orientation !== orientation) && emitEvents) {
                emitEvent(true, orientation);
            }
            devtools.isOpen = true;
            devtools.orientation = orientation;
        }
        else {
            if (devtools.isOpen && emitEvents) {
                emitEvent(false, undefined);
            }
            devtools.isOpen = false;
            devtools.orientation = undefined;
        }
    };
    // Exported async wrapper to start the detection loop
    const developerToolsDetection = () => __awaiter(void 0, void 0, void 0, function* () {
        // Initial run without events
        detect({ emitEvents: false });
        // Periodically check for devtools status
        setInterval(detect, 500);
        // Return current devtools state as a promise result
        return devtools;
    });

    /*!
     *
     * This module detects if the browser is in incognito mode.
     * It uses the IndexedDB API to check if the browser is in incognito mode.
     * @returns true if the browser is in incognito mode, false otherwise
     * Based on https://github.com/Joe12387/detectIncognito
    **/
    const detectIncognito = () => __awaiter(void 0, void 0, void 0, function* () {
        return yield new Promise(function (resolve, reject) {
            function __callback(isPrivate) {
                resolve(isPrivate);
            }
            function assertEvalToString(value) {
                return value === eval.toString().length;
            }
            function feid() {
                let toFixedEngineID = 0;
                let neg = parseInt("-1");
                try {
                    const _ = neg.toFixed(neg);
                }
                catch (e) {
                    toFixedEngineID = e.message.length;
                }
                return toFixedEngineID;
            }
            function isSafari() {
                return feid() === 44;
            }
            function isChrome() {
                return feid() === 51;
            }
            function isFirefox() {
                return feid() === 25;
            }
            function isMSIE() {
                return (navigator.msSaveBlob !== undefined && assertEvalToString(39));
            }
            /**
             * Safari (Safari for iOS & macOS)
             **/
            function newSafariTestByStorageFallback() {
                var _a;
                if (!((_a = navigator.storage) === null || _a === void 0 ? void 0 : _a.estimate)) {
                    __callback(false);
                    return;
                }
                navigator.storage
                    .estimate()
                    .then(({ usage, quota }) => {
                    // iOS 18.x/macOS Safari 18.x (normal): ~41GB
                    // iOS 18.x/macOS Safari 18.x (private): ~1GB
                    // If reported quota < 2 GB => likely private
                    if (quota && quota < 2000000000) {
                        __callback(true);
                    }
                    else {
                        __callback(false);
                    }
                })
                    .catch(() => {
                    __callback(false);
                });
            }
            function newSafariTest() {
                const tmp_name = String(secureRandomInt());
                try {
                    const db = window.indexedDB.open(tmp_name, 1);
                    db.onupgradeneeded = function (i) {
                        var _a;
                        const res = i.target.result;
                        try {
                            res.createObjectStore('test', {
                                autoIncrement: true
                            }).put(new Blob());
                        }
                        catch (e) {
                            let message = e;
                            if (e instanceof Error) {
                                message = (_a = e.message) !== null && _a !== void 0 ? _a : e;
                            }
                            if (typeof message !== 'string') {
                                __callback(false);
                                return;
                            }
                            const matchesExpectedError = message.includes('BlobURLs are not yet supported');
                            if (matchesExpectedError) {
                                __callback(true);
                            }
                        }
                        finally {
                            res.close();
                            window.indexedDB.deleteDatabase(tmp_name);
                            // indexdb works on newer versions of safari so we need to check via storage fallback
                            newSafariTestByStorageFallback();
                        }
                    };
                }
                catch (e) {
                    console.log(`New safari test : ${e}`);
                    __callback(false);
                }
            }
            function oldSafariTest() {
                const openDB = window.openDatabase;
                const storage = window.localStorage;
                try {
                    openDB(null, null, null, null);
                }
                catch (e) {
                    console.log(`Old safari test : ${e}`);
                    __callback(true);
                    return;
                }
                try {
                    storage.setItem('test', '1');
                    storage.removeItem('test');
                }
                catch (e) {
                    console.log(`Storage test : ${e}`);
                    __callback(true);
                    return;
                }
                __callback(false);
            }
            function safariPrivateTest() {
                if (navigator.maxTouchPoints !== undefined) {
                    newSafariTest();
                }
                else {
                    oldSafariTest();
                }
            }
            /**
             * Chrome
             **/
            function getQuotaLimit() {
                const w = window;
                if (w.performance !== undefined &&
                    w.performance.memory !== undefined &&
                    w.performance.memory.jsHeapSizeLimit !== undefined) {
                    return performance.memory.jsHeapSizeLimit;
                }
                return 1073741824;
            }
            // >= 76
            function storageQuotaChromePrivateTest() {
                navigator.webkitTemporaryStorage.queryUsageAndQuota(function (_, quota) {
                    const quotaInMib = Math.round(quota / (1024 * 1024));
                    const quotaLimitInMib = Math.round(getQuotaLimit() / (1024 * 1024)) * 2;
                    __callback(quotaInMib < quotaLimitInMib);
                }, function (e) {
                    reject(new Error('detectIncognito somehow failed to query storage quota: ' +
                        e.message));
                });
            }
            // 50 to 75
            function oldChromePrivateTest() {
                const fs = window.webkitRequestFileSystem;
                const success = function () {
                    __callback(false);
                };
                const error = function () {
                    __callback(true);
                };
                fs(0, 1, success, error);
            }
            function chromePrivateTest() {
                if (self.Promise !== undefined && self.Promise.allSettled !== undefined) {
                    storageQuotaChromePrivateTest();
                }
                else {
                    oldChromePrivateTest();
                }
            }
            /**
             * Firefox
             **/
            function firefoxPrivateTest() {
                __callback(navigator.serviceWorker === undefined);
            }
            /**
             * MSIE
             **/
            function msiePrivateTest() {
                __callback(window.indexedDB === undefined);
            }
            function main() {
                if (isSafari()) {
                    safariPrivateTest();
                }
                else if (isChrome()) {
                    chromePrivateTest();
                }
                else if (isFirefox()) {
                    firefoxPrivateTest();
                }
                else if (isMSIE()) {
                    msiePrivateTest();
                }
                else {
                    reject(new Error('detectIncognito cannot determine the browser'));
                }
            }
            main();
        });
    });
    // Genarate secure random integer
    const secureRandomInt = (max = 5) => {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] / (0xFFFFFFFF + 1);
    };

    /**
     * Function to get all Sense - Web Application Security.
     * @returns An object containing the details like Ad-Blocker Detection, Browser Tampering, Bot Detection, Incognito Detection, Developer Tools Detection.
     */
    const initSDK = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            return {
                adBlocker: yield isAdBlockerEnabled(),
                browserTampering: browserTampering(),
                bot: yield botDetection(),
                incognito: yield detectIncognito(),
                devTools: yield developerToolsDetection()
            };
        }
        catch (error) {
            console.log(`Exception while doing something: ${error}`);
            return null;
        }
    });

    exports.initSDK = initSDK;

    return exports;

})({});
