define('ywj/counter', function(require){
	var $ = require('jquery');
	var css =
		'.ywj-counter-trigger {position:absolute;} ' +
		'.ywj-counter-trigger-wrap {position:absolute; right:0; white-space:nowrap; padding:1px 2px; background-color:#fff;}' +
		'.ywj-counter-trigger-val {font-weight:bold; }' +
		'.ywj-counter-trigger-max {color:gray;}' +
		'.ywj-counter-trigger-overflow .ywj-counter-trigger-val {color:red;}';
	$('<style>'+css+'</style>').appendTo('head');

	var $trigger;

	var show = function($node, max){
		if(!$trigger){
			$trigger = $('<div class="ywj-counter-trigger"><span class="ywj-counter-trigger-wrap"></span></div>').appendTo('body');
		}
		$trigger.css({
			left: $node.offset().left + $node.outerWidth(),
			top: $node.offset().top + $node.outerHeight()
		});
		$trigger.stop().show().animate({opacity: 1});
		update($node, max);
	};

	var buildHtml = function(count, max){
		var html = '';
		html += '<span class="ywj-counter-trigger-val">' + count + '</span>';
		html += max ? ' / <span class="ywj-counter-trigger-max">' + max + '</span>' : '';
		return html;
	};

	var hide = function(){
		$trigger && $trigger.stop().animate({opacity:0}, hide);
	};

	var update = function($node, max){
		if($trigger){
			var count = $node.val().length;
			var html = buildHtml(count, max);
			var $wrap = $trigger.find('.ywj-counter-trigger-wrap');
			$wrap[max && max < count ? 'addClass' : 'removeClass']('ywj-counter-trigger-overflow');
			$trigger.find('.ywj-counter-trigger-wrap').html(html);
		}
	};

	var bindTextareaOnResize = function($text, handler){
		var ti = null;
		$text.on('mousedown', function(){
			ti = setInterval(handler, 1000/15);
		});
		$(window).on('mouseup', function(){
			if(ti !== null){
				clearInterval(ti);
			}
			//handler();
		})
	};

	return {
		nodeInit: function($node, param){
			var max = param.maxlength || $node.attr('maxlength');
			$node.focus(function(){
				show($node, max);
			});
			$node.blur(hide);
			$node.on('change keyup keydown focus mouseup', function(){
				update($node, max);
			});

			if($node[0].tagName == 'TEXTAREA'){
				bindTextareaOnResize($node, function(){
					console.log("on resize");
					show($node, max);
				});
			}
		}
	}
});