define('app/autoappoint', function(require){
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
	var def_show_msg = function(msg, success, callback){
		callback = callback || function(){};
		if(util.isMobile){
			alert(msg);
			callback();
		} else {
			msg.show(msg, success ? 'succ' : 'err');
			setTimeout(callback, 1500);
		}
	};

	/**
	 * @param config 配置，详细支持功能配置请见以下具体代码实现
	 */
	return function(config){
		config = $.extend({
			//消息处理绑定函数
			message_handler: def_show_msg,

			//提交前事件
			before_submit: function(){return true;},

			//响应处理函数
			on_response: null,

			//成功处理函数
			on_success: null,

			//出错处理函数
			on_error: null,

			//请求格式
			request_format: 'jsonp',

			//按钮禁用样式名
			BTN_DISABLED_CLASS: BTN_DISABLED_CLASS,

			//验证码最大获取间隔
			MAX_VALIDATE_CODE_TIMEOUT: MAX_VALIDATE_CODE_TIMEOUT,

			//验证码类型
			TOKEN_TYPE: TOKEN_TYPE
		}, config);

		config.on_response = config.on_response || function(rsp){
			if(rsp.code==0){
				config.on_success(rsp.message, rsp.data, rsp.jump_url);
			} else {
				config.on_error(rsp.message, rsp.code, rsp.data);
			}
		};

		config.on_success = config.on_success || function(msg, data, jump_url){
			config.message_handler(msg, true, function(){
				if(jump_url){
					location.href = jump_url;
				}
			});
		};

		config.on_error = config.on_error || function(msg, code, data){
			config.message_handler(msg);
		};

		$('form['+TAG_ATTR_FLAG+']').each(function(){
			var $form = $(this);
			var $val_btn = $form.find('[rel=val-code-btn]');
			var $val_code_input = $form.find('[name=mobile_token]');
			var $mobile_input = $form.find('[name=mobile]');
			var tag = $form.attr(TAG_ATTR_FLAG);
			var method = ($form.attr('method') || '').toLowerCase() == 'post' ? 'post' : 'get';

			//获取验证码
			if($val_btn.size() && $val_code_input.size()){
				$val_btn.click(function(){
					var disabled = $val_btn.hasClass(config.BTN_DISABLED_CLASS);
					var mobile = $.trim($mobile_input.val());
					if(disabled){
						return false;
					}
					if(!mobile){
						config.message_handler('请输入手机号码');
						return false;
					}

					//倒计时
					var counter = config.MAX_VALIDATE_CODE_TIMEOUT;
					var counter_timer = null;
					var count_down = function(){
						if(counter > 0){
							counter--;
							$val_btn.addClass(config.BTN_DISABLED_CLASS).val('重新获取('+counter+')');
							counter_timer = setTimeout(count_down, 1000);
						} else {
							$val_btn.removeClass(config.BTN_DISABLED_CLASS).val('获取验证码');
						}
					};
					counter_timer = setTimeout(count_down, 0);

					net.get(GET_TOKEN_CGI_URL, {
						token_type: config.TOKEN_TYPE,
						mobile: $mobile_input.val(),
						act_tag: tag,
						gtag: net.getParam('gtag')
					}, function(rsp){
						config.message_handler(rsp.message, rsp.code == 0);

						//出错情况，重置按钮状态
						if(rsp.code != 0){
							clearTimeout(counter_timer);
							$val_btn.removeClass(config.BTN_DISABLED_CLASS).val('获取验证码');
						}
					}, {format:config.request_format});
				});
			}

			//提交表单
			$form.submit(function(){
				if(config.before_submit() === false){
					return false;
				}

				if(!$mobile_input.val()){
					config.message_handler('请输入手机号码');
					return false;
				}

				if($val_code_input.size()){
					var code = $.trim($val_code_input.val());
					if(!code){
						config.message_handler('请输入短信验证码');
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
				net[method](action, data, function(rsp){
					config.on_response(rsp);
				}, {format:config.request_format});
				return false;
			});
		});
	};
});
