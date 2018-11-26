define('ywj/autoresize', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');

	return {
		nodeInit: function($text, param){
			var OFFSET = 5;
			$text.css({
				'overflow': 'hidden',
				'resize': 'none',
				'min-height': $text.height()
			});
			var $shadow = $('<div style="display:none;">').appendTo('body');
			$.each(['white-space', 'width', 'min-height', 'min-width', 'font-family', 'font-size', 'line-height', 'padding', 'word-wrap'], function(k, css_pro){
				$shadow.css(css_pro, $text.css(css_pro));
			});

			var es = 'change keydown keyup cut paste drop'.split(' ');
			for(var i = 0; i < es.length; i++){
				$text.on(es[i], function(){
					var html = Util.htmlEscape($text.val() || ' ');
					html = html
						.replace(/\n$/, '<br/>&nbsp;')
						.replace(/\n/g, '<br/>')
						.replace(/\s/g, '&nbsp;')
						.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
					console.log(html);
					$shadow.html(html);
					$text.stop().animate({
						height:$shadow.height()+OFFSET
					}, 'fast', function(){
						console.log('done');
					});
				})
			}
		}
	}
});