/**
 * Created by sasumi on 3/12/2014.
 */
define('ywj/popup', function(require){
	require('ywj/resource/popup.css?2018');
	var $ = require('jquery');
	var Util = require('ywj/util');
	var masker = require('ywj/masker');
	var Msg = require('ywj/msg');
	var Net = require('ywj/net');
	var POP_COLLECT_KEY = '__POPUP_COLLECTION__';
	var YWJ_WIDGET_POPUP = 'YWJ_WIDGET_POPUP';
	var BTN_LOADING_CLASS = 'btn-loading';
	var POPUP_SHOW_CLASS = 'PopupDialog-Ani-show';
	var DEF_POPUP_WIDTH = 600;
	var KEY_ESC = 27;

	var STATUS_HIDE = 0;
	var STATUS_SHOW = 1;

	var lang = require('lang/$G_LANGUAGE');
	var emptyFn = function(){};
	var console = window['console'] || {
			log: emptyFn,
			info: emptyFn,
			error: emptyFn
		};

	window['POPUP_COMPONENT_FLAG'] = true;
	window[POP_COLLECT_KEY] = [];

	var IS_ON_SHOW_CALL_STACK = [];
	var on_show_loop_check = function(pop){
		if(pop.status == STATUS_SHOW && IS_ON_SHOW_CALL_STACK.length){
			$.each(IS_ON_SHOW_CALL_STACK, function(k, v){
				v();
			});
			IS_ON_SHOW_CALL_STACK = [];
		}
	};

	/**
	 * Popup class
	 * @constructor Popup
	 * @description popup dialog class
	 * @example new Popup(config);
	 * @param {Object} config
	 */
	var Popup = function(config){
		var _this = this;
		this.container = null;
		this.status = STATUS_HIDE;
		this._eventBinded = false;

		this._events = {};
		this._eventParams = {};

		this.guid = Util.guid();
		this.onShow = emptyFn;
		this.onClose = emptyFn;
		this.isOnShow = function(callback){
			IS_ON_SHOW_CALL_STACK.push(callback);
			on_show_loop_check(_this);
		};

		this.config = $.extend({}, {
			ID_PRE: 'popup-dialog-id-pre',
			title: lang('对话框'),				//标题
			content: lang('测试'),				//content.src content.id
			width: 400,						//宽度
			moveEnable: undefined,				//框体可移动
			moveTriggerByContainer: false,	//内容可触发移动
			zIndex: 1000,					//高度
			modal: true,					//模态对话框
			topCloseBtn: true,				//是否显示顶部关闭按钮,如果显示顶部关闭按钮，则支持ESC关闭窗口行为
			topRefreshBtn: false,           //是否显示顶部刷新按钮
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
		window[POP_COLLECT_KEY].push(this);
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

			//animate
			_this.container.addClass(POPUP_SHOW_CLASS);
			_this.status = STATUS_SHOW;

			_this.onShow();
			on_show_loop_check(_this);
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
	 * 更新对话框宽度
	 * @param width
	 */
	Popup.prototype.updateWidth = function(width){
		var _width = this.container.width();
		var _left = this.container.offset().left;
		var new_left = _left + (_width - width) / 2;
		this.container.css({
			width: width,
			left: new_left
		});
	};

	/**
	 * 聚焦到当前对话框第一个按钮
	 */
	Popup.prototype.focus = function() {
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
		$('.PopupDialog-Modal-Mask', this.container).css({height: this.container.height(), opacity:0.4, display:'block'});
	};

	/**
	 * refresh dialog
	 */
	Popup.prototype.refresh = function(){
		if(this.config.content.src){
			this.container.find('iframe').attr('src', this.config.content.src);
		}
	};

	/**
	 * close current popup
	 */
	Popup.prototype.close = function(){
		if(this.onClose() === false){
			return false;
		}
		var _this = this;

		//处理对话框隐藏效果
		this.container.removeClass(POPUP_SHOW_CLASS);
		this.container.hide();
		this.status = 0;

		var Collections = window[POP_COLLECT_KEY];

		//remove this dialog
		if(!_this.config.keepWhileHide){
			var tmp = [];
			$.each(Collections, function(k, pop){
				if(pop.guid != _this.guid){
					tmp.push(pop);
				}
			});
			Collections = tmp;
			_this.container.remove();
			_this.container = null;
		}

		//remove other dialog
		var last_max_zIndex = -1;
		var last_top_pop = null;
		for(var i=Collections.length-1; i>=0; i--){
			var pop = Collections[i];
			if(pop.config.zIndex > last_max_zIndex){
				last_top_pop = pop;
				last_max_zIndex = pop.config.zIndex;
			}
		}
		if(last_top_pop){
			last_top_pop.setEnable();
			last_top_pop.focus();
		} else {
			masker.hide();
		}

		//reset collection
		window[POP_COLLECT_KEY] = Collections;
		return true;
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
	 * auto resize(height)
	 * @param interval
	 */
	Popup.prototype.autoResize = function(interval){
		var popHeight = 0;
		var _this = this;
		var loop = function(){
			try {
				var fr = $('iframe', _this.container)[0];
				var w = fr.contentWindow;
				var b = w.document.body;
				var currentHeight = parseInt($(b).outerHeight());
				if (currentHeight != popHeight) {
					popHeight = currentHeight;
					_this.updateHeight(currentHeight+10);
				}
			} catch(ex){
				console.warn('Popup auto resize exception', ex);
				return false;
			}
			setTimeout(loop, interval);
		};
		setTimeout(loop, interval);
	};

	/**
	 * 触发事件
	 * @param key
	 */
	Popup.prototype.fire = function(key){
		var _this = this;
		var args = Util.toArray(arguments).slice(1);
		this._eventParams[key] = args;
		var result = [];
		if(this._events[key]){
			$.each(this._events[key], function(k, fn){
				result.push(fn.apply(_this, args));
			});
		}
		return result;
	};

	/**
	 * search popup by guid
	 * @param  guid
	 * @return {Popup}
	 */
	Popup.getPopupByGuid = function(guid){
		var result = null;
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
			var confirm_result = onConfirm ? onConfirm() : true;
			if(confirm_result !== false){
				pop.close();
			}
		};
		var on_cancel = function(){
			var cancel_result = onCancel ? onCancel() : true;
			if(cancel_result !== false){
				pop.close();
			}
		};

		config = config || {};
		if(config.with_icon && Util.isString(content)){
			content = '<div class="PopupDialog-confirm-text">'+Util.htmlEscape(content)+'</div>';
		}

		var conf = $.extend({}, {
			title: title||lang('确认'),
			content: content,
			width: 350,
			with_icon: false,
			topCloseBtn: false,
			modal: true,
			buttons: [
				{name:lang('确认'), handler:on_confirm, setDefault:true},
				{name:lang('取消'), handler:on_cancel}
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
			var submit_result = onSubmit ? onSubmit() : true;
			if(submit_result !== false){
				pop.close();
			}
		};

		config = config || {};
		if(config.with_icon && Util.isString(content)){
			content = '<div class="PopupDialog-confirm-text">'+Util.htmlEscape(content)+'</div>';
		}

		var conf = $.extend({
			title: title||lang('提示'),
			content: content,
			width: 350,
			topCloseBtn: false,
			modal: true,
			buttons: [
				{name:lang('确定'), handler:on_submit, setDefault:true}
			]
		}, config);
		pop = new Popup(conf);
		pop.show();
		return pop;
	};

	/**
	 * get top popup class
	 * @param callback
	 */
	Popup.getTopPopupClass = function(callback){
		var win = window;
		var pop_in_parent = false;
		try {
			while(win != win.parent && win.parent['POPUP_COMPONENT_FLAG']){
				win = win.parent;
				pop_in_parent = true;
			}
		} catch(Ex){
			console.info(Ex);
		}

		if(pop_in_parent){
			win.seajs.use('ywj/popup', callback);
		} else {
			callback(Popup);
		}
	};

	/**
	 * 在顶部窗口实例化popup并显示
	 * @param conf
	 * @param callback
	 */
	Popup.showPopInTop = function(conf, callback){
		callback = callback || function(){};
		conf.modal = conf.modal === undefined ? true : !!conf.modal;
		Popup.getTopPopupClass(function(Pop){
			var p = new Pop(conf);
			callback(p); //优先绑定callback，否则会出现onShow绑定失败
			p.show();
		});
	};

	Popup.nodeClick = function($node, param){
		var POPUP_ON_LOADING = 'data-popup-on-loading-flag';
		var RET = $node[0].tagName == 'A' ? false : null;
		if($node.attr(POPUP_ON_LOADING) == 1){
			return RET;
		}
		if($node.hasClass('btn')){
			$node.addClass(BTN_LOADING_CLASS);
		}
		$node.attr(POPUP_ON_LOADING, 1);
		var src = Net.mergeCgiUri($node.attr('href') || $node.data('href'), {'ref':'iframe'});
		var width = parseFloat($node.data('width')) || DEF_POPUP_WIDTH;
		var height = parseFloat($node.data('height')) || 0;
		var title = $node.attr('title') || $node.html() || $node.data('title') || $node.val() || '';
		var force_refresh = param['forcerefresh'];
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

		var conf = Util.cloneConfigCaseInsensitive({
			title: title,
			content: {src:src},
			width: width,
			moveEnable: undefined,
			topCloseBtn: true,
			topRefreshBtn: false,
			buttons: []
		}, param);

		if(height){
			conf.height = height;
		}

		Popup.showPopInTop(conf, function(p){
			p.onShow = function(){
				Msg.hide();
				$node.attr(POPUP_ON_LOADING, 0).removeClass(BTN_LOADING_CLASS);
			};
			if(force_refresh){
				p.onClose = function(){
					location.reload();
				}
			}
			p.listen('onSuccess', function(){return onSuccess.apply($node, Util.toArray(arguments));});
			p.listen('onError', onError);
		});
		return RET;
	};

	//!!以下方法仅在iframe里面提供
	var in_sub_win = false;
	try {
		in_sub_win = !!window.frameElement;
	} catch(e){}

	/**
	 * 获取当前popup 事件
	 * @param key
	 * @param p1
	 * @param p2
	 */
	Popup.fire = function(key, p1, p2){
		if(!in_sub_win){
			console.warn('No in sub window');
			return;
		}
		var pop = Popup.getCurrentPopup();
		return pop.fire.apply(pop, arguments);
	};

	/**
	 * 监听自定义事件
	 * @param key
	 * @param callback
	 * @return {Boolean}
	 */
	Popup.listen = function(key, callback){
		if(!in_sub_win){
			console.warn('No in sub window');
			return;
		}
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
		if(!in_sub_win){
			console.warn('No in sub window');
			return;
		}
		$.each(window[POP_COLLECT_KEY], function(k, pop){
			pop.close();
		});
	};

	/**
	 * resize current popup
	 * @deprecated only take effect in iframe mode
	 */
	Popup.resizeCurrentPopup = function(){
		if(!in_sub_win){
			console.warn('No in sub window');
			return;
		}
		$(window).on('load', function(){
			var wr = Util.getRegion();
			document.body.style.overflow = 'hidden';
			window.frameElement.style.height = wr.documentHeight +'px';
		});
	};

	/**
	 * auto resize current popup
	 * @param interval
	 */
	Popup.autoResizeCurrentPopup = function(interval){
		if(!in_sub_win){
			console.warn('No in sub window');
			return;
		}
		interval = interval || 50;
		var pop = Popup.getCurrentPopup();
		pop.autoResize(interval);
	};

	/**
	 * get current page located popup object
	 * @return mixed
	 */
	Popup.getCurrentPopup = function(){
		if(!in_sub_win){
			console.warn('No in sub window');
			return null;
		}
		var guid = window.frameElement.getAttribute('guid');
		if(guid){
			for(var i=0; i<parent[POP_COLLECT_KEY].length; i++){
				if(parent[POP_COLLECT_KEY][i].guid == guid){
					return parent[POP_COLLECT_KEY][i];
				}
			}
		}
		return null;
	};

	/**
	 * close current popup
	 * @return bool 是否成功关闭
	 */
	Popup.closeCurrentPopup = function(){
		if(!in_sub_win){
			console.warn('No in sub window');
			return false;
		}
		var curPop = this.getCurrentPopup();
		if(curPop){
			return curPop.close();
		}
		return true;
	};

	/**
	 * 初始化对话框结构
	 */
	var initStructure = function(onload){
		onload = onload || emptyFn;
		if(this.container){
			onload();
			return;
		}
		var id = this.config.ID_PRE + Util.guid();

		//构建基础框架
		this.container = $('<div class="'+this.config.cssClass.dialog+'" style="left:-9999px" id="'+id+'"></div>').appendTo($('body'));

		//构建内容容器
		var content = '<div class="'+this.config.cssClass.body+'">';
		if(typeof(this.config.content) == 'string'){
			content += '<div class="'+this.config.cssClass.textCon+'">'+this.config.content+'</div>';
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
				'<div class="PopupDialog-hd-op">',
					((this.config.topRefreshBtn && this.config.content.src) ? '<span class="PopupDialog-refresh" title="refresh" tabindex="0"></span>' : ''),
					(this.config.topCloseBtn ? '<span class="PopupDialog-close" tabindex="0" title="关闭">&times;</span>' : ''),
				'</div>',
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
			return false;
		}

		height = height || this.config.height;
		if(!height && b){
			b.style.overflow = 'hidden';
			//需要设置body宽度,否则body内内容高度会受到宽度的"挤压",导致计算不正确.
			if(!b.style.width){
				b.style.width = this.config.width+'px';
			}
			b.style.minWidth = b.style.width;
			var h1 = w.innerHeight || ((d.documentElement && d.documentElement.clientHeight) ? d.documentElement : d.body).clientHeight;
			var tag = (d.documentElement && d.documentElement.scrollHeight) ? d.documentElement : d.body;
			var h2 = tag.scrollHeight;
			$(iframe).css('height', Math.max(h1, h2));
		} else {
			$(iframe).css('height', height);
		}
		return true;
	};

	/**
	 * get parent window scroll info
	 * @returns {{top: number, left: number}}
	 */
	var getParentScrollInfo = function(){
		return {
			top:0,
			left:0
		};
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
				var pr = Util.getRegion(parent);
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
			winRegion = Util.getRegion(),
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

		$.each(window[POP_COLLECT_KEY], function(k, pop){
			if(pop.config.modal && pop.status == STATUS_SHOW && _this != pop){
				hasOtherModalPanel = true;
			}
			if(_this.config.modal){
				_this.config.zIndex = Math.max(_this.config.zIndex, pop.config.zIndex+1);
			} else {
				_this.config.zIndex = Math.max(_this.config.zIndex, pop.config.zIndex);
			}
		});

		_this.container.css('zIndex', _this.config.zIndex);

		if(hasOtherModalPanel && !_this.config.modal){
			_this.setDisable();
		} else {
			//设置除了当前模态对话框的其他对话框所有都为disable
			$.each(window[POP_COLLECT_KEY], function(k, pop){
				if(pop != _this && pop.status == STATUS_SHOW){
					pop.setDisable();
				}
			});
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

		$('.PopupDialog-refresh', this.container).on('click', function(){
			_this.refresh();
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
			if(dialog != _this && dialog.status == STATUS_SHOW && dialog.config.modal){
				hasModalPanel = true;
				return false;
			} else if(dialog != _this && dialog.status == STATUS_SHOW){
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
		//如果对象配置中未设置可移动，则检测全局是否配置，如果全局未配置，默认为可移动。
		var move_enable = this.config.moveEnable !== undefined ? !!this.config.moveEnable : (Popup.moveEnable === undefined ? true : !!Popup.moveEnable);
		if(!move_enable){
			return;
		}

		var _this = this;
		var _lastPoint = {X:0, Y:0};
		var _lastRegion = {top:0, left:0};
		var _moving;
		var ie8 = $.browser.msie && parseInt($.browser.version, 10) <= 8;

		//upd css
		_this.container.find('.'+_this.config.cssClass.head).css('cursor', 'move');

		$(document).on('mousemove', function(event){
			if(!_this.container || !_moving || (event.button !== 0 && !ie8)){
				return;
			}
			var offsetX = parseInt(event.clientX - _lastPoint.X, 10);
			var offsetY = parseInt(event.clientY - _lastPoint.Y, 10);
			var newLeft = Math.max(_lastRegion.left + offsetX,0);
			var newTop = Math.max(_lastRegion.top + offsetY,0);
			_this.container.css({top:newTop,left:newLeft});
		});

		$('body').on('mousedown', function(event){
			if(!_this.container || (event.button !== 0 && !ie8)){
				return;
			}
			var $head = _this.config.moveTriggerByContainer ? _this.container : $('.'+_this.config.cssClass.head, _this.container);
			var tag = event.target;
			if($.contains($head[0], tag) || $head[0] == tag){
				_moving = true;
				_lastRegion = {
					left: parseInt(_this.container.css('left'), 10),
					top: parseInt(_this.container.css('top'), 10)
				};
				_lastPoint = {X: event.clientX, Y: event.clientY};
				return false;
			} else {
				_moving = false;
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
	var ESC_BIND;
	var bindEscCloseEvent = function(){
		var close = function(){
			var lastDialog = null;
			$.each(window[POP_COLLECT_KEY], function(k, dialog){
				if(dialog.config.modal && dialog.status == STATUS_SHOW && dialog.config.topCloseBtn){
					lastDialog = dialog;
					return false;
				} else if(dialog.status == STATUS_SHOW && dialog.config.topCloseBtn){
					if(!lastDialog || lastDialog.config.zIndex <= dialog.config.zIndex){
						lastDialog = dialog;
					}
				}
			});
			if(lastDialog){
				lastDialog.close();
			}
		};

		//绑定内部close事件
		if(this.config.topCloseBtn){
			var $iframe = $(this.container.find('iframe'));
			if($iframe.size()){
				try {
					var _this = this;
					$iframe.load(function(){
						var d = this.contentDocument;
						if(d){
							$('.PopupDialog-close', _this.container).attr('title', lang("关闭(ESC)"));
							$(d).keyup(function(e){
								if(e.keyCode == KEY_ESC){
									close();
								}
							});
						}
					});
					var d = $iframe[0].contentDocument;
					if(d){
						$('.PopupDialog-close', _this.container).attr('title', lang("关闭(ESC)"));
						$(d).keyup(function(e){
							if(e.keyCode == KEY_ESC){
								close();
							}
						});
					}
				} catch(e){
					console.error(e);
				}
			}
		}
		if(ESC_BIND){
			return;
		}
		ESC_BIND = true;

		$(document.body).keyup(function(event){
			if(event.keyCode == KEY_ESC){
				close();
			}
		});
	};
	return Popup;
});