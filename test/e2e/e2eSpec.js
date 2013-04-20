/** A Sample Angular E2E test */
/*global browser, element, sleep */
describe('MultiRouteMin e2e', function () {

    function createTestLink (index, hash, patterns) {
        element(".link:eq("+index+")").click();
        // must wait a half second for the transition to finish.
        sleep(0.5);
        expect(browser().window().hash()).toBe(hash);
        var content = element("div[data-target=page]").html();
        for(var i = 0; i < patterns.length; i+=1) {
            expect(content).toMatch(patterns[i]);
        }
    }

    it("Navigate to index", function() {
        browser().navigateTo('/multiRouteMin/index.html#/a');
    });

    it('Should have 51 links', function() {
        var rowCount = repeater('.linkWrapper', 'links').count();
        expect(rowCount).toBe(51);
//        sleep(2)
        expect(element('.link').count(), 'nav').toBe(51);
    });

    it('click on link 0', function () {
        createTestLink(0, '/a', [/A/]);
    });

    it('click on link 1', function () {
        createTestLink(1, '/aha?test=a%20ha', [/Header A/, /\{\"test\":\"a ha\"\}/]);
    });

    it('click on link 2', function () {
        createTestLink(2, '/ahb?test=a%20hb', [/Header B/, /\{\"test\":\"a hb\"\}/]);
    });

    it('click on link 3', function () {
        createTestLink(3, '/ahc?test=a%20hc', [/Header C/, /\{\"test\":\"a hc\"\}/]);
    });

    it('click on link 4', function () {
        createTestLink(4, '/ahd?test=a%20hd0', [/Header D/, /\{\"test\":\"a hd0\"\}/]);
    });

    it('click on link 5', function () {
        createTestLink(5, '/ahd?test=a%20hd1', [/Header D/, /\{\"test\":\"a hd1\"\}/]);
    });

    it('click on link 6', function () {
        createTestLink(6, '/ahd?test=a%20hd2', [/Header D/, /\{\"test\":\"a hd2\"\}/]);
    });

    it('click on link 7', function () {
        createTestLink(7, '/ahd?test=a%20hd3', [/Header D/, /\{\"test\":\"a hd3\"\}/]);
    });

    it('click on link 8', function () {
        createTestLink(8, '/ahd?test=a%20hd4', [/Header D/, /\{\"test\":\"a hd4\"\}/]);
    });

    it('click on link 9', function () {
        createTestLink(9, '/groupa', [/Content A/, /Header D/, /Body A/, /Foot A/]);
    });

    it('click on link 10', function () {
        createTestLink(10, '/groupb', [/Content A/, /Header D/, /Body B/, /Foot B/]);
    });

    it('click on link 11', function () {
        createTestLink(11, '/groupc', [/Content A/, /Header D/, /Body C/, /Foot C/]);
    });

    it('click on link 12', function () {
        createTestLink(12, '/groupd', [/Content A/, /Header D/, /Body D/, /Foot D/]);
    });

    // 13 - 16 are groupa - groupd

    it('click on link 17', function () {
        createTestLink(17, '/a/hd/!/a/cb/ba/!/a/cb/fa', [/Content B/, /Header D/, /Body A/, /Foot A/]);
    });

    it('click on link 18', function () {
        createTestLink(18, '/a/hd/!/a/cb/bb/!/a/cb/fb', [/Content B/, /Header D/, /Body B/, /Foot B/]);
    });
});
