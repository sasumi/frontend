define('ywj/InputSelect', function(require){
	require('ywj/resource/Select.css');
	const $ = require('jquery');
	const Util = require('ywj/util');
	const h = Util.htmlEscape;
	const DATA_CHANGING_EVENT = 'com-select-changing';

	//CSS类名定义
	const SELECT_CLASS = 'com-select';
	const SELECT_AS_GRID_CLASS = 'com-select-grid';

	const PANEL_CLASS = 'com-select-panel';

	const OPTION_ITEM_CLASS = 'com-select-item';
	const OPTION_ITEM_HIGHLIGHT_CLASS = 'sel-hl';
	const OPTION_ITEM_CHECKED_CLASS = 'com-select-item-selected';
	const OPTION_ITEM_FOCUS_CLASS = 'com-select-item-focus';

	const is_input = ($input)=>{
		return $input[0].tagName === 'INPUT';
	};

	const value_equal = (val1, val2)=>{
		return val1.toString().length === val2.toString().length && val1 == val2;
	};

	const get_values_map = ($input)=>{
		let val = $input.val();
		let obj = {};
		if(val){
			obj[val] = val;
		}
		return obj;
	};

	const highlight = ($text_node, kw)=>{
		let txt = $text_node.text();
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
		txt = txt.substring(0, idx)+`<span class="${OPTION_ITEM_HIGHLIGHT_CLASS}">${h(txt.substring(idx, kw.length))}</span>`+txt.substring(idx+kw.length);
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

	const safe_trigger_change = ($input)=>{
		$input.data(DATA_CHANGING_EVENT, 1).triggerHandler('change');
		setTimeout(function(){
			$input.data(DATA_CHANGING_EVENT, 0);
		}, 0);
	};

	const safe_trigger_changing = ($input)=>{
		return $input.data(DATA_CHANGING_EVENT) === 1;
	};

	/**
	 * 获取面板
	 * @param $input
	 * @param {Object} param
	 * @param {Boolean} auto_create
	 * @returns {jQuery|null}
	 */
	const get_panel = ($input, param = {}, auto_create) => {
		let id = $input.data('select-panel-id');
		if(id){
			return $('#'+id);
		}
		if(auto_create){
			let panel_id = 'select-panel-'+Util.guid();
			$input.data('select-panel-id', panel_id);
			let show_label = check_value_require_for_datalist(param.options);
			let option_html = `<dl>`;
			$.each(param.options, (k, opt)=>{
				let $chk_class = opt.value === $input.val() ? OPTION_ITEM_CHECKED_CLASS : '';
				option_html +=
					`<dd tabindex="0" class="${OPTION_ITEM_CLASS} ${$chk_class}" data-value="${h(opt.value)}">`+
					`<var>${h(opt.value)}</var>`+
					(show_label ? `<label>${h(opt.label)}</label>` : '')+
					`</dd>`;
			});

			let html =
				`<div class="${SELECT_CLASS} ${param.as_grid ? SELECT_AS_GRID_CLASS : ''}" id="${panel_id}" style="display:none;">` +
					`<div class="${PANEL_CLASS}">${option_html}</div>`+
				`</div>`;
			let $panel = $(html).insertAfter($input);
			let $items = $panel.find('.'+OPTION_ITEM_CLASS);

			$items.click(function(e){
				let $this = $(this);
				let val = $this.data('value');
				select_item($input, val, param);
				hide_panel($input);
			});
			return $panel;
		}
		return null;
	};

	const get_available_items = ($input, param)=>{
		let $panel = get_panel($input, param, true);
		return $panel.find('.'+OPTION_ITEM_CLASS);
	};

	/**
	 * 隐藏面板
	 * @param $input
	 */
	const hide_panel = ($input)=>{
		let $panel = get_panel($input);
		if($panel){
			let k = 'com-select-timeout';
			clearTimeout($input.data(k));
			let tm = setTimeout(function(){
				$panel.hide();
			}, 50);
			$input.data(k, tm);
		}
	};

	const select_item = ($input, val, param) => {
		let $items = get_available_items($input, param);
		let $current_item = $items.filter(function(){
			return value_equal($(this).data('value'), val);
		});
		$items.removeClass(OPTION_ITEM_CHECKED_CLASS);
		$current_item.addClass(OPTION_ITEM_CHECKED_CLASS);

		let values = get_values_map($input);
		if(values[val] !== undefined){
			return;
		}
		$input.val(val);
		safe_trigger_change($input);
	};

	const add_focus = ($item)=>{
		remove_all_focus($item.parent().children());
		$item.addClass(OPTION_ITEM_FOCUS_CLASS);
		Util.scrollTo($item, $item.parent());
	};

	const remove_all_focus = ($items)=>{
		$items.removeClass(OPTION_ITEM_FOCUS_CLASS);
	};

	const move_focus = ($input, up = false)=>{
		let $items = get_available_items($input);
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
		if(!up){
			next = current === (match_idx_list.length-1) ? 0 : (current+1);
		} else {
			next = current === 0 ? (match_idx_list.length - 1) : (current-1);
		}
		add_focus($items.eq(match_idx_list[next]));
	};

	const search_label_value = ($input)=>{
		let kw = $.trim($input.val());
		let $items = get_available_items($input);
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
				select_item($input, value);
			}
			if(highlight($label, kw)){
				if(!$first_hl){
					$first_hl = $item;
				}
			}
			if(match_value === null && kw.toLowerCase() === label.toLowerCase()){
				match_value = value;
				$first_match = $item;
				select_item($input, value);
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

	const show = ($input, param)=>{
		let $panel = get_panel($input, param, true);
		if($panel.is(':visible')){
			return;
		}
		let pos = $input.offset();
		$panel.css({
			width: $input.outerWidth(),
			maxWidth: $input.outerWidth(),
			position: 'absolute',
			left: pos.left,
			top: pos.top + $input.outerHeight(),
		}).show();
		search_label_value($input);
	};

	const init = function($input, param){
		if(!is_input($input)){
			throw "Select component only support input[list] or select";
		}

		let list_id = $input.attr('list');
		if(!list_id){
			throw "No list attribute found in element";
		}

		if(!$('#'+list_id).size()){
			throw "No relative list node found";
		}
		//remove default list binding
		$input.removeAttr('list');

		param = $.extend(true, {
			as_grid: false,
			options: null,
			required: $input.attr('required')
		}, param || {});

		//resolve bind data list options
		if(param.options === null){
			let default_options = [];
			$('datalist#'+list_id).find('option').each(function(){
				let val = $(this).attr('value');
				let label = $(this).attr('label') || val;
				default_options.push({label: label, value: val});
			});
			param.options = default_options;
		}

		if(!param.options.length){
			throw "No options found";
		}

		$input.on('focus', ()=>{
			show($input, param);
		});

		$input.on('blur', ()=>{
			hide_panel($input);
		});

		$input.on('input', (e)=>{
			if(safe_trigger_changing($input)){
				return;
			}
			show($input, param);
			search_label_value($input);
		});

		//searching
		$input.on('keydown', (e)=>{
			if(safe_trigger_changing($input)){
				return;
			}
			let $items = get_available_items($input);
			let $focus_item = $items.filter('.'+OPTION_ITEM_FOCUS_CLASS);
			$focus_item = $focus_item.size() ? $focus_item : null;

			switch(e.keyCode){
				case Util.KEYS.DOWN:
					show($input, param);
					$focus_item && move_focus($input, false);
					return;

				case Util.KEYS.UP:
					show($input, param);
					$focus_item && move_focus($input, true);
					return;

				case Util.KEYS.ENTER:
					if($focus_item && $focus_item.is(':visible')){
						select_item($input, $focus_item.data('value'));
						hide_panel($input);
						return false;
					}
					return;

				case Util.KEYS.ESC:
					hide_panel($input);
					return false;

				default:
					show($input, param);
			}
			search_label_value($input);
		});

		$('body').click(function(e){
			let $panel = get_panel($input);
			if($panel && !Util.contains($(e.target), $input, $panel)){
				$panel.hide();
			}
		});
	};
	return {
		nodeInit: init,
		show: show,
		hide: hide_panel,
	}
});