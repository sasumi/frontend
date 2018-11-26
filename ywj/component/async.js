/**
 * Created by Administrator on 2016/6/8.
 */
define('ywj/async', function(require){
	var Net = require('ywj/net');
	var Util = require('ywj/util');
	var MSG_SUCCESS_SHOW_TIME = window.MSG_SUCCESS_SHOW_TIME || 1; //成功信息显示时间（秒）
	var MSG_ERROR_SHOW_TIME =window.MSG_ERROR_SHOW_TIME || 2; //错误信息显示时间（秒）
	var MSG_LOAD_TIME = 10000;

	var BTN_LOADING_CLASS = 'btn-loading';
	var FLAG_SUBMITTING = 'submitting';
	var FLAG_ASYNC_BIND = 'async-bind';
	var lang = require('lang/$G_LANGUAGE');

	var top_win;
	try {
		top_win = parent;
	} catch(ex){}
	top_win = top_win || window;

	/**
	 * 显示信息
	 * @param message
	 * @param type
	 * @param time
	 */
	var showMsg = function(message, type, time){
		type = type || 'err';
		require.async('ywj/msg', function(Msg){
			Msg.show(message, type, time || (type == 'err' ? MSG_ERROR_SHOW_TIME : MSG_SUCCESS_SHOW_TIME));
		});
	};

	/**
	 * 隐藏信息
	 */
	var hideMsg = function(){
		require.async('ywj/msg', function(Msg){
			Msg.hide();
		});
	};

	/**
	 * 自动处理后台返回结果
	 * @param node
	 * @param rsp
	 * @param param
	 */
	var auto_process_async = function(node, rsp, param){
		var onrsp = node.attr('onresponse') || param.onresponse;
		var onsucc = node.attr('onsuccess') || param.onsuccess;
		var onerr = node.attr('onerror') || param.onerror;
		rsp = rsp || {};
		rsp.message = rsp.message || lang('系统繁忙，请稍后(-1)');
		rsp.message = lang(rsp.message);
		rsp.code = rsp.code === undefined ? -1 : rsp.code;
		rsp.node = node;
		console.log('RSP:', rsp);

		if(onrsp){
			eval('var fn = window.'+onrsp+';');
			fn.call(null, rsp);
		}

		//specify success handler
		else if(onsucc && rsp.code == 0){
			showMsg(rsp.message,'succ');
			setTimeout(function(){
				eval('var fn = window.'+onsucc+';');
				fn.call(null, rsp);
			}, MSG_SUCCESS_SHOW_TIME*1000);
		}

		//specify error handler
		else if(onerr && rsp.code != 0){
			showMsg(rsp.message,'err');
			setTimeout(function(){
				eval('var fn = window.'+onerr+';');
				fn.call(null, rsp);
			}, MSG_SUCCESS_SHOW_TIME*1000);
		}

		//reload page on success
		else {
			showMsg(rsp.message, rsp.code ? 'err' : 'succ');
			if(rsp.code == 0){
				setTimeout(function(){
					if(rsp.jump_url){
						top_win.location.href = rsp.jump_url;
					} else {
						top_win.location.reload();
					}
				}, MSG_SUCCESS_SHOW_TIME*1000);
			}
		}
	};

	return {
		nodeInit: function($form, param){
			if($form.attr('target') || !$form.attr('action')){
				return;
			}

			var $submit_btn = $form.find('input.btn[type=submit]:first');
			$form.find('input.btn[type=submit]').click(function(){
				$submit_btn = $(this);
			});
			$form.on('submit', function(){
				if($form.data(FLAG_SUBMITTING)){
					hideMsg();
					if(!$submit_btn.hasClass(BTN_LOADING_CLASS)){
						showMsg(lang('正在提交数据，请稍侯...'), 'load', MSG_LOAD_TIME);
					}
					return false;
				}

				//追加额外数据结构
				if(!$form.data(FLAG_ASYNC_BIND)){
					if(!$form.attr('method') || $form.attr('method').toLowerCase() == 'get'){
						$('<input type="hidden" name="ref" value="formsender" />').appendTo($form);
					} else {
						$form.attr('action', Net.mergeCgiUri($form.attr('action'), {ref: 'formsender'}));
					}
					$form.data(FLAG_ASYNC_BIND, 1);
				}

				var frameId = 'FormSubmitIframe'+ Util.guid();
				var span = document.createElement('span');
				span.innerHTML = '<iframe id="'+frameId+'" name="'+frameId+'" style="display:none"></iframe>';
				document.body.appendChild(span);
				var frame = document.getElementById(frameId);
				var _response = false;
				frame.onload = function(){
					if(!_response){
						$submit_btn.removeClass(BTN_LOADING_CLASS);
						_response = true;
						//防手抖
						setTimeout(function(){$form.removeData(FLAG_SUBMITTING);}, 100);
						hideMsg();
						$(frame).parent().remove(); //避免webkit核心后退键重新提交数据
						auto_process_async($form, {code:1, data:{}, message:lang('数据错误，请联系系统管理员')}, param);
					}
				};
				frame._callback = function(rsp){
					$submit_btn.removeClass(BTN_LOADING_CLASS);
					_response = true;
					//防手抖
					setTimeout(function(){$form.removeData(FLAG_SUBMITTING);}, 100);
					hideMsg();
					$(frame).parent().remove(); //避免webkit核心后退键重新提交数据
					auto_process_async($form, rsp, param);
				};
				$form.attr('target', frameId);
				$form.data(FLAG_SUBMITTING, '1');
				$submit_btn.addClass(BTN_LOADING_CLASS);

				//1.5秒之后显示loading效果
				if(!$submit_btn.size()){
					setTimeout(function(){
						if(!_response){
							showMsg(lang('正在提交请求...'), 'load', MSG_LOAD_TIME);
						}
					}, 1500);
				}
			});
		},

		nodeClick: function($link, param){
			var SUBMITTING_KEY = 'data-submitting-flag';
			var url = $link.attr('href');
			var data = param.data || null;
			var method = param.method || 'get';
			var timeout = param.timeout;
			if($link.attr(SUBMITTING_KEY) == 1){
				if(!$link.hasClass('btn')){
					showMsg(lang('正在提交请求...'), 'load', MSG_LOAD_TIME);
				}
				return false;
			}
			if(url){
				$link.attr(SUBMITTING_KEY, 1);
				showMsg(lang('正在提交请求...'), 'load', MSG_LOAD_TIME);
				if($link.hasClass('btn')){
					$link.addClass(BTN_LOADING_CLASS);
				}

				var opt = {
					method: method,
					onSuccess: function(rsp){
						$link.removeClass(BTN_LOADING_CLASS);
						$link.attr(SUBMITTING_KEY, 0);
						hideMsg();
						auto_process_async($link, rsp, param);
					},
					onError: function(){
						$link.removeClass(BTN_LOADING_CLASS);
						$link.attr(SUBMITTING_KEY, 0);
					}
				};
				if(timeout !== undefined){
					opt.timeout = parseInt(timeout, 10)*1000;
				}
				Net.request(url, data, opt);
				return false;
			}
		}
	}
});