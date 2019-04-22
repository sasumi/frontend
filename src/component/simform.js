/**
 * Created by Administrator on 2016/6/27.
 */
define('ywj/simform', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');

	var build_form = function(param){
		param = $.extend({
			method: 'post',
			target: '',
			action: '',
			data: ''
		}, param);

		var $form = $('<form action="'+param.action+'" '+(param.target ? 'target="'+param.target+'"':'')+' method="'+param.method+'" style="display:none;">').appendTo('body');
		var data_list = param.data.split('&');
		for(var i=0; i<data_list.length; i++){
			var tmp = data_list[i].split('=');
			$('<input type="hidden" name="'+Util.htmlEscape(tmp[0])+'" value="'+Util.htmlEscape(tmp[1])+'"/>').appendTo($form);
		}
		return $form;
	};

	return {
		buildForm: build_form,
		nodeClick: function($node, param){
			param.action = param.action || $node.attr('href');
			var $form = build_form(param);
			$form.submit();
			return false;
		}
	}
});