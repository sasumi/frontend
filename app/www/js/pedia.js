define('www/pedia', function(require){
	var $ = require('jquery');
	$(function(){
		var $LIST = $('.image-viewer-selector-list');
		var $LEFT = $('.slide-left-btn');
		var $RIGHT = $('.slide-right-btn');
		var $LIST_NAV = $('.slide-nav');

		var OFFSET = $LIST.children().eq(0).outerWidth() * 5;
		var total_len = $LIST.width();
		var MAX_ML = total_len - $LIST.parent().outerWidth();

		$LEFT.click(function(){
			var ml = parseInt($LIST.css('margin-left'), 10);
			ml = Math.min(ml + OFFSET, 0);
			$LIST.animate({marginLeft: ml+'px'});
			update_dot_pos(ml);
			return false;
		});

		$RIGHT.click(function(){
			var ml = parseInt($LIST.css('margin-left'), 10);
			ml = Math.max(ml-OFFSET, -MAX_ML);
			$LIST.animate({marginLeft: ml+'px'});
			update_dot_pos(ml);
			return false;
		});

		var update_dot_pos = function(ml){
			var c = (-ml / OFFSET)-0.1;
			c = parseInt(Math.ceil(c), 10);
			$LIST_NAV.children().removeClass('active');
			$LIST_NAV.children().eq(c).addClass('active');
		};

		$LIST_NAV.children().click(function(){
			var idx = $(this).index();
			to_index(idx);
			return false;
		});

		var to_index = function(idx){
			var ml = -idx*OFFSET;
			ml = Math.max(ml, -MAX_ML);
			ml = Math.min(ml, 0);
			$LIST.animate({marginLeft: ml+'px'});
			$LIST_NAV.children().removeClass('active');
			$LIST_NAV.children().eq(idx).addClass('active');
		};

		to_index(0);
	});
});