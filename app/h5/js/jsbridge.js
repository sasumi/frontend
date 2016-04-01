/**
 * Created by damon on 2016/1/11.
 */
define('h5/jsbridge', function (require) {
	var $ = require('jquery');

	var JsBridge = function () {
	};

	var code_success = 0;
	var last_call_back_id = 0;
	var call_back_id_map_handle_func_list = {};

	//打开登陆页
	JsBridge.openLoginPage = function (default_account, $succ_call_back, $fail_call_back) {//default_account用于打开登陆页面时自动填入的用户账号
		if (default_account === undefined) {
			default_account = '';
		}
		if ($succ_call_back === undefined) {
			$succ_call_back = default_callBackOpenLoginPage;
		}
		if ($fail_call_back === undefined) {
			$fail_call_back = default_failCallBack;
		}
		call_app('openLoginPage', {"account": default_account}, $succ_call_back, $fail_call_back);
	};

	//声明getUserInfo方法
	JsBridge.getUserInfo = function ($succ_call_back, $fail_call_back) {
		call_app('getUserInfo', {}, $succ_call_back, $fail_call_back);
	};

	//获取app版本号 如果获取不到返回 false
	JsBridge.getAppVersion = function () {
		var ua = navigator.userAgent.toLowerCase();
		s = ua.match(/gjj\/user\((.*)\)/);
		if (s instanceof Array && s[1]) {
			return s[1].split(';').shift();
		}
		return false;
	};

	//声明回调方法
	window.GJJJB_onNativeCallback = function (result) {
		//这里根据call_back 回来的 call_back_id 确定是哪一种请求，给不同的方法去处理
		var call_back_handle_func = call_back_id_map_handle_func_list[result.callbackId];
		if (call_back_handle_func && typeof(call_back_handle_func) == "function") {
			call_back_handle_func(result.code, result.prompt, result.result);
			delete call_back_id_map_handle_func_list[result.callbackId];
		}
	};

	//调用此方法时请注意在header里面声明 window.GJJJB_onReadyCallback 给app调用 以及变量 window.GJJJB_onReadyFlag
	JsBridge.onReady = function($calL_back){
		if(window.GJJJB_onReadyFlag == true){
			if(typeof($calL_back) == 'function' ){
				$calL_back();
			}
		}else{
			if(window.GJJJB_onReadyCallBackList == undefined){
				window.GJJJB_onReadyCallBackList = [];
			}
			window.GJJJB_onReadyCallBackList.push($calL_back);
		}
	};

	function call_app(method_str, args_obj, succ_call_back, fail_call_back) {
		if (fail_call_back === undefined) {
			fail_call_back = default_failCallBack
		}

		var callNative = function(obj_string){
			if (window.GJJJB === undefined || window.GJJJB.callNative === undefined) {
				fail_call_back(1, 'GJJJB_callNative undefined');
				return false;
			}
			window.GJJJB.callNative(obj_string);				//app注入的给H5调用的的方法, 由于安卓刷新时页面时无法注入，所以这里用ZXX.XX的形式
		};

		if (method_str === undefined) {
			fail_call_back(2, 'Method of GJJJB_callNative undefined');
			return false;
		}
		if (args_obj === undefined) {
			args_obj = {};
		}


		var obj = {"method": method_str, 'callbackId': last_call_back_id++, "args": args_obj};
		call_back_id_map_handle_func_list[obj.callbackId] = succ_call_back;
		callNative(JSON.stringify(obj));
	}

	var default_callBackOpenLoginPage = function (code, prompt, result_data_obj) {
		if (code != code_success) {
			alert(prompt);
		}
	};

	var default_failCallBack = function (code, prompt) {
		alert(prompt);
	};

	return JsBridge;
});