/**
 * Created by Jidan on 2016/1/8.
 */
define('app/auto', function(require){
	var $ = require('jquery');
	var msg =require("ywj/msg");
	var net =require("ywj/net");

	var bindEvent=function(){
		//预测套餐
		$("form[rel=package_compute]").each(function(){
			var $this=$(this);
			$this.live("submit",function(){
				var form_data= $this.serializeArray();
				var config = {};
				for(var i in form_data) {
					var data = form_data[i];
					config[data["name"]] = data["value"];
				}
				if(config.measure_area!=Math.floor(config.measure_area)){
					msg.show("套内面积只能为整数", "err");
					return false;
				}
				if(config.measure_area<40 || config.measure_area>300){
					msg.show("面积应该在40~300之间", "err");
					return false;
				}
				require.async("app/packagecompute", function(PC){
					var p = new PC(config);
					$this.find(".total").html(p.getTotalCost());
				});
				return false;
			});
		});

		//预约

		var user_id="",skey="";
		if ($("form[rel=h5_appoint]").length > 0) {
			$(document).ready(function(){
				require.async(['jquery','h5/jsbridge'],function($,jsbridge) {
					var app_version = jsbridge.getAppVersion();
					if (app_version) {
						var app_version_arr = app_version.split('.');
						if (app_version_arr[0] > 2 || (app_version_arr[0] = 2 && app_version_arr[1] >= 1)) {
							jsbridge.onReady(function () {
								jsbridge.getUserInfo(
									function (code, prompt, result) {
										if (typeof(result) == "object") {
											user_id = result.uid;
											skey = result.skey;
										};
										if (code == 0 && user_id && skey) {
										}
									},
									function (code, prompt) {
									});
							});
						}
					}
				});
			});
		}

		//预约
		$("form[rel=h5_appoint]").each(function(){
			var $form=$(this);
			var $btn=$form.find('input[type=submit]');

			$btn.click(function(){
				var name = $form.find('input[name=name]').val();
				var mobile = $form.find('input[name=mobile]').val();
				var province = $form.find('select[name=province]').val();
				var city = $form.find('select[name=city]').val();

				if(!name){
					msg.show("请输入昵称","err");
					return false;
				}
				if (!mobile || !/^(?:13\d|15\d|18\d|17\d)\d{5}(\d{3}|\*{3})$/.test(mobile)){
		            msg.show("请填写正确的手机号", "err");
		            $mobile.focus();
		            return false;
		        }
				if(!province || !city){
					msg.show("请选择省市","err");
					return false;
				}
				$.ajax({
					url: 'http://m.guojj.com/user/ajaxAppoint',
					type: 'POST',
					data: {
						'name': name,
						'mobile': mobile,
						'province': province,
						'city': city,
						'user_id':user_id,
						'skey':skey,
						'gtag':net.getParam('gtag')
					},
					dataType: 'json',
					error: function () {
						msg.show("预约失败,请重试");
					},
					success: function(json_data){
						if(json_data.code==1){
							msg.show(json_data.msg);
						}else{
							msg.show("预约成功");
							setTimeout(function(){
								location.reload()
							},1000);
						}
					}
				});
			});
		});
	};
	$(function(){
		bindEvent();
	});
});
