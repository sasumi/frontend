define('ywj/toast', function(require){
	var $ = require('jquery');
	var util = require('ywj/util');
	var toast_css_url = seajs.resolve('ywj/resource/toast.css');
	var top_doc;
	var top_win;

	try {
		top_doc = parent.document;
		top_win = parent;
	} catch(ex){}
	top_doc = top_doc || document;
	top_win = top_win || window;

	//暂未提供非同域的情况处理逻辑
	$('head', top_doc).append('<link rel="stylesheet" type="text/css" href="'+toast_css_url+'"/>');

	//多窗口适配
	if(top_win['__YWJ_TOAST__']){
		return top_win['__YWJ_TOAST__'];
	}

	var $WRAPPER;
	var TOAST_COLLECTION = [];

	var remove_in_collection = function(toast){
		var c = [];
		for(var i=0; i<TOAST_COLLECTION.length; i++){
			if(TOAST_COLLECTION[i].guid != toast.guid){
				c.push(TOAST_COLLECTION[i]);
			} else {
				toast.destroy();
			}
		}
		TOAST_COLLECTION = c;
		if(!TOAST_COLLECTION.length){
			$WRAPPER.hide();
		}
	};

	/**
	 * Show message
	 * @param arg1
	 * @param type
	 * @param time
	 * @param closeCallback
	 */
	var Toast = function(arg1, type, time, closeCallback){
		TOAST_COLLECTION.push(this);
		this.guid = '_tip_'+util.guid();
		this.container = null;
		var cfg = arg1;
		if(typeof(arg1) == 'string'){
			cfg = {
				'toast': arg1,
				'type': type,
				'time': (time > 0 ? time*1000 : 2000)
			};
		}
		//extend default message config
		this.config = $.extend({
			'toast': '',
			'type': 0,
			'time': 2000,
			'auto': true,
			'callback': closeCallback
		}, cfg);

		//auto
		if(this.config.auto){
			this.show();
		}
	};

	/**
	 * show message
	 */
	Toast.prototype.show = function(){
		if(!$WRAPPER){
			$WRAPPER = $('<div class="ywj-toast-container-wrap"></div>').appendTo($('body', top_doc));
		}

		$WRAPPER.show();
		this.container = $(
			'<div class="ywj-toast-container" id="'+this.guid+'" style="display:none">'+
				(this.config.type ? '<span class="ywj-toast-icon-'+this.config.type+'"><i></i></span>' : '')+
				'<span class="ywj-toast-content">'+this.config.toast+'</span>'+
			'</div>').appendTo($WRAPPER);
		$('<div></div>').appendTo($WRAPPER);

		this.container.show();
		var _this = this;
		setTimeout(function(){
			_this.container.addClass('ywj-toast-ani-in');
		}, 10);

		if(this.config.time && this.config.auto){
			setTimeout(function(){
				_this.hide();
			}, this.config.time);
		}
	};

	/**
	 * hide message
	 */
	Toast.prototype.hide = function(){
		if(this.container){
			this.container.addClass('ywj-toast-ani-out');
			var _this = this;
			setTimeout(function(){
				_this.container.hide();
				remove_in_collection(_this);
			}, 1000);
			this.config.callback && this.config.callback(this);
		}
	};

	/**
	 * destroy message container
	 */
	Toast.prototype.destroy = function(){
		this.container.remove();
	};

	/**
	 * hide message
	 */
	Toast.hide = function(){
		for(var i=0; i<TOAST_COLLECTION.length; i++){
			TOAST_COLLECTION[i].hide();
		}
	};

	/**
	 * shortcut method
	 * @param arg1
	 * @param type
	 * @param time
	 * @returns {Toast}
	 */
	Toast.show = function(arg1, type, time){
		return new Toast(arg1, type, time);
	};

	/**
	 * show success message
	 * @param toast
	 * @param time
	 * @returns {Toast}
	 */
	Toast.showSuccess = function(toast, time){
		return new Toast(toast, 'succ', time);
	};

	/**
	 * show error message
	 * @param toast
	 * @param time
	 * @returns {Toast}
	 */
	Toast.showError = function(toast, time){
		return new Toast(toast, 'err', time);
	};

	/**
	 * show info message
	 * @param toast
	 * @param time
	 * @returns {Toast}
	 */
	Toast.showInfo = function(toast, time){
		return new Toast(toast, 'info', time);
	};

	/**
	 * show loading message
	 * @param toast
	 * @param time
     * @returns {Toast}
	 */
	Toast.showLoading = function(toast, time){
		return new Toast(toast, 'load', time);
	};

	Toast.nodeClick = function(){
		var toast = $(this).data('toast') || $(this).attr('title');
		if(toast){
			Toast.show(toast, 'info');
		}
	};

	if(!top_win['__YWJ_TOAST__']){
		top_win['__YWJ_TOAST__'] = Toast;
	}
	return Toast;
});