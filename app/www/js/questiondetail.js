define('www/questiondetail', function(require){
	var net = require('ywj/net');
	var msg = require('ywj/msg');
	var common = require('www/common');

	$(function(){
		$('.ask-frm').each(function(){
			var $FORM = $(this);
			var $EXT_CONTENT = $('textarea', $FORM);
			var $EXT_CONTENT_COUNT = $('.addition-field .word-count', $FORM);
			var ADDITION_MAX_COUNT = 2000;

			$('.addition-field legend', $FORM).click(function(){
				if(!$('s', this).size()){
					return;
				}
				var p = this.parentNode;
				var toHide = !$(p).hasClass('addition-hide');
				$(p)[toHide ? 'addClass':'removeClass']('addition-hide');
				$(p)[!toHide ? 'addClass':'removeClass']('addition-expand');
				if(!toHide){
					$('textarea', p).focus();
				}
			});

			$('*[rel=cancel-btn]', $FORM).click(function(){
				$('fieldset', $FORM).removeClass('addition-expand').addClass('addition-hide');
			});

			var check_content_count = function($CON, MAX, $WC){
				if(!$CON.size()){
					return;
				}
				var cnt = $CON.val().length;
				var left = MAX - cnt;
				$WC[left>=0?'removeClass':'addClass']('word-count-overflow');

				if(left >= 0){
					$WC.html('您还可以输入 <b>'+left+'</b> 个字');
				} else {
					$WC.html('内容已经超出 <b>'+(-left)+'</b> 个字');
				}
			};

			//内容输入
			$EXT_CONTENT.change(function(){
				return check_content_count($EXT_CONTENT, ADDITION_MAX_COUNT, $EXT_CONTENT_COUNT);
			});
			$EXT_CONTENT.keydown(function(){
				return check_content_count($EXT_CONTENT, ADDITION_MAX_COUNT, $EXT_CONTENT_COUNT);
			});
			$EXT_CONTENT.keyup(function(){
				return check_content_count($EXT_CONTENT, ADDITION_MAX_COUNT, $EXT_CONTENT_COUNT);
			});
			check_content_count($EXT_CONTENT, ADDITION_MAX_COUNT, $EXT_CONTENT_COUNT);

			//提交
			$FORM.submit(function(){
				val = $.trim($EXT_CONTENT.val());
				if(!val){
					msg.show('请输入内容', 'tip');
					return false;
				}

				common.login(function(){
					var data = net.getFormData($FORM);
					var action = $FORM.attr('action');
					net.request(action, data, {
						method: 'post',
						onSuccess: function(rsp){
							msg.show(rsp.message, rsp.code==0 ? 'succ':'err');
							if(rsp.code == 0){
								location.href = rsp.jump_url || window['SUCC_URL'];
							}
						},
						onError: function(rsp){
							msg.show('系统繁忙，请稍后重试', 'err');
						}
					});
				});
				return false;
			});
		});


	});

	$(function(){
		//当滚动条的位置处于距顶部100像素以下时，底部出现，否则消失
		function showTip()
		{
			$(window).scroll(function(){
				var $wendaLay = $(".wenda-layout");
				var scrollTop = parseInt($(window).scrollTop());
				var winHeight = parseInt($(window).height());
				var docHeight = parseInt($(document).height());
				if (scrollTop>100){
					$wendaLay.fadeIn(100);
				}else{
					$wendaLay.fadeOut(100);
				}
				if ((scrollTop + winHeight) >= docHeight){
				    $wendaLay.addClass("wenda-layout-btm");
				}else{
					$wendaLay.removeClass("wenda-layout-btm");
				}
			});
		}
		//预约
		function appointFormSubmit(){
			$(".appoint-form", "body").submit(function(){
                var _this = $(this);
				var $mobile = _this.find(".mobile");
				var $name = _this.find(".name");
				var mobile = $.trim($mobile.val());
				var name = $.trim($name.val());

				if (!name) {
					msg.show('请填写您的称呼', 'err');
					$name.focus();
					return false;
				}
				if (!mobile || !/^(?:13\d|15\d|18\d)\d{5}(\d{3}|\*{3})$/.test(mobile)){
					msg.show('请填写正确的手机号', 'err');
					$mobile.focus();
					return false;
				}

				net.post(_this.attr("action"), _this.serialize(), function(r){
					if (r.code == 0) {
						msg.show('预约成功', 'succ');
						_this[0].reset();
					}else{
						msg.show(r.message || '系统异常', 'err');
					}
				});
				return false;
			});
		}

		function init() {
			showTip();
			appointFormSubmit();
		}
		init();
	});
});