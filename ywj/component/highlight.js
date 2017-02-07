/**
 * 表单重置清除按钮
 */
define('ywj/highlight', function (require) {
	var _ = require('jquery/highlight');

	return {
		nodeInit: function($node, param){
			var kw = param;
			if(kw){
				$node.highlight(kw);
			}
		}
	};
});