/**
 * Copyright 2012 Wes Jones http://www.codeguyz.com/
 *
 * Preloader
 * The preloader works under the same concept as head.js. You can load multiple files faster than you can load
 * single large combined files because the browser opens up multiple streams to download the content. So we do
 * not queue the files and load them end to end. We load them all at the same time and then execute each callback
 * as the requested batch has finishes. Batches may not load in order, but they will execute in the order they
 * were requested.
 * Listen to "loadingStart" and then "loadingComplete" to know when all bacthes are finish.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/*global window */
(function (doc) {
    'use strict';
    // some necessary functions
    Object.count = function (obj) {
        var c = 0, i;
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                c+=1;
            }            
        }
        return c;
    };

    var ArrayUtil = {
        filter:function (obj, out) {
            var i, ilen;
            // avoid NPE with toString
            if (obj === null) {
                return;
            }                
            var type = (obj.toString()).match(/\/[\w\W]*?\/\w?/) ? 'regexp' : typeof obj;
            var result = [];
            for (i = 0, ilen = this.length; i < ilen; i+=1) {
                if (type === 'string') {
                    if (this[i] === obj) {
                        result.push(this[i]);
                    }
                } else if (type === 'regexp') {
                    if (this[i] !== null) {
                        if (this[i].toString().match(obj)) {
                            result.push(this[i]);
                        }
                    }
                } else if (obj && type === 'object') {
                    var match = 0;
                    var c = 0;
                    var j;
                    for (j in obj) {
                        if (obj.hasOwnProperty(j)) {
                            if (this[i][j] !== null) {
                                if (this[i][j].toString().match(obj[j])) {
                                    match += 1;
                                }
                            }
                            c+=1;
                        }
                    }
                    if (match === c) {
                        result.push(this[i]);
                    }
                }
            }
            return result;
        },
        remove:function (item) {
            for (var i = 0, len = arguments.length; i < len; ++i) {
                var index = ArrayUtil.indexOf.apply(this, [arguments[i]]);
                if (index !== -1) {
                    this.splice(index, 1);
                }
            }
        },
        indexOf:function (obj) {
            for (var i = 0, len = this.length; i < len; i++) {
                if (this[i] === obj) {
                    return i;
                }
            }
            return -1;
        }
    };

    // optional params queue:boolean, version:string, scope:object
    // check to see if the browser supports async.
    var isAsync = doc.createElement('script').async === true || "MoxAppearance" in doc.documentElement.style || window.opera;
    var head = doc.getElementsByTagName("head")[0];
    // private
    var isHeadReady = false;
    var isDomReady = false;

    var startFctns = [];
    var readyFctns = [];
    var progressFctns = [];
    var fns = {};
    var loaders = {};
    var queue = []; // waiting calls to be loaded.

    function each(arr, fn) {
        for (var i = 0, len = arr.length; i < len; i++) {
            fn.call(arr, arr[i], i);
        }
    }

    function addFctn(list, fctn) {
        if (ArrayUtil.indexOf.apply(list, [fctn]) === -1) {
            list.push(fctn);
        }
    }

    function removeFctn(list, fctn) {
        var i = list.indexOf(fctn);
        if (i !== -1) {
            list.splice(i, 1);
        }
    }

    function addVersion(url, params) {
        var version = params && params.version ? params.version : null;
        if (version) {
            var index = url.indexOf('?');
            if (index !== -1) {
                return url.replace(/\?/, '?v=' + version + '&');
            } else {
                return url + '?v=' + version;
            }
        }
        return url;
    }

    function log() {
        if(window['console']) {
            var c = window['console'];
            if(window.log) {
                window.log.apply(arguments);
            } else if(c.log && c.log.apply) { // keep from breaking IE.
                c.log.apply(c, arguments);
            }
        }
    }

    /**
     * Convert arguments array to [files], callback, params
     * @param args
     */
    function filterArgs(args) {
        var params = null;
        var callback = null;
        var ary = [];
        each(args, function (item) {
            ary.push(item);
        });
        if (typeof ary[ary.length - 1] === 'object') {
            params = ary.pop();  
        }
        if (typeof ary[ary.length - 1] === 'function') {
                callback = ary.pop();
        } else {
            callback = function () {};
        }
        if (!callback) {
            queue = true;
        }
        if (ary.length === 1 && ary[0] instanceof Array) {
            ary = ary[0];
        }
        return {files:ary, callback:callback, params:params};
    }

    var execList = function (list, args) {
        var len = list.length;
        for (var i = 0; i < len; ++i) {
            list[i].apply(this, args || []);
        }
    };    

    function processQueue() {
        if (isHeadReady && isDomReady) {
            each(queue, function (fn) {
                fn();
            });
            queue = [];
        }
    }
    
    function fireReady() {
        if (!isDomReady) {
            isDomReady = true;
            processQueue();
        }
    }   
    
    /**
     * Handles preloading and prioritizing of any file that needs to be loaded. js, css, html, xml, text, etc.
     * js and css are automatcially added to the page. All others are cached as a string and are available
     * through the get(url) function.
     * This also handles start, progress, and finish callbacks for the queue.
     * callbacks are also performed on a grouped basis on the list of items passed.
     */
    var loader = {
        delayStart:0,
        debug:false,
        init:function () {
            fireReady();
        },
        loadLimit:function (value) {
            if (value !== null && !isNaN(value)) {
                this.preloader.loadLimit = value;
                return this;
            } else {
                return this.preloader.loadLimit;
            }
        },
        start:function (callback) {
            addFctn(startFctns, callback);
            return this;
        },
        removeStart:function (callback) {
            removeFctn(startFctns, callback);
            return this;
        },
        ready:function (callback) {
            addFctn(readyFctns, callback);
            return this;
        },
        removeReady:function (callback) {
            removeFctn(readyFctns, callback);
            return this;
        },
        progress:function (callback) {
            addFctn(progressFctns, callback);
            return this;
        },
        register:function (key, ldr) {
            var self = this;
            fns[key] = function () {
                var data = filterArgs(arguments);
                self.preloader.load(key, data.files, data.callback, data.params);
            };
            loaders[key] = ldr;
            this[key] = function () {
                var args = arguments;
                if (isHeadReady) {// wait for a while. immediate execution causes some browsers to ignore caching
                    fns[key].apply(self, args);
                } else {
                    queue.push(function () {
                        fns[key].apply(self, args);
                    });
                }
                return this;
            };
            return this;
        },
        get:function (url) {
            return this.preloader.getFileContents(url);
        },
        cache:function (url, data) {
            if (arguments.length !== 1) { 
                this.preloader.cache[url] = data;
            }
            return this.preloader.cache[url];
        },
        prioritize:function (url, priority) {
            this.preloader.prioritize.apply(this.preloader, arguments);
            return this;
        },
        addVersion:addVersion
    };

    function Preloader() {
        this.requested = {};
        this.loading = {};
        this.cache = {};
        this.loadFinishQueue = {};
        this.key = 0;
        this.loadedIndex = 0;
        this.loadingSinceStart = 0;
        this.loadedSinceStart = 0;
        // priority loading.
        this.loadLimit = 10;
        this.waitQueue = [];
        this.processQueue = [];
        this.defaultPriority = 10;
        this.priorityDirty = false;
        this.readyIntv = 0;
        this.status = '';

        /**
         * Change the priority of a url.
         * @param url
         * @param priority
         */
        this.prioritize = function (url, priority) {
            this.priorityDirty = true;
            var p = arguments[arguments.length - 1];
            for (var i = 0, len = arguments.length - 1; i < len; ++i) {
                var files = ArrayUtil.filter.apply(this.waitQueue, [
                    {file:arguments}
                ]);
                for (var j = 0, len2 = files.length; j < len2; ++j) {
                    files[j].priority = p;
                }
            }
        };
        /**
         * @public
         * Load the array of urls, when complete execute the finishCallback.
         * @param type
         * @param files
         * @param callback
         * @param params
         */
        this.load = function (type, files, callback, params) {
            var key = this.key;
            if (loader.debug) { 
                log('^^^ ' + this.key + ' group started');
            }
            if (!this.readyIntv && !this.readyWaiting && this.status !== 'loading' && !Object.count(this.loading)) {
                if (loader.debug) {
                    log('START');
                }
                this.status = 'loading';
                if (loader.delayStart) {
                    var self = this;
                    this.startIntv = setTimeout(function () {
                        execList(startFctns, []);
                        clearTimeout(self.startIntv);
                        self.startIntv = 0;
                        if (self.readyWaiting) {
                            self.ready();
                        }
                    }, loader.delayStart);
                } else {
                    execList(startFctns, []);
                }
//                this.loadingSinceStart = 0;
            }
            if (!params) {
                params = {};
            }
            if (!('priority' in params)) {
                params.priority = this.defaultPriority;
            }
            var lo = {};
            for (var i = 0; i < files.length; ++i) {
                if (!(files[i] in this.requested) && !lo[files[i]]) {// don't load duplicate files.
                    lo[files[i]] = {key:key}; // index the files in the loader.
                    this.loadingSinceStart += 1;
                }
            }
            this.loading[key] = lo;
            for (i = 0; i < files.length; ++i) {
                if (!(files[i] in this.requested)) {
                    this.requested[files[i]] = true;
                    this._queueFile(type, key, files[i], params);
//                    this._load(type, key, files[i], params);
                }
            }
            this.loadFinishQueue[key] = {
                key:key,
                files:files,
                callback:callback,
                loaded:false,
                fire:params && params.queue ? false : true,
                fired:false,
                scope:params ? params.scope : null
            };
            this._process();
            this.key += 1;
            return this.onComplete(key);
        };
        /**
         * @private
         * Queue the files so that we can control the priority.
         * @param type
         * @param key
         * @param file
         * @param params
         */
        this._queueFile = function (type, key, file, params) {
            if (loader.debug) {
                log('queue', file);
            }
            this.waitQueue.push({type:type, key:key, file:file, params:params, priority:params.priority});
        };
        /**
         * @private
         * Process waiting items from waitQueue to process queue based on loadLimit.
         */
        this._process = function () {
            if (!isAsync) {
                this.loadLimit = 1;
            }
            while (this.waitQueue.length && this.processQueue.length < this.loadLimit) {
                if (this.priorityDirty) {
                    this.priorityDirty = false;
                    if (loader.debug) {
                        log('before');
                        for (var i = 0, len = this.waitQueue.length; i < len; ++i) {
                            log("\t", this.waitQueue[i].file);
                        }
                    }
                    this.waitQueue.sortOn('priority');
                    if (loader.debug) {
                        log('after');
                        for (var j = 0, len2 = this.waitQueue.length; j < len2; ++j) {
                            log("\t", this.waitQueue[j].file);
                        }
                    }
                }
                var item = this.waitQueue.shift();
                this.processQueue.push(item);
                this._load(item.type, item.key, item.file, item.params);
            }
        };
        /**
         * @private
         * private function for loading the individual files.
         * @param type
         * @param key
         * @param file
         * @param params
         */
        this._load = function (type, key, file, params) {
            if (!this.cache[file] && !this.isLoading(key, file)) {
                type = type && type in loaders && loaders[type] ? type : file.split('.').pop().toLowerCase();
                if (!(type in loaders) || !loaders[type]) {
                    type = 'text';
                }
                loaders[type].apply(loader, [key, file, function (result) {
                    loader.preloader.onFileLoad(key, file, result);
                }, params]);
            } else {// it is already loaded.
                delete this.loading[key][file];
                this.loadedSinceStart += 1;
                var matches = ArrayUtil.filter.apply(this.processQueue, [
                    {key:key, file:file}
                ]);
                ArrayUtil.remove.apply(this.processQueue, matches);// remove all matches.
                this.onComplete(key);
            }
        };

        /**
         * @public
         * function to tell if a file is loading or not.
         * @param key
         * @param file
         */
        this.isLoading = function (key, file) {
            for (var i in this.loading) {
                if (key.toString() !== i && file in this.loading[i]) {
                    return true;
                }
            }
            return false;
        };

        /**
         * @private
         * keep track of the files that load so that they get cached and so we can call their
         * callback once that batch is complete.
         * @param key
         * @param file
         * @param result
         */
        this.onFileLoad = function (key, file, result) {
//            console.log('loaded:' + file);
            if (!this.cache.hasOwnProperty(file)) {
                var ref = this.loading[key][file];
                this.cache[file] = result ? result : true;
                delete this.loading[key][file];
                var matches = ArrayUtil.filter.apply(this.processQueue, [
                    {key:key, file:file}
                ]);
                ArrayUtil.remove.apply(this.processQueue, matches);// remove all matches.
                if (loader.debug) {
                    log("\t", Object.count(this.loading[key]) + '--- loaded: ' + file);
                }
                this._process();
            }
            this.loadedSinceStart += 1;
            this.onComplete(key);
        };
        /**
         * Get the contents of a file that was previously loaded.
         * @param file
         */
        this.getFileContents = function (file) {
            return this.cache[file];
        };
        this.updatePercent = function () {
            if (progressFctns.length && this.loadedSinceStart !== 0) {// build up the progress
                if (!this.startIntv) {
                    execList(progressFctns, [this.loadedSinceStart, this.loadingSinceStart]);
                }
            }
        };
        /**
         * @private
         * handle the execution of files in the correct order.
         * @param key
         */
        this.onComplete = function (key) {
            if (loader.debug) {
                log("\t", key + ' left ' + Object.count(this.loading[key]) + ' of ' + (this.loadFinishQueue[key] ? this.loadFinishQueue[key].files.length : 0));
            }
            this.updatePercent();

            // we need to know if any of the items before this are not loaded yet.
            if (Object.count(this.loading[key]) === 0 && this.loadFinishQueue[key]) {
//                loader.debug ? console.log("\t", key, 'loaded') : null;
                var curItem = this.loadFinishQueue[key];
                curItem.loaded = true;
//                loader.debug ? console.log('loadIndex', this.loadedIndex) : null;
                if (key === this.loadedIndex) {
                    if (loader.debug) {
                        log("\t", '^^^ ' + key + ' group loaded');
                    }
                    this.loadedIndex += 1;
                } else if (key > this.loadedIndex) {
//                    loader.debug ? console.log("\t", key, 'loaded break') : null;
                    if (curItem.fire) {
                        this.fireItem(curItem);
                    }
                    return;
                }
                // now we want to execute in order. So we will check all of the items that have been passed up and are still in the loading.
                var process = [];
                for (var i in this.loadFinishQueue) {
                    if (this.loadFinishQueue.hasOwnProperty(i)) {
                        var item = this.loadFinishQueue[i];
                        process.push(item);   
                    }
                }
                // sort the processing.
                process.sort(function (a, b) {
                    var v = a.key - b.key;
                    return v < 0 ? -1 : (v > 0 ? 1 : 0);
                });

                for (i = 0; i < process.length; ++i) {
                    var item2 = process[i];//this.loadFinishQueue[p];
                    if (item2.loaded) {
                        // we fire until we find one in sequence that is not loaded.
                        if (this.loadedIndex < item2.key + 1) {
                            this.loadedIndex = item2.key + 1;
                        }
                        this.fireItem(item2, true);
                    } else { // this item wasn't loaded. break the sequence.
                        break;
                    }
                }
            }
        };
        /**
         * @private
         * Do the actual execution of the callback.
         * @param item
         * @param clear
         */
        this.fireItem = function (item, clear) {
            var self = this;
            if (!item.fired) {
                if (loader.debug) {
                    log('files loaded', item.files);
                }
                if (loader.debug) {
                    log("FIRE: " + item.key);
                }
                item.fired = true;
                if (item.callback) {
                    // IE and FF has to break thread to allow loaded scripts to initialize. So do it for all.
                    var intv = setTimeout(function DelayCall() {
                        clearTimeout(intv);
                        item.callback.apply(item.scope ? item.scope : window);

                        self.ready();
                    }, 1);
                }
            }
            if (item.key < this.loadedIndex || clear) { // get rid of it.
                delete this.loading[item.key];
                delete this.loadFinishQueue[item.key];
            }
        };
        this.ready = function () {
            // delay the ready 1 millisecond just in case the callback of the other added something
            // back into the queue.
            this.readyWaiting = false;
            if (!Object.count(this.loading)) {
                clearTimeout(this.readyIntv);

                var self = this;
                this.readyIntv = setTimeout(function () {
                    self._ready();
                }, 1);
            }
        };
        this._ready = function () {
            clearTimeout(this.readyIntv);
            this.readyIntv = 0;
            if (!Object.count(this.loading)) {
                if (loader.debug) {
                    log('FINISH');
                }
                if (!this.startIntv) {
                    this.status = 'ready';
                    execList(readyFctns);// everything should be loaded by now.
                } else {
                    clearTimeout(this.startIntv);
                    execList(startFctns);
                    this.startIntv = 0;
                    execList(readyFctns);
                    this.readyWaiting = true;
                }
            }
        };
    }

    loader.preloader = new Preloader();

    function scriptTag(key, src, callback, params) {
        var f = doc.createElement('script');
        f.type = 'text/' + (src.type || 'javascript');
        f.src = addVersion(src.src || src, params);
        f.async = false;
        function LoadComplete(evt) {
            if ('readyState' in this) {
                if (this.readyState === 'loaded' || this.readyState === 'complete') {
                    callback(null);
                }
            } else {
                callback(null);
            }
        }

        f.onreadystatechange = LoadComplete;
        f.onload = LoadComplete;
        // use body if available. more safe in IE
        if (doc.body) {
            doc.body.appendChild(f); 
        } else {
            head.appendChild(f);
        }
    }

    // JS
    loader.register('js', function (key, url, callback, params) {
        scriptTag(key, url, callback, params);
    });
    // CSS
    loader.register('css', function (key, url, callback, params) {
        var isIE = /*@cc_on!@*/false,
            src = addVersion(url, params),
            fr;
        if(isIE) {
            console.log('LOAD IE SRC', src);
            // after we are done cursing for having to do this... then
            // IE has a limit of 31 stylesheets that can be loaded. So
            // we are going to load them as text requests and then append them to the document
            // as style tags only in dreadful IE.
            $.get(src,
                function (result) {
                    document.styleSheets[0].cssText += result;
                    callback(null);
                });
        } else {
            fr = document.createElement('link');
            fr.setAttribute('rel', 'stylesheet');
            fr.setAttribute('type', 'text/css');
            fr.setAttribute('href', src);
            head.appendChild(fr);
            // we don't want the ready event to fire. So let's delay before sending back.
            var intv = setTimeout(function () {
                clearTimeout(intv);
                callback(null);
            }, 10);
        }
    });
    // Image
    loader.register('image', function (key, url, callback, params) {
        var src = addVersion(url, params);
        var img = new Image();
        img.onload = function () {
            callback(null);
        };
        img.onabort = function() {// this should already throw a 404 in the browser.
            callback(null);// allow to continue if image fails to load.
        };
        img.src = src;
    });
    // OTHER
    loader.register('text', function (key, url, callback, params) {
        var src = addVersion(url, params);
        var $http = angular.element(document).injector().get('$http');
        $http({method:'GET', url:src}).success(callback);
    });
    //MISC
    loader.register('load');
    

    // W3C
    if (window.addEventListener) {
        doc.addEventListener("DOMContentLoaded", fireReady, false);
        // fallback. this is always called
        window.addEventListener("load", fireReady, false);
        // IE
    } else if (window.attachEvent) {
        // for iframes
        doc.attachEvent("onreadystatechange", function () {
            if (doc.readyState === "complete") {
                fireReady();
            }
        });
        // avoid frames with different domains issue
        var frameElement = 1;
        try {
            frameElement = window.frameElement;
        }
        catch (e) {
        }
        if (!frameElement && head.doScroll) {
              
            (function scrollFrameElem() {
                try {
                    head.doScroll("left");
                    fireReady();

                } catch (e) {
                    setTimeout(scrollFrameElem, 1);
                    return;
                }
            }());
        }

        // fallback
        window.attachEvent("onload", fireReady);
    }


    // enable doc.readyState for Firefox <= 3.5
    if (!doc.readyState && doc.addEventListener) {
        doc.readyState = "loading";
        var handler = null;
        doc.addEventListener("DOMContentLoaded", handler = function () {
            doc.removeEventListener("DOMContentLoaded", handler, false);
            doc.readyState = "complete";
        }, false);
    }



    /*
     We wait for 300 ms before script loading starts. for some reason this is needed
     to make sure scripts are cached. Not sure why this happens yet. A case study:

     https://github.com/headjs/headjs/issues/closed#issue/83
     */
    setTimeout(function () {
        isHeadReady = true;
        processQueue();
    }, 300);

    window.loader = loader;
}(document));
