define('ywj/counter', function(require){
	var $ = require('jquery');
	var css =
		'.ywj-counter-trigger {position:absolute; height:0; z-index:2; margin-top:2px; border:1px solid #eee; background-color:white; box-sizing:border-box; opacity:0;} ' +
		'.ywj-counter-trigger s {display:block; height:2px; margin-top:-1px; background-color:#81afff;} ' +
		'.ywj-counter-trigger span {position:absolute; color:#aaa; background-color:#fff;} ' +
		'.ywj-counter-trigger span:hover {color:gray;}';
	$('<style>'+css+'</style>').appendTo('head');

	var $trigger;
	var show = function($node){
		if(!$trigger){
			$trigger = $('<div class="ywj-counter-trigger"><s></s><span></span></div>').appendTo('body');
		}
		$trigger.width($node.outerWidth()).css({
			left: $node.offset().left,
			top: $node.offset().top+$node.outerHeight()
		});
		$trigger.stop().show().animate({opacity:1});
		update($node);
	};

	var hide = function(){
		$trigger && $trigger.stop().animate({opacity:0}, hide);
	};

	var update = function($node){
		if($trigger){
			var max = $node.attr('maxlength') || 50;
			var per = Math.min($node.val().length / max, 1) * 100 + '%';
			$trigger.find('s').css('width', per);
			$trigger.find('span').html($node.val().length || '').css('left', per);
		}
	};

	return {
		nodeInit: function($node){
			$node.focus(function(){
				show($node);
			});
			$node.blur(hide);
			$node.on('change keyup keydown focus mouseup', function(){
				update($node);
			});
		}
	}
});