define('ywj/NoviceGuide', function(require){
	var $ = require('jquery');
	var Tip = require('ywj/tip');

	$('<style>.novice-guide-counter {float:left; color:gray;} .novice-guide-next-wrap {text-align:right; margin-top:10px;}</style>').appendTo('head');

	var $masker, $stopper;
	var show_highlight_zone = function(selector, region){
		hide_highlight_zone();
		if(!$masker){
			$masker = $('<div style="position:absolute; outline:2px solid #ffffff8a; height:40px; width:40px; box-shadow:0px 0px 0px 2000px rgba(0, 0, 0, 0.6); z-index:10000"></div>').appendTo('body');
			$stopper = $('<div style="width:100%; height:100%; position:absolute; left:0; top:0; z-index:10000"></div>').appendTo('body');
		}
		$stopper.show();

		if(selector){
			var $node = $(selector);
			$masker.show().css({
				left: $node.offset().left,
				top: $node.offset().top,
				width: $node.outerWidth(),
				height: $node.outerHeight()
			});
		} else {
			$masker.show().css({
				left: region.left,
				top: region.top,
				width: region.width,
				height: region.height
			});
		}
		return $masker;
	};

	var hide_highlight_zone = function(){
		$stopper && $stopper.hide();
		$masker && $masker.hide();
	};

	/**
	 * 显示引导浮层
	 * @param steps [{content:"浮层内容1", relate:'.node-class'}, ...] 步骤
	 * @param object opts 选项
	 */
	return function(steps, opts){
		var org_steps = $.extend([], steps);

		opts = $.extend({
			next_button_text: '下一步',
			prev_button_text: '上一步',
			finish_button_text: '完成',
			top_close: true,  //是否显示顶部关闭按钮
			cover_included: false, //提供的步骤里面是否包含封面步骤
			show_counter: false, //是否显示计数器
			on_finish: function(){} //完成显示后的回调(包含顶部关闭操作)
		}, opts);

		var show_one = function(){
			if(!steps.length){
				hide_highlight_zone();
				opts.on_finish();
				return;
			}

			var step = steps[0];
			steps.shift();

			var showing_cover = opts.cover_included && org_steps.length === (steps.length +1);
			var $masker;

			//masker
			if(showing_cover){
				$masker = show_highlight_zone(null, {
					left: $('body').width()/2,
					top: 300,
					width:1,
					height:1
				})
			} else {
				$masker = show_highlight_zone(step.relate);
			}

			var next_html = '<div class="novice-guide-next-wrap">';

			if((steps.length+2)<=org_steps.length){
				next_html += '<span class="novice-guide-prev-btn btn btn-weak btn-small">'+opts.prev_button_text+'</span> ';
			}
			if(steps.length && opts.next_button_text){
				next_html += '<span class="novice-guide-next-btn btn btn-small">'+opts.next_button_text+'</span>';
			}
			if(!steps.length && opts.finish_button_text){
				next_html += '<span class="novice-guide-finish-btn btn btn-small">'+opts.finish_button_text+'</span>';
			}
			if(opts.show_counter){
				next_html += '<span class="novice-guide-counter">'+(org_steps.length - steps.length)+'/'+org_steps.length+'</span>';
			}
			next_html += '</div>';

			var tp = new Tip('<div class="novice-guide-content">' + step.content + '</div>' + next_html, showing_cover ? $masker : step.relate, {
				closeBtn: opts.top_close,
				dir: showing_cover ? 6: 'auto'
			});
			tp.onHide.listen(function(){
				tp.destroy();
				hide_highlight_zone();
				opts.on_finish();
			});
			tp.onShow.listen(function(){
				tp.getDom().css({zIndex:10001});
				tp.getDom().find('.novice-guide-next-btn,.novice-guide-finish-btn').click(function(){
					tp.destroy();
					show_one();
				});
				tp.getDom().find('.novice-guide-prev-btn').click(function(){
					tp.destroy();
					var len = steps.length;
					steps.unshift(org_steps[org_steps.length - len - 1]);
					steps.unshift(org_steps[org_steps.length - len - 2]);
					show_one();
				});
			});
			tp.show();
		};
		show_one();
	};
});