/**
 *
 */
define('ywj/addselect', function(require){
	require('ywj/resource/addselect.css');
	var $ = require('jquery');
	var Pop = require('ywj/popup');
	var Net = require('ywj/net');
	var Util = require('ywj/util');
	var INIT_FLAG = 1;
	var ADD_FLAG = '_ADD_OPTION_';

	var OPTION_CLASS = 'ywj-addselect-option';
	var group_option_list = {};
	
	/**
	 * 添加OPTION
	 */
	var add_option = function($sel,data){
		if(data == null || !data.hasOwnProperty('value')){
			return;
		}
		var data_json =  '';
		if(data["data-json"]){
			data_json = 'data-json="'+data["data-json"]+'"';
		}
		if(group_option_list.length>0 && (!data["option_list"] || data["option_list"].length==0)){
			data["option_list"] = group_option_list;
		}

		if(data["option_list"] && data["option_list"].length>0){
			group_option_list = data["option_list"];
			var last_value = '';
			var cur_data;
			//找到 所处的位置
			for(var i in group_option_list){
				if(group_option_list[i].value == data.value){
					cur_data = group_option_list[i];
					break;
				}
				last_value = group_option_list[i].value;
			}

			var html = '<option value="'+cur_data.value+'" '+data_json+'>'+cur_data.title+'</option>';
			if(last_value){
				$sel.find("option[value="+last_value+"]").after(html);
				return;
			}
			$sel.find('option:last').before(html);
			return;
		}
		var html = '<option value="'+data.value+'" '+data_json+'>'+data.title+'</option>';
		$sel.find('option:last').before(html);
	};

	/**
	 * 获取options
	 */
	var get_value_list = function($sel){
		var value_list = [];
		$sel.find('option').each(function(){
			if($(this).data('flag') === ADD_FLAG){
				return;
			}
			var tmp = {
				value:$(this).attr('value'),
				title:$(this).html()
			};
			value_list.push(tmp);
		});
		return value_list;
	};

	return {
		nodeInit: function($node, param){
			var last_val;
			last_val = $node.val();
			var ADD_SELECT_KEY_VALUE = param["option-value"] || '_ADD_SELECT_';
			var ADD_SELECT_KEY_NAME = param["option-name"] || '＋添加';

			var add_url = param["add-url"];
			var group_name = param["relate-group"] || '';
			var popup_width = param["popup-width"] || 600;
			var popup_title = param["popup-title"] || ADD_SELECT_KEY_NAME;
			if(!add_url){
				console.warn('NO ADD URL FOUND USING ADDSELECT COMPONENT');
				return;
			}

			//data-action 用于控制权限
			var option_html = '<option data-flag="'+ADD_FLAG+'" data-action="'+add_url+'" class="'+OPTION_CLASS+'" value="'+ADD_SELECT_KEY_VALUE+'">'+ADD_SELECT_KEY_NAME+'</option>';
			//加添加入口
			$node.append(option_html);

			$node.change(function(e){
				var v = $(this).val();
				if(v === ADD_SELECT_KEY_VALUE){
					//阻止 node的其他change 事件handler的执行
					e.stopImmediatePropagation();
					var url = Net.mergeCgiUri(add_url,{onresponse:'add_select',ref:'iframe'});

					Pop.showPopInTop({
						width: popup_width,
						title: popup_title,
						content: {src:url}
					}, function(p){
						p.listen('onSuccess', function(data){
							if(data == null || !data.hasOwnProperty('value')){
								return;
							}
							var option_data = data;
							add_option($node,option_data);
							last_val = option_data.value;
							$node.val(last_val);
							$node.trigger('change');

							if(group_name){
								$(group_name).each(function(){
									//process other group children;
									var $sel = $(this);
									if($sel.is($node)){
										return;
									}
									add_option($sel,option_data);
								});
							}
						});
					});

					$node.val(last_val);
					return false;
				}
				last_val = v;
			});

			//调整当前的change 方法为最高级别
			var array = $._data($node[0],'events').change;
			var item = array.pop();
			array.unshift(item);
			$._data($node[0],'events').change = array;


			$node.data('node-init',INIT_FLAG);

			//检测当前options空，且有group，从其他group成员复制option过来。
			if(group_name){
				var value_list = get_value_list($node);
				var group_value_list = [];

				$(group_name).each(function(){
					var $sel = $(this);
					if($sel.is($node)){
						return;
					}
					if($sel.data('node-init') !== INIT_FLAG){
						return;
					}
					if(group_value_list.length){
						return;
					}
					group_value_list = get_value_list($sel);
				});

				if(group_value_list.length > value_list.length){
					//找到差异的option
					var diff = [];
					var tmp = {};
					for(var i in value_list ){
						tmp[''+value_list[i].value+''] = 1;
					}
					for(var j in group_value_list ){
						if(!tmp.hasOwnProperty(group_value_list[j].value)){
							diff.push(group_value_list[j]);
						}
					}
					for(var k in diff){
						add_option($node,diff[k]);
					}
				}
			}
		}
	};
});