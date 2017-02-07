/**
 * Created by Administrator on 2016/5/6.
 */
define('ywj/batchuploader', function(require){
	seajs.use('ywj/resource/batchuploader.css');
	var console = window['console'];

	var $ = require('jquery');
	var Util = require('ywj/util');
	var UP = require('ywj/uploader');

	var DRAG_ENTER_CLASS = 'batch-uploader-drag-enter';
	var UP_CONFIG = {
		UPLOAD_URL: window['UPLOAD_URL'],
		PROGRESS_URL: window['UPLOAD_PROGRESS_URL']
	};

	var delete_btn_html = '<span class="batch-uploader-delete-btn"></span>';
	var new_tab_html = '<li class="batch-uploader-add-new"><label><input type="file" name="files[]" multiple="multiple"/>'+delete_btn_html+'<span class="batch-uploader-add-new-btn"></span></label></li>';

	var on_item_uploading = function(u, percent){
		this.onItemUploading(u, percent);
	};

	var on_item_success = function(u, message, rsp){
		this.onItemSuccess(u, message, rsp);
	};

	var on_item_error = function(u, message){
		this.onItemError(u, message);
	};

	var on_item_abort = function(u){
		this.onItemAbort(u);
	};

	var on_item_delete = function(u){
		this.onItemDelete(u);
	};

	var on_item_start = function(u){
		this.onItemStart(u);
	};

	var add_new = function(bu_scope, value, src, thumb){
		value = value || '';
		src = src || '';
		thumb = thumb || '';
		var $container = bu_scope.container;
		var name = $container.data('name');
		var param = $container.data('param');
		var $new = $('<li>'+delete_btn_html+'<input type="hidden" name="'+name+'" value="'+value+'" data-thumb="'+thumb+'" data-src="'+src+'" data-param="'+param+'"></li>')
			.insertBefore($container.find('.batch-uploader-add-new'));
		var $inp = $new.find('input');
		var u = new UP($inp, UP_CONFIG);
		bind_interface(u, bu_scope);
		return u;
	};

	var bind_interface = function(instance, bu_scope){
		$.each({
			'onUploading': function(){
				var args = Util.toArray(arguments);
				args.unshift(instance);
				return on_item_uploading.apply(bu_scope, args);
			},
			'onSuccess': function(){
				var args = Util.toArray(arguments);
				args.unshift(instance);
				return on_item_success.apply(bu_scope, args);
			},
			'onError': function(){
				var args = Util.toArray(arguments);
				args.unshift(instance);
				return on_item_error.apply(bu_scope, args);
			},
			'onAbort': function(){
				var args = Util.toArray(arguments);
				args.unshift(instance);
				return on_item_abort.apply(bu_scope, args);
			},
			'onStart': function(){
				var args = Util.toArray(arguments);
				args.unshift(instance);
				return on_item_start.apply(bu_scope, args);
			},
			'onDelete': function(){
				var args = Util.toArray(arguments);
				args.unshift(instance);
				return on_item_delete.apply(bu_scope, args);
			}
		}, function(k, v){
			instance[k] = v;
		});
	};

	var stop_default = function(e){
		console.log('stop default', e.type);
		e.stopPropagation();
		e.preventDefault();
	};

	var traverse_file_tree = function(file_callback, item, path){
		path = path || "";
		if(item.isFile){
			item.file(function(file){
				file_callback(file, path);
			});
		}else if(item.isDirectory){
			// Get folder contents
			var dirReader = item.createReader();
			dirReader.readEntries(function(entries){
				for(var i = 0; i < entries.length; i++){
					traverse_file_tree(file_callback, entries[i], path + item.name + "/");
				}
			});
		}
	};

	var BU = function(sel){
		var _this = this;
		var $container = $(sel);
		var $list = $("<ul>").appendTo($container);

		//multiple file upload require file name specified
		if(!$container.data('name')){
			$container.data('name', 'random_file_names_'+(Math.random()+'').replace(/^D/, '')+'[]');
		}

		$container.find('input').each(function(){
			var $inp = $(this);
			var $li = $('<li>'+delete_btn_html+'</li>').appendTo($list);
			$inp.appendTo($li);
			bind_interface(new UP($inp, UP_CONFIG), _this);
		});

		$(new_tab_html).appendTo($list).find('input').change(function(){
			for(var i=0; i<this.files.length; i++){
				var u = add_new(_this);
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
			var items = originalEvent.dataTransfer.items || [];
			for(var i=0; i<items.length; i++){
				var item = items[i].webkitGetAsEntry();
				if(item){
					traverse_file_tree(function(file, path){
						var u = add_new(_this);
						var formData = new FormData();
						formData.append(path || $container.data('name'), file);
						u.send(formData);
					}, item);
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
		this.container = $container;
	};
	BU.prototype.addFormData = function(formData){
		var u = this.addItem();
		u.send(formData);
	};
	BU.prototype.addItem = function(value, src, thumb){
		return add_new(this, value, src, thumb);
	};
	BU.prototype.empty = function(){
		this.container.find('li:not([class=batch-uploader-add-new])').remove();
	};
	BU.nodeInit = function($node){new BU($node);};

	BU.prototype.onItemSuccess = function(u, message, rsp){};
	BU.prototype.onItemError = function(u, message){};
	BU.prototype.onItemAbort = function(u){};
	BU.prototype.onItemUploading = function(u,percent){};
	BU.prototype.onItemStart = function(u){};
	BU.prototype.onItemDelete = function(u){};
	BU.prototype.onAllFinish = function(){};

	return BU;
});