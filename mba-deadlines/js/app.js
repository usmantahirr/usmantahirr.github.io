(function () {
	'use strict';

	angular
		.module('mba-deadlines', ['ngResource', 'ui.router','ngDialog','ngSanitize','froala', 'ngCookies'])
		.value('froalaConfig', {
			inlineMode: false
		}).run(runBlock)
		.config(indexConfig);

	// Run Function
    runBlock.$inject = ['$rootScope', '$state'];
	function runBlock($rootScope, $state) {
		$rootScope.$on('$stateChangeStart', function (event, toState, toStateParams) {
			if (toState.redirectTo) {
				event.preventDefault();
				$state.go(toState.redirectTo);
			}
            console.log('state change start');
        });

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toStateParams) {
            console.log('state change Success');
        });
	}

    // Index State (route)
	indexConfig.$inject = ['$stateProvider', '$urlRouterProvider',];
	function indexConfig($stateProvider, $urlRouterProvider) {
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
		.controller('Navigation', NavigationController);

	NavigationController.$inject = ['$state'];
	function NavigationController($state) {

		// Local Variables
		var vm = this;

		// Exposed Variables
		vm.state = $state;

		// Exposed Functions
		vm.isLandingPage = isLandingPage;
		vm.isLoginPage = isLoginPage;
		vm.isSignupPage = isSignupPage;

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
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('SUEducation', EducationController);

    // EducationController.$inject = [''];
    function EducationController() {
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
                    controller: 'Signup'
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
                    controller: 'SUStudentProfile'
                }
            }
        }).state('su-work-experience', {
            parent: 'step2',
            url: '/work-experience',
            views: {
                'signup-inner-steps': {
                    templateUrl: 'components/signup/signup-steps/work-experience.tpl.html',
                    controller: 'SUWorkExperience'
                }
            }
        }).state('su-education', {
            parent: 'step2',
            url: '/education',
            views: {
                'signup-inner-steps': {
                    templateUrl: 'components/signup/signup-steps/education.tpl.html',
                    controller: 'SUEducation'
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

    // studentProfileController.$inject = [];
    function studentProfileController() {
        console.log('student-profile-controller');
    }

}());


(function () {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('SUWorkExperience', WorkExperienceController);

//    WorkExperienceController.$inject = [''];
    function WorkExperienceController() {
        console.log('mycontroller');
    }
}());
(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Dash', Dashboard);
    Dashboard.$inject = ['$scope','ngDialog','$location'];

    function Dashboard($scope,ngDialog,$location) {

        $scope.textAreaFocused=false;
        $scope.writeEssay=false;
        $scope.roundSelected=function(id){

            $("textarea").removeClass("customTextAreaFocused");
            $('#'+id).addClass('customTextAreaFocused');
            return $scope.textAreaFocused=true;

        };
        $scope.addSchool=function(){

            ngDialog.open({
                template: 'components/dash/addSchool.tpl.html',
                className: 'ngdialog-theme-default dialogwidth640',
                controller:'Dash'

            });
        };
        $scope.SaveSchool=function()
        {
            ngDialog.closeAll();
            $location.path("/dash");

        };
        $scope.showProfile=function()
        {
            ngDialog.open({
                template: 'components/dash/classProfile.tpl.html',
                className: 'ngdialog-theme-default dialogwidth750',
                controller:'Dash'

            });
        };
        $scope.showEditor = function()
        {
            console.log('showing editor...');
            return  $scope.writeEssay=true;
        };

        $scope.options = {
            placeholder : ''
        };
        $scope.myHtml = "";

        $scope.froalaAction = function(action){
            $scope.options.froala(action);
        };

        $scope.onPaste = function(e, editor, html){
            //return 'Hijacked ' + html;
        };

        $scope.onEvent = function(e, editor, a, b){
            console.log('onEvent', e.namespace, a, b);
        };



    }
}());
(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(dashRouter);

    dashRouter.$inject = ['$stateProvider'];
    function dashRouter($stateProvider) {
        $stateProvider.state('dash', {
            parent: 'index',
            url: '/dash',
            views: {
                'content@': {
                    templateUrl: 'components/dash/dash.tpl.html',
                    controller: 'Dash'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Deadlines', DeadlinesController);
    DeadlinesController.$inject = ['$scope','ngDialog'];
    function DeadlinesController($scope,ngDialog) {

        // Local Variables
        var vm = this;

        // Exposed Variables
        vm.searchQuery = '';
        vm.data = [{
            "id": 1,
            "icon": "images/uni-badges/harvard.png",
            "school": "Harvard University",
            "address": "Cambridge, MA 02138, United States",
            "roundOne": "26th Jan 15",
            "roundTwo": " 28th Mar 15",
            "roundThree": "26th June 15",
            "roundFour":"18th Dec 15",
            "showAdd":false
        }, {
                "id": 2,
                "icon": "images/uni-badges/cambridge.png",
                "school": "Cambridge",
                "address": "Cambridge, England, United Kingdom",
                "roundOne": "26th Jan 15",
                "roundTwo": " 28th Mar 15",
                "roundThree": "26th June 15",
                "roundFour":"18th Dec 15",
                "showAdd":false
            }, {
                "id": 3,
                "icon": "images/uni-badges/stanford.png",
                "school": "Stanford University",
                "address": "450 Serra Mall, Stanford, CA 94305, United States",
                "roundOne": "26th Jan 15",
                "roundTwo": " 28th Mar 15",
                "roundThree": "26th June 15",
                "roundFour":"18th Dec 15",
                "showAdd":false
            },
            {
                "id": 4,
                "icon": "images/uni-badges/mit.png",
                "school": "MIT",
                "address": "77 Massachusetts Ave, Cambridge, MA 02139, United States",
                "roundOne": "26th Jan 15",
                "roundTwo": " 28th Mar 15",
                "roundThree": "26th June 15",
                "roundFour":"18th Dec 15",
                "showAdd":false
            },
            {
                "id": 5,
                "icon": "images/uni-badges/yale.png",
                "school": "Yale University",
                "address": "New Haven, CT 06520, United States",
                "roundOne": "26th Jan 15",
                "roundTwo": " 28th Mar 15",
                "roundThree": "26th June 15",
                "roundFour":"18th Dec 15",
                "showAdd":false
            },
            {
                "id": 6,
                "icon": "images/uni-badges/oxford.png",
                "school": "University of Oxford",
                "address": "Oxford, England, United Kingdom",
                "roundOne": "26th Jan 15",
                "roundTwo": " 28th Mar 15",
                "roundThree": "26th June 15",
                "roundFour":"18th Dec 15",
                "showAdd":false
            },
            {
                "id": 7,
                "icon": "images/uni-badges/columbia.png",
                "school": "Columbia University",
                "address": "116th St & Broadway, New York, NY 10027, United States",
                "roundOne": "26th Jan 15",
                "roundTwo": " 28th Mar 15",
                "roundThree": "26th June 15",
                "roundFour":"18th Dec 15",
                "showAdd":false
            },
            {
                "id": 7,
                "icon": "images/uni-badges/brown.png",
                "school": "Brown University",
                "address": "Providence, RI 02912, United States",
                "roundOne": "26th Jan 15",
                "roundTwo": " 28th Mar 15",
                "roundThree": "26th June 15",
                "roundFour":"18th Dec 15",
                "showAdd":false
            },
            {
                "id": 8,
                "icon": "images/uni-badges/nyu.png",
                "school": "New York University",
                "address": "New York, NY, United States",
                "roundOne": "26th Jan 15",
                "roundTwo": " 28th Mar 15",
                "roundThree": "26th June 15",
                "roundFour":"18th Dec 15",
                "showAdd":false
            }
        ];
        vm.selectedSchool = {};
        vm.selectedRoud = '';

        // Exposed Functions
        vm.addHover = addHover;
        vm.addSchool = addSchool;
        vm.selectRound = selectRound;
        vm.isSelected = isSelected;

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

        // Helper Functions
        $scope.AddSchool = function () {

            ngDialog.open({
                template: 'components/dash/addSchool.tpl.html',
                className: 'ngdialog-theme-default dialogwidth640',
                controller:'Dash'

            });
        };

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

/**
 * Created by ghazala on 08/08/2015.
 */

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Login', LoginController);
    LoginController.$inject = ['$state', '$cookies'];

    function LoginController($state, $cookies) {
        var vm = this;

        // Exposed Variables
        vm.email = '';
        vm.password = '';
        vm.rememberFlag = false;

        // Exposed Methods
        vm.auth = login;

        function login() {
            $cookies.put('auth', 'true');
            $state.go('dash');
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

            console.log('logger: ' + ret);
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

/**
 * Created by ghazala on 08/08/2015.
 */

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Signup', SignupController);
    SignupController.$inject = ['$state'];

    function SignupController($state) {
        var vm = this;
        vm.state = $state;

        // Exposed Variables
        // Exposed Methods

        // Function definitions
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

