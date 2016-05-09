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

	seajs.use('ywj/resource/uploader.css');
	var $ = require('jquery');
	var Net = require('ywj/net');


	var PRIVATES = {};
	var _guid = 1;
	var console = window.console || function(){};
	var guid = function(){
		return '_su_file_'+_guid++;
	};

	var str_escape = function(str){
		return str ? str
			.replace('&', '&amp;')
			.replace('<', '&lt;')
			.replace('>', '&gt;')
			.replace(' ', '&nbsp;') : str;
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
		UP.onStart();
	};

	/**
	 * abort uploading
	 */
	var on_abort = function(UP){
		var PRI = PRIVATES[UP.id];
		PRI.xhr.abort();
		PRI.abort = true;
		update_dom_state(UP, COM_CLASS_UPLOAD_NORMAL);
		UP.onAbort();
	};

	var on_delete = function(UP){
		UP.onDelete()
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
	};

	/**
	 * on upload response
	 * @param UP
	 * @param rsp_str
	 */
	var on_response = function(UP, rsp_str){
		console.log('response:', rsp_str);
		var rsp = {};
		try {
			rsp = JSON.parse(rsp_str);
		} catch(ex){
			on_error(UP, ex.message);
		}
		if(rsp.code == '0'){
			on_success(UP, rsp.message, rsp.data);
		} else {
			on_error(UP, rsp.message || '系统繁忙，请稍候重试');
		}
		UP.onResponse(rsp_str);
	};

	/**
	 * 正在上传
	 * @param UP
	 * @param percent
	 */
	var on_uploading = function(UP, percent){
		PRIVATES[UP.id].container.attr('class', COM_CLASS_CONTAINER + ' '+COM_CLASS_UPLOADING);
		PRIVATES[UP.id].progress.val(percent);
		PRIVATES[UP.id].progress_text.html(percent+'%');
		UP.onUploading(percent);
	};

	/**
	 * 上传成功
	 * @param UP
	 * @param message
	 * @param data
	 */
	var on_success = function(UP, message, data){
		PRIVATES[UP.id].container.attr('class', COM_CLASS_CONTAINER + ' '+COM_CLASS_UPLOAD_SUCCESS);
		data.url = data.url || data.src;

		var link = '<a href="'+data.url+'" title="查看" target="_blank">';

		//img
		if((!UP.config.TYPE && /\.(jpg|gif|png|jpeg)$/i.test(data.url)) || UP.config.TYPE == 'image'){
			link += '<img src="'+data.url+'"/>'
		}
		link += '</a>';

		PRIVATES[UP.id].container.find('.'+COM_CLASS_CONTENT).html(link);
		PRIVATES[UP.id].input.val(data.value);
		UP.onSuccess(message, data);
	};

	/**
	 * 上传错误
	 * @param UP
	 * @param message
	 */
	var on_error = function(UP, message){
		PRIVATES[UP.id].container.attr('class', COM_CLASS_CONTAINER + ' '+COM_CLASS_UPLOAD_FAIL);
		var m = message || '上传失败，请稍候重试';
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
		var _this = this;
		this.id = guid();
		var PRI = {};
		PRIVATES[this.id] = PRI;

		this.config = $.extend({
			TYPE: '', //文件类型配置：file,image，缺省自动检测文件后缀
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

		var file_type = PRI.input.data('file-type');
		if (file_type) {
			_this.config.UPLOAD_URL += (_this.config.UPLOAD_URL.indexOf("&")>-1 ? '&':'?')+'file_type='+file_type;
		}

		//xhr
		PRI.xhr = Net.postFormData({
			url: _this.config.UPLOAD_URL,
			onLoad: function(){
				if(PRI.xhr.status === 200){
					on_response(_this, PRI.xhr.responseText);
				} else {
					on_error(_this, '网络繁忙，请稍候重试(3)');
				}
			},
			onProgress: function(percent){
				on_uploading(_this, percent);
			},
			onError: function(e){
				console.error(e);
			}
		});

		PRI.container.find('.com-uploader-delete').click(function(){
			update_dom_state(_this, COM_CLASS_UPLOAD_NORMAL);
			on_delete(_this);
		});

		PRI.container.find('.com-uploader-reload').click(function(){
			PRI.file.trigger('click');
		});

		PRI.container.find('.com-uploader-cancel').click(function(){
			update_dom_state(_this, COM_CLASS_UPLOAD_NORMAL);
			on_abort(_this);
		});

		PRI.file.on('change', function(){
			if(!this.files[0]){
				return;
			}
			var formData = new FormData();
			for(var i=0; i<this.files.length; i++){
				formData.append(PRI.input.attr('name'), this.files[i]);
			}
			PRI.file.val('');
			_this.send(formData);
		});

		//初始化
		if(PRI.input.val()){
			var url = PRI.input.data('url') || PRI.input.val();
			var val = PRI.input.val() || PRI.input.data('url');
			on_success(_this, null, {url:url, value:val, more:[]});
		} else {
			update_dom_state(_this, COM_CLASS_UPLOAD_NORMAL);
		}
	};

	Uploader.prototype.send = function(formData){
		var PRI = PRIVATES[this.id];
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

	Uploader.prototype.getVar = function(key){
		return PRIVATES[this.id][key];
	};

	Uploader.prototype.selectFile = function(){
		PRIVATES[this.id].file.trigger('click');
	};

	Uploader.prototype.onSuccess = function(message, data){};
	Uploader.prototype.onAbort = function(){};
	Uploader.prototype.onResponse = function(rsp_str){};
	Uploader.prototype.onUploading = function(percent){};
	Uploader.prototype.onDelete = function(message){};
	Uploader.prototype.onError = function(message){};
	Uploader.prototype.onStart = function(message){};

	return Uploader;
});