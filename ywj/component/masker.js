/**
 * Created by sasumi on 3/12/2014.
 */
define('ywj/masker', function(require){
	var $ = require('jquery');
	var util = require('ywj/util');

	//默认遮罩层样式配置
	var MASKER_STYLE_ID = '__MASKER_STYLE__';
	var MASKER_CLASS = 'YWJ_MAKSER';
	var MASKER_STYLESHEET = '.'+MASKER_CLASS+'{position:absolute;top:0;left:0;width:100%;background-color:#ccc;z-index:100;opacity:0.5; filter: alpha(opacity=50);}';

	//遮罩层DOM
	var MASKER_DOM;

	return {
		/**
		 * show masker
		 * @param {Object||Null} styleConfig 样式配置，支持覆盖所有key
		 */
		show: function (styleConfig) {
			if (!MASKER_DOM) {
				$('<style id="' + MASKER_STYLE_ID + '">' + MASKER_STYLESHEET + '</style>').appendTo($('head'));
				MASKER_DOM = $('<div class="' + MASKER_CLASS + '"></div>').appendTo($('body'));
				if (styleConfig) {
					$.each(styleConfig, function (key, val) {
						MASKER_DOM.css(key, val);
					});
				}
			}

			var winRegion = util.getRegion();
			MASKER_DOM.css('height', winRegion.documentHeight);
			MASKER_DOM.show();
		},

		/**
		 * hide masker
		 */
		hide: function () {
			if (MASKER_DOM) {
				MASKER_DOM.hide();
			}
		}
	};
});
