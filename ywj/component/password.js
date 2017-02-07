/**
 * 密码输入辅助控件
 */
define('ywj/password', function (require) {
	var $ = require('jquery');
	var Util = require('ywj/util');

	return {
		nodeInit: function($inp){
			var name = $inp.attr('name');
			var required = !!$inp.attr('required');
			var is_set = $inp.data('isset');

			//rpt inputer
			var $rpt = $('<input type="password" value="" style="display:none" class="repeat-password" placeholder="再次输入密码"/>').insertAfter($inp);
			$rpt[0].oninvalid = function(){
				if(!this.value){
					this.setCustomValidity('');
				}
				else if(this.value != $inp.val()){
					this.setCustomValidity('两次输入的密码不一致');
				} else {
					this.setCustomValidity('');
				}
			};
			$rpt.on('input', function(){
				if(this.value == $inp.val()){
					this.setCustomValidity('');
				}
			});

			//input event
			$inp.on('input', function(){
				$rpt.val('').attr('required', false).hide();
				if($inp.val()){
					$rpt.attr('pattern', Util.pregQuote($inp.val()));
				}
				if(required || $inp.val()){
					$inp.attr('name', name);
					$rpt.attr('required', 'required').show();
				}
				if(is_set && !$inp.val()){
					$rpt.attr('required', false).hide();
				}
			});

			//initialize edit mode
			if(is_set){
				//清除name提交数据
				$inp.attr('name', '').attr('required', false).val('');
				$inp.attr('placeholder', '输入新密码重置');
			} else if(required){
				$inp.attr('placeholder', '请设置密码');
			}
		}
	};
});