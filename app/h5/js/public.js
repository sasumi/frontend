(function (doc, win) {
	var docEl = doc.documentElement,
		resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
		recalc = function () {
			var clientWidth = docEl.clientWidth;
			if (!clientWidth) return;
			docEl.style.fontSize = 20 * (clientWidth / 320) + 'px';
		};

	if (!doc.addEventListener) return;
	win.addEventListener(resizeEvt, recalc, false);
	doc.addEventListener('DOMContentLoaded', recalc, false);
	recalc();
})(document, window);

$(function () {
	//导航弹层
	$(".category-trigger").click(function () {
		$(".layer-nav").fadeIn();
	});
	$(".layer-nav").click(function () {
		$(this).fadeOut();
	});

	//百科
	$(".down-btn").click(function () {
		$(this).parents(".pull-down").toggleClass("pull-open");
	});

	//toggle TAB
	var $div_li =$(".tab-menu li");
    $div_li.click(function(){
		$(this).toggleClass("active").siblings().removeClass("active");
        var index =  $div_li.index(this);
		$(".tab-wrap > .tab-each").eq(index).toggle().siblings().hide();
	});
    //touchstart touchend
    $('a').bind("touchstart touchend", function(){
	   $(this).toggleClass("active");
	   setTimeout(function () {
			$('a.active').removeClass("active")
		}, 1000);
	});
});

