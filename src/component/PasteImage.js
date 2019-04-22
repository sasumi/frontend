/**
 * Created by Christopher on 2018/1/22.
 * 粘贴图片
 */
define('ywj/PasteImage', function(require){
	require('ywj/resource/PasteImage.css');
	var $ = require('jquery');
	var util = require('ywj/util');
	var Msg = require('ywj/msg');
	var IV = require('ywj/imageviewer');
	var url = '/index.php/common/upload/pasteImage';

	var filterInput = function(event){
		if ( event.keyCode == 8 ) {
			deleteRangeImage();
			return false;
		}
		if ( !event.ctrlKey || event.keyCode != 86 ) {
			event.preventDefault();
			event.stopPropagation();
			return false;
		}
	};

	var pasteDeal = function(event){
		event.preventDefault();
		var item = event.originalEvent.clipboardData.items[0];
		var type = item.type.toString();
		var blob = null;
		if ( type == 'image/png' ) {
			blob = item.getAsFile();
			var reader = new FileReader();
			reader.onload = function(e){
				var base64_str = e.target.result;
				uploadImgFromPaste(base64_str);
			};
			reader.readAsDataURL(blob);

		} else {
			event.stopPropagation();
			Msg.showError('请粘贴图片');
			return false;
		}
	};

	var uploadImgFromPaste = function(img){
		var formData = new FormData();
		formData.append('image', img);
		formData.append('submission-type', 'paste');
		var xhr = new XMLHttpRequest();
		xhr.open('POST', url);
		xhr.onload = function(){
			if ( xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200 ) {
				try {
					var data = JSON.parse( xhr.responseText );
				} catch ( e ) {
					Msg.showError('图片上传失败');
					return false;
				}

				var img_html = "<a class='com-uploader-type-image' target='_blank' title='查看' href='"+ data.src +"' data-value='"+ data.value +"'><img src='"+ data.src +"' class='new-img' /></a>";
				var image_input = $('.image-input');
				var old = image_input.val() || ',';
				image_input.val(old + data.value + ',');

				insertImageRange(img_html);
			}
		};
		xhr.onerror = function(){
			Msg.showError('图片上传失败');
		};
		xhr.send(formData);
	};

	var insertImageRange = function(img){
		var selection = window.getSelection ? window.getSelection() : document.selection;
		var range = selection.createRange ? selection.createRange() : selection.getRangeAt(0);
		if (!window.getSelection) {
			range.pasteHTML(img);
			range.collapse(false);
			range.select();
		} else {
			range.collapse(false);
			var hasR = range.createContextualFragment(img);
			var hasR_lastChild = hasR.lastChild;
			range.insertNode(hasR);
			if (hasR_lastChild) {
				range.setEndAfter(hasR_lastChild);
				range.setStartAfter(hasR_lastChild)
			}
			selection.removeAllRanges();
			selection.addRange(range);
		}
	};

	var deleteRangeImage = function(){
		if ( $('.com-uploader-type-image').length == 0 ) {
			return true;
		}

		var selection = window.getSelection ? window.getSelection() : document.selection;
		var range = selection.createRange ? selection.createRange() : selection.getRangeAt(0);
		var image = $(range.startContainer).data('value');
		var input = $('.image-input');
		var old_value = input.val().toString();
		input.val( old_value.replace(','+ image +',', ',') );
		if ( input.val() == ',' ) {
			input.val(null);
			$('.img-paste').empty();
		}
	};

	return {
		nodeInit: function(editable){
			if ( $('.image-input').length == 0 ) {
				var input = '<input type="hidden" name="images" class="image-input">';
				$(editable).parent().append(input);
			}
			$(editable).addClass('img-paste');

			$(editable).on('paste', function(event){
				pasteDeal(event);

			}).on('keydown', function(event){
				filterInput(event);

			}).on('dblclick', 'a.com-uploader-type-image', function(){
				IV.init($(this), $('.img-paste a.com-uploader-type-image'));
				return false;
			});
		}
	};
});