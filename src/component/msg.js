define('ywj/msg', function(require){
	var $ = require('jquery');
	var util = require('ywj/util');
	var msg_css_url = seajs.resolve('ywj/resource/msg.css');
	var top_doc;
	var top_win;

	try {
		top_doc = parent.document;
		top_win = parent;
	} catch(ex){}
	top_doc = top_doc || document;
	top_win = top_win || window;

	//暂未提供非同域的情况处理逻辑
	$('head', top_doc).append('<link rel="stylesheet" type="text/css" href="'+msg_css_url+'"/>');

	//多窗口适配
	if(top_win['__YWJ_MSG__']){
		return top_win['__YWJ_MSG__'];
	}

	var $WRAPPER;
	var MSG_COLLECTION = [];

	var remove_in_collection = function(msg){
		var c = [];
		for(var i=0; i<MSG_COLLECTION.length; i++){
			if(MSG_COLLECTION[i].guid != msg.guid){
				c.push(MSG_COLLECTION[i]);
			} else {
				msg.destroy();
			}
		}
		MSG_COLLECTION = c;
		if(!MSG_COLLECTION.length){
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
	var Msg = function(arg1, type, time, closeCallback){
		MSG_COLLECTION.push(this);
		this.guid = '_tip_'+util.guid();
		this.container = null;
		var cfg = arg1;
		if(typeof(arg1) == 'string'){
			cfg = {
				'msg': arg1,
				'type': type || 'info',
				'time': (time > 0 ? time*1000 : 2000)
			};
		}
		//extend default message config
		this.config = $.extend({
			'msg': '',
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
	Msg.prototype.show = function(){
		if(!$WRAPPER){
			$WRAPPER = $('<div class="ywj-msg-container-wrap"></div>').appendTo($('body', top_doc));
		}

		$WRAPPER.show();
		this.container = $(
			'<div class="ywj-msg-container" id="'+this.guid+'" style="display:none">'+
				'<span class="ywj-msg-icon-'+this.config.type+'"><i></i></span>'+
				'<span class="ywj-msg-content">'+this.config.msg+'</span>'+
			'</div>').appendTo($WRAPPER);
		$('<div></div>').appendTo($WRAPPER);

		this.container.show();
		var _this = this;
		setTimeout(function(){
			_this.container.addClass('ywj-msg-ani-in');
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
	Msg.prototype.hide = function(){
		if(this.container){
			this.container.addClass('ywj-msg-ani-out');
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
	Msg.prototype.destroy = function(){
		this.container.remove();
	};

	/**
	 * hide message
	 */
	Msg.hide = function(){
		for(var i=0; i<MSG_COLLECTION.length; i++){
			MSG_COLLECTION[i].hide();
		}
	};

	/**
	 * shortcut method
	 * @param arg1
	 * @param type
	 * @param time
	 * @returns {Msg}
	 */
	Msg.show = function(arg1, type, time){
		return new Msg(arg1, type, time);
	};

	/**
	 * show success message
	 * @param msg
	 * @param time
	 * @returns {Msg}
	 */
	Msg.showSuccess = function(msg, time){
		return new Msg(msg, 'succ', time);
	};

	/**
	 * show error message
	 * @param msg
	 * @param time
	 * @returns {Msg}
	 */
	Msg.showError = function(msg, time){
		return new Msg(msg, 'err', time);
	};

	/**
	 * show info message
	 * @param msg
	 * @param time
	 * @returns {Msg}
	 */
	Msg.showInfo = function(msg, time){
		return new Msg(msg, 'info', time);
	};

	/**
	 * show loading message
	 * @param msg
	 * @param time
     * @returns {Msg}
	 */
	Msg.showLoading = function(msg, time){
		return new Msg(msg, 'load', time);
	};

	Msg.nodeClick = function($node, param){
		var msg = param.content || $node.data('msg') || $(this).attr('title');
		if(msg){
			Msg.show(msg, 'info');
		}
	};

	if(!top_win['__YWJ_MSG__']){
		top_win['__YWJ_MSG__'] = Msg;
	}
	return Msg;
});