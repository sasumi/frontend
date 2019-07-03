/**
 * 底部固定
 */
define('ywj/FixedBottom',function(require){
	var Util = require('ywj/util');
	var cls = 'fixed-bottom';
	var css = '.'+cls+' {position:fixed; bottom:0; background-color:#ffffffd9}';
	$('<style>'+css+'</style>').appendTo($('head'));

	return {
		nodeInit: function($node){
			var height = $node.height();
			var width = $node.width();
			var outer_height = $node.outerHeight();
			var outer_width = $node.outerWidth();
			var $shadow = $('<'+$node[0].nodeName+'>');
			$shadow.css('visibility', 'hidden').width(outer_width).height(outer_height).hide();
			$shadow.insertAfter($node);
			$(window).scroll(function(){
				var top = $node.offset().top;
				var scroll_top = $(this).scrollTop();
				var vh = Util.getRegion().visibleHeight;
				if(scroll_top+vh > (top+outer_height)){
					$node.removeClass(cls).removeAttr('height').removeAttr('width');
					$shadow.hide();
				} else {
					$node.addClass(cls).height(height).width(width);
					$shadow.show();
				}
			}).trigger('scroll');
		}
	}
});