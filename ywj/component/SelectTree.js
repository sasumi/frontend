/**
 * Created by Sasumi on 2016/3/16.
 */
define('ywj/SelectTree', function(require){
	require('ywj/resource/selecttree.css');
	var $ = require('jquery');
	var Util = require('ywj/util');
	var INIT_DISPLAY_COUNT = 15;

	//tree_data demo
	/**
	var td = [
		{value:1, text:'1', children:[
			{value:1, text:'1', children:[]},
			{value:1, text:'1', children:[]},
			{value:1, text:'1', children:[]}
		]},
		{value:1, text:'1', children:[]},
		{value:1, text:'1', children:[]}
	];
	 **/

	var convert_tree = function(list){
		var last_item = {__id__:0, level:-1};
		var findById = function(list, id){
			for(var i in list){
				if(list[i].__id__ == id){
					return list[i];
				}
			}
			return null;
		};
		$.each(list, function(k, item){
			item.__id__ = Util.guid();
			if(item.level > last_item.level){
				item.__pid__ = last_item.__id__;
			} else if(item.level < last_item.level){
				item.__pid__ = findById(list, last_item.__pid__).__pid__;
			} else {
				item.__pid__ = last_item.__pid__;
			}
			last_item = item;
		});

		function array_filter_subtree(pid, all, group_by_parents){
			group_by_parents = (group_by_parents && group_by_parents.length) ? group_by_parents : Util.arrayGroup(all, '__pid__');

			var result = [];
			$.each(all, function(k, item){
				if(item.__pid__ == pid){
					if(group_by_parents[item.__id__]){
						var cs = array_filter_subtree(item.__id__, all, group_by_parents);
						if(cs && cs.length){
							item.children = cs;
						}
					}
					result.push(item);
				}
			});
			return result;
		}
		var d= array_filter_subtree(0, list);
		console.log('tree:',d);
		return d;
	};

	return {
		nodeInit: function(sel){
			var $sel = $(sel);
			if($sel.attr('readonly') || $sel.attr('disabled')){
				return;
			}

			var data = [];
			var level_count = [0,0,0,0,0,0];
			$sel.children().each(function(){
				var lvl = parseInt($(this).data('tree-level'), 10) || 0;
				data.push({
					value: this.value,
					text: this.text,
					level: lvl
				});
				level_count[lvl] += 1;
			});

			//calc initialize display tree level
			console.log(level_count);
			var t = 0, init_expand_level = 0;
			for(var i=0; i<level_count.length; i++){
				if(t + level_count[i] > INIT_DISPLAY_COUNT){
					break;
				}
				init_expand_level = i;
			}

			var tree_data = convert_tree(data);
			var show_nodes = function(list, no_ul){
				var html = '';
				if(list && list.length){
					html += no_ul ? '' : '<ul>';
					$.each(list, function(k, item){
						var cls = item.children && item.children.length ? 'has-child':'';
						html += '<li class="'+cls + (item.level < init_expand_level ? ' expand' : '')+'">';
						html += '<span class="ti" data-val="'+item.value+'" tabindex="0">'+item.text+'</span>';
						html += (item.children && item.children.length) ? '<s></s>':'';
						html += show_nodes(item.children);
						html += '</li>';
					});
					html += no_ul ? '' : '</ul>';
				}
				return html;
			};

			var min_width = $sel.outerWidth() + 'px';
			var $panel = $('<ul class="select-tree" style="display:none; min-width:'+min_width+'">'+show_nodes(tree_data, true)+'</ul>').appendTo('body');

			//init select state
			var $current = $panel.find('.ti').eq($sel[0].selectedIndex);
			$current.closest('li').addClass('active').parents('li').addClass('expand');

			$sel.on('mousedown focus', function(){
				$panel.css({
					top: $sel.offset().top + $sel.outerHeight(),
					left: $sel.offset().left
				}).show();
				return false;
			});
			$sel.on('keydown', function(e){
				if(e.keyCode == Util.KEYS.TAB){
					$panel.hide();
				}
			});
			$('body').mousedown(function(e){
				var target = e.target;
				if(target == $sel[0] || target == $panel[0] || $.contains($panel[0], target)){
				} else {
					$panel.hide();
				}
			});
			$panel.delegate('s', 'click', function(){
				var $li = $(this).closest('li').toggleClass('expand');
				if(!$li.hasClass('expand')){
					$li.find('li').removeClass('expand');
				}
			});
			$panel.delegate('.ti', 'click', function(){
				$panel.find('.active').removeClass('active');
				$(this).closest('li').addClass('active');
				$sel[0].selectedIndex = $panel.find('.ti').index(this);
				$($sel[0]).trigger('onselected');
				$panel.hide();
			});
		}
	}
});