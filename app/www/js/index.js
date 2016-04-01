/**
 * Created by windy on 2015/4/28.
 */
define('www/index', function(require){

		var $ = require('jquery');
		var sw = require('ywj/tabswitcher');
		var area = require('ywj/areaselector');//预加载一下地区选择器

		//tab切换
		function switchTab() {
			sw('.qs-coll .g-tab', '.qs-coll .g-tab-con', 'click');
			sw('.recommend-shortcut .g-tab', '.recommend-shortcut .g-tab-con', 'mouseover');
		}

		//城市默认选为深圳
		function changeProvince()
		{
			$(".appointProvince").val("440000").change();
			$(".appointCity").val("440300");
		}

		//装修问题滑动
		function slideQuestion()
		{
			var page = 1;
			var i = 1;
			var len = $(".kn-eashlist").length;
			var page_count = Math.ceil(len / i);   //只要不是整数，就往大的方向取最小的整数
			var none_unit_width = $(".knowledge-cont").width(); //获取框架内容的宽度,不带单位
			var $parent = $(".knowledge-list");
			//向右 按钮
			$(".goRight").click(function () {
				if (!$parent.is(":animated")) {
					if (page == page_count) {  //已经到最后一个版面了,如果再向后，必须跳转到第一个版面。
						$parent.animate({left: 0}, 800); //通过改变left值，跳转到第一个版面
						page = 1;
					} else {
						$parent.animate({left: '-=' + none_unit_width}, 800);  //通过改变left值，达到每次换一个版面
						page++;
					}
				}
			});
			//往左 按钮
			$(".goLeft").click(function () {
				if (!$parent.is(":animated")) {
					if (page == 1) {  //已经到第一个版面了,如果再向前，必须跳转到最后一个版面。
						$parent.animate({left: '-=' + none_unit_width * (page_count - 1)}, 800); //通过改变left值，跳转到最后一个版面
						page = page_count;
					} else {
						$parent.animate({left: '+=' + none_unit_width}, 800);  //通过改变left值，达到每次换一个版面
						page--;
					}
				}
			});
		}

		function init()
		{
			$(document).ready(function(){
				switchTab();
				changeProvince();
				slideQuestion();
			});
		}
		init();
});

