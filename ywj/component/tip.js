define('ywj/tip', function(require){
	require('ywj/resource/tip.css');
	var $ = require('jquery');
	var Util = require('ywj/util');
	var Net = require('ywj/net');
	var Hooker = require('ywj/hooker');
	var OBJ_COLLECTION = {};
	var PRIVATE_VARS = {};
	var GUID_BIND_KEY = 'ywj-com-tip-guid';
	var TRY_DIR_MAP = [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	var KEY_ESC = 27;

	/**
	 * 绑定事件
	 */
	var bindEvent = function(){
		if(PRIVATE_VARS[this.guid].opt.closeBtn){
			var btn = $('.ywj-tip-close', this.getDom());
			var _this = this;
			btn.click(function(){
				_this.hide();
			});
			$('body').keyup(function(e){
				if(e.keyCode == KEY_ESC){
					_this.hide();
				}
			});
		}
	};

	/**
	 * 自动计算方位
	 * @returns {number}
	 */
	var calDir = function(){
		var $body = $('body');
		var container = this.getDom();
		var width = container.outerWidth();
		var height = container.outerHeight();
		var px = this.rel_tag.offset().left;
		var py = this.rel_tag.offset().top;
		var rh = this.rel_tag.outerHeight();
		var rw = this.rel_tag.outerWidth();

		var scroll_left = $body.scrollLeft();
		var scroll_top = $body.scrollTop();

		var viewRegion = Util.getRegion();

		for(var i=0; i<TRY_DIR_MAP.length; i++){
			var dir_offset = getDirOffset(TRY_DIR_MAP[i], width, height, rh, rw);
			var rect = {
				left:px+dir_offset[0],
				top:py+dir_offset[1],
				width: width,
				height: height
			};
			var layout_rect = {
				left:scroll_left,
				top:scroll_top,
				width: viewRegion.visibleWidth,
				height: viewRegion.visibleHeight
			};
			if(Util.rectInLayout(rect, layout_rect)){
				return TRY_DIR_MAP[i];
			}
		}
		console.warn('no dir hit, use default:', 11);
		return 11;
	};

	/**
	 * 方位偏移
	 * @param dir
	 * @param width
	 * @param height
	 * @param rh
	 * @param rw
	 * @returns {*}
	 */
	var getDirOffset = function(dir, width, height, rh, rw){
		var offset = {
			11: [-width*0.25+rw/2, rh],
			0: [-width*0.5+rw/2, rh],
			1: [-width*0.75+rw/2, rh],
			2: [-width, -height*0.25+rh/2],
			3: [-width, -height*0.5+rh/2],
			4: [-width, -height*0.75+rh/2],
			5: [-width*0.75+rw/2, -height],
			6: [-width*0.5+rw/2, -height],
			7: [-width*0.25+rw/2, -height],
			8: [rw, -height*0.75 + rh/2],
			9: [rw, -height*0.5 + rh/2],
			10: [rw, -height*0.25 + rh/2]
		};
		return offset[dir];
	};

	/**
	 * 更新位置信息
	 */
	var updatePosition = function(){
		var vars = PRIVATE_VARS[this.guid];
		var dir = vars.opt.dir;
		var container = this.getDom();
		var width = container.outerWidth();
		var height = container.outerHeight();
		var px = this.rel_tag.offset().left;
		var py = this.rel_tag.offset().top;
		var rh = this.rel_tag.outerHeight();
		var rw = this.rel_tag.outerWidth();

		if(dir == 'auto'){
			dir = calDir.call(this);
		}
		container.attr('class', 'ywj-tip-container-wrap ywj-tip-'+dir);
		var offset = getDirOffset(dir, width, height, rh, rw);
		var x = px + offset[0];
		var y = py + offset[1];

		container.css({
			left: parseInt(x,10),
			top: parseInt(y,10)
		});
	};

	/**
	 * TIP组件
	 * @param content
	 * @param rel_tag
     * @param opt
	 * @constructor
	 */
	var Tip = function(content, rel_tag, opt){
		this.guid = Util.guid();
		this.rel_tag = $(rel_tag);
		this.onShow = Hooker(true);
		this.onHide = Hooker(true);
		this.onDestory = Hooker(true);
		PRIVATE_VARS[this.guid] = {};

		opt = $.extend({
			closeBtn: false, //是否显示关闭按钮
			timeout: 0,
			width: 'auto',
			dir: 'auto'
		}, opt || {});
		console.log(opt.width);
		var html =
			'<div class="ywj-tip-container-wrap" style="display:none; width:'+opt.width+'px;">'+
				'<s class="ywj-tip-arrow ywj-tip-arrow-pt"></s>'+
				'<s class="ywj-tip-arrow ywj-tip-arrow-bg"></s>'+
				(opt.closeBtn ? '<span class="ywj-tip-close">&#10005;</span>' : '')+
				'<div class="ywj-tip-content" style="max-width:'+opt.width+'px;">'+content+'</div>'+
			'</div>';

		PRIVATE_VARS[this.guid].opt = opt;
		PRIVATE_VARS[this.guid].container = $(html).appendTo($('body'));
		OBJ_COLLECTION[this.guid] = this;
		bindEvent.call(this);
	};

	Tip.prototype.getDom = function(){
		var vars = PRIVATE_VARS[this.guid];
		return vars.container;
	};

	Tip.prototype.updateContent = function(html){
		this.getDom().find('.ywj-tip-content').html(html);
		updatePosition.call(this);
	};

	Tip.prototype.show = function(){
		var vars = PRIVATE_VARS[this.guid];
		var _this = this;
		this.getDom().show().stop().animate({opacity:1}, 'fast');
		updatePosition.call(this);
		this.onShow.fire(this);
		if(vars.opt.timeout){
			setTimeout(function(){
				_this.hide();
			}, vars.opt.timeout);
		}
	};

	Tip.prototype.hide = function(){
		var _this = this;
		this.getDom().stop().animate({opacity:0}, 'fast', function(){_this.getDom().hide()});
		this.onHide.fire(this);
	};

	Tip.prototype.destroy = function(){
		this.getDom().remove();
		this.onDestory.fire(this);
	};

	Tip.show = function(content, rel_tag, opt){
		var tip = new Tip(content, rel_tag, opt);
		tip.show();
		return tip;
	};

	/**
	 * 简单节点绑定
	 * @param content
	 * @param rel_tag
	 * @param opt
	 * @returns {*}
	 */
	Tip.bind = function(content, rel_tag, opt){
		var guid = $(rel_tag).data(GUID_BIND_KEY);
		var obj = OBJ_COLLECTION[guid];
		if(!obj){
			var tm;
			var hide = function(){
				tm = setTimeout(function(){
					obj && obj.hide();
				}, 10);
			};

			var show = function(){
				clearTimeout(tm);
				obj.show();
			};

			obj = new Tip(content, rel_tag, opt);
			$(rel_tag).data(GUID_BIND_KEY, obj.guid);
			obj.getDom().hover(show, hide);
			$(rel_tag).hover(show, hide);
		}
		return obj;
	};

	/***
	 * 绑定异步处理函数
	 * @param rel_tag
	 * @param opt
	 * @param loader
	 */
	Tip.bindAsync = function(rel_tag, loader, opt){
		var guid = $(rel_tag).data(GUID_BIND_KEY);
		var obj = OBJ_COLLECTION[guid];
		if(!obj){
			var loading = false;
			obj = Tip.bind('loading...', rel_tag, opt);
			obj.onShow(function(){
				if(!loading){
					loading = true;
					loader(function(html){
						obj.updateContent(html);
					}, function(error){
						obj.updateContent(error);
					});
				}
			});
		}
	};
	
	Tip.nodeInit = function($node, param){
		var url = param.url;
		var content = param.content;
		if(url){
			Tip.bindAsync($node, function(succ, err){
				Net.get(url, null, function(rsp){
					if(rsp && !rsp.code){
						succ(rsp.data);
					} else {
						err(rsp.message);
					}
				});
			},param);
		} else {
			Tip.bind(content, $node, param);
		}
	};
	
	return Tip;
});