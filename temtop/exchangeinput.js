define('temtop/exchangeinput',function(require){
	var EX_DATA = null;
	var CODE_RMB = 'RMB';
	var OS = 5;
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

	/**
	 * 货币兑换
	 * @param val
	 * @param from_code
	 * @param to_code
	 * @returns {number}
	 */
	var exchangeVal = function(val, from_code, to_code){
		val = parseFloat(val);
		var from_rate = parseFloat(EX_DATA[from_code].rate);
		var to_rate = parseFloat(EX_DATA[to_code].rate);
		var rmb_val = val*from_rate;
		return roundFixed(rmb_val/to_rate, 2);
	};

	var roundFixed = function(num, pos){
		return Math.round(num*Math.pow(10, pos))/Math.pow(10, pos);
	};

	/**
	 * input mode
	 * @type {null}
	 */
	var $INPUT_PANEL = null;
	var show_input_panel = function ($el, val, input_code) {
		var pos = $el.data('currency-position') || 'bottom';
		if (!$INPUT_PANEL) {
			$INPUT_PANEL = $('<div class="" style="display:none"></div>').appendTo('body');
		}
		$INPUT_PANEL.attr('class', 't-currency-panel t-currency-panel-'+pos);

		getExchangeRate(val, input_code, function (data) {
			var html = '<s></s>' +
				'<table><thead><tr><th>货币</th><th>兑换值</th><th style="display:none;">汇率</th></tr></thead><tbody>';
			for (var i in data) {
				if (data[i]) {
					html += '<tr><td>' + data[i].code + '</td>';
					html += '<td><input type="text" class="txt" value="' + roundFixed(data[i].value, 2) + '" data-code="'+data[i].code+'" data-rate="'+data[i].rate+'"></td>';
					html += '<td style="display:none;">' + data[i].rate + '</td></tr>';
				}
			}
			html += '</tbody></table>';
			$INPUT_PANEL.html(html).show();

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
					top: offset.top - $INPUT_PANEL.outerHeight()/2
				}
			} else if(pos == 'left'){
				style = {
					left: offset.left-$INPUT_PANEL.outerWidth()-OS,
					top: offset.top - $INPUT_PANEL.outerHeight()/2
				};
			} else if(pos == 'top'){
				style = {
					left: offset.left,
					top: offset.top - $INPUT_PANEL.outerHeight() - OS
				};
			}
			$INPUT_PANEL.css(style);

			var $inputs = $INPUT_PANEL.find('input');
			$inputs.focus(function(){this.select(this);});
			$.each(['mouseup', 'keyup', 'change'], function(k, ev){
				$inputs[ev](function(){
					var $cur_inp = $(this);
					var code = $cur_inp.data('code');
					var v = exchangeVal($cur_inp.val(), code, input_code);
					$el.val(v);
					$inputs.each(function(){
						if($cur_inp[0] != this){
							v = exchangeVal($cur_inp.val(), code, $(this).data('code'));
							$(this).val(v);
						}
					});
				});
			});
		});
	};

	var hide_input_panel = function () {
		$INPUT_PANEL && $INPUT_PANEL.hide();
	};

	$('body').click(function (e){
		if($INPUT_PANEL && !$.contains($INPUT_PANEL[0], e.target) && e.target != $INPUT_PANEL[0]){
			if($(e.target).data('currency-code') && e.target.tagName == 'INPUT'){
				//control
			} else {
				hide_input_panel();
			}
		}
	});

	//输入
	var init_input = function(){
		$('input[data-currency-code]').each(function () {
			var $this = $(this);
			if($this.data('currency-code-bind')){
				return;
			}
			$this.data('currency-code-bind', 1);

			var code = $this.data('currency-code').toUpperCase();
			if (code) {
				$this.click(function () {
					show_input_panel($this, $this.val(), code);
				});

				$.each(['click', 'keyup', 'focus', 'change'], function(k, ev){
					$this[ev](function(){
						show_input_panel($this, $this.val(), code);
					});
				});
			}
		});
	};

	//init
	$(function(){
		init_input();
	});

	return {
		rebind: init_input
	}
});