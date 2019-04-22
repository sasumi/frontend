/**
 * Created by sasumi on 3/12/2014.
 */
define('ywj/masker', function(require){
	require('ywj/resource/masker.css');
	var $ = require('jquery');
	var Util = require('ywj/util');

	//遮罩层DOM
	var MASKER_DOM;

	return {
		/**
		 * show masker
		 * @param {Object||Null} styleConfig 样式配置，支持覆盖所有key
		 */
		show: function (styleConfig) {
			if (!MASKER_DOM) {
				MASKER_DOM = $('<div class="YWJ_MASKER"></div>').appendTo($('body'));
				if (styleConfig) {
					$.each(styleConfig, function (key, val) {
						MASKER_DOM.css(key, val);
					});
				}
			}

			var winRegion = Util.getRegion();
			MASKER_DOM.css({
				height:winRegion.documentHeight,
				width: $('body').outerWidth()
			});
			MASKER_DOM.show();
			setTimeout(function(){MASKER_DOM.addClass('YWJ_MASKER-in');}, 0)
		},

		/**
		 * hide masker
		 */
		hide: function () {
			if (MASKER_DOM) {
				MASKER_DOM.removeClass('YWJ_MASKER-in');
				setTimeout(function(){MASKER_DOM.hide();}, 200)
			}
		}
	};
});
