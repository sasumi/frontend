define('ywj/qrcode', function(require){
	var $ = require('jquery');
	var Net = require('ywj/net');
	require('qrcode');

	var css = '.qrcode-section {' +
		'display: none;' +
		'background-color: #ffffff;' +
		'z-index: 10000;' +
		'position: absolute;' +
		'border:5px solid #dedede;' +
		'padding:2px;}';
	$('<style>' + css + '</style>').appendTo('head');

	var $section = $('<div class="qrcode-section"><div class="qrcode-canvas"></div></div>').appendTo('body');
	var $qrCode = $section.find('.qrcode-canvas');

	var fixHeight = 20;
	var fixWidth = 0;

	var border = $section.outerWidth(true) - $section.width();//border+padding+margin
	
	//计算X坐标，不超出父元素边框
	var getPosX = function(e, $node){
		var cx = e.clientX;
		var pl = $node.position().left;
		var ol = $node.offset().left;
		var nw = $node.outerWidth();
		var pw = $node.parent().outerWidth();
		var fw = fixWidth + size + border;
		if((pl + fw) < pw){
			return $node.offset().left + fixWidth;
		}else{
			return ol + nw - fw;
		}
	}

	var text, src, size;

	var showQrCode = function(){
		if(text != undefined && text != ''){
			$qrCode.qrcode({
				render: "canvas",
				width: size,
				height: size,
				text: text,
			});
			$section.show();
		}else if(src != undefined && src != ''){
			Net.get(src, {}, function(rsp){
				$qrCode.html('');
				console.log(rsp.data);
				if(rsp.code == 0){
					$qrCode.qrcode({
						render: "canvas",
						width: size,
						height: size,
						text: rsp.data,
					});
					$section.show();
				}
			});
		}else{
			return false;
		}
	}

	return {
		nodeInit: function($node){
			text = $node.data('text');
			src = $node.data('src');
			size = $node.data('qrcode-size');
			size = size ? size : 150;
			$node.hover(
				function(e){
					$qrCode.html('');
					$section.css({
						top: $node.offset().top + $node.outerHeight() + fixHeight,
						left: getPosX(e, $node)
					});
					showQrCode();
				},
				function(){
					$qrCode.html('');
					$section.hide();
				}
			);
		}
	}
});