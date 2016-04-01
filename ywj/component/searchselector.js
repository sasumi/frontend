/**
 * 支持搜索的下拉框
 * 依赖伪属性: select[rel=filter-selector]  select[rel=filter-selector-input]
 * 组件初始化数值会读取 data-value作为初始化数值
 * @deprecated 页面上的地区选择组件必须配对出现, 否则不给予初始化
 */
define('ywj/searchselector', function(require){
	var $ = require('jquery');
	var selector_style="<style style='text/style'>" +
		".search-select-td{width: 300px;border: 1px solid rgb(255, 195, 195);}"+
		".search-select-td select{border:none;width: 300px;}"+
		".search-select-td input{border:none;padding: 0px;width: 300px;border-bottom: dashed 1px #CCC;}"+
		".search_readonly{background:#eee; color:#ccc;}"+
		"</style>";
	$(function(){
		/**
		 * 节点过滤
		 * @param kw 关键字
		 * @param nodes 全部节点
		 * @returns {*}
		 */
		var filter_nodes=function(kw,nodes){
			var map={};
			if(!kw){
				return nodes;
			}
			for(var key in nodes){
				var name=nodes[key];
				if(name.toLowerCase().indexOf(kw.toLowerCase())!=-1){
					map[key]=name;
				}
			}
			return map;
		};
		/**
		 * 搜索
		 * @param $search 搜索框
		 * @param $selector 下拉框
		 * @param nodes 全部节点
		 * @param default_val 默认值
		 */
		var do_search=function($search,$selector,nodes,default_val){
			var kw=$search.val();
			var s=filter_nodes(kw,nodes);
			$selector.html("");
			for(var key in s){
				var op="<option value='"+key+"'>"+s[key]+"</option>";
				$selector.append(op);
			}
			choose_default($selector,default_val);
		};
		/**
		 * 选中默认值
		 * @param $selector 下拉框
		 * @param default_val 默认值
		 */
		var choose_default=function($selector,default_val){
			if(default_val){
				var $option=$selector.find("option[value="+default_val+"]");
				$option.attr("selected",true);
			}
		};
		/**
		 * 遍历
		 */
		$('*[rel=search-selector]').each(function(){
			$("head").append(selector_style);
			var $this=$(this);
			var name=$this.data("name");
			var nodes=$this.data("nodes");
			var choose=$this.data("value");
			var readonly=$this.data("readonly");
			var $search=$('<input placeholder="输入关键字" class="txt" rel="filter-selector-input"/>');
			var $selector=$('<select size="1" name="'+name+'" required="required" rel="filter-selector"></select>');
			$this.append($search)
			$this.append($selector);
			//初始化
			do_search($search,$selector,nodes);
			choose_default($selector,choose);
			$search.blur(function(){
				do_search($search,$selector,nodes,choose);
			});
			//是否readonly
			if(readonly){
				$.each(['mousedown', 'keydown', 'change'], function(k, v){
					$selector[v](function(){
						return false;
					});
				});
				$selector.addClass('search_readonly');
				$search.addClass('search_readonly');
				$search.attr("disabled",true);
			}

		});
	});
});