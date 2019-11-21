//../src/component/addselect.js
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
//../src/component/areaselector.js
/**
 * 地区选择组件
 * 依赖伪属性: select[rel=province-selector]  select[rel=city-selector]  select[rel=county-selector]
 * 组件初始化数值会读取 data-value作为初始化数值
 * @deprecated 页面上的地区选择组件必须配对出现, 否则不给予初始化
 */
define('ywj/areaselector', function(require){
	var $ = require('jquery');
	var area_list = {"110000":{"area_id":"110000","parent_id":"0","area_name":"\u5317\u4eac\u5e02"},"110100":{"area_id":"110100","parent_id":"110000","area_name":"\u5317\u4eac\u5e02\u5e02\u8f96\u533a"},"110101":{"area_id":"110101","parent_id":"110100","area_name":"\u4e1c\u57ce\u533a"},"110102":{"area_id":"110102","parent_id":"110100","area_name":"\u897f\u57ce\u533a"},"110105":{"area_id":"110105","parent_id":"110100","area_name":"\u671d\u9633\u533a"},"110106":{"area_id":"110106","parent_id":"110100","area_name":"\u4e30\u53f0\u533a"},"110107":{"area_id":"110107","parent_id":"110100","area_name":"\u77f3\u666f\u5c71\u533a"},"110108":{"area_id":"110108","parent_id":"110100","area_name":"\u6d77\u6dc0\u533a"},"110109":{"area_id":"110109","parent_id":"110100","area_name":"\u95e8\u5934\u6c9f\u533a"},"110111":{"area_id":"110111","parent_id":"110100","area_name":"\u623f\u5c71\u533a"},"110112":{"area_id":"110112","parent_id":"110100","area_name":"\u901a\u5dde\u533a"},"110113":{"area_id":"110113","parent_id":"110100","area_name":"\u987a\u4e49\u533a"},"110114":{"area_id":"110114","parent_id":"110100","area_name":"\u660c\u5e73\u533a"},"110115":{"area_id":"110115","parent_id":"110100","area_name":"\u5927\u5174\u533a"},"110116":{"area_id":"110116","parent_id":"110100","area_name":"\u6000\u67d4\u533a"},"110117":{"area_id":"110117","parent_id":"110100","area_name":"\u5e73\u8c37\u533a"},"110200":{"area_id":"110200","parent_id":"110000","area_name":"\u5317\u4eac\u5e02\u53bf\u8f96\u533a"},"110228":{"area_id":"110228","parent_id":"110200","area_name":"\u5bc6\u4e91\u53bf"},"110229":{"area_id":"110229","parent_id":"110200","area_name":"\u5ef6\u5e86\u53bf"},"120000":{"area_id":"120000","parent_id":"0","area_name":"\u5929\u6d25\u5e02"},"120100":{"area_id":"120100","parent_id":"120000","area_name":"\u5929\u6d25\u5e02\u5e02\u8f96\u533a"},"120101":{"area_id":"120101","parent_id":"120100","area_name":"\u548c\u5e73\u533a"},"120102":{"area_id":"120102","parent_id":"120100","area_name":"\u6cb3\u4e1c\u533a"},"120103":{"area_id":"120103","parent_id":"120100","area_name":"\u6cb3\u897f\u533a"},"120104":{"area_id":"120104","parent_id":"120100","area_name":"\u5357\u5f00\u533a"},"120105":{"area_id":"120105","parent_id":"120100","area_name":"\u6cb3\u5317\u533a"},"120106":{"area_id":"120106","parent_id":"120100","area_name":"\u7ea2\u6865\u533a"},"120110":{"area_id":"120110","parent_id":"120100","area_name":"\u4e1c\u4e3d\u533a"},"120111":{"area_id":"120111","parent_id":"120100","area_name":"\u897f\u9752\u533a"},"120112":{"area_id":"120112","parent_id":"120100","area_name":"\u6d25\u5357\u533a"},"120113":{"area_id":"120113","parent_id":"120100","area_name":"\u5317\u8fb0\u533a"},"120114":{"area_id":"120114","parent_id":"120100","area_name":"\u6b66\u6e05\u533a"},"120115":{"area_id":"120115","parent_id":"120100","area_name":"\u5b9d\u577b\u533a"},"120116":{"area_id":"120116","parent_id":"120100","area_name":"\u6ee8\u6d77\u65b0\u533a"},"120200":{"area_id":"120200","parent_id":"120000","area_name":"\u5929\u6d25\u5e02\u53bf\u8f96\u533a"},"120221":{"area_id":"120221","parent_id":"120200","area_name":"\u5b81\u6cb3\u53bf"},"120223":{"area_id":"120223","parent_id":"120200","area_name":"\u9759\u6d77\u53bf"},"120225":{"area_id":"120225","parent_id":"120200","area_name":"\u84df\u53bf"},"130000":{"area_id":"130000","parent_id":"0","area_name":"\u6cb3\u5317\u7701"},"130100":{"area_id":"130100","parent_id":"130000","area_name":"\u77f3\u5bb6\u5e84\u5e02"},"130101":{"area_id":"130101","parent_id":"130100","area_name":"\u77f3\u5bb6\u5e84\u5e02\u5e02\u8f96\u533a"},"130102":{"area_id":"130102","parent_id":"130100","area_name":"\u957f\u5b89\u533a"},"130103":{"area_id":"130103","parent_id":"130100","area_name":"\u6865\u4e1c\u533a"},"130104":{"area_id":"130104","parent_id":"130100","area_name":"\u6865\u897f\u533a"},"130105":{"area_id":"130105","parent_id":"130100","area_name":"\u65b0\u534e\u533a"},"130107":{"area_id":"130107","parent_id":"130100","area_name":"\u4e95\u9649\u77ff\u533a"},"130108":{"area_id":"130108","parent_id":"130100","area_name":"\u88d5\u534e\u533a"},"130121":{"area_id":"130121","parent_id":"130100","area_name":"\u4e95\u9649\u53bf"},"130123":{"area_id":"130123","parent_id":"130100","area_name":"\u6b63\u5b9a\u53bf"},"130124":{"area_id":"130124","parent_id":"130100","area_name":"\u683e\u57ce\u53bf"},"130125":{"area_id":"130125","parent_id":"130100","area_name":"\u884c\u5510\u53bf"},"130126":{"area_id":"130126","parent_id":"130100","area_name":"\u7075\u5bff\u53bf"},"130127":{"area_id":"130127","parent_id":"130100","area_name":"\u9ad8\u9091\u53bf"},"130128":{"area_id":"130128","parent_id":"130100","area_name":"\u6df1\u6cfd\u53bf"},"130129":{"area_id":"130129","parent_id":"130100","area_name":"\u8d5e\u7687\u53bf"},"130130":{"area_id":"130130","parent_id":"130100","area_name":"\u65e0\u6781\u53bf"},"130131":{"area_id":"130131","parent_id":"130100","area_name":"\u5e73\u5c71\u53bf"},"130132":{"area_id":"130132","parent_id":"130100","area_name":"\u5143\u6c0f\u53bf"},"130133":{"area_id":"130133","parent_id":"130100","area_name":"\u8d75\u53bf"},"130181":{"area_id":"130181","parent_id":"130100","area_name":"\u8f9b\u96c6\u5e02"},"130182":{"area_id":"130182","parent_id":"130100","area_name":"\u85c1\u57ce\u5e02"},"130183":{"area_id":"130183","parent_id":"130100","area_name":"\u664b\u5dde\u5e02"},"130184":{"area_id":"130184","parent_id":"130100","area_name":"\u65b0\u4e50\u5e02"},"130185":{"area_id":"130185","parent_id":"130100","area_name":"\u9e7f\u6cc9\u5e02"},"130200":{"area_id":"130200","parent_id":"130000","area_name":"\u5510\u5c71\u5e02"},"130201":{"area_id":"130201","parent_id":"130200","area_name":"\u5510\u5c71\u5e02\u5e02\u8f96\u533a"},"130202":{"area_id":"130202","parent_id":"130200","area_name":"\u8def\u5357\u533a"},"130203":{"area_id":"130203","parent_id":"130200","area_name":"\u8def\u5317\u533a"},"130204":{"area_id":"130204","parent_id":"130200","area_name":"\u53e4\u51b6\u533a"},"130205":{"area_id":"130205","parent_id":"130200","area_name":"\u5f00\u5e73\u533a"},"130207":{"area_id":"130207","parent_id":"130200","area_name":"\u4e30\u5357\u533a"},"130208":{"area_id":"130208","parent_id":"130200","area_name":"\u4e30\u6da6\u533a"},"130209":{"area_id":"130209","parent_id":"130200","area_name":"\u66f9\u5983\u7538\u533a"},"130223":{"area_id":"130223","parent_id":"130200","area_name":"\u6ee6\u53bf"},"130224":{"area_id":"130224","parent_id":"130200","area_name":"\u6ee6\u5357\u53bf"},"130225":{"area_id":"130225","parent_id":"130200","area_name":"\u4e50\u4ead\u53bf"},"130227":{"area_id":"130227","parent_id":"130200","area_name":"\u8fc1\u897f\u53bf"},"130229":{"area_id":"130229","parent_id":"130200","area_name":"\u7389\u7530\u53bf"},"130281":{"area_id":"130281","parent_id":"130200","area_name":"\u9075\u5316\u5e02"},"130283":{"area_id":"130283","parent_id":"130200","area_name":"\u8fc1\u5b89\u5e02"},"130300":{"area_id":"130300","parent_id":"130000","area_name":"\u79e6\u7687\u5c9b\u5e02"},"130301":{"area_id":"130301","parent_id":"130300","area_name":"\u79e6\u7687\u5c9b\u5e02\u5e02\u8f96\u533a"},"130302":{"area_id":"130302","parent_id":"130300","area_name":"\u6d77\u6e2f\u533a"},"130303":{"area_id":"130303","parent_id":"130300","area_name":"\u5c71\u6d77\u5173\u533a"},"130304":{"area_id":"130304","parent_id":"130300","area_name":"\u5317\u6234\u6cb3\u533a"},"130321":{"area_id":"130321","parent_id":"130300","area_name":"\u9752\u9f99\u6ee1\u65cf\u81ea\u6cbb\u53bf"},"130322":{"area_id":"130322","parent_id":"130300","area_name":"\u660c\u9ece\u53bf"},"130323":{"area_id":"130323","parent_id":"130300","area_name":"\u629a\u5b81\u53bf"},"130324":{"area_id":"130324","parent_id":"130300","area_name":"\u5362\u9f99\u53bf"},"130400":{"area_id":"130400","parent_id":"130000","area_name":"\u90af\u90f8\u5e02"},"130401":{"area_id":"130401","parent_id":"130400","area_name":"\u90af\u90f8\u5e02\u5e02\u8f96\u533a"},"130402":{"area_id":"130402","parent_id":"130400","area_name":"\u90af\u5c71\u533a"},"130403":{"area_id":"130403","parent_id":"130400","area_name":"\u4e1b\u53f0\u533a"},"130404":{"area_id":"130404","parent_id":"130400","area_name":"\u590d\u5174\u533a"},"130406":{"area_id":"130406","parent_id":"130400","area_name":"\u5cf0\u5cf0\u77ff\u533a"},"130421":{"area_id":"130421","parent_id":"130400","area_name":"\u90af\u90f8\u53bf"},"130423":{"area_id":"130423","parent_id":"130400","area_name":"\u4e34\u6f33\u53bf"},"130424":{"area_id":"130424","parent_id":"130400","area_name":"\u6210\u5b89\u53bf"},"130425":{"area_id":"130425","parent_id":"130400","area_name":"\u5927\u540d\u53bf"},"130426":{"area_id":"130426","parent_id":"130400","area_name":"\u6d89\u53bf"},"130427":{"area_id":"130427","parent_id":"130400","area_name":"\u78c1\u53bf"},"130428":{"area_id":"130428","parent_id":"130400","area_name":"\u80a5\u4e61\u53bf"},"130429":{"area_id":"130429","parent_id":"130400","area_name":"\u6c38\u5e74\u53bf"},"130430":{"area_id":"130430","parent_id":"130400","area_name":"\u90b1\u53bf"},"130431":{"area_id":"130431","parent_id":"130400","area_name":"\u9e21\u6cfd\u53bf"},"130432":{"area_id":"130432","parent_id":"130400","area_name":"\u5e7f\u5e73\u53bf"},"130433":{"area_id":"130433","parent_id":"130400","area_name":"\u9986\u9676\u53bf"},"130434":{"area_id":"130434","parent_id":"130400","area_name":"\u9b4f\u53bf"},"130435":{"area_id":"130435","parent_id":"130400","area_name":"\u66f2\u5468\u53bf"},"130481":{"area_id":"130481","parent_id":"130400","area_name":"\u6b66\u5b89\u5e02"},"130500":{"area_id":"130500","parent_id":"130000","area_name":"\u90a2\u53f0\u5e02"},"130501":{"area_id":"130501","parent_id":"130500","area_name":"\u90a2\u53f0\u5e02\u5e02\u8f96\u533a"},"130502":{"area_id":"130502","parent_id":"130500","area_name":"\u6865\u4e1c\u533a"},"130503":{"area_id":"130503","parent_id":"130500","area_name":"\u6865\u897f\u533a"},"130521":{"area_id":"130521","parent_id":"130500","area_name":"\u90a2\u53f0\u53bf"},"130522":{"area_id":"130522","parent_id":"130500","area_name":"\u4e34\u57ce\u53bf"},"130523":{"area_id":"130523","parent_id":"130500","area_name":"\u5185\u4e18\u53bf"},"130524":{"area_id":"130524","parent_id":"130500","area_name":"\u67cf\u4e61\u53bf"},"130525":{"area_id":"130525","parent_id":"130500","area_name":"\u9686\u5c27\u53bf"},"130526":{"area_id":"130526","parent_id":"130500","area_name":"\u4efb\u53bf"},"130527":{"area_id":"130527","parent_id":"130500","area_name":"\u5357\u548c\u53bf"},"130528":{"area_id":"130528","parent_id":"130500","area_name":"\u5b81\u664b\u53bf"},"130529":{"area_id":"130529","parent_id":"130500","area_name":"\u5de8\u9e7f\u53bf"},"130530":{"area_id":"130530","parent_id":"130500","area_name":"\u65b0\u6cb3\u53bf"},"130531":{"area_id":"130531","parent_id":"130500","area_name":"\u5e7f\u5b97\u53bf"},"130532":{"area_id":"130532","parent_id":"130500","area_name":"\u5e73\u4e61\u53bf"},"130533":{"area_id":"130533","parent_id":"130500","area_name":"\u5a01\u53bf"},"130534":{"area_id":"130534","parent_id":"130500","area_name":"\u6e05\u6cb3\u53bf"},"130535":{"area_id":"130535","parent_id":"130500","area_name":"\u4e34\u897f\u53bf"},"130581":{"area_id":"130581","parent_id":"130500","area_name":"\u5357\u5bab\u5e02"},"130582":{"area_id":"130582","parent_id":"130500","area_name":"\u6c99\u6cb3\u5e02"},"130600":{"area_id":"130600","parent_id":"130000","area_name":"\u4fdd\u5b9a\u5e02"},"130601":{"area_id":"130601","parent_id":"130600","area_name":"\u4fdd\u5b9a\u5e02\u5e02\u8f96\u533a"},"130602":{"area_id":"130602","parent_id":"130600","area_name":"\u65b0\u5e02\u533a"},"130603":{"area_id":"130603","parent_id":"130600","area_name":"\u5317\u5e02\u533a"},"130604":{"area_id":"130604","parent_id":"130600","area_name":"\u5357\u5e02\u533a"},"130621":{"area_id":"130621","parent_id":"130600","area_name":"\u6ee1\u57ce\u53bf"},"130622":{"area_id":"130622","parent_id":"130600","area_name":"\u6e05\u82d1\u53bf"},"130623":{"area_id":"130623","parent_id":"130600","area_name":"\u6d9e\u6c34\u53bf"},"130624":{"area_id":"130624","parent_id":"130600","area_name":"\u961c\u5e73\u53bf"},"130625":{"area_id":"130625","parent_id":"130600","area_name":"\u5f90\u6c34\u53bf"},"130626":{"area_id":"130626","parent_id":"130600","area_name":"\u5b9a\u5174\u53bf"},"130627":{"area_id":"130627","parent_id":"130600","area_name":"\u5510\u53bf"},"130628":{"area_id":"130628","parent_id":"130600","area_name":"\u9ad8\u9633\u53bf"},"130629":{"area_id":"130629","parent_id":"130600","area_name":"\u5bb9\u57ce\u53bf"},"130630":{"area_id":"130630","parent_id":"130600","area_name":"\u6d9e\u6e90\u53bf"},"130631":{"area_id":"130631","parent_id":"130600","area_name":"\u671b\u90fd\u53bf"},"130632":{"area_id":"130632","parent_id":"130600","area_name":"\u5b89\u65b0\u53bf"},"130633":{"area_id":"130633","parent_id":"130600","area_name":"\u6613\u53bf"},"130634":{"area_id":"130634","parent_id":"130600","area_name":"\u66f2\u9633\u53bf"},"130635":{"area_id":"130635","parent_id":"130600","area_name":"\u8821\u53bf"},"130636":{"area_id":"130636","parent_id":"130600","area_name":"\u987a\u5e73\u53bf"},"130637":{"area_id":"130637","parent_id":"130600","area_name":"\u535a\u91ce\u53bf"},"130638":{"area_id":"130638","parent_id":"130600","area_name":"\u96c4\u53bf"},"130681":{"area_id":"130681","parent_id":"130600","area_name":"\u6dbf\u5dde\u5e02"},"130682":{"area_id":"130682","parent_id":"130600","area_name":"\u5b9a\u5dde\u5e02"},"130683":{"area_id":"130683","parent_id":"130600","area_name":"\u5b89\u56fd\u5e02"},"130684":{"area_id":"130684","parent_id":"130600","area_name":"\u9ad8\u7891\u5e97\u5e02"},"130700":{"area_id":"130700","parent_id":"130000","area_name":"\u5f20\u5bb6\u53e3\u5e02"},"130701":{"area_id":"130701","parent_id":"130700","area_name":"\u5f20\u5bb6\u53e3\u5e02\u5e02\u8f96\u533a"},"130702":{"area_id":"130702","parent_id":"130700","area_name":"\u6865\u4e1c\u533a"},"130703":{"area_id":"130703","parent_id":"130700","area_name":"\u6865\u897f\u533a"},"130705":{"area_id":"130705","parent_id":"130700","area_name":"\u5ba3\u5316\u533a"},"130706":{"area_id":"130706","parent_id":"130700","area_name":"\u4e0b\u82b1\u56ed\u533a"},"130721":{"area_id":"130721","parent_id":"130700","area_name":"\u5ba3\u5316\u53bf"},"130722":{"area_id":"130722","parent_id":"130700","area_name":"\u5f20\u5317\u53bf"},"130723":{"area_id":"130723","parent_id":"130700","area_name":"\u5eb7\u4fdd\u53bf"},"130724":{"area_id":"130724","parent_id":"130700","area_name":"\u6cbd\u6e90\u53bf"},"130725":{"area_id":"130725","parent_id":"130700","area_name":"\u5c1a\u4e49\u53bf"},"130726":{"area_id":"130726","parent_id":"130700","area_name":"\u851a\u53bf"},"130727":{"area_id":"130727","parent_id":"130700","area_name":"\u9633\u539f\u53bf"},"130728":{"area_id":"130728","parent_id":"130700","area_name":"\u6000\u5b89\u53bf"},"130729":{"area_id":"130729","parent_id":"130700","area_name":"\u4e07\u5168\u53bf"},"130730":{"area_id":"130730","parent_id":"130700","area_name":"\u6000\u6765\u53bf"},"130731":{"area_id":"130731","parent_id":"130700","area_name":"\u6dbf\u9e7f\u53bf"},"130732":{"area_id":"130732","parent_id":"130700","area_name":"\u8d64\u57ce\u53bf"},"130733":{"area_id":"130733","parent_id":"130700","area_name":"\u5d07\u793c\u53bf"},"130800":{"area_id":"130800","parent_id":"130000","area_name":"\u627f\u5fb7\u5e02"},"130801":{"area_id":"130801","parent_id":"130800","area_name":"\u627f\u5fb7\u5e02\u5e02\u8f96\u533a"},"130802":{"area_id":"130802","parent_id":"130800","area_name":"\u53cc\u6865\u533a"},"130803":{"area_id":"130803","parent_id":"130800","area_name":"\u53cc\u6ee6\u533a"},"130804":{"area_id":"130804","parent_id":"130800","area_name":"\u9e70\u624b\u8425\u5b50\u77ff\u533a"},"130821":{"area_id":"130821","parent_id":"130800","area_name":"\u627f\u5fb7\u53bf"},"130822":{"area_id":"130822","parent_id":"130800","area_name":"\u5174\u9686\u53bf"},"130823":{"area_id":"130823","parent_id":"130800","area_name":"\u5e73\u6cc9\u53bf"},"130824":{"area_id":"130824","parent_id":"130800","area_name":"\u6ee6\u5e73\u53bf"},"130825":{"area_id":"130825","parent_id":"130800","area_name":"\u9686\u5316\u53bf"},"130826":{"area_id":"130826","parent_id":"130800","area_name":"\u4e30\u5b81\u6ee1\u65cf\u81ea\u6cbb\u53bf"},"130827":{"area_id":"130827","parent_id":"130800","area_name":"\u5bbd\u57ce\u6ee1\u65cf\u81ea\u6cbb\u53bf"},"130828":{"area_id":"130828","parent_id":"130800","area_name":"\u56f4\u573a\u6ee1\u65cf\u8499\u53e4\u65cf\u81ea\u6cbb\u53bf"},"130900":{"area_id":"130900","parent_id":"130000","area_name":"\u6ca7\u5dde\u5e02"},"130901":{"area_id":"130901","parent_id":"130900","area_name":"\u6ca7\u5dde\u5e02\u5e02\u8f96\u533a"},"130902":{"area_id":"130902","parent_id":"130900","area_name":"\u65b0\u534e\u533a"},"130903":{"area_id":"130903","parent_id":"130900","area_name":"\u8fd0\u6cb3\u533a"},"130921":{"area_id":"130921","parent_id":"130900","area_name":"\u6ca7\u53bf"},"130922":{"area_id":"130922","parent_id":"130900","area_name":"\u9752\u53bf"},"130923":{"area_id":"130923","parent_id":"130900","area_name":"\u4e1c\u5149\u53bf"},"130924":{"area_id":"130924","parent_id":"130900","area_name":"\u6d77\u5174\u53bf"},"130925":{"area_id":"130925","parent_id":"130900","area_name":"\u76d0\u5c71\u53bf"},"130926":{"area_id":"130926","parent_id":"130900","area_name":"\u8083\u5b81\u53bf"},"130927":{"area_id":"130927","parent_id":"130900","area_name":"\u5357\u76ae\u53bf"},"130928":{"area_id":"130928","parent_id":"130900","area_name":"\u5434\u6865\u53bf"},"130929":{"area_id":"130929","parent_id":"130900","area_name":"\u732e\u53bf"},"130930":{"area_id":"130930","parent_id":"130900","area_name":"\u5b5f\u6751\u56de\u65cf\u81ea\u6cbb\u53bf"},"130981":{"area_id":"130981","parent_id":"130900","area_name":"\u6cca\u5934\u5e02"},"130982":{"area_id":"130982","parent_id":"130900","area_name":"\u4efb\u4e18\u5e02"},"130983":{"area_id":"130983","parent_id":"130900","area_name":"\u9ec4\u9a85\u5e02"},"130984":{"area_id":"130984","parent_id":"130900","area_name":"\u6cb3\u95f4\u5e02"},"131000":{"area_id":"131000","parent_id":"130000","area_name":"\u5eca\u574a\u5e02"},"131001":{"area_id":"131001","parent_id":"131000","area_name":"\u5eca\u574a\u5e02\u5e02\u8f96\u533a"},"131002":{"area_id":"131002","parent_id":"131000","area_name":"\u5b89\u6b21\u533a"},"131003":{"area_id":"131003","parent_id":"131000","area_name":"\u5e7f\u9633\u533a"},"131022":{"area_id":"131022","parent_id":"131000","area_name":"\u56fa\u5b89\u53bf"},"131023":{"area_id":"131023","parent_id":"131000","area_name":"\u6c38\u6e05\u53bf"},"131024":{"area_id":"131024","parent_id":"131000","area_name":"\u9999\u6cb3\u53bf"},"131025":{"area_id":"131025","parent_id":"131000","area_name":"\u5927\u57ce\u53bf"},"131026":{"area_id":"131026","parent_id":"131000","area_name":"\u6587\u5b89\u53bf"},"131028":{"area_id":"131028","parent_id":"131000","area_name":"\u5927\u5382\u56de\u65cf\u81ea\u6cbb\u53bf"},"131081":{"area_id":"131081","parent_id":"131000","area_name":"\u9738\u5dde\u5e02"},"131082":{"area_id":"131082","parent_id":"131000","area_name":"\u4e09\u6cb3\u5e02"},"131100":{"area_id":"131100","parent_id":"130000","area_name":"\u8861\u6c34\u5e02"},"131101":{"area_id":"131101","parent_id":"131100","area_name":"\u8861\u6c34\u5e02\u5e02\u8f96\u533a"},"131102":{"area_id":"131102","parent_id":"131100","area_name":"\u6843\u57ce\u533a"},"131121":{"area_id":"131121","parent_id":"131100","area_name":"\u67a3\u5f3a\u53bf"},"131122":{"area_id":"131122","parent_id":"131100","area_name":"\u6b66\u9091\u53bf"},"131123":{"area_id":"131123","parent_id":"131100","area_name":"\u6b66\u5f3a\u53bf"},"131124":{"area_id":"131124","parent_id":"131100","area_name":"\u9976\u9633\u53bf"},"131125":{"area_id":"131125","parent_id":"131100","area_name":"\u5b89\u5e73\u53bf"},"131126":{"area_id":"131126","parent_id":"131100","area_name":"\u6545\u57ce\u53bf"},"131127":{"area_id":"131127","parent_id":"131100","area_name":"\u666f\u53bf"},"131128":{"area_id":"131128","parent_id":"131100","area_name":"\u961c\u57ce\u53bf"},"131181":{"area_id":"131181","parent_id":"131100","area_name":"\u5180\u5dde\u5e02"},"131182":{"area_id":"131182","parent_id":"131100","area_name":"\u6df1\u5dde\u5e02"},"140000":{"area_id":"140000","parent_id":"0","area_name":"\u5c71\u897f\u7701"},"140100":{"area_id":"140100","parent_id":"140000","area_name":"\u592a\u539f\u5e02"},"140101":{"area_id":"140101","parent_id":"140100","area_name":"\u592a\u539f\u5e02\u5e02\u8f96\u533a"},"140105":{"area_id":"140105","parent_id":"140100","area_name":"\u5c0f\u5e97\u533a"},"140106":{"area_id":"140106","parent_id":"140100","area_name":"\u8fce\u6cfd\u533a"},"140107":{"area_id":"140107","parent_id":"140100","area_name":"\u674f\u82b1\u5cad\u533a"},"140108":{"area_id":"140108","parent_id":"140100","area_name":"\u5c16\u8349\u576a\u533a"},"140109":{"area_id":"140109","parent_id":"140100","area_name":"\u4e07\u67cf\u6797\u533a"},"140110":{"area_id":"140110","parent_id":"140100","area_name":"\u664b\u6e90\u533a"},"140121":{"area_id":"140121","parent_id":"140100","area_name":"\u6e05\u5f90\u53bf"},"140122":{"area_id":"140122","parent_id":"140100","area_name":"\u9633\u66f2\u53bf"},"140123":{"area_id":"140123","parent_id":"140100","area_name":"\u5a04\u70e6\u53bf"},"140181":{"area_id":"140181","parent_id":"140100","area_name":"\u53e4\u4ea4\u5e02"},"140200":{"area_id":"140200","parent_id":"140000","area_name":"\u5927\u540c\u5e02"},"140201":{"area_id":"140201","parent_id":"140200","area_name":"\u5927\u540c\u5e02\u5e02\u8f96\u533a"},"140202":{"area_id":"140202","parent_id":"140200","area_name":"\u57ce\u533a"},"140203":{"area_id":"140203","parent_id":"140200","area_name":"\u77ff\u533a"},"140211":{"area_id":"140211","parent_id":"140200","area_name":"\u5357\u90ca\u533a"},"140212":{"area_id":"140212","parent_id":"140200","area_name":"\u65b0\u8363\u533a"},"140221":{"area_id":"140221","parent_id":"140200","area_name":"\u9633\u9ad8\u53bf"},"140222":{"area_id":"140222","parent_id":"140200","area_name":"\u5929\u9547\u53bf"},"140223":{"area_id":"140223","parent_id":"140200","area_name":"\u5e7f\u7075\u53bf"},"140224":{"area_id":"140224","parent_id":"140200","area_name":"\u7075\u4e18\u53bf"},"140225":{"area_id":"140225","parent_id":"140200","area_name":"\u6d51\u6e90\u53bf"},"140226":{"area_id":"140226","parent_id":"140200","area_name":"\u5de6\u4e91\u53bf"},"140227":{"area_id":"140227","parent_id":"140200","area_name":"\u5927\u540c\u53bf"},"140300":{"area_id":"140300","parent_id":"140000","area_name":"\u9633\u6cc9\u5e02"},"140301":{"area_id":"140301","parent_id":"140300","area_name":"\u9633\u6cc9\u5e02\u5e02\u8f96\u533a"},"140302":{"area_id":"140302","parent_id":"140300","area_name":"\u57ce\u533a"},"140303":{"area_id":"140303","parent_id":"140300","area_name":"\u77ff\u533a"},"140311":{"area_id":"140311","parent_id":"140300","area_name":"\u90ca\u533a"},"140321":{"area_id":"140321","parent_id":"140300","area_name":"\u5e73\u5b9a\u53bf"},"140322":{"area_id":"140322","parent_id":"140300","area_name":"\u76c2\u53bf"},"140400":{"area_id":"140400","parent_id":"140000","area_name":"\u957f\u6cbb\u5e02"},"140401":{"area_id":"140401","parent_id":"140400","area_name":"\u957f\u6cbb\u5e02\u5e02\u8f96\u533a"},"140402":{"area_id":"140402","parent_id":"140400","area_name":"\u57ce\u533a"},"140411":{"area_id":"140411","parent_id":"140400","area_name":"\u90ca\u533a"},"140421":{"area_id":"140421","parent_id":"140400","area_name":"\u957f\u6cbb\u53bf"},"140423":{"area_id":"140423","parent_id":"140400","area_name":"\u8944\u57a3\u53bf"},"140424":{"area_id":"140424","parent_id":"140400","area_name":"\u5c6f\u7559\u53bf"},"140425":{"area_id":"140425","parent_id":"140400","area_name":"\u5e73\u987a\u53bf"},"140426":{"area_id":"140426","parent_id":"140400","area_name":"\u9ece\u57ce\u53bf"},"140427":{"area_id":"140427","parent_id":"140400","area_name":"\u58f6\u5173\u53bf"},"140428":{"area_id":"140428","parent_id":"140400","area_name":"\u957f\u5b50\u53bf"},"140429":{"area_id":"140429","parent_id":"140400","area_name":"\u6b66\u4e61\u53bf"},"140430":{"area_id":"140430","parent_id":"140400","area_name":"\u6c81\u53bf"},"140431":{"area_id":"140431","parent_id":"140400","area_name":"\u6c81\u6e90\u53bf"},"140481":{"area_id":"140481","parent_id":"140400","area_name":"\u6f5e\u57ce\u5e02"},"140500":{"area_id":"140500","parent_id":"140000","area_name":"\u664b\u57ce\u5e02"},"140501":{"area_id":"140501","parent_id":"140500","area_name":"\u664b\u57ce\u5e02\u5e02\u8f96\u533a"},"140502":{"area_id":"140502","parent_id":"140500","area_name":"\u57ce\u533a"},"140521":{"area_id":"140521","parent_id":"140500","area_name":"\u6c81\u6c34\u53bf"},"140522":{"area_id":"140522","parent_id":"140500","area_name":"\u9633\u57ce\u53bf"},"140524":{"area_id":"140524","parent_id":"140500","area_name":"\u9675\u5ddd\u53bf"},"140525":{"area_id":"140525","parent_id":"140500","area_name":"\u6cfd\u5dde\u53bf"},"140581":{"area_id":"140581","parent_id":"140500","area_name":"\u9ad8\u5e73\u5e02"},"140600":{"area_id":"140600","parent_id":"140000","area_name":"\u6714\u5dde\u5e02"},"140601":{"area_id":"140601","parent_id":"140600","area_name":"\u6714\u5dde\u5e02\u5e02\u8f96\u533a"},"140602":{"area_id":"140602","parent_id":"140600","area_name":"\u6714\u57ce\u533a"},"140603":{"area_id":"140603","parent_id":"140600","area_name":"\u5e73\u9c81\u533a"},"140621":{"area_id":"140621","parent_id":"140600","area_name":"\u5c71\u9634\u53bf"},"140622":{"area_id":"140622","parent_id":"140600","area_name":"\u5e94\u53bf"},"140623":{"area_id":"140623","parent_id":"140600","area_name":"\u53f3\u7389\u53bf"},"140624":{"area_id":"140624","parent_id":"140600","area_name":"\u6000\u4ec1\u53bf"},"140700":{"area_id":"140700","parent_id":"140000","area_name":"\u664b\u4e2d\u5e02"},"140701":{"area_id":"140701","parent_id":"140700","area_name":"\u664b\u4e2d\u5e02\u5e02\u8f96\u533a"},"140702":{"area_id":"140702","parent_id":"140700","area_name":"\u6986\u6b21\u533a"},"140721":{"area_id":"140721","parent_id":"140700","area_name":"\u6986\u793e\u53bf"},"140722":{"area_id":"140722","parent_id":"140700","area_name":"\u5de6\u6743\u53bf"},"140723":{"area_id":"140723","parent_id":"140700","area_name":"\u548c\u987a\u53bf"},"140724":{"area_id":"140724","parent_id":"140700","area_name":"\u6614\u9633\u53bf"},"140725":{"area_id":"140725","parent_id":"140700","area_name":"\u5bff\u9633\u53bf"},"140726":{"area_id":"140726","parent_id":"140700","area_name":"\u592a\u8c37\u53bf"},"140727":{"area_id":"140727","parent_id":"140700","area_name":"\u7941\u53bf"},"140728":{"area_id":"140728","parent_id":"140700","area_name":"\u5e73\u9065\u53bf"},"140729":{"area_id":"140729","parent_id":"140700","area_name":"\u7075\u77f3\u53bf"},"140781":{"area_id":"140781","parent_id":"140700","area_name":"\u4ecb\u4f11\u5e02"},"140800":{"area_id":"140800","parent_id":"140000","area_name":"\u8fd0\u57ce\u5e02"},"140801":{"area_id":"140801","parent_id":"140800","area_name":"\u8fd0\u57ce\u5e02\u5e02\u8f96\u533a"},"140802":{"area_id":"140802","parent_id":"140800","area_name":"\u76d0\u6e56\u533a"},"140821":{"area_id":"140821","parent_id":"140800","area_name":"\u4e34\u7317\u53bf"},"140822":{"area_id":"140822","parent_id":"140800","area_name":"\u4e07\u8363\u53bf"},"140823":{"area_id":"140823","parent_id":"140800","area_name":"\u95fb\u559c\u53bf"},"140824":{"area_id":"140824","parent_id":"140800","area_name":"\u7a37\u5c71\u53bf"},"140825":{"area_id":"140825","parent_id":"140800","area_name":"\u65b0\u7edb\u53bf"},"140826":{"area_id":"140826","parent_id":"140800","area_name":"\u7edb\u53bf"},"140827":{"area_id":"140827","parent_id":"140800","area_name":"\u57a3\u66f2\u53bf"},"140828":{"area_id":"140828","parent_id":"140800","area_name":"\u590f\u53bf"},"140829":{"area_id":"140829","parent_id":"140800","area_name":"\u5e73\u9646\u53bf"},"140830":{"area_id":"140830","parent_id":"140800","area_name":"\u82ae\u57ce\u53bf"},"140881":{"area_id":"140881","parent_id":"140800","area_name":"\u6c38\u6d4e\u5e02"},"140882":{"area_id":"140882","parent_id":"140800","area_name":"\u6cb3\u6d25\u5e02"},"140900":{"area_id":"140900","parent_id":"140000","area_name":"\u5ffb\u5dde\u5e02"},"140901":{"area_id":"140901","parent_id":"140900","area_name":"\u5ffb\u5dde\u5e02\u5e02\u8f96\u533a"},"140902":{"area_id":"140902","parent_id":"140900","area_name":"\u5ffb\u5e9c\u533a"},"140921":{"area_id":"140921","parent_id":"140900","area_name":"\u5b9a\u8944\u53bf"},"140922":{"area_id":"140922","parent_id":"140900","area_name":"\u4e94\u53f0\u53bf"},"140923":{"area_id":"140923","parent_id":"140900","area_name":"\u4ee3\u53bf"},"140924":{"area_id":"140924","parent_id":"140900","area_name":"\u7e41\u5cd9\u53bf"},"140925":{"area_id":"140925","parent_id":"140900","area_name":"\u5b81\u6b66\u53bf"},"140926":{"area_id":"140926","parent_id":"140900","area_name":"\u9759\u4e50\u53bf"},"140927":{"area_id":"140927","parent_id":"140900","area_name":"\u795e\u6c60\u53bf"},"140928":{"area_id":"140928","parent_id":"140900","area_name":"\u4e94\u5be8\u53bf"},"140929":{"area_id":"140929","parent_id":"140900","area_name":"\u5ca2\u5c9a\u53bf"},"140930":{"area_id":"140930","parent_id":"140900","area_name":"\u6cb3\u66f2\u53bf"},"140931":{"area_id":"140931","parent_id":"140900","area_name":"\u4fdd\u5fb7\u53bf"},"140932":{"area_id":"140932","parent_id":"140900","area_name":"\u504f\u5173\u53bf"},"140981":{"area_id":"140981","parent_id":"140900","area_name":"\u539f\u5e73\u5e02"},"141000":{"area_id":"141000","parent_id":"140000","area_name":"\u4e34\u6c7e\u5e02"},"141001":{"area_id":"141001","parent_id":"141000","area_name":"\u4e34\u6c7e\u5e02\u5e02\u8f96\u533a"},"141002":{"area_id":"141002","parent_id":"141000","area_name":"\u5c27\u90fd\u533a"},"141021":{"area_id":"141021","parent_id":"141000","area_name":"\u66f2\u6c83\u53bf"},"141022":{"area_id":"141022","parent_id":"141000","area_name":"\u7ffc\u57ce\u53bf"},"141023":{"area_id":"141023","parent_id":"141000","area_name":"\u8944\u6c7e\u53bf"},"141024":{"area_id":"141024","parent_id":"141000","area_name":"\u6d2a\u6d1e\u53bf"},"141025":{"area_id":"141025","parent_id":"141000","area_name":"\u53e4\u53bf"},"141026":{"area_id":"141026","parent_id":"141000","area_name":"\u5b89\u6cfd\u53bf"},"141027":{"area_id":"141027","parent_id":"141000","area_name":"\u6d6e\u5c71\u53bf"},"141028":{"area_id":"141028","parent_id":"141000","area_name":"\u5409\u53bf"},"141029":{"area_id":"141029","parent_id":"141000","area_name":"\u4e61\u5b81\u53bf"},"141030":{"area_id":"141030","parent_id":"141000","area_name":"\u5927\u5b81\u53bf"},"141031":{"area_id":"141031","parent_id":"141000","area_name":"\u96b0\u53bf"},"141032":{"area_id":"141032","parent_id":"141000","area_name":"\u6c38\u548c\u53bf"},"141033":{"area_id":"141033","parent_id":"141000","area_name":"\u84b2\u53bf"},"141034":{"area_id":"141034","parent_id":"141000","area_name":"\u6c7e\u897f\u53bf"},"141081":{"area_id":"141081","parent_id":"141000","area_name":"\u4faf\u9a6c\u5e02"},"141082":{"area_id":"141082","parent_id":"141000","area_name":"\u970d\u5dde\u5e02"},"141100":{"area_id":"141100","parent_id":"140000","area_name":"\u5415\u6881\u5e02"},"141101":{"area_id":"141101","parent_id":"141100","area_name":"\u5415\u6881\u5e02\u5e02\u8f96\u533a"},"141102":{"area_id":"141102","parent_id":"141100","area_name":"\u79bb\u77f3\u533a"},"141121":{"area_id":"141121","parent_id":"141100","area_name":"\u6587\u6c34\u53bf"},"141122":{"area_id":"141122","parent_id":"141100","area_name":"\u4ea4\u57ce\u53bf"},"141123":{"area_id":"141123","parent_id":"141100","area_name":"\u5174\u53bf"},"141124":{"area_id":"141124","parent_id":"141100","area_name":"\u4e34\u53bf"},"141125":{"area_id":"141125","parent_id":"141100","area_name":"\u67f3\u6797\u53bf"},"141126":{"area_id":"141126","parent_id":"141100","area_name":"\u77f3\u697c\u53bf"},"141127":{"area_id":"141127","parent_id":"141100","area_name":"\u5c9a\u53bf"},"141128":{"area_id":"141128","parent_id":"141100","area_name":"\u65b9\u5c71\u53bf"},"141129":{"area_id":"141129","parent_id":"141100","area_name":"\u4e2d\u9633\u53bf"},"141130":{"area_id":"141130","parent_id":"141100","area_name":"\u4ea4\u53e3\u53bf"},"141181":{"area_id":"141181","parent_id":"141100","area_name":"\u5b5d\u4e49\u5e02"},"141182":{"area_id":"141182","parent_id":"141100","area_name":"\u6c7e\u9633\u5e02"},"150000":{"area_id":"150000","parent_id":"0","area_name":"\u5185\u8499\u53e4\u81ea\u6cbb\u533a"},"150100":{"area_id":"150100","parent_id":"150000","area_name":"\u547c\u548c\u6d69\u7279\u5e02"},"150101":{"area_id":"150101","parent_id":"150100","area_name":"\u547c\u548c\u6d69\u7279\u5e02\u5e02\u8f96\u533a"},"150102":{"area_id":"150102","parent_id":"150100","area_name":"\u65b0\u57ce\u533a"},"150103":{"area_id":"150103","parent_id":"150100","area_name":"\u56de\u6c11\u533a"},"150104":{"area_id":"150104","parent_id":"150100","area_name":"\u7389\u6cc9\u533a"},"150105":{"area_id":"150105","parent_id":"150100","area_name":"\u8d5b\u7f55\u533a"},"150121":{"area_id":"150121","parent_id":"150100","area_name":"\u571f\u9ed8\u7279\u5de6\u65d7"},"150122":{"area_id":"150122","parent_id":"150100","area_name":"\u6258\u514b\u6258\u53bf"},"150123":{"area_id":"150123","parent_id":"150100","area_name":"\u548c\u6797\u683c\u5c14\u53bf"},"150124":{"area_id":"150124","parent_id":"150100","area_name":"\u6e05\u6c34\u6cb3\u53bf"},"150125":{"area_id":"150125","parent_id":"150100","area_name":"\u6b66\u5ddd\u53bf"},"150200":{"area_id":"150200","parent_id":"150000","area_name":"\u5305\u5934\u5e02"},"150201":{"area_id":"150201","parent_id":"150200","area_name":"\u5305\u5934\u5e02\u5e02\u8f96\u533a"},"150202":{"area_id":"150202","parent_id":"150200","area_name":"\u4e1c\u6cb3\u533a"},"150203":{"area_id":"150203","parent_id":"150200","area_name":"\u6606\u90fd\u4ed1\u533a"},"150204":{"area_id":"150204","parent_id":"150200","area_name":"\u9752\u5c71\u533a"},"150205":{"area_id":"150205","parent_id":"150200","area_name":"\u77f3\u62d0\u533a"},"150206":{"area_id":"150206","parent_id":"150200","area_name":"\u767d\u4e91\u9102\u535a\u77ff\u533a"},"150207":{"area_id":"150207","parent_id":"150200","area_name":"\u4e5d\u539f\u533a"},"150221":{"area_id":"150221","parent_id":"150200","area_name":"\u571f\u9ed8\u7279\u53f3\u65d7"},"150222":{"area_id":"150222","parent_id":"150200","area_name":"\u56fa\u9633\u53bf"},"150223":{"area_id":"150223","parent_id":"150200","area_name":"\u8fbe\u5c14\u7f55\u8302\u660e\u5b89\u8054\u5408\u65d7"},"150300":{"area_id":"150300","parent_id":"150000","area_name":"\u4e4c\u6d77\u5e02"},"150301":{"area_id":"150301","parent_id":"150300","area_name":"\u4e4c\u6d77\u5e02\u5e02\u8f96\u533a"},"150302":{"area_id":"150302","parent_id":"150300","area_name":"\u6d77\u52c3\u6e7e\u533a"},"150303":{"area_id":"150303","parent_id":"150300","area_name":"\u6d77\u5357\u533a"},"150304":{"area_id":"150304","parent_id":"150300","area_name":"\u4e4c\u8fbe\u533a"},"150400":{"area_id":"150400","parent_id":"150000","area_name":"\u8d64\u5cf0\u5e02"},"150401":{"area_id":"150401","parent_id":"150400","area_name":"\u8d64\u5cf0\u5e02\u5e02\u8f96\u533a"},"150402":{"area_id":"150402","parent_id":"150400","area_name":"\u7ea2\u5c71\u533a"},"150403":{"area_id":"150403","parent_id":"150400","area_name":"\u5143\u5b9d\u5c71\u533a"},"150404":{"area_id":"150404","parent_id":"150400","area_name":"\u677e\u5c71\u533a"},"150421":{"area_id":"150421","parent_id":"150400","area_name":"\u963f\u9c81\u79d1\u5c14\u6c81\u65d7"},"150422":{"area_id":"150422","parent_id":"150400","area_name":"\u5df4\u6797\u5de6\u65d7"},"150423":{"area_id":"150423","parent_id":"150400","area_name":"\u5df4\u6797\u53f3\u65d7"},"150424":{"area_id":"150424","parent_id":"150400","area_name":"\u6797\u897f\u53bf"},"150425":{"area_id":"150425","parent_id":"150400","area_name":"\u514b\u4ec0\u514b\u817e\u65d7"},"150426":{"area_id":"150426","parent_id":"150400","area_name":"\u7fc1\u725b\u7279\u65d7"},"150428":{"area_id":"150428","parent_id":"150400","area_name":"\u5580\u5587\u6c81\u65d7"},"150429":{"area_id":"150429","parent_id":"150400","area_name":"\u5b81\u57ce\u53bf"},"150430":{"area_id":"150430","parent_id":"150400","area_name":"\u6556\u6c49\u65d7"},"150500":{"area_id":"150500","parent_id":"150000","area_name":"\u901a\u8fbd\u5e02"},"150501":{"area_id":"150501","parent_id":"150500","area_name":"\u901a\u8fbd\u5e02\u5e02\u8f96\u533a"},"150502":{"area_id":"150502","parent_id":"150500","area_name":"\u79d1\u5c14\u6c81\u533a"},"150521":{"area_id":"150521","parent_id":"150500","area_name":"\u79d1\u5c14\u6c81\u5de6\u7ffc\u4e2d\u65d7"},"150522":{"area_id":"150522","parent_id":"150500","area_name":"\u79d1\u5c14\u6c81\u5de6\u7ffc\u540e\u65d7"},"150523":{"area_id":"150523","parent_id":"150500","area_name":"\u5f00\u9c81\u53bf"},"150524":{"area_id":"150524","parent_id":"150500","area_name":"\u5e93\u4f26\u65d7"},"150525":{"area_id":"150525","parent_id":"150500","area_name":"\u5948\u66fc\u65d7"},"150526":{"area_id":"150526","parent_id":"150500","area_name":"\u624e\u9c81\u7279\u65d7"},"150581":{"area_id":"150581","parent_id":"150500","area_name":"\u970d\u6797\u90ed\u52d2\u5e02"},"150600":{"area_id":"150600","parent_id":"150000","area_name":"\u9102\u5c14\u591a\u65af\u5e02"},"150601":{"area_id":"150601","parent_id":"150600","area_name":"\u9102\u5c14\u591a\u65af\u5e02\u5e02\u8f96\u533a"},"150602":{"area_id":"150602","parent_id":"150600","area_name":"\u4e1c\u80dc\u533a"},"150621":{"area_id":"150621","parent_id":"150600","area_name":"\u8fbe\u62c9\u7279\u65d7"},"150622":{"area_id":"150622","parent_id":"150600","area_name":"\u51c6\u683c\u5c14\u65d7"},"150623":{"area_id":"150623","parent_id":"150600","area_name":"\u9102\u6258\u514b\u524d\u65d7"},"150624":{"area_id":"150624","parent_id":"150600","area_name":"\u9102\u6258\u514b\u65d7"},"150625":{"area_id":"150625","parent_id":"150600","area_name":"\u676d\u9526\u65d7"},"150626":{"area_id":"150626","parent_id":"150600","area_name":"\u4e4c\u5ba1\u65d7"},"150627":{"area_id":"150627","parent_id":"150600","area_name":"\u4f0a\u91d1\u970d\u6d1b\u65d7"},"150700":{"area_id":"150700","parent_id":"150000","area_name":"\u547c\u4f26\u8d1d\u5c14\u5e02"},"150701":{"area_id":"150701","parent_id":"150700","area_name":"\u547c\u4f26\u8d1d\u5c14\u5e02\u5e02\u8f96\u533a"},"150702":{"area_id":"150702","parent_id":"150700","area_name":"\u6d77\u62c9\u5c14\u533a"},"150703":{"area_id":"150703","parent_id":"150700","area_name":"\u624e\u8d49\u8bfa\u5c14\u533a"},"150721":{"area_id":"150721","parent_id":"150700","area_name":"\u963f\u8363\u65d7"},"150722":{"area_id":"150722","parent_id":"150700","area_name":"\u83ab\u529b\u8fbe\u74e6\u8fbe\u65a1\u5c14\u65cf\u81ea\u6cbb\u65d7"},"150723":{"area_id":"150723","parent_id":"150700","area_name":"\u9102\u4f26\u6625\u81ea\u6cbb\u65d7"},"150724":{"area_id":"150724","parent_id":"150700","area_name":"\u9102\u6e29\u514b\u65cf\u81ea\u6cbb\u65d7"},"150725":{"area_id":"150725","parent_id":"150700","area_name":"\u9648\u5df4\u5c14\u864e\u65d7"},"150726":{"area_id":"150726","parent_id":"150700","area_name":"\u65b0\u5df4\u5c14\u864e\u5de6\u65d7"},"150727":{"area_id":"150727","parent_id":"150700","area_name":"\u65b0\u5df4\u5c14\u864e\u53f3\u65d7"},"150781":{"area_id":"150781","parent_id":"150700","area_name":"\u6ee1\u6d32\u91cc\u5e02"},"150782":{"area_id":"150782","parent_id":"150700","area_name":"\u7259\u514b\u77f3\u5e02"},"150783":{"area_id":"150783","parent_id":"150700","area_name":"\u624e\u5170\u5c6f\u5e02"},"150784":{"area_id":"150784","parent_id":"150700","area_name":"\u989d\u5c14\u53e4\u7eb3\u5e02"},"150785":{"area_id":"150785","parent_id":"150700","area_name":"\u6839\u6cb3\u5e02"},"150800":{"area_id":"150800","parent_id":"150000","area_name":"\u5df4\u5f66\u6dd6\u5c14\u5e02"},"150801":{"area_id":"150801","parent_id":"150800","area_name":"\u5df4\u5f66\u6dd6\u5c14\u5e02\u5e02\u8f96\u533a"},"150802":{"area_id":"150802","parent_id":"150800","area_name":"\u4e34\u6cb3\u533a"},"150821":{"area_id":"150821","parent_id":"150800","area_name":"\u4e94\u539f\u53bf"},"150822":{"area_id":"150822","parent_id":"150800","area_name":"\u78f4\u53e3\u53bf"},"150823":{"area_id":"150823","parent_id":"150800","area_name":"\u4e4c\u62c9\u7279\u524d\u65d7"},"150824":{"area_id":"150824","parent_id":"150800","area_name":"\u4e4c\u62c9\u7279\u4e2d\u65d7"},"150825":{"area_id":"150825","parent_id":"150800","area_name":"\u4e4c\u62c9\u7279\u540e\u65d7"},"150826":{"area_id":"150826","parent_id":"150800","area_name":"\u676d\u9526\u540e\u65d7"},"150900":{"area_id":"150900","parent_id":"150000","area_name":"\u4e4c\u5170\u5bdf\u5e03\u5e02"},"150901":{"area_id":"150901","parent_id":"150900","area_name":"\u4e4c\u5170\u5bdf\u5e03\u5e02\u5e02\u8f96\u533a"},"150902":{"area_id":"150902","parent_id":"150900","area_name":"\u96c6\u5b81\u533a"},"150921":{"area_id":"150921","parent_id":"150900","area_name":"\u5353\u8d44\u53bf"},"150922":{"area_id":"150922","parent_id":"150900","area_name":"\u5316\u5fb7\u53bf"},"150923":{"area_id":"150923","parent_id":"150900","area_name":"\u5546\u90fd\u53bf"},"150924":{"area_id":"150924","parent_id":"150900","area_name":"\u5174\u548c\u53bf"},"150925":{"area_id":"150925","parent_id":"150900","area_name":"\u51c9\u57ce\u53bf"},"150926":{"area_id":"150926","parent_id":"150900","area_name":"\u5bdf\u54c8\u5c14\u53f3\u7ffc\u524d\u65d7"},"150927":{"area_id":"150927","parent_id":"150900","area_name":"\u5bdf\u54c8\u5c14\u53f3\u7ffc\u4e2d\u65d7"},"150928":{"area_id":"150928","parent_id":"150900","area_name":"\u5bdf\u54c8\u5c14\u53f3\u7ffc\u540e\u65d7"},"150929":{"area_id":"150929","parent_id":"150900","area_name":"\u56db\u5b50\u738b\u65d7"},"150981":{"area_id":"150981","parent_id":"150900","area_name":"\u4e30\u9547\u5e02"},"152200":{"area_id":"152200","parent_id":"150000","area_name":"\u5174\u5b89\u76df"},"152201":{"area_id":"152201","parent_id":"152200","area_name":"\u4e4c\u5170\u6d69\u7279\u5e02"},"152202":{"area_id":"152202","parent_id":"152200","area_name":"\u963f\u5c14\u5c71\u5e02"},"152221":{"area_id":"152221","parent_id":"152200","area_name":"\u79d1\u5c14\u6c81\u53f3\u7ffc\u524d\u65d7"},"152222":{"area_id":"152222","parent_id":"152200","area_name":"\u79d1\u5c14\u6c81\u53f3\u7ffc\u4e2d\u65d7"},"152223":{"area_id":"152223","parent_id":"152200","area_name":"\u624e\u8d49\u7279\u65d7"},"152224":{"area_id":"152224","parent_id":"152200","area_name":"\u7a81\u6cc9\u53bf"},"152500":{"area_id":"152500","parent_id":"150000","area_name":"\u9521\u6797\u90ed\u52d2\u76df"},"152501":{"area_id":"152501","parent_id":"152500","area_name":"\u4e8c\u8fde\u6d69\u7279\u5e02"},"152502":{"area_id":"152502","parent_id":"152500","area_name":"\u9521\u6797\u6d69\u7279\u5e02"},"152522":{"area_id":"152522","parent_id":"152500","area_name":"\u963f\u5df4\u560e\u65d7"},"152523":{"area_id":"152523","parent_id":"152500","area_name":"\u82cf\u5c3c\u7279\u5de6\u65d7"},"152524":{"area_id":"152524","parent_id":"152500","area_name":"\u82cf\u5c3c\u7279\u53f3\u65d7"},"152525":{"area_id":"152525","parent_id":"152500","area_name":"\u4e1c\u4e4c\u73e0\u7a46\u6c81\u65d7"},"152526":{"area_id":"152526","parent_id":"152500","area_name":"\u897f\u4e4c\u73e0\u7a46\u6c81\u65d7"},"152527":{"area_id":"152527","parent_id":"152500","area_name":"\u592a\u4ec6\u5bfa\u65d7"},"152528":{"area_id":"152528","parent_id":"152500","area_name":"\u9576\u9ec4\u65d7"},"152529":{"area_id":"152529","parent_id":"152500","area_name":"\u6b63\u9576\u767d\u65d7"},"152530":{"area_id":"152530","parent_id":"152500","area_name":"\u6b63\u84dd\u65d7"},"152531":{"area_id":"152531","parent_id":"152500","area_name":"\u591a\u4f26\u53bf"},"152900":{"area_id":"152900","parent_id":"150000","area_name":"\u963f\u62c9\u5584\u76df"},"152921":{"area_id":"152921","parent_id":"152900","area_name":"\u963f\u62c9\u5584\u5de6\u65d7"},"152922":{"area_id":"152922","parent_id":"152900","area_name":"\u963f\u62c9\u5584\u53f3\u65d7"},"152923":{"area_id":"152923","parent_id":"152900","area_name":"\u989d\u6d4e\u7eb3\u65d7"},"210000":{"area_id":"210000","parent_id":"0","area_name":"\u8fbd\u5b81\u7701"},"210100":{"area_id":"210100","parent_id":"210000","area_name":"\u6c88\u9633\u5e02"},"210101":{"area_id":"210101","parent_id":"210100","area_name":"\u6c88\u9633\u5e02\u5e02\u8f96\u533a"},"210102":{"area_id":"210102","parent_id":"210100","area_name":"\u548c\u5e73\u533a"},"210103":{"area_id":"210103","parent_id":"210100","area_name":"\u6c88\u6cb3\u533a"},"210104":{"area_id":"210104","parent_id":"210100","area_name":"\u5927\u4e1c\u533a"},"210105":{"area_id":"210105","parent_id":"210100","area_name":"\u7687\u59d1\u533a"},"210106":{"area_id":"210106","parent_id":"210100","area_name":"\u94c1\u897f\u533a"},"210111":{"area_id":"210111","parent_id":"210100","area_name":"\u82cf\u5bb6\u5c6f\u533a"},"210112":{"area_id":"210112","parent_id":"210100","area_name":"\u4e1c\u9675\u533a"},"210113":{"area_id":"210113","parent_id":"210100","area_name":"\u6c88\u5317\u65b0\u533a"},"210114":{"area_id":"210114","parent_id":"210100","area_name":"\u4e8e\u6d2a\u533a"},"210122":{"area_id":"210122","parent_id":"210100","area_name":"\u8fbd\u4e2d\u53bf"},"210123":{"area_id":"210123","parent_id":"210100","area_name":"\u5eb7\u5e73\u53bf"},"210124":{"area_id":"210124","parent_id":"210100","area_name":"\u6cd5\u5e93\u53bf"},"210181":{"area_id":"210181","parent_id":"210100","area_name":"\u65b0\u6c11\u5e02"},"210200":{"area_id":"210200","parent_id":"210000","area_name":"\u5927\u8fde\u5e02"},"210201":{"area_id":"210201","parent_id":"210200","area_name":"\u5927\u8fde\u5e02\u5e02\u8f96\u533a"},"210202":{"area_id":"210202","parent_id":"210200","area_name":"\u4e2d\u5c71\u533a"},"210203":{"area_id":"210203","parent_id":"210200","area_name":"\u897f\u5c97\u533a"},"210204":{"area_id":"210204","parent_id":"210200","area_name":"\u6c99\u6cb3\u53e3\u533a"},"210211":{"area_id":"210211","parent_id":"210200","area_name":"\u7518\u4e95\u5b50\u533a"},"210212":{"area_id":"210212","parent_id":"210200","area_name":"\u65c5\u987a\u53e3\u533a"},"210213":{"area_id":"210213","parent_id":"210200","area_name":"\u91d1\u5dde\u533a"},"210224":{"area_id":"210224","parent_id":"210200","area_name":"\u957f\u6d77\u53bf"},"210281":{"area_id":"210281","parent_id":"210200","area_name":"\u74e6\u623f\u5e97\u5e02"},"210282":{"area_id":"210282","parent_id":"210200","area_name":"\u666e\u5170\u5e97\u5e02"},"210283":{"area_id":"210283","parent_id":"210200","area_name":"\u5e84\u6cb3\u5e02"},"210300":{"area_id":"210300","parent_id":"210000","area_name":"\u978d\u5c71\u5e02"},"210301":{"area_id":"210301","parent_id":"210300","area_name":"\u978d\u5c71\u5e02\u5e02\u8f96\u533a"},"210302":{"area_id":"210302","parent_id":"210300","area_name":"\u94c1\u4e1c\u533a"},"210303":{"area_id":"210303","parent_id":"210300","area_name":"\u94c1\u897f\u533a"},"210304":{"area_id":"210304","parent_id":"210300","area_name":"\u7acb\u5c71\u533a"},"210311":{"area_id":"210311","parent_id":"210300","area_name":"\u5343\u5c71\u533a"},"210321":{"area_id":"210321","parent_id":"210300","area_name":"\u53f0\u5b89\u53bf"},"210323":{"area_id":"210323","parent_id":"210300","area_name":"\u5cab\u5ca9\u6ee1\u65cf\u81ea\u6cbb\u53bf"},"210381":{"area_id":"210381","parent_id":"210300","area_name":"\u6d77\u57ce\u5e02"},"210400":{"area_id":"210400","parent_id":"210000","area_name":"\u629a\u987a\u5e02"},"210401":{"area_id":"210401","parent_id":"210400","area_name":"\u629a\u987a\u5e02\u5e02\u8f96\u533a"},"210402":{"area_id":"210402","parent_id":"210400","area_name":"\u65b0\u629a\u533a"},"210403":{"area_id":"210403","parent_id":"210400","area_name":"\u4e1c\u6d32\u533a"},"210404":{"area_id":"210404","parent_id":"210400","area_name":"\u671b\u82b1\u533a"},"210411":{"area_id":"210411","parent_id":"210400","area_name":"\u987a\u57ce\u533a"},"210421":{"area_id":"210421","parent_id":"210400","area_name":"\u629a\u987a\u53bf"},"210422":{"area_id":"210422","parent_id":"210400","area_name":"\u65b0\u5bbe\u6ee1\u65cf\u81ea\u6cbb\u53bf"},"210423":{"area_id":"210423","parent_id":"210400","area_name":"\u6e05\u539f\u6ee1\u65cf\u81ea\u6cbb\u53bf"},"210500":{"area_id":"210500","parent_id":"210000","area_name":"\u672c\u6eaa\u5e02"},"210501":{"area_id":"210501","parent_id":"210500","area_name":"\u672c\u6eaa\u5e02\u5e02\u8f96\u533a"},"210502":{"area_id":"210502","parent_id":"210500","area_name":"\u5e73\u5c71\u533a"},"210503":{"area_id":"210503","parent_id":"210500","area_name":"\u6eaa\u6e56\u533a"},"210504":{"area_id":"210504","parent_id":"210500","area_name":"\u660e\u5c71\u533a"},"210505":{"area_id":"210505","parent_id":"210500","area_name":"\u5357\u82ac\u533a"},"210521":{"area_id":"210521","parent_id":"210500","area_name":"\u672c\u6eaa\u6ee1\u65cf\u81ea\u6cbb\u53bf"},"210522":{"area_id":"210522","parent_id":"210500","area_name":"\u6853\u4ec1\u6ee1\u65cf\u81ea\u6cbb\u53bf"},"210600":{"area_id":"210600","parent_id":"210000","area_name":"\u4e39\u4e1c\u5e02"},"210601":{"area_id":"210601","parent_id":"210600","area_name":"\u4e39\u4e1c\u5e02\u5e02\u8f96\u533a"},"210602":{"area_id":"210602","parent_id":"210600","area_name":"\u5143\u5b9d\u533a"},"210603":{"area_id":"210603","parent_id":"210600","area_name":"\u632f\u5174\u533a"},"210604":{"area_id":"210604","parent_id":"210600","area_name":"\u632f\u5b89\u533a"},"210624":{"area_id":"210624","parent_id":"210600","area_name":"\u5bbd\u7538\u6ee1\u65cf\u81ea\u6cbb\u53bf"},"210681":{"area_id":"210681","parent_id":"210600","area_name":"\u4e1c\u6e2f\u5e02"},"210682":{"area_id":"210682","parent_id":"210600","area_name":"\u51e4\u57ce\u5e02"},"210700":{"area_id":"210700","parent_id":"210000","area_name":"\u9526\u5dde\u5e02"},"210701":{"area_id":"210701","parent_id":"210700","area_name":"\u9526\u5dde\u5e02\u5e02\u8f96\u533a"},"210702":{"area_id":"210702","parent_id":"210700","area_name":"\u53e4\u5854\u533a"},"210703":{"area_id":"210703","parent_id":"210700","area_name":"\u51cc\u6cb3\u533a"},"210711":{"area_id":"210711","parent_id":"210700","area_name":"\u592a\u548c\u533a"},"210726":{"area_id":"210726","parent_id":"210700","area_name":"\u9ed1\u5c71\u53bf"},"210727":{"area_id":"210727","parent_id":"210700","area_name":"\u4e49\u53bf"},"210781":{"area_id":"210781","parent_id":"210700","area_name":"\u51cc\u6d77\u5e02"},"210782":{"area_id":"210782","parent_id":"210700","area_name":"\u5317\u9547\u5e02"},"210800":{"area_id":"210800","parent_id":"210000","area_name":"\u8425\u53e3\u5e02"},"210801":{"area_id":"210801","parent_id":"210800","area_name":"\u8425\u53e3\u5e02\u5e02\u8f96\u533a"},"210802":{"area_id":"210802","parent_id":"210800","area_name":"\u7ad9\u524d\u533a"},"210803":{"area_id":"210803","parent_id":"210800","area_name":"\u897f\u5e02\u533a"},"210804":{"area_id":"210804","parent_id":"210800","area_name":"\u9c85\u9c7c\u5708\u533a"},"210811":{"area_id":"210811","parent_id":"210800","area_name":"\u8001\u8fb9\u533a"},"210881":{"area_id":"210881","parent_id":"210800","area_name":"\u76d6\u5dde\u5e02"},"210882":{"area_id":"210882","parent_id":"210800","area_name":"\u5927\u77f3\u6865\u5e02"},"210900":{"area_id":"210900","parent_id":"210000","area_name":"\u961c\u65b0\u5e02"},"210901":{"area_id":"210901","parent_id":"210900","area_name":"\u961c\u65b0\u5e02\u5e02\u8f96\u533a"},"210902":{"area_id":"210902","parent_id":"210900","area_name":"\u6d77\u5dde\u533a"},"210903":{"area_id":"210903","parent_id":"210900","area_name":"\u65b0\u90b1\u533a"},"210904":{"area_id":"210904","parent_id":"210900","area_name":"\u592a\u5e73\u533a"},"210905":{"area_id":"210905","parent_id":"210900","area_name":"\u6e05\u6cb3\u95e8\u533a"},"210911":{"area_id":"210911","parent_id":"210900","area_name":"\u7ec6\u6cb3\u533a"},"210921":{"area_id":"210921","parent_id":"210900","area_name":"\u961c\u65b0\u8499\u53e4\u65cf\u81ea\u6cbb\u53bf"},"210922":{"area_id":"210922","parent_id":"210900","area_name":"\u5f70\u6b66\u53bf"},"211000":{"area_id":"211000","parent_id":"210000","area_name":"\u8fbd\u9633\u5e02"},"211001":{"area_id":"211001","parent_id":"211000","area_name":"\u8fbd\u9633\u5e02\u5e02\u8f96\u533a"},"211002":{"area_id":"211002","parent_id":"211000","area_name":"\u767d\u5854\u533a"},"211003":{"area_id":"211003","parent_id":"211000","area_name":"\u6587\u5723\u533a"},"211004":{"area_id":"211004","parent_id":"211000","area_name":"\u5b8f\u4f1f\u533a"},"211005":{"area_id":"211005","parent_id":"211000","area_name":"\u5f13\u957f\u5cad\u533a"},"211011":{"area_id":"211011","parent_id":"211000","area_name":"\u592a\u5b50\u6cb3\u533a"},"211021":{"area_id":"211021","parent_id":"211000","area_name":"\u8fbd\u9633\u53bf"},"211081":{"area_id":"211081","parent_id":"211000","area_name":"\u706f\u5854\u5e02"},"211100":{"area_id":"211100","parent_id":"210000","area_name":"\u76d8\u9526\u5e02"},"211101":{"area_id":"211101","parent_id":"211100","area_name":"\u76d8\u9526\u5e02\u5e02\u8f96\u533a"},"211102":{"area_id":"211102","parent_id":"211100","area_name":"\u53cc\u53f0\u5b50\u533a"},"211103":{"area_id":"211103","parent_id":"211100","area_name":"\u5174\u9686\u53f0\u533a"},"211121":{"area_id":"211121","parent_id":"211100","area_name":"\u5927\u6d3c\u53bf"},"211122":{"area_id":"211122","parent_id":"211100","area_name":"\u76d8\u5c71\u53bf"},"211200":{"area_id":"211200","parent_id":"210000","area_name":"\u94c1\u5cad\u5e02"},"211201":{"area_id":"211201","parent_id":"211200","area_name":"\u94c1\u5cad\u5e02\u5e02\u8f96\u533a"},"211202":{"area_id":"211202","parent_id":"211200","area_name":"\u94f6\u5dde\u533a"},"211204":{"area_id":"211204","parent_id":"211200","area_name":"\u6e05\u6cb3\u533a"},"211221":{"area_id":"211221","parent_id":"211200","area_name":"\u94c1\u5cad\u53bf"},"211223":{"area_id":"211223","parent_id":"211200","area_name":"\u897f\u4e30\u53bf"},"211224":{"area_id":"211224","parent_id":"211200","area_name":"\u660c\u56fe\u53bf"},"211281":{"area_id":"211281","parent_id":"211200","area_name":"\u8c03\u5175\u5c71\u5e02"},"211282":{"area_id":"211282","parent_id":"211200","area_name":"\u5f00\u539f\u5e02"},"211300":{"area_id":"211300","parent_id":"210000","area_name":"\u671d\u9633\u5e02"},"211301":{"area_id":"211301","parent_id":"211300","area_name":"\u671d\u9633\u5e02\u5e02\u8f96\u533a"},"211302":{"area_id":"211302","parent_id":"211300","area_name":"\u53cc\u5854\u533a"},"211303":{"area_id":"211303","parent_id":"211300","area_name":"\u9f99\u57ce\u533a"},"211321":{"area_id":"211321","parent_id":"211300","area_name":"\u671d\u9633\u53bf"},"211322":{"area_id":"211322","parent_id":"211300","area_name":"\u5efa\u5e73\u53bf"},"211324":{"area_id":"211324","parent_id":"211300","area_name":"\u5580\u5587\u6c81\u5de6\u7ffc\u8499\u53e4\u65cf\u81ea\u6cbb\u53bf"},"211381":{"area_id":"211381","parent_id":"211300","area_name":"\u5317\u7968\u5e02"},"211382":{"area_id":"211382","parent_id":"211300","area_name":"\u51cc\u6e90\u5e02"},"211400":{"area_id":"211400","parent_id":"210000","area_name":"\u846b\u82a6\u5c9b\u5e02"},"211401":{"area_id":"211401","parent_id":"211400","area_name":"\u846b\u82a6\u5c9b\u5e02\u5e02\u8f96\u533a"},"211402":{"area_id":"211402","parent_id":"211400","area_name":"\u8fde\u5c71\u533a"},"211403":{"area_id":"211403","parent_id":"211400","area_name":"\u9f99\u6e2f\u533a"},"211404":{"area_id":"211404","parent_id":"211400","area_name":"\u5357\u7968\u533a"},"211421":{"area_id":"211421","parent_id":"211400","area_name":"\u7ee5\u4e2d\u53bf"},"211422":{"area_id":"211422","parent_id":"211400","area_name":"\u5efa\u660c\u53bf"},"211481":{"area_id":"211481","parent_id":"211400","area_name":"\u5174\u57ce\u5e02"},"220000":{"area_id":"220000","parent_id":"0","area_name":"\u5409\u6797\u7701"},"220100":{"area_id":"220100","parent_id":"220000","area_name":"\u957f\u6625\u5e02"},"220101":{"area_id":"220101","parent_id":"220100","area_name":"\u957f\u6625\u5e02\u5e02\u8f96\u533a"},"220102":{"area_id":"220102","parent_id":"220100","area_name":"\u5357\u5173\u533a"},"220103":{"area_id":"220103","parent_id":"220100","area_name":"\u5bbd\u57ce\u533a"},"220104":{"area_id":"220104","parent_id":"220100","area_name":"\u671d\u9633\u533a"},"220105":{"area_id":"220105","parent_id":"220100","area_name":"\u4e8c\u9053\u533a"},"220106":{"area_id":"220106","parent_id":"220100","area_name":"\u7eff\u56ed\u533a"},"220112":{"area_id":"220112","parent_id":"220100","area_name":"\u53cc\u9633\u533a"},"220122":{"area_id":"220122","parent_id":"220100","area_name":"\u519c\u5b89\u53bf"},"220181":{"area_id":"220181","parent_id":"220100","area_name":"\u4e5d\u53f0\u5e02"},"220182":{"area_id":"220182","parent_id":"220100","area_name":"\u6986\u6811\u5e02"},"220183":{"area_id":"220183","parent_id":"220100","area_name":"\u5fb7\u60e0\u5e02"},"220200":{"area_id":"220200","parent_id":"220000","area_name":"\u5409\u6797\u5e02"},"220201":{"area_id":"220201","parent_id":"220200","area_name":"\u5409\u6797\u5e02\u5e02\u8f96\u533a"},"220202":{"area_id":"220202","parent_id":"220200","area_name":"\u660c\u9091\u533a"},"220203":{"area_id":"220203","parent_id":"220200","area_name":"\u9f99\u6f6d\u533a"},"220204":{"area_id":"220204","parent_id":"220200","area_name":"\u8239\u8425\u533a"},"220211":{"area_id":"220211","parent_id":"220200","area_name":"\u4e30\u6ee1\u533a"},"220221":{"area_id":"220221","parent_id":"220200","area_name":"\u6c38\u5409\u53bf"},"220281":{"area_id":"220281","parent_id":"220200","area_name":"\u86df\u6cb3\u5e02"},"220282":{"area_id":"220282","parent_id":"220200","area_name":"\u6866\u7538\u5e02"},"220283":{"area_id":"220283","parent_id":"220200","area_name":"\u8212\u5170\u5e02"},"220284":{"area_id":"220284","parent_id":"220200","area_name":"\u78d0\u77f3\u5e02"},"220300":{"area_id":"220300","parent_id":"220000","area_name":"\u56db\u5e73\u5e02"},"220301":{"area_id":"220301","parent_id":"220300","area_name":"\u56db\u5e73\u5e02\u5e02\u8f96\u533a"},"220302":{"area_id":"220302","parent_id":"220300","area_name":"\u94c1\u897f\u533a"},"220303":{"area_id":"220303","parent_id":"220300","area_name":"\u94c1\u4e1c\u533a"},"220322":{"area_id":"220322","parent_id":"220300","area_name":"\u68a8\u6811\u53bf"},"220323":{"area_id":"220323","parent_id":"220300","area_name":"\u4f0a\u901a\u6ee1\u65cf\u81ea\u6cbb\u53bf"},"220381":{"area_id":"220381","parent_id":"220300","area_name":"\u516c\u4e3b\u5cad\u5e02"},"220382":{"area_id":"220382","parent_id":"220300","area_name":"\u53cc\u8fbd\u5e02"},"220400":{"area_id":"220400","parent_id":"220000","area_name":"\u8fbd\u6e90\u5e02"},"220401":{"area_id":"220401","parent_id":"220400","area_name":"\u8fbd\u6e90\u5e02\u5e02\u8f96\u533a"},"220402":{"area_id":"220402","parent_id":"220400","area_name":"\u9f99\u5c71\u533a"},"220403":{"area_id":"220403","parent_id":"220400","area_name":"\u897f\u5b89\u533a"},"220421":{"area_id":"220421","parent_id":"220400","area_name":"\u4e1c\u4e30\u53bf"},"220422":{"area_id":"220422","parent_id":"220400","area_name":"\u4e1c\u8fbd\u53bf"},"220500":{"area_id":"220500","parent_id":"220000","area_name":"\u901a\u5316\u5e02"},"220501":{"area_id":"220501","parent_id":"220500","area_name":"\u901a\u5316\u5e02\u5e02\u8f96\u533a"},"220502":{"area_id":"220502","parent_id":"220500","area_name":"\u4e1c\u660c\u533a"},"220503":{"area_id":"220503","parent_id":"220500","area_name":"\u4e8c\u9053\u6c5f\u533a"},"220521":{"area_id":"220521","parent_id":"220500","area_name":"\u901a\u5316\u53bf"},"220523":{"area_id":"220523","parent_id":"220500","area_name":"\u8f89\u5357\u53bf"},"220524":{"area_id":"220524","parent_id":"220500","area_name":"\u67f3\u6cb3\u53bf"},"220581":{"area_id":"220581","parent_id":"220500","area_name":"\u6885\u6cb3\u53e3\u5e02"},"220582":{"area_id":"220582","parent_id":"220500","area_name":"\u96c6\u5b89\u5e02"},"220600":{"area_id":"220600","parent_id":"220000","area_name":"\u767d\u5c71\u5e02"},"220601":{"area_id":"220601","parent_id":"220600","area_name":"\u767d\u5c71\u5e02\u5e02\u8f96\u533a"},"220602":{"area_id":"220602","parent_id":"220600","area_name":"\u6d51\u6c5f\u533a"},"220605":{"area_id":"220605","parent_id":"220600","area_name":"\u6c5f\u6e90\u533a"},"220621":{"area_id":"220621","parent_id":"220600","area_name":"\u629a\u677e\u53bf"},"220622":{"area_id":"220622","parent_id":"220600","area_name":"\u9756\u5b87\u53bf"},"220623":{"area_id":"220623","parent_id":"220600","area_name":"\u957f\u767d\u671d\u9c9c\u65cf\u81ea\u6cbb\u53bf"},"220681":{"area_id":"220681","parent_id":"220600","area_name":"\u4e34\u6c5f\u5e02"},"220700":{"area_id":"220700","parent_id":"220000","area_name":"\u677e\u539f\u5e02"},"220701":{"area_id":"220701","parent_id":"220700","area_name":"\u677e\u539f\u5e02\u5e02\u8f96\u533a"},"220702":{"area_id":"220702","parent_id":"220700","area_name":"\u5b81\u6c5f\u533a"},"220721":{"area_id":"220721","parent_id":"220700","area_name":"\u524d\u90ed\u5c14\u7f57\u65af\u8499\u53e4\u65cf\u81ea\u6cbb\u53bf"},"220722":{"area_id":"220722","parent_id":"220700","area_name":"\u957f\u5cad\u53bf"},"220723":{"area_id":"220723","parent_id":"220700","area_name":"\u4e7e\u5b89\u53bf"},"220781":{"area_id":"220781","parent_id":"220700","area_name":"\u6276\u4f59\u5e02"},"220800":{"area_id":"220800","parent_id":"220000","area_name":"\u767d\u57ce\u5e02"},"220801":{"area_id":"220801","parent_id":"220800","area_name":"\u767d\u57ce\u5e02\u5e02\u8f96\u533a"},"220802":{"area_id":"220802","parent_id":"220800","area_name":"\u6d2e\u5317\u533a"},"220821":{"area_id":"220821","parent_id":"220800","area_name":"\u9547\u8d49\u53bf"},"220822":{"area_id":"220822","parent_id":"220800","area_name":"\u901a\u6986\u53bf"},"220881":{"area_id":"220881","parent_id":"220800","area_name":"\u6d2e\u5357\u5e02"},"220882":{"area_id":"220882","parent_id":"220800","area_name":"\u5927\u5b89\u5e02"},"222400":{"area_id":"222400","parent_id":"220000","area_name":"\u5ef6\u8fb9\u671d\u9c9c\u65cf\u81ea\u6cbb\u5dde"},"222401":{"area_id":"222401","parent_id":"222400","area_name":"\u5ef6\u5409\u5e02"},"222402":{"area_id":"222402","parent_id":"222400","area_name":"\u56fe\u4eec\u5e02"},"222403":{"area_id":"222403","parent_id":"222400","area_name":"\u6566\u5316\u5e02"},"222404":{"area_id":"222404","parent_id":"222400","area_name":"\u73f2\u6625\u5e02"},"222405":{"area_id":"222405","parent_id":"222400","area_name":"\u9f99\u4e95\u5e02"},"222406":{"area_id":"222406","parent_id":"222400","area_name":"\u548c\u9f99\u5e02"},"222424":{"area_id":"222424","parent_id":"222400","area_name":"\u6c6a\u6e05\u53bf"},"222426":{"area_id":"222426","parent_id":"222400","area_name":"\u5b89\u56fe\u53bf"},"230000":{"area_id":"230000","parent_id":"0","area_name":"\u9ed1\u9f99\u6c5f\u7701"},"230100":{"area_id":"230100","parent_id":"230000","area_name":"\u54c8\u5c14\u6ee8\u5e02"},"230101":{"area_id":"230101","parent_id":"230100","area_name":"\u54c8\u5c14\u6ee8\u5e02\u5e02\u8f96\u533a"},"230102":{"area_id":"230102","parent_id":"230100","area_name":"\u9053\u91cc\u533a"},"230103":{"area_id":"230103","parent_id":"230100","area_name":"\u5357\u5c97\u533a"},"230104":{"area_id":"230104","parent_id":"230100","area_name":"\u9053\u5916\u533a"},"230108":{"area_id":"230108","parent_id":"230100","area_name":"\u5e73\u623f\u533a"},"230109":{"area_id":"230109","parent_id":"230100","area_name":"\u677e\u5317\u533a"},"230110":{"area_id":"230110","parent_id":"230100","area_name":"\u9999\u574a\u533a"},"230111":{"area_id":"230111","parent_id":"230100","area_name":"\u547c\u5170\u533a"},"230112":{"area_id":"230112","parent_id":"230100","area_name":"\u963f\u57ce\u533a"},"230123":{"area_id":"230123","parent_id":"230100","area_name":"\u4f9d\u5170\u53bf"},"230124":{"area_id":"230124","parent_id":"230100","area_name":"\u65b9\u6b63\u53bf"},"230125":{"area_id":"230125","parent_id":"230100","area_name":"\u5bbe\u53bf"},"230126":{"area_id":"230126","parent_id":"230100","area_name":"\u5df4\u5f66\u53bf"},"230127":{"area_id":"230127","parent_id":"230100","area_name":"\u6728\u5170\u53bf"},"230128":{"area_id":"230128","parent_id":"230100","area_name":"\u901a\u6cb3\u53bf"},"230129":{"area_id":"230129","parent_id":"230100","area_name":"\u5ef6\u5bff\u53bf"},"230182":{"area_id":"230182","parent_id":"230100","area_name":"\u53cc\u57ce\u5e02"},"230183":{"area_id":"230183","parent_id":"230100","area_name":"\u5c1a\u5fd7\u5e02"},"230184":{"area_id":"230184","parent_id":"230100","area_name":"\u4e94\u5e38\u5e02"},"230200":{"area_id":"230200","parent_id":"230000","area_name":"\u9f50\u9f50\u54c8\u5c14\u5e02"},"230201":{"area_id":"230201","parent_id":"230200","area_name":"\u9f50\u9f50\u54c8\u5c14\u5e02\u5e02\u8f96\u533a"},"230202":{"area_id":"230202","parent_id":"230200","area_name":"\u9f99\u6c99\u533a"},"230203":{"area_id":"230203","parent_id":"230200","area_name":"\u5efa\u534e\u533a"},"230204":{"area_id":"230204","parent_id":"230200","area_name":"\u94c1\u950b\u533a"},"230205":{"area_id":"230205","parent_id":"230200","area_name":"\u6602\u6602\u6eaa\u533a"},"230206":{"area_id":"230206","parent_id":"230200","area_name":"\u5bcc\u62c9\u5c14\u57fa\u533a"},"230207":{"area_id":"230207","parent_id":"230200","area_name":"\u78be\u5b50\u5c71\u533a"},"230208":{"area_id":"230208","parent_id":"230200","area_name":"\u6885\u91cc\u65af\u8fbe\u65a1\u5c14\u65cf\u533a"},"230221":{"area_id":"230221","parent_id":"230200","area_name":"\u9f99\u6c5f\u53bf"},"230223":{"area_id":"230223","parent_id":"230200","area_name":"\u4f9d\u5b89\u53bf"},"230224":{"area_id":"230224","parent_id":"230200","area_name":"\u6cf0\u6765\u53bf"},"230225":{"area_id":"230225","parent_id":"230200","area_name":"\u7518\u5357\u53bf"},"230227":{"area_id":"230227","parent_id":"230200","area_name":"\u5bcc\u88d5\u53bf"},"230229":{"area_id":"230229","parent_id":"230200","area_name":"\u514b\u5c71\u53bf"},"230230":{"area_id":"230230","parent_id":"230200","area_name":"\u514b\u4e1c\u53bf"},"230231":{"area_id":"230231","parent_id":"230200","area_name":"\u62dc\u6cc9\u53bf"},"230281":{"area_id":"230281","parent_id":"230200","area_name":"\u8bb7\u6cb3\u5e02"},"230300":{"area_id":"230300","parent_id":"230000","area_name":"\u9e21\u897f\u5e02"},"230301":{"area_id":"230301","parent_id":"230300","area_name":"\u9e21\u897f\u5e02\u5e02\u8f96\u533a"},"230302":{"area_id":"230302","parent_id":"230300","area_name":"\u9e21\u51a0\u533a"},"230303":{"area_id":"230303","parent_id":"230300","area_name":"\u6052\u5c71\u533a"},"230304":{"area_id":"230304","parent_id":"230300","area_name":"\u6ef4\u9053\u533a"},"230305":{"area_id":"230305","parent_id":"230300","area_name":"\u68a8\u6811\u533a"},"230306":{"area_id":"230306","parent_id":"230300","area_name":"\u57ce\u5b50\u6cb3\u533a"},"230307":{"area_id":"230307","parent_id":"230300","area_name":"\u9ebb\u5c71\u533a"},"230321":{"area_id":"230321","parent_id":"230300","area_name":"\u9e21\u4e1c\u53bf"},"230381":{"area_id":"230381","parent_id":"230300","area_name":"\u864e\u6797\u5e02"},"230382":{"area_id":"230382","parent_id":"230300","area_name":"\u5bc6\u5c71\u5e02"},"230400":{"area_id":"230400","parent_id":"230000","area_name":"\u9e64\u5c97\u5e02"},"230401":{"area_id":"230401","parent_id":"230400","area_name":"\u9e64\u5c97\u5e02\u5e02\u8f96\u533a"},"230402":{"area_id":"230402","parent_id":"230400","area_name":"\u5411\u9633\u533a"},"230403":{"area_id":"230403","parent_id":"230400","area_name":"\u5de5\u519c\u533a"},"230404":{"area_id":"230404","parent_id":"230400","area_name":"\u5357\u5c71\u533a"},"230405":{"area_id":"230405","parent_id":"230400","area_name":"\u5174\u5b89\u533a"},"230406":{"area_id":"230406","parent_id":"230400","area_name":"\u4e1c\u5c71\u533a"},"230407":{"area_id":"230407","parent_id":"230400","area_name":"\u5174\u5c71\u533a"},"230421":{"area_id":"230421","parent_id":"230400","area_name":"\u841d\u5317\u53bf"},"230422":{"area_id":"230422","parent_id":"230400","area_name":"\u7ee5\u6ee8\u53bf"},"230500":{"area_id":"230500","parent_id":"230000","area_name":"\u53cc\u9e2d\u5c71\u5e02"},"230501":{"area_id":"230501","parent_id":"230500","area_name":"\u53cc\u9e2d\u5c71\u5e02\u5e02\u8f96\u533a"},"230502":{"area_id":"230502","parent_id":"230500","area_name":"\u5c16\u5c71\u533a"},"230503":{"area_id":"230503","parent_id":"230500","area_name":"\u5cad\u4e1c\u533a"},"230505":{"area_id":"230505","parent_id":"230500","area_name":"\u56db\u65b9\u53f0\u533a"},"230506":{"area_id":"230506","parent_id":"230500","area_name":"\u5b9d\u5c71\u533a"},"230521":{"area_id":"230521","parent_id":"230500","area_name":"\u96c6\u8d24\u53bf"},"230522":{"area_id":"230522","parent_id":"230500","area_name":"\u53cb\u8c0a\u53bf"},"230523":{"area_id":"230523","parent_id":"230500","area_name":"\u5b9d\u6e05\u53bf"},"230524":{"area_id":"230524","parent_id":"230500","area_name":"\u9976\u6cb3\u53bf"},"230600":{"area_id":"230600","parent_id":"230000","area_name":"\u5927\u5e86\u5e02"},"230601":{"area_id":"230601","parent_id":"230600","area_name":"\u5927\u5e86\u5e02\u5e02\u8f96\u533a"},"230602":{"area_id":"230602","parent_id":"230600","area_name":"\u8428\u5c14\u56fe\u533a"},"230603":{"area_id":"230603","parent_id":"230600","area_name":"\u9f99\u51e4\u533a"},"230604":{"area_id":"230604","parent_id":"230600","area_name":"\u8ba9\u80e1\u8def\u533a"},"230605":{"area_id":"230605","parent_id":"230600","area_name":"\u7ea2\u5c97\u533a"},"230606":{"area_id":"230606","parent_id":"230600","area_name":"\u5927\u540c\u533a"},"230621":{"area_id":"230621","parent_id":"230600","area_name":"\u8087\u5dde\u53bf"},"230622":{"area_id":"230622","parent_id":"230600","area_name":"\u8087\u6e90\u53bf"},"230623":{"area_id":"230623","parent_id":"230600","area_name":"\u6797\u7538\u53bf"},"230624":{"area_id":"230624","parent_id":"230600","area_name":"\u675c\u5c14\u4f2f\u7279\u8499\u53e4\u65cf\u81ea\u6cbb\u53bf"},"230700":{"area_id":"230700","parent_id":"230000","area_name":"\u4f0a\u6625\u5e02"},"230701":{"area_id":"230701","parent_id":"230700","area_name":"\u4f0a\u6625\u5e02\u5e02\u8f96\u533a"},"230702":{"area_id":"230702","parent_id":"230700","area_name":"\u4f0a\u6625\u533a"},"230703":{"area_id":"230703","parent_id":"230700","area_name":"\u5357\u5c94\u533a"},"230704":{"area_id":"230704","parent_id":"230700","area_name":"\u53cb\u597d\u533a"},"230705":{"area_id":"230705","parent_id":"230700","area_name":"\u897f\u6797\u533a"},"230706":{"area_id":"230706","parent_id":"230700","area_name":"\u7fe0\u5ce6\u533a"},"230707":{"area_id":"230707","parent_id":"230700","area_name":"\u65b0\u9752\u533a"},"230708":{"area_id":"230708","parent_id":"230700","area_name":"\u7f8e\u6eaa\u533a"},"230709":{"area_id":"230709","parent_id":"230700","area_name":"\u91d1\u5c71\u5c6f\u533a"},"230710":{"area_id":"230710","parent_id":"230700","area_name":"\u4e94\u8425\u533a"},"230711":{"area_id":"230711","parent_id":"230700","area_name":"\u4e4c\u9a6c\u6cb3\u533a"},"230712":{"area_id":"230712","parent_id":"230700","area_name":"\u6c64\u65fa\u6cb3\u533a"},"230713":{"area_id":"230713","parent_id":"230700","area_name":"\u5e26\u5cad\u533a"},"230714":{"area_id":"230714","parent_id":"230700","area_name":"\u4e4c\u4f0a\u5cad\u533a"},"230715":{"area_id":"230715","parent_id":"230700","area_name":"\u7ea2\u661f\u533a"},"230716":{"area_id":"230716","parent_id":"230700","area_name":"\u4e0a\u7518\u5cad\u533a"},"230722":{"area_id":"230722","parent_id":"230700","area_name":"\u5609\u836b\u53bf"},"230781":{"area_id":"230781","parent_id":"230700","area_name":"\u94c1\u529b\u5e02"},"230800":{"area_id":"230800","parent_id":"230000","area_name":"\u4f73\u6728\u65af\u5e02"},"230801":{"area_id":"230801","parent_id":"230800","area_name":"\u4f73\u6728\u65af\u5e02\u5e02\u8f96\u533a"},"230803":{"area_id":"230803","parent_id":"230800","area_name":"\u5411\u9633\u533a"},"230804":{"area_id":"230804","parent_id":"230800","area_name":"\u524d\u8fdb\u533a"},"230805":{"area_id":"230805","parent_id":"230800","area_name":"\u4e1c\u98ce\u533a"},"230811":{"area_id":"230811","parent_id":"230800","area_name":"\u90ca\u533a"},"230822":{"area_id":"230822","parent_id":"230800","area_name":"\u6866\u5357\u53bf"},"230826":{"area_id":"230826","parent_id":"230800","area_name":"\u6866\u5ddd\u53bf"},"230828":{"area_id":"230828","parent_id":"230800","area_name":"\u6c64\u539f\u53bf"},"230833":{"area_id":"230833","parent_id":"230800","area_name":"\u629a\u8fdc\u53bf"},"230881":{"area_id":"230881","parent_id":"230800","area_name":"\u540c\u6c5f\u5e02"},"230882":{"area_id":"230882","parent_id":"230800","area_name":"\u5bcc\u9526\u5e02"},"230900":{"area_id":"230900","parent_id":"230000","area_name":"\u4e03\u53f0\u6cb3\u5e02"},"230901":{"area_id":"230901","parent_id":"230900","area_name":"\u4e03\u53f0\u6cb3\u5e02\u5e02\u8f96\u533a"},"230902":{"area_id":"230902","parent_id":"230900","area_name":"\u65b0\u5174\u533a"},"230903":{"area_id":"230903","parent_id":"230900","area_name":"\u6843\u5c71\u533a"},"230904":{"area_id":"230904","parent_id":"230900","area_name":"\u8304\u5b50\u6cb3\u533a"},"230921":{"area_id":"230921","parent_id":"230900","area_name":"\u52c3\u5229\u53bf"},"231000":{"area_id":"231000","parent_id":"230000","area_name":"\u7261\u4e39\u6c5f\u5e02"},"231001":{"area_id":"231001","parent_id":"231000","area_name":"\u7261\u4e39\u6c5f\u5e02\u5e02\u8f96\u533a"},"231002":{"area_id":"231002","parent_id":"231000","area_name":"\u4e1c\u5b89\u533a"},"231003":{"area_id":"231003","parent_id":"231000","area_name":"\u9633\u660e\u533a"},"231004":{"area_id":"231004","parent_id":"231000","area_name":"\u7231\u6c11\u533a"},"231005":{"area_id":"231005","parent_id":"231000","area_name":"\u897f\u5b89\u533a"},"231024":{"area_id":"231024","parent_id":"231000","area_name":"\u4e1c\u5b81\u53bf"},"231025":{"area_id":"231025","parent_id":"231000","area_name":"\u6797\u53e3\u53bf"},"231081":{"area_id":"231081","parent_id":"231000","area_name":"\u7ee5\u82ac\u6cb3\u5e02"},"231083":{"area_id":"231083","parent_id":"231000","area_name":"\u6d77\u6797\u5e02"},"231084":{"area_id":"231084","parent_id":"231000","area_name":"\u5b81\u5b89\u5e02"},"231085":{"area_id":"231085","parent_id":"231000","area_name":"\u7a46\u68f1\u5e02"},"231100":{"area_id":"231100","parent_id":"230000","area_name":"\u9ed1\u6cb3\u5e02"},"231101":{"area_id":"231101","parent_id":"231100","area_name":"\u9ed1\u6cb3\u5e02\u5e02\u8f96\u533a"},"231102":{"area_id":"231102","parent_id":"231100","area_name":"\u7231\u8f89\u533a"},"231121":{"area_id":"231121","parent_id":"231100","area_name":"\u5ae9\u6c5f\u53bf"},"231123":{"area_id":"231123","parent_id":"231100","area_name":"\u900a\u514b\u53bf"},"231124":{"area_id":"231124","parent_id":"231100","area_name":"\u5b59\u5434\u53bf"},"231181":{"area_id":"231181","parent_id":"231100","area_name":"\u5317\u5b89\u5e02"},"231182":{"area_id":"231182","parent_id":"231100","area_name":"\u4e94\u5927\u8fde\u6c60\u5e02"},"231200":{"area_id":"231200","parent_id":"230000","area_name":"\u7ee5\u5316\u5e02"},"231201":{"area_id":"231201","parent_id":"231200","area_name":"\u7ee5\u5316\u5e02\u5e02\u8f96\u533a"},"231202":{"area_id":"231202","parent_id":"231200","area_name":"\u5317\u6797\u533a"},"231221":{"area_id":"231221","parent_id":"231200","area_name":"\u671b\u594e\u53bf"},"231222":{"area_id":"231222","parent_id":"231200","area_name":"\u5170\u897f\u53bf"},"231223":{"area_id":"231223","parent_id":"231200","area_name":"\u9752\u5188\u53bf"},"231224":{"area_id":"231224","parent_id":"231200","area_name":"\u5e86\u5b89\u53bf"},"231225":{"area_id":"231225","parent_id":"231200","area_name":"\u660e\u6c34\u53bf"},"231226":{"area_id":"231226","parent_id":"231200","area_name":"\u7ee5\u68f1\u53bf"},"231281":{"area_id":"231281","parent_id":"231200","area_name":"\u5b89\u8fbe\u5e02"},"231282":{"area_id":"231282","parent_id":"231200","area_name":"\u8087\u4e1c\u5e02"},"231283":{"area_id":"231283","parent_id":"231200","area_name":"\u6d77\u4f26\u5e02"},"232700":{"area_id":"232700","parent_id":"230000","area_name":"\u5927\u5174\u5b89\u5cad\u5730\u533a"},"232721":{"area_id":"232721","parent_id":"232700","area_name":"\u547c\u739b\u53bf"},"232722":{"area_id":"232722","parent_id":"232700","area_name":"\u5854\u6cb3\u53bf"},"232723":{"area_id":"232723","parent_id":"232700","area_name":"\u6f20\u6cb3\u53bf"},"310000":{"area_id":"310000","parent_id":"0","area_name":"\u4e0a\u6d77\u5e02"},"310100":{"area_id":"310100","parent_id":"310000","area_name":"\u4e0a\u6d77\u5e02\u5e02\u8f96\u533a"},"310101":{"area_id":"310101","parent_id":"310100","area_name":"\u9ec4\u6d66\u533a"},"310104":{"area_id":"310104","parent_id":"310100","area_name":"\u5f90\u6c47\u533a"},"310105":{"area_id":"310105","parent_id":"310100","area_name":"\u957f\u5b81\u533a"},"310106":{"area_id":"310106","parent_id":"310100","area_name":"\u9759\u5b89\u533a"},"310107":{"area_id":"310107","parent_id":"310100","area_name":"\u666e\u9640\u533a"},"310108":{"area_id":"310108","parent_id":"310100","area_name":"\u95f8\u5317\u533a"},"310109":{"area_id":"310109","parent_id":"310100","area_name":"\u8679\u53e3\u533a"},"310110":{"area_id":"310110","parent_id":"310100","area_name":"\u6768\u6d66\u533a"},"310112":{"area_id":"310112","parent_id":"310100","area_name":"\u95f5\u884c\u533a"},"310113":{"area_id":"310113","parent_id":"310100","area_name":"\u5b9d\u5c71\u533a"},"310114":{"area_id":"310114","parent_id":"310100","area_name":"\u5609\u5b9a\u533a"},"310115":{"area_id":"310115","parent_id":"310100","area_name":"\u6d66\u4e1c\u65b0\u533a"},"310116":{"area_id":"310116","parent_id":"310100","area_name":"\u91d1\u5c71\u533a"},"310117":{"area_id":"310117","parent_id":"310100","area_name":"\u677e\u6c5f\u533a"},"310118":{"area_id":"310118","parent_id":"310100","area_name":"\u9752\u6d66\u533a"},"310120":{"area_id":"310120","parent_id":"310100","area_name":"\u5949\u8d24\u533a"},"310200":{"area_id":"310200","parent_id":"310000","area_name":"\u4e0a\u6d77\u5e02\u53bf\u8f96\u533a"},"310230":{"area_id":"310230","parent_id":"310200","area_name":"\u5d07\u660e\u53bf"},"320000":{"area_id":"320000","parent_id":"0","area_name":"\u6c5f\u82cf\u7701"},"320100":{"area_id":"320100","parent_id":"320000","area_name":"\u5357\u4eac\u5e02"},"320101":{"area_id":"320101","parent_id":"320100","area_name":"\u5357\u4eac\u5e02\u5e02\u8f96\u533a"},"320102":{"area_id":"320102","parent_id":"320100","area_name":"\u7384\u6b66\u533a"},"320104":{"area_id":"320104","parent_id":"320100","area_name":"\u79e6\u6dee\u533a"},"320105":{"area_id":"320105","parent_id":"320100","area_name":"\u5efa\u90ba\u533a"},"320106":{"area_id":"320106","parent_id":"320100","area_name":"\u9f13\u697c\u533a"},"320111":{"area_id":"320111","parent_id":"320100","area_name":"\u6d66\u53e3\u533a"},"320113":{"area_id":"320113","parent_id":"320100","area_name":"\u6816\u971e\u533a"},"320114":{"area_id":"320114","parent_id":"320100","area_name":"\u96e8\u82b1\u53f0\u533a"},"320115":{"area_id":"320115","parent_id":"320100","area_name":"\u6c5f\u5b81\u533a"},"320116":{"area_id":"320116","parent_id":"320100","area_name":"\u516d\u5408\u533a"},"320117":{"area_id":"320117","parent_id":"320100","area_name":"\u6ea7\u6c34\u533a"},"320118":{"area_id":"320118","parent_id":"320100","area_name":"\u9ad8\u6df3\u533a"},"320200":{"area_id":"320200","parent_id":"320000","area_name":"\u65e0\u9521\u5e02"},"320201":{"area_id":"320201","parent_id":"320200","area_name":"\u65e0\u9521\u5e02\u5e02\u8f96\u533a"},"320202":{"area_id":"320202","parent_id":"320200","area_name":"\u5d07\u5b89\u533a"},"320203":{"area_id":"320203","parent_id":"320200","area_name":"\u5357\u957f\u533a"},"320204":{"area_id":"320204","parent_id":"320200","area_name":"\u5317\u5858\u533a"},"320205":{"area_id":"320205","parent_id":"320200","area_name":"\u9521\u5c71\u533a"},"320206":{"area_id":"320206","parent_id":"320200","area_name":"\u60e0\u5c71\u533a"},"320211":{"area_id":"320211","parent_id":"320200","area_name":"\u6ee8\u6e56\u533a"},"320281":{"area_id":"320281","parent_id":"320200","area_name":"\u6c5f\u9634\u5e02"},"320282":{"area_id":"320282","parent_id":"320200","area_name":"\u5b9c\u5174\u5e02"},"320300":{"area_id":"320300","parent_id":"320000","area_name":"\u5f90\u5dde\u5e02"},"320301":{"area_id":"320301","parent_id":"320300","area_name":"\u5f90\u5dde\u5e02\u5e02\u8f96\u533a"},"320302":{"area_id":"320302","parent_id":"320300","area_name":"\u9f13\u697c\u533a"},"320303":{"area_id":"320303","parent_id":"320300","area_name":"\u4e91\u9f99\u533a"},"320305":{"area_id":"320305","parent_id":"320300","area_name":"\u8d3e\u6c6a\u533a"},"320311":{"area_id":"320311","parent_id":"320300","area_name":"\u6cc9\u5c71\u533a"},"320312":{"area_id":"320312","parent_id":"320300","area_name":"\u94dc\u5c71\u533a"},"320321":{"area_id":"320321","parent_id":"320300","area_name":"\u4e30\u53bf"},"320322":{"area_id":"320322","parent_id":"320300","area_name":"\u6c9b\u53bf"},"320324":{"area_id":"320324","parent_id":"320300","area_name":"\u7762\u5b81\u53bf"},"320381":{"area_id":"320381","parent_id":"320300","area_name":"\u65b0\u6c82\u5e02"},"320382":{"area_id":"320382","parent_id":"320300","area_name":"\u90b3\u5dde\u5e02"},"320400":{"area_id":"320400","parent_id":"320000","area_name":"\u5e38\u5dde\u5e02"},"320401":{"area_id":"320401","parent_id":"320400","area_name":"\u5e38\u5dde\u5e02\u5e02\u8f96\u533a"},"320402":{"area_id":"320402","parent_id":"320400","area_name":"\u5929\u5b81\u533a"},"320404":{"area_id":"320404","parent_id":"320400","area_name":"\u949f\u697c\u533a"},"320405":{"area_id":"320405","parent_id":"320400","area_name":"\u621a\u5885\u5830\u533a"},"320411":{"area_id":"320411","parent_id":"320400","area_name":"\u65b0\u5317\u533a"},"320412":{"area_id":"320412","parent_id":"320400","area_name":"\u6b66\u8fdb\u533a"},"320481":{"area_id":"320481","parent_id":"320400","area_name":"\u6ea7\u9633\u5e02"},"320482":{"area_id":"320482","parent_id":"320400","area_name":"\u91d1\u575b\u5e02"},"320500":{"area_id":"320500","parent_id":"320000","area_name":"\u82cf\u5dde\u5e02"},"320501":{"area_id":"320501","parent_id":"320500","area_name":"\u82cf\u5dde\u5e02\u5e02\u8f96\u533a"},"320505":{"area_id":"320505","parent_id":"320500","area_name":"\u864e\u4e18\u533a"},"320506":{"area_id":"320506","parent_id":"320500","area_name":"\u5434\u4e2d\u533a"},"320507":{"area_id":"320507","parent_id":"320500","area_name":"\u76f8\u57ce\u533a"},"320508":{"area_id":"320508","parent_id":"320500","area_name":"\u59d1\u82cf\u533a"},"320509":{"area_id":"320509","parent_id":"320500","area_name":"\u5434\u6c5f\u533a"},"320581":{"area_id":"320581","parent_id":"320500","area_name":"\u5e38\u719f\u5e02"},"320582":{"area_id":"320582","parent_id":"320500","area_name":"\u5f20\u5bb6\u6e2f\u5e02"},"320583":{"area_id":"320583","parent_id":"320500","area_name":"\u6606\u5c71\u5e02"},"320585":{"area_id":"320585","parent_id":"320500","area_name":"\u592a\u4ed3\u5e02"},"320600":{"area_id":"320600","parent_id":"320000","area_name":"\u5357\u901a\u5e02"},"320601":{"area_id":"320601","parent_id":"320600","area_name":"\u5357\u901a\u5e02\u5e02\u8f96\u533a"},"320602":{"area_id":"320602","parent_id":"320600","area_name":"\u5d07\u5ddd\u533a"},"320611":{"area_id":"320611","parent_id":"320600","area_name":"\u6e2f\u95f8\u533a"},"320612":{"area_id":"320612","parent_id":"320600","area_name":"\u901a\u5dde\u533a"},"320621":{"area_id":"320621","parent_id":"320600","area_name":"\u6d77\u5b89\u53bf"},"320623":{"area_id":"320623","parent_id":"320600","area_name":"\u5982\u4e1c\u53bf"},"320681":{"area_id":"320681","parent_id":"320600","area_name":"\u542f\u4e1c\u5e02"},"320682":{"area_id":"320682","parent_id":"320600","area_name":"\u5982\u768b\u5e02"},"320684":{"area_id":"320684","parent_id":"320600","area_name":"\u6d77\u95e8\u5e02"},"320700":{"area_id":"320700","parent_id":"320000","area_name":"\u8fde\u4e91\u6e2f\u5e02"},"320701":{"area_id":"320701","parent_id":"320700","area_name":"\u8fde\u4e91\u6e2f\u5e02\u5e02\u8f96\u533a"},"320703":{"area_id":"320703","parent_id":"320700","area_name":"\u8fde\u4e91\u533a"},"320705":{"area_id":"320705","parent_id":"320700","area_name":"\u65b0\u6d66\u533a"},"320706":{"area_id":"320706","parent_id":"320700","area_name":"\u6d77\u5dde\u533a"},"320721":{"area_id":"320721","parent_id":"320700","area_name":"\u8d63\u6986\u53bf"},"320722":{"area_id":"320722","parent_id":"320700","area_name":"\u4e1c\u6d77\u53bf"},"320723":{"area_id":"320723","parent_id":"320700","area_name":"\u704c\u4e91\u53bf"},"320724":{"area_id":"320724","parent_id":"320700","area_name":"\u704c\u5357\u53bf"},"320800":{"area_id":"320800","parent_id":"320000","area_name":"\u6dee\u5b89\u5e02"},"320801":{"area_id":"320801","parent_id":"320800","area_name":"\u6dee\u5b89\u5e02\u5e02\u8f96\u533a"},"320802":{"area_id":"320802","parent_id":"320800","area_name":"\u6e05\u6cb3\u533a"},"320803":{"area_id":"320803","parent_id":"320800","area_name":"\u6dee\u5b89\u533a"},"320804":{"area_id":"320804","parent_id":"320800","area_name":"\u6dee\u9634\u533a"},"320811":{"area_id":"320811","parent_id":"320800","area_name":"\u6e05\u6d66\u533a"},"320826":{"area_id":"320826","parent_id":"320800","area_name":"\u6d9f\u6c34\u53bf"},"320829":{"area_id":"320829","parent_id":"320800","area_name":"\u6d2a\u6cfd\u53bf"},"320830":{"area_id":"320830","parent_id":"320800","area_name":"\u76f1\u7719\u53bf"},"320831":{"area_id":"320831","parent_id":"320800","area_name":"\u91d1\u6e56\u53bf"},"320900":{"area_id":"320900","parent_id":"320000","area_name":"\u76d0\u57ce\u5e02"},"320901":{"area_id":"320901","parent_id":"320900","area_name":"\u76d0\u57ce\u5e02\u5e02\u8f96\u533a"},"320902":{"area_id":"320902","parent_id":"320900","area_name":"\u4ead\u6e56\u533a"},"320903":{"area_id":"320903","parent_id":"320900","area_name":"\u76d0\u90fd\u533a"},"320921":{"area_id":"320921","parent_id":"320900","area_name":"\u54cd\u6c34\u53bf"},"320922":{"area_id":"320922","parent_id":"320900","area_name":"\u6ee8\u6d77\u53bf"},"320923":{"area_id":"320923","parent_id":"320900","area_name":"\u961c\u5b81\u53bf"},"320924":{"area_id":"320924","parent_id":"320900","area_name":"\u5c04\u9633\u53bf"},"320925":{"area_id":"320925","parent_id":"320900","area_name":"\u5efa\u6e56\u53bf"},"320981":{"area_id":"320981","parent_id":"320900","area_name":"\u4e1c\u53f0\u5e02"},"320982":{"area_id":"320982","parent_id":"320900","area_name":"\u5927\u4e30\u5e02"},"321000":{"area_id":"321000","parent_id":"320000","area_name":"\u626c\u5dde\u5e02"},"321001":{"area_id":"321001","parent_id":"321000","area_name":"\u626c\u5dde\u5e02\u5e02\u8f96\u533a"},"321002":{"area_id":"321002","parent_id":"321000","area_name":"\u5e7f\u9675\u533a"},"321003":{"area_id":"321003","parent_id":"321000","area_name":"\u9097\u6c5f\u533a"},"321012":{"area_id":"321012","parent_id":"321000","area_name":"\u6c5f\u90fd\u533a"},"321023":{"area_id":"321023","parent_id":"321000","area_name":"\u5b9d\u5e94\u53bf"},"321081":{"area_id":"321081","parent_id":"321000","area_name":"\u4eea\u5f81\u5e02"},"321084":{"area_id":"321084","parent_id":"321000","area_name":"\u9ad8\u90ae\u5e02"},"321100":{"area_id":"321100","parent_id":"320000","area_name":"\u9547\u6c5f\u5e02"},"321101":{"area_id":"321101","parent_id":"321100","area_name":"\u9547\u6c5f\u5e02\u5e02\u8f96\u533a"},"321102":{"area_id":"321102","parent_id":"321100","area_name":"\u4eac\u53e3\u533a"},"321111":{"area_id":"321111","parent_id":"321100","area_name":"\u6da6\u5dde\u533a"},"321112":{"area_id":"321112","parent_id":"321100","area_name":"\u4e39\u5f92\u533a"},"321181":{"area_id":"321181","parent_id":"321100","area_name":"\u4e39\u9633\u5e02"},"321182":{"area_id":"321182","parent_id":"321100","area_name":"\u626c\u4e2d\u5e02"},"321183":{"area_id":"321183","parent_id":"321100","area_name":"\u53e5\u5bb9\u5e02"},"321200":{"area_id":"321200","parent_id":"320000","area_name":"\u6cf0\u5dde\u5e02"},"321201":{"area_id":"321201","parent_id":"321200","area_name":"\u6cf0\u5dde\u5e02\u5e02\u8f96\u533a"},"321202":{"area_id":"321202","parent_id":"321200","area_name":"\u6d77\u9675\u533a"},"321203":{"area_id":"321203","parent_id":"321200","area_name":"\u9ad8\u6e2f\u533a"},"321204":{"area_id":"321204","parent_id":"321200","area_name":"\u59dc\u5830\u533a"},"321281":{"area_id":"321281","parent_id":"321200","area_name":"\u5174\u5316\u5e02"},"321282":{"area_id":"321282","parent_id":"321200","area_name":"\u9756\u6c5f\u5e02"},"321283":{"area_id":"321283","parent_id":"321200","area_name":"\u6cf0\u5174\u5e02"},"321300":{"area_id":"321300","parent_id":"320000","area_name":"\u5bbf\u8fc1\u5e02"},"321301":{"area_id":"321301","parent_id":"321300","area_name":"\u5bbf\u8fc1\u5e02\u5e02\u8f96\u533a"},"321302":{"area_id":"321302","parent_id":"321300","area_name":"\u5bbf\u57ce\u533a"},"321311":{"area_id":"321311","parent_id":"321300","area_name":"\u5bbf\u8c6b\u533a"},"321322":{"area_id":"321322","parent_id":"321300","area_name":"\u6cad\u9633\u53bf"},"321323":{"area_id":"321323","parent_id":"321300","area_name":"\u6cd7\u9633\u53bf"},"321324":{"area_id":"321324","parent_id":"321300","area_name":"\u6cd7\u6d2a\u53bf"},"330000":{"area_id":"330000","parent_id":"0","area_name":"\u6d59\u6c5f\u7701"},"330100":{"area_id":"330100","parent_id":"330000","area_name":"\u676d\u5dde\u5e02"},"330101":{"area_id":"330101","parent_id":"330100","area_name":"\u676d\u5dde\u5e02\u5e02\u8f96\u533a"},"330102":{"area_id":"330102","parent_id":"330100","area_name":"\u4e0a\u57ce\u533a"},"330103":{"area_id":"330103","parent_id":"330100","area_name":"\u4e0b\u57ce\u533a"},"330104":{"area_id":"330104","parent_id":"330100","area_name":"\u6c5f\u5e72\u533a"},"330105":{"area_id":"330105","parent_id":"330100","area_name":"\u62f1\u5885\u533a"},"330106":{"area_id":"330106","parent_id":"330100","area_name":"\u897f\u6e56\u533a"},"330108":{"area_id":"330108","parent_id":"330100","area_name":"\u6ee8\u6c5f\u533a"},"330109":{"area_id":"330109","parent_id":"330100","area_name":"\u8427\u5c71\u533a"},"330110":{"area_id":"330110","parent_id":"330100","area_name":"\u4f59\u676d\u533a"},"330122":{"area_id":"330122","parent_id":"330100","area_name":"\u6850\u5e90\u53bf"},"330127":{"area_id":"330127","parent_id":"330100","area_name":"\u6df3\u5b89\u53bf"},"330182":{"area_id":"330182","parent_id":"330100","area_name":"\u5efa\u5fb7\u5e02"},"330183":{"area_id":"330183","parent_id":"330100","area_name":"\u5bcc\u9633\u5e02"},"330185":{"area_id":"330185","parent_id":"330100","area_name":"\u4e34\u5b89\u5e02"},"330200":{"area_id":"330200","parent_id":"330000","area_name":"\u5b81\u6ce2\u5e02"},"330201":{"area_id":"330201","parent_id":"330200","area_name":"\u5b81\u6ce2\u5e02\u5e02\u8f96\u533a"},"330203":{"area_id":"330203","parent_id":"330200","area_name":"\u6d77\u66d9\u533a"},"330204":{"area_id":"330204","parent_id":"330200","area_name":"\u6c5f\u4e1c\u533a"},"330205":{"area_id":"330205","parent_id":"330200","area_name":"\u6c5f\u5317\u533a"},"330206":{"area_id":"330206","parent_id":"330200","area_name":"\u5317\u4ed1\u533a"},"330211":{"area_id":"330211","parent_id":"330200","area_name":"\u9547\u6d77\u533a"},"330212":{"area_id":"330212","parent_id":"330200","area_name":"\u911e\u5dde\u533a"},"330225":{"area_id":"330225","parent_id":"330200","area_name":"\u8c61\u5c71\u53bf"},"330226":{"area_id":"330226","parent_id":"330200","area_name":"\u5b81\u6d77\u53bf"},"330281":{"area_id":"330281","parent_id":"330200","area_name":"\u4f59\u59da\u5e02"},"330282":{"area_id":"330282","parent_id":"330200","area_name":"\u6148\u6eaa\u5e02"},"330283":{"area_id":"330283","parent_id":"330200","area_name":"\u5949\u5316\u5e02"},"330300":{"area_id":"330300","parent_id":"330000","area_name":"\u6e29\u5dde\u5e02"},"330301":{"area_id":"330301","parent_id":"330300","area_name":"\u6e29\u5dde\u5e02\u5e02\u8f96\u533a"},"330302":{"area_id":"330302","parent_id":"330300","area_name":"\u9e7f\u57ce\u533a"},"330303":{"area_id":"330303","parent_id":"330300","area_name":"\u9f99\u6e7e\u533a"},"330304":{"area_id":"330304","parent_id":"330300","area_name":"\u74ef\u6d77\u533a"},"330322":{"area_id":"330322","parent_id":"330300","area_name":"\u6d1e\u5934\u53bf"},"330324":{"area_id":"330324","parent_id":"330300","area_name":"\u6c38\u5609\u53bf"},"330326":{"area_id":"330326","parent_id":"330300","area_name":"\u5e73\u9633\u53bf"},"330327":{"area_id":"330327","parent_id":"330300","area_name":"\u82cd\u5357\u53bf"},"330328":{"area_id":"330328","parent_id":"330300","area_name":"\u6587\u6210\u53bf"},"330329":{"area_id":"330329","parent_id":"330300","area_name":"\u6cf0\u987a\u53bf"},"330381":{"area_id":"330381","parent_id":"330300","area_name":"\u745e\u5b89\u5e02"},"330382":{"area_id":"330382","parent_id":"330300","area_name":"\u4e50\u6e05\u5e02"},"330400":{"area_id":"330400","parent_id":"330000","area_name":"\u5609\u5174\u5e02"},"330401":{"area_id":"330401","parent_id":"330400","area_name":"\u5609\u5174\u5e02\u5e02\u8f96\u533a"},"330402":{"area_id":"330402","parent_id":"330400","area_name":"\u5357\u6e56\u533a"},"330411":{"area_id":"330411","parent_id":"330400","area_name":"\u79c0\u6d32\u533a"},"330421":{"area_id":"330421","parent_id":"330400","area_name":"\u5609\u5584\u53bf"},"330424":{"area_id":"330424","parent_id":"330400","area_name":"\u6d77\u76d0\u53bf"},"330481":{"area_id":"330481","parent_id":"330400","area_name":"\u6d77\u5b81\u5e02"},"330482":{"area_id":"330482","parent_id":"330400","area_name":"\u5e73\u6e56\u5e02"},"330483":{"area_id":"330483","parent_id":"330400","area_name":"\u6850\u4e61\u5e02"},"330500":{"area_id":"330500","parent_id":"330000","area_name":"\u6e56\u5dde\u5e02"},"330501":{"area_id":"330501","parent_id":"330500","area_name":"\u6e56\u5dde\u5e02\u5e02\u8f96\u533a"},"330502":{"area_id":"330502","parent_id":"330500","area_name":"\u5434\u5174\u533a"},"330503":{"area_id":"330503","parent_id":"330500","area_name":"\u5357\u6d54\u533a"},"330521":{"area_id":"330521","parent_id":"330500","area_name":"\u5fb7\u6e05\u53bf"},"330522":{"area_id":"330522","parent_id":"330500","area_name":"\u957f\u5174\u53bf"},"330523":{"area_id":"330523","parent_id":"330500","area_name":"\u5b89\u5409\u53bf"},"330600":{"area_id":"330600","parent_id":"330000","area_name":"\u7ecd\u5174\u5e02"},"330601":{"area_id":"330601","parent_id":"330600","area_name":"\u7ecd\u5174\u5e02\u5e02\u8f96\u533a"},"330602":{"area_id":"330602","parent_id":"330600","area_name":"\u8d8a\u57ce\u533a"},"330621":{"area_id":"330621","parent_id":"330600","area_name":"\u7ecd\u5174\u53bf"},"330624":{"area_id":"330624","parent_id":"330600","area_name":"\u65b0\u660c\u53bf"},"330681":{"area_id":"330681","parent_id":"330600","area_name":"\u8bf8\u66a8\u5e02"},"330682":{"area_id":"330682","parent_id":"330600","area_name":"\u4e0a\u865e\u5e02"},"330683":{"area_id":"330683","parent_id":"330600","area_name":"\u5d4a\u5dde\u5e02"},"330700":{"area_id":"330700","parent_id":"330000","area_name":"\u91d1\u534e\u5e02"},"330701":{"area_id":"330701","parent_id":"330700","area_name":"\u91d1\u534e\u5e02\u5e02\u8f96\u533a"},"330702":{"area_id":"330702","parent_id":"330700","area_name":"\u5a7a\u57ce\u533a"},"330703":{"area_id":"330703","parent_id":"330700","area_name":"\u91d1\u4e1c\u533a"},"330723":{"area_id":"330723","parent_id":"330700","area_name":"\u6b66\u4e49\u53bf"},"330726":{"area_id":"330726","parent_id":"330700","area_name":"\u6d66\u6c5f\u53bf"},"330727":{"area_id":"330727","parent_id":"330700","area_name":"\u78d0\u5b89\u53bf"},"330781":{"area_id":"330781","parent_id":"330700","area_name":"\u5170\u6eaa\u5e02"},"330782":{"area_id":"330782","parent_id":"330700","area_name":"\u4e49\u4e4c\u5e02"},"330783":{"area_id":"330783","parent_id":"330700","area_name":"\u4e1c\u9633\u5e02"},"330784":{"area_id":"330784","parent_id":"330700","area_name":"\u6c38\u5eb7\u5e02"},"330800":{"area_id":"330800","parent_id":"330000","area_name":"\u8862\u5dde\u5e02"},"330801":{"area_id":"330801","parent_id":"330800","area_name":"\u8862\u5dde\u5e02\u5e02\u8f96\u533a"},"330802":{"area_id":"330802","parent_id":"330800","area_name":"\u67ef\u57ce\u533a"},"330803":{"area_id":"330803","parent_id":"330800","area_name":"\u8862\u6c5f\u533a"},"330822":{"area_id":"330822","parent_id":"330800","area_name":"\u5e38\u5c71\u53bf"},"330824":{"area_id":"330824","parent_id":"330800","area_name":"\u5f00\u5316\u53bf"},"330825":{"area_id":"330825","parent_id":"330800","area_name":"\u9f99\u6e38\u53bf"},"330881":{"area_id":"330881","parent_id":"330800","area_name":"\u6c5f\u5c71\u5e02"},"330900":{"area_id":"330900","parent_id":"330000","area_name":"\u821f\u5c71\u5e02"},"330901":{"area_id":"330901","parent_id":"330900","area_name":"\u821f\u5c71\u5e02\u5e02\u8f96\u533a"},"330902":{"area_id":"330902","parent_id":"330900","area_name":"\u5b9a\u6d77\u533a"},"330903":{"area_id":"330903","parent_id":"330900","area_name":"\u666e\u9640\u533a"},"330921":{"area_id":"330921","parent_id":"330900","area_name":"\u5cb1\u5c71\u53bf"},"330922":{"area_id":"330922","parent_id":"330900","area_name":"\u5d4a\u6cd7\u53bf"},"331000":{"area_id":"331000","parent_id":"330000","area_name":"\u53f0\u5dde\u5e02"},"331001":{"area_id":"331001","parent_id":"331000","area_name":"\u53f0\u5dde\u5e02\u5e02\u8f96\u533a"},"331002":{"area_id":"331002","parent_id":"331000","area_name":"\u6912\u6c5f\u533a"},"331003":{"area_id":"331003","parent_id":"331000","area_name":"\u9ec4\u5ca9\u533a"},"331004":{"area_id":"331004","parent_id":"331000","area_name":"\u8def\u6865\u533a"},"331021":{"area_id":"331021","parent_id":"331000","area_name":"\u7389\u73af\u53bf"},"331022":{"area_id":"331022","parent_id":"331000","area_name":"\u4e09\u95e8\u53bf"},"331023":{"area_id":"331023","parent_id":"331000","area_name":"\u5929\u53f0\u53bf"},"331024":{"area_id":"331024","parent_id":"331000","area_name":"\u4ed9\u5c45\u53bf"},"331081":{"area_id":"331081","parent_id":"331000","area_name":"\u6e29\u5cad\u5e02"},"331082":{"area_id":"331082","parent_id":"331000","area_name":"\u4e34\u6d77\u5e02"},"331100":{"area_id":"331100","parent_id":"330000","area_name":"\u4e3d\u6c34\u5e02"},"331101":{"area_id":"331101","parent_id":"331100","area_name":"\u4e3d\u6c34\u5e02\u5e02\u8f96\u533a"},"331102":{"area_id":"331102","parent_id":"331100","area_name":"\u83b2\u90fd\u533a"},"331121":{"area_id":"331121","parent_id":"331100","area_name":"\u9752\u7530\u53bf"},"331122":{"area_id":"331122","parent_id":"331100","area_name":"\u7f19\u4e91\u53bf"},"331123":{"area_id":"331123","parent_id":"331100","area_name":"\u9042\u660c\u53bf"},"331124":{"area_id":"331124","parent_id":"331100","area_name":"\u677e\u9633\u53bf"},"331125":{"area_id":"331125","parent_id":"331100","area_name":"\u4e91\u548c\u53bf"},"331126":{"area_id":"331126","parent_id":"331100","area_name":"\u5e86\u5143\u53bf"},"331127":{"area_id":"331127","parent_id":"331100","area_name":"\u666f\u5b81\u7572\u65cf\u81ea\u6cbb\u53bf"},"331181":{"area_id":"331181","parent_id":"331100","area_name":"\u9f99\u6cc9\u5e02"},"340000":{"area_id":"340000","parent_id":"0","area_name":"\u5b89\u5fbd\u7701"},"340100":{"area_id":"340100","parent_id":"340000","area_name":"\u5408\u80a5\u5e02"},"340101":{"area_id":"340101","parent_id":"340100","area_name":"\u5408\u80a5\u5e02\u5e02\u8f96\u533a"},"340102":{"area_id":"340102","parent_id":"340100","area_name":"\u7476\u6d77\u533a"},"340103":{"area_id":"340103","parent_id":"340100","area_name":"\u5e90\u9633\u533a"},"340104":{"area_id":"340104","parent_id":"340100","area_name":"\u8700\u5c71\u533a"},"340111":{"area_id":"340111","parent_id":"340100","area_name":"\u5305\u6cb3\u533a"},"340121":{"area_id":"340121","parent_id":"340100","area_name":"\u957f\u4e30\u53bf"},"340122":{"area_id":"340122","parent_id":"340100","area_name":"\u80a5\u4e1c\u53bf"},"340123":{"area_id":"340123","parent_id":"340100","area_name":"\u80a5\u897f\u53bf"},"340124":{"area_id":"340124","parent_id":"340100","area_name":"\u5e90\u6c5f\u53bf"},"340181":{"area_id":"340181","parent_id":"340100","area_name":"\u5de2\u6e56\u5e02"},"340200":{"area_id":"340200","parent_id":"340000","area_name":"\u829c\u6e56\u5e02"},"340201":{"area_id":"340201","parent_id":"340200","area_name":"\u829c\u6e56\u5e02\u5e02\u8f96\u533a"},"340202":{"area_id":"340202","parent_id":"340200","area_name":"\u955c\u6e56\u533a"},"340203":{"area_id":"340203","parent_id":"340200","area_name":"\u5f0b\u6c5f\u533a"},"340207":{"area_id":"340207","parent_id":"340200","area_name":"\u9e20\u6c5f\u533a"},"340208":{"area_id":"340208","parent_id":"340200","area_name":"\u4e09\u5c71\u533a"},"340221":{"area_id":"340221","parent_id":"340200","area_name":"\u829c\u6e56\u53bf"},"340222":{"area_id":"340222","parent_id":"340200","area_name":"\u7e41\u660c\u53bf"},"340223":{"area_id":"340223","parent_id":"340200","area_name":"\u5357\u9675\u53bf"},"340225":{"area_id":"340225","parent_id":"340200","area_name":"\u65e0\u4e3a\u53bf"},"340300":{"area_id":"340300","parent_id":"340000","area_name":"\u868c\u57e0\u5e02"},"340301":{"area_id":"340301","parent_id":"340300","area_name":"\u868c\u57e0\u5e02\u5e02\u8f96\u533a"},"340302":{"area_id":"340302","parent_id":"340300","area_name":"\u9f99\u5b50\u6e56\u533a"},"340303":{"area_id":"340303","parent_id":"340300","area_name":"\u868c\u5c71\u533a"},"340304":{"area_id":"340304","parent_id":"340300","area_name":"\u79b9\u4f1a\u533a"},"340311":{"area_id":"340311","parent_id":"340300","area_name":"\u6dee\u4e0a\u533a"},"340321":{"area_id":"340321","parent_id":"340300","area_name":"\u6000\u8fdc\u53bf"},"340322":{"area_id":"340322","parent_id":"340300","area_name":"\u4e94\u6cb3\u53bf"},"340323":{"area_id":"340323","parent_id":"340300","area_name":"\u56fa\u9547\u53bf"},"340400":{"area_id":"340400","parent_id":"340000","area_name":"\u6dee\u5357\u5e02"},"340401":{"area_id":"340401","parent_id":"340400","area_name":"\u6dee\u5357\u5e02\u5e02\u8f96\u533a"},"340402":{"area_id":"340402","parent_id":"340400","area_name":"\u5927\u901a\u533a"},"340403":{"area_id":"340403","parent_id":"340400","area_name":"\u7530\u5bb6\u5eb5\u533a"},"340404":{"area_id":"340404","parent_id":"340400","area_name":"\u8c22\u5bb6\u96c6\u533a"},"340405":{"area_id":"340405","parent_id":"340400","area_name":"\u516b\u516c\u5c71\u533a"},"340406":{"area_id":"340406","parent_id":"340400","area_name":"\u6f58\u96c6\u533a"},"340421":{"area_id":"340421","parent_id":"340400","area_name":"\u51e4\u53f0\u53bf"},"340500":{"area_id":"340500","parent_id":"340000","area_name":"\u9a6c\u978d\u5c71\u5e02"},"340501":{"area_id":"340501","parent_id":"340500","area_name":"\u9a6c\u978d\u5c71\u5e02\u5e02\u8f96\u533a"},"340503":{"area_id":"340503","parent_id":"340500","area_name":"\u82b1\u5c71\u533a"},"340504":{"area_id":"340504","parent_id":"340500","area_name":"\u96e8\u5c71\u533a"},"340506":{"area_id":"340506","parent_id":"340500","area_name":"\u535a\u671b\u533a"},"340521":{"area_id":"340521","parent_id":"340500","area_name":"\u5f53\u6d82\u53bf"},"340522":{"area_id":"340522","parent_id":"340500","area_name":"\u542b\u5c71\u53bf"},"340523":{"area_id":"340523","parent_id":"340500","area_name":"\u548c\u53bf"},"340600":{"area_id":"340600","parent_id":"340000","area_name":"\u6dee\u5317\u5e02"},"340601":{"area_id":"340601","parent_id":"340600","area_name":"\u6dee\u5317\u5e02\u5e02\u8f96\u533a"},"340602":{"area_id":"340602","parent_id":"340600","area_name":"\u675c\u96c6\u533a"},"340603":{"area_id":"340603","parent_id":"340600","area_name":"\u76f8\u5c71\u533a"},"340604":{"area_id":"340604","parent_id":"340600","area_name":"\u70c8\u5c71\u533a"},"340621":{"area_id":"340621","parent_id":"340600","area_name":"\u6fc9\u6eaa\u53bf"},"340700":{"area_id":"340700","parent_id":"340000","area_name":"\u94dc\u9675\u5e02"},"340701":{"area_id":"340701","parent_id":"340700","area_name":"\u94dc\u9675\u5e02\u5e02\u8f96\u533a"},"340702":{"area_id":"340702","parent_id":"340700","area_name":"\u94dc\u5b98\u5c71\u533a"},"340703":{"area_id":"340703","parent_id":"340700","area_name":"\u72ee\u5b50\u5c71\u533a"},"340711":{"area_id":"340711","parent_id":"340700","area_name":"\u90ca\u533a"},"340721":{"area_id":"340721","parent_id":"340700","area_name":"\u94dc\u9675\u53bf"},"340800":{"area_id":"340800","parent_id":"340000","area_name":"\u5b89\u5e86\u5e02"},"340801":{"area_id":"340801","parent_id":"340800","area_name":"\u5b89\u5e86\u5e02\u5e02\u8f96\u533a"},"340802":{"area_id":"340802","parent_id":"340800","area_name":"\u8fce\u6c5f\u533a"},"340803":{"area_id":"340803","parent_id":"340800","area_name":"\u5927\u89c2\u533a"},"340811":{"area_id":"340811","parent_id":"340800","area_name":"\u5b9c\u79c0\u533a"},"340822":{"area_id":"340822","parent_id":"340800","area_name":"\u6000\u5b81\u53bf"},"340823":{"area_id":"340823","parent_id":"340800","area_name":"\u679e\u9633\u53bf"},"340824":{"area_id":"340824","parent_id":"340800","area_name":"\u6f5c\u5c71\u53bf"},"340825":{"area_id":"340825","parent_id":"340800","area_name":"\u592a\u6e56\u53bf"},"340826":{"area_id":"340826","parent_id":"340800","area_name":"\u5bbf\u677e\u53bf"},"340827":{"area_id":"340827","parent_id":"340800","area_name":"\u671b\u6c5f\u53bf"},"340828":{"area_id":"340828","parent_id":"340800","area_name":"\u5cb3\u897f\u53bf"},"340881":{"area_id":"340881","parent_id":"340800","area_name":"\u6850\u57ce\u5e02"},"341000":{"area_id":"341000","parent_id":"340000","area_name":"\u9ec4\u5c71\u5e02"},"341001":{"area_id":"341001","parent_id":"341000","area_name":"\u9ec4\u5c71\u5e02\u5e02\u8f96\u533a"},"341002":{"area_id":"341002","parent_id":"341000","area_name":"\u5c6f\u6eaa\u533a"},"341003":{"area_id":"341003","parent_id":"341000","area_name":"\u9ec4\u5c71\u533a"},"341004":{"area_id":"341004","parent_id":"341000","area_name":"\u5fbd\u5dde\u533a"},"341021":{"area_id":"341021","parent_id":"341000","area_name":"\u6b59\u53bf"},"341022":{"area_id":"341022","parent_id":"341000","area_name":"\u4f11\u5b81\u53bf"},"341023":{"area_id":"341023","parent_id":"341000","area_name":"\u9edf\u53bf"},"341024":{"area_id":"341024","parent_id":"341000","area_name":"\u7941\u95e8\u53bf"},"341100":{"area_id":"341100","parent_id":"340000","area_name":"\u6ec1\u5dde\u5e02"},"341101":{"area_id":"341101","parent_id":"341100","area_name":"\u6ec1\u5dde\u5e02\u5e02\u8f96\u533a"},"341102":{"area_id":"341102","parent_id":"341100","area_name":"\u7405\u740a\u533a"},"341103":{"area_id":"341103","parent_id":"341100","area_name":"\u5357\u8c2f\u533a"},"341122":{"area_id":"341122","parent_id":"341100","area_name":"\u6765\u5b89\u53bf"},"341124":{"area_id":"341124","parent_id":"341100","area_name":"\u5168\u6912\u53bf"},"341125":{"area_id":"341125","parent_id":"341100","area_name":"\u5b9a\u8fdc\u53bf"},"341126":{"area_id":"341126","parent_id":"341100","area_name":"\u51e4\u9633\u53bf"},"341181":{"area_id":"341181","parent_id":"341100","area_name":"\u5929\u957f\u5e02"},"341182":{"area_id":"341182","parent_id":"341100","area_name":"\u660e\u5149\u5e02"},"341200":{"area_id":"341200","parent_id":"340000","area_name":"\u961c\u9633\u5e02"},"341201":{"area_id":"341201","parent_id":"341200","area_name":"\u961c\u9633\u5e02\u5e02\u8f96\u533a"},"341202":{"area_id":"341202","parent_id":"341200","area_name":"\u988d\u5dde\u533a"},"341203":{"area_id":"341203","parent_id":"341200","area_name":"\u988d\u4e1c\u533a"},"341204":{"area_id":"341204","parent_id":"341200","area_name":"\u988d\u6cc9\u533a"},"341221":{"area_id":"341221","parent_id":"341200","area_name":"\u4e34\u6cc9\u53bf"},"341222":{"area_id":"341222","parent_id":"341200","area_name":"\u592a\u548c\u53bf"},"341225":{"area_id":"341225","parent_id":"341200","area_name":"\u961c\u5357\u53bf"},"341226":{"area_id":"341226","parent_id":"341200","area_name":"\u988d\u4e0a\u53bf"},"341282":{"area_id":"341282","parent_id":"341200","area_name":"\u754c\u9996\u5e02"},"341300":{"area_id":"341300","parent_id":"340000","area_name":"\u5bbf\u5dde\u5e02"},"341301":{"area_id":"341301","parent_id":"341300","area_name":"\u5bbf\u5dde\u5e02\u5e02\u8f96\u533a"},"341302":{"area_id":"341302","parent_id":"341300","area_name":"\u57c7\u6865\u533a"},"341321":{"area_id":"341321","parent_id":"341300","area_name":"\u7800\u5c71\u53bf"},"341322":{"area_id":"341322","parent_id":"341300","area_name":"\u8427\u53bf"},"341323":{"area_id":"341323","parent_id":"341300","area_name":"\u7075\u74a7\u53bf"},"341324":{"area_id":"341324","parent_id":"341300","area_name":"\u6cd7\u53bf"},"341500":{"area_id":"341500","parent_id":"340000","area_name":"\u516d\u5b89\u5e02"},"341501":{"area_id":"341501","parent_id":"341500","area_name":"\u516d\u5b89\u5e02\u5e02\u8f96\u533a"},"341502":{"area_id":"341502","parent_id":"341500","area_name":"\u91d1\u5b89\u533a"},"341503":{"area_id":"341503","parent_id":"341500","area_name":"\u88d5\u5b89\u533a"},"341521":{"area_id":"341521","parent_id":"341500","area_name":"\u5bff\u53bf"},"341522":{"area_id":"341522","parent_id":"341500","area_name":"\u970d\u90b1\u53bf"},"341523":{"area_id":"341523","parent_id":"341500","area_name":"\u8212\u57ce\u53bf"},"341524":{"area_id":"341524","parent_id":"341500","area_name":"\u91d1\u5be8\u53bf"},"341525":{"area_id":"341525","parent_id":"341500","area_name":"\u970d\u5c71\u53bf"},"341600":{"area_id":"341600","parent_id":"340000","area_name":"\u4eb3\u5dde\u5e02"},"341601":{"area_id":"341601","parent_id":"341600","area_name":"\u4eb3\u5dde\u5e02\u5e02\u8f96\u533a"},"341602":{"area_id":"341602","parent_id":"341600","area_name":"\u8c2f\u57ce\u533a"},"341621":{"area_id":"341621","parent_id":"341600","area_name":"\u6da1\u9633\u53bf"},"341622":{"area_id":"341622","parent_id":"341600","area_name":"\u8499\u57ce\u53bf"},"341623":{"area_id":"341623","parent_id":"341600","area_name":"\u5229\u8f9b\u53bf"},"341700":{"area_id":"341700","parent_id":"340000","area_name":"\u6c60\u5dde\u5e02"},"341701":{"area_id":"341701","parent_id":"341700","area_name":"\u6c60\u5dde\u5e02\u5e02\u8f96\u533a"},"341702":{"area_id":"341702","parent_id":"341700","area_name":"\u8d35\u6c60\u533a"},"341721":{"area_id":"341721","parent_id":"341700","area_name":"\u4e1c\u81f3\u53bf"},"341722":{"area_id":"341722","parent_id":"341700","area_name":"\u77f3\u53f0\u53bf"},"341723":{"area_id":"341723","parent_id":"341700","area_name":"\u9752\u9633\u53bf"},"341800":{"area_id":"341800","parent_id":"340000","area_name":"\u5ba3\u57ce\u5e02"},"341801":{"area_id":"341801","parent_id":"341800","area_name":"\u5ba3\u57ce\u5e02\u5e02\u8f96\u533a"},"341802":{"area_id":"341802","parent_id":"341800","area_name":"\u5ba3\u5dde\u533a"},"341821":{"area_id":"341821","parent_id":"341800","area_name":"\u90ce\u6eaa\u53bf"},"341822":{"area_id":"341822","parent_id":"341800","area_name":"\u5e7f\u5fb7\u53bf"},"341823":{"area_id":"341823","parent_id":"341800","area_name":"\u6cfe\u53bf"},"341824":{"area_id":"341824","parent_id":"341800","area_name":"\u7ee9\u6eaa\u53bf"},"341825":{"area_id":"341825","parent_id":"341800","area_name":"\u65cc\u5fb7\u53bf"},"341881":{"area_id":"341881","parent_id":"341800","area_name":"\u5b81\u56fd\u5e02"},"350000":{"area_id":"350000","parent_id":"0","area_name":"\u798f\u5efa\u7701"},"350100":{"area_id":"350100","parent_id":"350000","area_name":"\u798f\u5dde\u5e02"},"350101":{"area_id":"350101","parent_id":"350100","area_name":"\u798f\u5dde\u5e02\u5e02\u8f96\u533a"},"350102":{"area_id":"350102","parent_id":"350100","area_name":"\u9f13\u697c\u533a"},"350103":{"area_id":"350103","parent_id":"350100","area_name":"\u53f0\u6c5f\u533a"},"350104":{"area_id":"350104","parent_id":"350100","area_name":"\u4ed3\u5c71\u533a"},"350105":{"area_id":"350105","parent_id":"350100","area_name":"\u9a6c\u5c3e\u533a"},"350111":{"area_id":"350111","parent_id":"350100","area_name":"\u664b\u5b89\u533a"},"350121":{"area_id":"350121","parent_id":"350100","area_name":"\u95fd\u4faf\u53bf"},"350122":{"area_id":"350122","parent_id":"350100","area_name":"\u8fde\u6c5f\u53bf"},"350123":{"area_id":"350123","parent_id":"350100","area_name":"\u7f57\u6e90\u53bf"},"350124":{"area_id":"350124","parent_id":"350100","area_name":"\u95fd\u6e05\u53bf"},"350125":{"area_id":"350125","parent_id":"350100","area_name":"\u6c38\u6cf0\u53bf"},"350128":{"area_id":"350128","parent_id":"350100","area_name":"\u5e73\u6f6d\u53bf"},"350181":{"area_id":"350181","parent_id":"350100","area_name":"\u798f\u6e05\u5e02"},"350182":{"area_id":"350182","parent_id":"350100","area_name":"\u957f\u4e50\u5e02"},"350200":{"area_id":"350200","parent_id":"350000","area_name":"\u53a6\u95e8\u5e02"},"350201":{"area_id":"350201","parent_id":"350200","area_name":"\u53a6\u95e8\u5e02\u5e02\u8f96\u533a"},"350203":{"area_id":"350203","parent_id":"350200","area_name":"\u601d\u660e\u533a"},"350205":{"area_id":"350205","parent_id":"350200","area_name":"\u6d77\u6ca7\u533a"},"350206":{"area_id":"350206","parent_id":"350200","area_name":"\u6e56\u91cc\u533a"},"350211":{"area_id":"350211","parent_id":"350200","area_name":"\u96c6\u7f8e\u533a"},"350212":{"area_id":"350212","parent_id":"350200","area_name":"\u540c\u5b89\u533a"},"350213":{"area_id":"350213","parent_id":"350200","area_name":"\u7fd4\u5b89\u533a"},"350300":{"area_id":"350300","parent_id":"350000","area_name":"\u8386\u7530\u5e02"},"350301":{"area_id":"350301","parent_id":"350300","area_name":"\u8386\u7530\u5e02\u5e02\u8f96\u533a"},"350302":{"area_id":"350302","parent_id":"350300","area_name":"\u57ce\u53a2\u533a"},"350303":{"area_id":"350303","parent_id":"350300","area_name":"\u6db5\u6c5f\u533a"},"350304":{"area_id":"350304","parent_id":"350300","area_name":"\u8354\u57ce\u533a"},"350305":{"area_id":"350305","parent_id":"350300","area_name":"\u79c0\u5c7f\u533a"},"350322":{"area_id":"350322","parent_id":"350300","area_name":"\u4ed9\u6e38\u53bf"},"350400":{"area_id":"350400","parent_id":"350000","area_name":"\u4e09\u660e\u5e02"},"350401":{"area_id":"350401","parent_id":"350400","area_name":"\u4e09\u660e\u5e02\u5e02\u8f96\u533a"},"350402":{"area_id":"350402","parent_id":"350400","area_name":"\u6885\u5217\u533a"},"350403":{"area_id":"350403","parent_id":"350400","area_name":"\u4e09\u5143\u533a"},"350421":{"area_id":"350421","parent_id":"350400","area_name":"\u660e\u6eaa\u53bf"},"350423":{"area_id":"350423","parent_id":"350400","area_name":"\u6e05\u6d41\u53bf"},"350424":{"area_id":"350424","parent_id":"350400","area_name":"\u5b81\u5316\u53bf"},"350425":{"area_id":"350425","parent_id":"350400","area_name":"\u5927\u7530\u53bf"},"350426":{"area_id":"350426","parent_id":"350400","area_name":"\u5c24\u6eaa\u53bf"},"350427":{"area_id":"350427","parent_id":"350400","area_name":"\u6c99\u53bf"},"350428":{"area_id":"350428","parent_id":"350400","area_name":"\u5c06\u4e50\u53bf"},"350429":{"area_id":"350429","parent_id":"350400","area_name":"\u6cf0\u5b81\u53bf"},"350430":{"area_id":"350430","parent_id":"350400","area_name":"\u5efa\u5b81\u53bf"},"350481":{"area_id":"350481","parent_id":"350400","area_name":"\u6c38\u5b89\u5e02"},"350500":{"area_id":"350500","parent_id":"350000","area_name":"\u6cc9\u5dde\u5e02"},"350501":{"area_id":"350501","parent_id":"350500","area_name":"\u6cc9\u5dde\u5e02\u5e02\u8f96\u533a"},"350502":{"area_id":"350502","parent_id":"350500","area_name":"\u9ca4\u57ce\u533a"},"350503":{"area_id":"350503","parent_id":"350500","area_name":"\u4e30\u6cfd\u533a"},"350504":{"area_id":"350504","parent_id":"350500","area_name":"\u6d1b\u6c5f\u533a"},"350505":{"area_id":"350505","parent_id":"350500","area_name":"\u6cc9\u6e2f\u533a"},"350521":{"area_id":"350521","parent_id":"350500","area_name":"\u60e0\u5b89\u53bf"},"350524":{"area_id":"350524","parent_id":"350500","area_name":"\u5b89\u6eaa\u53bf"},"350525":{"area_id":"350525","parent_id":"350500","area_name":"\u6c38\u6625\u53bf"},"350526":{"area_id":"350526","parent_id":"350500","area_name":"\u5fb7\u5316\u53bf"},"350527":{"area_id":"350527","parent_id":"350500","area_name":"\u91d1\u95e8\u53bf"},"350581":{"area_id":"350581","parent_id":"350500","area_name":"\u77f3\u72ee\u5e02"},"350582":{"area_id":"350582","parent_id":"350500","area_name":"\u664b\u6c5f\u5e02"},"350583":{"area_id":"350583","parent_id":"350500","area_name":"\u5357\u5b89\u5e02"},"350600":{"area_id":"350600","parent_id":"350000","area_name":"\u6f33\u5dde\u5e02"},"350601":{"area_id":"350601","parent_id":"350600","area_name":"\u6f33\u5dde\u5e02\u5e02\u8f96\u533a"},"350602":{"area_id":"350602","parent_id":"350600","area_name":"\u8297\u57ce\u533a"},"350603":{"area_id":"350603","parent_id":"350600","area_name":"\u9f99\u6587\u533a"},"350622":{"area_id":"350622","parent_id":"350600","area_name":"\u4e91\u9704\u53bf"},"350623":{"area_id":"350623","parent_id":"350600","area_name":"\u6f33\u6d66\u53bf"},"350624":{"area_id":"350624","parent_id":"350600","area_name":"\u8bcf\u5b89\u53bf"},"350625":{"area_id":"350625","parent_id":"350600","area_name":"\u957f\u6cf0\u53bf"},"350626":{"area_id":"350626","parent_id":"350600","area_name":"\u4e1c\u5c71\u53bf"},"350627":{"area_id":"350627","parent_id":"350600","area_name":"\u5357\u9756\u53bf"},"350628":{"area_id":"350628","parent_id":"350600","area_name":"\u5e73\u548c\u53bf"},"350629":{"area_id":"350629","parent_id":"350600","area_name":"\u534e\u5b89\u53bf"},"350681":{"area_id":"350681","parent_id":"350600","area_name":"\u9f99\u6d77\u5e02"},"350700":{"area_id":"350700","parent_id":"350000","area_name":"\u5357\u5e73\u5e02"},"350701":{"area_id":"350701","parent_id":"350700","area_name":"\u5357\u5e73\u5e02\u5e02\u8f96\u533a"},"350702":{"area_id":"350702","parent_id":"350700","area_name":"\u5ef6\u5e73\u533a"},"350721":{"area_id":"350721","parent_id":"350700","area_name":"\u987a\u660c\u53bf"},"350722":{"area_id":"350722","parent_id":"350700","area_name":"\u6d66\u57ce\u53bf"},"350723":{"area_id":"350723","parent_id":"350700","area_name":"\u5149\u6cfd\u53bf"},"350724":{"area_id":"350724","parent_id":"350700","area_name":"\u677e\u6eaa\u53bf"},"350725":{"area_id":"350725","parent_id":"350700","area_name":"\u653f\u548c\u53bf"},"350781":{"area_id":"350781","parent_id":"350700","area_name":"\u90b5\u6b66\u5e02"},"350782":{"area_id":"350782","parent_id":"350700","area_name":"\u6b66\u5937\u5c71\u5e02"},"350783":{"area_id":"350783","parent_id":"350700","area_name":"\u5efa\u74ef\u5e02"},"350784":{"area_id":"350784","parent_id":"350700","area_name":"\u5efa\u9633\u5e02"},"350800":{"area_id":"350800","parent_id":"350000","area_name":"\u9f99\u5ca9\u5e02"},"350801":{"area_id":"350801","parent_id":"350800","area_name":"\u9f99\u5ca9\u5e02\u5e02\u8f96\u533a"},"350802":{"area_id":"350802","parent_id":"350800","area_name":"\u65b0\u7f57\u533a"},"350821":{"area_id":"350821","parent_id":"350800","area_name":"\u957f\u6c40\u53bf"},"350822":{"area_id":"350822","parent_id":"350800","area_name":"\u6c38\u5b9a\u53bf"},"350823":{"area_id":"350823","parent_id":"350800","area_name":"\u4e0a\u676d\u53bf"},"350824":{"area_id":"350824","parent_id":"350800","area_name":"\u6b66\u5e73\u53bf"},"350825":{"area_id":"350825","parent_id":"350800","area_name":"\u8fde\u57ce\u53bf"},"350881":{"area_id":"350881","parent_id":"350800","area_name":"\u6f33\u5e73\u5e02"},"350900":{"area_id":"350900","parent_id":"350000","area_name":"\u5b81\u5fb7\u5e02"},"350901":{"area_id":"350901","parent_id":"350900","area_name":"\u5b81\u5fb7\u5e02\u5e02\u8f96\u533a"},"350902":{"area_id":"350902","parent_id":"350900","area_name":"\u8549\u57ce\u533a"},"350921":{"area_id":"350921","parent_id":"350900","area_name":"\u971e\u6d66\u53bf"},"350922":{"area_id":"350922","parent_id":"350900","area_name":"\u53e4\u7530\u53bf"},"350923":{"area_id":"350923","parent_id":"350900","area_name":"\u5c4f\u5357\u53bf"},"350924":{"area_id":"350924","parent_id":"350900","area_name":"\u5bff\u5b81\u53bf"},"350925":{"area_id":"350925","parent_id":"350900","area_name":"\u5468\u5b81\u53bf"},"350926":{"area_id":"350926","parent_id":"350900","area_name":"\u67d8\u8363\u53bf"},"350981":{"area_id":"350981","parent_id":"350900","area_name":"\u798f\u5b89\u5e02"},"350982":{"area_id":"350982","parent_id":"350900","area_name":"\u798f\u9f0e\u5e02"},"360000":{"area_id":"360000","parent_id":"0","area_name":"\u6c5f\u897f\u7701"},"360100":{"area_id":"360100","parent_id":"360000","area_name":"\u5357\u660c\u5e02"},"360101":{"area_id":"360101","parent_id":"360100","area_name":"\u5357\u660c\u5e02\u5e02\u8f96\u533a"},"360102":{"area_id":"360102","parent_id":"360100","area_name":"\u4e1c\u6e56\u533a"},"360103":{"area_id":"360103","parent_id":"360100","area_name":"\u897f\u6e56\u533a"},"360104":{"area_id":"360104","parent_id":"360100","area_name":"\u9752\u4e91\u8c31\u533a"},"360105":{"area_id":"360105","parent_id":"360100","area_name":"\u6e7e\u91cc\u533a"},"360111":{"area_id":"360111","parent_id":"360100","area_name":"\u9752\u5c71\u6e56\u533a"},"360121":{"area_id":"360121","parent_id":"360100","area_name":"\u5357\u660c\u53bf"},"360122":{"area_id":"360122","parent_id":"360100","area_name":"\u65b0\u5efa\u53bf"},"360123":{"area_id":"360123","parent_id":"360100","area_name":"\u5b89\u4e49\u53bf"},"360124":{"area_id":"360124","parent_id":"360100","area_name":"\u8fdb\u8d24\u53bf"},"360200":{"area_id":"360200","parent_id":"360000","area_name":"\u666f\u5fb7\u9547\u5e02"},"360201":{"area_id":"360201","parent_id":"360200","area_name":"\u666f\u5fb7\u9547\u5e02\u5e02\u8f96\u533a"},"360202":{"area_id":"360202","parent_id":"360200","area_name":"\u660c\u6c5f\u533a"},"360203":{"area_id":"360203","parent_id":"360200","area_name":"\u73e0\u5c71\u533a"},"360222":{"area_id":"360222","parent_id":"360200","area_name":"\u6d6e\u6881\u53bf"},"360281":{"area_id":"360281","parent_id":"360200","area_name":"\u4e50\u5e73\u5e02"},"360300":{"area_id":"360300","parent_id":"360000","area_name":"\u840d\u4e61\u5e02"},"360301":{"area_id":"360301","parent_id":"360300","area_name":"\u840d\u4e61\u5e02\u5e02\u8f96\u533a"},"360302":{"area_id":"360302","parent_id":"360300","area_name":"\u5b89\u6e90\u533a"},"360313":{"area_id":"360313","parent_id":"360300","area_name":"\u6e58\u4e1c\u533a"},"360321":{"area_id":"360321","parent_id":"360300","area_name":"\u83b2\u82b1\u53bf"},"360322":{"area_id":"360322","parent_id":"360300","area_name":"\u4e0a\u6817\u53bf"},"360323":{"area_id":"360323","parent_id":"360300","area_name":"\u82a6\u6eaa\u53bf"},"360400":{"area_id":"360400","parent_id":"360000","area_name":"\u4e5d\u6c5f\u5e02"},"360401":{"area_id":"360401","parent_id":"360400","area_name":"\u4e5d\u6c5f\u5e02\u5e02\u8f96\u533a"},"360402":{"area_id":"360402","parent_id":"360400","area_name":"\u5e90\u5c71\u533a"},"360403":{"area_id":"360403","parent_id":"360400","area_name":"\u6d54\u9633\u533a"},"360421":{"area_id":"360421","parent_id":"360400","area_name":"\u4e5d\u6c5f\u53bf"},"360423":{"area_id":"360423","parent_id":"360400","area_name":"\u6b66\u5b81\u53bf"},"360424":{"area_id":"360424","parent_id":"360400","area_name":"\u4fee\u6c34\u53bf"},"360425":{"area_id":"360425","parent_id":"360400","area_name":"\u6c38\u4fee\u53bf"},"360426":{"area_id":"360426","parent_id":"360400","area_name":"\u5fb7\u5b89\u53bf"},"360427":{"area_id":"360427","parent_id":"360400","area_name":"\u661f\u5b50\u53bf"},"360428":{"area_id":"360428","parent_id":"360400","area_name":"\u90fd\u660c\u53bf"},"360429":{"area_id":"360429","parent_id":"360400","area_name":"\u6e56\u53e3\u53bf"},"360430":{"area_id":"360430","parent_id":"360400","area_name":"\u5f6d\u6cfd\u53bf"},"360481":{"area_id":"360481","parent_id":"360400","area_name":"\u745e\u660c\u5e02"},"360482":{"area_id":"360482","parent_id":"360400","area_name":"\u5171\u9752\u57ce\u5e02"},"360500":{"area_id":"360500","parent_id":"360000","area_name":"\u65b0\u4f59\u5e02"},"360501":{"area_id":"360501","parent_id":"360500","area_name":"\u65b0\u4f59\u5e02\u5e02\u8f96\u533a"},"360502":{"area_id":"360502","parent_id":"360500","area_name":"\u6e1d\u6c34\u533a"},"360521":{"area_id":"360521","parent_id":"360500","area_name":"\u5206\u5b9c\u53bf"},"360600":{"area_id":"360600","parent_id":"360000","area_name":"\u9e70\u6f6d\u5e02"},"360601":{"area_id":"360601","parent_id":"360600","area_name":"\u9e70\u6f6d\u5e02\u5e02\u8f96\u533a"},"360602":{"area_id":"360602","parent_id":"360600","area_name":"\u6708\u6e56\u533a"},"360622":{"area_id":"360622","parent_id":"360600","area_name":"\u4f59\u6c5f\u53bf"},"360681":{"area_id":"360681","parent_id":"360600","area_name":"\u8d35\u6eaa\u5e02"},"360700":{"area_id":"360700","parent_id":"360000","area_name":"\u8d63\u5dde\u5e02"},"360701":{"area_id":"360701","parent_id":"360700","area_name":"\u8d63\u5dde\u5e02\u5e02\u8f96\u533a"},"360702":{"area_id":"360702","parent_id":"360700","area_name":"\u7ae0\u8d21\u533a"},"360721":{"area_id":"360721","parent_id":"360700","area_name":"\u8d63\u53bf"},"360722":{"area_id":"360722","parent_id":"360700","area_name":"\u4fe1\u4e30\u53bf"},"360723":{"area_id":"360723","parent_id":"360700","area_name":"\u5927\u4f59\u53bf"},"360724":{"area_id":"360724","parent_id":"360700","area_name":"\u4e0a\u72b9\u53bf"},"360725":{"area_id":"360725","parent_id":"360700","area_name":"\u5d07\u4e49\u53bf"},"360726":{"area_id":"360726","parent_id":"360700","area_name":"\u5b89\u8fdc\u53bf"},"360727":{"area_id":"360727","parent_id":"360700","area_name":"\u9f99\u5357\u53bf"},"360728":{"area_id":"360728","parent_id":"360700","area_name":"\u5b9a\u5357\u53bf"},"360729":{"area_id":"360729","parent_id":"360700","area_name":"\u5168\u5357\u53bf"},"360730":{"area_id":"360730","parent_id":"360700","area_name":"\u5b81\u90fd\u53bf"},"360731":{"area_id":"360731","parent_id":"360700","area_name":"\u4e8e\u90fd\u53bf"},"360732":{"area_id":"360732","parent_id":"360700","area_name":"\u5174\u56fd\u53bf"},"360733":{"area_id":"360733","parent_id":"360700","area_name":"\u4f1a\u660c\u53bf"},"360734":{"area_id":"360734","parent_id":"360700","area_name":"\u5bfb\u4e4c\u53bf"},"360735":{"area_id":"360735","parent_id":"360700","area_name":"\u77f3\u57ce\u53bf"},"360781":{"area_id":"360781","parent_id":"360700","area_name":"\u745e\u91d1\u5e02"},"360782":{"area_id":"360782","parent_id":"360700","area_name":"\u5357\u5eb7\u5e02"},"360800":{"area_id":"360800","parent_id":"360000","area_name":"\u5409\u5b89\u5e02"},"360801":{"area_id":"360801","parent_id":"360800","area_name":"\u5409\u5b89\u5e02\u5e02\u8f96\u533a"},"360802":{"area_id":"360802","parent_id":"360800","area_name":"\u5409\u5dde\u533a"},"360803":{"area_id":"360803","parent_id":"360800","area_name":"\u9752\u539f\u533a"},"360821":{"area_id":"360821","parent_id":"360800","area_name":"\u5409\u5b89\u53bf"},"360822":{"area_id":"360822","parent_id":"360800","area_name":"\u5409\u6c34\u53bf"},"360823":{"area_id":"360823","parent_id":"360800","area_name":"\u5ce1\u6c5f\u53bf"},"360824":{"area_id":"360824","parent_id":"360800","area_name":"\u65b0\u5e72\u53bf"},"360825":{"area_id":"360825","parent_id":"360800","area_name":"\u6c38\u4e30\u53bf"},"360826":{"area_id":"360826","parent_id":"360800","area_name":"\u6cf0\u548c\u53bf"},"360827":{"area_id":"360827","parent_id":"360800","area_name":"\u9042\u5ddd\u53bf"},"360828":{"area_id":"360828","parent_id":"360800","area_name":"\u4e07\u5b89\u53bf"},"360829":{"area_id":"360829","parent_id":"360800","area_name":"\u5b89\u798f\u53bf"},"360830":{"area_id":"360830","parent_id":"360800","area_name":"\u6c38\u65b0\u53bf"},"360881":{"area_id":"360881","parent_id":"360800","area_name":"\u4e95\u5188\u5c71\u5e02"},"360900":{"area_id":"360900","parent_id":"360000","area_name":"\u5b9c\u6625\u5e02"},"360901":{"area_id":"360901","parent_id":"360900","area_name":"\u5b9c\u6625\u5e02\u5e02\u8f96\u533a"},"360902":{"area_id":"360902","parent_id":"360900","area_name":"\u8881\u5dde\u533a"},"360921":{"area_id":"360921","parent_id":"360900","area_name":"\u5949\u65b0\u53bf"},"360922":{"area_id":"360922","parent_id":"360900","area_name":"\u4e07\u8f7d\u53bf"},"360923":{"area_id":"360923","parent_id":"360900","area_name":"\u4e0a\u9ad8\u53bf"},"360924":{"area_id":"360924","parent_id":"360900","area_name":"\u5b9c\u4e30\u53bf"},"360925":{"area_id":"360925","parent_id":"360900","area_name":"\u9756\u5b89\u53bf"},"360926":{"area_id":"360926","parent_id":"360900","area_name":"\u94dc\u9f13\u53bf"},"360981":{"area_id":"360981","parent_id":"360900","area_name":"\u4e30\u57ce\u5e02"},"360982":{"area_id":"360982","parent_id":"360900","area_name":"\u6a1f\u6811\u5e02"},"360983":{"area_id":"360983","parent_id":"360900","area_name":"\u9ad8\u5b89\u5e02"},"361000":{"area_id":"361000","parent_id":"360000","area_name":"\u629a\u5dde\u5e02"},"361001":{"area_id":"361001","parent_id":"361000","area_name":"\u629a\u5dde\u5e02\u5e02\u8f96\u533a"},"361002":{"area_id":"361002","parent_id":"361000","area_name":"\u4e34\u5ddd\u533a"},"361021":{"area_id":"361021","parent_id":"361000","area_name":"\u5357\u57ce\u53bf"},"361022":{"area_id":"361022","parent_id":"361000","area_name":"\u9ece\u5ddd\u53bf"},"361023":{"area_id":"361023","parent_id":"361000","area_name":"\u5357\u4e30\u53bf"},"361024":{"area_id":"361024","parent_id":"361000","area_name":"\u5d07\u4ec1\u53bf"},"361025":{"area_id":"361025","parent_id":"361000","area_name":"\u4e50\u5b89\u53bf"},"361026":{"area_id":"361026","parent_id":"361000","area_name":"\u5b9c\u9ec4\u53bf"},"361027":{"area_id":"361027","parent_id":"361000","area_name":"\u91d1\u6eaa\u53bf"},"361028":{"area_id":"361028","parent_id":"361000","area_name":"\u8d44\u6eaa\u53bf"},"361029":{"area_id":"361029","parent_id":"361000","area_name":"\u4e1c\u4e61\u53bf"},"361030":{"area_id":"361030","parent_id":"361000","area_name":"\u5e7f\u660c\u53bf"},"361100":{"area_id":"361100","parent_id":"360000","area_name":"\u4e0a\u9976\u5e02"},"361101":{"area_id":"361101","parent_id":"361100","area_name":"\u4e0a\u9976\u5e02\u5e02\u8f96\u533a"},"361102":{"area_id":"361102","parent_id":"361100","area_name":"\u4fe1\u5dde\u533a"},"361121":{"area_id":"361121","parent_id":"361100","area_name":"\u4e0a\u9976\u53bf"},"361122":{"area_id":"361122","parent_id":"361100","area_name":"\u5e7f\u4e30\u53bf"},"361123":{"area_id":"361123","parent_id":"361100","area_name":"\u7389\u5c71\u53bf"},"361124":{"area_id":"361124","parent_id":"361100","area_name":"\u94c5\u5c71\u53bf"},"361125":{"area_id":"361125","parent_id":"361100","area_name":"\u6a2a\u5cf0\u53bf"},"361126":{"area_id":"361126","parent_id":"361100","area_name":"\u5f0b\u9633\u53bf"},"361127":{"area_id":"361127","parent_id":"361100","area_name":"\u4f59\u5e72\u53bf"},"361128":{"area_id":"361128","parent_id":"361100","area_name":"\u9131\u9633\u53bf"},"361129":{"area_id":"361129","parent_id":"361100","area_name":"\u4e07\u5e74\u53bf"},"361130":{"area_id":"361130","parent_id":"361100","area_name":"\u5a7a\u6e90\u53bf"},"361181":{"area_id":"361181","parent_id":"361100","area_name":"\u5fb7\u5174\u5e02"},"370000":{"area_id":"370000","parent_id":"0","area_name":"\u5c71\u4e1c\u7701"},"370100":{"area_id":"370100","parent_id":"370000","area_name":"\u6d4e\u5357\u5e02"},"370101":{"area_id":"370101","parent_id":"370100","area_name":"\u6d4e\u5357\u5e02\u5e02\u8f96\u533a"},"370102":{"area_id":"370102","parent_id":"370100","area_name":"\u5386\u4e0b\u533a"},"370103":{"area_id":"370103","parent_id":"370100","area_name":"\u5e02\u4e2d\u533a"},"370104":{"area_id":"370104","parent_id":"370100","area_name":"\u69d0\u836b\u533a"},"370105":{"area_id":"370105","parent_id":"370100","area_name":"\u5929\u6865\u533a"},"370112":{"area_id":"370112","parent_id":"370100","area_name":"\u5386\u57ce\u533a"},"370113":{"area_id":"370113","parent_id":"370100","area_name":"\u957f\u6e05\u533a"},"370124":{"area_id":"370124","parent_id":"370100","area_name":"\u5e73\u9634\u53bf"},"370125":{"area_id":"370125","parent_id":"370100","area_name":"\u6d4e\u9633\u53bf"},"370126":{"area_id":"370126","parent_id":"370100","area_name":"\u5546\u6cb3\u53bf"},"370181":{"area_id":"370181","parent_id":"370100","area_name":"\u7ae0\u4e18\u5e02"},"370200":{"area_id":"370200","parent_id":"370000","area_name":"\u9752\u5c9b\u5e02"},"370201":{"area_id":"370201","parent_id":"370200","area_name":"\u9752\u5c9b\u5e02\u5e02\u8f96\u533a"},"370202":{"area_id":"370202","parent_id":"370200","area_name":"\u5e02\u5357\u533a"},"370203":{"area_id":"370203","parent_id":"370200","area_name":"\u5e02\u5317\u533a"},"370211":{"area_id":"370211","parent_id":"370200","area_name":"\u9ec4\u5c9b\u533a"},"370212":{"area_id":"370212","parent_id":"370200","area_name":"\u5d02\u5c71\u533a"},"370213":{"area_id":"370213","parent_id":"370200","area_name":"\u674e\u6ca7\u533a"},"370214":{"area_id":"370214","parent_id":"370200","area_name":"\u57ce\u9633\u533a"},"370281":{"area_id":"370281","parent_id":"370200","area_name":"\u80f6\u5dde\u5e02"},"370282":{"area_id":"370282","parent_id":"370200","area_name":"\u5373\u58a8\u5e02"},"370283":{"area_id":"370283","parent_id":"370200","area_name":"\u5e73\u5ea6\u5e02"},"370285":{"area_id":"370285","parent_id":"370200","area_name":"\u83b1\u897f\u5e02"},"370300":{"area_id":"370300","parent_id":"370000","area_name":"\u6dc4\u535a\u5e02"},"370301":{"area_id":"370301","parent_id":"370300","area_name":"\u6dc4\u535a\u5e02\u5e02\u8f96\u533a"},"370302":{"area_id":"370302","parent_id":"370300","area_name":"\u6dc4\u5ddd\u533a"},"370303":{"area_id":"370303","parent_id":"370300","area_name":"\u5f20\u5e97\u533a"},"370304":{"area_id":"370304","parent_id":"370300","area_name":"\u535a\u5c71\u533a"},"370305":{"area_id":"370305","parent_id":"370300","area_name":"\u4e34\u6dc4\u533a"},"370306":{"area_id":"370306","parent_id":"370300","area_name":"\u5468\u6751\u533a"},"370321":{"area_id":"370321","parent_id":"370300","area_name":"\u6853\u53f0\u53bf"},"370322":{"area_id":"370322","parent_id":"370300","area_name":"\u9ad8\u9752\u53bf"},"370323":{"area_id":"370323","parent_id":"370300","area_name":"\u6c82\u6e90\u53bf"},"370400":{"area_id":"370400","parent_id":"370000","area_name":"\u67a3\u5e84\u5e02"},"370401":{"area_id":"370401","parent_id":"370400","area_name":"\u67a3\u5e84\u5e02\u5e02\u8f96\u533a"},"370402":{"area_id":"370402","parent_id":"370400","area_name":"\u5e02\u4e2d\u533a"},"370403":{"area_id":"370403","parent_id":"370400","area_name":"\u859b\u57ce\u533a"},"370404":{"area_id":"370404","parent_id":"370400","area_name":"\u5cc4\u57ce\u533a"},"370405":{"area_id":"370405","parent_id":"370400","area_name":"\u53f0\u513f\u5e84\u533a"},"370406":{"area_id":"370406","parent_id":"370400","area_name":"\u5c71\u4ead\u533a"},"370481":{"area_id":"370481","parent_id":"370400","area_name":"\u6ed5\u5dde\u5e02"},"370500":{"area_id":"370500","parent_id":"370000","area_name":"\u4e1c\u8425\u5e02"},"370501":{"area_id":"370501","parent_id":"370500","area_name":"\u4e1c\u8425\u5e02\u5e02\u8f96\u533a"},"370502":{"area_id":"370502","parent_id":"370500","area_name":"\u4e1c\u8425\u533a"},"370503":{"area_id":"370503","parent_id":"370500","area_name":"\u6cb3\u53e3\u533a"},"370521":{"area_id":"370521","parent_id":"370500","area_name":"\u57a6\u5229\u53bf"},"370522":{"area_id":"370522","parent_id":"370500","area_name":"\u5229\u6d25\u53bf"},"370523":{"area_id":"370523","parent_id":"370500","area_name":"\u5e7f\u9976\u53bf"},"370600":{"area_id":"370600","parent_id":"370000","area_name":"\u70df\u53f0\u5e02"},"370601":{"area_id":"370601","parent_id":"370600","area_name":"\u70df\u53f0\u5e02\u5e02\u8f96\u533a"},"370602":{"area_id":"370602","parent_id":"370600","area_name":"\u829d\u7f58\u533a"},"370611":{"area_id":"370611","parent_id":"370600","area_name":"\u798f\u5c71\u533a"},"370612":{"area_id":"370612","parent_id":"370600","area_name":"\u725f\u5e73\u533a"},"370613":{"area_id":"370613","parent_id":"370600","area_name":"\u83b1\u5c71\u533a"},"370634":{"area_id":"370634","parent_id":"370600","area_name":"\u957f\u5c9b\u53bf"},"370681":{"area_id":"370681","parent_id":"370600","area_name":"\u9f99\u53e3\u5e02"},"370682":{"area_id":"370682","parent_id":"370600","area_name":"\u83b1\u9633\u5e02"},"370683":{"area_id":"370683","parent_id":"370600","area_name":"\u83b1\u5dde\u5e02"},"370684":{"area_id":"370684","parent_id":"370600","area_name":"\u84ec\u83b1\u5e02"},"370685":{"area_id":"370685","parent_id":"370600","area_name":"\u62db\u8fdc\u5e02"},"370686":{"area_id":"370686","parent_id":"370600","area_name":"\u6816\u971e\u5e02"},"370687":{"area_id":"370687","parent_id":"370600","area_name":"\u6d77\u9633\u5e02"},"370700":{"area_id":"370700","parent_id":"370000","area_name":"\u6f4d\u574a\u5e02"},"370701":{"area_id":"370701","parent_id":"370700","area_name":"\u6f4d\u574a\u5e02\u5e02\u8f96\u533a"},"370702":{"area_id":"370702","parent_id":"370700","area_name":"\u6f4d\u57ce\u533a"},"370703":{"area_id":"370703","parent_id":"370700","area_name":"\u5bd2\u4ead\u533a"},"370704":{"area_id":"370704","parent_id":"370700","area_name":"\u574a\u5b50\u533a"},"370705":{"area_id":"370705","parent_id":"370700","area_name":"\u594e\u6587\u533a"},"370724":{"area_id":"370724","parent_id":"370700","area_name":"\u4e34\u6710\u53bf"},"370725":{"area_id":"370725","parent_id":"370700","area_name":"\u660c\u4e50\u53bf"},"370781":{"area_id":"370781","parent_id":"370700","area_name":"\u9752\u5dde\u5e02"},"370782":{"area_id":"370782","parent_id":"370700","area_name":"\u8bf8\u57ce\u5e02"},"370783":{"area_id":"370783","parent_id":"370700","area_name":"\u5bff\u5149\u5e02"},"370784":{"area_id":"370784","parent_id":"370700","area_name":"\u5b89\u4e18\u5e02"},"370785":{"area_id":"370785","parent_id":"370700","area_name":"\u9ad8\u5bc6\u5e02"},"370786":{"area_id":"370786","parent_id":"370700","area_name":"\u660c\u9091\u5e02"},"370800":{"area_id":"370800","parent_id":"370000","area_name":"\u6d4e\u5b81\u5e02"},"370801":{"area_id":"370801","parent_id":"370800","area_name":"\u6d4e\u5b81\u5e02\u5e02\u8f96\u533a"},"370802":{"area_id":"370802","parent_id":"370800","area_name":"\u5e02\u4e2d\u533a"},"370811":{"area_id":"370811","parent_id":"370800","area_name":"\u4efb\u57ce\u533a"},"370826":{"area_id":"370826","parent_id":"370800","area_name":"\u5fae\u5c71\u53bf"},"370827":{"area_id":"370827","parent_id":"370800","area_name":"\u9c7c\u53f0\u53bf"},"370828":{"area_id":"370828","parent_id":"370800","area_name":"\u91d1\u4e61\u53bf"},"370829":{"area_id":"370829","parent_id":"370800","area_name":"\u5609\u7965\u53bf"},"370830":{"area_id":"370830","parent_id":"370800","area_name":"\u6c76\u4e0a\u53bf"},"370831":{"area_id":"370831","parent_id":"370800","area_name":"\u6cd7\u6c34\u53bf"},"370832":{"area_id":"370832","parent_id":"370800","area_name":"\u6881\u5c71\u53bf"},"370881":{"area_id":"370881","parent_id":"370800","area_name":"\u66f2\u961c\u5e02"},"370882":{"area_id":"370882","parent_id":"370800","area_name":"\u5156\u5dde\u5e02"},"370883":{"area_id":"370883","parent_id":"370800","area_name":"\u90b9\u57ce\u5e02"},"370900":{"area_id":"370900","parent_id":"370000","area_name":"\u6cf0\u5b89\u5e02"},"370901":{"area_id":"370901","parent_id":"370900","area_name":"\u6cf0\u5b89\u5e02\u5e02\u8f96\u533a"},"370902":{"area_id":"370902","parent_id":"370900","area_name":"\u6cf0\u5c71\u533a"},"370911":{"area_id":"370911","parent_id":"370900","area_name":"\u5cb1\u5cb3\u533a"},"370921":{"area_id":"370921","parent_id":"370900","area_name":"\u5b81\u9633\u53bf"},"370923":{"area_id":"370923","parent_id":"370900","area_name":"\u4e1c\u5e73\u53bf"},"370982":{"area_id":"370982","parent_id":"370900","area_name":"\u65b0\u6cf0\u5e02"},"370983":{"area_id":"370983","parent_id":"370900","area_name":"\u80a5\u57ce\u5e02"},"371000":{"area_id":"371000","parent_id":"370000","area_name":"\u5a01\u6d77\u5e02"},"371001":{"area_id":"371001","parent_id":"371000","area_name":"\u5a01\u6d77\u5e02\u5e02\u8f96\u533a"},"371002":{"area_id":"371002","parent_id":"371000","area_name":"\u73af\u7fe0\u533a"},"371081":{"area_id":"371081","parent_id":"371000","area_name":"\u6587\u767b\u5e02"},"371082":{"area_id":"371082","parent_id":"371000","area_name":"\u8363\u6210\u5e02"},"371083":{"area_id":"371083","parent_id":"371000","area_name":"\u4e73\u5c71\u5e02"},"371100":{"area_id":"371100","parent_id":"370000","area_name":"\u65e5\u7167\u5e02"},"371101":{"area_id":"371101","parent_id":"371100","area_name":"\u65e5\u7167\u5e02\u5e02\u8f96\u533a"},"371102":{"area_id":"371102","parent_id":"371100","area_name":"\u4e1c\u6e2f\u533a"},"371103":{"area_id":"371103","parent_id":"371100","area_name":"\u5c9a\u5c71\u533a"},"371121":{"area_id":"371121","parent_id":"371100","area_name":"\u4e94\u83b2\u53bf"},"371122":{"area_id":"371122","parent_id":"371100","area_name":"\u8392\u53bf"},"371200":{"area_id":"371200","parent_id":"370000","area_name":"\u83b1\u829c\u5e02"},"371201":{"area_id":"371201","parent_id":"371200","area_name":"\u83b1\u829c\u5e02\u5e02\u8f96\u533a"},"371202":{"area_id":"371202","parent_id":"371200","area_name":"\u83b1\u57ce\u533a"},"371203":{"area_id":"371203","parent_id":"371200","area_name":"\u94a2\u57ce\u533a"},"371300":{"area_id":"371300","parent_id":"370000","area_name":"\u4e34\u6c82\u5e02"},"371301":{"area_id":"371301","parent_id":"371300","area_name":"\u4e34\u6c82\u5e02\u5e02\u8f96\u533a"},"371302":{"area_id":"371302","parent_id":"371300","area_name":"\u5170\u5c71\u533a"},"371311":{"area_id":"371311","parent_id":"371300","area_name":"\u7f57\u5e84\u533a"},"371312":{"area_id":"371312","parent_id":"371300","area_name":"\u6cb3\u4e1c\u533a"},"371321":{"area_id":"371321","parent_id":"371300","area_name":"\u6c82\u5357\u53bf"},"371322":{"area_id":"371322","parent_id":"371300","area_name":"\u90ef\u57ce\u53bf"},"371323":{"area_id":"371323","parent_id":"371300","area_name":"\u6c82\u6c34\u53bf"},"371324":{"area_id":"371324","parent_id":"371300","area_name":"\u82cd\u5c71\u53bf"},"371325":{"area_id":"371325","parent_id":"371300","area_name":"\u8d39\u53bf"},"371326":{"area_id":"371326","parent_id":"371300","area_name":"\u5e73\u9091\u53bf"},"371327":{"area_id":"371327","parent_id":"371300","area_name":"\u8392\u5357\u53bf"},"371328":{"area_id":"371328","parent_id":"371300","area_name":"\u8499\u9634\u53bf"},"371329":{"area_id":"371329","parent_id":"371300","area_name":"\u4e34\u6cad\u53bf"},"371400":{"area_id":"371400","parent_id":"370000","area_name":"\u5fb7\u5dde\u5e02"},"371401":{"area_id":"371401","parent_id":"371400","area_name":"\u5fb7\u5dde\u5e02\u5e02\u8f96\u533a"},"371402":{"area_id":"371402","parent_id":"371400","area_name":"\u5fb7\u57ce\u533a"},"371421":{"area_id":"371421","parent_id":"371400","area_name":"\u9675\u53bf"},"371422":{"area_id":"371422","parent_id":"371400","area_name":"\u5b81\u6d25\u53bf"},"371423":{"area_id":"371423","parent_id":"371400","area_name":"\u5e86\u4e91\u53bf"},"371424":{"area_id":"371424","parent_id":"371400","area_name":"\u4e34\u9091\u53bf"},"371425":{"area_id":"371425","parent_id":"371400","area_name":"\u9f50\u6cb3\u53bf"},"371426":{"area_id":"371426","parent_id":"371400","area_name":"\u5e73\u539f\u53bf"},"371427":{"area_id":"371427","parent_id":"371400","area_name":"\u590f\u6d25\u53bf"},"371428":{"area_id":"371428","parent_id":"371400","area_name":"\u6b66\u57ce\u53bf"},"371481":{"area_id":"371481","parent_id":"371400","area_name":"\u4e50\u9675\u5e02"},"371482":{"area_id":"371482","parent_id":"371400","area_name":"\u79b9\u57ce\u5e02"},"371500":{"area_id":"371500","parent_id":"370000","area_name":"\u804a\u57ce\u5e02"},"371501":{"area_id":"371501","parent_id":"371500","area_name":"\u804a\u57ce\u5e02\u5e02\u8f96\u533a"},"371502":{"area_id":"371502","parent_id":"371500","area_name":"\u4e1c\u660c\u5e9c\u533a"},"371521":{"area_id":"371521","parent_id":"371500","area_name":"\u9633\u8c37\u53bf"},"371522":{"area_id":"371522","parent_id":"371500","area_name":"\u8398\u53bf"},"371523":{"area_id":"371523","parent_id":"371500","area_name":"\u830c\u5e73\u53bf"},"371524":{"area_id":"371524","parent_id":"371500","area_name":"\u4e1c\u963f\u53bf"},"371525":{"area_id":"371525","parent_id":"371500","area_name":"\u51a0\u53bf"},"371526":{"area_id":"371526","parent_id":"371500","area_name":"\u9ad8\u5510\u53bf"},"371581":{"area_id":"371581","parent_id":"371500","area_name":"\u4e34\u6e05\u5e02"},"371600":{"area_id":"371600","parent_id":"370000","area_name":"\u6ee8\u5dde\u5e02"},"371601":{"area_id":"371601","parent_id":"371600","area_name":"\u6ee8\u5dde\u5e02\u5e02\u8f96\u533a"},"371602":{"area_id":"371602","parent_id":"371600","area_name":"\u6ee8\u57ce\u533a"},"371621":{"area_id":"371621","parent_id":"371600","area_name":"\u60e0\u6c11\u53bf"},"371622":{"area_id":"371622","parent_id":"371600","area_name":"\u9633\u4fe1\u53bf"},"371623":{"area_id":"371623","parent_id":"371600","area_name":"\u65e0\u68e3\u53bf"},"371624":{"area_id":"371624","parent_id":"371600","area_name":"\u6cbe\u5316\u53bf"},"371625":{"area_id":"371625","parent_id":"371600","area_name":"\u535a\u5174\u53bf"},"371626":{"area_id":"371626","parent_id":"371600","area_name":"\u90b9\u5e73\u53bf"},"371700":{"area_id":"371700","parent_id":"370000","area_name":"\u83cf\u6cfd\u5e02"},"371701":{"area_id":"371701","parent_id":"371700","area_name":"\u83cf\u6cfd\u5e02\u5e02\u8f96\u533a"},"371702":{"area_id":"371702","parent_id":"371700","area_name":"\u7261\u4e39\u533a"},"371721":{"area_id":"371721","parent_id":"371700","area_name":"\u66f9\u53bf"},"371722":{"area_id":"371722","parent_id":"371700","area_name":"\u5355\u53bf"},"371723":{"area_id":"371723","parent_id":"371700","area_name":"\u6210\u6b66\u53bf"},"371724":{"area_id":"371724","parent_id":"371700","area_name":"\u5de8\u91ce\u53bf"},"371725":{"area_id":"371725","parent_id":"371700","area_name":"\u90d3\u57ce\u53bf"},"371726":{"area_id":"371726","parent_id":"371700","area_name":"\u9104\u57ce\u53bf"},"371727":{"area_id":"371727","parent_id":"371700","area_name":"\u5b9a\u9676\u53bf"},"371728":{"area_id":"371728","parent_id":"371700","area_name":"\u4e1c\u660e\u53bf"},"410000":{"area_id":"410000","parent_id":"0","area_name":"\u6cb3\u5357\u7701"},"410100":{"area_id":"410100","parent_id":"410000","area_name":"\u90d1\u5dde\u5e02"},"410101":{"area_id":"410101","parent_id":"410100","area_name":"\u90d1\u5dde\u5e02\u5e02\u8f96\u533a"},"410102":{"area_id":"410102","parent_id":"410100","area_name":"\u4e2d\u539f\u533a"},"410103":{"area_id":"410103","parent_id":"410100","area_name":"\u4e8c\u4e03\u533a"},"410104":{"area_id":"410104","parent_id":"410100","area_name":"\u7ba1\u57ce\u56de\u65cf\u533a"},"410105":{"area_id":"410105","parent_id":"410100","area_name":"\u91d1\u6c34\u533a"},"410106":{"area_id":"410106","parent_id":"410100","area_name":"\u4e0a\u8857\u533a"},"410108":{"area_id":"410108","parent_id":"410100","area_name":"\u60e0\u6d4e\u533a"},"410122":{"area_id":"410122","parent_id":"410100","area_name":"\u4e2d\u725f\u53bf"},"410181":{"area_id":"410181","parent_id":"410100","area_name":"\u5de9\u4e49\u5e02"},"410182":{"area_id":"410182","parent_id":"410100","area_name":"\u8365\u9633\u5e02"},"410183":{"area_id":"410183","parent_id":"410100","area_name":"\u65b0\u5bc6\u5e02"},"410184":{"area_id":"410184","parent_id":"410100","area_name":"\u65b0\u90d1\u5e02"},"410185":{"area_id":"410185","parent_id":"410100","area_name":"\u767b\u5c01\u5e02"},"410200":{"area_id":"410200","parent_id":"410000","area_name":"\u5f00\u5c01\u5e02"},"410201":{"area_id":"410201","parent_id":"410200","area_name":"\u5f00\u5c01\u5e02\u5e02\u8f96\u533a"},"410202":{"area_id":"410202","parent_id":"410200","area_name":"\u9f99\u4ead\u533a"},"410203":{"area_id":"410203","parent_id":"410200","area_name":"\u987a\u6cb3\u56de\u65cf\u533a"},"410204":{"area_id":"410204","parent_id":"410200","area_name":"\u9f13\u697c\u533a"},"410205":{"area_id":"410205","parent_id":"410200","area_name":"\u79b9\u738b\u53f0\u533a"},"410211":{"area_id":"410211","parent_id":"410200","area_name":"\u91d1\u660e\u533a"},"410221":{"area_id":"410221","parent_id":"410200","area_name":"\u675e\u53bf"},"410222":{"area_id":"410222","parent_id":"410200","area_name":"\u901a\u8bb8\u53bf"},"410223":{"area_id":"410223","parent_id":"410200","area_name":"\u5c09\u6c0f\u53bf"},"410224":{"area_id":"410224","parent_id":"410200","area_name":"\u5f00\u5c01\u53bf"},"410225":{"area_id":"410225","parent_id":"410200","area_name":"\u5170\u8003\u53bf"},"410300":{"area_id":"410300","parent_id":"410000","area_name":"\u6d1b\u9633\u5e02"},"410301":{"area_id":"410301","parent_id":"410300","area_name":"\u6d1b\u9633\u5e02\u5e02\u8f96\u533a"},"410302":{"area_id":"410302","parent_id":"410300","area_name":"\u8001\u57ce\u533a"},"410303":{"area_id":"410303","parent_id":"410300","area_name":"\u897f\u5de5\u533a"},"410304":{"area_id":"410304","parent_id":"410300","area_name":"\u700d\u6cb3\u56de\u65cf\u533a"},"410305":{"area_id":"410305","parent_id":"410300","area_name":"\u6da7\u897f\u533a"},"410306":{"area_id":"410306","parent_id":"410300","area_name":"\u5409\u5229\u533a"},"410311":{"area_id":"410311","parent_id":"410300","area_name":"\u6d1b\u9f99\u533a"},"410322":{"area_id":"410322","parent_id":"410300","area_name":"\u5b5f\u6d25\u53bf"},"410323":{"area_id":"410323","parent_id":"410300","area_name":"\u65b0\u5b89\u53bf"},"410324":{"area_id":"410324","parent_id":"410300","area_name":"\u683e\u5ddd\u53bf"},"410325":{"area_id":"410325","parent_id":"410300","area_name":"\u5d69\u53bf"},"410326":{"area_id":"410326","parent_id":"410300","area_name":"\u6c5d\u9633\u53bf"},"410327":{"area_id":"410327","parent_id":"410300","area_name":"\u5b9c\u9633\u53bf"},"410328":{"area_id":"410328","parent_id":"410300","area_name":"\u6d1b\u5b81\u53bf"},"410329":{"area_id":"410329","parent_id":"410300","area_name":"\u4f0a\u5ddd\u53bf"},"410381":{"area_id":"410381","parent_id":"410300","area_name":"\u5043\u5e08\u5e02"},"410400":{"area_id":"410400","parent_id":"410000","area_name":"\u5e73\u9876\u5c71\u5e02"},"410401":{"area_id":"410401","parent_id":"410400","area_name":"\u5e73\u9876\u5c71\u5e02\u5e02\u8f96\u533a"},"410402":{"area_id":"410402","parent_id":"410400","area_name":"\u65b0\u534e\u533a"},"410403":{"area_id":"410403","parent_id":"410400","area_name":"\u536b\u4e1c\u533a"},"410404":{"area_id":"410404","parent_id":"410400","area_name":"\u77f3\u9f99\u533a"},"410411":{"area_id":"410411","parent_id":"410400","area_name":"\u6e5b\u6cb3\u533a"},"410421":{"area_id":"410421","parent_id":"410400","area_name":"\u5b9d\u4e30\u53bf"},"410422":{"area_id":"410422","parent_id":"410400","area_name":"\u53f6\u53bf"},"410423":{"area_id":"410423","parent_id":"410400","area_name":"\u9c81\u5c71\u53bf"},"410425":{"area_id":"410425","parent_id":"410400","area_name":"\u90cf\u53bf"},"410481":{"area_id":"410481","parent_id":"410400","area_name":"\u821e\u94a2\u5e02"},"410482":{"area_id":"410482","parent_id":"410400","area_name":"\u6c5d\u5dde\u5e02"},"410500":{"area_id":"410500","parent_id":"410000","area_name":"\u5b89\u9633\u5e02"},"410501":{"area_id":"410501","parent_id":"410500","area_name":"\u5b89\u9633\u5e02\u5e02\u8f96\u533a"},"410502":{"area_id":"410502","parent_id":"410500","area_name":"\u6587\u5cf0\u533a"},"410503":{"area_id":"410503","parent_id":"410500","area_name":"\u5317\u5173\u533a"},"410505":{"area_id":"410505","parent_id":"410500","area_name":"\u6bb7\u90fd\u533a"},"410506":{"area_id":"410506","parent_id":"410500","area_name":"\u9f99\u5b89\u533a"},"410522":{"area_id":"410522","parent_id":"410500","area_name":"\u5b89\u9633\u53bf"},"410523":{"area_id":"410523","parent_id":"410500","area_name":"\u6c64\u9634\u53bf"},"410526":{"area_id":"410526","parent_id":"410500","area_name":"\u6ed1\u53bf"},"410527":{"area_id":"410527","parent_id":"410500","area_name":"\u5185\u9ec4\u53bf"},"410581":{"area_id":"410581","parent_id":"410500","area_name":"\u6797\u5dde\u5e02"},"410600":{"area_id":"410600","parent_id":"410000","area_name":"\u9e64\u58c1\u5e02"},"410601":{"area_id":"410601","parent_id":"410600","area_name":"\u9e64\u58c1\u5e02\u5e02\u8f96\u533a"},"410602":{"area_id":"410602","parent_id":"410600","area_name":"\u9e64\u5c71\u533a"},"410603":{"area_id":"410603","parent_id":"410600","area_name":"\u5c71\u57ce\u533a"},"410611":{"area_id":"410611","parent_id":"410600","area_name":"\u6dc7\u6ee8\u533a"},"410621":{"area_id":"410621","parent_id":"410600","area_name":"\u6d5a\u53bf"},"410622":{"area_id":"410622","parent_id":"410600","area_name":"\u6dc7\u53bf"},"410700":{"area_id":"410700","parent_id":"410000","area_name":"\u65b0\u4e61\u5e02"},"410701":{"area_id":"410701","parent_id":"410700","area_name":"\u65b0\u4e61\u5e02\u5e02\u8f96\u533a"},"410702":{"area_id":"410702","parent_id":"410700","area_name":"\u7ea2\u65d7\u533a"},"410703":{"area_id":"410703","parent_id":"410700","area_name":"\u536b\u6ee8\u533a"},"410704":{"area_id":"410704","parent_id":"410700","area_name":"\u51e4\u6cc9\u533a"},"410711":{"area_id":"410711","parent_id":"410700","area_name":"\u7267\u91ce\u533a"},"410721":{"area_id":"410721","parent_id":"410700","area_name":"\u65b0\u4e61\u53bf"},"410724":{"area_id":"410724","parent_id":"410700","area_name":"\u83b7\u5609\u53bf"},"410725":{"area_id":"410725","parent_id":"410700","area_name":"\u539f\u9633\u53bf"},"410726":{"area_id":"410726","parent_id":"410700","area_name":"\u5ef6\u6d25\u53bf"},"410727":{"area_id":"410727","parent_id":"410700","area_name":"\u5c01\u4e18\u53bf"},"410728":{"area_id":"410728","parent_id":"410700","area_name":"\u957f\u57a3\u53bf"},"410781":{"area_id":"410781","parent_id":"410700","area_name":"\u536b\u8f89\u5e02"},"410782":{"area_id":"410782","parent_id":"410700","area_name":"\u8f89\u53bf\u5e02"},"410800":{"area_id":"410800","parent_id":"410000","area_name":"\u7126\u4f5c\u5e02"},"410801":{"area_id":"410801","parent_id":"410800","area_name":"\u7126\u4f5c\u5e02\u5e02\u8f96\u533a"},"410802":{"area_id":"410802","parent_id":"410800","area_name":"\u89e3\u653e\u533a"},"410803":{"area_id":"410803","parent_id":"410800","area_name":"\u4e2d\u7ad9\u533a"},"410804":{"area_id":"410804","parent_id":"410800","area_name":"\u9a6c\u6751\u533a"},"410811":{"area_id":"410811","parent_id":"410800","area_name":"\u5c71\u9633\u533a"},"410821":{"area_id":"410821","parent_id":"410800","area_name":"\u4fee\u6b66\u53bf"},"410822":{"area_id":"410822","parent_id":"410800","area_name":"\u535a\u7231\u53bf"},"410823":{"area_id":"410823","parent_id":"410800","area_name":"\u6b66\u965f\u53bf"},"410825":{"area_id":"410825","parent_id":"410800","area_name":"\u6e29\u53bf"},"410882":{"area_id":"410882","parent_id":"410800","area_name":"\u6c81\u9633\u5e02"},"410883":{"area_id":"410883","parent_id":"410800","area_name":"\u5b5f\u5dde\u5e02"},"410900":{"area_id":"410900","parent_id":"410000","area_name":"\u6fee\u9633\u5e02"},"410901":{"area_id":"410901","parent_id":"410900","area_name":"\u6fee\u9633\u5e02\u5e02\u8f96\u533a"},"410902":{"area_id":"410902","parent_id":"410900","area_name":"\u534e\u9f99\u533a"},"410922":{"area_id":"410922","parent_id":"410900","area_name":"\u6e05\u4e30\u53bf"},"410923":{"area_id":"410923","parent_id":"410900","area_name":"\u5357\u4e50\u53bf"},"410926":{"area_id":"410926","parent_id":"410900","area_name":"\u8303\u53bf"},"410927":{"area_id":"410927","parent_id":"410900","area_name":"\u53f0\u524d\u53bf"},"410928":{"area_id":"410928","parent_id":"410900","area_name":"\u6fee\u9633\u53bf"},"411000":{"area_id":"411000","parent_id":"410000","area_name":"\u8bb8\u660c\u5e02"},"411001":{"area_id":"411001","parent_id":"411000","area_name":"\u8bb8\u660c\u5e02\u5e02\u8f96\u533a"},"411002":{"area_id":"411002","parent_id":"411000","area_name":"\u9b4f\u90fd\u533a"},"411023":{"area_id":"411023","parent_id":"411000","area_name":"\u8bb8\u660c\u53bf"},"411024":{"area_id":"411024","parent_id":"411000","area_name":"\u9122\u9675\u53bf"},"411025":{"area_id":"411025","parent_id":"411000","area_name":"\u8944\u57ce\u53bf"},"411081":{"area_id":"411081","parent_id":"411000","area_name":"\u79b9\u5dde\u5e02"},"411082":{"area_id":"411082","parent_id":"411000","area_name":"\u957f\u845b\u5e02"},"411100":{"area_id":"411100","parent_id":"410000","area_name":"\u6f2f\u6cb3\u5e02"},"411101":{"area_id":"411101","parent_id":"411100","area_name":"\u6f2f\u6cb3\u5e02\u5e02\u8f96\u533a"},"411102":{"area_id":"411102","parent_id":"411100","area_name":"\u6e90\u6c47\u533a"},"411103":{"area_id":"411103","parent_id":"411100","area_name":"\u90fe\u57ce\u533a"},"411104":{"area_id":"411104","parent_id":"411100","area_name":"\u53ec\u9675\u533a"},"411121":{"area_id":"411121","parent_id":"411100","area_name":"\u821e\u9633\u53bf"},"411122":{"area_id":"411122","parent_id":"411100","area_name":"\u4e34\u988d\u53bf"},"411200":{"area_id":"411200","parent_id":"410000","area_name":"\u4e09\u95e8\u5ce1\u5e02"},"411201":{"area_id":"411201","parent_id":"411200","area_name":"\u4e09\u95e8\u5ce1\u5e02\u5e02\u8f96\u533a"},"411202":{"area_id":"411202","parent_id":"411200","area_name":"\u6e56\u6ee8\u533a"},"411221":{"area_id":"411221","parent_id":"411200","area_name":"\u6e11\u6c60\u53bf"},"411222":{"area_id":"411222","parent_id":"411200","area_name":"\u9655\u53bf"},"411224":{"area_id":"411224","parent_id":"411200","area_name":"\u5362\u6c0f\u53bf"},"411281":{"area_id":"411281","parent_id":"411200","area_name":"\u4e49\u9a6c\u5e02"},"411282":{"area_id":"411282","parent_id":"411200","area_name":"\u7075\u5b9d\u5e02"},"411300":{"area_id":"411300","parent_id":"410000","area_name":"\u5357\u9633\u5e02"},"411301":{"area_id":"411301","parent_id":"411300","area_name":"\u5357\u9633\u5e02\u5e02\u8f96\u533a"},"411302":{"area_id":"411302","parent_id":"411300","area_name":"\u5b9b\u57ce\u533a"},"411303":{"area_id":"411303","parent_id":"411300","area_name":"\u5367\u9f99\u533a"},"411321":{"area_id":"411321","parent_id":"411300","area_name":"\u5357\u53ec\u53bf"},"411322":{"area_id":"411322","parent_id":"411300","area_name":"\u65b9\u57ce\u53bf"},"411323":{"area_id":"411323","parent_id":"411300","area_name":"\u897f\u5ce1\u53bf"},"411324":{"area_id":"411324","parent_id":"411300","area_name":"\u9547\u5e73\u53bf"},"411325":{"area_id":"411325","parent_id":"411300","area_name":"\u5185\u4e61\u53bf"},"411326":{"area_id":"411326","parent_id":"411300","area_name":"\u6dc5\u5ddd\u53bf"},"411327":{"area_id":"411327","parent_id":"411300","area_name":"\u793e\u65d7\u53bf"},"411328":{"area_id":"411328","parent_id":"411300","area_name":"\u5510\u6cb3\u53bf"},"411329":{"area_id":"411329","parent_id":"411300","area_name":"\u65b0\u91ce\u53bf"},"411330":{"area_id":"411330","parent_id":"411300","area_name":"\u6850\u67cf\u53bf"},"411381":{"area_id":"411381","parent_id":"411300","area_name":"\u9093\u5dde\u5e02"},"411400":{"area_id":"411400","parent_id":"410000","area_name":"\u5546\u4e18\u5e02"},"411401":{"area_id":"411401","parent_id":"411400","area_name":"\u5546\u4e18\u5e02\u5e02\u8f96\u533a"},"411402":{"area_id":"411402","parent_id":"411400","area_name":"\u6881\u56ed\u533a"},"411403":{"area_id":"411403","parent_id":"411400","area_name":"\u7762\u9633\u533a"},"411421":{"area_id":"411421","parent_id":"411400","area_name":"\u6c11\u6743\u53bf"},"411422":{"area_id":"411422","parent_id":"411400","area_name":"\u7762\u53bf"},"411423":{"area_id":"411423","parent_id":"411400","area_name":"\u5b81\u9675\u53bf"},"411424":{"area_id":"411424","parent_id":"411400","area_name":"\u67d8\u57ce\u53bf"},"411425":{"area_id":"411425","parent_id":"411400","area_name":"\u865e\u57ce\u53bf"},"411426":{"area_id":"411426","parent_id":"411400","area_name":"\u590f\u9091\u53bf"},"411481":{"area_id":"411481","parent_id":"411400","area_name":"\u6c38\u57ce\u5e02"},"411500":{"area_id":"411500","parent_id":"410000","area_name":"\u4fe1\u9633\u5e02"},"411501":{"area_id":"411501","parent_id":"411500","area_name":"\u4fe1\u9633\u5e02\u5e02\u8f96\u533a"},"411502":{"area_id":"411502","parent_id":"411500","area_name":"\u6d49\u6cb3\u533a"},"411503":{"area_id":"411503","parent_id":"411500","area_name":"\u5e73\u6865\u533a"},"411521":{"area_id":"411521","parent_id":"411500","area_name":"\u7f57\u5c71\u53bf"},"411522":{"area_id":"411522","parent_id":"411500","area_name":"\u5149\u5c71\u53bf"},"411523":{"area_id":"411523","parent_id":"411500","area_name":"\u65b0\u53bf"},"411524":{"area_id":"411524","parent_id":"411500","area_name":"\u5546\u57ce\u53bf"},"411525":{"area_id":"411525","parent_id":"411500","area_name":"\u56fa\u59cb\u53bf"},"411526":{"area_id":"411526","parent_id":"411500","area_name":"\u6f62\u5ddd\u53bf"},"411527":{"area_id":"411527","parent_id":"411500","area_name":"\u6dee\u6ee8\u53bf"},"411528":{"area_id":"411528","parent_id":"411500","area_name":"\u606f\u53bf"},"411600":{"area_id":"411600","parent_id":"410000","area_name":"\u5468\u53e3\u5e02"},"411601":{"area_id":"411601","parent_id":"411600","area_name":"\u5468\u53e3\u5e02\u5e02\u8f96\u533a"},"411602":{"area_id":"411602","parent_id":"411600","area_name":"\u5ddd\u6c47\u533a"},"411621":{"area_id":"411621","parent_id":"411600","area_name":"\u6276\u6c9f\u53bf"},"411622":{"area_id":"411622","parent_id":"411600","area_name":"\u897f\u534e\u53bf"},"411623":{"area_id":"411623","parent_id":"411600","area_name":"\u5546\u6c34\u53bf"},"411624":{"area_id":"411624","parent_id":"411600","area_name":"\u6c88\u4e18\u53bf"},"411625":{"area_id":"411625","parent_id":"411600","area_name":"\u90f8\u57ce\u53bf"},"411626":{"area_id":"411626","parent_id":"411600","area_name":"\u6dee\u9633\u53bf"},"411627":{"area_id":"411627","parent_id":"411600","area_name":"\u592a\u5eb7\u53bf"},"411628":{"area_id":"411628","parent_id":"411600","area_name":"\u9e7f\u9091\u53bf"},"411681":{"area_id":"411681","parent_id":"411600","area_name":"\u9879\u57ce\u5e02"},"411700":{"area_id":"411700","parent_id":"410000","area_name":"\u9a7b\u9a6c\u5e97\u5e02"},"411701":{"area_id":"411701","parent_id":"411700","area_name":"\u9a7b\u9a6c\u5e97\u5e02\u5e02\u8f96\u533a"},"411702":{"area_id":"411702","parent_id":"411700","area_name":"\u9a7f\u57ce\u533a"},"411721":{"area_id":"411721","parent_id":"411700","area_name":"\u897f\u5e73\u53bf"},"411722":{"area_id":"411722","parent_id":"411700","area_name":"\u4e0a\u8521\u53bf"},"411723":{"area_id":"411723","parent_id":"411700","area_name":"\u5e73\u8206\u53bf"},"411724":{"area_id":"411724","parent_id":"411700","area_name":"\u6b63\u9633\u53bf"},"411725":{"area_id":"411725","parent_id":"411700","area_name":"\u786e\u5c71\u53bf"},"411726":{"area_id":"411726","parent_id":"411700","area_name":"\u6ccc\u9633\u53bf"},"411727":{"area_id":"411727","parent_id":"411700","area_name":"\u6c5d\u5357\u53bf"},"411728":{"area_id":"411728","parent_id":"411700","area_name":"\u9042\u5e73\u53bf"},"411729":{"area_id":"411729","parent_id":"411700","area_name":"\u65b0\u8521\u53bf"},"419000":{"area_id":"419000","parent_id":"410000","area_name":"\u7701\u76f4\u8f96\u53bf\u7ea7\u884c\u653f\u533a\u5212"},"419001":{"area_id":"419001","parent_id":"419000","area_name":"\u6d4e\u6e90\u5e02"},"420000":{"area_id":"420000","parent_id":"0","area_name":"\u6e56\u5317\u7701"},"420100":{"area_id":"420100","parent_id":"420000","area_name":"\u6b66\u6c49\u5e02"},"420101":{"area_id":"420101","parent_id":"420100","area_name":"\u6b66\u6c49\u5e02\u5e02\u8f96\u533a"},"420102":{"area_id":"420102","parent_id":"420100","area_name":"\u6c5f\u5cb8\u533a"},"420103":{"area_id":"420103","parent_id":"420100","area_name":"\u6c5f\u6c49\u533a"},"420104":{"area_id":"420104","parent_id":"420100","area_name":"\u785a\u53e3\u533a"},"420105":{"area_id":"420105","parent_id":"420100","area_name":"\u6c49\u9633\u533a"},"420106":{"area_id":"420106","parent_id":"420100","area_name":"\u6b66\u660c\u533a"},"420107":{"area_id":"420107","parent_id":"420100","area_name":"\u9752\u5c71\u533a"},"420111":{"area_id":"420111","parent_id":"420100","area_name":"\u6d2a\u5c71\u533a"},"420112":{"area_id":"420112","parent_id":"420100","area_name":"\u4e1c\u897f\u6e56\u533a"},"420113":{"area_id":"420113","parent_id":"420100","area_name":"\u6c49\u5357\u533a"},"420114":{"area_id":"420114","parent_id":"420100","area_name":"\u8521\u7538\u533a"},"420115":{"area_id":"420115","parent_id":"420100","area_name":"\u6c5f\u590f\u533a"},"420116":{"area_id":"420116","parent_id":"420100","area_name":"\u9ec4\u9642\u533a"},"420117":{"area_id":"420117","parent_id":"420100","area_name":"\u65b0\u6d32\u533a"},"420200":{"area_id":"420200","parent_id":"420000","area_name":"\u9ec4\u77f3\u5e02"},"420201":{"area_id":"420201","parent_id":"420200","area_name":"\u9ec4\u77f3\u5e02\u5e02\u8f96\u533a"},"420202":{"area_id":"420202","parent_id":"420200","area_name":"\u9ec4\u77f3\u6e2f\u533a"},"420203":{"area_id":"420203","parent_id":"420200","area_name":"\u897f\u585e\u5c71\u533a"},"420204":{"area_id":"420204","parent_id":"420200","area_name":"\u4e0b\u9646\u533a"},"420205":{"area_id":"420205","parent_id":"420200","area_name":"\u94c1\u5c71\u533a"},"420222":{"area_id":"420222","parent_id":"420200","area_name":"\u9633\u65b0\u53bf"},"420281":{"area_id":"420281","parent_id":"420200","area_name":"\u5927\u51b6\u5e02"},"420300":{"area_id":"420300","parent_id":"420000","area_name":"\u5341\u5830\u5e02"},"420301":{"area_id":"420301","parent_id":"420300","area_name":"\u5341\u5830\u5e02\u5e02\u8f96\u533a"},"420302":{"area_id":"420302","parent_id":"420300","area_name":"\u8305\u7bad\u533a"},"420303":{"area_id":"420303","parent_id":"420300","area_name":"\u5f20\u6e7e\u533a"},"420321":{"area_id":"420321","parent_id":"420300","area_name":"\u90e7\u53bf"},"420322":{"area_id":"420322","parent_id":"420300","area_name":"\u90e7\u897f\u53bf"},"420323":{"area_id":"420323","parent_id":"420300","area_name":"\u7af9\u5c71\u53bf"},"420324":{"area_id":"420324","parent_id":"420300","area_name":"\u7af9\u6eaa\u53bf"},"420325":{"area_id":"420325","parent_id":"420300","area_name":"\u623f\u53bf"},"420381":{"area_id":"420381","parent_id":"420300","area_name":"\u4e39\u6c5f\u53e3\u5e02"},"420500":{"area_id":"420500","parent_id":"420000","area_name":"\u5b9c\u660c\u5e02"},"420501":{"area_id":"420501","parent_id":"420500","area_name":"\u5b9c\u660c\u5e02\u5e02\u8f96\u533a"},"420502":{"area_id":"420502","parent_id":"420500","area_name":"\u897f\u9675\u533a"},"420503":{"area_id":"420503","parent_id":"420500","area_name":"\u4f0d\u5bb6\u5c97\u533a"},"420504":{"area_id":"420504","parent_id":"420500","area_name":"\u70b9\u519b\u533a"},"420505":{"area_id":"420505","parent_id":"420500","area_name":"\u7307\u4ead\u533a"},"420506":{"area_id":"420506","parent_id":"420500","area_name":"\u5937\u9675\u533a"},"420525":{"area_id":"420525","parent_id":"420500","area_name":"\u8fdc\u5b89\u53bf"},"420526":{"area_id":"420526","parent_id":"420500","area_name":"\u5174\u5c71\u53bf"},"420527":{"area_id":"420527","parent_id":"420500","area_name":"\u79ed\u5f52\u53bf"},"420528":{"area_id":"420528","parent_id":"420500","area_name":"\u957f\u9633\u571f\u5bb6\u65cf\u81ea\u6cbb\u53bf"},"420529":{"area_id":"420529","parent_id":"420500","area_name":"\u4e94\u5cf0\u571f\u5bb6\u65cf\u81ea\u6cbb\u53bf"},"420581":{"area_id":"420581","parent_id":"420500","area_name":"\u5b9c\u90fd\u5e02"},"420582":{"area_id":"420582","parent_id":"420500","area_name":"\u5f53\u9633\u5e02"},"420583":{"area_id":"420583","parent_id":"420500","area_name":"\u679d\u6c5f\u5e02"},"420600":{"area_id":"420600","parent_id":"420000","area_name":"\u8944\u9633\u5e02"},"420601":{"area_id":"420601","parent_id":"420600","area_name":"\u8944\u9633\u5e02\u5e02\u8f96\u533a"},"420602":{"area_id":"420602","parent_id":"420600","area_name":"\u8944\u57ce\u533a"},"420606":{"area_id":"420606","parent_id":"420600","area_name":"\u6a0a\u57ce\u533a"},"420607":{"area_id":"420607","parent_id":"420600","area_name":"\u8944\u5dde\u533a"},"420624":{"area_id":"420624","parent_id":"420600","area_name":"\u5357\u6f33\u53bf"},"420625":{"area_id":"420625","parent_id":"420600","area_name":"\u8c37\u57ce\u53bf"},"420626":{"area_id":"420626","parent_id":"420600","area_name":"\u4fdd\u5eb7\u53bf"},"420682":{"area_id":"420682","parent_id":"420600","area_name":"\u8001\u6cb3\u53e3\u5e02"},"420683":{"area_id":"420683","parent_id":"420600","area_name":"\u67a3\u9633\u5e02"},"420684":{"area_id":"420684","parent_id":"420600","area_name":"\u5b9c\u57ce\u5e02"},"420700":{"area_id":"420700","parent_id":"420000","area_name":"\u9102\u5dde\u5e02"},"420701":{"area_id":"420701","parent_id":"420700","area_name":"\u9102\u5dde\u5e02\u5e02\u8f96\u533a"},"420702":{"area_id":"420702","parent_id":"420700","area_name":"\u6881\u5b50\u6e56\u533a"},"420703":{"area_id":"420703","parent_id":"420700","area_name":"\u534e\u5bb9\u533a"},"420704":{"area_id":"420704","parent_id":"420700","area_name":"\u9102\u57ce\u533a"},"420800":{"area_id":"420800","parent_id":"420000","area_name":"\u8346\u95e8\u5e02"},"420801":{"area_id":"420801","parent_id":"420800","area_name":"\u8346\u95e8\u5e02\u5e02\u8f96\u533a"},"420802":{"area_id":"420802","parent_id":"420800","area_name":"\u4e1c\u5b9d\u533a"},"420804":{"area_id":"420804","parent_id":"420800","area_name":"\u6387\u5200\u533a"},"420821":{"area_id":"420821","parent_id":"420800","area_name":"\u4eac\u5c71\u53bf"},"420822":{"area_id":"420822","parent_id":"420800","area_name":"\u6c99\u6d0b\u53bf"},"420881":{"area_id":"420881","parent_id":"420800","area_name":"\u949f\u7965\u5e02"},"420900":{"area_id":"420900","parent_id":"420000","area_name":"\u5b5d\u611f\u5e02"},"420901":{"area_id":"420901","parent_id":"420900","area_name":"\u5b5d\u611f\u5e02\u5e02\u8f96\u533a"},"420902":{"area_id":"420902","parent_id":"420900","area_name":"\u5b5d\u5357\u533a"},"420921":{"area_id":"420921","parent_id":"420900","area_name":"\u5b5d\u660c\u53bf"},"420922":{"area_id":"420922","parent_id":"420900","area_name":"\u5927\u609f\u53bf"},"420923":{"area_id":"420923","parent_id":"420900","area_name":"\u4e91\u68a6\u53bf"},"420981":{"area_id":"420981","parent_id":"420900","area_name":"\u5e94\u57ce\u5e02"},"420982":{"area_id":"420982","parent_id":"420900","area_name":"\u5b89\u9646\u5e02"},"420984":{"area_id":"420984","parent_id":"420900","area_name":"\u6c49\u5ddd\u5e02"},"421000":{"area_id":"421000","parent_id":"420000","area_name":"\u8346\u5dde\u5e02"},"421001":{"area_id":"421001","parent_id":"421000","area_name":"\u8346\u5dde\u5e02\u5e02\u8f96\u533a"},"421002":{"area_id":"421002","parent_id":"421000","area_name":"\u6c99\u5e02\u533a"},"421003":{"area_id":"421003","parent_id":"421000","area_name":"\u8346\u5dde\u533a"},"421022":{"area_id":"421022","parent_id":"421000","area_name":"\u516c\u5b89\u53bf"},"421023":{"area_id":"421023","parent_id":"421000","area_name":"\u76d1\u5229\u53bf"},"421024":{"area_id":"421024","parent_id":"421000","area_name":"\u6c5f\u9675\u53bf"},"421081":{"area_id":"421081","parent_id":"421000","area_name":"\u77f3\u9996\u5e02"},"421083":{"area_id":"421083","parent_id":"421000","area_name":"\u6d2a\u6e56\u5e02"},"421087":{"area_id":"421087","parent_id":"421000","area_name":"\u677e\u6ecb\u5e02"},"421100":{"area_id":"421100","parent_id":"420000","area_name":"\u9ec4\u5188\u5e02"},"421101":{"area_id":"421101","parent_id":"421100","area_name":"\u9ec4\u5188\u5e02\u5e02\u8f96\u533a"},"421102":{"area_id":"421102","parent_id":"421100","area_name":"\u9ec4\u5dde\u533a"},"421121":{"area_id":"421121","parent_id":"421100","area_name":"\u56e2\u98ce\u53bf"},"421122":{"area_id":"421122","parent_id":"421100","area_name":"\u7ea2\u5b89\u53bf"},"421123":{"area_id":"421123","parent_id":"421100","area_name":"\u7f57\u7530\u53bf"},"421124":{"area_id":"421124","parent_id":"421100","area_name":"\u82f1\u5c71\u53bf"},"421125":{"area_id":"421125","parent_id":"421100","area_name":"\u6d60\u6c34\u53bf"},"421126":{"area_id":"421126","parent_id":"421100","area_name":"\u8572\u6625\u53bf"},"421127":{"area_id":"421127","parent_id":"421100","area_name":"\u9ec4\u6885\u53bf"},"421181":{"area_id":"421181","parent_id":"421100","area_name":"\u9ebb\u57ce\u5e02"},"421182":{"area_id":"421182","parent_id":"421100","area_name":"\u6b66\u7a74\u5e02"},"421200":{"area_id":"421200","parent_id":"420000","area_name":"\u54b8\u5b81\u5e02"},"421201":{"area_id":"421201","parent_id":"421200","area_name":"\u54b8\u5b81\u5e02\u5e02\u8f96\u533a"},"421202":{"area_id":"421202","parent_id":"421200","area_name":"\u54b8\u5b89\u533a"},"421221":{"area_id":"421221","parent_id":"421200","area_name":"\u5609\u9c7c\u53bf"},"421222":{"area_id":"421222","parent_id":"421200","area_name":"\u901a\u57ce\u53bf"},"421223":{"area_id":"421223","parent_id":"421200","area_name":"\u5d07\u9633\u53bf"},"421224":{"area_id":"421224","parent_id":"421200","area_name":"\u901a\u5c71\u53bf"},"421281":{"area_id":"421281","parent_id":"421200","area_name":"\u8d64\u58c1\u5e02"},"421300":{"area_id":"421300","parent_id":"420000","area_name":"\u968f\u5dde\u5e02"},"421301":{"area_id":"421301","parent_id":"421300","area_name":"\u968f\u5dde\u5e02\u5e02\u8f96\u533a"},"421303":{"area_id":"421303","parent_id":"421300","area_name":"\u66fe\u90fd\u533a"},"421321":{"area_id":"421321","parent_id":"421300","area_name":"\u968f\u53bf"},"421381":{"area_id":"421381","parent_id":"421300","area_name":"\u5e7f\u6c34\u5e02"},"422800":{"area_id":"422800","parent_id":"420000","area_name":"\u6069\u65bd\u571f\u5bb6\u65cf\u82d7\u65cf\u81ea\u6cbb\u5dde"},"422801":{"area_id":"422801","parent_id":"422800","area_name":"\u6069\u65bd\u5e02"},"422802":{"area_id":"422802","parent_id":"422800","area_name":"\u5229\u5ddd\u5e02"},"422822":{"area_id":"422822","parent_id":"422800","area_name":"\u5efa\u59cb\u53bf"},"422823":{"area_id":"422823","parent_id":"422800","area_name":"\u5df4\u4e1c\u53bf"},"422825":{"area_id":"422825","parent_id":"422800","area_name":"\u5ba3\u6069\u53bf"},"422826":{"area_id":"422826","parent_id":"422800","area_name":"\u54b8\u4e30\u53bf"},"422827":{"area_id":"422827","parent_id":"422800","area_name":"\u6765\u51e4\u53bf"},"422828":{"area_id":"422828","parent_id":"422800","area_name":"\u9e64\u5cf0\u53bf"},"429000":{"area_id":"429000","parent_id":"420000","area_name":"\u7701\u76f4\u8f96\u53bf\u7ea7\u884c\u653f\u533a\u5212"},"429004":{"area_id":"429004","parent_id":"429000","area_name":"\u4ed9\u6843\u5e02"},"429005":{"area_id":"429005","parent_id":"429000","area_name":"\u6f5c\u6c5f\u5e02"},"429006":{"area_id":"429006","parent_id":"429000","area_name":"\u5929\u95e8\u5e02"},"429021":{"area_id":"429021","parent_id":"429000","area_name":"\u795e\u519c\u67b6\u6797\u533a"},"430000":{"area_id":"430000","parent_id":"0","area_name":"\u6e56\u5357\u7701"},"430100":{"area_id":"430100","parent_id":"430000","area_name":"\u957f\u6c99\u5e02"},"430101":{"area_id":"430101","parent_id":"430100","area_name":"\u957f\u6c99\u5e02\u5e02\u8f96\u533a"},"430102":{"area_id":"430102","parent_id":"430100","area_name":"\u8299\u84c9\u533a"},"430103":{"area_id":"430103","parent_id":"430100","area_name":"\u5929\u5fc3\u533a"},"430104":{"area_id":"430104","parent_id":"430100","area_name":"\u5cb3\u9e93\u533a"},"430105":{"area_id":"430105","parent_id":"430100","area_name":"\u5f00\u798f\u533a"},"430111":{"area_id":"430111","parent_id":"430100","area_name":"\u96e8\u82b1\u533a"},"430112":{"area_id":"430112","parent_id":"430100","area_name":"\u671b\u57ce\u533a"},"430121":{"area_id":"430121","parent_id":"430100","area_name":"\u957f\u6c99\u53bf"},"430124":{"area_id":"430124","parent_id":"430100","area_name":"\u5b81\u4e61\u53bf"},"430181":{"area_id":"430181","parent_id":"430100","area_name":"\u6d4f\u9633\u5e02"},"430200":{"area_id":"430200","parent_id":"430000","area_name":"\u682a\u6d32\u5e02"},"430201":{"area_id":"430201","parent_id":"430200","area_name":"\u682a\u6d32\u5e02\u5e02\u8f96\u533a"},"430202":{"area_id":"430202","parent_id":"430200","area_name":"\u8377\u5858\u533a"},"430203":{"area_id":"430203","parent_id":"430200","area_name":"\u82a6\u6dde\u533a"},"430204":{"area_id":"430204","parent_id":"430200","area_name":"\u77f3\u5cf0\u533a"},"430211":{"area_id":"430211","parent_id":"430200","area_name":"\u5929\u5143\u533a"},"430221":{"area_id":"430221","parent_id":"430200","area_name":"\u682a\u6d32\u53bf"},"430223":{"area_id":"430223","parent_id":"430200","area_name":"\u6538\u53bf"},"430224":{"area_id":"430224","parent_id":"430200","area_name":"\u8336\u9675\u53bf"},"430225":{"area_id":"430225","parent_id":"430200","area_name":"\u708e\u9675\u53bf"},"430281":{"area_id":"430281","parent_id":"430200","area_name":"\u91b4\u9675\u5e02"},"430300":{"area_id":"430300","parent_id":"430000","area_name":"\u6e58\u6f6d\u5e02"},"430301":{"area_id":"430301","parent_id":"430300","area_name":"\u6e58\u6f6d\u5e02\u5e02\u8f96\u533a"},"430302":{"area_id":"430302","parent_id":"430300","area_name":"\u96e8\u6e56\u533a"},"430304":{"area_id":"430304","parent_id":"430300","area_name":"\u5cb3\u5858\u533a"},"430321":{"area_id":"430321","parent_id":"430300","area_name":"\u6e58\u6f6d\u53bf"},"430381":{"area_id":"430381","parent_id":"430300","area_name":"\u6e58\u4e61\u5e02"},"430382":{"area_id":"430382","parent_id":"430300","area_name":"\u97f6\u5c71\u5e02"},"430400":{"area_id":"430400","parent_id":"430000","area_name":"\u8861\u9633\u5e02"},"430401":{"area_id":"430401","parent_id":"430400","area_name":"\u8861\u9633\u5e02\u5e02\u8f96\u533a"},"430405":{"area_id":"430405","parent_id":"430400","area_name":"\u73e0\u6656\u533a"},"430406":{"area_id":"430406","parent_id":"430400","area_name":"\u96c1\u5cf0\u533a"},"430407":{"area_id":"430407","parent_id":"430400","area_name":"\u77f3\u9f13\u533a"},"430408":{"area_id":"430408","parent_id":"430400","area_name":"\u84b8\u6e58\u533a"},"430412":{"area_id":"430412","parent_id":"430400","area_name":"\u5357\u5cb3\u533a"},"430421":{"area_id":"430421","parent_id":"430400","area_name":"\u8861\u9633\u53bf"},"430422":{"area_id":"430422","parent_id":"430400","area_name":"\u8861\u5357\u53bf"},"430423":{"area_id":"430423","parent_id":"430400","area_name":"\u8861\u5c71\u53bf"},"430424":{"area_id":"430424","parent_id":"430400","area_name":"\u8861\u4e1c\u53bf"},"430426":{"area_id":"430426","parent_id":"430400","area_name":"\u7941\u4e1c\u53bf"},"430481":{"area_id":"430481","parent_id":"430400","area_name":"\u8012\u9633\u5e02"},"430482":{"area_id":"430482","parent_id":"430400","area_name":"\u5e38\u5b81\u5e02"},"430500":{"area_id":"430500","parent_id":"430000","area_name":"\u90b5\u9633\u5e02"},"430501":{"area_id":"430501","parent_id":"430500","area_name":"\u90b5\u9633\u5e02\u5e02\u8f96\u533a"},"430502":{"area_id":"430502","parent_id":"430500","area_name":"\u53cc\u6e05\u533a"},"430503":{"area_id":"430503","parent_id":"430500","area_name":"\u5927\u7965\u533a"},"430511":{"area_id":"430511","parent_id":"430500","area_name":"\u5317\u5854\u533a"},"430521":{"area_id":"430521","parent_id":"430500","area_name":"\u90b5\u4e1c\u53bf"},"430522":{"area_id":"430522","parent_id":"430500","area_name":"\u65b0\u90b5\u53bf"},"430523":{"area_id":"430523","parent_id":"430500","area_name":"\u90b5\u9633\u53bf"},"430524":{"area_id":"430524","parent_id":"430500","area_name":"\u9686\u56de\u53bf"},"430525":{"area_id":"430525","parent_id":"430500","area_name":"\u6d1e\u53e3\u53bf"},"430527":{"area_id":"430527","parent_id":"430500","area_name":"\u7ee5\u5b81\u53bf"},"430528":{"area_id":"430528","parent_id":"430500","area_name":"\u65b0\u5b81\u53bf"},"430529":{"area_id":"430529","parent_id":"430500","area_name":"\u57ce\u6b65\u82d7\u65cf\u81ea\u6cbb\u53bf"},"430581":{"area_id":"430581","parent_id":"430500","area_name":"\u6b66\u5188\u5e02"},"430600":{"area_id":"430600","parent_id":"430000","area_name":"\u5cb3\u9633\u5e02"},"430601":{"area_id":"430601","parent_id":"430600","area_name":"\u5cb3\u9633\u5e02\u5e02\u8f96\u533a"},"430602":{"area_id":"430602","parent_id":"430600","area_name":"\u5cb3\u9633\u697c\u533a"},"430603":{"area_id":"430603","parent_id":"430600","area_name":"\u4e91\u6eaa\u533a"},"430611":{"area_id":"430611","parent_id":"430600","area_name":"\u541b\u5c71\u533a"},"430621":{"area_id":"430621","parent_id":"430600","area_name":"\u5cb3\u9633\u53bf"},"430623":{"area_id":"430623","parent_id":"430600","area_name":"\u534e\u5bb9\u53bf"},"430624":{"area_id":"430624","parent_id":"430600","area_name":"\u6e58\u9634\u53bf"},"430626":{"area_id":"430626","parent_id":"430600","area_name":"\u5e73\u6c5f\u53bf"},"430681":{"area_id":"430681","parent_id":"430600","area_name":"\u6c68\u7f57\u5e02"},"430682":{"area_id":"430682","parent_id":"430600","area_name":"\u4e34\u6e58\u5e02"},"430700":{"area_id":"430700","parent_id":"430000","area_name":"\u5e38\u5fb7\u5e02"},"430701":{"area_id":"430701","parent_id":"430700","area_name":"\u5e38\u5fb7\u5e02\u5e02\u8f96\u533a"},"430702":{"area_id":"430702","parent_id":"430700","area_name":"\u6b66\u9675\u533a"},"430703":{"area_id":"430703","parent_id":"430700","area_name":"\u9f0e\u57ce\u533a"},"430721":{"area_id":"430721","parent_id":"430700","area_name":"\u5b89\u4e61\u53bf"},"430722":{"area_id":"430722","parent_id":"430700","area_name":"\u6c49\u5bff\u53bf"},"430723":{"area_id":"430723","parent_id":"430700","area_name":"\u6fa7\u53bf"},"430724":{"area_id":"430724","parent_id":"430700","area_name":"\u4e34\u6fa7\u53bf"},"430725":{"area_id":"430725","parent_id":"430700","area_name":"\u6843\u6e90\u53bf"},"430726":{"area_id":"430726","parent_id":"430700","area_name":"\u77f3\u95e8\u53bf"},"430781":{"area_id":"430781","parent_id":"430700","area_name":"\u6d25\u5e02\u5e02"},"430800":{"area_id":"430800","parent_id":"430000","area_name":"\u5f20\u5bb6\u754c\u5e02"},"430801":{"area_id":"430801","parent_id":"430800","area_name":"\u5f20\u5bb6\u754c\u5e02\u5e02\u8f96\u533a"},"430802":{"area_id":"430802","parent_id":"430800","area_name":"\u6c38\u5b9a\u533a"},"430811":{"area_id":"430811","parent_id":"430800","area_name":"\u6b66\u9675\u6e90\u533a"},"430821":{"area_id":"430821","parent_id":"430800","area_name":"\u6148\u5229\u53bf"},"430822":{"area_id":"430822","parent_id":"430800","area_name":"\u6851\u690d\u53bf"},"430900":{"area_id":"430900","parent_id":"430000","area_name":"\u76ca\u9633\u5e02"},"430901":{"area_id":"430901","parent_id":"430900","area_name":"\u76ca\u9633\u5e02\u5e02\u8f96\u533a"},"430902":{"area_id":"430902","parent_id":"430900","area_name":"\u8d44\u9633\u533a"},"430903":{"area_id":"430903","parent_id":"430900","area_name":"\u8d6b\u5c71\u533a"},"430921":{"area_id":"430921","parent_id":"430900","area_name":"\u5357\u53bf"},"430922":{"area_id":"430922","parent_id":"430900","area_name":"\u6843\u6c5f\u53bf"},"430923":{"area_id":"430923","parent_id":"430900","area_name":"\u5b89\u5316\u53bf"},"430981":{"area_id":"430981","parent_id":"430900","area_name":"\u6c85\u6c5f\u5e02"},"431000":{"area_id":"431000","parent_id":"430000","area_name":"\u90f4\u5dde\u5e02"},"431001":{"area_id":"431001","parent_id":"431000","area_name":"\u90f4\u5dde\u5e02\u5e02\u8f96\u533a"},"431002":{"area_id":"431002","parent_id":"431000","area_name":"\u5317\u6e56\u533a"},"431003":{"area_id":"431003","parent_id":"431000","area_name":"\u82cf\u4ed9\u533a"},"431021":{"area_id":"431021","parent_id":"431000","area_name":"\u6842\u9633\u53bf"},"431022":{"area_id":"431022","parent_id":"431000","area_name":"\u5b9c\u7ae0\u53bf"},"431023":{"area_id":"431023","parent_id":"431000","area_name":"\u6c38\u5174\u53bf"},"431024":{"area_id":"431024","parent_id":"431000","area_name":"\u5609\u79be\u53bf"},"431025":{"area_id":"431025","parent_id":"431000","area_name":"\u4e34\u6b66\u53bf"},"431026":{"area_id":"431026","parent_id":"431000","area_name":"\u6c5d\u57ce\u53bf"},"431027":{"area_id":"431027","parent_id":"431000","area_name":"\u6842\u4e1c\u53bf"},"431028":{"area_id":"431028","parent_id":"431000","area_name":"\u5b89\u4ec1\u53bf"},"431081":{"area_id":"431081","parent_id":"431000","area_name":"\u8d44\u5174\u5e02"},"431100":{"area_id":"431100","parent_id":"430000","area_name":"\u6c38\u5dde\u5e02"},"431101":{"area_id":"431101","parent_id":"431100","area_name":"\u6c38\u5dde\u5e02\u5e02\u8f96\u533a"},"431102":{"area_id":"431102","parent_id":"431100","area_name":"\u96f6\u9675\u533a"},"431103":{"area_id":"431103","parent_id":"431100","area_name":"\u51b7\u6c34\u6ee9\u533a"},"431121":{"area_id":"431121","parent_id":"431100","area_name":"\u7941\u9633\u53bf"},"431122":{"area_id":"431122","parent_id":"431100","area_name":"\u4e1c\u5b89\u53bf"},"431123":{"area_id":"431123","parent_id":"431100","area_name":"\u53cc\u724c\u53bf"},"431124":{"area_id":"431124","parent_id":"431100","area_name":"\u9053\u53bf"},"431125":{"area_id":"431125","parent_id":"431100","area_name":"\u6c5f\u6c38\u53bf"},"431126":{"area_id":"431126","parent_id":"431100","area_name":"\u5b81\u8fdc\u53bf"},"431127":{"area_id":"431127","parent_id":"431100","area_name":"\u84dd\u5c71\u53bf"},"431128":{"area_id":"431128","parent_id":"431100","area_name":"\u65b0\u7530\u53bf"},"431129":{"area_id":"431129","parent_id":"431100","area_name":"\u6c5f\u534e\u7476\u65cf\u81ea\u6cbb\u53bf"},"431200":{"area_id":"431200","parent_id":"430000","area_name":"\u6000\u5316\u5e02"},"431201":{"area_id":"431201","parent_id":"431200","area_name":"\u6000\u5316\u5e02\u5e02\u8f96\u533a"},"431202":{"area_id":"431202","parent_id":"431200","area_name":"\u9e64\u57ce\u533a"},"431221":{"area_id":"431221","parent_id":"431200","area_name":"\u4e2d\u65b9\u53bf"},"431222":{"area_id":"431222","parent_id":"431200","area_name":"\u6c85\u9675\u53bf"},"431223":{"area_id":"431223","parent_id":"431200","area_name":"\u8fb0\u6eaa\u53bf"},"431224":{"area_id":"431224","parent_id":"431200","area_name":"\u6e86\u6d66\u53bf"},"431225":{"area_id":"431225","parent_id":"431200","area_name":"\u4f1a\u540c\u53bf"},"431226":{"area_id":"431226","parent_id":"431200","area_name":"\u9ebb\u9633\u82d7\u65cf\u81ea\u6cbb\u53bf"},"431227":{"area_id":"431227","parent_id":"431200","area_name":"\u65b0\u6643\u4f97\u65cf\u81ea\u6cbb\u53bf"},"431228":{"area_id":"431228","parent_id":"431200","area_name":"\u82b7\u6c5f\u4f97\u65cf\u81ea\u6cbb\u53bf"},"431229":{"area_id":"431229","parent_id":"431200","area_name":"\u9756\u5dde\u82d7\u65cf\u4f97\u65cf\u81ea\u6cbb\u53bf"},"431230":{"area_id":"431230","parent_id":"431200","area_name":"\u901a\u9053\u4f97\u65cf\u81ea\u6cbb\u53bf"},"431281":{"area_id":"431281","parent_id":"431200","area_name":"\u6d2a\u6c5f\u5e02"},"431300":{"area_id":"431300","parent_id":"430000","area_name":"\u5a04\u5e95\u5e02"},"431301":{"area_id":"431301","parent_id":"431300","area_name":"\u5a04\u5e95\u5e02\u5e02\u8f96\u533a"},"431302":{"area_id":"431302","parent_id":"431300","area_name":"\u5a04\u661f\u533a"},"431321":{"area_id":"431321","parent_id":"431300","area_name":"\u53cc\u5cf0\u53bf"},"431322":{"area_id":"431322","parent_id":"431300","area_name":"\u65b0\u5316\u53bf"},"431381":{"area_id":"431381","parent_id":"431300","area_name":"\u51b7\u6c34\u6c5f\u5e02"},"431382":{"area_id":"431382","parent_id":"431300","area_name":"\u6d9f\u6e90\u5e02"},"433100":{"area_id":"433100","parent_id":"430000","area_name":"\u6e58\u897f\u571f\u5bb6\u65cf\u82d7\u65cf\u81ea\u6cbb\u5dde"},"433101":{"area_id":"433101","parent_id":"433100","area_name":"\u5409\u9996\u5e02"},"433122":{"area_id":"433122","parent_id":"433100","area_name":"\u6cf8\u6eaa\u53bf"},"433123":{"area_id":"433123","parent_id":"433100","area_name":"\u51e4\u51f0\u53bf"},"433124":{"area_id":"433124","parent_id":"433100","area_name":"\u82b1\u57a3\u53bf"},"433125":{"area_id":"433125","parent_id":"433100","area_name":"\u4fdd\u9756\u53bf"},"433126":{"area_id":"433126","parent_id":"433100","area_name":"\u53e4\u4e08\u53bf"},"433127":{"area_id":"433127","parent_id":"433100","area_name":"\u6c38\u987a\u53bf"},"433130":{"area_id":"433130","parent_id":"433100","area_name":"\u9f99\u5c71\u53bf"},"440000":{"area_id":"440000","parent_id":"0","area_name":"\u5e7f\u4e1c\u7701"},"440100":{"area_id":"440100","parent_id":"440000","area_name":"\u5e7f\u5dde\u5e02"},"440101":{"area_id":"440101","parent_id":"440100","area_name":"\u5e7f\u5dde\u5e02\u5e02\u8f96\u533a"},"440103":{"area_id":"440103","parent_id":"440100","area_name":"\u8354\u6e7e\u533a"},"440104":{"area_id":"440104","parent_id":"440100","area_name":"\u8d8a\u79c0\u533a"},"440105":{"area_id":"440105","parent_id":"440100","area_name":"\u6d77\u73e0\u533a"},"440106":{"area_id":"440106","parent_id":"440100","area_name":"\u5929\u6cb3\u533a"},"440111":{"area_id":"440111","parent_id":"440100","area_name":"\u767d\u4e91\u533a"},"440112":{"area_id":"440112","parent_id":"440100","area_name":"\u9ec4\u57d4\u533a"},"440113":{"area_id":"440113","parent_id":"440100","area_name":"\u756a\u79ba\u533a"},"440114":{"area_id":"440114","parent_id":"440100","area_name":"\u82b1\u90fd\u533a"},"440115":{"area_id":"440115","parent_id":"440100","area_name":"\u5357\u6c99\u533a"},"440116":{"area_id":"440116","parent_id":"440100","area_name":"\u841d\u5c97\u533a"},"440183":{"area_id":"440183","parent_id":"440100","area_name":"\u589e\u57ce\u5e02"},"440184":{"area_id":"440184","parent_id":"440100","area_name":"\u4ece\u5316\u5e02"},"440200":{"area_id":"440200","parent_id":"440000","area_name":"\u97f6\u5173\u5e02"},"440201":{"area_id":"440201","parent_id":"440200","area_name":"\u97f6\u5173\u5e02\u5e02\u8f96\u533a"},"440203":{"area_id":"440203","parent_id":"440200","area_name":"\u6b66\u6c5f\u533a"},"440204":{"area_id":"440204","parent_id":"440200","area_name":"\u6d48\u6c5f\u533a"},"440205":{"area_id":"440205","parent_id":"440200","area_name":"\u66f2\u6c5f\u533a"},"440222":{"area_id":"440222","parent_id":"440200","area_name":"\u59cb\u5174\u53bf"},"440224":{"area_id":"440224","parent_id":"440200","area_name":"\u4ec1\u5316\u53bf"},"440229":{"area_id":"440229","parent_id":"440200","area_name":"\u7fc1\u6e90\u53bf"},"440232":{"area_id":"440232","parent_id":"440200","area_name":"\u4e73\u6e90\u7476\u65cf\u81ea\u6cbb\u53bf"},"440233":{"area_id":"440233","parent_id":"440200","area_name":"\u65b0\u4e30\u53bf"},"440281":{"area_id":"440281","parent_id":"440200","area_name":"\u4e50\u660c\u5e02"},"440282":{"area_id":"440282","parent_id":"440200","area_name":"\u5357\u96c4\u5e02"},"440300":{"area_id":"440300","parent_id":"440000","area_name":"\u6df1\u5733\u5e02"},"440301":{"area_id":"440301","parent_id":"440300","area_name":"\u6df1\u5733\u5e02\u5e02\u8f96\u533a"},"440303":{"area_id":"440303","parent_id":"440300","area_name":"\u7f57\u6e56\u533a"},"440304":{"area_id":"440304","parent_id":"440300","area_name":"\u798f\u7530\u533a"},"440305":{"area_id":"440305","parent_id":"440300","area_name":"\u5357\u5c71\u533a"},"440306":{"area_id":"440306","parent_id":"440300","area_name":"\u5b9d\u5b89\u533a"},"440307":{"area_id":"440307","parent_id":"440300","area_name":"\u9f99\u5c97\u533a"},"440308":{"area_id":"440308","parent_id":"440300","area_name":"\u76d0\u7530\u533a"},"440400":{"area_id":"440400","parent_id":"440000","area_name":"\u73e0\u6d77\u5e02"},"440401":{"area_id":"440401","parent_id":"440400","area_name":"\u73e0\u6d77\u5e02\u5e02\u8f96\u533a"},"440402":{"area_id":"440402","parent_id":"440400","area_name":"\u9999\u6d32\u533a"},"440403":{"area_id":"440403","parent_id":"440400","area_name":"\u6597\u95e8\u533a"},"440404":{"area_id":"440404","parent_id":"440400","area_name":"\u91d1\u6e7e\u533a"},"440500":{"area_id":"440500","parent_id":"440000","area_name":"\u6c55\u5934\u5e02"},"440501":{"area_id":"440501","parent_id":"440500","area_name":"\u6c55\u5934\u5e02\u5e02\u8f96\u533a"},"440507":{"area_id":"440507","parent_id":"440500","area_name":"\u9f99\u6e56\u533a"},"440511":{"area_id":"440511","parent_id":"440500","area_name":"\u91d1\u5e73\u533a"},"440512":{"area_id":"440512","parent_id":"440500","area_name":"\u6fe0\u6c5f\u533a"},"440513":{"area_id":"440513","parent_id":"440500","area_name":"\u6f6e\u9633\u533a"},"440514":{"area_id":"440514","parent_id":"440500","area_name":"\u6f6e\u5357\u533a"},"440515":{"area_id":"440515","parent_id":"440500","area_name":"\u6f84\u6d77\u533a"},"440523":{"area_id":"440523","parent_id":"440500","area_name":"\u5357\u6fb3\u53bf"},"440600":{"area_id":"440600","parent_id":"440000","area_name":"\u4f5b\u5c71\u5e02"},"440601":{"area_id":"440601","parent_id":"440600","area_name":"\u4f5b\u5c71\u5e02\u5e02\u8f96\u533a"},"440604":{"area_id":"440604","parent_id":"440600","area_name":"\u7985\u57ce\u533a"},"440605":{"area_id":"440605","parent_id":"440600","area_name":"\u5357\u6d77\u533a"},"440606":{"area_id":"440606","parent_id":"440600","area_name":"\u987a\u5fb7\u533a"},"440607":{"area_id":"440607","parent_id":"440600","area_name":"\u4e09\u6c34\u533a"},"440608":{"area_id":"440608","parent_id":"440600","area_name":"\u9ad8\u660e\u533a"},"440700":{"area_id":"440700","parent_id":"440000","area_name":"\u6c5f\u95e8\u5e02"},"440701":{"area_id":"440701","parent_id":"440700","area_name":"\u6c5f\u95e8\u5e02\u5e02\u8f96\u533a"},"440703":{"area_id":"440703","parent_id":"440700","area_name":"\u84ec\u6c5f\u533a"},"440704":{"area_id":"440704","parent_id":"440700","area_name":"\u6c5f\u6d77\u533a"},"440705":{"area_id":"440705","parent_id":"440700","area_name":"\u65b0\u4f1a\u533a"},"440781":{"area_id":"440781","parent_id":"440700","area_name":"\u53f0\u5c71\u5e02"},"440783":{"area_id":"440783","parent_id":"440700","area_name":"\u5f00\u5e73\u5e02"},"440784":{"area_id":"440784","parent_id":"440700","area_name":"\u9e64\u5c71\u5e02"},"440785":{"area_id":"440785","parent_id":"440700","area_name":"\u6069\u5e73\u5e02"},"440800":{"area_id":"440800","parent_id":"440000","area_name":"\u6e5b\u6c5f\u5e02"},"440801":{"area_id":"440801","parent_id":"440800","area_name":"\u6e5b\u6c5f\u5e02\u5e02\u8f96\u533a"},"440802":{"area_id":"440802","parent_id":"440800","area_name":"\u8d64\u574e\u533a"},"440803":{"area_id":"440803","parent_id":"440800","area_name":"\u971e\u5c71\u533a"},"440804":{"area_id":"440804","parent_id":"440800","area_name":"\u5761\u5934\u533a"},"440811":{"area_id":"440811","parent_id":"440800","area_name":"\u9ebb\u7ae0\u533a"},"440823":{"area_id":"440823","parent_id":"440800","area_name":"\u9042\u6eaa\u53bf"},"440825":{"area_id":"440825","parent_id":"440800","area_name":"\u5f90\u95fb\u53bf"},"440881":{"area_id":"440881","parent_id":"440800","area_name":"\u5ec9\u6c5f\u5e02"},"440882":{"area_id":"440882","parent_id":"440800","area_name":"\u96f7\u5dde\u5e02"},"440883":{"area_id":"440883","parent_id":"440800","area_name":"\u5434\u5ddd\u5e02"},"440900":{"area_id":"440900","parent_id":"440000","area_name":"\u8302\u540d\u5e02"},"440901":{"area_id":"440901","parent_id":"440900","area_name":"\u8302\u540d\u5e02\u5e02\u8f96\u533a"},"440902":{"area_id":"440902","parent_id":"440900","area_name":"\u8302\u5357\u533a"},"440903":{"area_id":"440903","parent_id":"440900","area_name":"\u8302\u6e2f\u533a"},"440923":{"area_id":"440923","parent_id":"440900","area_name":"\u7535\u767d\u53bf"},"440981":{"area_id":"440981","parent_id":"440900","area_name":"\u9ad8\u5dde\u5e02"},"440982":{"area_id":"440982","parent_id":"440900","area_name":"\u5316\u5dde\u5e02"},"440983":{"area_id":"440983","parent_id":"440900","area_name":"\u4fe1\u5b9c\u5e02"},"441200":{"area_id":"441200","parent_id":"440000","area_name":"\u8087\u5e86\u5e02"},"441201":{"area_id":"441201","parent_id":"441200","area_name":"\u8087\u5e86\u5e02\u5e02\u8f96\u533a"},"441202":{"area_id":"441202","parent_id":"441200","area_name":"\u7aef\u5dde\u533a"},"441203":{"area_id":"441203","parent_id":"441200","area_name":"\u9f0e\u6e56\u533a"},"441223":{"area_id":"441223","parent_id":"441200","area_name":"\u5e7f\u5b81\u53bf"},"441224":{"area_id":"441224","parent_id":"441200","area_name":"\u6000\u96c6\u53bf"},"441225":{"area_id":"441225","parent_id":"441200","area_name":"\u5c01\u5f00\u53bf"},"441226":{"area_id":"441226","parent_id":"441200","area_name":"\u5fb7\u5e86\u53bf"},"441283":{"area_id":"441283","parent_id":"441200","area_name":"\u9ad8\u8981\u5e02"},"441284":{"area_id":"441284","parent_id":"441200","area_name":"\u56db\u4f1a\u5e02"},"441300":{"area_id":"441300","parent_id":"440000","area_name":"\u60e0\u5dde\u5e02"},"441301":{"area_id":"441301","parent_id":"441300","area_name":"\u60e0\u5dde\u5e02\u5e02\u8f96\u533a"},"441302":{"area_id":"441302","parent_id":"441300","area_name":"\u60e0\u57ce\u533a"},"441303":{"area_id":"441303","parent_id":"441300","area_name":"\u60e0\u9633\u533a"},"441322":{"area_id":"441322","parent_id":"441300","area_name":"\u535a\u7f57\u53bf"},"441323":{"area_id":"441323","parent_id":"441300","area_name":"\u60e0\u4e1c\u53bf"},"441324":{"area_id":"441324","parent_id":"441300","area_name":"\u9f99\u95e8\u53bf"},"441400":{"area_id":"441400","parent_id":"440000","area_name":"\u6885\u5dde\u5e02"},"441401":{"area_id":"441401","parent_id":"441400","area_name":"\u6885\u5dde\u5e02\u5e02\u8f96\u533a"},"441402":{"area_id":"441402","parent_id":"441400","area_name":"\u6885\u6c5f\u533a"},"441421":{"area_id":"441421","parent_id":"441400","area_name":"\u6885\u53bf"},"441422":{"area_id":"441422","parent_id":"441400","area_name":"\u5927\u57d4\u53bf"},"441423":{"area_id":"441423","parent_id":"441400","area_name":"\u4e30\u987a\u53bf"},"441424":{"area_id":"441424","parent_id":"441400","area_name":"\u4e94\u534e\u53bf"},"441426":{"area_id":"441426","parent_id":"441400","area_name":"\u5e73\u8fdc\u53bf"},"441427":{"area_id":"441427","parent_id":"441400","area_name":"\u8549\u5cad\u53bf"},"441481":{"area_id":"441481","parent_id":"441400","area_name":"\u5174\u5b81\u5e02"},"441500":{"area_id":"441500","parent_id":"440000","area_name":"\u6c55\u5c3e\u5e02"},"441501":{"area_id":"441501","parent_id":"441500","area_name":"\u6c55\u5c3e\u5e02\u5e02\u8f96\u533a"},"441502":{"area_id":"441502","parent_id":"441500","area_name":"\u57ce\u533a"},"441521":{"area_id":"441521","parent_id":"441500","area_name":"\u6d77\u4e30\u53bf"},"441523":{"area_id":"441523","parent_id":"441500","area_name":"\u9646\u6cb3\u53bf"},"441581":{"area_id":"441581","parent_id":"441500","area_name":"\u9646\u4e30\u5e02"},"441600":{"area_id":"441600","parent_id":"440000","area_name":"\u6cb3\u6e90\u5e02"},"441601":{"area_id":"441601","parent_id":"441600","area_name":"\u6cb3\u6e90\u5e02\u5e02\u8f96\u533a"},"441602":{"area_id":"441602","parent_id":"441600","area_name":"\u6e90\u57ce\u533a"},"441621":{"area_id":"441621","parent_id":"441600","area_name":"\u7d2b\u91d1\u53bf"},"441622":{"area_id":"441622","parent_id":"441600","area_name":"\u9f99\u5ddd\u53bf"},"441623":{"area_id":"441623","parent_id":"441600","area_name":"\u8fde\u5e73\u53bf"},"441624":{"area_id":"441624","parent_id":"441600","area_name":"\u548c\u5e73\u53bf"},"441625":{"area_id":"441625","parent_id":"441600","area_name":"\u4e1c\u6e90\u53bf"},"441700":{"area_id":"441700","parent_id":"440000","area_name":"\u9633\u6c5f\u5e02"},"441701":{"area_id":"441701","parent_id":"441700","area_name":"\u9633\u6c5f\u5e02\u5e02\u8f96\u533a"},"441702":{"area_id":"441702","parent_id":"441700","area_name":"\u6c5f\u57ce\u533a"},"441721":{"area_id":"441721","parent_id":"441700","area_name":"\u9633\u897f\u53bf"},"441723":{"area_id":"441723","parent_id":"441700","area_name":"\u9633\u4e1c\u53bf"},"441781":{"area_id":"441781","parent_id":"441700","area_name":"\u9633\u6625\u5e02"},"441800":{"area_id":"441800","parent_id":"440000","area_name":"\u6e05\u8fdc\u5e02"},"441801":{"area_id":"441801","parent_id":"441800","area_name":"\u6e05\u8fdc\u5e02\u5e02\u8f96\u533a"},"441802":{"area_id":"441802","parent_id":"441800","area_name":"\u6e05\u57ce\u533a"},"441803":{"area_id":"441803","parent_id":"441800","area_name":"\u6e05\u65b0\u533a"},"441821":{"area_id":"441821","parent_id":"441800","area_name":"\u4f5b\u5188\u53bf"},"441823":{"area_id":"441823","parent_id":"441800","area_name":"\u9633\u5c71\u53bf"},"441825":{"area_id":"441825","parent_id":"441800","area_name":"\u8fde\u5c71\u58ee\u65cf\u7476\u65cf\u81ea\u6cbb\u53bf"},"441826":{"area_id":"441826","parent_id":"441800","area_name":"\u8fde\u5357\u7476\u65cf\u81ea\u6cbb\u53bf"},"441881":{"area_id":"441881","parent_id":"441800","area_name":"\u82f1\u5fb7\u5e02"},"441882":{"area_id":"441882","parent_id":"441800","area_name":"\u8fde\u5dde\u5e02"},"441900":{"area_id":"441900","parent_id":"440000","area_name":"\u4e1c\u839e\u5e02"},"442000":{"area_id":"442000","parent_id":"440000","area_name":"\u4e2d\u5c71\u5e02"},"445100":{"area_id":"445100","parent_id":"440000","area_name":"\u6f6e\u5dde\u5e02"},"445101":{"area_id":"445101","parent_id":"445100","area_name":"\u6f6e\u5dde\u5e02\u5e02\u8f96\u533a"},"445102":{"area_id":"445102","parent_id":"445100","area_name":"\u6e58\u6865\u533a"},"445103":{"area_id":"445103","parent_id":"445100","area_name":"\u6f6e\u5b89\u533a"},"445122":{"area_id":"445122","parent_id":"445100","area_name":"\u9976\u5e73\u53bf"},"445200":{"area_id":"445200","parent_id":"440000","area_name":"\u63ed\u9633\u5e02"},"445201":{"area_id":"445201","parent_id":"445200","area_name":"\u63ed\u9633\u5e02\u5e02\u8f96\u533a"},"445202":{"area_id":"445202","parent_id":"445200","area_name":"\u6995\u57ce\u533a"},"445203":{"area_id":"445203","parent_id":"445200","area_name":"\u63ed\u4e1c\u533a"},"445222":{"area_id":"445222","parent_id":"445200","area_name":"\u63ed\u897f\u53bf"},"445224":{"area_id":"445224","parent_id":"445200","area_name":"\u60e0\u6765\u53bf"},"445281":{"area_id":"445281","parent_id":"445200","area_name":"\u666e\u5b81\u5e02"},"445300":{"area_id":"445300","parent_id":"440000","area_name":"\u4e91\u6d6e\u5e02"},"445301":{"area_id":"445301","parent_id":"445300","area_name":"\u4e91\u6d6e\u5e02\u5e02\u8f96\u533a"},"445302":{"area_id":"445302","parent_id":"445300","area_name":"\u4e91\u57ce\u533a"},"445321":{"area_id":"445321","parent_id":"445300","area_name":"\u65b0\u5174\u53bf"},"445322":{"area_id":"445322","parent_id":"445300","area_name":"\u90c1\u5357\u53bf"},"445323":{"area_id":"445323","parent_id":"445300","area_name":"\u4e91\u5b89\u53bf"},"445381":{"area_id":"445381","parent_id":"445300","area_name":"\u7f57\u5b9a\u5e02"},"450000":{"area_id":"450000","parent_id":"0","area_name":"\u5e7f\u897f\u58ee\u65cf\u81ea\u6cbb\u533a"},"450100":{"area_id":"450100","parent_id":"450000","area_name":"\u5357\u5b81\u5e02"},"450101":{"area_id":"450101","parent_id":"450100","area_name":"\u5357\u5b81\u5e02\u5e02\u8f96\u533a"},"450102":{"area_id":"450102","parent_id":"450100","area_name":"\u5174\u5b81\u533a"},"450103":{"area_id":"450103","parent_id":"450100","area_name":"\u9752\u79c0\u533a"},"450105":{"area_id":"450105","parent_id":"450100","area_name":"\u6c5f\u5357\u533a"},"450107":{"area_id":"450107","parent_id":"450100","area_name":"\u897f\u4e61\u5858\u533a"},"450108":{"area_id":"450108","parent_id":"450100","area_name":"\u826f\u5e86\u533a"},"450109":{"area_id":"450109","parent_id":"450100","area_name":"\u9095\u5b81\u533a"},"450122":{"area_id":"450122","parent_id":"450100","area_name":"\u6b66\u9e23\u53bf"},"450123":{"area_id":"450123","parent_id":"450100","area_name":"\u9686\u5b89\u53bf"},"450124":{"area_id":"450124","parent_id":"450100","area_name":"\u9a6c\u5c71\u53bf"},"450125":{"area_id":"450125","parent_id":"450100","area_name":"\u4e0a\u6797\u53bf"},"450126":{"area_id":"450126","parent_id":"450100","area_name":"\u5bbe\u9633\u53bf"},"450127":{"area_id":"450127","parent_id":"450100","area_name":"\u6a2a\u53bf"},"450200":{"area_id":"450200","parent_id":"450000","area_name":"\u67f3\u5dde\u5e02"},"450201":{"area_id":"450201","parent_id":"450200","area_name":"\u67f3\u5dde\u5e02\u5e02\u8f96\u533a"},"450202":{"area_id":"450202","parent_id":"450200","area_name":"\u57ce\u4e2d\u533a"},"450203":{"area_id":"450203","parent_id":"450200","area_name":"\u9c7c\u5cf0\u533a"},"450204":{"area_id":"450204","parent_id":"450200","area_name":"\u67f3\u5357\u533a"},"450205":{"area_id":"450205","parent_id":"450200","area_name":"\u67f3\u5317\u533a"},"450221":{"area_id":"450221","parent_id":"450200","area_name":"\u67f3\u6c5f\u53bf"},"450222":{"area_id":"450222","parent_id":"450200","area_name":"\u67f3\u57ce\u53bf"},"450223":{"area_id":"450223","parent_id":"450200","area_name":"\u9e7f\u5be8\u53bf"},"450224":{"area_id":"450224","parent_id":"450200","area_name":"\u878d\u5b89\u53bf"},"450225":{"area_id":"450225","parent_id":"450200","area_name":"\u878d\u6c34\u82d7\u65cf\u81ea\u6cbb\u53bf"},"450226":{"area_id":"450226","parent_id":"450200","area_name":"\u4e09\u6c5f\u4f97\u65cf\u81ea\u6cbb\u53bf"},"450300":{"area_id":"450300","parent_id":"450000","area_name":"\u6842\u6797\u5e02"},"450301":{"area_id":"450301","parent_id":"450300","area_name":"\u6842\u6797\u5e02\u5e02\u8f96\u533a"},"450302":{"area_id":"450302","parent_id":"450300","area_name":"\u79c0\u5cf0\u533a"},"450303":{"area_id":"450303","parent_id":"450300","area_name":"\u53e0\u5f69\u533a"},"450304":{"area_id":"450304","parent_id":"450300","area_name":"\u8c61\u5c71\u533a"},"450305":{"area_id":"450305","parent_id":"450300","area_name":"\u4e03\u661f\u533a"},"450311":{"area_id":"450311","parent_id":"450300","area_name":"\u96c1\u5c71\u533a"},"450312":{"area_id":"450312","parent_id":"450300","area_name":"\u4e34\u6842\u533a"},"450321":{"area_id":"450321","parent_id":"450300","area_name":"\u9633\u6714\u53bf"},"450323":{"area_id":"450323","parent_id":"450300","area_name":"\u7075\u5ddd\u53bf"},"450324":{"area_id":"450324","parent_id":"450300","area_name":"\u5168\u5dde\u53bf"},"450325":{"area_id":"450325","parent_id":"450300","area_name":"\u5174\u5b89\u53bf"},"450326":{"area_id":"450326","parent_id":"450300","area_name":"\u6c38\u798f\u53bf"},"450327":{"area_id":"450327","parent_id":"450300","area_name":"\u704c\u9633\u53bf"},"450328":{"area_id":"450328","parent_id":"450300","area_name":"\u9f99\u80dc\u5404\u65cf\u81ea\u6cbb\u53bf"},"450329":{"area_id":"450329","parent_id":"450300","area_name":"\u8d44\u6e90\u53bf"},"450330":{"area_id":"450330","parent_id":"450300","area_name":"\u5e73\u4e50\u53bf"},"450331":{"area_id":"450331","parent_id":"450300","area_name":"\u8354\u6d66\u53bf"},"450332":{"area_id":"450332","parent_id":"450300","area_name":"\u606d\u57ce\u7476\u65cf\u81ea\u6cbb\u53bf"},"450400":{"area_id":"450400","parent_id":"450000","area_name":"\u68a7\u5dde\u5e02"},"450401":{"area_id":"450401","parent_id":"450400","area_name":"\u68a7\u5dde\u5e02\u5e02\u8f96\u533a"},"450403":{"area_id":"450403","parent_id":"450400","area_name":"\u4e07\u79c0\u533a"},"450405":{"area_id":"450405","parent_id":"450400","area_name":"\u957f\u6d32\u533a"},"450406":{"area_id":"450406","parent_id":"450400","area_name":"\u9f99\u5729\u533a"},"450421":{"area_id":"450421","parent_id":"450400","area_name":"\u82cd\u68a7\u53bf"},"450422":{"area_id":"450422","parent_id":"450400","area_name":"\u85e4\u53bf"},"450423":{"area_id":"450423","parent_id":"450400","area_name":"\u8499\u5c71\u53bf"},"450481":{"area_id":"450481","parent_id":"450400","area_name":"\u5c91\u6eaa\u5e02"},"450500":{"area_id":"450500","parent_id":"450000","area_name":"\u5317\u6d77\u5e02"},"450501":{"area_id":"450501","parent_id":"450500","area_name":"\u5317\u6d77\u5e02\u5e02\u8f96\u533a"},"450502":{"area_id":"450502","parent_id":"450500","area_name":"\u6d77\u57ce\u533a"},"450503":{"area_id":"450503","parent_id":"450500","area_name":"\u94f6\u6d77\u533a"},"450512":{"area_id":"450512","parent_id":"450500","area_name":"\u94c1\u5c71\u6e2f\u533a"},"450521":{"area_id":"450521","parent_id":"450500","area_name":"\u5408\u6d66\u53bf"},"450600":{"area_id":"450600","parent_id":"450000","area_name":"\u9632\u57ce\u6e2f\u5e02"},"450601":{"area_id":"450601","parent_id":"450600","area_name":"\u9632\u57ce\u6e2f\u5e02\u5e02\u8f96\u533a"},"450602":{"area_id":"450602","parent_id":"450600","area_name":"\u6e2f\u53e3\u533a"},"450603":{"area_id":"450603","parent_id":"450600","area_name":"\u9632\u57ce\u533a"},"450621":{"area_id":"450621","parent_id":"450600","area_name":"\u4e0a\u601d\u53bf"},"450681":{"area_id":"450681","parent_id":"450600","area_name":"\u4e1c\u5174\u5e02"},"450700":{"area_id":"450700","parent_id":"450000","area_name":"\u94a6\u5dde\u5e02"},"450701":{"area_id":"450701","parent_id":"450700","area_name":"\u94a6\u5dde\u5e02\u5e02\u8f96\u533a"},"450702":{"area_id":"450702","parent_id":"450700","area_name":"\u94a6\u5357\u533a"},"450703":{"area_id":"450703","parent_id":"450700","area_name":"\u94a6\u5317\u533a"},"450721":{"area_id":"450721","parent_id":"450700","area_name":"\u7075\u5c71\u53bf"},"450722":{"area_id":"450722","parent_id":"450700","area_name":"\u6d66\u5317\u53bf"},"450800":{"area_id":"450800","parent_id":"450000","area_name":"\u8d35\u6e2f\u5e02"},"450801":{"area_id":"450801","parent_id":"450800","area_name":"\u8d35\u6e2f\u5e02\u5e02\u8f96\u533a"},"450802":{"area_id":"450802","parent_id":"450800","area_name":"\u6e2f\u5317\u533a"},"450803":{"area_id":"450803","parent_id":"450800","area_name":"\u6e2f\u5357\u533a"},"450804":{"area_id":"450804","parent_id":"450800","area_name":"\u8983\u5858\u533a"},"450821":{"area_id":"450821","parent_id":"450800","area_name":"\u5e73\u5357\u53bf"},"450881":{"area_id":"450881","parent_id":"450800","area_name":"\u6842\u5e73\u5e02"},"450900":{"area_id":"450900","parent_id":"450000","area_name":"\u7389\u6797\u5e02"},"450901":{"area_id":"450901","parent_id":"450900","area_name":"\u7389\u6797\u5e02\u5e02\u8f96\u533a"},"450902":{"area_id":"450902","parent_id":"450900","area_name":"\u7389\u5dde\u533a"},"450903":{"area_id":"450903","parent_id":"450900","area_name":"\u798f\u7ef5\u533a"},"450921":{"area_id":"450921","parent_id":"450900","area_name":"\u5bb9\u53bf"},"450922":{"area_id":"450922","parent_id":"450900","area_name":"\u9646\u5ddd\u53bf"},"450923":{"area_id":"450923","parent_id":"450900","area_name":"\u535a\u767d\u53bf"},"450924":{"area_id":"450924","parent_id":"450900","area_name":"\u5174\u4e1a\u53bf"},"450981":{"area_id":"450981","parent_id":"450900","area_name":"\u5317\u6d41\u5e02"},"451000":{"area_id":"451000","parent_id":"450000","area_name":"\u767e\u8272\u5e02"},"451001":{"area_id":"451001","parent_id":"451000","area_name":"\u767e\u8272\u5e02\u5e02\u8f96\u533a"},"451002":{"area_id":"451002","parent_id":"451000","area_name":"\u53f3\u6c5f\u533a"},"451021":{"area_id":"451021","parent_id":"451000","area_name":"\u7530\u9633\u53bf"},"451022":{"area_id":"451022","parent_id":"451000","area_name":"\u7530\u4e1c\u53bf"},"451023":{"area_id":"451023","parent_id":"451000","area_name":"\u5e73\u679c\u53bf"},"451024":{"area_id":"451024","parent_id":"451000","area_name":"\u5fb7\u4fdd\u53bf"},"451025":{"area_id":"451025","parent_id":"451000","area_name":"\u9756\u897f\u53bf"},"451026":{"area_id":"451026","parent_id":"451000","area_name":"\u90a3\u5761\u53bf"},"451027":{"area_id":"451027","parent_id":"451000","area_name":"\u51cc\u4e91\u53bf"},"451028":{"area_id":"451028","parent_id":"451000","area_name":"\u4e50\u4e1a\u53bf"},"451029":{"area_id":"451029","parent_id":"451000","area_name":"\u7530\u6797\u53bf"},"451030":{"area_id":"451030","parent_id":"451000","area_name":"\u897f\u6797\u53bf"},"451031":{"area_id":"451031","parent_id":"451000","area_name":"\u9686\u6797\u5404\u65cf\u81ea\u6cbb\u53bf"},"451100":{"area_id":"451100","parent_id":"450000","area_name":"\u8d3a\u5dde\u5e02"},"451101":{"area_id":"451101","parent_id":"451100","area_name":"\u8d3a\u5dde\u5e02\u5e02\u8f96\u533a"},"451102":{"area_id":"451102","parent_id":"451100","area_name":"\u516b\u6b65\u533a"},"451121":{"area_id":"451121","parent_id":"451100","area_name":"\u662d\u5e73\u53bf"},"451122":{"area_id":"451122","parent_id":"451100","area_name":"\u949f\u5c71\u53bf"},"451123":{"area_id":"451123","parent_id":"451100","area_name":"\u5bcc\u5ddd\u7476\u65cf\u81ea\u6cbb\u53bf"},"451200":{"area_id":"451200","parent_id":"450000","area_name":"\u6cb3\u6c60\u5e02"},"451201":{"area_id":"451201","parent_id":"451200","area_name":"\u6cb3\u6c60\u5e02\u5e02\u8f96\u533a"},"451202":{"area_id":"451202","parent_id":"451200","area_name":"\u91d1\u57ce\u6c5f\u533a"},"451221":{"area_id":"451221","parent_id":"451200","area_name":"\u5357\u4e39\u53bf"},"451222":{"area_id":"451222","parent_id":"451200","area_name":"\u5929\u5ce8\u53bf"},"451223":{"area_id":"451223","parent_id":"451200","area_name":"\u51e4\u5c71\u53bf"},"451224":{"area_id":"451224","parent_id":"451200","area_name":"\u4e1c\u5170\u53bf"},"451225":{"area_id":"451225","parent_id":"451200","area_name":"\u7f57\u57ce\u4eeb\u4f6c\u65cf\u81ea\u6cbb\u53bf"},"451226":{"area_id":"451226","parent_id":"451200","area_name":"\u73af\u6c5f\u6bdb\u5357\u65cf\u81ea\u6cbb\u53bf"},"451227":{"area_id":"451227","parent_id":"451200","area_name":"\u5df4\u9a6c\u7476\u65cf\u81ea\u6cbb\u53bf"},"451228":{"area_id":"451228","parent_id":"451200","area_name":"\u90fd\u5b89\u7476\u65cf\u81ea\u6cbb\u53bf"},"451229":{"area_id":"451229","parent_id":"451200","area_name":"\u5927\u5316\u7476\u65cf\u81ea\u6cbb\u53bf"},"451281":{"area_id":"451281","parent_id":"451200","area_name":"\u5b9c\u5dde\u5e02"},"451300":{"area_id":"451300","parent_id":"450000","area_name":"\u6765\u5bbe\u5e02"},"451301":{"area_id":"451301","parent_id":"451300","area_name":"\u6765\u5bbe\u5e02\u5e02\u8f96\u533a"},"451302":{"area_id":"451302","parent_id":"451300","area_name":"\u5174\u5bbe\u533a"},"451321":{"area_id":"451321","parent_id":"451300","area_name":"\u5ffb\u57ce\u53bf"},"451322":{"area_id":"451322","parent_id":"451300","area_name":"\u8c61\u5dde\u53bf"},"451323":{"area_id":"451323","parent_id":"451300","area_name":"\u6b66\u5ba3\u53bf"},"451324":{"area_id":"451324","parent_id":"451300","area_name":"\u91d1\u79c0\u7476\u65cf\u81ea\u6cbb\u53bf"},"451381":{"area_id":"451381","parent_id":"451300","area_name":"\u5408\u5c71\u5e02"},"451400":{"area_id":"451400","parent_id":"450000","area_name":"\u5d07\u5de6\u5e02"},"451401":{"area_id":"451401","parent_id":"451400","area_name":"\u5d07\u5de6\u5e02\u5e02\u8f96\u533a"},"451402":{"area_id":"451402","parent_id":"451400","area_name":"\u6c5f\u5dde\u533a"},"451421":{"area_id":"451421","parent_id":"451400","area_name":"\u6276\u7ee5\u53bf"},"451422":{"area_id":"451422","parent_id":"451400","area_name":"\u5b81\u660e\u53bf"},"451423":{"area_id":"451423","parent_id":"451400","area_name":"\u9f99\u5dde\u53bf"},"451424":{"area_id":"451424","parent_id":"451400","area_name":"\u5927\u65b0\u53bf"},"451425":{"area_id":"451425","parent_id":"451400","area_name":"\u5929\u7b49\u53bf"},"451481":{"area_id":"451481","parent_id":"451400","area_name":"\u51ed\u7965\u5e02"},"460000":{"area_id":"460000","parent_id":"0","area_name":"\u6d77\u5357\u7701"},"460100":{"area_id":"460100","parent_id":"460000","area_name":"\u6d77\u53e3\u5e02"},"460101":{"area_id":"460101","parent_id":"460100","area_name":"\u6d77\u53e3\u5e02\u5e02\u8f96\u533a"},"460105":{"area_id":"460105","parent_id":"460100","area_name":"\u79c0\u82f1\u533a"},"460106":{"area_id":"460106","parent_id":"460100","area_name":"\u9f99\u534e\u533a"},"460107":{"area_id":"460107","parent_id":"460100","area_name":"\u743c\u5c71\u533a"},"460108":{"area_id":"460108","parent_id":"460100","area_name":"\u7f8e\u5170\u533a"},"460200":{"area_id":"460200","parent_id":"460000","area_name":"\u4e09\u4e9a\u5e02"},"460201":{"area_id":"460201","parent_id":"460200","area_name":"\u4e09\u4e9a\u5e02\u5e02\u8f96\u533a"},"460300":{"area_id":"460300","parent_id":"460000","area_name":"\u4e09\u6c99\u5e02"},"460321":{"area_id":"460321","parent_id":"460300","area_name":"\u897f\u6c99\u7fa4\u5c9b"},"460322":{"area_id":"460322","parent_id":"460300","area_name":"\u5357\u6c99\u7fa4\u5c9b"},"460323":{"area_id":"460323","parent_id":"460300","area_name":"\u4e2d\u6c99\u7fa4\u5c9b\u7684\u5c9b\u7901\u53ca\u5176\u6d77\u57df"},"469000":{"area_id":"469000","parent_id":"460000","area_name":"\u7701\u76f4\u8f96\u53bf\u7ea7\u884c\u653f\u533a\u5212"},"469001":{"area_id":"469001","parent_id":"469000","area_name":"\u4e94\u6307\u5c71\u5e02"},"469002":{"area_id":"469002","parent_id":"469000","area_name":"\u743c\u6d77\u5e02"},"469003":{"area_id":"469003","parent_id":"469000","area_name":"\u510b\u5dde\u5e02"},"469005":{"area_id":"469005","parent_id":"469000","area_name":"\u6587\u660c\u5e02"},"469006":{"area_id":"469006","parent_id":"469000","area_name":"\u4e07\u5b81\u5e02"},"469007":{"area_id":"469007","parent_id":"469000","area_name":"\u4e1c\u65b9\u5e02"},"469021":{"area_id":"469021","parent_id":"469000","area_name":"\u5b9a\u5b89\u53bf"},"469022":{"area_id":"469022","parent_id":"469000","area_name":"\u5c6f\u660c\u53bf"},"469023":{"area_id":"469023","parent_id":"469000","area_name":"\u6f84\u8fc8\u53bf"},"469024":{"area_id":"469024","parent_id":"469000","area_name":"\u4e34\u9ad8\u53bf"},"469025":{"area_id":"469025","parent_id":"469000","area_name":"\u767d\u6c99\u9ece\u65cf\u81ea\u6cbb\u53bf"},"469026":{"area_id":"469026","parent_id":"469000","area_name":"\u660c\u6c5f\u9ece\u65cf\u81ea\u6cbb\u53bf"},"469027":{"area_id":"469027","parent_id":"469000","area_name":"\u4e50\u4e1c\u9ece\u65cf\u81ea\u6cbb\u53bf"},"469028":{"area_id":"469028","parent_id":"469000","area_name":"\u9675\u6c34\u9ece\u65cf\u81ea\u6cbb\u53bf"},"469029":{"area_id":"469029","parent_id":"469000","area_name":"\u4fdd\u4ead\u9ece\u65cf\u82d7\u65cf\u81ea\u6cbb\u53bf"},"469030":{"area_id":"469030","parent_id":"469000","area_name":"\u743c\u4e2d\u9ece\u65cf\u82d7\u65cf\u81ea\u6cbb\u53bf"},"500000":{"area_id":"500000","parent_id":"0","area_name":"\u91cd\u5e86\u5e02"},"500100":{"area_id":"500100","parent_id":"500000","area_name":"\u91cd\u5e86\u5e02\u5e02\u8f96\u533a"},"500101":{"area_id":"500101","parent_id":"500100","area_name":"\u4e07\u5dde\u533a"},"500102":{"area_id":"500102","parent_id":"500100","area_name":"\u6daa\u9675\u533a"},"500103":{"area_id":"500103","parent_id":"500100","area_name":"\u6e1d\u4e2d\u533a"},"500104":{"area_id":"500104","parent_id":"500100","area_name":"\u5927\u6e21\u53e3\u533a"},"500105":{"area_id":"500105","parent_id":"500100","area_name":"\u6c5f\u5317\u533a"},"500106":{"area_id":"500106","parent_id":"500100","area_name":"\u6c99\u576a\u575d\u533a"},"500107":{"area_id":"500107","parent_id":"500100","area_name":"\u4e5d\u9f99\u5761\u533a"},"500108":{"area_id":"500108","parent_id":"500100","area_name":"\u5357\u5cb8\u533a"},"500109":{"area_id":"500109","parent_id":"500100","area_name":"\u5317\u789a\u533a"},"500110":{"area_id":"500110","parent_id":"500100","area_name":"\u7da6\u6c5f\u533a"},"500111":{"area_id":"500111","parent_id":"500100","area_name":"\u5927\u8db3\u533a"},"500112":{"area_id":"500112","parent_id":"500100","area_name":"\u6e1d\u5317\u533a"},"500113":{"area_id":"500113","parent_id":"500100","area_name":"\u5df4\u5357\u533a"},"500114":{"area_id":"500114","parent_id":"500100","area_name":"\u9ed4\u6c5f\u533a"},"500115":{"area_id":"500115","parent_id":"500100","area_name":"\u957f\u5bff\u533a"},"500116":{"area_id":"500116","parent_id":"500100","area_name":"\u6c5f\u6d25\u533a"},"500117":{"area_id":"500117","parent_id":"500100","area_name":"\u5408\u5ddd\u533a"},"500118":{"area_id":"500118","parent_id":"500100","area_name":"\u6c38\u5ddd\u533a"},"500119":{"area_id":"500119","parent_id":"500100","area_name":"\u5357\u5ddd\u533a"},"500200":{"area_id":"500200","parent_id":"500000","area_name":"\u91cd\u5e86\u5e02\u53bf\u8f96\u533a"},"500223":{"area_id":"500223","parent_id":"500200","area_name":"\u6f7c\u5357\u53bf"},"500224":{"area_id":"500224","parent_id":"500200","area_name":"\u94dc\u6881\u53bf"},"500226":{"area_id":"500226","parent_id":"500200","area_name":"\u8363\u660c\u53bf"},"500227":{"area_id":"500227","parent_id":"500200","area_name":"\u74a7\u5c71\u53bf"},"500228":{"area_id":"500228","parent_id":"500200","area_name":"\u6881\u5e73\u53bf"},"500229":{"area_id":"500229","parent_id":"500200","area_name":"\u57ce\u53e3\u53bf"},"500230":{"area_id":"500230","parent_id":"500200","area_name":"\u4e30\u90fd\u53bf"},"500231":{"area_id":"500231","parent_id":"500200","area_name":"\u57ab\u6c5f\u53bf"},"500232":{"area_id":"500232","parent_id":"500200","area_name":"\u6b66\u9686\u53bf"},"500233":{"area_id":"500233","parent_id":"500200","area_name":"\u5fe0\u53bf"},"500234":{"area_id":"500234","parent_id":"500200","area_name":"\u5f00\u53bf"},"500235":{"area_id":"500235","parent_id":"500200","area_name":"\u4e91\u9633\u53bf"},"500236":{"area_id":"500236","parent_id":"500200","area_name":"\u5949\u8282\u53bf"},"500237":{"area_id":"500237","parent_id":"500200","area_name":"\u5deb\u5c71\u53bf"},"500238":{"area_id":"500238","parent_id":"500200","area_name":"\u5deb\u6eaa\u53bf"},"500240":{"area_id":"500240","parent_id":"500200","area_name":"\u77f3\u67f1\u571f\u5bb6\u65cf\u81ea\u6cbb\u53bf"},"500241":{"area_id":"500241","parent_id":"500200","area_name":"\u79c0\u5c71\u571f\u5bb6\u65cf\u82d7\u65cf\u81ea\u6cbb\u53bf"},"500242":{"area_id":"500242","parent_id":"500200","area_name":"\u9149\u9633\u571f\u5bb6\u65cf\u82d7\u65cf\u81ea\u6cbb\u53bf"},"500243":{"area_id":"500243","parent_id":"500200","area_name":"\u5f6d\u6c34\u82d7\u65cf\u571f\u5bb6\u65cf\u81ea\u6cbb\u53bf"},"510000":{"area_id":"510000","parent_id":"0","area_name":"\u56db\u5ddd\u7701"},"510100":{"area_id":"510100","parent_id":"510000","area_name":"\u6210\u90fd\u5e02"},"510101":{"area_id":"510101","parent_id":"510100","area_name":"\u6210\u90fd\u5e02\u5e02\u8f96\u533a"},"510104":{"area_id":"510104","parent_id":"510100","area_name":"\u9526\u6c5f\u533a"},"510105":{"area_id":"510105","parent_id":"510100","area_name":"\u9752\u7f8a\u533a"},"510106":{"area_id":"510106","parent_id":"510100","area_name":"\u91d1\u725b\u533a"},"510107":{"area_id":"510107","parent_id":"510100","area_name":"\u6b66\u4faf\u533a"},"510108":{"area_id":"510108","parent_id":"510100","area_name":"\u6210\u534e\u533a"},"510112":{"area_id":"510112","parent_id":"510100","area_name":"\u9f99\u6cc9\u9a7f\u533a"},"510113":{"area_id":"510113","parent_id":"510100","area_name":"\u9752\u767d\u6c5f\u533a"},"510114":{"area_id":"510114","parent_id":"510100","area_name":"\u65b0\u90fd\u533a"},"510115":{"area_id":"510115","parent_id":"510100","area_name":"\u6e29\u6c5f\u533a"},"510121":{"area_id":"510121","parent_id":"510100","area_name":"\u91d1\u5802\u53bf"},"510122":{"area_id":"510122","parent_id":"510100","area_name":"\u53cc\u6d41\u53bf"},"510124":{"area_id":"510124","parent_id":"510100","area_name":"\u90eb\u53bf"},"510129":{"area_id":"510129","parent_id":"510100","area_name":"\u5927\u9091\u53bf"},"510131":{"area_id":"510131","parent_id":"510100","area_name":"\u84b2\u6c5f\u53bf"},"510132":{"area_id":"510132","parent_id":"510100","area_name":"\u65b0\u6d25\u53bf"},"510181":{"area_id":"510181","parent_id":"510100","area_name":"\u90fd\u6c5f\u5830\u5e02"},"510182":{"area_id":"510182","parent_id":"510100","area_name":"\u5f6d\u5dde\u5e02"},"510183":{"area_id":"510183","parent_id":"510100","area_name":"\u909b\u5d03\u5e02"},"510184":{"area_id":"510184","parent_id":"510100","area_name":"\u5d07\u5dde\u5e02"},"510300":{"area_id":"510300","parent_id":"510000","area_name":"\u81ea\u8d21\u5e02"},"510301":{"area_id":"510301","parent_id":"510300","area_name":"\u81ea\u8d21\u5e02\u5e02\u8f96\u533a"},"510302":{"area_id":"510302","parent_id":"510300","area_name":"\u81ea\u6d41\u4e95\u533a"},"510303":{"area_id":"510303","parent_id":"510300","area_name":"\u8d21\u4e95\u533a"},"510304":{"area_id":"510304","parent_id":"510300","area_name":"\u5927\u5b89\u533a"},"510311":{"area_id":"510311","parent_id":"510300","area_name":"\u6cbf\u6ee9\u533a"},"510321":{"area_id":"510321","parent_id":"510300","area_name":"\u8363\u53bf"},"510322":{"area_id":"510322","parent_id":"510300","area_name":"\u5bcc\u987a\u53bf"},"510400":{"area_id":"510400","parent_id":"510000","area_name":"\u6500\u679d\u82b1\u5e02"},"510401":{"area_id":"510401","parent_id":"510400","area_name":"\u6500\u679d\u82b1\u5e02\u5e02\u8f96\u533a"},"510402":{"area_id":"510402","parent_id":"510400","area_name":"\u4e1c\u533a"},"510403":{"area_id":"510403","parent_id":"510400","area_name":"\u897f\u533a"},"510411":{"area_id":"510411","parent_id":"510400","area_name":"\u4ec1\u548c\u533a"},"510421":{"area_id":"510421","parent_id":"510400","area_name":"\u7c73\u6613\u53bf"},"510422":{"area_id":"510422","parent_id":"510400","area_name":"\u76d0\u8fb9\u53bf"},"510500":{"area_id":"510500","parent_id":"510000","area_name":"\u6cf8\u5dde\u5e02"},"510501":{"area_id":"510501","parent_id":"510500","area_name":"\u6cf8\u5dde\u5e02\u5e02\u8f96\u533a"},"510502":{"area_id":"510502","parent_id":"510500","area_name":"\u6c5f\u9633\u533a"},"510503":{"area_id":"510503","parent_id":"510500","area_name":"\u7eb3\u6eaa\u533a"},"510504":{"area_id":"510504","parent_id":"510500","area_name":"\u9f99\u9a6c\u6f6d\u533a"},"510521":{"area_id":"510521","parent_id":"510500","area_name":"\u6cf8\u53bf"},"510522":{"area_id":"510522","parent_id":"510500","area_name":"\u5408\u6c5f\u53bf"},"510524":{"area_id":"510524","parent_id":"510500","area_name":"\u53d9\u6c38\u53bf"},"510525":{"area_id":"510525","parent_id":"510500","area_name":"\u53e4\u853a\u53bf"},"510600":{"area_id":"510600","parent_id":"510000","area_name":"\u5fb7\u9633\u5e02"},"510601":{"area_id":"510601","parent_id":"510600","area_name":"\u5fb7\u9633\u5e02\u5e02\u8f96\u533a"},"510603":{"area_id":"510603","parent_id":"510600","area_name":"\u65cc\u9633\u533a"},"510623":{"area_id":"510623","parent_id":"510600","area_name":"\u4e2d\u6c5f\u53bf"},"510626":{"area_id":"510626","parent_id":"510600","area_name":"\u7f57\u6c5f\u53bf"},"510681":{"area_id":"510681","parent_id":"510600","area_name":"\u5e7f\u6c49\u5e02"},"510682":{"area_id":"510682","parent_id":"510600","area_name":"\u4ec0\u90a1\u5e02"},"510683":{"area_id":"510683","parent_id":"510600","area_name":"\u7ef5\u7af9\u5e02"},"510700":{"area_id":"510700","parent_id":"510000","area_name":"\u7ef5\u9633\u5e02"},"510701":{"area_id":"510701","parent_id":"510700","area_name":"\u7ef5\u9633\u5e02\u5e02\u8f96\u533a"},"510703":{"area_id":"510703","parent_id":"510700","area_name":"\u6daa\u57ce\u533a"},"510704":{"area_id":"510704","parent_id":"510700","area_name":"\u6e38\u4ed9\u533a"},"510722":{"area_id":"510722","parent_id":"510700","area_name":"\u4e09\u53f0\u53bf"},"510723":{"area_id":"510723","parent_id":"510700","area_name":"\u76d0\u4ead\u53bf"},"510724":{"area_id":"510724","parent_id":"510700","area_name":"\u5b89\u53bf"},"510725":{"area_id":"510725","parent_id":"510700","area_name":"\u6893\u6f7c\u53bf"},"510726":{"area_id":"510726","parent_id":"510700","area_name":"\u5317\u5ddd\u7f8c\u65cf\u81ea\u6cbb\u53bf"},"510727":{"area_id":"510727","parent_id":"510700","area_name":"\u5e73\u6b66\u53bf"},"510781":{"area_id":"510781","parent_id":"510700","area_name":"\u6c5f\u6cb9\u5e02"},"510800":{"area_id":"510800","parent_id":"510000","area_name":"\u5e7f\u5143\u5e02"},"510801":{"area_id":"510801","parent_id":"510800","area_name":"\u5e7f\u5143\u5e02\u5e02\u8f96\u533a"},"510802":{"area_id":"510802","parent_id":"510800","area_name":"\u5229\u5dde\u533a"},"510811":{"area_id":"510811","parent_id":"510800","area_name":"\u5143\u575d\u533a"},"510812":{"area_id":"510812","parent_id":"510800","area_name":"\u671d\u5929\u533a"},"510821":{"area_id":"510821","parent_id":"510800","area_name":"\u65fa\u82cd\u53bf"},"510822":{"area_id":"510822","parent_id":"510800","area_name":"\u9752\u5ddd\u53bf"},"510823":{"area_id":"510823","parent_id":"510800","area_name":"\u5251\u9601\u53bf"},"510824":{"area_id":"510824","parent_id":"510800","area_name":"\u82cd\u6eaa\u53bf"},"510900":{"area_id":"510900","parent_id":"510000","area_name":"\u9042\u5b81\u5e02"},"510901":{"area_id":"510901","parent_id":"510900","area_name":"\u9042\u5b81\u5e02\u5e02\u8f96\u533a"},"510903":{"area_id":"510903","parent_id":"510900","area_name":"\u8239\u5c71\u533a"},"510904":{"area_id":"510904","parent_id":"510900","area_name":"\u5b89\u5c45\u533a"},"510921":{"area_id":"510921","parent_id":"510900","area_name":"\u84ec\u6eaa\u53bf"},"510922":{"area_id":"510922","parent_id":"510900","area_name":"\u5c04\u6d2a\u53bf"},"510923":{"area_id":"510923","parent_id":"510900","area_name":"\u5927\u82f1\u53bf"},"511000":{"area_id":"511000","parent_id":"510000","area_name":"\u5185\u6c5f\u5e02"},"511001":{"area_id":"511001","parent_id":"511000","area_name":"\u5185\u6c5f\u5e02\u5e02\u8f96\u533a"},"511002":{"area_id":"511002","parent_id":"511000","area_name":"\u5e02\u4e2d\u533a"},"511011":{"area_id":"511011","parent_id":"511000","area_name":"\u4e1c\u5174\u533a"},"511024":{"area_id":"511024","parent_id":"511000","area_name":"\u5a01\u8fdc\u53bf"},"511025":{"area_id":"511025","parent_id":"511000","area_name":"\u8d44\u4e2d\u53bf"},"511028":{"area_id":"511028","parent_id":"511000","area_name":"\u9686\u660c\u53bf"},"511100":{"area_id":"511100","parent_id":"510000","area_name":"\u4e50\u5c71\u5e02"},"511101":{"area_id":"511101","parent_id":"511100","area_name":"\u4e50\u5c71\u5e02\u5e02\u8f96\u533a"},"511102":{"area_id":"511102","parent_id":"511100","area_name":"\u5e02\u4e2d\u533a"},"511111":{"area_id":"511111","parent_id":"511100","area_name":"\u6c99\u6e7e\u533a"},"511112":{"area_id":"511112","parent_id":"511100","area_name":"\u4e94\u901a\u6865\u533a"},"511113":{"area_id":"511113","parent_id":"511100","area_name":"\u91d1\u53e3\u6cb3\u533a"},"511123":{"area_id":"511123","parent_id":"511100","area_name":"\u728d\u4e3a\u53bf"},"511124":{"area_id":"511124","parent_id":"511100","area_name":"\u4e95\u7814\u53bf"},"511126":{"area_id":"511126","parent_id":"511100","area_name":"\u5939\u6c5f\u53bf"},"511129":{"area_id":"511129","parent_id":"511100","area_name":"\u6c90\u5ddd\u53bf"},"511132":{"area_id":"511132","parent_id":"511100","area_name":"\u5ce8\u8fb9\u5f5d\u65cf\u81ea\u6cbb\u53bf"},"511133":{"area_id":"511133","parent_id":"511100","area_name":"\u9a6c\u8fb9\u5f5d\u65cf\u81ea\u6cbb\u53bf"},"511181":{"area_id":"511181","parent_id":"511100","area_name":"\u5ce8\u7709\u5c71\u5e02"},"511300":{"area_id":"511300","parent_id":"510000","area_name":"\u5357\u5145\u5e02"},"511301":{"area_id":"511301","parent_id":"511300","area_name":"\u5357\u5145\u5e02\u5e02\u8f96\u533a"},"511302":{"area_id":"511302","parent_id":"511300","area_name":"\u987a\u5e86\u533a"},"511303":{"area_id":"511303","parent_id":"511300","area_name":"\u9ad8\u576a\u533a"},"511304":{"area_id":"511304","parent_id":"511300","area_name":"\u5609\u9675\u533a"},"511321":{"area_id":"511321","parent_id":"511300","area_name":"\u5357\u90e8\u53bf"},"511322":{"area_id":"511322","parent_id":"511300","area_name":"\u8425\u5c71\u53bf"},"511323":{"area_id":"511323","parent_id":"511300","area_name":"\u84ec\u5b89\u53bf"},"511324":{"area_id":"511324","parent_id":"511300","area_name":"\u4eea\u9647\u53bf"},"511325":{"area_id":"511325","parent_id":"511300","area_name":"\u897f\u5145\u53bf"},"511381":{"area_id":"511381","parent_id":"511300","area_name":"\u9606\u4e2d\u5e02"},"511400":{"area_id":"511400","parent_id":"510000","area_name":"\u7709\u5c71\u5e02"},"511401":{"area_id":"511401","parent_id":"511400","area_name":"\u7709\u5c71\u5e02\u5e02\u8f96\u533a"},"511402":{"area_id":"511402","parent_id":"511400","area_name":"\u4e1c\u5761\u533a"},"511421":{"area_id":"511421","parent_id":"511400","area_name":"\u4ec1\u5bff\u53bf"},"511422":{"area_id":"511422","parent_id":"511400","area_name":"\u5f6d\u5c71\u53bf"},"511423":{"area_id":"511423","parent_id":"511400","area_name":"\u6d2a\u96c5\u53bf"},"511424":{"area_id":"511424","parent_id":"511400","area_name":"\u4e39\u68f1\u53bf"},"511425":{"area_id":"511425","parent_id":"511400","area_name":"\u9752\u795e\u53bf"},"511500":{"area_id":"511500","parent_id":"510000","area_name":"\u5b9c\u5bbe\u5e02"},"511501":{"area_id":"511501","parent_id":"511500","area_name":"\u5b9c\u5bbe\u5e02\u5e02\u8f96\u533a"},"511502":{"area_id":"511502","parent_id":"511500","area_name":"\u7fe0\u5c4f\u533a"},"511503":{"area_id":"511503","parent_id":"511500","area_name":"\u5357\u6eaa\u533a"},"511521":{"area_id":"511521","parent_id":"511500","area_name":"\u5b9c\u5bbe\u53bf"},"511523":{"area_id":"511523","parent_id":"511500","area_name":"\u6c5f\u5b89\u53bf"},"511524":{"area_id":"511524","parent_id":"511500","area_name":"\u957f\u5b81\u53bf"},"511525":{"area_id":"511525","parent_id":"511500","area_name":"\u9ad8\u53bf"},"511526":{"area_id":"511526","parent_id":"511500","area_name":"\u73d9\u53bf"},"511527":{"area_id":"511527","parent_id":"511500","area_name":"\u7b60\u8fde\u53bf"},"511528":{"area_id":"511528","parent_id":"511500","area_name":"\u5174\u6587\u53bf"},"511529":{"area_id":"511529","parent_id":"511500","area_name":"\u5c4f\u5c71\u53bf"},"511600":{"area_id":"511600","parent_id":"510000","area_name":"\u5e7f\u5b89\u5e02"},"511601":{"area_id":"511601","parent_id":"511600","area_name":"\u5e7f\u5b89\u5e02\u5e02\u8f96\u533a"},"511602":{"area_id":"511602","parent_id":"511600","area_name":"\u5e7f\u5b89\u533a"},"511603":{"area_id":"511603","parent_id":"511600","area_name":"\u524d\u950b\u533a"},"511621":{"area_id":"511621","parent_id":"511600","area_name":"\u5cb3\u6c60\u53bf"},"511622":{"area_id":"511622","parent_id":"511600","area_name":"\u6b66\u80dc\u53bf"},"511623":{"area_id":"511623","parent_id":"511600","area_name":"\u90bb\u6c34\u53bf"},"511681":{"area_id":"511681","parent_id":"511600","area_name":"\u534e\u84e5\u5e02"},"511700":{"area_id":"511700","parent_id":"510000","area_name":"\u8fbe\u5dde\u5e02"},"511701":{"area_id":"511701","parent_id":"511700","area_name":"\u8fbe\u5dde\u5e02\u5e02\u8f96\u533a"},"511702":{"area_id":"511702","parent_id":"511700","area_name":"\u901a\u5ddd\u533a"},"511703":{"area_id":"511703","parent_id":"511700","area_name":"\u8fbe\u5ddd\u533a"},"511722":{"area_id":"511722","parent_id":"511700","area_name":"\u5ba3\u6c49\u53bf"},"511723":{"area_id":"511723","parent_id":"511700","area_name":"\u5f00\u6c5f\u53bf"},"511724":{"area_id":"511724","parent_id":"511700","area_name":"\u5927\u7af9\u53bf"},"511725":{"area_id":"511725","parent_id":"511700","area_name":"\u6e20\u53bf"},"511781":{"area_id":"511781","parent_id":"511700","area_name":"\u4e07\u6e90\u5e02"},"511800":{"area_id":"511800","parent_id":"510000","area_name":"\u96c5\u5b89\u5e02"},"511801":{"area_id":"511801","parent_id":"511800","area_name":"\u96c5\u5b89\u5e02\u5e02\u8f96\u533a"},"511802":{"area_id":"511802","parent_id":"511800","area_name":"\u96e8\u57ce\u533a"},"511803":{"area_id":"511803","parent_id":"511800","area_name":"\u540d\u5c71\u533a"},"511822":{"area_id":"511822","parent_id":"511800","area_name":"\u8365\u7ecf\u53bf"},"511823":{"area_id":"511823","parent_id":"511800","area_name":"\u6c49\u6e90\u53bf"},"511824":{"area_id":"511824","parent_id":"511800","area_name":"\u77f3\u68c9\u53bf"},"511825":{"area_id":"511825","parent_id":"511800","area_name":"\u5929\u5168\u53bf"},"511826":{"area_id":"511826","parent_id":"511800","area_name":"\u82a6\u5c71\u53bf"},"511827":{"area_id":"511827","parent_id":"511800","area_name":"\u5b9d\u5174\u53bf"},"511900":{"area_id":"511900","parent_id":"510000","area_name":"\u5df4\u4e2d\u5e02"},"511901":{"area_id":"511901","parent_id":"511900","area_name":"\u5df4\u4e2d\u5e02\u5e02\u8f96\u533a"},"511902":{"area_id":"511902","parent_id":"511900","area_name":"\u5df4\u5dde\u533a"},"511903":{"area_id":"511903","parent_id":"511900","area_name":"\u6069\u9633\u533a"},"511921":{"area_id":"511921","parent_id":"511900","area_name":"\u901a\u6c5f\u53bf"},"511922":{"area_id":"511922","parent_id":"511900","area_name":"\u5357\u6c5f\u53bf"},"511923":{"area_id":"511923","parent_id":"511900","area_name":"\u5e73\u660c\u53bf"},"512000":{"area_id":"512000","parent_id":"510000","area_name":"\u8d44\u9633\u5e02"},"512001":{"area_id":"512001","parent_id":"512000","area_name":"\u8d44\u9633\u5e02\u5e02\u8f96\u533a"},"512002":{"area_id":"512002","parent_id":"512000","area_name":"\u96c1\u6c5f\u533a"},"512021":{"area_id":"512021","parent_id":"512000","area_name":"\u5b89\u5cb3\u53bf"},"512022":{"area_id":"512022","parent_id":"512000","area_name":"\u4e50\u81f3\u53bf"},"512081":{"area_id":"512081","parent_id":"512000","area_name":"\u7b80\u9633\u5e02"},"513200":{"area_id":"513200","parent_id":"510000","area_name":"\u963f\u575d\u85cf\u65cf\u7f8c\u65cf\u81ea\u6cbb\u5dde"},"513221":{"area_id":"513221","parent_id":"513200","area_name":"\u6c76\u5ddd\u53bf"},"513222":{"area_id":"513222","parent_id":"513200","area_name":"\u7406\u53bf"},"513223":{"area_id":"513223","parent_id":"513200","area_name":"\u8302\u53bf"},"513224":{"area_id":"513224","parent_id":"513200","area_name":"\u677e\u6f58\u53bf"},"513225":{"area_id":"513225","parent_id":"513200","area_name":"\u4e5d\u5be8\u6c9f\u53bf"},"513226":{"area_id":"513226","parent_id":"513200","area_name":"\u91d1\u5ddd\u53bf"},"513227":{"area_id":"513227","parent_id":"513200","area_name":"\u5c0f\u91d1\u53bf"},"513228":{"area_id":"513228","parent_id":"513200","area_name":"\u9ed1\u6c34\u53bf"},"513229":{"area_id":"513229","parent_id":"513200","area_name":"\u9a6c\u5c14\u5eb7\u53bf"},"513230":{"area_id":"513230","parent_id":"513200","area_name":"\u58e4\u5858\u53bf"},"513231":{"area_id":"513231","parent_id":"513200","area_name":"\u963f\u575d\u53bf"},"513232":{"area_id":"513232","parent_id":"513200","area_name":"\u82e5\u5c14\u76d6\u53bf"},"513233":{"area_id":"513233","parent_id":"513200","area_name":"\u7ea2\u539f\u53bf"},"513300":{"area_id":"513300","parent_id":"510000","area_name":"\u7518\u5b5c\u85cf\u65cf\u81ea\u6cbb\u5dde"},"513321":{"area_id":"513321","parent_id":"513300","area_name":"\u5eb7\u5b9a\u53bf"},"513322":{"area_id":"513322","parent_id":"513300","area_name":"\u6cf8\u5b9a\u53bf"},"513323":{"area_id":"513323","parent_id":"513300","area_name":"\u4e39\u5df4\u53bf"},"513324":{"area_id":"513324","parent_id":"513300","area_name":"\u4e5d\u9f99\u53bf"},"513325":{"area_id":"513325","parent_id":"513300","area_name":"\u96c5\u6c5f\u53bf"},"513326":{"area_id":"513326","parent_id":"513300","area_name":"\u9053\u5b5a\u53bf"},"513327":{"area_id":"513327","parent_id":"513300","area_name":"\u7089\u970d\u53bf"},"513328":{"area_id":"513328","parent_id":"513300","area_name":"\u7518\u5b5c\u53bf"},"513329":{"area_id":"513329","parent_id":"513300","area_name":"\u65b0\u9f99\u53bf"},"513330":{"area_id":"513330","parent_id":"513300","area_name":"\u5fb7\u683c\u53bf"},"513331":{"area_id":"513331","parent_id":"513300","area_name":"\u767d\u7389\u53bf"},"513332":{"area_id":"513332","parent_id":"513300","area_name":"\u77f3\u6e20\u53bf"},"513333":{"area_id":"513333","parent_id":"513300","area_name":"\u8272\u8fbe\u53bf"},"513334":{"area_id":"513334","parent_id":"513300","area_name":"\u7406\u5858\u53bf"},"513335":{"area_id":"513335","parent_id":"513300","area_name":"\u5df4\u5858\u53bf"},"513336":{"area_id":"513336","parent_id":"513300","area_name":"\u4e61\u57ce\u53bf"},"513337":{"area_id":"513337","parent_id":"513300","area_name":"\u7a3b\u57ce\u53bf"},"513338":{"area_id":"513338","parent_id":"513300","area_name":"\u5f97\u8363\u53bf"},"513400":{"area_id":"513400","parent_id":"510000","area_name":"\u51c9\u5c71\u5f5d\u65cf\u81ea\u6cbb\u5dde"},"513401":{"area_id":"513401","parent_id":"513400","area_name":"\u897f\u660c\u5e02"},"513422":{"area_id":"513422","parent_id":"513400","area_name":"\u6728\u91cc\u85cf\u65cf\u81ea\u6cbb\u53bf"},"513423":{"area_id":"513423","parent_id":"513400","area_name":"\u76d0\u6e90\u53bf"},"513424":{"area_id":"513424","parent_id":"513400","area_name":"\u5fb7\u660c\u53bf"},"513425":{"area_id":"513425","parent_id":"513400","area_name":"\u4f1a\u7406\u53bf"},"513426":{"area_id":"513426","parent_id":"513400","area_name":"\u4f1a\u4e1c\u53bf"},"513427":{"area_id":"513427","parent_id":"513400","area_name":"\u5b81\u5357\u53bf"},"513428":{"area_id":"513428","parent_id":"513400","area_name":"\u666e\u683c\u53bf"},"513429":{"area_id":"513429","parent_id":"513400","area_name":"\u5e03\u62d6\u53bf"},"513430":{"area_id":"513430","parent_id":"513400","area_name":"\u91d1\u9633\u53bf"},"513431":{"area_id":"513431","parent_id":"513400","area_name":"\u662d\u89c9\u53bf"},"513432":{"area_id":"513432","parent_id":"513400","area_name":"\u559c\u5fb7\u53bf"},"513433":{"area_id":"513433","parent_id":"513400","area_name":"\u5195\u5b81\u53bf"},"513434":{"area_id":"513434","parent_id":"513400","area_name":"\u8d8a\u897f\u53bf"},"513435":{"area_id":"513435","parent_id":"513400","area_name":"\u7518\u6d1b\u53bf"},"513436":{"area_id":"513436","parent_id":"513400","area_name":"\u7f8e\u59d1\u53bf"},"513437":{"area_id":"513437","parent_id":"513400","area_name":"\u96f7\u6ce2\u53bf"},"520000":{"area_id":"520000","parent_id":"0","area_name":"\u8d35\u5dde\u7701"},"520100":{"area_id":"520100","parent_id":"520000","area_name":"\u8d35\u9633\u5e02"},"520101":{"area_id":"520101","parent_id":"520100","area_name":"\u8d35\u9633\u5e02\u5e02\u8f96\u533a"},"520102":{"area_id":"520102","parent_id":"520100","area_name":"\u5357\u660e\u533a"},"520103":{"area_id":"520103","parent_id":"520100","area_name":"\u4e91\u5ca9\u533a"},"520111":{"area_id":"520111","parent_id":"520100","area_name":"\u82b1\u6eaa\u533a"},"520112":{"area_id":"520112","parent_id":"520100","area_name":"\u4e4c\u5f53\u533a"},"520113":{"area_id":"520113","parent_id":"520100","area_name":"\u767d\u4e91\u533a"},"520115":{"area_id":"520115","parent_id":"520100","area_name":"\u89c2\u5c71\u6e56\u533a"},"520121":{"area_id":"520121","parent_id":"520100","area_name":"\u5f00\u9633\u53bf"},"520122":{"area_id":"520122","parent_id":"520100","area_name":"\u606f\u70fd\u53bf"},"520123":{"area_id":"520123","parent_id":"520100","area_name":"\u4fee\u6587\u53bf"},"520181":{"area_id":"520181","parent_id":"520100","area_name":"\u6e05\u9547\u5e02"},"520200":{"area_id":"520200","parent_id":"520000","area_name":"\u516d\u76d8\u6c34\u5e02"},"520201":{"area_id":"520201","parent_id":"520200","area_name":"\u949f\u5c71\u533a"},"520203":{"area_id":"520203","parent_id":"520200","area_name":"\u516d\u679d\u7279\u533a"},"520221":{"area_id":"520221","parent_id":"520200","area_name":"\u6c34\u57ce\u53bf"},"520222":{"area_id":"520222","parent_id":"520200","area_name":"\u76d8\u53bf"},"520300":{"area_id":"520300","parent_id":"520000","area_name":"\u9075\u4e49\u5e02"},"520301":{"area_id":"520301","parent_id":"520300","area_name":"\u9075\u4e49\u5e02\u5e02\u8f96\u533a"},"520302":{"area_id":"520302","parent_id":"520300","area_name":"\u7ea2\u82b1\u5c97\u533a"},"520303":{"area_id":"520303","parent_id":"520300","area_name":"\u6c47\u5ddd\u533a"},"520321":{"area_id":"520321","parent_id":"520300","area_name":"\u9075\u4e49\u53bf"},"520322":{"area_id":"520322","parent_id":"520300","area_name":"\u6850\u6893\u53bf"},"520323":{"area_id":"520323","parent_id":"520300","area_name":"\u7ee5\u9633\u53bf"},"520324":{"area_id":"520324","parent_id":"520300","area_name":"\u6b63\u5b89\u53bf"},"520325":{"area_id":"520325","parent_id":"520300","area_name":"\u9053\u771f\u4ee1\u4f6c\u65cf\u82d7\u65cf\u81ea\u6cbb\u53bf"},"520326":{"area_id":"520326","parent_id":"520300","area_name":"\u52a1\u5ddd\u4ee1\u4f6c\u65cf\u82d7\u65cf\u81ea\u6cbb\u53bf"},"520327":{"area_id":"520327","parent_id":"520300","area_name":"\u51e4\u5188\u53bf"},"520328":{"area_id":"520328","parent_id":"520300","area_name":"\u6e44\u6f6d\u53bf"},"520329":{"area_id":"520329","parent_id":"520300","area_name":"\u4f59\u5e86\u53bf"},"520330":{"area_id":"520330","parent_id":"520300","area_name":"\u4e60\u6c34\u53bf"},"520381":{"area_id":"520381","parent_id":"520300","area_name":"\u8d64\u6c34\u5e02"},"520382":{"area_id":"520382","parent_id":"520300","area_name":"\u4ec1\u6000\u5e02"},"520400":{"area_id":"520400","parent_id":"520000","area_name":"\u5b89\u987a\u5e02"},"520401":{"area_id":"520401","parent_id":"520400","area_name":"\u5b89\u987a\u5e02\u5e02\u8f96\u533a"},"520402":{"area_id":"520402","parent_id":"520400","area_name":"\u897f\u79c0\u533a"},"520421":{"area_id":"520421","parent_id":"520400","area_name":"\u5e73\u575d\u53bf"},"520422":{"area_id":"520422","parent_id":"520400","area_name":"\u666e\u5b9a\u53bf"},"520423":{"area_id":"520423","parent_id":"520400","area_name":"\u9547\u5b81\u5e03\u4f9d\u65cf\u82d7\u65cf\u81ea\u6cbb\u53bf"},"520424":{"area_id":"520424","parent_id":"520400","area_name":"\u5173\u5cad\u5e03\u4f9d\u65cf\u82d7\u65cf\u81ea\u6cbb\u53bf"},"520425":{"area_id":"520425","parent_id":"520400","area_name":"\u7d2b\u4e91\u82d7\u65cf\u5e03\u4f9d\u65cf\u81ea\u6cbb\u53bf"},"520500":{"area_id":"520500","parent_id":"520000","area_name":"\u6bd5\u8282\u5e02"},"520501":{"area_id":"520501","parent_id":"520500","area_name":"\u6bd5\u8282\u5e02\u5e02\u8f96\u533a"},"520502":{"area_id":"520502","parent_id":"520500","area_name":"\u4e03\u661f\u5173\u533a"},"520521":{"area_id":"520521","parent_id":"520500","area_name":"\u5927\u65b9\u53bf"},"520522":{"area_id":"520522","parent_id":"520500","area_name":"\u9ed4\u897f\u53bf"},"520523":{"area_id":"520523","parent_id":"520500","area_name":"\u91d1\u6c99\u53bf"},"520524":{"area_id":"520524","parent_id":"520500","area_name":"\u7ec7\u91d1\u53bf"},"520525":{"area_id":"520525","parent_id":"520500","area_name":"\u7eb3\u96cd\u53bf"},"520526":{"area_id":"520526","parent_id":"520500","area_name":"\u5a01\u5b81\u5f5d\u65cf\u56de\u65cf\u82d7\u65cf\u81ea\u6cbb\u53bf"},"520527":{"area_id":"520527","parent_id":"520500","area_name":"\u8d6b\u7ae0\u53bf"},"520600":{"area_id":"520600","parent_id":"520000","area_name":"\u94dc\u4ec1\u5e02"},"520601":{"area_id":"520601","parent_id":"520600","area_name":"\u94dc\u4ec1\u5e02\u5e02\u8f96\u533a"},"520602":{"area_id":"520602","parent_id":"520600","area_name":"\u78a7\u6c5f\u533a"},"520603":{"area_id":"520603","parent_id":"520600","area_name":"\u4e07\u5c71\u533a"},"520621":{"area_id":"520621","parent_id":"520600","area_name":"\u6c5f\u53e3\u53bf"},"520622":{"area_id":"520622","parent_id":"520600","area_name":"\u7389\u5c4f\u4f97\u65cf\u81ea\u6cbb\u53bf"},"520623":{"area_id":"520623","parent_id":"520600","area_name":"\u77f3\u9621\u53bf"},"520624":{"area_id":"520624","parent_id":"520600","area_name":"\u601d\u5357\u53bf"},"520625":{"area_id":"520625","parent_id":"520600","area_name":"\u5370\u6c5f\u571f\u5bb6\u65cf\u82d7\u65cf\u81ea\u6cbb\u53bf"},"520626":{"area_id":"520626","parent_id":"520600","area_name":"\u5fb7\u6c5f\u53bf"},"520627":{"area_id":"520627","parent_id":"520600","area_name":"\u6cbf\u6cb3\u571f\u5bb6\u65cf\u81ea\u6cbb\u53bf"},"520628":{"area_id":"520628","parent_id":"520600","area_name":"\u677e\u6843\u82d7\u65cf\u81ea\u6cbb\u53bf"},"522300":{"area_id":"522300","parent_id":"520000","area_name":"\u9ed4\u897f\u5357\u5e03\u4f9d\u65cf\u82d7\u65cf\u81ea\u6cbb\u5dde"},"522301":{"area_id":"522301","parent_id":"522300","area_name":"\u5174\u4e49\u5e02"},"522322":{"area_id":"522322","parent_id":"522300","area_name":"\u5174\u4ec1\u53bf"},"522323":{"area_id":"522323","parent_id":"522300","area_name":"\u666e\u5b89\u53bf"},"522324":{"area_id":"522324","parent_id":"522300","area_name":"\u6674\u9686\u53bf"},"522325":{"area_id":"522325","parent_id":"522300","area_name":"\u8d1e\u4e30\u53bf"},"522326":{"area_id":"522326","parent_id":"522300","area_name":"\u671b\u8c1f\u53bf"},"522327":{"area_id":"522327","parent_id":"522300","area_name":"\u518c\u4ea8\u53bf"},"522328":{"area_id":"522328","parent_id":"522300","area_name":"\u5b89\u9f99\u53bf"},"522600":{"area_id":"522600","parent_id":"520000","area_name":"\u9ed4\u4e1c\u5357\u82d7\u65cf\u4f97\u65cf\u81ea\u6cbb\u5dde"},"522601":{"area_id":"522601","parent_id":"522600","area_name":"\u51ef\u91cc\u5e02"},"522622":{"area_id":"522622","parent_id":"522600","area_name":"\u9ec4\u5e73\u53bf"},"522623":{"area_id":"522623","parent_id":"522600","area_name":"\u65bd\u79c9\u53bf"},"522624":{"area_id":"522624","parent_id":"522600","area_name":"\u4e09\u7a57\u53bf"},"522625":{"area_id":"522625","parent_id":"522600","area_name":"\u9547\u8fdc\u53bf"},"522626":{"area_id":"522626","parent_id":"522600","area_name":"\u5c91\u5de9\u53bf"},"522627":{"area_id":"522627","parent_id":"522600","area_name":"\u5929\u67f1\u53bf"},"522628":{"area_id":"522628","parent_id":"522600","area_name":"\u9526\u5c4f\u53bf"},"522629":{"area_id":"522629","parent_id":"522600","area_name":"\u5251\u6cb3\u53bf"},"522630":{"area_id":"522630","parent_id":"522600","area_name":"\u53f0\u6c5f\u53bf"},"522631":{"area_id":"522631","parent_id":"522600","area_name":"\u9ece\u5e73\u53bf"},"522632":{"area_id":"522632","parent_id":"522600","area_name":"\u6995\u6c5f\u53bf"},"522633":{"area_id":"522633","parent_id":"522600","area_name":"\u4ece\u6c5f\u53bf"},"522634":{"area_id":"522634","parent_id":"522600","area_name":"\u96f7\u5c71\u53bf"},"522635":{"area_id":"522635","parent_id":"522600","area_name":"\u9ebb\u6c5f\u53bf"},"522636":{"area_id":"522636","parent_id":"522600","area_name":"\u4e39\u5be8\u53bf"},"522700":{"area_id":"522700","parent_id":"520000","area_name":"\u9ed4\u5357\u5e03\u4f9d\u65cf\u82d7\u65cf\u81ea\u6cbb\u5dde"},"522701":{"area_id":"522701","parent_id":"522700","area_name":"\u90fd\u5300\u5e02"},"522702":{"area_id":"522702","parent_id":"522700","area_name":"\u798f\u6cc9\u5e02"},"522722":{"area_id":"522722","parent_id":"522700","area_name":"\u8354\u6ce2\u53bf"},"522723":{"area_id":"522723","parent_id":"522700","area_name":"\u8d35\u5b9a\u53bf"},"522725":{"area_id":"522725","parent_id":"522700","area_name":"\u74ee\u5b89\u53bf"},"522726":{"area_id":"522726","parent_id":"522700","area_name":"\u72ec\u5c71\u53bf"},"522727":{"area_id":"522727","parent_id":"522700","area_name":"\u5e73\u5858\u53bf"},"522728":{"area_id":"522728","parent_id":"522700","area_name":"\u7f57\u7538\u53bf"},"522729":{"area_id":"522729","parent_id":"522700","area_name":"\u957f\u987a\u53bf"},"522730":{"area_id":"522730","parent_id":"522700","area_name":"\u9f99\u91cc\u53bf"},"522731":{"area_id":"522731","parent_id":"522700","area_name":"\u60e0\u6c34\u53bf"},"522732":{"area_id":"522732","parent_id":"522700","area_name":"\u4e09\u90fd\u6c34\u65cf\u81ea\u6cbb\u53bf"},"530000":{"area_id":"530000","parent_id":"0","area_name":"\u4e91\u5357\u7701"},"530100":{"area_id":"530100","parent_id":"530000","area_name":"\u6606\u660e\u5e02"},"530101":{"area_id":"530101","parent_id":"530100","area_name":"\u6606\u660e\u5e02\u5e02\u8f96\u533a"},"530102":{"area_id":"530102","parent_id":"530100","area_name":"\u4e94\u534e\u533a"},"530103":{"area_id":"530103","parent_id":"530100","area_name":"\u76d8\u9f99\u533a"},"530111":{"area_id":"530111","parent_id":"530100","area_name":"\u5b98\u6e21\u533a"},"530112":{"area_id":"530112","parent_id":"530100","area_name":"\u897f\u5c71\u533a"},"530113":{"area_id":"530113","parent_id":"530100","area_name":"\u4e1c\u5ddd\u533a"},"530114":{"area_id":"530114","parent_id":"530100","area_name":"\u5448\u8d21\u533a"},"530122":{"area_id":"530122","parent_id":"530100","area_name":"\u664b\u5b81\u53bf"},"530124":{"area_id":"530124","parent_id":"530100","area_name":"\u5bcc\u6c11\u53bf"},"530125":{"area_id":"530125","parent_id":"530100","area_name":"\u5b9c\u826f\u53bf"},"530126":{"area_id":"530126","parent_id":"530100","area_name":"\u77f3\u6797\u5f5d\u65cf\u81ea\u6cbb\u53bf"},"530127":{"area_id":"530127","parent_id":"530100","area_name":"\u5d69\u660e\u53bf"},"530128":{"area_id":"530128","parent_id":"530100","area_name":"\u7984\u529d\u5f5d\u65cf\u82d7\u65cf\u81ea\u6cbb\u53bf"},"530129":{"area_id":"530129","parent_id":"530100","area_name":"\u5bfb\u7538\u56de\u65cf\u5f5d\u65cf\u81ea\u6cbb\u53bf"},"530181":{"area_id":"530181","parent_id":"530100","area_name":"\u5b89\u5b81\u5e02"},"530300":{"area_id":"530300","parent_id":"530000","area_name":"\u66f2\u9756\u5e02"},"530301":{"area_id":"530301","parent_id":"530300","area_name":"\u66f2\u9756\u5e02\u5e02\u8f96\u533a"},"530302":{"area_id":"530302","parent_id":"530300","area_name":"\u9e92\u9e9f\u533a"},"530321":{"area_id":"530321","parent_id":"530300","area_name":"\u9a6c\u9f99\u53bf"},"530322":{"area_id":"530322","parent_id":"530300","area_name":"\u9646\u826f\u53bf"},"530323":{"area_id":"530323","parent_id":"530300","area_name":"\u5e08\u5b97\u53bf"},"530324":{"area_id":"530324","parent_id":"530300","area_name":"\u7f57\u5e73\u53bf"},"530325":{"area_id":"530325","parent_id":"530300","area_name":"\u5bcc\u6e90\u53bf"},"530326":{"area_id":"530326","parent_id":"530300","area_name":"\u4f1a\u6cfd\u53bf"},"530328":{"area_id":"530328","parent_id":"530300","area_name":"\u6cbe\u76ca\u53bf"},"530381":{"area_id":"530381","parent_id":"530300","area_name":"\u5ba3\u5a01\u5e02"},"530400":{"area_id":"530400","parent_id":"530000","area_name":"\u7389\u6eaa\u5e02"},"530401":{"area_id":"530401","parent_id":"530400","area_name":"\u7389\u6eaa\u5e02\u5e02\u8f96\u533a"},"530402":{"area_id":"530402","parent_id":"530400","area_name":"\u7ea2\u5854\u533a"},"530421":{"area_id":"530421","parent_id":"530400","area_name":"\u6c5f\u5ddd\u53bf"},"530422":{"area_id":"530422","parent_id":"530400","area_name":"\u6f84\u6c5f\u53bf"},"530423":{"area_id":"530423","parent_id":"530400","area_name":"\u901a\u6d77\u53bf"},"530424":{"area_id":"530424","parent_id":"530400","area_name":"\u534e\u5b81\u53bf"},"530425":{"area_id":"530425","parent_id":"530400","area_name":"\u6613\u95e8\u53bf"},"530426":{"area_id":"530426","parent_id":"530400","area_name":"\u5ce8\u5c71\u5f5d\u65cf\u81ea\u6cbb\u53bf"},"530427":{"area_id":"530427","parent_id":"530400","area_name":"\u65b0\u5e73\u5f5d\u65cf\u50a3\u65cf\u81ea\u6cbb\u53bf"},"530428":{"area_id":"530428","parent_id":"530400","area_name":"\u5143\u6c5f\u54c8\u5c3c\u65cf\u5f5d\u65cf\u50a3\u65cf\u81ea\u6cbb\u53bf"},"530500":{"area_id":"530500","parent_id":"530000","area_name":"\u4fdd\u5c71\u5e02"},"530501":{"area_id":"530501","parent_id":"530500","area_name":"\u4fdd\u5c71\u5e02\u5e02\u8f96\u533a"},"530502":{"area_id":"530502","parent_id":"530500","area_name":"\u9686\u9633\u533a"},"530521":{"area_id":"530521","parent_id":"530500","area_name":"\u65bd\u7538\u53bf"},"530522":{"area_id":"530522","parent_id":"530500","area_name":"\u817e\u51b2\u53bf"},"530523":{"area_id":"530523","parent_id":"530500","area_name":"\u9f99\u9675\u53bf"},"530524":{"area_id":"530524","parent_id":"530500","area_name":"\u660c\u5b81\u53bf"},"530600":{"area_id":"530600","parent_id":"530000","area_name":"\u662d\u901a\u5e02"},"530601":{"area_id":"530601","parent_id":"530600","area_name":"\u662d\u901a\u5e02\u5e02\u8f96\u533a"},"530602":{"area_id":"530602","parent_id":"530600","area_name":"\u662d\u9633\u533a"},"530621":{"area_id":"530621","parent_id":"530600","area_name":"\u9c81\u7538\u53bf"},"530622":{"area_id":"530622","parent_id":"530600","area_name":"\u5de7\u5bb6\u53bf"},"530623":{"area_id":"530623","parent_id":"530600","area_name":"\u76d0\u6d25\u53bf"},"530624":{"area_id":"530624","parent_id":"530600","area_name":"\u5927\u5173\u53bf"},"530625":{"area_id":"530625","parent_id":"530600","area_name":"\u6c38\u5584\u53bf"},"530626":{"area_id":"530626","parent_id":"530600","area_name":"\u7ee5\u6c5f\u53bf"},"530627":{"area_id":"530627","parent_id":"530600","area_name":"\u9547\u96c4\u53bf"},"530628":{"area_id":"530628","parent_id":"530600","area_name":"\u5f5d\u826f\u53bf"},"530629":{"area_id":"530629","parent_id":"530600","area_name":"\u5a01\u4fe1\u53bf"},"530630":{"area_id":"530630","parent_id":"530600","area_name":"\u6c34\u5bcc\u53bf"},"530700":{"area_id":"530700","parent_id":"530000","area_name":"\u4e3d\u6c5f\u5e02"},"530701":{"area_id":"530701","parent_id":"530700","area_name":"\u4e3d\u6c5f\u5e02\u5e02\u8f96\u533a"},"530702":{"area_id":"530702","parent_id":"530700","area_name":"\u53e4\u57ce\u533a"},"530721":{"area_id":"530721","parent_id":"530700","area_name":"\u7389\u9f99\u7eb3\u897f\u65cf\u81ea\u6cbb\u53bf"},"530722":{"area_id":"530722","parent_id":"530700","area_name":"\u6c38\u80dc\u53bf"},"530723":{"area_id":"530723","parent_id":"530700","area_name":"\u534e\u576a\u53bf"},"530724":{"area_id":"530724","parent_id":"530700","area_name":"\u5b81\u8497\u5f5d\u65cf\u81ea\u6cbb\u53bf"},"530800":{"area_id":"530800","parent_id":"530000","area_name":"\u666e\u6d31\u5e02"},"530801":{"area_id":"530801","parent_id":"530800","area_name":"\u666e\u6d31\u5e02\u5e02\u8f96\u533a"},"530802":{"area_id":"530802","parent_id":"530800","area_name":"\u601d\u8305\u533a"},"530821":{"area_id":"530821","parent_id":"530800","area_name":"\u5b81\u6d31\u54c8\u5c3c\u65cf\u5f5d\u65cf\u81ea\u6cbb\u53bf"},"530822":{"area_id":"530822","parent_id":"530800","area_name":"\u58a8\u6c5f\u54c8\u5c3c\u65cf\u81ea\u6cbb\u53bf"},"530823":{"area_id":"530823","parent_id":"530800","area_name":"\u666f\u4e1c\u5f5d\u65cf\u81ea\u6cbb\u53bf"},"530824":{"area_id":"530824","parent_id":"530800","area_name":"\u666f\u8c37\u50a3\u65cf\u5f5d\u65cf\u81ea\u6cbb\u53bf"},"530825":{"area_id":"530825","parent_id":"530800","area_name":"\u9547\u6c85\u5f5d\u65cf\u54c8\u5c3c\u65cf\u62c9\u795c\u65cf\u81ea\u6cbb\u53bf"},"530826":{"area_id":"530826","parent_id":"530800","area_name":"\u6c5f\u57ce\u54c8\u5c3c\u65cf\u5f5d\u65cf\u81ea\u6cbb\u53bf"},"530827":{"area_id":"530827","parent_id":"530800","area_name":"\u5b5f\u8fde\u50a3\u65cf\u62c9\u795c\u65cf\u4f64\u65cf\u81ea\u6cbb\u53bf"},"530828":{"area_id":"530828","parent_id":"530800","area_name":"\u6f9c\u6ca7\u62c9\u795c\u65cf\u81ea\u6cbb\u53bf"},"530829":{"area_id":"530829","parent_id":"530800","area_name":"\u897f\u76df\u4f64\u65cf\u81ea\u6cbb\u53bf"},"530900":{"area_id":"530900","parent_id":"530000","area_name":"\u4e34\u6ca7\u5e02"},"530901":{"area_id":"530901","parent_id":"530900","area_name":"\u4e34\u6ca7\u5e02\u5e02\u8f96\u533a"},"530902":{"area_id":"530902","parent_id":"530900","area_name":"\u4e34\u7fd4\u533a"},"530921":{"area_id":"530921","parent_id":"530900","area_name":"\u51e4\u5e86\u53bf"},"530922":{"area_id":"530922","parent_id":"530900","area_name":"\u4e91\u53bf"},"530923":{"area_id":"530923","parent_id":"530900","area_name":"\u6c38\u5fb7\u53bf"},"530924":{"area_id":"530924","parent_id":"530900","area_name":"\u9547\u5eb7\u53bf"},"530925":{"area_id":"530925","parent_id":"530900","area_name":"\u53cc\u6c5f\u62c9\u795c\u65cf\u4f64\u65cf\u5e03\u6717\u65cf\u50a3\u65cf\u81ea\u6cbb\u53bf"},"530926":{"area_id":"530926","parent_id":"530900","area_name":"\u803f\u9a6c\u50a3\u65cf\u4f64\u65cf\u81ea\u6cbb\u53bf"},"530927":{"area_id":"530927","parent_id":"530900","area_name":"\u6ca7\u6e90\u4f64\u65cf\u81ea\u6cbb\u53bf"},"532300":{"area_id":"532300","parent_id":"530000","area_name":"\u695a\u96c4\u5f5d\u65cf\u81ea\u6cbb\u5dde"},"532301":{"area_id":"532301","parent_id":"532300","area_name":"\u695a\u96c4\u5e02"},"532322":{"area_id":"532322","parent_id":"532300","area_name":"\u53cc\u67cf\u53bf"},"532323":{"area_id":"532323","parent_id":"532300","area_name":"\u725f\u5b9a\u53bf"},"532324":{"area_id":"532324","parent_id":"532300","area_name":"\u5357\u534e\u53bf"},"532325":{"area_id":"532325","parent_id":"532300","area_name":"\u59da\u5b89\u53bf"},"532326":{"area_id":"532326","parent_id":"532300","area_name":"\u5927\u59da\u53bf"},"532327":{"area_id":"532327","parent_id":"532300","area_name":"\u6c38\u4ec1\u53bf"},"532328":{"area_id":"532328","parent_id":"532300","area_name":"\u5143\u8c0b\u53bf"},"532329":{"area_id":"532329","parent_id":"532300","area_name":"\u6b66\u5b9a\u53bf"},"532331":{"area_id":"532331","parent_id":"532300","area_name":"\u7984\u4e30\u53bf"},"532500":{"area_id":"532500","parent_id":"530000","area_name":"\u7ea2\u6cb3\u54c8\u5c3c\u65cf\u5f5d\u65cf\u81ea\u6cbb\u5dde"},"532501":{"area_id":"532501","parent_id":"532500","area_name":"\u4e2a\u65e7\u5e02"},"532502":{"area_id":"532502","parent_id":"532500","area_name":"\u5f00\u8fdc\u5e02"},"532503":{"area_id":"532503","parent_id":"532500","area_name":"\u8499\u81ea\u5e02"},"532504":{"area_id":"532504","parent_id":"532500","area_name":"\u5f25\u52d2\u5e02"},"532523":{"area_id":"532523","parent_id":"532500","area_name":"\u5c4f\u8fb9\u82d7\u65cf\u81ea\u6cbb\u53bf"},"532524":{"area_id":"532524","parent_id":"532500","area_name":"\u5efa\u6c34\u53bf"},"532525":{"area_id":"532525","parent_id":"532500","area_name":"\u77f3\u5c4f\u53bf"},"532527":{"area_id":"532527","parent_id":"532500","area_name":"\u6cf8\u897f\u53bf"},"532528":{"area_id":"532528","parent_id":"532500","area_name":"\u5143\u9633\u53bf"},"532529":{"area_id":"532529","parent_id":"532500","area_name":"\u7ea2\u6cb3\u53bf"},"532530":{"area_id":"532530","parent_id":"532500","area_name":"\u91d1\u5e73\u82d7\u65cf\u7476\u65cf\u50a3\u65cf\u81ea\u6cbb\u53bf"},"532531":{"area_id":"532531","parent_id":"532500","area_name":"\u7eff\u6625\u53bf"},"532532":{"area_id":"532532","parent_id":"532500","area_name":"\u6cb3\u53e3\u7476\u65cf\u81ea\u6cbb\u53bf"},"532600":{"area_id":"532600","parent_id":"530000","area_name":"\u6587\u5c71\u58ee\u65cf\u82d7\u65cf\u81ea\u6cbb\u5dde"},"532601":{"area_id":"532601","parent_id":"532600","area_name":"\u6587\u5c71\u5e02"},"532622":{"area_id":"532622","parent_id":"532600","area_name":"\u781a\u5c71\u53bf"},"532623":{"area_id":"532623","parent_id":"532600","area_name":"\u897f\u7574\u53bf"},"532624":{"area_id":"532624","parent_id":"532600","area_name":"\u9ebb\u6817\u5761\u53bf"},"532625":{"area_id":"532625","parent_id":"532600","area_name":"\u9a6c\u5173\u53bf"},"532626":{"area_id":"532626","parent_id":"532600","area_name":"\u4e18\u5317\u53bf"},"532627":{"area_id":"532627","parent_id":"532600","area_name":"\u5e7f\u5357\u53bf"},"532628":{"area_id":"532628","parent_id":"532600","area_name":"\u5bcc\u5b81\u53bf"},"532800":{"area_id":"532800","parent_id":"530000","area_name":"\u897f\u53cc\u7248\u7eb3\u50a3\u65cf\u81ea\u6cbb\u5dde"},"532801":{"area_id":"532801","parent_id":"532800","area_name":"\u666f\u6d2a\u5e02"},"532822":{"area_id":"532822","parent_id":"532800","area_name":"\u52d0\u6d77\u53bf"},"532823":{"area_id":"532823","parent_id":"532800","area_name":"\u52d0\u814a\u53bf"},"532900":{"area_id":"532900","parent_id":"530000","area_name":"\u5927\u7406\u767d\u65cf\u81ea\u6cbb\u5dde"},"532901":{"area_id":"532901","parent_id":"532900","area_name":"\u5927\u7406\u5e02"},"532922":{"area_id":"532922","parent_id":"532900","area_name":"\u6f3e\u6fde\u5f5d\u65cf\u81ea\u6cbb\u53bf"},"532923":{"area_id":"532923","parent_id":"532900","area_name":"\u7965\u4e91\u53bf"},"532924":{"area_id":"532924","parent_id":"532900","area_name":"\u5bbe\u5ddd\u53bf"},"532925":{"area_id":"532925","parent_id":"532900","area_name":"\u5f25\u6e21\u53bf"},"532926":{"area_id":"532926","parent_id":"532900","area_name":"\u5357\u6da7\u5f5d\u65cf\u81ea\u6cbb\u53bf"},"532927":{"area_id":"532927","parent_id":"532900","area_name":"\u5dcd\u5c71\u5f5d\u65cf\u56de\u65cf\u81ea\u6cbb\u53bf"},"532928":{"area_id":"532928","parent_id":"532900","area_name":"\u6c38\u5e73\u53bf"},"532929":{"area_id":"532929","parent_id":"532900","area_name":"\u4e91\u9f99\u53bf"},"532930":{"area_id":"532930","parent_id":"532900","area_name":"\u6d31\u6e90\u53bf"},"532931":{"area_id":"532931","parent_id":"532900","area_name":"\u5251\u5ddd\u53bf"},"532932":{"area_id":"532932","parent_id":"532900","area_name":"\u9e64\u5e86\u53bf"},"533100":{"area_id":"533100","parent_id":"530000","area_name":"\u5fb7\u5b8f\u50a3\u65cf\u666f\u9887\u65cf\u81ea\u6cbb\u5dde"},"533102":{"area_id":"533102","parent_id":"533100","area_name":"\u745e\u4e3d\u5e02"},"533103":{"area_id":"533103","parent_id":"533100","area_name":"\u8292\u5e02"},"533122":{"area_id":"533122","parent_id":"533100","area_name":"\u6881\u6cb3\u53bf"},"533123":{"area_id":"533123","parent_id":"533100","area_name":"\u76c8\u6c5f\u53bf"},"533124":{"area_id":"533124","parent_id":"533100","area_name":"\u9647\u5ddd\u53bf"},"533300":{"area_id":"533300","parent_id":"530000","area_name":"\u6012\u6c5f\u5088\u50f3\u65cf\u81ea\u6cbb\u5dde"},"533321":{"area_id":"533321","parent_id":"533300","area_name":"\u6cf8\u6c34\u53bf"},"533323":{"area_id":"533323","parent_id":"533300","area_name":"\u798f\u8d21\u53bf"},"533324":{"area_id":"533324","parent_id":"533300","area_name":"\u8d21\u5c71\u72ec\u9f99\u65cf\u6012\u65cf\u81ea\u6cbb\u53bf"},"533325":{"area_id":"533325","parent_id":"533300","area_name":"\u5170\u576a\u767d\u65cf\u666e\u7c73\u65cf\u81ea\u6cbb\u53bf"},"533400":{"area_id":"533400","parent_id":"530000","area_name":"\u8fea\u5e86\u85cf\u65cf\u81ea\u6cbb\u5dde"},"533421":{"area_id":"533421","parent_id":"533400","area_name":"\u9999\u683c\u91cc\u62c9\u53bf"},"533422":{"area_id":"533422","parent_id":"533400","area_name":"\u5fb7\u94a6\u53bf"},"533423":{"area_id":"533423","parent_id":"533400","area_name":"\u7ef4\u897f\u5088\u50f3\u65cf\u81ea\u6cbb\u53bf"},"540000":{"area_id":"540000","parent_id":"0","area_name":"\u897f\u85cf\u81ea\u6cbb\u533a"},"540100":{"area_id":"540100","parent_id":"540000","area_name":"\u62c9\u8428\u5e02"},"540101":{"area_id":"540101","parent_id":"540100","area_name":"\u62c9\u8428\u5e02\u5e02\u8f96\u533a"},"540102":{"area_id":"540102","parent_id":"540100","area_name":"\u57ce\u5173\u533a"},"540121":{"area_id":"540121","parent_id":"540100","area_name":"\u6797\u5468\u53bf"},"540122":{"area_id":"540122","parent_id":"540100","area_name":"\u5f53\u96c4\u53bf"},"540123":{"area_id":"540123","parent_id":"540100","area_name":"\u5c3c\u6728\u53bf"},"540124":{"area_id":"540124","parent_id":"540100","area_name":"\u66f2\u6c34\u53bf"},"540125":{"area_id":"540125","parent_id":"540100","area_name":"\u5806\u9f99\u5fb7\u5e86\u53bf"},"540126":{"area_id":"540126","parent_id":"540100","area_name":"\u8fbe\u5b5c\u53bf"},"540127":{"area_id":"540127","parent_id":"540100","area_name":"\u58a8\u7af9\u5de5\u5361\u53bf"},"542100":{"area_id":"542100","parent_id":"540000","area_name":"\u660c\u90fd\u5730\u533a"},"542121":{"area_id":"542121","parent_id":"542100","area_name":"\u660c\u90fd\u53bf"},"542122":{"area_id":"542122","parent_id":"542100","area_name":"\u6c5f\u8fbe\u53bf"},"542123":{"area_id":"542123","parent_id":"542100","area_name":"\u8d21\u89c9\u53bf"},"542124":{"area_id":"542124","parent_id":"542100","area_name":"\u7c7b\u4e4c\u9f50\u53bf"},"542125":{"area_id":"542125","parent_id":"542100","area_name":"\u4e01\u9752\u53bf"},"542126":{"area_id":"542126","parent_id":"542100","area_name":"\u5bdf\u96c5\u53bf"},"542127":{"area_id":"542127","parent_id":"542100","area_name":"\u516b\u5bbf\u53bf"},"542128":{"area_id":"542128","parent_id":"542100","area_name":"\u5de6\u8d21\u53bf"},"542129":{"area_id":"542129","parent_id":"542100","area_name":"\u8292\u5eb7\u53bf"},"542132":{"area_id":"542132","parent_id":"542100","area_name":"\u6d1b\u9686\u53bf"},"542133":{"area_id":"542133","parent_id":"542100","area_name":"\u8fb9\u575d\u53bf"},"542200":{"area_id":"542200","parent_id":"540000","area_name":"\u5c71\u5357\u5730\u533a"},"542221":{"area_id":"542221","parent_id":"542200","area_name":"\u4e43\u4e1c\u53bf"},"542222":{"area_id":"542222","parent_id":"542200","area_name":"\u624e\u56ca\u53bf"},"542223":{"area_id":"542223","parent_id":"542200","area_name":"\u8d21\u560e\u53bf"},"542224":{"area_id":"542224","parent_id":"542200","area_name":"\u6851\u65e5\u53bf"},"542225":{"area_id":"542225","parent_id":"542200","area_name":"\u743c\u7ed3\u53bf"},"542226":{"area_id":"542226","parent_id":"542200","area_name":"\u66f2\u677e\u53bf"},"542227":{"area_id":"542227","parent_id":"542200","area_name":"\u63aa\u7f8e\u53bf"},"542228":{"area_id":"542228","parent_id":"542200","area_name":"\u6d1b\u624e\u53bf"},"542229":{"area_id":"542229","parent_id":"542200","area_name":"\u52a0\u67e5\u53bf"},"542231":{"area_id":"542231","parent_id":"542200","area_name":"\u9686\u5b50\u53bf"},"542232":{"area_id":"542232","parent_id":"542200","area_name":"\u9519\u90a3\u53bf"},"542233":{"area_id":"542233","parent_id":"542200","area_name":"\u6d6a\u5361\u5b50\u53bf"},"542300":{"area_id":"542300","parent_id":"540000","area_name":"\u65e5\u5580\u5219\u5730\u533a"},"542301":{"area_id":"542301","parent_id":"542300","area_name":"\u65e5\u5580\u5219\u5e02"},"542322":{"area_id":"542322","parent_id":"542300","area_name":"\u5357\u6728\u6797\u53bf"},"542323":{"area_id":"542323","parent_id":"542300","area_name":"\u6c5f\u5b5c\u53bf"},"542324":{"area_id":"542324","parent_id":"542300","area_name":"\u5b9a\u65e5\u53bf"},"542325":{"area_id":"542325","parent_id":"542300","area_name":"\u8428\u8fe6\u53bf"},"542326":{"area_id":"542326","parent_id":"542300","area_name":"\u62c9\u5b5c\u53bf"},"542327":{"area_id":"542327","parent_id":"542300","area_name":"\u6602\u4ec1\u53bf"},"542328":{"area_id":"542328","parent_id":"542300","area_name":"\u8c22\u901a\u95e8\u53bf"},"542329":{"area_id":"542329","parent_id":"542300","area_name":"\u767d\u6717\u53bf"},"542330":{"area_id":"542330","parent_id":"542300","area_name":"\u4ec1\u5e03\u53bf"},"542331":{"area_id":"542331","parent_id":"542300","area_name":"\u5eb7\u9a6c\u53bf"},"542332":{"area_id":"542332","parent_id":"542300","area_name":"\u5b9a\u7ed3\u53bf"},"542333":{"area_id":"542333","parent_id":"542300","area_name":"\u4ef2\u5df4\u53bf"},"542334":{"area_id":"542334","parent_id":"542300","area_name":"\u4e9a\u4e1c\u53bf"},"542335":{"area_id":"542335","parent_id":"542300","area_name":"\u5409\u9686\u53bf"},"542336":{"area_id":"542336","parent_id":"542300","area_name":"\u8042\u62c9\u6728\u53bf"},"542337":{"area_id":"542337","parent_id":"542300","area_name":"\u8428\u560e\u53bf"},"542338":{"area_id":"542338","parent_id":"542300","area_name":"\u5c97\u5df4\u53bf"},"542400":{"area_id":"542400","parent_id":"540000","area_name":"\u90a3\u66f2\u5730\u533a"},"542421":{"area_id":"542421","parent_id":"542400","area_name":"\u90a3\u66f2\u53bf"},"542422":{"area_id":"542422","parent_id":"542400","area_name":"\u5609\u9ece\u53bf"},"542423":{"area_id":"542423","parent_id":"542400","area_name":"\u6bd4\u5982\u53bf"},"542424":{"area_id":"542424","parent_id":"542400","area_name":"\u8042\u8363\u53bf"},"542425":{"area_id":"542425","parent_id":"542400","area_name":"\u5b89\u591a\u53bf"},"542426":{"area_id":"542426","parent_id":"542400","area_name":"\u7533\u624e\u53bf"},"542427":{"area_id":"542427","parent_id":"542400","area_name":"\u7d22\u53bf"},"542428":{"area_id":"542428","parent_id":"542400","area_name":"\u73ed\u6208\u53bf"},"542429":{"area_id":"542429","parent_id":"542400","area_name":"\u5df4\u9752\u53bf"},"542430":{"area_id":"542430","parent_id":"542400","area_name":"\u5c3c\u739b\u53bf"},"542431":{"area_id":"542431","parent_id":"542400","area_name":"\u53cc\u6e56\u53bf"},"542500":{"area_id":"542500","parent_id":"540000","area_name":"\u963f\u91cc\u5730\u533a"},"542521":{"area_id":"542521","parent_id":"542500","area_name":"\u666e\u5170\u53bf"},"542522":{"area_id":"542522","parent_id":"542500","area_name":"\u672d\u8fbe\u53bf"},"542523":{"area_id":"542523","parent_id":"542500","area_name":"\u5676\u5c14\u53bf"},"542524":{"area_id":"542524","parent_id":"542500","area_name":"\u65e5\u571f\u53bf"},"542525":{"area_id":"542525","parent_id":"542500","area_name":"\u9769\u5409\u53bf"},"542526":{"area_id":"542526","parent_id":"542500","area_name":"\u6539\u5219\u53bf"},"542527":{"area_id":"542527","parent_id":"542500","area_name":"\u63aa\u52e4\u53bf"},"542600":{"area_id":"542600","parent_id":"540000","area_name":"\u6797\u829d\u5730\u533a"},"542621":{"area_id":"542621","parent_id":"542600","area_name":"\u6797\u829d\u53bf"},"542622":{"area_id":"542622","parent_id":"542600","area_name":"\u5de5\u5e03\u6c5f\u8fbe\u53bf"},"542623":{"area_id":"542623","parent_id":"542600","area_name":"\u7c73\u6797\u53bf"},"542624":{"area_id":"542624","parent_id":"542600","area_name":"\u58a8\u8131\u53bf"},"542625":{"area_id":"542625","parent_id":"542600","area_name":"\u6ce2\u5bc6\u53bf"},"542626":{"area_id":"542626","parent_id":"542600","area_name":"\u5bdf\u9685\u53bf"},"542627":{"area_id":"542627","parent_id":"542600","area_name":"\u6717\u53bf"},"610000":{"area_id":"610000","parent_id":"0","area_name":"\u9655\u897f\u7701"},"610100":{"area_id":"610100","parent_id":"610000","area_name":"\u897f\u5b89\u5e02"},"610101":{"area_id":"610101","parent_id":"610100","area_name":"\u897f\u5b89\u5e02\u5e02\u8f96\u533a"},"610102":{"area_id":"610102","parent_id":"610100","area_name":"\u65b0\u57ce\u533a"},"610103":{"area_id":"610103","parent_id":"610100","area_name":"\u7891\u6797\u533a"},"610104":{"area_id":"610104","parent_id":"610100","area_name":"\u83b2\u6e56\u533a"},"610111":{"area_id":"610111","parent_id":"610100","area_name":"\u705e\u6865\u533a"},"610112":{"area_id":"610112","parent_id":"610100","area_name":"\u672a\u592e\u533a"},"610113":{"area_id":"610113","parent_id":"610100","area_name":"\u96c1\u5854\u533a"},"610114":{"area_id":"610114","parent_id":"610100","area_name":"\u960e\u826f\u533a"},"610115":{"area_id":"610115","parent_id":"610100","area_name":"\u4e34\u6f7c\u533a"},"610116":{"area_id":"610116","parent_id":"610100","area_name":"\u957f\u5b89\u533a"},"610122":{"area_id":"610122","parent_id":"610100","area_name":"\u84dd\u7530\u53bf"},"610124":{"area_id":"610124","parent_id":"610100","area_name":"\u5468\u81f3\u53bf"},"610125":{"area_id":"610125","parent_id":"610100","area_name":"\u6237\u53bf"},"610126":{"area_id":"610126","parent_id":"610100","area_name":"\u9ad8\u9675\u53bf"},"610200":{"area_id":"610200","parent_id":"610000","area_name":"\u94dc\u5ddd\u5e02"},"610201":{"area_id":"610201","parent_id":"610200","area_name":"\u94dc\u5ddd\u5e02\u5e02\u8f96\u533a"},"610202":{"area_id":"610202","parent_id":"610200","area_name":"\u738b\u76ca\u533a"},"610203":{"area_id":"610203","parent_id":"610200","area_name":"\u5370\u53f0\u533a"},"610204":{"area_id":"610204","parent_id":"610200","area_name":"\u8000\u5dde\u533a"},"610222":{"area_id":"610222","parent_id":"610200","area_name":"\u5b9c\u541b\u53bf"},"610300":{"area_id":"610300","parent_id":"610000","area_name":"\u5b9d\u9e21\u5e02"},"610301":{"area_id":"610301","parent_id":"610300","area_name":"\u5b9d\u9e21\u5e02\u5e02\u8f96\u533a"},"610302":{"area_id":"610302","parent_id":"610300","area_name":"\u6e2d\u6ee8\u533a"},"610303":{"area_id":"610303","parent_id":"610300","area_name":"\u91d1\u53f0\u533a"},"610304":{"area_id":"610304","parent_id":"610300","area_name":"\u9648\u4ed3\u533a"},"610322":{"area_id":"610322","parent_id":"610300","area_name":"\u51e4\u7fd4\u53bf"},"610323":{"area_id":"610323","parent_id":"610300","area_name":"\u5c90\u5c71\u53bf"},"610324":{"area_id":"610324","parent_id":"610300","area_name":"\u6276\u98ce\u53bf"},"610326":{"area_id":"610326","parent_id":"610300","area_name":"\u7709\u53bf"},"610327":{"area_id":"610327","parent_id":"610300","area_name":"\u9647\u53bf"},"610328":{"area_id":"610328","parent_id":"610300","area_name":"\u5343\u9633\u53bf"},"610329":{"area_id":"610329","parent_id":"610300","area_name":"\u9e9f\u6e38\u53bf"},"610330":{"area_id":"610330","parent_id":"610300","area_name":"\u51e4\u53bf"},"610331":{"area_id":"610331","parent_id":"610300","area_name":"\u592a\u767d\u53bf"},"610400":{"area_id":"610400","parent_id":"610000","area_name":"\u54b8\u9633\u5e02"},"610401":{"area_id":"610401","parent_id":"610400","area_name":"\u54b8\u9633\u5e02\u5e02\u8f96\u533a"},"610402":{"area_id":"610402","parent_id":"610400","area_name":"\u79e6\u90fd\u533a"},"610403":{"area_id":"610403","parent_id":"610400","area_name":"\u6768\u9675\u533a"},"610404":{"area_id":"610404","parent_id":"610400","area_name":"\u6e2d\u57ce\u533a"},"610422":{"area_id":"610422","parent_id":"610400","area_name":"\u4e09\u539f\u53bf"},"610423":{"area_id":"610423","parent_id":"610400","area_name":"\u6cfe\u9633\u53bf"},"610424":{"area_id":"610424","parent_id":"610400","area_name":"\u4e7e\u53bf"},"610425":{"area_id":"610425","parent_id":"610400","area_name":"\u793c\u6cc9\u53bf"},"610426":{"area_id":"610426","parent_id":"610400","area_name":"\u6c38\u5bff\u53bf"},"610427":{"area_id":"610427","parent_id":"610400","area_name":"\u5f6c\u53bf"},"610428":{"area_id":"610428","parent_id":"610400","area_name":"\u957f\u6b66\u53bf"},"610429":{"area_id":"610429","parent_id":"610400","area_name":"\u65ec\u9091\u53bf"},"610430":{"area_id":"610430","parent_id":"610400","area_name":"\u6df3\u5316\u53bf"},"610431":{"area_id":"610431","parent_id":"610400","area_name":"\u6b66\u529f\u53bf"},"610481":{"area_id":"610481","parent_id":"610400","area_name":"\u5174\u5e73\u5e02"},"610500":{"area_id":"610500","parent_id":"610000","area_name":"\u6e2d\u5357\u5e02"},"610501":{"area_id":"610501","parent_id":"610500","area_name":"\u6e2d\u5357\u5e02\u5e02\u8f96\u533a"},"610502":{"area_id":"610502","parent_id":"610500","area_name":"\u4e34\u6e2d\u533a"},"610521":{"area_id":"610521","parent_id":"610500","area_name":"\u534e\u53bf"},"610522":{"area_id":"610522","parent_id":"610500","area_name":"\u6f7c\u5173\u53bf"},"610523":{"area_id":"610523","parent_id":"610500","area_name":"\u5927\u8354\u53bf"},"610524":{"area_id":"610524","parent_id":"610500","area_name":"\u5408\u9633\u53bf"},"610525":{"area_id":"610525","parent_id":"610500","area_name":"\u6f84\u57ce\u53bf"},"610526":{"area_id":"610526","parent_id":"610500","area_name":"\u84b2\u57ce\u53bf"},"610527":{"area_id":"610527","parent_id":"610500","area_name":"\u767d\u6c34\u53bf"},"610528":{"area_id":"610528","parent_id":"610500","area_name":"\u5bcc\u5e73\u53bf"},"610581":{"area_id":"610581","parent_id":"610500","area_name":"\u97e9\u57ce\u5e02"},"610582":{"area_id":"610582","parent_id":"610500","area_name":"\u534e\u9634\u5e02"},"610600":{"area_id":"610600","parent_id":"610000","area_name":"\u5ef6\u5b89\u5e02"},"610601":{"area_id":"610601","parent_id":"610600","area_name":"\u5ef6\u5b89\u5e02\u5e02\u8f96\u533a"},"610602":{"area_id":"610602","parent_id":"610600","area_name":"\u5b9d\u5854\u533a"},"610621":{"area_id":"610621","parent_id":"610600","area_name":"\u5ef6\u957f\u53bf"},"610622":{"area_id":"610622","parent_id":"610600","area_name":"\u5ef6\u5ddd\u53bf"},"610623":{"area_id":"610623","parent_id":"610600","area_name":"\u5b50\u957f\u53bf"},"610624":{"area_id":"610624","parent_id":"610600","area_name":"\u5b89\u585e\u53bf"},"610625":{"area_id":"610625","parent_id":"610600","area_name":"\u5fd7\u4e39\u53bf"},"610626":{"area_id":"610626","parent_id":"610600","area_name":"\u5434\u8d77\u53bf"},"610627":{"area_id":"610627","parent_id":"610600","area_name":"\u7518\u6cc9\u53bf"},"610628":{"area_id":"610628","parent_id":"610600","area_name":"\u5bcc\u53bf"},"610629":{"area_id":"610629","parent_id":"610600","area_name":"\u6d1b\u5ddd\u53bf"},"610630":{"area_id":"610630","parent_id":"610600","area_name":"\u5b9c\u5ddd\u53bf"},"610631":{"area_id":"610631","parent_id":"610600","area_name":"\u9ec4\u9f99\u53bf"},"610632":{"area_id":"610632","parent_id":"610600","area_name":"\u9ec4\u9675\u53bf"},"610700":{"area_id":"610700","parent_id":"610000","area_name":"\u6c49\u4e2d\u5e02"},"610701":{"area_id":"610701","parent_id":"610700","area_name":"\u6c49\u4e2d\u5e02\u5e02\u8f96\u533a"},"610702":{"area_id":"610702","parent_id":"610700","area_name":"\u6c49\u53f0\u533a"},"610721":{"area_id":"610721","parent_id":"610700","area_name":"\u5357\u90d1\u53bf"},"610722":{"area_id":"610722","parent_id":"610700","area_name":"\u57ce\u56fa\u53bf"},"610723":{"area_id":"610723","parent_id":"610700","area_name":"\u6d0b\u53bf"},"610724":{"area_id":"610724","parent_id":"610700","area_name":"\u897f\u4e61\u53bf"},"610725":{"area_id":"610725","parent_id":"610700","area_name":"\u52c9\u53bf"},"610726":{"area_id":"610726","parent_id":"610700","area_name":"\u5b81\u5f3a\u53bf"},"610727":{"area_id":"610727","parent_id":"610700","area_name":"\u7565\u9633\u53bf"},"610728":{"area_id":"610728","parent_id":"610700","area_name":"\u9547\u5df4\u53bf"},"610729":{"area_id":"610729","parent_id":"610700","area_name":"\u7559\u575d\u53bf"},"610730":{"area_id":"610730","parent_id":"610700","area_name":"\u4f5b\u576a\u53bf"},"610800":{"area_id":"610800","parent_id":"610000","area_name":"\u6986\u6797\u5e02"},"610801":{"area_id":"610801","parent_id":"610800","area_name":"\u6986\u6797\u5e02\u5e02\u8f96\u533a"},"610802":{"area_id":"610802","parent_id":"610800","area_name":"\u6986\u9633\u533a"},"610821":{"area_id":"610821","parent_id":"610800","area_name":"\u795e\u6728\u53bf"},"610822":{"area_id":"610822","parent_id":"610800","area_name":"\u5e9c\u8c37\u53bf"},"610823":{"area_id":"610823","parent_id":"610800","area_name":"\u6a2a\u5c71\u53bf"},"610824":{"area_id":"610824","parent_id":"610800","area_name":"\u9756\u8fb9\u53bf"},"610825":{"area_id":"610825","parent_id":"610800","area_name":"\u5b9a\u8fb9\u53bf"},"610826":{"area_id":"610826","parent_id":"610800","area_name":"\u7ee5\u5fb7\u53bf"},"610827":{"area_id":"610827","parent_id":"610800","area_name":"\u7c73\u8102\u53bf"},"610828":{"area_id":"610828","parent_id":"610800","area_name":"\u4f73\u53bf"},"610829":{"area_id":"610829","parent_id":"610800","area_name":"\u5434\u5821\u53bf"},"610830":{"area_id":"610830","parent_id":"610800","area_name":"\u6e05\u6da7\u53bf"},"610831":{"area_id":"610831","parent_id":"610800","area_name":"\u5b50\u6d32\u53bf"},"610900":{"area_id":"610900","parent_id":"610000","area_name":"\u5b89\u5eb7\u5e02"},"610901":{"area_id":"610901","parent_id":"610900","area_name":"\u5b89\u5eb7\u5e02\u5e02\u8f96\u533a"},"610902":{"area_id":"610902","parent_id":"610900","area_name":"\u6c49\u6ee8\u533a"},"610921":{"area_id":"610921","parent_id":"610900","area_name":"\u6c49\u9634\u53bf"},"610922":{"area_id":"610922","parent_id":"610900","area_name":"\u77f3\u6cc9\u53bf"},"610923":{"area_id":"610923","parent_id":"610900","area_name":"\u5b81\u9655\u53bf"},"610924":{"area_id":"610924","parent_id":"610900","area_name":"\u7d2b\u9633\u53bf"},"610925":{"area_id":"610925","parent_id":"610900","area_name":"\u5c9a\u768b\u53bf"},"610926":{"area_id":"610926","parent_id":"610900","area_name":"\u5e73\u5229\u53bf"},"610927":{"area_id":"610927","parent_id":"610900","area_name":"\u9547\u576a\u53bf"},"610928":{"area_id":"610928","parent_id":"610900","area_name":"\u65ec\u9633\u53bf"},"610929":{"area_id":"610929","parent_id":"610900","area_name":"\u767d\u6cb3\u53bf"},"611000":{"area_id":"611000","parent_id":"610000","area_name":"\u5546\u6d1b\u5e02"},"611001":{"area_id":"611001","parent_id":"611000","area_name":"\u5546\u6d1b\u5e02\u5e02\u8f96\u533a"},"611002":{"area_id":"611002","parent_id":"611000","area_name":"\u5546\u5dde\u533a"},"611021":{"area_id":"611021","parent_id":"611000","area_name":"\u6d1b\u5357\u53bf"},"611022":{"area_id":"611022","parent_id":"611000","area_name":"\u4e39\u51e4\u53bf"},"611023":{"area_id":"611023","parent_id":"611000","area_name":"\u5546\u5357\u53bf"},"611024":{"area_id":"611024","parent_id":"611000","area_name":"\u5c71\u9633\u53bf"},"611025":{"area_id":"611025","parent_id":"611000","area_name":"\u9547\u5b89\u53bf"},"611026":{"area_id":"611026","parent_id":"611000","area_name":"\u67de\u6c34\u53bf"},"620000":{"area_id":"620000","parent_id":"0","area_name":"\u7518\u8083\u7701"},"620100":{"area_id":"620100","parent_id":"620000","area_name":"\u5170\u5dde\u5e02"},"620101":{"area_id":"620101","parent_id":"620100","area_name":"\u5170\u5dde\u5e02\u5e02\u8f96\u533a"},"620102":{"area_id":"620102","parent_id":"620100","area_name":"\u57ce\u5173\u533a"},"620103":{"area_id":"620103","parent_id":"620100","area_name":"\u4e03\u91cc\u6cb3\u533a"},"620104":{"area_id":"620104","parent_id":"620100","area_name":"\u897f\u56fa\u533a"},"620105":{"area_id":"620105","parent_id":"620100","area_name":"\u5b89\u5b81\u533a"},"620111":{"area_id":"620111","parent_id":"620100","area_name":"\u7ea2\u53e4\u533a"},"620121":{"area_id":"620121","parent_id":"620100","area_name":"\u6c38\u767b\u53bf"},"620122":{"area_id":"620122","parent_id":"620100","area_name":"\u768b\u5170\u53bf"},"620123":{"area_id":"620123","parent_id":"620100","area_name":"\u6986\u4e2d\u53bf"},"620200":{"area_id":"620200","parent_id":"620000","area_name":"\u5609\u5cea\u5173\u5e02"},"620201":{"area_id":"620201","parent_id":"620200","area_name":"\u5609\u5cea\u5173\u5e02\u5e02\u8f96\u533a"},"620300":{"area_id":"620300","parent_id":"620000","area_name":"\u91d1\u660c\u5e02"},"620301":{"area_id":"620301","parent_id":"620300","area_name":"\u91d1\u660c\u5e02\u5e02\u8f96\u533a"},"620302":{"area_id":"620302","parent_id":"620300","area_name":"\u91d1\u5ddd\u533a"},"620321":{"area_id":"620321","parent_id":"620300","area_name":"\u6c38\u660c\u53bf"},"620400":{"area_id":"620400","parent_id":"620000","area_name":"\u767d\u94f6\u5e02"},"620401":{"area_id":"620401","parent_id":"620400","area_name":"\u767d\u94f6\u5e02\u5e02\u8f96\u533a"},"620402":{"area_id":"620402","parent_id":"620400","area_name":"\u767d\u94f6\u533a"},"620403":{"area_id":"620403","parent_id":"620400","area_name":"\u5e73\u5ddd\u533a"},"620421":{"area_id":"620421","parent_id":"620400","area_name":"\u9756\u8fdc\u53bf"},"620422":{"area_id":"620422","parent_id":"620400","area_name":"\u4f1a\u5b81\u53bf"},"620423":{"area_id":"620423","parent_id":"620400","area_name":"\u666f\u6cf0\u53bf"},"620500":{"area_id":"620500","parent_id":"620000","area_name":"\u5929\u6c34\u5e02"},"620501":{"area_id":"620501","parent_id":"620500","area_name":"\u5929\u6c34\u5e02\u5e02\u8f96\u533a"},"620502":{"area_id":"620502","parent_id":"620500","area_name":"\u79e6\u5dde\u533a"},"620503":{"area_id":"620503","parent_id":"620500","area_name":"\u9ea6\u79ef\u533a"},"620521":{"area_id":"620521","parent_id":"620500","area_name":"\u6e05\u6c34\u53bf"},"620522":{"area_id":"620522","parent_id":"620500","area_name":"\u79e6\u5b89\u53bf"},"620523":{"area_id":"620523","parent_id":"620500","area_name":"\u7518\u8c37\u53bf"},"620524":{"area_id":"620524","parent_id":"620500","area_name":"\u6b66\u5c71\u53bf"},"620525":{"area_id":"620525","parent_id":"620500","area_name":"\u5f20\u5bb6\u5ddd\u56de\u65cf\u81ea\u6cbb\u53bf"},"620600":{"area_id":"620600","parent_id":"620000","area_name":"\u6b66\u5a01\u5e02"},"620601":{"area_id":"620601","parent_id":"620600","area_name":"\u6b66\u5a01\u5e02\u5e02\u8f96\u533a"},"620602":{"area_id":"620602","parent_id":"620600","area_name":"\u51c9\u5dde\u533a"},"620621":{"area_id":"620621","parent_id":"620600","area_name":"\u6c11\u52e4\u53bf"},"620622":{"area_id":"620622","parent_id":"620600","area_name":"\u53e4\u6d6a\u53bf"},"620623":{"area_id":"620623","parent_id":"620600","area_name":"\u5929\u795d\u85cf\u65cf\u81ea\u6cbb\u53bf"},"620700":{"area_id":"620700","parent_id":"620000","area_name":"\u5f20\u6396\u5e02"},"620701":{"area_id":"620701","parent_id":"620700","area_name":"\u5f20\u6396\u5e02\u5e02\u8f96\u533a"},"620702":{"area_id":"620702","parent_id":"620700","area_name":"\u7518\u5dde\u533a"},"620721":{"area_id":"620721","parent_id":"620700","area_name":"\u8083\u5357\u88d5\u56fa\u65cf\u81ea\u6cbb\u53bf"},"620722":{"area_id":"620722","parent_id":"620700","area_name":"\u6c11\u4e50\u53bf"},"620723":{"area_id":"620723","parent_id":"620700","area_name":"\u4e34\u6cfd\u53bf"},"620724":{"area_id":"620724","parent_id":"620700","area_name":"\u9ad8\u53f0\u53bf"},"620725":{"area_id":"620725","parent_id":"620700","area_name":"\u5c71\u4e39\u53bf"},"620800":{"area_id":"620800","parent_id":"620000","area_name":"\u5e73\u51c9\u5e02"},"620801":{"area_id":"620801","parent_id":"620800","area_name":"\u5e73\u51c9\u5e02\u5e02\u8f96\u533a"},"620802":{"area_id":"620802","parent_id":"620800","area_name":"\u5d06\u5cd2\u533a"},"620821":{"area_id":"620821","parent_id":"620800","area_name":"\u6cfe\u5ddd\u53bf"},"620822":{"area_id":"620822","parent_id":"620800","area_name":"\u7075\u53f0\u53bf"},"620823":{"area_id":"620823","parent_id":"620800","area_name":"\u5d07\u4fe1\u53bf"},"620824":{"area_id":"620824","parent_id":"620800","area_name":"\u534e\u4ead\u53bf"},"620825":{"area_id":"620825","parent_id":"620800","area_name":"\u5e84\u6d6a\u53bf"},"620826":{"area_id":"620826","parent_id":"620800","area_name":"\u9759\u5b81\u53bf"},"620900":{"area_id":"620900","parent_id":"620000","area_name":"\u9152\u6cc9\u5e02"},"620901":{"area_id":"620901","parent_id":"620900","area_name":"\u9152\u6cc9\u5e02\u5e02\u8f96\u533a"},"620902":{"area_id":"620902","parent_id":"620900","area_name":"\u8083\u5dde\u533a"},"620921":{"area_id":"620921","parent_id":"620900","area_name":"\u91d1\u5854\u53bf"},"620922":{"area_id":"620922","parent_id":"620900","area_name":"\u74dc\u5dde\u53bf"},"620923":{"area_id":"620923","parent_id":"620900","area_name":"\u8083\u5317\u8499\u53e4\u65cf\u81ea\u6cbb\u53bf"},"620924":{"area_id":"620924","parent_id":"620900","area_name":"\u963f\u514b\u585e\u54c8\u8428\u514b\u65cf\u81ea\u6cbb\u53bf"},"620981":{"area_id":"620981","parent_id":"620900","area_name":"\u7389\u95e8\u5e02"},"620982":{"area_id":"620982","parent_id":"620900","area_name":"\u6566\u714c\u5e02"},"621000":{"area_id":"621000","parent_id":"620000","area_name":"\u5e86\u9633\u5e02"},"621001":{"area_id":"621001","parent_id":"621000","area_name":"\u5e86\u9633\u5e02\u5e02\u8f96\u533a"},"621002":{"area_id":"621002","parent_id":"621000","area_name":"\u897f\u5cf0\u533a"},"621021":{"area_id":"621021","parent_id":"621000","area_name":"\u5e86\u57ce\u53bf"},"621022":{"area_id":"621022","parent_id":"621000","area_name":"\u73af\u53bf"},"621023":{"area_id":"621023","parent_id":"621000","area_name":"\u534e\u6c60\u53bf"},"621024":{"area_id":"621024","parent_id":"621000","area_name":"\u5408\u6c34\u53bf"},"621025":{"area_id":"621025","parent_id":"621000","area_name":"\u6b63\u5b81\u53bf"},"621026":{"area_id":"621026","parent_id":"621000","area_name":"\u5b81\u53bf"},"621027":{"area_id":"621027","parent_id":"621000","area_name":"\u9547\u539f\u53bf"},"621100":{"area_id":"621100","parent_id":"620000","area_name":"\u5b9a\u897f\u5e02"},"621101":{"area_id":"621101","parent_id":"621100","area_name":"\u5b9a\u897f\u5e02\u5e02\u8f96\u533a"},"621102":{"area_id":"621102","parent_id":"621100","area_name":"\u5b89\u5b9a\u533a"},"621121":{"area_id":"621121","parent_id":"621100","area_name":"\u901a\u6e2d\u53bf"},"621122":{"area_id":"621122","parent_id":"621100","area_name":"\u9647\u897f\u53bf"},"621123":{"area_id":"621123","parent_id":"621100","area_name":"\u6e2d\u6e90\u53bf"},"621124":{"area_id":"621124","parent_id":"621100","area_name":"\u4e34\u6d2e\u53bf"},"621125":{"area_id":"621125","parent_id":"621100","area_name":"\u6f33\u53bf"},"621126":{"area_id":"621126","parent_id":"621100","area_name":"\u5cb7\u53bf"},"621200":{"area_id":"621200","parent_id":"620000","area_name":"\u9647\u5357\u5e02"},"621201":{"area_id":"621201","parent_id":"621200","area_name":"\u9647\u5357\u5e02\u5e02\u8f96\u533a"},"621202":{"area_id":"621202","parent_id":"621200","area_name":"\u6b66\u90fd\u533a"},"621221":{"area_id":"621221","parent_id":"621200","area_name":"\u6210\u53bf"},"621222":{"area_id":"621222","parent_id":"621200","area_name":"\u6587\u53bf"},"621223":{"area_id":"621223","parent_id":"621200","area_name":"\u5b95\u660c\u53bf"},"621224":{"area_id":"621224","parent_id":"621200","area_name":"\u5eb7\u53bf"},"621225":{"area_id":"621225","parent_id":"621200","area_name":"\u897f\u548c\u53bf"},"621226":{"area_id":"621226","parent_id":"621200","area_name":"\u793c\u53bf"},"621227":{"area_id":"621227","parent_id":"621200","area_name":"\u5fbd\u53bf"},"621228":{"area_id":"621228","parent_id":"621200","area_name":"\u4e24\u5f53\u53bf"},"622900":{"area_id":"622900","parent_id":"620000","area_name":"\u4e34\u590f\u56de\u65cf\u81ea\u6cbb\u5dde"},"622901":{"area_id":"622901","parent_id":"622900","area_name":"\u4e34\u590f\u5e02"},"622921":{"area_id":"622921","parent_id":"622900","area_name":"\u4e34\u590f\u53bf"},"622922":{"area_id":"622922","parent_id":"622900","area_name":"\u5eb7\u4e50\u53bf"},"622923":{"area_id":"622923","parent_id":"622900","area_name":"\u6c38\u9756\u53bf"},"622924":{"area_id":"622924","parent_id":"622900","area_name":"\u5e7f\u6cb3\u53bf"},"622925":{"area_id":"622925","parent_id":"622900","area_name":"\u548c\u653f\u53bf"},"622926":{"area_id":"622926","parent_id":"622900","area_name":"\u4e1c\u4e61\u65cf\u81ea\u6cbb\u53bf"},"622927":{"area_id":"622927","parent_id":"622900","area_name":"\u79ef\u77f3\u5c71\u4fdd\u5b89\u65cf\u4e1c\u4e61\u65cf\u6492\u62c9\u65cf\u81ea\u6cbb\u53bf"},"623000":{"area_id":"623000","parent_id":"620000","area_name":"\u7518\u5357\u85cf\u65cf\u81ea\u6cbb\u5dde"},"623001":{"area_id":"623001","parent_id":"623000","area_name":"\u5408\u4f5c\u5e02"},"623021":{"area_id":"623021","parent_id":"623000","area_name":"\u4e34\u6f6d\u53bf"},"623022":{"area_id":"623022","parent_id":"623000","area_name":"\u5353\u5c3c\u53bf"},"623023":{"area_id":"623023","parent_id":"623000","area_name":"\u821f\u66f2\u53bf"},"623024":{"area_id":"623024","parent_id":"623000","area_name":"\u8fed\u90e8\u53bf"},"623025":{"area_id":"623025","parent_id":"623000","area_name":"\u739b\u66f2\u53bf"},"623026":{"area_id":"623026","parent_id":"623000","area_name":"\u788c\u66f2\u53bf"},"623027":{"area_id":"623027","parent_id":"623000","area_name":"\u590f\u6cb3\u53bf"},"630000":{"area_id":"630000","parent_id":"0","area_name":"\u9752\u6d77\u7701"},"630100":{"area_id":"630100","parent_id":"630000","area_name":"\u897f\u5b81\u5e02"},"630101":{"area_id":"630101","parent_id":"630100","area_name":"\u897f\u5b81\u5e02\u5e02\u8f96\u533a"},"630102":{"area_id":"630102","parent_id":"630100","area_name":"\u57ce\u4e1c\u533a"},"630103":{"area_id":"630103","parent_id":"630100","area_name":"\u57ce\u4e2d\u533a"},"630104":{"area_id":"630104","parent_id":"630100","area_name":"\u57ce\u897f\u533a"},"630105":{"area_id":"630105","parent_id":"630100","area_name":"\u57ce\u5317\u533a"},"630121":{"area_id":"630121","parent_id":"630100","area_name":"\u5927\u901a\u56de\u65cf\u571f\u65cf\u81ea\u6cbb\u53bf"},"630122":{"area_id":"630122","parent_id":"630100","area_name":"\u6e5f\u4e2d\u53bf"},"630123":{"area_id":"630123","parent_id":"630100","area_name":"\u6e5f\u6e90\u53bf"},"630200":{"area_id":"630200","parent_id":"630000","area_name":"\u6d77\u4e1c\u5e02"},"630202":{"area_id":"630202","parent_id":"630200","area_name":"\u4e50\u90fd\u533a"},"630221":{"area_id":"630221","parent_id":"630200","area_name":"\u5e73\u5b89\u53bf"},"630222":{"area_id":"630222","parent_id":"630200","area_name":"\u6c11\u548c\u56de\u65cf\u571f\u65cf\u81ea\u6cbb\u53bf"},"630223":{"area_id":"630223","parent_id":"630200","area_name":"\u4e92\u52a9\u571f\u65cf\u81ea\u6cbb\u53bf"},"630224":{"area_id":"630224","parent_id":"630200","area_name":"\u5316\u9686\u56de\u65cf\u81ea\u6cbb\u53bf"},"630225":{"area_id":"630225","parent_id":"630200","area_name":"\u5faa\u5316\u6492\u62c9\u65cf\u81ea\u6cbb\u53bf"},"632200":{"area_id":"632200","parent_id":"630000","area_name":"\u6d77\u5317\u85cf\u65cf\u81ea\u6cbb\u5dde"},"632221":{"area_id":"632221","parent_id":"632200","area_name":"\u95e8\u6e90\u56de\u65cf\u81ea\u6cbb\u53bf"},"632222":{"area_id":"632222","parent_id":"632200","area_name":"\u7941\u8fde\u53bf"},"632223":{"area_id":"632223","parent_id":"632200","area_name":"\u6d77\u664f\u53bf"},"632224":{"area_id":"632224","parent_id":"632200","area_name":"\u521a\u5bdf\u53bf"},"632300":{"area_id":"632300","parent_id":"630000","area_name":"\u9ec4\u5357\u85cf\u65cf\u81ea\u6cbb\u5dde"},"632321":{"area_id":"632321","parent_id":"632300","area_name":"\u540c\u4ec1\u53bf"},"632322":{"area_id":"632322","parent_id":"632300","area_name":"\u5c16\u624e\u53bf"},"632323":{"area_id":"632323","parent_id":"632300","area_name":"\u6cfd\u5e93\u53bf"},"632324":{"area_id":"632324","parent_id":"632300","area_name":"\u6cb3\u5357\u8499\u53e4\u65cf\u81ea\u6cbb\u53bf"},"632500":{"area_id":"632500","parent_id":"630000","area_name":"\u6d77\u5357\u85cf\u65cf\u81ea\u6cbb\u5dde"},"632521":{"area_id":"632521","parent_id":"632500","area_name":"\u5171\u548c\u53bf"},"632522":{"area_id":"632522","parent_id":"632500","area_name":"\u540c\u5fb7\u53bf"},"632523":{"area_id":"632523","parent_id":"632500","area_name":"\u8d35\u5fb7\u53bf"},"632524":{"area_id":"632524","parent_id":"632500","area_name":"\u5174\u6d77\u53bf"},"632525":{"area_id":"632525","parent_id":"632500","area_name":"\u8d35\u5357\u53bf"},"632600":{"area_id":"632600","parent_id":"630000","area_name":"\u679c\u6d1b\u85cf\u65cf\u81ea\u6cbb\u5dde"},"632621":{"area_id":"632621","parent_id":"632600","area_name":"\u739b\u6c81\u53bf"},"632622":{"area_id":"632622","parent_id":"632600","area_name":"\u73ed\u739b\u53bf"},"632623":{"area_id":"632623","parent_id":"632600","area_name":"\u7518\u5fb7\u53bf"},"632624":{"area_id":"632624","parent_id":"632600","area_name":"\u8fbe\u65e5\u53bf"},"632625":{"area_id":"632625","parent_id":"632600","area_name":"\u4e45\u6cbb\u53bf"},"632626":{"area_id":"632626","parent_id":"632600","area_name":"\u739b\u591a\u53bf"},"632700":{"area_id":"632700","parent_id":"630000","area_name":"\u7389\u6811\u85cf\u65cf\u81ea\u6cbb\u5dde"},"632701":{"area_id":"632701","parent_id":"632700","area_name":"\u7389\u6811\u5e02"},"632722":{"area_id":"632722","parent_id":"632700","area_name":"\u6742\u591a\u53bf"},"632723":{"area_id":"632723","parent_id":"632700","area_name":"\u79f0\u591a\u53bf"},"632724":{"area_id":"632724","parent_id":"632700","area_name":"\u6cbb\u591a\u53bf"},"632725":{"area_id":"632725","parent_id":"632700","area_name":"\u56ca\u8c26\u53bf"},"632726":{"area_id":"632726","parent_id":"632700","area_name":"\u66f2\u9ebb\u83b1\u53bf"},"632800":{"area_id":"632800","parent_id":"630000","area_name":"\u6d77\u897f\u8499\u53e4\u65cf\u85cf\u65cf\u81ea\u6cbb\u5dde"},"632801":{"area_id":"632801","parent_id":"632800","area_name":"\u683c\u5c14\u6728\u5e02"},"632802":{"area_id":"632802","parent_id":"632800","area_name":"\u5fb7\u4ee4\u54c8\u5e02"},"632821":{"area_id":"632821","parent_id":"632800","area_name":"\u4e4c\u5170\u53bf"},"632822":{"area_id":"632822","parent_id":"632800","area_name":"\u90fd\u5170\u53bf"},"632823":{"area_id":"632823","parent_id":"632800","area_name":"\u5929\u5cfb\u53bf"},"640000":{"area_id":"640000","parent_id":"0","area_name":"\u5b81\u590f\u56de\u65cf\u81ea\u6cbb\u533a"},"640100":{"area_id":"640100","parent_id":"640000","area_name":"\u94f6\u5ddd\u5e02"},"640101":{"area_id":"640101","parent_id":"640100","area_name":"\u94f6\u5ddd\u5e02\u5e02\u8f96\u533a"},"640104":{"area_id":"640104","parent_id":"640100","area_name":"\u5174\u5e86\u533a"},"640105":{"area_id":"640105","parent_id":"640100","area_name":"\u897f\u590f\u533a"},"640106":{"area_id":"640106","parent_id":"640100","area_name":"\u91d1\u51e4\u533a"},"640121":{"area_id":"640121","parent_id":"640100","area_name":"\u6c38\u5b81\u53bf"},"640122":{"area_id":"640122","parent_id":"640100","area_name":"\u8d3a\u5170\u53bf"},"640181":{"area_id":"640181","parent_id":"640100","area_name":"\u7075\u6b66\u5e02"},"640200":{"area_id":"640200","parent_id":"640000","area_name":"\u77f3\u5634\u5c71\u5e02"},"640201":{"area_id":"640201","parent_id":"640200","area_name":"\u77f3\u5634\u5c71\u5e02\u5e02\u8f96\u533a"},"640202":{"area_id":"640202","parent_id":"640200","area_name":"\u5927\u6b66\u53e3\u533a"},"640205":{"area_id":"640205","parent_id":"640200","area_name":"\u60e0\u519c\u533a"},"640221":{"area_id":"640221","parent_id":"640200","area_name":"\u5e73\u7f57\u53bf"},"640300":{"area_id":"640300","parent_id":"640000","area_name":"\u5434\u5fe0\u5e02"},"640301":{"area_id":"640301","parent_id":"640300","area_name":"\u5434\u5fe0\u5e02\u5e02\u8f96\u533a"},"640302":{"area_id":"640302","parent_id":"640300","area_name":"\u5229\u901a\u533a"},"640303":{"area_id":"640303","parent_id":"640300","area_name":"\u7ea2\u5bfa\u5821\u533a"},"640323":{"area_id":"640323","parent_id":"640300","area_name":"\u76d0\u6c60\u53bf"},"640324":{"area_id":"640324","parent_id":"640300","area_name":"\u540c\u5fc3\u53bf"},"640381":{"area_id":"640381","parent_id":"640300","area_name":"\u9752\u94dc\u5ce1\u5e02"},"640400":{"area_id":"640400","parent_id":"640000","area_name":"\u56fa\u539f\u5e02"},"640401":{"area_id":"640401","parent_id":"640400","area_name":"\u56fa\u539f\u5e02\u5e02\u8f96\u533a"},"640402":{"area_id":"640402","parent_id":"640400","area_name":"\u539f\u5dde\u533a"},"640422":{"area_id":"640422","parent_id":"640400","area_name":"\u897f\u5409\u53bf"},"640423":{"area_id":"640423","parent_id":"640400","area_name":"\u9686\u5fb7\u53bf"},"640424":{"area_id":"640424","parent_id":"640400","area_name":"\u6cfe\u6e90\u53bf"},"640425":{"area_id":"640425","parent_id":"640400","area_name":"\u5f6d\u9633\u53bf"},"640500":{"area_id":"640500","parent_id":"640000","area_name":"\u4e2d\u536b\u5e02"},"640501":{"area_id":"640501","parent_id":"640500","area_name":"\u4e2d\u536b\u5e02\u5e02\u8f96\u533a"},"640502":{"area_id":"640502","parent_id":"640500","area_name":"\u6c99\u5761\u5934\u533a"},"640521":{"area_id":"640521","parent_id":"640500","area_name":"\u4e2d\u5b81\u53bf"},"640522":{"area_id":"640522","parent_id":"640500","area_name":"\u6d77\u539f\u53bf"},"650000":{"area_id":"650000","parent_id":"0","area_name":"\u65b0\u7586\u7ef4\u543e\u5c14\u81ea\u6cbb\u533a"},"650100":{"area_id":"650100","parent_id":"650000","area_name":"\u4e4c\u9c81\u6728\u9f50\u5e02"},"650101":{"area_id":"650101","parent_id":"650100","area_name":"\u4e4c\u9c81\u6728\u9f50\u5e02\u5e02\u8f96\u533a"},"650102":{"area_id":"650102","parent_id":"650100","area_name":"\u5929\u5c71\u533a"},"650103":{"area_id":"650103","parent_id":"650100","area_name":"\u6c99\u4f9d\u5df4\u514b\u533a"},"650104":{"area_id":"650104","parent_id":"650100","area_name":"\u65b0\u5e02\u533a"},"650105":{"area_id":"650105","parent_id":"650100","area_name":"\u6c34\u78e8\u6c9f\u533a"},"650106":{"area_id":"650106","parent_id":"650100","area_name":"\u5934\u5c6f\u6cb3\u533a"},"650107":{"area_id":"650107","parent_id":"650100","area_name":"\u8fbe\u5742\u57ce\u533a"},"650109":{"area_id":"650109","parent_id":"650100","area_name":"\u7c73\u4e1c\u533a"},"650121":{"area_id":"650121","parent_id":"650100","area_name":"\u4e4c\u9c81\u6728\u9f50\u53bf"},"650200":{"area_id":"650200","parent_id":"650000","area_name":"\u514b\u62c9\u739b\u4f9d\u5e02"},"650201":{"area_id":"650201","parent_id":"650200","area_name":"\u514b\u62c9\u739b\u4f9d\u5e02\u5e02\u8f96\u533a"},"650202":{"area_id":"650202","parent_id":"650200","area_name":"\u72ec\u5c71\u5b50\u533a"},"650203":{"area_id":"650203","parent_id":"650200","area_name":"\u514b\u62c9\u739b\u4f9d\u533a"},"650204":{"area_id":"650204","parent_id":"650200","area_name":"\u767d\u78b1\u6ee9\u533a"},"650205":{"area_id":"650205","parent_id":"650200","area_name":"\u4e4c\u5c14\u79be\u533a"},"652100":{"area_id":"652100","parent_id":"650000","area_name":"\u5410\u9c81\u756a\u5730\u533a"},"652101":{"area_id":"652101","parent_id":"652100","area_name":"\u5410\u9c81\u756a\u5e02"},"652122":{"area_id":"652122","parent_id":"652100","area_name":"\u912f\u5584\u53bf"},"652123":{"area_id":"652123","parent_id":"652100","area_name":"\u6258\u514b\u900a\u53bf"},"652200":{"area_id":"652200","parent_id":"650000","area_name":"\u54c8\u5bc6\u5730\u533a"},"652201":{"area_id":"652201","parent_id":"652200","area_name":"\u54c8\u5bc6\u5e02"},"652222":{"area_id":"652222","parent_id":"652200","area_name":"\u5df4\u91cc\u5764\u54c8\u8428\u514b\u81ea\u6cbb\u53bf"},"652223":{"area_id":"652223","parent_id":"652200","area_name":"\u4f0a\u543e\u53bf"},"652300":{"area_id":"652300","parent_id":"650000","area_name":"\u660c\u5409\u56de\u65cf\u81ea\u6cbb\u5dde"},"652301":{"area_id":"652301","parent_id":"652300","area_name":"\u660c\u5409\u5e02"},"652302":{"area_id":"652302","parent_id":"652300","area_name":"\u961c\u5eb7\u5e02"},"652323":{"area_id":"652323","parent_id":"652300","area_name":"\u547c\u56fe\u58c1\u53bf"},"652324":{"area_id":"652324","parent_id":"652300","area_name":"\u739b\u7eb3\u65af\u53bf"},"652325":{"area_id":"652325","parent_id":"652300","area_name":"\u5947\u53f0\u53bf"},"652327":{"area_id":"652327","parent_id":"652300","area_name":"\u5409\u6728\u8428\u5c14\u53bf"},"652328":{"area_id":"652328","parent_id":"652300","area_name":"\u6728\u5792\u54c8\u8428\u514b\u81ea\u6cbb\u53bf"},"652700":{"area_id":"652700","parent_id":"650000","area_name":"\u535a\u5c14\u5854\u62c9\u8499\u53e4\u81ea\u6cbb\u5dde"},"652701":{"area_id":"652701","parent_id":"652700","area_name":"\u535a\u4e50\u5e02"},"652702":{"area_id":"652702","parent_id":"652700","area_name":"\u963f\u62c9\u5c71\u53e3\u5e02"},"652722":{"area_id":"652722","parent_id":"652700","area_name":"\u7cbe\u6cb3\u53bf"},"652723":{"area_id":"652723","parent_id":"652700","area_name":"\u6e29\u6cc9\u53bf"},"652800":{"area_id":"652800","parent_id":"650000","area_name":"\u5df4\u97f3\u90ed\u695e\u8499\u53e4\u81ea\u6cbb\u5dde"},"652801":{"area_id":"652801","parent_id":"652800","area_name":"\u5e93\u5c14\u52d2\u5e02"},"652822":{"area_id":"652822","parent_id":"652800","area_name":"\u8f6e\u53f0\u53bf"},"652823":{"area_id":"652823","parent_id":"652800","area_name":"\u5c09\u7281\u53bf"},"652824":{"area_id":"652824","parent_id":"652800","area_name":"\u82e5\u7f8c\u53bf"},"652825":{"area_id":"652825","parent_id":"652800","area_name":"\u4e14\u672b\u53bf"},"652826":{"area_id":"652826","parent_id":"652800","area_name":"\u7109\u8006\u56de\u65cf\u81ea\u6cbb\u53bf"},"652827":{"area_id":"652827","parent_id":"652800","area_name":"\u548c\u9759\u53bf"},"652828":{"area_id":"652828","parent_id":"652800","area_name":"\u548c\u7855\u53bf"},"652829":{"area_id":"652829","parent_id":"652800","area_name":"\u535a\u6e56\u53bf"},"652900":{"area_id":"652900","parent_id":"650000","area_name":"\u963f\u514b\u82cf\u5730\u533a"},"652901":{"area_id":"652901","parent_id":"652900","area_name":"\u963f\u514b\u82cf\u5e02"},"652922":{"area_id":"652922","parent_id":"652900","area_name":"\u6e29\u5bbf\u53bf"},"652923":{"area_id":"652923","parent_id":"652900","area_name":"\u5e93\u8f66\u53bf"},"652924":{"area_id":"652924","parent_id":"652900","area_name":"\u6c99\u96c5\u53bf"},"652925":{"area_id":"652925","parent_id":"652900","area_name":"\u65b0\u548c\u53bf"},"652926":{"area_id":"652926","parent_id":"652900","area_name":"\u62dc\u57ce\u53bf"},"652927":{"area_id":"652927","parent_id":"652900","area_name":"\u4e4c\u4ec0\u53bf"},"652928":{"area_id":"652928","parent_id":"652900","area_name":"\u963f\u74e6\u63d0\u53bf"},"652929":{"area_id":"652929","parent_id":"652900","area_name":"\u67ef\u576a\u53bf"},"653000":{"area_id":"653000","parent_id":"650000","area_name":"\u514b\u5b5c\u52d2\u82cf\u67ef\u5c14\u514b\u5b5c\u81ea\u6cbb\u5dde"},"653001":{"area_id":"653001","parent_id":"653000","area_name":"\u963f\u56fe\u4ec0\u5e02"},"653022":{"area_id":"653022","parent_id":"653000","area_name":"\u963f\u514b\u9676\u53bf"},"653023":{"area_id":"653023","parent_id":"653000","area_name":"\u963f\u5408\u5947\u53bf"},"653024":{"area_id":"653024","parent_id":"653000","area_name":"\u4e4c\u6070\u53bf"},"653100":{"area_id":"653100","parent_id":"650000","area_name":"\u5580\u4ec0\u5730\u533a"},"653101":{"area_id":"653101","parent_id":"653100","area_name":"\u5580\u4ec0\u5e02"},"653121":{"area_id":"653121","parent_id":"653100","area_name":"\u758f\u9644\u53bf"},"653122":{"area_id":"653122","parent_id":"653100","area_name":"\u758f\u52d2\u53bf"},"653123":{"area_id":"653123","parent_id":"653100","area_name":"\u82f1\u5409\u6c99\u53bf"},"653124":{"area_id":"653124","parent_id":"653100","area_name":"\u6cfd\u666e\u53bf"},"653125":{"area_id":"653125","parent_id":"653100","area_name":"\u838e\u8f66\u53bf"},"653126":{"area_id":"653126","parent_id":"653100","area_name":"\u53f6\u57ce\u53bf"},"653127":{"area_id":"653127","parent_id":"653100","area_name":"\u9ea6\u76d6\u63d0\u53bf"},"653128":{"area_id":"653128","parent_id":"653100","area_name":"\u5cb3\u666e\u6e56\u53bf"},"653129":{"area_id":"653129","parent_id":"653100","area_name":"\u4f3d\u5e08\u53bf"},"653130":{"area_id":"653130","parent_id":"653100","area_name":"\u5df4\u695a\u53bf"},"653131":{"area_id":"653131","parent_id":"653100","area_name":"\u5854\u4ec0\u5e93\u5c14\u5e72\u5854\u5409\u514b\u81ea\u6cbb\u53bf"},"653200":{"area_id":"653200","parent_id":"650000","area_name":"\u548c\u7530\u5730\u533a"},"653201":{"area_id":"653201","parent_id":"653200","area_name":"\u548c\u7530\u5e02"},"653221":{"area_id":"653221","parent_id":"653200","area_name":"\u548c\u7530\u53bf"},"653222":{"area_id":"653222","parent_id":"653200","area_name":"\u58a8\u7389\u53bf"},"653223":{"area_id":"653223","parent_id":"653200","area_name":"\u76ae\u5c71\u53bf"},"653224":{"area_id":"653224","parent_id":"653200","area_name":"\u6d1b\u6d66\u53bf"},"653225":{"area_id":"653225","parent_id":"653200","area_name":"\u7b56\u52d2\u53bf"},"653226":{"area_id":"653226","parent_id":"653200","area_name":"\u4e8e\u7530\u53bf"},"653227":{"area_id":"653227","parent_id":"653200","area_name":"\u6c11\u4e30\u53bf"},"654000":{"area_id":"654000","parent_id":"650000","area_name":"\u4f0a\u7281\u54c8\u8428\u514b\u81ea\u6cbb\u5dde"},"654002":{"area_id":"654002","parent_id":"654000","area_name":"\u4f0a\u5b81\u5e02"},"654003":{"area_id":"654003","parent_id":"654000","area_name":"\u594e\u5c6f\u5e02"},"654021":{"area_id":"654021","parent_id":"654000","area_name":"\u4f0a\u5b81\u53bf"},"654022":{"area_id":"654022","parent_id":"654000","area_name":"\u5bdf\u5e03\u67e5\u5c14\u9521\u4f2f\u81ea\u6cbb\u53bf"},"654023":{"area_id":"654023","parent_id":"654000","area_name":"\u970d\u57ce\u53bf"},"654024":{"area_id":"654024","parent_id":"654000","area_name":"\u5de9\u7559\u53bf"},"654025":{"area_id":"654025","parent_id":"654000","area_name":"\u65b0\u6e90\u53bf"},"654026":{"area_id":"654026","parent_id":"654000","area_name":"\u662d\u82cf\u53bf"},"654027":{"area_id":"654027","parent_id":"654000","area_name":"\u7279\u514b\u65af\u53bf"},"654028":{"area_id":"654028","parent_id":"654000","area_name":"\u5c3c\u52d2\u514b\u53bf"},"654200":{"area_id":"654200","parent_id":"650000","area_name":"\u5854\u57ce\u5730\u533a"},"654201":{"area_id":"654201","parent_id":"654200","area_name":"\u5854\u57ce\u5e02"},"654202":{"area_id":"654202","parent_id":"654200","area_name":"\u4e4c\u82cf\u5e02"},"654221":{"area_id":"654221","parent_id":"654200","area_name":"\u989d\u654f\u53bf"},"654223":{"area_id":"654223","parent_id":"654200","area_name":"\u6c99\u6e7e\u53bf"},"654224":{"area_id":"654224","parent_id":"654200","area_name":"\u6258\u91cc\u53bf"},"654225":{"area_id":"654225","parent_id":"654200","area_name":"\u88d5\u6c11\u53bf"},"654226":{"area_id":"654226","parent_id":"654200","area_name":"\u548c\u5e03\u514b\u8d5b\u5c14\u8499\u53e4\u81ea\u6cbb\u53bf"},"654300":{"area_id":"654300","parent_id":"650000","area_name":"\u963f\u52d2\u6cf0\u5730\u533a"},"654301":{"area_id":"654301","parent_id":"654300","area_name":"\u963f\u52d2\u6cf0\u5e02"},"654321":{"area_id":"654321","parent_id":"654300","area_name":"\u5e03\u5c14\u6d25\u53bf"},"654322":{"area_id":"654322","parent_id":"654300","area_name":"\u5bcc\u8574\u53bf"},"654323":{"area_id":"654323","parent_id":"654300","area_name":"\u798f\u6d77\u53bf"},"654324":{"area_id":"654324","parent_id":"654300","area_name":"\u54c8\u5df4\u6cb3\u53bf"},"654325":{"area_id":"654325","parent_id":"654300","area_name":"\u9752\u6cb3\u53bf"},"654326":{"area_id":"654326","parent_id":"654300","area_name":"\u5409\u6728\u4e43\u53bf"},"659000":{"area_id":"659000","parent_id":"650000","area_name":"\u81ea\u6cbb\u533a\u76f4\u8f96\u53bf\u7ea7\u884c\u653f\u533a\u5212"},"659001":{"area_id":"659001","parent_id":"659000","area_name":"\u77f3\u6cb3\u5b50\u5e02"},"659002":{"area_id":"659002","parent_id":"659000","area_name":"\u963f\u62c9\u5c14\u5e02"},"659003":{"area_id":"659003","parent_id":"659000","area_name":"\u56fe\u6728\u8212\u514b\u5e02"},"659004":{"area_id":"659004","parent_id":"659000","area_name":"\u4e94\u5bb6\u6e20\u5e02"},"710000":{"area_id":"710000","parent_id":"0","area_name":"\u53f0\u6e7e\u7701"},"810000":{"area_id":"810000","parent_id":"0","area_name":"\u9999\u6e2f\u7279\u522b\u884c\u653f\u533a"},"820000":{"area_id":"820000","parent_id":"0","area_name":"\u6fb3\u95e8\u7279\u522b\u884c\u653f\u533a"}};

	$(function(){
		var clearSel = function(sel){
			for(var i=sel.childNodes.length-1; i>=0; i--){
				sel.removeChild(sel.childNodes[i]);
			}
		};

		var showPro = function(pro_id, pro_sel){
			clearSel(pro_sel);
			for(var k in area_list){
				var item = area_list[k];
				if(item.parent_id == '0'){
					var opt = new Option(item.area_name, item.area_id);
					pro_sel.appendChild(opt);
				}
			}
			if(pro_id){
				pro_sel.value = pro_id;
			}
		};

		var showCity = function(city_id, pro_id, city_sel){
			clearSel(city_sel);
			city_sel.childNodes.length = 0;
			for(var k in area_list){
				var item = area_list[k];
				if(item.parent_id == pro_id){
					var opt = new Option(item.area_name, item.area_id);
					city_sel.appendChild(opt);
				}
			}
			if(city_id){
				city_sel.value = city_id;
			} else {
				city_sel.selectedIndex = 0;
			}
		};

		var showCounty = function(county_id, city_id, county_sel){
			clearSel(county_sel);
			county_sel.childNodes.length = 0;
			for(var k in area_list){
				var item = area_list[k];
				if(item.parent_id == city_id){
					var opt = new Option(item.area_name, item.area_id);
					county_sel.appendChild(opt);
				}
			}
			if(county_id){
				county_sel.value = county_id;
			} else {
				county_sel.selectedIndex = 0;
			}
		};

		$('select[rel=province-selector]').each(function(idx){
			var city_sel = $('select[rel=city-selector]').eq(idx)[0];
			var county_sel = $('select[rel=county-selector]').eq(idx)[0];

			if(!city_sel || !county_sel){
				console.log('error');
				return;
			}

			$(this).change(function(){
				showCity(0, this.value, city_sel);
				showCounty(0, city_sel.value, county_sel)
			});

			$(city_sel).change(function(){
				showCounty(0, this.value, county_sel);
			});

			var init_pro = parseInt(this.getAttribute('data-value'), 10) || 0;
			var init_city = parseInt(city_sel.getAttribute('data-value'), 10) || 0;
			var init_county = parseInt(county_sel.getAttribute('data-value'), 10) || 0;

			showPro(init_pro, this);
			if(init_pro){
				showCity(init_city, init_pro, city_sel);
			}
			if(init_city){
				showCounty(init_county, init_city, county_sel);
			}
		});
	});
});
//../src/component/async.js
/**
 * Created by Administrator on 2016/6/8.
 */
define('ywj/async', function(require){
	var Net = require('ywj/net');
	var Util = require('ywj/util');
	var MSG_SUCCESS_SHOW_TIME = window.MSG_SUCCESS_SHOW_TIME || 1; //成功信息显示时间（秒）
	var MSG_ERROR_SHOW_TIME =window.MSG_ERROR_SHOW_TIME || 2; //错误信息显示时间（秒）
	var MSG_LOAD_TIME = 10000;

	var BTN_LOADING_CLASS = 'btn-loading';
	var FLAG_SUBMITTING = 'submitting';
	var FLAG_ASYNC_BIND = 'async-bind';
	var lang = require('lang/$G_LANGUAGE');

	var top_win;
	try {
		top_win = parent;
	} catch(ex){}
	top_win = top_win || window;

	/**
	 * 显示信息
	 * @param message
	 * @param type
	 * @param time
	 */
	var showMsg = function(message, type, time){
		type = type || 'err';
		require.async('ywj/msg', function(Msg){
			Msg.show(message, type, time || (type == 'err' ? MSG_ERROR_SHOW_TIME : MSG_SUCCESS_SHOW_TIME));
		});
	};

	/**
	 * 隐藏信息
	 */
	var hideMsg = function(){
		require.async('ywj/msg', function(Msg){
			Msg.hide();
		});
	};

	/**
	 * 自动处理后台返回结果
	 * @param node
	 * @param rsp
	 * @param param
	 */
	var auto_process_async = function(node, rsp, param){
		var onrsp = node.attr('onresponse') || param.onresponse;
		var onsucc = node.attr('onsuccess') || param.onsuccess;
		var onerr = node.attr('onerror') || param.onerror;
		rsp = rsp || {};
		rsp.message = rsp.message || lang('系统繁忙，请稍后(-1)');
		rsp.message = lang(rsp.message);
		rsp.code = rsp.code === undefined ? -1 : rsp.code;
		rsp.node = node;
		console.log('RSP:', rsp);

		if(onrsp){
			eval('var fn = window.'+onrsp+';');
			fn.call(null, rsp);
		}

		//specify success handler
		else if(onsucc && rsp.code == 0){
			showMsg(rsp.message,'succ');
			setTimeout(function(){
				eval('var fn = window.'+onsucc+';');
				fn.call(null, rsp);
			}, MSG_SUCCESS_SHOW_TIME*1000);
		}

		//specify error handler
		else if(onerr && rsp.code != 0){
			showMsg(rsp.message,'err');
			setTimeout(function(){
				eval('var fn = window.'+onerr+';');
				fn.call(null, rsp);
			}, MSG_SUCCESS_SHOW_TIME*1000);
		}

		//reload page on success
		else {
			showMsg(rsp.message, rsp.code ? 'err' : 'succ');
			if(rsp.code == 0){
				setTimeout(function(){
					if(rsp.jump_url){
						top_win.location.href = rsp.jump_url;
					} else {
						top_win.location.reload();
					}
				}, MSG_SUCCESS_SHOW_TIME*1000);
			}
		}
	};

	return {
		nodeInit: function($form, param){
			if($form.attr('target') || !$form.attr('action')){
				return;
			}

			var $submit_btn = $form.find('input.btn[type=submit]:first');
			$form.find('input.btn[type=submit]').click(function(){
				$submit_btn = $(this);
			});
			$form.on('submit', function(){
				if($form.data(FLAG_SUBMITTING)){
					hideMsg();
					if(!$submit_btn.hasClass(BTN_LOADING_CLASS)){
						showMsg(lang('正在提交数据，请稍侯...'), 'load', MSG_LOAD_TIME);
					}
					return false;
				}

				//追加额外数据结构
				if(!$form.data(FLAG_ASYNC_BIND)){
					if(!$form.attr('method') || $form.attr('method').toLowerCase() == 'get'){
						$('<input type="hidden" name="ref" value="formsender" />').appendTo($form);
					} else {
						$form.attr('action', Net.mergeCgiUri($form.attr('action'), {ref: 'formsender'}));
					}
					$form.data(FLAG_ASYNC_BIND, 1);
				}

				var frameId = 'FormSubmitIframe'+ Util.guid();
				var span = document.createElement('span');
				span.innerHTML = '<iframe id="'+frameId+'" name="'+frameId+'" style="display:none"></iframe>';
				document.body.appendChild(span);
				var frame = document.getElementById(frameId);
				var _response = false;
				frame.onload = function(){
					if(!_response){
						$submit_btn.removeClass(BTN_LOADING_CLASS);
						_response = true;
						//防手抖
						setTimeout(function(){$form.removeData(FLAG_SUBMITTING);}, 100);
						hideMsg();
						$(frame).parent().remove(); //避免webkit核心后退键重新提交数据
						auto_process_async($form, {code:1, data:{}, message:lang('数据错误，请联系系统管理员')}, param);
					}
				};
				frame._callback = function(rsp){
					$submit_btn.removeClass(BTN_LOADING_CLASS);
					_response = true;
					//防手抖
					setTimeout(function(){$form.removeData(FLAG_SUBMITTING);}, 100);
					hideMsg();
					$(frame).parent().remove(); //避免webkit核心后退键重新提交数据
					auto_process_async($form, rsp, param);
				};
				$form.attr('target', frameId);
				$form.data(FLAG_SUBMITTING, '1');
				$submit_btn.addClass(BTN_LOADING_CLASS);

				//1.5秒之后显示loading效果
				if(!$submit_btn.size()){
					setTimeout(function(){
						if(!_response){
							showMsg(lang('正在提交请求...'), 'load', MSG_LOAD_TIME);
						}
					}, 1500);
				}
			});
		},

		nodeClick: function($link, param){
			var SUBMITTING_KEY = 'data-submitting-flag';
			var url = $link.attr('href');
			var data = param.data || null;
			var method = param.method || 'get';
			var timeout = param.timeout;
			if($link.attr(SUBMITTING_KEY) == 1){
				if(!$link.hasClass('btn')){
					showMsg(lang('正在提交请求...'), 'load', MSG_LOAD_TIME);
				}
				return false;
			}
			if(url){
				$link.attr(SUBMITTING_KEY, 1);
				showMsg(lang('正在提交请求...'), 'load', MSG_LOAD_TIME);
				if($link.hasClass('btn')){
					$link.addClass(BTN_LOADING_CLASS);
				}

				var opt = {
					method: method,
					onSuccess: function(rsp){
						$link.removeClass(BTN_LOADING_CLASS);
						$link.attr(SUBMITTING_KEY, 0);
						hideMsg();
						auto_process_async($link, rsp, param);
					},
					onError: function(){
						$link.removeClass(BTN_LOADING_CLASS);
						$link.attr(SUBMITTING_KEY, 0);
					}
				};
				if(timeout !== undefined){
					opt.timeout = parseInt(timeout, 10)*1000;
				}
				Net.request(url, data, opt);
				return false;
			}
		}
	}
});
//../src/component/auto.js
define('ywj/auto', function(require){
	var lang = require('lang/$G_LANGUAGE');
	var $ = require('jquery');

	/**
	 * 绑定事件
	 */
	var bindEvent = function(){
		var $body = $('body');

		//select placeholder 效果
		(function(){
			var patch_select_title = function($sel, empty){
				if(empty){
					$sel.removeAttr('title');
				} else {
					$sel.attr('title', $sel.children().first().text());
				}
			};
			var update_select_holder = function($sel){
				if(!$sel[0].options.length || $sel[0].selectedIndex < 0){
					return;
				}
				var val = $sel[0].options[$sel[0].selectedIndex].getAttribute('value');
				var empty = val === '' || val === null;
				$sel.attr('placeholder', empty ? 'valid' : 'invalid');
				patch_select_title($sel, empty);
			};
			$('select[placeholder]').change(function(){
				update_select_holder($(this));
			}).each(function(){
				update_select_holder($(this));
			});
		})();

		//表格操作
		(function(){
			$body.delegate('*[rel=row-delete-btn]', 'click', function(){
				var row = $(this).parentsUntil('tr').parent();
				var allow_empty=$(this).data("allow-empty") || false;
				require.async('ywj/table', function(T){
					T.deleteRow(row,allow_empty);
				});
			});

			$body.delegate('*[rel=row-up-btn]', 'click', function(){
				var row = $(this).parentsUntil('tr').parent();
				require.async('ywj/table', function(T){
					T.moveUpRow(row);
				});
			});

			$body.delegate('*[rel=row-down-btn]', 'click', function(){
				var row = $(this).parentsUntil('tr').parent();
				require.async('ywj/table', function(T){
					T.moveDownRow(row);
				});
			});

			$body.delegate('*[rel=row-append-btn]', 'click', function(e){
				var $table = $(this).closest('table');
				var $tbl = $('tbody', $table).eq(0);
				var tpl = $(this).data('tpl');
				require.async('ywj/table', function(T){
					T.appendRow($('#'+tpl).text(), $tbl);
				});
				e.stopPropagation();
			});
		})();

		//日期组件预加载
		if($('input.date-time-txt:not([data-component])').size() || $('input.date-txt:not([data-component])').size()){
			require.async('ywj/timepicker', function(){
				var $dt = $('input.date-time-txt:not([data-component])');
				var $d = $('input.date-txt:not([data-component])');
				$dt.datetimepicker({
					dateFormat: 'yy-mm-dd',
					timeFormat: 'HH:mm:ss'
				});
				$d.datepicker({
					dateFormat: 'yy-mm-dd'
				});
				$dt.data('date-widget-loaded', 1);
				$d.data('date-widget-loaded', 1);
			});
		}

		$.each(['input.date-time-txt:not([data-component])', 'input.date-txt:not([data-component])'], function(idx, s){
			if($(s).size()){
				require.async('ywj/timepicker', function(){
					var opt = {dateFormat: 'yy-mm-dd'};
					if(s.indexOf('time') >= 0){
						opt.timeFormat = 'HH:mm:ss'
					}
					$(s).datetimepicker(opt);
					$(s).data('date-widget-loaded', 1);
				});
			}
			$body.delegate(s, 'click', function(){
				if(!$(this).data('date-widget-loaded')){
					var _this = this;
					require.async('ywj/timepicker', function(){
						var opt = {dateFormat: 'yy-mm-dd'};
						if(s.indexOf('time') >= 0){
							opt.timeFormat = 'HH:mm:ss'
						}
						$(_this).datetimepicker(opt);
						$(_this).data('date-widget-loaded', 1);
						$(_this).trigger('click');
					});
				}
			});
		});
	};

	/**
	 * 处理器
	 * 里面的处理逻辑都需要做好去重
	 */
	var handler = function(){
		//表格空值填充
		$('table[data-empty-fill]').each(function(){
			var empty = $('tbody td', this).size() == 0 || $('td', this).size() == $('thead td').size();
			if(empty){
				var cs = Math.max($('tr>td', this).size(),$('tr>th', this).size());
				var con = $('tbody', this).size() ? $('tbody', this) : $(this);
				$('<tr class="row-empty"><td colspan="'+(cs || 1)+'"><div class="data-empty"> '+lang("无数据")+'</div></td></tr>').appendTo(con);
			}
		});

		//表单自动将get参数写到隐藏域中
		$('form').each(function(){
			var action = this.getAttribute('action');
			if($(this).data('form-get-fixed') || !action){
				return;
			}
			$(this).data('form-get-fixed', 1);

			if(!this.method || (this.method.toLowerCase() == 'get' && action.indexOf('?') >= 0)){
				var query_str = action.substring(action.lastIndexOf("?")+1, action.length);
				var query_arr = query_str.split('&');
				for(var i=0;i<query_arr.length;i++){
					var tmp = query_arr[i].split('=');
					$(this).prepend('<input name="'+escape(decodeURIComponent(tmp[0]))+'" type="hidden" value="'+escape(decodeURIComponent(tmp[1]))+'" />');
				}
			}
		});
	};

	$(function(){
		bindEvent();
		handler();
	});
});
//../src/component/autocomplete.js
/**
 * 自动完成输入框
 * CGI返回格式：{code:0, message, data:[{title:'标题', value:'值', disabled:true},...]}
 * 组件会考量required、strict参数
 */
define('ywj/autocomplete', function(require){
	require('ywj/resource/autocomplete.css');
	var $ = require('jquery');
	require('jquery/highlight');
	var Util = require('ywj/util');
	var Net = require('ywj/net');

	var PANEL_CLASS = 'ywj-autocomplete-panel';
	var PANEL_ERROR_CLASS = 'ywj-autocomplete-panel-error';
	var PANEL_SUCCESS_CLASS = 'ywj-autocomplete-panel-success';
	var PANEL_LOADING_CLASS = 'ywj-autocomplete-panel-loading';
	var INPUT_LOADING = 'ywj-autocomplete-input-loading';
	var INPUT_MISS_MATCH = 'ywj-autocomplete-input-miss-match';
	var PANEL_ITEM_FOCUS_CLASS = 'ywj-autocomplete-item-focus';
	var PANEL_ITEM_DISABLED_CLASS = 'ywj-autocomplete-item-disabled';

	return {
		/**
		 * 节点初始化
		 * @param $node 支持Input、Select两种节点
		 * @param param
		 */
		nodeInit: function($node, param){
			if($node.attr('readonly') || $node.attr('disabled')){
				return;
			}
			if(!param.source){
				console.warn('No cgi source found using autocomplete component');
				return;
			}
			if($node[0].tagName == 'INPUT'){
				$node.attr('autocomplete', 'off');
			}
			var onselect = param.onselect || function(){};
			if(Util.isString(onselect)){
				onselect = window[onselect];
			}

			//默认严格模式
			var IS_SELECT = $node[0].tagName == 'SELECT';
			var strict = param.strict === undefined ? true : !!param.strict;
			var required = $node.attr('required');
			var disabled = $node.attr('disabled');
			var css_class = $node.attr('class') || '';

			var get_node_text = function($node){
				return IS_SELECT ? $node.find('option:selected').text() : $node.val();
			};

			var set_node_data = function(value, title){
				return IS_SELECT ? $node.html('<option value="'+Util.htmlEscape(value)+'">'+Util.htmlEscape(title)+'</option>') : $node.val(value);
			};

			var $shadow_inp = $node;
			if(strict){
				disabled = disabled ? 'disabled="' + disabled + '"' : '';
				$shadow_inp = $('<input type="text" value="'+get_node_text($node)+'" '+disabled+' class="'+css_class+'" placeholder="'+($node.attr('placeholder') || '')+'">').insertBefore($node);
				$node.css({
					transition: 'none',
					position: 'absolute',
					width: 0,
					height:0,
					padding:0,
					left: $shadow_inp.offset().left + $shadow_inp.outerWidth()/2,
					top: $shadow_inp.offset().top + $shadow_inp.outerHeight(),
					opacity: 0
				});

				$node.change(function(){
					$shadow_inp.val(get_node_text($node));
				});

				$shadow_inp.blur(function(){
					$node.trigger('blur');
				});
			}

			var _stop_load_ = false;
			$shadow_inp.on('keydown keyup change mouseup', function(e){
				if(is_node_disabled()){
					return;
				}
				if(e.keyCode == Util.KEYS.UP){
					move_cursor(true);
					return false;
				}else if(e.keyCode == Util.KEYS.DOWN){
					move_cursor();
					return false;
				}else if(e.keyCode == Util.KEYS.ENTER){
					if($PANEL.is(':visible') && $PANEL.find('.'+PANEL_ITEM_FOCUS_CLASS).size()){
						if(select_item($PANEL.find('.'+PANEL_ITEM_FOCUS_CLASS), true)){
							hide_panel();
							_stop_load_ = true;
							setTimeout(function(){
								_stop_load_ = false;
							}, 100);
						}
						return false;
					}
				} else {
					if(!_stop_load_){
						load_data($shadow_inp.val());
					}
				}
				if(!strict){
					$node.val($shadow_inp.val());
				}
			});

			var LAST_DATA = [];
			var $PANEL;
			var create_panel = function(){
				if(!$PANEL){
					$PANEL = $('<dl class="'+PANEL_CLASS+'"><dt></dt></dl>').appendTo('body').css({
						width: $shadow_inp.outerWidth()
					});
					$PANEL.delegate('dd', 'mousedown', function(){
						if(select_item($(this), true)){
							hide_panel();
						}
					});
					$('body').click(function(e){
						var tag = e.target;
						if(tag == $shadow_inp[0] || $.contains($PANEL[0], tag) || $PANEL[0] == tag){
							//hits
						} else {
							if($PANEL.is(':visible') && select_item($PANEL.find('.'+PANEL_ITEM_FOCUS_CLASS), true)){
								hide_panel();
							}
						}
					});
				}
				$PANEL.html('')
					.show()
					.removeClass(PANEL_LOADING_CLASS)
					.removeClass(PANEL_SUCCESS_CLASS)
					.removeClass(PANEL_ERROR_CLASS)
					.html('')
					.css({
						left: $shadow_inp.offset().left,
						top: $shadow_inp.offset().top + $shadow_inp.outerHeight()
					});
				$shadow_inp.removeClass(INPUT_LOADING).removeClass(INPUT_MISS_MATCH);
			};

			/**
			 * 方向键移动
			 * @param up_dir
			 */
			var _mc_tm;
			var move_cursor = function(up_dir){
				var idx = $PANEL.find('.'+PANEL_ITEM_FOCUS_CLASS).index()-1;
				var size = $PANEL.find('dd').size();
				$PANEL.find('dd').removeClass(PANEL_ITEM_FOCUS_CLASS);
				var tag = 0;
				if(up_dir){
					tag = idx > 0 ? idx - 1 : size-1;
				} else {
					tag = idx >= (size-1) ? 0 : idx + 1;
				}
				var $dd = $PANEL.find('dd').eq(tag);
				$dd.addClass(PANEL_ITEM_FOCUS_CLASS);
				select_item($dd);

				clearTimeout(_mc_tm);
				_stop_load_ = true;
				_mc_tm = setTimeout(function(){
					_stop_load_ = false;
				}, 500);
			};

			/**
			 * 推送选择项
			 * @param $dd
			 * @param clear
			 */
			var select_item = function($dd, clear){
				clearTimeout(_mc_tm);
				_stop_load_ = true;
				_mc_tm = setTimeout(function(){
					_stop_load_ = false;
				}, 500);

				if(!$dd.size()){
					return false;
				}
				var data = LAST_DATA[$dd.index()-1];
				if(data.disabled){
					console.debug('data disabled', data);
					return false;
				}

				$shadow_inp.val(data.title);
				set_node_data(data.value, data.title);
				onselect(data, $node);

				//avoid trigger body click event, cause flush again.
				if(clear){
					$PANEL.find('dd').removeClass(PANEL_ITEM_FOCUS_CLASS);
				}
				return true;
			};

			var show_panel = function(list, message, error){
				if(is_node_disabled()){
					return;
				}
				create_panel();
				if(error){
					$PANEL.addClass(PANEL_ERROR_CLASS).html('<dt>'+Util.htmlEscape(message)+'</dt>');
				} else {
					LAST_DATA = list;
					if(!LAST_DATA || !LAST_DATA.length){
						show_empty();
					} else {
						var html = '<dt>'+Util.htmlEscape(message)+'</dt>';
						for(var i=0; i<list.length; i++){
							html += '<dd '+(list[i].disabled ? '' : 'tabindex="0"')+' class="'+(list[i].disabled ? PANEL_ITEM_DISABLED_CLASS : '')+'">';
							html += Util.htmlEscape(list[i].title);
							html += '</dd>';
						}
						$PANEL.addClass(PANEL_SUCCESS_CLASS).html(html);
						$PANEL.find('dd').eq(0).addClass(PANEL_ITEM_FOCUS_CLASS);
						$PANEL.find('dd').highlight($.trim($shadow_inp.val()));
					}
				}
			};

			var show_empty = function(){
				create_panel();
				$PANEL.addClass(PANEL_ERROR_CLASS).html('<dt>没有匹配结果</dt>');
				if(strict){
					$shadow_inp.addClass(INPUT_MISS_MATCH);
				}
			};

			var is_node_disabled = function(){
				return $node.attr('readonly') || $node.attr('disabled');
			};

			var show_loading = function(){
				create_panel();
				$PANEL.addClass(PANEL_LOADING_CLASS).html('<dt>loading...</dt>');
				$shadow_inp.addClass(INPUT_LOADING);
			};

			var hide_panel = function(){
				$PANEL && $PANEL.hide();
				$shadow_inp.removeClass(INPUT_LOADING);
			};

			//前端缓存
			var CACHE_MAP = {};
			var tm = null;
			var load_data = function(keyword){
				clearTimeout(tm);
				keyword = $.trim(keyword);
				if(!keyword){
					hide_panel();
					return;
				}
				var cb = function(rsp){
					if(rsp.code == 0){
						show_panel(rsp.data, rsp.message);
					} else {
						show_panel(null, rsp.message, true);
					}
					CACHE_MAP[keyword] = rsp;
				};
				if(CACHE_MAP[keyword]){
					cb(CACHE_MAP[keyword]);
					return;
				}
				show_loading();
				tm = setTimeout(function(){
					Net.get(param.source, {keyword:keyword}, cb, {frontCache: true});
				}, 200);
			};
		}
	};
});
//../src/component/AutoComponent.js
/**
 * Created by Administrator on 2016/6/12.
 */
define('ywj/AutoComponent', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');
	var COMPONENT_FLAG_KEY = 'component';
	var COMPONENT_BIND_FLAG_KEY = 'component-init-bind';
	var SUPPORT_EVENTS = 'click mousedown mouseup keydown keyup';
	var DEFAULT_NS = 'ywj';
	var INIT_COMPLETED = false;
	var INIT_CALLBACK = [];

	var parseComponents = function(attr){
		var tmp = attr.split(',');
		var cs = [];

		$.each(tmp, function(k, v){
			v = $.trim(v);
			if(v){
				if(v.indexOf('/') >= 0){
					cs.push(v);
				} else {
					cs.push(DEFAULT_NS+'/'+v);
				}
			}
		});
		return cs;
	};

	/**
	 * 检测节点是否拥有组件
	 * @param $node
	 * @param component_name
	 * @returns {*}
	 */
	var nodeHasComponent = function($node, component_name){
		var cs = parseComponents($node.data(COMPONENT_FLAG_KEY));
		return Util.inArray(component_name, cs);
	};

	/**
	 * 获取节点所有组件参数
	 * @param $node
	 * @returns {{}}
	 */
	var getDataParam = function($node){
		var param = {};
		for(var i=0; i<$node[0].attributes.length; i++){
			var attr = $node[0].attributes[i];
			if(attr.name.indexOf('data-') == 0){
				var data_str = attr.name.replace(/^data\-/i, '');
				if(data_str.indexOf('-') > 0){
					var component_name = data_str.substring(0, data_str.indexOf('-'));
					component_name = component_name.replace(/_/, '/');
					if(!param[component_name]){
						param[component_name] = {};
					}
					var key = data_str.substring(data_str.indexOf('-')+1);
					param[component_name][key] = attr.value;
				} else {
					param[data_str] = attr.value;
				}
			}
		}
		return param;
	};

	/**
	 * 根据组件名称获取参数
	 * @param $node
	 * @param component_name
	 */
	var getDataParamByComponent = function($node, component_name){
		var all = getDataParam($node);
		var c = component_name.replace(new RegExp('^'+DEFAULT_NS+'/'),'').toLowerCase();
		return all[c] || {};
	};

	/**
	 * 优先绑定jQuery事件
	 * @param $node
	 * @param event
	 * @param handler
	 */
	var bindUp = function($node, event, handler){
		$node.bind(event, handler);
		return;
		event = event.split(/\s+/);
		$node.each(function(){
			var len = event.length;
			while(len -- ){
				$node.bind(event[len], handler);
				var evts = $._data($node[0], 'events')[event[len]];
				evts.splice(0, 0, evts.pop());
			}
		})
	};

	$(document).ready(function(){
		//使用异步，一定程度可以缓解data-component组件如果在调用AutoComponent组件方法的时候，
		//出现的互相嵌套等待的情况，但是这种情况是没太好的办法解耦。
		setTimeout(function(){
			var $body = $('body');
			var _LS = {};
			var bindNode = function(){
				$('[data-'+COMPONENT_FLAG_KEY+']').each(function(){
					var $node = $(this);
					if($node.data(COMPONENT_BIND_FLAG_KEY)){
						return;
					}
					$node.data(COMPONENT_BIND_FLAG_KEY, 1);
					var all_data = getDataParam($node);
					var cs = parseComponents($node.data(COMPONENT_FLAG_KEY));
					if(!_LS[cs]){
						console.debug('%cLoad COM: '+cs.join(','), 'color:green');
						_LS[cs] = true;
					}
					require.async(cs, function(){
						var args = arguments;
						for(var i=0; i<cs.length; i++){
							var c = cs[i].replace(new RegExp('^'+DEFAULT_NS+'/'),'');
							if(!args[i]){
								continue;
							}
							if(Util.isFunction(args[i].nodeInit)){
								args[i].nodeInit($node, all_data[c.toLowerCase()] || {});
							}
						}
						bindUp($node, SUPPORT_EVENTS, function(e){
							var all_data = getDataParam($node);
							var ev = e.type;
							var method = 'node'+ev[0].toUpperCase()+ev.slice(1);
							for(var i=0; i<cs.length; i++){
								if(!args[i]){
									continue;
								}
								var c = cs[i].replace(new RegExp('^'+DEFAULT_NS+'/'),'');
								var param = all_data[c] || all_data[c.toLowerCase()] || {};
								if(Util.isFunction(args[i][method])){
									if(args[i][method]($node, param) === false){
										e.stopImmediatePropagation(); //stop other jQuery event binding
										e.preventDefault();
										return false;
									}
								}
							}
						});
					});
				});
			};

			var m_tm = null;
			$body.on('DOMSubtreeModified propertychange', function() {
				clearTimeout(m_tm);
				m_tm = setTimeout(function(){bindNode();}, 100);
			});
			bindNode();

			INIT_COMPLETED = true;
			$.each(INIT_CALLBACK, function(k, v){
				v();
			});
		}, 0);
	});

	return {
		parseComponents: parseComponents,
		nodeHasComponent: nodeHasComponent,
		getDataParamByComponent: getDataParamByComponent,
		initComplete: function(callback){
			if(INIT_COMPLETED){
				callback();
			}else{
				INIT_CALLBACK.push(callback);
			}
		}
	};
});
//../src/component/autoresize.js
define('ywj/autoresize', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');

	return {
		nodeInit: function($text, param){
			var OFFSET = 5;
			$text.css({
				'overflow': 'hidden',
				'resize': 'none',
				'min-height': $text.height()
			});
			var $shadow = $('<div style="display:none;">').appendTo('body');
			$.each(['white-space', 'width', 'min-height', 'min-width', 'font-family', 'font-size', 'line-height', 'padding', 'word-wrap'], function(k, css_pro){
				$shadow.css(css_pro, $text.css(css_pro));
			});

			var es = 'change keydown keyup cut paste drop'.split(' ');
			for(var i = 0; i < es.length; i++){
				$text.on(es[i], function(){
					var html = Util.htmlEscape($text.val() || ' ');
					html = html
						.replace(/\n$/, '<br/>&nbsp;')
						.replace(/\n/g, '<br/>')
						.replace(/\s/g, '&nbsp;')
						.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
					console.debug('Resolve resize html', html);
					$shadow.html(html);
					$text.stop().animate({
						height:$shadow.height()+OFFSET
					}, 'fast', function(){
						console.debug('resize done');
					});
				})
			}
		}
	}
});
//../src/component/Base64.js
/**
 * Created by sasumi on 2014/12/2.
 */
define('ywj/Base64', function(){
	var KEY_STR = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var utf8_decode = function(e){
		var t = "";
		var n = 0;
		var r = c1 = c2 = 0;
		while(n < e.length){
			r = e.charCodeAt(n);
			if(r < 128){
				t += String.fromCharCode(r);
				n++
			}else if(r > 191 && r < 224){
				c2 = e.charCodeAt(n + 1);
				t += String.fromCharCode((r & 31) << 6 | c2 & 63);
				n += 2
			}else{
				c2 = e.charCodeAt(n + 1);
				c3 = e.charCodeAt(n + 2);
				t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
				n += 3
			}
		}
		return t
	};

	var utf8_encode = function(e){
		e = e.replace(/\r\n/g, "n");
		var t = "";
		for(var n = 0; n < e.length; n++){
			var r = e.charCodeAt(n);
			if(r < 128){
				t += String.fromCharCode(r)
			}else if(r > 127 && r < 2048){
				t += String.fromCharCode(r >> 6 | 192);
				t += String.fromCharCode(r & 63 | 128)
			}else{
				t += String.fromCharCode(r >> 12 | 224);
				t += String.fromCharCode(r >> 6 & 63 | 128);
				t += String.fromCharCode(r & 63 | 128)
			}
		}
		return t;
	};

	var Base64 = {
		urlSafeEncode: function(text){
			return Base64.encode(text)
				.replace('+', '-')
				.replace('/', '_');
		},

		encode: function(text){
			var t = "";
			var n, r, i, s, o, u, a;
			var f = 0;
			text = utf8_encode(text);
			while(f < text.length){
				n = text.charCodeAt(f++);
				r = text.charCodeAt(f++);
				i = text.charCodeAt(f++);
				s = n >> 2;
				o = (n & 3) << 4 | r >> 4;
				u = (r & 15) << 2 | i >> 6;
				a = i & 63;
				if(isNaN(r)){
					u = a = 64
				}else if(isNaN(i)){
					a = 64
				}
				t = t + KEY_STR.charAt(s) + KEY_STR.charAt(o) + KEY_STR.charAt(u) + KEY_STR.charAt(a)
			}
			return t
		},
		decode: function(text){
			var t = "";
			var n, r, i;
			var s, o, u, a;
			var f = 0;
			text = text.replace(/++[++^A-Za-z0-9+/=]/g, "");
			while(f < text.length){
				s = KEY_STR.indexOf(text.charAt(f++));
				o = KEY_STR.indexOf(text.charAt(f++));
				u = KEY_STR.indexOf(text.charAt(f++));
				a = KEY_STR.indexOf(text.charAt(f++));
				n = s << 2 | o >> 4;
				r = (o & 15) << 4 | u >> 2;
				i = (u & 3) << 6 | a;
				t = t + String.fromCharCode(n);
				if(u != 64){
					t = t + String.fromCharCode(r)
				}
				if(a != 64){
					t = t + String.fromCharCode(i)
				}
			}
			t = utf8_decode(t);
			return t
		},
	};

	return Base64;
});
//../src/component/batchuploader.js
/**
 * Created by Administrator on 2016/5/6.
 */
define('ywj/batchuploader', function(require){
	var console = window['console'];

	require('ywj/resource/batchuploader.css');
	var $ = require('jquery');
	var Util = require('ywj/util');
	var UP = require('ywj/uploader');

	var DRAG_ENTER_CLASS = 'batch-uploader-drag-enter';
	var UP_CONFIG = {
		UPLOAD_URL: window['UPLOAD_URL'],
		PROGRESS_URL: window['UPLOAD_PROGRESS_URL']
	};

	var delete_btn_html = '<span class="batch-uploader-delete-btn"></span>';
	var new_tab_html =
		'<li class="batch-uploader-add-new">'+
		'<label><input type="file" name="files[]" multiple="multiple"/>'+delete_btn_html+
		'<span class="batch-uploader-add-new-btn"></span>'+
		'</label></li>';

	var on_item_uploading = function(u, percent){
		this.onItemUploading(u, percent);
	};

	var on_item_success = function(u, message, rsp){
		this.onItemSuccess(u, message, rsp);
	};

	var on_item_error = function(u, message){
		this.onItemError(u, message);
	};

	var on_item_abort = function(u){
		this.onItemAbort(u);
	};

	var on_item_delete = function(u){
		this.onItemDelete(u);
	};

	var on_item_start = function(u){
		this.onItemStart(u);
	};

	/**
	 * add new uploader instance
	 * @param bu_scope
	 * @param value
	 * @param src
	 * @param thumb
	 * @returns {*}
	 */
	var add_new = function(bu_scope, value, src, thumb){
		value = value || '';
		src = src || '';
		thumb = thumb || '';
		var $container = bu_scope.container;
		var name = $container.data('name');
		var param = $container.data('param');
		var $new = $('<li>'+delete_btn_html+'<input type="hidden" name="'+name+'" value="'+value+'" data-thumb="'+thumb+'" data-src="'+src+'" data-param="'+param+'"></li>')
			.insertBefore($container.find('.batch-uploader-add-new'));
		var $inp = $new.find('input');
		var u = new UP($inp, bu_scope.param);
		bind_interface(u, bu_scope);
		$new.attr('id',u.id);
		return u;
	};

	var bind_interface = function(instance, bu_scope){
		$.each({
			'onUploading': function(){
				var args = Util.toArray(arguments);
				args.unshift(instance);
				return on_item_uploading.apply(bu_scope, args);
			},
			'onSuccess': function(){
				var args = Util.toArray(arguments);
				args.unshift(instance);
				return on_item_success.apply(bu_scope, args);
			},
			'onError': function(){
				var args = Util.toArray(arguments);
				args.unshift(instance);
				return on_item_error.apply(bu_scope, args);
			},
			'onAbort': function(){
				var args = Util.toArray(arguments);
				args.unshift(instance);
				return on_item_abort.apply(bu_scope, args);
			},
			'onStart': function(){
				var args = Util.toArray(arguments);
				args.unshift(instance);
				return on_item_start.apply(bu_scope, args);
			},
			'onDelete': function(){
				var args = Util.toArray(arguments);
				args.unshift(instance);
				return on_item_delete.apply(bu_scope, args);
			}
		}, function(k, v){
			instance[k] = v;
		});
	};

	var stop_default = function(e){
		console.log('stop default', e.type);
		e.stopPropagation();
		e.preventDefault();
	};

	var traverse_file_tree = function(file_callback, item, path){
		path = path || "";
		if(item.isFile){
			item.file(function(file){
				file_callback(file, path);
			});
		}else if(item.isDirectory){
			// Get folder contents
			var dirReader = item.createReader();
			dirReader.readEntries(function(entries){
				for(var i = 0; i < entries.length; i++){
					traverse_file_tree(file_callback, entries[i], path + item.name + "/");
				}
			});
		}
	};

	var BU = function(sel, param){
		this.param = $.extend({}, UP_CONFIG, param, {
			TYPE: UP.TYPE_IMAGE
		});

		var $container = $(sel);
		var $list = $("<ul>").appendTo($container);

		//multiple file upload require file name specified
		if(!$container.data('name')){
			$container.data('name', 'random_file_names_'+(Math.random()+'').replace(/^D/, '')+'[]');
		}

		var _this = this;
		$container.find('input').each(function(){
			var $inp = $(this);
			var $li = $('<li>'+delete_btn_html+'</li>').appendTo($list);
			$inp.appendTo($li);
			bind_interface(new UP($inp, _this.param), _this);
		});

		var $new_tab = $(new_tab_html).appendTo($list);
		$new_tab.find('input[type=file]').change(function(){
			for(var i=0; i<this.files.length; i++){
				var u = add_new(_this);
				var formData = new FormData();
				formData.append(this.name, this.files[i]);
				u.send(formData);
			}

			//重置file为空，避免选择相同图片不能触发change事件
			$(this).val('');
		});

		$container.delegate('.batch-uploader-delete-btn', 'click', function(){
			$(this).closest('li').remove();
		});

		$container.on('drop', function(e){
			stop_default(e);
			var originalEvent = e.originalEvent;
			var items = originalEvent.dataTransfer.items || [];
			for(var i=0; i<items.length; i++){
				var item = items[i].webkitGetAsEntry();
				if(item){
					traverse_file_tree(function(file, path){
						var u = add_new(_this);
						var formData = new FormData();
						formData.append(path || $container.data('name'), file);
						u.send(formData);
					}, item);
				}
			}
		});

		var ddHighlight = function(){
			$container.addClass(DRAG_ENTER_CLASS);
		};

		var ddDisHighLight = function(){
			$container.removeClass(DRAG_ENTER_CLASS);
		};

		$container.on('dragenter dragleave dragover', stop_default);
		$container.on('dragenter dragover', ddHighlight);
		$container.on('mouseout mouseup dragleave drop',ddDisHighLight);
		this.container = $container;
	};
	BU.prototype.addFormData = function(formData){
		var u = this.addItem();
		u.send(formData);
	};
	BU.prototype.addItem = function(value, src, thumb){
		return add_new(this, value, src, thumb);
	};
	BU.prototype.empty = function(){
		this.container.find('li:not([class=batch-uploader-add-new])').remove();
	};

	BU.prototype.onItemSuccess = function(u, message, rsp){};
	BU.prototype.onItemError = function(u, message){};
	BU.prototype.onItemAbort = function(u){};
	BU.prototype.onItemUploading = function(u,percent){};
	BU.prototype.onItemStart = function(u){};
	BU.prototype.onItemDelete = function(u){};
	BU.prototype.onAllFinish = function(){};
	BU.nodeInit = function($node, param){
		new BU($node, param);
	};
	return BU;
});
//../src/component/checker.js
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
			var quick_check = param.qc;

			//缺省只针对table里面的checkbox有效
			var $chk_list = $('input[type=checkbox]:not([disabled]):not([readonly]):not([data-component])', target || 'table');
			if(!$chk_list.size()){
				$mater_check.attr('disabled', 'disabled');
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
				var $nav = $(s).insertBefore($mater_check);
				$nav.find('.quick-checker-chk').prepend($mater_check).click(function(e){
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
				//show_tip($mater_check);
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
//../src/component/chosen.js
/*!
 Chosen, a Select Box Enhancer for jQuery and Prototype
 by Patrick Filler for Harvest, http://getharvest.com

 Version 1.3.0
 Full source at https://github.com/harvesthq/chosen
 Copyright (c) 2011-2014 Harvest http://getharvest.com

 MIT License, https://github.com/harvesthq/chosen/blob/master/LICENSE.md
 This file is generated by `grunt build`, do not edit it by hand.
 */
define('ywj/chosen', function(require){
	require('ywj/resource/chosen.css');
	var $ = require('jquery');
	var AbstractChosen, Chosen, SelectParser, _ref,
		__hasProp = {}.hasOwnProperty,
		__extends = function(child, parent){
			for(var key in parent){
				if(__hasProp.call(parent, key)) child[key] = parent[key];
			}
			function ctor(){
				this.constructor = child;
			}

			ctor.prototype = parent.prototype;
			child.prototype = new ctor();
			child.__super__ = parent.prototype;
			return child;
		},
		resolvePlaceholder = function(select){
			var placeholder = select.getAttribute("data-placeholder") || select.getAttribute('placeholder');
			if(placeholder){
				return placeholder;
			}

			if(select.options[0].value == ''){
				return select.options[0].innerText;
			}
			return '';
		};

	var htmlEscape = function(text){
		return String(text)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	};

	SelectParser = (function(){
		function SelectParser(){
			this.options_index = 0;
			this.parsed = [];
		}

		SelectParser.prototype.add_node = function(child){
			if(child.nodeName.toUpperCase() === "OPTGROUP"){
				return this.add_group(child);
			}else{
				return this.add_option(child);
			}
		};

		SelectParser.prototype.add_group = function(group){
			var group_position, option, _i, _len, _ref, _results;
			group_position = this.parsed.length;
			this.parsed.push({
				array_index: group_position,
				group: true,
				label: this.escapeExpression(group.label),
				children: 0,
				disabled: group.disabled,
				classes: group.className
			});
			_ref = group.childNodes;
			_results = [];
			for(_i = 0, _len = _ref.length; _i < _len; _i++){
				option = _ref[_i];
				_results.push(this.add_option(option, group_position, group.disabled));
			}
			return _results;
		};

		SelectParser.prototype.add_option = function(option, group_position, group_disabled){
			if(option.nodeName.toUpperCase() === "OPTION"){
				if(option.text !== ""){
					if(group_position != null){
						this.parsed[group_position].children += 1;
					}
					this.parsed.push({
						array_index: this.parsed.length,
						options_index: this.options_index,
						value: option.value,
						text: option.text,
						html: option.innerHTML,
						selected: option.selected,
						disabled: group_disabled === true ? group_disabled : option.disabled,
						group_array_index: group_position,
						classes: option.className,
						style: option.style.cssText
					});
				}else{
					this.parsed.push({
						array_index: this.parsed.length,
						options_index: this.options_index,
						empty: true
					});
				}
				return this.options_index += 1;
			}
		};

		SelectParser.prototype.escapeExpression = function(text){
			var map, unsafe_chars;
			if((text == null) || text === false){
				return "";
			}
			if(!/[\&\<\>\"\'\`]/.test(text)){
				return text;
			}
			map = {
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#x27;",
				"`": "&#x60;"
			};
			unsafe_chars = /&(?!\w+;)|[\<\>\"\'\`]/g;
			return text.replace(unsafe_chars, function(chr){
				return map[chr] || "&amp;";
			});
		};

		return SelectParser;

	})();

	SelectParser.select_to_array = function(select){
		var child, parser, _i, _len, _ref;
		parser = new SelectParser();
		_ref = select.childNodes;
		for(_i = 0, _len = _ref.length; _i < _len; _i++){
			child = _ref[_i];
			parser.add_node(child);
		}
		return parser.parsed;
	};

	AbstractChosen = (function(){
		function AbstractChosen(form_field, options){
			this.form_field = form_field;
			this.options = options != null ? options : {};
			if(!AbstractChosen.browser_is_supported()){
				return;
			}
			this.is_multiple = this.form_field.multiple;
			this.set_default_text();
			this.set_default_values();
			this.setup();
			this.set_up_html();
			this.register_observers();
			this.on_ready();
		}

		AbstractChosen.prototype.set_default_values = function(){
			var _this = this;
			this.click_test_action = function(evt){
				return _this.test_active_click(evt);
			};
			this.activate_action = function(evt){
				return _this.activate_field(evt);
			};
			this.active_field = false;
			this.mouse_on_container = false;
			this.results_showing = false;
			this.result_highlighted = null;
			this.allow_single_deselect = (this.options.allow_single_deselect != null) && (this.form_field.options[0] != null) && this.form_field.options[0].text === "" ? this.options.allow_single_deselect : false;
			this.disable_search_threshold = this.options.disable_search_threshold || 0;
			this.disable_search = this.options.disable_search || false;
			this.enable_split_word_search = this.options.enable_split_word_search != null ? this.options.enable_split_word_search : true;
			this.group_search = this.options.group_search != null ? this.options.group_search : true;
			this.search_contains = this.options.search_contains || true;
			this.single_backstroke_delete = this.options.single_backstroke_delete != null ? this.options.single_backstroke_delete : true;
			this.max_selected_options = this.options.max_selected_options || Infinity;
			this.inherit_select_classes = this.options.inherit_select_classes || false;
			this.display_selected_options = this.options.display_selected_options != null ? this.options.display_selected_options : true;
			return this.display_disabled_options = this.options.display_disabled_options != null ? this.options.display_disabled_options : true;
		};

		AbstractChosen.prototype.set_default_text = function(){
			var placeholder = resolvePlaceholder(this.form_field);
			if(placeholder){
				this.default_text = placeholder;
			}else if(this.is_multiple){
				this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || AbstractChosen.default_multiple_text;
			}else{
				this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || AbstractChosen.default_single_text;
			}
			return this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || AbstractChosen.default_no_result_text;
		};

		AbstractChosen.prototype.mouse_enter = function(){
			return this.mouse_on_container = true;
		};

		AbstractChosen.prototype.mouse_leave = function(){
			return this.mouse_on_container = false;
		};

		AbstractChosen.prototype.input_focus = function(evt){
			var _this = this;
			if(this.is_multiple){
				if(!this.active_field){
					return setTimeout((function(){
						return _this.container_mousedown();
					}), 50);
				}
			}else{
				if(!this.active_field){
					return this.activate_field();
				}
			}
		};

		AbstractChosen.prototype.input_blur = function(evt){
			var _this = this;
			if(!this.mouse_on_container){
				this.active_field = false;
				return setTimeout((function(){
					return _this.blur_test();
				}), 100);
			}
		};

		AbstractChosen.prototype.results_option_build = function(options){
			var content, data, _i, _len, _ref;
			content = '';
			_ref = this.results_data;
			for(_i = 0, _len = _ref.length; _i < _len; _i++){
				data = _ref[_i];
				if(data.group){
					content += this.result_add_group(data);
				}else{
					content += this.result_add_option(data);
				}
				if(options != null ? options.first : void 0){
					if(data.selected && this.is_multiple){
						this.choice_build(data);
					}else if(data.selected && !this.is_multiple){
						this.single_set_selected_text(data.text);
					}
				}
			}
			return content;
		};

		AbstractChosen.prototype.result_add_option = function(option){
			var classes, option_el;
			if(!option.search_match){
				return '';
			}
			if(!this.include_option_in_results(option)){
				return '';
			}
			classes = [];
			if(!option.disabled && !(option.selected && this.is_multiple)){
				classes.push("active-result");
			}
			if(option.disabled && !(option.selected && this.is_multiple)){
				classes.push("disabled-result");
			}
			if(option.selected){
				classes.push("result-selected");
			}
			if(option.group_array_index != null){
				classes.push("group-option");
			}
			if(option.classes !== ""){
				classes.push(option.classes);
			}
			option_el = document.createElement("li");
			option_el.className = classes.join(" ");
			option_el.style.cssText = option.style;
			option_el.setAttribute("data-option-array-index", option.array_index);
			option_el.innerHTML = option.search_text;
			return this.outerHTML(option_el);
		};

		AbstractChosen.prototype.result_add_group = function(group){
			var classes, group_el;
			if(!(group.search_match || group.group_match)){
				return '';
			}
			if(!(group.active_options > 0)){
				return '';
			}
			classes = [];
			classes.push("group-result");
			if(group.classes){
				classes.push(group.classes);
			}
			group_el = document.createElement("li");
			group_el.className = classes.join(" ");
			group_el.innerHTML = group.search_text;
			return this.outerHTML(group_el);
		};

		AbstractChosen.prototype.results_update_field = function(){
			this.set_default_text();
			if(!this.is_multiple){
				this.results_reset_cleanup();
			}
			this.result_clear_highlight();
			this.results_build();
			if(this.results_showing){
				return this.winnow_results();
			}
		};

		AbstractChosen.prototype.reset_single_select_options = function(){
			var result, _i, _len, _ref, _results;
			_ref = this.results_data;
			_results = [];
			for(_i = 0, _len = _ref.length; _i < _len; _i++){
				result = _ref[_i];
				if(result.selected){
					_results.push(result.selected = false);
				}else{
					_results.push(void 0);
				}
			}
			return _results;
		};

		AbstractChosen.prototype.results_toggle = function(){
			if(this.results_showing){
				return this.results_hide();
			}else{
				return this.results_show();
			}
		};

		AbstractChosen.prototype.results_search = function(evt){
			if(this.results_showing){
				return this.winnow_results();
			}else{
				return this.results_show();
			}
		};

		AbstractChosen.prototype.winnow_results = function(){
			var escapedSearchText, option, regex, results, results_group, searchText, startpos, text, zregex, _i, _len, _ref;
			this.no_results_clear();
			results = 0;
			searchText = this.get_search_text();
			escapedSearchText = searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
			zregex = new RegExp(escapedSearchText, 'i');
			regex = this.get_search_regex(escapedSearchText);
			_ref = this.results_data;
			for(_i = 0, _len = _ref.length; _i < _len; _i++){
				option = _ref[_i];
				option.search_match = false;
				results_group = null;
				if(this.include_option_in_results(option)){
					if(option.group){
						option.group_match = false;
						option.active_options = 0;
					}
					if((option.group_array_index != null) && this.results_data[option.group_array_index]){
						results_group = this.results_data[option.group_array_index];
						if(results_group.active_options === 0 && results_group.search_match){
							results += 1;
						}
						results_group.active_options += 1;
					}
					if(!(option.group && !this.group_search)){
						option.search_text = option.group ? option.label : option.text;
						option.search_match = this.search_string_match(option.search_text, regex);
						if(option.search_match && !option.group){
							results += 1;
						}
						if(option.search_match){
							if(searchText.length){
								startpos = option.search_text.search(zregex);
								text = option.search_text.substr(0, startpos + searchText.length) + '</em>' + option.search_text.substr(startpos + searchText.length);
								option.search_text = text.substr(0, startpos) + '<em>' + text.substr(startpos);
							}
							if(results_group != null){
								results_group.group_match = true;
							}
						}else if((option.group_array_index != null) && this.results_data[option.group_array_index].search_match){
							option.search_match = true;
						}
					}
				}
			}
			this.result_clear_highlight();
			if(results < 1 && searchText.length){
				this.update_results_content("");
				return this.no_results(searchText);
			}else{
				this.update_results_content(this.results_option_build());
				return this.winnow_results_set_highlight();
			}
		};

		AbstractChosen.prototype.get_search_regex = function(escaped_search_string){
			var regex_anchor;
			regex_anchor = this.search_contains ? "" : "^";
			return new RegExp(regex_anchor + escaped_search_string, 'i');
		};

		AbstractChosen.prototype.search_string_match = function(search_string, regex){
			var part, parts, _i, _len;
			if(regex.test(search_string)){
				return true;
			}else if(this.enable_split_word_search && (search_string.indexOf(" ") >= 0 || search_string.indexOf("[") === 0)){
				parts = search_string.replace(/\[|\]/g, "").split(" ");
				if(parts.length){
					for(_i = 0, _len = parts.length; _i < _len; _i++){
						part = parts[_i];
						if(regex.test(part)){
							return true;
						}
					}
				}
			}
		};

		AbstractChosen.prototype.choices_count = function(){
			var option, _i, _len, _ref;
			if(this.selected_option_count != null){
				return this.selected_option_count;
			}
			this.selected_option_count = 0;
			_ref = this.form_field.options;
			for(_i = 0, _len = _ref.length; _i < _len; _i++){
				option = _ref[_i];
				if(option.selected){
					this.selected_option_count += 1;
				}
			}
			return this.selected_option_count;
		};

		AbstractChosen.prototype.choices_click = function(evt){
			evt.preventDefault();
			if(!(this.results_showing || this.is_disabled)){
				return this.results_show();
			}
		};

		AbstractChosen.prototype.keyup_checker = function(evt){
			var stroke, _ref;
			stroke = (_ref = evt.which) != null ? _ref : evt.keyCode;
			this.search_field_scale();
			switch(stroke){
				case 8:
					if(this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0){
						return this.keydown_backstroke();
					}else if(!this.pending_backstroke){
						this.result_clear_highlight();
						return this.results_search();
					}
					break;
				case 13:
					evt.preventDefault();
					if(this.results_showing){
						return this.result_select(evt);
					}
					break;
				case 27:
					if(this.results_showing){
						this.results_hide();
					}
					return true;
				case 9:
				case 38:
				case 40:
				case 16:
				case 91:
				case 17:
					break;
				default:
					return this.results_search();
			}
		};

		AbstractChosen.prototype.clipboard_event_checker = function(evt){
			var _this = this;
			return setTimeout((function(){
				return _this.results_search();
			}), 50);
		};

		AbstractChosen.prototype.container_width = function(){
			if(this.options.width != null){
				return this.options.width;
			}else{
				return "" + this.form_field.offsetWidth + "px";
			}
		};

		AbstractChosen.prototype.include_option_in_results = function(option){
			if(this.is_multiple && (!this.display_selected_options && option.selected)){
				return false;
			}
			if(!this.display_disabled_options && option.disabled){
				return false;
			}
			if(option.empty){
				return false;
			}
			return true;
		};

		AbstractChosen.prototype.search_results_touchstart = function(evt){
			this.touch_started = true;
			return this.search_results_mouseover(evt);
		};

		AbstractChosen.prototype.search_results_touchmove = function(evt){
			this.touch_started = false;
			return this.search_results_mouseout(evt);
		};

		AbstractChosen.prototype.search_results_touchend = function(evt){
			if(this.touch_started){
				return this.search_results_mouseup(evt);
			}
		};

		AbstractChosen.prototype.outerHTML = function(element){
			var tmp;
			if(element.outerHTML){
				return element.outerHTML;
			}
			tmp = document.createElement("div");
			tmp.appendChild(element);
			return tmp.innerHTML;
		};

		AbstractChosen.browser_is_supported = function(){
			if(window.navigator.appName === "Microsoft Internet Explorer"){
				return document.documentMode >= 8;
			}
			if(/iP(od|hone)/i.test(window.navigator.userAgent)){
				return false;
			}
			if(/Android/i.test(window.navigator.userAgent)){
				if(/Mobile/i.test(window.navigator.userAgent)){
					return false;
				}
			}
			return true;
		};

		AbstractChosen.default_multiple_text = "Select Some Options";
		AbstractChosen.default_single_text = "Select an Option";
		AbstractChosen.default_no_result_text = "No results match";
		return AbstractChosen;
	})();

	$ = jQuery;
	$.fn.extend({
		chosen: function(options){
			if(!AbstractChosen.browser_is_supported()){
				return this;
			}
			return this.each(function(input_field){
				var $this, chosen;
				$this = $(this);
				chosen = $this.data('chosen');
				if(options === 'destroy' && chosen instanceof Chosen){
					chosen.destroy();
				}else if(!(chosen instanceof Chosen)){
					$this.data('chosen', new Chosen(this, options));
				}
			});
		}
	});

	Chosen = (function(_super){
		__extends(Chosen, _super);

		function Chosen(){
			_ref = Chosen.__super__.constructor.apply(this, arguments);
			return _ref;
		}

		Chosen.prototype.setup = function(){
			this.form_field_jq = $(this.form_field);
			this.current_selectedIndex = this.form_field.selectedIndex;
			return this.is_rtl = this.form_field_jq.hasClass("chosen-rtl");
		};

		Chosen.prototype.set_up_html = function(){
			var container_classes, container_props;
			container_classes = ["chosen-container"];
			container_classes.push("chosen-container-" + (this.is_multiple ? "multi" : "single"));
			if(this.inherit_select_classes && this.form_field.className){
				container_classes.push(this.form_field.className);
			}
			if(this.is_rtl){
				container_classes.push("chosen-rtl");
			}
			container_props = {
				'class': container_classes.join(' '),
				'style': "width: " + (this.container_width()) + ";",
				'title': this.form_field.title
			};
			if(this.form_field.id.length){
				container_props.id = this.form_field.id.replace(/[^\w]/g, '_') + "_chosen";
			}
			this.container = $("<div />", container_props);

			var chosen_drop_style = 'style="top:100%;"';
			if(this.options.dropup){
				chosen_drop_style = 'style="bottom:100%;"';
			}
			if(this.is_multiple){
				this.container.html('<ul class="chosen-choices"><li class="search-field"><input type="text" value="' + this.default_text + '" class="default" autocomplete="off" style="width:25px;" /></li></ul><div class="chosen-drop" ' + chosen_drop_style + '><ul class="chosen-results"></ul></div>');
			}else{
				this.container.html('<a class="chosen-single chosen-default" tabindex="-1"><span>' + this.default_text + '</span><div><b></b></div></a><div class="chosen-drop" ' + chosen_drop_style + '><div class="chosen-search"><input type="text" autocomplete="off" /></div><ul class="chosen-results"></ul></div>');
			}
			this.form_field_jq.hide().after(this.container);
			this.dropdown = this.container.find('div.chosen-drop').first();
			this.search_field = this.container.find('input').first();
			this.search_results = this.container.find('ul.chosen-results').first();
			this.search_field_scale();
			this.search_no_results = this.container.find('li.no-results').first();
			if(this.is_multiple){
				this.search_choices = this.container.find('ul.chosen-choices').first();
				this.search_container = this.container.find('li.search-field').first();
			}else{
				this.search_container = this.container.find('div.chosen-search').first();
				this.selected_item = this.container.find('.chosen-single').first();
			}
			this.results_build();
			this.set_tab_index();
			return this.set_label_behavior();
		};

		Chosen.prototype.on_ready = function(){
			return this.form_field_jq.trigger("chosen:ready", {
				chosen: this
			});
		};

		Chosen.prototype.register_observers = function(){
			var _this = this;
			this.container.bind('touchstart.chosen', function(evt){
				_this.container_mousedown(evt);
			});
			this.container.bind('touchend.chosen', function(evt){
				_this.container_mouseup(evt);
			});
			this.container.bind('mousedown.chosen', function(evt){
				_this.container_mousedown(evt);
			});
			this.container.bind('mouseup.chosen', function(evt){
				_this.container_mouseup(evt);
			});
			this.container.bind('mouseenter.chosen', function(evt){
				_this.mouse_enter(evt);
			});
			this.container.bind('mouseleave.chosen', function(evt){
				_this.mouse_leave(evt);
			});
			this.search_results.bind('mouseup.chosen', function(evt){
				_this.search_results_mouseup(evt);
			});
			this.search_results.bind('mouseover.chosen', function(evt){
				_this.search_results_mouseover(evt);
			});
			this.search_results.bind('mouseout.chosen', function(evt){
				_this.search_results_mouseout(evt);
			});
			this.search_results.bind('mousewheel.chosen DOMMouseScroll.chosen', function(evt){
				_this.search_results_mousewheel(evt);
			});
			this.search_results.bind('touchstart.chosen', function(evt){
				_this.search_results_touchstart(evt);
			});
			this.search_results.bind('touchmove.chosen', function(evt){
				_this.search_results_touchmove(evt);
			});
			this.search_results.bind('touchend.chosen', function(evt){
				_this.search_results_touchend(evt);
			});
			this.form_field_jq.bind("chosen:updated.chosen", function(evt){
				_this.results_update_field(evt);
			});
			this.form_field_jq.bind("chosen:activate.chosen", function(evt){
				_this.activate_field(evt);
			});
			this.form_field_jq.bind("chosen:open.chosen", function(evt){
				_this.container_mousedown(evt);
			});
			this.form_field_jq.bind("chosen:close.chosen", function(evt){
				_this.input_blur(evt);
			});
			this.search_field.bind('blur.chosen', function(evt){
				_this.input_blur(evt);
			});
			this.search_field.bind('keyup.chosen', function(evt){
				_this.keyup_checker(evt);
			});
			this.search_field.bind('keydown.chosen', function(evt){
				_this.keydown_checker(evt);
			});
			this.search_field.bind('focus.chosen', function(evt){
				_this.input_focus(evt);
			});
			this.search_field.bind('cut.chosen', function(evt){
				_this.clipboard_event_checker(evt);
			});
			this.search_field.bind('paste.chosen', function(evt){
				_this.clipboard_event_checker(evt);
			});
			if(this.is_multiple){
				return this.search_choices.bind('click.chosen', function(evt){
					_this.choices_click(evt);
				});
			}else{
				return this.container.bind('click.chosen', function(evt){
					evt.preventDefault();
				});
			}
		};

		Chosen.prototype.destroy = function(){
			$(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action);
			if(this.search_field[0].tabIndex){
				this.form_field_jq[0].tabIndex = this.search_field[0].tabIndex;
			}
			this.container.remove();
			this.form_field_jq.removeData('chosen');
			return this.form_field_jq.show();
		};

		Chosen.prototype.search_field_disabled = function(){
			this.is_disabled = this.form_field_jq[0].disabled;
			if(this.is_disabled){
				this.container.addClass('chosen-disabled');
				this.search_field[0].disabled = true;
				if(!this.is_multiple){
					this.selected_item.unbind("focus.chosen", this.activate_action);
				}
				return this.close_field();
			}else{
				this.container.removeClass('chosen-disabled');
				this.search_field[0].disabled = false;
				if(!this.is_multiple){
					return this.selected_item.bind("focus.chosen", this.activate_action);
				}
			}
		};

		Chosen.prototype.container_mousedown = function(evt){
			if(!this.is_disabled){
				if(evt && evt.type === "mousedown" && !this.results_showing){
					evt.preventDefault();
				}
				if(!((evt != null) && ($(evt.target)).hasClass("search-choice-close"))){
					if(!this.active_field){
						if(this.is_multiple){
							this.search_field.val("");
						}
						$(this.container[0].ownerDocument).bind('click.chosen', this.click_test_action);
						this.results_show();
					}else if(!this.is_multiple && evt && (($(evt.target)[0] === this.selected_item[0]) || $(evt.target).parents("a.chosen-single").length)){
						evt.preventDefault();
						this.results_toggle();
					}
					return this.activate_field();
				}
			}
		};

		Chosen.prototype.container_mouseup = function(evt){
			if(evt.target.nodeName === "ABBR" && !this.is_disabled){
				return this.results_reset(evt);
			}
		};

		Chosen.prototype.search_results_mousewheel = function(evt){
			var delta;
			if(evt.originalEvent){
				delta = evt.originalEvent.deltaY || -evt.originalEvent.wheelDelta || evt.originalEvent.detail;
			}
			if(delta != null){
				evt.preventDefault();
				if(evt.type === 'DOMMouseScroll'){
					delta = delta * 40;
				}
				return this.search_results.scrollTop(delta + this.search_results.scrollTop());
			}
		};

		Chosen.prototype.blur_test = function(evt){
			if(!this.active_field && this.container.hasClass("chosen-container-active")){
				return this.close_field();
			}
		};

		Chosen.prototype.close_field = function(){
			$(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action);
			this.active_field = false;
			this.results_hide();
			this.container.removeClass("chosen-container-active");
			this.clear_backstroke();
			this.show_search_field_default();
			return this.search_field_scale();
		};

		Chosen.prototype.activate_field = function(){
			this.container.addClass("chosen-container-active");
			this.active_field = true;
			this.search_field.val(this.search_field.val());
			return this.search_field.focus();
		};

		Chosen.prototype.test_active_click = function(evt){
			var active_container;
			active_container = $(evt.target).closest('.chosen-container');
			if(active_container.length && this.container[0] === active_container[0]){
				return this.active_field = true;
			}else{
				return this.close_field();
			}
		};

		Chosen.prototype.results_build = function(){
			this.parsing = true;
			this.selected_option_count = null;
			this.results_data = SelectParser.select_to_array(this.form_field);
			if(this.is_multiple){
				this.search_choices.find("li.search-choice").remove();
			}else if(!this.is_multiple){
				this.single_set_selected_text();
				if(this.disable_search || this.form_field.options.length <= this.disable_search_threshold){
					this.search_field[0].readOnly = true;
					this.container.addClass("chosen-container-single-nosearch");
				}else{
					this.search_field[0].readOnly = false;
					this.container.removeClass("chosen-container-single-nosearch");
				}
			}
			this.update_results_content(this.results_option_build({
				first: true
			}));
			this.search_field_disabled();
			this.show_search_field_default();
			this.search_field_scale();
			return this.parsing = false;
		};

		Chosen.prototype.result_do_highlight = function(el){
			var high_bottom, high_top, maxHeight, visible_bottom, visible_top;
			if(el.length){
				this.result_clear_highlight();
				this.result_highlight = el;
				this.result_highlight.addClass("highlighted");
				maxHeight = parseInt(this.search_results.css("maxHeight"), 10);
				visible_top = this.search_results.scrollTop();
				visible_bottom = maxHeight + visible_top;
				high_top = this.result_highlight.position().top + this.search_results.scrollTop();
				high_bottom = high_top + this.result_highlight.outerHeight();
				if(high_bottom >= visible_bottom){
					return this.search_results.scrollTop((high_bottom - maxHeight) > 0 ? high_bottom - maxHeight : 0);
				}else if(high_top < visible_top){
					return this.search_results.scrollTop(high_top);
				}
			}
		};

		Chosen.prototype.result_clear_highlight = function(){
			if(this.result_highlight){
				this.result_highlight.removeClass("highlighted");
			}
			return this.result_highlight = null;
		};

		Chosen.prototype.results_show = function(){
			if(this.is_multiple && this.max_selected_options <= this.choices_count()){
				this.form_field_jq.trigger("chosen:maxselected", {
					chosen: this
				});
				return false;
			}
			this.container.addClass("chosen-with-drop");
			this.results_showing = true;
			this.search_field.focus();
			this.search_field.val(this.search_field.val());
			this.winnow_results();
			return this.form_field_jq.trigger("chosen:showing_dropdown", {
				chosen: this
			});
		};

		Chosen.prototype.update_results_content = function(content){
			return this.search_results.html(content);
		};

		Chosen.prototype.results_hide = function(){
			if(this.results_showing){
				this.result_clear_highlight();
				this.container.removeClass("chosen-with-drop");
				this.form_field_jq.trigger("chosen:hiding_dropdown", {
					chosen: this
				});
			}
			return this.results_showing = false;
		};

		Chosen.prototype.set_tab_index = function(el){
			var ti;
			if(this.form_field.tabIndex){
				ti = this.form_field.tabIndex;
				this.form_field.tabIndex = -1;
				return this.search_field[0].tabIndex = ti;
			}
		};

		Chosen.prototype.set_label_behavior = function(){
			var _this = this;
			this.form_field_label = this.form_field_jq.parents("label");
			if(!this.form_field_label.length && this.form_field.id.length){
				this.form_field_label = $("label[for='" + this.form_field.id + "']");
			}
			if(this.form_field_label.length > 0){
				return this.form_field_label.bind('click.chosen', function(evt){
					if(_this.is_multiple){
						return _this.container_mousedown(evt);
					}else{
						return _this.activate_field();
					}
				});
			}
		};

		Chosen.prototype.show_search_field_default = function(){
			if(this.is_multiple && this.choices_count() < 1 && !this.active_field){
				this.search_field.val(this.default_text);
				return this.search_field.addClass("default");
			}else{
				this.search_field.val("");
				return this.search_field.removeClass("default");
			}
		};

		Chosen.prototype.search_results_mouseup = function(evt){
			var target;
			target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
			if(target.length){
				this.result_highlight = target;
				this.result_select(evt);
				return this.search_field.focus();
			}
		};

		Chosen.prototype.search_results_mouseover = function(evt){
			var target;
			target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
			if(target){
				return this.result_do_highlight(target);
			}
		};

		Chosen.prototype.search_results_mouseout = function(evt){
			if($(evt.target).hasClass("active-result" || $(evt.target).parents('.active-result').first())){
				return this.result_clear_highlight();
			}
		};

		Chosen.prototype.choice_build = function(item){
			var choice, close_link,
				_this = this;
			choice = $('<li />', {
				"class": "search-choice"
			}).html("<span>" + item.html + "</span>");

			if(item.disabled){
				choice.addClass('search-choice-disabled');
			}else{
				close_link = $('<a />', {
					"class": 'search-choice-close',
					'data-option-array-index': item.array_index
				});
				close_link.bind('click.chosen', function(evt){
					return _this.choice_destroy_link_click(evt);
				});
				choice.append(close_link);
			}
			return this.search_container.before(choice);
		};

		Chosen.prototype.choice_destroy_link_click = function(evt){
			evt.preventDefault();
			evt.stopPropagation();
			if(!this.is_disabled){
				return this.choice_destroy($(evt.target));
			}
		};

		Chosen.prototype.choice_destroy = function(link){
			if(this.result_deselect(link[0].getAttribute("data-option-array-index"))){
				this.show_search_field_default();
				if(this.is_multiple && this.choices_count() > 0 && this.search_field.val().length < 1){
					this.results_hide();
				}
				link.parents('li').first().remove();
				return this.search_field_scale();
			}
		};

		Chosen.prototype.results_reset = function(){
			this.reset_single_select_options();
			this.form_field.options[0].selected = true;
			this.single_set_selected_text();
			this.show_search_field_default();
			this.results_reset_cleanup();
			this.form_field_jq.trigger("change");
			if(this.active_field){
				return this.results_hide();
			}
		};

		Chosen.prototype.results_reset_cleanup = function(){
			this.current_selectedIndex = this.form_field.selectedIndex;
			return this.selected_item.find("abbr").remove();
		};

		Chosen.prototype.result_select = function(evt){
			var high, item;
			if(this.result_highlight){
				high = this.result_highlight;
				this.result_clear_highlight();
				if(this.is_multiple && this.max_selected_options <= this.choices_count()){
					this.form_field_jq.trigger("chosen:maxselected", {
						chosen: this
					});
					return false;
				}
				if(this.is_multiple){
					high.removeClass("active-result");
				}else{
					this.reset_single_select_options();
				}
				item = this.results_data[high[0].getAttribute("data-option-array-index")];
				item.selected = true;
				this.form_field.options[item.options_index].selected = true;
				this.selected_option_count = null;
				if(this.is_multiple){
					this.choice_build(item);
				}else{
					this.single_set_selected_text(item.text);
				}
				if(!((evt.metaKey || evt.ctrlKey) && this.is_multiple)){
					this.results_hide();
				}
				this.search_field.val("");
				if(this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex){
					this.form_field_jq.trigger("change", {
						'selected': this.form_field.options[item.options_index].value
					});
				}
				this.current_selectedIndex = this.form_field.selectedIndex;
				return this.search_field_scale();
			}
		};

		Chosen.prototype.single_set_selected_text = function(text){
			text = $.trim(text);
			if(text == null){
				text = this.default_text;
			}
			if(text === this.default_text){
				this.selected_item.addClass("chosen-default");
			}else{
				this.single_deselect_control_build();
				this.selected_item.removeClass("chosen-default");
			}
			return this.selected_item.find("span").text(text);
		};

		Chosen.prototype.result_deselect = function(pos){
			var result_data;
			result_data = this.results_data[pos];
			if(!this.form_field.options[result_data.options_index].disabled){
				result_data.selected = false;
				this.form_field.options[result_data.options_index].selected = false;
				this.selected_option_count = null;
				this.result_clear_highlight();
				if(this.results_showing){
					this.winnow_results();
				}
				this.form_field_jq.trigger("change", {
					deselected: this.form_field.options[result_data.options_index].value
				});
				this.search_field_scale();
				return true;
			}else{
				return false;
			}
		};

		Chosen.prototype.single_deselect_control_build = function(){
			if(!this.allow_single_deselect){
				return;
			}
			if(!this.selected_item.find("abbr").length){
				this.selected_item.find("span").first().after("<abbr class=\"search-choice-close\"></abbr>");
			}
			return this.selected_item.addClass("chosen-single-with-deselect");
		};

		Chosen.prototype.get_search_text = function(){
			if(this.search_field.val() === this.default_text){
				return "";
			}else{
				return $('<div/>').text($.trim(this.search_field.val())).text();
			}
		};

		Chosen.prototype.winnow_results_set_highlight = function(){
			var do_high, selected_results;
			selected_results = !this.is_multiple ? this.search_results.find(".result-selected.active-result") : [];
			do_high = selected_results.length ? selected_results.first() : this.search_results.find(".active-result").first();
			if(do_high != null){
				return this.result_do_highlight(do_high);
			}
		};

		Chosen.prototype.no_results = function(terms){
			var no_results_html;
			no_results_html = $('<li class="no-results">' + this.results_none_found + ' "<span></span>"</li>');
			no_results_html.find("span").first().html(terms);
			this.search_results.append(no_results_html);
			return this.form_field_jq.trigger("chosen:no_results", {
				chosen: this
			});
		};

		Chosen.prototype.no_results_clear = function(){
			return this.search_results.find(".no-results").remove();
		};

		Chosen.prototype.keydown_arrow = function(){
			var next_sib;
			if(this.results_showing && this.result_highlight){
				next_sib = this.result_highlight.nextAll("li.active-result").first();
				if(next_sib){
					return this.result_do_highlight(next_sib);
				}
			}else{
				return this.results_show();
			}
		};

		Chosen.prototype.keyup_arrow = function(){
			var prev_sibs;
			if(!this.results_showing && !this.is_multiple){
				return this.results_show();
			}else if(this.result_highlight){
				prev_sibs = this.result_highlight.prevAll("li.active-result");
				if(prev_sibs.length){
					return this.result_do_highlight(prev_sibs.first());
				}else{
					if(this.choices_count() > 0){
						this.results_hide();
					}
					return this.result_clear_highlight();
				}
			}
		};

		Chosen.prototype.keydown_backstroke = function(){
			var next_available_destroy;
			if(this.pending_backstroke){
				this.choice_destroy(this.pending_backstroke.find("a").first());
				return this.clear_backstroke();
			}else{
				next_available_destroy = this.search_container.siblings("li.search-choice").last();
				if(next_available_destroy.length && !next_available_destroy.hasClass("search-choice-disabled")){
					this.pending_backstroke = next_available_destroy;
					if(this.single_backstroke_delete){
						return this.keydown_backstroke();
					}else{
						return this.pending_backstroke.addClass("search-choice-focus");
					}
				}
			}
		};

		Chosen.prototype.clear_backstroke = function(){
			if(this.pending_backstroke){
				this.pending_backstroke.removeClass("search-choice-focus");
			}
			return this.pending_backstroke = null;
		};

		Chosen.prototype.keydown_checker = function(evt){
			var stroke, _ref1;
			stroke = (_ref1 = evt.which) != null ? _ref1 : evt.keyCode;
			this.search_field_scale();
			if(stroke !== 8 && this.pending_backstroke){
				this.clear_backstroke();
			}
			switch(stroke){
				case 8:
					this.backstroke_length = this.search_field.val().length;
					break;
				case 9:
					if(this.results_showing && !this.is_multiple){
						this.result_select(evt);
					}
					this.mouse_on_container = false;
					break;
				case 13:
					if(this.results_showing){
						evt.preventDefault();
					}
					break;
				case 32:
					if(this.disable_search){
						evt.preventDefault();
					}
					break;
				case 38:
					evt.preventDefault();
					this.keyup_arrow();
					break;
				case 40:
					evt.preventDefault();
					this.keydown_arrow();
					break;
			}
		};

		Chosen.prototype.search_field_scale = function(){
			var div, f_width, h, style, style_block, styles, w, _i, _len;
			if(this.is_multiple){
				h = 0;
				w = 0;
				style_block = "position:absolute; left: -1000px; top: -1000px; display:none;";
				styles = ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'];
				for(_i = 0, _len = styles.length; _i < _len; _i++){
					style = styles[_i];
					style_block += style + ":" + this.search_field.css(style) + ";";
				}
				div = $('<div />', {
					'style': style_block
				});
				div.text(this.search_field.val());
				$('body').append(div);
				w = div.width() + 25;
				div.remove();
				f_width = this.container.outerWidth();
				if(w > f_width - 10){
					w = f_width - 10;
				}
				return this.search_field.css({
					'width': w + 'px'
				});
			}
		};

		return Chosen;
	})(AbstractChosen);

	return {
		nodeInit: function($node, param){
			param.dropup = param.dropup || 0;
			$node.chosen(param);
			var $shadow_inp = $node.next();
			$node.css({
				transition: 'none',
				position: 'absolute',
				width: 0,
				height: 0,
				padding: 0,
				left: $shadow_inp.offset().left + $shadow_inp.outerWidth() / 2,
				top: $shadow_inp.offset().top + $shadow_inp.outerHeight(),
				opacity: 0
			});
			$node.show();
		}
	};
});
//../src/component/confirm.js
/**
 * Created by Administrator on 2016/6/8.
 */
define('ywj/confirm', function(require){
	var Pop = require('ywj/popup');
	var lang = require('lang/$G_LANGUAGE');

	return {
		nodeClick: function($node){
			if(!$node.data('confirm-pass')){
				var msg = $node.data('confirm-message');
				var title = lang('确认');
				Pop.showConfirm(title, msg, function(){
					$node.data('confirm-pass', 1);
					setTimeout(function(){
						$node.data('confirm-pass', 0);
					});
					$node[0].click();
				}, null, {with_icon:true});
				return false;
			}
		}
	}
});
//../src/component/copy.js
define('ywj/copy', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');
	var Tip = require('ywj/tip');
	var lang = require('lang/$G_LANGUAGE');

	var css =
		".ywj-copy-btn {display:none; position:absolute; z-index:11;}" +
		".ywj-copy-btn span {display:inline-block; text-transform:capitalize; text-align:center; opacity:0.4; padding:2px 8px; margin-left:-20px; line-height:20px; background-color:white; border:1px solid #ddd; border-radius:3px; cursor:pointer; box-shadow:1px 1px 8px #cecece;}" +
		".ywj-copy-btn span:hover {opacity:1;}";
	$('<style>'+css+'</style>').appendTo('head');

	var prompt_html = function(text){
		return '<div style="padding:5px;"><div style="color:gray; padding-bottom:0.5em;">'+lang('请按 Ctrl+C 复制')+'</div> <input type="text" class="txt" value="'+Util.htmlEscape(text)+'"/></div>';
	};

	var tip_html = function(text){
		return '<span style="color:green;">&#10004; '+lang('已复制')+'</span> <div style="color:gray; padding-left:1em;">'+Util.htmlEscape(Util.cutString(text, 20))+'</div>';
	};

	var tm;
	var $btn;
	var show = function($node, e, text){
		clearTimeout(tm);
		if(!$btn){
			$btn = $('<div class="ywj-copy-btn"><span></span></div>').appendTo('body');
			$btn.hover(function(){
				show($node, null, $btn.data('text'));
			}, hide);
			$btn.click(function(){
				Util.copy($(this).data('text'), true);
				$btn.find('span').html(lang('已复制'));
			});
		}
		$btn.find('span').html(lang('复制'));
		$btn.data('text', text).show();
		if(e){
			$btn.css({
				top: $node.offset().top + $node.outerHeight(),
				left: e.clientX
			});
		}
	};

	var hide = function(){
		if($btn){
			tm = setTimeout(function(){
				$btn.hide();
			}, 10);
		}
	};

	var bindContent = function($node, text){
		$node.hover(function(e){
			show($node, e, text);
		}, hide);
	};

	var bindButton = function($btn, text){
		$btn.click(function(){
			if(Util.copy(text)){
				Tip.show(tip_html(text), $btn, {timeout: 800});
			} else {
				var t = Tip.show(prompt_html(text), $btn, {closeBtn: true});
				t.getDom().find('input').select().focus();
			}
		});
	};

	return {
		nodeInit: function($node, param){
			if(param.text){
				bindButton($node, param.text);
			} else if($node.text()){
				bindContent($node, $node.text());
				$node.addClass('content-copy-able')
			}
		}
	}
});
//../src/component/counter.js
define('ywj/counter', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');

	var css =
		'.ywj-counter-trigger {position:absolute; opacity:1; transition: all 0.1s linear;} ' +
		'.ywj-counter-trigger-hide {opacity:0}'+
		'.ywj-counter-trigger-wrap {position:absolute; right:0; white-space:nowrap; padding:1px 2px; background-color:#fff;}' +
		'.ywj-counter-trigger-val {font-weight:bold; }' +
		'.ywj-counter-trigger-max {color:gray;}' +
		'.ywj-counter-trigger-overflow .ywj-counter-trigger-val {color:red;}';
	$('<style>'+css+'</style>').appendTo('head');

	var GUID_KEY = 'counter-guid';

	var trigger_list = {};

	var get_trigger = function($node){
		return trigger_list[$node.data(GUID_KEY)];
	};

	var set_trigger = function($node, $trigger){
		trigger_list[$node.data(GUID_KEY)] = $trigger;
	};

	var show = function($node, max, as_init){
		var $trigger = get_trigger($node);
		if(!$trigger){
			$trigger = $('<div class="ywj-counter-trigger ywj-counter-trigger-hide"><span class="ywj-counter-trigger-wrap"></span></div>').appendTo('body');
			set_trigger($node, $trigger);
		}
		$trigger.css({
			left: $node.offset().left + $node.outerWidth(),
			top: $node.offset().top + $node.outerHeight()
		});
		update($node, max);
		if(!as_init){
			$trigger.removeClass('ywj-counter-trigger-hide');
		}
	};

	var buildHtml = function(count, max){
		var html = '';
		html += '<span class="ywj-counter-trigger-val">' + count + '</span>';
		html += max ? ' / <span class="ywj-counter-trigger-max">' + max + '</span>' : '';
		return html;
	};

	var hide = function($node){
		var $trigger = get_trigger($node);
		if($trigger){
			$trigger.addClass('ywj-counter-trigger-hide');
		}
	};

	var update = function($node, max){
		var $trigger = get_trigger($node);
		var count = $node.val().length;
		var html = buildHtml(count, max);
		var $wrap = $trigger.find('.ywj-counter-trigger-wrap');
		$wrap[max && max < count ? 'addClass' : 'removeClass']('ywj-counter-trigger-overflow');
		$trigger.find('.ywj-counter-trigger-wrap').html(html);
	};

	var bindTextareaOnResize = function($text, handler){
		var ti = null;
		$text.on('mousedown', function(){
			ti = setInterval(handler, 1000/15);
		});
		$(window).on('mouseup', function(){
			if(ti !== null){
				clearInterval(ti);
			}
		})
	};

	return {
		nodeInit: function($node, param){
			var max = param.maxlength || $node.attr('maxlength');
			$node.data(GUID_KEY, Util.guid());
			$node.focus(function(){
				show($node, max);
			});
			$node.blur(function(){
				hide($node);
			});
			$node.on('change keyup keydown focus mouseup', function(){
				update($node, max);
			});

			//init
			show($node, max, true);

			if($node[0].tagName === 'TEXTAREA'){
				bindTextareaOnResize($node, function(){
					console.debug("Counter on resize");
					show($node, max);
				});
			}
		}
	}
});
//../src/component/datetimepicker.js
/**
 * Created by sasumi on 2014/12/2.
 */
define('ywj/datetimepicker', function(require){
	require('ywj/resource/datetimepicker.css');
	var Tip = require('ywj/tip');

	var parse_date_str = function(date_str){
		var d = new Date(date_str);
		return {
			year: d.getFullYear(),
			month: d.getMonth()+1,
			date: d.getUTCDate(),
			hour: d.getUTCHours(),
			min: d.getUTCMinutes(),
			second: d.getUTCSeconds()
		}
	};

	/**
	 * 查询上个月
	 * @param year
	 * @param month
	 * @returns {*}
	 */
	var get_last_month = function(year, month){
		return month === 1 ? [year-1, 12] : [year, month-1];
	};

	/**
	 * 查询下个月
	 * @param year
	 * @param month
	 * @returns {*}
	 */
	var get_next_month = function(year, month){
		return month === 12 ? [year+1, 1] : [year, month + 1];
	};

	/**
	 * 获取月份内的天数序列，包含上一个月后补，下一个月前缀天数
	 * @param year
	 * @param month
	 * @param day_start
	 * @returns {[null]}
	 */
	var get_days_serials = function(year, month, day_start){
		var current_month_days_count = new Date(year, month, 0).getDate();
		var last_month_days_count = new Date(year, month-1, 0).getDate();
		var first_day = new Date(year, month-1, 1).getDay();
		var prev_patch_count = Math.abs(day_start - first_day);
		var next_patch_count = 7 - (prev_patch_count + current_month_days_count)%7;
		var today = parse_date_str();
		[last_year, last_month]  = get_last_month(year, month);
		[next_year, next_month]  = get_next_month(year, month);

		var date_serials = [];
		//patch previous month dates
		for(var i=prev_patch_count-1; i>=0; i--){
			date_serials.push({
				year: last_year,
				month: last_month,
				date: last_month_days_count - i,
				month_flag: 'last'
			});
		}

		//current month dates
		for(var i=0; i<current_month_days_count; i++){
			var is_today = today.year == year && today.month == month && today.date == (i+1);
			date_serials.push({
				year: year,
				month: month,
				date: i+1,
				now: is_today ? true : false,
				month_flag: 'current'
			});
		}

		//next month dates
		for(var i=0; i<next_patch_count; i++){
			date_serials.push({
				year: year,
				month: month,
				date: i+1,
				month_flag: 'next'
			})
		}

		return date_serials;
	};

	var get_html = function(date_val, cfg){
		var date_obj = parse_date_str(date_val);
		var year_sel_str = '';
		cfg = cfg || {};
		cfg.months = cfg.months || ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
		cfg.days = cfg.days || ['一', '二', '三', '四', '五', '六', '日'];
		cfg.day_start = cfg.day_start || 1;

		//year select panel
		for(var i=0; i<16; i+=4){
			year_sel_str += '<tr>';
			for(var j=0; j<4; j++){
				var y = date_obj.year+i+j;
				year_sel_str += '<td '+(!i && !j ? 'class="active"' : '')+'>'+y+'</td>';
			}
			year_sel_str += '</tr>';
		}
		var html = '<div class="com-dtp">'+
			'<table class="com-dpt-year-panel" style="display:none;"><thead>'+
			'<tr><th><span class="com-dpt-prev-btn"></span></th><th colspan="2"><span class="com-dpt-month">请选择年份</span></th>'+
			'<th><span class="com-dpt-next-btn"></span></th></tr>'+
			'</thead><tbody>'+
			year_sel_str+
			'</tbody></table>';

		//month select panel
		var month_str = '';
		for(var i=0; i<3; i++){
			month_str += '<tr>';
			for(var j=0; j<4; j++){
				month_str += '<td>'+cfg.months[i+j]+'</td>';
			}
			month_str += '</tr>';
		}
		html += '<table class="com-dpt-month-panel" style="display:none;"><thead>'+
			'<tr><th><span class="com-dpt-prev-btn"></span></th><th colspan="2"><span class="com-dpt-year">'+date_obj.year+'</span></th>'+
				'<th><span class="com-dpt-next-btn"></span></th></tr>'+
			'</thead><tbody>'+
			month_str+
			'</tbody></table>';

		//day select panel
		var date_str = '';
		var day_str = '';
		var i = 0;
		var day_idx = 0;
		while(i++ < 7){
			day_idx = (i+cfg.day_start)%7;
			day_str += '<th>'+cfg.days[day_idx]+'</th>';
		}

		var ds = get_days_serials(date_obj.year, date_obj.month, cfg.day_start);
		for(var i=0; i<ds.length; i++){
			var d = ds[i];
			var cls = d.month_flag == 'last' ? 'com-dtp-date-old' : (d.month_flag == 'next' ? 'com-dtp-date-new'  : '');
			cls += d.now ? ' com-dpt-today' : '';
			 if(i%7 == 0){
			 	date_str += '<tr>';
			 }
			 date_str += '<td data-date="'+d.year+'-'+d.month+'-'+d.date+'" class="'+cls+'">'+d.date+'</td>';
			if(i%7 == 6){
				date_str += '</tr>';
			}
		}

		html += '<table class="com-dpt-date-panel">'+
			'<thead>'+
			'<tr><th><span class="com-dpt-prev-btn"></span></th>'+
				'<th colspan="5"><span class="com-dpt-year">'+date_obj.year+'</span><span class="com-dpt-month">'+cfg.months[date_obj.month-1]+'</span></th>'+
				'<th><span class="com-dpt-next-btn"></span></th>'+
			'</tr>'+
			'<tr>'+day_str+'</tr>'+
			'</thead>'+
			'<tbody>' +date_str+'</tbody></table>';
		html += '</div>';
		return html;
	};

	var set_date = function($relate_node, date){
		$relate_node.val(date);
	};

	var common_panel_tip;
	var show_common_panel = function($relate_node, date){
		if(!common_panel_tip){
			common_panel_tip = new Tip(get_html(date), $relate_node);
			var $dom = common_panel_tip.getDom();
			$dom.find('.ywj-tip-content').addClass('com-dpt-tip-content-wrap');
			$('body').click(function(e){
				if(e.target == $dom[0] || $.contains($dom[0], e.target) || e.target == $relate_node[0]){
					console.debug('inside');
					return;
				}
				console.debug('click outside');
				hide_common_panel();
			});

			//date click
			$dom.find('.com-dpt-date-panel tbody td').click(function(){

			});

			//year click
			$dom.find('.com-dpt-year').click(function(){

			});

			//year click
			$dom.find('.com-dpt-year').click(function(){

			});
		} else {
			var $dom = common_panel_tip.getDom().find('.ywj-tip-content');
			$dom.html(get_html(date));
			common_panel_tip.rel_tag = $relate_node;
		}
		common_panel_tip.show();
	};

	var hide_common_panel = function(){
		if(common_panel_tip){
			common_panel_tip.hide();
		}
	};

	var bind_node = function($node, param){
		if($node.attr('readonly') || $node.attr('disabled')){
			return;
		}

		$node.focus(function(){
			show_common_panel($(this), this.value);
		});
	};

	return {
		nodeInit: bind_node
	}
});
//../src/component/edit.js
define('ywj/edit', function(require){
	var $ = require('jquery');
	var Msg = require('ywj/msg');
	var Net = require('ywj/net');
	var lang = require('lang/$G_LANGUAGE');

	var css =
		".ywj-edit-btn {display:none; position:absolute; z-index:11;}" +
		".ywj-edit-btn span {display:inline-block; text-transform:capitalize; text-align:center; opacity:0.4; padding:2px 8px; margin-left:-20px; line-height:20px; background-color:white; border:1px solid #ddd; border-radius:3px; cursor:pointer; box-shadow:1px 1px 8px #cecece;}" +
		".ywj-edit-btn span:hover {opacity:1;}";
	$('<style>' + css + '</style>').appendTo('head');

	var tm;
	var $btn;

	var show = function($node, e){
		clearTimeout(tm);
		if(!$btn){
			$btn = $('<div class="ywj-edit-btn"><span></span></div>').appendTo('body');
		}
		$btn.find('span').html(lang('双击编辑'));
		$btn.show();
		if(e){
			$btn.css({
				top: $node.offset().top + $node.outerHeight(),
				left: e.clientX
			});
		}
	}
	var hide = function(){
		if($btn){
			tm = setTimeout(function(){
				$btn.hide();
			}, 10);
		}
	}
	var fun_make_input = function($node, not_null){
		var txt = $node.text();
		var name = $node.data('name');
		var $parent = $node.parent();
		$node.css('display', 'none');
		var input_html = "<input class='txt' " +
			"data-name='" + name + "' " +
			"data-action='" + $node.data('action') + "'" +
			"data-origin='" + txt + "'" +
			"\>";
		$node.after(input_html);
		var $input = $parent.find("input[data-name='" + name + "']");
		if(not_null){
			$input.focus();
		}
		$input.val(txt);
		$parent.delegate("input[data-name='" + name + "']", "blur", function(){
			var $input = $(this);
			var name = $input.data('name');
			var txt = $input.data('origin');
			var value = $input.val();

			if(not_null && (txt == value || value == '')){
				$node.show();
				$input.remove();
				$parent.undelegate("blur");
				return false;
			}
			if(!not_null && value == ''){
				return false;
			}
			var url = $input.data('action');
			url += (url.indexOf('?') ? "&" : "?") + name + "=" + value;
			Net.get(url, {}, function(rsp){
				if(rsp.code){
					Msg.showError(rsp.message);
					return false;
				}else{
					Msg.show('操作成功', 'succ');
					setTimeout(function(){
						window.location.reload();
					}, 1000)
				}
			})
		});
	}

	return {
		nodeInit: function($node, param){
			if(!$node.text()){
				fun_make_input($node, false);
			}else{
				$node.addClass('content-copy-able')
				$node.hover(function(e){
					show($node, e)
				}, hide);
				$node.dblclick(function(){
					fun_make_input($node, true);
				});
			}

		}
	}
});
//../src/component/FileSaver.js
define('ywj/FileSaver', function(){
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2013-12-27
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See LICENSE.md
 */

/*global self */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs
  || (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator))
  || (function(view) {
	"use strict";
	var
		  doc = view.document
		  // only get URL when necessary in case BlobBuilder.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, URL = view.URL || view.webkitURL || view
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link =  !view.externalHost && "download" in save_link
		, click = function(node) {
			var event = doc.createEvent("MouseEvents");
			event.initMouseEvent(
				"click", true, false, view, 0, 0, 0, 0, 0
				, false, false, false, false, 0, null
			);
			node.dispatchEvent(event);
		}
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function (ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		, deletion_queue = []
		, process_deletion_queue = function() {
			var i = deletion_queue.length;
			while (i--) {
				var file = deletion_queue[i];
				if (typeof file === "string") { // file is an object URL
					URL.revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			}
			deletion_queue.length = 0; // clear queue
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, FileSaver = function(blob, name) {
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, get_object_url = function() {
					var object_url = get_URL().createObjectURL(blob);
					deletion_queue.push(object_url);
					return object_url;
				}
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_object_url(blob);
					}
					if (target_view) {
						target_view.location.href = object_url;
					} else {
                        window.open(object_url, "_blank");
                    }
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_object_url(blob);
				// FF for Android has a nasty garbage collection mechanism
				// that turns all objects that are not pure javascript into 'deadObject'
				// this means `doc` and `save_link` are unusable and need to be recreated
				// `view` is usable though:
				doc = view.document;
				save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a");
				save_link.href = object_url;
				save_link.download = name;
				var event = doc.createEvent("MouseEvents");
				event.initMouseEvent(
					"click", true, false, view, 0, 0, 0, 0, 0
					, false, false, false, false, 0, null
				);
				save_link.dispatchEvent(event);
				filesaver.readyState = filesaver.DONE;
				dispatch_all();
				return;
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									deletion_queue.push(file);
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name) {
			return new FileSaver(blob, name);
		}
	;
	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	view.addEventListener("unload", process_deletion_queue, false);
	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined") module.exports = saveAs;
return saveAs;
});
//../src/component/fileuploader.js
/**
 * 文件上传组件，仅支持html5浏览器
 * 数据返回格式：
 * {
	code: 0,    //返回码，0表示成功，其他为失败
	message: '成功',  //后台返回成功（错误）信息
	data: {
        src: 'http://www.baidu.com/a.gif',  //用于前端显示的文件路径
        value: 'a.gif'                      //用于表单提交的输入框值
    }
 *
 */
define('ywj/fileuploader', function(require){
	seajs.use('ywj/resource/fileuploader.css');
	var $ = require('jquery');
	var Net = require('ywj/net');
	var lang = require('lang/$G_LANGUAGE');
	var Util = require('ywj/util');
	var PRIVATES = {};
	var _guid = 1;
	var console = window.console || function(){};

	if(!window.Worker){
		console.error('Simple file uploader no support');
		return function(){};
	}

	var guid = function(){
		return '_su_file_'+_guid++;
	};

	var TPL = '<div class="com-fileuploader com-fileuploader-normal">'+
					'<label class="com-fileuploader-file">'+
						'<input type="file">'+
						'<span>'+lang('上传文件')+'</span>'+
					'</label>'+
					'<span class="com-fileuploader-progress">'+
						'<progress min="0" max="100" value="0">0%</progress>'+
						'<span>0%</span>'+
					'</span>'+
					'<span class="com-fileuploader-content"></span>'+
					'<span class="com-fileuploader-handle">'+
						'<span class="com-fileuploader-upload com-fileuploader-btn">'+lang('开始上传')+'</span>'+
						'<span class="com-fileuploader-reload com-fileuploader-btn">'+lang('重新上传')+'</span>'+
						'<span class="com-fileuploader-cancel com-fileuploader-btn">'+lang('取消上传')+'</span>'+
						'<span class="com-fileuploader-download com-fileuploader-btn">'+lang('下载')+'</span>'+
						'<span class="com-fileuploader-delete com-fileuploader-btn">'+lang('删除')+'</span>'+
					'</span>'+
				'</div>';

	var COM_CLASS = 'com-fileuploader';
	var COM_CLASS_CONTAINER = COM_CLASS;
	var COM_CLASS_CONTENT = COM_CLASS+'-content';
	var COM_CLASS_UPLOAD_NORMAL = COM_CLASS+'-normal';
	var COM_CLASS_UPLOADING = COM_CLASS+'-uploading';
	var COM_CLASS_UPLOAD_FAIL = COM_CLASS+'-error';
	var COM_CLASS_UPLOAD_SUCCESS = COM_CLASS+'-success';

	/**
	 * percent check
	 * @param UP
     * @param callback
	 * @param interval
	 */
	var percent_check = function(UP, callback, interval){
		if(!UP.config.PROGRESS_URL){
			console.warn('UPLOAD PROGRESS NO FOUND');
			return;
		}

		var PRI = PRIVATES[UP.id];
		if(PRI.abort){
			return;
		}

		interval = interval || 100;
		var xhr = navigator.appName == "Microsoft Internet Explorer" ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		xhr.withCredentials = true;
		xhr.open('GET', UP.config.PROGRESS_URL);
		xhr.onreadystatechange = function(){
			if(PRI.abort){
				return;
			}
			if(this.readyState == 4){
				var rsp = this.responseText;
				if(rsp < 100){
					callback(rsp);
					setTimeout(function(){
						percent_check(UP, callback, interval);
					}, interval);
				} else {
					callback(100);
				}
			}
		};
		xhr.send(null);
	};

	var on_start = function(UP){
		call_param_fn(UP, 'on_start');
		UP.onStart();
	};

	/**
	 * abort uploading
	 */
	var on_abort = function(UP){
		call_param_fn(UP, UP.config.on_abort);
		var PRI = PRIVATES[UP.id];
		PRI.xhr.abort();
		PRI.abort = true;
		update_dom_state(UP, COM_CLASS_UPLOAD_NORMAL);
		UP.onAbort();
	};

	var on_delete = function(UP){
		call_param_fn(UP, UP.config.ondelete);
		UP.onDelete()
	};

	var call_param_fn = function(UP, fn_str){
		if(!fn_str || !window[fn_str]){
			return false;
		}
		var fn = window[fn_str];
		var PRI = PRIVATES[UP.id];
		fn(UP, PRI.container);
	};

	/**
	 * update dom state
	 * @param UP
	 * @param to
	 */
	var update_dom_state = function(UP, to){
		to = to || COM_CLASS_UPLOAD_NORMAL;
		var PRI = PRIVATES[UP.id];
		PRI.container.attr('class', COM_CLASS_CONTAINER + ' '+to);
		PRI.progress.val(0);
		PRI.progress_text.html('0%');

		//required
		PRI.trigger_file.attr('required', false);
		PRI.file.attr('required', false);
		switch(to){
			case COM_CLASS_UPLOAD_NORMAL:
				PRI.file.attr('required', UP.required);
				PRI.input.val('');
				PRI.container.find('.com-fileuploader-file-name').val('');
				break;

			case COM_CLASS_UPLOAD_FAIL:
			case COM_CLASS_UPLOADING:
				PRI.trigger_file.attr('required', UP.required);
				break;
		}
	};

	/**
	 * on upload response
	 * @param UP
	 * @param rsp_str
	 */
	var on_response = function(UP, rsp_str){
		call_param_fn(UP, 'on_response');
		UP.onResponse(rsp_str);
		var rsp = {};
		try {
			rsp = JSON.parse(rsp_str);
		} catch(ex){
			on_error(UP, ex.message);
		}
		if(rsp.code == '0'){
			on_success(UP, rsp.message, rsp.data);
		} else {
			on_error(UP, rsp.message || lang('后台有点忙，请稍后重试'));
		}
		console.debug('response string:', rsp_str,'response json:', rsp);
	};

	/**
	 * 正在上传
	 * @param UP
	 * @param percent
	 */
	var on_uploading = function(UP, percent){
		call_param_fn(UP, 'on_uploading');
		update_dom_state(UP, COM_CLASS_UPLOADING);
		PRIVATES[UP.id].progress.val(percent);
		PRIVATES[UP.id].progress_text.html(percent+'%');
		UP.onUploading(percent);
	};

	var get_ext = function(url){
		return url.split('.').pop().toLowerCase();
	};

	var get_name = function(url){
		if(!url){
			return '';
		}
		var tmp = /[\/|\\]([^\/\\]+)\.[^\/\\]+$/.exec(url);
		return tmp ? tmp[1] : '';
	};

	/**
	 * 上传成功
	 * @param UP
	 * @param message
	 * @param data
	 */
	var on_success = function(UP, message, data){
		update_dom_state(UP, COM_CLASS_UPLOAD_SUCCESS);
		var PRI = PRIVATES[UP.id];
		var ext = get_ext(data.value);
		var file_name = Util.htmlEscape(data.name || get_name(PRI.file.data('org-file')) || get_name(data.src));
		var name_field = UP.config.name || '';
		var file_size = data.file_size || '';

		var html = '<span class="com-fileuploader-file-icon com-fileuploader-file-icon-'+ext+'"></span>';
		html += '<input class="com-fileuploader-file-name" type="text" name="'+name_field+'"' +(!name_field ? 'readonly="readonly"':'')+' value="'+file_name+'" placeholder="文件名"/>';
		html += '<span class="com-fileuploader-file-ext">.'+ext+'</span>';
		if(file_size) html += '<span class="com-fileuploader-file-size"> '+file_size+'</span>';

		PRI.container.find('.'+COM_CLASS_CONTENT).html(html);
		PRI.input.val(data.value);
		PRI.input.data('src', data.src);
		UP.onSuccess(message, data);
	};

	/**
	 * 上传错误
	 * @param UP
	 * @param message
	 */
	var on_error = function(UP, message){
		call_param_fn(UP, 'on_error');
		update_dom_state(UP, COM_CLASS_UPLOAD_FAIL);
		var m = message || lang('上传失败，请稍候重试');
		PRIVATES[UP.id].container.find('.'+COM_CLASS_CONTENT).html('<span title="'+m+'">'+m+'</span>');
		UP.onError(message);
	};

	/**
	 * Uploader
	 * @param input
	 * @param config
	 */
	var Uploader = function(input, config){
		input = $(input);
		if(input.attr('disabled') || input.attr('readonly')){
			console.info('input readonly', input[0]);
			return;
		}

		var _this = this;
		var required = input.attr('required');
		input.attr('required', '');

		this.id = guid();
		var PRI = {};
		PRIVATES[this.id] = PRI;

		this.config = $.extend({
			UPLOAD_URL: '',
			PROGRESS_URL: ''
		}, config);

		if(!this.config.UPLOAD_URL){
			throw "NO UPLOAD_URL PARAMETER FOUND";
		}
		this.config.UPLOAD_URL = Net.mergeCgiUri(_this.config.UPLOAD_URL);

		input.hide();
		PRI.input = input;
		PRI.required = required;
		PRI.container = $(TPL).insertAfter(input);
		PRI.progress = PRI.container.find('progress');
		PRI.progress_text = PRI.progress.next();
		PRI.content = PRI.container.find('.'+COM_CLASS_CONTENT);
		PRI.file = PRI.container.find('input[type=file]');
		PRI.container.find('.com-fileuploader-file span').html(lang('选择文件'));
		PRI.trigger_file = $('<input type="file"/>').appendTo(PRI.container.find('.com-fileuploader-handle'));

		PRI.xhr = Net.postFormData({
			url: _this.config.UPLOAD_URL,
			onLoad: function(){
				if(PRI.xhr.status === 200){
					on_response(_this, PRI.xhr.responseText);
				} else {
					on_error(_this, lang('后台有点忙，请稍后重试'));
				}
			},
			onProgress: function(percent){
				on_uploading(_this, percent);
			},
			onError: function(e){
				console.error(e);
			}
		});

		PRI.container.delegate('.com-fileuploader-delete', 'click', function(){
			update_dom_state(_this, COM_CLASS_UPLOAD_NORMAL);
			on_delete(_this);
		});

		PRI.container.delegate('.com-fileuploader-file-name', 'focus', function(){
			this.select(this);
		});

		PRI.container.delegate('.com-fileuploader-download', 'click', function(){
			var url = PRI.input.data('src') || PRI.input.val();
			var name = PRI.container.find('.com-fileuploader-file-name').val();
			name = name || get_name(PRI.input.val());
			console.debug('download:', name, url);
			Net.download(url, name);
		});

		PRI.container.find('.com-fileuploader-reload').click(function(){
			PRI.file.trigger('click');
		});

		PRI.container.find('.com-fileuploader-cancel').click(function(){
			update_dom_state(_this, COM_CLASS_UPLOAD_NORMAL);
			on_abort(_this);
		});

		PRI.file.on('change', function(){
			if(!this.files[0]){
				return;
			}
			//add file
			var formData = new FormData();
			var i;
			if(this.files){
				for(i=0; i<this.files.length; i++){
					formData.append($(this).attr('name'), this.files[i]);
				}
			}
			$(this).data('org-file', this.value);
			$(this).val('');
			_this.send(formData);
		});

		//初始化
		if(PRI.input.val()){
			var src = PRI.input.data('src') || PRI.input.val();
			var val = PRI.input.val();
			on_success(_this, null, {
				src: src,
				value: val,
				name: config.namevalue,
				file_size: config.filesize,
				more: []
			});
		} else {
			update_dom_state(_this, COM_CLASS_UPLOAD_NORMAL);
		}
	};

	Uploader.prototype.send = function(formData){
		var PRI = PRIVATES[this.id];

		//add param
		var param = PRI.input.data('param');
		if(param){
			var data = Net.parseParam(param);
			for(var i in data){
				formData.append(i, data[i]);
			}
		}

		PRI.xhr.open('POST', this.config.UPLOAD_URL, true);
		PRI.xhr.send(formData);
		PRI.abort = false;
		var _this = this;

		on_start(_this);
		update_dom_state(_this, COM_CLASS_UPLOADING);
		percent_check(_this, function(p){
			if(p != 100){
				return on_uploading(_this, p);
			}
		});
	};

	Uploader.prototype.getVar = function(key){return PRIVATES[this.id][key];};
	Uploader.prototype.selectFile = function(){PRIVATES[this.id].file.trigger('click');};
	Uploader.prototype.onSuccess = function(message, data){};
	Uploader.prototype.onAbort = function(){};
	Uploader.prototype.onResponse = function(rsp_str){};
	Uploader.prototype.onUploading = function(percent){};
	Uploader.prototype.onDelete = function(message){};
	Uploader.prototype.onError = function(message){};
	Uploader.prototype.onStart = function(message){};

	Uploader.nodeInit = function($node, param){
		new Uploader($node, $.extend({
			UPLOAD_URL: Net.mergeCgiUri(window['UPLOAD_URL'], {type:'file'}),
			PROGRESS_URL: window['UPLOAD_PROGRESS_URL']
		}, param || {}));
	};
	return Uploader;
});
//../src/component/fixdate.js
/**
 * Created by sasumi on 2014/12/2.
 */
define('ywj/fixdate', function(require){
	var $ = require('jquery');
	var $body = $('body');

	var format = function(val, fmt){
		return val;
	};

	var init = function(){
		$('input[type=date]').each(function(){
			var $this = $(this);
			if($this.data('fd-binded') || $this.data('format')){
				return;
			}
			$this.data('fd-binded', 1);

			var fmt = $this.data('format');
			if($this.val()){
				$this.val(format($this.val(), fmt));
			}
			$this.on('change keyup', function(){
				$this.val(format($this.val(), fmt));
			});
		});
	};

	$body.on('DOMSubtreeModified propertychange', function() {
		init();
	});
	init();
});
//../src/component/FixedBottom.js
/**
 * 底部固定
 */
define('ywj/FixedBottom',function(require){
	var Util = require('ywj/util');
	var cls = 'fixed-bottom';
	var css = '.'+cls+' {position:fixed; bottom:0; background-color:#ffffffd9}';
	$('<style>'+css+'</style>').appendTo($('head'));

	return {
		nodeInit: function($node){
			var height = $node.height();
			var width = $node.width();
			var outer_height = $node.outerHeight();
			var outer_width = $node.outerWidth();
			var $shadow = $('<'+$node[0].nodeName+'>');
			$shadow.css('visibility', 'hidden').width(outer_width).height(outer_height).hide();
			$shadow.insertAfter($node);
			$(window).scroll(function(){
				var top = $node.offset().top;
				var scroll_top = $(this).scrollTop();
				var vh = Util.getRegion().visibleHeight;
				if(scroll_top+vh > (top+outer_height)){
					$node.removeClass(cls).removeAttr('height').removeAttr('width');
					$shadow.hide();
				} else {
					$node.addClass(cls).height(height).width(width);
					$shadow.show();
				}
			}).trigger('scroll');
		}
	}
});
//../src/component/fixedhead.js
define('ywj/fixedhead', function (require) {
	var $ = require('jquery');
	var FIXED_CLASS = 'fixed-top-element';
	var tpl = '<div id="table-fixed-header" style="display:none;"><table></table></div>';

	var foo = function(fixed_els){
		var $body = $('body');
		var $fixed_els = $(fixed_els);

		$fixed_els.each(function(){
			var $tbl = $(this);
			var $header_wrap = $(tpl).appendTo($body);
			var $table_header = $header_wrap.find('table');
			$table_header.addClass($tbl.attr('class'));
			$tbl.find("thead").clone().appendTo($table_header);
			var org_top = $tbl.offset().top;

			//scroll
			$(window).scroll(function(){
				var scroll_top = $(window).scrollTop();
				var $shadow = $('#table-fixed-header');
				if(org_top < scroll_top){
					$shadow.addClass(FIXED_CLASS).show();
				} else {
					$shadow.removeClass(FIXED_CLASS).hide();
				}
			}).trigger('scroll');

			//fix width
			$(window).resize(function(){
				var $org_ths = $tbl.find('th');
				$table_header.width($tbl.outerWidth());
				$header_wrap.css('left', $tbl.offset().left);
				$header_wrap.find('th').each(function(k, v){
					if(k == 0 && $org_ths.eq(k).find('input[type=checkbox]').size()){
						return; //ignore first cell has checkbox. for auto adjust
					}
					$(this).removeAttr('width');
					$(this).width($org_ths.eq(k).width());
				});
			}).trigger('resize');
		});
	};
	foo.nodeInit = function($node){
		foo($node);
	};
	return foo;
});
//../src/component/FormReset.js
/**
 * 表单重置清除按钮
 */
define('ywj/FormReset', function (require) {
	return {
		nodeClick: function($node){
			var $form = $node.closest('form');
			if(!$form.size() || !$form.attr('action')){
				return;
			}
			location.href = $form.attr('action');
		}
	};
});
//../src/component/highlight.js
/**
 * 表单重置清除按钮
 */
define('ywj/highlight', function (require) {
	var _ = require('jquery/highlight');

	return {
		nodeInit: function($node, param){
			var kw = param;
			if(kw){
				$node.highlight(kw);
			}
		}
	};
});
//../src/component/hooker.js
/**
 * hooker
 * usage:
 * var MyHooker = Hooker(true);
 * MyHooker(function(name){
 *      console.log('hello', name);
 * });
 * MyHooker.listen(function(){
 *      console.log('good bye', name);
 * });
 * MyHooker.fire('world');
 */
define('ywj/hooker', function(require){
	var Util = require('ywj/util');

	/**
	 * 实例构造方法
	 * @param {Boolean} 缺省是否循环触发事件监听函数
	 */
	return function(default_recursive){
		var HK_MAP = [];
		var LAST_ARGS = [];
		var trigger_flag = false;

		//缺省调用为监听方法
		var hk = function(callback, recursive){
			return hk.listen(callback, recursive);
		};

		/**
		 * 事件触发
		 * （强制为异步）
		 * @returns {boolean|null}
		 */
		hk.fire = function(){
			if(!HK_MAP.length){
				return null;
			}
			var args = Util.toArray(arguments);
			LAST_ARGS = args;
			setTimeout(function(){
				var TMP_MAP = [];
				for(var i=0; i<HK_MAP.length; i++){
					var ret = HK_MAP[i].callback.apply(null, args);
					if(HK_MAP[i].recursive){
						TMP_MAP.push(HK_MAP[i]);
					}
					if(ret === false){
						return;
					}
				}
				HK_MAP = TMP_MAP;
			}, 0);
			return true;
		};

		/**
		 * 清空
		 */
		hk.clean = function(){
			HK_MAP = [];
		};

		/**
		 * 监听
		 * @param callback 回调处理函数
		 * @param recursive 是否重复执行
		 */
		hk.listen = function(callback, recursive){
			HK_MAP.push({
				callback: callback,
				recursive: recursive === undefined ? default_recursive : recursive
			});

			if(trigger_flag){
				hk.fire(LAST_ARGS);
			}
		};
		return hk;
	};
});
//../src/component/imagescale.js
(function(scope){
	var __remove_css_class = function(c, node_class){
		var r = new RegExp('(\\s|^)' + c + '(\\s|$)', 'g');
		return node_class.replace(r, ' ');
	};

	/**
	 * 图片缩放
	 * @param opt
	 * @param org_region
	 * @returns {{width: string, height: string, marginLeft: string, marginTop: string}}
	 * @private
	 */
	var __img_scale__ = function(opt, org_region){
		var w = org_region.width,
			h = org_region.height;
		var ml = 0, mt = 0,
			scale = 1, scalew, scaleh;

		//缺省放大小图
		if(opt.zoom_out === undefined){
			opt.zoom_out = true;
		}

		if(opt.minWidth || opt.minHeight){
			scalew = opt.minWidth / w;
			scaleh = opt.minHeight / h;

			if(!opt.zoom_out && scalew > 1 && scaleh > 1){
				scalew = scaleh = 1;
			}

			scale = Math.max(scalew, scaleh);
			w = w * scale;
			h = h * scale;
			ml = -(w-opt.minWidth)/2;
			mt = -(h-opt.minHeight)/2;
		} else {
			scalew = opt.maxWidth / w;
			scaleh = opt.maxHeight / h;
			if(!opt.zoom_out && scalew > 1 && scaleh > 1){
				scalew = scaleh = 1;
			}

			scale = Math.min(scalew, scaleh);
			w = w * scale;
			h = h * scale;
			ml = (opt.maxWidth - w)/2;
			mt = (opt.maxHeight - h)/2;
		}

		return {
			width: parseInt(w, 10)+'px',
			height: parseInt(h, 10)+'px',
			marginLeft: parseInt(ml, 10)+'px',
			marginTop: parseInt(mt, 10)+'px'
		};
	};

	/**
	 * 图片缩放
	 * @param img
	 * @private
	 */
	var __img_adjust__ = function(img){
		//是否放大图片,如果该项没有设置,默认采用放大图片处理
		var zoom_out = img.getAttribute('data-zoom-out');
		zoom_out = (zoom_out == null) ? true : (zoom_out != '0');

		if(img.getAttribute('data-img-miss') == '1'){
			img.parentNode.className = __remove_css_class('g-img-error', img.parentNode.className);
			img.parentNode.className += ' g-img-miss';
			img.style.width = 'auto';
			img.style.height = 'auto';
			var ph = img.parentNode.offsetHeight;
			var pw = img.parentNode.offsetWidth;
			var h = img.height;
			var w = img.width;
			if(ph > h){
				img.style.marginTop = parseInt((ph-h)/2, 10)+'px';
			}
		} else {
			img.style.marginTop = '0';
			var c =  __remove_css_class('g-img-error', img.parentNode.className);
			img.parentNode.className =  __remove_css_class('g-img-miss', c);

			var minw = img.getAttribute('data-min-width');
			var minh = img.getAttribute('data-min-height');
			var maxw = img.getAttribute('data-max-width');
			var maxh = img.getAttribute('data-max-height');

			if(!minw && !minh && !maxw && !maxh){
				maxw = img.parentNode.offsetWidth;
				maxh = img.parentNode.offsetHeight;
			}

			if(minw || minh || maxw || maxh){
				img.style.height = 'auto';
				img.style.width = 'auto';
				var scale_style = __img_scale__({
					minWidth: minw,
					minHeight: minh,
					maxWidth: maxw,
					maxHeight: maxh,
					zoom_out: zoom_out
				}, {width:img.width, height:img.height});
				for(var i in scale_style){
					img.style[i] = scale_style[i];
				}
			}
		}
	};

	/**
	 * 图片加载错误
	 * @param img
	 * @private
	 */
	var __img_error__ = function(img){
		var c = img.parentNode.className;
		if(img.getAttribute('src')){
			c = __remove_css_class('g-img-miss', c);
			c += ' g-img-error';
		} else {
			c = __remove_css_class('g-img-error', c);
			c += ' g-img-miss';
		}
		img.parentNode.className = c;
	};
	scope.__img_adjust__ = __img_adjust__;
	scope.__img_error__ = __img_error__;
	scope.__img_scale__ = __img_scale__;
})(window);

define('ywj/imagescale', function(){
	return {
		scale: __img_scale__,
		onLoad: __img_adjust__,
		onError: __img_error__
	};
});
//../src/component/imageviewer.js
define('ywj/imageviewer', function(require){
	require('ywj/resource/imageviewer.css');
	var Scale = require('ywj/imagescale');
	var $ = require('jquery');
	var Util = require('ywj/util');
	var AC = require('ywj/AutoComponent');
	var LOADING_SRC = seajs.data.base + 'component/resource/ring.gif';
	var ID = 'image-viewer-container';
	var NAV_DISABLE_CLASS = 'iv-nav-disabled';
	var SCROLL_DISABLE_CLASS = 'iv-list-nav-disabled';
	var HEIGHT_OFFSET = 120;

	var win;
	var loader_tm;

	var TPL =
		'<div class="image-viewer-container" id="'+ID+'">\
			<span class="iv-close-btn" title="关闭"></span>\
			<span class="iv-prev-btn"></span>\
			<span class="iv-next-btn"></span>\
			<div class="iv-zoom-wrap">\
				<span class="iv-zoom-btn iv-zoom-out" title="放大"></span>\
				<span class="iv-zoom-btn iv-zoom-real" title="原始尺寸"></span>\
				<span class="iv-zoom-btn iv-zoom-in" title="缩小"></span>\
				<a href="javascript:void(0);" target="_blank" class="iv-zoom-btn iv-zoom-src">原图<span class="iv-image-size-abs"></span></a>\
			</div>\
			<div class="iv-list">\
				<span class="iv-list-left"></span>\
				<span class="iv-list-wrap">\
					<ul></ul>\
				</span>\
				<span class="iv-list-right"></span>\
			</div>\
			<img class="iv-img"/>\
			<span class="iv-title"></span>\
			<span class="iv-description"></span>\
		</div>';

	//update
	(new Image()).src = LOADING_SRC;

	var Viewer = function(){};

	var get_stage_region = function(){
		var r = Util.getRegion(win);
		return {
			width: r.visibleWidth,
			height: r.visibleHeight
		}
	};

	var update_container = function($container){
		var st = $container.closest('body').scrollTop() || $container.closest('html').scrollTop();
		var sl = $container.closest('body').scrollLeft() || $container.closest('html').scrollLeft();
		$container.css({
			top: st,
			left: sl,
			width: get_stage_region().width,
			height: get_stage_region().height
		});
	};

	var update_list = function($list, $list_wrap){
		var region = get_stage_region();
		$list_wrap.width(region.width - parseInt($list_wrap.css('margin-left'), 10) - parseInt($list_wrap.css('margin-right'), 10));
	};

	var update_image = function($img, original_width, original_height){
		var region = get_stage_region();
		var max_height = region.height - HEIGHT_OFFSET;

		var scale_info = Scale.scale({
			zoom_out: false,
			maxWidth: region.width * 0.9,
			maxHeight: max_height
		}, {width:original_width, height:original_height});
		$img.css({
			width: scale_info.width,
			height: scale_info.height,
			left: (region.width - parseInt(scale_info.width, 10))/2+'px',
			top: (region.height - parseInt(scale_info.height, 10))/2 - 10 +'px'
		}).data('org-width', original_width).data('org-height', original_height);
	};

	var zoom_image = function($container, $img, width, height){
		var offset = $img.offset();
		var center_point = {
			left: offset.left + $img.width()/2,
			top: offset.top + $img.height()/2
		};
		$img.stop().animate({
			left: center_point.left - width/2 - $container.offset().left,
			top: center_point.top - height/2 - $container.offset().top,
			width: width,
			height: height
		});
	};

	Viewer.init = function($node, $iv_list){
		win = window;
		try {
			while(win.parent != win){
				win = win.parent;
			}
		} catch(ex){
			console.warn(ex);
		}

		var $body = $('body', win.document);
		var src = $node.attr('href');

		var $container = $(TPL).appendTo($body);
		var $next = $container.find('.iv-next-btn');
		var $img = $container.find('.iv-img');
		var $prev = $container.find('.iv-prev-btn');

		var $size_abs = $container.find('.iv-image-size-abs');

		var $zoom_in = $container.find('.iv-zoom-in');
		var $zoom_real = $container.find('.iv-zoom-real');
		var $zoom_out = $container.find('.iv-zoom-out');
		var $zoom_src = $container.find('.iv-zoom-src');

		var $title = $container.find('.iv-title');
		var $close = $container.find('.iv-close-btn');
		var $desc = $container.find('.iv-desc');
		var $list = $container.find('.iv-list');
		var $list_wrap = $list.find('.iv-list-wrap');
		var $list_left = $list.find('.iv-list-left');
		var $list_right = $list.find('.iv-list-right');

		var total = $iv_list.size();

		var original_overflow_y = $body.css('overflow-y');
		var original_overflow_x = $body.css('overflow-x');
		$body.css({
			overflowY: 'hidden',
			overflowX: 'hidden'
		});

		var show_index = function(idx){
			$prev[idx == 0 ? 'addClass':'removeClass'](NAV_DISABLE_CLASS).attr('title', idx == 0 ? '已经是第一张':'');
			$next[idx == (total-1) ? 'addClass' : 'removeClass'](NAV_DISABLE_CLASS).attr('title', idx == (total-1) ? '已经是最后一张':'');
			var src = $iv_list.eq(idx).attr('href');
			console.debug('load image:['+idx+']'+src);
			clearTimeout(loader_tm);
			loader_tm = setTimeout(function(){
				$img.attr('src', LOADING_SRC);
				update_image($img, 122, 122);
			}, 500);
			$zoom_src.attr('href', src);
			var img = new Image();
			img.onload = function(){
				clearTimeout(loader_tm);
				update_image($img, this.width, this.height);
				$size_abs.html('('+this.width + 'x' + this.height + ')');
				$img.attr('src', src);
			};
			img.src = src;
			index = idx;

			var $cur = $list.find('li').removeClass('active').eq(index).addClass('active');

			var scroll_left = $list_wrap.scrollLeft();
			var item_left = $cur.outerWidth() * index;
			var item_right = item_left + $cur.outerWidth();
			if(item_left < scroll_left){
				$list_wrap.stop().animate({
					scrollLeft: item_left
				}, function(){
					$list_wrap.trigger('scroll');
				});
			} else if(item_right > ($list_wrap.outerWidth() + scroll_left)){
				$list_wrap.stop().animate({
					scrollLeft: item_right - $list_wrap.outerWidth()
				}, function(){
					$list_wrap.trigger('scroll');
				});
			} else {
				$list_wrap.trigger('scroll');
			}
		};

		var index = 0;
		$iv_list.each(function(k, v){
			if(this == $node[0]){
				index = k;
				return false;
			}
		});

		if($iv_list.size() < 2){
			$next.hide();
			$prev.hide();
			$list.hide();
		} else {
			var html = '';
			$iv_list.each(function(k, v){
				var src = $(this).attr('href');
				var thumb = $(this).find('img').attr('src') || src;
				html += '<li>';
				html += '<span><img src="'+thumb+'" onload="__img_adjust__(this);" onerror="__img_error__(this);"/></span>';
				html += '</li>';
			});
			var $ul = $list.find('ul').html(html);
			$ul.width($ul.find('li:first').outerWidth() * $iv_list.size());
		}

		$next.click(function(){
			if($next.hasClass(NAV_DISABLE_CLASS)){
				return false;
			}
			show_index(index+1);
			return false;
		});

		$prev.click(function(){
			if($prev.hasClass(NAV_DISABLE_CLASS)){
				return false;
			}
			show_index(index-1);
			return false;
		});

		$close.click(function(){
			$body.css('overflow-y', original_overflow_y);
			$body.css('overflow-x', original_overflow_x);
			$container.remove();
			$container = null;
		});

		$zoom_in.click(function(){
			zoom_image($container, $img, $img.width()*1.3, $img.height()*1.3);
			return false;
		});

		$zoom_real.click(function(){
			zoom_image($container, $img, $img.data('org-width'), $img.data('org-height'));
			return false;
		});

		$zoom_out.click(function(){
			zoom_image($container, $img, $img.width()*0.7, $img.height()*0.7);
			return false;
		});

		$list.find('li').click(function(){
			show_index($(this).index());
			return false;
		});

		//zoom to real
		$img.dblclick(function(){
			var is_real = $img.data('org-width') == $img.width();
			if(!is_real){
				zoom_image($container, $img, $img.data('org-width'), $img.data('org-height'));
			}
			return false;
		});

		$list_wrap.on('scroll', function(){
			$list_left[$list_wrap.scrollLeft() == 0 ? 'addClass' : 'removeClass'](SCROLL_DISABLE_CLASS);
			var w = $list_wrap.width();
			var max_left = $list.find('ul').outerWidth() - w;
			if($list.find('ul').outerWidth() <= w || $list_wrap.scrollLeft() == max_left){
				$list_right.addClass(SCROLL_DISABLE_CLASS);
			} else {
				$list_right.removeClass(SCROLL_DISABLE_CLASS);
			}
		});

		$list_left.click(function(){
			if($(this).hasClass(SCROLL_DISABLE_CLASS)){
				return false;
			}
			var region = get_stage_region();
			var left = Math.max($list_wrap.scrollLeft()-region.width / 3, 0);
			$list_wrap.stop().animate({
				scrollLeft:left
			}, function(){
				$list_wrap.trigger('scroll');
			});
		});

		$list_right.click(function(){
			if($(this).hasClass(SCROLL_DISABLE_CLASS)){
				return false;
			}
			var max_left = $list.find('ul').outerWidth() - $list_wrap.width();
			var region = get_stage_region();
			var left = Math.min($list_wrap.scrollLeft()+region.width / 3, max_left);
			$list_wrap.stop().animate({
				scrollLeft: left
			}, function(){
				$list_wrap.trigger('scroll');
			});
		});

		var wheel_tm;
		var msw_evt =(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";
		$body.on(msw_evt, function(e){
			var org_event = e.originalEvent;
			if(!$container){
				return;
			}
			clearTimeout(wheel_tm);
			wheel_tm = setTimeout(function(){
				var delta = org_event.detail || org_event.wheelDelta || org_event.deltaY;
				if(delta > 0){
					$next.trigger('click');
				} else {
					$prev.trigger('click');
				}
			}, 10);
		});

		$body.keydown(function(e){
			if(!$container){
				return;
			}
			switch(e.keyCode){
				case Util.KEYS.ESC:
					$close.trigger('click');
					e.stopPropagation();
					e.preventDefault();
					return false;

				case Util.KEYS.LEFT:
					$prev.trigger('click');
					break;

				case Util.KEYS.RIGHT:
					$next.trigger('click');
					break;

				case Util.KEYS.UP:
					$zoom_out.trigger('click');
					break;

				case Util.KEYS.DOWN:
					$zoom_in.trigger('click');
					break;
			}
		});

		//move
		var $current_img = null;
		var last_region, last_pos;
		$container.delegate('img', 'mousedown', function(e){
			if(!$container){
				return;
			}
			$current_img = $(this);
			last_pos = {
				x: e.clientX,
				y: e.clientY
			};
			last_region = {
				x: $(this).offset().left,
				y: $(this).offset().top
			};
			return false;
		});
		$('body', win.document).mouseup(function(){
			$current_img = false;
		});
		$('body', win.document).mousemove(function(e){
			if($current_img && $container){
				$current_img.css({
					left: last_region.x + e.clientX - last_pos.x - $container.offset().left,
					top: last_region.y + e.clientY - last_pos.y - $container.offset().top
				});
				return false;
			}
		});

		//resize
		$(win).resize(function(){
			if($container){
				update_container($container);
				update_list($list, $list_wrap);
			}
		});

		update_container($container);
		update_list($list, $list_wrap);
		show_index(index);
	};

	Viewer.nodeClick = function($node, param){
		if($node[0].tagName !== 'A' || !$node.attr('href')){
			throw "view node click only take effect on link node";
		}
		var scope = param.scope || 'body';
		var $iv_list = $(scope + ' [data-component]').filter(function(){return AC.nodeHasComponent($(this), 'ywj/imageviewer');});
		Viewer.init($node, $iv_list);
		return false;
	};
	return Viewer;
});
//../src/component/imgslide.js
define('ywj/imgslide', function (require) {
	var imgslide_css_url = seajs.resolve('ywj/resource/imgslide.css');
	var tmpl = require('ywj/tmpl');

	var top_doc;

	try {
		top_doc = parent.document;
	} catch(ex){}
	top_doc = top_doc || document;
	$('head', top_doc).append('<link rel="stylesheet" type="text/css" href="'+imgslide_css_url+'"/>');

	var IMG_SLIDE_TPL = '<div class="ui-img-slide">' +
		'<div class="g-slide" data-hover="1" id="g-slide">'+
		'<ul class="g-slide-list"><li><span class="g-slide-img"><img src="<%=slide.current_img.src%>" alt="<%=slide.current_img.title%>" class="bigImg"></span></li></ul>'+
			'<div class="g-slide-tp">'+
				'<a class="g-slide-prev" href="javascript:void(0);"><span>上一张</span></a>'+
				'<a class="g-slide-next" href="javascript:void(0);"><span>下一张</span></a>'+
			'</div>'+
		'</div>'+
		'<p class="g-pic-intro"><%=slide.title%></p>'+
		'<div class="image-viewer-selector">'+
			'<a href="javascript:void(0);" class="slide-left-btn"><span>scroll left</span></a>'+
			'<a href="javascript:void(0);" class="slide-right-btn"><span>scroll right</span></a>'+
			'<div class="image-view-selector-content-wrap">'+
				'<ul class="image-viewer-selector-list" style="width: 5160px; margin-left: 0;">'+
				'<% for (var k=0; k<slide.img_list.length; k++){ var img = slide.img_list[k];%>' +
					'<li data-img_id="<%=k%>" class="uiSliderImg"><i></i>'+
						'<a href="javascript:void(0);" title="<%=img.title%>"><img src="<%=img.src%>" data-big_img="<%=img.big_img%>" alt="<%=img.title%>" onload="__img_adjust__(this)" data-min-width="85" data-min-height="85"></a>'+
					'</li>'+
				'<%}%>'+
				'</ul>'+
			'</div>'+
		'</div>'+
		'<a href="javascript:void(0);" title="点击关闭" class="scan-close"></a>'+
	'</div>'+
	'<div class="ui-img-layer"></div>';

	var IMG_SLIDE_DATA = {
		current_img: {
			index: 0,
			title: '',
			src: ''
		},
		img_list: [],
		title: '',
		group_id:'0_0'
	};

	var IMG_SLIDE = function () {
	};

	IMG_SLIDE.prototype = {
		config: {
			img_tag: "img[rel=slide-img]",
			img_parent_tag: "*[rel=img-slide]"
		},
		_TPL_OBJ: null,

		//初始化数据，根据当前img查找并组合数据
		_initData: function ($img) {
			var cfg = this.config;
			var $slideContainer = $img.parents(cfg.img_parent_tag);
			IMG_SLIDE_DATA.title = $slideContainer.attr("title") || '';
			IMG_SLIDE_DATA.group_id = $slideContainer.attr("slide-group");
			IMG_SLIDE_DATA.img_list = [];
			$slideContainer.find(cfg.img_tag).each(function (index) {
				var self = $(this);
				if (self.data('img_id') == $img.data('img_id')) {
					IMG_SLIDE_DATA.current_img = {
						index: index,
						title: self.attr('title') || '',
						src: self.data('big_img') || ''
					};
				}
				IMG_SLIDE_DATA.img_list.push({
					src: self.attr('src'),
					title: self.attr('title') || '',
					big_img: self.data('big_img') || ''
				});
			});
		},

		//初始化当前页的slide group
		_initSlideGroup: function () {
			var cfg = this.config;
			var group = [];
			$(cfg.img_parent_tag).each(function () {
				var _this = $(this);
				var slideGroup = _this.attr('slide-group');
				if (!slideGroup) {
					group[0] = isNaN(group[0]) ? 0 : ++group[0];
					_this.attr('slide-group', 0+'_'+group[0]);
				}else{
					group[slideGroup] = isNaN(group[slideGroup]) ? 0 : ++group[slideGroup];
					_this.attr('slide-group', slideGroup+'_'+group[slideGroup]);
				}

				_this.find(cfg.img_tag).each(function(index){
					$(this).data('img_id',index);
				});
			});
		},

		//格化式slide的html
		_formatHtml: function () {
			this._TPL_OBJ = $(tmpl(IMG_SLIDE_TPL, {slide:IMG_SLIDE_DATA}));
		},

		//下一个图片集
		_nextGroup: function(){
			var cfg = this.config;
			var that = this;
			var cg = IMG_SLIDE_DATA.group_id;
			var cg_arr = cg.split('_');
			var ng = cg_arr[0]+'_'+(parseInt(cg_arr[1])+1);
			var $nextGroup = $('*[slide-group='+ng+']');
			if ($nextGroup.length <= 0) {
				return false;
			}

			var $img = $nextGroup.find(cfg.img_tag).first();
			that.close();
			$img.click();
		},

		//上一个图片集
		_preGroup:function(){
			var cfg = this.config;
			var that = this;
			var cg = IMG_SLIDE_DATA.group_id;
			var cg_arr = cg.split('_');
			var ng = cg_arr[0]+'_'+(parseInt(cg_arr[1])-1);
			var $nextGroup = $('*[slide-group='+ng+']');
			if ($nextGroup.length <= 0) {
				return false;
			}

			var $img = $nextGroup.find(cfg.img_tag).last();
			that.close();
			$img.click();
		},

		//初始化
		init: function () {
			var cfg = this.config;
			var that = this;
			that._initSlideGroup();

			$('body').delegate(cfg.img_tag, 'click', function(){
				that._initData($(this));
				that._formatHtml();
				that.show();
			});
		},

		//绑定事件
		handleEvent: function(){
			var that = this;
			var PER_WIDTH = 86;
			var $CLOSE_BTN = this._TPL_OBJ.find(".scan-close");

			var $SLIDE_IMG = this._TPL_OBJ.find(".uiSliderImg");
			var $SELECTOR = this._TPL_OBJ.find('.image-viewer-selector-list');
			var $SELECTOR_WRAP = this._TPL_OBJ.find('.image-view-selector-content-wrap');
			var $SLIDE_NEXT = this._TPL_OBJ.find('.slide-right-btn,.g-slide-next');
			var $SLIDE_PREV = this._TPL_OBJ.find('.slide-left-btn,.g-slide-prev');
			var $BIG_IMG = this._TPL_OBJ.find('.bigImg');

			function moveCenter(){
				if($SELECTOR.outerWidth() < $SELECTOR_WRAP.outerWidth()){
					return;
				}

				var maxMoveNum = IMG_SLIDE_DATA.img_list.length - $SELECTOR_WRAP.outerWidth()/PER_WIDTH;
				var cur = $('.active', $SELECTOR);
				var center_left = $SELECTOR_WRAP.outerWidth()/2;
				var now_left = $(cur).offset().left - $SELECTOR.offset().left + $(cur).outerWidth()/2;
				var ml = now_left - center_left;

				ml = Math.min(ml, maxMoveNum*PER_WIDTH);
				$SELECTOR.animate({
					marginLeft: ml>0 ? -ml : 0
				}, 300);
			}

			//向右移动
			function moveRight(){
				var maxMoveNum = IMG_SLIDE_DATA.img_list.length - $SELECTOR_WRAP.outerWidth()/PER_WIDTH;
				maxMoveNum = maxMoveNum <= 0 ? 0 : maxMoveNum;
				var moveLeft = parseInt($SELECTOR.css('margin-left'));
				var ml = (moveLeft - PER_WIDTH) > 0 ? 0 : moveLeft - PER_WIDTH;
				$SELECTOR.stop().animate({
					marginLeft: Math.max(ml, -maxMoveNum*PER_WIDTH)
				}, 300);
			}

			//向左移动
			function moveLeft(){
				var moveLeft = parseInt($SELECTOR.css('margin-left'));
				if (moveLeft >= 0) {
					return false;
				}
				$SELECTOR.stop().animate({
					marginLeft: Math.min(moveLeft + PER_WIDTH, 0)
				}, 300);
			}

			function showBigImg($img){
				$BIG_IMG.attr({
					title:$img.attr('title'),
					src:$img.data("big_img")
				});
			}

			function changeSize()
			{
				var bigImgMaxHeight = $(window).height() - $SELECTOR_WRAP.outerHeight() - 40;
				$BIG_IMG.css("max-height",bigImgMaxHeight);
			}

			$(window).resize(function(){
				changeSize();
			});

			//小图片点击
			$SLIDE_IMG.click(function(){
				var _this = $(this);
				var curId = parseInt(_this.data('img_id'));
				var $active = $SELECTOR.find(".active");

				if ($active.length > 0) {
					var activeId = parseInt($active.data('img_id'));

					if (_this.hasClass("active")) {
						return false;
					}

					if (curId > activeId) {
						moveRight();
					}

					if (curId < activeId && curId >= 0) {
						moveLeft();
					}
					$active.removeClass("active");
					_this.addClass("active");
				}else{
					_this.addClass("active");
					moveCenter();
				}

				showBigImg(_this.find("img"));
			});

			//点击下一个
			$SLIDE_NEXT.click(function(){
				var $next = $SELECTOR.find(".active").next();
				if ($next.length > 0) {
					$next.click();
				}else{
					that._nextGroup();
				}
			});

			//点击向一个
			$SLIDE_PREV.click(function(){
				var $pre = $SELECTOR.find(".active").prev();
				if ($pre.length > 0) {
					$pre.click();
				}else{
					that._preGroup();
				}
			});

			//点击关闭
			$CLOSE_BTN.click(function(){
				that.close();
			});
		},

		//显示
		show: function () {
			this.handleEvent();
			$('body').append(this._TPL_OBJ);
			this._TPL_OBJ.find('[data-img_id='+IMG_SLIDE_DATA.current_img.index+']').click();
			$(window).resize();
		},

		//关闭
		close: function () {
			this._TPL_OBJ.remove();
		}

	};
	return new IMG_SLIDE;
});
//../src/component/ladder.js
/**
 * ladder plugin
 * <p>
 * Usage: ladder('.ladder-list a', opt);
 * </p>
 */
define('ywj/ladder', function(require){
	var net = require('ywj/net');
	var $last_active_ladder = null;
	var ladder_scrolling = false;

	return function(ladder, opt) {
		opt = $.extend({
			onAfterScrollTo: function($ladder_node, aim){},
			onBeforeScrollTo: function(aim){},
			ladderActiveClass: 'ladder-active',
			dataTag: 'href',
			animateTime: 400,
			addHistory: true,
			bindScroll: true,
			scrollContainer: 'body',
			preventDefaultEvent: true
		}, opt || {});

		var $selector = $(ladder).find('['+opt.dataTag+']');

		/**
		 * scroll to aim
		 * @param aim
		 * @param $ladder_node
		 */
		var scroll_to = function(aim, $ladder_node){
			var $n = (!$(aim).size() && aim == '#top') ? $('body') : $(aim);
			if(!$n.size() || false === opt.onBeforeScrollTo(aim)){
				return;
			}
			var pos = $n.offset().top;
			if(opt.ladderActiveClass){
				if($last_active_ladder){
					$last_active_ladder.removeClass(opt.ladderActiveClass);
				}
				$ladder_node.addClass(opt.ladderActiveClass);
				$last_active_ladder = $ladder_node;
			}
			ladder_scrolling = true;

			$(opt.scrollContainer).animate({scrollTop: pos}, opt.animateTime, function(){
				//fix JQuery animate complete but trigger window scroll event once still(no reason found yet)
				setTimeout(function(){
					if(opt.addHistory){
						if(window.history && window.history.pushState){
							history.pushState(null, null, aim);
						} else {
							location.hash = aim;
						}
					}
					ladder_scrolling = false;
					opt.onAfterScrollTo($ladder_node, aim);
				}, 50);
			});
		};

		//bind ladder node click
		$selector.click(function(){
			var $node = $(this);
			var aim = $node.attr(opt.dataTag);
			if(aim != '#top' && !$(aim).size()){
				return;
			}

			if(!/^#\w+$/i.test(aim)){
				console.error('ladder pattern check fail: '+aim);
				return;
			}
			scroll_to(aim, $node);
			if(opt.preventDefaultEvent){
				return false;
			}
		});

		//init state from location hash information
		if(opt.addHistory){
			$(function(){
				$selector.each(function(){
					var aim = $(this).attr(opt.dataTag);
					var m = location.href.match(new RegExp(aim+'(&|#|$|=)'));
					if(m){
						//match anchor link node
						if($(aim).size() && $(aim)[0].tagName == 'A'){
							console.debug('ladder hit a:'+aim);
							return;
						}
						scroll_to(aim, $(this));
						return false;
					}
				});
			});
		}

		//bind scroll event
		if(opt.bindScroll){
			$(opt.scrollContainer == 'body' ? window : opt.scrollContainer).scroll(function(){
				var t = $(window).scrollTop();
				if(!ladder_scrolling){
					var $hit_node = null;
					var $hit_ladder_node = null;
					var hit_aim = '';
					$selector.each(function(){
						var $ladder_node = $(this);
						var aim = $ladder_node.attr(opt.dataTag);
						var $aim = $(aim);
						if($aim.size()){
							if(t >= $aim.offset().top){
								$hit_node = $aim;
								$hit_ladder_node = $ladder_node;
								hit_aim = aim;
							}
						}
					});

					if($hit_node){
						//make class
						if(opt.ladderActiveClass){
							if($last_active_ladder){
								$last_active_ladder.removeClass(opt.ladderActiveClass);
							}
							$hit_ladder_node.addClass(opt.ladderActiveClass);
							$last_active_ladder = $hit_ladder_node;
						}
						//trigger after scroll to
						opt.onAfterScrollTo($hit_ladder_node, hit_aim);
					}
				}
			}).trigger('scroll');
		}
	};
});

//../src/component/lang.js
/**
 * Created by Administrator on 2016/5/27.
 */
define('ywj/lang', function(require){
	var tmp = {};

	return function(text){
		if(!window['LANG_PACKAGE']){
			console.error('language package setting no found');
			return text;
		}
		var PACKAGE = window['LANG_PACKAGE'][window['G_LANGUAGE']];
		if(!PACKAGE){
			console.error('language package no found');
			return text;
		}
		if(!PACKAGE[text]){
			if(!tmp[text]){
				console.debug('translate fail:' + text, window['G_LANGUAGE'], PACKAGE);
				tmp[text] = true;
			}
			return text;
		}
		return PACKAGE[text];
	};
});
//../src/component/liteladder.js
/**
 * Created by Administrator on 2017/1/13.
 */
define('ywj/liteladder', function(require){
	var $html = $('html')
	var $body = $('body');
	var chk = function(){
		var $ladder = $('.ladder');
		var sh = $body[0].scrollHeight || $html[0].scrollHeight;
		var wh = $(window).height();
		if(!$ladder.size()){
			require.async('ywj/resource/liteladder.css');
			$ladder = $('<ul class="ladder"><li><a href="#top" data-up="1" title="Home" class="u">&Gt;</a></li>'+
				'<li><a href="#bottom" data-down="1" class="d" title="End">&Gt;</a></li></ul>').appendTo($body);
			$body.prepend('<a id="top" name="top"></a>');
			$body.append('<a id="bottom" name="bottom"></a>');

			var offset = [];
			var last_mouse_pos = [];
			var last_div_pos = [];
			var start_move = false;
			var moving = false;
			$ladder.mousedown(function(e){
				last_mouse_pos = [e.clientX, e.clientY];
				last_div_pos = [parseInt($ladder.css('margin-right'), 10), parseInt($ladder.css('margin-bottom'), 10)];
				start_move = true;
				return false;
			});
			$ladder.find('a').click(function(e){
				e.preventDefault();
				if(moving){
					moving = false;
					return false;
				}
				var $tag = !$body[0].scrollTop ? $html : $body;
				$tag.stop().animate({
					scrollTop: ($(this).data('up')) ? 0 : $tag[0].scrollHeight
				}, 'fast');
			});
			$body.mouseup(function(e){
				start_move = false;
			});
			$body.click(function(){
				moving = false;
			});
			$body.mousemove(function(e){
				if(start_move){
					offset[0] = e.clientX - last_mouse_pos[0];
					offset[1] = e.clientY - last_mouse_pos[1];
					moving = !((Math.abs(offset[0]) < 2) && (Math.abs(offset[1]) < 2));
					$ladder.css({
						marginRight: last_div_pos[0]-offset[0],
						marginBottom: last_div_pos[1]-offset[1]
					});
				}
			});
		}
		if(sh > wh && $body.css('overflow-y') != 'hidden') {
			$ladder.css('display', 'block');
		} else {
			$ladder.hide();
		}
	};
	$(window).resize(chk);
	setTimeout(chk, 500);
});
//../src/component/masker.js
/**
 * Created by sasumi on 3/12/2014.
 */
define('ywj/masker', function(require){
	require('ywj/resource/masker.css');
	var $ = require('jquery');
	var Util = require('ywj/util');

	//遮罩层DOM
	var MASKER_DOM;

	return {
		/**
		 * show masker
		 * @param {Object||Null} styleConfig 样式配置，支持覆盖所有key
		 */
		show: function (styleConfig) {
			if (!MASKER_DOM) {
				MASKER_DOM = $('<div class="YWJ_MASKER"></div>').appendTo($('body'));
				if (styleConfig) {
					$.each(styleConfig, function (key, val) {
						MASKER_DOM.css(key, val);
					});
				}
			}

			var winRegion = Util.getRegion();
			MASKER_DOM.css({
				height:winRegion.documentHeight,
				width: $('body').outerWidth()
			});
			MASKER_DOM.show();
			setTimeout(function(){MASKER_DOM.addClass('YWJ_MASKER-in');}, 0)
		},

		/**
		 * hide masker
		 */
		hide: function () {
			if (MASKER_DOM) {
				MASKER_DOM.removeClass('YWJ_MASKER-in');
				setTimeout(function(){MASKER_DOM.hide();}, 200)
			}
		}
	};
});

//../src/component/md5.js
/**
 * Created by Administrator on 2016/5/27.
 */
define('ywj/md5', function(require){

	/*
	  * Add integers, wrapping at 2^32. This uses 16-bit operations internally
	  * to work around bugs in some JS interpreters.
	  */
	function safeAdd (x, y) {
		var lsw = (x & 0xffff) + (y & 0xffff)
		var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
		return (msw << 16) | (lsw & 0xffff)
	}

	/*
	* Bitwise rotate a 32-bit number to the left.
	*/
	function bitRotateLeft (num, cnt) {
		return (num << cnt) | (num >>> (32 - cnt))
	}

	/*
	* These functions implement the four basic operations the algorithm uses.
	*/
	function md5cmn (q, a, b, x, s, t) {
		return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
	}
	function md5ff (a, b, c, d, x, s, t) {
		return md5cmn((b & c) | (~b & d), a, b, x, s, t)
	}
	function md5gg (a, b, c, d, x, s, t) {
		return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
	}
	function md5hh (a, b, c, d, x, s, t) {
		return md5cmn(b ^ c ^ d, a, b, x, s, t)
	}
	function md5ii (a, b, c, d, x, s, t) {
		return md5cmn(c ^ (b | ~d), a, b, x, s, t)
	}

	/*
	* Calculate the MD5 of an array of little-endian words, and a bit length.
	*/
	function binlMD5 (x, len) {
		/* append padding */
		x[len >> 5] |= 0x80 << (len % 32)
		x[((len + 64) >>> 9 << 4) + 14] = len

		var i
		var olda
		var oldb
		var oldc
		var oldd
		var a = 1732584193
		var b = -271733879
		var c = -1732584194
		var d = 271733878

		for (i = 0; i < x.length; i += 16) {
			olda = a
			oldb = b
			oldc = c
			oldd = d

			a = md5ff(a, b, c, d, x[i], 7, -680876936)
			d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
			c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
			b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
			a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
			d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
			c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
			b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
			a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
			d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
			c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
			b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
			a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
			d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
			c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
			b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)

			a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
			d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
			c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
			b = md5gg(b, c, d, a, x[i], 20, -373897302)
			a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
			d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
			c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
			b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
			a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
			d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
			c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
			b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
			a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
			d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
			c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
			b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)

			a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
			d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
			c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
			b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
			a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
			d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
			c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
			b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
			a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
			d = md5hh(d, a, b, c, x[i], 11, -358537222)
			c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
			b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
			a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
			d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
			c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
			b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)

			a = md5ii(a, b, c, d, x[i], 6, -198630844)
			d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
			c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
			b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
			a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
			d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
			c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
			b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
			a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
			d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
			c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
			b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
			a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
			d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
			c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
			b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)

			a = safeAdd(a, olda)
			b = safeAdd(b, oldb)
			c = safeAdd(c, oldc)
			d = safeAdd(d, oldd)
		}
		return [a, b, c, d]
	}

	/*
	* Convert an array of little-endian words to a string
	*/
	function binl2rstr (input) {
		var i
		var output = ''
		var length32 = input.length * 32
		for (i = 0; i < length32; i += 8) {
			output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff)
		}
		return output
	}

	/*
	* Convert a raw string to an array of little-endian words
	* Characters >255 have their high-byte silently ignored.
	*/
	function rstr2binl (input) {
		var i
		var output = []
		output[(input.length >> 2) - 1] = undefined
		for (i = 0; i < output.length; i += 1) {
			output[i] = 0
		}
		var length8 = input.length * 8
		for (i = 0; i < length8; i += 8) {
			output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32)
		}
		return output
	}

	/*
	* Calculate the MD5 of a raw string
	*/
	function rstrMD5 (s) {
		return binl2rstr(binlMD5(rstr2binl(s), s.length * 8))
	}

	/*
	* Calculate the HMAC-MD5, of a key and some data (raw strings)
	*/
	function rstrHMACMD5 (key, data) {
		var i
		var bkey = rstr2binl(key)
		var ipad = []
		var opad = []
		var hash
		ipad[15] = opad[15] = undefined
		if (bkey.length > 16) {
			bkey = binlMD5(bkey, key.length * 8)
		}
		for (i = 0; i < 16; i += 1) {
			ipad[i] = bkey[i] ^ 0x36363636
			opad[i] = bkey[i] ^ 0x5c5c5c5c
		}
		hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8)
		return binl2rstr(binlMD5(opad.concat(hash), 512 + 128))
	}

	/*
	* Convert a raw string to a hex string
	*/
	function rstr2hex (input) {
		var hexTab = '0123456789abcdef'
		var output = ''
		var x
		var i
		for (i = 0; i < input.length; i += 1) {
			x = input.charCodeAt(i)
			output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f)
		}
		return output
	}

	/*
	* Encode a string as utf-8
	*/
	function str2rstrUTF8 (input) {
		return unescape(encodeURIComponent(input))
	}

	/*
	* Take string arguments and return either raw or hex encoded strings
	*/
	function rawMD5 (s) {
		return rstrMD5(str2rstrUTF8(s))
	}
	function hexMD5 (s) {
		return rstr2hex(rawMD5(s))
	}
	function rawHMACMD5 (k, d) {
		return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d))
	}
	function hexHMACMD5 (k, d) {
		return rstr2hex(rawHMACMD5(k, d))
	}

	return function(string, key, raw){
		if (!key) {
			if (!raw) {
				return hexMD5(string)
			}
			return rawMD5(string)
		}
		if (!raw) {
			return hexHMACMD5(key, string)
		}
		return rawHMACMD5(key, string)
	};
});
//../src/component/msg.js
define('ywj/msg', function(require){
	var $ = require('jquery');
	var util = require('ywj/util');
	var msg_css_url = seajs.resolve('ywj/resource/msg.css?20190503');
	var top_doc;
	var top_win;

	try {
		top_doc = parent.document;
		top_win = parent;
	} catch(ex){}
	top_doc = top_doc || document;
	top_win = top_win || window;

	//暂未提供非同域的情况处理逻辑
	$('head', top_doc).append('<link rel="stylesheet" type="text/css" href="'+msg_css_url+'"/>');

	//多窗口适配
	if(top_win['__YWJ_MSG__']){
		return top_win['__YWJ_MSG__'];
	}

	var $WRAPPER;
	var MSG_COLLECTION = [];

	var remove_in_collection = function(msg){
		var c = [];
		for(var i=0; i<MSG_COLLECTION.length; i++){
			if(MSG_COLLECTION[i].guid != msg.guid){
				c.push(MSG_COLLECTION[i]);
			} else {
				msg.destroy();
			}
		}
		MSG_COLLECTION = c;
		if(!MSG_COLLECTION.length){
			$WRAPPER.hide();
		}
	};

	/**
	 * Show message
	 * @param arg1
	 * @param type
	 * @param time
	 * @param closeCallback
	 */
	var Msg = function(arg1, type, time, closeCallback){
		MSG_COLLECTION.push(this);
		this.guid = '_tip_'+util.guid();
		this.container = null;
		var cfg = arg1;
		if(typeof(arg1) == 'string'){
			cfg = {
				'msg': arg1,
				'type': type || 'info',
				'time': (time > 0 ? time*1000 : 2000)
			};
		}
		//extend default message config
		this.config = $.extend({
			'msg': '',
			'type': 0,
			'time': 2000,   //显示时间
			'autoClose': true, //是否自动关闭（仅当配置显示时间时才有效）
			'closeButton': false, //是否显示关闭按钮
			'showImmediately': true, //是否立即显示，即 new Msg之后立即显示
			'callback': closeCallback //关闭时回调
		}, cfg);

		//showImmediately
		if(this.config.showImmediately){
			this.show();
		}
	};

	/**
	 * show message
	 */
	Msg.prototype.show = function(){
		if(!$WRAPPER){
			$WRAPPER = $('<div class="ywj-msg-container-wrap"></div>').appendTo($('body', top_doc));
		}

		$WRAPPER.show();

		var main_html =
			'<div class="ywj-msg-container" id="'+this.guid+'" style="display:none">'+
				'<span class="ywj-msg-icon-'+this.config.type+'"><i></i></span>'+
				'<span class="ywj-msg-content">'+this.config.msg+'</span>'+
				(this.config.closeButton ? '<span class="ywj-msg-close">x</span>' : '')+
			'</div>';
		this.container = $(main_html).appendTo($WRAPPER);
		$('<div></div>').appendTo($WRAPPER);

		//keep message while mouse on
		this.container.on('mousemove', function(){_this._mouse_on = true; console.debug('mouse on');});
		this.container.on('mouseout', function(){_this._mouse_on = false; console.debug('mouse leave');});

		this.container.show();
		var _this = this;
		setTimeout(function(){
			_this.container.addClass('ywj-msg-ani-in');
		}, 10);

		if(this.config.time && this.config.autoClose){
			var check_n_close = function(){
				if(!_this._mouse_on){
					_this.hide();
				} else {
					setTimeout(check_n_close, _this.config.time);
				}
			};
			setTimeout(check_n_close, this.config.time);
		}
	};

	/**
	 * hide message
	 */
	Msg.prototype.hide = function(){
		if(this.container){
			this.container.addClass('ywj-msg-ani-out');
			var _this = this;
			setTimeout(function(){
				_this.container.hide();
				remove_in_collection(_this);
			}, 1000);
			this.config.callback && this.config.callback(this);
		}
	};

	/**
	 * destroy message container
	 */
	Msg.prototype.destroy = function(){
		this.container.remove();
	};

	/**
	 * hide message
	 */
	Msg.hide = function(){
		for(var i=0; i<MSG_COLLECTION.length; i++){
			MSG_COLLECTION[i].hide();
		}
	};

	/**
	 * shortcut method
	 * @param arg1
	 * @param type
	 * @param time
	 * @returns {Msg}
	 */
	Msg.show = function(arg1, type, time){
		return new Msg(arg1, type, time);
	};

	/**
	 * show success message
	 * @param msg
	 * @param time
	 * @returns {Msg}
	 */
	Msg.showSuccess = function(msg, time){
		return new Msg(msg, 'succ', time);
	};

	/**
	 * show error message
	 * @param msg
	 * @param time
	 * @returns {Msg}
	 */
	Msg.showError = function(msg, time){
		return new Msg(msg, 'err', time);
	};

	/**
	 * show info message
	 * @param msg
	 * @param time
	 * @returns {Msg}
	 */
	Msg.showInfo = function(msg, time){
		return new Msg(msg, 'info', time);
	};

	/**
	 * show loading message
	 * @param msg
	 * @param time
     * @returns {Msg}
	 */
	Msg.showLoading = function(msg, time){
		return new Msg(msg, 'load', time);
	};

	Msg.nodeClick = function($node, param){
		var msg = param.content || $node.data('msg') || $(this).attr('title');
		if(msg){
			Msg.show(msg, 'info');
		}
	};

	if(!top_win['__YWJ_MSG__']){
		top_win['__YWJ_MSG__'] = Msg;
	}
	return Msg;
});
//../src/component/muloperate.js
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

			$(selector).delegate(scope,"change",update_state);
			update_state();
		}
	};
});
//../src/component/net.js
/**
 * Created by sasumi on 3/12/2014.
 */
define('ywj/net', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');
	var Msg = require('ywj/msg');
	var lang = require('ywj/lang');

	/**
	 * get param
	 * @param param
	 * @param url
	 * @return {string|Null}
	 */
	var getParam = function(param, url){
		var r = new RegExp("(\\?|#|&)"+param+"=([^&#]*)(&|#|$)");
		var m = (url || location.href).match(r);
		return (!m? null :m[2]);
	};

	/**
	 * parse param string into object
	 * @param str
	 * @param delimiter
	 * @returns {{}}
	 */
	var parseParam = function(str, delimiter){
		delimiter = delimiter || '&';
		var tmp = str.split(delimiter);
		var ret = {};
		for(var i=0; i<tmp.length; i++){
			var t = tmp[i].split('=');
			var k = t[0] ? decodeURIComponent(t[0]) : null;
			var v = t[1] ? decodeURIComponent(t[1]) : null;
			if(k && v != null){
				ret[k] = v;
			}
		}
		return ret;
	};

	var parseParamToFormData = function(str, delimiter){
		var data = parseParam(str);
		var formData = new FormData();
		for(var i in data){
			formData.append(i, data[i]);
		}
		return formData;
	};

	/**
	 * 获取变量
	 * 这里不考虑到变量名重叠的情况
	 * @returns {{}}
	 */
	var getHash = function(){
		var url = location.hash;
		if(url[0] == '#'){
			url = url.substr(1);
		}
		var found = false;
		var ret = {};
		var ps = url.indexOf('&') >= 0 ? url.split('&') : [url];
		for(var i=0; i<ps.length; i++){
			var sep = ps[i].indexOf('=');
			var k, v;
			if(sep){
				k = decodeURIComponent(ps[i].substr(0, sep));
				v = decodeURIComponent(ps[i].substr(sep+1));
			}
			if(k){
				ret[k] = v;
				found = true;
			}
		}
		return found ? ret : null;
	};

	/**
	 * 设置hash
	 * @param k
	 * @param v
	 */
	var setHash = function(k, v){
		var ps = getHash() || {};
		var s = [];
		delete(ps[k]);
		ps[k] = v;
		for(var t in ps){
			if(ps[t] !== null){
				s.push(encodeURIComponent(t)+'='+encodeURIComponent(ps[t]));
			} else {
				s.push(encodeURIComponent(t));
			}
		}
		if(s.length){
			location.hash = '#'+ s.join('&');
		} else {
			location.hash = '';
		}
	};

	/**
	 * check is scalar
	 * @param val
	 * @returns {boolean}
	 */
	var fixType = function(val){
		return typeof(val) == 'string' || typeof(val) == 'number';
	};

	/**
	 * 合并后台cgi请求url
	 * @description 该方法不支持前台文件hash链接生成，如果要
	 * @return
	 */
	var buildParam = function(/**params1, params2...*/){
		var data = [];
		var args = Util.toArray(arguments);

		$.each(args, function(k, val){
			var params = val;
			if(Util.isArray(params)){
				data.push(params.join('&'));
			} else if(typeof(params) == 'object'){
				for(var i in params){
					if(typeof (params[i]) == 'undefined' || params[i] == null){
						continue;
					}
					if(fixType(params[i])){
						data.push(i+'='+encodeURIComponent(params[i]));
					} else {
						$.each(params[i], function(k, v){
							data.push(i+'['+encodeURIComponent(k)+']='+encodeURIComponent(v)); //PHP 格式数组
						});
					}
				}
			} else if(typeof(params) == 'string') {
				data.push(params);
			}
		});
		return data.join('&').replace(/^[?|#|&]{0,1}(.*?)[?|#|&]{0,1}$/g, '$1');
	};

	/**
	 * 合并参数
	 * @return string
	 **/
	var mergeCgiUri = function(/**url, get1, get2...**/){
		var args = Util.toArray(arguments);
		var url = args[0];
		url = url.replace(/(.*?)[?|#|&]{0,1}$/g, '$1');	//移除尾部的#&?
		args = args.slice(1);
		$.each(args, function(k, v){
			var str = buildParam(v);
			if(str){
				url += (url.indexOf('?') >= 0 ? '&' : '?') + str;
			}
		});
		return url;
	};

	/**
	 * 合并cgi请求url
	 * @description 该方法所生成的前台链接默认使用#hash传参，但如果提供的url里面包含？的话，则会使用queryString传参
	 * 所以如果需要使用?方式的话，可以在url最后补上?, 如：a.html?
	 * @return
	 */
	var mergeStaticUri = function(/**url, get1, get2...**/){
		var args = Util.toArray(arguments);
		var url = args[0];
		args = args.slice(1);
		$.each(args, function(){
			var str = buildParam(this);
			if(str){
				url += /(\?|#|&)$/.test(url) ? '' : (/\?|#|&/.test(url) ? '&' : '#');
				url += str;
			}
		});
		return url;
	};


	var _AJAX_CACHE_DATA_ = {};

	/**
	 * ajax request
	 * @param url
	 * @param data
	 * @param opt
	 * @return boolean
	 */
	var request = function(url, data, opt){
		opt = $.extend({
			method: 'get',
			format: 'json', //默认格式：json, text
			async: true,
			timeout: 10000,     //默认超时10s
			charset: 'utf-8',
			cache: false,       //是否禁用浏览器cache
			frontCache: false,  //前端cache
			jsonpCallback: '_callback',
			onSuccess: function(){},
			onAbort: function(){},
			onError: function(statusText){
				console.error('request error, statusText:',statusText, url, data, opt);
				Msg.show(lang("后台有点忙，请稍后重试"), 'err');
			}
		}, opt);

		if(Util.inArray(opt.format, ['json', 'jsonp', 'formsender'])){
			url = mergeCgiUri(url, {ref: opt.format});
		}

		var url_id = buildParam(url, data);
		if(opt.frontCache){
			if(_AJAX_CACHE_DATA_[url_id] !== undefined){
				opt.onSuccess(_AJAX_CACHE_DATA_[url_id]);
				return true;
			}
		}

		return $.ajax(url, {
			async: opt.async,
			cache: opt.cache,
			type: opt.method,
			timeout: opt.timeout,
			scriptCharset: opt.charset,
			data: data,
			dataType: opt.format,
			jsonpCallback: opt.jsonpCallback,
			success: function(rsp){
				if(opt.frontCache){
					_AJAX_CACHE_DATA_[url_id] = rsp;
				}
				opt.onSuccess(rsp);
			},
			error: function(aj, error){
				if(aj.statusText === 'abort'){
					console.info('ajax abort');
					opt.onAbort();
				}else{
					console.error('ajax error:', error, aj);
					opt.onError(aj.responseText || aj.statusText || error || 'Error');
				}
			}
		});
	};

	/**
	 * get data
	 * @param url
	 * @param data
	 * @param onSuccess
	 * @param opt
	 */
	var get = function(url, data, onSuccess, opt){
		opt = $.extend({
			onSuccess: onSuccess
		},opt||{});
		return request(url, data, opt);
	};

	/**
	 * post data
	 * @param url
	 * @param data
	 * @param onSuccess
	 * @param opt
	 */
	var post = function(url, data, onSuccess, opt){
		opt = $.extend({
			method: 'post',
			onSuccess: onSuccess
		},opt||{});
		return request(url, data, opt);
	};

	/**
	 * post表单数据
	 * @param param
	 * @param formData
	 * @param sendImmediately
	 * @returns {XMLHttpRequest|Window.XMLHttpRequest}
	 */
	var postFormData = function(param, formData, sendImmediately){
		param = $.extend({
			url: '',
			onLoad: function(){},
			onError: function(){},
			onProgress: function(){}
		},param);

		var xhr = new XMLHttpRequest();
		xhr.withCredentials = true;
		xhr.open('POST', param.url);
		xhr.onload = param.onLoad;
		xhr.onerror = param.onError;
		xhr.upload.onprogress = function(event){
			if(event.lengthComputable){
				var percent = (event.loaded / event.total * 100 | 0);
				if(percent > 0 && percent < 100){
					param.onProgress(percent, event);
				}
			}
		};
		if(sendImmediately){
			xhr.send(formData);
		}
		return xhr;
	};


	/**
	 * 获取表单提交的数据
	 * @description 不包含文件表单(后续HTML5版本可能会提供支持)
	 * @param form
	 * @returns {string}
	 */
	var getFormData = function(form){
		form = $(form);
		var data = {};
		var elements = form[0].elements;

		$.each(elements, function(){
			var name = this.name;
			if(!data[name]){
				data[name] = [];
			}
			if(this.type == 'radio'){
				if(this.checked){
					data[name].push(this.value);
				}
			} else if($(this).attr('name') !== undefined && $(this).attr('value') !== undefined){
				data[name].push(this.value);
			}
		});

		var data_str = [];
		$.each(data, function(key, v){
			$.each(v, function(k, val){
				data_str.push(encodeURIComponent(key)+'='+encodeURIComponent(val));
			})
		});
		return data_str.join('&');
	};

	/**
	 * 文件下载
	 * @param src 文件地址
	 * @param save_name 保存名称
	 * @param ext 保存扩展名，缺省自动解析文件地址后缀
	 */
	var download = function(src, save_name, ext){
		ext = ext || Util.resolveExt(src);
		save_name = save_name || Util.resolveFileName(src);
		var link = document.createElement('a');
		link.href = src;
		link.download = save_name+ext;
		document.body.appendChild(link);
		link.click();
		link.parentNode.removeChild(link);
	};

	/**
	 * 高级文件下载
	 * @param url 文件地址
	 * @param success 下载完成的回调
	 */
	var downloadFile = function (url, success) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = "blob";
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if(success)success(xhr.response);
			}
		};
		xhr.send(null);
	};

	var postByForm = function(url, data){
		var iframe = document.createElement("iframe");
		var iframe_id = 'POST_BY_FORM_UUID_'+Util.guid();
		document.body.appendChild(iframe);
		iframe.style.display = "none";
		iframe.contentWindow.name = iframe_id;

		var form = document.createElement("form");
		form.style.cssText = 'display:block; width:1px; height:1px; opacity:0; position:absolute; left:0; top:0;';
		form.target = iframe_id;
		form.action = url;
		form.method = 'POST';

		var map = data;
		if(Util.isString(data)){
			if(data.indexOf('=') > 0){
				map = parseParam(data);
			} else {
				map = {data: data}; //JSON string
			}
		}
		for(var k in map){
			var input = document.createElement("input");
			input.type = "hidden";
			input.name = k;
			input.value = Util.isString(map[k]) ? map[k] : JSON.stringify(map[k]);
			form.appendChild(input);
		}
		document.body.appendChild(form);
		form.submit();
		form.onload = function(){
			console.debug('Form onload');
			form.parentNode.removeChild(form);
			iframe.parentNode.removeChild(iframe);
		};
	};

	return {
		getParam: getParam,
		parseParam: parseParam,
		parseParamToFormData: parseParamToFormData,
		buildParam: buildParam,
		setHash: setHash,
		mergeStaticUri: mergeStaticUri,
		mergeCgiUri: mergeCgiUri,
		request: request,
		get: get,
		post: post,
		postFormData: postFormData,
		postByForm: postByForm,
		getFormData: getFormData,
		download: download,
		downloadFile: downloadFile
	};
});
//../src/component/NoviceGuide.js
define('ywj/NoviceGuide', function(require){
	var $ = require('jquery');
	var Tip = require('ywj/tip');

	$('<style>.novice-guide-counter {float:left; color:gray;} .novice-guide-next-wrap {text-align:right; margin-top:10px;}</style>').appendTo('head');

	var $masker, $stopper;
	var show_highlight_zone = function(selector, region){
		hide_highlight_zone();
		if(!$masker){
			$masker = $('<div style="position:absolute; outline:2px solid #ffffff8a; height:40px; width:40px; box-shadow:0px 0px 0px 2000px rgba(0, 0, 0, 0.6); z-index:10000"></div>').appendTo('body');
			$stopper = $('<div style="width:100%; height:100%; position:absolute; left:0; top:0; z-index:10000"></div>').appendTo('body');
		}
		$stopper.show();

		if(selector){
			var $node = $(selector);
			$masker.show().css({
				left: $node.offset().left,
				top: $node.offset().top,
				width: $node.outerWidth(),
				height: $node.outerHeight()
			});
		} else {
			$masker.show().css({
				left: region.left,
				top: region.top,
				width: region.width,
				height: region.height
			});
		}
		return $masker;
	};

	var hide_highlight_zone = function(){
		$stopper && $stopper.hide();
		$masker && $masker.hide();
	};

	/**
	 * 显示引导浮层
	 * @param steps [{content:"浮层内容1", relate:'.node-class'}, ...] 步骤
	 * @param object opts 选项
	 */
	return function(steps, opts){
		var org_steps = $.extend([], steps);

		opts = $.extend({
			next_button_text: '下一步',
			prev_button_text: '上一步',
			finish_button_text: '完成',
			top_close: true,  //是否显示顶部关闭按钮
			cover_included: false, //提供的步骤里面是否包含封面步骤
			show_counter: false, //是否显示计数器
			on_finish: function(){} //完成显示后的回调(包含顶部关闭操作)
		}, opts);

		var show_one = function(){
			if(!steps.length){
				hide_highlight_zone();
				opts.on_finish();
				return;
			}

			var step = steps[0];
			steps.shift();

			var showing_cover = opts.cover_included && org_steps.length === (steps.length +1);
			var $masker;

			//masker
			if(showing_cover){
				$masker = show_highlight_zone(null, {
					left: $('body').width()/2,
					top: 300,
					width:1,
					height:1
				})
			} else {
				$masker = show_highlight_zone(step.relate);
			}

			var next_html = '<div class="novice-guide-next-wrap">';

			if((steps.length+2)<=org_steps.length){
				next_html += '<span class="novice-guide-prev-btn btn btn-weak btn-small">'+opts.prev_button_text+'</span> ';
			}
			if(steps.length && opts.next_button_text){
				next_html += '<span class="novice-guide-next-btn btn btn-small">'+opts.next_button_text+'</span>';
			}
			if(!steps.length && opts.finish_button_text){
				next_html += '<span class="novice-guide-finish-btn btn btn-small">'+opts.finish_button_text+'</span>';
			}
			if(opts.show_counter){
				next_html += '<span class="novice-guide-counter">'+(org_steps.length - steps.length)+'/'+org_steps.length+'</span>';
			}
			next_html += '</div>';

			var tp = new Tip('<div class="novice-guide-content">' + step.content + '</div>' + next_html, showing_cover ? $masker : step.relate, {
				closeBtn: opts.top_close,
				dir: showing_cover ? 6: 'auto'
			});
			tp.onHide.listen(function(){
				tp.destroy();
				hide_highlight_zone();
				opts.on_finish();
			});
			tp.onShow.listen(function(){
				tp.getDom().css({zIndex:10001});
				tp.getDom().find('.novice-guide-next-btn,.novice-guide-finish-btn').click(function(){
					tp.destroy();
					show_one();
				});
				tp.getDom().find('.novice-guide-prev-btn').click(function(){
					tp.destroy();
					var len = steps.length;
					steps.unshift(org_steps[org_steps.length - len - 1]);
					steps.unshift(org_steps[org_steps.length - len - 2]);
					show_one();
				});
			});
			tp.show();
		};
		show_one();
	};
});
//../src/component/number.js
define('ywj/number', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');
	var CLASS_INPUT = 'com-number-input';

	return {
		nodeInit: function($node){
			var change_able = !$node.attr('disabled') && !$node.attr('readonly');
			$node.addClass(CLASS_INPUT);
			var $dec = $('<span class="number-desc-btn"></span>').insertBefore($node);
			var $inc = $('<span class="number-inc-btn"></span>').insertAfter($node);
			var step = $node.attr('step') || 1;
				step = Util.isInt(step) ? parseInt(step, 10) : parseFloat(step);
			var max = $node.attr('max') || 0;
				max = Util.isInt(max) ? parseInt(max, 10) : parseFloat(max);
			var min = $node.attr('min') || 0;
				min = Util.isInt(min) ? parseInt(min, 10) : parseFloat(min);

			//limit min
			$node.change(function(){
				var val = $node.val();
				val = Util.isInt(val) ? parseInt(val, 10) : parseFloat(val);
				if(val < min){
					$node.val(min);
					return;
				}
				if(max && val > max){
					$node.val(max);
					return;
				}
			});

			$inc.click(function(){
				if(!change_able){
					return;
				}
				var val = $node.val();
				val = Util.isInt(val) ? parseInt(val, 10) : parseFloat(val);
				if(Math.round(step))
				if((max && (val < max)) || !max){
					$node.val(val+step).trigger('change');
				}
				return false;
			});
			$dec.click(function(){
				if(!change_able){
					return;
				}
				var val = $node.val();
				val = Util.isInt(val) ? parseInt(val, 10) : parseFloat(val);
				if(val > min){
					$node.val(val-step).trigger('change');
				}
				return false;
			});
		}
	};
});
//../src/component/partialcheck.js
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
	var init = {
		nodeInit: function($node, opt){
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

			$('input[type=checkbox]', $node).click(function(){
				updateAllTree();
			});

			//initialize
			updateAllTree();
		}
	};

	init.CHECKED = CHECKED;
	init.UNCHECKED = UNCHECKED;
	init.PARTIAL = PARTIAL;
	return init;
});
//../src/component/password.js
/**
 * 密码输入辅助控件
 */
define('ywj/password', function (require) {
	require('ywj/resource/password.css');
	var lang = require('lang/$G_LANGUAGE');
	var $ = require('jquery');
	var Tip = require('ywj/tip');
	var Util = require('ywj/util');
	var $body = $('body');

	var STRENGTH_MAP = {
		0: lang('非常弱'),
		1: lang('弱'),
		2: lang('普通'),
		3: lang('强'),
		4: lang('非常强'),
		5: lang('安全'),
		6: lang('非常安全')
	};

	var m_strUpperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var m_strLowerCase = "abcdefghijklmnopqrstuvwxyz";
	var m_strNumber = "0123456789";
	var m_strCharacters = "!@#$%^&*?_~";

	/**
	 * 产生密码
	 * @param length 长度
	 * @param rule 规则
	 * @returns {string}
	 */
	var generate = function(length, rule){
		var MAP = [
			'0123456789',
			'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
			'abcdefghijklmnopqrstuvwxyz',
			'(!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~)',
			' '
		];
		rule = $.extend({
			'NUM': true, //数字
			'UC': true, //大写字母
			'LC': true, //小写字母
			'SYM': false, //符号
			'SPC': false //空格
		}, rule);
		var rules = [];
		if(rule.NUM){
			rules.push(MAP[0]);
		}
		if(rule.UC){
			rules.push(MAP[1]);
		}
		if(rule.LC){
			rules.push(MAP[2]);
		}
		if(rule.SYM){
			rules.push(MAP[3]);
		}
		if(rule.SPC){
			rules.push(MAP[4]);
		}
		var charset = rules.join(''),
			retVal = "";
		for (var i = 0, n = charset.length; i < length; ++i) {
			retVal += charset.charAt(Math.floor(Math.random() * n));
		}
		return retVal;
	};

	/**
	 * 获取密码强度文本
	 * @param strPassword
	 * @returns {*}
	 */
	var getStrengthText = function(strPassword){
		var strength = getStrength(strPassword);
		return STRENGTH_MAP[strength];
	};

	/**
	 * 获取密码强度
	 * @param strPassword
	 * @returns {number}
	 */
	var getStrength = function(strPassword){
		var score = calcComplexScore(strPassword);
		if(score >= 90){
			return 6;
		}
		if(score >= 80){
			return 5;
		}
		if(score >= 70){
			return 4;
		}
		if(score >= 60){
			return 3;
		}
		if(score >= 50){
			return 2;
		}
		if(score >= 25){
			return 1;
		}
		return 0;
	};

	/**
	 * 包含字符的个数
	 * @param strPassword
	 * @param strCheck
	 * @returns {number}
	 */
	var countContain = function(strPassword, strCheck){
		var nCount = 0;
		for(var i = 0; i < strPassword.length; i++){
			if(strCheck.indexOf(strPassword.charAt(i)) > -1){
				nCount++;
			}
		}
		return nCount;
	};

	/**
	 * 计算密码得分
	 * @param strPassword
	 * @returns {number}
	 */
	var calcComplexScore = function(strPassword){
		// Reset combination count
		var nScore = 0;

		// Password length
		// -- Less than 4 characters
		if(strPassword.length < 5){
			nScore += 5;
		}
		// -- 5 to 7 characters
		else if(strPassword.length > 4 && strPassword.length < 8){
			nScore += 10;
		}
		// -- 8 or more
		else if(strPassword.length > 7){
			nScore += 25;
		}

		// Letters
		var nUpperCount = countContain(strPassword, m_strUpperCase);
		var nLowerCount = countContain(strPassword, m_strLowerCase);
		var nLowerUpperCount = nUpperCount + nLowerCount;
		// -- Letters are all lower case
		if(nUpperCount == 0 && nLowerCount != 0){
			nScore += 10;
		}
		// -- Letters are upper case and lower case
		else if(nUpperCount != 0 && nLowerCount != 0){
			nScore += 20;
		}

		// Numbers
		var nNumberCount = countContain(strPassword, m_strNumber);
		// -- 1 number
		if(nNumberCount == 1){
			nScore += 10;
		}
		// -- 3 or more numbers
		if(nNumberCount >= 3){
			nScore += 20;
		}

		// Characters
		var nCharacterCount = countContain(strPassword, m_strCharacters);
		// -- 1 character
		if(nCharacterCount == 1){
			nScore += 10;
		}
		// -- More than 1 character
		if(nCharacterCount > 1){
			nScore += 25;
		}

		// Bonus
		// -- Letters and numbers
		if(nNumberCount != 0 && nLowerUpperCount != 0){
			nScore += 2;
		}
		// -- Letters, numbers, and characters
		if(nNumberCount != 0 && nLowerUpperCount != 0 && nCharacterCount != 0){
			nScore += 3;
		}
		// -- Mixed case letters, numbers, and characters
		if(nNumberCount != 0 && nUpperCount != 0 && nLowerCount != 0 && nCharacterCount != 0){
			nScore += 5;
		}
		return nScore;
	};

	return {
		generate:generate,
		getStrengthText:getStrengthText,
		getStrength: getStrength,
		calcComplexScore: calcComplexScore,
		nodeInit: function($inp, param){
			var name = $inp.attr('name');
			var required = !!$inp.attr('required');
			var is_set = param.isset;

			//rpt inputer
			var $rpt = $('<input type="password" value="" style="display:none" class="repeat-password txt" placeholder="'+lang('再次输入密码')+'"/>').insertAfter($inp);

			var $strength_trigger = $('<span class="ywj-password-strength ywj-password-strength-0"><span></span></span>').insertAfter($inp);
			$strength_trigger.css({
				width: $inp.outerWidth(),
				top: $inp.offset().top + $inp.outerHeight(),
				left: $inp.offset().left
			});

			//generator
			if(param.generator){
				var $generator = $('<span class="password-generator-btn" title="Help"></span>').insertAfter($inp);
				$generator.css({
					top: $inp.offset().top + 3,
					left: $inp.offset().left + $inp.outerWidth() - $generator.outerWidth()
				});

				var tpl = '<div class="ywj-password-generator-panel"><span class="t">'+lang('生成密码')
					+'</span> <input type="text" readonly="readonly"> <span class="ypg-refresh">'+lang('刷新')
					+'</span> <span class="ypg-copy">'+lang('复制')+'</span></div>';
				var oTip = new Tip(tpl, $generator);
				var $t = oTip.getDom().find('input[type=text]');
				var $r = oTip.getDom().find('.ypg-refresh');
				var $c = oTip.getDom().find('.ypg-copy');
				var tc;
				$t.focus(function(){
					$t[0].select($t[0]);
				});
				$r.click(function(){
					$c.html(lang('复制'));
					clearTimeout(tc);
					$t.val(generate(8, {LC: true, BC:true, NUM:true}));
				}).trigger('click');
				$c.click(function(){
					if($t.val()){
						Util.copy($t.val());
						$c.html(lang('已复制'));
						clearTimeout(tc);
						tc = setTimeout(function(){
							$c.html(lang('复制'));
						}, 2000);
					}
				});

				$generator.click(function(){oTip.show();});
				$body.click(function(e){
					var tag = e.target;
					var tc = oTip.getDom()[0];
					if(tag == $generator[0] || tag == tc || $.contains(tc, tag)){
						//
					} else {
						oTip.hide();
					}
				});
			}

			$rpt[0].oninvalid = function(){
				if(!this.value){
					this.setCustomValidity('');
				}
				else if(this.value != $inp.val()){
					this.setCustomValidity(lang('两次输入的密码不一致'));
				} else {
					this.setCustomValidity('');
				}
			};
			$rpt.on('input', function(){
				if(this.value == $inp.val()){
					this.setCustomValidity('');
				}
			});

			//input event
			$inp.on('input', function(){
				$rpt.val('').attr('required', false).hide();
				if($inp.val()){
					$rpt.attr('pattern', Util.pregQuote($inp.val()));
				}
				if(required || $inp.val()){
					$inp.attr('name', name);
					$rpt.attr('required', 'required').show();
				}
				if(is_set && !$inp.val()){
					$rpt.attr('required', false).hide();
				}
				if($inp.val()){
					var strength = getStrength($inp.val());
					$strength_trigger.attr('class', 'ywj-password-strength ywj-password-strength-'+strength);
				} else {
					$strength_trigger.attr('class', 'ywj-password-strength');
				}
			});

			//initialize edit mode
			if(is_set){
				//清除name提交数据
				$inp.attr('name', '').attr('required', false).val('');
				$inp.attr('placeholder', lang('输入新密码重置'));
			} else if(required){
				$inp.attr('placeholder', lang('请设置密码'));
			}
		}
	};
});
//../src/component/PasteImage.js
/**
 * Created by Christopher on 2018/1/22.
 * 粘贴图片
 */
define('ywj/PasteImage', function(require){
	require('ywj/resource/PasteImage.css');
	var $ = require('jquery');
	var util = require('ywj/util');
	var Msg = require('ywj/msg');
	var IV = require('ywj/imageviewer');
	var url = '/index.php/common/upload/pasteImage';

	var filterInput = function(event){
		if ( event.keyCode == 8 ) {
			deleteRangeImage();
			return false;
		}
		if ( !event.ctrlKey || event.keyCode != 86 ) {
			event.preventDefault();
			event.stopPropagation();
			return false;
		}
	};

	var pasteDeal = function(event){
		event.preventDefault();
		var item = event.originalEvent.clipboardData.items[0];
		var type = item.type.toString();
		var blob = null;
		if ( type == 'image/png' ) {
			blob = item.getAsFile();
			var reader = new FileReader();
			reader.onload = function(e){
				var base64_str = e.target.result;
				uploadImgFromPaste(base64_str);
			};
			reader.readAsDataURL(blob);

		} else {
			event.stopPropagation();
			Msg.showError('请粘贴图片');
			return false;
		}
	};

	var uploadImgFromPaste = function(img){
		var formData = new FormData();
		formData.append('image', img);
		formData.append('submission-type', 'paste');
		var xhr = new XMLHttpRequest();
		xhr.open('POST', url);
		xhr.onload = function(){
			if ( xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200 ) {
				try {
					var data = JSON.parse( xhr.responseText );
				} catch ( e ) {
					Msg.showError('图片上传失败');
					return false;
				}

				var img_html = "<a class='com-uploader-type-image' target='_blank' title='查看' href='"+ data.src +"' data-value='"+ data.value +"'><img src='"+ data.src +"' class='new-img' /></a>";
				var image_input = $('.image-input');
				var old = image_input.val() || ',';
				image_input.val(old + data.value + ',');

				insertImageRange(img_html);
			}
		};
		xhr.onerror = function(){
			Msg.showError('图片上传失败');
		};
		xhr.send(formData);
	};

	var insertImageRange = function(img){
		var selection = window.getSelection ? window.getSelection() : document.selection;
		var range = selection.createRange ? selection.createRange() : selection.getRangeAt(0);
		if (!window.getSelection) {
			range.pasteHTML(img);
			range.collapse(false);
			range.select();
		} else {
			range.collapse(false);
			var hasR = range.createContextualFragment(img);
			var hasR_lastChild = hasR.lastChild;
			range.insertNode(hasR);
			if (hasR_lastChild) {
				range.setEndAfter(hasR_lastChild);
				range.setStartAfter(hasR_lastChild)
			}
			selection.removeAllRanges();
			selection.addRange(range);
		}
	};

	var deleteRangeImage = function(){
		if ( $('.com-uploader-type-image').length == 0 ) {
			return true;
		}

		var selection = window.getSelection ? window.getSelection() : document.selection;
		var range = selection.createRange ? selection.createRange() : selection.getRangeAt(0);
		var image = $(range.startContainer).data('value');
		var input = $('.image-input');
		var old_value = input.val().toString();
		input.val( old_value.replace(','+ image +',', ',') );
		if ( input.val() == ',' ) {
			input.val(null);
			$('.img-paste').empty();
		}
	};

	return {
		nodeInit: function(editable){
			if ( $('.image-input').length == 0 ) {
				var input = '<input type="hidden" name="images" class="image-input">';
				$(editable).parent().append(input);
			}
			$(editable).addClass('img-paste');

			$(editable).on('paste', function(event){
				pasteDeal(event);

			}).on('keydown', function(event){
				filterInput(event);

			}).on('dblclick', 'a.com-uploader-type-image', function(){
				IV.init($(this), $('.img-paste a.com-uploader-type-image'));
				return false;
			});
		}
	};
});
//../src/component/placeholder.js
/**
 * placeholder效果
 */
define('ywj/placeholder', function(require){
	var $ = require('jquery');
	var bindFormSubmit = function(el){
		var p = el.parentsUntil('form');
		if(p){
			var form = p.parent();
			if(!form.data('placeholder-event-flag')){
				form.data('placeholder-event-flag', 1);

				form.submit(function(){
					$.each(form[0].elements, function(){
						var $this = $(this);
						var pl = $this.attr('placeholder');
						if(pl && pl == $this.val()){
							$this.val('');
						}
					});
				});
			}
		}
	};

	return function(el, normalClass, focusClass, emptyClass){
		el = $(el);
		if(el[0].type == 'password'){
			return;
		}

		normalClass = normalClass || '';
		focusClass = focusClass || '';
		emptyClass = emptyClass || '';

		var phTxt = el.attr('placeholder');
		if(!phTxt){
			console.warn('need placeholder attr');
			return;
		}
		el.on('focus', function(){
			el.removeClass(emptyClass).removeClass(normalClass).addClass(focusClass);
			if(el.val() == phTxt){
				el.val('');
			}
		});
		el.on('blur', function(){
			el.removeClass(emptyClass).removeClass(normalClass).removeClass(focusClass);
			if(el.val() == '' || el.val() == phTxt){
				el.val(phTxt);
				el.addClass(emptyClass);
			} else {
				el.addClass(normalClass);
			}
		});
		if(!el.val()){
			el.removeClass(normalClass).removeClass(focusClass).addClass(emptyClass);
			el.val(phTxt);
		}

		bindFormSubmit(el);
	};
});
//../src/component/popup.js
/**
 * Created by sasumi on 3/12/2014.
 */
define('ywj/popup', function(require){
	require('ywj/resource/popup.css?2018');
	var $ = require('jquery');
	var Util = require('ywj/util');
	var masker = require('ywj/masker');
	var Msg = require('ywj/msg');
	var Net = require('ywj/net');
	var POP_COLLECT_KEY = '__POPUP_COLLECTION__';
	var YWJ_WIDGET_POPUP = 'YWJ_WIDGET_POPUP';
	var BTN_LOADING_CLASS = 'btn-loading';
	var POPUP_SHOW_CLASS = 'PopupDialog-Ani-show';
	var DEF_POPUP_WIDTH = 600;
	var KEY_ESC = 27;

	var STATUS_HIDE = 0;
	var STATUS_SHOW = 1;

	var lang = require('lang/$G_LANGUAGE');
	var emptyFn = function(){};
	var console = window['console'] || {
			log: emptyFn,
			info: emptyFn,
			error: emptyFn
		};

	window['POPUP_COMPONENT_FLAG'] = true;
	window[POP_COLLECT_KEY] = [];

	var IS_ON_SHOW_CALL_STACK = [];
	var on_show_loop_check = function(pop){
		if(pop.status == STATUS_SHOW && IS_ON_SHOW_CALL_STACK.length){
			$.each(IS_ON_SHOW_CALL_STACK, function(k, v){
				v();
			});
			IS_ON_SHOW_CALL_STACK = [];
		}
	};

	/**
	 * Popup class
	 * @constructor Popup
	 * @description popup dialog class
	 * @example new Popup(config);
	 * @param {Object} config
	 */
	var Popup = function(config){
		var _this = this;
		this.container = null;
		this.status = STATUS_HIDE;
		this._eventBinded = false;

		this._events = {};
		this._eventParams = {};

		this.guid = Util.guid();
		this.onShow = emptyFn;
		this.onClose = emptyFn;
		this.isOnShow = function(callback){
			IS_ON_SHOW_CALL_STACK.push(callback);
			on_show_loop_check(_this);
		};

		this.config = $.extend({}, {
			ID_PRE: 'popup-dialog-id-pre',
			title: lang('对话框'),			//标题
			content: lang('测试'),			//content.src content.id
			width: 400,						//宽度
			height: 0,                      //高度（0表示自动检测）
			moveEnable: undefined,			//框体可移动
			moveTriggerByContainer: false,	//内容可触发移动
			zIndex: 1000,					//高度
			modal: true,					//模态对话框
			topCloseBtn: true,				//是否显示顶部关闭按钮,如果显示顶部关闭按钮，则支持ESC关闭窗口行为
			topRefreshBtn: false,           //是否显示顶部刷新按钮
			showMask: true,
			keepWhileHide: false,			//是否在隐藏的时候保留对象
			cssClass: {
				dialog: 'PopupDialog',
				head: 'PopupDialog-hd',
				body: 'PopupDialog-bd',
				textContent: 'PopupDialog-text',
				iframe: 'PopupDialog-bd-frm',
				container: 'PopupDialog-dom-ctn',
				foot: 'PopupDialog-ft'
			},
			buttons: [
				//{name:'确定', handler:null},
				//{name:'关闭', handler:null, setDefault:true}
			]
		}, config);

		//ADD TO MONITOR COLLECTION
		window[POP_COLLECT_KEY].push(this);
	};

	/**
	 * show popup
	 */
	Popup.prototype.show = function(){
		var _this = this;

		initStructure.call(this, function(){
			_this.config.showMask && masker.show();
			_this.container.show();

			var iframe = $('iframe', _this.container);
			if(iframe.size()){
				updateIframeHeight.call(_this, iframe[0]);
			}

			//更新对话框位置信息
			updateDialogRegion.call(_this);

			if(!_this._eventBinded){
				//绑定对话框事件
				bindEvent.call(_this);

				//绑定对话框移动事件
				bindMoveEvent.call(_this);

				//绑定对话框关闭事件
				bindEscCloseEvent.call(_this);

				_this._eventBinded = true;
			}

			//更新对话框z-index
			updateDialogZIndex.call(_this);

			//animate
			_this.container.addClass(POPUP_SHOW_CLASS);
			_this.status = STATUS_SHOW;

			_this.onShow();
			on_show_loop_check(_this);
		});
	};

	/**
	 * 更新登录对话框高度
	 */
	Popup.prototype.updateHeight = function(height){
		var iframe = $('iframe', this.container);
		if(iframe.size()){
			updateIframeHeight.call(this, iframe[0], height);
		}
	};

	/**
	 * 更新对话框宽度
	 * @param width
	 */
	Popup.prototype.updateWidth = function(width){
		var _width = this.container.width();
		var _left = this.container.offset().left;
		var new_left = _left + (_width - width) / 2;
		this.container.css({
			width: width,
			left: new_left
		});
	};

	/**
	 * 聚焦到当前对话框第一个按钮
	 */
	Popup.prototype.focus = function() {
	};

	/**
	 * set dialog operate enable
	 **/
	Popup.prototype.setEnable = function() {
		var mask = $('.PopupDialog-Modal-Mask', this.container);
		if(mask){
			mask.hide();
		}
	};

	/**
	 * set dialog operate disable
	 **/
	Popup.prototype.setDisable = function() {
		$('.PopupDialog-Modal-Mask', this.container).css({height: this.container.height(), opacity:0.4, display:'block'});
	};

	/**
	 * refresh dialog
	 */
	Popup.prototype.refresh = function(){
		if(this.config.content.src){
			this.container.find('iframe').attr('src', this.config.content.src);
		}
	};

	/**
	 * close current popup
	 */
	Popup.prototype.close = function(){
		if(this.onClose() === false){
			return false;
		}
		var _this = this;

		//处理对话框隐藏效果
		this.container.removeClass(POPUP_SHOW_CLASS);
		this.container.hide();
		this.status = 0;

		var Collections = window[POP_COLLECT_KEY];

		//remove this dialog
		if(!_this.config.keepWhileHide){
			var tmp = [];
			$.each(Collections, function(k, pop){
				if(pop.guid != _this.guid){
					tmp.push(pop);
				}
			});
			Collections = tmp;
			_this.container.remove();
			_this.container = null;
		}

		//remove other dialog
		var last_max_zIndex = -1;
		var last_top_pop = null;
		for(var i=Collections.length-1; i>=0; i--){
			var pop = Collections[i];
			if(pop.config.zIndex > last_max_zIndex){
				last_top_pop = pop;
				last_max_zIndex = pop.config.zIndex;
			}
		}
		if(last_top_pop){
			last_top_pop.setEnable();
			last_top_pop.focus();
		} else {
			masker.hide();
		}

		//reset collection
		window[POP_COLLECT_KEY] = Collections;
		return true;
	};

	/**
	 * 关闭其他窗口
	 **/
	Popup.prototype.closeOther = function(){
		try {
			var _this = this;
			$.each(window[POP_COLLECT_KEY], function(k, pop){
				if(pop != _this){
					pop.close();
				}
			});
		}catch(e){}
	};

	/**
	 * 监听自定义事件
	 * @param key
	 * @param handler
	 * @return {Boolean}
	 */
	Popup.prototype.listen = function(key, handler){
		if(this._eventParams[key]){
			handler.apply(this, this._eventParams[key]);
		} else {
			if(this._events[key]){
				this._events[key].push(handler);
			} else {
				this._events[key] = [handler];
			}
		}
	};

	/**
	 * auto resize(height)
	 * @param interval
	 */
	Popup.prototype.autoResize = function(interval){
		var popHeight = 0;
		var _this = this;
		var loop = function(){
			try {
				//popup destroyed
				if(!_this.container){
					return;
				}
				var fr = $('iframe', _this.container)[0];
				var w = fr.contentWindow;
				var b = w.document.body;
				var currentHeight = parseInt($(b).outerHeight());
				if (currentHeight != popHeight) {
					popHeight = currentHeight;
					_this.updateHeight(currentHeight+10);
				}
			} catch(ex){
				console.warn('Popup auto resize exception', ex);
				return false;
			}
			setTimeout(loop, interval);
		};
		setTimeout(loop, interval);
	};

	/**
	 * 触发事件
	 * @param key
	 */
	Popup.prototype.fire = function(key){
		var _this = this;
		var args = Util.toArray(arguments).slice(1);
		this._eventParams[key] = args;
		var result = [];
		if(this._events[key]){
			$.each(this._events[key], function(k, fn){
				result.push(fn.apply(_this, args));
			});
		}
		return result;
	};

	/**
	 * search popup by guid
	 * @param  guid
	 * @return {Popup}
	 */
	Popup.getPopupByGuid = function(guid){
		var result = null;
		$.each(window[POP_COLLECT_KEY], function(k, pop){
			if(pop.guid == guid){
				result = pop;
				return false;
			}
		});
		return result;
	};

	/**
	 * 显示确认对话框
	 * @param  title
	 * @param  {String|Object} content
	 * @param  onConfirm
	 * @param  onCancel
	 * @param  {Object} config
	 * @return {Popup}
	 */
	Popup.showConfirm = function(title, content, onConfirm, onCancel, config){
		var pop;
		var on_confirm = function(){
			var confirm_result = onConfirm ? onConfirm() : true;
			if(confirm_result !== false){
				pop.close();
			}
		};
		var on_cancel = function(){
			var cancel_result = onCancel ? onCancel() : true;
			if(cancel_result !== false){
				pop.close();
			}
		};

		config = config || {};
		if(config.with_icon && Util.isString(content)){
			content = '<div class="PopupDialog-confirm-text">'+Util.htmlEscape(content)+'</div>';
		}

		var conf = $.extend({}, {
			title: title||lang('确认'),
			content: content,
			width: 350,
			with_icon: false,
			topCloseBtn: false,
			modal: true,
			buttons: [
				{name:lang('确认'), handler:on_confirm, setDefault:true},
				{name:lang('取消'), handler:on_cancel}
			]
		}, config);

		pop = new Popup(conf);
		pop.show();
		return pop;
	};

	/**
	 * 显示对话框
	 * @param  title
	 * @param  {String|Object} content
	 * @param  onSubmit
	 * @param  {Object} config
	 * @return {Popup}
	 */
	Popup.showAlert = function(title, content, onSubmit, config){
		var pop;
		var on_submit = function(){
			var submit_result = onSubmit ? onSubmit() : true;
			if(submit_result !== false){
				pop.close();
			}
		};

		config = config || {};
		if(config.with_icon && Util.isString(content)){
			content = '<div class="PopupDialog-confirm-text">'+Util.htmlEscape(content)+'</div>';
		}

		var conf = $.extend({
			title: title||lang('提示'),
			content: content,
			width: 350,
			topCloseBtn: false,
			modal: true,
			buttons: [
				{name:lang('确定'), handler:on_submit, setDefault:true}
			]
		}, config);
		pop = new Popup(conf);
		pop.show();
		return pop;
	};

	/**
	 * 显示输入对话框
	 * @param  {String} title 提示标题
	 * @param  {String} init_value 初始值
	 * @param  {Function} onSubmit
	 * @param  {Function} onCancel
	 * @param  {Boolean} as_text 是否支持多行文本
	 * @param  {Object} config
	 * @return {Popup}
	 */
	Popup.showPrompt = function(title, init_value, onSubmit, onCancel, as_text, config){
		init_value = init_value ? Util.htmlEscape(init_value) : '';
		var content = '<div class="PopupDialog-prompt-title">'+title+'</div>'
			+ '<div class="PopupDialog-prompt-text-wrap">'+(!as_text ? '<input type="text" value="'+init_value+'">' : '<textarea>'+init_value+'</textarea>')+'</div>';

		var conf = $.extend({
			title: ''
		}, config);

		var pop;

		var submit_callback = function(){
			if(!onSubmit){
				return;
			}
			var val = $.trim(pop.container.find(':input').val());
			if(val){
				return onSubmit(val);
			}
		};

		pop = Popup.showConfirm(title, content, submit_callback, onCancel, conf);
		pop.container.find(':input').focus();

		if(!as_text){
			pop.container.find('[type=text]').on('keydown', function(e){
				if(e.keyCode == Util.KEYS.ENTER){
					var ret = submit_callback();
					if(ret !== false){
						pop.close();
					}
				}
			})
		}

		return pop;
	};

	/**
	 * get top popup class
	 * @param callback
	 */
	Popup.getTopPopupClass = function(callback){
		var win = window;
		var pop_in_parent = false;
		try {
			while(win != win.parent && win.parent['POPUP_COMPONENT_FLAG']){
				win = win.parent;
				pop_in_parent = true;
			}
		} catch(Ex){
			console.info(Ex);
		}

		if(pop_in_parent){
			win.seajs.use('ywj/popup', callback);
		} else {
			callback(Popup);
		}
	};

	/**
	 * 在顶部窗口实例化popup并显示
	 * @param conf
	 * @param callback
	 */
	Popup.showPopInTop = function(conf, callback){
		callback = callback || function(){};
		conf.modal = conf.modal === undefined ? true : !!conf.modal;
		Popup.getTopPopupClass(function(Pop){
			var p = new Pop(conf);
			callback(p); //优先绑定callback，否则会出现onShow绑定失败
			p.show();
		});
	};

	Popup.nodeClick = function($node, param){
		var POPUP_ON_LOADING = 'data-popup-on-loading-flag';
		var RET = $node[0].tagName == 'A' ? false : null;
		if($node.attr(POPUP_ON_LOADING) == 1){
			return RET;
		}
		if($node.hasClass('btn')){
			$node.addClass(BTN_LOADING_CLASS);
		}
		$node.attr(POPUP_ON_LOADING, 1);
		var src = Net.mergeCgiUri($node.attr('href') || $node.data('href'), {'ref':'iframe'});
		var width = param.width || DEF_POPUP_WIDTH;
		var height = param.height || 0;
		var title = $node.attr('title') || $node.html() || $node.data('title') || $node.val() || '';
		var force_refresh = param['forcerefresh'];
		var onSuccess = $node.data('onsuccess');

		if(onSuccess){
			eval('var fn1 = window.'+onSuccess);
			onSuccess = fn1;
		} else {
			onSuccess = function(){};
		}
		var onError = $node.data('onerror');
		if(onError){
			eval('var fn2 = window.'+onError);
			onError = fn2;
		} else {
			onError = function(){};
		}

		var conf = Util.cloneConfigCaseInsensitive({
			title: title,
			content: {src:src},
			width: width,
			height: height,
			moveEnable: undefined,
			topCloseBtn: true,
			topRefreshBtn: false,
			buttons: []
		}, param);

		Popup.showPopInTop(conf, function(p){
			p.onShow = function(){
				Msg.hide();
				$node.attr(POPUP_ON_LOADING, 0).removeClass(BTN_LOADING_CLASS);
			};
			if(force_refresh){
				p.onClose = function(){
					location.reload();
				}
			}
			p.listen('onSuccess', function(){return onSuccess.apply($node, Util.toArray(arguments));});
			p.listen('onError', onError);
		});
		return RET;
	};

	//!!以下方法仅在iframe里面提供
	var in_sub_win = false;
	try {
		in_sub_win = !!window.frameElement;
	} catch(e){}

	/**
	 * 获取当前popup 事件
	 * @param key
	 * @param p1
	 * @param p2
	 */
	Popup.fire = function(key, p1, p2){
		if(!in_sub_win){
			debugger;
			console.warn('No in sub window');
			return;
		}
		var pop = Popup.getCurrentPopup();
		return pop.fire.apply(pop, arguments);
	};

	/**
	 * 监听自定义事件
	 * @param key
	 * @param callback
	 * @return {Boolean}
	 */
	Popup.listen = function(key, callback){
		if(!in_sub_win){
			console.warn('No in sub window');
			return;
		}
		var pop = Popup.getCurrentPopup();
		if(pop){
			return pop.listen(key, callback);
		}
		return false;
	};

	/**
	 * close all popup
	 * @see Popup#close
	 */
	Popup.closeAll = function(){
		if(!in_sub_win){
			console.warn('No in sub window');
			return;
		}
		$.each(window[POP_COLLECT_KEY], function(k, pop){
			pop.close();
		});
	};

	/**
	 * resize current popup
	 * @deprecated only take effect in iframe mode
	 */
	Popup.resizeCurrentPopup = function(){
		if(!in_sub_win){
			console.debug('No in sub window');
			return;
		}
		$(window).on('load', function(){
			var wr = Util.getRegion();
			document.body.style.overflow = 'hidden';
			window.frameElement.style.height = wr.documentHeight +'px';
		});
	};

	/**
	 * auto resize current popup
	 * @param interval
	 */
	Popup.autoResizeCurrentPopup = function(interval){
		if(!in_sub_win){
			console.debug('No in sub window');
			return;
		}
		interval = interval || 50;
		var pop = Popup.getCurrentPopup();
		if(pop){
			pop.autoResize(interval);
		}
	};

	/**
	 * get current page located popup object
	 * @return mixed
	 */
	Popup.getCurrentPopup = function(){
		if(!in_sub_win){
			console.warn('No in sub window');
			return null;
		}
		var guid = window.frameElement.getAttribute('guid');
		if(guid){
			for(var i=0; i<parent[POP_COLLECT_KEY].length; i++){
				if(parent[POP_COLLECT_KEY][i].guid == guid){
					return parent[POP_COLLECT_KEY][i];
				}
			}
		}
		return null;
	};

	/**
	 * close current popup
	 * @return boolean 是否成功关闭
	 */
	Popup.closeCurrentPopup = function(){
		if(!in_sub_win){
			console.warn('No in sub window');
			return false;
		}
		var curPop = this.getCurrentPopup();
		if(curPop){
			return curPop.close();
		}
		return false;
	};

	/**
	 * 初始化对话框结构
	 */
	var initStructure = function(onload){
		onload = onload || emptyFn;
		if(this.container){
			onload();
			return;
		}
		var id = this.config.ID_PRE + Util.guid();

		//构建基础框架
		this.container = $('<div class="'+this.config.cssClass.dialog+'" style="left:-9999px" id="'+id+'"></div>').appendTo($('body'));

		//固定高度
		var height_style = this.config.height ? ' style="height:'+this.config.height+'px" ' : '';

		//构建内容容器
		var content = '<div class="'+this.config.cssClass.body+'"' + height_style+ '>';
		if(typeof(this.config.content) == 'string'){
			content += '<div class="'+this.config.cssClass.textContent+'">'+this.config.content+'</div>';
		} else if(this.config.content.src){
			content += '<iframe allowtransparency="true"'+height_style+'guid="'+this.guid+'" src="'+this.config.content.src+'" class="'+this.config.cssClass.iframe+'" frameborder=0></iframe>';
		} else if(this.config.content.id){
			content += $(this.config.content.id).html();
		}else{
			content += '<div class="' + this.config.cssClass.container + '"></div>';
		}
		content += '</div>';

		//构建按钮
		var btn_html = '';
		if(this.config.buttons.length > 0){
			btn_html = '<div class="'+this.config.cssClass.foot+'">';
			for(var i=0; i<this.config.buttons.length; i++){
				btn_html += '&nbsp;<a href="javascript:;" class="PopupDialog-btn'+(this.config.buttons[i].setDefault?' PopupDialog-btnDefault':'')+'">'+this.config.buttons[i].name+'</a>';
			}
			btn_html += '</div>';
		}

		var html = ([
			'<div class="PopupDialog-wrap">',
			'<div class="PopupDialog-Modal-Mask" style="position:absolute; height:0; overflow:hidden; z-index:2; background-color:#ccc; width:100%"></div>',
			'<div class="',this.config.cssClass.head+'">',
				'<h3>',this.config.title,'</h3>',
				'<div class="PopupDialog-hd-op">',
					((this.config.topRefreshBtn && this.config.content.src) ? '<span class="PopupDialog-refresh" title="refresh" tabindex="0"></span>' : ''),
					(this.config.topCloseBtn ? '<span class="PopupDialog-close" tabindex="0" title="关闭">&times;</span>' : ''),
				'</div>',
			'</div>',content,btn_html,
			'</div>'
		]).join('');
		this.container.html(html);

		//source 模式
		if(this.config.content.src){
			$('iframe',this.container).on('load', onload);
		} else {
			onload();
		}
	};

	/**
	 * 更新iframe高度
	 * @scope dialog object
	 * @param iframe
	 * @param height
	 */
	var updateIframeHeight = function(iframe, height){
		try {
			var w = iframe.contentWindow;
			var d = w.document;
			var b = w.document.body;
			w.focus();
		} catch(ex){
			return false;
		}

		height = height || this.config.height;
		if(!height && b){
			b.style.overflow = 'hidden';
			//需要设置body宽度,否则body内内容高度会受到宽度的"挤压",导致计算不正确.
			if(!b.style.width){
				b.style.width = this.config.width+'px';
			}
			b.style.minWidth = b.style.width;
			var h1 = w.innerHeight || ((d.documentElement && d.documentElement.clientHeight) ? d.documentElement : d.body).clientHeight;
			var tag = (d.documentElement && d.documentElement.scrollHeight) ? d.documentElement : d.body;
			var h2 = tag.scrollHeight;
			$(iframe).css('height', Math.max(h1, h2));
		} else {
			$(iframe).css('height', height);
		}
		return true;
	};

	/**
	 * get parent window scroll info
	 * @returns {{top: number, left: number}}
	 */
	var getParentScrollInfo = function(){
		return {
			top:0,
			left:0
		};
	};

	/**
	 * get parent window region info
	 * @returns {{visibleHeight: number, visibleWidth: number}}
	 */
	var getParentWinRegion = function(){
		var region = {
			visibleHeight: 9999999,
			visibleWidth: 9999999
		};
		try {
			if(window.frameElement) {
				var pr = Util.getRegion(parent);
				region.visibleHeight = pr.visibleHeight;
				region.visibleWidth = pr.visibleWidth;
			}
		} catch(ex){
			console.info(ex);
		}
		return region;
	};

	/**
	 * 更新对话框的位置信息
	 */
	var updateDialogRegion= function(){
		var $body = $('body');

		//CALCULATE REG事件N INFO
		var region = $.extend({
			height: this.container.height(),
			width: this.container.width()
		}, this.config);
		region.minHeight = region.minHeight || 78;
		var scroll = {
				top: document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop,
				left: $body.scrollLeft()
			},
			parentScroll = getParentScrollInfo(),
			winRegion = Util.getRegion(),
			parentRegion = getParentWinRegion(),
			top = 0,
			left = 0;

		scroll.top += parentScroll.top;
		scroll.left += parentScroll.left;
		winRegion.visibleHeight = Math.min(winRegion.visibleHeight, parentRegion.visibleHeight);
		winRegion.visibleWidth = Math.min(winRegion.visibleWidth, parentRegion.visibleWidth);

		if(winRegion.visibleHeight > region.height){
			top = scroll.top + (winRegion.visibleHeight - region.height)/4;
		} else if(winRegion.documentHeight > region.height){
			top = scroll.top;
		}

		if(winRegion.visibleWidth > region.width){
			left = winRegion.visibleWidth/2 - region.width/2 - scroll.left;
		} else if(winRegion.documentWidth > region.width){
			left = scroll.left;
		}
		var calStyle = {left:left,top:top,zIndex:this.config.zIndex};
		if(this.config.top !== undefined){
			calStyle.top = this.config.top;
		}
		if(this.config.left !== undefined){
			calStyle.left = this.config.left;
		}

		this.container.css(calStyle);

		if(this.config.height){
			$('.'+this.config.cssClass.body, this.container).css('height', this.config.height);
		}
		if(this.config.width){
			this.container.css('width', this.config.width);
		}
	};

	/**
	 * 更新对话框z-index,其中加入了模态对话框机制
	 */
	var updateDialogZIndex = function(){
		var hasOtherModalPanel = false;
		var _this = this;

		$.each(window[POP_COLLECT_KEY], function(k, pop){
			if(pop.config.modal && pop.status == STATUS_SHOW && _this != pop){
				hasOtherModalPanel = true;
			}
			if(_this.config.modal){
				_this.config.zIndex = Math.max(_this.config.zIndex, pop.config.zIndex+1);
			} else {
				_this.config.zIndex = Math.max(_this.config.zIndex, pop.config.zIndex);
			}
		});

		_this.container.css('zIndex', _this.config.zIndex);

		if(hasOtherModalPanel && !_this.config.modal){
			_this.setDisable();
		} else {
			//设置除了当前模态对话框的其他对话框所有都为disable
			$.each(window[POP_COLLECT_KEY], function(k, pop){
				if(pop != _this && pop.status == STATUS_SHOW){
					pop.setDisable();
				}
			});
			_this.focus();
		}
	};

	/**
	 * 绑定对话框按钮事件
	 */
	var bindEvent = function(){
		var _this = this;

		$('.PopupDialog-close', this.container).on('click', function(){
			_this.close();
		});

		$('.PopupDialog-refresh', this.container).on('click', function(){
			_this.refresh();
		});

		$('a.PopupDialog-btn',this.container).each(function(i){
			$(this).click(function(){
				var hd = _this.config.buttons[i].handler || function(){_this.close();};
				if(typeof(hd) == 'string'){
					_this.fire(hd, function(fn){fn();});
				} else {
					hd.apply(this, arguments);
				}
			});
		});

		$('a.PopupDialog-btnDefault', this.container).focus();

		this.container.on('mousedown', function(){
			updateZIndex.call(_this);
		});
	};

	/**
	 * update dialog panel z-index property
	 **/
	var updateZIndex = function() {
		var _this = this;
		var hasModalPanel = false;
		$.each(window[POP_COLLECT_KEY], function(k, dialog){
			if(dialog != _this && dialog.status == STATUS_SHOW && dialog.config.modal){
				hasModalPanel = true;
				return false;
			} else if(dialog != _this && dialog.status == STATUS_SHOW){
				if(dialog.config.zIndex >= _this.config.zIndex){
					_this.config.zIndex = dialog.config.zIndex + 1;
				}
			}
		});
		if(hasModalPanel){
			return;
		}
		this.container.css('zIndex', this.config.zIndex);
	};

	/**
	 * 绑定对话框移动事件
	 */
	var bindMoveEvent = function(){
		//如果对象配置中未设置可移动，则检测全局是否配置，如果全局未配置，默认为可移动。
		var move_enable = this.config.moveEnable !== undefined ? !!this.config.moveEnable : (Popup.moveEnable === undefined ? true : !!Popup.moveEnable);
		if(!move_enable){
			return;
		}

		var _this = this;
		var _lastPoint = {X:0, Y:0};
		var _lastRegion = {top:0, left:0};
		var _moving;
		var ie8 = $.browser.msie && parseInt($.browser.version, 10) <= 8;

		//upd css
		_this.container.find('.'+_this.config.cssClass.head).css('cursor', 'move');

		$(document).on('mousemove', function(event){
			if(!_this.container || !_moving || (event.button !== 0 && !ie8)){
				return;
			}
			var offsetX = parseInt(event.clientX - _lastPoint.X, 10);
			var offsetY = parseInt(event.clientY - _lastPoint.Y, 10);
			var newLeft = Math.max(_lastRegion.left + offsetX,0);
			var newTop = Math.max(_lastRegion.top + offsetY,0);
			_this.container.css({top:newTop,left:newLeft});
		});

		$('body').on('mousedown', function(event){
			if(!_this.container || (event.button !== 0 && !ie8)){
				return;
			}
			var $head = _this.config.moveTriggerByContainer ? _this.container : $('.'+_this.config.cssClass.head, _this.container);
			var tag = event.target;
			if($.contains($head[0], tag) || $head[0] == tag){
				_moving = true;
				_lastRegion = {
					left: parseInt(_this.container.css('left'), 10),
					top: parseInt(_this.container.css('top'), 10)
				};
				_lastPoint = {X: event.clientX, Y: event.clientY};
				return false;
			} else {
				_moving = false;
			}
		});

		$(document).on('mouseup', function(){
			_moving = false;
		});
	};

	/**
	 * 绑定 ESC 关闭事件
	 * 注意，所有的对话框只绑定一次ESC事件
	 */
	var ESC_BIND;
	var bindEscCloseEvent = function(){
		var close = function(){
			var lastDialog = null;
			$.each(window[POP_COLLECT_KEY], function(k, dialog){
				if(dialog.config.modal && dialog.status == STATUS_SHOW && dialog.config.topCloseBtn){
					lastDialog = dialog;
					return false;
				} else if(dialog.status == STATUS_SHOW && dialog.config.topCloseBtn){
					if(!lastDialog || lastDialog.config.zIndex <= dialog.config.zIndex){
						lastDialog = dialog;
					}
				}
			});
			if(lastDialog){
				lastDialog.close();
			}
		};

		//绑定内部close事件
		if(this.config.topCloseBtn){
			var $iframe = $(this.container.find('iframe'));
			if($iframe.size()){
				try {
					var _this = this;
					$iframe.load(function(){
						var d = this.contentDocument;
						if(d){
							$('.PopupDialog-close', _this.container).attr('title', lang("关闭(ESC)"));
							$(d).keyup(function(e){
								if(e.keyCode == KEY_ESC){
									close();
								}
							});
						}
					});
					var d = $iframe[0].contentDocument;
					if(d){
						$('.PopupDialog-close', _this.container).attr('title', lang("关闭(ESC)"));
						$(d).keyup(function(e){
							if(e.keyCode == KEY_ESC){
								close();
							}
						});
					}
				} catch(e){
					console.error(e);
				}
			}
		}
		if(ESC_BIND){
			return;
		}
		ESC_BIND = true;

		$(document.body).keyup(function(event){
			if(event.keyCode == KEY_ESC){
				close();
			}
		});
	};
	return Popup;
});
//../src/component/qrcode.js
define('ywj/qrcode', function(require){
	var $ = require('jquery');
	var Net = require('ywj/net');
	require('qrcode');

	var css = '.qrcode-section {' +
		'display: none;' +
		'background-color: #ffffff;' +
		'z-index: 10000;' +
		'position: absolute;' +
		'border:5px solid #dedede;' +
		'padding:2px;}';
	$('<style>' + css + '</style>').appendTo('head');

	var $section = $('<div class="qrcode-section"><div class="qrcode-canvas"></div></div>').appendTo('body');
	var $qrCode = $section.find('.qrcode-canvas');

	var fixHeight = 20;
	var fixWidth = 0;

	var border = $section.outerWidth(true) - $section.width();//border+padding+margin
	
	//计算X坐标，不超出父元素边框
	var getPosX = function(e, $node){
		var cx = e.clientX;
		var pl = $node.position().left;
		var ol = $node.offset().left;
		var nw = $node.outerWidth();
		var pw = $node.parent().outerWidth();
		var fw = fixWidth + size + border;
		if((pl + fw) < pw){
			return $node.offset().left + fixWidth;
		}else{
			return ol + nw - fw;
		}
	}

	var text, src, size;

	var showQrCode = function(){
		if(text != undefined && text != ''){
			$qrCode.qrcode({
				render: "canvas",
				width: size,
				height: size,
				text: text,
			});
			$section.show();
		}else if(src != undefined && src != ''){
			Net.get(src, {}, function(rsp){
				$qrCode.html('');
				console.log(rsp.data);
				if(rsp.code == 0){
					$qrCode.qrcode({
						render: "canvas",
						width: size,
						height: size,
						text: rsp.data,
					});
					$section.show();
				}
			});
		}else{
			return false;
		}
	}

	return {
		nodeInit: function($node){
			text = $node.data('text');
			src = $node.data('src');
			size = $node.data('qrcode-size');
			size = size ? size : 150;
			$node.hover(
				function(e){
					$qrCode.html('');
					$section.css({
						top: $node.offset().top + $node.outerHeight() + fixHeight,
						left: getPosX(e, $node)
					});
					showQrCode();
				},
				function(){
					$qrCode.html('');
					$section.hide();
				}
			);
		}
	}
});
//../src/component/richeditor.js
define('ywj/richeditor', function(require){
	var Util = require('ywj/util');

	var MODE_BUTTON_LIST = {
		lite: ['undo', 'redo', 'fontfamily', 'fontsize', 'bold', 'italic', 'underline', 'strikethrough', 'removeformat',
			'forecolor', 'backcolor', 'formatmatch', 'insertorderedlist', 'insertunorderedlist',
			'link', 'unlink', 'source'],

		normal: [
			'fontfamily', 'fontsize', 'undo', 'redo', 'bold', 'italic', 'underline', 'strikethrough', 'removeformat', 'blockquote',
			'forecolor', 'backcolor', 'formatmatch', 'insertorderedlist', 'insertunorderedlist', 'selectall',
			'fullscreen', '|', 'wordimage',
			'inserttable', 'deletetable', 'insertparagraphbeforetable',
			'justifyleft', 'justifycenter', 'justifyright', 'justifyjustify', '|',
			'link', 'unlink', 'anchor', '|', 'imagenone', 'imageleft', 'imageright', 'imagecenter', '|',
			'simpleupload', 'source'
		]
	};

	var getUEBasePath = function() {
		var src = require.resolve('ueditor');
		return src.replace(/\/[^\/]+$/, '/');
	};

	var on_ue_load = [];
	var on_ui_ready = [];

	var UEDITOR_ON_LOAD = 'UEDITOR_ON_LOAD';
	var UEDITOR_HOME_URL = window.UEDITOR_HOME_URL || getUEBasePath();
	var UEDITOR_INT_URL = window.UEDITOR_INT_URL || UEDITOR_HOME_URL + 'php/controller.php';

	window.UE = {
		getUEBasePath: getUEBasePath
	};

	return {
		/**
		 * on editor ui render ready
		 * @param callback
		 */
		onEditorUIReady: function(callback){
			on_ui_ready.push(callback);
		},

		/**
		 * on UEditor class loaded
		 * @param callback
		 */
		onUELoad: function(callback){
			on_ue_load.push(callback)
		},

		/**
		 * 显示工具条按钮
		 * @param editor
		 * @param command
		 */
		showToolbarButton: function(editor, command){
			editor.ui.toolbars.forEach(function(toolbar){
				toolbar.items.forEach(function(item){
					if(item.className == 'edui-for-'+command){
						$(item.getDom()).find('.edui-icon').css('display', 'inline-block');
					}
				});
			});
		},

		getEditorByNode: function($node){
			var editor_id = $node.data('editor-id');
			if(editor_id){
				return UE.getEditor(editor_id);
			}
			return null;
		},

		/**
		 * 支持参数：name="" mode="lite", mode="normal" buttons="undo,redo,image..." morebuttons="link,unlink..."
		 * @param $node
		 * @param param
		 */
		nodeInit: function($node, param){
			var id = Util.guid();
			var name = $node.attr('name');
			var mode = param.mode || 'lite'; //默认使用lite类型
			var buttons = param.buttons ? [param.buttons.split(',')] : [MODE_BUTTON_LIST[mode]];
			var more_buttons = param.morebuttons ? param.morebuttons.split(',') : null;
			if(more_buttons){
				buttons[buttons.length-1] = buttons[buttons.length-1].concat(more_buttons);
			}

			var w = $node.width() || 400;
			var h = $node.height() || 300;

			$node.data('editor-id', id);

			//remove required attribute, avoid browser focus on a hidden textarea
			$node.hide().removeAttr('required');

			var script = '<script id="'+id+'" name="'+name+'" type="text/plain" style="width:'+w+'px; height:'+h+'px;"></script>';
			$(script).insertAfter($node);

			var UEDITOR_CONFIG = {
				UEDITOR_HOME_URL: UEDITOR_HOME_URL,                 //根目录
				serverUrl: UEDITOR_INT_URL,                         //服务器统一请求接口路径
				toolbars: buttons                                   //工具栏上的所有的功能按钮和下拉框，可以在new编辑器的实例时选择自己需要的从新定义
			};

			require.async('ueditor', function(){
				on_ue_load.forEach(function(cb){
					cb(UE);
				});

				var editor = UE.getEditor(id, UEDITOR_CONFIG);
				editor.addListener("ready", function(){
					editor.setContent('');
					editor.execCommand('insertHtml', $node.val(), true);
					editor.setHeight(h+'px');
					editor.addListener("contentchange", function () {
						$node.val(this.getContent()).trigger('change');
						window['EDITOR_CONTENT_CHANGED_FLAG'] = true;
					} );
				});
				editor.addListener('afteruiready', function(){
					on_ui_ready.forEach(function(cb){
						cb(editor);
					});
				});
			});
		}
	};
});
//../src/component/ScrollFix.js
define('ywj/ScrollFix', function (require) {
	var $ = require('jquery');

	var CLS_FIXED = 'scroll-fixed';
	$('<style>.'+CLS_FIXED+' {position:fixed; top:0}</style>').appendTo('head');

	var $win = $(window);
	var $body = $('body');

	return {
		nodeInit: function($node, param){
			var $holder = $('<div style="height:0; visibility:hidden;"></div>');
			$holder.insertBefore($node);
			var ORG_H = $node.outerHeight();

			//offset height 和 height偏移量，用于恢复node宽度，这种只能针对width没有设置为固定值的情况
			//如果node的width固定了，这里会出现bug
			var ORG_W_OFFSET = $node.outerWidth() - $node.width();
			$node.css({width: $node.width()});

			var upd_pos = function(){
				var st = $body.scrollTop() || $win.scrollTop();
				var chk_top = $holder.position().top;
				$node.width($holder.outerWidth() - ORG_W_OFFSET);
				if(st > chk_top){
					$holder.height(ORG_H);
					$node.addClass(CLS_FIXED);
				} else {
					$holder.height(0);
					$node.removeClass(CLS_FIXED);
				}
			};

			$win.scroll(upd_pos).trigger('scroll');
			$win.resize(function(){
				setTimeout(function(){
					upd_pos();
				}, 0)
			});
		}
	};
});
//../src/component/SelectCheckbox.js
/**
 * Created by Sasumi on 2016/3/16.
 */
define('ywj/SelectCheckbox', function(require){
	require('ywj/resource/selectcheckbox.css');
	var $ = require('jquery');
	var util = require('ywj/util');

	return {
		nodeInit: function($sel){
			$sel.hide();
			if($sel.attr('disabled') || $sel.attr('readonly')){
				var selected_options = [];
				$sel.find('option').each(function(){
					if(this.selected){
						selected_options.push($(this).text());
					}
				});
				if(selected_options.length){
					html = '<dl class="select-cb"><dt>' + selected_options.join('') + '</dt></dl>';
					$(html).insertAfter($sel);
				}
				console.info('ignore for select checkbox:',$sel[0]);
				return;
			}

			var html = '<dd><label class="select-title">'+$sel[0].options[0].text+'</label>';
			var checked_val = '';
			for(var i = 1; i < $sel[0].options.length; i++){
				var checked = '';
				if($sel[0].options[i].getAttribute('selected') == 'selected'){
					checked = ' checked="checked" ';
					checked_val += $sel[0].options[i].innerHTML + ',';
				}
				html += '<label data-value="' + $sel[0].options[i].value + '">' +
					'<input type="checkbox" value=""' + checked + '/>' +
					$sel[0].options[i].text + '</label>';
			}
			html += '</dd>';

			var val_str = $sel[0].options[0].text;
			if(checked_val){
				val_str = (checked_val.length > 12) ? (checked_val.slice(0, 9) + '...') : (checked_val.slice(0, -1));
			}
			html = '<dl class="select-cb"><dt>' + val_str + '</dt>' + html + '</dl>';
			var $mask = $(html).insertAfter($sel);

			$mask.find('input[type=checkbox]').change(function(){
				var dt_val = '';
				$mask.find('input[type=checkbox]').each(function(){
					var val = $(this).parent('label').data('value');
					if($(this).is(':checked')){
						dt_val += $(this).parent('label').text() + ',';
						$($sel[0]).find('option[value=' + val + ']').attr('selected', true);
					}else{
						$($sel[0]).find('option[value="' + val + '"]').removeAttr('selected')
					}
				});
				if(dt_val){
					if(dt_val.length > 12){
						dt_val = dt_val.slice(0, 9) + '...';
					}else{
						dt_val = dt_val.slice(0, -1);
					}
					$mask.find('dt').html(dt_val);
				}else{
					$mask.find('dt').html($sel[0].options[0].text);
				}
			});

			$mask.find('.select-title').click(function(){
				$mask.find('dt').html($sel[0].options[0].text);
				$mask.find('input[type=checkbox]').prop('checked', false);
				$($sel[0]).find('option').removeAttr('selected')
			});
		}
	}
});
//../src/component/SelectCombo.js
/**
 * Created by Sasumi on 2016/3/16.
 */
define('ywj/SelectCombo', function(require){
	require('ywj/resource/selectcombo.css');
	var $ = require('jquery');
	var util = require('ywj/util');

	var MATCH_ITEM_CLASS = 'combo-match';
	var FOCUS_ITEM_CLASS = 'combo-focus';
	var KEY_ENTER = 13;
	var KEY_DOWN = 40;
	var KEY_UP = 38;
	var KEY_LEFT = 37;
	var KEY_RIGHT = 39;
	var KEY_ESC = 27;
	var KEY_TAB = 9;

	var highlight = function(data, search){
		return data.replace(new RegExp("("+util.pregQuote(search)+")",'gi'),"<b>$1</b>");
	};

	return {
		nodeInit: function(sel){
			var $sel = $(sel);
			var required = $sel.attr('required');
			var place_holder = $sel[0].options[0].value == '' ? $sel[0].options[0].text : '';
			var w = $sel.outerWidth()-10;
			w = w > 0 ? w+'px' : 'auto';
			var h = $sel.outerHeight()-4;
			h = h > 0 ? h+'px' : 'auto';
			var txt = $sel[0].options[$sel[0].selectedIndex].text;
			if(txt == place_holder){
				txt = '';
			}
			if($sel.attr('readonly') || $sel.attr('disabled')){
				return;
			}

			//Structure
			var $com = $('<div class="combo">' +
				'<input type="text" class="combo-txt-inp" value="'+$.trim(txt)+'" placeholder="'+place_holder+'" style="width:'+w+'; height:'+h+'; margin:2px 0 0 2px;"/>'+
				'<span class="combo-trigger"></span>'+
				'<ul></ul>'+
				'</div>').insertBefore($sel);
			var $inp = $com.find('input');
			var $ul = $com.find('ul');
			var $trigger = $com.find('.combo-trigger');
			$sel.insertBefore($trigger);

			//search
			var search = function(txt){
				show_menu();
				txt = $.trim(txt);
				$ul.find('li').each(function(){
					var $li = $(this);
					$li.removeClass(MATCH_ITEM_CLASS)
						.removeClass(FOCUS_ITEM_CLASS)
						.html($li.data('txt'));
				});
				if(!txt){
					return;
				}
				var $first_match_li = null;
				$ul.find('li').each(function(){
					var $li = $(this);
					var t = $li.text();
					if(t.toLowerCase().indexOf(txt.toLocaleLowerCase()) >= 0){
						$li.addClass(MATCH_ITEM_CLASS).html(highlight(t, txt));
						if(!$first_match_li){
							$first_match_li = $li;
						}
					}
				});
				if($first_match_li){
					focus_item($first_match_li);
				}
			};

			//select
			var select = function($li){
				var val = $li.data('val');
				var txt = $.trim($li.data('txt'));
				$sel.val(val).trigger('change');
				$inp.val(txt);
				$ul.find('li').removeClass(MATCH_ITEM_CLASS);
				hide_menu();
			};

			var reset = function(){
				var sel = $sel[0];
				txt = sel.options[sel.selectedIndex].text;
				txt = txt == place_holder ? '' : txt;
				$inp.val($.trim(txt));
				hide_menu();
			};

			var scroll_to = function($item){
				var st = $item.index()*$item.outerHeight();
				$ul.scrollTop(st);
			};

			var focus_item = function($node){
				$node = $($node);
				$ul.find('li').removeClass(FOCUS_ITEM_CLASS);
				$node.addClass(FOCUS_ITEM_CLASS);
				scroll_to($node);
			};

			var move_focus = function(down){
				var $current_focus = $ul.find('.'+FOCUS_ITEM_CLASS);
				var $first = $ul.find('li:first');
				var $last = $ul.find('li:last');
				if(!$current_focus.size()){
					focus_item(down ? $first : $last);
				} else {
					if(down){
						if($current_focus.index() == ($ul.find('li').size()-1)){
							focus_item($first);
						} else {
							focus_item($current_focus.next());
						}
					} else {
						if($current_focus.index() == 0){
							focus_item($last);
						} else {
							focus_item($current_focus.prev());
						}
					}
				}
			};

			var tab_match = function(down){
				var found = false;
				var i;
				var current_focus_index = $ul.find('.'+FOCUS_ITEM_CLASS).index();
				var $matches = $ul.find('.'+MATCH_ITEM_CLASS);
				if($matches.size() <= 1){
					return;
				}

				if(down){
					for(i=0; i<$matches.size(); i++){
						if($($matches[i]).index() > current_focus_index){
							focus_item($matches[i]);
							found = true;
							break;
						}
					}
					if(!found){
						focus_item($matches[0]);
					}
				} else {
					for(i=$matches.size()-1; i>=0; i--){
						if($($matches[i]).index() < current_focus_index){
							focus_item($matches[i]);
							found = true;
							break;
						}
					}
					if(!found){
						focus_item($matches[$matches.size()-1]);
					}
				}
			};

			var __mnu_stat__ = false;
			var is_showing = function(){
				return __mnu_stat__;
			};

			var show_menu = function(){
				__mnu_stat__ = true;
				$ul.show();
			};

			var hide_menu = function(){
				__mnu_stat__ = false;
				$ul.hide();
			};

			//build structure
			var ul_html = '';
			$sel.children().each(function(){
				if(this.tagName == 'OPTION'){
					ul_html += '<li data-val="'+util.htmlEscape(this.value)+'" data-txt="'+util.htmlEscape(this.text)+'">'+util.htmlEscape(this.text)+'</li>';
				} else {
					ul_html += '<li class="combo-group-label">'+util.htmlEscape(this.label)+'</li>';
					ul_html += '<ul>';
					$(this).children().each(function(){
						ul_html += '<li data-val="'+util.htmlEscape(this.value)+'" data-txt="'+util.htmlEscape(this.text)+'">'+util.htmlEscape(this.text)+'</li>';
					});
					ul_html += '</ul>';
				}
			});

			//var w = ($sel.outerWidth()-8);
			$ul.attr('style', 'display:none; margin-top:1px; min-width:'+200+'px');
			$ul.html(ul_html);

			//events
			$trigger.click(show_menu);

			$ul.delegate('li', 'click', function(){
				if(!$(this).hasClass('combo-group-label')){
					select($(this));
				}
			});
			$inp.focus(function(){
				this.select(this);
			});
			$inp.mousedown(function(){
				show_menu();
				if($.trim(this.value)){
					search(this.value);
				}
			});
			$inp.keydown(function(e){
				if(!is_showing()){
					return;
				}
				if(e.keyCode == KEY_ENTER){
					var $first = $ul.find('li.'+FOCUS_ITEM_CLASS+':first');
					if($first.size()){
						select($first);
						e.stopPropagation();
						return false;
					}
				}
				if(e.keyCode == KEY_TAB){
					tab_match(!e.shiftKey);
					e.preventDefault();
					e.stopPropagation();
					return false;
				}
				if(util.inArray(e.keyCode, [KEY_UP, KEY_DOWN])){
					move_focus(e.keyCode == KEY_DOWN);
					e.stopPropagation();
					return false;
				}
				if(e.keyCode == KEY_ESC){
					reset();
					e.stopPropagation();
					return false;
				}
			});
			$inp.keyup(function(e){
				if(!util.inArray(e.keyCode, [KEY_ESC, KEY_TAB, KEY_ENTER, KEY_DOWN, KEY_UP, KEY_LEFT, KEY_RIGHT])){
					search(this.value);
				}
			});

			$('body').click(function(event){
				if(is_showing()){
					var tag = event.target;
					if($com[0] != tag && !$.contains($com[0], tag)){
						if($.trim($inp.val()) == ''){
							select($ul.find('li:first'));
						} else {
							reset();
						}
					}
				}
			});

			//patch select event
			$sel.attr('tabindex', '-1');
			$sel.mousedown(function(event){
				event.preventDefault();
				return false;
			});
			$sel.change(function(){
				$inp.val(this.options[this.selectedIndex].text);
			});
		}
	}
});

//../src/component/SelectMultiple.js
/**
 * Created by Sasumi on 2016/3/16.
 */
define('ywj/SelectMultiple', function(require){
	require('ywj/resource/SelectMultiple.css');
	var $ = require('jquery');
	var util = require('ywj/util');

	var CONTAINER_CLASS = 'select-multiple';
	var LABEL_CONTAINER_CLASS = 'select-multiple-label-container';
	var LABEL_CLASS = 'select-multiple-label';
	var TRIGGER_CLASS = 'select-multiple-trigger';
	var LIST_CLASS = 'select-multiple-list';


	var tpl = '<div class="'+CONTAINER_CLASS+'">' +
			'<span class="'+TRIGGER_CLASS+'"></span>' +
			'<span class="'+LABEL_CONTAINER_CLASS+'"></span>' +
			'<ul class="'+LIST_CLASS+'"></ul>'+
		'</div>';

	return function(sel){
		var $sel = $(sel);
		$sel.hide();
		sel = $sel[0];

		var html = '';
		$sel.find('option').each(function(){
			var $opt = $(this);
			html += '<li><label>'
				+'<input type="checkbox" data-name="'+util.htmlEscape($sel.attr('name'))+'" value="'+util.htmlEscape($opt.val())+'" '+ ($opt.attr('selected') ? 'checked="checked"' : '')+'>'
				+'<span>'+util.htmlEscape($opt.text())+'</span>'
				+'</label></li>';
		});

		var $container = $(tpl).insertAfter($sel);
		$container.find('ul').html(html);
		var $trigger = $container.find('.'+TRIGGER_CLASS);
		var $label_container = $container.find('.'+LABEL_CONTAINER_CLASS);
		var $list = $container.find('.'+LIST_CLASS);
		$container.css({height: $sel.outerHeight(),width: $sel.outerWidth()});

		$list.css({display: 'none',width: $sel.outerWidth()});
		$list.find('input').change(function(){
			if(this.checked){
				check_item(this.value);
			} else{
				uncheck_item(this.value);
			}
		});

		$trigger.click(function(){
			toggle_menu();
		});

		$label_container.delegate('span.'+LABEL_CLASS+' s', 'click', function(){
			uncheck_item($(this).parent().data('val'));
		});

		$label_container.click(function(e){
			if(e.target == this){
				toggle_menu();
			}
		});

		$('body').click(function(e){
			var target = e.target;
			if($container[0] != target && !$.contains($container[0], target)){
				hide_menu();
			}
		});

		var toggle_menu = function(){
			if($list.css('display') == 'block'){
				hide_menu();
			} else {
				show_menu();
			}
		};

		var show_menu = function(){
			$list.show();
		};

		var hide_menu = function(){
			$list.hide();
		};

		var check_item = function(val){
			$sel.find('option').each(function(){
				if(this.value == val){
					$('<span class="'+LABEL_CLASS+'" data-val="'+util.htmlEscape(val)+'">'+$(this).text()+'<s></s></span>').appendTo($label_container);
					this.selected = 'selected';
					$sel.trigger('change');
				}
			});
		};

		var uncheck_item = function(val){
			$list.find('input[value="'+util.htmlEscape(val)+'"]').attr('checked', false);
			$label_container.find('span[data-val="'+util.htmlEscape(val)+'"]').remove();
			$sel.find('option').each(function(){
				if(this.value == val){
					this.selected = false;
					$sel.trigger('change');
				}
			});
		};

		$sel.find('option').each(function(){
			if(this.selected){
				check_item(this.value);
			}
		})
	}
});
//../src/component/SelectTree.js
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
//../src/component/selectui.js
define('ywj/selectui', function(require){
	require('ywj/resource/selectui.css');
	var $ = require('jquery');
	var Util = require('ywj/util');

	var ACT_CLASS = 'com-select-ui-trigger';

	var init = function($node, param){
		var name = $node.attr('name');
		var triggerevent = param.triggerevent || 'click';
		var selected = $node[0].selectedIndex;
		var value = $node[0].options[selected].value;
		var readonly = $node.attr('readonly');
		var disabled = $node.attr('disabled');
		var required = $node.attr('required'); //@todo
		var multiple = $node.attr('multiple'); //@todo

		var html = '<dl class="com-select-ui '+(disabled ? 'com-select-ui-disabled':'')+(readonly ? ' com-select-ui-readonly':'')+'" data-name="'+Util.htmlEscape(name)+'" data-value="'+Util.htmlEscape(value)+'">';
		html += '<dt>'+$($node[0].options[selected]).text()+'</dt>';
		html += '<dd><ul>';

		var build_opt = function(label, v){
			if(v !== undefined){
				var guid = Util.guid();
				return '<li' + (value === v ? ' class="active"' : '')+'>'+
					'<label tabindex="0" data-value="'+Util.htmlEscape(v)+'">'+Util.htmlEscape(label)+'</label></li>';
			}
			return '<li><span>'+Util.htmlEscape(label)+'</span></li>';
		};

		$node.children().each(function(){
			if(this.tagName == 'OPTGROUP'){
				html += build_opt(this.label);
				$(this).children().each(function(){
					html += build_opt($(this).text(), this.value);
				});
			} else {
				html += build_opt($(this).text(), this.value);
			}
		});
		html += '</ul></dd></dl>';
		var $sel = $(html).insertAfter($node);
		$sel.delegate('label', 'click', function(ev){
			var val = $(this).data('value');
			$node.val(val).trigger('change');
			$sel.find('li').removeClass('active');
			$sel.find('li').each(function(){
				var $lbl = $(this).find('label');
				if($lbl.data('value') === val){
					$sel.find('dt').html($lbl.html());
					$(this).addClass('active');
				}
			});
			$sel.attr('data-value', val);
			ev.stopPropagation();
			hide();
			return false;
		});

		var _SHOW_INIT_ = false;
		var show = function(){
			$sel.addClass(ACT_CLASS);
			var h = $sel.find('.active').offset().top - $sel.offset().top;
			if(!_SHOW_INIT_ && h > $sel.find('dd').outerHeight()){
				var t = h - $sel.find('.active').outerHeight();
				$sel.find('dd').animate({'scrollTop':t}, 'fast');
			};
			_SHOW_INIT_ = true;
		};
		var hide = function(){$sel.removeClass(ACT_CLASS);};

		//toggle
		$sel.on(triggerevent, show);
		$('body').on(triggerevent, function(event){
			if($sel[0] == event.target || $.contains($sel[0], event.target)){

			} else {
				hide();
			}
		});
		$('body').on('keyup', function(e){
			if(e.keyCode == Util.KEYS.ESC){
				hide();
			}
		});
		$node.hide();
	}

	return {
		nodeInit: init
	}
});
//../src/component/simform.js
/**
 * Created by Administrator on 2016/6/27.
 */
define('ywj/simform', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');

	var build_form = function(param){
		param = $.extend({
			method: 'post',
			target: '',
			action: '',
			data: ''
		}, param);

		var $form = $('<form action="'+param.action+'" '+(param.target ? 'target="'+param.target+'"':'')+' method="'+param.method+'" style="display:none;">').appendTo('body');
		var data_list = param.data.split('&');
		for(var i=0; i<data_list.length; i++){
			var tmp = data_list[i].split('=');
			$('<input type="hidden" name="'+Util.htmlEscape(tmp[0])+'" value="'+Util.htmlEscape(tmp[1])+'"/>').appendTo($form);
		}
		return $form;
	};

	return {
		buildForm: build_form,
		nodeClick: function($node, param){
			param.action = param.action || $node.attr('href');
			var $form = build_form(param);
			$form.submit();
			return false;
		}
	}
});
//../src/component/slide.js
/**
 * Created by sasumi on 5/12/2014.
 */
define('ywj/slide', function(require){
	var PRIVATE_VARS = {};
	var util = require('ywj/util');

	/**
	 * bind trigger event
	 * @param slide
	 * @param content
	 */
	var bindEvent = function(slide, content){
		var hovering = false;
		var hover_check_time = 50;

		$(content).mouseover(function(){
			hovering = true;
			slide.pause();
		});

		$(content).mouseout(function(){
			hovering = false;
			setTimeout(function(){
				if(!hovering){
					slide.resume();
				}
			}, hover_check_time);
		});
	};

	var Slide = function(content, option){
		var guid = util.guid();
		PRIVATE_VARS[guid] = {};
		PRIVATE_VARS[guid].content_list = $(content).children();

		this.guid = guid;
		this.index = 0;
		this.option = $.extend({
			interval: 3000
		}, option);

		bindEvent(this, content);
	};

	/**
	 * 添加控制器
	 * @param $control
	 * @param event
	 */
	Slide.prototype.addControl = function($control, event){
		var s = this;
		event = event || 'mouseover';
		$($control).children().each(function(k, v){
			$(this)[event](function(){
				s.switchTo(k);
				s.pause();
				return false;
			});
		});
	};

	/**
	 * animate
	 * @param fromCon
	 * @param toCon
	 * @param callback
	 */
	Slide.prototype.animate = function(fromCon, toCon, callback){
		fromCon.animate({opacity: 0}, 100, null, function(){fromCon.hide();});
		toCon.show().animate({opacity: 0}, 0).animate({opacity: 1}, 100);
		callback();
	};

	/**
	 * on switch to slide
	 * @param fromNode
	 * @param toNode
	 */
	Slide.prototype.onSwitchTo = function(fromNode, toNode){};


	/**
	 * 切换到指定
	 * @param idx
	 * @param callback
	 */
	Slide.prototype.switchTo = function(idx, callback){
		callback = callback || function(){};
		if(idx == this.index){
			callback();
			return;
		}

		var from = PRIVATE_VARS[this.guid].content_list.eq(this.index);
		var to = PRIVATE_VARS[this.guid].content_list.eq(idx);
		this.animate(from, to, callback);
		this.onSwitchTo(from, to);
		this.index = idx;
	};

	/**
	 * 切换到下一个
	 */
	Slide.prototype.switchToNext = function(){
		var total = PRIVATE_VARS[this.guid].content_list.size();
		var idx = (this.index == total - 1) ? 0 : (this.index+1);
		this.switchTo(idx);
	};

	/**
	 * 切换到上一个
	 */
	Slide.prototype.switchToPre = function(){
		var total = PRIVATE_VARS[this.guid].content_list.size();
		var idx = (this.index == 0) ? (total-1) : (this.index-1);
		this.switchTo(idx);
	};

	/**
	 * start/resume slide loop
	 */
	Slide.prototype.start = function(idx){
		//console.log('start');
		idx = idx !== undefined ? idx : this.index;
		this.stop();
		PRIVATE_VARS[this.guid].stop = false;
		this.run(idx);
	};

	/**
	 * 暂停
	 */
	Slide.prototype.pause = function(){
		//console.log('pause');
		clearTimeout(PRIVATE_VARS[this.guid].timer);
		PRIVATE_VARS[this.guid].stop = true;
	};

	/**
	 * 恢复
	 */
	Slide.prototype.resume = function(){
		//console.log('resume');
		if(!PRIVATE_VARS[this.guid].stop){
			//console.log('resume fail');
			return;
		}
		//console.log('resume true');
		PRIVATE_VARS[this.guid].stop = false;
		this.run(this.index);
	};

	/**
	 * stop slide change loop
	 */
	Slide.prototype.stop = function(){
		//console.log('stop');
		this.index = 0;
		clearTimeout(PRIVATE_VARS[this.guid].timer);
		PRIVATE_VARS[this.guid].stop = true;
	};

	/**
	 * run slide change loop
	 * @param from
	 */
	Slide.prototype.run = function(from){
		if(PRIVATE_VARS[this.guid].stop){
			//console.log('run false');
			return;
		}

		var _this = this, guid = this.guid;
		var total = PRIVATE_VARS[guid].content_list.size();
		var to = from == (total-1) ? 0 : (from+1);

		PRIVATE_VARS[this.guid].timer = setTimeout(function(){
			var fromNode = PRIVATE_VARS[guid].content_list.eq(from);
			var toNode = PRIVATE_VARS[guid].content_list.eq(to);
			_this.animate(fromNode, toNode, function(){
				_this.onSwitchTo(fromNode, toNode);
				_this.run(to);
				_this.index = to;
			});
		}, this.option.interval);
	};
	return Slide;
});
//../src/component/table.js
/**
 * 表格的相关操作
 */
define('ywj/table',function(require){
	//删除
	var delRow = function(row, allow_empty){
		if(!allow_empty && row.parent().children().size() == 1){
			return false;
		}
		row.remove();
	};

	//追加
	//TODO 暂时不支持ie8
	var appendRow = function(tpl, table){
		var app = $(tpl).appendTo(table);
		if($('input[rel=upload-image]', app).size()){
			require.async('ywj/uploader', function(U){
				new U($('input[rel=upload-image]', app), {
					UPLOAD_URL: window.UPLOAD_URL,
					PROGRESS_URL: window.UPLOAD_PROGRESS_URL
				});
			});
		}
	};

	//上移
	var moveUp = function(row){
		var idx = row.index();
		if(idx == 0){
			return false;
		}
		var pre = row.parent().children()[idx-1];
		row.insertBefore(pre);
	};

	//下移
	var moveDown = function(row){
		var idx = row.index();
		var total = row.parent().children().size();
		if(idx == (total-1)){
			return false;
		}
		var next = row.parent().children()[idx+1];
		row.insertAfter(next);
	};

	return {
		deleteRow: delRow,
		appendRow: appendRow,
		moveUpRow: moveUp,
		moveDownRow: moveDown
	};
});
//../src/component/tabswitcher.js
/**
 * tab 选择器
 * @param tb 选择器父容器
 * @param ctn 目标父容器
 * @param event 触发事件
 * @param active_class 激活class
 * @param disable_class 禁用class
 * @constructor
 */
define('ywj/tabswitcher', function(require){
	var $ = require('jquery');
	var tab = function(tb, ctn, event, active_class, disable_class){
		event = event || 'click';
		active_class = active_class || 'active';
		disable_class = disable_class || 'disactive';

		var tbs = $(tb).children();
		var ctns = $(ctn).children();
		tbs.each(function(idx){
			$(this).on(event, function(){
				tbs.each(function(i){
					$(this)[i != idx ? 'removeClass' : 'addClass'](active_class);
					$(this)[i != idx ? 'addClass' : 'removeClass'](disable_class);
				});
				ctns.each(function(i){
					$(this)[i != idx ? 'removeClass' : 'addClass'](active_class);
					$(this)[i != idx ? 'addClass' : 'removeClass'](disable_class);
				});
				if($('input[type=radio]', this).size()){
					$('input[type=radio]', this).attr('checked', true);
				}
				if(event == 'click'){
					return false;
				}
			});
		});
	};

	tab.nodeInit = function($node, param){
		var content = param.content;
		if(!content || !$(content).size()){
			console.error('no tab content find:', content);
			return false;
		}
		return tab($node, content);
	};

	return tab;
});

//../src/component/timepicker.js
/**
 * Created by sasumi on 2014/12/2.
 */
define('ywj/timepicker', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');
	var $html = $('html');
	require('jquery/ui/timepicker');

	var top_window = window;
	try {
		if(top.seajs){
			top_window = top;
		}
		window.frameElement && top_window.seajs.use('ywj/timepicker');
	} catch(ex){
		console.error('Top window access fail, use local window instead.', ex);
	}

	var cover_date_str = function(str){
		if(str === 'now'){
			return new Date();
		}
		return str;
	};

	/**
	 * show datetime picker in top window
	 */
	var $PICKER_CON;
	var SHOW_FLAG;
	var $LAST_NODE;
	var showPicker = function(method, $node, opt){
		SHOW_FLAG = true;
		$LAST_NODE = $node;
		if(!$PICKER_CON){
			$PICKER_CON = $('<div class="top-datetime-picker" style="position:absolute; background-color:white; z-index:2000">').appendTo(document.body);
			$html.keydown(function(e){
				if(e.keyCode === Util.KEYS.ESC){
					console.log('DELEGATE WINDOW key ESC, time picker hide');
					hidePicker();
				}
			});
			$html.click(function(e){
				if(e.target === $PICKER_CON[0] || !$(e.target).closest('html').size() ||  $.contains($PICKER_CON[0], e.target)){
					console.log('click inside time picker');
				} else {
					console.log('DELEGATE WINDOW click in other region');
					hidePicker();
				}
			});
		}
		opt.onSelect = function(date, $ins){
			console.info('timepicker select', date);
			$LAST_NODE.val(date).trigger('change');
			if(method === 'datepicker'){
				hidePicker();
			}
		};
		$PICKER_CON.show()
			.datepicker('destroy')
			.datetimepicker('destroy')
			[method](opt)
			[method]('setDate', $node.val());
		if(opt.left !== undefined){
			$PICKER_CON.css('left', opt.left);
		}
		if(opt.top !== undefined){
			$PICKER_CON.css('top', opt.top);
		}
		setTimeout(function(){SHOW_FLAG = false;}, 100);
	};

	/**
	 * hide top window datetime picker
	 */
	var hidePicker = function(method){
		console.info('SHOW_FLAG', SHOW_FLAG);
		if(!$PICKER_CON || SHOW_FLAG){
			return;
		}
		console.info('hide datetime picker');
		$PICKER_CON.hide();
	};

	return {
		showPicker: showPicker,
		hidePicker: hidePicker,
		nodeInit: function($node, param){
			if($node.attr('readonly') || $node.attr('disabled')){
				return;
			}

			var opt = {};
			var method = 'datepicker';
			switch(param.format){
				case 'date':
					opt = {dateFormat: 'yy-mm-dd'};
					opt.maxDate = cover_date_str(param.max);
					opt.minDate = cover_date_str(param.min);
					method = 'datepicker';
					break;

				case 'time':
					opt = {timeFormat:'HH:mm:ss'};
					opt.maxTime = cover_date_str(param.max);
					method = 'timepicker';
					break;

				case 'datetime':
				case '':
				default:
					opt = {dateFormat: 'yy-mm-dd', timeFormat: 'HH:mm:ss'};
					opt.maxTime = cover_date_str(param.max);
					method = 'datetimepicker';
					break;
			}

			//bind space click only in difference frame
			if(top_window !== window){
				$html.click(function(e){
					if($PICKER_CON && (e.target === $PICKER_CON[0] || !$(e.target).closest('html').size() ||  $.contains($PICKER_CON[0], e.target))){
						console.log('LOCAL WINDOW click inside time picker');
						//hit current picker
					} else if(e.target === $node[0]){
						console.log('LOCAL WINDOW hit on input');
					} else {
						console.log('LOCAL WINDOW click in other region');
						top_window.seajs.use('ywj/timepicker', function(tp){
							console.log('local hide');
							tp.hidePicker(method);
						});
					}
				});
			}

			$node.click(function(){
				console.log('node click');
				top_window.seajs.use('ywj/timepicker', function(tp){
					var r = Util.getNodeRegionInTop($node);
					opt.left = r.left;
					opt.top = r.top + $node.outerHeight();
					console.log('node click', method, $node, opt);
					tp.showPicker(method, $node, opt);
				});
			});
		}
	}
});
//../src/component/tip.js
define('ywj/tip', function(require){
	require('ywj/resource/tip.css');
	var $ = require('jquery');
	var Util = require('ywj/util');
	var Net = require('ywj/net');
	var Hooker = require('ywj/hooker');
	var OBJ_COLLECTION = {};
	var PRIVATE_VARS = {};
	var GUID_BIND_KEY = 'ywj-com-tip-guid';
	var TRY_DIR_MAP = [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	var KEY_ESC = 27;

	/**
	 * 绑定事件
	 */
	var bindEvent = function(){
		if(PRIVATE_VARS[this.guid].opt.closeBtn){
			var btn = $('.ywj-tip-close', this.getDom());
			var _this = this;
			btn.click(function(){
				_this.hide();
			});
			$('body').keyup(function(e){
				if(e.keyCode == KEY_ESC){
					_this.hide();
				}
			});
		}
	};

	/**
	 * 自动计算方位
	 * @returns {number}
	 */
	var calDir = function(){
		var $body = $('body');
		var $container = this.getDom();
		var width = $container.outerWidth();
		var height = $container.outerHeight();
		var px = this.rel_tag.offset().left;
		var py = this.rel_tag.offset().top;
		var rh = this.rel_tag.outerHeight();
		var rw = this.rel_tag.outerWidth();

		var scroll_left = $body.scrollLeft();
		var scroll_top = $body.scrollTop();

		var viewRegion = Util.getRegion();

		for(var i=0; i<TRY_DIR_MAP.length; i++){
			var dir_offset = getDirOffset(TRY_DIR_MAP[i], width, height, rh, rw);
			var rect = {
				left:px+dir_offset[0],
				top:py+dir_offset[1],
				width: width,
				height: height
			};
			var layout_rect = {
				left:scroll_left,
				top:scroll_top,
				width: viewRegion.visibleWidth,
				height: viewRegion.visibleHeight
			};
			if(Util.rectInLayout(rect, layout_rect)){
				return TRY_DIR_MAP[i];
			}
		}
		return 11;
	};

	/**
	 * 方位偏移
	 * @param dir
	 * @param width
	 * @param height
	 * @param rh
	 * @param rw
	 * @returns {*}
	 */
	var getDirOffset = function(dir, width, height, rh, rw){
		var offset = {
			11: [-width*0.25+rw/2, rh],
			0: [-width*0.5+rw/2, rh],
			1: [-width*0.75+rw/2, rh],
			2: [-width, -height*0.25+rh/2],
			3: [-width, -height*0.5+rh/2],
			4: [-width, -height*0.75+rh/2],
			5: [-width*0.75+rw/2, -height],
			6: [-width*0.5+rw/2, -height],
			7: [-width*0.25+rw/2, -height],
			8: [rw, -height*0.75 + rh/2],
			9: [rw, -height*0.5 + rh/2],
			10: [rw, -height*0.25 + rh/2]
		};
		return offset[dir];
	};

	/**
	 * 更新位置信息
	 */
	var updatePosition = function(){
		var vars = PRIVATE_VARS[this.guid];
		var dir = vars.opt.dir;
		var $container = this.getDom();
		var width = $container.outerWidth();
		var height = $container.outerHeight();
		var px = this.rel_tag.offset().left;
		var py = this.rel_tag.offset().top;
		var rh = this.rel_tag.outerHeight();
		var rw = this.rel_tag.outerWidth();

		if(dir == 'auto'){
			dir = calDir.call(this);
		}
		$container.attr('class', 'ywj-tip-container-wrap ywj-tip-'+dir);
		var offset = getDirOffset(dir, width, height, rh, rw);
		var x = px + offset[0];
		var y = py + offset[1];

		$container.css({
			left: parseInt(x,10),
			top: parseInt(y,10)
		});
	};

	/**
	 * TIP组件
	 * @param content
	 * @param rel_tag
     * @param opt
	 * @constructor
	 */
	var Tip = function(content, rel_tag, opt){
		this.guid = Util.guid();
		this.rel_tag = $(rel_tag);
		this.onShow = Hooker(true);
		this.onHide = Hooker(true);
		this.onDestory = Hooker(true);
		PRIVATE_VARS[this.guid] = {};

		opt = $.extend({
			closeBtn: false, //是否显示关闭按钮
			timeout: 0,
			width: 'auto',
			dir: 'auto'
		}, opt || {});
		var html =
			'<div class="ywj-tip-container-wrap" style="display:none;">'+
				'<s class="ywj-tip-arrow ywj-tip-arrow-pt"></s>'+
				'<s class="ywj-tip-arrow ywj-tip-arrow-bg"></s>'+
				(opt.closeBtn ? '<span class="ywj-tip-close">&#10005;</span>' : '')+
				'<div class="ywj-tip-content">'+content+'</div>'+
			'</div>';

		PRIVATE_VARS[this.guid].opt = opt;
		var $container = $(html).appendTo($('body'));
		$container.css('width', opt.width);
		PRIVATE_VARS[this.guid].container = $container;
		OBJ_COLLECTION[this.guid] = this;
		bindEvent.call(this);
	};

	Tip.prototype.getDom = function(){
		var vars = PRIVATE_VARS[this.guid];
		return vars.container;
	};

	Tip.prototype.updateContent = function(html){
		this.getDom().find('.ywj-tip-content').html(html);
		updatePosition.call(this);
	};

	Tip.prototype.show = function(){
		//去重判断，避免onShow时间多次触发
		if(this.isShow()){
			return;
		}
		var vars = PRIVATE_VARS[this.guid];
		var _this = this;
		this.getDom().show().stop().animate({opacity:1}, 'fast');
		updatePosition.call(this);
		this.onShow.fire(this);
		if(vars.opt.timeout){
			setTimeout(function(){
				_this.hide();
			}, vars.opt.timeout);
		}
	};

	Tip.prototype.isShow = function(){
		return this.getDom().is(':visible');
	};

	Tip.prototype.hide = function(){
		var _this = this;
		this.getDom().stop().animate({opacity:0}, 'fast', function(){_this.getDom().hide()});
		this.onHide.fire(this);
	};

	Tip.prototype.destroy = function(){
		this.getDom().remove();
		this.onDestory.fire(this);
	};

	Tip.hideAll = function(){
		for(var i in OBJ_COLLECTION){
			OBJ_COLLECTION[i].hide();
		}
	};

	Tip.show = function(content, rel_tag, opt){
		var tip = new Tip(content, rel_tag, opt);
		tip.show();
		return tip;
	};

	/**
	 * 简单节点绑定
	 * @param content
	 * @param rel_tag
	 * @param opt
	 * @returns {*}
	 */
	Tip.bind = function(content, rel_tag, opt){
		var guid = $(rel_tag).data(GUID_BIND_KEY);
		var obj = OBJ_COLLECTION[guid];
		if(!obj){
			var tm;
			var hide = function(){
				tm = setTimeout(function(){
					obj && obj.hide();
				}, 10);
			};

			var show = function(){
				clearTimeout(tm);
				obj.show();
			};

			obj = new Tip(content, rel_tag, opt);
			$(rel_tag).data(GUID_BIND_KEY, obj.guid);

			obj.getDom().hover(show, hide);
			$(rel_tag).hover(show, hide);
		}
		return obj;
	};

	/***
	 * 绑定异步处理函数
	 * @param rel_tag
	 * @param opt
	 * @param loader
	 */
	Tip.bindAsync = function(rel_tag, loader, opt){
		var guid = $(rel_tag).data(GUID_BIND_KEY);
		var obj = OBJ_COLLECTION[guid];
		if(!obj){
			var loading = false;
			obj = Tip.bind('loading...', rel_tag, opt);
			obj.onShow(function(){
				if(loading){
					return;
				}
				loading = true;
				loader(function(html){
					loading = false;
					obj.updateContent(html);
				}, function(error){
					loading = false;
					obj.updateContent(error);
				});
			}, opt.refresh);
		}
	};

	/**
	 * @param $node
	 * @param {Object} param {url, content, refresh}
	 */
	Tip.nodeInit = function($node, param){
		var url = param.url;
		var content = param.content;
		if(url){
			Tip.bindAsync($node, function(on_success, on_error){
				Net.get(url, null, function(rsp){
					if(rsp && !rsp.code){
						on_success(rsp.data);
					} else {
						on_error(rsp.message);
					}
				});
			},param);
		} else {
			Tip.bind(content, $node, param);
		}
	};
	
	return Tip;
});
//../src/component/tmpl.js
/**
 * Created by sasumi on 2015/3/25.
 */
define('ywj/tmpl', function(){
	function tmpl(str, data){
		// Figure out if we're getting a template, or if we need to
		// load the template - and be sure to cache the result.
		var fn = !/\W/.test(str) ? cache[str] = cache[str] ||
		tmpl(document.getElementById(str).innerHTML) :        // Generate a reusable function that will serve as a template
			// generator (and which will be cached).
			new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};" +

				// Introduce the data as local variables using with(){}
			"with(obj){p.push('" +

				// Convert the template into pure JavaScript
			str.replace(/[\r\t\n]/g, " ").split("<%").join("\t").replace(/((^|%>)[^\t]*)'/g, "$1\r").replace(/\t=(.*?)%>/g, "',$1,'").split("\t").join("');").split("%>").join("p.push('").split("\r").join("\\'") +
			"');}return p.join('');");

		// Provide some basic currying to the user
		return data ? fn(data) : fn;
	}
	return tmpl;
});
//../src/component/toast.js
define('ywj/toast', function(require){
	var $ = require('jquery');
	var util = require('ywj/util');
	var toast_css_url = seajs.resolve('ywj/resource/toast.css');
	var top_doc;
	var top_win;

	try {
		top_doc = parent.document;
		top_win = parent;
	} catch(ex){}
	top_doc = top_doc || document;
	top_win = top_win || window;

	//暂未提供非同域的情况处理逻辑
	$('head', top_doc).append('<link rel="stylesheet" type="text/css" href="'+toast_css_url+'"/>');

	//多窗口适配
	if(top_win['__YWJ_TOAST__']){
		return top_win['__YWJ_TOAST__'];
	}

	var $WRAPPER;
	var TOAST_COLLECTION = [];

	var remove_in_collection = function(toast){
		var c = [];
		for(var i=0; i<TOAST_COLLECTION.length; i++){
			if(TOAST_COLLECTION[i].guid != toast.guid){
				c.push(TOAST_COLLECTION[i]);
			} else {
				toast.destroy();
			}
		}
		TOAST_COLLECTION = c;
		if(!TOAST_COLLECTION.length){
			$WRAPPER.hide();
		}
	};

	/**
	 * Show message
	 * @param arg1
	 * @param type
	 * @param time
	 * @param closeCallback
	 */
	var Toast = function(arg1, type, time, closeCallback){
		TOAST_COLLECTION.push(this);
		this.guid = '_tip_'+util.guid();
		this.container = null;
		var cfg = arg1;
		if(typeof(arg1) == 'string'){
			cfg = {
				'toast': arg1,
				'type': type,
				'time': (time > 0 ? time*1000 : 2000)
			};
		}
		//extend default message config
		this.config = $.extend({
			'toast': '',
			'type': 0,
			'time': 2000,
			'auto': true,
			'callback': closeCallback
		}, cfg);

		//auto
		if(this.config.auto){
			this.show();
		}
	};

	/**
	 * show message
	 */
	Toast.prototype.show = function(){
		if(!$WRAPPER){
			$WRAPPER = $('<div class="ywj-toast-container-wrap"></div>').appendTo($('body', top_doc));
		}

		$WRAPPER.show();
		this.container = $(
			'<div class="ywj-toast-container" id="'+this.guid+'" style="display:none">'+
				(this.config.type ? '<span class="ywj-toast-icon-'+this.config.type+'"><i></i></span>' : '')+
				'<span class="ywj-toast-content">'+this.config.toast+'</span>'+
			'</div>').appendTo($WRAPPER);
		$('<div></div>').appendTo($WRAPPER);

		this.container.show();
		var _this = this;
		setTimeout(function(){
			_this.container.addClass('ywj-toast-ani-in');
		}, 10);

		if(this.config.time && this.config.auto){
			setTimeout(function(){
				_this.hide();
			}, this.config.time);
		}
	};

	/**
	 * hide message
	 */
	Toast.prototype.hide = function(){
		if(this.container){
			this.container.addClass('ywj-toast-ani-out');
			var _this = this;
			setTimeout(function(){
				_this.container.hide();
				remove_in_collection(_this);
			}, 1000);
			this.config.callback && this.config.callback(this);
		}
	};

	/**
	 * destroy message container
	 */
	Toast.prototype.destroy = function(){
		this.container.remove();
	};

	/**
	 * hide message
	 */
	Toast.hide = function(){
		for(var i=0; i<TOAST_COLLECTION.length; i++){
			TOAST_COLLECTION[i].hide();
		}
	};

	/**
	 * shortcut method
	 * @param arg1
	 * @param type
	 * @param time
	 * @returns {Toast}
	 */
	Toast.show = function(arg1, type, time){
		return new Toast(arg1, type, time);
	};

	/**
	 * show success message
	 * @param toast
	 * @param time
	 * @returns {Toast}
	 */
	Toast.showSuccess = function(toast, time){
		return new Toast(toast, 'succ', time);
	};

	/**
	 * show error message
	 * @param toast
	 * @param time
	 * @returns {Toast}
	 */
	Toast.showError = function(toast, time){
		return new Toast(toast, 'err', time);
	};

	/**
	 * show info message
	 * @param toast
	 * @param time
	 * @returns {Toast}
	 */
	Toast.showInfo = function(toast, time){
		return new Toast(toast, 'info', time);
	};

	/**
	 * show loading message
	 * @param toast
	 * @param time
     * @returns {Toast}
	 */
	Toast.showLoading = function(toast, time){
		return new Toast(toast, 'load', time);
	};

	Toast.nodeClick = function(){
		var toast = $(this).data('toast') || $(this).attr('title');
		if(toast){
			Toast.show(toast, 'info');
		}
	};

	if(!top_win['__YWJ_TOAST__']){
		top_win['__YWJ_TOAST__'] = Toast;
	}
	return Toast;
});
//../src/component/toc.js
/**
 * 文章目录结构
 */
define('ywj/toc', function(require){
	require('ywj/resource/toc.css');
	var $ = require('jquery');
	var Util = require('ywj/util');
	var CLS = 'com-toc';
	var CLS_ACTIVE = 'active';

	var resolve_level = function($h){
		return parseInt($h[0].tagName.replace(/\D/,''), 10);
	};

	var scroll_top = function(){
		return $(window).scrollTop() || $('body').scrollTop();
	}

	var scroll_to = function($node){
		$('html').stop().animate({scrollTop: $node.offset().top - 10});
	};

	var toc = function($content){
		var html = '<ul class="'+CLS+'">';
		var hs = 'h1,h2,h3,h4,h5';

		//top
		var top_id = 'toc'+Util.guid();
		html += '<a href="#'+top_id+'" class="com-toc-top">本页目录</a>';
		$('<a name="'+top_id+'"></a>').prependTo('body');

		var max_level = 5;
		var last_lvl = 0;
		var start_lvl = 0;
		$content.find(hs).each(function(){
			var $h = $(this);
			var id = 'toc'+Util.guid();
			$('<a name="'+id+'"></a>').insertBefore($h);
			var lv = resolve_level($h);
			if(!start_lvl){
				start_lvl = lv;
			}
			if(!last_lvl){
				html += '<li><a href="#'+id+'">'+$h.text()+'</a>';
			}
			else if(lv === last_lvl){
				html += '</li><li><a href="#'+id+'">'+$h.text()+'</a>';
			}
			else if(lv > last_lvl){
				html += '<ul><li><a href="#'+id+'">'+$h.text()+'</a>';
			} else if(lv < last_lvl){
				html += '</li></ul></li>';
				html += '<li><a href="#'+id+'">'+$h.text()+'</a>';
			}
			last_lvl = lv;
		});
		for(var i=0; i<=(last_lvl-start_lvl); i++){
			html += '</li></ul>';
		}

		var $toc = $(html).appendTo('body');
		$toc.find('a').click(function(){
			var $a = $(this);
			var id = $a.attr('href').replace('#', '');
			var $anchor = $('a[name='+id+']');
			scroll_to($anchor);
			location.hash = '#'+id;
			return false;
		});

		//init
		var hash = location.hash.replace('#','');
		if(hash){
			var $anchor = $('body').find('a[name='+hash+']');
			if($anchor.size()){
				scroll_to($anchor);
			}
		}

		var upd = function(){
			var top = Math.max($content.offset().top, scroll_top());
			$toc.css({
				left:$content.offset().left + $content.outerWidth(),
				top: top
			});
			$toc.find('li').removeClass(CLS_ACTIVE);
			$toc.find('a').each(function(){
				var $a = $(this);
				var id = $a.attr('href').replace('#', '');
				var $anchor = $('a[name='+id+']');
				if($anchor.offset().top > scroll_top()){
					$a.parents('li').addClass(CLS_ACTIVE);
					return false;
				}
			})
		};

		$(window).resize(upd).scroll(upd);
		upd();
	};

	toc.nodeInit = toc;
	return toc;
});
//../src/component/uploader.js
/**
 * 文件上传组件，仅支持html5浏览器
 * 数据返回格式：
 * {
	code: 0,    //返回码，0表示成功，其他为失败
	message: '成功',  //后台返回成功（错误）信息
	data: {
        src: 'http://www.baidu.com/a.gif',  //用于前端显示的文件路径
        value: 'a.gif'                      //用于表单提交的输入框值
    }
 *
 */
define('ywj/uploader', function(require){
	seajs.use('ywj/resource/uploader.css');
	var $ = require('jquery');
	var Net = require('ywj/net');
	var lang = require('lang/$G_LANGUAGE');
	var Util = require('ywj/util');
	require('ywj/imagescale');
	var PRIVATES = {};
	var _guid = 1;
	var console = window.console || function(){};

	if(!window.Worker){
		console.error('Simple file uploader no support');
		return function(){};
	}

	var guid = function(){
		return '_su_file_'+_guid++;
	};

	var TPL = '<div class="com-uploader com-uploader-normal">'+
					'<label class="com-uploader-file">'+
						'<input type="file">'+
						'<span>'+lang('上传文件')+'</span>'+
					'</label>'+
					'<div class="com-uploader-progress">'+
						'<progress min="0" max="100" value="0">0%</progress>'+
						'<span>0%</span>'+
					'</div>'+
					'<div class="com-uploader-content"></div>'+
					'<div class="com-uploader-handle">'+
						'<input type="button" class="com-uploader-upload com-uploader-btn" value="' +lang('开始上传')+'"/>'+
						'<input type="button" class="com-uploader-reload com-uploader-btn" value="' +lang('重新上传')+'"/>'+
						'<input type="button" class="com-uploader-cancel com-uploader-btn" value="' +lang('取消上传')+'"/>'+
						'<input type="button" class="com-uploader-delete com-uploader-btn" value="' +lang('删除')+'"/>'+
					'</div>'+
				'</div>';

	var COM_CLASS = 'com-uploader';
	var COM_CLASS_CONTAINER = COM_CLASS;
	var COM_CLASS_CONTENT = COM_CLASS+'-content';
	var COM_CLASS_UPLOAD_NORMAL = COM_CLASS+'-normal';
	var COM_CLASS_UPLOADING = COM_CLASS+'-uploading';
	var COM_CLASS_UPLOAD_FAIL = COM_CLASS+'-error';
	var COM_CLASS_UPLOAD_SUCCESS = COM_CLASS+'-success';

	/**
	 * percent check
	 * @param UP
     * @param callback
	 * @param interval
	 */
	var percent_check = function(UP, callback, interval){
		if(!UP.config.PROGRESS_URL){
			console.warn('UPLOAD PROGRESS NO FOUND');
			return;
		}

		var PRI = PRIVATES[UP.id];
		if(PRI.abort){
			return;
		}

		interval = interval || 100;
		var xhr = navigator.appName == "Microsoft Internet Explorer" ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		xhr.withCredentials = true;
		xhr.open('GET', UP.config.PROGRESS_URL);
		xhr.onreadystatechange = function(){
			if(PRI.abort){
				return;
			}
			if(this.readyState == 4){
				var rsp = this.responseText;
				if(rsp < 100){
					callback(rsp);
					setTimeout(function(){
						percent_check(UP, callback, interval);
					}, interval);
				} else {
					callback(100);
				}
			}
		};
		xhr.send(null);
	};

	var on_start = function(UP){
		UP.onStart();
	};

	/**
	 * abort uploading
	 */
	var on_abort = function(UP){
		var PRI = PRIVATES[UP.id];
		PRI.xhr.abort();
		PRI.abort = true;
		update_dom_state(UP, COM_CLASS_UPLOAD_NORMAL);
		UP.onAbort();
	};

	var on_delete = function(UP){
		UP.onDelete()
	};

	/**
	 * update dom state
	 * @param UP
	 * @param to
	 */
	var update_dom_state = function(UP, to){
		to = to || COM_CLASS_UPLOAD_NORMAL;
		var PRI = PRIVATES[UP.id];
		PRI.container.attr('class', COM_CLASS_CONTAINER + ' '+to);
		PRI.progress.val(0);
		PRI.progress_text.html('0%');

		//required
		PRI.trigger_file.attr('required', false);
		PRI.file.attr('required', false);
		switch(to){
			case COM_CLASS_UPLOAD_NORMAL:
				PRI.file.attr('required', PRI.required);
				break;

			case COM_CLASS_UPLOAD_FAIL:
			case COM_CLASS_UPLOADING:
				PRI.trigger_file.attr('required', PRI.required);
				break;
		}
	};

	/**
	 * on upload response
	 * @param UP
	 * @param rsp_str
	 */
	var on_response = function(UP, rsp_str){
		UP.onResponse(rsp_str);
		var rsp = {};
		try {
			rsp = JSON.parse(rsp_str);
		} catch(ex){
			on_error(UP, ex.message);
		}
		if(rsp.code == '0'){
			on_success(UP, rsp.message, rsp.data);
			console.debug('response string:', rsp_str, 'response json:', rsp);
		} else {
			on_error(UP, rsp.message || lang('后台有点忙，请稍后重试'));
			console.log('response string:', rsp_str, 'response json:', rsp);
		}
	};

	/**
	 * 正在上传
	 * @param UP
	 * @param percent
	 */
	var on_uploading = function(UP, percent){
		update_dom_state(UP, COM_CLASS_UPLOADING);
		PRIVATES[UP.id].progress.val(percent);
		PRIVATES[UP.id].progress_text.html(percent+'%');
		UP.onUploading(percent);
	};

	var get_ext = function(url){
		return url.split('.').pop().toLowerCase();
	};

	/**
	 * 上传成功
	 * @param UP
	 * @param message
	 * @param data
	 */
	var on_success = function(UP, message, data){
		update_dom_state(UP, COM_CLASS_UPLOAD_SUCCESS);
		var html = '<a class="com-uploader-type-'+UP.config.TYPE+'" href="'+data.src+'" title="'+lang('查看')+'" target="_blank">';

		//img
		if(UP.config.TYPE == Uploader.TYPE_IMAGE){
			html += '<img src="'+data.thumb+'" onload="window.__img_adjust__ && __img_adjust__(this)"/>'
		} else {
			var ext = get_ext(data.src);
			html += '<span class="com-uploader-file-icon com-uploader-file-icon-'+ext+'"></span>';
		}
		html += '</a>';
		if(data.name){
			html += '<span class="com-uploader-name">'+Util.htmlEscape(data.name)+'</span>';
		}
		PRIVATES[UP.id].container.find('.'+COM_CLASS_CONTENT).html(html);
		PRIVATES[UP.id].input.val(data.value).trigger('change');
		PRIVATES[UP.id].input.data('src', data.src);
		PRIVATES[UP.id].input.data('thumb', data.thumb);
		UP.onSuccess(message, data);
	};

	/**
	 * 上传错误
	 * @param UP
	 * @param message
	 */
	var on_error = function(UP, message){
		update_dom_state(UP, COM_CLASS_UPLOAD_FAIL);
		var m = message || lang('上传失败，请稍候重试');
		PRIVATES[UP.id].container.find('.'+COM_CLASS_CONTENT).html('<span title="'+m+'">'+m+'</span>');
		UP.onError(message);
	};

	/**
	 * Uploader
	 * @param input
	 * @param config
	 */
	var Uploader = function(input, config){
		input = $(input);
		if(input.attr('disabled') || input.attr('readonly')){
			console.info('input readonly', input[0]);
			return;
		}

		var required = input.attr('required');
		input.attr('required', '');

		this.id = guid();

		var PRI = {};
		PRIVATES[this.id] = PRI;

		this.config = $.extend({
			TYPE: Uploader.TYPE_IMAGE, //文件类型配置
			UPLOAD_URL: '',
			PROGRESS_URL: ''
		}, config);

		if(!this.config.UPLOAD_URL){
			throw "NO UPLOAD_URL PARAMETER FOUND";
		}
		this.config.UPLOAD_URL = Net.mergeCgiUri(this.config.UPLOAD_URL, {type:this.config.TYPE});

		input.hide();
		PRI.input = input;
		PRI.required = required;
		PRI.container = $(TPL).insertAfter(input);
		PRI.progress = PRI.container.find('progress');
		PRI.progress_text = PRI.progress.next();
		PRI.content = PRI.container.find('.'+COM_CLASS_CONTENT);
		PRI.file = PRI.container.find('input[type=file]');
		PRI.container.find('.com-uploader-file span').html(lang('选择'+(this.config.TYPE == Uploader.TYPE_IMAGE ? '图片' : '文件')));
		PRI.trigger_file = $('<input type="file"/>').appendTo(PRI.container.find('.com-uploader-handle'));

		var _this = this;
		PRI.xhr = Net.postFormData({
			url: _this.config.UPLOAD_URL,
			onLoad: function(){
				if(PRI.xhr.status === 200){
					on_response(_this, PRI.xhr.responseText);
				} else {
					on_error(_this, lang('后台有点忙，请稍后重试'));
				}
			},
			onProgress: function(percent){
				on_uploading(_this, percent);
			},
			onError: function(e){
				console.error(e);
			}
		});

		PRI.container.find('.com-uploader-delete').click(function(){
			PRI.input.val('').trigger('change');
			update_dom_state(_this, COM_CLASS_UPLOAD_NORMAL);
			on_delete(_this);
		});

		PRI.container.find('.com-uploader-reload').click(function(){
			PRI.file.trigger('click');
		});

		PRI.container.find('.com-uploader-cancel').click(function(){
			update_dom_state(_this, COM_CLASS_UPLOAD_NORMAL);
			on_abort(_this);
		});

		PRI.file.on('change', function(){
			if(!this.files[0]){
				return;
			}
			//add file
			var formData = new FormData();
			var i;
			if(this.files){
				for(i=0; i<this.files.length; i++){
					formData.append($(this).attr('name'), this.files[i]);
				}
			}
			$(this).val('');
			_this.send(formData);
		});

		//初始化
		if(PRI.input.val()){
			var thumb = PRI.input.data('thumb') || PRI.input.val();
			var src = PRI.input.data('src') || PRI.input.val();
			var val = PRI.input.val();
			on_success(_this, null, {src:src, thumb:thumb, value:val, more:[]});
		} else {
			update_dom_state(_this, COM_CLASS_UPLOAD_NORMAL);
		}
	};

	Uploader.prototype.send = function(formData){
		var PRI = PRIVATES[this.id];

		//add param
		var param = PRI.input.data('param');
		if(param){
			var data = Net.parseParam(param);
			for(var i in data){
				formData.append(i, data[i]);
			}
		}

		PRI.xhr.open('POST', this.config.UPLOAD_URL, true);
		PRI.xhr.send(formData);
		PRI.abort = false;
		var _this = this;

		on_start(_this);
		update_dom_state(_this, COM_CLASS_UPLOADING);
		percent_check(_this, function(p){
			if(p != 100){
				return on_uploading(_this, p);
			}
		});
	};

	Uploader.prototype.getVar = function(key){
		return PRIVATES[this.id][key];
	};

	Uploader.prototype.selectFile = function(){
		PRIVATES[this.id].file.trigger('click');
	};

	Uploader.prototype.onSuccess = function(message, data){};
	Uploader.prototype.onAbort = function(){};
	Uploader.prototype.onResponse = function(rsp_str){};
	Uploader.prototype.onUploading = function(percent){};
	Uploader.prototype.onDelete = function(message){};
	Uploader.prototype.onError = function(message){};
	Uploader.prototype.onStart = function(message){};

	Uploader.TYPE_IMAGE = 'image';
	Uploader.TYPE_FILE = 'file';

	Uploader.nodeInit = function($node, param){
		var type = param.type;
		new Uploader($node, {
			TYPE: type || Uploader.TYPE_IMAGE,
			UPLOAD_URL: window.UPLOAD_URL,
			PROGRESS_URL: window.UPLOAD_PROGRESS_URL
		});
	};

	return Uploader;
});
//../src/component/util.js
/**
 * Created by sasumi on 2014/12/2.
 */
define('ywj/util', function(require){
	var $ = require('jquery');
	var lang = require('lang/$G_LANGUAGE');

	/**
	 * check item is in array
	 * @param item
	 * @param {Array} arr
	 * @return {boolean}
	 */
	var inArray = function(item, arr){
		for(var i = arr.length - 1; i >= 0; i--){
			if(arr[i] == item){
				return true;
			}
		}
		return false;
	};

	/**
	 * 字符切割
	 * @param string 字符串
	 * @param {string} delimiters 分隔符（支持多个）
	 * @param {boolean} clear_empty 是否清除掉空白字符串（默认清除）
	 * @return {Array}
	 */
	var explode = function(string, delimiters, clear_empty){
		if(!string){
			return [];
		}
		clear_empty = clear_empty === undefined ? true : !!clear_empty;
		var result = [];
		var de1 = delimiters[0];
		if(delimiters.length > 1){
			for(var i=1; i<delimiters.length; i++){
				string = string.replace(new RegExp(pregQuote(delimiters[i]), 'g'), de1);
			}
		}
		var item = string.split(de1);
		for(var i in item){
			if(clear_empty){
				var val = $.trim(item[i]);
				if(val.length){
					result.push(val);
				}
			} else {
				result.push(item[i]);
			}
		}
		return result;
	};

	var htmlEscape = function(str){
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	};

	var htmlEscapeObject = function(obj){
		if(isString(obj)){
			return htmlEscape(obj);
		} else if(isScalar(obj)){
			return obj;
		} else {
			for(var i in obj){
				obj[i] = htmlEscapeObject(obj[i]);
			}
			return obj;
		}
	};

	var selectorEscape = function(str){
		return (window.CSS && CSS.escape) ? CSS.escape(str) : str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");
	};

	var htmlUnescape = function(str){
		return String(str)
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&amp;/g, '&');
	};

	var pregQuote = function(str){
		return (str + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
	};

	/**
	 * check an object is an empty
	 * @param  obj
	 * @return {Boolean}
	 */
	var isEmptyObject = function(obj){
		if(typeof(obj) == 'object'){
			for(var i in obj){
				if(i !== undefined){
					return false;
				}
			}
		}
		return true;
	};

	/**
	 * open link without referer
	 * @param link
	 * @returns {boolean}
	 */
	var openLinkWithoutReferer = function(link){
		var instance = window.open("about:blank");
		instance.document.write("<meta http-equiv=\"refresh\" content=\"0;url="+link+"\">");
		instance.document.close();
		return false;
	};

	/**
	 * check object is plain object
	 * @param  obj
	 * @return {Boolean}
	 */
	var isPlainObject = function(obj){
		return obj && toString.call(obj) === "[object Object]" && !obj["nodeType"] && !obj["setInterval"];
	};

	var isScalar = function(value){
		var type = getType(value);
		return type === 'number' || type === 'boolean' || type === 'string' || type === 'null' || type === 'undefined';
	};

	/**
	 * check number is integer
	 * @param value
	 * @returns {boolean}
	 */
	var isInt = function(value){
		return !isNaN(value) &&
			parseInt(Number(value)) === value && !isNaN(parseInt(value, 10));
	};

	/**
	 * 判断一个对象是否为一个DOM 或者 BOM
	 * @paramvalue
	 * @return {Boolean}
	 **/
	var isBomOrDom = function(value){
		if(this.isScalar(value)){
			return false;
		}
		if($.browser.ie){
			//Node, Event, Window
			return value['nodeType'] || value['srcElement'] || (value['top'] && value['top'] == Y.W.top);
		}else{
			return getType(value) !== 'object' && getType(value) !== 'function';
		}
	};

	/**
	 * check object is boolean
	 * @param  obj
	 * @return {Boolean}
	 */
	var isBoolean = function(obj){
		return getType(obj) === 'boolean';
	};

	/**
	 * check object is a string
	 * @param  obj
	 * @return {Boolean}
	 */
	var isString = function(obj){
		return getType(obj) === 'string';
	};

	/**
	 * check object is an array
	 * @param  obj
	 * @return {Boolean}
	 */
	var isArray = function(obj){
		return getType(obj) === 'array';
	};

	/**
	 * array_column
	 * @param arr
	 * @param col_name
	 * @returns {Array}
	 */
	var arrayColumn = function(arr, col_name){
		var data = [];
		for(var i in arr){
			data.push(arr[i][col_name]);
		}
		return data;
	};

	var arrayIndex = function(arr, val){
		for(var i in arr){
			if(arr[i] == val){
				return i;
			}
		}
		return null;
	};

	/**
	 * array group
	 * @param arr
	 * @param by_key
	 * @param limit limit one child
	 * @returns {*}
	 */
	var arrayGroup = function(arr, by_key, limit) {
		if(!arr || !arr.length) {
			return arr;
		}
		var tmp_rst = {};
		$.each(arr, function(_, item){
			var k = item[by_key];
			if(!tmp_rst[k]){
				tmp_rst[k] = [];
			}
			tmp_rst[k].push(item);
		});
		if(!limit){
			return tmp_rst;
		}
		var rst = [];
		for(var i in tmp_rst){
			rst[i] = tmp_rst[i][0];
		}
		return rst;
	};

	/**
	 * 修正checkbox required行为属性
	 * @param scope
	 */
	var fix_checkbox_required = function(scope){
		var $scope = $(scope || 'body');
		var FLAG = 'fix-checkbox-required-bind';
		$(':checkbox[required]',$scope).each(function(){
			var $chk = $(this);
			if(!$chk.data(FLAG)){
				$chk.data(FLAG, 1);
				$chk.change(function(){
					var $all_chks = $scope.find(':checkbox[name='+selectorEscape($chk.attr('name'))+']');
					if($all_chks.is(':checked')){
						$all_chks.removeAttr('required');
					} else {
						$all_chks.attr('required', 'required');
					}
				}).triggerHandler('change');
			}
		});
	};

	/**
	 * 修正浏览器 datalist触发时，未能显示全部option list
	 * @todo 在触发时，会出现不能用删除（退格）键删除原来的数值
	 * @param $inputs
	 */
	var fix_datalist_option = function($inputs){
		var DATA_KEY = 'data-initialize-value';
		$inputs.each(function(){
			var $inp = $(this);
			var already_has_placeholder = $inp.attr('placeholder');
			$inp.mousedown(function(){
				if(!already_has_placeholder){
					$inp.attr('placeholder', this.value);
				}
				if(this.value){
					$inp.data(DATA_KEY, this.value);
					$inp.val('');
				}
			}).on('blur', function(){
				if($inp.val() === '' && $inp.data(DATA_KEY) !== null){
					$inp.val($inp.data(DATA_KEY));
				}
				if(!already_has_placeholder){
					$inp.attr('placeholder', '');
				}
			})
		});
	};

	/**
	 * check object is a function
	 * @param  obj
	 * @return {Boolean}
	 */
	var isFunction = function(obj){
		return getType(obj) === 'function';
	};

	/**
	 * get type
	 * @param obj
	 * @return {string}
	 */
	var getType = function(obj){
		if(isElement(obj)){
			return 'element';
		}
		return obj === null ? 'null' : (obj === undefined ? 'undefined' : Object.prototype.toString.call(obj).slice(8, -1).toLowerCase());
	};

	/**
	 * isElement
	 * @param obj
	 * @returns {boolean}
	 */
	var isElement = function(obj){
		try{
			//Using W3 DOM2 (works for FF, Opera and Chrome)
			return obj instanceof HTMLElement;
		}
		catch(e){
			//Browsers not supporting W3 DOM2 don't have HTMLElement and
			//an exception is thrown and we end up here. Testing some
			//properties that all elements have. (works on IE7)
			return (typeof obj === "object") &&
				(obj.nodeType === 1) && (typeof obj.style === "object") &&
				(typeof obj.ownerDocument === "object");
		}
	};

	/**
	 * get parent node by selector condition
	 * @param node
	 * @param con
	 * @returns {*}
	 */
	var findParent = function(node, con){
		var ps = $(node).parentsUntil(con);
		var tp = $(ps[ps.size() - 1]);
		return tp.parent();
	};

	/**
	 * trans collection to array
	 * @param {Object} col dom collection
	 */
	var toArray = function(col){
		if(col.item){
			var l = col.length, arr = new Array(l);
			while(l--) arr[l] = col[l];
			return arr;
		}else{
			var arr = [];
			for(var i = 0; i < col.length; i++){
				arr[i] = col[i];
			}
			return arr;
		}
	};

	/**
	 * clone object without case-sensitive checking
	 * @param target_data
	 * @param source_data
	 */
	var cloneConfigCaseInsensitive = function(source_data, target_data){
		if(isElement(target_data)){
			console.warn('element clone operation');
			return target_data;
		}
		if(getType(source_data) != 'object' || getType(target_data) != 'object'){
			return target_data;
		}

		var tmp = source_data;
		for(var tk in target_data){
			var found = false;
			for(var sk in source_data){
				if(getType(tk) == 'string' && getType(sk) == 'string' && sk.toLowerCase() == tk.toLowerCase()){
					tmp[sk] = cloneConfigCaseInsensitive(source_data[sk], target_data[tk]);
					found = true;
				}
			}
			if(!found){
				tmp[tk] = target_data[tk];
			}
		}
		return tmp;
	};

	/**
	 * access object property by statement
	 * @param statement
	 * @param obj
	 * @returns {*}
	 */
	var accessObject = function(statement, obj){
		obj = obj || {};
		var tmp;
		try{
			eval('tmp = obj.' + statement);
		}catch(ex){
		}
		return tmp;
	};

	/**
	 * 获取窗口的相关测量信息
	 * @returns {{}}
	 */
	var getRegion = function(win){
		var info = {};
		win = win || window;
		var doc = win.document;
		info.screenLeft = win.screenLeft ? win.screenLeft : win.screenX;
		info.screenTop = win.screenTop ? win.screenTop : win.screenY;

		//no ie
		if(win.innerWidth){
			info.visibleWidth = win.innerWidth;
			info.visibleHeight = win.innerHeight;
			info.horizenScroll = win.pageXOffset;
			info.verticalScroll = win.pageYOffset;
		}else{
			//IE + DOCTYPE defined || IE4, IE5, IE6+no DOCTYPE
			var tmp = (doc.documentElement && doc.documentElement.clientWidth) ?
				doc.documentElement : doc.body;
			info.visibleWidth = tmp.clientWidth;
			info.visibleHeight = tmp.clientHeight;
			info.horizenScroll = tmp.scrollLeft;
			info.verticalScroll = tmp.scrollTop;
		}

		var tag = (doc.documentElement && doc.documentElement.scrollWidth) ?
			doc.documentElement : doc.body;
		info.documentWidth = Math.max(tag.scrollWidth, info.visibleWidth);
		info.documentHeight = Math.max(tag.scrollHeight, info.visibleHeight);
		return info;
	};

	/**
	 * 获取当前窗口节点在顶部窗口位置
	 * @param $node
	 * @returns {{left: number, top: number}}
	 */
	var getNodeRegionInTop = function($node){
		var win = window;
		var rect = {left:0, top:0};
		var body = document.body;
		try {
			var r = $node[0].getBoundingClientRect();
			rect.left += r.left + ($(body).scrollLeft() || $(body.parentNode).scrollLeft());
			rect.top += r.top + ($(body).scrollTop() || $(body.parentNode).scrollTop());

			while(win.frameElement){
				var fr = window.frameElement.getBoundingClientRect();
				rect.left += fr.left;
				rect.top += fr.top;
				win = win.parent;
				var sl = $(win.document.body).scrollLeft() || $(win.document.body.parentNode).scrollLeft();
				var st = $(win.document.body).scrollTop() || $(win.document.body.parentNode).scrollTop();

				rect.left += sl;
				rect.top += st;
			}
		} catch(ex){
			console.error(ex);
		}
		return rect;
	};

	var scrollTo = function($el, $container){
		$container.animate({scrollTop: $container.scrollTop() + $el.offset().top - $container.offset().top}, {
			duration: 'fast',
			easing: 'swing'
		});
	};

	/**
	 * 中英文字符串截取（中文按照2个字符长度计算）
	 * @param str
	 * @param len
	 * @param eclipse_text
	 * @returns {*}
	 */
	var cutString = function(str, len, eclipse_text){
		if(eclipse_text === undefined){
			eclipse_text = '...';
		}
		var r = /[^\x00-\xff]/g;
		if(str.replace(r, "mm").length <= len){
			return str;
		}
		var m = Math.floor(len / 2);
		for(var i = m; i < str.length; i++){
			if(str.substr(0, i).replace(r, "mm").length >= len){
				return str.substr(0, i) + eclipse_text;
			}
		}
		return str;
	};

	var copy = function(text, compatible){
		var $t = $('<textarea readonly="readonly">').appendTo('body');
		$t[0].style.cssText = 'position:absolute; left:-9999px;';
		var y = window.pageYOffset || document.documentElement.scrollTop;
		$t.focus(function(){
			window.scrollTo(0, y);
		});
		$t.val(text).select();
		var succeeded = false;
		try{
			succeeded = document.execCommand('copy');
		}catch(err){
			console.error(err);
		}
		$t.remove();
		if(!succeeded && compatible){
			window.prompt(lang('请按键: Ctrl+C, Enter复制内容'), text);
			return true;
		}
		console.info('copy ' + (succeeded ? 'succeeded' : 'fail'), text);
		return succeeded;
	};

	function copyFormatted(html){
		// Create container for the HTML
		// [1]
		var container = document.createElement('div');
		container.innerHTML = html;

		// Hide element
		// [2]
		container.style.position = 'fixed';
		container.style.pointerEvents = 'none';
		container.style.opacity = 0;

		// Detect all style sheets of the page
		var activeSheets = Array.prototype.slice.call(document.styleSheets)
			.filter(function(sheet){
				return !sheet.disabled
			});

		// Mount the iframe to the DOM to make `contentWindow` available
		// [3]
		document.body.appendChild(container);

		// Copy to clipboard
		// [4]
		window.getSelection().removeAllRanges();

		var range = document.createRange();
		range.selectNode(container);
		window.getSelection().addRange(range);

		// [5.1]
		document.execCommand('copy');

		// [5.2]
		for(var i = 0; i < activeSheets.length; i++) activeSheets[i].disabled = true

		// [5.3]
		document.execCommand('copy');

		// [5.4]
		for(var i = 0; i < activeSheets.length; i++) activeSheets[i].disabled = false

		// Remove the iframe
		// [6]
		document.body.removeChild(container)
	}

	var round = function(num, digits){
		digits = digits === undefined ? 2 : digits;
		var multiple = Math.pow(10, digits);
		return Math.round(num * multiple) / multiple;
	};

	/**
	 * 获取指定容器下的表单元素的值
	 * @param formContainer
	 * @return string query string
	 */
	var getFormData = function(formContainer){
		var data = [];
		$(':input', formContainer).each(function(){
			if(!this.name || this.value === undefined){
				return;
			}
			if((this.type == 'radio' || this.type == 'checkbox')){
				if(this.checked){
					data.push(encodeURIComponent(this.name) + '=' + encodeURIComponent(this.value));
				}
			}else{
				data.push(encodeURIComponent(this.name) + '=' + encodeURIComponent(this.value));
			}
		});
		return data.join('&');
	};

	/**
	 * 获取u8字符串长度(一个中文字按照3个字数计算)
	 * @param str
	 * @returns {number}
	 */
	var getU8StrLen = function(str){
		var realLength = 0;
		var len = str.length;
		var charCode = -1;
		for(var i = 0; i < len; i++){
			charCode = str.charCodeAt(i);
			if(charCode >= 0 && charCode <= 128){
				realLength += 1;
			}else{
				realLength += 3;
			}
		}
		return realLength;
	};

	/**
	 * @hack
	 */
	var preventClickDelegate = function(){
		var $m = $('<div style="position:absolute; width:100%; height:100%; z-index:65500; top:0; left:0"></div>').appendTo($('body'));
		$m.mouseup(function(){
			setTimeout(function(){
				$m.remove();
			}, 0);
		});
		setTimeout(function(){
			$m.remove();
		}, 5000);
	};

	var between = function(val, min, max){
		return val >= min && val <= max;
	};

	/**
	 * 检测矩形是否在指定布局内部
	 * @param rect
	 * @param layout
	 * @returns {*}
	 */
	var rectInLayout = function(rect, layout){
		return between(rect.top, layout.top, layout.top + layout.height) && between(rect.left, layout.left, layout.left + layout.width) //左上角
			&& between(rect.top+rect.height, layout.top, layout.top + layout.height) && between(rect.left+rect.width, layout.left, layout.left + layout.width); //右下角
	};

	/**
	 * 矩形置中
	 * @param rect
	 * @param layout
	 * @returns {{left: number, top: number}}
	 */
	var rectCenter = function(rect, layout){
		layout.top = layout.top || 0;
		layout.left = layout.left || 0;
		return {
			left: layout.left + layout.width / 2 - rect.width / 2,
			top: layout.top + layout.height / 2 - rect.height / 2
		}
	};

	/**
	 * 矩形相交（包括边重叠情况）
	 * @param rect1
	 * @param rect2
	 * @returns {boolean}
	 */
	var rectAssoc = function(rect1, rect2){
		if(rect1.left <= rect2.left){
			return (rect1.left + rect1.width) >= rect2.left && (
				between(rect2.top, rect1.top, rect1.top+rect1.height) ||
				between(rect2.top+rect2.height, rect1.top, rect1.top+rect1.height) ||
				rect2.top >= rect1.top && rect2.height >= rect1.height
			);
		} else {
			return (rect2.left + rect2.width) >= rect1.left && (
				between(rect1.top, rect2.top, rect2.top+rect2.height) ||
				between(rect1.top+rect1.height, rect2.top, rect2.top+rect2.height) ||
				rect1.top >= rect2.top && rect1.height >= rect2.height
			);
		}
	};

	/**
	 * 节点不可选择
	 * @param node
	 */
	var setNodeSelectDisabled = function(node){
		if($.browser.mozilla){//Firefox
			$(node).css('MozUserSelect', 'none');
		}else if($.browser.msie){//IE
			$(node).bind('selectstart', function(){
				return false;
			});
		}else{//Opera, etc.
			$(node).mousedown(function(){
				return false;
			});
		}
	};

	var resetNode = function($node){
		var html = $node[0].outerHTML;
		if($node.prev().size()){
			var $prev = $node.prev();
			$node.remove();
			$(html).insertAfter($prev);
		} else if($node.next().size()){
			var $next = $node.next();
			$node.remove();
			$(html).insertBefore($next);
		} else {
			var $parent = $($node[0].parentNode);
			$node.remove();
			$parent.html(html);
		}
	};

	/**
	 * 移动终端侦测
	 * @type {boolean}
	 */
	var isMobile = false;
	if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
		|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))){
		isMobile = true;
	}

	var resolve_ext = function(src){
		var f = /\/([^/]+)$/ig.exec(src);
		if(f){
			var t = /(\.[\w]+)/.exec(f[1]);
			return t ? t[1] : '';
		}
		return null;
	};

	var resolve_file_name = function(src){
		var f = /\/([^/]+)$/ig.exec(src);
		if(f){
			var t = /([\w]+)/.exec(f[1]);
			if(t){
				return t[1];
			}
		}
		return null;
	};

	/**
	 * generate GUID
	 * @return string
	 */
	var __guid = 0;
	var guid = function(){
		return '_ywj_guid_' + (++__guid);
	};

	return {
		isMobile: isMobile,
		KEYS: {
			ENTER: 13,
			DOWN: 40,
			UP: 38,
			LEFT: 37,
			RIGHT: 39,
			ESC: 27,
			TAB: 9,
			BACKSPACE: 8,
			COMMA: 188,
			ESCAPE: 27,
			HOME: 36,
			PAGE_DOWN: 34,
			PAGE_UP: 33,
			PERIOD: 190
		},
		getRegion: getRegion,
		getNodeRegionInTop: getNodeRegionInTop,
		toArray: toArray,
		round: round,
		between: between,
		inArray: inArray,
		isArray: isArray,
		arrayColumn: arrayColumn,
		arrayIndex: arrayIndex,
		arrayGroup: arrayGroup,
		isElement: isElement,
		getType: getType,
		cloneConfigCaseInsensitive: cloneConfigCaseInsensitive,
		htmlEscape: htmlEscape,
		htmlEscapeObject: htmlEscapeObject,
		selectorEscape: selectorEscape,
		scrollTo: scrollTo,
		htmlUnescape: htmlUnescape,
		rectInLayout: rectInLayout,
		rectAssoc: rectAssoc,
		rectCenter: rectCenter,
		pregQuote: pregQuote,
		resetNode: resetNode,
		cutString: cutString,
		explode: explode,
		fixCheckboxRequired: fix_checkbox_required,
		fixDatalistOption: fix_datalist_option,
		setNodeSelectDisabled: setNodeSelectDisabled,
		isEmptyObject: isEmptyObject,
		isPlainObject: isPlainObject,
		isFunction: isFunction,
		openLinkWithoutReferer: openLinkWithoutReferer,
		isInt: isInt,
		isScalar: isScalar,
		isBomOrDom: isBomOrDom,
		isBoolean: isBoolean,
		isString: isString,
		accessObject: accessObject,
		getU8StrLen: getU8StrLen,
		guid: guid,
		copy: copy,
		copyFormatted: copyFormatted,
		resolveExt: resolve_ext,
		resolveFileName: resolve_file_name,
		findParent: findParent,
		getFormData: getFormData,
		preventClickDelegate: preventClickDelegate
	};
});
//../src/component/validator.js
define('ywj/validator', function(require){
	var $ = require('jquery');
	var util = require('ywj/util');

	//使用到的正则表达式
	var REGEXP_COLLECTION = {
		REQUIRE: /^.+$/,									//必填
		CHINESE_ID: /^\d{14}(\d{1}|\d{4}|(\d{3}[xX]))$/,	//身份证
		PHONE: /^[0-9]{7,13}$/,								//手机+固话
		EMAIL: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/,		//email
		POSTCODE: /^[0-9]{6}$/,								//邮编
		AREACODE: /^0[1-2][0-9]$|^0[1-9][0-9]{2}$/,			//区号
		CT_PASSPORT: /^[0-9a-zA-Z]{5,40}$/,					//电信账号
		CT_MOBILE: /^(13|15|18)[0-9]{9}$/,					//中国电信号码
		QQ: /^\d{5,13}$/,
		TRIM: /^\s+|\s+$/g
	};

	var isEmptyObject = function(obj){
		for(var i in obj){
			return false;
		}
		return true;
	};

	/**
	 * 检测radio是否被选中
	 * @param element
	 * @returns {boolean}
	 */
	var checkRadioChecked = function(element){
		var elements = this.form[0].elements;
		var name = element.name;

		for(var i=0; i<elements.length; i++){
			if(elements[i].name == name && !!elements[i].checked){
				return true;
			}
		}
		return false;
	};

	/**
	 * 表单元素是否合适用于表单校验
	 * @param element
	 * @returns {boolean}
	 */
	var elementCheckAble = function(element){
		return element.tagName != 'FIELDSET' &&
		element.type != 'hidden' &&
		element.type != 'submit' &&
		element.type != 'button' &&
		element.type != 'reset' &&
		element.type != 'image';
	};

	/**
	 * 表单校验
	 * @param form
	 * @param rules
	 * @example
	 * /**
	 'name': {
				require: '请输入用户名称',
				max20: '最大长度为20个字符',
				min4: '最小长度为4个字符'
				},
	 'password': {
					require: '请输入用户密码',
					min6: '最小长度为6个字符',
					max32: '最大长度为32个字符'
				},
	 'date': {
					date: '请输入正确的日期格式'
				}
	 *
	 * @param config
	 * @constructor
	 */
	var Va = function(form, rules, config){
		this.form = $(form);
		this.rules = rules;
		this.config = $.extend({
			breakOnError: false,
			passClass: 'validate-pass',
			failClass: 'validate-fail',
			tipClass: 'validate-tip'
		}, config);
	};

	Va.prototype.attach = function(){
		var _this = this;
		this.form.on('submit', function(){
			var err = _this.checkAll();
			if(err){
				return false;
			}
		});
	};

	/**
	 * 检查单个表单元素
	 * @param element
	 * @param rules
	 */
	Va.prototype.checkItem = function(element, rules){
		if(!rules){
			return null;
		}

		var elements = this.form[0].elements;
		var errors = [];
		var uKey, len, ret;
		var breakOnError = this.config.breakOnError;

		if(element.tagName == 'SELECT' ||
			(element.tagName == 'INPUT' && (element.type == 'text' || element.type == 'password'))){
			var val = element.value.replace(REGEXP_COLLECTION.TRIM, '');
			for(var key in rules){
				uKey = key.toUpperCase();

				//函数模式
				if(typeof(rules[key]) == 'function'){
					ret = rules[key](val, element);
					if(ret){
						if(!breakOnError){
							return [ret];
						} else {
							errors.push(ret);
						}
					}
				}

				//正则表命中
				else if(REGEXP_COLLECTION[uKey]){
					if(!REGEXP_COLLECTION[uKey].test(val)){
						if(!breakOnError){
							return [rules[key]];
						} else {
							errors.push(rules[key]);
						}
					}
				}

				//最大长度
				else if(uKey.indexOf('MAX') === 0){
					len = parseInt(uKey.substr(3), 10);
					if(len > 0 && len < val.length){
						if(!breakOnError){
							return [rules[key]];
						} else {
							errors.push(rules[key]);
						}
					}
				}

				//最小长度
				else if(uKey.indexOf('MIN') === 0){
					len = parseInt(uKey.substr(3), 10);
					if(len > 0 && len > val.length){
						if(!breakOnError){
							return [rules[key]];
						} else {
							errors.push(rules[key]);
						}
					}
				}

				//自定义正则表达式
				else if(uKey.indexOf('/') === 0){
					var reg = new RegExp(key);
					if(!reg.test(val)){
						if(!breakOnError){
							return [rules[key]];
						} else {
							errors.push(rules[key]);
						}
					}
				}

			}
		}

		//checkbox 模式仅有require模式
		else if(element.type == 'checkbox'){
			for(key in rules){
				uKey = key.toUpperCase();
				if(uKey == 'REQUIRE'){
					if(!element.checked){
						if(typeof(rules[key]) == 'function'){
							ret = rules[key](element.checked, element);
							return [ret];
						} else {
							return [rules[key]];
						}
					} else {
						return null;
					}
				}
			}
		}

		//radio 模式仅有require模式
		else if(element.type == 'radio'){
			for(var key in rules){
				uKey = key.toUpperCase();
				if(uKey == 'REQUIRE'){
					if(!checkRadioChecked.call(this, element)){
						return [rules[key]];
					} else {
						return null;
					}
				}
			}
		}
		return errors;
	};

	Va.prototype.onBeforeCheck = function(){

	};

	/**
	 * 检查所有表单元素
	 * @returns {{}}
	 */
	Va.prototype.checkAll = function(){
		this.onBeforeCheck();
		this.resetError();
		var errors = {};
		var error_flag = false;
		var _this = this;

		var elements = this.form[0].elements;
		$.each(elements, function(){
			if(elementCheckAble(this)){
				var name = this.name;

				//跳过已经检查的radio
				if(this.type == 'radio' && errors[this.name] || !_this.rules[name]){
					return;
				}

				var errs = _this.checkItem(this, _this.rules[name]);
				_this.onItemChecked(this, errs);
				if(!isEmptyObject(errs)){
					errors[name] = errs;
					error_flag = true;
					if(_this.config.breakOnError){
						return false;
					}
				}
			}
		});

		return error_flag ? errors : null;
	};

	/**
	 * 表单检查完
	 * @param element
	 * @param errors
	 * @returns {*}
	 */
	Va.prototype.onItemChecked = function(element, errors){
		if(!isEmptyObject(errors)){
			return this.onItemCheckFail(element, errors);
		} else {
			return this.onItemCheckPass(element);
		}
	};

	/**
	 * 设置元素错误信息
	 * @param element
	 * @param errors
	 */
	Va.prototype.setItemMessage = function(element, errors){
		var pass = isEmptyObject(errors);

		$(element)[pass ? 'addClass' : 'removeClass'](this.config.passClass)[pass ? 'removeClass' : 'addClass'](this.config.failClass);

		var pn = $(element.parentNode);
		var tip = $('span.'+this.config.tipClass, pn);
		if(!tip.size()){
			tip = $('<span class="'+this.config.tipClass+'"></span>').appendTo(pn);
		}

		$(tip)[pass ? 'addClass' : 'removeClass'](this.config.passClass)[pass ? 'removeClass' : 'addClass'](this.config.failClass).html(errors[0]);
	};

	/**
	 * on item check pass event
	 * @param element
	 */
	Va.prototype.onItemCheckPass = function(element){
		this.setItemMessage(element, []);
	};

	/**
	 * on item check fail event
	 * @param element
	 * @param errors
	 */
	Va.prototype.onItemCheckFail = function(element, errors){
		this.setItemMessage(element, errors);
	};

	/**
	 * 重置所有错误信息
	 * @param element
	 */
	Va.prototype.resetError = function(element){
		$('span.'+this.config.tipClass, this.form).removeClass(this.config.passClass).removeClass(this.config.failClass).html('');
	};

	Va.REGS = REGEXP_COLLECTION;
	return Va;
});
//../src/component/ViewLink.js
define('ywj/ViewLink', function(require){
	var $ = require('jquery');
	var Tip = require('ywj/tip');
	var Util = require('ywj/util');

	$('<style>.open-link:before {content:"\\f08e"; font-size:14px; margin-left:0.2em; cursor:pointer; font-family:FontAwesome, serif; color:gray;}</style>').appendTo('head');

	var is_link = function(str){
		str = $.trim(str);
		return str && (str.indexOf('//') === 0 || /^\w+:\/\//.test(str));
	};

	var input_able = function($node){
		return !$node.attr('disabled') && !$node.attr('disabled') && $node.is(':input');
	};

	return {
		nodeInit: function($node, param){
			if($node[0].tagName === 'A'){
				$node.click(function(){
					var url = $(this).attr('href');
					if(is_link(url)){
						Util.openLinkWithoutReferer(url);
						return false;
					}
				});
				return;
			}

			var val = $node.val() || $node.text();
			if(val || input_able($node)){
				var $view_btn = $node.next('.open-link');
				if(!$view_btn.size()){
					$view_btn = $('<span class="open-link" title="查看链接"></span>').insertAfter($node);
					$view_btn.click(function(){
						var url = $.trim($node.val() || $node.text());
						if(is_link(url)){
							Util.openLinkWithoutReferer(url);
							return false;
						}
						if(input_able($node)){
							if(!url){
								$node.focus();
								Tip.show('请输入URL', $node, {timeout: 1500});
								return false;
							}
							if(!is_link(url)){
								$node.focus();
								Tip.show('请输入正确格式的URL', $node, {timeout: 1500});
								return false;
							}
						}
					})
				}
			}
		}
	}
});
