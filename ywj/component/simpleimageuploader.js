/**
 * 图片上传组件，仅支持html5浏览器
 * 数据返回格式：
 * {
	code: 0,    //返回码，0表示成功，其他为失败
	message: '成功',  //后台返回成功（错误）信息
	data: {
        src: 'http://www.baidu.com/a.gif',  //用于前端显示的图片路径
        value: 'a.gif'                      //用于表单提交的输入框值
    }
 *
 */
define('ywj/simpleimageuploader', function(require){
	if(!window.Worker){
		console.error('Simple image uploader no support');
		return function(){};
	}

	//私有变量集合
	var PRIVATES = {};

	var _guid = 1;
	var guid = function(){
		return '_su_'+_guid++;
	};

	/**
	 * percent check
	 * @param su
     * @param callback
	 * @param interval
	 */
	var percent_check = function(su, callback, interval){
		if(!su.config.PROGRESS_URL){
			console.warn('UPLOAD PROGRESS NO FOUND');
			return;
		}

		interval = interval || 100;
		var xhr = navigator.appName == "Microsoft Internet Explorer" ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		xhr.withCredentials = true;
		xhr.open('GET', su.config.PROGRESS_URL);
		xhr.onreadystatechange = function(){
			if(this.readyState == 4){
				var rsp = this.responseText;
				console.log('xx', rsp);
				if(rsp < 100){
					callback(rsp);
					setTimeout(function(){
						percent_check(su, callback, interval);
					}, interval);
				} else {
					callback(100);
				}
			}
		};
		xhr.send(null);
	};

	/**
	 * simple upload prototype
	 * @param input
	 * @param config
	 */
	var su = function(input, config){
		var _this = this;
		this.id = guid();
		var PRI = {};
		PRIVATES[this.id] = PRI;

		this.config = $.extend({
			CLS_CONTAINER: 'uploader',
			CLS_UPLOAD_NORMAL: 'uploader-normal',
			CLS_UPLOADING: 'uploading',
			CLS_UPLOAD_FAIL: 'upload-error',
			CLS_UPLOAD_SUCCESS: 'upload-success',
			CLS_UPLOAD_MESSAGE: 'uploader-message',
			CLS_UPLOAD_BUTTON: 'uploader-btn',
			CLS_UPLOAD_IMAGE_THUMB: 'image-thumb',
			CLS_IMAGE_DELETE: 'delete-link',

			UPLOAD_FILE_NAME: 'file',
			UPLOAD_URL: '',
			PROGRESS_URL: ''
		}, config);

		if(!this.config.UPLOAD_URL){
			throw "NO UPLOAD_URL PARAMETER FOUND";
		}

		input.hide();
		PRI.input = input;
		PRI.container = $('<div></div>');
		PRI.message = $('<span class="'+this.config.CLS_UPLOAD_MESSAGE+'"></span>');
		PRI.button = $('<label class="'+this.config.CLS_UPLOAD_BUTTON+'" for="'+this.id+'">上传图片</label>');
		PRI.image_container = $('<span class="'+this.config.CLS_UPLOAD_IMAGE_THUMB+'"><a href="" target="_blank"><img alt=""/></a><span class="'+this.config.CLS_IMAGE_DELETE+'">删除图片</span></span>');
		PRI.image = $('img', PRI.image_container);
		PRI.image_link = $('a', PRI.image_container);

		var delete_btn = $('span.'+this.config.CLS_IMAGE_DELETE, PRI.image_container);
		delete_btn.on('click', function(){
			input.val('');
			_this.updateDomState(_this.config.CLS_UPLOAD_NORMAL);
		});

		var file_input = $('<input type="file" id="'+this.id+'"/>');
		PRI.progress_bar = $('<progress min="0" max="100" value="0">0</progress>');

		PRI.container.insertAfter(input);
		file_input.appendTo(PRI.container);
		PRI.progress_bar.appendTo(PRI.container);
		PRI.button.appendTo(PRI.container);
		PRI.message.appendTo(PRI.container);
		PRI.image_container.appendTo(PRI.container);

		//初始化
		if(PRI.input.val()){
			var src = PRI.input.data('src') || PRI.input.val();
			var val = PRI.input.val() || PRI.input.data('src');
			this.onSuccess(null, {src:src, value:val});
		} else {
			this.updateDomState(this.config.CLS_UPLOAD_NORMAL);
		}

		file_input.on('change', function(){
			_this.updateDomState(_this.config.CLS_UPLOADING);

			var formData = new FormData();
			formData.append(_this.config.UPLOAD_FILE_NAME, file_input[0].files[0]);
			file_input.val('');
			var xhr = new XMLHttpRequest();
			xhr.withCredentials = true;
			xhr.open('POST', _this.config.UPLOAD_URL);
			xhr.onload = function(){
				console.log('onload', xhr);
				if(xhr.status === 200){
					_this.onResponse(xhr.responseText);
				} else {
					_this.onError('网络繁忙，请稍候重试(3)');
				}
			};
			xhr.upload.onprogress = function(event){
				if(event.lengthComputable){
					var percent = (event.loaded / event.total * 100 | 0);
					if(percent > 0 && percent < 100){
						console.log('percent:', percent);
						_this.onUploading(percent);
					}
				}
			};
			xhr.send(formData);
			percent_check(_this, function(p){
				if(p != 100){
					return _this.onUploading(p);
				}
			});
		});
	};

	/**
	 * update dom state
	 * @param to
	 * @param message
	 */
	su.prototype.updateDomState = function(to, message){
		to = to || this.config.CLS_UPLOAD_NORMAL;
		PRIVATES[this.id].container.attr('class', this.config.CLS_CONTAINER + ' '+to);

		switch(to){
			case this.config.CLS_UPLOADING:
				PRIVATES[this.id].message.html(message || '正在上传···');
				break;

			case this.config.CLS_UPLOAD_NORMAL:
				PRIVATES[this.id].button.html('上传图片');
				break;

			default:
				break;
		}
	};

	/**
	 * on upload response
	 * @param rsp_str
	 */
	su.prototype.onResponse = function(rsp_str){
		console.log('onResponse:', rsp_str);
		var rsp = {};
		try {
			rsp = JSON.parse(rsp_str);
		} catch(ex){
			this.onError(ex.message);
		}
		if(rsp.code == '0'){
			this.onSuccess(rsp.message, rsp.data);
		} else {
			this.onError(rsp.message || '系统繁忙，请稍候重试');
		}
	};

	/**
	 * 正在上传
	 * @param percent
	 */
	su.prototype.onUploading = function(percent){
		PRIVATES[this.id].container.attr('class', this.config.CLS_CONTAINER + ' '+this.config.CLS_UPLOADING);
		PRIVATES[this.id].message.html('正在上传···');
		PRIVATES[this.id].progress_bar.val(percent);
		PRIVATES[this.id].progress_bar.html(percent);
	};

	/**
	 * 上传成功
	 * @param message
	 * @param data
	 */
	su.prototype.onSuccess = function(message, data){
		PRIVATES[this.id].container.attr('class', this.config.CLS_CONTAINER + ' '+this.config.CLS_UPLOAD_SUCCESS);
		PRIVATES[this.id].button.html('重新上传');
		PRIVATES[this.id].image.attr('src', data.src);
		PRIVATES[this.id].image_link.attr('href', data.src);
		PRIVATES[this.id].input.val(data.value);
	};

	/**
	 * 上传错误
	 * @param message
	 */
	su.prototype.onError = function(message){
		PRIVATES[this.id].container.attr('class', this.config.CLS_CONTAINER + ' '+this.config.CLS_UPLOAD_FAIL);
		PRIVATES[this.id].message.html(message || '上传失败，请稍候重试');
	};

	return su;
});