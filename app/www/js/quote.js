/**
 * Created by sasumi on 2015/3/23.
 */
define('www/quote', function(require){
	var ui = require('jquery/ui');
	var $ = require('jquery');
	var Pop = require('ywj/popup');
	var net = require('ywj/net');
	var util = require('ywj/util');
	var Msg = require('ywj/msg');
	var UNIT_PIECE = 24;

	//set global function
	window.guid = util.guid;
	window.tmpl = require('ywj/tmpl');

	var TYPE_ELEVATOR = 0;
	var $QUOTE = $('.quote');
	var $LAYOUT_ID = $('[name=layout_id]');
	var PAGE_READONLY = window['PAGE_READONLY'];

	var MATERIAL_MAP = window['MATERIAL_MAP'];
	var SKU_MAP_SUMMARY = window['SKU_MAP_SUMMARY'];
	var LADDER_PRICE_TYPE_NORMAL = window['LADDER_PRICE_TYPE_NORMAL'];
	var LADDER_PRICE_TYPE_EXT = window['LADDER_PRICE_TYPE_EXT'];

	if(PAGE_READONLY){
		$('input[type=text]', $QUOTE).attr('disabled', 'disabled');
		$('input[type=number]', $QUOTE).attr('disabled', 'disabled');
		$('select', $QUOTE).attr('disabled', 'disabled');
	}

	window.__fn__ = function(n, f){
		if(f === undefined){
			f = 2;
		}
		if(n){
			n = parseFloat(n);
			n = Math.round(n*Math.pow(10,f))/Math.pow(10,f);
		} else {
			n = 0;
		}
		return parseFloat(n);
	};

	window.__tooltip_description__ = function (description){
		if (description) {
			if (description.indexOf('\n') != -1) {
				description = description.replace("/\\n/", "<br/>");
			}
			var is_feature = description.indexOf('㊣') >= 0;
			if (is_feature) {
				return '<span class="feature-ico" title="' + description + '" rel="tooltip">特色</span>';
			}else{
				return '<span class="quote-help" title="' + description + '" rel="tooltip">?</span>';
			}
		}
	};

	var show_confirm = function(str, onConfirm, onCancel){
		Pop.showConfirm('确认', '<span style="font-size:14px; padding-bottom:20px; display:block;">'+str+'</span>', onConfirm, onCancel);
	};

	var add_slashes = function(str){
		var entityMap = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': '&quot;',
			"'": '&#39;',
			"/": '&#x2F;'
		};
		return String(str).replace(/[&<>"'\/]/g, function (s) {
			return entityMap[s];
		});
	};

	/**
	 * json解析
	 * @param json_str
	 * @returns {*}
	 */
	var parser_json = function(json_str){
		var data;
		if(util.isString(json_str)){
			eval("data="+json_str+";");
		} else {
			data = json_str;
		}
		return data;
	};

	/**
	 * 获取当前节点所在报价项目类型
	 * @param node
	 * @returns string
	 */
	var get_tag = function(node){
		return $(node).closest('.quote-catalog').data('quote-tag');
	};

	/**
	 * 根据主材行获取工艺sku行
	 * @param $material_row
	 * @returns {*}
	 */
	var getCraftRowByMaterialRow = function($material_row){
		var cls = 'craft-sku-row';
		var $craft_row = $material_row;
		while($craft_row = $craft_row.prev()){
			if($craft_row.hasClass(cls)){
				break;
			}
		}
		return $craft_row.hasClass(cls) ? $craft_row : null;
	};

	/**
	 * 重建主材列表
	 */
	var rebuildMainMaterial = function(ev){
		var $sel = $(this),
			sel = this;
		var attach_uuid = $(sel.options[sel.selectedIndex]).data('attach-uuid');
		var $craft_row = $sel.closest('tr');

		//检测是否清空现有
		var has_mm = false;
		var $next = $craft_row;
		while($next = $next.next()){
			if($next.hasClass('main-material-sku-row')){
				if(!$next.hasClass('quote-main-material-empty')){
					has_mm = true;
					break;
				}
			} else {
				break;
			}
		}

		var cb = function(){
			//清空
			var del_list = [];
			$next = $craft_row;
			while($next = $next.next()){
				if($next.hasClass('main-material-sku-row')){
					del_list.push($next);
				} else {
					break;
				}
			}
			$.each(del_list, function(k, $node){$node.remove()});

			//无主材配置
			if(!MATERIAL_MAP[attach_uuid] || !MATERIAL_MAP[attach_uuid].length){
				return;
			}

			//已有主材列表
			for(var i=0; i<MATERIAL_MAP[attach_uuid].length; i++){
				var attach_info = MATERIAL_MAP[attach_uuid][i];
				insert_empty_main_material(attach_info, $craft_row);
			}
		};

		if(has_mm){
			var _last_selected_index = $sel.data('last-selected');
			show_confirm('更换规格将清空主材列表，是否继续？', cb, function(){
				sel.selectedIndex = _last_selected_index;
			});
			return false;
		} else {
			cb();
		}
	};

	/**
	 * 更新主材行数量+价格
	 */
	var main_material_update = function(){
		$('.main-material-sku-row', $QUOTE).each(function(){
			var $row = $(this);
			var $craft = getCraftRowByMaterialRow($row);

			var sku_count = $('*[data-mode=number]',$craft).val();
			var unit_count = $('input[rel=main_material_unit_cost]', $row).val();
			var unit = $('input[rel=main_material_unit]', $row).val();

			var count = sku_count * unit_count;
			if(unit == UNIT_PIECE){
				count = Math.ceil(count);
			}

			count = count.toFixed(1);
			var price_str = $('[rel=ladder_price_json]', $row).val();
			var price_info = getPriceByLadderPriceList(price_str, count);
			var count_info = getCountByLadderPriceList(price_str, count);
			if(price_info){
				$('*[data-mode=base-number]', $row).val(count_info[0]);
				$('*[data-mode=ext-number]', $row).val(count_info[1]);
				$('*[data-mode=ladder-base-price]', $row).html(price_info[0]);
				$('*[data-mode=ladder-ext-price]', $row).html(price_info[1]);
			} else {
				$('input[data-mode=number]', $row).val(count);
			}
		});
	};

	/**
	 * 替换提求描述
	 * @param desc
	 * @param $tr
	 */
	var replace_description = function(sku_id, $tr){
		if (SKU_MAP_SUMMARY[""+sku_id+""] && SKU_MAP_SUMMARY[""+sku_id+""]["description"]) {
			var desc = __tooltip_description__(SKU_MAP_SUMMARY[""+sku_id+""]["description"]);
			$tr.find("*[rel=tooltip]").replaceWith(desc);
		}

	};

	/**
	 * 更新价格计数
	 */
	var update_sum = function(){
		var main_material_sum = 0, //主材费用
			total_product_sum = 0, //全包商品价
			half_product_sum = 0;  //半包商品价

		//更新主材计算
		main_material_update();

		//更新单价
		$('.craft-sku-row *[data-mode=price]', $QUOTE).each(function(){

			if(PAGE_READONLY){
				return;
			}
			var $row = $(this).closest('tr');
			var sku_sel = $('*[data-mode=sku-list]', $row);
			if(sku_sel.size()){

				var sel = sku_sel[0];
				var $op = $(sel.options[sel.selectedIndex]);
				var sku_id = $op.val();
				replace_description(sku_id, $op.parents(".craft-sku-row"));
				$(this).html(__fn__($op.data('price')));
			}
		});

		//更新SKU总计
		$('*[data-mode=sku-sum]', $QUOTE).each(function(){
			var $row = $(this).closest('tr');
			var price = parseFloat($('*[data-mode=price]', $row).html());
			var count = parseFloat($('input[data-mode=number]', $row).val());

			var sku_sum = __fn__(price*count);

			if($row.hasClass('quote-main-material-empty')){
				$(this).html(0);
				return;
			}

			if(!$row.hasClass('row-disabled')){
				//半包
				if(!$row.hasClass('main-material-sku-row')){
					half_product_sum += sku_sum;
				}
				//全包,有价格梯队主材独立计算
				else if($('*[data-mode=ladder-base-price]', $row).size()){
					var $ladder_base_price = $('*[data-mode=ladder-base-price]', $row);
					var base_price = parseFloat($ladder_base_price.html());
					var ext_price = parseFloat($('*[data-mode=ladder-ext-price]', $row).html());
					var base_num = parseFloat($('*[data-mode=base-number]', $row).val());
					var ext_num = parseFloat($('*[data-mode=ext-number]', $row).val());
					sku_sum = __fn__(base_price * base_num + ext_price*ext_num);
				}
				total_product_sum += sku_sum;
			}
			$(this).html(sku_sum);
		});

		//更新房间总计
		$('*[data-mode=room-sum]', $QUOTE).each(function(){
			var tbl = $(this).closest('table');
			var s = 0;
			$('*[data-mode=sku-sum]', tbl).each(function(){
				var $row = $(this).closest('tr');
				if(!$row.hasClass('row-disabled') && $row.css('display') != 'none'){
					s += parseFloat($(this).html());
				}
			});
			$(this).html(__fn__(s));
		});

		//更新分项总计
		$('*[data-mode=catalog-sum]', $QUOTE).each(function(){
			var cat = $(this).closest('.quote-catalog');
			var s = 0;
			$('*[data-mode=room-sum]', cat).each(function(){
				s += parseFloat($(this).html());
			});
			$(this).html(__fn__(s));
		});

		//工艺费用
		main_material_sum = total_product_sum - half_product_sum;

		//主材运输费
		var main_material_fee_sum = main_material_sum * MAIN_MATERIAL_TRANS_RATIO;

		var has_elevator = $('*[name=transport_type]', $QUOTE).val() == TYPE_ELEVATOR;
		var transport_floor = parseInt($('input[name=transport_floor]', $QUOTE).val(), 10) || 1;


		//材料搬运费
		var transport_sum = calTransportSum(half_product_sum, has_elevator, transport_floor);

		//垃圾清运费
		var rubbish_sum = calRubbishSum(half_product_sum, has_elevator, transport_floor);

		//运营管理费
		var operating_sum = half_product_sum * OPERATING_COST_RATIO;

		//税金
		var tax_sum = (total_product_sum + operating_sum + transport_sum + rubbish_sum + main_material_fee_sum) * TAX_RATIO / (1-TAX_RATIO);
		var total = total_product_sum + transport_sum + rubbish_sum + operating_sum + main_material_fee_sum + tax_sum;

		//材料搬运费
		$('#transport_sum', $QUOTE).html(__fn__(transport_sum));

		//垃圾清运费
		$('#rubbish_sum', $QUOTE).html(__fn__(rubbish_sum));

		//主材配送费
		$('#main_material_fee_sum', $QUOTE).html(__fn__(main_material_fee_sum));

		//管理费
		$('#operating_sum', $QUOTE).html(__fn__(operating_sum));

		//税金
		$('#tax_sum', $QUOTE).html(__fn__(tax_sum));

		//商品总价
		$('.product-sum', $QUOTE).html(__fn__(total_product_sum));

		//主材费用
		$('.main-material-sum', $QUOTE).html(__fn__(main_material_sum));

		//总价
		$('*[data-mode=total-sum]', $QUOTE).each(function(){
			$(this).html(parseInt(__fn__(total,0), 10));
		});
		var summary = {
			total_sum: __fn__(total),
			total_product_sum: __fn__(total_product_sum, 0),
			half_product_sum: __fn__(half_product_sum, 0)
		};
		fireOnAfterUpdateSum(summary);
	};

	var _after_update_sum_cbs = [];

	/**
	 * 绑定价格更新事件
	 * @param callback
	 */
	var onAfterUpdateSum = function(callback){
		_after_update_sum_cbs.push(callback);
	};

	/**
	 * 价格更新事件触发
	 * @param summary
	 */
	var fireOnAfterUpdateSum = function(summary){
		$.each(_after_update_sum_cbs, function(k, v){
			v(summary);
		});
	};

	/**
	 * 根据数量、价格梯队计算价格
	 * @param ladder_price
	 * @param num 主材用量（非单位用量）
	 */
	var getPriceByLadderPriceList = function(ladder_price, num){
		if(!ladder_price){
			return null;
		}
		var data = parser_json(ladder_price);
		if(data && data.length){
			data.sort(function(a, b){
				return a.quantity > b.quantity;
			});
			var normal_price = 0;
			var ext_price = 0;
			for(var i=0; i<data.length; i++){
				if(data[i].type == LADDER_PRICE_TYPE_NORMAL){
					if(num <= data[i].quantity){
						normal_price = __fn__(data[i].quota_price, 1);
						break;
					}
					if(num > data[i].quantity){
						normal_price = __fn__(main-material-tpldata[i].quota_price, 1);
					}
				} else {
					ext_price = __fn__(data[i].quota_price, 1);
				}
			}
			return [normal_price, ext_price];
		} else {
			return null;
		}
	};

	/**
	 * 根据价格梯队计算套餐数量、延米数量
	 * @param ladder_price
	 * @param num 主材用量（非单位用量）
	 * @returns {*} [套, 延米数量]
	 */
	var getCountByLadderPriceList = function(ladder_price, num){
		if(!ladder_price){
			return null;
		}
		var data = parser_json(ladder_price);
		if(data && data.length){
			data.sort(function(a, b){
				return a.quantity > b.quantity;
			});
			var base_count = 0;
			for(var i=0; i<data.length; i++){
				if(data[i].type == LADDER_PRICE_TYPE_NORMAL){
					if(num <= data[i].quantity){
						base_count = num;
						break;
					}
					if(num > data[i].quantity){
						base_count = data[i].quantity;
					}
				}
			}
			return [base_count > 0 ?1:0, __fn__(num-base_count,2)];
		} else {
			return null;
		}
	};

	/**
	 * 计算材料运输费
	 * @param product_sum
	 * @param has_elevator
	 * @param floor
	 * @returns {number}
	 */
	var calTransportSum = function(product_sum, has_elevator, floor){
		var sum = 0;
		if(has_elevator){
			sum = product_sum * 0.01;
		} else {
			if(floor <= 3){
				sum = product_sum*0.02;
			} else {
				sum = product_sum*((floor-3)*0.5/100+0.02);
			}
		}
		return sum;
	};

	/**
	 * 计算垃圾清运费
	 * @param product_sum
	 * @param has_elevator
	 * @param floor
	 * @returns {number}
	 */
	var calRubbishSum = function(product_sum, has_elevator, floor){
		var sum = 0;
		if(has_elevator){
			sum = product_sum * 0.01;
		} else {
			if(floor <= 3){
				sum = product_sum*0.02;
			} else {
				sum = product_sum*((floor-3)*0.5/100+0.02);
			}
		}
		return sum;
	};

	/**
	 * 绑定spinner控件
	 * @param $container
	 * @param unbind
	 */
	var bindSpinner = function($container, unbind){
		if(PAGE_READONLY){
			return;
		}
		$('input[type=text][data-mode=number]', $container).each(function(){
			var $this = $(this);
			var readonly = $(this).closest('.quote-readonly').size();
			if(unbind){
				$this.spinner('disable');
			} else if(!readonly){
				$this.spinner({
					stop:function(event, ui) {
						update_sum();
					}
				});
			}
		});
	};

	/**
	 * 绑定hover类名处理事件
	 * @param $container
	 */
	var bindHoverClass = function($container){
		$('[data-hover], tr, table', $container).each(function(){
			var $this = $(this);
			var hc = $this.data('hover') || 'quote-'+this.nodeName.toLowerCase() + '-hover';
			if(!hc || $this.data('hover-event-bind')){
				return;
			}
			$this.data('hover-event-bind', 1);
			$this.hover(function(){
				$this.addClass(hc);
			}, function(){
				$this.removeClass(hc);
			});
		});
	};

	/**
	 * 行禁用
	 * @param $container
	 */
	var bindRowChecker = function($container){
		$('.quote-row-checker', $container).each(function(){
			var $this = $(this);
			var $row = $this.closest('tr');
			if($this.data('quote-row-checker-event-bind')){
				return;
			}
			$this.data('quote-row-checker-event-bind', 1);
			$this.change(function(){
				$('[rel=quote-row-checker]',$row).val(this.checked ? 1 : 0);
			});
		});
	};

	/**
	 * 绑定新容器事件
	 * @param $container
	 */
	var rebindContainerEvent = function($container){
		bindSpinner($container);
		bindHoverClass($container);
		bindRowChecker($container);
	};

	/**
	 * 新增产品
	 * @param product
	 * @param sku_id
	 * @param node
	 */
	var insert_product = function(product, sku_id, node){
		var tbl = node.closest('table');
		var $tbody = $('tbody', tbl);
		var unit_idx = $('input[rel=category_unit_idx]', tbl).val();
		product.main_material_sku_quantity = product.main_material_sku_quantity || {};
		product.quote_quantity = product.quote_quantity || 0;
		var tpl_data = {
			product: product,
			current_sku_id: sku_id,
			unit_idx: unit_idx,
			sub_unit_idx: util.guid(),
			TAG: get_tag(node)
		};
		var tpl = tmpl($('#product-tpl').html(), tpl_data);
		$tbody.prepend(tpl);
		rebindContainerEvent($tbody);
		update_sum();
	};

	/**
	 * 插入空主材列表
	 * @param attach_info
	 * @param $craft_row
	 */
	var insert_empty_main_material = function(attach_info, $craft_row){
		var $table = $craft_row.closest('table');
		var unit_idx = $('input[rel=category_unit_idx]',$table).val();
		var tag = get_tag($craft_row);
		var sub_unit_idx = $('input[rel='+tag+'-sku-sub-unit-idx]', $craft_row).val();
		var new_row = tmpl($('#empty-main-material-tpl').html(), {
			attach:attach_info,
			unit_idx:unit_idx,
			sub_unit_idx: sub_unit_idx,
			TAG: get_tag($craft_row)
		});
		$(new_row).insertAfter($craft_row);
	};

	/**
	 * 插入主材
	 * @param material_sku
	 * @param node
	 */
	var insert_main_material = function(material_sku, node){
		material_sku.brand_image_url = material_sku.brand_image_url || 'http://cdn.guojj.com/app/www/img/default_img.jpg';
		var tag = get_tag(node);
		var $row = $(node).closest('tr');
		var $table = $(node).closest('table');

		//查询工艺sku行
		var $craft_row = $row;
		while($craft_row = $craft_row.prev()){
			if($craft_row.hasClass('craft-sku-row')){
				break;
			}
		}

		var unit_idx = $('input[rel=category_unit_idx]',$table).val();
		var sub_unit_idx = $('input[rel='+tag+'-sku-sub-unit-idx]', $craft_row).val();
		var unit_cost = $('input[rel=main_material_unit_cost]', $row).val();
		var attach_code = $('input[rel=attach_code]', $row).val();
		material_sku.quantity = material_sku.quantity || unit_cost;
		var data = {
			unit_idx: unit_idx,
			sub_unit_idx: sub_unit_idx,
			sku: material_sku,
			main_material_sku: material_sku,
			attach_code: attach_code,
			TAG: get_tag(node)
		};
		if(material_sku.ladder_price_list_json){
			material_sku.ladder_price_list_json = add_slashes(material_sku.ladder_price_list_json);
		}
		var $prev_row = $row.prev();
		var new_row = tmpl($('#main-material-tpl').html(), data);
		$(new_row).insertAfter($prev_row);
		$row.remove();
		update_sum();
	};

	/**
	 * 新增房间
	 * @param room
	 * @param node
	 */
	var insert_room = function(room, node){
		var $tbl = $(node).closest('.quote-catalog');
		var list_con = $('.quote-item-list', $tbl);
		var html = tmpl($('#room-head-tpl').html(), {
			unit_idx: util.guid(),
			room:room
		});
		room.room_id = room.house_room_id;
		room.room_type_id = room.type;
		room.name = $('input[name=room_name]', $tbl).val() || room.name;
		room.floor_area = $('input[name=floor_area]', $tbl).val();
		html = tmpl($('#category-tpl').html(), {head_html:html});
		$(html).insertAfter($('.quote-col-label', list_con));
		rebindContainerEvent(list_con);
		update_sum();
	};

	/**
	 * 更新房间
	 * @param room
	 * @param node
	 */
	var update_room = function(room, node){
		var cell = node.closest('th');
		var unit_idx = $('input[rel=category_unit_idx]', cell).val();
		var tpl = tmpl($('#room-head-tpl').html(), {
			room: room,
			unit_idx: unit_idx
		});
		cell.html(tpl);
		update_sum();
	};

	/**
	 * 添加工程
	 * @param category
	 * @param node
	 */
	var insert_category = function(category, node){
		var $tbl = $(node).closest('.quote-catalog');
		var $list_con = $('.quote-col-label', $tbl);
		var unit_idx = util.guid();
		var head_html = tmpl($('#category-head-tpl').html(), {
			category: category,
			unit_idx: unit_idx
		});
		var tpl = tmpl($('#category-tpl').html(), {head_html: head_html});
		$(tpl).insertAfter($list_con);
		rebindContainerEvent($tbl);
		update_sum();
	};

	/**
	 * 新增工程项目
	 * @param product
	 * @param sku_id
	 * @param node
	 */
	var insert_house_item = function(product, sku_id, node){
		var tbl = node.closest('table');
		var $tbody = $('tbody', tbl);
		var unit_idx = $('input[rel=category_unit_idx]', tbl).val();
		if(!product.main_material_sku_quantity){
			product.main_material_sku_quantity = {};
		}
		var tpl = tmpl($('#product-tpl').html(), {
			product: product,
			current_sku_id: sku_id,
			unit_idx: unit_idx,
			sub_unit_idx: util.guid(),
			TAG: get_tag(node)
		});
		$tbody.prepend(tpl);
		rebindContainerEvent($tbody);
		update_sum();
	};

	/**
	 * 添加工程
	 * @param category
	 * @param node
	 */
	var insert_demo = function(category, node){
		var $tbody = $(node).closest('.quote-catalog');
		var $list_con = $('.quote-col-label', $tbody);
		var unit_idx = util.guid();
		var head_html = tmpl($('#demo-head-tpl').html(), {
			category: category,
			unit_idx: unit_idx
		});
		var tpl = tmpl($('#category-tpl').html(), {head_html: head_html});
		$(tpl).insertAfter($list_con);
		rebindContainerEvent($tbody);
		rebindContainerEvent($list_con);
		update_sum();
	};

	/**
	 * 新增拆改工程项目
	 * @param product
	 * @param sku_id
	 * @param node
	 */
	var insert_demo_item = function(product, sku_id, node){
		var tbl = node.closest('table');
		var $tbody = $('tbody', tbl);
		var unit_idx = $('input[rel=category_unit_idx]', tbl).val();
		var tpl = tmpl($('#demo-item-tpl').html(), {
			product: product,
			current_sku_id: sku_id,
			unit_idx: unit_idx
		});
		$tbody.prepend(tpl);
		rebindContainerEvent($tbody);
		update_sum();
	};

	/**
	 * 删除主材
	 * @param $row
	 */
	var remove_main_material = function($row){
		var $table = $row.closest('table');
		var unit_idx = $('input[rel=category_unit_idx]',$table).val();
		var unit_cost = $('input[rel=main_material_unit_cost]', $row).val();
		var data = {
			unit_idx: unit_idx,
			attach: {
				attach_code: $('*[rel=attach_code]', $row).val(),
				quantity:unit_cost
			},
			TAG: get_tag($row)
		};
		$row.addClass('quote-main-material-empty');
		$('input[data-mode=number]', $row).val(0);
		var $prev_row = $row.prev();
		var new_row = tmpl($('#empty-main-material-tpl').html(), data);
		$(new_row).insertAfter($prev_row);
		$row.remove();
		update_sum();
	};

	/**
	 * 拉取水电点位报价工程量
	 * @param layout_id
	 * @param area
	 * @param callback
	 */
	var get_water_ele_base_quantity_list = function(layout_id, area, callback){
		net.get(URL_GET_WATER_ELE_BASE_QUANTITY,{layout_id:layout_id, area:area, ref:'json'}, function(rsp){
			if(rsp.code == 0){
				callback(rsp.data);
				return;
			}
			Msg.show(rsp.message || '系统繁忙，请稍侯重试', 'err');
		}, {frontCache:true});
	};

	/**
	 * 更新水电点位列表
	 * @param layout_id
	 * @param area
	 * @param callback
	 */
	var update_water_ele_quantity_list = function(layout_id, area, callback){
		var url = URL_GET_WATER_ELE_QUANTITY;
		var point_id_list = [];
		var $POINT_LIST = $('[rel=water-ele-point-id]', $QUOTE);
		$POINT_LIST.each(function(){
			point_id_list.push(this.value);
		});
		if(!point_id_list.length){
			callback();
			return;
		}
		net.get(url, {ref:'json', point_id_list:point_id_list, layout_id:layout_id, area:area}, function(rsp){
			if(rsp.code == 0){
				$POINT_LIST.each(function(){
					var $row = $(this).closest('tr');
					var point_id = this.value;
					for(var pid in rsp.data){
						if(pid == point_id){
							$('[rel=water-ele-sku-map]', $row).val(rsp.data[pid]);
							break;
						}
					}
				});
				callback();
			} else {
				Msg.show(rsp.message, 'info');
			}
		}, {frontCache:true});
	};

	/**
	 * 更新全房工程水电点位用量
	 * @param onFinish
	 * @returns {boolean}
	 */
	var update_water_ele_quantity = function(onFinish){
		onFinish = onFinish || function(){};
		var $btn = $('[rel=update-water-ele-quantity]', $QUOTE);

		//只针对“强弱电”“给排水”
		var $LIST_CON = $('[rel=has-water-ele-point]',$btn.closest('.quote-catalog'));
		var $input = $('#water-ele-quantity');
		var area = $input.val();
		var layout_id = $LAYOUT_ID.val();
		if(area <= 0){
			Msg.show('请配置水电工程量', 'info');
			return false;
		}

		get_water_ele_base_quantity_list(layout_id, area, function(sku_list){
			var match = false;
			var $sku_list = $('[data-mode=sku-list]',$LIST_CON);

			//删除不存在的水电点位sku，默认的SKU则不删除
			$sku_list.each(function(){
				var sku_id = parseInt($(this).val());

				//如果为默认sku
				if(ORIG_HOUSE_SKU_LIST[sku_id]===undefined){
					var found = false;
					$.each(sku_list, function(_, sku){
						if(sku.sku_id == sku_id){
							found = true;
							return false;
						}
					});
					if(!found){
						var $row = $(this).parent('td').parent("tr");
						$row.remove();
					}

				}
			});

			//额外插入新增的水电点位sku
			var has_new_sku = false;
			$.each(sku_list, function(_, sku){
				var found = false;
				$sku_list.each(function(){
					var sku_id = $(this).val();
					if(sku.sku_id == sku_id){
						found = true;
						return false;
					}
				});
				if(!found){
					sku.sku_list = [sku];
					$('[rel=category_id]', $LIST_CON).each(function(){
						if(this.value == sku.category_id){
							insert_house_item(sku, sku.sku_id, $(this));
						}
					});
					has_new_sku = true;
				}
			});

			//刷新SKU列表
			$sku_list = $('[data-mode=sku-list]',$LIST_CON);

			$sku_list.each(function(){
				var sku_id = $(this).val();
				if(sku_list[sku_id]){
					var $row = $(this).closest('tr');
					$('[data-mode=number]', $row).val(sku_list[sku_id].base_quantity);
					match = true;
				}
			});

			//更新额外新增的水电
			$('[rel=water-ele-point-id]', $QUOTE).each(function(){
				var $row = $(this).closest('tr');
				var count = parseInt($('[rel=water-ele-sku-count]', $row).val(), 10) || 0;
				var sku_map = $.parseJSON($('[rel=water-ele-sku-map]', $row).val());
				for(var sku_id in sku_map){
					var ext_quantity = sku_map[sku_id];
					if(ext_quantity){
						$sku_list.each(function(){
							var $sel = $(this);
							var $sku_row = $sel.closest('tr');
							var sid = $sel.val();
							if(sid == sku_id){
								var org_num = $sku_row.find('[data-mode=number]').val();
								org_num = parseFloat(org_num || 0);
								$sku_row.find('[data-mode=number]').val(__fn__(org_num+ext_quantity*count,1));
								match = true;
							}
						});
					}
				}
			});
			if(match){
				update_sum();
			}
			onFinish(match);
		});
	};

	//插入房间
	$QUOTE.delegate('.add-room-btn', 'click', function(ev){
		var _this = this;
		var url = net.mergeCgiUri(URL_UPDATE_ROOM, {ref:'iframe'});
		var p = new Pop({
			title: this.title || $(this).text(),
			content: {src:url}
		});
		p.listen('onSuccess', function(room){
			insert_room(room, _this);
		});
		p.show();
		return false;
	});

	//更新房间
	$QUOTE.delegate('.update-room-btn', 'click', function(ev){
		var $this = $(this);
		var cell = $this.parent();
		var unit_idx = $('input[rel=category_unit_idx]', cell).val();

		var data = {
			ref:'iframe',
			room_type_id: $('input[rel=room_type_id_list]', cell).val(),
			room_id: $('input[name=room_id_list\\['+unit_idx+'\\]]', cell).val(),
			name: $('input[name=room_name_list\\['+unit_idx+'\\]]', cell).val(),
			floor_area: $('input[name=room_floor_area_list\\['+unit_idx+'\\]]', cell).val()
		};

		var url = net.mergeCgiUri(URL_UPDATE_ROOM, data);
		var p = new Pop({
			title: '更新房间信息',
			content: {src:url}
		});
		p.listen('onSuccess', function(room){
			update_room(room, $this);
		});
		p.show();
		return false;
	});

	//插入主材
	$QUOTE.delegate('.add-main-material-btn, .change-main-material-btn', 'click', function(ev){
		var $this = $(this);
		var product_id = $('input[rel=product_id]', $this.closest('tr')).val();
		var attach_code = $('input[rel=attach_code]', $this.closest('tr')).val();
		var url = net.mergeCgiUri(URL_ADD_MAIN_MATERIAL, {ref:'iframe', product_id:product_id, attach_code:attach_code});
		var p = new Pop({
			title: this.title || $this.text(),
			width: 925,
			content: {src:url}
		});
		p.listen('onSuccess', function(material_sku){
			insert_main_material(material_sku, $this);
		});
		p.show();
		return false;
	});

	//删除主材
	$QUOTE.delegate('.del-main-material-btn', 'click', function(ev){
		var _this = this;
		show_confirm('是否确认删除该项主材？', function(){
			var $row = $(_this).closest('tr');
			remove_main_material($row);
		});
		return false;
	});

	//插入产品
	$QUOTE.delegate('.add-room-product-btn', 'click', function(ev){
		var $this = $(this);
		var room_type_id = $('input[rel=room_type_id_list]',$this.parent()).val();
		var url = net.mergeCgiUri(URL_ADD_PRODUCT, {ref:'iframe', room_type_id: room_type_id, is_new_page:1});
		var p = new Pop({
			title: this.title || $this.text(),
			content: {src:url},
			room_type_id :room_type_id,
			width:1000
		});
		p.listen('onSuccess', function(product_list, sku_id_list){
			for (var k in sku_id_list) {
				var t_s = sku_id_list[""+k+""];
				var product = $.extend(product_list[t_s.product_id], t_s);
				insert_product(product, t_s.sku_id, $this);
			}

		});
		p.show();
		return false;
	});

	//删除工程
	$QUOTE.delegate('.delete-category-btn', 'click', function(){
		var _this = this;
		show_confirm('确定要删除该项？', function(){
			var tbl = $(_this).closest('table');
			tbl.animate({opacity:0}, function(){
				tbl.remove();
				update_sum();
			});
		});
		return false;
	});

	//删除SKU项目
	$QUOTE.delegate('.delete-sku-btn', 'click', function(){
		var _this = this;
		show_confirm('确定要删除该项产品？', function(){
			var $tr = $(_this).closest('tr');
			var $next = $tr;
			var del_list = [];
			while($next = $next.next()){
				if($next.hasClass('main-material-sku-row')){
					del_list.push($next);
				} else {
					break;
				}
			}
			$.each(del_list, function(k, $node){$node.remove()});
			$tr.remove();
			update_sum();
		});
		return false;
	});

	//添加工程
	$QUOTE.delegate('.add-house-btn', 'click', function(ev){
		var _this = this;
		var current_category_ids = [];
		$('*[rel=category_id]', $(this).closest('.quote-catalog')).each(function(){
			current_category_ids.push(this.value);
		});

		var url = net.mergeCgiUri(URL_UPDATE_HOUSE, {ref:'iframe', current_category_ids: current_category_ids.join(',')});
		var p = new Pop({
			title: '添加水电改造工程',
			content: {src:url}
		});
		p.listen('onSuccess', function(category){
			insert_category(category, _this);
		});
		p.show();
		return false;
	});

	//添加工程项目
	$QUOTE.delegate('.add-house-item-btn', 'click', function(ev){
		var $this = $(this);
		var category_id = $('input[rel=category_id]',$this.parent()).val();
		var url = net.mergeCgiUri(URL_ADD_PRODUCT, {
			ref:'iframe',
			lock_category: 1,
			category_id: category_id,
			is_new_page:1
		});
		var p = new Pop({
			title: this.title,
			content: {src:url},
			width:1000
		});
		p.listen('onSuccess', function(product_list, sku_id_list){
			for (var k in sku_id_list) {
				var t_s = sku_id_list[""+k+""];
				var product = $.extend(product_list[t_s.product_id], t_s);
				insert_product(product, t_s.sku_id, $this);
			}
		});
		p.show();
		return false;
	});

	//添加拆除工程项目
	$QUOTE.delegate('.add-demo-category-item-btn', 'click', function(ev){
		var $this = $(this);
		var category_id = $('input[rel=category_id]',$this.parent()).val();
		var url = net.mergeCgiUri(URL_ADD_PRODUCT, {
			ref:'iframe',
			lock_category: 1,
			category_id: category_id,
			is_new_page:1
		});
		var p = new Pop({
			title: this.title,
			content: {src:url},
			width:1000
		});
		p.listen('onSuccess', function(product_list, sku_id_list){
			for (var k in sku_id_list) {
				var t_s = sku_id_list[""+k+""];
				var product = $.extend(product_list[t_s.product_id], t_s);
				insert_demo_item(product, t_s.sku_id, $this);
			}
		});
		p.show();
		return false;
	});

	//添加拆除工程
	$QUOTE.delegate('.add-demo-category-btn', 'click', function(ev){
		var current_category_ids = [];
		$('input[rel=category_id]', $(this).closest('.quote-catalog')).each(function(){
			current_category_ids.push(this.value);
		});

		var _this = this;
		var url = net.mergeCgiUri(URL_ADD_DEMOLISH_CATEGORY, {ref:'iframe', categories_ids:current_category_ids.join(',')});
		var p = new Pop({
			title: this.title || $(this).text(),
			content: {src:url}
		});
		p.listen('onSuccess', function(category){
			insert_demo(category, _this);
		});
		p.show();
		return false;
	});

	//更新水电工程量
	$QUOTE.delegate('[rel=update-water-ele-quantity]', 'click', function(){
		var url = net.mergeCgiUri(URL_ADD_WATER_ELE_AREA_LAYOUT, {
			ref:'iframe',
			area: $('#water-ele-quantity').val()
		});
		var p = new Pop({
			title: '更新水电工程量',
			width: 600,
			content: {src:url}
		});
		p.listen('onSuccess', function(layout_name, layout_id, area){
			$('#water-ele-quantity').val(area);
			$LAYOUT_ID.val(layout_id);
			$('.quote-water-ele-quantity-wrap span', $QUOTE).html(area+'㎡ '+layout_name);
			update_water_ele_quantity_list(layout_id, area, update_water_ele_quantity);
		});
		p.show();
		return false;
	});

	//更新水电工程量
	$QUOTE.delegate('[rel=water-ele-sku-count]', 'change', function(){
		if(!/^[1-9]+\d*$/ig.test(this.value)){
			Msg.show('数量格式不正确', 'info');
			this.focus();
			return;
		}
		update_water_ele_quantity();
	});

	//添加水电点位
	$QUOTE.delegate('[rel=add-water-ele-point]', 'click', function(){
		var $LIST = $('.quote-water-ele-list', $QUOTE);
		var $input = $('#water-ele-quantity');
		var area = $input.val();
		var layout_id = $LAYOUT_ID.val();
		if(area <= 0){
			Msg.show('请配置水电工程量', 'info');
			return false;
		}

		var ids = [];
		$('[rel=water-ele-point-id]',$LIST).each(function(){
			ids.push(this.value);
		});
		var url = net.mergeCgiUri(URL_ADD_WATER_ELE_POINT, {
			ref:'iframe',
			layout_id:layout_id,
			area:area,
			ids: ids.join(',')
		});
		var p = new Pop({
			title: this.title || $(this).text(),
			content: {src:url}
		});
		p.listen('onSuccess', function(rsp){
			var data = {
				id:rsp.id,
				title: rsp.title,
				num: rsp.num,
				sku_list_str: add_slashes(rsp.sku_list_str)
			};
			var html = tmpl($('#water-ele-point-item-tpl').html(), {data:data});
			$(html).appendTo($('tbody', $LIST));
			update_water_ele_quantity();
		});
		p.show();
		return false;
	});

	//删除水电点位
	$QUOTE.delegate('[rel=del-water-ele-point]', 'click', function(){
		var _this = this;
		show_confirm('确定要删除该项水电点位？', function(){
			$(_this).closest('tr').remove();
			update_water_ele_quantity();
		});
		return false;
	});

	//更改水电点位
	$QUOTE.delegate('.quote-water-ele-list input.txt', 'focus', function(){
		this.select();
	});

	//运送方式选择
	var $ext_wrap = $('.quote-ext-config', $QUOTE);
	$('*[name=transport_type]', $ext_wrap).change(function () {
		var $this = $(this);
		$('input[name=transport_floor]', $ext_wrap).attr('disabled', $this.val() == TYPE_ELEVATOR ? 'disabled' : false);
		if ($this.val() != TYPE_ELEVATOR) {
			$('input[name=transport_floor]', $ext_wrap).focus();
		}
		update_sum();
	});
	$.each(['change', 'click', 'mousedown', 'mouseup', 'keydown', 'keyup'], function(k, v){
		$('input[name=transport_floor]', $ext_wrap)[v](update_sum);
	});

	//sku 改变
	$QUOTE.delegate('*[data-mode=sku-list]', 'change',update_sum);

	//sku 改变，主材重新加载
	$QUOTE.delegate('select[data-mode=sku-list]', 'change', rebuildMainMaterial);
	$QUOTE.delegate('select[data-mode=sku-list]', 'click', function(){$(this).data('last-selected', this.selectedIndex);});

	//数量改变
	$.each(['keydown', 'keyup', 'change'], function(k, ev){
		$QUOTE.delegate('input[data-mode=number]', ev, update_sum);
	});

	rebindContainerEvent($QUOTE);

	//行操作点击
	$QUOTE.delegate('input.quote-row-checker', 'change', update_sum);

	//toggle
	$QUOTE.delegate('.quote-toggle-btn', 'click', function(){
		var TOGGLE_CLS = 'quote-catalog-collapse';
		var $this = $(this);
		var $catalog = $this.closest('.quote-catalog');
		var to_expand = $catalog.hasClass(TOGGLE_CLS);
		$this.html(to_expand ? '-':'+');
		$catalog[to_expand ? 'removeClass' : 'addClass'](TOGGLE_CLS);
	});

	//row checker
	$QUOTE.delegate('input.quote-row-checker', 'click', function(){
		var checked = this.checked;
		var $this = $(this);
		var $craft_row = $this.closest('tr');
		$craft_row[checked ? 'removeClass' : 'addClass']('row-disabled');
		bindSpinner($craft_row, !checked);

		var $main_material_row = $craft_row;
		while($main_material_row = $main_material_row.next()){
			if($main_material_row.hasClass('main-material-sku-row')){
				$main_material_row[checked ? 'removeClass' : 'addClass']('row-disabled');
				bindSpinner($main_material_row, !checked);
			} else {
				break;
			}
		}
		update_sum();
	});

	//batch delete toggle
	$QUOTE.delegate('.batch-toggle-btn', 'click', function(){
		var $catalog = $(this).closest('.quote-catalog');
		$catalog.toggleClass('quote-batch-operate-collapse');
		fireOnAfterBatchToggle(!$catalog.hasClass('quote-batch-operate-collapse'));
		return false;
	});

	//batch toggle event
	var _batch_delete_evs = [];
	var onAfterBatchToggle = function(callback){
		_batch_delete_evs.push(callback);
	};
	var fireOnAfterBatchToggle = function(toEditState){
		$.each(_batch_delete_evs, function(k, v){
			v(toEditState);
		});
	};

	//操作按钮
	$('.quote-smt-btn', $QUOTE).click(function(){
		if($(this).data('flag')){
			$('input[name=flag]').val($(this).data('flag'));
			$(this).closest('form').submit();
		}
	});

	//绑定disabled状态
	$QUOTE.delegate(
		'.row-disabled select, '+
		'.row-disabled input[type=text], '+
		'.quote-readonly select, '+
		'.quote-readonly input[type=text], '+
		'.main-quote-num', 'mousedown', function(e){
			e.preventDefault();
			return false;
		});

	if (!PAGE_READONLY) {
		update_sum();
	}

	//SKU上下移动(待扩展为移动房间)
	$QUOTE.delegate('.move', 'click', function(){
		var _this = $(this);
		var moveParentClass = '.move-parent';
		var direction = _this.data('direction');
		var $moveParent = _this.parents(moveParentClass);

		var $moveTo = null;
		var $moveWithProperty = null;
		switch(direction){
			case 'up':
				$moveTo = $moveParent.prevAll(moveParentClass);
				if ($moveTo.length == 0) {
					alert('已移动至最顶部');
					return;
				}
				$moveWithProperty = $moveParent.nextUntil(moveParentClass);
				$moveParent.insertBefore($moveTo[0]);
				$moveWithProperty.insertBefore($moveTo[0]);
				break;
			case 'down':
				$moveTo = $moveParent.nextAll(moveParentClass);
				if ($moveTo.length == 0) {
					alert('已移动至最底部');
					return;
				}
				$moveWithProperty = $moveParent.nextUntil(moveParentClass);
				var $insert = $($moveTo[0]);
				var $nextOther = $insert.nextUntil(moveParentClass);
				if ($nextOther.length > 0) {
					$insert = $nextOther.last();
				}
				$moveWithProperty.insertAfter($insert);
				$moveParent.insertAfter($insert);
				break;
			default :
				alert('未选择方向');
		}
	});

	return {
		updateSum: update_sum,
		onAfterUpdateSum: onAfterUpdateSum,
		onAfterBatchToggle: onAfterBatchToggle,
		removeMainMaterial:remove_main_material
	};
});