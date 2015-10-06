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

	var MSG_CONTAINER = null;

	/**
	 * Show message
	 * @param arg1
	 * @param type
	 * @param time
	 * @param closeCallback
	 */
	var Msg = function(arg1, type, time, closeCallback){
		this.guid = '_tip_'+util.guid();
		this.container = MSG_CONTAINER;
		var cfg = arg1;
		if(typeof(arg1) == 'string'){
			cfg = {
				'msg': arg1,
				'type': type || 'tip',
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
			var _this = this;
			if(this.config.time){
				var call = 'var a = document.getElementById("'+this.guid+'"); if(a){a.style.display = "none";}';
				top_win.setTimeout(call, this.config.time);
			}
		}
	};

	/**
	 * show message
	 */
	Msg.prototype.show = function(){
		if(!this.container){
			this.container = MSG_CONTAINER = $('<div class="ywj-msg-container-wrap"></div>').appendTo($('body', top_doc));
		}
		this.container.attr('id', this.guid);
		var html = ([
			'<span class="ywj-msg-container">',
			'<span class="ywj-msg-icon-',this.config.type,'"><i></i></span>',
			'<span class="ywj-msg-content">',this.config.msg,'</span>',
			'</div>'
		]).join('');

		//ie6 位置修正
		if($.browser.ie6Compat){
			var viewP = util.getRegion(top_win);
			this.container.setStyle('top',viewP.visibleHeight /2 + viewP.verticalScroll);
		}
		this.container.html(html);
		this.container.show();
	};

	/**
	 * hide message
	 */
	Msg.prototype.hide = function(){
		if(this.container){
			this.container.hide();
			this.config.callback && this.config.callback(this);
		}
	};

	/**
	 * hide message
	 */
	Msg.hide = function(){
		if(MSG_CONTAINER){
			MSG_CONTAINER.hide();
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
	 * destroy message container
	 */
	Msg.prototype.destroy = function(){
		this.container.remove();
	};

	if(!top_win['__YWJ_MSG__']){
		top_win['__YWJ_MSG__'] = Msg;
	}
	return Msg;
});