/**
 * Created by windy on 2015/4/28.
 */
define('www/construct_noun', function(require){
	var $ = require('jquery');
	//当滚动条的位置处于距顶部100像素以下时，返回顶部按钮出现，否则消失
	function goTop(){
		var $goTopIco = $(".gotopico");

		$(window).scroll(function(){
			var scrollTop = $(window).scrollTop();
			if (scrollTop>100){
				$goTopIco.fadeIn(200);
			}else{
				$goTopIco.fadeOut(200);
			}
		});

		//当点击返回按钮，回到页面顶部位置
		$goTopIco.click(function(){
			$('body,html').animate({scrollTop:0},200);
		});
	}

	function initTree(){
		var $contentNav = $(".contentNav");
		var $nav = $contentNav.find("a");
		var $navTitle = $contentNav.find(".navTitle");
		var $cNav = $(".c-nav");
		var $liftList = $(".liftlist");

		function _setActive(href){
			var $thisSameContainer = $contentNav.find("[href="+href+"]");
			$nav.removeClass("cur");
			$contentNav.removeClass("cur");
			$thisSameContainer.each(function(){
				var self = $(this);
				var $paNav = self.parents(".contentNav");
				self.addClass("cur");
				$paNav.addClass("cur");
				_setTreeActive($paNav);
			});
		}

		function _setTreeActive($contentNav)
		{
			var $ul = $contentNav.find("ul");
			if($ul.is(":visible")){
				$contentNav.addClass("liftclose");
				$ul.hide();
			}else{
				$liftList.find("ul").hide();
				$liftList.find(".contentNav").removeClass("liftopen").addClass("liftclose");
				$contentNav.addClass("liftopen").removeClass("liftclose");
				$ul.show();
			}
		}

		$nav.click(function(){
			var _this = $(this);
			var href = _this.attr("href");
			_setActive(href);
		});

		$navTitle.click(function(){
			var _this = $(this);
			_setTreeActive(_this.parents(".contentNav"));
		});

		var cNavArr = [];
		$cNav.each(function(){
			cNavArr.push({
				id:'#'+$(this).attr("id"),
				offsetTop:parseInt($(this).offset().top)
			});
		});

		$(window).scroll(function(){
			var scrollTop = $(window).scrollTop();
			if (scrollTop > 200) {
				$liftList.parent(".fit-lift").fadeIn(200);
			}else{
				$liftList.parent(".fit-lift").fadeOut(200);
			}
			$.each(cNavArr, function(index, ele){
				var h = ele.offsetTop - scrollTop;
				if ( (-20 <= h) && (h < 150)) {
					_setActive(ele.id);
				}
			});
		});
	}

	function init(){
		goTop();
		initTree();
	}
	init();
});