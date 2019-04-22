define('ywj/number', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');
	var CLASS_INPUT = 'com-number-input';

	return {
		nodeInit: function($node){
			var change_able = !$node.attr('disabled') && !$node.attr('readonly');
			$node.addClass(CLASS_INPUT);
			var $dec = $('<span class="number-desc-btn"></span>').insertBefore($node);
			var $inc = $('<span class="number-inc-btn"></span>').insertAfter($node);
			var step = $node.attr('step') || 1;
				step = Util.isInt(step) ? parseInt(step, 10) : parseFloat(step);
			var max = $node.attr('max') || 0;
				max = Util.isInt(max) ? parseInt(max, 10) : parseFloat(max);
			var min = $node.attr('min') || 0;
				min = Util.isInt(min) ? parseInt(min, 10) : parseFloat(min);

			//limit min
			$node.change(function(){
				var val = $node.val();
				val = Util.isInt(val) ? parseInt(val, 10) : parseFloat(val);
				if(val < min){
					$node.val(min);
					return;
				}
				if(max && val > max){
					$node.val(max);
					return;
				}
			});

			$inc.click(function(){
				if(!change_able){
					return;
				}
				var val = $node.val();
				val = Util.isInt(val) ? parseInt(val, 10) : parseFloat(val);
				if(Math.round(step))
				if((max && (val < max)) || !max){
					$node.val(val+step).trigger('change');
				}
				return false;
			});
			$dec.click(function(){
				if(!change_able){
					return;
				}
				var val = $node.val();
				val = Util.isInt(val) ? parseInt(val, 10) : parseFloat(val);
				if(val > min){
					$node.val(val-step).trigger('change');
				}
				return false;
			});
		}
	};
});