define('www/popup-order', function(require){
	var $ = require('jquery');
	var msg = require('ywj/msg');
	var net  = require('ywj/net');

	$(".popup-order").submit(function(){
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
        if (!mobile || !/^(?:13\d|15\d|18\d|17\d)\d{5}(\d{3}|\*{3})$/.test(mobile)){
            msg.show('请填写正确的手机号', 'err');
            $mobile.focus();
            return false;
        }

        net.post(_this.attr("action"), _this.serialize(), function(r){
            if (r.code == 0) {
                msg.show('预约成功', 'succ');
                _this[0].reset();
            }else{
                msg.show(r.message || '预约超时，请稍后重试', 'err');
            }
        });
        return false;
    });
});