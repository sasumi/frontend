define('ywj/counter', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');

	var css =
		'.ywj-counter-trigger {position:absolute; opacity:1; transition: all 0.1s linear;} ' +
		'.ywj-counter-trigger-hide {opacity:0}'+
		'.ywj-counter-trigger-wrap {position:absolute; right:0; white-space:nowrap; padding:1px 2px; background-color:#fff;}' +
		'.ywj-counter-trigger-val {font-weight:bold; }' +
		'.ywj-counter-trigger-max {color:gray;}' +
		'.ywj-counter-trigger-overflow .ywj-counter-trigger-val {color:red;}';
	$('<style>'+css+'</style>').appendTo('head');

	var GUID_KEY = 'counter-guid';

	var trigger_list = {};

	var get_trigger = function($node){
		return trigger_list[$node.data(GUID_KEY)];
	};

	var set_trigger = function($node, $trigger){
		trigger_list[$node.data(GUID_KEY)] = $trigger;
	};

	var show = function($node, max, as_init){
		var $trigger = get_trigger($node);
		if(!$trigger){
			$trigger = $('<div class="ywj-counter-trigger ywj-counter-trigger-hide"><span class="ywj-counter-trigger-wrap"></span></div>').appendTo('body');
			set_trigger($node, $trigger);
		}
		$trigger.css({
			left: $node.offset().left + $node.outerWidth(),
			top: $node.offset().top + $node.outerHeight()
		});
		update($node, max);
		if(!as_init){
			$trigger.removeClass('ywj-counter-trigger-hide');
		}
	};

	var buildHtml = function(count, max){
		var html = '';
		html += '<span class="ywj-counter-trigger-val">' + count + '</span>';
		html += max ? ' / <span class="ywj-counter-trigger-max">' + max + '</span>' : '';
		return html;
	};

	var hide = function($node){
		var $trigger = get_trigger($node);
		if($trigger){
			$trigger.addClass('ywj-counter-trigger-hide');
		}
	};

	var update = function($node, max){
		var $trigger = get_trigger($node);
		var count = $node.val().length;
		var html = buildHtml(count, max);
		var $wrap = $trigger.find('.ywj-counter-trigger-wrap');
		$wrap[max && max < count ? 'addClass' : 'removeClass']('ywj-counter-trigger-overflow');
		$trigger.find('.ywj-counter-trigger-wrap').html(html);
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
		})
	};

	return {
		nodeInit: function($node, param){
			var max = param.maxlength || $node.attr('maxlength');
			$node.data(GUID_KEY, Util.guid());
			$node.focus(function(){
				show($node, max);
			});
			$node.blur(function(){
				hide($node);
			});
			$node.on('change keyup keydown focus mouseup', function(){
				update($node, max);
			});

			//init
			show($node, max, true);

			if($node[0].tagName === 'TEXTAREA'){
				bindTextareaOnResize($node, function(){
					console.debug("Counter on resize");
					show($node, max);
				});
			}
		}
	}
});