/**
 * Created by Administrator on 2016/6/8.
 */
define('ywj/confirm', function(require){
	var Pop = require('ywj/popup');
	var pass = false;
	var lang = require('lang/$G_LANGUAGE');

	return {
		nodeClick: function($node){
			if(!pass){
				var msg = $node.data('confirm-message');
				var title = lang('确认');
				Pop.showConfirm(title, msg, function(){
					pass = true;
					setTimeout(function(){pass = false}, 50);
					$node.trigger('click');
				}, null, {with_icon:true});
				return false;
			}
		}
	}
});