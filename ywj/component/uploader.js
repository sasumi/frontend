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
define('ywj/uploader', function(require){
	if(!window.Worker){
		console.error('Simple file uploader no support');
		return function(){};
	}

	seajs.use('ywjui/backend/uploader.css');
	var PRIVATES = {};
	var $ = require('jquery');
	var _guid = 1;
	var console = window.console || function(){};
	var guid = function(){
		return '_su_file_'+_guid++;
	};

	var str_escape = function(str){
		return str
			.replace('&', '&amp;')
			.replace('<', '&lt;')
			.replace('>', '&gt;')
			.replace(' ', '&nbsp;');
	};

	var TPL = '<div class="com-uploader com-uploader-normal">'+
					'<label class="com-uploader-file">'+
						'<input type="file">'+
						'<span>上传文件</span>'+
					'</label>'+
					'<div class="com-uploader-progress">'+
						'<progress min="0" max="100" value="0">0%</progress>'+
						'<span>0%</span>'+
					'</div>'+
					'<div class="com-uploader-content"></div>'+
					'<div class="com-uploader-handle">'+
						'<input type="button" class="com-uploader-upload com-uploader-btn" value="开始上传"/>'+
						'<input type="button" class="com-uploader-reload com-uploader-btn" value="重新上传"/>'+
						'<input type="button" class="com-uploader-cancel com-uploader-btn" value="取消上传"/>'+
						'<input type="button" class="com-uploader-delete com-uploader-btn" value="删除"/>'+
					'</div>'+
				'</div>';

	var COM_CLASS = 'com-uploader';
	var COM_CLASS_CONTAINER = COM_CLASS;
	var COM_CLASS_CONTENT = COM_CLASS+'-content';
	var COM_CLASS_UPLOAD_NORMAL = COM_CLASS+'-normal';
	var COM_CLASS_UPLOADING = COM_CLASS+'-uploading';
	var COM_CLASS_UPLOAD_FAIL = COM_CLASS+'-error';
	var COM_CLASS_UPLOAD_SUCCESS = COM_CLASS+'-success';

	/**
	 * percent check
	 * @param uploader
     * @param callback
	 * @param interval
	 */
	var percent_check = function(uploader, callback, interval){
		if(!uploader.config.PROGRESS_URL){
			console.warn('UPLOAD PROGRESS NO FOUND');
			return;
		}

		var PRI = PRIVATES[uploader.id];
		if(PRI.abort){
			return;
		}

		interval = interval || 100;
		var xhr = navigator.appName == "Microsoft Internet Explorer" ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		xhr.withCredentials = true;
		xhr.open('GET', uploader.config.PROGRESS_URL);
		xhr.onreadystatechange = function(){
			if(PRI.abort){
				return;
			}
			if(this.readyState == 4){
				var rsp = this.responseText;
				console.log('upload progress', rsp);
				if(rsp < 100){
					callback(rsp);
					setTimeout(function(){
						percent_check(uploader, callback, interval);
					}, interval);
				} else {
					callback(100);
				}
			}
		};
		xhr.send(null);
	};

	/**
	 * uploader
	 * @param input
	 * @param config
	 */
	var up = function(input, config){
		var _this = this;
		this.id = guid();
		var PRI = {};
		PRIVATES[this.id] = PRI;

		this.config = $.extend({
			TYPE: '', //文件类型配置：file,image，缺省自动检测文件后缀
			UPLOAD_FILE_NAME: 'file',
			UPLOAD_URL: '',
			PROGRESS_URL: ''
		}, config);

		if(!this.config.UPLOAD_URL){
			throw "NO UPLOAD_URL PARAMETER FOUND";
		}

		input.hide();
		PRI.input = input;
		PRI.container = $(TPL).insertAfter(input);
		PRI.progress = PRI.container.find('progress');
		PRI.progress_text = PRI.progress.next();
		PRI.content = PRI.container.find('.'+COM_CLASS_CONTENT);
		PRI.file = PRI.container.find('input[type=file]');

		var upload_url = _this.config.UPLOAD_URL;
		var file_type = PRI.input.data('file-type');
		if (file_type) {
			upload_url += (upload_url.indexOf("&")>-1 ? '&':'?')+'file_type='+file_type;
		}

		//xhr
		PRI.xhr = new XMLHttpRequest();
		PRI.xhr.withCredentials = true;
		PRI.xhr.open('POST', upload_url);
		PRI.xhr.onload = function(){
			console.log('onload', PRI.xhr);
			if(PRI.xhr.status === 200){
				_this.onResponse(PRI.xhr.responseText);
			} else {
				_this.onError('网络繁忙，请稍候重试(3)');
			}
		};
		PRI.xhr.upload.onprogress = function(event){
			//noinspection JSUnresolvedVariable
			if(event.lengthComputable){
				//noinspection JSUnresolvedVariable
				var percent = (event.loaded / event.total * 100 | 0);
				if(percent > 0 && percent < 100){
					console.log('percent:', percent);
					_this.onUploading(percent);
				}
			}
		};

		//初始化
		if(PRI.input.val()){
			var url = PRI.input.data('url') || PRI.input.val();
			var val = PRI.input.val() || PRI.input.data('url');
			this.onSuccess(null, {url:url, value:val, name:val});
		} else {
			this.updateDomState(COM_CLASS_UPLOAD_NORMAL);
		}

		PRI.container.find('.com-uploader-delete').click(function(){
			_this.updateDomState(COM_CLASS_UPLOAD_NORMAL);
		});

		PRI.container.find('.com-uploader-reload').click(function(){
			PRI.file.trigger('click');
		});

		PRI.container.find('.com-uploader-cancel').click(function(){
			_this.updateDomState(COM_CLASS_UPLOAD_NORMAL);
			_this.abort();
		});

		PRI.file.on('change', function(){
			if(!this.files[0]){
				return;
			}
			_this.updateDomState(COM_CLASS_UPLOADING);
			var formData = new FormData();
			formData.append(_this.config.UPLOAD_FILE_NAME, this.files[0]);
			PRI.xhr.open('POST', upload_url);
			PRI.xhr.send(formData);
			PRI.abort = false;
			percent_check(_this, function(p){
				if(p != 100){
					return _this.onUploading(p);
				}
			});
		});
	};

	/**
	 * abort uploading
	 */
	up.prototype.abort = function(){
		var PRI = PRIVATES[this.id];
		PRI.xhr.abort();
		PRI.abort = true;
		this.updateDomState(COM_CLASS_UPLOAD_NORMAL);
	};

	/**
	 * update dom state
	 * @param to
	 */
	up.prototype.updateDomState = function(to){
		to = to || COM_CLASS_UPLOAD_NORMAL;
		var PRI = PRIVATES[this.id];
		PRI.container.attr('class', COM_CLASS_CONTAINER + ' '+to);
		PRI.progress.val(0);
		PRI.progress_text.html('0%');
	};

	/**
	 * on upload response
	 * @param rsp_str
	 */
	up.prototype.onResponse = function(rsp_str){
		console.log('response:', rsp_str);
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
	up.prototype.onUploading = function(percent){
		PRIVATES[this.id].container.attr('class', COM_CLASS_CONTAINER + ' '+COM_CLASS_UPLOADING);
		PRIVATES[this.id].progress.val(percent);
		PRIVATES[this.id].progress_text.html(percent+'%');
	};

	/**
	 * 上传成功
	 * @param message
	 * @param data
	 */
	up.prototype.onSuccess = function(message, data){
		PRIVATES[this.id].container.attr('class', COM_CLASS_CONTAINER + ' '+COM_CLASS_UPLOAD_SUCCESS);

		var link = '<a href="'+data.url+'" title="查看" target="_blank">';

		//img
		if((!this.config.TYPE && /\.(jpg|gif|png|jpeg)$/i.test(data.url)) || this.config.TYPE == 'image'){
			link += '<img src="'+data.url+'" alt="'+str_escape(data.name)+'"/>'
		} else {
			link += str_escape(data.name);
		}

		link += '</a>';
		PRIVATES[this.id].container.find('.'+COM_CLASS_CONTENT).html(link);
		PRIVATES[this.id].input.val(data.value);
	};

	/**
	 * 上传错误
	 * @param message
	 */
	up.prototype.onError = function(message){
		PRIVATES[this.id].container.attr('class', COM_CLASS_CONTAINER + ' '+COM_CLASS_UPLOAD_FAIL);
		PRIVATES[this.id].container.find('.'+COM_CLASS_CONTENT).html(message || '上传失败，请稍候重试');
	};

	return up;
});