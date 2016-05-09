/**
 * 绑定按钮（A）多选操作
 */
define('temtop/muloperate',function(require){
	var $ = require('jquery');
	var msg = require('ywj/msg');
	var net = require('ywj/net');
	var util = require('ywj/util');
	var FLAG = 'multiple-operate';
	var BTN_DISABLED_CLASS = 'btn-disabled';
	var SELECT_PROMPT = '请选择要操作的项目';

	var bind = function($scope){
		$('[data-'+FLAG+']').each(function(){
			var $btn = $(this);
			var scope = $btn.data(FLAG) || 'body input[type=checkbox]';
			var SUBMIT_ABLE = false;
			var IS_LINK = $btn[0].tagName == 'A';
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
				SUBMIT_ABLE = has_checked;

				if(IS_LINK){
					var new_href = net.mergeCgiUri(ORIGINAL_HREF, data);
					$btn.attr('href', new_href);
				} else {
					$btn.attr('data-multiple-value', net.buildParam('',data));
				}
			};

			$btn.mousedown(function(){
				if(!SUBMIT_ABLE){
					util.preventClickDelegate();
					msg.show(SELECT_PROMPT, 'info', 1);
					return false;
				}
			});
			$checkbox_list.change(update_state);
			update_state();
		});
	};

	$(bind);
	return bind;
});