define('ywj/Select', function(require){
	require('ywj/resource/Select.css');
	const $ = require('jquery');
	const Util = require('ywj/util');
	const h = Util.htmlEscape;
	const ch = Util.selectorEscape;

	//CSS类名定义
	const SHADOW_SELECT_CLASS = 'com-select-shadow';
	const SHADOW_SELECT_CLEAN_CLASS = 'com-select-shadow-clean';
	const SHADOW_SELECT_ITEM_CLASS = 'com-select-shadow-item';
	const SHADOW_SELECT_PLACEHOLDER = 'com-select-shadow-placeholder';

	const SELECT_CLASS = 'com-select';
	const SELECT_MULTIPLE_CLASS = 'com-select-multiple';
	const SELECT_AS_GRID_CLASS = 'com-select-grid';
	const PANEL_CLASS = 'com-select-panel';

	const PANEL_SELECT_BTN = 'com-select-panel-select-btn';
	const PANEL_SELECT_ALL = 'com-select-panel-select-all';
	const PANEL_SELECT_INVERSE = 'com-select-panel-select-inverse';

	const OPTION_ITEM_CLASS = 'com-select-item';
	const OPTION_ITEM_CHECKED_CLASS = 'com-select-item-selected';
	const OPTION_ITEM_DISABLED_CLASS = 'com-select-item-disabled';

	const is_input_list = ($node)=>{
		return $node[0].tagName === 'INPUT' && $node.attr('list');
	};

	const is_select = ($node)=>{
		return $node[0].tagName === 'SELECT';
	};

	const get_values = ($node)=>{
		if(is_input_list($node)){
			return [$node.val()];
		}
		let values = [];
		$node.find('option').each(function(){
			if($(this).attr('selected')){
				values.push(this.value);
			}
		});
		return values;
	};

	const get_values_map = ($node)=>{
		if(is_input_list($node)){
			let val = $node.val();
			let obj = {};
			if(val){
				obj[val] = val;
			}
			return obj;
		}
		let map = {};
		$node.find('option').each(function(){
			if(this.selected && this.value.length){
				map[this.value] = $(this).text();
			}
		});
		return map;
	};

	/**
	 * 如果是分组模式，格式为：[{label:lbl, options:options}, ...]
	 * 如果是普通模式，格式为：options: [{label:lbl, value:val}, {label:lbl, disabled:true}...]
	 * @param $node
	 */
	const get_options = ($node)=>{
		let opts = [];

		if(is_input_list($node)){
			let list_id = $node.attr('list');
			$('datalist#'+list_id).find('option').each(function(){
				let val = $(this).attr('value');
				let label = $(this).attr('label') || val;
				opts.push({label: label, value: val});
			});
		}
		if(is_select($node)){
			$node.children().each(function(idx, option){
				if(option.tagName === 'OPTION'){
					//is placeholder
					if(idx === 0 && option.value.length === 0){
						return;
					}
					opts.push({label: $(option).text(), value: option.value, disabled: option.disabled});
				}else if(option.tagName === 'OPTGROUP'){
					let group_label = $(option).attr('label');
					let sub_opts = [];
					$(option).children().each(function(k, sub_opt){
						sub_opts.push({label: $(sub_opt).text(), value: sub_opt.value, disabled: sub_opt.disabled});
					});
					opts.push({label: group_label, options: sub_opts});
				}
			});
		}
		return opts;
	};

	/**
	 * get $node placeholder text
	 * @param $node
	 * @returns {string|*|string}
	 */
	const get_placeholder = ($node)=>{
		if(is_input_list($node)){
			return $node.attr('placeholder') || '';
		}
		if(is_select($node)){
			if($node.data('placeholder')){
				return $node.data('placeholder');
			}
			let $first_option = $node.find('option:first');
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

	const update_to_panel = ($node)=>{
		let values = get_values($node),
			$panel = get_panel($node);
		$panel.find('.' + OPTION_ITEM_CLASS).each(function(){
			let hit = Util.inArray($(this).data('value'), values);
			$(this)[hit ? 'addClass' : 'removeClass'](OPTION_ITEM_CHECKED_CLASS);
		});
	};

	const update_to_node = ($node) => {
		let $panel = get_panel($node);
		let $options = $panel.find('.'+OPTION_ITEM_CHECKED_CLASS);
	};

	/**
	 * 获取面板
	 * @param $node
	 * @returns {jQuery|HTMLElement|null}
	 */
	const get_panel = ($node)=>{
		let id = $node.data('select-panel-id');
		if(!id){
			return null;
		}
		return $('#'+id);
	};

	const get_available_items = ($node)=>{
		let $panel = get_panel($node);
		return $panel.find('.'+OPTION_ITEM_CLASS).not('.'+OPTION_ITEM_DISABLED_CLASS);
	};

	const get_shadow_input = ($node)=>{
		let $panel = get_panel($node);
		if($panel){
			return $panel.closest('.'+SELECT_CLASS).find('.'+SHADOW_SELECT_CLASS);
		}
		return null;
	};

	/**
	 * 高亮搜索结果
	 * @param $node
	 * @param kw
	 */
	const highlight = ($node, kw)=>{
		let $panel = get_panel($node);

	};

	/**
	 * 显示（构建、绑定事件）面板
	 * @param $node
	 * @param param
	 */
	const show_panel = ($node, param)=>{
		let $panel = get_panel($node);
		if(!$panel){
			return;
		}
		$panel.show().find('input:first').focus();
	};

	/**
	 * 隐藏面板
	 * @param $node
	 */
	const hide_panel = ($node)=>{
		let $panel = get_panel($node);
		if($panel){
			$panel.find('dl').hide();
		}
	};

	const select_item = ($node, val, param) => {
		let $items = get_available_items($node);
		let $current_item = $items.filter('[data-value="'+ch(val)+'"]');
		let values = get_values($node);
		if(is_select($node)){
			if(param.multiple && !Util.inArray(val, values)){
				$current_item.addClass(OPTION_ITEM_CHECKED_CLASS);
				$node.find('option[value="'+ch(val)+'"]').attr('checked', 'checked');
				$node.triggerHandler('change');
				return;
			}
			remove_placeholder($node);
		}
		$items.removeClass(OPTION_ITEM_CHECKED_CLASS);
		$current_item.addClass(OPTION_ITEM_CHECKED_CLASS);
		$node.val(val).triggerHandler('change');
	};

	const deselect_item = ($node, val, param)=>{
		let $panel = get_panel($node);
		let $items = get_available_items($node);
		let $current_item = $items.filter('[data-value="'+ch(val)+'"]');
		$current_item.removeClass(OPTION_ITEM_CHECKED_CLASS);
		if(is_select($node)){
			$node.find('option[value="'+ch(val)+'"]').removeAttr('checked');
			let vs = get_values($node);
			if(!vs.length){
				add_placeholder($node);
			}
			return;
		}

		$node.val('').triggerHandler('change');
	};

	const remove_placeholder = ($node)=>{
		let $shadow_input = get_shadow_input($node);
		$shadow_input.find('.'+SHADOW_SELECT_PLACEHOLDER).remove();
	};

	const add_placeholder = ($select) => {
		let placeholder = get_placeholder($select);
		if(!placeholder){
			return;
		}
		let $shadow_input = get_shadow_input($select);
		$(`<span class="${SHADOW_SELECT_PLACEHOLDER}">${h(placeholder)}</span>`).appendTo($shadow_input);
	};

	const init_panel = ($node, param)=>{
		let $body = $('body');
		let options = get_options($node);
		if(!options.length){
			return;
		}
		let panel_id = 'select-panel-'+Util.guid();
		$node.data('select-panel-id', panel_id);
		let $panel, $items;

		//text模式，禁用多选、搜索
		if(is_input_list($node)){
			let html =
				`<div class="${SELECT_CLASS} ${param.as_grid ? SELECT_AS_GRID_CLASS : ''}" id="${panel_id}" style="display:none;">` +
					`<div class="${PANEL_CLASS}">`+
						build_options(options, param.multiple) +
					`</div>`+
				`</div>`;
			$panel = $(html).insertAfter($node);
			$items = get_available_items($node);
			$node.removeAttr('list');
			$node.on('focus', ()=>{
				let pos = $node.offset();
				$panel.css({
					width: $node.outerWidth(),
					position: 'absolute',
					left: pos.left,
					top: pos.top + $node.outerHeight(),
				}).show();
			});
			$body.click(function(e){
				if(e.target !== $node[0] && e.target !== $panel[0] && !$.contains($panel[0], e.target)){
					$panel.hide();
				}
			});
		}

		//select 模式
		else {
			let html =
				`<div class="${SELECT_CLASS} ${param.as_grid ? SELECT_AS_GRID_CLASS : ''} ${param.multiple ? '' + SELECT_MULTIPLE_CLASS : ''}">` +
					`<span class="${SHADOW_SELECT_CLASS}" tabindex="0">`+
						`<span class="${SHADOW_SELECT_CLEAN_CLASS}" tabindex="0"></span>`+
					`</span>`+
					`<div class="${PANEL_CLASS}" style="display:none;" id="${panel_id}">`+
						(param.multiple ? `<span class="${PANEL_SELECT_BTN} ${PANEL_SELECT_INVERSE}"></span> <span class="${PANEL_SELECT_BTN} ${PANEL_SELECT_ALL}"></span>` : '')+
						(param.with_search ? `<input type="search" placeholder="请输入搜索">` : '')+
						build_options(options, param.multiple) +
					`</div>`+
				`</div>`;
			let $panel_wrap = $(html).insertAfter($node);
			let $shadow = $panel_wrap.find('.'+SHADOW_SELECT_CLASS);

			update_select_to_shadow($node, param);

			$panel = get_panel($node);
			$items = get_available_items($node);

			$shadow.on('click focus', () => {
				show_panel($node);
			});
			$shadow.find('.'+SHADOW_SELECT_ITEM_CLASS).click(function(){
				deselect_item($node, $(this).data('value'), param);
			});

			$panel_wrap.find('.'+SHADOW_SELECT_CLEAN_CLASS).click(()=>{
				$items.each(function(){
					deselect_item($node, $(this).data('value'), param);
				});
				return false;
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

		$items.click(function(){
			let $this = $(this);
			let val = $this.data('value');

			if(param.multiple){
				let to_select = !$this.hasClass(OPTION_ITEM_CHECKED_CLASS);
				to_select ? select_item($node, val, param) : deselect_item($node, val, param);
			} else {
				select_item($node, val, param);
			}
		});

		$panel.find('.'+PANEL_SELECT_ALL).click(function(){
			$items.each(function(){
				select_item($(this), $(this).data('value'), param);
			});
		});

		$panel.find('.'+PANEL_SELECT_INVERSE).click(function(){
			$items.each(function(){
				let $this = $(this);
				let val = $this.data('value');
				let to_select = !$this.hasClass(OPTION_ITEM_CHECKED_CLASS);
				to_select ? select_item($node, val, param) : deselect_item($node, val, param);
			});
		});

		update_to_panel($node);
	};

	const init_input = ($node, param)=>{
		$node.on('focus click', () => {
			return show_panel($node, param);
		});
		$node.on('keyup', function(e){
			if(e.keyCode === Util.KEYS.ESC){
				hide_panel($node);
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
			$(`<span class="${SHADOW_SELECT_ITEM_CLASS}" data-value="${h(val)}">${h(name)}</span>`).appendTo($shadow_input);
		});

		debugger;
		//插入占位符
		let placeholder = get_placeholder($select);
		if(current_val.length === 0 && placeholder) {
			add_placeholder($select);
		}
	};

	const init = function($node, param){
		let opt_count = get_options($node).length;
		param = $.extend(true, {
			with_search: opt_count > 7,
			as_grid: true,
			placeholder: get_placeholder($node),
			multiple: $node.attr('multiple')
		}, param || {});

		if(!is_select($node) && !is_input_list($node)){
			throw "Select component only support input[list] or select";
		}
		init_panel($node, param);
	};
	return {
		nodeInit: init
	}
});