/**
 * Created by Sasumi on 2016/3/16.
 */
define('ywj/selectcombo', function(require){
	var $ = require('jquery');
	var util = require('ywj/util');

	var msg_css_url = seajs.resolve('ywj/resource/selectcombox.css');
	var MATCH_ITEM_CLASS = 'combox-match';
	$('head', document).append('<link rel="stylesheet" type="text/css" href="'+msg_css_url+'"/>');

	var highlight = function(data, search){
		return data.replace(new RegExp("("+util.pregQuote(search)+")",'gi'),"<b>$1</b>");
	};

	return function(sel){
		var $sel = $(sel);
		var required = $sel.attr('required');
		var place_holder = $sel[0].options[0].value == '' ? $sel[0].options[0].text : '';
		var w = $sel.outerWidth()-10;
		var h = $sel.outerHeight()-4;
		var txt = $sel[0].options[$sel[0].selectedIndex].text;
		if(txt == place_holder){
			txt = '';
		}

		//Structure
		var $com = $('<div class="combox">' +
			'<input type="text" class="combox-txt-inp" value="'+txt+'" placeholder="'+place_holder+'" style="width:'+w+'px; height:'+h+'px; margin:2px 0 0 2px;"/>'+
			'<span class="combox-trigger"></span>'+
			'<ul></ul>'+
			'</div>').insertBefore($sel);
		var $inp = $com.find('input');
		var $ul = $com.find('ul');
		var $trigger = $com.find('.combox-trigger');
		$sel.insertBefore($trigger);

		//search
		var search = function(txt){
			txt = $.trim(txt);
			$ul.find('li').each(function(){
				var $li = $(this);
				$li.removeClass(MATCH_ITEM_CLASS);
				$li.html($li.data('txt'));
			});
			if(!txt){
				return;
			}
			$ul.show();
			console.log('search', 'ul.show');
			var $first_match_li = null;
			$ul.find('li').each(function(){
				var $li = $(this);
				var t = $li.text();
				if(t.toLowerCase().indexOf(txt.toLocaleLowerCase()) >= 0){
					$li.addClass(MATCH_ITEM_CLASS);
					$li.html(highlight(t, txt));
					if(!$first_match_li){
						$first_match_li = $li;
					}
				}
			});
			if($first_match_li){
				var st = $first_match_li.index()*$first_match_li.outerHeight();
				$ul.scrollTop(st);
			}
		};

		//select
		var select = function($li){
			var val = $li.data('val');
			txt = $li.data('txt');
			$sel.val(val);
			$inp.val(txt);
			$ul.find('li').removeClass(MATCH_ITEM_CLASS);
			$ul.hide();
		};

		//flush search result
		var flush = function(){
			//alread input some text
			if($inp.val()){
				var $f = $ul.find('li.'+MATCH_ITEM_CLASS+':first');
				var txt = '';
				if($f.size()){
					select($f);
				} else {
					txt = $sel[0].options[$sel[0].selectedIndex].text;
					txt = txt == place_holder ? '' : txt;
					$inp.val(txt);
				}
			}
			//empty input, use default
			else {
				txt = $sel[0].options[0].text;
				txt = txt == place_holder ? '' : txt;
				$inp.val(txt);
				$sel[0].selectedIndex = 0;
			}
		};

		//build structure
		var ul_html = '';
		$sel.children().each(function(){
			if(this.tagName == 'OPTION'){
				ul_html += '<li data-val="'+util.htmlEscape(this.value)+'" data-txt="'+util.htmlEscape(this.text)+'">'+util.htmlEscape(this.text)+'</li>';
			} else {
				ul_html += '<li class="combox-group-label">'+util.htmlEscape(this.label)+'</li>';
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
		$trigger.click(function(){$ul.show();});

		$ul.delegate('li', 'click', function(){
			if(!$(this).hasClass('combox-group-label')){
				select($(this));
			}
		});

		$inp.keydown(function(e){
			if(e.keyCode == 13){
				var $first = $ul.find('li.'+MATCH_ITEM_CLASS+':first');
				if($first.size()){
					select($first);
					return false;
				}
			}
		});

		$.each(['keyup', 'mouseup', 'change'], function(k, v){
			$inp[v](function(){
				console.log('input event:',v, 'ul.show');
				$ul.show();
			});
		});
		$.each(['keyup', 'change', 'mouseup'], function(k, v){
			$inp[v](function(ev){
				if(v == 'keyup' && ev.keyCode == 13){
					console.log('keyup', ev.keyCode);
					$ul.hide();
				} else {
					search(this.value);
				}
			});
		});

		$('body').click(function(event){
			if(top.debug){
				debugger;
			}
			var tag = event.target;
			if($com[0] == tag || $.contains($com[0], tag)){
				//click inside
			} else {
				flush();
				$ul.hide();
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
	};
});