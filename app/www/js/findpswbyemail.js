define('www/findpswbyemail', function(require){
	var V = require('ywj/validator');
	var $ = require('jquery');
	var net  = require('ywj/net');
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

	var change_captcha = function(){
		if($('#verify-img').size()){
			var url = $('#verify-img').data('src');
			$('#verify-img').attr('src',net.mergeCgiUri(url, {r:Math.random()}));
		}
	};

	$('#verify-img').click(change_captcha);
	$('.change-verify-img').click(change_captcha);

	$('.step-frm .g-txt').change(function(){
		$(this).removeClass(ERR_CLS);
	});

	var rules = {};
	var STEP = window['STEP'];
	if(STEP == 1){
		rules = {
			email: {
				require: '请输入邮箱地址',
				EMAIL: '请输入正确的邮箱格式',
				max40: '最大长度为40个字符',
				min4: '最小长度为4个字符'
			},
			captcha: {
				require:'请输入验证码'
			}
		};
	} else if(STEP == 3){
		rules = {
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
	}

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
						change_captcha();
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