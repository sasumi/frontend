/**
 * Created by sasumi on 3/12/2014.
 */
define('ywj/popup', function(require){
	var $ = require('jquery');
	var util = require('ywj/util');
	var masker = require('ywj/masker');
	var POP_COLLECT_KEY = '__POPUP_COLLECTION__';
	var YWJ_WIDGET_POPUP = 'YWJ_WIDGET_POPUP';
	var emptyFn = function(){};

	$('<style type="text/css">'+[
		'.PopupDialog {zoom:1; filter: progid:DXImageTransform.Microsoft.DropShadow(OffX=2, OffY=2, Color=#cccccc);}',
		'.PopupDialog * {margin:0; padding:0}',
		'.PopupDialog {position:absolute; top:20px; left:20px; width:350px; border:1px solid #999; border-top-color:#bbb; border-left-color:#bbb; background-color:white; box-shadow:0 0 8px #aaa; border-radius:3px}',
		'.PopupDialog-hd {height:28px; background-color:#fff; cursor:move; position:relative; border-radius:3px 3px 0 0}',
		'.PopupDialog-hd h3 {font-size:13px; font-weight:normal; color:gray; padding-left:10px; line-height:28px;}',
		'.PopupDialog-close {display:block; overflow:hidden; width:28px; height:28px; position:absolute; right:0; top:0; text-align:center; cursor:pointer; font-size:17px; font-family:Verdana; text-decoration:none; color:gray;}',
		'.PopupDialog-close:hover {color:black;}',
		'.PopupDialog-ft {background-color:#f3f3f3; white-space:nowrap; border-top:1px solid #e0e0e0; padding:5px 5px 5px 0; text-align:right; border-radius:0 0 3px 3px}',
		'.PopupDialog-text {padding:20px;}',
		'.PopupDialog-bd-frm {border:none; width:100%}',
		'.PopupDialog-btn {display:inline-block; font-size:13px; cursor:pointer; box-shadow:1px 1px #fff; text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.7); background:-moz-linear-gradient(19% 75% 90deg, #E0E0E0, #FAFAFA); background:-webkit-gradient(linear, left top, left bottom, from(#FAFAFA), to(#E0E0E0)); color:#4A4A4A; background-color:white; text-decoration:none; padding:0 15px; height:20px; line-height:20px; text-align:center; border:1px solid #ccd4dc; white-space:nowrap; border-radius:2px}',
		'.PopupDialog-btn:hover {background-color:#eee}',
		'.PopupDialog-btnDefault {}'].join('')
		+ '</style>')
		.appendTo($('head'))
		.attr('id',YWJ_WIDGET_POPUP);

	window[POP_COLLECT_KEY] = {};

	/**
	 * Popup class
	 * @constructor Popup
	 * @description popup dialog class
	 * @example new Popup(config);
	 * @param {Object} config
	 */
	var Popup = function(config){
		this.container = null;
		this.status = 0;
		this._eventBinded = false;

		this._events = {};
		this._eventParams = {};

		this._readyCbList = [];
		this.guid = util.guid();
		this.onShow = emptyFn;
		this.onClose = emptyFn;

		this.config = $.extend({}, {
			ID_PRE: 'popup-dialog-id-pre',
			title: '对话框',				//标题
			content: '测试',				//content.src content.id
			width: 400,						//宽度
			moveEnable: true,				//框体可移动
			moveTriggerByContainer: false,	//内容可触发移动
			zIndex: 1000,					//高度
			isModal: false,					//模态对话框
			topCloseBtn: true,				//是否显示顶部关闭按钮,如果显示顶部关闭按钮，则支持ESC关闭窗口行为
			showMask: true,
			keepWhileHide: false,			//是否在隐藏的时候保留对象
			cssClass: {
				dialog: 'PopupDialog',
				head: 'PopupDialog-hd',
				body: 'PopupDialog-bd',
				textCon: 'PopupDialog-text',
				iframe: 'PopupDialog-bd-frm',
				container: 'PopupDialog-dom-ctn',
				foot: 'PopupDialog-ft'
			},
			buttons: [
			 //{name:'确定', handler:null},
			 //{name:'关闭', handler:null, setDefault:true}
			]
		}, config);

		//ADD TO MONITOR COLLECTION
		window[POP_COLLECT_KEY][this.guid] = this;
	};

	/**
	 * on content onReady
	 * @param  callback
	 */
	Popup.prototype.onReady = function(callback) {
		if(this._ready){
			callback();
		} else {
			this._readyCbList.push(callback);
		}
	};

	/**
	 * call ready list
	 */
	Popup.prototype._callReadyList = function() {
		this._ready = true;
		$.each(this._readyCbList, function(k, fn){
			fn();
		});
		this._readyCbList = [];
	};

	/**
	 * show popup
	 */
	Popup.prototype.show = function(){
		var _this = this;

		initStructure.call(this, function(){
			_this.config.showMask && masker.show();
			_this.container.show();

			var iframe = $('iframe', _this.container);
			if(iframe.size()){
				updateIframeHeight.call(_this, iframe[0]);
			}

			//更新对话框位置信息
			updateDialogRegion.call(_this);

			if(!_this._eventBinded){
				//绑定对话框事件
				bindEvent.call(_this);

				//绑定对话框移动事件
				bindMoveEvent.call(_this);

				//绑定对话框关闭事件
				bindEscCloseEvent.call(_this);
				_this._eventBinded = true;
			}

			//更新对话框z-index
			updateDialogZIndex.call(_this);

			_this.onShow();
			_this.status = 1;
		});
	};

	/**
	 * 更新登录对话框高度
	 */
	Popup.prototype.updateHeight = function(height){
		var iframe = $('iframe', this.container);
		if(iframe.size()){
			updateIframeHeight.call(this, iframe[0], height);
		}
	};

	/**
	 * 聚焦到当前对话框第一个按钮
	 */
	Popup.prototype.focus = function() {
		var a = $('A', this.container);
		if(a[0]){
			a.focus();
		}
	};

	/**
	 * set dialog operate enable
	 **/
	Popup.prototype.setEnable = function() {
		var mask = $('.PopupDialog-Modal-Mask', this.container);
		if(mask){
			mask.hide();
		}
	};

	/**
	 * set dialog operate disable
	 **/
	Popup.prototype.setDisable = function() {
		$('.PopupDialog-Modal-Mask', this.container).css({height: this.container.height(), opacity:0.4});
	};

	/**
	 * close current popup
	 */
	Popup.prototype.close = function(){
		if(this.onClose() === false){
			return;
		}
		this.container.hide();
		this.status = 0;

		var _this = this,
			hasDialogLeft = false,
			hasModalPanelLeft = false;

		if(!this.config.keepWhileHide){
			var tmp = {};
			$.each(window[POP_COLLECT_KEY], function(guid){
				if(guid != _this.guid){
					tmp[this.guid] = this;
				}
			});

			window[POP_COLLECT_KEY] = tmp;
			_this.container.remove();
			_this.container = null;
		}

		$.each(window[POP_COLLECT_KEY], function(k, dialog){
			if(dialog.status){
				hasDialogLeft = true;
			}
			if(dialog.status && dialog.config.isModal){
				hasModalPanelLeft = true;
				dialog.setEnable();
				dialog.focus();
				return false;
			}
		});

		//没有显示的对话框
		if(!hasDialogLeft){
			masker.hide();
		}

		//剩下的都是普通对话框
		if(!hasModalPanelLeft){
			var _lastTopPanel;
			$.each(window[POP_COLLECT_KEY], function(k, dialog){
				if(!dialog.status){
					return;
				}
				dialog.setEnable();
				if(!_lastTopPanel){
					_lastTopPanel = dialog;
				} else if(_lastTopPanel.config.zIndex <= dialog.config.zIndex){
					_lastTopPanel = dialog;
				}
			});
			if(_lastTopPanel){
				_lastTopPanel.focus();
			}
		}
	};

	/**
	 * 关闭其他窗口
	 **/
	Popup.prototype.closeOther = function(){
		try {
			var _this = this;
			$.each(window[POP_COLLECT_KEY], function(k, pop){
				if(pop != _this){
					pop.close();
				}
			});
		}catch(e){}
	};

	/**
	 * 监听自定义事件
	 * @param key
	 * @param handler
	 * @return {Boolean}
	 */
	Popup.prototype.listen = function(key, handler){
		if(this._eventParams[key]){
			handler.apply(this, this._eventParams[key]);
		} else {
			if(this._events[key]){
				this._events[key].push(handler);
			} else {
				this._events[key] = [handler];
			}
		}
	};

	/**
	 * 触发事件
	 * @param key
	 */
	Popup.prototype.fire = function(key){
		var _this = this;
		var args = util.toArray(arguments).slice(1);
		this._eventParams[key] = args;
		if(this._events[key]){
			$.each(this._events[key], function(k, fn){
				fn.apply(_this, args);
			});
		}
	};

	/**
	 * search popup by guid
	 * @param  guid
	 * @return {Popup}
	 */
	Popup.getPopupByGuid = function(guid){
		var result;
		$.each(window[POP_COLLECT_KEY], function(k, pop){
			if(pop.guid == guid){
				result = pop;
				return false;
			}
		});
		return result;
	};

	/**
	 * 显示确认对话框
	 * @param  title
	 * @param  {String|Object} content
	 * @param  onConfirm
	 * @param  onCancel
	 * @param  {Object} config
	 * @return {Object}
	 */
	Popup.showConfirm = function(title, content, onConfirm, onCancel, config){
		var pop;
		var on_confirm = function(){
			if(onConfirm){
				onConfirm();
			}
			pop.close();
		};
		var on_cancel = function(){
			if(onCancel){
				onCancel();
			}
			pop.close();
		};

		var conf = $.extend({}, {
			title: title||'确认',
			content: content,
			width: 350,
			topCloseBtn: false,
			isModal: true,
			buttons: [
				{name:'确定', handler:on_confirm, setDefault:true},
				{name:'取消', handler:on_cancel}
			]
		}, config);

		pop = new Popup(conf);
		pop.show();
		return pop;
	};

	/**
	 * 显示对话框
	 * @param  title
	 * @param  {String|Object} content
	 * @param  onSubmit
	 * @param  {Object} config
	 * @return {Object}
	 */
	Popup.showAlert = function(title, content, onSubmit, config){
		var pop;
		var on_submit = function(){
			if(onSubmit){
				onSubmit();
			}
			pop.close();
		};
		var conf = $.extend({
			title: title||'提示',
			content: content,
			width: 350,
			topCloseBtn: false,
			isModal: true,
			buttons: [
				{name:'确定', handler:on_submit, setDefault:true}
			]
		}, config);
		pop = new Popup(conf);
		pop.show();
		return pop;
	};

	//!!以下方法仅在iframe里面提供
	var in_sub_win = false;
	try {
		in_sub_win = !!window.frameElement;
	} catch(e){}
	if(in_sub_win){
		/**
		 * 获取当前popup 事件
		 * @param key
		 * @param p1
		 * @param p2
		 */
		Popup.fire = function(key, p1, p2){
			var pop = Popup.getCurrentPopup();
			if(pop){
				pop.fire.apply(pop, arguments);
			}
		};

		/**
		 * 监听自定义事件
		 * @param key
         * @param callback
		 * @return {Boolean}
		 */
		Popup.listen = function(key, callback){
			var pop = Popup.getCurrentPopup();
			if(pop){
				return pop.listen(key, callback);
			}
			return false;
		};

		/**
		 * close all popup
		 * @see Popup#close
		 */
		Popup.closeAll = function(){
			$.each(window[POP_COLLECT_KEY], function(k, pop){
				pop.close();
			});
		};

		/**
		 * resize current popup
		 * @deprecated only take effect in iframe mode
		 */
		Popup.resizeCurrentPopup = function(){
			$(window).on('load', function(){
				var wr = util.getRegion();
				document.body.style.overflow = 'hidden';
				window.frameElement.style.height = wr.documentHeight +'px';
			});
		};

		/**
		 * get current page located popup object
		 * @return mixed
		 */
		Popup.getCurrentPopup = function(){
			var guid = window.frameElement.getAttribute('guid');
			if(guid){
				return parent[POP_COLLECT_KEY][guid];
			}
			return null;
		};

		/**
		 * close current popup
		 * @deprecated only take effect in iframe mode
		 */
		Popup.closeCurrentPopup = function(){
			var curPop = this.getCurrentPopup();
			if(curPop){
				curPop.close();
			}
		};
	}

	/**
	 * 初始化对话框结构
	 */
	var initStructure = function(onload){
		onload = onload || emptyFn;
		if(this.container){
			onload();
			return;
		}
		var id = this.config.ID_PRE + util.guid();

		//构建基础框架
		this.container = $('<div class="'+this.config.cssClass.dialog+'" style="left:-9999px" id="'+id+'"></div>').appendTo($('body'));

		//构建内容容器
		var content = '<div class="'+this.config.cssClass.body+'">';
		if(typeof(this.config.content) == 'string'){
			content += '<p class="'+this.config.cssClass.textCon+'">'+this.config.content+'</p>';
		} else if(this.config.content.src){
			content += '<iframe allowtransparency="true" guid="'+this.guid+'" src="'+this.config.content.src+'" class="'+this.config.cssClass.iframe+'" frameborder=0></iframe>';
		} else if(this.config.content.id){
            content += $(this.config.content.id).html();
        }else{
			content += '<div class="' + this.config.cssClass.container + '"></div>';
		}
		content += '</div>';

		//构建按钮
		var btn_html = '';
		if(this.config.buttons.length > 0){
			btn_html = '<div class="'+this.config.cssClass.foot+'">';
			for(var i=0; i<this.config.buttons.length; i++){
				btn_html += '&nbsp;<a href="javascript:;" class="PopupDialog-btn'+(this.config.buttons[i].setDefault?' PopupDialog-btnDefault':'')+'">'+this.config.buttons[i].name+'</a>';
			}
			btn_html += '</div>';
		}

		var html = ([
			'<div class="PopupDialog-wrap">',
				'<div class="PopupDialog-Modal-Mask" style="position:absolute; height:0; overflow:hidden; z-index:2; background-color:#ccc; width:100%"></div>',
				'<div class="',this.config.cssClass.head+'">',
				'<h3>',this.config.title,'</h3>',
				(this.config.topCloseBtn ? '<span class="PopupDialog-close" tabindex="0" title="关闭窗口">x</span>' : ''),
				'</div>',content,btn_html,
			'</div>'
		]).join('');
		this.container.html(html);

		//source 模式
		if(this.config.content.src){
			$('iframe',this.container).on('load', onload);
		} else {
			onload();
		}
	};

	/**
	 * 更新iframe高度
	 * @scope dialog object
	 * @param iframe
	 * @param height
	 */
	var updateIframeHeight = function(iframe, height){
		try {
			var w = iframe.contentWindow;
			var d = w.document;
			var b = w.document.body;
			w.focus();
		} catch(ex){
			console.log(ex);
			return false;
		}

		height = height || this.config.height;
		if(!height && b){
			b.style.overflow = 'hidden';
			//需要设置body宽度,否则body内内容高度会受到宽度的"挤压",导致计算不正确.
			if(!b.style.width){
				b.style.width = this.config.width+'px';
			}
			var h1 = w.innerHeight || ((d.documentElement && d.documentElement.clientHeight) ? d.documentElement : d.body).clientHeight;
			var tag = (d.documentElement && d.documentElement.scrollHeight) ? d.documentElement : d.body;
			var h2 = tag.scrollHeight;
			$(iframe).css('height', Math.max(h1, h2));
		} else {
			$(iframe).css('height', height);
		}
	};

	/**
	 * get parent window scroll info
	 * @returns {{top: number, left: number}}
	 */
	var getParentScrollInfo = function(){
		var region = {
			top:0,
			left:0
		};
		try {
			if(window.frameElement){
				region.top = parent.document.documentElement.scrollTop || parent.pageYOffset || parent.document.body.scrollTop;
				region.left = $('body', parent.document).scrollLeft();
			}
		} catch(ex){
			console.log(ex);
		}
		return region;
	};

	/**
	 * get parent window region info
	 * @returns {{visibleHeight: number, visibleWidth: number}}
	 */
	var getParentWinRegion = function(){
		var region = {
			visibleHeight: 9999999,
			visibleWidth: 9999999
		};
		try {
			if(window.frameElement) {
				var pr = util.getRegion(parent);
				region.visibleHeight = pr.visibleHeight;
				region.visibleWidth = pr.visibleWidth;
			}
		} catch(ex){
			console.log(ex);
		}
		return region;
	};

	/**
	 * 更新对话框的位置信息
	 */
	var updateDialogRegion= function(){
		var $body = $('body');

		//CALCULATE REG事件N INFO
		var region = $.extend({
			height: this.container.height(),
			width: this.container.width()
		}, this.config);
		region.minHeight = region.minHeight || 78;
		var scroll = {
				top: document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop,
				left: $body.scrollLeft()
			},
			parentScroll = getParentScrollInfo(),
			winRegion = util.getRegion(),
			parentRegion = getParentWinRegion(),
			top = 0,
			left = 0;

		scroll.top += parentScroll.top;
		scroll.left += parentScroll.left;
		winRegion.visibleHeight = Math.min(winRegion.visibleHeight, parentRegion.visibleHeight);
		winRegion.visibleWidth = Math.min(winRegion.visibleWidth, parentRegion.visibleWidth);

		if(winRegion.visibleHeight > region.height){
			top = scroll.top + (winRegion.visibleHeight - region.height)/4;
		} else if(winRegion.documentHeight > region.height){
			top = scroll.top;
		}

		if(winRegion.visibleWidth > region.width){
			left = winRegion.visibleWidth/2 - region.width/2 - scroll.left;
		} else if(winRegion.documentWidth > region.width){
			left = scroll.left;
		}
		var calStyle = {left:left,top:top,zIndex:this.config.zIndex};
		if(this.config.top !== undefined){
			calStyle.top = this.config.top;
		}
		if(this.config.left !== undefined){
			calStyle.left = this.config.left;
		}

		this.container.css(calStyle);

		if(this.config.height){
			$('.'+this.config.cssClass.body, this.container).css('height', this.config.height);
		}
		if(this.config.width){
			this.container.css('width', this.config.width);
		}
	};

	/**
	 * 更新对话框z-index,其中加入了模态对话框机制
	 */
	var updateDialogZIndex = function(){
		var hasOtherModalPanel = false;
		var _this = this;

		$.each(window[POP_COLLECT_KEY], function(guid){
			//有其他的模态对话框
			//调低当前对话框的z-index
			//此动作产生的z-index可能会存在数量瓶颈，或者是与其他样式定义的z-index容器有冲突。
			if(this != _this && this.status && this.config.isModal){
				_this.config.zIndex = this.config.zIndex - 1;
				hasOtherModalPanel = true;
				return false;
			} else if(_this != this && this.status && !this.config.isModal){
				if(this.config.zIndex > _this.config.zIndex){
					_this.config.zIndex = this.config.zIndex + 1;
				} else if(this.config.zIndex == _this.config.zIndex){
					_this.config.zIndex += 1;
				}
			}
		});

		_this.container.css('zIndex', _this.config.zIndex);
		if(hasOtherModalPanel){
			_this.setDisable();
		} else if(_this.config.isModal){
			//设置除了当前模态对话框的其他对话框所有都为disable
			$.each(window[POP_COLLECT_KEY], function(guid){
				if(this != _this && this.status){
					this.setDisable();
				}
			});
			_this.focus();
		} else {
			_this.focus();
		}
	};

	/**
	 * 绑定对话框按钮事件
	 */
	var bindEvent = function(){
		var _this = this;

		$('.PopupDialog-close', this.container).on('click', function(){
			_this.close();
		});

		$('a.PopupDialog-btn',this.container).each(function(i){
			$(this).click(function(){
				var hd = _this.config.buttons[i].handler || function(){_this.close();};
				if(typeof(hd) == 'string'){
					_this.fire(hd, function(fn){fn();});
				} else {
					hd.apply(this, arguments);
				}
			});
		});

		$('a.PopupDialog-btnDefault', this.container).focus();

		this.container.on('mousedown', function(){
			updateZIndex.call(_this);
		});
	};

	/**
	 * update dialog panel z-index property
	 **/
	var updateZIndex = function() {
		var _this = this;
		var hasModalPanel = false;
		$.each(window[POP_COLLECT_KEY], function(k, dialog){
			if(dialog != _this && dialog.status && dialog.config.isModal){
				hasModalPanel = true;
				return false;
			} else if(dialog != _this && dialog.status){
				if(dialog.config.zIndex >= _this.config.zIndex){
					_this.config.zIndex = dialog.config.zIndex + 1;
				}
			}
		});
		if(hasModalPanel){
			return;
		}
		this.container.css('zIndex', this.config.zIndex);
	};

	/**
	 * 绑定对话框移动事件
	 */
	var bindMoveEvent = function(){
		if(!this.config.moveEnable){
			return;
		}
		var _this = this;
		var _lastPoint = {X:0, Y:0};
		var _lastRegion = {top:0, left:0};
		var _moving;
		var letie8 = $.browser.msie && parseInt($.browser.version, 10) <= 8;

		$(document).on('mousemove', function(event){
			if(!_this.container || !_moving || (event.button !== 0 && !letie8)){
				return false;
			}
			var offsetX = parseInt(event.clientX - _lastPoint.X, 10);
			var offsetY = parseInt(event.clientY - _lastPoint.Y, 10);
			var newLeft = Math.max(_lastRegion.left + offsetX,0);
			var newTop = Math.max(_lastRegion.top + offsetY,0);
			_this.container.css({top:newTop,left:newLeft});
		});

		$('body').on('mousedown', function(event){
			if(!_this.container || (event.button !== 0 && !letie8)){
				return;
			}
			var head = _this.config.moveTriggerByContainer ? _this.container : $('.'+_this.config.cssClass.head, _this.container);
			var tag = event.target;
			if($.contains(head[0], tag)){
				_moving = true;
				_lastRegion = {
					left: parseInt(_this.container.css('left'), 10),
					top: parseInt(_this.container.css('top'), 10)
				};
				_lastPoint = {X: event.clientX, Y: event.clientY};
				return false;
			}
		});

		$(document).on('mouseup', function(){
			_moving = false;
		});
	};

	/**
	 * 绑定 ESC 关闭事件
	 * 注意，所有的对话框只绑定一次ESC事件
	 */
	var ESC_BINDED;
	var bindEscCloseEvent = function(){
		if(ESC_BINDED){
			return;
		}
		ESC_BINDED = true;

		$(document).on('keyup',function(event){
			if(event.keyCode == 27){
				var lastDialog = null;
				$.each(window[POP_COLLECT_KEY], function(k, dialog){
					if(dialog.config.isModal && dialog.status && dialog.config.topCloseBtn){
						lastDialog = dialog;
						return false;
					} else if(dialog.status && dialog.config.topCloseBtn){
						if(!lastDialog || lastDialog.config.zIndex <= dialog.config.zIndex){
							lastDialog = dialog;
						}
					}
				});
				if(lastDialog){
					lastDialog.close();
				}
			}
		});
	};

	return Popup;
});
