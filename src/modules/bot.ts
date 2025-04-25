/**
 * Bot Detection module
 * This module detects bot or not.
 * @returns true if the user is bot, false otherwise
*/

export interface BotCollectorResult {
    [key: string]: boolean;
}
  
export interface BotDetectorResult {
    isBot: boolean;
    collectedSignals: BotCollectorResult;
}
  
const collectBotSignals = (): BotCollectorResult => {
    const res: BotCollectorResult = {};
  
    res.chromeDriver = !!(window as any).domAutomation || !!(window as any)._Selenium_IDE_Recorder;

    res.wrongChromeOrder = Object.getOwnPropertyNames(window).toString() !== [...Object.getOwnPropertyNames(window)].sort((a, b) => a.localeCompare(b)).toString();
  
    res.inconsistentCloneError = (() => {
      try {
        const err = new DOMException('');
        return err.name !== 'Error';
      } catch {
        return true;
      }
    })();
  
    res.fakeCreateElement = !HTMLElement.prototype.hasOwnProperty('attachShadow');
  
    res.firefoxDevTools = navigator.userAgent.includes('Firefox') && (window as any).mozInnerScreenX !== undefined;
  
    res.hiddenScroll = (() => {
      const el = document.createElement('div');
      el.style.overflow = 'scroll';
      document.body.appendChild(el);
      const hasScroll = el.scrollHeight > el.clientHeight;
      document.body.removeChild(el);
      return !hasScroll;
    })();
  
    res.inconsistentChromeObject = !('chrome' in window) || Object.keys((window as any).chrome ?? {}).length < 2;
  
    res.iframeChromeRuntime = (() => {
      try {
        return window.top !== window && !!(window as any).chrome?.runtime;
      } catch {
        return false;
      }
    })();
  
    res.noHovermq = !window.matchMedia('(hover: hover)').matches;
  
    res.oldSelenium = !!(window as any).selenium || !!(window as any).Selenium;
  
    res.inconsistentPermissions = (() => {
      try {
        const p = (navigator as any).permissions;
        return !(p && typeof p.query === 'function');
      } catch {
        return true;
      }
    })();
  
    res.phantomWindow = !!(window as any).callPhantom || !!(window as any)._phantom;
  
    res.playwrightOrientation = typeof (window.screen as any).orientation?.type === 'undefined';
  
    res.playwrightWebKit = !!(navigator.userAgent.includes('AppleWebKit') && !(window as any).WebKitCSSMatrix);
  
    res.toStringSpoofed = (() => {
      try {
        const str = Function.prototype.toString.call(Function);
        return !/\[native code\]/.test(str);
      } catch {
        return true;
      }
    })();
  
    res.webdriver = !!navigator.webdriver;
  
    res.webGLDisabled = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !canvas.getContext('webgl') && !canvas.getContext('experimental-webgl');
      } catch {
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
  
const detectBotFromSignals = (signals: BotCollectorResult): Omit<BotDetectorResult, 'collectedSignals'> => {
    const detectionRules: (string | string[])[] = [
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
  
    const triggeredRules: string[] = [];
  
    for (const rule of detectionRules) {
      if (typeof rule === 'string') {
        if (signals[rule]) triggeredRules.push(rule);
      } else if (Array.isArray(rule)) {
        if (rule.every(r => signals[r])) {
          triggeredRules.push(rule.join('+'));
        }
      }
    }
  
    return {
      isBot: triggeredRules.length > 0
    };
};

export const botDetection = async (): Promise<BotDetectorResult> => {
    const collectedSignals = collectBotSignals();
    const { isBot } = detectBotFromSignals(collectedSignals);
    return { isBot, collectedSignals };
};  