define('temtop/distributor',function(require){
	require('temtop/resource/distributor.css');
	var lang = require('lang/$G_LANGUAGE');
	var Pop = require('ywj/popup');
	var Net = require('ywj/net');
	var DISTRIBUTOR_URL = window['DISTRIBUTOR_URL'];

	return {
		nodeInit: function($input, param){
			var readonly = $input.attr('readonly');
			var required = $input.attr('required');
			var disabled = $input.attr('disabled');
			$input.hide();
			var $con = $('<span class="distributor-selector"></span>').insertAfter($input);
			$input.appendTo($con);

			var $name = $('<input type="text" class="txt distributor-selector-name"/>').appendTo($con);
			$name.val(param.name)
				.attr('title', param.name)
				.attr('placeholder', $input.attr('placeholder') || '请选择库存归属')
				.attr('required', required)
				.attr('disabled', disabled)
				.attr('readonly', readonly)
				.click(function(){return false})
				.keydown(function(){return false});

			if(readonly || disabled){
				return;
			}

			if(!DISTRIBUTOR_URL){
				console.error('no DISTRIBUTOR_URL config found');
				return;
			}

			var $sel = $('<span class="distributor-selector-sel"></span>').appendTo($con);

			$sel.click(function(){
				var param_data = Net.parseParam( $input.data("param"));
				param_data['id'] = $input.val();
				var p = new Pop({
					title: lang('请选择分销商'),
					content: {src: Net.mergeCgiUri(DISTRIBUTOR_URL,param_data)},
					width: 800
				});
				p.listen('onSuccess', function(id, name, days,profit,userid){
					$input.val(id);
					$name.val(name).attr('title', name);
					if(param.distributor_days_fill){
						$(param.distributor_days_fill).val(days);
					}
					console.log(param.userupdatenode);
					console.log(userid);
					if(param.userupdatenode && $(param.userupdatenode).size()){
						$(param.userupdatenode).val(userid);
					}
				});
				p.show();
			});

			if(!required){
				var $cancel = $('<span class="distributor-selector-cancel"></span>').appendTo($con);
				$cancel.click(function(){
					$input.val('');
					$name.val('').attr('title', '');
				})
			}
		}
	}
});