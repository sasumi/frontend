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