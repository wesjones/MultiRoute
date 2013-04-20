(function () {
    'use strict';
    // Declare app level module which depends on filters, and services
    angular.module('mr', ['multiRoute']).
        // this needs to be executed during run instead of config.
    run(['$multiRoute', function ($multiRoute) {
        // we are going to register a set of aliases to a path. The alias name refers to the configuration of that
        // view that can be loaded via a multiview or a popup.
        $multiRoute.register('a', {template:'partials/a.html', controller:'CtrlLayoutA', 'class':'view-A'});
        $multiRoute.register('b', {template:'partials/b.html', controller:'CtrlLayoutB', 'class':'view-B'});
        $multiRoute.register('c', {template:'partials/c.html', controller:'CtrlLayoutC', 'class':'view-C'});
        $multiRoute.register('d', {template:'partials/d.html', controller:'CtrlLayoutD', 'class':'view-D'});

        // these registersions are similar to angular. The path of the template. The controller as a string or
        // javascript class.
        $multiRoute.register('ha', {template:'partials/headers/ha.html', controller:'CtrlHeaderA', 'class':'HA'});
        $multiRoute.register('hb', {template:'partials/headers/hb.html', controller:'CtrlHeaderB', 'class':'HB'});
        $multiRoute.register('hc', {template:'partials/headers/hc.html', controller:'CtrlHeaderC', 'class':'HC'});
        $multiRoute.register('hd', {template:'partials/headers/hd.html', controller:'CtrlHeaderD', 'class':'HD', transitionOnParamsOnlyChange:true});

        // notice the 'class' attribute at the end. This css class is automatically assigned to the top level dom element
        // in the partial when it is loaded. This allows you to reuse partials and make them look different.
        $multiRoute.register('ca', {template:'partials/contents/contA.html', controller:'CtrlContentA', 'class':'CA'});
        $multiRoute.register('cb', {template:'partials/contents/contB.html', controller:'CtrlContentB', 'class':'CB'});
        $multiRoute.register('cc', {template:'partials/contents/contC.html', controller:'CtrlContentC', 'class':'CC'});
        $multiRoute.register('cd', {template:'partials/contents/contD.html', controller:'CtrlContentD', 'class':'CD'});

        $multiRoute.register('ba', {template:'partials/bodies/bodyA.html', controller:'CtrlBodyA', 'class':'BA'});
        $multiRoute.register('bb', {template:'partials/bodies/bodyB.html', controller:'CtrlBodyB', 'class':'BB'});
        $multiRoute.register('bc', {template:'partials/bodies/bodyC.html', controller:'CtrlBodyC', 'class':'BC'});
        $multiRoute.register('bd', {template:'partials/bodies/bodyD.html', controller:'CtrlBodyD', 'class':'BD'});

        $multiRoute.register('fa', {template:'partials/footers/footA.html', controller:'CtrlFootA', 'class':'FA'});
        $multiRoute.register('fb', {template:'partials/footers/footB.html', controller:'CtrlFootB', 'class':'FB'});
        $multiRoute.register('fc', {template:'partials/footers/footC.html', controller:'CtrlFootC', 'class':'FC'});
        $multiRoute.register('fd', {template:'partials/footers/footD.html', controller:'CtrlFootD', 'class':'FD'});

        function pathFilter(path) {
            return path;
        }

        // allow you to filter paths before multiRoute will use them.
        // multiRoute will always pass the path that it is going to go to here before it uses it. MultiRoute will use
        // what is returned from the method that is registered in addPathFilter.
        // this makes it convenient to make certain paths such as login come before they can get to other pages in
        // your application.
        $multiRoute.addPathFilter(pathFilter);

        // the default path for your application to start at.
        $multiRoute.otherwise('/a');// url friendly

        // the patterns that your application will use to determine your routes.
        // :page refers to the <div ui-multiview target="page"></div> that needs to be found somewhere in your app.
        // it can be in a loaded view or the main html page of your app. Target will load what it matches in it's pattern.
        // after the first pattern is matched it then goes on to the next pattern.
        // so a pattern that is made of /myHeader/!/myContent/!/myFooter with this set of patterns
        // $multiRoute.when('/:header');
        // $multiRoute.when('/:content');
        // $multiRoute.when('/:footer');
        // will load the myHeader alias into the <div ui-multiview target="header"></div> multiView that is in your
        // html.
        // the next will load into <div ui-multiview target="content"></div> with myContent and
        // the next will load into <div ui-multiview target="footer"></div> with myFooter
        // these examples below are setup for demonstration.
        $multiRoute.when('/:page');
        $multiRoute.when('/:page/:header');
        $multiRoute.when('/:page/:body');
        $multiRoute.when('/:page/:footer');
        $multiRoute.when('/:page/:content/:body');
        $multiRoute.when('/:page/:content/:footer');

        // this shows how to use alias groups.
        // an alias group is just making another alias that refers to a full pattern of aliases.
        // so /groupa now when it is read into multiRoute will mean /a/hd/!/a/ca/ba/!/a/ca/fa instead
        // and load those views. These are basically cloaking the url to make your patterns simpler.
        // only views that changed in the url will change in the application.
        $multiRoute.group('/aha', '/a/ha');
        $multiRoute.group('/ahb', '/a/hb');
        $multiRoute.group('/ahc', '/a/hc');
        $multiRoute.group('/ahd', '/a/hd');
        $multiRoute.group('/groupa', '/a/hd/!/a/ca/ba/!/a/ca/fa');
        $multiRoute.group('/groupb', '/a/hd/!/a/ca/bb/!/a/ca/fb');
        $multiRoute.group('/groupc', '/a/hd/!/a/ca/bc/!/a/ca/fc');
        $multiRoute.group('/groupd', '/a/hd/!/a/ca/bd/!/a/ca/fd');

        // make your application start on the otherwise on every visit.
        $multiRoute.startOnOtherwise = true;
    }]);
}());