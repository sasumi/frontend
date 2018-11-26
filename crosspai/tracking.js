define('crosspai/tracking',function(require){
	require('crosspai/resource/tracking.css');
	window.TRACKING_CSS_LOADED = true;

	var Net = require('ywj/net');
	var Pop = require('ywj/popup');
	var CGI = 'http://tracking.whalepie.com/api/v1/tracking/page';

	if(!window['TRACKING_AUTHORIZATION']){
		console.warn('NO TRACKING_AUTHORIZATION AUTHORIZATION KEY FOUND');
		return;
	}

	return {
		nodeInit: function($node, param){
			$node.addClass('whalepie-tracking-link');
			$node.attr('title', '查看物流信息');
			param.no = param.no || $node.text();
			if(!param.no){
				return;
			}
			if(param.no.length < 5){
				console.error('tracking number format error:'+param.num);
				return;
			}
			param.authorization = window['TRACKING_AUTHORIZATION'];
			param.ref = 'jsonp';

			var TRACKING_HTML = '<div class="whalepie-tracking-wrap"><span class="whalepie-tracking-loading">正在加载，请稍候···</span></div>';
			var p;

			$node.click(function(){
				var prepend_link = '';
				if(!top.TRACKING_CSS_LOADED){
					prepend_link = '<link rel="stylesheet" href="'+seajs.resolve('crosspai/resource/tracking.css')+'">';
				}

				Pop.showPopInTop({
					title: '查询跟踪号信息',
					content: TRACKING_HTML
				}, function(_p){
					p = _p;
				});

				Net.get(CGI, param, function(rsp){
					console.log('tracking content', rsp);
					if(rsp.code == 0 || rsp.code == 'success'){
						p.updateWidth(700);
						p.container.find('.whalepie-tracking-wrap').html(rsp.data.html+prepend_link);
					}else{
						p.container.find('.whalepie-tracking-wrap').html(rsp.message);
					}
				}, {
					format: 'jsonp',
					jsonpCallback: 'callback'
				});
			});
		}
	}
});