define('ywj/auto', function(require){
	var util = require('ywj/util');
	var net = require('ywj/net');
	var $ = require('jquery');

	var EVENT_BINDED = false;
	var MSG_SHOW_TIME = (function(){
		return $.extend({
			err: 1,
			succ: 1,
			tip: 1
		}, window['MSG_SHOW_TIME'] || {});
	})();

	var MSG_LOAD_TIME = 10000;
	var DEF_POPUP_WIDTH = 600;

	var top_doc;
	var top_win;
	try {
		//约束在同一个系统里面.....
		if(parent.document && location.host == parent.document.location.host){
			top_doc = parent.document;
			top_win = parent;
		}
	} catch(ex){

	}
	top_doc = top_doc || document;
	top_win = top_win || window;

	var showMsg = function(message, type, time){
		type = type || 'err';
		require.async('ywj/msg', function(Msg){
			Msg.show(message, type, time || MSG_SHOW_TIME[type]);
		});
	};

	var hideMsg = function(){
		require.async('ywj/msg', function(Msg){
			Msg.hide();
		});
	};

	var showPopup = function(conf, onSuccess, onError, onShow){
		require.async('ywj/popup', function(Pop){
			var p = new Pop(conf);
			p.onShow = onShow;
			if(onSuccess){
				p.listen('onSuccess', onSuccess);
			}
			if(onError){
				p.listen('onError', onError);
			}
			p.show();
		});
	};

	/**
	 * 自动处理后台返回结果
	 * @param node
	 * @param rsp
	 */
	var auto_process_async = function(node, rsp){
		node = $(node);
		var onrsp = node.attr('onresponse');
		var onsucc = node.attr('onsuccess');
		rsp = rsp || {};
		rsp.message = rsp.message || '系统繁忙，请稍后(-1)';
		rsp.code = rsp.code === undefined ? -1 : rsp.code;
		console.log('RSP:', rsp);

		if(onrsp){
			eval('var fn = window.'+onrsp+';');
			fn.call(node, rsp);
		} else if(onsucc){
			if(rsp.code == 0){
				showMsg(rsp.message,'succ');
				setTimeout(function(){
					eval('var fn = window.'+onsucc+';');
					fn.call(node, rsp);
				}, MSG_SHOW_TIME.succ*1000);
			}
			else {
				showMsg(rsp.message);
			}
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
				}, MSG_SHOW_TIME.succ*1000);
			}
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
		if(EVENT_BINDED){
			return;
		}
		EVENT_BINDED = true;

		var $body = $('body');

		//自动弹窗
		$body.delegate('a[rel=popup]', 'click', function(){
			var $node = $(this);
			var POPUP_ON_LOADING = 'data-popup-on-loading-flag';
			var RET = this.tagName == 'A' ? false : null;

			if($node.attr(POPUP_ON_LOADING) == 1){
				showMsg('正在加载页面...', 'load', MSG_LOAD_TIME);
				$('.ywj-msg-container-wrap').css('background', 'rgba(0,0,0,0.2)'); //style hack
				return RET;
			}

			if(!checkConfirm(this)){
				return RET;
			}

			$node.attr(POPUP_ON_LOADING, 1);
			var src = net.mergeCgiUri($node.attr('href'), {'ref':'iframe'});
			var width = parseFloat($node.data('width')) || DEF_POPUP_WIDTH;
			var height = parseFloat($node.data('height')) || 0;
			var title = $node.attr('title') || $node.html() || '';
			var onSuccess = $node.data('onsuccess');
			if(onSuccess){
				eval('var fn1 = window.'+onSuccess);
				onSuccess = fn1;
			} else {
				onSuccess = function(){};
			}
			var onError = $node.data('onerror');
			if(onError){
				eval('var fn2 = window.'+onError);
				onError = fn2;
			} else {
				onError = function(){};
			}
			var conf = {
				title: title,
				content: {src:src},
				width: width,
				moveEnable: true,
				topCloseBtn: true,
				buttons: []
			};
			if(height){
				conf.height = height;
			}
			showPopup(conf, function(){
				return onSuccess.apply($node, util.toArray(arguments));
			}, onError, function(){
				hideMsg();
				$node.attr(POPUP_ON_LOADING, 0);
			});
			return RET;
		});

		//自动MSG
		$body.delegate('*[rel=msg]', 'click', function(){
			var msg = $(this).data('msg') || $(this).attr('title');
			if(msg){
				showMsg(msg, 'tip');
			}
		});

		//自动ajax链接
		$body.delegate('a[rel=async]', 'click', function(){
			var _this = this;
			var $link = $(this);
			var SUBMITTING_KEY = 'data-submitting-flag';
			var url = $link.attr('href');

			if($link.attr(SUBMITTING_KEY) == 1){
				showMsg('正在提交请求...', 'load', MSG_LOAD_TIME);
				return false;
			}
			if(!checkConfirm(this)){
				return false;
			}
			if(url){
				$link.attr(SUBMITTING_KEY, 1);
				showMsg('正在提交请求...', 'load', MSG_LOAD_TIME);
				net.request(url, null, {
					onSuccess: function(rsp){
						$link.attr(SUBMITTING_KEY, 0);
						hideMsg();
						auto_process_async(_this, rsp);
					},
					onError: function(){
						$link.attr(SUBMITTING_KEY, 0);
					}
				});
				return false;
			}
		});

		$body.delegate('*[rel=anchor-slide]', 'click', function(){
			var _this = $(this);
			var time = _this.attr("slide-time") || 1000;
			var direction = _this.attr("slide-direction") || "0";
			var _rel = _this.attr("href").substr(1);
			var $target = $("#"+_rel);
			switch (direction){
				case 1:
					var _targetLeft = $target.offset().left;
					$("html,body").animate({scrollLeft:_targetLeft},time);
					break;
				default :
					var _targetTop = $target.offset().top;
					$("html,body").animate({scrollTop:_targetTop},time);
					break;
			}
			return false;
		});

		/**
		 * 快捷键支持
		 * @type {*|HTMLElement}
		 */
		var $accessory_key_dom = $('*[data-accessory-key]', $body);
		if($accessory_key_dom.size()){
			require.async('jquery/hotkeys', function(){
				var exist_keys = {};
				$accessory_key_dom.each(function(){
					var $node = $(this);
					var k = $node.data('accessory-key');
					if(exist_keys[k]){
						return;
					}
					exist_keys[k] = true;
					$body.bind('keydown', k, function(){
						$node[0].click();
						return false;
					});
				});
			});
		}

		/**
		 * checkbox 选择框。根据rel=selector判定，操作对象范围由data-target决定,如果没有
		 * 提供该值,则缺省为body
		 * 读取data-flag = 1 为全选。如果本身是checkbox则根据本身的checked进行判定。
		 */
		$body.delegate('*[rel=selector]', 'click', function(){
			var tag = $(this).data('target') || 'body';
			if(tag){
				var toState = $(this).data('flag') === undefined || $(this).data('flag') == '1';
				if(this.type == 'checkbox'){
					toState = this.checked;
				}
				$('input[type=checkbox]', $(tag)).attr('checked', toState).trigger('change');
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

		//自动select popup类型
		$body.delegate('select[rel=popup]', 'change', function(){
			//$('select[rel=popup]').on('change', function(){
			var node = $(this);
			var val = node.val();
			var opt = $(this.options[this.selectedIndex]);
			var ti = opt.attr('title') || opt.text() || opt.attr('name');
			var ex_type = opt.attr('rel') || 'popup';
			var w = parseInt(opt.data('width'), 10) || DEF_POPUP_WIDTH;
			var h = parseInt(opt.data('height'), 10) || 0;
			if(val){
				if(!checkConfirm(opt)){
					return;
				}
				if(ex_type == 'popup'){
					showPopup({
						title: ti,
						content: {src:val},
						width: w,
						height: h
					});
				} else if(ex_type == 'async'){
					showMsg('提交数据中...', 'load', MSG_LOAD_TIME);
					net.get(val, {ref:'json'}, function(rsp){
						hideMsg();
						auto_process_async(opt[0], rsp);
					});
				}
				this.selectedIndex = 0;
			}
		});

		//虚拟表单提交功能
		$body.delegate('*[rel=async-submit]', 'click', function(){
			var target = $(this).data('target');
			var action = $(this).data('action');
			var method = $(this).data('method') || 'get';

			if(!target || !action){
				return;
			}

			if(!checkConfirm(this)){
				return;
			}
			var _this = this;
			var data = util.getFormData($(target));
			showMsg('正在提交请求...', 'load', MSG_LOAD_TIME);
			net[method](action, data, function(rsp){
				hideMsg();
				auto_process_async(_this, rsp);
			});
			return false;
		});

		//表格操作
		(function(){
			$body.delegate('*[rel=row-delete-btn]', 'click', function(){
				var allow_empty = $(this).data('allow-empty') == '1';
				var row = $(this).parentsUntil('tr').parent();
				require.async('ywj/table', function(T){
					T.deleteRow(row, allow_empty);
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

		if ($('*[rel=tooltip]').length > 0) {
			require.async('ywj/tooltip', function () {
				$('[rel=tooltip]').tooltip({
						position: {
							my: "center bottom-20",
							at: "center top",
							using: function (position, feedback) {
								$(this).css(position);
								$("<div>")
									.addClass("ui-tooltip-arrow")
									.addClass(feedback.vertical)
									.addClass(feedback.horizontal)
									.appendTo(this);
							}
						}
					}
				);
			});
		}

		if ($('*[rel=img-slide]').length > 0) {
			require.async('ywj/imgslide', function (slide) {
				slide.init();
			});
		}

		//时间组件触发
		var _TIME_N_CHK = 'date-widget-bind';
		$.each(['input.datetime-txt', 'input.date-txt', 'input[type=time]'], function(idx, s){
			if($(s).size()){
				require.async('ywj/timepicker');
			}
			$body.delegate(s, 'focus', function(){
				var $this = $(this);
				if($this.data(_TIME_N_CHK)){
					return;
				}

				var current_timestamp=$.now();
				var enable_past_duration = parseInt($this.data("enable-past-duration"))*1000;
				var enable_future_duration = parseInt($this.data("enable-future-duration"))*1000;
				var min_date = new Date(current_timestamp+enable_past_duration) ;
				var max_date = new Date(current_timestamp+enable_future_duration) ;
				require.async('ywj/timepicker', function(){
					if(s.indexOf('datetime') >= 0){
						$this.datetimepicker({dateFormat:'yy-mm-dd', timeFormat:'HH:mm:ss',minDateTime:min_date,maxDateTime:max_date});
					}
					else if(s.indexOf('date') >= 0){
						$this.datepicker({dateFormat:'yy-mm-dd',minDateTime:min_date,maxDateTime:max_date});
					}
					else if(s.indexOf('time') > 0){
						$this.timepicker({timeFormat:'HH:mm',minDateTime:min_date,maxDateTime:max_date});
					}
					if(!$this.data(_TIME_N_CHK)){
						$this.data(_TIME_N_CHK, 1);
						$this.trigger('focus');
					}
				});
			});
		});

		//编辑页面离开或关闭自动提示
		var beforeunloadPromptFunc = function(){
			if(window['BEFORE_UNLOAD_PROMOTE_SW'] && window['EDITOR_CONTENT_CHANGED_FLAG']){
				return '您输入的内容尚未保存，确定离开此页面吗？';
			}
		};

		//绑定事件
		$(window).bind('beforeunload', beforeunloadPromptFunc);

		//提交按钮时解绑
		$('form').submit(function () {
			$(window).unbind('beforeunload', beforeunloadPromptFunc);
		});
	};

	/**
	 * 处理器
	 * 里面的处理逻辑都需要做好去重
	 */
	var handler = function(){
		var FLAG_SUBMITTING = 'submitting';
		var FLAG_ASYNC_BIND = 'async-bind';

		//自动表单
		$('form[rel=async]').each(function(){
			if(this.target){
				return;
			}

			var $form = $(this);
			$form.on('submit', function(){
				if($form.data(FLAG_SUBMITTING)){
					return false;
				}

				//追加额外数据结构
				if(!$form.data(FLAG_ASYNC_BIND)){
					if($form.attr('method').toLowerCase() == 'get'){
						$('<input type="hidden" name="ref" value="formsender" />').appendTo($form);
					} else {
						$form.attr('action', net.mergeCgiUri($form.attr('action'), {ref: 'formsender'}));
					}
					$form.data(FLAG_ASYNC_BIND, 1);
				}

				var frameId = 'FormSubmitIframe'+ util.guid();
				var span = document.createElement('span');
				span.innerHTML = '<iframe id="'+frameId+'" name="'+frameId+'" style="display:none"></iframe>';
				document.body.appendChild(span);
				var frame = document.getElementById(frameId);
				frame._callback = function(rsp){
					setTimeout(function(){
					$form.removeData(FLAG_SUBMITTING);
					}, 1500);
					hideMsg();
					$(frame).remove(); //避免webkit核心后退键重新提交数据
					auto_process_async($form, rsp);
				};
				$form.attr('target', frameId);
				$form.data(FLAG_SUBMITTING, '1');
				showMsg('正在提交请求...', 'load', MSG_LOAD_TIME);
			});
		});

		//表格空值填充
		$('table').each(function(){
			if($(this).data('empty-fill')){
				var empty = $('tr td', this).size() == 0;
				if(empty){
					var cs = $('tr>td', this).size() || $('tr>th', this).size();
					var con = $('tbody', this).size() ? $('tbody', this) : $(this);
					$('<tr class="row-empty"><td colspan="'+(cs || 1)+'"><div class="data-empty">没有数据</div></td></tr>').appendTo(con);
				}
			}
			if($(this).data('row-check')){
				$('td', this).on('click', function(ev){
					var tag = ev.target.tagName;
					if(/^(A|INPUT|TEXTAREA|BUTTON|LABEL|SELECT)$/.test(tag)){
						return;
					}
					var chk = $('input[type=checkbox]:first', this);
					if(chk.size()){
						chk.attr('checked', !chk.attr('checked'));
					}
				});
			}
		});

		//上传图片
		$('input[rel=upload-image]').each(function(){
			if($(this).data('upload-image-binded')){
				return;
			}
			$(this).data('upload-image-binded', 1);
			var _this = this;
			require.async('ywj/uploader', function(UP){
				new UP($(_this, {TYPE: 'image'}), {
					UPLOAD_URL: window.UPLOAD_URL,
					PROGRESS_URL: window.UPLOAD_PROGRESS_URL
				});
			});
		});

		//上传文件
		$('input[rel=upload-file]').each(function(){
			if($(this).data('upload-file-binded')){
				return;
			}
			$(this).data('upload-file-binded', 1);
			var _this = this;
			require.async('ywj/uploader', function(UP){
				new UP($(_this), {
					UPLOAD_URL: window.UPLOAD_URL,
					PROGRESS_URL: window.UPLOAD_PROGRESS_URL
				});
			});
		});

		//自动富文本编辑器
		$('textarea[rel=rich]').each(function(){
			if($(this).data('rich-binded')){
				return;
			}
			$(this).data('rich-binded', 1);

			var txt = $(this);
			var id = util.guid();
			var name = txt.attr('name');
			var w = txt.width() || 400;
			var h = txt.height() || 300;
			txt.hide();

			var script = '<script id="'+id+'" name="'+name+'" type="text/plain" style="width:'+w+'px; height:'+h+'px;"></script>';
			$(script).insertAfter(txt);

			require.async('ueditor_admin_config', function(){
				require.async('ueditor', function(){
					var ue = UE.getEditor(id);
					setTimeout(function(){
						ue.setContent(txt.val());
						ue.setHeight(h+'px');
						ue .addListener( "contentchange", function () {
							window['EDITOR_CONTENT_CHANGED_FLAG'] = true;
						} );
					}, 1000);
				});
			});
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

		//节点禁止选择
		$('*[data-unselectable]').each(function(){
			util.setNodeSelectDisabled(this);
		});

		//自动地区选择
		if($('select[rel=province-selector]').size()){
			require.async('ywj/areaselector');
		}

		//fixed位置
		var $fixed_els = $('*[data-fixed]', $('body'));
		if($fixed_els.size()){
			$('<style>.fixed-top-element {position:absolute; top:0; left:0; width:100%; z-index:10}</style>').appendTo($('head'));
			//create shadow element
			$fixed_els.each(function(){
				var guid = util.guid();
				$(this).data('fixed-shadow-id', guid);
				$(this).data('org-top', $(this).position().top);
				var shadow = $('<div id="'+guid+'"></div>');
				shadow.css({
					'display':'none',
					'height': $(this).outerHeight()+'px',
					'width': '100%'
				});
				shadow.insertAfter(this);
			});

			var hd = function(){
				var scroll_top = $(window).scrollTop();
				$fixed_els.each(function(){
					var $shadow = $('#'+$(this).data('fixed-shadow-id'));
					if($(this).data('org-top') < scroll_top){
						$(this).addClass('fixed-top-element');
						$(this).css('top', scroll_top);
						$shadow.show();
					} else {
						$(this).css('top', 'auto');
						$(this).removeClass('fixed-top-element');
						$shadow.hide();
					}
				});
			};
			$(window).scroll(hd);
			hd();
		}
	};

	$(function(){
		bindEvent();
		handler();
	});
});