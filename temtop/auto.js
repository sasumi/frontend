define('temtop/auto',function(require){
	var _ = require("temtop/autocomplete");
	var net = require('ywj/net');
	var $ = require('jquery');
    var util = require('ywj/util');
	var msg = require('ywj/msg');
	var IV = require('ywj/imageviewer');

	require('temtop/exchange');
	require('temtop/exchangeinput');
	require('temtop/worldtime');
	$(function(){
		var $body = $('body');

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

		//图片预览
		var $_IMG_PREVIEW;
		$("img[preview]").hover(function (e) {
			var $this = $(this);
			if (!$_IMG_PREVIEW) {
				$_IMG_PREVIEW = $("<div>").appendTo($body);
			}
			var o = $this.offset();
			var x = parseInt(o.left, 10) + parseInt($this.closest('td').width(), 10) + 10;
			var y = parseInt(o.top, 10);
			var scroll_top = parseInt($('body').scrollTop(), 10);
			var winRegion = util.getRegion();

			$_IMG_PREVIEW.html('').show();
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
				var html = '<img src="' + $(this).attr('src') + '" width="' + w + '" style="display:block;"/>';
				$_IMG_PREVIEW.html(html).css({
					position: 'absolute',
					boxShadow: '0px 0px 15px #bbb',
					top: y + 'px',
					left: x + 'px'
				});
			};
			img.src = $this.data('src') || $this.attr("src");
		}, function(){
			$_IMG_PREVIEW && $_IMG_PREVIEW.hide();
		});

		//printer
		if($("a[rel=print]").size()){
			require.async("temtop/printer", function(printer){
				$("a[rel=print]").click(function(){
					var url=$(this).attr("href");
					printer.printURL(url);
					return false;
				});
			});
		}

        /**
         * 筛选框 参数列表 【这些参数都是在前台 input 标签上添加】
         *  data-source  后台处理地址
         *  后台返回数据格式 array("succcess"=>true,"data"=>array(array("name"=>"aaaa","code"=>"11111")))
         *  data-min  最小几个字符开始筛选  默认为1 最小为1 小于1的都默认为1
         *  data-delay 延时响应事件 单位毫秒  默认为1000ms
         *  data-scroll 是否需要滚动条  默认为有滚动条
         */
		$body.delegate("input[rel=autocomplete]","focus",function(){
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
			var $btn = $('<a href="" class="data-export-excel-btn" title="另存为Excel文件">另存为Excel</a>').insertBefore(this);
			var file = $(this).data('exporter-file');
			if(!file){
				var t = new Date();
				file = ''+t.getFullYear()+'-'+t.getUTCMonth()+'-'+t.getUTCDate()+'.xls';
			}
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
					var width =$item.context.offsetWidth;
					if(check_point < st){
						$item.css({
							position: 'fixed',
							top: 0,
							width:width
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
			require.async('ywj/liteladder');
		}

		//排序
		(function(){
			var order_html = '<span class="order-index">'+
				'<span class="order-index-top"></span>'+
				'<span class="order-index-up"></span>'+
				'<span class="order-index-down"></span>'+
				'<span class="order-index-bottom"></span>'+
				'</span>';

			var DISABLE_CLASS = 'order-index-disable';
			var LOADING_CLASS = 'order-index-loading fa fa-spinner fa-pulse';

			$('[data-order-action]').each(function(){
				var $container = $(this);
				var action = $container.data('order-action');
				var $input_list = $('input[data-order-config]', $container);

				var save = function(action, data){
					net.get(action, data, function(rsp){
						if(rsp.code == 0){
							location.reload();
						} else {
							msg.show(rsp.message, 'err');
						}
					});
				};

				$input_list.each(function(k, v){
					var $inp = $(this);
					var order_config = $inp.data('order-config').split(',');
					var $op = $(order_html).insertAfter($inp);

					$op.find('span').each(function(k, v){
						var $sp = $(this);
						if(order_config[k] === ''){
							$sp.addClass(DISABLE_CLASS);
						} else if(!$sp.hasClass(DISABLE_CLASS)){
							var dir = k > 1 ? 'after': 'before';
							$sp.click(function(){
								$op.find('span').addClass(DISABLE_CLASS);
								$sp.removeClass(DISABLE_CLASS);
								if(!$sp.hasClass(LOADING_CLASS)){
									$sp.addClass(LOADING_CLASS);
									save(action, {from: $inp.val(), to:order_config[k], dir: dir});
								}
							});
						}
					});
					$inp.hide();
				});
			});
		})();

		//set disabled for view mode
		(function(){
			$("input[type!=hidden],select,checkbox,textarea", $('.mode_view')).attr("disabled","disabled").attr("readonly","readonly");
		})();

		//表单必填
		$('.frm-tbl :input[required]').each(function(){
			$(this).closest('tr').addClass('field-required');
		});

		//表单数字输入自动选择
		$('input[type=number]:not(readonly):not(disabled)').focus(function(){
			this.select(this);
		});

		//表单只读
		$('.frm.readonly :input').each(function(){
			if(this.type !='hidden'){
				$(this).attr('readonly', 'readonly');
			}
			if((this.type == 'checkbox' && !$(this).attr('checked')) || this.nodeName == 'SELECT'){
				$(this).attr('disabled', 'disabled');
			}
		});

		//表单随机字符填充
		var $html = $('html');
		if($html.hasClass('server-DEV') || $html.hasClass('server-GAMMA') || $html.hasClass('server-BETA')){
			require.async('temtop/RandomForm', function(cb){
				setTimeout(function(){
					cb('form[method=post]');
				}, 100);
			});
		}

		//看图
		$body.delegate('.com-uploader-success .com-uploader-content a', 'click', function(){
			IV.init($(this), $('.com-uploader-success .com-uploader-content a'));
			return false;
		});

		//sku列表效果
		$('.tt-sku-list').each(function(){
			var OFFSET = 5;
			var $list = $(this);
			var list_top = $list.offset().top;
			var h = $list.outerHeight();
			var overflow = false;
			$list.children().each(function(){
				if($(this).offset().top - list_top > (h-OFFSET)){
					overflow = true;
					return false;
				}
			});
			if(overflow){
				var $more = $('<span class="tt-sku-list-more" title="查看更多"></span>').insertAfter($list);
				var $panel;
				var panel_tm;
				var show_panel = function(){
					clearTimeout(panel_tm);
					if(!$panel){
						$panel = $('<div class="tt-sku-list-more-panel"></div>').appendTo('body');
						var html = '<table class="data-tbl"><tbody><tr>';
						var k = 0;
						$list.find('li').each(function(){
							if(!(k % 3) && k){
								html += '</tr><tr>';
							}
							html += '<td>'+$(this).html()+'</td>';
							k++;
						});
						for(var i=0; i<(3-(k%3)) && k%3; i++){
							html += '<td></td>';
						}
						html += '</tr></tbody></table>';
						$panel.html(html);
						$panel.find('.tt-sku-list').addClass('tt-sku-list-all');
						$panel.hover(show_panel, hide_panel);
					}
					$panel.css({
						left: $list.offset().left,
						top:$list.offset().top,
						opacity:0
					}).stop().show().animate({
						opacity:1
					});
				};

				var hide_panel = function(){
					if($panel){
						panel_tm = setTimeout(function(){
							$panel.stop().animate({
								opacity:0
							}, function(){
								$panel.hide();
							});
						},100);
					}
				};
				$list.hover(show_panel, hide_panel);
				$more.hover(show_panel, hide_panel);
			}
		});

		if ($("#temtop-notice").length > 0){
			var $tn = $("#temtop-notice");
			var html = '<div class="news-content"><div class="hd"><i class="fa fa-volume-up"></i> 最新消息</div><div class="bd"><ul>';

			net.get('http://erp.temtop.com/index.php/notice/news', {system_type:$tn.data('system_type')}, function (r) {
				if (r.code == 0) {
					for (var i in r.data) {
						var d = r.data[i];
						html += '<li> <a href="'+d.url+'" target="_blank" title="'+d.title+'" class="subject">'+d.title+'</a> <span class="st">'+d.name+'&nbsp;'+d.addtime+'</span> </li>'
					}
					html += '</ul></div></div>';
					$tn.append(html);
				}
			}, {format:'jsonp'});
		}
	});
});