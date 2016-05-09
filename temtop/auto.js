define('temtop/auto',function(require){
	var _ = require("temtop/autocomplete");
	var net = require('ywj/net');
	var $ = require('jquery');
    var util = require('ywj/util');
	
	require('temtop/exchange');
	require('temtop/exchangeinput');
	require('temtop/muloperate');

    var setDisabled = function(e){
        $("input,select,checkbox,textarea", $('.mode_view')).attr("disabled","disabled").attr("readonly","readonly");
    };

    var setFixedHeader = function(){
        var fixed_els = $('table[data-fixed-header]', $('body'));

        if (!fixed_els.length){
            return ;
        }

        var header_wrap = $('<div id="table-fixed-header" style="padding:0 10px;display:none;"/>');
        var table_header = $('<table class="data-tbl"/>');

        table_header.width(fixed_els.width()+4);
        var thead = fixed_els.find("thead").clone();
        thead.appendTo(table_header);
        table_header.appendTo(header_wrap);
        header_wrap.appendTo($("body"));

        var headers = $("table[data-fixed-header] thead th");
        var columns = $("#table-fixed-header thead th");

        headers.each(function (i, n) {
	        var m = $(columns[i]);
	        if ($(n).css("min-width") != "0px" && $(n).css("min-width") != "auto") {
		        m.css("min-width", $(n).css("min-width"));
	        } else {
		        m.css("width", $(n).css("width"));
	        }
        });

	    fixed_els.each(function () {
		    $(this).data('org-top', $(this).position().top);
	    });

	    $(window).scroll(function () {
		    var scroll_top = $(window).scrollTop();
		    fixed_els.each(function () {
			    var $shadow = $('#table-fixed-header');

                if($(this).data('org-top') < scroll_top){
                    $shadow.addClass('fixed-top-element');
                    $shadow.show();
                } else {
                    $shadow.removeClass('fixed-top-element');
                    $shadow.hide();
                }
            });
        }).trigger('scroll');
    };

	$(function(){
        var printer = require("temtop/printer");

        $("a[rel=dropdown]").each(function(){
            var $n = $(this);
            var $con = $(this).parent();
            $n.click(function(){
                $con.toggleClass("open");
            });
            $('body').click(function(e){
                if(e.target != $con[0] && e.target != $n[0] && !$.contains($con[0], e.target)){
                    $con.removeClass('open');
                }
            });
        });

        $("img[preview=true]").on("mouseover", function (e) {
	        var $preview_div = $("#previewDiv");
	        if (!$preview_div.length) {
		        $preview_div = $("<div id='previewDiv'></div>").appendTo('body');
	        }
	        var o = $(this).offset();
	        var x = parseInt(o.left, 10) + parseInt($(this).closest('td').width(), 10) + 10;
	        var y = parseInt(o.top, 10);
	        var scroll_top = parseInt($('body').scrollTop(), 10);

	        var winRegion = util.getRegion();

	        var img = new Image();
	        img.onload = function () {
		        var w = parseInt(img.width, 10);
		        var h = parseInt(img.height, 10);
		        var ow = w;
		        w = w > 300 ? 300 : w;
		        h = h * w / ow;
		        if ((y + h) > (winRegion.visibleHeight + scroll_top)) {
			        y = winRegion.visibleHeight + scroll_top - h;
		        }
                 var html = '<img src="'+$(this).attr('src')+'" width="'+w+'"/>';
                 $preview_div.html(html).css({position:'absolute', top:y+'px', left:x+'px',border:'1px solid #ccc', display:'block'});
             };
            img.src = $(this).attr("src");
        });

        $("img[preview=true]").on("mouseout",function(e){
            if ($("#previewDiv").length){
                $("#previewDiv").hide();
            }
        });

        setDisabled();
        setFixedHeader();

        $("a[rel=print]").click(function(){
            //printer.checkInstall();
            var url=$(this).attr("href");
            printer.printURL(url);
            return false;
        });

        /**
         * 筛选框 参数列表 【这些参数都是在前台 input 标签上添加】
         *  data-source  后台处理地址
         *  后台返回数据格式 array("succcess"=>true,"data"=>array(array("name"=>"aaaa","code"=>"11111")))
         *  data-min  最小几个字符开始筛选  默认为1 最小为1 小于1的都默认为1
         *  data-delay 延时响应事件 单位毫秒  默认为1000ms
         *  data-scroll 是否需要滚动条  默认为有滚动条
         */
		$("body").delegate("input[rel=autocomplete]","focus",function(){
			$(this)._autocomplete_();
			$(this).on('selected', function(e,k,v) {
                var onSuccess = $(this).data('onsuccess');
                if(onSuccess){
                    eval('var fn1 = window.'+onSuccess);
                    onSuccess = fn1;
                    if(onSuccess instanceof Function){

                    } else{
                        onSuccess = function(){};
                    }
                } else {
                    onSuccess = function(){};
                }
                return onSuccess.apply($(this), [k,v]);
            });
		});

		//js保存excel功能
		var url = 'http://erp.temtop.com/index.php/default/exporter';
		var CONTENT_HOVER_CLS = 'data-export-excel-content-hover';
		$('[data-exporter="excel"]').each(function(){
			var $this = $(this);
			var $btn = $('<a href="" class="data-export-excel-btn" title="另存为Excel文件">另存为Excel文件</a>').insertBefore(this);
			var file = $(this).data('exporter-file');

			var tm;
			$btn.hover(function(){
				clearTimeout(tm);
				$this.addClass(CONTENT_HOVER_CLS);
			}, function(){
				clearTimeout(tm);
				tm = setTimeout(function(){
					$this.removeClass(CONTENT_HOVER_CLS);
				}, 1000);
			});
			$btn.click(function(){
				var html = $this[0].outerHTML;
				var $form = $('<form action="'+url+'" method="POST" target="_blank" style="display:none"></form>').appendTo($('body'));
				$('<input type="hidden" name="file" value="'+file+'">').appendTo($form);
				var $input = $('<input type="hidden" name="html" value=""/>').appendTo($form);
				$input.val(html);
				$form.submit();
				$form.remove();
				return false;
			});
		});

		//工具条置顶功能
		var $ds = $('[data-scroll-fixed-class]');
		if($ds.size()){
			$ds.each(function(){
				$(this).data('original-position', $(this).css('position'));
				$(this).data('original-top', $(this).css('top'));
			});

			$(window).scroll(function(){
				var st = $('body').scrollTop();
				$ds.each(function(){
					var $item = $(this);
					var toggle_class = $item.data('scroll-fixed-class');
					var $prev_node = $item.prev();
					var check_point = $prev_node.offset().top + $prev_node.outerHeight();
					if(check_point < st){
						$item.css({
							position: 'fixed',
							top: 0
						}).addClass(toggle_class);
					} else {
						$item.css({
							position: $item.data('original-position'),
							top: $item.data('original-top')
						}).removeClass(toggle_class);
					}
				});
			}).trigger('scroll');
		}

		//电梯
		if(net.getParam('ref') != 'iframe' && location.href.indexOf('/ref/iframe/') < 0){
			var chk = function(){
				var $bd = $('body');
				var $ladder = $('.ladder');
				var sh = $bd[0].scrollHeight;
				var wh = $(window).height();
				if(!$ladder.size()){
					$bd.append('<ul class="ladder"><li><a href="#top" title="按Home键">顶部</a></li><li><a href="#bottom" title="按End键">底部</a></li></ul>');
					$bd.prepend('<a id="top" name="top"></a>');
					$bd.append('<a id="bottom" name="bottom"></a>');
					$('<style type="text/css">'+
						'.ladder {display:none; width:40px; overflow:hidden; position:fixed; right:10px; bottom:10px;}'+
						'.ladder li {border:1px solid #ccc;}'+
						'.ladder li:first-child {border-radius:3px 3px 0 0;}'+
						'.ladder li:last-child {border-top:none; border-radius:0 0 3px 3px}'+
						'.ladder a {display:block; text-align:center; padding:8px 0; background-color:rgba(255,255,255,0.6);}'+
						'</style>').appendTo($('head'));
					$ladder = $('.ladder');
				}
				if(sh > wh && $bd.css('overflow-y') != 'hidden') {
					$ladder.show();
				} else {
					$ladder.hide();
				}
			};
			$(window).resize(chk).trigger('resize');
		}
    });
});