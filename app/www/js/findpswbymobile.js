define('www/findpswbymobile', function(require){
	var V = require('ywj/validator');
	var $ = require('jquery');
	var net  = require('ywj/net');
	var msg = require('ywj/msg');
	var ERR_CLS = 'verify-fail';

	var show_error = function(msg){
		$('#error-msg').show().html('<i class="g-icon g-error"></i>'+msg)
	};

	var reset_error = function(){
		$('#error-msg').hide();
	};

	var login_rsp = function(rsp){
		console.log(rsp);
	};

	$('.step-frm .g-txt').change(function(){
		$(this).removeClass(ERR_CLS);
	});

	var SEND_ABLE = true;
	var $SEND_MSG_BTN = $('#resend-msg-btn');
	var TM;
	var cd = function(st){
		if(st){
			TM = 10;
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

	$SEND_MSG_BTN .click(function(){
		if(SEND_ABLE){
			var mobile_no = $('.step-frm').find('input[name=mobile]').val();
			var err_msg = '';
			if(!mobile_no){
				err_msg = '请输入手机号';
			}
			else if(!V.REGS.PHONE.test(mobile_no)){
				err_msg = '请输入正确格式的手机号';
			}
			if(err_msg){
				va.onItemCheckFail($('*[name=mobile]')[0], [err_msg]);
				return false;
			}
			net.post($(this).data('url'), {mobile:mobile_no}, function(rsp){
				if(rsp.code == 0){
					msg.show(rsp.message, 'succ');
					cd(true);
				} else {
					msg.show(rsp.message, 'err');
					SEND_ABLE = true;
				}
			});
		}
		SEND_ABLE = false;
		return false;
	});

	var rules = {
		mobile: {
			require: '请输入手机号',
			PHONE: '请输入正确的手机号',
			max40: '最大长度为40个字符',
			min4: '最小长度为4个字符'
		},
		msg_token: {
			require:'请输入验证码'
		},
		password: {
			require: '请输入密码',
			max20: '最大长度为20个字符',
			min4: '最小长度为4个字符'
		},
		re_password: {
			same: function(val, el){
				var v = $('*[name=password]').val();
				if(v != val){
					return '确认密码与密码不相符，请重新输入';
				}
			}
		}
	};

	var va = new V('.step-frm', rules, {
		breakOnError: true
	});
	va.onBeforeCheck = function(){
		reset_error();
	};
	va.onItemCheckPass = function(el){
		$(el).removeClass(ERR_CLS);
	};
	va.onItemCheckFail = function(el, errors){
		$(el).addClass(ERR_CLS);
		show_error(errors[0]);
	};

	$('.step-frm').on('submit', function(){
		var err = va.checkAll();
		var NEXT_URL = $(this).data('next-url');
		if(!err){
			var data = net.getFormData(this);
			var url = this.action;
			var method = this.method.toLowerCase();
			net.request(url, data, {
				method: method,
				onSuccess: function(rsp){
					console.log('rsp', rsp);
					if(rsp.code != 0){
						show_error(rsp.message || '网络繁忙，请稍候重试。');
						if(rsp.data){
							$('*[name='+rsp.data+']').addClass(ERR_CLS);
							$('*[name='+rsp.data+']').focus();
						}
					} else{
						location.href = NEXT_URL;
					}
				},
				onError: function(rsp){
					show_error(rsp.message || '网络繁忙，请稍候重试。');
				}
			});
		}
		return false;
	});
});