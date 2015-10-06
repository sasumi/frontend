/**
 * Created by windy on 2015/4/28.
 */
define('www/construct_craft', function(require){
	var $ = require('jquery');

	function urlHashSwitch()
	{
		var hash = location.hash;
		var $hashTag = $("[href="+hash+"]");
		var index = $hashTag.parents(".techeachct").data('index');
		$("#map0"+index).click().mouseover();
		$hashTag.parent().click();
		$hashTag.click();
	}

	function switchMap()
	{
		//户型图切换
		$('#map area').each(function(){
			var _this = $(this);
			var img_con = $('#houseimg');

			_this.hover(function(){
				$(img_con).attr('class', 'houseimg').addClass(_this.data('class'));
			}, function(){
				$(img_con).attr('class', 'houseimg').addClass(img_con.data('init-class'));
			});

			_this.click(function(){
				img_con.data('init-class', _this.data('class'));
				$('.techeachct').eq(_this.index()).show().siblings().hide();
				$('.fitsetcont').eq(_this.index()).show().siblings().hide();
			});
		});

		$(".techlist li").click(function(){
			$(this).addClass("cur").siblings().removeClass("cur");
		});
	}

	function scroll()
	{
		//当滚动条的位置处于距顶部100像素以下时，返回顶部按钮出现，否则消失
		$(window).scroll(function(){
			if ($(window).scrollTop()>100){
				$(".gotopico").fadeIn(100);
			}
			else
			{
				$(".gotopico").fadeOut(100);
			}
		});

		//当点击返回按钮，回到页面顶部位置
		$(".gotopico").click(function(){
			$('body,html').animate({scrollTop:0},100);
			return false;
		});
	}

	$(document).ready(function(){
		switchMap();
		scroll();
		urlHashSwitch();
	});

});
