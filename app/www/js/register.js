define('www/register', function(require){
	var V = require('ywj/validator');
	var $ = require('jquery');
	var net  = require('ywj/net');
	var msg = require('ywj/msg');
	var ERR_CLS = 'verify-fail';

	var show_error = function(msg){
		$('#error-msg').html(msg).addClass('validate-fail').show();
	};

	var change_captcha = function(){
		var url = $('#verify-img').data('src');
		$('#verify-img').attr('src',net.mergeCgiUri(url, {r:Math.random()}));
	};

	$('#verify-img').click(change_captcha);
	$('.change-verify-img').click(change_captcha);

	$('.login-frm .g-txt').change(function(){
		$(this).removeClass(ERR_CLS);
	});

	var va = new V('.login-frm', {
		mobile: {
			require: '请输入手机号',
			PHONE: '请输入正确格式的手机号',
			max40: '最大长度为40个字符',
			min4: '最小长度为4个字符'
		},
		email: {
			EMAIL: '请输入正确格式的邮箱地址',
			require: '请输入邮箱地址',
			max40: '最大长度为40个字符',
			min4: '最小长度为4个字符'
		},
		nickname: {
			require: '请输入您的昵称',
			max20: '最大长度为16个字符',
			min4: '最小长度为4个字符'
		},
		password: {
			require: '请输入用户密码',
			min6: '最小长度为6个字符',
			max32: '最大长度为32个字符'
		},
		re_password: {
			same: function(val, el){
				var v = $('*[name=password]').val();
				if(v != val){
					return '确认密码与密码不相符，请重新输入';
				}
			}
		},
		captcha: {
			require:'请输入验证码'
		},
		msg_token: {
			require: '请输入短信验证码'
		}
		/** 这里提示会比较难看,先隐藏
		agree_rules: {
			require: '您需要同意用户协议才能继续'
		}
		 **/
	});

	$('.login-frm').on('submit', function(){
		var err = va.checkAll();
		var NEXT_URL = $(this).data('next-url');
		if(!err){
			if(!$('#agree_rules').attr('checked')){
				msg.show('您必须同意我们的用户协议才能继续');
				return false;
			}

			var data = net.getFormData(this);
			var url = this.action;
			var method = this.method.toLowerCase();
			net.request(url, data, {
				method: method,
				onSuccess: function(rsp){
					if(rsp.code != 0){
						if(rsp.data && $('*[name='+rsp.data+']').size()){
							va.onItemCheckFail($('*[name='+rsp.data+']')[0], [rsp.message]);
						} else {
							show_error(rsp.message || '网络繁忙，请稍候重试。');
						}
						change_captcha();
					} else {
						msg.show(rsp.message, 'succ');
						setTimeout(function(){
							location.href = rsp.jump_url || NEXT_URL;
						},2000);
					}
				},
				onError: function(rsp){
					show_error(rsp.message || '网络繁忙，请稍候重试。');
				}
			});
		}
		return false;
	});

	var SEND_ABLE = true;
	var $SEND_MSG_BTN = $('#resend-msg-btn');
	var TM;
	var cd = function(st){
		if(st){
			TM = 30;
		}
		if(TM){
			$SEND_MSG_BTN .val('重新发送（'+TM+'秒）');
			$SEND_MSG_BTN.attr('disabled', true);
			$SEND_MSG_BTN.addClass('g-btn-disable');
			setTimeout(function(){
				TM -= 1;
				cd();
			}, 1000);
		} else {
			SEND_ABLE = true;
			$SEND_MSG_BTN .val('发送验证码');
			$SEND_MSG_BTN.attr('disabled', false);
			$SEND_MSG_BTN.removeClass('g-btn-disable');
		}
	};

	$SEND_MSG_BTN.click(function () {
		if (SEND_ABLE) {
			var mobile_no = $('.login-frm input[name=mobile]').val();
			var err_msg = '';
			var $captcha = $('#verify-code');
			var use_verify = $captcha.size();
			if (!mobile_no) {
				err_msg = '请输入手机号';
			}
			else if (!V.REGS.PHONE.test(mobile_no)) {
				err_msg = '请输入正确格式的手机号';
			} else if (use_verify && !$.trim($captcha.val())) {
				msg.show('请输入验证码', 'err');
				return false;
			}
			if (err_msg) {
				va.onItemCheckFail($('.login-frm [name=mobile]')[0], [err_msg]);
				return false;
			}
			net.post($(this).data('url'), {mobile: mobile_no, captcha: $captcha.val()}, function (rsp) {
				if (rsp.code == 0) {
					msg.show(rsp.message, 'succ');
					cd(true);
				} else if (rsp.data == 'captcha') {
					msg.show('图片验证码错误，请重新输入', 'err');
					change_captcha();
					SEND_ABLE = true;
				} else {
					msg.show(rsp.message, 'err');
					SEND_ABLE = true;
				}
			});
		}
		SEND_ABLE = false;
		return false;
	});
});