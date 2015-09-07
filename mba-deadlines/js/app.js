(function () {
    'use strict';

    angular
        .module('mba-deadlines', ['ngResource', 'ui.router', 'ngDialog', 'ngSanitize', 'froala', 'ngCookies'])
        .value('froalaConfig', {
            inlineMode: false
        }).run(runBlock)
        .config(indexConfig);

    // Run Function
    runBlock.$inject = ['$rootScope', '$state', '$cookies'];

    function runBlock($rootScope, $state, $cookies) {
        $rootScope.authorized = false;
        $rootScope.admin = false;

        $rootScope.$on('$stateChangeStart', function (event, toState, toStateParams) {
            if (toState.redirectTo) {
                event.preventDefault();
                $state.go(toState.redirectTo);
            }

            if (!$cookies.get('auth')) {
                $rootScope.authorized = false;
            } else {
                $rootScope.authorized = true;
            }

            if (!$cookies.get('admin')) {
                $rootScope.admin = false;
            } else {
                $rootScope.admin = true;
            }
        });

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toStateParams) {
            if (toState.data) {
                if (toState.data.requireAuth) {
                    if (!$rootScope.authorized) {
                        console.log('not auth');
                        $state.go('login');
                    }
                } else if (toState.data.admin) {
                    if (!$rootScope.admin) {
                        $state.go('admin-login');
                    }
                }
            }
        });
    }

    // Index State (route)
    indexConfig.$inject = ['$stateProvider', '$urlRouterProvider', '$httpProvider'];

    function indexConfig($stateProvider, $urlRouterProvider, $httpProvider) {
        $urlRouterProvider.otherwise('/home');

        $stateProvider.state('index', {
            abstract: true,
            views: {
                'navigation': {
                    templateUrl: 'shared/navigation/navigation.tpl.html',
                    controller: 'Navigation',
                    controllerAs: 'nav'
                }
            }
        });

        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
}());
(function() {
	'use strict';

	angular
		.module('mba-deadlines')
		.controller('Navigation', NavigationController);

	NavigationController.$inject = ['$state', '$cookies', '$rootScope'];
	function NavigationController($state, $cookies, $rootScope) {

		// Local Variables
		var vm = this;

		// Exposed Variables
		vm.state = $state;

		// Exposed Functions
		vm.isLandingPage = isLandingPage;
		vm.isLoginPage = isLoginPage;
		vm.isSignupPage = isSignupPage;
		vm.signout = signout;

		// Implementations
		function isLandingPage() {
			return vm.state.is('landing-page');
		}

		function isLoginPage() {
			return vm.state.is('login');
		}

		function isSignupPage() {
			return vm.state.is('signup');
		}

		function signout() {
			$cookies.remove('auth');
			$rootScope.authorized = false;
			$rootScope.portalUser = {};
			$state.go('landing-page');
		}
	}
}());

angular.module('froala', []).
	value('froalaConfig', {}).
	directive('froala', ['froalaConfig', '$timeout', function(froalaConfig, $timeout) {
		"use strict"; //Scope strict mode to only this directive
		froalaConfig = froalaConfig || {};
		var froalaEvents = ['afterPaste','afterRemoveImage','afterSave','afterUploadPastedImage','afterImageUpload','align','backColor','badLink','beforeDeleteImage','beforeFileUpload','beforeImageUpload','beforePaste','beforeRemoveImage','beforeSave','blur','bold','cellDeleted','cellHorizontalSplit','cellInsertedAfter','cellInsertedBefore','cellVerticalSplit','cellsMerged','columnDeleted','columnInsertedAfter','columnInsertedBefore','contentChanged','fileError','fileUploaded','focus','fontFamily','fontSize','foreColor','formatBlock','htmlHide','htmlShow','imageAltSet','imageDeleteError','imageDeleteSuccess','imageError','imageFloatedLeft','imageFloatedNone','imageFloatedRight','imageInserted','imageLinkInserted','imageLinkRemoved','imageLoaded','imageReplaced','imagesLoadError','imagesLoaded','indent','initialized','italic','linkInserted','linkRemoved','onPaste','orderedListInserted','outdent','redo','rowDeleted','rowInsertedAbove','rowInsertedBelow','saveError','selectAll','strikeThrough','subscript','superscript','tableDeleted','tableInserted','underline','undo','unorderedListInserted','videoError','videoFloatedLeft','videoFloatedNone','videoFloatedRight','videoInserted','videoRemoved'];
		var generatedIds = 0;
		var slugToEventName = function(slug){
			if(slug.search('froalaEvent') >= 0){
				slug = slug.replace('froalaEvent', '');
				return slug.charAt(0).toLowerCase() + slug.slice(1);
			}else{
				//not presented as a froala event
				return false;
			}
		};

		var eventNameToSlug = function(eventName){
			var slug = 'froalaEvent' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
			return slug;
		};

		var scope = {
			froala : '='
		};

		for (var i = 0; i < froalaEvents.length; i++) {
		   scope[froalaEvents[i]] = '=' + eventNameToSlug(froalaEvents[i]);
		}

		return {
			restrict: 'A',
			require: 'ngModel',
			scope: scope,
			link: function(scope, element, attrs, ngModel) {
				if(!(element instanceof jQuery)){
					throw "Froala requires jQuery, are you loading it before Angular?";
				}

				var defaultOptions = {};
				var contentChangedCallback;
				var options = angular.extend({}, froalaConfig, scope.froala);
				if(options.contentChangedCallback){
					contentChangedCallback = options.contentChangedCallback;
					delete options.contentChangedCallback;
				}

				// generate an ID if not present
        if (!attrs.id) {
          attrs.$set('id', 'froala-' + generatedIds++);
        }

				var updateView = function () {
					var returnedHtml = element.editable('getHTML');
					var theHTML;
					if(angular.isArray(returnedHtml) && angular.isString(returnedHtml[0])){
						theHTML = returnedHtml[0];
					}else if(angular.isString(returnedHtml)){
						theHTML = returnedHtml;
					}else{
						console.error('We received an unexpected format for the html');
						return;
					}

					ngModel.$setViewValue(theHTML);
					if (!scope.$root.$$phase) {
						scope.$apply();
					}
				};

				options.contentChangedCallback = function () {
					if(contentChangedCallback)
						contentChangedCallback();
					updateView();
				};

				ngModel.$render = function(){
					element.editable('setHTML', ngModel.$viewValue || '', true);
					element.editable('initUndoRedo');
				};

				var froala = element.editable(options).data('fa.editable');

				froala.$element.on('blur keyup change', function(e){
					updateView();
				});

				var registerEventAndCallback = function(eventName, callback){
			  	if(eventName && callback){
			  		var el;
			  		var realEventName;

			  		if(froalaEvents.indexOf(eventName) > -1){
			  			el = element;
			  			realEventName = 'editable.' + eventName;
			  		}else{
			  			el = froala.$element;
			  			realEventName = eventName;
			  		}

			  		el.on(realEventName, callback);
			  	}
				};

				//register passed events
				for (var attrKey in attrs) {
				  if (attrs.hasOwnProperty(attrKey)) {
				  	var eventName = slugToEventName(attrKey); //returns false if not an event
				  	if(eventName){
				  		registerEventAndCallback(eventName, scope[eventName]);
				  	}
				  }
				}

				for(var optKey in options.events){
					if (options.events.hasOwnProperty(optKey)) {
						registerEventAndCallback(optKey, options.events[optKey]);
					}
				}

				// the froala instance to the options object to make methods available in parent scope
				if(scope.froala){
					scope.froala.froala = angular.bind(element, $(attrs.id).editable);
				}

				scope.$watch('froala', function(n, o){
					for (var key in n) {
						if (n.hasOwnProperty(key)) {
							if(n[key] != o[key]){
								element.editable('option', key, n[key]);
							}
						}
					}
				}, true);

				scope.$on('$destroy', function(){
					froala.destroy();
				});
			}
		};
 }]);
/**
 * Orignally textAngular-sanitaize
 * https://github.com/fraywing/textAngular
 */

/**
 * @license AngularJS v1.3.0-build.2711+sha.facd904
 * (c) 2010-2014 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular, undefined) {'use strict';

var $sanitizeMinErr = angular.$$minErr('$sanitize');

/**
 * @ngdoc module
 * @name ngSanitize
 * @description
 *
 * # ngSanitize
 *
 * The `ngSanitize` module provides functionality to sanitize HTML.
 *
 *
 * <div doc-module-components="ngSanitize"></div>
 *
 * See {@link ngSanitize.$sanitize `$sanitize`} for usage.
 */

/*
 * HTML Parser By Misko Hevery (misko@hevery.com)
 * based on:  HTML Parser By John Resig (ejohn.org)
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 *
 * // Use like so:
 * htmlParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 */


