/**
 * 部分选择器
 */
define('ywj/checker', function(require){
	require('ywj/resource/checktip.css');
	var ROW_CHECKED_CLASS = 'yc-row-checked';
	var $ = require('jquery');
	var $TIP;
	var tm;

	return {
		nodeInit: function($mater_check, param){
			var target = param.target;
			var hidetip = param.hidetip;

			//缺省只针对table里面的checkbox有效
			var $chk_list = $('input[type=checkbox]:not([disabled]):not([readonly]):not([data-component])', target || 'table');
			if(!$chk_list.size()){
				$mater_check.attr('disabled', 'disabled');
				return;
			}

			//如有quick，至少显示全选、反选
			if(param.quick !== undefined){
				var arr = param.quick ? param.quick.split(',') : [];
				var s = '<span class="quick-checker">';
				s += '<span class="quick-checker-chk"></span>';
				s += '<ul>';
				s += '<li data-count="-1">全选</li>';
				s += '<li data-count="-2">反选</li>';
				for(var i=0; i<arr.length; i++){
					s += '<li data-count="'+arr[i]+'">'+arr[i]+'</li>';
				}
				s += '</ul></span>';
				var $nav = $(s).insertBefore($mater_check);
				$nav.find('.quick-checker-chk').prepend($mater_check).click(function(e){
					if(e.target.tagName === 'SPAN'){
						return false;
					}
				});
				$nav.find('li').click(function(){
					var count = $(this).data('count');
					switch(count){
						case -1:
							$chk_list.attr('checked', true).triggerHandler('change');
							break;
						case -2:
							var $ed = $chk_list.filter(':checked');
							var $un = $chk_list.filter(':not(:checked)');
							$un.attr('checked', true).triggerHandler('change');
							$ed.removeAttr('checked').triggerHandler('change');
							break;
						default:
							$chk_list.attr('checked', false);
							$chk_list.slice(0, count).attr('checked', true).triggerHandler('change');
					}
					return false;
				});
			}

			var show_tip = function($chk){
				if(hidetip){
					return;
				}
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

				var update_trigger_tip = function(check_count, total){
					$mater_check.attr('title', '已选择('+check_count+'/'+total+')');
					$mater_check.trigger('check_change', {count:check_count, total:total});
				};

				$mater_check[0].indeterminate = false;
				$mater_check.attr('checked', false);
				if(has_checked == all_count){
					$mater_check.attr('checked', true);
					update_trigger_tip(has_checked, all_count);
				} else if(has_checked){
					$mater_check[0].indeterminate = true;
					$mater_check.attr('checked', true);
					update_trigger_tip(has_checked, all_count);
				} else {
					$mater_check.attr('checked', false);
					update_trigger_tip(0, all_count);
				}
			};

			//更新选择框
			var update_check = function(toState){
				//这里使用triggerHandler，不用trigger，避免触发太多原生事件，影响性能
				$chk_list.attr('checked', !!toState).triggerHandler('change');
			};

			//支持shift多选
			var $last_check = null;
			var found_index = function($chk){
				for(var i=0; i<$chk_list.size(); i++){
					if($chk_list[i] == $chk[0]){
						return i;
					}
				}
				return 0;
			};

			var select_in_range = function($start, $to){
				var s = found_index($start);
				var t = found_index($to);
				var c = !!$start.attr('checked');
				for(var i=Math.min(s, t)+1; i<=Math.max(s, t); i++){
					$chk_list.eq(i).attr('checked', c);
				}
			};

			$mater_check.change(function(){
				var toState = $mater_check.data('flag') === undefined || $mater_check.data('flag') == '1';
				if($mater_check.attr('type') === 'checkbox'){
					toState = this.checked;
				}
				update_check(toState);
				show_tip($mater_check);
			});

			$chk_list.change(function(){
				var $table_row = $(this).closest('tr');
				if($table_row.size()){
					$table_row[this.checked ? 'addClass' : 'removeClass'](ROW_CHECKED_CLASS);
				}
				update_trigger();
				show_tip($(this));
			});

			//支持shift选择
			$chk_list.click(function(e){
				if(e.shiftKey && $last_check && $last_check[0] != this){
					select_in_range($last_check, $(this));
				} else {
					$last_check = $(this);
				}
			});

			//增强支持单个容器下，父级容器点击辅助
			var _pc = false; //防止fix-head重复监听
			$chk_list.add($mater_check).parent().each(function(){
				var $p = $(this);
				if($p.children().length == 1){
					$p.click(function(e){
						if(_pc){
							return;
						}
						_pc = true;
						setTimeout(function(){_pc = false;}, 0);
						if(e.target.nodeName != 'INPUT'){
							$p.find('input').trigger('click');
						}
					});
				}
			});

			update_trigger();
		}
	};
});