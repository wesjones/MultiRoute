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
(function ($) {
    'use strict';
    var drillHistory = {};
    var drillState = {};

    function drillUp(group, name) {
        return drillHistory[group].indexOf(name) !== -1;
    }

    var transitions = {
        /**
         * transition the item in. force the drill state by setting true/false for the drill state. optional.
         * @param forceDrillState
         */
        transIn:function (forceDrillState) {
            var o = this.data('options');
            if (forceDrillState !== undefined) {
                drillState[o.group] = forceDrillState;
            }
            if (o.show) {
                o.show.apply(this);
                return;
            }
            this.execTransition('create', null, typeof o.showClass === 'function' ? o.showClass.apply(this) : o.showClass, o.duration);
        },
        /**
         * transition the item out. force the drill state by setting true/false for the drill state. optional.
         * @param forceDrillState
         */
        transOut:function (forceDrillState) {
            var o = this.data('options');
            if (forceDrillState !== undefined) {
                drillState[o.group] = forceDrillState;
            }
            if(o) {
                if (o.hide) {
                    o.hide.apply(this);
                    return;
                }
                this.execTransition('destroy', o.destroy, typeof o.hideClass === 'function' ? o.hideClass.apply(this) : o.hideClass, o.duration);
            }
        },
        /**
         * Do all the heavy lifting of the animation. Just need the css class and the pre-passed variables.
         * @param type
         * @param destroy
         * @param cls
         * @param duration
         */
        execTransition:function (type, destroy, cls, duration) {
            var o = this.data('options');
            var el = $(this);
            var intv = null;
            var callback = function (evt) {
                //                        console.log('   - FINISH', el.attr('id'), cls, type, 'complete');
                el[0].removeEventListener('webkitAnimationEnd', callback);

                if (o.onTransition) {
                        o.onTransition(el, o, type === 'destroy');
                }
                el.removeClass(cls);
                if (type === 'destroy' && destroy) {
                    destroy.apply(el);
                }
                clearTimeout(intv);
            };
            el[0].addEventListener('webkitAnimationEnd', callback);
            el.addClass(cls);
            intv = setTimeout(callback, duration || o.duration);// maximum of one second to complete. otherwise force callback.
//            console.log('   slide addClass(' + cls + ')', el.attr('id'), el[0].className);
        },
        transition:function (options) {

            var defaults = {
                group:'',
                name:'',
                duration:1000,
                show:null,
                hide:null,
                onTransition:null,
                destroy:null,
                showClass:null, //function(drillUp)|string
                hideClass:null // funciton(drillUp)|string
            };

            switch (options.type) {
                case 'slide':
                    if (!(drillHistory.hasOwnProperty(options.group))) {
                        drillHistory[options.group] = [];
                    }
                    angular.extend(defaults, {
                        showClass:function () {
                            var o = this.data('options');
                            return drillState[o.group] ? 'ltc' : 'rtc'; // move from left to center || move from right to center
                        },
                        hideClass:function () {
                            var o = this.data('options');
                            return drillState[o.group] ? 'ctr' : 'ctl'; // move from center to right || move from center to left
                        }
                    });

                    drillState[options.group] = drillUp(options.group, options.name);

                    var hist = drillHistory[options.group];
                    if (drillState[options.group]) { // since we are drilling up. We need to remove all items after that index since it already exists.
                        var index = hist.indexOf(options.name);
                        hist.splice(index + 1, hist.length - index);
                    } else {
                        hist.push(options.name);
                    }
                    break;
                case 'fade':
                    angular.extend(defaults, {
                        showClass:'fadeIn',
                        hideClass:'fadeOut'
                    });
                    break;
                case 'pop':
                    angular.extend(defaults, {
                        showClass:'pop',
                        hideClass:'unpop'
                    });
                    break;
            }

            options = angular.extend(defaults, options);

            var o = options;

            for(var i = 0; i < this.length; i+=1) {
                $(this[i]).data('options', o);
            }

            return this;
        }
    };

    for(var i in transitions) {
        if(transitions.hasOwnProperty(i)) {
            $.prototype[i] = transitions[i];
        }
    }
}(angular.element));