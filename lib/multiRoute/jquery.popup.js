/* Copyright 2012 by Gordon Food Service, Inc.
 *
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of Gordon
 * Food Service, Inc. ("Confidential Information"). You shall not disclose
 * such Confidential Information and shall use it only in accordance with
 * the terms specified by Gordon Food Service.
 *
 */
/*global setTimeout, clearTimeout, window, document, jQuery */
(function ($) {
    'use strict';

    var popupId,
        popups,
        popupOptions,
        aliases,
        stack = [],
        popupPrefix = '__popup',
        popupFindPattern = new RegExp('(' + popupPrefix + '\\d+)'),
        getTargetPos;

    function hasPopups(target) {
        var i;
        for (i in target) {
            if (target.hasOwnProperty(i)) {
                return true;
            }
        }
        return false;
    }

    function getIdFromAlias(id) {
        if (aliases && aliases[id]) {
            id = aliases[id];
        }
        return id;
    }

    function getAliasFromId(id) {
        var i;
        for (i in aliases) {
            if (aliases.hasOwnProperty(i) && aliases[i]) {
                return i;
            }
        }
        return null;
    }

    function getItemThatHasParentClass(focusables, selectedClass) {
        return focusables.filter(function () {
            var parent = $(this).parent(),
                result;
            if (parent.length) {
                while (parent.length && !result) {
                    result = parent.hasClass(selectedClass.substr(1));
                    parent = parent.parent();
                }
            }
            return result;
        });
    }

    function getSelectedElement(focusables, selectedSelection) {
        var selected;
        if (selectedSelection) {
            selected = focusables.filter(selectedSelection);
            if (selected.length === 1) {
                focusables = selected;
            } else {
                selected = getItemThatHasParentClass(focusables, selectedSelection);
                if (selected.length === 1) {
                    focusables = selected;
                }
            }
        }
        return focusables;
    }

    /**
     * @param {Object} elm
     * @param {String=} selectedSelection
     * @param {String=} nonFocusSelections
     * @returns {*}
     */
    function getFocusableElements(elm, selectedSelection, nonFocusSelections) {
        var focusable = elm.find('input:visible,select:visible,checkbox:visible,radio:visible,a:visible'),
            selections;
        if (nonFocusSelections) {
            if (typeof nonFocusSelections === 'String') {
                selections = [nonFocusSelections];
            } else if (nonFocusSelections instanceof Array) {
                selections = nonFocusSelections.slice(0, nonFocusSelections.length);
            }
            while (selections.length) {
                focusable = focusable.not(selections.shift());
            }
        }
        focusable = getSelectedElement(focusable, selectedSelection);
        return focusable;
    }

    function getFocusableElementIndex(container, element, nonFocusSelections) {
        var i, iLen, elements;
        element = element[0] || element;
        elements = getFocusableElements(container, null, nonFocusSelections);
        iLen = elements.length;
        for (i = 0; i < iLen; i += 1) {
            if (elements[i] === element) {
                return i;
            }
        }
        return -1;
    }

    function focusToFocusableElement(elm, index, selectedClass, nonFocusSelections) {
        index = index > 0 ?  index : 0;
        setTimeout(function () {
            // wait to escape the thread so any processing of that template can finish before focusing.
            var focusableElements = getFocusableElements(elm, selectedClass, nonFocusSelections);
            $(focusableElements[index]).focus(); // focus to the first focusableElement
        }, 1);
    }

    function isTab(event) {
        var result = false;
        if (event.keyCode === 9) {
            result = true;
        } else if (event.keyCode === 40 && event.target.tagName !== 'SELECT') {// down arrow
            result = true;
        } else if (event.keyCode === 39 && event.target.tagName !== 'INPUT') {// right arrow
            result = true;
        } else if (event.keyCode === 37 && event.target.tagName !== 'INPUT') {// left arrow
            event.shiftKey = true;
            result = true;
        } else if (event.keyCode === 38 && event.target.tagName !== 'SELECT') {// up arrow
            event.shiftKey = true;
            result = true;
        }
        return result;
    }

    function forEachPopup(popups, fn) {
        var i, g, j, k, len, el;
        if (popups) {
            for (i in popups) {
                if (popups.hasOwnProperty(i)) {
                    g = popups[i];
                    for (j in g) {
                        if (g.hasOwnProperty(j)) {
                            for (k = 0, len = g[j].length; k < len; k += 1) {
                                el = $.popup.getElement(g[j][k]);
                                fn.apply($.popup, [el, i, g, j, k]);
                            }
                        }
                    }
                }
            }
        }
    }

    function isSafeToFocus() {
        // IE9 will actually focus and blur the window. So let's make sure it isn't the window, document, or body.
        return document.activeElement && document.activeElement !== window && document.activeElement !== $('body')[0];
    }

    function focusOut(o) {
        if (isSafeToFocus() && o.focusOutTarget) {
            $(o.focusOutTarget).focus();
        }
    }

    function focusIn(o) {
        // blur what has focus if it is not the window or the document.
        if (isSafeToFocus()) {
            $(o.focusOutTarget).blur();
        }
    }

    /**
     *
     * @private getTargetPos
     * @param container
     * @param target
     * @param direction
     * @param el
     */
    getTargetPos = function (container, target, direction, el) {
        var pos = {},
            toff = target.offset(),
            str = direction.toLowerCase(),
            co;
        pos.left = toff.left;
        pos.top = toff.top;
        if (container) {
            co = container.offset();
            pos.left -= co.left;
            pos.top -= co.top;
            toff.left -= co.left;
            toff.top -= co.top;
        }
        if (str.indexOf('right') !== -1) {
            pos.left = toff.left + target.width();
        } else if (str.indexOf('left') !== -1) {
            pos.left = toff.left - el.width();
        } else if (str.indexOf('center') !== -1) {
            pos.left = toff.left + target.width() * 0.5 - el.width() * 0.5;
        } else if (str.indexOf('end') !== -1) {
            pos.left = toff.left + target.outerWidth() - el.width();
        }

        if (str.indexOf('top') !== -1) {
            pos.top = toff.top - el.height();
        } else if (str.indexOf('bottom') !== -1) {
            pos.top = toff.top + target.height();
        } else if (str.indexOf('middle') !== -1) {
            pos.top = toff.top + target.height() * 0.5 - el.height() * 0.5;
        }
        return pos;
    };

    $.fn.extend({
        popup: function (options) {

            var defaults = {
                    id: null,
                    appendTo: 'body',
                    autoResize: true,
                    autoPosition: true,
                    zIndex: 1000,
                    close: null,
                    escClose: true,
                    overlayClose: true,
                    group: 'none',
                    groupDepth: -1, // if anything other than -1 it will replace it. If it is -1 then it will just append it.
                    groupClose: false,
                    position: null,
                    modal: true,
                    modalClass: null,// an optional class to add to this modal div only. handy for having an invisible modal where all others are not invisible.
                    onOpen: null,
                    onClose: null,
                    modalAutoClose: true, // this allows transitions to call their callback on modal click, and then call $.popup.close() manually after their transition.
                    focusableElementSelectedSelector: '.selected',
                    closeOnClickOutside: false,
                    nonFocusSelections: null,
                    focusEnabled: true
                },
                o,
                self;

            options = $.extend(defaults, options);

            o = options;
            self = this;

            this.open = function () {
                var win = $(window), index, g, id, el, container, modal, oc, f, css;
                if (popups && popups.hasOwnProperty(o.group) && popups[o.group].hasOwnProperty(o.appendTo) && popups[o.group][o.appendTo].hasOwnProperty(o.groupDepth)) {// if they have an index specified. it removes all items higher than that index.
                    index = o.groupDepth;
                    g = popups[o.group];
                    while (g.hasOwnProperty(o.appendTo) && g[o.appendTo].length > index) {
                        $.popup.close(g[o.appendTo][g[o.appendTo].length - 1]);
                    }
                }
                if (!popupId) {
                    popupId = 1;
                }
                if (!popups) {
                    popups = {};
                }
                if (!popupOptions) {
                    popupOptions = {};
                    aliases = {};
                }
                id = popupPrefix + popupId;

                if (!popups[o.group]) {
                    popups[o.group] = {};
                }
                if (!popups[o.group][o.appendTo]) {
                    popups[o.group][o.appendTo] = [];
                }

                if (popups[o.group][o.appendTo].indexOf(id) === -1) {
                    el = $(this);
                    el.detach();
                    popups[o.group][o.appendTo].push(id);
                    popupOptions[id] = o;
                    if (options.id) {
                        aliases[options.id] = id;
                    }

                    win.unbind('resize', $.popup.resize);
                    if (o.autoResize) {
                        win.resize($.popup.resize);
                    }

                    win.unbind('click', $.popup.clickHitDetector);
                    if (o.closeOnClickOutside) {
                        win.click($.popup.clickHitDetector);
                    }

                    container = $(o.appendTo);

                    if (o.modal) {// one modal for each popup.
                        modal = $('<div class="popupModal ' + popupPrefix + popupId + '" style="position:absolute;top:0px;left:0px;width:100%;height:100%;z-index:' + o.zIndex + '"></div>');// popup container
                        if (o.modalClass) {
                            modal.addClass(o.modalClass);
                        }
                        if (o.overlayClose) {
                            modal.bind('click', function (evt) {
                                if (o.modalAutoClose) {
                                    self.close(id);
                                } else {
                                    oc = 'onClose';
                                    f = o[oc];
                                    if (f) {
                                        focusOut(o);
                                        delete o[oc];// remove function so it cannot be called again.
                                        f($('#' + id), o);// call the function after it has been removed.
                                    }
                                }
                            });
                        }
                        container.append(modal);
                    }

                    this.attr('data-popupid', id);

                    css = {
                        position: 'absolute',
                        zIndex: o.zIndex
                    };
                    this.css(css);
                    stack.push(popupPrefix + popupId);

                    popupId += 1;
                    container.append(this);
                    this.updatePos();
                    if (o.onOpen) {
                        o.onOpen(self, o);
                    }
                    if (o.focusEnabled) {
                        this.enableFocus(o);
                    }
                } else {
                    throw new Error("Popup is already open");
                }
            };

            this.open();
            return this;
        },

        enableFocus: function (o) {
            // we want to keep the focus in the popup.
            var blockBlur = function (event) {
                if (isTab(event)) {
                    var elements = getFocusableElements(this),
                        index,
                        length;
                    // if tabbing ouf of the last element. Then focus to the first one.
                    if (!event.shiftKey && elements[elements.length - 1] === event.target) {
                        event.preventDefault();
                        $(elements[0]).focus();
                    } else if (event.shiftKey && document.activeElement === elements[0]) {
                        event.preventDefault();
                        $(elements[elements.length - 1]).focus();
                    } else if (this.has(event.target).length) {
                        event.preventDefault();
                        length = getFocusableElements(this);
                        index = getFocusableElementIndex(this, event.target, o.nonFocusSelections);
                        index += event.shiftKey ? -1 : 1;
                        index = index > length - 1 ? 0 : (index < 0 ? 1 : index);
                        focusToFocusableElement(this, index, null, o.nonFocusSelections);
                    } else if (!this.has(event.target).length) { // if they click to loose focus. bring them back
                        event.preventDefault();
                        focusToFocusableElement(this, 0, null, o.nonFocusSelections);
                    }
                }
            };
            o.blockTabBind = blockBlur.bind(this);
            $(window).keydown(o.blockTabBind);
            o.focusOutTarget = document.activeElement;
            // keep IE window from hiding.
            focusIn(o);
            focusToFocusableElement(this, 0, o.focusableElementSelectedSelector, o.nonFocusSelections);
        },

        updatePos: function () {
            var el = this,
                pos = {},
                id = el.attr('data-popupid'),
                o = popupOptions[id],
                container,
                target,
                direction;
            if (o.position && o.position.hasOwnProperty('target')) {
                target = o.position.target;
                direction = o.position.direction;
                container = this.parent();
                pos = getTargetPos(container, target, direction, this);
                // keep in bounds.
                if (direction === 'right' && pos.left + el.width() > container.width()) {
                    pos = getTargetPos(container, target, 'left', this);
                } else if (direction === 'left' && pos.left - el.width() < 0) {
                    pos = getTargetPos(container, target, 'right', this);
                } else if (direction === 'rightcenter' && pos.left + el.width() > container.width()) {
                    pos = getTargetPos(container, target, 'leftcenter', this);
                } else if (direction === 'leftcenter' && pos.left - el.width() < 0) {
                    pos = getTargetPos(container, target, 'rightcenter', this);
                } else if (direction === 'top' && pos.top - el.height() < 0) {
                    pos = getTargetPos(container, target, 'bottom', this);
                } else if (direction === 'bottom' && pos.top + el.height() > container.height()) {
                    pos = getTargetPos(container, target, 'top', this);
                } else if (direction === 'topcenter' && pos.top - el.height() < 0) {
                    pos = getTargetPos(container, target, 'bottomcenter', this);
                } else if (direction === 'bottomcenter' && pos.top + el.height() > container.height()) {
                    pos = getTargetPos(container, target, 'topcenter', this);
                }
            } else if (o.position) {
                container = $(o.appendTo);
                pos = o.position;// let this be what they specify.
            } else if (o.autoPosition) {// center it.
                pos = {top: '0px', left: '0px', right: '0px', bottom: '0px', margin: 'auto'};
            }
            el.css('opacity', '0');
            setTimeout(function () {
                this.keepInBounds(pos, el, container);
                el.css(pos);
                el.css('opacity', '1');
            }.bind(this), 10);


        },
        close: function (closeGroup) {
            var g,
                el = this,
                id = el.attr('data-popupid'),
                o = popupOptions && popupOptions.hasOwnProperty(id) ? popupOptions[id] : null;
            if (o) { // if not o. then it is already closed.
                if (closeGroup) {
                    g = popups[o.group];
                    while (g[o.appendTo] && g[o.appendTo].length) {
                        $.popup.close(g[o.appendTo][g[o.appendTo].length - 1]);
                    }
                } else {
                    $.popup.close(popups[o.group][o.appendTo][popups[o.group][o.appendTo].length - 1]);
                }
            }
        },
        keepInBounds: function (pos, el, container) {
            el.removeClass('inverted');
            if (!(pos && el && container)) {
                return;
            }
            if (pos.left + el.width() > container.width()) {
                pos.left = container.width() - el.width();
            } else if (pos.left < 0) {
                pos.left = 0;
            }
            if (pos.top + el.height() > container.height()) {
                pos.top = pos.top - el.height() - 45;
                el.addClass('inverted');
            } else if (pos.top < 0) {
                pos.top = 0;
            }
        }
    });

    $.popup = $.fn.popup;
    $.popup.getElement = function (id) {
        id = getIdFromAlias(id);
        return $('*[data-popupid=' + id + ']');
    };
    $.popup.close = function (id) {
        var win, o, f, waitForRecall, g, i, el, modal;
        if (popupOptions) {
            win = $(window);
            id = getIdFromAlias(id);
            if (!id && stack.length) {
                $.popup.close(stack[stack.length - 1]);
                return;
            }
            if (popupOptions.hasOwnProperty(id)) {
                o = popupOptions[id];
                win.unbind('keydown', o.blockTabBind);
                if (o.closeOnClickOutside) {
                    win.unbind('click', $.popup.clickHitDetector);
                }
                if (o.onClose) {// if they still have an onClose. Call that.
                    f = o.onClose;
                    delete o.onClose;// remove function so it cannot be called again.
                    focusOut(o);
                    waitForRecall = f($('#' + id), o);// call the function after it has been removed.
                    if (waitForRecall) {
                        return;
                    }
                }

                if (popupOptions && popupOptions.hasOwnProperty(id)) {
                    delete popupOptions[id];
                    stack.splice(stack.indexOf(id), 1);
                    delete aliases[getAliasFromId(id)];

                    g = popups[o.group];

                    i = g[o.appendTo].indexOf(id);
                    g[o.appendTo].splice(i, 1);

                    el = $.popup.getElement(id);
                    getFocusableElements(el).unbind('blur', o.blockTabBind);
                    el.removeAttr('data-popupid');
                    modal = el.parent().children('.popupModal.' + id);
                    el.remove();
                    if (modal.length) {
                        modal.remove();
                    }
                    if (!g[o.appendTo].length) {
                        delete g[o.appendTo];
                    }
                    if (!hasPopups(popups[o.group])) {
                        delete popups[o.group];
                    }
                }
            }
        }

        if (popups && !hasPopups(popups)) {
            popups = undefined;
            popupOptions = undefined;
            popupId = undefined;
        }
    };
    $.popup.closeOthers = function (id) {
        var i;
        if (popupOptions) {
            if (popupOptions.hasOwnProperty(id)) {
                for (i in popupOptions) {
                    if (popupOptions.hasOwnProperty(i) && i !== id) {
                        $.popup.close(i);
                    }
                }
            }
        }
    };
    $.popup.closeOtherGroups = function (groupId) {
        var i, g;
        if (popups && popups.hasOwnProperty(groupId)) {
            g = popups[groupId];
            for (i in g) {
                if (g.hasOwnProperty(i) && i !== groupId) {
                    while (g[i] && g[i].length) {
                        $.popup.close(g[i][g[i].length - 1]);
                    }
                }
            }
        }
    };
    $.popup.getGroup = function (groupId) {
        return popups && popups[groupId];
    };
    $.popup.closeGroup = function (groupId) {
        var i, g, popupid;
        if (popups && popups.hasOwnProperty(groupId)) {
            g = popups[groupId];
            for (i in g) {
                if (g.hasOwnProperty(i)) {
                    while (g[i] && g[i].length) {
                        popupid = g[i][g[i].length - 1];
                        $.popup.close(popupid);
                    }
                }
            }
        }
    };
    $.popup.closeAllGroups = function () {
        var i;
        if (popups) {
            for (i in popups) {
                if (popups.hasOwnProperty(i)) {
                    $.popup.closeGroup(i);
                }
            }
        }
    };
    $.popup.hitTest = function (x, y) {
        var i, g, j, k, el, offset, len;
        if (popups) {
            for (i in popups) {
                if (popups.hasOwnProperty(i)) {
                    g = popups[i];
                    for (j in g) {
                        if (g.hasOwnProperty(j)) {
                            for (k = 0, len = g[j].length; k < len; k += 1) {
                                el = $.popup.getElement(g[j][k]);
                                offset = el.offset();
                                if (x > offset.left && x < offset.left + el.width() && y > offset.top && y < offset.top + el.height()) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    };
    $.popup.resize = function () {
        var i, g, j, k, el, len;
        if (popups) {
            for (i in popups) {
                if (popups.hasOwnProperty(i)) {
                    g = popups[i];
                    for (j in g) {
                        if (g.hasOwnProperty(j)) {
                            for (k = 0, len = g[j].length; k < len; k += 1) {
                                el = $.popup.getElement(g[j][k]);
                                el.updatePos();
                            }
                        }
                    }
                }
            }
        }
        return false;
    };
    $.popup.clickHitDetector = function (event) {
        // we need to see if any of the popups has this child. if not. close them if their flag is set.
        forEachPopup(popups, function (el) {
            if (el[0] !== event.target && !el.has(event.target).length) {
                var id = el.attr('data-popupid'),
                    o = popupOptions && popupOptions.hasOwnProperty(id) ? popupOptions[id] : null;
                if (o.closeOnClickOutside) {
                    $.popup.close(id);
                }
            }
        });
    };

    $.popup.setGroupOptions = function (groupId, key, value) {
        var g, i, x, popupid;
        if (popups && popups.hasOwnProperty(groupId)) {
            g = popups[groupId];
            for (i in g) {
                if (g.hasOwnProperty(i)) {
                    for (x = 0; x < g[i].length; x += 1) {
                        popupid = g[i][x];
                        popupOptions[popupid][key] = value;
                    }
                }
            }
        }
    };

    $.popup.hasGroup = function (group) {
        return (popups && popups[group] !== undefined);
    };
}(jQuery));
