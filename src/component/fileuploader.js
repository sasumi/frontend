/**
 * 文件上传组件，仅支持html5浏览器
 * 数据返回格式：
 * {
	code: 0,    //返回码，0表示成功，其他为失败
	message: '成功',  //后台返回成功（错误）信息
	data: {
        src: 'http://www.baidu.com/a.gif',  //用于前端显示的文件路径
        value: 'a.gif'                      //用于表单提交的输入框值
    }
 *
 */
define('ywj/fileuploader', function(require){
	seajs.use('ywj/resource/fileuploader.css');
	var $ = require('jquery');
	var Net = require('ywj/net');
	var lang = require('lang/$G_LANGUAGE');
	var Util = require('ywj/util');
	var PRIVATES = {};
	var _guid = 1;
	var console = window.console || function(){};

	if(!window.Worker){
		console.error('Simple file uploader no support');
		return function(){};
	}

	var guid = function(){
		return '_su_file_'+_guid++;
	};

	var TPL = '<div class="com-fileuploader com-fileuploader-normal">'+
					'<label class="com-fileuploader-file">'+
						'<input type="file">'+
						'<span>'+lang('上传文件')+'</span>'+
					'</label>'+
					'<span class="com-fileuploader-progress">'+
						'<progress min="0" max="100" value="0">0%</progress>'+
						'<span>0%</span>'+
					'</span>'+
					'<span class="com-fileuploader-content"></span>'+
					'<span class="com-fileuploader-handle">'+
						'<span class="com-fileuploader-upload com-fileuploader-btn">'+lang('开始上传')+'</span>'+
						'<span class="com-fileuploader-reload com-fileuploader-btn">'+lang('重新上传')+'</span>'+
						'<span class="com-fileuploader-cancel com-fileuploader-btn">'+lang('取消上传')+'</span>'+
						'<span class="com-fileuploader-download com-fileuploader-btn">'+lang('下载')+'</span>'+
						'<span class="com-fileuploader-delete com-fileuploader-btn">'+lang('删除')+'</span>'+
					'</span>'+
				'</div>';

	var COM_CLASS = 'com-fileuploader';
	var COM_CLASS_CONTAINER = COM_CLASS;
	var COM_CLASS_CONTENT = COM_CLASS+'-content';
	var COM_CLASS_UPLOAD_NORMAL = COM_CLASS+'-normal';
	var COM_CLASS_UPLOADING = COM_CLASS+'-uploading';
	var COM_CLASS_UPLOAD_FAIL = COM_CLASS+'-error';
	var COM_CLASS_UPLOAD_SUCCESS = COM_CLASS+'-success';

	/**
	 * percent check
	 * @param UP
     * @param callback
	 * @param interval
	 */
	var percent_check = function(UP, callback, interval){
		if(!UP.config.PROGRESS_URL){
			console.warn('UPLOAD PROGRESS NO FOUND');
			return;
		}

		var PRI = PRIVATES[UP.id];
		if(PRI.abort){
			return;
		}

		interval = interval || 100;
		var xhr = navigator.appName == "Microsoft Internet Explorer" ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		xhr.withCredentials = true;
		xhr.open('GET', UP.config.PROGRESS_URL);
		xhr.onreadystatechange = function(){
			if(PRI.abort){
				return;
			}
			if(this.readyState == 4){
				var rsp = this.responseText;
				if(rsp < 100){
					callback(rsp);
					setTimeout(function(){
						percent_check(UP, callback, interval);
					}, interval);
				} else {
					callback(100);
				}
			}
		};
		xhr.send(null);
	};

	var on_start = function(UP){
		call_param_fn(UP, 'on_start');
		UP.onStart();
	};

	/**
	 * abort uploading
	 */
	var on_abort = function(UP){
		call_param_fn(UP, UP.config.on_abort);
		var PRI = PRIVATES[UP.id];
		PRI.xhr.abort();
		PRI.abort = true;
		update_dom_state(UP, COM_CLASS_UPLOAD_NORMAL);
		UP.onAbort();
	};

	var on_delete = function(UP){
		call_param_fn(UP, UP.config.ondelete);
		UP.onDelete()
	};

	var call_param_fn = function(UP, fn_str){
		if(!fn_str || !window[fn_str]){
			return false;
		}
		var fn = window[fn_str];
		var PRI = PRIVATES[UP.id];
		fn(UP, PRI.container);
	};

	/**
	 * update dom state
	 * @param UP
	 * @param to
	 */
	var update_dom_state = function(UP, to){
		to = to || COM_CLASS_UPLOAD_NORMAL;
		var PRI = PRIVATES[UP.id];
		PRI.container.attr('class', COM_CLASS_CONTAINER + ' '+to);
		PRI.progress.val(0);
		PRI.progress_text.html('0%');

		//required
		PRI.trigger_file.attr('required', false);
		PRI.file.attr('required', false);
		switch(to){
			case COM_CLASS_UPLOAD_NORMAL:
				PRI.file.attr('required', UP.required);
				PRI.input.val('');
				PRI.container.find('.com-fileuploader-file-name').val('');
				break;

			case COM_CLASS_UPLOAD_FAIL:
			case COM_CLASS_UPLOADING:
				PRI.trigger_file.attr('required', UP.required);
				break;
		}
	};

	/**
	 * on upload response
	 * @param UP
	 * @param rsp_str
	 */
	var on_response = function(UP, rsp_str){
		call_param_fn(UP, 'on_response');
		UP.onResponse(rsp_str);
		var rsp = {};
		try {
			rsp = JSON.parse(rsp_str);
		} catch(ex){
			on_error(UP, ex.message);
		}
		if(rsp.code == '0'){
			on_success(UP, rsp.message, rsp.data);
		} else {
			on_error(UP, rsp.message || lang('后台有点忙，请稍后重试'));
		}
		console.debug('response string:', rsp_str,'response json:', rsp);
	};

	/**
	 * 正在上传
	 * @param UP
	 * @param percent
	 */
	var on_uploading = function(UP, percent){
		call_param_fn(UP, 'on_uploading');
		update_dom_state(UP, COM_CLASS_UPLOADING);
		PRIVATES[UP.id].progress.val(percent);
		PRIVATES[UP.id].progress_text.html(percent+'%');
		UP.onUploading(percent);
	};

	var get_ext = function(url){
		return url.split('.').pop().toLowerCase();
	};

	var get_name = function(url){
		if(!url){
			return '';
		}
		var tmp = /[\/|\\]([^\/\\]+)\.[^\/\\]+$/.exec(url);
		return tmp ? tmp[1] : '';
	};

	/**
	 * 上传成功
	 * @param UP
	 * @param message
	 * @param data
	 */
	var on_success = function(UP, message, data){
		update_dom_state(UP, COM_CLASS_UPLOAD_SUCCESS);
		var PRI = PRIVATES[UP.id];
		var ext = get_ext(data.value);
		var file_name = Util.htmlEscape(data.name || get_name(PRI.file.data('org-file')) || get_name(data.src));
		var name_field = UP.config.name || '';
		var file_size = data.file_size || '';

		var html = '<span class="com-fileuploader-file-icon com-fileuploader-file-icon-'+ext+'"></span>';
		html += '<input class="com-fileuploader-file-name" type="text" name="'+name_field+'"' +(!name_field ? 'readonly="readonly"':'')+' value="'+file_name+'" placeholder="文件名"/>';
		html += '<span class="com-fileuploader-file-ext">.'+ext+'</span>';
		if(file_size) html += '<span class="com-fileuploader-file-size"> '+file_size+'</span>';

		PRI.container.find('.'+COM_CLASS_CONTENT).html(html);
		PRI.input.val(data.value);
		PRI.input.data('src', data.src);
		UP.onSuccess(message, data);
	};

	/**
	 * 上传错误
	 * @param UP
	 * @param message
	 */
	var on_error = function(UP, message){
		call_param_fn(UP, 'on_error');
		update_dom_state(UP, COM_CLASS_UPLOAD_FAIL);
		var m = message || lang('上传失败，请稍候重试');
		PRIVATES[UP.id].container.find('.'+COM_CLASS_CONTENT).html('<span title="'+m+'">'+m+'</span>');
		UP.onError(message);
	};

	/**
	 * Uploader
	 * @param input
	 * @param config
	 */
	var Uploader = function(input, config){
		input = $(input);
		if(input.attr('disabled') || input.attr('readonly')){
			console.info('input readonly', input[0]);
			return;
		}

		var _this = this;
		var required = input.attr('required');
		input.attr('required', '');

		this.id = guid();
		var PRI = {};
		PRIVATES[this.id] = PRI;

		this.config = $.extend({
			UPLOAD_URL: '',
			PROGRESS_URL: ''
		}, config);

		if(!this.config.UPLOAD_URL){
			throw "NO UPLOAD_URL PARAMETER FOUND";
		}
		this.config.UPLOAD_URL = Net.mergeCgiUri(_this.config.UPLOAD_URL);

		input.hide();
		PRI.input = input;
		PRI.required = required;
		PRI.container = $(TPL).insertAfter(input);
		PRI.progress = PRI.container.find('progress');
		PRI.progress_text = PRI.progress.next();
		PRI.content = PRI.container.find('.'+COM_CLASS_CONTENT);
		PRI.file = PRI.container.find('input[type=file]');
		PRI.container.find('.com-fileuploader-file span').html(lang('选择文件'));
		PRI.trigger_file = $('<input type="file"/>').appendTo(PRI.container.find('.com-fileuploader-handle'));

		PRI.xhr = Net.postFormData({
			url: _this.config.UPLOAD_URL,
			onLoad: function(){
				if(PRI.xhr.status === 200){
					on_response(_this, PRI.xhr.responseText);
				} else {
					on_error(_this, lang('后台有点忙，请稍后重试'));
				}
			},
			onProgress: function(percent){
				on_uploading(_this, percent);
			},
			onError: function(e){
				console.error(e);
			}
		});

		PRI.container.delegate('.com-fileuploader-delete', 'click', function(){
			update_dom_state(_this, COM_CLASS_UPLOAD_NORMAL);
			on_delete(_this);
		});

		PRI.container.delegate('.com-fileuploader-file-name', 'focus', function(){
			this.select(this);
		});

		PRI.container.delegate('.com-fileuploader-download', 'click', function(){
			var url = PRI.input.data('src') || PRI.input.val();
			var name = PRI.container.find('.com-fileuploader-file-name').val();
			name = name || get_name(PRI.input.val());
			console.debug('download:', name, url);
			Net.download(url, name);
		});

		PRI.container.find('.com-fileuploader-reload').click(function(){
			PRI.file.trigger('click');
		});

		PRI.container.find('.com-fileuploader-cancel').click(function(){
			update_dom_state(_this, COM_CLASS_UPLOAD_NORMAL);
			on_abort(_this);
		});

		PRI.file.on('change', function(){
			if(!this.files[0]){
				return;
			}
			//add file
			var formData = new FormData();
			var i;
			if(this.files){
				for(i=0; i<this.files.length; i++){
					formData.append($(this).attr('name'), this.files[i]);
				}
			}
			$(this).data('org-file', this.value);
			$(this).val('');
			_this.send(formData);
		});

		//初始化
		if(PRI.input.val()){
			var src = PRI.input.data('src') || PRI.input.val();
			var val = PRI.input.val();
			on_success(_this, null, {
				src: src,
				value: val,
				name: config.namevalue,
				file_size: config.filesize,
				more: []
			});
		} else {
			update_dom_state(_this, COM_CLASS_UPLOAD_NORMAL);
		}
	};

	Uploader.prototype.send = function(formData){
		var PRI = PRIVATES[this.id];

		//add param
		var param = PRI.input.data('param');
		if(param){
			var data = Net.parseParam(param);
			for(var i in data){
				formData.append(i, data[i]);
			}
		}

		PRI.xhr.open('POST', this.config.UPLOAD_URL, true);
		PRI.xhr.send(formData);
		PRI.abort = false;
		var _this = this;

		on_start(_this);
		update_dom_state(_this, COM_CLASS_UPLOADING);
		percent_check(_this, function(p){
			if(p != 100){
				return on_uploading(_this, p);
			}
		});
	};

	Uploader.prototype.getVar = function(key){return PRIVATES[this.id][key];};
	Uploader.prototype.selectFile = function(){PRIVATES[this.id].file.trigger('click');};
	Uploader.prototype.onSuccess = function(message, data){};
	Uploader.prototype.onAbort = function(){};
	Uploader.prototype.onResponse = function(rsp_str){};
	Uploader.prototype.onUploading = function(percent){};
	Uploader.prototype.onDelete = function(message){};
	Uploader.prototype.onError = function(message){};
	Uploader.prototype.onStart = function(message){};

	Uploader.nodeInit = function($node, param){
		new Uploader($node, $.extend({
			UPLOAD_URL: Net.mergeCgiUri(window['UPLOAD_URL'], {type:'file'}),
			PROGRESS_URL: window['UPLOAD_PROGRESS_URL']
		}, param || {}));
	};
	return Uploader;
});