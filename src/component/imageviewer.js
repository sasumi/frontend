define('ywj/imageviewer', function(require){
	require('ywj/resource/imageviewer.css');
	var Scale = require('ywj/imagescale');
	var $ = require('jquery');
	var Util = require('ywj/util');
	var AC = require('ywj/AutoComponent');
	var LOADING_SRC = seajs.data.base + 'component/resource/ring.gif';
	var ID = 'image-viewer-container';
	var NAV_DISABLE_CLASS = 'iv-nav-disabled';
	var SCROLL_DISABLE_CLASS = 'iv-list-nav-disabled';
	var HEIGHT_OFFSET = 120;

	var win;
	var loader_tm;

	var TPL =
		'<div class="image-viewer-container" id="'+ID+'">\
			<span class="iv-close-btn" title="关闭"></span>\
			<span class="iv-prev-btn"></span>\
			<span class="iv-next-btn"></span>\
			<div class="iv-zoom-wrap">\
				<span class="iv-zoom-btn iv-zoom-out" title="放大"></span>\
				<span class="iv-zoom-btn iv-zoom-real" title="原始尺寸"></span>\
				<span class="iv-zoom-btn iv-zoom-in" title="缩小"></span>\
				<a href="javascript:void(0);" target="_blank" class="iv-zoom-btn iv-zoom-src">原图<span class="iv-image-size-abs"></span></a>\
			</div>\
			<div class="iv-list">\
				<span class="iv-list-left"></span>\
				<span class="iv-list-wrap">\
					<ul></ul>\
				</span>\
				<span class="iv-list-right"></span>\
			</div>\
			<img class="iv-img"/>\
			<span class="iv-title"></span>\
			<span class="iv-description"></span>\
		</div>';

	//update
	(new Image()).src = LOADING_SRC;

	var Viewer = function(){};

	var get_stage_region = function(){
		var r = Util.getRegion(win);
		return {
			width: r.visibleWidth,
			height: r.visibleHeight
		}
	};

	var update_container = function($container){
		var st = $container.closest('body').scrollTop() || $container.closest('html').scrollTop();
		var sl = $container.closest('body').scrollLeft() || $container.closest('html').scrollLeft();
		$container.css({
			top: st,
			left: sl,
			width: get_stage_region().width,
			height: get_stage_region().height
		});
	};

	var update_list = function($list, $list_wrap){
		var region = get_stage_region();
		$list_wrap.width(region.width - parseInt($list_wrap.css('margin-left'), 10) - parseInt($list_wrap.css('margin-right'), 10));
	};

	var update_image = function($img, original_width, original_height){
		var region = get_stage_region();
		var max_height = region.height - HEIGHT_OFFSET;

		var scale_info = Scale.scale({
			zoom_out: false,
			maxWidth: region.width * 0.9,
			maxHeight: max_height
		}, {width:original_width, height:original_height});
		$img.css({
			width: scale_info.width,
			height: scale_info.height,
			left: (region.width - parseInt(scale_info.width, 10))/2+'px',
			top: (region.height - parseInt(scale_info.height, 10))/2 - 10 +'px'
		}).data('org-width', original_width).data('org-height', original_height);
	};

	var zoom_image = function($container, $img, width, height){
		var offset = $img.offset();
		var center_point = {
			left: offset.left + $img.width()/2,
			top: offset.top + $img.height()/2
		};
		$img.stop().animate({
			left: center_point.left - width/2 - $container.offset().left,
			top: center_point.top - height/2 - $container.offset().top,
			width: width,
			height: height
		});
	};

	Viewer.init = function($node, $iv_list){
		win = window;
		try {
			while(win.parent != win){
				win = win.parent;
			}
		} catch(ex){
			console.warn(ex);
		}

		var $body = $('body', win.document);
		var src = $node.attr('href');

		var $container = $(TPL).appendTo($body);
		var $next = $container.find('.iv-next-btn');
		var $img = $container.find('.iv-img');
		var $prev = $container.find('.iv-prev-btn');

		var $size_abs = $container.find('.iv-image-size-abs');

		var $zoom_in = $container.find('.iv-zoom-in');
		var $zoom_real = $container.find('.iv-zoom-real');
		var $zoom_out = $container.find('.iv-zoom-out');
		var $zoom_src = $container.find('.iv-zoom-src');

		var $title = $container.find('.iv-title');
		var $close = $container.find('.iv-close-btn');
		var $desc = $container.find('.iv-desc');
		var $list = $container.find('.iv-list');
		var $list_wrap = $list.find('.iv-list-wrap');
		var $list_left = $list.find('.iv-list-left');
		var $list_right = $list.find('.iv-list-right');

		var total = $iv_list.size();

		var original_overflow_y = $body.css('overflow-y');
		var original_overflow_x = $body.css('overflow-x');
		$body.css({
			overflowY: 'hidden',
			overflowX: 'hidden'
		});

		var show_index = function(idx){
			$prev[idx == 0 ? 'addClass':'removeClass'](NAV_DISABLE_CLASS).attr('title', idx == 0 ? '已经是第一张':'');
			$next[idx == (total-1) ? 'addClass' : 'removeClass'](NAV_DISABLE_CLASS).attr('title', idx == (total-1) ? '已经是最后一张':'');
			var src = $iv_list.eq(idx).attr('href');
			console.debug('load image:['+idx+']'+src);
			clearTimeout(loader_tm);
			loader_tm = setTimeout(function(){
				$img.attr('src', LOADING_SRC);
				update_image($img, 122, 122);
			}, 500);
			$zoom_src.attr('href', src);
			var img = new Image();
			img.onload = function(){
				clearTimeout(loader_tm);
				update_image($img, this.width, this.height);
				$size_abs.html('('+this.width + 'x' + this.height + ')');
				$img.attr('src', src);
			};
			img.src = src;
			index = idx;

			var $cur = $list.find('li').removeClass('active').eq(index).addClass('active');

			var scroll_left = $list_wrap.scrollLeft();
			var item_left = $cur.outerWidth() * index;
			var item_right = item_left + $cur.outerWidth();
			if(item_left < scroll_left){
				$list_wrap.stop().animate({
					scrollLeft: item_left
				}, function(){
					$list_wrap.trigger('scroll');
				});
			} else if(item_right > ($list_wrap.outerWidth() + scroll_left)){
				$list_wrap.stop().animate({
					scrollLeft: item_right - $list_wrap.outerWidth()
				}, function(){
					$list_wrap.trigger('scroll');
				});
			} else {
				$list_wrap.trigger('scroll');
			}
		};

		var index = 0;
		$iv_list.each(function(k, v){
			if(this == $node[0]){
				index = k;
				return false;
			}
		});

		if($iv_list.size() < 2){
			$next.hide();
			$prev.hide();
			$list.hide();
		} else {
			var html = '';
			$iv_list.each(function(k, v){
				var src = $(this).attr('href');
				var thumb = $(this).find('img').attr('src') || src;
				html += '<li>';
				html += '<span><img src="'+thumb+'" onload="__img_adjust__(this);" onerror="__img_error__(this);"/></span>';
				html += '</li>';
			});
			var $ul = $list.find('ul').html(html);
			$ul.width($ul.find('li:first').outerWidth() * $iv_list.size());
		}

		$next.click(function(){
			if($next.hasClass(NAV_DISABLE_CLASS)){
				return false;
			}
			show_index(index+1);
			return false;
		});

		$prev.click(function(){
			if($prev.hasClass(NAV_DISABLE_CLASS)){
				return false;
			}
			show_index(index-1);
			return false;
		});

		$close.click(function(){
			$body.css('overflow-y', original_overflow_y);
			$body.css('overflow-x', original_overflow_x);
			$container.remove();
			$container = null;
		});

		$zoom_in.click(function(){
			zoom_image($container, $img, $img.width()*1.3, $img.height()*1.3);
			return false;
		});

		$zoom_real.click(function(){
			zoom_image($container, $img, $img.data('org-width'), $img.data('org-height'));
			return false;
		});

		$zoom_out.click(function(){
			zoom_image($container, $img, $img.width()*0.7, $img.height()*0.7);
			return false;
		});

		$list.find('li').click(function(){
			show_index($(this).index());
			return false;
		});

		//zoom to real
		$img.dblclick(function(){
			var is_real = $img.data('org-width') == $img.width();
			if(!is_real){
				zoom_image($container, $img, $img.data('org-width'), $img.data('org-height'));
			}
			return false;
		});

		$list_wrap.on('scroll', function(){
			$list_left[$list_wrap.scrollLeft() == 0 ? 'addClass' : 'removeClass'](SCROLL_DISABLE_CLASS);
			var w = $list_wrap.width();
			var max_left = $list.find('ul').outerWidth() - w;
			if($list.find('ul').outerWidth() <= w || $list_wrap.scrollLeft() == max_left){
				$list_right.addClass(SCROLL_DISABLE_CLASS);
			} else {
				$list_right.removeClass(SCROLL_DISABLE_CLASS);
			}
		});

		$list_left.click(function(){
			if($(this).hasClass(SCROLL_DISABLE_CLASS)){
				return false;
			}
			var region = get_stage_region();
			var left = Math.max($list_wrap.scrollLeft()-region.width / 3, 0);
			$list_wrap.stop().animate({
				scrollLeft:left
			}, function(){
				$list_wrap.trigger('scroll');
			});
		});

		$list_right.click(function(){
			if($(this).hasClass(SCROLL_DISABLE_CLASS)){
				return false;
			}
			var max_left = $list.find('ul').outerWidth() - $list_wrap.width();
			var region = get_stage_region();
			var left = Math.min($list_wrap.scrollLeft()+region.width / 3, max_left);
			$list_wrap.stop().animate({
				scrollLeft: left
			}, function(){
				$list_wrap.trigger('scroll');
			});
		});

		var wheel_tm;
		var msw_evt =(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";
		$body.on(msw_evt, function(e){
			var org_event = e.originalEvent;
			if(!$container){
				return;
			}
			clearTimeout(wheel_tm);
			wheel_tm = setTimeout(function(){
				var delta = org_event.detail || org_event.wheelDelta || org_event.deltaY;
				if(delta > 0){
					$next.trigger('click');
				} else {
					$prev.trigger('click');
				}
			}, 10);
		});

		$body.keydown(function(e){
			if(!$container){
				return;
			}
			switch(e.keyCode){
				case Util.KEYS.ESC:
					$close.trigger('click');
					e.stopPropagation();
					e.preventDefault();
					return false;

				case Util.KEYS.LEFT:
					$prev.trigger('click');
					break;

				case Util.KEYS.RIGHT:
					$next.trigger('click');
					break;

				case Util.KEYS.UP:
					$zoom_out.trigger('click');
					break;

				case Util.KEYS.DOWN:
					$zoom_in.trigger('click');
					break;
			}
		});

		//move
		var $current_img = null;
		var last_region, last_pos;
		$container.delegate('img', 'mousedown', function(e){
			if(!$container){
				return;
			}
			$current_img = $(this);
			last_pos = {
				x: e.clientX,
				y: e.clientY
			};
			last_region = {
				x: $(this).offset().left,
				y: $(this).offset().top
			};
			return false;
		});
		$('body', win.document).mouseup(function(){
			$current_img = false;
		});
		$('body', win.document).mousemove(function(e){
			if($current_img && $container){
				$current_img.css({
					left: last_region.x + e.clientX - last_pos.x - $container.offset().left,
					top: last_region.y + e.clientY - last_pos.y - $container.offset().top
				});
				return false;
			}
		});

		//resize
		$(win).resize(function(){
			if($container){
				update_container($container);
				update_list($list, $list_wrap);
			}
		});

		update_container($container);
		update_list($list, $list_wrap);
		show_index(index);
	};

	Viewer.nodeClick = function($node, param){
		if($node[0].tagName !== 'A' || !$node.attr('href')){
			throw "view node click only take effect on link node";
		}
		var scope = param.scope || 'body';
		var $iv_list = $(scope + ' [data-component]').filter(function(){return AC.nodeHasComponent($(this), 'ywj/imageviewer');});
		Viewer.init($node, $iv_list);
		return false;
	};
	return Viewer;
});