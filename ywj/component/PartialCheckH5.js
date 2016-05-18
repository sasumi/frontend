/**
 * 部分选择器，需要样式、结构配合
 */
define('ywj/PartialCheckH5', function(require){
	require('ywj/resource/checktip.css');
	var $ = require('jquery');
	var DEFAULT_REL = 'selector';
	var event_bind_uuid = 'selector-bind';

	var $TIP;
	var tm;

	return function(selector, rel){
		rel = rel || DEFAULT_REL;
		var $cur = $(selector);

		if(!$cur.data(event_bind_uuid)){
			$cur.data(event_bind_uuid, 1);
		} else {
			return;
		}

		var $chk_list = $('input[type=checkbox][rel!='+rel+']', $cur.data('target') || 'table');

		var update_trigger_tip = function(check_count, total){
			$cur.attr('title', '已选择('+check_count+'/'+total+')');
			$cur.trigger('check_change', {count:check_count, total:total});
		};

		var show_tip = function($chk){
			var tmp = get_check_count();
			var check_count = tmp[0],
				total = tmp[1];

			if(!$TIP){
				$TIP = $('<div class="check-tip">').appendTo($('body'));
			}
			$TIP.html(check_count+'/'+total).css({
				top: $chk.offset().top,
				left: $chk.offset().left,
				opacity: 1
			}).stop().show();

			clearTimeout(tm);
			tm = setTimeout(function(){
				$TIP.animate({
					opacity: 0
				}, function(){
					$TIP.hide();
				});
			}, 1000);
		};

		var get_check_count = function(){
			var has_checked = 0;
			var all_count = $chk_list.size();
			$chk_list.each(function(){
				if($(this).attr('checked')){
					has_checked ++;
				}
			});
			return [has_checked, all_count];
		};

		//更新指示器
		var update_trigger = function(){
			var tmp = get_check_count();
			var has_checked = tmp[0];
			var all_count = tmp[1];

			$cur[0].indeterminate = false;
			$cur.attr('checked', false);
			if(has_checked == all_count){
				$cur.attr('checked', true);
				update_trigger_tip(has_checked, all_count);
			} else if(has_checked){
				$cur[0].indeterminate = true;
				$cur.attr('checked', true);
				update_trigger_tip(has_checked, all_count);
			} else {
				$cur.attr('checked', false);
				update_trigger_tip(0, all_count);
			}
		};

		//更新选择框
		var update_check = function(toState){
			$chk_list.attr('checked', !!toState).trigger('change');
		};

		$cur.change(function(){
			var toState = $(this).data('flag') === undefined || $(this).data('flag') == '1';
			if($(this).attr('type') == 'checkbox'){
				toState = this.checked;
			}
			update_check(toState);
			show_tip($cur);
		});
		$chk_list.change(function(){
			update_trigger();
			show_tip($(this));
		});

		update_trigger();
	};
});