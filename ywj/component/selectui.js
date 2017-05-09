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