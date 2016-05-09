define('temtop/exchange',function(require){
	var EX_DATA = null;
	var OS = 5;
	var CODE_RMB = 'RMB';
	var EXCHANGE_RATE_URL = window['EXCHANGE_RATE_URL'] || null;
	if(!EXCHANGE_RATE_URL){
		console.warn("EXCHANGE_RATE_URL required");
		return;
	}

	var $ = require('jquery');
	var net = require('ywj/net');
	var util = require('ywj/util');
	require('temtop/resource/exchange_rate.css');

	/**
	 * 计算转换表
	 * @param val
	 * @param code
	 * @returns {*}
	 */
	var cal = function(val, code){
		var rmb_val = val * EX_DATA[code].rate;
		var ret = {};
		var i;

		//非人民币，只显示转换成为人民币的项
		if(code != CODE_RMB){
			one = EX_DATA[CODE_RMB];
			ret[CODE_RMB] = {
				code: one.code,
				symbol: one.symbol,
				ename: one.ename,
				name: one.name,
				rate: one.rate,
				value: rmb_val / one.rate
			};
		} else {
			for(i in EX_DATA){
				var one = EX_DATA[i];
				ret[one.code] = {
					code: one.code,
					symbol: one.symbol,
					ename: one.ename,
					name: one.name,
					rate: one.rate,
					value: rmb_val / one.rate
				};
			}
		}
		return ret;
	};

	/**
	 * 获取汇率
	 * @param val
	 * @param code
	 * @param cb
	 */
	var getExchangeRate = function(val, code, cb){
		cb = cb || function(){};
		if(EX_DATA){
			cb(cal(val, code));
		} else {
			net.get(EXCHANGE_RATE_URL, {}, function(rsp){
				EX_DATA = rsp;
				cb(cal(val, code));
			});
		}
	};

	var roundFixed = function(num, pos){
		return Math.round(num*Math.pow(10, pos))/Math.pow(10, pos);
	};

	var $PANEL = null;
	var panel_tm = null;
	var PANEL_OUT_TIME = 200;

	var show_panel = function($el, val, code){
		var pos = $el.data('currency-position') || 'bottom';
		clearTimeout(panel_tm);
		if(!$PANEL){
			$PANEL = $('<div style="display:none"></div>').appendTo('body');
			$PANEL.mouseover(function(){
				clearTimeout(panel_tm);
			});
			$PANEL.mouseout(function(){
				hide_panel();
			});
		}

		$PANEL.attr('class', 't-currency-panel t-currency-panel-'+pos);

		getExchangeRate(val, code, function(data){
			var html = '<s></s>'+
				'<table><thead><tr><th>货币</th><th>兑换值</th><th style="display:none;">汇率</th></tr></thead><tbody>';
			for(var i in data){
				if(data[i]){
					html += '<tr><td>'+data[i].code+'</td><td>'+roundFixed(data[i].value,2)+'</td>';
					html += '<td style="display:none;">'+data[i].rate+'</td></tr>';
				}
			}
			html += '</tbody></table>';
			$PANEL.html(html).show();

			//update pos
			var offset = $el.offset();
			var style = {};
			if(pos == 'bottom'){
				style = {
					left: offset.left,
					top: offset.top + $el.outerHeight() + OS
				};
			} else if(pos == 'right'){
				style = {
					left: offset.left+$el.outerWidth()+OS,
					top: offset.top - $PANEL.outerHeight()/2
				}
			} else if(pos == 'left'){
				style = {
					left: offset.left-$PANEL.outerWidth()-OS,
					top: offset.top - $PANEL.outerHeight()/2
				};
			} else if(pos == 'top'){
				style = {
					left: offset.left,
					top: offset.top - $PANEL.outerHeight() - OS
				};
			}
			$PANEL.css(style);
		});
	};

	var hide_panel = function(){
		if($PANEL){
			clearTimeout(panel_tm);
			panel_tm = setTimeout(function(){
				$PANEL.hide();
			}, PANEL_OUT_TIME);
		}
	};

	var init_display = function(){
		$('.t-price[data-currency-code]').each(function(){
			var $this = $(this);
			if($this.data('currency-code-bind')){
				return;
			}
			$this.data('currency-code-bind', 1);

			var code = $this.data('currency-code').toUpperCase();
			if(code){
				$this.hover(function(){
					show_panel($this, $.trim($this.html()), code);
				}, function(){
					hide_panel();
				});
			}
		});
	};

	//init
	$(function(){
		init_display();
	});

	return {
		rebind: init_display
	}
});