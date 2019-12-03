define('ywj/Select', function(require){
	require('ywj/resource/Select.css');
	const $ = require('jquery');
	const Util = require('ywj/util');
	const h = Util.htmlEscape;

	//CSS类名定义
	const SHADOW_SELECT_CLASS = 'com-select-shadow';
	const SHADOW_SELECT_CLEAN_CLASS = 'com-select-shadow-clean';
	const SHADOW_SELECT_ITEM_CLASS = 'com-select-shadow-item';
	const SHADOW_SELECT_PLACEHOLDER = 'com-select-shadow-placeholder';

	const SELECT_CLASS = 'com-select';
	const SELECT_MULTIPLE_CLASS = 'com-select-multiple';
	const SELECT_REQUIRED_CLASS = 'com-select-required';
	const SELECT_AS_GRID_CLASS = 'com-select-grid';

	const PANEL_CLASS = 'com-select-panel';

	const PANEL_SELECT_BTN = 'com-select-panel-select-btn';
	const PANEL_SELECT_ALL = 'com-select-panel-select-all';
	const PANEL_SELECT_INVERSE = 'com-select-panel-select-inverse';

	const OPTION_ITEM_CLASS = 'com-select-item';
	const OPTION_ITEM_CHECKED_CLASS = 'com-select-item-selected';
	const OPTION_ITEM_DISABLED_CLASS = 'com-select-item-disabled';

	const is_input_list = ($el)=>{
		return $el[0].tagName === 'INPUT' && $el.attr('list');
	};

	const is_select = ($el)=>{
		return $el[0].tagName === 'SELECT';
	};

	const get_values = ($el)=>{
		if(is_input_list($el)){
			return [$el.val()];
		}
		let values = [];
		$el.find('option').each(function(){
			if(this.value.length && $(this).attr('selected')){
				values.push(this.value);
			}
		});
		return values;
	};

	const value_compare = (val1, val2)=>{
		return val1.toString().length === val2.toString().length && val1 == val2;
	};

	const get_values_map = ($el)=>{
		if(is_input_list($el)){
			let val = $el.val();
			let obj = {};
			if(val){
				obj[val] = val;
			}
			return obj;
		}
		let map = {};
		$el.find('option').each(function(){
			if(this.selected && this.value.length){
				map[this.value] = $(this).text();
			}
		});
		return map;
	};

	/**
	 * 如果是分组模式，格式为：[{label:lbl, options:options}, ...]
	 * 如果是普通模式，格式为：options: [{label:lbl, value:val}, {label:lbl, disabled:true}...]
	 * @param $el
	 * @param {Boolean} as_tile 是否平铺
	 */
	const get_options = ($el, as_tile)=>{
		let opts = [];

		if(is_input_list($el)){
			let list_id = $el.attr('list');
			$('datalist#'+list_id).find('option').each(function(){
				let val = $(this).attr('value');
				let label = $(this).attr('label') || val;
				opts.push({label: label, value: val});
			});
		}
		if(is_select($el)){
			$el.children().each(function(idx, child){
				if(child.tagName === 'OPTION'){
					//is placeholder
					if(idx === 0 && child.value.length === 0){
						return;
					}
					opts.push({label: $(child).text(), value: child.value, disabled: child.disabled});
				}else if(child.tagName === 'OPTGROUP'){
					let group_label = $(child).attr('label');
					let sub_opts = [];
					$(child).children().each(function(k, sub_opt){
						sub_opts.push({label: $(sub_opt).text(), value: sub_opt.value, disabled: sub_opt.disabled});
					});
					if(as_tile){
						opts = opts.concat(sub_opts);
					} else {
						opts.push({label: group_label, options: sub_opts});
					}
				}
			});
		}
		return opts;
	};

	/**
	 * get $node placeholder text
	 * @param $el
	 * @returns {string|*|string}
	 */
	const get_placeholder = ($el)=>{
		if(is_input_list($el)){
			return $el.attr('placeholder') || '';
		}
		if(is_select($el)){
			if($el.data('placeholder')){
				return $el.data('placeholder');
			}
			let $first_option = $el.find('option:first');
			if($first_option.size() && $first_option.val().length === 0){
				return $first_option.text();
			}
		}
		return '';
	};

	const build_options = (options, multiple)=>{
		let html = `<dl>`;
		let tmp_name = 'com-select-tmp-option-name' + Util.guid();
		$.each(options, (k, opt)=>{
			if(opt.options){
				html += `<dt>${h(opt.label)}</dt>`;
				$.each(opt.options, (k, sub_opt)=>{
					html += `<dd ${sub_opt.disabled ? '' : 'tabindex="0"'} class="${OPTION_ITEM_CLASS} ${sub_opt.disabled ? OPTION_ITEM_DISABLED_CLASS : ''}" data-value="${h(sub_opt.value)}">`+
							`${h(sub_opt.label)}</dd>`;
				});
			} else {
				html +=
					`<dd ${opt.disabled ? '' : 'tabindex="0"'} class="${OPTION_ITEM_CLASS} ${opt.disabled ? OPTION_ITEM_DISABLED_CLASS : ''}" data-value="${h(opt.value)}">`+
					`${h(opt.label)}</dd>`;
			}
		});
		return html;
	};

	const update_to_panel = ($el)=>{
		let values = get_values($el),
			$panel = get_panel($el);
		$panel.find('.' + OPTION_ITEM_CLASS).each(function(){
			let hit = Util.inArray($(this).data('value'), values);
			$(this)[hit ? 'addClass' : 'removeClass'](OPTION_ITEM_CHECKED_CLASS);
		});
	};

	const update_to_node = ($el) => {
		let $panel = get_panel($el);
		let $options = $panel.find('.'+OPTION_ITEM_CHECKED_CLASS);
	};

	/**
	 * 获取面板
	 * @param $el
	 * @returns {jQuery|HTMLElement|null}
	 */
	const get_panel = ($el)=>{
		let id = $el.data('select-panel-id');
		if(!id){
			return null;
		}
		return $('#'+id);
	};

	const get_available_items = ($el)=>{
		let $panel = get_panel($el);
		return $panel.find('.'+OPTION_ITEM_CLASS).not('.'+OPTION_ITEM_DISABLED_CLASS);
	};

	const get_shadow_input = ($el)=>{
		let $panel = get_panel($el);
		if($panel){
			return $panel.closest('.'+SELECT_CLASS).find('.'+SHADOW_SELECT_CLASS);
		}
		return null;
	};

	/**
	 * 高亮搜索结果
	 * @param $el
	 * @param kw
	 */
	const highlight = ($el, kw)=>{
		let $panel = get_panel($el);

	};

	/**
	 * 显示（构建、绑定事件）面板
	 * @param $el
	 * @param param
	 */
	const show_panel = ($el, param)=>{
		let $panel = get_panel($el);
		if(!$panel){
			return;
		}
		$panel.show().find('input:first').focus();
	};

	/**
	 * 隐藏面板
	 * @param $el
	 */
	const hide_panel = ($el)=>{
		let $panel = get_panel($el);
		if($panel){
			$panel.find('dl').hide();
		}
	};

	const select_item = ($el, val, param) => {
		if(top.debug){
			debugger;
		}

		let $items = get_available_items($el);
		let $current_item = $items.filter(function(){return value_compare($(this).data('value'), val);});
		let values = get_values_map($el);
		if(values[val] !== undefined){
			return;
		}

		if(!param.multiple){
			$items.removeClass(OPTION_ITEM_CHECKED_CLASS);
		}
		$current_item.addClass(OPTION_ITEM_CHECKED_CLASS);

		if(is_select($el)){
			remove_placeholder($el);
			let $shadow_input = get_shadow_input($el);

			let options = get_options($el, true);
			let name = val;
			$.each(options, function(){
				if(value_compare(this.value, val)){
					name = this.label;
					return false;
				}
			});

			if(!param.multiple){
				$shadow_input.find('.'+SHADOW_SELECT_ITEM_CLASS).remove();
			}

			let $shadow_item = $(`<span class="${SHADOW_SELECT_ITEM_CLASS}" title="删除">${h(name)}</span>`).appendTo($shadow_input);
			$shadow_item.data('value', val);
			$el.find('option').filter(function(){return value_compare(this.value, val);}).attr('selected', 'selected');
			$el.triggerHandler('change');
		} else {
			$el.val(val).triggerHandler('change');
		}
	};

	const deselect_item = ($el, val, param)=>{
		let vs = get_values($el);
		let $items = get_available_items($el);
		let $current_item = $items.filter(function(){return value_compare($(this).data('value'), val);});
		$current_item.removeClass(OPTION_ITEM_CHECKED_CLASS);

		if(is_select($el)){
			$el.find('option').filter(function(){return value_compare(this.value, val);}).removeAttr('selected');
			let $shadow_input = get_shadow_input($el);
			$shadow_input.find('.'+SHADOW_SELECT_ITEM_CLASS).filter(function(){return value_compare($(this).data('value'), val);}).remove();
			let vs = get_values($el);
			if(!vs.length){
				add_placeholder($el);
			}
			return;
		}

		$el.val('').triggerHandler('change');
	};

	const remove_placeholder = ($node)=>{
		let $shadow_input = get_shadow_input($node);
		$shadow_input.find('.'+SHADOW_SELECT_PLACEHOLDER).remove();
		$shadow_input.find('.'+SHADOW_SELECT_CLEAN_CLASS).show();
	};

	const add_placeholder = ($select) => {
		let placeholder = get_placeholder($select);
		if(!placeholder){
			return;
		}
		let $shadow_input = get_shadow_input($select);
		if($shadow_input.find('.'+SHADOW_SELECT_PLACEHOLDER).size()){
			return;
		}

		$(`<span class="${SHADOW_SELECT_PLACEHOLDER}">${h(placeholder)}</span>`).appendTo($shadow_input);
		$shadow_input.find('.'+SHADOW_SELECT_CLEAN_CLASS).hide();
	};

	const init_panel = ($el, param)=>{
		let $body = $('body');
		let options = get_options($el);
		if(!options.length){
			return;
		}
		let panel_id = 'select-panel-'+Util.guid();
		$el.data('select-panel-id', panel_id);
		let $panel, $items;

		//text模式，禁用多选、搜索
		if(is_input_list($el)){
			let html =
				`<div class="${SELECT_CLASS} ${param.as_grid ? SELECT_AS_GRID_CLASS : ''}" id="${panel_id}" style="display:none;">` +
					`<div class="${PANEL_CLASS}">`+
						build_options(options, param.multiple) +
					`</div>`+
				`</div>`;
			$panel = $(html).insertAfter($el);
			$items = get_available_items($el);
			$el.removeAttr('list');
			$el.on('focus', ()=>{
				let pos = $el.offset();
				$panel.css({
					width: $el.outerWidth(),
					maxWidth: $el.outerWidth(),
					overflow: 'hidden',
					position: 'absolute',
					left: pos.left,
					top: pos.top + $el.outerHeight(),
				}).show();
			});
			$body.click(function(e){
				if(e.target !== $el[0] && e.target !== $panel[0] && !$.contains($panel[0], e.target)){
					$panel.hide();
				}
			});
		}

		//select 模式
		else {
			let html =
				`<div class="${SELECT_CLASS} ${param.as_grid ? SELECT_AS_GRID_CLASS : ''} ${param.required ? SELECT_REQUIRED_CLASS : ''} ${param.multiple ? '' + SELECT_MULTIPLE_CLASS : ''}">` +
					`<span class="${SHADOW_SELECT_CLASS}" tabindex="0">`+
						`<span class="${SHADOW_SELECT_CLEAN_CLASS}" title="清空" tabindex="0"></span>`+
					`</span>`+
					`<div class="${PANEL_CLASS}" style="display:none;" id="${panel_id}">`+
						(param.multiple ? `<span class="${PANEL_SELECT_BTN} ${PANEL_SELECT_INVERSE}"></span> <span class="${PANEL_SELECT_BTN} ${PANEL_SELECT_ALL}"></span>` : '')+
						(param.with_search ? `<input type="search" placeholder="请输入搜索">` : '')+
						build_options(options, param.multiple) +
					`</div>`+
				`</div>`;
			let $panel_wrap = $(html).insertAfter($el);
			let $shadow = $panel_wrap.find('.' + SHADOW_SELECT_CLASS);
			$shadow.css({
				width: $el.outerWidth(),
				maxWidth: $el.outerWidth
			});

			update_select_to_shadow($el, param);

			$panel = get_panel($el);
			$items = get_available_items($el);

			let click_child = false;
			$shadow.on('click focus', '*', (e) => {
				let $target = $(e.target);
				click_child = $target.hasClass(SHADOW_SELECT_ITEM_CLASS) || $target.hasClass(SHADOW_SELECT_CLEAN_CLASS);
			});
			$shadow.on('click focus', (e) => {
				setTimeout(()=>{
					if(!click_child){
						show_panel($el, param);
					}
				}, 100);
			});

			$shadow.delegate('.'+SHADOW_SELECT_ITEM_CLASS, 'click', function(e){
				deselect_item($el, $(this).data('value'), param);
			});

			$panel_wrap.delegate('.'+SHADOW_SELECT_CLEAN_CLASS, 'click', ()=>{
				$items.filter('.'+OPTION_ITEM_CHECKED_CLASS).each(function(){
					deselect_item($el, $(this).data('value'), param);
				});
			});

			$body.click(function(e){
				if(e.target !== $panel[0] &&
					e.target !== $shadow[0] &&
					!$.contains($panel[0], e.target) &&
					!$.contains($shadow[0], e.target)){
					$panel.hide();
				}
			});
		}

		$items.click(function(e){
			let $this = $(this);
			let val = $this.data('value');
			let to_select = !$this.hasClass(OPTION_ITEM_CHECKED_CLASS);
			to_select ? select_item($el, val, param) : deselect_item($el, val, param);
		});

		$panel.find('.'+PANEL_SELECT_ALL).click(function(){
			$items.each(function(){
				select_item($el, $(this).data('value'), param);
			});
		});

		$panel.find('.'+PANEL_SELECT_INVERSE).click(function(){
			$items.each(function(){
				let $this = $(this);
				let val = $this.data('value');
				let to_select = !$this.hasClass(OPTION_ITEM_CHECKED_CLASS);
				to_select ? select_item($el, val, param) : deselect_item($el, val, param);
			});
		});

		update_to_panel($el);
	};

	const init_input = ($el, param)=>{
		$el.on('focus click', () => {
			return show_panel($el, param);
		});
		$el.on('keyup', function(e){
			if(e.keyCode === Util.KEYS.ESC){
				hide_panel($el);
			} else if(e.keyCode === Util.KEYS.DOWN || e.keyCode === Util.KEYS.UP){
				//move tab
			}
		});
	};

	const update_select_to_shadow = ($select)=>{
		let $shadow_input = get_shadow_input($select);

		let map = get_values_map($select);
		let hits = false;
		let current_val = $select.val() || '';

		//填充数据
		$.each(map, (val, name)=>{
			hits = true;
			let $shadow_item = $(`<span class="${SHADOW_SELECT_ITEM_CLASS}" title="删除">${h(name)}</span>`).appendTo($shadow_input);
			$shadow_item.data('value', val);
		});

		//插入占位符
		let placeholder = get_placeholder($select);
		if(current_val.length === 0 && placeholder) {
			add_placeholder($select);
		}
	};

	const init = function($el, param){
		let opt_count = get_options($el).length;
		param = $.extend(true, {
			with_search: opt_count > 7,
			as_grid: true,
			placeholder: get_placeholder($el),
			required: $el.attr('required'),
			multiple: $el.attr('multiple')
		}, param || {});

		if(!is_select($el) && !is_input_list($el)){
			throw "Select component only support input[list] or select";
		}
		init_panel($el, param);
	};
	return {
		nodeInit: init
	}
});