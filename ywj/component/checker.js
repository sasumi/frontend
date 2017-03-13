/**
 * 部分选择器
 */
define('ywj/checker', function(require){
	require('ywj/resource/checktip.css');
	var $ = require('jquery');
	var $TIP;
	var tm;

	return {
		nodeInit: function($cur, param){
			var target = param.target;
			var hidetip = param.hidetip;
			var quick_check = param.qc;

			//缺省只针对table里面的checkbox有效
			var $chk_list = $('input[type=checkbox]:not([disabled]):not([readonly]):not([data-component])', target || 'table');
			if(!$chk_list.size()){
				$cur.attr('disabled', 'disabled');
				return;
			}

			if(quick_check !== undefined){
				var arr = quick_check ? quick_check.split(',') : [10,20,50,80,100];
				var s = '<span class="quick-checker">';
				s += '<span class="quick-checker-chk"></span>';
				s += '<ul>';
				for(var i=0; i<arr.length; i++){
					s += '<li data-count="'+arr[i]+'">'+arr[i]+'</li>';
				}
				s += '</ul></span>';
				var $nav = $(s).insertBefore($cur);
				$nav.find('.quick-checker-chk').prepend($cur).click(function(e){
					if(e.target.tagName == 'SPAN'){
						return false;
					}
				});
				$nav.find('li').click(function(){
					var count = $(this).data('count');
					$chk_list.attr('checked', false);
					$chk_list.slice(0, count).attr('checked', true).trigger('change');
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
					$cur.attr('title', '已选择('+check_count+'/'+total+')');
					$cur.trigger('check_change', {count:check_count, total:total});
				};

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
			$chk_list.add($cur).parent().each(function(){
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