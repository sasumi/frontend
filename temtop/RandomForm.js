define('temtop/RandomForm',function(require){
	var r_str = function(length){
		length = length || Math.ceil(3+Math.random()*10);
		var consonants = 'bcdfghjklmnpqrstvwxyz'.split(''),
			vowels = 'aeiou'.split(''),
			rand = function(limit) {
				return Math.floor(Math.random()*limit);
			},
			i, word='';
		for (i=0;i<length/2;i++) {
			var randConsonant = consonants[rand(consonants.length)],
				randVowel = vowels[rand(vowels.length)];
			word += (i===0) ? randConsonant.toUpperCase() : randConsonant;
			word += i*2<length-1 ? randVowel : '';
		}
		return word;
	};

	var r_word = function(count, word_length){
		count = count || Math.floor(1+Math.random()*2);
		var sen = [];
		for(var i=0; i<count; i++){
			sen.push(r_str(word_length));
		}
		return sen.join(' ');
	};

	var r_num = function(){
		return Math.ceil(3+Math.random()*20);
	};

	var check = function($el){
		if($el.attr('disabled') ||
			$el.attr('readonly') ||
			!$el.attr('name') ||
			$el.attr('type') == 'hidden' ||
			$el.attr('type') == 'button' ||
			$el.attr('type') == 'submit' ||
			$el.type == 'file'){
			return false;
		}
		return true;
	};

	var str_pad = function(str, pad_len, pad_str, pad_right){
		str = str + '';
		var off = pad_len - str.length;
		if(off > 0){
			for(var i=0; i<off; i++){
				if(!pad_right){
					str = pad_str + str;
				} else {
					str = str + pad_str;
				}
			}
		}
		return str;
	};

	var _fill_ = function($form, required_only){
		$form.find(':input').each(function(){
			var $el = $(this);
			if(!check($el)){
				return;
			}
			if(required_only && !$el.attr('required')){
				return;
			}

			if($el.hasClass('date-time-txt')){
				var dobj = new Date((new Date()).getTime()+Math.floor(86400000*30*Math.random()));
				$el.val(dobj.getUTCFullYear()+'-'+str_pad(dobj.getMonth(), 2, '0')+'-'+str_pad(dobj.getUTCDate(), 2, '0')+' '
					+str_pad(dobj.getUTCHours(), 2, '0')+':'+str_pad(dobj.getUTCMinutes(), 2, '0')+':'+str_pad(dobj.getUTCSeconds(), 2, '0'));
			}
			else if($el.hasClass('date-txt')){
				var dobj = new Date((new Date()).getTime()+Math.floor(86400000*30*Math.random()));
				$el.val(dobj.getUTCFullYear()+'-'+str_pad(dobj.getMonth(), 2, '0')+'-'+str_pad(dobj.getUTCDate(), 2, '0'));
			}
			else if($el.attr('type') == 'text'){
				$el.val(r_word());
			} else if($el.attr('type') == 'number'){
				$el.val(r_num());
			} else if($el[0].nodeName == 'TEXTAREA'){
				var c = Math.ceil(8+Math.random()*20);
				$el.val(r_word(c));
			} else if($el[0].type == 'checkbox'){
				$el.attr('checked', Math.floor(Math.random()-0.5) ? true : false);
			} else if($el[0].nodeName == 'SELECT'){
				$el[0].selectedIndex = Math.floor(Math.random()*$el.find('option').size());
			}
			else if($el[0].type == 'email'){
				$el.val((r_word(1)+'@'+r_word(1)+'.com').toLowerCase());
			}
			else if($el[0].type == 'url'){
				$el.val('http://www.'+(r_word(1)+''+r_word(1)+'.com/').toLowerCase());
			}
			$el.trigger('change');
		});
	};

	return function(form){
		var $body = $('body');
		$(form).each(function(){
			var $frm = $(this);
			var enable = false;
			$frm.find(':input').each(function(){
				if(check($(this))){
					enable = true;
					return false;
				}
			});
			if(!enable){
				return;
			}

			var $div = $('<div style="opacity:0.2; position:absolute; z-index:1;"></div>').insertBefore($frm.children(':first'));
			$div.hover(function(){$div.stop().animate({'opacity':'1'});}, function(){$div.stop().animate({'opacity':0.2});});
			var start_move = false;

			var $for_all = $('<span class="btn btn-weak" style="margin:0 2px 2px; color:orange"><i class="fa fa-list-ul"></i> All</span>').appendTo($div);
			var $for_require_btn = $('<span class="btn btn-weak" style="margin:0 2px 2px; color:orange"><i class="fa fa-star"></i> Required</span>').appendTo($div);
			var $reset = $('<span class="btn btn-weak" style="margin:0 2px 2px; color:orange;"><i class="fa fa-rotate-left"></i> Reset</span>').appendTo($div);
			$div.css('left', $frm.offset().left + $frm.outerWidth() - $div.outerWidth());

			var moving = false;
			var offset = [];
			var last_mouse_pos = [];
			var last_div_pos = [];
			$div.mousedown(function(e){
				last_mouse_pos = [e.clientX, e.clientY];
				var tmp = $div.offset();
				last_div_pos = [tmp.left, tmp.top];
				start_move = true;
				return false;
			});
			$body.mouseup(function(e){
				start_move = false;
			});
			$body.mousemove(function(e){
				if(start_move){
					offset[0] = e.clientX - last_mouse_pos[0];
					offset[1] = e.clientY - last_mouse_pos[1];

					if((Math.abs(offset[0]) < 2) && (Math.abs(offset[1]) < 2)){
						moving = false;
					} else {
						moving = true;
					}
					$div.css({
						left: last_div_pos[0]+offset[0],
						top: last_div_pos[1]+offset[1]
					});
					return false;
				}
			});
			$body.click(function(){
				moving = false;
			});

			$for_all.click(function(){
				if(!moving){
					_fill_($frm);
				}
				return false;
			});
			$for_require_btn.click(function(){
				if(!moving){
					$frm[0].reset();
					_fill_($frm, true);
				}
				return false;
			});
			$reset.click(function(){
				if(!moving){
					$frm[0].reset();
				}
				return false;
			})
		})
	};
});