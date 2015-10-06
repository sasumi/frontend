/**
 * Created by windy on 2015/4/28.
 */
define('www/appoint', function(require){
	var $ = require('jquery');
	var net = require('ywj/net');
	var msg = require('ywj/msg');
	var popup = require('ywj/popup');
	var appointPopup = null;

	function addPopupHtml()
	{
		var popupHtml = '<style>.appoint-c {text-align: center; height: 230px;margin: 0 auto;}'+
						'.appoint-c .f-error{color: #ff0000;margin-top:10px;line-height: 20px;display: inline-block;}'+
						'.appoint-c p{margin-top: 25px;}'+
						'.appoint-c .f-n {margin-top: 0;}'+
						'.appoint-c form input{width: 400px; height: 38px;}'+
						'.appoint-c form input[type="submit"] {width: 100px;}</style>' +
						'<div id="appointPopup" style="display: none;" class="appoint-popup">' +
						'<div class="appoint-c">' +
						'<form action="http://www.guojj.com/user/appoint" method="post" class="appoint-form">' +
						'<span class="f-error"></span>' +
						'<p class="f-n"><input class="g-txt-big m-txt name" type="text" name="name" placeholder="您的称呼"></p>' +
						'<p><input class="g-txt-big m-txt mobile" type="text" name="mobile" placeholder="您的手机"></p>' +
						'<p><input type="submit" class="g-btn m-btn mSubmit" value="立即预约"/></p>' +
						'</form>' +
						'</div>' +
						'</div>';
		if ($("#appointPopup").length <= 0) {
			$('body').append(popupHtml);
		}
	}

	//预约
	function appointFormSubmit() {
		$("body").delegate(".appoint-form", "submit", function () {
			var _this = $(this);
			var $error = _this.find(".f-error");
			var $mobile = _this.find(".mobile");
			var $name = _this.find(".name");
			var error = $.trim($error.text());
			var mobile = $.trim($mobile.val());
			var name = $.trim($name.val());

			if (!name) {
				$tip = $name.next(".appointTip");
				if ($tip.length > 0){
					$tip.html('<em class="tipico"></em>请输入称呼');
				}else{
					$error.text("请输入称呼");
				}

				$name.focus();
				return false;
			}else if(name.length > 16){
				$tip = $name.next(".appointTip");
				if ($tip.length > 0){
					$tip.html('<em class="tipico">昵称不能超过16个字哦</em>');
				}else{
					$error.text("昵称不能超过16个字哦");
				}
				$name.focus();
				return false;
			}else{
				$error.text('');
				_this.find(".appointTip").text('');
			}

			if (!mobile || !/^(?:13\d|15\d|18\d|17\d)\d{5}(\d{3}|\*{3})$/.test(mobile)) {

				$tip = $mobile.next(".appointTip");
				if ($tip.length > 0){
					$tip.html('<em class="tipico"></em>请输入正确的手机号码');
				}else{
					$error.text("请输入正确的手机号码");
				}
				$mobile.focus();
				return false;
			}else{
				$error.text('');
				_this.find(".appointTip").text('');
			}

			net.post(_this.attr("action"), _this.serialize(), function (r) {
				if (r && r.code == 0) {
					msg.show('预约成功', 'succ');
					_this[0].reset();
					$(".appointProvince").val("440000").change();
					$(".appointCity").val("440300");
					if (appointPopup) {
						appointPopup.close();
					}
				} else {
					msg.show(r.message || '预约超时，请稍后重试', 'err');
				}
			},{onError: function(){
				msg.show("预约超时，请稍后重试", 'err');
			}});
			return false;
		});
	}



	//显示预约框
	function showAppointPopup() {
		$(".appointPopupBtn").click(function () {
			var conf = {
				title: '预约到体验店',
				content: "",
				width: 500,
				moveEnable: true,
				topCloseBtn: true,
				buttons: [],
				isModal: true
			};
			conf.content = {id: "#appointPopup"};
			appointPopup = new popup(conf);
			appointPopup.show();
		});
	}

	function init()
	{
		addPopupHtml();
		appointFormSubmit();
		showAppointPopup();
	}
	init();
});
