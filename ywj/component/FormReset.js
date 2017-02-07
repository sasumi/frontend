/**
 * 表单重置清除按钮
 */
define('ywj/FormReset', function (require) {
	return {
		nodeClick: function($node){
			var $form = $node.closest('form');
			if(!$form.size() || !$form.attr('action')){
				return;
			}
			location.href = $form.attr('action');
		}
	};
});