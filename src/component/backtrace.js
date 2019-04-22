/**
 * 操作路径索引
 */
define('ywj/backtrace', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');

	window['_PAGE_BACKTRACE_ID_'] = 'P'+(new Date()).getTime();
	window['_BACKTRACE_RECALL_'] = function(trigger_id ){

	};

	return {
		nodeInit: function($node, param){
			var url = param.url || 'here';

		}
	};
});