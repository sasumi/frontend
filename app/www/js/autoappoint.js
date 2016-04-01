/**
 * @deprecated 当前预约组件已经被更新至 app/autoappoint
 */
define('www/autoappoint', function(require){
	var msg = require('ywj/msg');
	var util = require('ywj/util');
	var $ = require('jquery');
	var net = require('ywj/net');

	var TAG_ATTR_FLAG = 'data-auto-appoint-tag';
	var TOKEN_TYPE = 1;
	var MAX_VALIDATE_CODE_TIMEOUT = 60;
	var BTN_DISABLED_CLASS = 'btn-disabled';
	var DEF_CGI_URL = '//www.guojj.com/api/index.php/appoint';
	var GET_TOKEN_CGI_URL = '//www.guojj.com/api/index.php/getactmobiletoken';
	var TAG_PL = 'placeholder';
	var PLACE_HOLDER_FLAG = !!$.browser.msie;

	/**
	 * 兼容移动终端显示msg
	 * @param msg
	 * @param success
	 * @param callback
	 */
	var show_msg = function(msg, success, callback){
		callback = callback || function(){};
		if(util.isMobile){
			alert(msg);
			callback();
		} else {
			msg.show(msg, success ? 'succ' : 'err');
			setTimeout(callback, 1500);
		}
	};

	return function(){
		$('form['+TAG_ATTR_FLAG+']').each(function(){
			var $form = $(this);
			var $val_btn = $form.find('[rel=val-code-btn]');
			var $val_code_input = $form.find('[name=mobile_token]');
			var $mobile_input = $form.find('[name=mobile]');
			var tag = $form.attr(TAG_ATTR_FLAG);

			var onrsp = $form.attr('onresponse') ? window[$form.attr('onresponse')] : function(rsp){
				if(rsp.code==0){
					onsucc(rsp.message, rsp.data, rsp.jump_url);
				} else {
					onerror(rsp.message, rsp.code, rsp.data);
				}
			};

			var onsucc = $form.attr('onsuccess') ? window[$form.attr('onsuccess')] : function(msg, data, jump_url){
				show_msg(msg, true, function(){
					if(jump_url){
						location.href = jump_url;
					}
				});
			};

			var onerror = $form.attr('onerror') ? window[$form.attr('onerror')] : function(msg, code, data){
				show_msg(msg);
			};

			//获取验证码
			if($val_btn.size() && $val_code_input.size()){
				$val_btn.click(function(){
					var disabled = $val_btn.hasClass(BTN_DISABLED_CLASS);
					var mobile = $.trim($mobile_input.val());
					if(disabled){
						return false;
					}
					if(!mobile){
						show_msg('请输入手机号码');
						return false;
					}

					//倒计时
					var counter = MAX_VALIDATE_CODE_TIMEOUT;
					var count_down = function(){
						if(counter > 0){
							counter--;
							$val_btn.addClass(BTN_DISABLED_CLASS).val('重新获取('+counter+')');
							setTimeout(count_down, 1000);
						} else {
							$val_btn.removeClass(BTN_DISABLED_CLASS).val('获取验证码');
						}
					};
					setTimeout(count_down, 0);

					net.get(GET_TOKEN_CGI_URL, {
						token_type: TOKEN_TYPE,
						mobile: $mobile_input.val(),
						act_tag: tag,
						gtag: net.getParam('gtag')
					}, function(rsp){
						show_msg(rsp.message, rsp.code == 0);
					}, {format:'jsonp'});
				});
			}

			//提交表单
			$form.submit(function(){
				if(!$mobile_input.val()){
					show_msg('请输入手机号码');
					return false;
				}

				if($val_code_input.size()){
					var code = $.trim($val_code_input.val());
					if(!code){
						show_msg('请输入短信验证码');
						return false;
					}
				}

				if(PLACE_HOLDER_FLAG){
					$form.find(':input').each(function(){
						var $inp = $(this);
						if($inp.attr(TAG_PL) && $inp.val()==$inp.attr(TAG_PL)){
							$inp.val('');
						}
					});
				}

				var data = $form.serialize();

				if(PLACE_HOLDER_FLAG){
					$form.find(':input').each(function(){
						var $inp = $(this);
						if($inp.attr(TAG_PL) && !$inp.val()){
							$inp.val($inp.attr(TAG_PL));
						}
					});
				}

				var gtag = net.getParam('gtag') || '';
				var action = $form.attr('action') || DEF_CGI_URL;
				data = net.buildParam({act_tag:tag, gtag:gtag}, data);
				net.get(action, data, function(rsp){
					onrsp(rsp);
				}, {format:'jsonp'});
				return false;
			});
		});
	};
});
