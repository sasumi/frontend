/**
 * Created by sasumi on 2015/1/15.
 */
define('www/albumdetail', function(require){
	var net = require('ywj/net');
	var util = require('ywj/util');
	var msg = require('ywj/msg');
	var tmpl = require('ywj/tmpl');

	var NAV_ALBUMS = window['NAV_ALBUMS'];
	var ALBUM = window['ALBUM'];
	var IMAGE_LIST = window['IMAGE_LIST'];
	if(!ALBUM || !IMAGE_LIST){
		console.error('no album data found');
		return;
	}

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

	var get_image_link = function(image){
		return 'http://www.guojj.com/xiaoguotu/tuce-'+ALBUM.id+'.html';
	};

	var get_like_data_url = function(image){
		return 'http://www.guojj.com/like/like/item_id/'+image.id+'/type/1?ref=json';
	};

	var get_fav_url = function(image){
		return 'http://www.guojj.com/favorite/favoriteImage/image_id/'+image.id+'/fav_from/2';
	};

	var show_image_thumb = function(image_data, cb){
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
		img.src = image_data.thumb_url;
	};

	var show_likes = function(IMG){
		var con = $('#guest-you-like .g-side-mod-con', $SLIDE);
		net.get(get_like_data_url(IMG), null, function(rsp){
			if(rsp && rsp.code == 0 && rsp.data){
				var html = ['<ul class="g-list g-txt-list">'];
				$.each(rsp.data, function(k, v){
					html.push('<li><a href="'+this.url+'">'+ this.title+'</a></li>')
				});
				html.push('</ul>');
				con.html(html.join(''));
			}
		});
	};

	var update_like_op = function(IMG){
		$('a.like-btn').attr('href', get_like_data_url(IMG))[IMG.liked ? 'addClass' : 'removeClass']('g-like-succ-icon');
		$('.g-img-addlike-icon').html(util.accessObject('counter.like_count',IMG));
		$('a.fav-btn').attr('href', get_fav_url(IMG));
		$('.g-img-addfav-icon').html(util.accessObject('counter.collect_count', IMG));
	};

	var update_slide_nav = function(){
		var li = $('li.active', $SELECTOR);
		$SLIDE_PREV.attr('data-image-id',li.prev().attr('data-image-id') || '');
		$SLIDE_NEXT.attr('data-image-id',li.next().attr('data-image-id') || '');
	};

	var update_share_dom = function(image_id, image_title){
		var html = tmpl($('#share-tpl').html(), {
			id: image_id,
			title: escape_html(image_title)
		});
		$('.g-share-list ul').html(html);
	};

	var _last_image_id_ = null;
	var show_image = function(image_id, refresh){
		var ORI_IMAGE_ID;
		var CUR_IMAGE;

		if(image_id){
			_last_image_id_ = image_id;
		} else {
			image_id = _last_image_id_;
		}

		$('.image-viewer-selector-list li.active').each(function(){
			ORI_IMAGE_ID = $(this).data('image-id');
			CUR_IMAGE = IMAGE_LIST[image_id];
		});

		if((image_id == ORI_IMAGE_ID && !refresh) || !CUR_IMAGE){
			return;
		}

		$SLIDE.addClass('g-slide-loading');
		show_image_thumb(CUR_IMAGE, function(scale_style){
			var $IMG_CON = $('.g-slide-img');
			$IMG_CON.html('');
			var img = new Image();
			img.onerror = function(){detail_image_onerror(this);};
			img.src = CUR_IMAGE.url;
			$(img).css(scale_style);
			$(img).appendTo($IMG_CON);
		});

		//tags
		var html = [];
		$.each(CUR_IMAGE.categories, function(k, v){
			html.push('<li><a href="'+ v.url+'">'+escape_html(v.name)+'</a></li>');
		});
		$('.tag-list').html(html.join(''));

		//breadcrumb
		$('.g-breadcrumb li:last-child').text(CUR_IMAGE.title);

		//share
		update_share_dom(CUR_IMAGE.id, CUR_IMAGE.title);

		//album
		$('.g-album-cover img').attr({
			src: escape_html(util.accessObject('album.cover_image.thumb_url', CUR_IMAGE)),
			alt: escape_html(util.accessObject('album.title', CUR_IMAGE)),
			title: escape_html(util.accessObject('album.title', CUR_IMAGE)),
			'data-img-miss': ''
		});

		//list item active
		$('li', $SELECTOR).removeClass('active');
		$('.image-viewer-selector-list li[data-image-id='+image_id+']').addClass('active');

		update_slide_nav();
		show_likes(CUR_IMAGE);
		update_like_op(CUR_IMAGE);
		scroll_center();
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
		show_image(null, true);
		return false;
	});

	//上一张
	$SLIDE_PREV.click(function(){
		var image_id = $(this).attr('data-image-id');
		if(image_id){
			show_image(image_id);
		} else {
			if(NAV_ALBUMS.prev){
				msg.show('已经是第一张图片，即将为你跳转到上一个相册', 'info', 1);
				setTimeout(function(){
					location.href = NAV_ALBUMS.prev.url+location.hash;
				}, 1000);
			} else {
				msg.show('已经是第一张图片', 'info', 1);
			}
		}
		return false;
	});

	//下一张
	$SLIDE_NEXT.click(function(){
		var image_id = $(this).attr('data-image-id');
		if(image_id){
			show_image(image_id);
		} else {
			if(NAV_ALBUMS.next){
				msg.show('已经是最后一张图片，即将为你跳转到下一个相册', 'info', 1);
				setTimeout(function(){
					location.href = NAV_ALBUMS.next.url+location.hash;
				}, 1000);
			} else {
				msg.show('已经是最后张图片', 'info', 1);
			}
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

	$('li span', $SELECTOR).click(function(){
		show_image($(this.parentNode).data('image-id'));
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