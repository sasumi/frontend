define('ywj/Select', function(require){
	require('ywj/resource/Select.css');
	const $ = require('jquery');
	const _ = require('jquery/highlight');
	const Util = require('ywj/util');
	const h = Util.htmlEscape;
	const DATA_CHANGING_EVENT = 'com-select-changing';

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
	const OPTION_ITEM_HIGHLIGHT_CLASS = 'sel-hl';
	const OPTION_ITEM_CHECKED_CLASS = 'com-select-item-selected';
	const OPTION_ITEM_FOCUS_CLASS = 'com-select-item-focus';
	const OPTION_ITEM_DISABLED_CLASS = 'com-select-item-disabled';

	const is_input = ($el)=>{
		return $el[0].tagName === 'INPUT';
	};

	const is_select = ($el)=>{
		return $el[0].tagName === 'SELECT';
	};

	const get_values = ($el)=>{
		if(is_input($el)){
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

	const value_equal = (val1, val2)=>{
		return val1.toString().length === val2.toString().length && val1 == val2;
	};

	const get_values_map = ($el)=>{
		if(is_input($el)){
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

	const highlight = ($text_node, kw)=>{
		let txt = $text_node.text();
		//remove old highlight
		if($text_node.find('.'+OPTION_ITEM_HIGHLIGHT_CLASS).size()){
			$text_node.text($text_node.text());
		}
		if(!kw){
			return false;
		}
		let idx = txt.toLowerCase().indexOf(kw.toLowerCase());
		if(idx < 0){
			return false;
		}
		txt = txt.substring(0, idx)+`<span class="${OPTION_ITEM_HIGHLIGHT_CLASS}">${h(kw)}</span>`+txt.substring(idx+kw.length);
		$text_node.html(txt);
		return true;
	};

	/**
	 * 判断数据是否需要显示value，仅当value与label不一致情况才需要显示
	 * @param {Array} options
	 * @returns {boolean}
	 */
	const check_value_require_for_datalist = (options)=>{
		for(let k in options){
			if(!value_equal(options[k].label, options[k].value)){
				return true;
			}
		}
		return false;
	};

	const safe_trigger_change = ($el)=>{
		$el.data(DATA_CHANGING_EVENT, 1).triggerHandler('change');
		setTimeout(function(){
			$el.data(DATA_CHANGING_EVENT, 0);
		}, 0);
	};

	const safe_trigger_changing = ($el)=>{
		return $el.data(DATA_CHANGING_EVENT) === 1;
	};

	/**
	 * 如果是分组模式，格式为：[{label:lbl, options:options}, ...]
	 * 如果是普通模式，格式为：options: [{label:lbl, value:val}, {label:lbl, disabled:true}...]
	 * @param $el
	 * @param {Boolean} as_tile 是否平铺
	 */
	const get_options = ($el, as_tile)=>{
		let opts = [];

		if(is_input($el)){
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
		if(is_input($el)){
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

	const build_options = (options, show_value = false)=>{
		let html = `<dl>`;
		$.each(options, (k, opt)=>{
			if(opt.options){
				html += `<dt>${h(opt.label)}</dt>`;
				$.each(opt.options, (k, sub_opt)=>{
					html +=
						`<dd ${sub_opt.disabled ? '' : 'tabindex="0"'} class="${OPTION_ITEM_CLASS} ${sub_opt.disabled ? OPTION_ITEM_DISABLED_CLASS : ''}" data-value="${h(sub_opt.value)}">`+
							`<label>${h(sub_opt.label)}</label>`+
							(show_value ? `<var>${h(sub_opt.value)}</var>` : '')+
						`</dd>`;
				});
			} else {
				html +=
					`<dd ${opt.disabled ? '' : 'tabindex="0"'} class="${OPTION_ITEM_CLASS} ${opt.disabled ? OPTION_ITEM_DISABLED_CLASS : ''}" data-value="${h(opt.value)}">`+
						`<label>${h(opt.label)}</label>`+
						(show_value ? `<var>${h(opt.value)}</var>` : '')+
					`</dd>`;
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
			let k = 'com-select-timeout';
			clearTimeout($el.data(k));
			console.log($el.data(k));
			let tm = setTimeout(function(){
				$panel.hide();
			}, 50);
			$el.data(k, tm);
		}
	};

	const select_item = ($el, val, param) => {
		let $items = get_available_items($el);
		let $current_item = $items.filter(function(){return value_equal($(this).data('value'), val);});
		if(!param.multiple){
			$items.removeClass(OPTION_ITEM_CHECKED_CLASS);
		}
		$current_item.addClass(OPTION_ITEM_CHECKED_CLASS);

		let values = get_values_map($el);
		if(values[val] !== undefined){
			return;
		}

		if(is_select($el)){
			remove_placeholder($el);
			let $shadow_input = get_shadow_input($el);

			let options = get_options($el, true);
			let name = val;
			$.each(options, function(){
				if(value_equal(this.value, val)){
					name = this.label;
					return false;
				}
			});

			if(!param.multiple){
				$shadow_input.find('.'+SHADOW_SELECT_ITEM_CLASS).remove();
			}
			let $shadow_item = $(`<span class="${SHADOW_SELECT_ITEM_CLASS}" ${param.multiple ? 'title="删除"':''}>${h(name)}</span>`).appendTo($shadow_input);
			$shadow_item.data('value', val);
			$el.find('option').filter(function(){return value_equal(this.value, val);}).attr('selected', 'selected');
			safe_trigger_change($el);
		} else {
			$el.val(val);
			safe_trigger_change($el);
		}
	};

	const deselect_item = ($el, val, param)=>{
		let $items = get_available_items($el);
		let $current_item = $items.filter(function(){return value_equal($(this).data('value'), val);});

		//已经取消，节约性能
		if(!$current_item.hasClass(OPTION_ITEM_CHECKED_CLASS)){
			return;
		}

		$current_item.removeClass(OPTION_ITEM_CHECKED_CLASS);

		if(is_select($el)){
			$el.find('option').filter(function(){return value_equal(this.value, val);}).removeAttr('selected');
			let $shadow_input = get_shadow_input($el);
			$shadow_input.find('.'+SHADOW_SELECT_ITEM_CLASS).filter(function(){return value_equal($(this).data('value'), val);}).remove();
			let vs = get_values($el);
			if(!vs.length){
				add_placeholder($el);
			}
			return;
		}
		$el.val('');
		safe_trigger_change($el);
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

	const add_focus = ($item)=>{
		remove_all_focus($item.parent().children());
		$item.addClass(OPTION_ITEM_FOCUS_CLASS);
		Util.scrollTo($item, $item.parent());
	};

	const remove_all_focus = ($items)=>{
		$items.removeClass(OPTION_ITEM_FOCUS_CLASS);
	};

	const move_focus = ($el, up = false)=>{
		let $items = get_available_items($el);
		let $focus_item = $items.filter('.'+OPTION_ITEM_FOCUS_CLASS);
		if(!$focus_item.size()){
			return;
		}
		let idx = $focus_item.index();
		let match_idx_list = [];
		$items.find('.'+OPTION_ITEM_HIGHLIGHT_CLASS).each(function(){
			let $item = $(this).closest('.'+OPTION_ITEM_CLASS);
			let idx = $item.index();
			if(!Util.inArray(idx, match_idx_list)){
				match_idx_list.push($item.index());
			}
		});

		if(match_idx_list.length < 2){
			return;
		}

		let current = parseInt(Util.arrayIndex(match_idx_list, idx), 10);
		let next;
		if(top.debug){
			debugger;
		}
		if(!up){
			next = current === (match_idx_list.length-1) ? 0 : (current+1);
		} else {
			next = current === 0 ? (match_idx_list.length - 1) : (current-1);
		}
		add_focus($items.eq(match_idx_list[next]));
	};

	const search_label_value = ($el, param)=>{
		let kw = $.trim($el.val());
		let $items = get_available_items($el);
		let match_value = null;

		let $first_hl = null;
		let $first_match = null;

		//优先匹配value
		$items.each(function(){
			let $item = $(this);
			let $label = $item.find('label');
			let $var = $item.find('var');
			let label = $label.text();
			let value = $item.data('value');
			$item.removeClass(OPTION_ITEM_CHECKED_CLASS);
			if(highlight($var, kw)){
				if(!$first_hl){
					$first_hl = $item;
				}
			}
			if(match_value === null && kw.toLowerCase() === value.toLowerCase()){
				match_value = value;
				$first_match = $item;
				select_item($el, value, param);
			}
			if(highlight($label, kw)){
				if(!$first_hl){
					$first_hl = $item;
				}
			}
			if(match_value === null && kw.toLowerCase() === label.toLowerCase()){
				match_value = value;
				$first_match = $item;
				select_item($el, value, param);
			}
		});

		if($first_match){
			add_focus($first_match);
		} else if($first_hl){
			add_focus($first_hl);
		} else {
			remove_all_focus($items);
		}
		return match_value;
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
		if(is_input($el)){
			let hide_timer = null;
			let options = get_options($el, true);
			let show_value = check_value_require_for_datalist(options);
			let html =
				`<div class="${SELECT_CLASS} ${param.as_grid ? SELECT_AS_GRID_CLASS : ''}" id="${panel_id}" style="display:none;">` +
					`<div class="${PANEL_CLASS}">`+
						build_options(options, show_value) +
					`</div>`+
				`</div>`;
			$panel = $(html).insertAfter($el);
			$items = get_available_items($el);
			$el.removeAttr('list');

			let show = ()=>{
				if($panel.is(':visible')){
					return;
				}
				let pos = $el.offset();
				$panel.css({
					width: $el.outerWidth(),
					maxWidth: $el.outerWidth(),
					position: 'absolute',
					left: pos.left,
					top: pos.top + $el.outerHeight(),
				}).show();
				search_label_value($el, param);
			};

			let hide = ()=>{
				clearTimeout(hide_timer);
				hide_timer = setTimeout(()=>{
					$panel.hide();
				}, 100);
			};

			$el.on('focus click', show);
			$el.on('blur', hide);

			//searching
			$el.on('input keydown', (e)=>{
				if(safe_trigger_changing($el)){
					return;
				}
				show();
				if(e.type === 'keydown'){
					let $focus_item = $items.filter('.'+OPTION_ITEM_FOCUS_CLASS);
					$focus_item = $focus_item.size() ? $focus_item : null;

					switch(e.keyCode){
						case Util.KEYS.DOWN:
							$focus_item && move_focus($el, false);
							return;

						case Util.KEYS.UP:
							$focus_item && move_focus($el, true);
							return;

						case Util.KEYS.ENTER:
							//select focus
							if($focus_item){
								select_item($el, $focus_item.data('value'), param);
								hide();
								return false;
							}
							break;

						case Util.KEYS.ESC:
							hide();
							return false;
					}
				}
				search_label_value($el, param);
			});

			$el.on('keydoxxwn', (e)=>{


			});

			$body.click(function(e){
				if(!Util.contains($(e.target), $el, $panel)){
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
						build_options(options) +
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

			$shadow.on('click', () => {
				show_panel($el, param);
			});

			if(param.multiple){
				$shadow.delegate('.'+SHADOW_SELECT_ITEM_CLASS, 'click', function(e){
					deselect_item($el, $(this).data('value'), param);
					e.stopPropagation();
				});
			}

			$panel_wrap.delegate('.'+SHADOW_SELECT_CLEAN_CLASS, 'click', (e)=>{
				$items.filter('.'+OPTION_ITEM_CHECKED_CLASS).each(function(){
					deselect_item($el, $(this).data('value'), param);
				});
				e.stopPropagation();
			});

			$body.click(function(e){
				let contains = Util.contains($(e.target), $panel, $shadow);
				if(!contains){
					$panel.hide();
				}
			});
		}

		$items.click(function(e){
			let $this = $(this);
			let val = $this.data('value');
			let to_select = false;

			//单选
			if(!param.multiple){
				to_select = true;
			} else {
				to_select = !$this.hasClass(OPTION_ITEM_CHECKED_CLASS);
			}
			to_select ? select_item($el, val, param) : deselect_item($el, val, param);
			if(to_select && !param.multiple){
				hide_panel($el);
			}
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

	const update_select_to_shadow = ($select, param)=>{
		let $shadow_input = get_shadow_input($select);

		let map = get_values_map($select);
		let hits = false;
		let current_val = $select.val() || '';

		//填充数据
		$.each(map, (val, name)=>{
			hits = true;
			let $shadow_item = $(`<span class="${SHADOW_SELECT_ITEM_CLASS}" ${param.multiple ? 'title="删除"':''}>${h(name)}</span>`).appendTo($shadow_input);
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
		let multiple = $el.attr('multiple');
		param = $.extend(true, {
			with_search: opt_count > 7,
			as_grid: !!multiple,
			placeholder: get_placeholder($el),
			required: $el.attr('required'),
			multiple: multiple
		}, param || {});

		if(!is_select($el) && !is_input($el)){
			throw "Select component only support input[list] or select";
		}

		if(is_input($el)){
			let list_id = $el.attr('list');
			if(!list_id){
				throw "No list attribute found in element";
			}
			if(!$('#'+list_id).size()){
				throw "No relative list node found";
			}
		}

		init_panel($el, param);
	};
	return {
		nodeInit: init
	}
});