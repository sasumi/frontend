/**
 * Created by sasumi on 5/12/2014.
 */
define('ywj/slide', function(require){
	var PRIVATE_VARS = {};
	var util = require('ywj/util');

	/**
	 * bind trigger event
	 * @param slide
	 * @param content
	 */
	var bindEvent = function(slide, content){
		var hovering = false;
		var hover_check_time = 50;

		$(content).mouseover(function(){
			hovering = true;
			slide.pause();
		});

		$(content).mouseout(function(){
			hovering = false;
			setTimeout(function(){
				if(!hovering){
					slide.resume();
				}
			}, hover_check_time);
		});
	};

	var Slide = function(content, option){
		var guid = util.guid();
		PRIVATE_VARS[guid] = {};
		PRIVATE_VARS[guid].content_list = $(content).children();

		this.guid = guid;
		this.index = 0;
		this.option = $.extend({
			interval: 3000
		}, option);

		bindEvent(this, content);
	};

	/**
	 * 添加控制器
	 * @param $control
	 * @param event
	 */
	Slide.prototype.addControl = function($control, event){
		var s = this;
		event = event || 'mouseover';
		$($control).children().each(function(k, v){
			$(this)[event](function(){
				s.switchTo(k);
				s.pause();
				return false;
			});
		});
	};

	/**
	 * animate
	 * @param fromCon
	 * @param toCon
	 * @param callback
	 */
	Slide.prototype.animate = function(fromCon, toCon, callback){
		fromCon.animate({opacity: 0}, 100, null, function(){fromCon.hide();});
		toCon.show().animate({opacity: 0}, 0).animate({opacity: 1}, 100);
		callback();
	};

	/**
	 * on switch to slide
	 * @param fromNode
	 * @param toNode
	 */
	Slide.prototype.onSwitchTo = function(fromNode, toNode){};


	/**
	 * 切换到指定
	 * @param idx
	 * @param callback
	 */
	Slide.prototype.switchTo = function(idx, callback){
		callback = callback || function(){};
		if(idx == this.index){
			callback();
			return;
		}

		var from = PRIVATE_VARS[this.guid].content_list.eq(this.index);
		var to = PRIVATE_VARS[this.guid].content_list.eq(idx);
		this.animate(from, to, callback);
		this.onSwitchTo(from, to);
		this.index = idx;
	};

	/**
	 * 切换到下一个
	 */
	Slide.prototype.switchToNext = function(){
		var total = PRIVATE_VARS[this.guid].content_list.size();
		var idx = (this.index == total - 1) ? 0 : (this.index+1);
		this.switchTo(idx);
	};

	/**
	 * 切换到上一个
	 */
	Slide.prototype.switchToPre = function(){
		var total = PRIVATE_VARS[this.guid].content_list.size();
		var idx = (this.index == 0) ? (total-1) : (this.index-1);
		this.switchTo(idx);
	};

	/**
	 * start/resume slide loop
	 */
	Slide.prototype.start = function(idx){
		//console.log('start');
		idx = idx !== undefined ? idx : this.index;
		this.stop();
		PRIVATE_VARS[this.guid].stop = false;
		this.run(idx);
	};

	/**
	 * 暂停
	 */
	Slide.prototype.pause = function(){
		//console.log('pause');
		clearTimeout(PRIVATE_VARS[this.guid].timer);
		PRIVATE_VARS[this.guid].stop = true;
	};

	/**
	 * 恢复
	 */
	Slide.prototype.resume = function(){
		//console.log('resume');
		if(!PRIVATE_VARS[this.guid].stop){
			//console.log('resume fail');
			return;
		}
		//console.log('resume true');
		PRIVATE_VARS[this.guid].stop = false;
		this.run(this.index);
	};

	/**
	 * stop slide change loop
	 */
	Slide.prototype.stop = function(){
		//console.log('stop');
		this.index = 0;
		clearTimeout(PRIVATE_VARS[this.guid].timer);
		PRIVATE_VARS[this.guid].stop = true;
	};

	/**
	 * run slide change loop
	 * @param from
	 */
	Slide.prototype.run = function(from){
		if(PRIVATE_VARS[this.guid].stop){
			//console.log('run false');
			return;
		}

		var _this = this, guid = this.guid;
		var total = PRIVATE_VARS[guid].content_list.size();
		var to = from == (total-1) ? 0 : (from+1);

		PRIVATE_VARS[this.guid].timer = setTimeout(function(){
			var fromNode = PRIVATE_VARS[guid].content_list.eq(from);
			var toNode = PRIVATE_VARS[guid].content_list.eq(to);
			_this.animate(fromNode, toNode, function(){
				_this.onSwitchTo(fromNode, toNode);
				_this.run(to);
				_this.index = to;
			});
		}, this.option.interval);
	};
	return Slide;
});