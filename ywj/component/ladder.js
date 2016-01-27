/**
 * ladder plugin
 * <p>
 * Usage: ladder('.ladder-list a', opt);
 * </p>
 */
define('ywj/ladder', function(require){
	var net = require('ywj/net');
	var $last_active_ladder = null;
	var ladder_scrolling = false;

	return function(selector, opt) {
		opt = $.extend({
			onAfterScrollTo: function($ladder_node, aim){},
			onBeforeScrollTo: function(aim){},
			ladderActiveClass: 'ladder-active',
			dataTag: 'href',
			animateTime: 400,
			addHistory: true,
			bindScroll: true,
			scrollContainer: 'body',
			preventDefaultEvent: true
		}, opt || {});

		var $selector = $(selector);

		/**
		 * scroll to aim
		 * @param aim
		 * @param $ladder_node
		 */
		var scroll_to = function(aim, $ladder_node){
			var $n = $(aim);
			if(!$n.size() || false === opt.onBeforeScrollTo(aim)){
				console.log('asdfasdf');
				return;
			}
			var pos = $n.offset().top;
			if(opt.ladderActiveClass){
				if($last_active_ladder){
					$last_active_ladder.removeClass(opt.ladderActiveClass);
				}
				$ladder_node.addClass(opt.ladderActiveClass);
				$last_active_ladder = $ladder_node;
			}
			ladder_scrolling = true;

			console.log('start animate');
			$(opt.scrollContainer).animate({scrollTop: pos}, opt.animateTime, function(){
				//fix JQuery animate complete but trigger window scroll event once still(no reason found yet)
				setTimeout(function(){
					if(opt.addHistory){
						if(window.history){
							history.pushState(null, null, aim);
						} else {
							location.hash = aim;
						}
					}
					ladder_scrolling = false;
					opt.onAfterScrollTo($ladder_node, aim);
				}, 50);
			});
		};

		//bind ladder node click
		$selector.click(function(){
			var $node = $(this);
			var aim = $node.attr(opt.dataTag);
			if(!/^#\w+$/i.test(aim)){
				console.error('ladder pattern check fail: '+aim);
				return;
			}
			scroll_to(aim, $node);
			if(opt.preventDefaultEvent){
				return false;
			}
		});

		//init state from location hash information
		if(opt.addHistory){
			$(function(){
				$selector.each(function(){
					var aim = $(this).attr(opt.dataTag);
					var m = location.href.match(new RegExp(aim+'(&|#|$|=)'));
					if(m){
						//match anchor link node
						if($(aim).size() && $(aim)[0].tagName == 'A'){
							console.info('ladder hit a:'+aim);
							return;
						}
						scroll_to(aim, $(this));
						return false;
					}
				});
			});
		}

		//bind scroll event
		if(opt.bindScroll){
			$(opt.scrollContainer == 'body' ? window : opt.scrollContainer).scroll(function(){
				var t = $(window).scrollTop();
				if(!ladder_scrolling){
					var $hit_node = null;
					var $hit_ladder_node = null;
					var hit_aim = '';
					$selector.each(function(){
						var $ladder_node = $(this);
						var aim = $ladder_node.attr(opt.dataTag);
						var $aim = $(aim);
						if($aim.size()){
							if(t >= $aim.offset().top){
								$hit_node = $aim;
								$hit_ladder_node = $ladder_node;
								hit_aim = aim;
							}
						}
					});

					if($hit_node){
						//make class
						if(opt.ladderActiveClass){
							if($last_active_ladder){
								$last_active_ladder.removeClass(opt.ladderActiveClass);
							}
							$hit_ladder_node.addClass(opt.ladderActiveClass);
							$last_active_ladder = $hit_ladder_node;
						}
						//trigger after scroll to
						opt.onAfterScrollTo($hit_ladder_node, hit_aim);
					}
				}
			}).trigger('scroll');
		}
	};
});
