define('ywj/copy', function(require){
	var $ = require('jquery');
	var Util = require('ywj/util');
	var Tip = require('ywj/tip');
	var lang = require('lang/$G_LANGUAGE');

	var css =
		".ywj-copy-btn {display:none; position:absolute; z-index:11;}" +
		".ywj-copy-btn span {display:inline-block; text-transform:capitalize; text-align:center; opacity:0.4; padding:2px 8px; margin-left:-20px; line-height:20px; background-color:white; border:1px solid #ddd; border-radius:3px; cursor:pointer; box-shadow:1px 1px 8px #cecece;}" +
		".ywj-copy-btn span:hover {opacity:1;}";
	$('<style>'+css+'</style>').appendTo('head');

	var prompt_html = function(text){
		return '<div style="padding:5px;"><div style="color:gray; padding-bottom:0.5em;">'+lang('请按 Ctrl+C 复制')+'</div> <input type="text" class="txt" value="'+Util.htmlEscape(text)+'"/></div>';
	};

	var tip_html = function(text){
		return '<span style="color:green;">&#10004; '+lang('已复制')+'</span> <div style="color:gray; padding-left:1em;">'+Util.htmlEscape(Util.cutString(text, 20))+'</div>';
	};

	var tm;
	var $btn;
	var show = function($node, e, text){
		clearTimeout(tm);
		if(!$btn){
			$btn = $('<div class="ywj-copy-btn"><span></span></div>').appendTo('body');
			$btn.hover(function(){
				show($node, null, $btn.data('text'));
			}, hide);
			$btn.click(function(){
				Util.copy($(this).data('text'), true);
				$btn.find('span').html(lang('已复制'));
			});
		}
		$btn.find('span').html(lang('复制'));
		$btn.data('text', text).show();
		if(e){
			$btn.css({
				top: $node.offset().top + $node.outerHeight(),
				left: e.clientX
			});
		}
	};

	var hide = function(){
		if($btn){
			tm = setTimeout(function(){
				$btn.hide();
			}, 10);
		}
	};

	var bindContent = function($node, text){
		$node.hover(function(e){
			show($node, e, text);
		}, hide);
	};

	var bindButton = function($btn, text){
		$btn.click(function(){
			if(Util.copy(text)){
				Tip.show(tip_html(text), $btn, {timeout: 800});
			} else {
				var t = Tip.show(prompt_html(text), $btn, {closeBtn: true});
				t.getDom().find('input').select().focus();
			}
		});
	};

	return {
		nodeInit: function($node, param){
			if(param.text){
				bindButton($node, param.text);
			} else if($node.text()){
				bindContent($node, $node.text());
				$node.addClass('content-copy-able')
			}
		}
	}
});