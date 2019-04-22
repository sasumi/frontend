define('ywj/edit', function(require){
	var $ = require('jquery');
	var Msg = require('ywj/msg');
	var Net = require('ywj/net');
	var lang = require('lang/$G_LANGUAGE');

	var css =
		".ywj-edit-btn {display:none; position:absolute; z-index:11;}" +
		".ywj-edit-btn span {display:inline-block; text-transform:capitalize; text-align:center; opacity:0.4; padding:2px 8px; margin-left:-20px; line-height:20px; background-color:white; border:1px solid #ddd; border-radius:3px; cursor:pointer; box-shadow:1px 1px 8px #cecece;}" +
		".ywj-edit-btn span:hover {opacity:1;}";
	$('<style>' + css + '</style>').appendTo('head');

	var tm;
	var $btn;

	var show = function($node, e){
		clearTimeout(tm);
		if(!$btn){
			$btn = $('<div class="ywj-edit-btn"><span></span></div>').appendTo('body');
		}
		$btn.find('span').html(lang('双击编辑'));
		$btn.show();
		if(e){
			$btn.css({
				top: $node.offset().top + $node.outerHeight(),
				left: e.clientX
			});
		}
	}
	var hide = function(){
		if($btn){
			tm = setTimeout(function(){
				$btn.hide();
			}, 10);
		}
	}
	var fun_make_input = function($node, not_null){
		var txt = $node.text();
		var name = $node.data('name');
		var $parent = $node.parent();
		$node.css('display', 'none');
		var input_html = "<input class='txt' " +
			"data-name='" + name + "' " +
			"data-action='" + $node.data('action') + "'" +
			"data-origin='" + txt + "'" +
			"\>";
		$node.after(input_html);
		var $input = $parent.find("input[data-name='" + name + "']");
		if(not_null){
			$input.focus();
		}
		$input.val(txt);
		$parent.delegate("input[data-name='" + name + "']", "blur", function(){
			var $input = $(this);
			var name = $input.data('name');
			var txt = $input.data('origin');
			var value = $input.val();

			if(not_null && (txt == value || value == '')){
				$node.show();
				$input.remove();
				$parent.undelegate("blur");
				return false;
			}
			if(!not_null && value == ''){
				return false;
			}
			var url = $input.data('action');
			url += (url.indexOf('?') ? "&" : "?") + name + "=" + value;
			Net.get(url, {}, function(rsp){
				if(rsp.code){
					Msg.showError(rsp.message);
					return false;
				}else{
					Msg.show('操作成功', 'succ');
					setTimeout(function(){
						window.location.reload();
					}, 1000)
				}
			})
		});
	}

	return {
		nodeInit: function($node, param){
			if(!$node.text()){
				fun_make_input($node, false);
			}else{
				$node.addClass('content-copy-able')
				$node.hover(function(e){
					show($node, e)
				}, hide);
				$node.dblclick(function(){
					fun_make_input($node, true);
				});
			}

		}
	}
});