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
		$(this).toggleClass("active")            //当前<li>元素高亮
			   .siblings().removeClass("active");  //去掉其他同辈<li>元素的高亮
        var index =  $div_li.index(this);  // 获取当前点击的<li>元素 在 全部li元素中的索引。
		$(".tab-wrap > .tab-each")   	//选取子节点。不选取子节点的话，会引起错误。如果里面还有div 
				.eq(index).toggle()   //显示 <li>元素对应的<div>元素
				.siblings().hide(); //隐藏其他几个同辈的<div>元素
	});
    //touchstart
    $('a').bind("touchstart", function(){  
	   $(this).addClass("active");
	});
	//touchend
    $('a').bind("touchend", function(){  
	   $(this).removeClass("active");
	});

});


