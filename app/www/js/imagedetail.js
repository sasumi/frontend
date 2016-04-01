/**
 * Created by sasumi on 2015/1/15.
 */
define('www/imagedetail', function(require){
	var net = require('ywj/net');
	var util = require('ywj/util');
	var msg = require('ywj/msg');

	var CUR_IMG = window['CUR_IMG'] || {};
	var IMG_LIST = window['IMG_LIST'] || [];
	var GET_IMG_LIST_URL = window['GET_IMG_LIST_URL'] || '';

	//初始化宽度
	var PER_WIDTH = 86;
	var $SLIDE = $('#g-slide');
	var $SELECTOR_WRAP = $('.image-view-selector-content-wrap');
	var $SELECTOR = $('.image-viewer-selector-list');
	var $SLIDE_CON = $('.g-slide-list li');
	var $SLIDE_NEXT = $('.g-slide-next');
	var $SLIDE_PREV = $('.g-slide-prev');
	var $HIDE_SIDE = $('.hide-side-btn');
	$SELECTOR.width(PER_WIDTH*$('li', $SELECTOR).size());

	var $SCROLL_BACK = $('.slide-left-btn');
	var $SCROLL_FORWARD = $('.slide-right-btn');

	var escape_html = function(str){
		return $('<div></div>').text(str).html();
	};

	var show_image_thumb = function(cb){
		cb = cb || function(){};
		var img = new Image();
		img.onload = function(){
			$('.g-slide-thumb').remove();
			var scale_style = __img_scale__({
				maxWidth: $SLIDE_CON.outerWidth(),
				maxHeight: $SLIDE_CON.outerHeight()
			}, {width:this.width, height:this.height});
			$('<span class="g-slide-thumb"></span>').appendTo($SLIDE_CON);
			$(this).css(scale_style).appendTo($('.g-slide-thumb'));
			cb(scale_style);
		};
		img.src = CUR_IMG.thumb_url;
	};

	var show_likes = function(){
		var like_data_url = CUR_IMG.like_data_url;
		var con = $('#guest-you-like .g-side-mod-con', $SLIDE);
		net.get(like_data_url, null, function(rsp){
			if(rsp && rsp.code == 0){
				var html = ['<ul class="g-list g-txt-list">'];
				$.each(rsp.data, function(k, v){
					html.push('<li><a href="'+this.url+'">'+ this.title+'</a></li>')
				});
				html.push('</ul>');
				con.html(html.join(''));
			}
		});
	};

	var update_like_op = function(){
		$('a.like-btn').attr('href', CUR_IMG.like_url)[CUR_IMG.liked ? 'addClass' : 'removeClass']('g-like-succ-icon');
		$('.g-img-addlike-icon').html(util.accessObject('counter.like_count',CUR_IMG));
		$('a.fav-btn').attr('href', CUR_IMG.fav_url);
		$('.g-img-addfav-icon').html(util.accessObject('counter.collect_count', CUR_IMG));
	};

	var update_slide_nav = function(){
		//prev & next
		var li = $('li.active', $SELECTOR);
		$SLIDE_PREV.attr('data-image-id',li.prev().attr('data-image-id') || '');
		$SLIDE_NEXT.attr('data-image-id',li.next().attr('data-image-id') || '');
	};

	var show_img = function(image_id, refresh){
		if(image_id == CUR_IMG.id && !refresh){
			//console.log('current');
			return;
		}

		CUR_IMG = IMG_LIST[image_id];
		if(!CUR_IMG){
			throw("NO IMAGE DATA FOUND");
		}

		if(history.replaceState){
			history.replaceState(null, '', CUR_IMG.link+location.hash);
			var t = document.title.split('_');
			t = t[t.length-1] || '过家家家装网';
			document.title = CUR_IMG.title + '_'+t;
		}

		$SLIDE.addClass('g-slide-loading');
		show_image_thumb(function(scale_style){
			var $IMG_CON = $('.g-slide-img');
			$IMG_CON.html('');
			var img = new Image();
			img.onerror = function(){detail_image_onerror(this);};
			img.src = CUR_IMG.url;
			$(img).css(scale_style);
			$(img).appendTo($IMG_CON);
		});

		//tags
		var html = [];
		$.each(CUR_IMG.categories, function(k, v){
			html.push('<li><a href="'+ v.url+'">'+escape_html(v.name)+'</a></li>');
		});
		$('.tag-list').html(html.join(''));

		//breadcrumb
		$('.g-breadcrumb li:last-child').text(CUR_IMG.title);

		//page-cap
		$('.page-cap h2').text(CUR_IMG.title);

		//share
		$('.g-share-list ul').html(
			'<li><a class="g-icon g-qzone-icon" href="http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=http://www.guojj.com/xiaoguotu/meitu-'+CUR_IMG.id+'.html&amp;title='+escape_html(CUR_IMG.title)+'&amp;pics=&amp;summary=专业提供2015年国内外最新流行的装修效果图，每日更新上百套最新风格的图册，供您参考最新的设计案例...&amp;desc=" target="_blank">QQ空间</a></li>'+
			'<li><a class="g-icon g-weibo-icon" href="http://service.weibo.com/share/share.php?appkey=583395093&amp;title='+escape_html(CUR_IMG.title)+'&amp;url=http://www.guojj.com/xiaoguotu/meitu-'+CUR_IMG.id+'.html&amp;source=bshare&amp;retcode=0&amp;ralateUid=" target="_blank">新浪微博</a></li>'+
			'<li class="last"><a class="g-icon g-txweibo-icon" href="http://share.v.t.qq.com/index.php?c=share&amp;a=index&amp;title='+escape_html(CUR_IMG.title)+'&amp;site=http://www.guojj.com/&amp;pic=&amp;url=http://www.guojj.com/xiaoguotu/meitu-'+CUR_IMG.id+'.html" target="_blank">腾讯微博</a></li>'
		);

		//album
		$('.g-album-cover img').attr({
			src: escape_html(util.accessObject('album.cover_image.thumb_url', CUR_IMG)),
			alt: escape_html(util.accessObject('album.title', CUR_IMG)),
			title: escape_html(util.accessObject('album.title', CUR_IMG)),
			'data-img-miss': ''
		});

		//list item active
		$('li', $SELECTOR).removeClass('active');
		$('.image-viewer-selector-list li[data-image-id='+image_id+']').addClass('active');

		update_slide_nav();
		show_likes();
		update_like_op();
		scroll_center();
	};

	var getFixUrl = function(url){
		url = url.replace(/#.*$/g, '');
		return url+location.hash;
	};

	//滚到中间
	var scroll_center = function(){
		if($SELECTOR.outerWidth() < $SELECTOR_WRAP.outerWidth()){
			return;
		}

		var cur = $('.active', $SELECTOR);
		var center_left = $SELECTOR_WRAP.outerWidth()/2;
		var now_left = $(cur).offset().left - $SELECTOR.offset().left + $(cur).outerWidth()/2;
		var ml = now_left - center_left;

		var max_ml = $SELECTOR.outerWidth() - center_left*2;
		ml = Math.min(ml, max_ml);
		$SELECTOR.animate({
			marginLeft: ml>0 ? -ml : 0
		}, 300);
	};

	//滚回去
	var scroll_back = function(){
		if($SELECTOR.outerWidth() < $SELECTOR_WRAP.outerWidth()){
			return;
		}
		var ml = parseInt($SELECTOR.css('margin-left'), 10);
		var offset = $SELECTOR_WRAP.outerWidth()/2;
		ml = ml + offset;
		$SELECTOR.animate({
			marginLeft: Math.min(ml, 0)
		});
	};

	//滚过去
	var scroll_forward = function(){
		if($SELECTOR.outerWidth() < $SELECTOR_WRAP.outerWidth()){
			return;
		}
		var ml = parseInt($SELECTOR.css('margin-left'), 10);
		var offset = $SELECTOR_WRAP.outerWidth()/2;
		ml = ml - offset;
		$SELECTOR.animate({
			marginLeft: Math.max(ml, $SELECTOR_WRAP.outerWidth()-$SELECTOR.outerWidth())
		});
	};

	//滚下一屏
	$SCROLL_FORWARD.click(function(){
		scroll_forward();
		return false;
	});

	//滚上一屏
	$SCROLL_BACK.click(function(){
		scroll_back();
		return false;
	});

	//隐藏、显示
	$HIDE_SIDE.click(function(){
		var detail_wrap =  $('.image-detail-wrap');
		detail_wrap.toggleClass('image-detail-hide-side');
		var toBig =  detail_wrap.hasClass('image-detail-hide-side');
		$(this).html(!toBig ? '&gt; 收起' : '&lt; 展开');
		net.setHash('sd', toBig?1:0);
		show_img(CUR_IMG.id, true);
		return false;
	});

	//上一张
	$SLIDE_PREV.click(function(){
		var image_id = $(this).attr('data-image-id');
		if(image_id){
			show_img(image_id);
		} else {
			msg.show('已经是第一张图片', 'info', 1);
		}
		return false;
	});

	//下一张
	$SLIDE_NEXT.click(function(){
		var image_id = $(this).attr('data-image-id');
		if(image_id){
			show_img(image_id);
		} else {
			msg.show('已经是最后一张图片', 'info', 1);
		}
		return false;
	});

	//大图点击
	$SLIDE_CON.click(function(ev){
		var con_offset = $(this).offset();
		var con_width = $(this).width();
		var pos_x = ev.pageX;
		if(pos_x > (con_offset.left + con_width/2)){
			$SLIDE_NEXT.trigger('click');
		} else {
			$SLIDE_PREV.trigger('click');
		}
		return false;
	});

	//鼠标手势改变
	$SLIDE_CON.mousemove(function(ev){
		var link = $(this);
		link.removeClass('cursor-forward').removeClass('cursor-back');
		var con_offset = $(this).offset();
		var con_width = $(this).width();
		var pos_x = ev.pageX;
		if(pos_x > (con_offset.left + con_width/2)){
			link.addClass('cursor-forward');
		} else {
			link.addClass('cursor-back');
		}
		return false;
	});

	//鼠标手势还原
	$SLIDE_CON.mouseout(function(){
		var link = $(this);
		link.removeClass('cursor-forward').removeClass('cursor-back');
	});

	$('li a', $SELECTOR).click(function(){
		show_img($(this.parentNode).attr('data-image-id'));
		return false;
	});

	$('.g-album-cover img').attr('data-img-miss', '');
	show_image_thumb(function(scale_style){$('.g-slide-img img').css(scale_style);});
	scroll_center();
	update_slide_nav();

	if(net.getParam('sd') == '1'){
		$HIDE_SIDE.trigger('click');
	}
});