(function () {
    var URL = window.UEDITOR_HOME_URL || getUEBasePath();

    /**
     * 配置项主体。注意，此处所有涉及到路径的配置别遗漏URL变量。
     */
    window.UEDITOR_CONFIG = {

        //为编辑器实例添加一个路径，这个不能被注释
        UEDITOR_HOME_URL: URL

        // 服务器统一请求接口路径
        , serverUrl: window.UEDITOR_INT_URL || (URL + "php/controller.php")

        //工具栏上的所有的功能按钮和下拉框，可以在new编辑器的实例时选择自己需要的从新定义
        , toolbars: [[
            'fontfamily', 'fontsize', 'undo', 'redo', 'bold', 'italic', 'underline', 'strikethrough', 'removeformat', 'blockquote',
		    'forecolor', 'backcolor', 'formatmatch', 'insertorderedlist', 'insertunorderedlist', 'selectall',
			'fullscreen','|','wordimage',
            'inserttable', 'deletetable', 'insertparagraphbeforetable',
            'justifyleft', 'justifycenter', 'justifyright', 'justifyjustify', '|',
            'link', 'unlink', 'anchor', '|', 'imagenone', 'imageleft', 'imageright', 'imagecenter', '|',
            'simpleupload', 'source'
        ]]
    };

	function pregQuote(str){
		return (str + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
	}

	function getUEBasePath(docUrl, confUrl) {
		var hs = document.getElementsByTagName('script');
		var CURRENT_FILE_NAME = 'ueditor.config.normal.js';

		for(var i in hs){
			var src = hs[i].getAttribute('src');
			if(src && src.match(pregQuote(CURRENT_FILE_NAME))){
				return src.replace(new RegExp(pregQuote(CURRENT_FILE_NAME)+'.*', 'ig'), '');
			}
		}
		return getBasePath(docUrl || self.document.URL || self.location.href, confUrl || getConfigFilePath());
	}

    function getConfigFilePath() {
        var configPath = document.getElementsByTagName('script');
        return configPath[ configPath.length - 1 ].src;
    }

    function getBasePath(docUrl, confUrl) {
        var basePath = confUrl;
        if (/^(\/|\\\\)/.test(confUrl)) {
            basePath = /^.+?\w(\/|\\\\)/.exec(docUrl)[0] + confUrl.replace(/^(\/|\\\\)/, '');
        } else if (!/^[a-z]+:/i.test(confUrl)) {
            docUrl = docUrl.split("#")[0].split("?")[0].replace(/[^\\\/]+$/, '');
            basePath = docUrl + "" + confUrl;
        }
        return optimizationPath(basePath);
    }

    function optimizationPath(path) {
        var protocol = /^[a-z]+:\/\//.exec(path)[ 0 ],
            tmp = null,
            res = [];
        path = path.replace(protocol, "").split("?")[0].split("#")[0];
        path = path.replace(/\\/g, '/').split(/\//);
        path[ path.length - 1 ] = "";

        while (path.length) {
            if (( tmp = path.shift() ) === "..") {
                res.pop();
            } else if (tmp !== ".") {
                res.push(tmp);
            }
        }
        return protocol + res.join("/");
    }

    window.UE = {
        getUEBasePath: getUEBasePath
    };

	// requirejs support
	if(typeof define === 'function'){
		if(define.amd){
			define([], function(){
				'use strict';
				return Swiper;
			});
		} else {
			define('ueditor_normal_config', function(){
				return window.UEDITOR_CONFIG;
			});
		}
	}
})();