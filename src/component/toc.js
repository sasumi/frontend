/**
 * 文章目录结构
 */
define('ywj/toc', function(require){
	require('ywj/resource/toc.css');
	var $ = require('jquery');
	var Util = require('ywj/util');
	var CLS = 'com-toc';
	var CLS_ACTIVE = 'active';

	var resolve_level = function($h){
		return parseInt($h[0].tagName.replace(/\D/,''), 10);
	};

	var scroll_top = function(){
		return $(window).scrollTop() || $('body').scrollTop();
	}

	var scroll_to = function($node){
		$('html').stop().animate({scrollTop: $node.offset().top - 10});
	};

	var toc = function($content){
		var html = '<ul class="'+CLS+'">';
		var hs = 'h1,h2,h3,h4,h5';

		//top
		var top_id = 'toc'+Util.guid();
		html += '<a href="#'+top_id+'" class="com-toc-top">本页目录</a>';
		$('<a name="'+top_id+'"></a>').prependTo('body');

		var max_level = 5;
		var last_lvl = 0;
		var start_lvl = 0;
		$content.find(hs).each(function(){
			var $h = $(this);
			var id = 'toc'+Util.guid();
			$('<a name="'+id+'"></a>').insertBefore($h);
			var lv = resolve_level($h);
			if(!start_lvl){
				start_lvl = lv;
			}
			if(!last_lvl){
				html += '<li><a href="#'+id+'">'+$h.text()+'</a>';
			}
			else if(lv === last_lvl){
				html += '</li><li><a href="#'+id+'">'+$h.text()+'</a>';
			}
			else if(lv > last_lvl){
				html += '<ul><li><a href="#'+id+'">'+$h.text()+'</a>';
			} else if(lv < last_lvl){
				html += '</li></ul></li>';
				html += '<li><a href="#'+id+'">'+$h.text()+'</a>';
			}
			last_lvl = lv;
		});
		for(var i=0; i<=(last_lvl-start_lvl); i++){
			html += '</li></ul>';
		}

		var $toc = $(html).appendTo('body');
		$toc.find('a').click(function(){
			var $a = $(this);
			var id = $a.attr('href').replace('#', '');
			var $anchor = $('a[name='+id+']');
			scroll_to($anchor);
			location.hash = '#'+id;
			return false;
		});

		//init
		var hash = location.hash.replace('#','');
		if(hash){
			var $anchor = $('body').find('a[name='+hash+']');
			if($anchor.size()){
				scroll_to($anchor);
			}
		}

		var upd = function(){
			var top = Math.max($content.offset().top, scroll_top());
			$toc.css({
				left:$content.offset().left + $content.outerWidth(),
				top: top
			});
			$toc.find('li').removeClass(CLS_ACTIVE);
			$toc.find('a').each(function(){
				var $a = $(this);
				var id = $a.attr('href').replace('#', '');
				var $anchor = $('a[name='+id+']');
				if($anchor.offset().top > scroll_top()){
					$a.parents('li').addClass(CLS_ACTIVE);
					return false;
				}
			})
		};

		$(window).resize(upd).scroll(upd);
		upd();
	};

	toc.nodeInit = toc;
	return toc;
});