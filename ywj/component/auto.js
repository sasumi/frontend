define('ywj/auto', function(require){
	var util = require('ywj/util');
	var net = require('ywj/net');
	var _ = require('ywj/AutoComponent');
	var lang = require('lang/$G_LANGUAGE');
	var Pop = require('ywj/popup');

	var MSG_SUCCESS_SHOW_TIME = 1; //成功信息显示时间（秒）
	var MSG_ERROR_SHOW_TIME = 2; //错误信息显示时间（秒）
	var MSG_LOAD_TIME = 10000;
	var BTN_LOADING_CLASS = 'btn-loading';
	var top_doc;
	var top_win;

	try {
		top_doc = parent.document;
		top_win = parent;
	} catch(ex){}
	top_doc = top_doc || document;
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
	 * show exception in some env
	 * @param exception_data
	 */
	var showException = function(exception_data){
		var html = '<strong>[Message]</strong><div style="margin-bottom:2em; color:red;">'+util.htmlEscape(exception_data.message)+'</div>';
		html += '<strong>[File]</strong><div style="margin-bottom:2em; color:green;">'+util.htmlEscape(exception_data.file) + ' #'+exception_data.line + '</div>';
		html += '<strong>[Trace]</strong><div style="color:gray;">'+util.htmlEscape(exception_data.trace_string).replace(/\n/g, '<br/>')+'</div>';
		Pop.showAlert('系统异常', html, null, {width:800});
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
	 */
	var auto_process_async = function(node, rsp){
		console.log('RSP:', rsp);
		var $node = $(node);
		var onrsp = $node.attr('onresponse');
		var onsucc = $node.attr('onsuccess');
		rsp = rsp || {};
		rsp.message = rsp.message || '系统繁忙，请稍后(-1)';
		rsp.code = rsp.code === undefined ? -1 : rsp.code;
		rsp.node = $node;

		//develop environment
		if(rsp.data && rsp.data['__show_exception__'] == 999){
			showException(rsp.data);
			return;
		}

		if(onrsp){
			eval('var fn = window.'+onrsp+';');
			fn.call(null, rsp);
			return;
		}
		showMsg(rsp.message, rsp.code ? 'err' : 'succ');
		if(rsp.code == 0){
			onsucc = onsucc ? function(){
				eval('var fn = window.' + onsucc + ';');
				fn.call(null, rsp);
			} : function(){
				if(rsp.jump_url){
					top_win.location.href = rsp.jump_url;
				}else{
					top_win.location.reload();
				}
			};
			setTimeout(onsucc, MSG_SUCCESS_SHOW_TIME * 1000);
		}
	};

	var checkConfirm = function(node){
		var msg = $(node).data('confirm');
		var ret = !(msg && !confirm(msg));
		if(!ret){
			var event = window.event;
			if(event.preventDefault){
				event.preventDefault();
			} else {
				event.returnValue = false;
			}
		}
		return ret;
	};

	/**
	 * 绑定事件
	 */
	var bindEvent = function(){
		var $body = $('body');

		$body.delegate('a[rel=async]', 'click', function(){
			var _this = this;
			var $link = $(this);
			var SUBMITTING_KEY = 'data-submitting-flag';
			var url = $link.attr('href');
			if($link.attr(SUBMITTING_KEY) == 1){
				if(!$link.hasClass('btn')){
					showMsg(lang('正在提交请求...'), 'load', MSG_LOAD_TIME);
				}
				return false;
			}
			if(!checkConfirm(this)){
				return false;
			}
			if(url){
				$link.attr(SUBMITTING_KEY, 1);
				showMsg(lang('正在提交请求...'), 'load', MSG_LOAD_TIME);
				if($link.hasClass('btn')){
					$link.addClass(BTN_LOADING_CLASS);
				}
				net.request(url, null, {
					onSuccess: function(rsp){
						$link.removeClass(BTN_LOADING_CLASS);
						$link.attr(SUBMITTING_KEY, 0);
						hideMsg();
						auto_process_async(_this, rsp);
					},
					onError: function(){
						$link.removeClass(BTN_LOADING_CLASS);
						$link.attr(SUBMITTING_KEY, 0);
					}
				});
				return false;
			}
		});

		/**
		 * conform（采用mousedown触发，因此对于使用mousedown事件的逻辑可能会产生冲突
		 */
		$body.delegate('*[data-confirm]', 'click',function(){
			if(!this.rel && !checkConfirm(this)){
				return false;
			}
		});

		//表格操作
		(function(){
			$body.delegate('*[rel=row-delete-btn]', 'click', function(){
				var row = $(this).parentsUntil('tr').parent();
				var allow_empty=$(this).data("allow-empty") || false;
				require.async('ywj/table', function(T){
					T.deleteRow(row,allow_empty);
				});
			});

			$body.delegate('*[rel=row-up-btn]', 'click', function(){
				var row = $(this).parentsUntil('tr').parent();
				require.async('ywj/table', function(T){
					T.moveUpRow(row);
				});
			});

			$body.delegate('*[rel=row-down-btn]', 'click', function(){
				var row = $(this).parentsUntil('tr').parent();
				require.async('ywj/table', function(T){
					T.moveDownRow(row);
				});
			});

			$body.delegate('*[rel=row-append-btn]', 'click', function(e){
				var tmp = $(this).parentsUntil('table');
				var table = tmp.parent();
				var tbl = $('tbody', table);
				var tpl = $(this).data('tpl');
				require.async('ywj/table', function(T){
					T.appendRow($('#'+tpl).text(), tbl);
				});
				e.stopPropagation();
			});
		})();

		//日期组件预加载
		if($('input.date-time-txt:not([data-component])').size() || $('input.date-txt:not([data-component])').size()){
			require.async('ywj/timepicker', function(){
				var $dt = $('input.date-time-txt:not([data-component])');
				var $d = $('input.date-txt:not([data-component])');
				$dt.datetimepicker({
					dateFormat: 'yy-mm-dd',
					timeFormat: 'HH:mm:ss'
				});
				$d.datepicker({
					dateFormat: 'yy-mm-dd'
				});
				$dt.data('date-widget-loaded', 1);
				$d.data('date-widget-loaded', 1);
			});
		}

		$.each(['input.date-time-txt:not([data-component])', 'input.date-txt:not([data-component])'], function(idx, s){
			if($(s).size()){
				require.async('ywj/timepicker', function(){
					var opt = {dateFormat: 'yy-mm-dd'};
					if(s.indexOf('time') >= 0){
						opt.timeFormat = 'HH:mm:ss'
					}
					$(s).datetimepicker(opt);
					$(s).data('date-widget-loaded', 1);
				});
			}
			$body.delegate(s, 'click', function(){
				if(!$(this).data('date-widget-loaded')){
					var _this = this;
					require.async('ywj/timepicker', function(){
						var opt = {dateFormat: 'yy-mm-dd'};
						if(s.indexOf('time') >= 0){
							opt.timeFormat = 'HH:mm:ss'
						}
						$(_this).datetimepicker(opt);
						$(_this).data('date-widget-loaded', 1);
						$(_this).trigger('click');
					});
				}
			});
		});
	};

	/**
	 * 处理器
	 * 里面的处理逻辑都需要做好去重
	 */
	var handler = function(){
		//表格空值填充
		$('table[data-empty-fill]').each(function(){
			var empty = $('tr td', this).size() == 0;
			if(empty){
				var cs = $('tr>td', this).size() || $('tr>th', this).size();
				var con = $('tbody', this).size() ? $('tbody', this) : $(this);
				$('<tr class="row-empty"><td colspan="'+(cs || 1)+'"><div class="data-empty"> '+lang("无数据")+'</div></td></tr>').appendTo(con);
			}
		});

		//表单自动将get参数写到隐藏域中
		$('form').each(function(){
			if($(this).data('form-get-fixed')){
				return;
			}
			$(this).data('form-get-fixed', 1);

			if(!this.method || (this.method.toLowerCase() == 'get' && this.action.indexOf('?') >= 0)){
				var action = this.action;
				var query_str = action.substring(action.lastIndexOf("?")+1, action.length);
				var query_arr = query_str.split('&');
				for(var i=0;i<query_arr.length;i++){
					var tmp = query_arr[i].split('=');
					$(this).prepend('<input name="'+escape(decodeURIComponent(tmp[0]))+'" type="hidden" value="'+escape(decodeURIComponent(tmp[1]))+'" />');
				}
			}
		});
	};

	$(function(){
		bindEvent();
		handler();
	});
});