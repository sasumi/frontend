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
			var h = $sel.outerHeight()-4;
			var txt = $sel[0].options[$sel[0].selectedIndex].text;
			if(txt == place_holder){
				txt = '';
			}
			if($sel.attr('readonly') || $sel.attr('disabled')){
				return;
			}

			//Structure
			var $com = $('<div class="combo">' +
				'<input type="text" class="combo-txt-inp" value="'+$.trim(txt)+'" placeholder="'+place_holder+'" style="width:'+w+'px; height:'+h+'px; margin:2px 0 0 2px;"/>'+
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