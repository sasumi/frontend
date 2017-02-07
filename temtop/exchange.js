define('temtop/exchange',function(require){
	var EX_DATA = null;
	var CODE_RMB = 'RMB';
	var EXCHANGE_RATE_URL = window['EXCHANGE_RATE_URL'] || null;
	if(!EXCHANGE_RATE_URL){
		console.warn("EXCHANGE_RATE_URL required");
		return;
	}

	require('temtop/resource/exchange_rate.css');
	var $ = require('jquery');
	var Net = require('ywj/net');
	var Tip = require('ywj/tip');

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
			Net.get(EXCHANGE_RATE_URL, {}, function(rsp){
				EX_DATA = rsp;
				cb(cal(val, code));
			});
		}
	};

	var roundFixed = function(num, pos){
		return Math.round(num*Math.pow(10, pos))/Math.pow(10, pos);
	};

	var getHtml = function($el, val, code, callback){
		getExchangeRate(val, code, function(data){
			var html = '<table class="t-currency-tbl"><thead><tr><th>货币</th><th>兑换值</th><th style="display:none;">汇率</th></tr></thead><tbody>';
			for(var i in data){
				if(data[i]){
					html += '<tr><td>'+data[i].code+'</td><td>'+roundFixed(data[i].value,2)+'</td>';
					html += '<td style="display:none;">'+data[i].rate+'</td></tr>';
				}
			}
			html += '</tbody></table>';
			return callback(html);
		});
	};

	var init_display = function(){
		$('.t-price[data-currency-code]').each(function(){
			var $this = $(this);
			if($this.data('currency-bind')){
				return;
			}
			$this.data('currency-bind', 1);
			var code = $this.data('currency-code').toUpperCase();
			var val = $.trim($this.html().replace(',',''));
			if(code){
				Tip.bindAsync($this, function(succCb, errCb){
					getHtml($this, val, code, succCb);
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