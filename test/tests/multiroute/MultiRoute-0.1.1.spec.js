/**
 * Copyright 2012 Wes Jones http://www.codeguyz.com/
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
describe("ui.multiRoute", function() {
    describe("ui.multiRoute.MultiRoute", function() {
        var multiRoute,
            $rootScope,
            $location,
            $routeParams,
            $queryString;

        beforeEach(function() {
            $rootScope = {
                previousPath: '',
                currentPath: '',
                $on: function(event) {

                },
                $broadcast: function(event, previousPath, currentPath) {
                    this.previousPath = previousPath;
                    this.currentPath = currentPath;
                },
                $apply: function() {}
            };
            $location = {
                _path: '/',
                path: function() {
                    return this._path;
                },
                search: function() {}
            };
            $routeParams = {};
            $queryString =

            multiRoute = new ui.multiRoute.MultiRoute();
            multiRoute.synchronous = true; // so there are no setTimeouts used which complicate the tests.
            multiRoute.$rootScope = $rootScope;
            multiRoute.$location = $location;
            multiRoute.setup();

            multiRoute.register('alias1', {template:'tpl1.html', controller:'SomeController', 'class':'alias1CssClass'});
            multiRoute.register('alias2', {template:'tpl2.html', controller:'SomeController', 'class':'alias2CssClass'});
            multiRoute.register('page1', {template:'page1.html', controller:'PageController', 'class':'page1'});
            multiRoute.register('layout1', {template:'layout1.html', controller:'LayoutController', 'class':'layout1'});

            multiRoute.when('/:page');
            multiRoute.when('/:page/:header');
            multiRoute.when('/:page/:layout/:body');
        });

        afterEach(function() {
            multiRoute = null;
            $rootScope = null;
            $location = null;
            $routeParams = null;
            $queryString = null;
        });

        it("register should register an alias", function() {
            multiRoute.register('a', {});
            expect(multiRoute.get('a').alias).toBe('a');
        });

        it("group should register a group", function() {
            multiRoute.group('g', '/a/b');
            expect(multiRoute.groups.g).toBe('/a/b');
        });

        it("when should register a pattern and escape slashes", function() {
            multiRoute.when('/:page/:header');
            expect(multiRoute.patterns.indexOf('\\/:page\\/:header')).toBe(1);
        });

        it("otherwise should set a path and return it", function() {
            var result = multiRoute.otherwise('/home');
            expect(result).toBe('/home');
            expect(result).toBe(multiRoute.otherwise());
        });

        it("set should add a path to the queue that will call _processPath", function() {
            var processCalled = false;
            multiRoute._processPath = function(event, queueItem) {
                processCalled = true;
            };
            multiRoute.queue.onNext = multiRoute._processPath.bind(this);
            multiRoute.setPath('/a', {});
            expect(processCalled).toBe(true);
        });

        it("should build a route from a correct path with the correct alias", function() {
            multiRoute.setPath('/alias1');
            var route = multiRoute.routes[0];
            expect(route.page.alias).toBe('alias1');
        });

    });

    describe("MultRouteFilters", function () {

        var filters;

        beforeEach(function () {
            filters = new ui.multiRoute.MultiRouteFilters();
        });

        afterEach(function () {
            filters = null;
        });

        it("should add a path filter", function () {
            var pathFilter = function () {
            };
            filters.addPathFilter(pathFilter);
            expect(filters._pathFilters.length).toBe(1);
        });

        it("addTemporaryPathFilter should add a path filter that only gets executed once", function () {
            var pathFilter = function () {
            };
            filters.addTemporaryPathFilter(pathFilter);
            filters.processPathFilters('/path');
            expect(filters._pathFilters.length).toBe(0);
        });

        it("should execute all path filter on processPathFilters", function () {
            filters.addPathFilter(function (path) {
                return '/none';
            });
            expect(filters.processPathFilters('/somepath')).toBe('/none');
        });

        it("should add a security filter", function () {
            var securityFilter = function () {
            };
            filters.addSecurityFilter(securityFilter);
            expect(filters._securityFilters.length).toBe(1);
        });

        it("should execute all security filters on processSecurityFilter", function () {
            var securityFilter1 = function (path) {
                return '/none';
            };
            var securityFilter2 = function (path) {
                return '/complete';
            };
            filters.addSecurityFilter(securityFilter1);
            filters.addSecurityFilter(securityFilter2);
            expect(filters.processSecurityFilters('/path')).toBe('/complete');
        });

        it("removePathFilter should remove a filter from the function reference", function() {
            var pathFilter = function(){};
            filters.addPathFilter(pathFilter);
            filters.removePathFilter(pathFilter);
            expect(filters._pathFilters.length).toBe(0);
        });

    });
    
    describe("MultiRouteHistory", function () {
        var history;
    
        beforeEach(function () {
            history = new ui.multiRoute.MultiRouteHistory();
        });
    
        afterEach(function () {
            history = null;
        });
    
        function addFakeItems(hist, amount) {
            var params,
                urlParams;
            for (var i = 0; i < amount; i++) {
                urlParams = {name:'name' + 0};
                params = {name:'name' + 0};
                hist.addToHistory('/path' + i, urlParams, params, 1);
            }
        }
    
        it("addToHistory should store a history path at that index", function () {
            var path = '/path',
                urlParams = {name:'test'},
                params = {name:'test'};
            history.addToHistory(path, urlParams, params, 1);
            var item = history.getHistoryAt(0);
            expect(item).toBeDefined();
            expect(item.path).toBe(path);
            expect(item.urlParams).toBe(urlParams);
            expect(item.params).toBe(params);
        });
    
        it("getLastPath should return the object at that history path.", function () {
            var path = '/path',
                urlParams = {name:'test'},
                params = {name:'test'};
            history.addToHistory(path, urlParams, params, 1);
            var item = history.getLastPath();
            expect(item.path).toBe(path);
            expect(item.urlParams).toBe(urlParams);
            expect(item.params).toBe(params);
        });
    
        it("go should change the index by the delta", function () {
            history.go(1);
            expect(history.historyIndex).toBe(0);
        });
    
        it("getHistoryByDelta should return the history by the delta offset", function () {
            addFakeItems(history, 4);
            var result = history.getHistoryByDelta(-1);
            expect(result.path).toBe('/path2');
        });
    
        it("getHistoryAt should return the history at that index", function () {
            addFakeItems(history, 4);
            expect(history.getHistoryAt(0).path).toBe('/path0');
            expect(history.getHistoryAt(1).path).toBe('/path1');
            expect(history.getHistoryAt(2).path).toBe('/path2');
            expect(history.getHistoryAt(3).path).toBe('/path3');
        });
    
        it("howFarBackIsStringInHistory should return the correct index", function () {
            addFakeItems(history, 4);
            expect(history.howFarBackIsStringInHistory('/path1')).toBe(3);
        });
    
        it("getIndexOfLastOccurrenceInHistory", function () {
            addFakeItems(history, 4);
            expect(history.getIndexOfLastOccurrenceInHistory('/path2')).toBe(2);
        });
    
        it("addExclusion should add a path to the exclusions array", function () {
            history.addExclusion('/path');
            expect(history.historyExclusions['/path']).toBe(true);
        });
    
        it("hasExclusion should return true for an excluded path", function () {
            history.addExclusion('/path1');
            expect(history.hasExclusion('/path1')).toBe(true);
        });
    
        it("hasException should return false for a non excluded path", function () {
            history.addExclusion('/path1');
            expect(history.hasExclusion('/path2')).toBe(false);
        });
    
        it("addToHistory should not add a path if it is excluded", function () {
            history.addExclusion('/path1');
            addFakeItems(history, 4);
            expect(history.history.length).toBe(3);
        });
    
        it("clearForwardHistoryIfNotMatchingPath should truncate history if the path does not match at that index", function () {
            addFakeItems(history, 4);
            history.go(-2);
            history.clearForwardHistoryIfNotMatchingPath('/path8', {name:'name8'}, 1);
            expect(history.history.length).toBe(1);
        });
    
        it("_sameAsLastPath should return true if the path is the previous path", function() {
            var path,
                lastItem;
            addFakeItems(history, 4);
            lastItem = history.getHistoryByDelta(-1);
            path = history.mergePathWithUrlParams(lastItem.path, lastItem.urlParams);
            expect(history._sameAsLastPath(path)).toBe(true);
        });
    });
    
    describe("MultiRouteParser", function() {
        var parser,
            path,
            patterns,
            registered;
    
        beforeEach(function() {
            path = '/a/h/!/a/b/!/a/f';
    
            registered = {
                'a': {alias: 'a'},
                'b': {alias: 'b'},
                'h': {alias: 'h'},
                'f': {alias: 'f'}
            };
    
            patterns = [
                '\/:page',
                '\/:page\/:header',
                '\/:page\/:body',
                '\/:page\/:footer'
            ];
            parser = new ui.multiRoute.MultiRouteParser();
    
            this.addMatchers({
                expectRoutesToMatchAliases: function(page, header, body, footer) {
                    return this.actual.length === 3 &&
                        this.actual[0].page.alias === page &&
                        this.actual[0].header.alias === header &&
    
                        this.actual[1].page.alias === page &&
                        this.actual[1].body.alias === body &&
    
                        this.actual[2].page.alias === page &&
                        this.actual[2].footer.alias === footer
                }
            })
        });
    
        it("ungroupPath should ungroup a path into an alias path", function() {
            var aliasPath = parser.ungroupPath('/group', {'group':path});
            expect(aliasPath).toBe(path);
        });
    
        describe("parseRoute", function() {
    
            it("should turn a path into a route with the correct alias", function() {
                var route = parser.parseRoute('/a/h', {}, patterns, registered);
                expect(route.page.alias).toBe('a');
            });
    
            it("should turn a path into a route with the path property set to the path", function() {
                var route = parser.parseRoute('/a/h', {}, patterns, registered);
                expect(route.page.path).toBe('/a/h');
            });
    
            it("should match the first part of a two part pattern", function() {
                var route = parser.parseRoute('/a/h', {}, patterns, registered);
                expect(route.page.alias).toBe('a');
            });
    
            it("should match a path with the second part of a two part pattern", function() {
                var route = parser.parseRoute('/a/h', {}, patterns, registered);
                expect(route.header.alias).toBe('h');
            });
    
            it("should set endOfPath for the last part of the route in the pattern", function() {
                var route = parser.parseRoute('/a/h', {}, patterns, registered);
                expect(route.header.endOfPath).toBe(true);
            });
    
            it("should parse multiple paths into multiple routes", function() {
                var routes = parser.parseRoutes(path.split(parser.sep), patterns, registered);
                expect(routes.length).toBe(3);
            });
    
            it("should parse multiple paths with the correct alias", function() {
                var routes = parser.parseRoutes(path.split(parser.sep), patterns, registered);
                expect(routes[0].header.alias).toBe('h');
                expect(routes[1].body.alias).toBe('b');
                expect(routes[2].footer.alias).toBe('f');
            });
    
            it("should parse multiple paths with the parent parts set on each route", function() {
                var routes = parser.parseRoutes(path.split(parser.sep), patterns, registered);
                expect(routes[0].page.alias).toBe('a');
                expect(routes[1].page.alias).toBe('a');
                expect(routes[2].page.alias).toBe('a');
            });
        });
    
        it("getQuery should take routes and put them into a path", function() {
            var routes = parser.parse(path, [], patterns, registered, {});
            expect(parser.getQuery(routes, {})).toBe(path);
        });
    
        it("addSlashToPath should add a slash to a group path", function() {
            expect(parser.pathToGroupPath('/a/h', {'ah':'/a/h'})).toBe('/ah');
        });
        
        it("stripSlashesFromGroupHash should remove slashes if it is a group path", function() {
            expect(parser.stripSlashFromGroupPath('/ah', {'ah':'/a/h'})).toBe('ah');
        });
    
        it("replacePartInHash should replace only that part in the path", function() {
            expect(parser.replacePartInPath(path, 1, '/a/n')).toBe('/a/h/!/a/n/!/a/f');
        });
    });
    
    describe("MultiRouteQueueItem", function () {
        var item, path, onChange;
    
        beforeEach(function () {
            path = '/a/h/!/a/b/!/a/f';
            onChange = function (queueItem) {
                return true;
            };
            item = new ui.multiRoute.MultiRouteQueueItem('/a/h/!/a/b/!/a/f', {}, {}, 1, onChange);
        });
    
        afterEach(function () {
            path = null;
            item = null;
            onChange = null;
        });
    
        it("should have the correct parts split on construction", function () {
            expect(item.parts['/a/h']).toBe(ui.multiRoute.routeStatus.WAITING);
            expect(item.parts['/a/b']).toBe(ui.multiRoute.routeStatus.WAITING);
            expect(item.parts['/a/f']).toBe(ui.multiRoute.routeStatus.WAITING);
        });
    
        it("setPartialPathStatus should update the status of that part of the path", function () {
            item.setPartialPathStatus({
                alias:'h',
                path:'/a/h',
                endOfPath:true
            }, ui.multiRoute.routeStatus.LOADING);
            expect(item.parts['/a/h']).toBe(ui.multiRoute.routeStatus.LOADING);
        });
    
        it("calculatePartsStatus should return the lowest value of the parts", function () {
            item.setPartialPathStatus({
                alias:'h',
                path:'/a/h',
                endOfPath:true
            }, ui.multiRoute.routeStatus.LOADING);
            expect(item.getStatus(), ui.multiRoute.routeStatus.WAITING);
    
            item.setPartialPathStatus({
                alias:'b',
                path:'/a/b',
                endOfPath:true
            }, ui.multiRoute.routeStatus.LOADING);
            expect(item.getStatus(), ui.multiRoute.routeStatus.WAITING);
    
            item.setPartialPathStatus({
                alias:'f',
                path:'/a/f',
                endOfPath:true
            }, ui.multiRoute.routeStatus.LOADING);
            expect(item.getStatus(), ui.multiRoute.routeStatus.LOADING);
        });
    
        it("addCallback should add a callback to the array for that type", function () {
            var callback = function () {
            };
            item.addCallback(ui.multiRoute.routeStatus.READY, callback);
            expect(item.callbacks[ui.multiRoute.routeStatus.READY].indexOf(callback)).toBe(0);
        });
    });
    
    describe("MultiRouteQueue", function() {
        var queue, history, paths;
    
        beforeEach(function() {
            history = new ui.multiRoute.MultiRouteHistory();
            queue = new ui.multiRoute.MultiRouteQueue(history);
            paths = [
                {path:'/path1', urlParams:{name:'name1'}, params:{name:'name1'}},
                {path:'/path2', urlParams:{name:'name2'}, params:{name:'name2'}}
            ]
        });
    
        afterEach(function() {
            queue = null;
            history = null;
            paths = null;
        });
    
        function addPaths(queue, paths) {
            for(var i = 0; i < paths.length; i += 1) {
                queue.addPath(paths[i].path, paths[i].urlParams, paths[i].params);
            }
        }
    
        it("addPath should process the first item given to it. Expect to receive a MultiRouteQueueItem", function() {
            queue.addPath('/path', {name:'name'});
            var item = queue.getActiveItem();
            expect(item instanceof ui.multiRoute.MultiRouteQueueItem).toBe(true);
            expect(item.path).toBe('/path');
        });
        
        it("addPath should not process the 2nd path until the first path is READY", function() {
            addPaths(queue, paths);
            var item = queue.getActiveItem();
            expect(item.path).toBe('/path1');
    
            item.setPartialPathStatus({
                alias: '/path1',
                path: '/path1',
                endOfPath: true
            }, ui.multiRoute.routeStatus.READY);
    
            var secondItem = queue.getActiveItem();
            expect(secondItem instanceof ui.multiRoute.MultiRouteQueueItem).toBe(true);
            expect(secondItem.path).toBe('/path2');
        });
    
        it("addHistoryPath should add an item into the queue with that delta", function() {
            addPaths(queue, paths);
            queue.addPath(paths[0].path, paths[0].params);
            queue.addPath(paths[1].path, paths[1].params);
            queue.addHistoryPath(-1);
    
            var lastQueuedPath = queue._pendingPaths[queue._pendingPaths.length-1];
            expect(lastQueuedPath.indexDelta).toBe(-1);
        });
    
        /**
         * This test may be confusing. However is is only one test. This needs to setup the situation so that
         * it can perform a history change and validate that it works.
         */
        it("addHistoryPath should be processed by accessing history at the time of processing", function() {
            addPaths(queue, paths);
            queue.addHistoryPath(-1);
            // these get added to history by the module instead of the queue. so we will add them manually for this test.
            queue.history.addToHistory(paths[0].path, paths[0].urlParams, paths[0].params, 1);
            queue.history.addToHistory(paths[1].path, paths[1].urlParams, paths[1].params, 1);
    
            // we must setup the situation for history. So first we are going to complete the first path.
            queue.getActiveItem().setPartialPathStatus({
                alias: 'path1',
                path: paths[0].path,
                pathWithUrlParams: queue.history.mergePathWithUrlParams(paths[0].path, paths[0].urlParams),
                endOfPath: true
            }, ui.multiRoute.routeStatus.READY);
            // now that the first path has been completed we should have the 2nd path.
            // we now need to complete the second path so it can process the third path.
    
            queue.getActiveItem().setPartialPathStatus({
                alias: 'path2',
                path: paths[1].path,
                pathWithUrlParams: queue.history.mergePathWithUrlParams(paths[1].path, paths[1].urlParams),
                endOfPath: true
            }, ui.multiRoute.routeStatus.READY);
    
            // now that the 2nd path has completed the 3rd path can process. Since it is a history path it should now
            // pull from the history to have the correct path at this time of moving in history.
            expect(queue.getActiveItem().path).toBe(paths[0].path);
        });
    });
});