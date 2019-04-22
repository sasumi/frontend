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