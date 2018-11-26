define('temtop/supplier',function(require){
	require('temtop/resource/supplier.css');
	var lang = require('lang/$G_LANGUAGE');
	var Pop = require('ywj/popup');
	var Net = require('ywj/net');
	var SUPPLIER_URL = window['SUPPLIER_URL'];

	return {
		nodeInit: function($input, param){
			var readonly = $input.attr('readonly');
			var required = $input.attr('required');
			var disabled = $input.attr('disabled');
			$input.hide();

			var $con = $('<span class="supplier-selector"></span>').insertAfter($input);
			$input.appendTo($con);

			var $name = $('<input type="text" class="txt supplier-selector-name"/>').appendTo($con);
			$name.val(param.name)
				.attr('title', param.name)
				.attr('placeholder', $input.attr('placeholder') || '请选择供应商')
				.attr('required', required)
				.attr('disabled', disabled)
				.attr('readonly', readonly)
				.click(function(){return false})
				.keydown(function(){return false});

			if(readonly || disabled){
				return;
			}

			if(!SUPPLIER_URL){
				console.error('no SUPPLIER_URL config found');
				return;
			}

			var $sel = $('<span class="supplier-selector-sel"></span>').appendTo($con);
            var $address_id = $("#address_id");
			$sel.click(function(){
				var p = new Pop({
					title: lang('选择供应商'),
					content: {src: Net.mergeCgiUri(SUPPLIER_URL, {id:$input.val()})},
					width: 800
				});
				p.listen('onSuccess', function(id, name, days,profit,userid,type,addressList=''){
					$input.val(id);
					$name.val(name).attr('title', name);
                    $address_id.find('option').remove();
                    $address_id.append(addressList);
					if(param.supplier_days_fill){
						$(param.supplier_days_fill).val(days);
					}
					if(param.userupdatenode && $(param.userupdatenode).size()){
						$(param.userupdatenode).val(userid).trigger("change");
					}
					if(param.type && $(param.type).size()){
						$(param.type).val(type).trigger("change");
					}
				});
				p.show();
			});

			if(!required){
				var $cancel = $('<span class="supplier-selector-cancel"></span>').appendTo($con);
				$cancel.click(function(){
					$input.val('');
					$name.val('').attr('title', '');
				})
			}
		}
	}
});