define('temtop/erplogin',function(require){
    var $ = require('jquery');
    var msg = require('ywj/msg');
    var net = require('ywj/net');
    require('jquery/cookie');

    function loginInit() {
        var change_captcha = function(){
            var $vi = $('#verify-img');
            var url = $vi.data('src');
            $vi.attr('src',net.mergeCgiUri(url, {r:Math.random()}));
        };

        $('#verify-img').click(change_captcha);
        $('.change-verify-img').click(change_captcha);

        $('.login-frm').on('submit', function(){
	        var $frm = $(this);
            var data = net.getFormData(this);
            var url = this.action;
            var method = this.method.toLowerCase();
            net.request(url, data, {
                method: method,
                onSuccess: function(rsp){
                    if(rsp.code != 0){
                        msg.showError(rsp.message);
                        if(rsp.data == 'captcha'){
                            $.cookie('is_need_captcha', true,  { expires: 7 });
                            $("#captcha-container").show();
                            change_captcha();
                        }
	                    $frm.removeClass('error-shake');
	                    setTimeout(function(){
		                    $frm.addClass('error-shake');
	                    }, 0);
                    } else {
                        $.cookie('is_need_captcha', '', { expires: -1 });
                        msg.showSuccess(rsp.message, 1);
                        setTimeout(function(){
                            top.location.href = rsp.jump_url;
                        }, 1000);
                    }
                },
                onError: function(rsp){
                    debugger;
					msg.show(rsp.message || '网络繁忙，请稍候重试。', 'err');
                }
            });
            return false;
        });

        //judge is need captcha
        if ($.cookie('is_need_captcha'))
        {
            $("#captcha-container").show();
        }
    }
    loginInit();
});