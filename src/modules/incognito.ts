/*!
 *
 * This module detects if the browser is in incognito mode.
 * It uses the IndexedDB API to check if the browser is in incognito mode.
 * @returns true if the browser is in incognito mode, false otherwise
 * Based on https://github.com/Joe12387/detectIncognito  
**/

export const detectIncognito = async (): Promise<boolean> => {
    return await new Promise(function (resolve, reject) {
  
      function __callback (isPrivate: boolean): void {
        resolve(isPrivate)
      }
  
      function assertEvalToString (value: number): boolean {
        return value === eval.toString().length
      }
  
      function feid (): number {
        let toFixedEngineID = 0
        let neg = parseInt("-1")
        try {
            const _ = neg.toFixed(neg)
        } catch (e) {
          toFixedEngineID = (e as Error).message.length 
        }
        return toFixedEngineID
      }
  
      function isSafari (): boolean {
        return feid() === 44
      }
  
      function isChrome (): boolean {
        return feid() === 51
      }
  
      function isFirefox (): boolean {
        return feid() === 25
      }
  
      function isMSIE (): boolean {
        return (
          (navigator as any).msSaveBlob !== undefined && assertEvalToString(39)
        )
      }
  
      /**
       * Safari (Safari for iOS & macOS)
       **/
  
      function newSafariTestByStorageFallback (): void {
        if (!navigator.storage?.estimate) {
          __callback(false);
          return;
        }
  
        navigator.storage
          .estimate()
          .then(({ usage, quota }) => {
            // iOS 18.x/macOS Safari 18.x (normal): ~41GB
            // iOS 18.x/macOS Safari 18.x (private): ~1GB
            // If reported quota < 2 GB => likely private
            if (quota && quota < 2_000_000_000) {
              __callback(true);
            } else {
              __callback(false);
            }
          })
          .catch(() => {
            __callback(false);
          });
      }
  
      function newSafariTest (): void {
        const tmp_name = String(secureRandomInt())
  
        try {
          const db = window.indexedDB.open(tmp_name, 1)
  
          db.onupgradeneeded = function (i) {
            const res = (i.target as IDBRequest).result;

            try {
              res.createObjectStore('test', {
                autoIncrement: true
              }).put(new Blob())
            } catch (e) {
              let message = e
  
              if (e instanceof Error) {
                message = e.message ?? e
              }
  
              if (typeof message !== 'string') {
                __callback(false); return
              }
  
              const matchesExpectedError = message.includes('BlobURLs are not yet supported')
              if (matchesExpectedError) {
                __callback(true)
              }
            } finally {
              res.close()
              window.indexedDB.deleteDatabase(tmp_name)
  
              // indexdb works on newer versions of safari so we need to check via storage fallback
              newSafariTestByStorageFallback();
            }
          }
        } catch (e) {
          console.log(`New safari test : ${e}`)
          __callback(false)
        }
      }
  
      function oldSafariTest (): void {
        const openDB = (window as any).openDatabase
        const storage = window.localStorage
        try {
          openDB(null, null, null, null)
        } catch (e) {
            console.log(`Old safari test : ${e}`)
            __callback(true); return
        }
        try {
          storage.setItem('test', '1')
          storage.removeItem('test')
        } catch (e) {
            console.log(`Storage test : ${e}`)
            __callback(true); return
        }
        __callback(false)
      }
  
      function safariPrivateTest (): void {
        if (navigator.maxTouchPoints !== undefined) {
          newSafariTest()
        } else {
          oldSafariTest()
        }
      }
  
      /**
       * Chrome
       **/
  
      function getQuotaLimit (): number {
        const w = window as any
        if (
          w.performance !== undefined &&
          w.performance.memory !== undefined &&
          w.performance.memory.jsHeapSizeLimit !== undefined
        ) {
          return (performance as any).memory.jsHeapSizeLimit
        }
        return 1073741824
      }
  
      // >= 76
      function storageQuotaChromePrivateTest (): void {
        (navigator as any).webkitTemporaryStorage.queryUsageAndQuota(
          function (_: number, quota: number) {
            const quotaInMib = Math.round(quota / (1024 * 1024))
            const quotaLimitInMib = Math.round(getQuotaLimit() / (1024 * 1024)) * 2
  
            __callback(quotaInMib < quotaLimitInMib)
          },
          function (e: any) {
            reject(
              new Error(
                'detectIncognito somehow failed to query storage quota: ' +
                  e.message
              )
            )
          }
        )
      }
  
      // 50 to 75
      function oldChromePrivateTest (): void {
        const fs = (window as any).webkitRequestFileSystem
        const success = function () {
          __callback(false)
        }
        const error = function () {
          __callback(true)
        }
        fs(0, 1, success, error)
      }
  
      function chromePrivateTest (): void {
        if (self.Promise !== undefined && (self.Promise as any).allSettled !== undefined) {
          storageQuotaChromePrivateTest()
        } else {
          oldChromePrivateTest()
        }
      }
  
      /**
       * Firefox
       **/
  
      function firefoxPrivateTest (): void {
        __callback(navigator.serviceWorker === undefined)
      }
  
      /**
       * MSIE
       **/
  
      function msiePrivateTest (): void {
        __callback(window.indexedDB === undefined)
      }
  
      function main (): void {
        if (isSafari()) {
          safariPrivateTest()
        } else if (isChrome()) {
          chromePrivateTest()
        } else if (isFirefox()) {
          firefoxPrivateTest()
        } else if (isMSIE()) {
          msiePrivateTest()
        } else {
          reject(new Error('detectIncognito cannot determine the browser'))
        }
      }

      main()
    })
}

// Genarate secure random integer
const secureRandomInt = (max = 5) => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xFFFFFFFF + 1);
}