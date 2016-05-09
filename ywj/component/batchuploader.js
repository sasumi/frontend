/**
 * Created by Administrator on 2016/5/6.
 */
define('ywj/batchuploader', function(require){
	seajs.use('ywj/resource/batchuploader.css');

	var $ = require('jquery');
	var UP = require('ywj/uploader');

	var DRAG_ENTER_CLASS = 'batch-uploader-drag-enter';

	var UP_CONFIG = {
		UPLOAD_URL: window['UPLOAD_URL'],
		PROGRESS_URL: window['UPLOAD_PROGRESS_URL']
	};

	var delete_btn_html = '<span class="batch-uploader-delete-btn"></span>';
	var new_tab_html = '<li class="batch-uploader-add-new"><label><input type="file" name="files[]" multiple="multiple"/>'+delete_btn_html+'<span class="batch-uploader-add-new-btn"></span></label></li>';

	var on_uploading = function(percent){
		console.log('uploading');
	};

	var on_success = function(message, rsp){
		var $container = this.getVar('container').closest('ul').parent();
		for(var i=0; i<rsp.more.length; i++){
			add_new($container, rsp.more[i].value, rsp.more[i].src);
		}
		console.log('on_success');
	};

	var on_error = function(message){
		console.log('on_error');
	};

	var on_abort = function(){
		console.log('on_abort');
	};

	var on_delete = function(){
		console.log('delete');
	};

	var on_start = function(){
		console.log('onStart');
	};

	var add_new = function($container, value, src){
		value = value || '';
		src = src || '';
		var name = $container.data('name');
		var $new = $('<li>'+delete_btn_html+'<input type="hidden" name="'+name+'" value="'+value+'" data-src="'+src+'"></li>')
			.insertBefore($container.find('.batch-uploader-add-new'));
		var $inp = $new.find('input');
		console.log(UP_CONFIG);
		var u = new UP($inp, UP_CONFIG);
		bind_interface(u);
		return u;
	};

	var bind_interface = function(instance){
		$.each({
			'onUploading': on_uploading,
			'onSuccess': on_success,
			'onError': on_error,
			'onAbort': on_abort,
			'onStart': on_start,
			'onDelete': on_delete
		}, function(k, v){
			instance[k] = v;
		});
	};

	var stop_default = function(e){
		console.log('stop default', e.type);
		e.stopPropagation();
		e.preventDefault();
	};

	var BU = function(sel){
		var $container = $(sel);
		var $list = $("<ul>").appendTo($container);

		//multiple file upload require file name specified
		if(!$container.data('name')){
			throw("Multiple file name required");
		}

		$container.find('input').each(function(){
			var $inp = $(this);
			var $li = $('<li>'+delete_btn_html+'</li>').appendTo($list);
			$inp.appendTo($li);
			bind_interface(new UP($inp, UP_CONFIG));
		});

		$(new_tab_html).appendTo($list).find('input').change(function(){
			for(var i=0; i<this.files.length; i++){
				var u = add_new($container);
				var formData = new FormData();
				formData.append(this.name, this.files[i]);
				u.send(formData);
			}
		});

		$container.delegate('.batch-uploader-delete-btn', 'click', function(){
			$(this).closest('li').remove();
		});

		$container.on('drop', function(e){
			stop_default(e);
			var originalEvent = e.originalEvent;
			var fs = originalEvent.target.files || originalEvent.dataTransfer.files || [];
			if(fs.length){
				for(var i=0; i<fs.length; i++){
					var u = add_new($container);
					var formData = new FormData();
					formData.append('file[]', fs[i]);
					u.send(formData);
				}
			}
		});

		var ddHighlight = function(){
			$container.addClass(DRAG_ENTER_CLASS);
		};

		var ddDisHighLight = function(){
			$container.removeClass(DRAG_ENTER_CLASS);
		};

		$container.on('dragenter dragleave dragover', stop_default);
		$container.on('dragenter dragover', ddHighlight);
		$container.on('mouseout mouseup dragleave drop',ddDisHighLight);
	};

	BU.prototype.onSuccess = function(){};
	BU.prototype.onError = function(){};
	BU.prototype.onAllFinish = function(){};
	BU.prototype.onUploading = function(){};
	BU.prototype.onStart = function(){};

	return BU;
});