/**
 * @ngdoc service
 * @name $sanitize
 * @function
 *
 * @description
 *   The input is sanitized by parsing the html into tokens. All safe tokens (from a whitelist) are
 *   then serialized back to properly escaped html string. This means that no unsafe input can make
 *   it into the returned string, however, since our parser is more strict than a typical browser
 *   parser, it's possible that some obscure input, which would be recognized as valid HTML by a
 *   browser, won't make it through the sanitizer.
 *   The whitelist is configured using the functions `aHrefSanitizationWhitelist` and
 *   `imgSrcSanitizationWhitelist` of {@link ng.$compileProvider `$compileProvider`}.
 *
 * @param {string} html Html input.
 * @returns {string} Sanitized html.
 *
 * @example
   <example module="ngSanitize" deps="angular-sanitize.js">
   <file name="index.html">
     <script>
       function Ctrl($scope, $sce) {
         $scope.snippet =
           '<p style="color:blue">an html\n' +
           '<em onmouseover="this.textContent=\'PWN3D!\'">click here</em>\n' +
           'snippet</p>';
         $scope.deliberatelyTrustDangerousSnippet = function() {
           return $sce.trustAsHtml($scope.snippet);
         };
       }
     </script>
     <div ng-controller="Ctrl">
        Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Directive</td>
           <td>How</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="bind-html-with-sanitize">
           <td>ng-bind-html</td>
           <td>Automatically uses $sanitize</td>
           <td><pre>&lt;div ng-bind-html="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind-html="snippet"></div></td>
         </tr>
         <tr id="bind-html-with-trust">
           <td>ng-bind-html</td>
           <td>Bypass $sanitize by explicitly trusting the dangerous value</td>
           <td>
           <pre>&lt;div ng-bind-html="deliberatelyTrustDangerousSnippet()"&gt;
&lt;/div&gt;</pre>
           </td>
           <td><div ng-bind-html="deliberatelyTrustDangerousSnippet()"></div></td>
         </tr>
         <tr id="bind-default">
           <td>ng-bind</td>
           <td>Automatically escapes</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
       </div>
   </file>
   <file name="protractor.js" type="protractor">
     it('should sanitize the html snippet by default', function() {
       expect(element(by.css('#bind-html-with-sanitize div')).getInnerHtml()).
         toBe('<p>an html\n<em>click here</em>\nsnippet</p>');
     });

     it('should inline raw snippet if bound to a trusted value', function() {
       expect(element(by.css('#bind-html-with-trust div')).getInnerHtml()).
         toBe("<p style=\"color:blue\">an html\n" +
              "<em onmouseover=\"this.textContent='PWN3D!'\">click here</em>\n" +
              "snippet</p>");
     });

     it('should escape snippet without any filter', function() {
       expect(element(by.css('#bind-default div')).getInnerHtml()).
         toBe("&lt;p style=\"color:blue\"&gt;an html\n" +
              "&lt;em onmouseover=\"this.textContent='PWN3D!'\"&gt;click here&lt;/em&gt;\n" +
              "snippet&lt;/p&gt;");
     });

     it('should update', function() {
       element(by.model('snippet')).clear();
       element(by.model('snippet')).sendKeys('new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-html-with-sanitize div')).getInnerHtml()).
         toBe('new <b>text</b>');
       expect(element(by.css('#bind-html-with-trust div')).getInnerHtml()).toBe(
         'new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-default div')).getInnerHtml()).toBe(
         "new &lt;b onclick=\"alert(1)\"&gt;text&lt;/b&gt;");
     });
   </file>
   </example>
 */
function $SanitizeProvider() {
  this.$get = ['$$sanitizeUri', function($$sanitizeUri) {
    return function(html) {
      var buf = [];
      htmlParser(html, htmlSanitizeWriter(buf, function(uri, isImage) {
        return !/^unsafe/.test($$sanitizeUri(uri, isImage));
      }));
      return buf.join('');
    };
  }];
}

function sanitizeText(chars) {
  var buf = [];
  var writer = htmlSanitizeWriter(buf, angular.noop);
  writer.chars(chars);
  return buf.join('');
}


