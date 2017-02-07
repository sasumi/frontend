/**
 * 绑定按钮（A）多选操作
 */
define('temtop/muloperate',function(require){
	var $ = require('jquery');
	var Msg = require('ywj/msg');
	var Net = require('ywj/net');
	var Util = require('ywj/util');
	var BTN_DISABLED_CLASS = 'btn-disabled';
	var SELECT_PROMPT = '请选择要操作的项目';

	return {
		nodeInit: function($btn){
			var scope = $btn.data('muloperate-scope') || 'body input[type=checkbox]';
			var SUBMIT_ABLE = false;
			var IS_LINK = $btn[0].tagName == 'A' && $btn.attr('href');
			var ORIGINAL_HREF = IS_LINK ? $btn.attr('href') : '';
			var $checkbox_list = $(scope).filter(function(){
				return this.name && !$(this).attr('disabled');
			});

			var update_state = function(){
				var has_checked = false;
				var data = [];
				$checkbox_list.each(function(){
					if(this.checked){
						has_checked = true;
						data.push(this.name+'='+encodeURIComponent(this.value));
					}
				});
				$btn[has_checked ? 'removeClass' : 'addClass'](BTN_DISABLED_CLASS);
				if($btn[0].tagName == 'INPUT' || $btn[0].tagName == 'BUTTON'){
					$btn.attr('disabled', !has_checked);
				}
				SUBMIT_ABLE = has_checked;

				if(IS_LINK){
					var new_href = Net.mergeCgiUri(ORIGINAL_HREF, data);
					$btn.attr('href', new_href);
				} else {
					$btn.attr('data-muloperate-value', Net.buildParam('',data));
				}
			};

			$btn.mousedown(function(){
				if(!SUBMIT_ABLE){
					Util.preventClickDelegate();
					Msg.show(SELECT_PROMPT, 'info', 1);
					return false;
				}
			});
			$checkbox_list.change(update_state);
			update_state();
		}
	};
});