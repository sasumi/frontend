define('www/login', function(require){
	var V = require('ywj/validator');
	var msg = require('ywj/msg');
	var $ = require('jquery');
	var net  = require('ywj/net');
	var pop = require('ywj/popup');

	var USE_CAPTCHA = window['USE_CAPTCHA'];
	var ERR_CLS = 'verify-fail';
	var IN_IFRAME = !!window.frameElement;

	var show_error = function(str){
		if(!IN_IFRAME){
			$('#error-msg').html(str).addClass('validate-fail').show();
		} else {
			msg.show(str, 'err');
		}
	};

	var hide_error = function(){
		$('#error-msg').hide();
	};

	var change_captcha = function(){
		var url = $('#verify-img').data('src') || '';
		$('#verify-img').attr('src',net.mergeCgiUri(url, {r:Math.random()}));
	};

	$('#verify-img').click(change_captcha);
	$('.change-verify-img').click(change_captcha);
	$('.login-frm .g-txt').change(function(){$(this).removeClass(ERR_CLS);});

	var va = new V('.login-frm', {
		account: {
			require: '请输入账号名称',
			account: function(val){
				if(!V.REGS.EMAIL.test(val) && !V.REGS.PHONE.test(val)){
					return '请输入正确格式的手机/邮箱地址';
				}
			},
			max40: '账号最大长度为40个字符',
			min4: '账号最小长度为4个字符'
		},
		password: {
			require: '请输入用户密码',
			min2: '最小长度为6个字符',
			max32: '最大长度为32个字符'
		},
		captcha: {
			checkRequire:function(val, ele){
				if(USE_CAPTCHA && !val){
					return '请输入验证码';
				}
				return '';
			}
		}
	}, {
		breakOnError: !!IN_IFRAME
	});

	va.onItemCheckFail = function(element, errors){
		if(IN_IFRAME){
			msg.show(errors[0], 'err');
		}
		this.setItemMessage(element, errors);
	};

	$('.login-frm').on('submit', function(){
		hide_error();
		var err = va.checkAll();
		var NEXT_URL = $(this).data('next-url');
		if(!err){
			var data = net.getFormData(this);
			var url = this.action;
			var method = this.method.toLowerCase();
			net.request(url, data, {
				method: method,
				onSuccess: function(rsp){
					if(rsp.code != 0){
						if(rsp.data){
							va.onItemCheckFail($('*[name='+rsp.data+']')[0], [rsp.message]);
						} else {
							show_error(rsp.message || '网络繁忙，请稍候重试。');
						}
						if(rsp.data == 'captcha' || USE_CAPTCHA){
							$('#captcha-row').show();
							change_captcha();
							if(IN_IFRAME){
								var currentPop = pop.getCurrentPopup();
								if(currentPop){
									currentPop.updateHeight();
								}
							}
						}
					} else {
						if(IN_IFRAME){
							pop.fire('onSuccess', rsp);
							pop.closeCurrentPopup();
						} else {
							top.location.href = rsp.jump_url;
						}
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