// Regular Expressions for parsing tags and attributes
var START_TAG_REGEXP =
       /^<\s*([\w:-]+)((?:\s+[\w:-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)\s*>/,
  END_TAG_REGEXP = /^<\s*\/\s*([\w:-]+)[^>]*>/,
  ATTR_REGEXP = /([\w:-]+)(?:\s*=\s*(?:(?:"((?:[^"])*)")|(?:'((?:[^'])*)')|([^>\s]+)))?/g,
  BEGIN_TAG_REGEXP = /^</,
  BEGING_END_TAGE_REGEXP = /^<\s*\//,
  COMMENT_REGEXP = /<!--(.*?)-->/g,
  DOCTYPE_REGEXP = /<!DOCTYPE([^>]*?)>/i,
  CDATA_REGEXP = /<!\[CDATA\[(.*?)]]>/g,
  SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
  // Match everything outside of normal chars and " (quote character)
  NON_ALPHANUMERIC_REGEXP = /([^\#-~| |!])/g;


// Good source of info about elements and attributes
// http://dev.w3.org/html5/spec/Overview.html#semantics
// http://simon.html5.org/html-elements

// Safe Void Elements - HTML5
// http://dev.w3.org/html5/spec/Overview.html#void-elements
var voidElements = makeMap("area,br,col,hr,img,wbr");

// Elements that you can, intentionally, leave open (and which close themselves)
// http://dev.w3.org/html5/spec/Overview.html#optional-tags
var optionalEndTagBlockElements = makeMap("colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr"),
    optionalEndTagInlineElements = makeMap("rp,rt"),
    optionalEndTagElements = angular.extend({},
                                            optionalEndTagInlineElements,
                                            optionalEndTagBlockElements);

// Safe Block Elements - HTML5
var blockElements = angular.extend({}, optionalEndTagBlockElements, makeMap("address,article," +
        "aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5," +
        "h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,script,section,table,ul"));

// Inline Elements - HTML5
var inlineElements = angular.extend({}, optionalEndTagInlineElements, makeMap("a,abbr,acronym,b," +
        "bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s," +
        "samp,small,span,strike,strong,sub,sup,time,tt,u,var"));


// Special Elements (can contain anything)
var specialElements = makeMap("script,style");

var validElements = angular.extend({},
                                   voidElements,
                                   blockElements,
                                   inlineElements,
                                   optionalEndTagElements);

//Attributes that have href and hence need to be sanitized
var uriAttrs = makeMap("background,cite,href,longdesc,src,usemap");
var validAttrs = angular.extend({}, uriAttrs, makeMap(
    'abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,'+
    'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,'+
    'ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,'+
    'scope,scrolling,shape,size,span,start,summary,target,title,type,'+
    'valign,value,vspace,width'));

function makeMap(str) {
  var obj = {}, items = str.split(','), i;
  for (i = 0; i < items.length; i++) obj[items[i]] = true;
  return obj;
}


/**
 * @example
 * htmlParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 * @param {string} html string
 * @param {object} handler
 */
function htmlParser( html, handler ) {
  var index, chars, match, stack = [], last = html;
  stack.last = function() { return stack[ stack.length - 1 ]; };

  while ( html ) {
    chars = true;

    // Make sure we're not in a script or style element
    if ( !stack.last() || !specialElements[ stack.last() ] ) {

      // Comment
      if ( html.indexOf("<!--") === 0 ) {
        // comments containing -- are not allowed unless they terminate the comment
        index = html.indexOf("--", 4);

        if ( index >= 0 && html.lastIndexOf("-->", index) === index) {
          if (handler.comment) handler.comment( html.substring( 4, index ) );
          html = html.substring( index + 3 );
          chars = false;
        }
      // DOCTYPE
      } else if ( DOCTYPE_REGEXP.test(html) ) {
        match = html.match( DOCTYPE_REGEXP );

        if ( match ) {
          html = html.replace( match[0], '');
          chars = false;
        }
      // end tag
      } else if ( BEGING_END_TAGE_REGEXP.test(html) ) {
        match = html.match( END_TAG_REGEXP );

        if ( match ) {
          html = html.substring( match[0].length );
          match[0].replace( END_TAG_REGEXP, parseEndTag );
          chars = false;
        }

      // start tag
      } else if ( BEGIN_TAG_REGEXP.test(html) ) {
        match = html.match( START_TAG_REGEXP );

        if ( match ) {
          html = html.substring( match[0].length );
          match[0].replace( START_TAG_REGEXP, parseStartTag );
          chars = false;
        }
      }

      if ( chars ) {
        index = html.indexOf("<");

        var text = index < 0 ? html : html.substring( 0, index );
        html = index < 0 ? "" : html.substring( index );

        if (handler.chars) handler.chars( decodeEntities(text) );
      }

    } else {
      html = html.replace(new RegExp("(.*)<\\s*\\/\\s*" + stack.last() + "[^>]*>", 'i'),
        function(all, text){
          text = text.replace(COMMENT_REGEXP, "$1").replace(CDATA_REGEXP, "$1");

          if (handler.chars) handler.chars( decodeEntities(text) );

          return "";
      });

      parseEndTag( "", stack.last() );
    }

    if ( html == last ) {
      throw $sanitizeMinErr('badparse', "The sanitizer was unable to parse the following block " +
                                        "of html: {0}", html);
    }
    last = html;
  }

  // Clean up any remaining tags
  parseEndTag();

  function parseStartTag( tag, tagName, rest, unary ) {
    tagName = angular.lowercase(tagName);
    if ( blockElements[ tagName ] ) {
      while ( stack.last() && inlineElements[ stack.last() ] ) {
        parseEndTag( "", stack.last() );
      }
    }

    if ( optionalEndTagElements[ tagName ] && stack.last() == tagName ) {
      parseEndTag( "", tagName );
    }

    unary = voidElements[ tagName ] || !!unary;

    if ( !unary )
      stack.push( tagName );

    var attrs = {};

    rest.replace(ATTR_REGEXP,
      function(match, name, doubleQuotedValue, singleQuotedValue, unquotedValue) {
        var value = doubleQuotedValue
          || singleQuotedValue
          || unquotedValue
          || '';

        attrs[name] = decodeEntities(value);
    });
    if (handler.start) handler.start( tagName, attrs, unary );
  }

  function parseEndTag( tag, tagName ) {
    var pos = 0, i;
    tagName = angular.lowercase(tagName);
    if ( tagName )
      // Find the closest opened tag of the same type
      for ( pos = stack.length - 1; pos >= 0; pos-- )
        if ( stack[ pos ] == tagName )
          break;

    if ( pos >= 0 ) {
      // Close all the open elements, up the stack
      for ( i = stack.length - 1; i >= pos; i-- )
        if (handler.end) handler.end( stack[ i ] );

      // Remove the open elements from the stack
      stack.length = pos;
    }
  }
}

var hiddenPre=document.createElement("pre");
var spaceRe = /^(\s*)([\s\S]*?)(\s*)$/;
/**
 * decodes all entities into regular string
 * @param value
 * @returns {string} A string with decoded entities.
 */
function decodeEntities(value) {
  if (!value) { return ''; }

  // Note: IE8 does not preserve spaces at the start/end of innerHTML
  // so we must capture them and reattach them afterward
  var parts = spaceRe.exec(value);
  var spaceBefore = parts[1];
  var spaceAfter = parts[3];
  var content = parts[2];
  if (content) {
    hiddenPre.innerHTML=content.replace(/</g,"&lt;");
    // innerText depends on styling as it doesn't display hidden elements.
    // Therefore, it's better to use textContent not to cause unnecessary
    // reflows. However, IE<9 don't support textContent so the innerText
    // fallback is necessary.
    content = 'textContent' in hiddenPre ?
      hiddenPre.textContent : hiddenPre.innerText;
  }
  return spaceBefore + content + spaceAfter;
}

/**
 * Escapes all potentially dangerous characters, so that the
 * resulting string can be safely inserted into attribute or
 * element text.
 * @param value
 * @returns {string} escaped text
 */
function encodeEntities(value) {
  return value.
    replace(/&/g, '&amp;').
    replace(SURROGATE_PAIR_REGEXP, function (value) {
      var hi = value.charCodeAt(0);
      var low = value.charCodeAt(1);
      return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
    }).
    replace(NON_ALPHANUMERIC_REGEXP, function(value){
      // unsafe chars are: \u0000-\u001f \u007f-\u009f \u00ad \u0600-\u0604 \u070f \u17b4 \u17b5 \u200c-\u200f \u2028-\u202f \u2060-\u206f \ufeff \ufff0-\uffff from jslint.com/lint.html
      // decimal values are: 0-31, 127-159, 173, 1536-1540, 1807, 6068, 6069, 8204-8207, 8232-8239, 8288-8303, 65279, 65520-65535
      var c = value.charCodeAt(0);
      // if unsafe character encode
      if(c <= 159 ||
        c == 173 ||
        (c >= 1536 && c <= 1540) ||
        c == 1807 ||
        c == 6068 ||
        c == 6069 ||
        (c >= 8204 && c <= 8207) ||
        (c >= 8232 && c <= 8239) ||
        (c >= 8288 && c <= 8303) ||
        c == 65279 ||
        (c >= 65520 && c <= 65535)) return '&#' + c + ';';
      return value; // avoids multilingual issues
    }).
    replace(/</g, '&lt;').
    replace(/>/g, '&gt;');
}

var trim = (function() {
  // native trim is way faster: http://jsperf.com/angular-trim-test
  // but IE doesn't have it... :-(
  // TODO: we should move this into IE/ES5 polyfill
  if (!String.prototype.trim) {
    return function(value) {
      return angular.isString(value) ? value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') : value;
    };
  }
  return function(value) {
    return angular.isString(value) ? value.trim() : value;
  };
})();

// Custom logic for accepting certain style options only - textAngular
// Currently allows only the color, background-color, text-align, float, width and height attributes
// all other attributes should be easily done through classes.
function validStyles(styleAttr){
	var result = '';
	var styleArray = styleAttr.split(';');
	angular.forEach(styleArray, function(value){
		var v = value.split(':');
		if(v.length == 2){
			var key = trim(angular.lowercase(v[0]));
			var value = trim(angular.lowercase(v[1]));
			if(
				(key === 'color' || key === 'background-color') && (
					value.match(/^rgb\([0-9%,\. ]*\)$/i)
					|| value.match(/^rgba\([0-9%,\. ]*\)$/i)
					|| value.match(/^hsl\([0-9%,\. ]*\)$/i)
					|| value.match(/^hsla\([0-9%,\. ]*\)$/i)
					|| value.match(/^#[0-9a-f]{3,6}$/i)
					|| value.match(/^[a-z]*$/i)
				)
			||
				key === 'text-align' && (
					value === 'left'
					|| value === 'right'
					|| value === 'center'
					|| value === 'justify'
				)
			||
				key === 'float' && (
					value === 'left'
					|| value === 'right'
					|| value === 'none'
				)
			||
				(key === 'width' || key === 'height') && (
					value.match(/[0-9\.]*(px|em|rem|%)/)
				)
			) result += key + ': ' + value + ';';
		}
	});
	return result;
}

// this function is used to manually allow specific attributes on specific tags with certain prerequisites
function validCustomTag(tag, attrs, lkey, value){
	// catch the div placeholder for the iframe replacement
    if (tag === 'img' && attrs['ta-insert-video']){
        if(lkey === 'ta-insert-video' || lkey === 'allowfullscreen' || lkey === 'frameborder' || (lkey === 'contenteditble' && value === 'false')) return true;
    }
    return false;
}

/**
 * create an HTML/XML writer which writes to buffer
 * @param {Array} buf use buf.jain('') to get out sanitized html string
 * @returns {object} in the form of {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * }
 */
function htmlSanitizeWriter(buf, uriValidator){
  var ignore = false;
  var out = angular.bind(buf, buf.push);
  return {
    start: function(tag, attrs, unary){
      tag = angular.lowercase(tag);
      if (!ignore && specialElements[tag]) {
        ignore = tag;
      }
      if (!ignore && validElements[tag] === true) {
        out('<');
        out(tag);
        angular.forEach(attrs, function(value, key){
          var lkey=angular.lowercase(key);
          var isImage=(tag === 'img' && lkey === 'src') || (lkey === 'background');
          if ((lkey === 'style' && (value = validStyles(value)) !== '') || validCustomTag(tag, attrs, lkey, value) || validAttrs[lkey] === true &&
            (uriAttrs[lkey] !== true || uriValidator(value, isImage))) {
            out(' ');
            out(key);
            out('="');
            out(encodeEntities(value));
            out('"');
          }
        });
        out(unary ? '/>' : '>');
      }
    },
    end: function(tag){
        tag = angular.lowercase(tag);
        if (!ignore && validElements[tag] === true) {
          out('</');
          out(tag);
          out('>');
        }
        if (tag == ignore) {
          ignore = false;
        }
      },
    chars: function(chars){
        if (!ignore) {
          out(encodeEntities(chars));
        }
      }
  };
}


// define ngSanitize module and register $sanitize service
angular.module('ngSanitize', []).provider('$sanitize', $SanitizeProvider);

/* global sanitizeText: false */

/**
 * @ngdoc filter
 * @name linky
 * @function
 *
 * @description
 * Finds links in text input and turns them into html links. Supports http/https/ftp/mailto and
 * plain email address links.
 *
 * Requires the {@link ngSanitize `ngSanitize`} module to be installed.
 *
 * @param {string} text Input text.
 * @param {string} target Window (_blank|_self|_parent|_top) or named frame to open links in.
 * @returns {string} Html-linkified text.
 *
 * @usage
   <span ng-bind-html="linky_expression | linky"></span>
 *
 * @example
   <example module="ngSanitize" deps="angular-sanitize.js">
     <file name="index.html">
       <script>
         function Ctrl($scope) {
           $scope.snippet =
             'Pretty text with some links:\n'+
             'http://angularjs.org/,\n'+
             'mailto:us@somewhere.org,\n'+
             'another@somewhere.org,\n'+
             'and one more: ftp://127.0.0.1/.';
           $scope.snippetWithTarget = 'http://angularjs.org/';
         }
       </script>
       <div ng-controller="Ctrl">
       Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Filter</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="linky-filter">
           <td>linky filter</td>
           <td>
             <pre>&lt;div ng-bind-html="snippet | linky"&gt;<br>&lt;/div&gt;</pre>
           </td>
           <td>
             <div ng-bind-html="snippet | linky"></div>
           </td>
         </tr>
         <tr id="linky-target">
          <td>linky target</td>
          <td>
            <pre>&lt;div ng-bind-html="snippetWithTarget | linky:'_blank'"&gt;<br>&lt;/div&gt;</pre>
          </td>
          <td>
            <div ng-bind-html="snippetWithTarget | linky:'_blank'"></div>
          </td>
         </tr>
         <tr id="escaped-html">
           <td>no filter</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
     </file>
     <file name="protractor.js" type="protractor">
       it('should linkify the snippet with urls', function() {
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(4);
       });

       it('should not linkify snippet without the linky filter', function() {
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, mailto:us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#escaped-html a')).count()).toEqual(0);
       });

       it('should update', function() {
         element(by.model('snippet')).clear();
         element(by.model('snippet')).sendKeys('new http://link.');
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('new http://link.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(1);
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText())
             .toBe('new http://link.');
       });

       it('should work with the target property', function() {
        expect(element(by.id('linky-target')).
            element(by.binding("snippetWithTarget | linky:'_blank'")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-target a')).getAttribute('target')).toEqual('_blank');
       });
     </file>
   </example>
 */
angular.module('ngSanitize').filter('linky', ['$sanitize', function($sanitize) {
  var LINKY_URL_REGEXP =
        /((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>]/,
      MAILTO_REGEXP = /^mailto:/;

  return function(text, target) {
    if (!text) return text;
    var match;
    var raw = text;
    var html = [];
    var url;
    var i;
    while ((match = raw.match(LINKY_URL_REGEXP))) {
      // We can not end in these as they are sometimes found at the end of the sentence
      url = match[0];
      // if we did not match ftp/http/mailto then assume mailto
      if (match[2] == match[3]) url = 'mailto:' + url;
      i = match.index;
      addText(raw.substr(0, i));
      addLink(url, match[0].replace(MAILTO_REGEXP, ''));
      raw = raw.substring(i + match[0].length);
    }
    addText(raw);
    return $sanitize(html.join(''));

    function addText(text) {
      if (!text) {
        return;
      }
      html.push(sanitizeText(text));
    }

    function addLink(url, text) {
      html.push('<a ');
      if (angular.isDefined(target)) {
        html.push('target="');
        html.push(target);
        html.push('" ');
      }
      html.push('href="');
      html.push(url);
      html.push('">');
      addText(text);
      html.push('</a>');
    }
  };
}]);


})(window, window.angular);
(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('adminService', adminService);

    function adminService () {

    }

}());
(function () {
    angular
        .module('mba-deadlines')
       //.value('BASE_URL', 'http://localhost:3000');
         .value('BASE_URL', 'http://mbadeadlines.herokuapp.com');
}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('schoolsService', schoolsService);

    schoolsService.$inject = ['BASE_URL', '$resource'];
    function schoolsService (BASE_URL, $resource) {

        var schoolResource = $resource(BASE_URL + '/schools', {});
        var bookmarkedResource = $resource(BASE_URL + '/bookmarks/:user_id', {}, {
            get: {
                method: 'GET',
                isArray: true
            },
            delete: {
                method: 'POST'
            }
        });

        var classProfileResource = $resource(BASE_URL + '/class-profile/:id', {});

        return {
            rest: schoolResource,
            bookmarks: bookmarkedResource,
            classProfile: classProfileResource
        };
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('userService', userService);

    userService.$inject = ['BASE_URL', '$resource'];
    function userService (BASE_URL, $resource) {
        var userResource = $resource(BASE_URL + '/auth', {}, {
            post: {
                'method': 'POST'
            }
        });
        var userData = $resource(BASE_URL + '/users/:id', {}, {
            update: {
                method: 'PUT'
            }
        });

        return {
            rest: userResource,
            data: userData
        }
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .filter('schoolSearchFilter', schoolSearchFilter);

    schoolSearchFilter.$inject = ['$filter'];

    function schoolSearchFilter($filter) {
        return function(input, query) {
            var universityList = [];
            for (var i = 0; i < input.length; i++ ) {
                if ( input[i].school.toLowerCase().indexOf(query.toLowerCase()) !== -1 || input[i].address.toLowerCase().indexOf(query.toLowerCase()) !== -1 ) {
                    universityList.push(input[i]);
                }
            }
            return universityList;
        }
    }
}());

(function () {
	"use strict";

	angular
		.module('mba-deadlines')
		.controller('AdminLogin', AdminLogin);

	function AdminLogin() {
		console.log('admin-login');
	}
}());
(function () {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(dashboardRouter);

    dashboardRouter.$inject = ['$stateProvider'];
    function dashboardRouter($stateProvider) {
        $stateProvider.state('admin-login', {
            parent: 'index',
            url: '/admin-login',
            views: {
                'content@': {
                    templateUrl: 'components/admin-dashboard/admin-login/admin-login.tpl.html',
                    controller: 'AdminLogin',
                    controllerAs: 'admin-login'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('AdminDeadlines', AdminDeadlines);
    AdminDeadlines.$inject = ['schoolsService', '$rootScope'];
    function AdminDeadlines (schoolsService, $rootScope) {

        // Local Variables
        var vm = this;

        // Exposed Variables
        vm.searchQuery = '';
        vm.data = [];
        vm.selectedSchool = {};
        vm.selectedRoud = '';

        // Exposed Functions
        vm.addSchool = addSchool;
        vm.selectRound = selectRound;
        vm.isSelected = isSelected;

        init();

        function addSchool (school) {
            vm.selectedSchool = school;
            $('.uni-details-modal.ui.modal')
                .modal({
                    onHide: function () {
                        vm.selectedRoud = '';
                    }
                })
                .modal('show');
        }

        function selectRound ( round ) {
            vm.selectedRoud = round;
        }

        function isSelected ( round ) {
            return vm.selectedRoud === round;
        }

        function init() {
            $rootScope.isLoading = true;
            schoolsService.rest.query(function(schools) {
                processDates(schools);
                vm.data = schools;
                $rootScope.isLoading = false;
            });
        }

        function processDates(schools) {
            for (var i = 0; i < schools.length; i++) {
                schools[i].roundOne = new Date(schools[i].roundOne);
                schools[i].roundTwo = new Date(schools[i].roundTwo);
                schools[i].roundThree = new Date(schools[i].roundThree);
                schools[i].roundFour = new Date(schools[i].roundFour);
            }
        }

    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(AdminDeadlinesRouter);

    AdminDeadlinesRouter.$inject = ['$stateProvider'];
    function AdminDeadlinesRouter($stateProvider) {
        $stateProvider.state('adminDeadlines', {
            parent: 'admindashboard',
            url: '/deadlines',
            views: {
                'adminContent': {
                    templateUrl: 'components/admin-dashboard/admin-deadlines/admin-deadlines.tpl.html',
                    controller: 'AdminDeadlines',
                    controllerAs: 'aDeadlines'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('adminDeadlinesSvc', adminDeadlinesService);

    adminDeadlinesService.$inject = ['BASE_URL', '$resource'];

    function adminDeadlinesService (BASE_URL, $resource) {
    	var deadlinesResource = $resource(BASE_URL + '');

    	return {
    		rest: deadlinesResource
    	}
    }

}());
(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('AdminRankings', AdminRankings);
    // AdminRankings.$inject = ['$scope'];
    function AdminRankings() {

        var vm = this;

        vm.searchQuery = '';

        vm.data = [{
            "id": 1,
            "icon": "images/uni-badges/cambridge.png",
            "school": "Cambridge",
            "address": "Cambridge, England, United Kingdom",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["2", "down"],
            "usNews": ["2", "down"]
        }, {
            "id": 2,
            "icon": "images/uni-badges/stanford.png",
            "school": "Stanford University",
            "address": "450 Serra Mall, Stanford, CA 94305, United States",
            "financial": ["4", "down"],
            "businessWeek": ["3", "down"],
            "economist": ["4", "down"],
            "usNews":["3", "minus"]
        }, {
            "id": 3,
            "icon": "images/uni-badges/harvard.png",
            "school": "Harvard University",
            "address": "Cambridge, MA 02138, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "up"],
            "economist": ["2", "down"],
            "usNews": ["3", "minus"]
        }, {
            "id": 4,
            "icon": "images/uni-badges/mit.png",
            "school": "MIT",
            "address": "77 Massachusetts Ave, Cambridge, MA 02139, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["1", "up"],
            "usNews": ["4", "down"]
            }, {
            "id": 5,
            "icon": "images/uni-badges/yale.png",
            "school": "Yale University",
            "address": "New Haven, CT 06520, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "up"],
            "economist": ["3", "down"],
            "usNews": ["3", "minus"]
            }, {
            "id": 6,
            "icon": "images/uni-badges/oxford.png",
            "school": "University of Oxford",
            "address": "Oxford, England, United Kingdom",
            "financial": ["3", "minus"],
            "businessWeek": ["2", "up"],
            "economist": ["2", "down"],
            "usNews": ["3", "minus"]
            }, {
            "id": 7,
            "icon": "images/uni-badges/columbia.png",
            "school": "Columbia University",
            "address": "116th St & Broadway, New York, NY 10027, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["1", "up"],
            "usNews": ["1", "up"]
            }, {
            "id": 8,
            "icon": "images/uni-badges/nyu.png",
            "school": "New York University",
            "address": "New York, NY, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["2", "down"],
            "usNews": ["5", "down"]
            }
        ];

        vm.getRankStatus = getRankStatus;

        function getRankStatus (status) {
            var ret = '';
            if (status === 'up') {
                ret = 'up green';
            } else if (status === 'down') {
                ret = 'down red';
            } else {
                ret = 'minus yellow';
            }
            return ret;
        }
    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(AdminRankingsRouter);

    AdminRankingsRouter.$inject = ['$stateProvider'];
    function AdminRankingsRouter($stateProvider) {
        $stateProvider.state('adminRankings', {
            parent: 'admindashboard',
            url: '/rankings',
            views: {
                'adminContent': {
                    templateUrl: 'components/admin-dashboard/admin-rankings/admin-rankings.tpl.html',
                    controller: 'AdminRankings',
                    controllerAs: 'adminRankings'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('adminRankingsSvc', adminRankingsSvc);

    adminRankingsSvc.$inject = ['BASE_URL', '$resource'];

    function adminRankingsSvc (BASE_URL, $resource) {
    	var rankingsResource = $resource(BASE_URL + '');

    	return {
    		rest: rankingsResource
    	}
    }

}());
(function () {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('SUEducation', EducationController);

    EducationController.$inject = ['$state', '$rootScope', '$cookies', '$scope', 'userService'];
    function EducationController($state, $rootScope, $cookies, $scope, userService) {
        $rootScope.isLoading = false;
        var vm = this;

        vm.education = {};

        vm.isValid = false;
        vm.addEducation = addEducation;
        vm.actionHandler = actionHandler;

        $scope.$on('$viewContentLoaded', function(){
            init();
        });

        function actionHandler (mode) {
            if (mode === 'back') {
                addEducation('ug-work-experience');
            } else {
                addEducation('dashboard');
            }
        }

        function addEducation(state) {
            $rootScope.isLoading = true;
            if (!vm.education.totalCgpa && !vm.education.obtCgpa && !vm.education.major && !vm.year) {
                vm.isValid = false;
                $rootScope.isLoading = false;
            } else if (vm.education.totalCgpa || vm.education.obtCgpa || vm.education.major || vm.year) {
                vm.isValid = true;
                $rootScope.isLoading = false;
            }

            if (vm.isValid) {
                userService.data.update({'id': $cookies.get('auth')}, {"education": vm.education}, function (argument) {
                    ohSnap(argument.Success, 'Green');
                    debugger;
                    $rootScope.isLoading = false;
                    $state.go(state);
                })
            } else {
                ohSnap('Data Missing', 'Red');
            }
        }

        function init () {
            debugger;
            $('.ug-major.dropdown').dropdown({
                onChange: function (val) {
                    vm.education.major = val;
                }
            });
        }
    }
}());
(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(signupStepOneRouter);

    signupStepOneRouter.$inject = ['$stateProvider'];
    function signupStepOneRouter($stateProvider) {
        $stateProvider.state('step1', {
            parent: 'signup',
            url: '/step1',
            views: {
                'signup-steps': {
                    templateUrl: 'components/signup/signup-steps/step1.tpl.html',
                    controller: 'Signup',
                    controllerAs: 'su'
                }
            }
        });
    }

}());


(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(signupStepTwoRouter);

    signupStepTwoRouter.$inject = ['$stateProvider'];
    function signupStepTwoRouter($stateProvider) {
        // States for step2
        $stateProvider.state('step2', {
            parent: 'signup',
            url: '/step2',
            redirectTo: 'su-student-profile',
            views: {
                'signup-steps': {
                    templateUrl: 'components/signup/signup-steps/step2.tpl.html',
                    controller: 'Signup'
                }
            }
        });

        // States for inner steps in Step2 (User Details)
        $stateProvider.state('su-student-profile', {
            parent: 'step2',
            url: '/student-profile',
            views: {
                'signup-inner-steps': {
                    templateUrl: 'components/signup/signup-steps/student-profile.tpl.html',
                    controller: 'SUStudentProfile',
                    controllerAs: 'sp'
                }
            }
        }).state('su-work-experience', {
            parent: 'step2',
            url: '/work-experience',
            views: {
                'signup-inner-steps': {
                    templateUrl: 'components/signup/signup-steps/work-experience.tpl.html',
                    controller: 'SUWorkExperience',
                    controllerAs: 'we'
                }
            }
        }).state('su-education', {
            parent: 'step2',
            url: '/education',
            views: {
                'signup-inner-steps': {
                    templateUrl: 'components/signup/signup-steps/education.tpl.html',
                    controller: 'SUEducation',
                    controllerAs: 'edu'
                }
            }
        });
    }

}());


(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .controller('SUStudentProfile',studentProfileController);

    studentProfileController.$inject = ['$state', '$rootScope', '$cookies', 'userService'];

    function studentProfileController($state, $rootScope, $cookies, userService) {
        $rootScope.isLoading = false;
        var vm = this;

        vm.studentProfile = {};

        vm.isValid = false;
        vm.addStudentProfile = addStudentProfile;


        function addStudentProfile () {
            $rootScope.isLoading = true;
            if (!vm.studentProfile.gre && !vm.studentProfile.gat) {
                vm.isValid = false;
                $rootScope.isLoading = false;
            } else if (vm.studentProfile.gre || vm.studentProfile.gat) {
                vm.isValid = true;
                $rootScope.isLoading = false;
            }

            if (vm.isValid) {
                userService.data.update({'id': $cookies.get('auth')}, { "student_profile": vm.studentProfile}, function (argument) {
                    ohSnap(argument.Success, 'Green');
                    $rootScope.isLoading = false;
                    $state.go('su-work-experience');
                })
            } else {
                ohSnap('Data Missing', 'Red');
            }
        }
    }

}());


(function () {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('SUWorkExperience', WorkExperienceController);

    WorkExperienceController.$inject = ['$state', '$rootScope', '$cookies', '$scope', 'userService'];
    function WorkExperienceController($state, $rootScope, $cookies, $scope, userService) {
        $rootScope.isLoading = false;
        var vm = this;

        vm.workExperience = {};

        vm.isValid = false;
        vm.addWorkExperience = addWorkExperience;
        vm.actionHandler = actionHandler;

        $scope.$on('$viewContentLoaded', function(){
            init();
        });

        function actionHandler (mode) {
            if (mode === 'back') {
                addWorkExperience('su-student-profile');
            } else {
                addWorkExperience('su-education');
            }
        }

        function addWorkExperience(state) {
            $rootScope.isLoading = true;
            if (!vm.workExperience.duration && !vm.workExperience.pre_mba && !vm.workExperience.post_mba) {
                vm.isValid = false;
                $rootScope.isLoading = false;
            } else if (vm.workExperience.duration || vm.workExperience.pre_mba || vm.workExperience.post_mba) {
                vm.isValid = true;
                $rootScope.isLoading = false;
            }

            if (vm.isValid) {
                userService.data.update({'id': $cookies.get('auth')}, {"work_experience": vm.workExperience}, function (argument) {
                    ohSnap(argument.Success, 'Green');
                    debugger;
                    $rootScope.isLoading = false;
                    $state.go(state);
                })
            } else {
                ohSnap('Data Missing', 'Red');
            }
        }

        function init () {
            debugger;
            $('.pre.dropdown').dropdown({
                onChange: function (val) {
                    vm.workExperience.pre_mba = val;
                }
            });

            $('.post.dropdown').dropdown({
                onChange: function (val) {
                    vm.workExperience.post_mba = val;
                }
            });
        }
    }
}());
(function () {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('AdminSchools', AdminSchoolsController);
    AdminSchoolsController.$inject = ['schoolsService', '$http', 'BASE_URL', '$rootScope', '$scope'];

    function AdminSchoolsController(schoolsService, $http, BASE_URL, $rootScope, $scope) {

        // Local Variables
        var vm = this;

        // Exposed Variables
        vm.searchQuery = '';
        vm.allSchools = [];
        vm.isUS = true;

        vm.selectedSchool = {};
        vm.mode = '';

        // Exposed Functions
        vm.delete = deleteSchool;
        vm.showSchool = showSchool;
        vm.addSchool = addSchool;
        vm.updateSchool = updateSchool;


        function initController() {
            $rootScope.isLoading = true;
            schoolsService.rest.query(function (schools) {
                vm.allSchools = schools;
                $rootScope.isLoading = false;
            });
        }

        function showSchool(mode, school) {

            $('.label-help').popup({
                title: 'Rank Status',
                content: 'Comparison about rank going up, down or is constant as last years ratting.'
            });

            if (mode === 'edit') {
                vm.selectedSchool = school;
                vm.mode = 'Edit';
            } else if (mode === 'add') {
                vm.selectedSchool = {};
                vm.mode = 'Add'
            }

            $('.add-modal.ui.modal').modal({
                closable: false,
                onShow: function () {
                    convertAllRounds(vm.selectedSchool);

                    if (vm.selectedSchool.state) {
                        $('.state.ui.dropdown').dropdown({
                            onChange: function (code) {
                                if (code) {
                                    vm.selectedSchool.state = code;
                                    debugger;
                                }
                            }
                        }).dropdown('set selected', vm.selectedSchool.state);
                    }

                    if (vm.selectedSchool.country) {
                        $('.country.ui.dropdown').dropdown({
                            onChange: function (code, country) {
                                if (code) {
                                    var cont = country;
                                    vm.isUS = code === 'us';

                                    var ci = cont.indexOf('i>');
                                    cont = cont.slice(ci + 2);
                                    vm.selectedSchool.country = {
                                        code: code,
                                        country: cont
                                    };
                                }
                            }
                        }).dropdown('set selected', vm.selectedSchool.country.code);
                    }
                },

                onHide: function () {
                    clearAll();
                },
                onDeny: function () {
                    return true;
                },
                onApprove: function () {

                    return true;
                }
            }).modal('show');
        }

        $scope.$watch('vm.selectedSchool.roundOne', function () {
            debugger;
        });

        // POST Request for adding new school
        function addSchool() {

        }

        // PUT Requiest for updating already existed school
        function updateSchool() {

        }

        /**
         * Function called when ever any bookmark deleted
         * @param  {int} bokmark_id
         */
        function deleteSchool(id) {
            $('.delete-modal.modal').modal({
                onApprove: function () {
                    $http.delete(BASE_URL + '/schools/' + id, {}).success(function (data, status) {
                        // vm.bookmarkedSchools = vm.bookmarkedSchools.filter(function(el) {
                        //     return el._id !== id
                        // })
                        ohSnap('Record Removed', 'green');
                        console.log(data, status);
                    }).error(function (error, status) {
                        ohSnap('Error Code: ' + status, 'red');
                    });
                }
            }).modal('show');
        }

        /**
         * Convert BSON ISO Date to UTC String
         * @param date BSON ISO
         * @returns {Date} UTC
         */
        function convertDate(date) {
            return new Date(date);
        }

        function convertAllRounds(selectedSchool) {
            // Round One
            if (selectedSchool.roundOne) {
                selectedSchool.roundOne = convertDate(selectedSchool.roundOne);
            }

            // Round Two
            if (selectedSchool.roundTwo) {
                selectedSchool.roundTwo = convertDate(selectedSchool.roundTwo);
            }

            // Round Three
            if (selectedSchool.roundThree) {
                selectedSchool.roundThree = convertDate(selectedSchool.roundThree);
            }

            // Round Four
            if (selectedSchool.roundFour) {
                selectedSchool.roundFour = convertDate(selectedSchool.roundFour);
            }
        }

        function clearAll() {
            vm.selectedSchool = {};
            vm.mode = '';
            $('.country.ui.dropdown').dropdown('clear').dropdown('refresh');
            $('.state.ui.dropdown').dropdown('clear').dropdown('refresh');
        }

        initController();


    }
}());
(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(AdminSchoolsRouter);

    AdminSchoolsRouter.$inject = ['$stateProvider'];
    function AdminSchoolsRouter($stateProvider) {
        $stateProvider.state('adminSchools', {
            parent: 'admindashboard',
            url: '/schools',
            views: {
                'adminContent': {
                    templateUrl: 'components/admin-dashboard/admin-schools/admin-schools.tpl.html',
                    controller: 'AdminSchools',
                    controllerAs: 'adminSchools'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('adminSchoolsSvc', adminSchoolsSvc);

    adminSchoolsSvc.$inject = ['BASE_URL', '$resource'];

    function adminSchoolsSvc (BASE_URL, $resource) {
    	var rankingsResource = $resource(BASE_URL + '');

    	return {
    		rest: rankingsResource
    	}
    }

}());
(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('AdminStats', AdminStatsController);
    //AdminStatsController.$inject = ['$scope'];
    function AdminStatsController() {

        // Local Variables
        var vm = this;

        vm.searchQuery = '';
        vm.topSchools = [{
            "id": 1,
            "icon": "images/uni-badges/harvard.png",
            "school": "Harvard University",
            "address": "Cambridge, MA 02138, United States",
            "applications":2390
        }, {
                "id": 2,
                "icon": "images/uni-badges/cambridge.png",
                "school": "Cambridge",
                "address": "Cambridge, England, United Kingdom",
                "applications":1130
            }, {
                "id": 3,
                "icon": "images/uni-badges/stanford.png",
                "school": "Stanford University",
                "address": "450 Serra Mall, Stanford, CA 94305, United States",
                "applications":890
            },
            {
                "id": 4,
                "icon": "images/uni-badges/mit.png",
                "school": "MIT",
                "address": "77 Massachusetts Ave, Cambridge, MA 02139, United States",
                "applications":560
            },
            {
                "id": 5,
                "icon": "images/uni-badges/yale.png",
                "school": "Yale University",
                "address": "New Haven, CT 06520, Andorra",
                "applications":400
            }
        ];


    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(adminStatsRouter);

    adminStatsRouter.$inject = ['$stateProvider'];
    function adminStatsRouter($stateProvider) {
        $stateProvider.state('adminStats', {
            parent: 'admindashboard',
            url: '/stats',
            views: {
                'adminContent': {
                    templateUrl: 'components/admin-dashboard/admin-stats/admin-stats.tpl.html',
                    controller: 'AdminStats',
                    controllerAs: 'adminStats'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('adminStatsSvc', adminStatsSvc);

    adminStatsSvc.$inject = ['BASE_URL', '$resource'];

    function adminStatsSvc (BASE_URL, $resource) {
    	var rankingsResource = $resource(BASE_URL + '');

    	return {
    		rest: rankingsResource
    	}
    }

}());
(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Dashboard', DashboardController);
    DashboardController.$inject = ['$scope', 'schoolsService', 'userService', '$cookies', '$http', 'BASE_URL'];

    function DashboardController($scope, schoolsService, userService, $cookies, $http, BASE_URL) {

        // Local Variables
        var vm = this;
        var addDropDown = '';

        // Exposed Variables
        /**
         * Array which stores only bookmarked school objects
         * @type {Array}
         */
        vm.bookmarkedSchools = [];
        /**
         * Array which holds all School Objects
         * @type {Array}
         */
        vm.allSchools = [];
        /**
         * Object which holds class profile for specific school. Its updated every time you ask for class profile
         * as it only stores content of single object
         * @type {Object}
         */
        vm.classProfile = {};
        /**
         * Object which holds only selected school content during bookmark process.
         * This object is reset to empty when modal is closed.
         * @type {Object}
         */
        vm.selectedSchool = {};
        /**
         * Stores selected round number during bookmark process
         * @type {string}
         */
        vm.selectedRound = '';

        // Exposed Functions
        vm.isSchoolListEmpty = isSchoolListEmpty;
        vm.addSchool = addSchool;
        vm.selectRound = selectRound;
        vm.isSelected = isSelected;
        vm.bookMarkRound = bookMarkRound;
        vm.isDropdownSelected = isDropdownSelected;
        vm.bookmarked = isBookmarked;
        vm.getClassProfile = getClassProfile;
        vm.deleteBookmark = removeBookmark;
        vm.edit = editHandler;
        vm.isLoading = false;

        initController();
        // Function Definitions
        // Helper Functions

        /**
         * When used click on add, it adds bookmark to bookmark list
         */
        function bookMarkRound() {
            var temp = vm.selectedSchool;

            if (vm.selectedRound === 1) {
                temp.selectedRound = temp.roundOne;
            } else if (vm.selectedRound === 2) {
                temp.selectedRound = temp.roundTwo;
            } else if (vm.selectedRound === 3) {
                temp.selectedRound = temp.roundThree;
            } else if (vm.selectedRound === 4) {
                temp.selectedRound = temp.roundFour;
            } else {
                ohSnap('No Match Found', 'warning');
                console.log('No Match Found');
            }

            if (temp) {
                temp.user_id = $cookies.get('auth');
            }

            schoolsService.bookmarks.save(temp, function(obj) {
                vm.bookmarkedSchools.push(obj);
                ohSnap(temp.school + ' bookmarked', 'green');
            }, function(error) {
                ohSnap('Fail: ' + error.toString(), 'red');
            });

        }

        /**
         * Function called when ever any bookmark deleted
         * @param  {int} bokmark_id
         */
        function removeBookmark(id) {
            var user = $cookies.get('auth');
            $('.delete-modal.modal').modal({
                onApprove: function() {
                    $http.delete(BASE_URL + '/bookmarks/' + id, {
                        params: {
                            user_id: user
                        }
                    }).success(function(data, status) {
                        vm.bookmarkedSchools = vm.bookmarkedSchools.filter(function(el) {
                            return el._id !== id
                        });
                        ohSnap('Record Removed', 'green');
                        console.log(data, status);
                    }).error(function(error, status) {
                        ohSnap('Error Code: ' + status, 'red');
                    });
                }
            }).modal('show');
        }

        function editHandler(id) {
            var user = $cookies.get('auth');
            var editor1, editor2, editor3;
            $('.edit-modal.modal').modal({
                onShow: function() {
                    $('.essay.ui.accordion').accordion();
                    editor1 = new Simditor({
                        textarea: $('#essay1_editor'),
                        upload: false,
                        tabIndent: true,
                        toolbar: [
                            'bold',
                            'italic',
                            'underline',
                            'ul',
                            'blockquote',
                            'hr'
                        ],
                        toolbarFloat: false,
                        toolbarFloatOffset: 0,
                        toolbarHidden: false,
                        pasteImage: false
                    });
                    editor2 = new Simditor({
                        textarea: $('#essay2_editor')
                    });
                    editor3 = new Simditor({
                        textarea: $('#essay3_editor')
                    });
                },
                onApprove: function() {
                }
            }).modal('show');
        }
        /**
         * Check to tell is school list empty
         * @returns {boolean}
         */
        function isSchoolListEmpty() {
            return !vm.bookmarkedSchools.length > 0;
        }

        /**
         * Add school to bookmarks, it initiates @bookmarkSchool function when finish preprocessing.
         */
        function addSchool() {

            $('.dash-add-school.coupled.modal').modal({
                allowMultiple: false
            });

            // First Modal
            $('.dash-search-school.first.modal').modal({
                onShow: function() {
                    addDropDown = $('.school-list.dropdown').dropdown({
                        onChange: function(school) {
                            vm.selectedSchool = school;
                        }
                    });
                }
            }).modal('show');

            // Second Modal
            $('.dash-select-session.second.modal').modal({
                onShow: function() {
                    $scope.$apply();
                },
                onHide: function() {
                    vm.selectedRound = '';
                    vm.selectedSchool = {};
                    addDropDown.dropdown('clear');
                },
                onApprove: function() {
                    vm.bookMarkRound();
                }
            }).modal('attach events', '.dash-search-school.first.modal .proceed');
        }

        /**
         * Select round from modal. It Assigns the object corresponding to round number passed
         * @param round
         */
        function selectRound(round) {
            vm.selectedRound = round;
        }

        /**
         * check if round your are passing down is selected or not
         * @param round
         * @returns {boolean}
         */
        function isSelected(round) {
            return vm.selectedRound === round;
        }

        /**
         * check if item in bookmark modal dropdown is selected or not.
         * @returns {{}|*}
         */
        function isDropdownSelected() {
            return vm.selectedSchool;
        }

        /**
         * Show class profile on a new Modal
         * @param profile
         */
        function getClassProfile(profile) {
            vm.classProfile = profile;
            $('.class-profile.modal').modal('show');
        }

        /**
         * Check if the school object you are passing is already bookmarked or not
         * @param school
         * @returns {boolean}
         */
        function isBookmarked(school) {
            if (vm.bookmarkedSchools.length > 0) {
                for (var i = 0; i < vm.bookmarkedSchools.length; i++) {
                    if (vm.bookmarkedSchools[i]._id === school._id) {
                        return true;
                    }
                }
            }

            return false;
        }

        /**
         * Date Processor
         * @param schools
         */
        function processDates(schools) {
            for (var i = 0; i < schools.length; i++) {
                schools[i].roundOne = new Date(schools[i].roundOne);
                schools[i].roundTwo = new Date(schools[i].roundTwo);
                schools[i].roundThree = new Date(schools[i].roundThree);
                schools[i].roundFour = new Date(schools[i].roundFour);
            }
        }
        function processBookmarkDates(bookmarks) {
            for (var i = 0; i < bookmarks.length; i++) {
                bookmarks[i].roundOne = new Date(bookmarks[i].roundOne);
                bookmarks[i].roundTow = new Date(bookmarks[i].roundTow);
                bookmarks[i].roundThree = new Date(bookmarks[i].roundThree);
                bookmarks[i].roundFour= new Date(bookmarks[i].roundFour);
                bookmarks[i].selectedRound = new Date(bookmarks[i].selectedRound);
            }
        }

        /**
         * Controller Initializer
         */
        function initController() {

            vm.isLoading = true;

            // Variable Initializations
            schoolsService.rest.query(function(schools) {
                processDates(schools);
                vm.allSchools = schools;
            });
            schoolsService.bookmarks.get({
                user_id: $cookies.get('auth')
            }, function(object) {
                processBookmarkDates(object);
                vm.bookmarkedSchools = object;
                vm.isLoading = false;
            });
        }
    }
}());
(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(dashboardRouter);

    dashboardRouter.$inject = ['$stateProvider'];
    function dashboardRouter($stateProvider) {
        $stateProvider.state('dashboard', {
            parent: 'index',
            data: {'requireAuth': true},
            url: '/dashboard',
            views: {
                'content@': {
                    templateUrl: 'components/dashboard/dashboard.tpl.html',
                    controller: 'Dashboard',
                    controllerAs: 'dashboard'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('');

}());
(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Deadlines', DeadlinesController);
    DeadlinesController.$inject = ['schoolsService'];
    function DeadlinesController (schoolsService) {

        // Local Variables
        var vm = this;

        // Exposed Variables
        vm.searchQuery = '';
        vm.data = [];
        vm.selectedSchool = {};
        vm.selectedRoud = '';

        // Exposed Functions
        vm.addHover = addHover;
        vm.addSchool = addSchool;
        vm.selectRound = selectRound;
        vm.isSelected = isSelected;
        vm.isLoading = false;

        init();

        // Function Definitions
        function addHover ( deadline ) {
            // Shows/hides the add button on hover
            return deadline.showAdd = ! deadline.showAdd;
        }

        function addSchool (school) {
            vm.selectedSchool = school;
            $('.uni-details-modal.ui.modal')
                .modal({
                    onHide: function () {
                        vm.selectedRoud = '';
                    }
                })
                .modal('show');
        }

        function selectRound ( round ) {
            vm.selectedRoud = round;
        }

        function isSelected ( round ) {
            return vm.selectedRoud === round;
        }

        function processDates(schools) {
            for (var i = 0; i < schools.length; i++) {
                schools[i].roundOne = new Date(schools[i].roundOne);
                schools[i].roundTwo = new Date(schools[i].roundTwo);
                schools[i].roundThree = new Date(schools[i].roundThree);
                schools[i].roundFour = new Date(schools[i].roundFour);
            }
        }

        function init() {
            vm.isLoading = true;
            schoolsService.rest.query(function(schools) {
                processDates(schools);
                vm.data = schools;
                vm.isLoading = false;
            });
        }

    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(deadlinesRouter);

    deadlinesRouter.$inject = ['$stateProvider'];
    function deadlinesRouter($stateProvider) {
        $stateProvider.state('deadlines', {
            parent: 'index',
            url: '/deadlines',
            views: {
                'content@': {
                    templateUrl: 'components/deadlines/deadlines.tpl.html',
                    controller: 'Deadlines',
                    controllerAs: 'deadlines'
                }
            }
        });
    }

}());

/**
 * Created by ghazala on 08/08/2015.
 */

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Login', LoginController);
    LoginController.$inject = ['$state', '$cookies', 'userService', '$rootScope'];

    function LoginController($state, $cookies, userService, $rootScope) {
        var vm = this;

        // Exposed Variables
        vm.email = '';
        vm.password = '';
        vm.rememberFlag = false;

        // Exposed Methods
        vm.auth = login;

        function login() {

            userService.rest.post({email: vm.email, password: vm.password}, function (obj) {
                if (obj._id) {
                    $cookies.put('auth', obj._id);
                    $rootScope.portalUser = obj;
                    $state.go('dashboard');
                } else {
                    ohSnap('Email/Password not valid', 'red');
                }
            });
            //$cookies.put('auth', 'true');
            // $state.go('dashboard');
        }

    }
}());

/**
 * Created by ghazala on 08/08/2015.
 */
(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(loginRouter);

    loginRouter.$inject = ['$stateProvider'];
    function loginRouter($stateProvider) {
        $stateProvider.state('login', {
            parent: 'index',
            url: '/login',
            views: {
                'content@': {
                    templateUrl: 'components/login/login.tpl.html',
                    controller: 'Login',
                    controllerAs: 'login'
                }
            }
        });
    }

}());


(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('AdminDashboard', AdminDashboardController);
    //AdminDashboardController.$inject = ['$scope'];
    function AdminDashboardController() {

        // Local Variables
        var vm = this;

        vm.searchQuery = '';
        vm.topSchools = [{
            "id": 1,
            "icon": "images/uni-badges/harvard.png",
            "school": "Harvard University",
            "address": "Cambridge, MA 02138, United States",
            "applications":2390
        }, {
                "id": 2,
                "icon": "images/uni-badges/cambridge.png",
                "school": "Cambridge",
                "address": "Cambridge, England, United Kingdom",
                "applications":1130
            }, {
                "id": 3,
                "icon": "images/uni-badges/stanford.png",
                "school": "Stanford University",
                "address": "450 Serra Mall, Stanford, CA 94305, United States",
                "applications":890
            },
            {
                "id": 4,
                "icon": "images/uni-badges/mit.png",
                "school": "MIT",
                "address": "77 Massachusetts Ave, Cambridge, MA 02139, United States",
                "applications":560
            },
            {
                "id": 5,
                "icon": "images/uni-badges/yale.png",
                "school": "Yale University",
                "address": "New Haven, CT 06520, Andorra",
                "applications":400
            }
        ];


    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(AdminDashboardRouter);

    AdminDashboardRouter.$inject = ['$stateProvider'];
    function AdminDashboardRouter($stateProvider) {
        $stateProvider.state('admindashboard', {
            parent: 'index',
            url: '/admin',
            redirectTo: 'adminStats',
            views: {
                'content@': {
                    templateUrl: 'components/admin-dashboard/admin-dashboard.tpl.html',
                    controller: 'AdminDashboard',
                    controllerAs: 'admindashboard'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('adminServices', adminServices);

    adminServices.$inject = ['BASE_URL','$resource', '$http'];

    function adminServices (BASE_URL, $resource, $http) {

    	var schoolResource = $resource(BASE_URL + '/schools', {});
    	var httpSVC = $http(BASE_URL + '/schools/:id', {});

    	return {
    		rest: schoolResource,
    		http: httpSVC
    	}
    }

}());
/**
 * Created by ghazala on 08/08/2015.
 */

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Signup', SignupController);
    SignupController.$inject = ['$state', 'userService', '$cookies', '$rootScope'];

    function SignupController($state, userService, $cookies, $rootScope)  {
        var vm = this;
        vm.state = $state;
        vm.user = {};
        vm.valid = false;

        init();
        // Exposed Variables
        // Exposed Methods
        vm.addUser = addUser;

        // Function definitions
        function addUser () {
            $rootScope.isLoading = true;
            // Email
            vm.valid = vm.user.email;
            // PW
            vm.valid = vm.user.password;
            // FName
            vm.valid = vm.user.first_name;
            // LName
            vm.valid = vm.user.last_name;

            if (vm.valid) {
                userService.data.save(vm.user, function (user) {
                    $cookies.put('auth', user._id);
                    $rootScope.isLoading = false;
                    $state.go('step2');
                }, function (obj) {
                    debugger;
                    ohSnap(obj.data.error, 'Red');
                    $rootScope.isLoading = false;
                });
            } else {
                ohSnap('Incomplete Data', 'Red');
                $rootScope.isLoading = false;
            }
            debugger;
        }

        function init() {
            $('.salutation.ui.dropdown').dropdown({
                onChange: function (val) {
                    vm.user.salutation = val;
                }
            });
            $('.country.ui.dropdown').dropdown({
                onChange: function (val) {
                    vm.user.country = val;
                }
            });
            $('.signup.form').form({
                on: 'blur',
                fields: {
                    email: {
                        identifier  : 'email',
                        rules: [
                            {
                                type   : 'empty',
                                prompt : 'email is required'
                            },
                            {
                                type   : 'email',
                                prompt : 'Please enter a valid e-mail'
                            }
                        ]
                    },
                    password: {
                        identifier : 'password',
                        rules: [
                            {
                                type   : 'empty',
                                prompt : 'Please enter a password'
                            },
                            {
                                type   : 'minLength[6]',
                                prompt : 'Your password must be at least 6 characters'
                            }
                        ]
                    },
                    name: {
                        identifier : 'name',
                        rules: [
                            {
                                type   : 'empty',
                                prompt : 'Name is required field'
                            }
                        ]
                    },
                    salutation: {
                        identifier : 'salutation',
                        rules: [
                            {
                                type   : 'empty',
                                prompt : 'Salutation is required field'
                            }
                        ]
                    }
                }
            });
        }
    }
}());

/**
 * Created by ghazala on 08/08/2015.
 */
(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(signupRouter);

    signupRouter.$inject = ['$stateProvider'];
    function signupRouter($stateProvider) {
        $stateProvider.state('signup', {
            parent: 'index',
            url: '/signup',
            redirectTo: 'step1',
            views: {
                'content@': {
                    templateUrl: 'components/signup/signup.tpl.html',
                    controller: 'Signup',
                    controllerAs: 'su'
                }
            }
        });
    }

}());


(function() {
	'use strict';

	angular
		.module('mba-deadlines')
		.controller('LandingPage', LandingPageController);

	function LandingPageController() {
		var vm = this;

		vm.launchModal = launchModal;

		function launchModal () {
			$('.how-it-works.ui.modal').modal('show');
		}
	}
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(landingPageRouter);

    landingPageRouter.$inject = ['$stateProvider'];
    function landingPageRouter($stateProvider) {
        $stateProvider.state('landing-page', {
            parent: 'index',
            url: '/home',
            views: {
                'content@': {
                    templateUrl: 'components/landing-page/landing-page.tpl.html',
                    controller: 'LandingPage',
                    controllerAs: 'LP'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Rankings', RankingsController);
    // RankingsController.$inject = ['$scope'];
    function RankingsController() {

        var vm = this;

        vm.searchQuery = '';

        vm.data = [{
            "id": 1,
            "icon": "images/uni-badges/cambridge.png",
            "school": "Cambridge",
            "address": "Cambridge, England, United Kingdom",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["2", "down"],
            "usNews": ["2", "down"]
        }, {
            "id": 2,
            "icon": "images/uni-badges/stanford.png",
            "school": "Stanford University",
            "address": "450 Serra Mall, Stanford, CA 94305, United States",
            "financial": ["4", "down"],
            "businessWeek": ["3", "down"],
            "economist": ["4", "down"],
            "usNews":["3", "minus"]
        }, {
            "id": 3,
            "icon": "images/uni-badges/harvard.png",
            "school": "Harvard University",
            "address": "Cambridge, MA 02138, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "up"],
            "economist": ["2", "down"],
            "usNews": ["3", "minus"]
        }, {
            "id": 4,
            "icon": "images/uni-badges/mit.png",
            "school": "MIT",
            "address": "77 Massachusetts Ave, Cambridge, MA 02139, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["1", "up"],
            "usNews": ["4", "down"]
            }, {
            "id": 5,
            "icon": "images/uni-badges/yale.png",
            "school": "Yale University",
            "address": "New Haven, CT 06520, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "up"],
            "economist": ["3", "down"],
            "usNews": ["3", "minus"]
            }, {
            "id": 6,
            "icon": "images/uni-badges/oxford.png",
            "school": "University of Oxford",
            "address": "Oxford, England, United Kingdom",
            "financial": ["3", "minus"],
            "businessWeek": ["2", "up"],
            "economist": ["2", "down"],
            "usNews": ["3", "minus"]
            }, {
            "id": 7,
            "icon": "images/uni-badges/columbia.png",
            "school": "Columbia University",
            "address": "116th St & Broadway, New York, NY 10027, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["1", "up"],
            "usNews": ["1", "up"]
            }, {
            "id": 8,
            "icon": "images/uni-badges/nyu.png",
            "school": "New York University",
            "address": "New York, NY, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["2", "down"],
            "usNews": ["5", "down"]
            }
        ];

        vm.getRankStatus = getRankStatus;

        function getRankStatus (status) {
            var ret = '';
            if (status === 'up') {
                ret = 'up green';
            } else if (status === 'down') {
                ret = 'down red';
            } else {
                ret = 'minus yellow';
            }
            return ret;
        }
    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(rankingsRouter);

    rankingsRouter.$inject = ['$stateProvider'];
    function rankingsRouter($stateProvider) {
        $stateProvider.state('rankings', {
            parent: 'index',
            url: '/rankings',
            views: {
                'content@': {
                    templateUrl: 'components/rankings/rankings.tpl.html',
                    controller: 'Rankings',
                    controllerAs: 'rankings'
                }
            }
        });
    }

}());
