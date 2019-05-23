define('ywj/ScrollFix', function (require) {
	var $ = require('jquery');

	var CLS_FIXED = 'scroll-fixed';
	$('<style>.'+CLS_FIXED+' {position:fixed; top:0}</style>').appendTo('head');

	var $win = $(window);
	var $body = $('body');

	return {
		nodeInit: function($node, param){
			var $holder = $('<div style="height:0; visibility:hidden;"></div>');
			$holder.insertBefore($node);
			var ORG_H = $node.outerHeight();

			//offset height 和 height偏移量，用于恢复node宽度，这种只能针对width没有设置为固定值的情况
			//如果node的width固定了，这里会出现bug
			var ORG_W_OFFSET = $node.outerWidth() - $node.width();
			$node.css({width: $node.width()});

			var upd_pos = function(){
				var st = $body.scrollTop() || $win.scrollTop();
				var chk_top = $holder.position().top;
				$node.width($holder.outerWidth() - ORG_W_OFFSET);
				if(st > chk_top){
					$holder.height(ORG_H);
					$node.addClass(CLS_FIXED);
				} else {
					$holder.height(0);
					$node.removeClass(CLS_FIXED);
				}
			};

			$win.scroll(upd_pos).trigger('scroll');
			$win.resize(function(){
				setTimeout(function(){
					upd_pos();
				}, 0)
			});
		}
	};
});