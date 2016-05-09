/**
 * placeholder效果
 */
define('ywj/placeholder', function(require){
	var $ = require('jquery');
	var bindFormSubmit = function(el){
		var p = el.parentsUntil('form');
		if(p){
			var form = p.parent();
			if(!form.data('placeholder-event-flag')){
				form.data('placeholder-event-flag', 1);

				form.submit(function(){
					$.each(form[0].elements, function(){
						var $this = $(this);
						var pl = $this.attr('placeholder');
						if(pl && pl == $this.val()){
							$this.val('');
						}
					});
				});
			}
		}
	};

	return function(el, normalClass, focusClass, emptyClass){
		el = $(el);
		if(el[0].type == 'password'){
			return;
		}

		normalClass = normalClass || '';
		focusClass = focusClass || '';
		emptyClass = emptyClass || '';

		var phTxt = el.attr('placeholder');
		if(!phTxt){
			console.warn('need placeholder attr');
			return;
		}
		el.on('focus', function(){
			el.removeClass(emptyClass).removeClass(normalClass).addClass(focusClass);
			if(el.val() == phTxt){
				el.val('');
			}
		});
		el.on('blur', function(){
			el.removeClass(emptyClass).removeClass(normalClass).removeClass(focusClass);
			if(el.val() == '' || el.val() == phTxt){
				el.val(phTxt);
				el.addClass(emptyClass);
			} else {
				el.addClass(normalClass);
			}
		});
		if(!el.val()){
			el.removeClass(normalClass).removeClass(focusClass).addClass(emptyClass);
			el.val(phTxt);
		}

		bindFormSubmit(el);
	};
});