/**
 * 部分选择器，需要样式、结构配合
 */
define('ywj/partialcheck', function(require){
	var util = require('ywj/util');

	var UNCHECKED = 0;
	var CHECKED = 1;
	var PARTIAL = 2;

	//state convert map
	var state_convert = {};
	state_convert[CHECKED] = UNCHECKED;
	state_convert[PARTIAL] = CHECKED;
	state_convert[UNCHECKED] = CHECKED;

	var default_class_state_map = {};
	default_class_state_map[CHECKED] = 'checkbox-checked';
	default_class_state_map[PARTIAL] = 'checkbox-partial';
	default_class_state_map[UNCHECKED] = 'checkbox-unchecked';

	/**
	 * init handle
	 * @param container
	 * @param opt
	 */
	var init = function(container, opt){
		container = container || 'body';

		opt = $.extend({
			CLASS_MAP: default_class_state_map,
			CHECK_CLASS: 'checkbox-icon'
		}, opt);

		var updateSingleCheck = function(node, to_state){
			$.each(opt.CLASS_MAP, function(k, v){
				$(node).removeClass(v);
			});
			$(node).addClass(opt.CLASS_MAP[to_state]);
		};

		/**
		 * 更新指定checkbox关联的界面状态信息
		 * @param check_node
		 */
		var updateSubChecks = function(check_node){
			var state = $(check_node).hasClass(opt.CLASS_MAP[PARTIAL]) ? PARTIAL :
				($(check_node).hasClass(opt.CLASS_MAP[UNCHECKED]) ? UNCHECKED : CHECKED);
			var to_state = state_convert[state];
			var li = util.findParent(check_node, 'li');
			$('input[type=checkbox]', li).attr('checked', to_state == CHECKED);
		};

		var updateAllTree = function(){
			$('.'+opt.CHECK_CLASS).each(function(){
				var li = util.findParent(this, 'li');
				var unchecked_count = 0;
				var checked_count = 0;
				$('input[type=checkbox]', li).each(function(){
					if(this.checked){
						checked_count++;
					} else {
						unchecked_count++;
					}
				});
				if(checked_count && unchecked_count){
					updateSingleCheck(this, PARTIAL);
				} else if(checked_count && !unchecked_count){
					updateSingleCheck(this, CHECKED);
				} else {
					updateSingleCheck(this, UNCHECKED);
				}
			});
		};

		var $body = $('body');

		//兼容label点击事件
		$body.delegate('label', 'click', function(){
			var node = $('.'+opt.CHECK_CLASS, this);
			if(node[0]){
				updateSubChecks(node[0]);
				updateAllTree();
			}
		});

		$body.delegate('.'+opt.CHECK_CLASS, 'click', function(){
			updateSubChecks(this);
			updateAllTree();
			return false;
		});

		$('input[type=checkbox]', $(container)).click(function(){
			updateAllTree();
		});

		//initialize
		updateAllTree();
	};

	init.CHECKED = CHECKED;
	init.UNCHECKED = UNCHECKED;
	init.PARTIAL = PARTIAL;

	return init;
});