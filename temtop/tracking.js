define('temtop/tracking',function(require){
	var Util = require('ywj/util');
	var FC_MAP = {
		'GLS': '100005',
		'DEDHL': '07041',
		'DEFBAEU' : '07041',
		'DEFBA' : '07041'
	};
	return {
		nodeInit: function($node, param){
			$node.addClass('temtop-tracking-link');
			$node.attr('title', '查看实时物流信息');
			param.num = param.num || $node.text();
			if(!param.num || param.num == '-'){
				return;
			}

			if(param.num.length < 5){
				console.error('tracking number format error:'+param.num);
				return;
			}
			if(/gls/i.test(param.code)){
				param.code = 'GLS';
			}
			if(/dedhl/i.test(param.code)){
				param.code = 'DEDHL';
			}

			var fc = FC_MAP[param.code] || FC_MAP.DEDHL;

			if(!$node.attr('id')){
				$node.attr('id', 'yq_id_'+Util.guid());
			}
			var id = $node.attr('id');
			seajs.use('17track/externalcall.js', function(){
				YQV5.trackSingleF1({
					YQ_ElementId: id,      //必须，指定悬浮位置的元素ID。
					YQ_Width: 800,        //可选，指定查询结果宽度，最小宽度为600px，默认撑满容器。
					YQ_Height: 400,       //可选，指定查询结果高度，最大高度为800px，默认撑满容器。
					YQ_Fc: fc,       //可选，指定运输商，默认为自动识别。
					YQ_Lang: "zh-CHS",        //可选，指定UI语言，默认根据浏览器自动识别。
					YQ_Num: param.num       //必须，指定要查询的单号。
				});
			});
		}
	}
});