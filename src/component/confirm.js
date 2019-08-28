/**
 * Created by Administrator on 2016/6/8.
 */
define('ywj/confirm', function(require){
	var Pop = require('ywj/popup');
	var lang = require('lang/$G_LANGUAGE');

	return {
		nodeClick: function($node){
			if(!$node.data('confirm-pass')){
				var msg = $node.data('confirm-message');
				var title = lang('确认');
				Pop.showConfirm(title, msg, function(){
					$node.data('confirm-pass', 1);
					setTimeout(function(){
						$node.data('confirm-pass', 0);
					});
					$node[0].click();
				}, null, {with_icon:true});
				return false;
			}
		}
	}
});