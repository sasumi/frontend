/**
 * Created by Administrator on 2016/7/8.
 */
define('temtop/rowcollapse', function(require){
	var $ = require('jquery');
	var NORMAL_CLASS = 'row-collapse-icon';
	var EXPAND_CLASS = 'row-collapse-icon-expand';
	var ALL_NORMAL_CLASS = 'row-collapse-all-icon';
	var ALL_EXPAND_CLASS = 'row-collapse-all-icon-expand';
	
	return {
		nodeInit: function($tbl, param){
			var $rows = $tbl.find('*[data-level]');

			var total_collapse = function(to_expand){
				var min_lv = 0;
				$rows.each(function(){
					if($(this).data('level') < min_lv){
						min_lv = $(this).data('level');
					}
				});
				$rows.each(function(){
					if($(this).data('level') == min_lv){
						toggle($(this), to_expand);
					}
				});
			};

			var is_child = function($row){
				var k = 0;
				var lv = $row.data('level');
				for(var i=0; i<$rows.size(); i++){
					if($rows[i] == $row[0]){
						k = i;
						break;
					}
				}
				if(!$rows[k+1] || $($rows[k+1]).data('level') <= lv){
					return true;
				}
				return false;
			};

			var loop_next = function($row, callback){
				var st = false;
				$rows.each(function(){
					if(st){
						return callback($(this));
					}
					if(this == $row[0]){
						st = true;
					}
				});
			};

			var find_sub_children = function($row){
				var lv = $row.data('level');
				var sub_lv;
				var children = [];
				loop_next($row, function($next){
					var next_lv = $next.data('level');
					if(next_lv <= lv){
						return false;
					}
					if(!sub_lv){
						sub_lv = next_lv;
					}
					if(next_lv == sub_lv){
						children.push($next);
					}
				});
				return children;
			};

			var row_expand = function($row){
				var $btn = $row.find('.'+NORMAL_CLASS+':first');
				return $btn.hasClass(EXPAND_CLASS);
			};

			var toggle = function($row, state){
				var to_expand = state === undefined ? !row_expand($row) : state;
				var children = find_sub_children($row);

				if(to_expand){
					$.each(children, function(){
						$(this).css('display', '');
					});
				} else {
					$.each(children, function(){
						$(this).css('display', 'none');
						//close sub
						if(!is_child($(this)) && row_expand($(this))){
							toggle($(this), false);
						}
					});
				}
				$row.find('.'+NORMAL_CLASS+':first')[to_expand ? 'addClass' : 'removeClass'](EXPAND_CLASS);
			};

			$tbl.find('.'+ALL_NORMAL_CLASS).click(function(){
				if($(this).hasClass(ALL_EXPAND_CLASS)){
					$(this).removeClass(ALL_EXPAND_CLASS);
					total_collapse(false);
				} else {
					$(this).addClass(ALL_EXPAND_CLASS);
					total_collapse(true);
				}
			});

			$rows.each(function(){
				var $row = $(this);
				var $btn = $row.find('.'+NORMAL_CLASS);
				if(is_child($row)){
					$btn.css('visibility', 'hidden');
				}
				$btn.click(function(){toggle($row);});
			});

			$tbl.trigger('RowCollapseInitFinish');
		}
	};
});