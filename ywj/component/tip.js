define('ywj/tip', function(require){
	require('ywj/resource/tip.css');
	var util = require('ywj/util');

	var PRIVATE_VARS = {};

	/**
	 * 绑定事件
	 */
	var bindEvent = function(){
		if(PRIVATE_VARS[this.guid].opt.closeBtn){
			var btn = $('.ywj-tip-close', PRIVATE_VARS[this.guid].container);
			var _this = this;
			btn.click(function(){
				_this.hide();
			});
		}
	};

	/**
	 * 更新位置信息
	 * @param px
	 * @param py
	 */
	var updatePosition = function(px, py){
		var vars = PRIVATE_VARS[this.guid];
		var width = vars.container.outerWidth();
		var height = vars.container.outerHeight();

		var offset = {
			11: [-width*0.25, 0],
			0: [-width*0.5, 0],
			1: [-width*0.75, 0],
			2: [-width, -height*0.25],
			3: [-width, -height*0.5],
			4: [-width, -height*0.75],
			5: [-width*0.75, -height],
			6: [-width*0.5, -height],
			7: [-width*0.25, -height],
			8: [0, -height*0.75],
			9: [0, -height*0.5],
			10: [0, -height*0.25]
		};
		var x = px + offset[vars.opt.dir][0];
		var y = py + offset[vars.opt.dir][1];

		vars.container.css({
			left: parseInt(x,10),
			top: parseInt(y,10)
		});
	};

	/**
	 * TIP组件
	 * @param content
	 * @param opt
	 * @constructor
	 */
	var Tip = function(content, opt){
		this.guid = util.guid();
		PRIVATE_VARS[this.guid] = {};

		opt = $.extend({
			closeBtn: true, //是否显示关闭按钮
			expired: 0,     //延期关闭时间,0表示不延期关闭
			dir: 0,         //方向(时钟方位)
			width: 250,     //宽度
			relTag: null,   //关联对象
			posX: 0,        //偏移X
			posY: 0         //偏移Y
		}, opt);

		opt.relTag = $(opt.relTag);

		var html = '<div class="ywj-tip-container-wrap ywj-tip-'+opt.dir+'" style="display:none; width:'+opt.width+'px;">'+
			'<s class="ywj-tip-arrow ywj-tip-arrow-pt"></s>'+
			'<s class="ywj-tip-arrow ywj-tip-arrow-bg"></s>'+
			(opt.closeBtn ? '<span class="ywj-tip-close">X</span>' : '')+
			'<div class="ywj-tip-content">'+
			content +
			'</div>'+
			'</div>';

		PRIVATE_VARS[this.guid].opt = opt;
		PRIVATE_VARS[this.guid].container = $(html).appendTo($('body'));
		bindEvent.call(this);
	};

	Tip.prototype.show = function(){
		var vars = PRIVATE_VARS[this.guid];
		vars.container.show();

		var x = vars.posX;
		var y = vars.posY;

		if(vars.opt.relTag){
			var pos = vars.opt.relTag.offset();
			var size = {width:vars.opt.relTag.width(), height:vars.opt.relTag.height()};
			var offset = {
				11: [size.width/2, size.height],
				0: [size.width/2, size.height],
				1: [size.width/2, size.height],
				2: [0, size.height/2],
				3: [0, size.height/2],
				4: [0, size.height/2],
				5: [size.width/2, 0],
				6: [size.width/2, 0],
				7: [size.width/2, 0],
				8: [size.width, size.height/2],
				9: [size.width, size.height/2],
				10: [size.width, size.height/2]
			};
			x = pos.left + offset[vars.opt.dir][0];
			y = pos.top + offset[vars.opt.dir][1];
		}
		updatePosition.call(this, x, y);

		if(vars.opt.expired){
			var _this = this;
			setTimeout(function(){
				_this.hide();
			}, vars.opt.expired*1000);
		}
	};

	Tip.prototype.hide = function(){
		PRIVATE_VARS[this.guid].container.hide();
	};

	Tip.prototype.destroy = function(){
		PRIVATE_VARS[this.guid].container.remove();
	};

	Tip.show = function(content, relTag, opt){
		opt = opt || {};
		opt.relTag = relTag;

		var tip = new Tip(content, opt);
		tip.show();
		return tip;
	};

	return Tip;
});