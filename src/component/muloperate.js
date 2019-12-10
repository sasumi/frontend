/**
 * 绑定按钮（A）多选操作
 */
define('ywj/muloperate',function(require){
	var $ = require('jquery');
	var Msg = require('ywj/msg');
	var Net = require('ywj/net');
	var BTN_CHECK_CLASS = 'btn';
	var BTN_DISABLED_CLASS = 'btn-disabled';
	var SELECT_PROMPT = '请选择要操作的项目';

	return {
		nodeInit: function($btn){
			var scope = $btn.data('muloperate-scope') || 'body input[type=checkbox]';
			var SUBMIT_ABLE = false;
			var IS_LINK = $btn[0].tagName === 'A' && $btn.attr('href');
			var ORIGINAL_HREF = IS_LINK ? $btn.attr('href') : '';
			var selector;
			var idx = scope.indexOf(' ');

			if(idx !== -1){
				selector = scope.substr(0,idx);
				scope = scope.substr(idx+1);
			}else{
				selector = 'body';
			}

			var update_state = function(){
				var $checkbox_list = $(selector).find(scope).filter(function(){
					return this.name && !$(this).attr('disabled');
				});
				var has_checked = false;
				var data = [];
				$checkbox_list.each(function(){
					if(this.checked){
						has_checked = true;
						data.push(this.name+'='+encodeURIComponent(this.value));
					}
				});
				if($btn.hasClass(BTN_CHECK_CLASS)){
					$btn[has_checked ? 'removeClass' : 'addClass'](BTN_DISABLED_CLASS);
				}
				$btn[has_checked ? 'removeClass' : 'addClass']('muloperate-disabled');

				if($btn[0].tagName === 'INPUT' || $btn[0].tagName === 'BUTTON'){
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

			$btn.mousedown(function(e){
				if(!SUBMIT_ABLE){
					e.stopImmediatePropagation(); //stop other jQuery event binding
					e.preventDefault();
					Msg.show(SELECT_PROMPT, 'info', 1);
					return false;
				}
			});

			$btn.click(function(e){
				if(!SUBMIT_ABLE){
					e.stopImmediatePropagation(); //stop other jQuery event binding
					e.preventDefault();
					return false;
				}
			});
			//由于对接checker的触发时间是triggerHandler
			$(selector + ' ' + scope).on("change", update_state);
			update_state();
		}
	};
});